

import { LevelData, ParsedLevel, Wall, Enemy, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, EnemyType } from '../types';
import { createEnemy } from './enemySystem';

/**
 * Parses a visual ASCII map layout into game entities.
 * 
 * MAP LEGEND:
 * '#' = Standard Wall
 * 'T' = Trap (Lethal Wall/Spike) - Kills even with Stabilizer
 * 'G' = Auto-Link Gate (Cluster 0->1, 2->3...)
 * '0'-'9' = Manual Channel Gate (Link all '0's together, all '1's together...)
 * '.' = Empty Space
 * 'S' = Static Enemy
 * 'P' = Patrol Enemy
 * 'W' = Wanderer Enemy
 * 'C' = Chaser Enemy
 */
export const parseLevel = (levelData: LevelData): ParsedLevel => {
    let walls: Wall[] = [];
    const enemies: Enemy[] = [];
    const gateCells: {x: number, y: number, channel: number}[] = [];
    const occupiedCells = new Set<string>();
    
    // Default matrix if none provided (empty board)
    const layout = levelData.layout.length > 0 
        ? levelData.layout 
        : Array(BOARD_HEIGHT_CELLS).fill('.'.repeat(BOARD_WIDTH_CELLS));

    layout.forEach((row, y) => {
        const cells = row.split('');
        
        // We track current wall segments to merge them horizontally for performance
        let currentWallStart: number | null = null;
        let currentTrapStart: number | null = null;

        cells.forEach((cell, x) => {
            const isGateChar = cell === 'G' || (cell >= '0' && cell <= '9');
            const isStructure = cell === '#' || cell === 'T' || isGateChar;

            if (isStructure) {
                occupiedCells.add(`${x},${y}`);
            }

            // STANDARD WALL PARSING
            if (cell === '#') {
                if (currentTrapStart !== null) {
                     // Close pending trap
                     walls.push({ x: currentTrapStart, y, width: x - currentTrapStart, height: 1, type: 'trap' });
                     currentTrapStart = null;
                }
                if (currentWallStart === null) currentWallStart = x;
            } 
            // TRAP PARSING
            else if (cell === 'T') {
                if (currentWallStart !== null) {
                    // Close pending wall
                    walls.push({ x: currentWallStart, y, width: x - currentWallStart, height: 1, type: 'wall' });
                    currentWallStart = null;
                }
                if (currentTrapStart === null) currentTrapStart = x;
            } 
            // GATE PARSING (Does not merge here, collect coordinates first)
            else if (isGateChar) {
                // Close any open segments
                if (currentWallStart !== null) {
                    walls.push({ x: currentWallStart, y, width: x - currentWallStart, height: 1, type: 'wall' });
                    currentWallStart = null;
                }
                if (currentTrapStart !== null) {
                    walls.push({ x: currentTrapStart, y, width: x - currentTrapStart, height: 1, type: 'trap' });
                    currentTrapStart = null;
                }
                
                const channel = cell === 'G' ? -1 : parseInt(cell);
                gateCells.push({ x, y, channel });
            }
            // EMPTY/ENEMY
            else {
                // Close any open segments
                if (currentWallStart !== null) {
                    walls.push({ x: currentWallStart, y: y, width: x - currentWallStart, height: 1, type: 'wall' });
                    currentWallStart = null;
                }
                if (currentTrapStart !== null) {
                    walls.push({ x: currentTrapStart, y: y, width: x - currentTrapStart, height: 1, type: 'trap' });
                    currentTrapStart = null;
                }

                // ENEMY PARSING
                let enemyType: EnemyType | null = null;
                if (cell === 'S') enemyType = 'static';
                if (cell === 'P') enemyType = 'patrol';
                if (cell === 'W') enemyType = 'wanderer';
                if (cell === 'C') enemyType = 'chaser';

                if (enemyType) {
                    enemies.push(createEnemy(enemyType, x, y, 'map-enemy'));
                }
            }
        });

        // Close segments at end of row
        if (currentWallStart !== null) {
            walls.push({ x: currentWallStart, y: y, width: cells.length - currentWallStart, height: 1, type: 'wall' });
        }
        if (currentTrapStart !== null) {
            walls.push({ x: currentTrapStart, y: y, width: cells.length - currentTrapStart, height: 1, type: 'trap' });
        }
    });

    // POST-PROCESS GATES: Cluster and Link
    // Group adjacent G cells into clusters
    const visited = new Set<string>();
    let clusterCounter = 0;
    
    // Sort gates by channel to process nicely, though logic is robust regardless
    gateCells.forEach(cell => {
        const key = `${cell.x},${cell.y}`;
        if (visited.has(key)) return;

        // BFS to find all connected Gs OF THE SAME CHANNEL
        const queue = [cell];
        visited.add(key);
        const currentClusterId = clusterCounter++;

        // Store cluster info directly into walls
        // We'll create walls immediately for this cluster
        const clusterWalls: Wall[] = [];

        while (queue.length > 0) {
            const curr = queue.pop()!;
            
            // Add wall
            clusterWalls.push({
                x: curr.x,
                y: curr.y,
                width: 1,
                height: 1,
                type: 'gate',
                gateClusterId: currentClusterId,
                gateChannel: curr.channel,
                // targetClusterId is calculated later
            });

            // Check 4 neighbors
            const neighbors = gateCells.filter(n => 
                !visited.has(`${n.x},${n.y}`) && 
                n.channel === curr.channel && // MUST match channel to merge
                (Math.abs(n.x - curr.x) + Math.abs(n.y - curr.y) === 1)
            );

            neighbors.forEach(n => {
                visited.add(`${n.x},${n.y}`);
                queue.push(n);
            });
        }
        
        walls.push(...clusterWalls);
    });

    // AUTO-LINKING LOGIC
    // 1. Auto Channels (-1 / 'G'): Pair sequentially (0->1, 2->3)
    const autoGateWalls = walls.filter(w => w.type === 'gate' && w.gateChannel === -1);
    // Get unique cluster IDs for auto gates
    const autoClusters = Array.from(new Set(autoGateWalls.map(w => w.gateClusterId!))).sort((a,b) => a-b);
    
    // Map cluster ID to target
    const autoTargetMap = new Map<number, number>();
    for(let i=0; i<autoClusters.length; i++) {
        // Simple pair logic: Even -> Next Odd, Odd -> Prev Even
        // If last one is even (unpaired), wrap to 0? Or loop?
        // Let's loop the last one to the first one just in case of odd count.
        let targetId;
        if (i % 2 === 0) {
             // Even index
             targetId = (i + 1 < autoClusters.length) ? autoClusters[i+1] : autoClusters[0];
        } else {
             // Odd index
             targetId = autoClusters[i-1];
        }
        autoTargetMap.set(autoClusters[i], targetId);
    }

    // Apply targets
    walls.forEach(w => {
        if (w.type === 'gate' && w.gateChannel === -1) {
            w.targetClusterId = autoTargetMap.get(w.gateClusterId!);
        }
    });

    // BOUNDARY WALL ENFORCEMENT
    // Add walls to any boundary cell that isn't already occupied by a structure (wall/trap/gate)
    const boundaryWalls: Wall[] = [];
    const addBoundary = (x: number, y: number) => {
        if (!occupiedCells.has(`${x},${y}`)) {
            boundaryWalls.push({ x, y, width: 1, height: 1, type: 'wall' });
        }
    };

    for(let x = 0; x < BOARD_WIDTH_CELLS; x++) {
        addBoundary(x, 0); // Top
        addBoundary(x, BOARD_HEIGHT_CELLS - 1); // Bottom
    }
    for(let y = 1; y < BOARD_HEIGHT_CELLS - 1; y++) {
        addBoundary(0, y); // Left
        addBoundary(BOARD_WIDTH_CELLS - 1, y); // Right
    }

    // Add boundaries to the main list before optimization
    walls.push(...boundaryWalls);

    // OPTIMIZATION: Merge Vertical (Only for walls and traps, gates must stay distinct 1x1 for now)
    const standardWalls = walls.filter(w => w.type === 'wall');
    const trapWalls = walls.filter(w => w.type === 'trap');
    const gateWalls = walls.filter(w => w.type === 'gate');
    
    const mergeVertically = (inputWalls: Wall[]): Wall[] => {
        if (inputWalls.length === 0) return [];
        
        // Sort by X, then Y to find vertical neighbors
        inputWalls.sort((a, b) => {
            if (a.x !== b.x) return a.x - b.x;
            return a.y - b.y;
        });
        
        const merged: Wall[] = [];
        let current = inputWalls[0];
        
        for (let i = 1; i < inputWalls.length; i++) {
            const next = inputWalls[i];
            
            // Check if 'next' is directly below 'current' with same width
            if (
                next.x === current.x &&
                next.width === current.width &&
                next.y === current.y + current.height
            ) {
                // Merge: Extend current height
                current.height += next.height;
            } else {
                // No merge: Push current and start new
                merged.push(current);
                current = next;
            }
        }
        merged.push(current);
        return merged;
    };

    const optimizedWalls = [
        ...mergeVertically(standardWalls),
        ...mergeVertically(trapWalls),
        ...gateWalls // Keep gates unmerged 1x1
    ];

    return {
        walls: optimizedWalls,
        enemies,
        config: levelData
    };
};