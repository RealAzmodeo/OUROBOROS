
import { GameState, Segment, ItemType, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, Wall, GameTickResult, Point, VfxEvent } from '../types';
import { getDistance, checkCollisionWithWalls } from './geometry';
import { spawnPickupsIfNeeded, spawnCoins, spawnPortal, getRandomSafePosition } from './spawning';
import { moveEnemies, spawnRandomEnemy, createEnemy } from './enemySystem';
import { generateShopChoices } from './shopSystem';
import { getLevelData } from '../data/levels';
import { parseLevel } from './levelParser';
import { updateBoss } from './bossSystem';
import { ITEM_TYPES } from '../data/constants';

interface GameTickContext {
    direction: { x: number, y: number };
    timestamp: number;
    tutorialStep: number;
    tutorialInputCount: number;
    seenHpTutorial: boolean;
    seenEvasionTutorial: boolean;
    unlockCallback: (id: string) => void;
    checkpointState?: GameState | null;
    playSfx: (type: string) => void; 
}

// Helper to convert snake body into debris events
const disintegrateSnake = (snake: Segment[]): VfxEvent[] => {
    let debris: VfxEvent[] = [];
    snake.forEach(s => {
        let color = '#555';
        if (s.type === 'head') color = '#FFFFFF';
        else if (s.isCharged) {
             if (s.isSequencePart) color = '#39FF14'; 
             else color = '#00F0FF'; 
        }
        debris.push({ type: 'explosion', x: s.x, y: s.y, color });
    });
    return debris;
};

const handleTutorialRespawn = (prev: GameState, currentVfx: VfxEvent[], ctx: GameTickContext, errorId: number): GameTickResult => {
    ctx.playSfx('game_over'); 
    
    let newState: GameState;
    const safePos = getRandomSafePosition(prev.walls, prev.enemies);
    const newSnake: Segment[] = [{ ...safePos, id: `respawn-${ctx.timestamp}`, type: 'head', isCharged: false }];
    
    newState = {
        ...prev,
        snake: newSnake,
        status: 'tutorial',
        pendingType: null // Reset pending on respawn
    };
    
    return {
        newState,
        shouldTriggerHpTutorial: false,
        nextTutorialStep: ctx.tutorialStep,
        tutorialError: errorId,
        resetInput: true,
        vfxEvents: currentVfx
    };
};

export const processEvasionTick = (prev: GameState, ctx: GameTickContext): GameTickResult => {
    if (!prev.evasionState) return { newState: prev, shouldTriggerHpTutorial: false, nextTutorialStep: ctx.tutorialStep, vfxEvents: [] };

    const es = { ...prev.evasionState };
    
    const level = prev.evasionLevel;
    let speedMult = 0.5 + ((level - 1) * 0.1); 
    let gapSize = Math.max(2, 6 - Math.floor((level - 1) / 2)); 
    let density = Math.min(0.7, 0.15 + ((level - 1) * 0.05)); 

    const scrollSpeed = 0.5 * speedMult; 
    
    if (ctx.direction.x !== 0) {
        const lateralSpeed = 0.4; 
        es.playerX += ctx.direction.x * lateralSpeed;
        if (es.playerX < 0) es.playerX = 0;
        if (es.playerX >= BOARD_WIDTH_CELLS) es.playerX = BOARD_WIDTH_CELLS - 1;
    }

    es.gridOffset += scrollSpeed * 20; 
    es.timer -= 30; 

    es.obstacles = es.obstacles.map(o => ({ ...o, y: o.y + scrollSpeed })).filter(o => o.y < BOARD_HEIGHT_CELLS);
    es.coins = es.coins.map(c => ({ ...c, y: c.y + scrollSpeed })).filter(c => c.y < BOARD_HEIGHT_CELLS);

    es.spawnTimer -= 30;
    if (es.spawnTimer <= 0) {
        const rowY = -2;
        const gapStart = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - gapSize));
        let currentBlockStart = -1;
        
        for (let x = 0; x < BOARD_WIDTH_CELLS; x++) {
            const isGap = x >= gapStart && x < gapStart + gapSize;
            const shouldSpawn = !isGap && Math.random() < (density + 0.3); 
            
            if (shouldSpawn) {
                if (currentBlockStart === -1) currentBlockStart = x;
            } else {
                if (currentBlockStart !== -1) {
                    es.obstacles.push({ x: currentBlockStart, y: rowY, width: x - currentBlockStart, height: 1 });
                    currentBlockStart = -1;
                }
            }
        }
        if (currentBlockStart !== -1) {
            es.obstacles.push({ x: currentBlockStart, y: rowY, width: BOARD_WIDTH_CELLS - currentBlockStart, height: 1 });
        }

        if (Math.random() > 0.3) {
            for(let cx = gapStart; cx < gapStart + gapSize; cx++) {
                 if (Math.random() > 0.5) es.coins.push({ x: cx, y: rowY });
            }
        }

        es.spawnTimer = 500 / speedMult; 
    }

    const playerY = BOARD_HEIGHT_CELLS - 4; 
    
    for (let i = es.coins.length - 1; i >= 0; i--) {
        const c = es.coins[i];
        if (Math.abs(c.x - es.playerX) < 0.8 && Math.abs(c.y - playerY) < 0.8) {
            es.coins.splice(i, 1);
            ctx.playSfx('pickup_coin');
            es.coinsCollected += 10;
        }
    }

    const hit = es.obstacles.some(o => 
        es.playerX >= o.x - 0.5 && es.playerX < o.x + o.width - 0.5 && 
        playerY >= o.y - 0.5 && playerY < o.y + o.height - 0.5
    );

    if (hit) {
        ctx.playSfx('damage');
        return {
            newState: { 
                ...prev, 
                evasionState: es, 
                status: 'evasion_fail',
                currency: prev.currency + es.coinsCollected 
            },
            shouldTriggerHpTutorial: false,
            nextTutorialStep: ctx.tutorialStep,
            resetInput: true,
            vfxEvents: [{type: 'explosion', x: es.playerX, y: playerY, color: '#F00'}]
        };
    }

    if (es.timer <= 0) {
        ctx.playSfx('powerup');
        return {
            newState: {
                ...prev,
                currency: prev.currency + es.coinsCollected,
                evasionLevel: prev.evasionLevel + 1,
                evasionState: undefined,
                status: 'evasion_reward'
            },
            shouldTriggerHpTutorial: false,
            nextTutorialStep: ctx.tutorialStep,
            resetInput: true,
            vfxEvents: []
        }
    }

    return {
        newState: {
            ...prev,
            evasionState: es
        },
        shouldTriggerHpTutorial: false,
        nextTutorialStep: ctx.tutorialStep,
        vfxEvents: []
    };
};

