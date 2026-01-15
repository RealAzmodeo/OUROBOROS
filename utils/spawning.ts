
import { Pickup, Segment, Wall, Upgrade, Coin, Enemy, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../types';
import { ITEM_TYPES } from '../data/constants';
import { checkCollisionWithWalls, getDistance } from './geometry';

const SAFETY_RADIUS = 4;

/**
 * Checks if a specific coordinate and its surrounding radius is safe.
 * Safe means: No walls, no traps, no enemies, and within bounds.
 */
export const isLocationSafe = (cx: number, cy: number, radius: number, walls: Wall[], enemies: Enemy[] = []): boolean => {
    // 1. Check Board Bounds (must allow radius buffer)
    if (cx - radius < 0 || cx + radius >= BOARD_WIDTH_CELLS || 
        cy - radius < 0 || cy + radius >= BOARD_HEIGHT_CELLS) {
        return false;
    }

    // 2. Check collisions in the box [cx-radius, cx+radius] x [cy-radius, cy+radius]
    for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
            // Check Walls/Traps
            if (checkCollisionWithWalls(x, y, walls)) return false;
            
            // Check Enemies
            const enemyHit = enemies.some(e => Math.round(e.x) === x && Math.round(e.y) === y);
            if (enemyHit) return false;
        }
    }

    return true;
};

/**
 * Scans the map to find a safe area with a radius of 4 to spawn the snake.
 * Prioritizes the center of the map.
 */
export const findSafeSnakePosition = (walls: Wall[], enemies: Enemy[] = []): { x: number, y: number } => {
    const centerX = Math.floor(BOARD_WIDTH_CELLS / 2);
    const centerY = Math.floor(BOARD_HEIGHT_CELLS / 2);

    // 1. Try Center first
    if (isLocationSafe(centerX, centerY, SAFETY_RADIUS, walls, enemies)) {
        return { x: centerX, y: centerY };
    }

    // 2. Spiral Scan / Grid Scan
    // We scan the grid to find the first valid spot closest to center
    // Optimization: Just scan the central 80% of the board to avoid edges
    const padding = SAFETY_RADIUS + 1;
    
    let bestSpot = { x: 10, y: 10 }; // Fallback
    let minDist = Infinity;
    let found = false;

    for (let y = padding; y < BOARD_HEIGHT_CELLS - padding; y++) {
        for (let x = padding; x < BOARD_WIDTH_CELLS - padding; x++) {
            if (isLocationSafe(x, y, SAFETY_RADIUS, walls, enemies)) {
                const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (dist < minDist) {
                    minDist = dist;
                    bestSpot = { x, y };
                    found = true;
                    // If we find something very close to center, just take it
                    if (dist < 5) return bestSpot;
                }
            }
        }
    }

    if (found) return bestSpot;

    // 3. Desperate Fallback: Reduce Radius
    // If map is extremely dense, try with a smaller radius (2) just to let them play
    for (let y = 2; y < BOARD_HEIGHT_CELLS - 2; y++) {
        for (let x = 2; x < BOARD_WIDTH_CELLS - 2; x++) {
            if (isLocationSafe(x, y, 2, walls, enemies)) {
                return { x, y };
            }
        }
    }

    return { x: 10, y: 10 };
};

/**
 * Gets a random safe position for respawning.
 */
export const getRandomSafePosition = (walls: Wall[], enemies: Enemy[] = []): { x: number, y: number } => {
    let attempts = 0;
    while (attempts < 50) {
        attempts++;
        const x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - SAFETY_RADIUS * 2)) + SAFETY_RADIUS;
        const y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - SAFETY_RADIUS * 2)) + SAFETY_RADIUS;
        
        if (isLocationSafe(x, y, SAFETY_RADIUS, walls, enemies)) {
            return { x, y };
        }
    }
    // Fallback to deterministic search if random fails
    return findSafeSnakePosition(walls, enemies);
};

