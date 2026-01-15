
import { Enemy, Segment, Wall, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, EnemyType } from '../types';
import { ENEMY_REGISTRY } from '../data/enemies';
import { getDistance, checkCollisionWithWalls } from './geometry';

/**
 * Factory to create a specific enemy instance.
 */
export const createEnemy = (type: EnemyType, x: number, y: number, idPrefix = 'enemy'): Enemy => {
    const config = ENEMY_REGISTRY[type];
    
    let dir = { x: 0, y: 0 };
    if (config.behavior === 'patrol') dir = { x: 1, y: 0 };
    if (config.behavior === 'random') {
        const dirs = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
        dir = dirs[Math.floor(Math.random() * dirs.length)];
    }

    return {
        id: `${idPrefix}-${Math.random().toString(36).substr(2, 9)}`,
        x,
        y,
        type,
        color: config.color,
        moveSpeed: config.baseSpeed,
        currentTick: 0,
        dir,
        trail: [] // Initialize empty trail
    };
};

/**
 * Spawns a random enemy at a valid location (not on snake, not in wall).
 */
export const spawnRandomEnemy = (snake: Segment[], walls: Wall[], allowedTypes: EnemyType[]): Enemy => {
    let valid = false;
    const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    let e: Enemy = createEnemy(type, 0, 0);

    let attempts = 0;
    while (!valid && attempts < 50) {
        attempts++;
        e.x = Math.floor(Math.random() * BOARD_WIDTH_CELLS);
        e.y = Math.floor(Math.random() * BOARD_HEIGHT_CELLS);
        
        const dist = getDistance(snake[0], e);
        const inWall = checkCollisionWithWalls(e.x, e.y, walls);
        
        // Ensure distance from head and not inside walls
        if (dist > 10 && !inWall) valid = true;
    }
    return e;
};

/**
 * Process AI movement for all enemies.
 */
export const moveEnemies = (
    enemies: Enemy[], 
    snakeHead: Segment, 
    walls: Wall[], 
    isStasis: boolean
): Enemy[] => {
    
    return enemies.map(e => {
        // 1. Check for Static or Stasis
        if (e.moveSpeed === 0) return e;
        if (isStasis) return { ...e, frozen: true };

        // 2. Tick Accumulator
        let newTick = e.currentTick + 1;
        if (newTick < e.moveSpeed) return { ...e, currentTick: newTick, frozen: false };

        // 3. Determine Next Move based on Behavior
        let nextX = e.x;
        let nextY = e.y;
        let nextDir = { ...e.dir };
        const config = ENEMY_REGISTRY[e.type];

        if (config.behavior === 'chase') {
            const dx = snakeHead.x - e.x;
            const dy = snakeHead.y - e.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                nextX += Math.sign(dx);
                nextDir = { x: Math.sign(dx), y: 0 };
            }
            else if (dy !== 0) {
                nextY += Math.sign(dy);
                nextDir = { x: 0, y: Math.sign(dy) };
            }
        } 
        else if (config.behavior === 'random') {
            // Randomly change direction occasionally
            if (Math.random() > 0.8) {
                const dirs = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0,y:-1}];
                nextDir = dirs[Math.floor(Math.random() * dirs.length)];
            }
            nextX += nextDir.x;
            nextY += nextDir.y;
        }
        else {
            // Patrol (Keep current direction until blocked)
            nextX += nextDir.x;
            nextY += nextDir.y;
        }

        // 4. Collision Check (Walls or Board Edges)
        const hitWall = walls.find(w => nextX >= w.x && nextX < w.x + w.width && nextY >= w.y && nextY < w.y + w.height);
        const hitEdge = nextX < 0 || nextX >= BOARD_WIDTH_CELLS || nextY < 0 || nextY >= BOARD_HEIGHT_CELLS;

        if (hitWall || hitEdge) {
            let hasWarped = false;

            // GATE WARP LOGIC
            if (hitWall && hitWall.type === 'gate') {
                 let targetWalls: Wall[] = [];

                 // 1. Manual Channel Linking
                 if (hitWall.gateChannel !== undefined && hitWall.gateChannel !== -1) {
                     const candidateClusterIds = Array.from(new Set(
                         walls
                            .filter(w => w.type === 'gate' && w.gateChannel === hitWall.gateChannel && w.gateClusterId !== hitWall.gateClusterId)
                            .map(w => w.gateClusterId!)
                     ));
                     if (candidateClusterIds.length > 0) {
                         const targetClusterId = candidateClusterIds[Math.floor(Math.random() * candidateClusterIds.length)];
                         targetWalls = walls.filter(w => w.type === 'gate' && w.gateClusterId === targetClusterId);
                     }
                 } 
                 // 2. Auto Linking
                 else if (hitWall.targetClusterId !== undefined) {
                     targetWalls = walls.filter(w => w.type === 'gate' && w.gateClusterId === hitWall.targetClusterId);
                 }

                 if (targetWalls.length > 0) {
                     // Find valid exit spots around target gate(s)
                     let candidates: {x: number, y: number, dir: {x: number, y: number}}[] = [];

                     targetWalls.forEach(g => {
                        const potential = [
                            {x: g.x+1, y: g.y, dir: {x: 1, y: 0}},
                            {x: g.x-1, y: g.y, dir: {x: -1, y: 0}},
                            {x: g.x, y: g.y+1, dir: {x: 0, y: 1}},
                            {x: g.x, y: g.y-1, dir: {x: 0, y: -1}}
                        ];

                        potential.forEach(p => {
                            if (p.x < 0 || p.x >= BOARD_WIDTH_CELLS || p.y < 0 || p.y >= BOARD_HEIGHT_CELLS) return;
                            if (!checkCollisionWithWalls(p.x, p.y, walls)) {
                                candidates.push(p);
                            }
                        });
                     });

                     if (candidates.length > 0) {
                         // Prefer momentum: Filter candidates where direction aligns with current movement
                         const momentumCandidates = candidates.filter(c => (c.dir.x * nextDir.x + c.dir.y * nextDir.y) > 0);
                         
                         const chosen = momentumCandidates.length > 0 
                            ? momentumCandidates[Math.floor(Math.random() * momentumCandidates.length)]
                            : candidates[Math.floor(Math.random() * candidates.length)];
                         
                         nextX = chosen.x;
                         nextY = chosen.y;
                         nextDir = chosen.dir; // Set direction to face out of gate
                         hasWarped = true;
                     }
                 }
            }

            if (!hasWarped) {
                // Bounce logic
                if (config.behavior === 'patrol' || config.behavior === 'random') {
                    nextDir = { x: -nextDir.x, y: -nextDir.y };
                }
                // Chasers just wait a tick if blocked
                return { ...e, dir: nextDir, currentTick: 0, frozen: false };
            }
        }
        
        // UPDATE TRAIL: Add current position to history
        const newTrail = [{x: e.x, y: e.y}, ...e.trail].slice(0, 8); 

        return { ...e, x: nextX, y: nextY, dir: nextDir, currentTick: 0, frozen: false, trail: newTrail };
    });
};