export const processGameTick = (prev: GameState, ctx: GameTickContext): GameTickResult => {
    // Handling Game Over state
    if (prev.status === 'gameover') {
        return {
            newState: prev,
            shouldTriggerHpTutorial: false,
            nextTutorialStep: ctx.tutorialStep,
            vfxEvents: []
        };
    }

    // State Variables
    let newEnemies = [...prev.enemies];
    let newPickups = [...prev.pickups];
    let newCoins = [...prev.coins];
    let newWalls = [...prev.walls]; 
    let currentVfx: VfxEvent[] = [];
    
    let currentUpgrades = prev.activeUpgrades;
    let currentBuffs = { ...prev.buffs };
    let newScore = prev.score;
    let newCurrency = prev.currency;
    let newStats = { ...prev.stats };
    let nextTutorialStep = ctx.tutorialStep;
    let shouldTriggerHpTutorial = false;
    let status: GameState['status'] = prev.status;
    let portal = prev.portal;
    let secretPortal = prev.secretPortal;
    let shop = prev.shop;
    let lastTrapMoveTime = prev.lastTrapMoveTime || ctx.timestamp;
    let forceDirectionUpdate: Point | undefined = undefined;
    let boss = prev.boss;

    const isBossLevel = prev.level % 5 === 0 && prev.level < 1000 && prev.level !== 0;

    const triggerGameOver = (reason: string, impactX: number, impactY: number, extraVfx: VfxEvent[] = []) => {
        ctx.playSfx('game_over');
        
        // Disintegrate whatever snake we currently have
        // Since snake construction happens later, we use prev.snake here for debris source
        const bodyDebris = disintegrateSnake(prev.snake);
        const impactDebris: VfxEvent = { type: 'explosion', x: impactX, y: impactY, color: '#FF0033' };

        return {
            newState: { 
                ...prev, 
                status: 'gameover' as const, 
                gameOverReason: reason,
                gameOverTimestamp: ctx.timestamp,
                snake: [], 
                stats: newStats,
                score: newScore
            },
            shouldTriggerHpTutorial,
            nextTutorialStep,
            vfxEvents: [...currentVfx, ...extraVfx, ...bodyDebris, impactDebris]
        };
    }

    // --- ANOMALY: TRAP MIGRATION ---
    if (prev.activeModifiers.some(m => m.type === 'trap_migration')) {
        if (ctx.timestamp - lastTrapMoveTime > 10000) {
            newWalls = newWalls.map(w => {
                if (w.type === 'trap') {
                    const dirs = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                    const dir = dirs[Math.floor(Math.random() * dirs.length)];
                    const tx = w.x + dir.x;
                    const ty = w.y + dir.y;
                    if (tx > 0 && tx < BOARD_WIDTH_CELLS-1 && ty > 0 && ty < BOARD_HEIGHT_CELLS-1) {
                         const collision = checkCollisionWithWalls(tx, ty, prev.walls);
                         if (!collision) return { ...w, x: tx, y: ty };
                    }
                }
                return w;
            });
            lastTrapMoveTime = ctx.timestamp;
            ctx.playSfx('shield_deflect');
        }
    }

    // --- MAGNET COINS ---
    const magnetUpgrade = currentUpgrades.find(u => u.type === 'magnet');
    if (magnetUpgrade) {
        const range = magnetUpgrade.level * 2 + 3;
        newCoins.forEach(c => {
            const dist = getDistance(prev.snake[0], c);
            if (dist < range && dist > 1) {
                const dx = prev.snake[0].x - c.x;
                const dy = prev.snake[0].y - c.y;
                const speed = 1.5; 
                c.x += Math.sign(dx) * speed; 
                c.y += Math.sign(dy) * speed;
            }
        });
    }

    // --- MOVEMENT PRE-CALC ---
    let moveDir = { ...ctx.direction };

    // Anomaly: Magnetic Wall
    if (prev.activeModifiers.some(m => m.type === 'magnetic_wall')) {
        const h = prev.snake[0];
        let nearestDist = Infinity;
        let bias = {x: 0, y: 0};
        
        for(let dy = -3; dy <= 3; dy++) {
            for(let dx = -3; dx <= 3; dx++) {
                if (dx === 0 && dy === 0) continue;
                const tx = h.x + dx;
                const ty = h.y + dy;
                if (checkCollisionWithWalls(tx, ty, prev.walls)) {
                     const dist = Math.abs(dx) + Math.abs(dy); // Manhattan
                     if (dist < nearestDist) {
                         nearestDist = dist;
                         bias = {x: Math.sign(dx), y: Math.sign(dy)};
                     }
                }
            }
        }

        if (nearestDist <= 3) {
            if (Math.random() < 0.15) {
                if ((moveDir.x !== 0 && bias.y !== 0) || (moveDir.y !== 0 && bias.x !== 0)) {
                     if (moveDir.x !== 0) moveDir = { x: 0, y: bias.y };
                     else moveDir = { x: bias.x, y: 0 };
                }
            }
        }
    }

    const currentHead = prev.snake[0];
    let newHeadPosition = { x: currentHead.x + moveDir.x, y: currentHead.y + moveDir.y };
    
    // --- GATE WARP LOGIC (Updates newHeadPosition) ---
    const wallCollision = prev.walls.find(w => newHeadPosition.x >= w.x && newHeadPosition.x < w.x + w.width && newHeadPosition.y >= w.y && newHeadPosition.y < w.y + w.height);
    
    if (wallCollision && wallCollision.type === 'gate') {
        let targetWalls: Wall[] = [];
        if (wallCollision.gateChannel !== undefined && wallCollision.gateChannel !== -1) {
            const candidateClusterIds = Array.from(new Set(
                prev.walls
                    .filter(w => w.type === 'gate' && w.gateChannel === wallCollision.gateChannel && w.gateClusterId !== wallCollision.gateClusterId)
                    .map(w => w.gateClusterId!)
            ));
            if (candidateClusterIds.length > 0) {
                const targetClusterId = candidateClusterIds[Math.floor(Math.random() * candidateClusterIds.length)];
                targetWalls = prev.walls.filter(w => w.type === 'gate' && w.gateClusterId === targetClusterId);
            }
        }
        else if (wallCollision.targetClusterId !== undefined) {
            targetWalls = prev.walls.filter(w => w.type === 'gate' && w.gateClusterId === wallCollision.targetClusterId);
        }

        if (targetWalls.length > 0) {
             let isHorizontal = false;
             let isVertical = false;
             
             if (targetWalls.length > 1) {
                 const xs = targetWalls.map(w => w.x);
                 const ys = targetWalls.map(w => w.y);
                 const minX = Math.min(...xs), maxX = Math.max(...xs);
                 const minY = Math.min(...ys), maxY = Math.max(...ys);
                 if (maxX > minX) isHorizontal = true;
                 if (maxY > minY) isVertical = true; 
             } else {
                 const g = targetWalls[0];
                 const hasHorzNeighbor = prev.walls.some(w => w !== g && w.y === g.y && Math.abs(w.x - g.x) === 1);
                 const hasVertNeighbor = prev.walls.some(w => w !== g && w.x === g.x && Math.abs(w.y - g.y) === 1);
                 if (hasHorzNeighbor) isHorizontal = true;
                 if (hasVertNeighbor) isVertical = true;
             }
             
            let candidates: {x: number, y: number, dir: Point, score: number}[] = [];

            targetWalls.forEach(g => {
                const potential = [
                    {x: g.x+1, y: g.y, dir: {x: 1, y: 0}},
                    {x: g.x-1, y: g.y, dir: {x: -1, y: 0}},
                    {x: g.x, y: g.y+1, dir: {x: 0, y: 1}},
                    {x: g.x, y: g.y-1, dir: {x: 0, y: -1}}
                ];

                potential.forEach(p => {
                    if (p.x < 0 || p.x >= BOARD_WIDTH_CELLS || p.y < 0 || p.y >= BOARD_HEIGHT_CELLS) return;
                    if (!checkCollisionWithWalls(p.x, p.y, prev.walls)) {
                        if (isHorizontal && !isVertical && p.dir.y === 0) return;
                        if (isVertical && !isHorizontal && p.dir.x === 0) return;
                        const dot = (p.dir.x * ctx.direction.x) + (p.dir.y * ctx.direction.y);
                        const score = dot + 1; 
                        candidates.push({...p, score});
                    }
                });
            });

            if (candidates.length > 0) {
                candidates.sort((a, b) => b.score - a.score);
                const bestScore = candidates[0].score;
                const topCandidates = candidates.filter(c => c.score === bestScore);
                const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

                newHeadPosition.x = chosen.x;
                newHeadPosition.y = chosen.y;
                moveDir = chosen.dir; 
                forceDirectionUpdate = chosen.dir; 

                ctx.playSfx('portal_enter');
                currentVfx.push({ type: 'explosion', x: currentHead.x, y: currentHead.y, color: '#00FFFF' });
                currentVfx.push({ type: 'explosion', x: chosen.x, y: chosen.y, color: '#00FFFF' });
            }
        }
    }

    // --- PHASE 1: LOGIC RESOLUTION (Pickups, Damage, Grow State) ---
    // We determine snake structure modifications BEFORE moving segments
    
    let snakeAction: 'move' | 'grow' = 'move';
    let growthType: ItemType | undefined = undefined;
    let fillIndices: number[] = [];
    let unfillIndices: number[] = [];
    
    const pIndex = newPickups.findIndex(p => Math.round(p.x) === newHeadPosition.x && Math.round(p.y) === newHeadPosition.y);
    if (pIndex !== -1) {
        const pickup = newPickups[pIndex];
        
        // Handle Boss Pickups (Non-Snake logic)
        if (pickup.itemType === 'chronos_anchor' || pickup.itemType === 'omega_particle') {
             // Logic handled later in Boss section
        }
        else if (pickup.itemType === 'stasis_orb') {
            ctx.playSfx('powerup');
            const stasisUpgrade = currentUpgrades.find(u => u.type === 'stasis');
            const duration = stasisUpgrade ? 10000 + ((stasisUpgrade.level-1) * 2000) : 10000;
            currentBuffs.stasisUntil = ctx.timestamp + duration;
            currentVfx.push({ type: 'explosion', x: pickup.x, y: pickup.y, color: '#FFD700' });
            newPickups.splice(pIndex, 1);
            if (!prev.isTesting) ctx.unlockCallback('stasis_field');
        } 
        else if (pickup.itemType === 'shield') {
            const maxShields = currentUpgrades.find(u => u.type === 'chassis')?.level || 0;
            if (currentBuffs.currentShields < maxShields) {
                ctx.playSfx('powerup');
                currentBuffs.currentShields++;
                currentVfx.push({ type: 'heal', x: pickup.x, y: pickup.y });
            } else {
                 ctx.playSfx('pickup_coin');
                 newScore += 50;
                 currentVfx.push({ type: 'explosion', x: pickup.x, y: pickup.y, color: '#39FF14' });
            }
            newPickups.splice(pIndex, 1);
        }
        else {
            // Standard Matter Logic
            const pType = pickup.itemType as ItemType;
            
            // Stats
            if (currentUpgrades.some(u => u.type === 'phase')) {
                if (pType === 'alpha') newStats.alphaChain++; else newStats.alphaChain = 0;
                if (newStats.alphaChain >= 3) { 
                    ctx.playSfx('powerup');
                    currentBuffs.invulnerableUntil = ctx.timestamp + 5000; newStats.alphaChain = 0; 
                    currentVfx.push({ type: 'shield_break', x: pickup.x, y: pickup.y });
                }
            }
            if (currentUpgrades.some(u => u.type === 'volatile')) {
                if (pType === 'beta') newStats.betaCount++;
                if (newStats.betaCount >= 3) { 
                    ctx.playSfx('explosion');
                    newStats.betaCount = 0; newEnemies = []; 
                    currentVfx.push({ type: 'emp', x: pickup.x, y: pickup.y });
                    // Respawn logic handled elsewhere
                }
            }
            if (currentUpgrades.some(u => u.type === 'weaver')) {
                if (pType === 'gamma') newStats.gammaCount++;
                if (newStats.gammaCount >= 3) { 
                    ctx.playSfx('powerup');
                    newStats.gammaCount = 0; 
                    // Auto-fill logic handled below? No, special Weaver auto-fill needs manual scan
                    const unchargedIdx = prev.snake.findIndex(s => s.type === 'body' && !s.isCharged); 
                    if (unchargedIdx !== -1) { 
                        fillIndices.push(unchargedIdx);
                        currentVfx.push({ type: 'heal', x: prev.snake[unchargedIdx].x, y: prev.snake[unchargedIdx].y });
                    }
                }
            }
            if (pType === 'alpha') {
                const harvester = currentUpgrades.find(u => u.type === 'harvester_alpha');
                if (harvester) newCurrency += harvester.value;
            }

            // CHECK FILL vs GROW
            let didFill = false;
            // Iterate prev.snake from tail to head
            for(let i = prev.snake.length - 1; i > 0; i--) {
                const s = prev.snake[i];
                if (!s.isCharged && s.variant === pType && !fillIndices.includes(i)) {
                    fillIndices.push(i);
                    currentVfx.push({ type: 'fill', x: pickup.x, y: pickup.y, color: '#00F0FF' });
                    currentVfx.push({ type: 'heal', x: s.x, y: s.y });
                    didFill = true;
                    
                    // Replicator
                    const replicator = currentUpgrades.find(u => u.type === 'replicator');
                    if (replicator && Math.random() * 100 < replicator.value) {
                        const randType = ['alpha', 'beta', 'gamma'][Math.floor(Math.random()*3)] as ItemType;
                        let valid = false, attempts = 0;
                        while(!valid && attempts < 10) {
                            const rx = currentHead.x + Math.floor(Math.random() * 10) - 5;
                            const ry = currentHead.y + Math.floor(Math.random() * 10) - 5;
                            if (rx > 0 && rx < BOARD_WIDTH_CELLS-1 && ry > 0 && ry < BOARD_HEIGHT_CELLS-1) {
                                newPickups.push({ id: `rep-${Math.random()}`, x: rx, y: ry, itemType: randType });
                                valid = true;
                                currentVfx.push({ type: 'heal', x: rx, y: ry });
                            }
                            attempts++;
                        }
                    }
                    
                    // Wireless
                    const wireless = currentUpgrades.find(u => u.type === 'wireless');
                    if (!wireless || wireless.level <= 1) break; // Only 1 fill per item
                }
            }

            if (didFill) {
                ctx.playSfx('pickup_good');
                const greed = currentUpgrades.find(u => u.type === 'greed');
                const mult = greed ? 1 + (greed.level * 0.1) : 1;
                newScore += Math.floor(50 * mult);
                newPickups.splice(pIndex, 1);
                
                if (prev.level === 0 && ctx.tutorialStep === 3) {
                    nextTutorialStep = 4;
                    const spawnY = Math.floor(BOARD_HEIGHT_CELLS * 0.5);
                    const spawnX = Math.floor(BOARD_WIDTH_CELLS * 0.8);
                    newPickups.push({ id: 'tut-beta-fill', x: spawnX, y: spawnY, itemType: 'beta' });
                }
            } else {
                // If not filled, check if we SHOULD have filled (Damage)
                let anyEmpty = prev.snake.some((s, idx) => idx > 0 && !s.isCharged && !fillIndices.includes(idx));
                if (anyEmpty) {
                    // Wrong Type Collected
                    if (currentBuffs.currentShields > 0) {
                        currentBuffs.currentShields--;
                        ctx.playSfx('shield_deflect');
                        currentVfx.push({ type: 'shield_break', x: pickup.x, y: pickup.y });
                    } else {
                        // Unfill logic
                        let foundToUnfill = false;
                        for(let i = prev.snake.length - 1; i > 0; i--) {
                            if (prev.snake[i].isCharged && !unfillIndices.includes(i)) {
                                unfillIndices.push(i);
                                currentVfx.push({ type: 'explosion', x: prev.snake[i].x, y: prev.snake[i].y, color: '#FF0033' });
                                foundToUnfill = true;
                                break; // Only lose 1
                            }
                        }
                        
                        if (foundToUnfill) {
                            ctx.playSfx('damage');
                            const agility = currentUpgrades.find(u => u.type === 'agility');
                            const integrityEcho = currentUpgrades.find(u => u.type === 'integrity_echo');
                            const bonusTime = (agility ? (agility.level * 1000) : 0) + (integrityEcho ? integrityEcho.value : 0);
                            currentBuffs.invulnerableUntil = ctx.timestamp + 2000 + bonusTime;
                            if (!ctx.seenHpTutorial) shouldTriggerHpTutorial = true;
                        } else {
                            // Critical Failure (No charges left)
                            if (prev.level === 0) return handleTutorialRespawn(prev, currentVfx, ctx, 97);
                            ctx.playSfx('wall_crash');
                            return triggerGameOver('SYSTEM ERROR: INCOMPATIBLE MATTER', newHeadPosition.x, newHeadPosition.y);
                        }
                    }
                    newPickups.splice(pIndex, 1);
                } else {
                    // No empties -> GROW
                    snakeAction = 'grow';
                    growthType = pType;
                    ctx.playSfx('pickup_good');
                    
                    const greed = currentUpgrades.find(u => u.type === 'greed');
                    const mult = greed ? 1 + (greed.level * 0.1) : 1;
                    newScore += Math.floor(10 * mult);
                    newPickups.splice(pIndex, 1);
                    
                    if (prev.level === 0 && ctx.tutorialStep === 1) {
                        nextTutorialStep = 2; 
                        const spawnY = Math.floor(BOARD_HEIGHT_CELLS * 0.2);
                        const spawnX = Math.floor(BOARD_WIDTH_CELLS / 2);
                        newPickups.push({ id: 'tut-beta-danger', x: spawnX - 5, y: spawnY + 10, itemType: 'beta' });
                        newPickups.push({ id: 'tut-alpha-fill', x: spawnX + 5, y: spawnY + 10, itemType: 'alpha' });
                    }
                }
            }
        }
    }

    // --- PHASE 2: CONSTRUCTION ---
    const headSegment: Segment = { 
        ...newHeadPosition, 
        id: `head-${ctx.timestamp}`, 
        isCharged: false, 
        type: 'head',
        createdAt: ctx.timestamp 
    };
    
    // Always move existing body segments to follow the chain
    // Map prev.snake[1] -> prev.snake[0] position
    const movedBody = prev.snake.slice(1).map((seg, i) => ({
        ...seg,
        x: prev.snake[i].x,
        y: prev.snake[i].y
    }));

    let nextSnakeState: Segment[] = [];

    if (snakeAction === 'grow') {
        // Add new segment at the TAIL (position vacated by the last segment)
        const oldTail = prev.snake[prev.snake.length - 1];
        const newTail: Segment = {
            id: `body-${ctx.timestamp}`,
            type: 'body',
            isCharged: false, // New segments are empty
            variant: growthType,
            createdAt: ctx.timestamp,
            x: oldTail.x,
            y: oldTail.y
        };
        nextSnakeState = [headSegment, ...movedBody, newTail];
    } else {
        // Just move
        nextSnakeState = [headSegment, ...movedBody];
    }

    // Apply Delayed Fill/Unfill operations
    // With Tail Growth strategy, indices are stable (prev[i] maps to next[i])
    fillIndices.forEach(idx => {
        if (nextSnakeState[idx]) nextSnakeState[idx].isCharged = true;
    });

    unfillIndices.forEach(idx => {
        if (nextSnakeState[idx]) nextSnakeState[idx].isCharged = false;
    });

    // Handle Wall Collisions (Standard)
    let collided = prev.walls.some(w => newHeadPosition.x >= w.x && newHeadPosition.x < w.x + w.width && newHeadPosition.y >= w.y && newHeadPosition.y < w.y + w.height);
    // Boundary check
    collided = collided || (newHeadPosition.x < 0 || newHeadPosition.x >= BOARD_WIDTH_CELLS || newHeadPosition.y < 0 || newHeadPosition.y >= BOARD_HEIGHT_CELLS);

    if (collided) {
        const stabilizer = currentUpgrades.find(u => u.type === 'stabilizer');
        const isTrap = wallCollision?.type === 'trap';
        
        if (stabilizer && !isTrap) {
            ctx.playSfx('shield_deflect');
            // Revert head (Bounce back visual)
            nextSnakeState[0].x = currentHead.x; nextSnakeState[0].y = currentHead.y;
            currentVfx.push({ type: 'shield_break', x: currentHead.x, y: currentHead.y });
        } else if (currentBuffs.currentShields > 0) {
            currentBuffs.currentShields--;
            ctx.playSfx('shield_deflect');
            nextSnakeState[0].x = currentHead.x; nextSnakeState[0].y = currentHead.y;
            currentVfx.push({ type: 'shield_break', x: currentHead.x, y: currentHead.y });
        } else {
            if (prev.level === 0) return handleTutorialRespawn(prev, currentVfx, ctx, 98);
            ctx.playSfx('wall_crash');
            let extraDebris: VfxEvent[] = [{ type: 'impact', x: newHeadPosition.x, y: newHeadPosition.y }];
            if (isTrap) extraDebris.push({ type: 'explosion', x: newHeadPosition.x, y: newHeadPosition.y, color: '#FF0000' });
            return triggerGameOver(isTrap ? 'CRITICAL FAILURE: TRAP DETECTED' : 'CRASH: STRUCTURAL COLLISION', newHeadPosition.x, newHeadPosition.y, extraDebris);
        }
    }

    // --- ANOMALY: RAPID DECAY ---
    if (prev.activeModifiers.some(m => m.type === 'rapid_decay')) {
        for (let i = nextSnakeState.length - 1; i > 0; i--) {
            const s = nextSnakeState[i];
            if (!s.isCharged && s.type === 'body' && s.createdAt) {
                if (ctx.timestamp - s.createdAt > 4000) {
                    ctx.playSfx('damage');
                    currentVfx.push({ type: 'explosion', x: s.x, y: s.y, color: '#555' });
                    // Slices off everything behind it? Or just this one?
                    // Logic implies snake breakage.
                    nextSnakeState = nextSnakeState.slice(0, i);
                }
            }
        }
    }

    // --- BOSS LOGIC ---
    if (boss) {
        const bossUpdate = updateBoss(prev, headSegment, ctx.timestamp, ctx.playSfx);
        boss = bossUpdate.boss;
        currentVfx.push(...bossUpdate.vfx);
        newPickups.push(...bossUpdate.pickupsToAdd);
        
        // Pickups handling for Rival/Timekeeper logic specifically requiring removal
        if (boss?.type === 'rival') {
             for (let i = newPickups.length - 1; i >= 0; i--) {
                const p = newPickups[i];
                if (p.itemType === 'omega_particle' && getDistance(boss, p) < 1) newPickups.splice(i, 1);
            }
        }
        if (boss?.type === 'timekeeper') {
             for (let i = newPickups.length - 1; i >= 0; i--) {
                const p = newPickups[i];
                if (p.itemType === 'chronos_anchor' && p.expiresAt && p.expiresAt < ctx.timestamp) {
                    currentVfx.push({type: 'explosion', x: p.x, y: p.y, color: '#FF0000'});
                    newPickups.splice(i, 1);
                }
            }
        }

        if (bossUpdate.damageToPlayer > 0 && currentBuffs.invulnerableUntil <= ctx.timestamp) {
            let damageRemaining = bossUpdate.damageToPlayer;
            let damageTakenCount = 0;
            // Search backwards for charged segments to sacrifice
            for(let i = nextSnakeState.length - 1; i > 0; i--) {
                if (damageRemaining <= 0) break;
                if (nextSnakeState[i].type === 'body' && nextSnakeState[i].isCharged) {
                    nextSnakeState[i].isCharged = false;
                    currentVfx.push({ type: 'explosion', x: nextSnakeState[i].x, y: nextSnakeState[i].y, color: '#FF0033' });
                    damageRemaining--;
                    damageTakenCount++;
                }
            }

            if (damageTakenCount > 0) {
                ctx.playSfx('damage');
                const agility = currentUpgrades.find(u => u.type === 'agility');
                const integrityEcho = currentUpgrades.find(u => u.type === 'integrity_echo');
                const bonusTime = (agility ? (agility.level * 1000) : 0) + (integrityEcho ? integrityEcho.value : 0);
                currentBuffs.invulnerableUntil = ctx.timestamp + 2000 + bonusTime;
                
                if (damageRemaining > 0) {
                     ctx.playSfx('wall_crash');
                     return triggerGameOver(`CRITICAL FAILURE: HULL DEPLETED`, nextSnakeState[0].x, nextSnakeState[0].y);
                }
            } else {
                ctx.playSfx('wall_crash');
                return triggerGameOver(`CRITICAL FAILURE: ${boss.name.toUpperCase()} IMPACT`, nextSnakeState[0].x, nextSnakeState[0].y);
            }
        }

        if (bossUpdate.isBossDead) {
            boss = undefined;
            ctx.playSfx('powerup');
            portal = { x: Math.floor(BOARD_WIDTH_CELLS/2), y: Math.floor(BOARD_HEIGHT_CELLS/2), createdAt: ctx.timestamp };
            currentVfx.push({ type: 'emp', x: portal.x, y: portal.y });
            newScore += 5000;
        }
    }

    // --- ENEMY LOGIC ---
    const isStasisActive = currentBuffs.stasisUntil > ctx.timestamp;
    const movedEnemies = moveEnemies(newEnemies, headSegment, prev.walls, isStasisActive);
    newEnemies = movedEnemies;

    // Head vs Enemy Hit
    const headHitIndex = newEnemies.findIndex(e => Math.round(e.x) === newHeadPosition.x && Math.round(e.y) === newHeadPosition.y);
    const isInvulnerable = currentBuffs.invulnerableUntil > ctx.timestamp;

    if (headHitIndex !== -1) {
        const e = newEnemies[headHitIndex];
        if (isInvulnerable) {
            ctx.playSfx('explosion');
            currentVfx.push({ type: 'explosion', x: e.x, y: e.y, color: e.color });
            newEnemies.splice(headHitIndex, 1); 
            newScore += 100;
            // Replication/Respawn logic...
            if (prev.activeModifiers.some(m => m.type === 'enemy_replication')) {
                 // ... spawn static
            }
            if (prev.level !== 0 && !boss) {
                 const lvlData = prev.activeLevelConfig || getLevelData(prev.level);
                 const parsed = parseLevel(lvlData);
                 const newEnemy = spawnRandomEnemy(nextSnakeState, prev.walls, parsed.config.enemyTypes);
                 newEnemies.push(newEnemy);
                 if (!prev.isTesting) ctx.unlockCallback(newEnemy.type);
                 newCoins = [...newCoins, ...spawnCoins(Math.floor(Math.random()*3)+1, nextSnakeState, prev.walls, [])];
            }
        } else {
            if (currentBuffs.currentShields > 0) {
                currentBuffs.currentShields--;
                ctx.playSfx('shield_deflect');
                currentVfx.push({ type: 'shield_break', x: headSegment.x, y: headSegment.y });
                newEnemies.splice(headHitIndex, 1);
                // Respawn
                if (prev.level !== 0 && !boss) {
                     const lvlData = prev.activeLevelConfig || getLevelData(prev.level);
                     const parsed = parseLevel(lvlData);
                     const newEnemy = spawnRandomEnemy(nextSnakeState, prev.walls, parsed.config.enemyTypes);
                     newEnemies.push(newEnemy);
                }
            } else {
                let damageTaken = false;
                for(let i = nextSnakeState.length - 1; i > 0; i--) {
                    if (nextSnakeState[i].isCharged) { 
                        nextSnakeState[i].isCharged = false;
                        damageTaken = true; 
                        ctx.playSfx('damage');
                        currentVfx.push({ type: 'explosion', x: nextSnakeState[i].x, y: nextSnakeState[i].y, color: '#FF0033' });
                        newEnemies.splice(headHitIndex, 1); 
                        if (!ctx.seenHpTutorial) shouldTriggerHpTutorial = true;
                        
                        // Respawn
                        if (prev.level !== 0 && !boss) {
                             const lvlData = prev.activeLevelConfig || getLevelData(prev.level);
                             const parsed = parseLevel(lvlData);
                             const newEnemy = spawnRandomEnemy(nextSnakeState, prev.walls, parsed.config.enemyTypes);
                             newEnemies.push(newEnemy);
                        }

                        const agility = currentUpgrades.find(u => u.type === 'agility');
                        const integrityEcho = currentUpgrades.find(u => u.type === 'integrity_echo');
                        const bonusTime = (agility ? (agility.level * 1000) : 0) + (integrityEcho ? integrityEcho.value : 0);
                        currentBuffs.invulnerableUntil = ctx.timestamp + 2000 + bonusTime;
                        break; 
                    }
                }
                if (!damageTaken) {
                    if (prev.level === 0) return handleTutorialRespawn(prev, currentVfx, ctx, 98);
                    ctx.playSfx('wall_crash');
                    return triggerGameOver('CRITICAL FAILURE: HULL BREACH', headSegment.x, headSegment.y, [{type: 'explosion', x: headSegment.x, y: headSegment.y, color: '#F00'}]);
                }
            }
        }
    }

    // --- SELF COLLISION ---
    const selfHitIdx = nextSnakeState.findIndex((s, i) => i > 0 && i < nextSnakeState.length - 1 && s.x === headSegment.x && s.y === headSegment.y);
    if (selfHitIdx !== -1) {
        if (prev.level === 0) return handleTutorialRespawn(prev, currentVfx, ctx, 98);
        if (prev.activeModifiers.some(m => m.type === 'head_trauma')) {
             return triggerGameOver('CRASH: SELF_INTERSECTION', headSegment.x, headSegment.y, [{type: 'impact', x: headSegment.x, y: headSegment.y}]);
        } else {
             ctx.playSfx('damage');
             const cutSegment = nextSnakeState[selfHitIdx];
             currentVfx.push({ type: 'explosion', x: cutSegment.x, y: cutSegment.y, color: '#FF0033' });
             nextSnakeState = nextSnakeState.slice(0, selfHitIdx);
        }
    }

    // --- SEQUENCE & PORTALS ---
    const currentSequence: ItemType[] = nextSnakeState.filter(s => s.type === 'body' && s.isCharged && s.variant).map(s => s.variant!);
    let sequenceMatched = false;
    if (prev.requiredSequence.length > 0) {
        const reqStr = prev.requiredSequence.join(',');
        const currStr = currentSequence.join(',');
        sequenceMatched = currStr.includes(reqStr);
    }
    const prevCharged = prev.snake.filter(s => s.type === 'body' && s.isCharged && s.variant).map(s => s.variant!);
    const prevMatched = prev.requiredSequence.length > 0 && prevCharged.join(',').includes(prev.requiredSequence.join(','));
    if (!prevMatched && sequenceMatched) ctx.playSfx('sequence_match');
    
    // Apply Sequence visual flag
    nextSnakeState.forEach(s => s.isSequencePart = false);
    if (sequenceMatched) {
        const chargedBodies = nextSnakeState.filter(s => s.type === 'body' && s.isCharged && s.variant);
        for(let i=0; i <= chargedBodies.length - prev.requiredSequence.length; i++) {
            let match = true;
            for(let j=0; j < prev.requiredSequence.length; j++) { if (chargedBodies[i+j].variant !== prev.requiredSequence[j]) { match = false; break; } }
            if (match) { for(let j=0; j < prev.requiredSequence.length; j++) chargedBodies[i+j].isSequencePart = true; }
        }
    }

    // Portal Spawning Logic
    const chargedCount = currentSequence.length;
    if (chargedCount >= prev.targetIntegrity + 5 && !secretPortal && prev.level !== 0 && !boss) {
        const p = spawnPortal(nextSnakeState, prev.walls, getDistance);
        secretPortal = { ...p, createdAt: ctx.timestamp };
        ctx.playSfx('powerup'); 
    }
    if (secretPortal && ctx.timestamp - secretPortal.createdAt > 10000) secretPortal = undefined;

    if (!boss && chargedCount >= prev.targetIntegrity && !portal) {
        if (prev.level === 0) {
            if (nextTutorialStep < 6) { nextTutorialStep = 6; portal = { x: Math.floor(BOARD_WIDTH_CELLS/2), y: Math.floor(BOARD_HEIGHT_CELLS/2), createdAt: ctx.timestamp }; ctx.playSfx('sequence_match'); }
        } else {
            const spawnPos = spawnPortal(nextSnakeState, prev.walls, getDistance);
            portal = { ...spawnPos, createdAt: ctx.timestamp };
            if (prev.activeModifiers.some(m => m.type === 'portal_traps')) {
                // ... Trap logic
            }
            if (!prev.isTesting) ctx.unlockCallback('portal_vfx');
        }
    } else if (!boss && chargedCount < prev.targetIntegrity && portal) {
        portal = undefined;
    }

    // Portal Entry
    if (secretPortal && headSegment.x === secretPortal.x && headSegment.y === secretPortal.y) {
        ctx.playSfx('portal_enter');
        return {
            newState: { ...prev, status: ctx.seenEvasionTutorial ? 'evasion' : 'evasion_tutorial', secretPortal: undefined, evasionState: { playerX: 20, obstacles: [], coins: [], timer: 20000, spawnTimer: 0, gridOffset: 0, coinsCollected: 0 }, snake: nextSnakeState },
            shouldTriggerHpTutorial, nextTutorialStep, resetInput: true, vfxEvents: currentVfx
        };
    }

    if (portal && headSegment.x === portal.x && headSegment.y === portal.y) {
        if (sequenceMatched || isBossLevel) {
            ctx.playSfx('portal_enter');
            let nextStatus: GameState['status'] = 'levelup';
            if (prev.level === 0) nextStatus = 'tutorial_summary';
            const choices = (prev.level !== 0) ? generateShopChoices(currentUpgrades) : [];
            
            return {
                newState: { ...prev, snake: nextSnakeState, pickups: newPickups, enemies: newEnemies, coins: newCoins, status: nextStatus, shop: { choices, freePickAvailable: true }, portal, score: newScore, walls: newWalls, lastTrapMoveTime, secretPortal, boss: undefined },
                shouldTriggerHpTutorial, nextTutorialStep, vfxEvents: currentVfx
            };
        } else if (currentBuffs.currentShields > 0) {
            currentBuffs.currentShields--;
            ctx.playSfx('shield_deflect');
            currentVfx.push({ type: 'shield_break', x: headSegment.x, y: headSegment.y });
            nextSnakeState[0].x = currentHead.x; nextSnakeState[0].y = currentHead.y; // Bounce
        } else {
            ctx.playSfx('wall_crash');
            return triggerGameOver('CRASH: SEQUENCE MISMATCH', headSegment.x, headSegment.y, [{type: 'impact', x: headSegment.x, y: headSegment.y}]);
        }
    }

    // Coin Collection
    const cIndex = newCoins.findIndex(c => Math.round(c.x) === newHeadPosition.x && Math.round(c.y) === newHeadPosition.y);
    if (cIndex !== -1) {
        ctx.playSfx('pickup_coin');
        let val = newCoins[cIndex].value;
        if (prev.activeModifiers.some(m => m.type === 'credit_scramble') && Math.random() < 0.25) val = 0;
        newCurrency += val;
        currentVfx.push({ type: 'explosion', x: newCoins[cIndex].x, y: newCoins[cIndex].y, color: '#FFFFFF' });
        newCoins.splice(cIndex, 1);
    }

    // Auto-recalc Pending Type
    let activePendingType: ItemType | null = null;
    for (let i = nextSnakeState.length - 1; i > 0; i--) {
        const s = nextSnakeState[i];
        if (!s.isCharged && s.variant) {
            activePendingType = s.variant;
            break; 
        }
    }
    let pendingType = activePendingType;

    // Pickups Spawn
    if (prev.level !== 0 && !boss) {
        newPickups = spawnPickupsIfNeeded(newPickups, nextSnakeState, prev.walls, currentUpgrades);
    }
    if (boss && prev.level !== 0 && newPickups.filter(p => ITEM_TYPES.includes(p.itemType as any)).length < 3) {
         newPickups = spawnPickupsIfNeeded(newPickups, nextSnakeState, prev.walls, currentUpgrades);
    }

    const newState: GameState = {
        ...prev,
        snake: nextSnakeState,
        enemies: newEnemies,
        pickups: newPickups,
        coins: newCoins,
        walls: newWalls,
        score: newScore,
        currency: newCurrency,
        pendingType: pendingType,
        stats: newStats,
        buffs: currentBuffs,
        portal: portal,
        secretPortal: secretPortal,
        boss: boss,
        status: status,
        shop: shop,
        lastTrapMoveTime: lastTrapMoveTime
    };

    return { newState, shouldTriggerHpTutorial, nextTutorialStep, forcedDirection: forceDirectionUpdate, vfxEvents: currentVfx };
};