export const spawnPickupsIfNeeded = (currentPickups: Pickup[], snake: Segment[], walls: Wall[], upgrades: Upgrade[]): Pickup[] => {
    let newPickups = [...currentPickups];
    
    // Basic Matter Types
    for (const type of ITEM_TYPES) {
        const count = newPickups.filter(p => p.itemType === type).length;
        if (count === 0) {
            let valid = false;
            let p: Pickup = { id: '', x: 0, y: 0, itemType: type };
            let attempts = 0;
            while (!valid && attempts < 50) {
                attempts++;
                p.x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 2)) + 1;
                p.y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 2)) + 1;
                const onSnake = snake.some(s => Math.round(s.x) === p.x && Math.round(s.y) === p.y);
                const onPickup = newPickups.some(cp => cp.x === p.x && cp.y === p.y);
                const inWall = checkCollisionWithWalls(p.x, p.y, walls);
                if (!onSnake && !onPickup && !inWall) valid = true;
            }
            if (valid) {
                p.id = Math.random().toString(36).substr(2, 9);
                newPickups.push(p);
            }
        }
    }

    // Stasis Orb logic
    const stasisUpgrade = upgrades.find(u => u.type === 'stasis');
    if (stasisUpgrade) {
        const hasStasis = newPickups.some(p => p.itemType === 'stasis_orb');
        if (!hasStasis && Math.random() < 0.01) { 
            let valid = false;
            let p: Pickup = { id: Math.random().toString(), x: 0, y: 0, itemType: 'stasis_orb' };
             let attempts = 0;
            while (!valid && attempts < 50) {
                attempts++;
                p.x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 2)) + 1;
                p.y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 2)) + 1;
                const onSnake = snake.some(s => Math.round(s.x) === p.x && Math.round(s.y) === p.y);
                const onPickup = newPickups.some(cp => cp.x === p.x && cp.y === p.y);
                const inWall = checkCollisionWithWalls(p.x, p.y, walls);
                if (!onSnake && !onPickup && !inWall) valid = true;
            }
            if (valid) newPickups.push(p);
        }
    }

    // Shield Logic (Rare spawn for Chassis owners)
    const chassisUpgrade = upgrades.find(u => u.type === 'chassis');
    if (chassisUpgrade && chassisUpgrade.level > 0) {
        const hasShield = newPickups.some(p => p.itemType === 'shield');
        // Rare spawn (2%)
        if (!hasShield && Math.random() < 0.02) { 
             let valid = false;
             let p: Pickup = { id: Math.random().toString(), x: 0, y: 0, itemType: 'shield' };
             let attempts = 0;
             while (!valid && attempts < 50) {
                 attempts++;
                 p.x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 2)) + 1;
                 p.y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 2)) + 1;
                 const onSnake = snake.some(s => Math.round(s.x) === p.x && Math.round(s.y) === p.y);
                 const onPickup = newPickups.some(cp => cp.x === p.x && cp.y === p.y);
                 const inWall = checkCollisionWithWalls(p.x, p.y, walls);
                 if (!onSnake && !onPickup && !inWall) valid = true;
             }
             if (valid) newPickups.push(p);
        }
    }

    return newPickups;
};

export const spawnCoins = (count: number, snake: Segment[], walls: Wall[], existingCoins: Coin[] = []): Coin[] => {
    const newCoins = [...existingCoins];
    for(let i=0; i<count; i++) {
        let valid = false;
        let c: Coin = { id: '', x: 0, y: 0, value: 10 };
        let attempts = 0;
        while(!valid && attempts < 20) {
            attempts++;
            c.x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 2)) + 1;
            c.y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 2)) + 1;
            const onSnake = snake.some(s => Math.round(s.x) === c.x && Math.round(s.y) === c.y);
            const inWall = checkCollisionWithWalls(c.x, c.y, walls);
            const onCoin = newCoins.some(co => co.x === c.x && co.y === c.y);
            if (!onSnake && !inWall && !onCoin) valid = true;
        }
        if (valid) {
            c.id = Math.random().toString();
            newCoins.push(c);
        }
    }
    return newCoins;
};

export const spawnPortal = (snake: Segment[], walls: Wall[], getDistance: (p1: any, p2: any) => number): {x: number, y: number} => {
    let valid = false;
    let x=0, y=0;
    const head = snake[0];
    let attempts = 0;
    while(!valid && attempts < 100) {
        attempts++;
        x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 4)) + 2;
        y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 4)) + 2;
        const dist = getDistance(head, {x, y});
        const inWall = checkCollisionWithWalls(x, y, walls);
        // Ensure portal isn't inside a wall block (checking neighbors too for size)
        const inWallBox = 
            checkCollisionWithWalls(x+1, y, walls) || 
            checkCollisionWithWalls(x, y+1, walls) || 
            checkCollisionWithWalls(x+1, y+1, walls);

        if (dist > 15 && !inWall && !inWallBox) valid = true;
    }
    return {x, y};
};
