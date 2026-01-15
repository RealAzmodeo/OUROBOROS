
import { Enemy, Segment, Wall, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, EnemyType, Point } from '../types';
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
        const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
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
        trail: [],
        spawnedAt: Date.now()
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
 * Simple BFS based pathfinding for chasers to avoid getting stuck on walls.
 */
const findNextStepPath = (start: Point, target: Point, walls: Wall[], ignoreWalls = false): Point | null => {
    if (ignoreWalls) {
        const dx = target.x - start.x;
        const dy = target.y - start.y;
        if (Math.abs(dx) > Math.abs(dy)) return { x: Math.sign(dx), y: 0 };
        return { x: 0, y: Math.sign(dy) };
    }

    // BFS for next step
    const queue: { x: number, y: number, firstStep: Point | null }[] = [
        { x: start.x, y: start.y, firstStep: null }
    ];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

    let depth = 0;
    const MAX_DEPTH = 15; // Limit search for performance

    while (queue.length > 0 && depth < MAX_DEPTH) {
        const size = queue.length;
        for (let i = 0; i < size; i++) {
            const current = queue.shift()!;

            if (current.x === target.x && current.y === target.y) {
                return current.firstStep;
            }

            for (const d of dirs) {
                const nx = current.x + d.x;
                const ny = current.y + d.y;
                const key = `${nx},${ny}`;

                if (nx < 0 || nx >= BOARD_WIDTH_CELLS || ny < 0 || ny >= BOARD_HEIGHT_CELLS) continue;
                if (visited.has(key)) continue;
                if (checkCollisionWithWalls(nx, ny, walls)) continue;

                const firstStep = current.firstStep || d;
                queue.push({ x: nx, y: ny, firstStep });
                visited.add(key);
            }
        }
        depth++;
    }

    // Fallback to direct movement if path not found
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    if (Math.abs(dx) > Math.abs(dy)) return { x: Math.sign(dx), y: 0 };
    return { x: 0, y: Math.sign(dy) };
};

/**
 * Process AI movement for all enemies.
 */
export const moveEnemies = (
    enemies: Enemy[],
    snakeHead: Segment,
    walls: Wall[],
    isStasis: boolean,
    timestamp: number
): Enemy[] => {

    const nextEnemies: Enemy[] = [];

    enemies.forEach(e => {
        // 1. Check for Static or Stasis
        if (e.moveSpeed === 0) {
            nextEnemies.push(e);
            return;
        }
        if (isStasis) {
            nextEnemies.push({ ...e, frozen: true });
            return;
        }

        // 2. Tick Accumulator
        let newTick = e.currentTick + 1;
        if (newTick < e.moveSpeed) {
            nextEnemies.push({ ...e, currentTick: newTick, frozen: false });
            return;
        }

        // 3. Determine Next Move based on Behavior
        let nextX = e.x;
        let nextY = e.y;
        let nextDir = { ...e.dir };
        const config = ENEMY_REGISTRY[e.type];

        if (config.behavior === 'chase' || config.behavior === 'replicator') {
            const step = findNextStepPath(e, snakeHead, walls);
            if (step) {
                nextX += step.x;
                nextY += step.y;
                nextDir = step;
            }
        }
        else if (config.behavior === 'ghost') {
            const step = findNextStepPath(e, snakeHead, walls, true); // Ghost ignores walls
            if (step) {
                nextX += step.x;
                nextY += step.y;
                nextDir = step;
            }
        }
        else if (config.behavior === 'random') {
            if (Math.random() > 0.8) {
                const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
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

        // 4. Collision Check (Walls or Board Edges) - Skip for Ghost
        const ignoreWalls = config.behavior === 'ghost';
        const hitWall = !ignoreWalls && walls.find(w => nextX >= w.x && nextX < w.x + w.width && nextY >= w.y && nextY < w.y + w.height);
        const hitEdge = nextX < 0 || nextX >= BOARD_WIDTH_CELLS || nextY < 0 || nextY >= BOARD_HEIGHT_CELLS;

        if (hitWall || hitEdge) {
            let hasWarped = false;

            // GATE WARP LOGIC
            if (hitWall && hitWall.type === 'gate') {
                let targetWalls: Wall[] = [];
                if (hitWall.gateChannel !== undefined && hitWall.gateChannel !== -1) {
                    const candidateClusterIds = Array.from(new Set(
                        walls.filter(w => w.type === 'gate' && w.gateChannel === hitWall.gateChannel && w.gateClusterId !== hitWall.gateClusterId).map(w => w.gateClusterId!)
                    ));
                    if (candidateClusterIds.length > 0) {
                        const targetClusterId = candidateClusterIds[Math.floor(Math.random() * candidateClusterIds.length)];
                        targetWalls = walls.filter(w => w.type === 'gate' && w.gateClusterId === targetClusterId);
                    }
                } else if (hitWall.targetClusterId !== undefined) {
                    targetWalls = walls.filter(w => w.type === 'gate' && w.gateClusterId === hitWall.targetClusterId);
                }

                if (targetWalls.length > 0) {
                    let candidates: { x: number, y: number, dir: { x: number, y: number } }[] = [];
                    targetWalls.forEach(g => {
                        const potential = [{ x: g.x + 1, y: g.y, dir: { x: 1, y: 0 } }, { x: g.x - 1, y: g.y, dir: { x: -1, y: 0 } }, { x: g.x, y: g.y + 1, dir: { x: 0, y: 1 } }, { x: g.x, y: g.y - 1, dir: { x: 0, y: -1 } }];
                        potential.forEach(p => {
                            if (p.x < 0 || p.x >= BOARD_WIDTH_CELLS || p.y < 0 || p.y >= BOARD_HEIGHT_CELLS) return;
                            if (!checkCollisionWithWalls(p.x, p.y, walls)) candidates.push(p);
                        });
                    });
                    if (candidates.length > 0) {
                        const momentumCandidates = candidates.filter(c => (c.dir.x * nextDir.x + c.dir.y * nextDir.y) > 0);
                        const chosen = momentumCandidates.length > 0 ? momentumCandidates[Math.floor(Math.random() * momentumCandidates.length)] : candidates[Math.floor(Math.random() * candidates.length)];
                        nextX = chosen.x; nextY = chosen.y; nextDir = chosen.dir;
                        hasWarped = true;
                    }
                }
            }

            if (!hasWarped) {
                if (config.behavior === 'patrol' || config.behavior === 'random' || config.behavior === 'splitter') {
                    nextDir = { x: -nextDir.x, y: -nextDir.y };
                }
                nextEnemies.push({ ...e, dir: nextDir, currentTick: 0, frozen: false });
                return;
            }
        }

        // REPLICATOR LOGIC: Check if it's time to duplicate
        if (config.behavior === 'replicator' && timestamp - (e.spawnedAt || 0) > 8000) {
            // Duplicate!
            const sibling = createEnemy('replicator', e.x, e.y, 'rep');
            sibling.spawnedAt = timestamp; // Reset sibling timer
            nextEnemies.push(sibling);
            // reset parent timer so it doesn't replicate again immediately
            e.spawnedAt = timestamp;
        }

        const newTrail = [{ x: e.x, y: e.y }, ...e.trail].slice(0, 8);
        nextEnemies.push({ ...e, x: nextX, y: nextY, dir: nextDir, currentTick: 0, frozen: false, trail: newTrail });
    });

    return nextEnemies;
};
