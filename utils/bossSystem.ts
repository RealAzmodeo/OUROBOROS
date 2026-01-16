

import { Boss, BossType, GameState, Point, ItemType, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, VfxEvent, Segment } from '../types';
import { ITEM_TYPES } from '../data/constants';
import { getDistance, isPointInPolygon, checkCollisionWithWalls } from './geometry';

// Boss Constants
const BOSS_TYPES: BossType[] = ['cipher', 'timekeeper', 'colossus', 'rival'];

export const spawnBoss = (level: number): Boss => {
    // Determine boss based on level (Cycle: 5->Cipher, 10->Timekeeper, 15->Colossus, 20->Rival)
    const cycleIndex = (Math.floor(level / 5) - 1) % BOSS_TYPES.length;
    const type = BOSS_TYPES[cycleIndex];

    // Spawn Boss on the RIGHT side (30, 15) to duel Player on LEFT (3, 15)
    const cx = 30;
    const cy = Math.floor(BOARD_HEIGHT_CELLS / 2); // 15

    let boss: Boss = {
        id: `boss-${level}`,
        name: "UNKNOWN",
        type,
        x: cx,
        y: cy,
        hp: 3,
        maxHp: 3,
        phase: 1,
        width: 2,
        height: 2,
        lastMove: 0
    };

    switch (type) {
        case 'cipher':
            boss.name = "THE CIPHER";
            boss.hp = 3;
            boss.maxHp = 3;
            boss.requiredSequence = generateRandomSequence(3);
            // Start small (2x2)
            boss.width = 2;
            boss.height = 2;
            break;
        case 'timekeeper':
            boss.name = "THE TIMEKEEPER";
            boss.hp = 5; // Needs to collect 5 anchors
            boss.maxHp = 5;
            boss.nextSpawnTime = 0;
            break;
        case 'colossus':
            boss.name = "THE COLOSSUS";
            boss.hp = 100; // Depletes rapidly when encircled
            boss.maxHp = 100;
            boss.width = 4;
            boss.height = 4;
            // Center the 4x4 mass on (30, 15) -> top-left at (28, 13)
            boss.x = cx - 2;
            boss.y = cy - 2;
            break;
        case 'rival':
            boss.name = "THE RIVAL";
            boss.hp = 10; // First to 10
            boss.maxHp = 10;
            boss.rivalScore = 0;
            boss.width = 1;
            boss.height = 1;
            // Rival spawns slightly offset but still on right
            boss.x = 32;
            boss.y = 10;
            break;
    }

    return boss;
};

const generateRandomSequence = (length: number): ItemType[] => {
    const seq: ItemType[] = [];
    for (let i = 0; i < length; i++) {
        seq.push(ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)]);
    }
    return seq;
};

// Returns updated boss and any VFX events
export const updateBoss = (
    state: GameState,
    playerHead: Point,
    timestamp: number,
    playSfx: (key: string) => void
): { boss: Boss | undefined, vfx: VfxEvent[], pickupsToAdd: any[], damageToPlayer: number, isBossDead: boolean } => {

    if (!state.boss) return { boss: undefined, vfx: [], pickupsToAdd: [], damageToPlayer: 0, isBossDead: false };

    let boss = { ...state.boss };
    const vfx: VfxEvent[] = [];
    const pickupsToAdd: any[] = [];
    let damageToPlayer = 0;
    let isBossDead = false;

    // Calculate Boss Center for accurate positioning
    const bossCenter = {
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height / 2
    };

    // Helper: Check AABB Collision (More accurate than center distance for square entities)
    const checkAABB = (ent1: { x: number, y: number, width: number, height: number }, ent2: { x: number, y: number, width: number, height: number }) => {
        // Simple AABB overlap
        return (
            ent1.x < ent2.x + ent2.width &&
            ent1.x + ent1.width > ent2.x &&
            ent1.y < ent2.y + ent2.height &&
            ent1.y + ent1.height > ent2.y
        );
    };

    // --- LOGIC PER BOSS TYPE ---

    // 1. THE CIPHER (Chases player if invincible, Flees if vulnerable. Speed increases with damage.)
    if (boss.type === 'cipher') {
        // A. Determine Vulnerability Status first to dictate movement
        let isVulnerable = false;

        const chargedSegments = state.snake
            .filter(s => s.type === 'body' && s.isCharged && s.variant)
            .map(s => s.variant!);

        if (chargedSegments.length >= (boss.requiredSequence?.length || 3)) {
            const tailSeq = chargedSegments.slice(-(boss.requiredSequence!.length));
            const match = tailSeq.every((val, i) => val === boss.requiredSequence![i]);
            if (match) isVulnerable = true;
        }

        // B. Dynamic Speed based on HP (Damage makes it FASTER)
        const stepMap: Record<number, number> = {
            3: 0.25, // Slow
            2: 0.50, // Much faster
            1: 0.85  // Very fast
        };
        const stepSize = stepMap[boss.hp] ?? 0.25;

        // C. Movement AI (Move every tick based on step size)
        // 0 delay means smooth float movement on every update cycle
        if (timestamp - boss.lastMove >= 0) {
            const dx = playerHead.x - boss.x;
            const dy = playerHead.y - boss.y;
            let moveX = 0;
            let moveY = 0;

            if (Math.abs(dx) > Math.abs(dy)) {
                moveX = Math.sign(dx);
            } else {
                moveY = Math.sign(dy);
            }

            if (isVulnerable) {
                // ESCAPE MODE: Move away from player
                moveX *= -1;
                moveY *= -1;

                // Jitter to avoid corner traps
                if (Math.random() > 0.8) {
                    if (moveX !== 0) { moveY = (Math.random() > 0.5 ? 1 : -1); moveX = 0; }
                    else { moveX = (Math.random() > 0.5 ? 1 : -1); moveY = 0; }
                }
            }

            // Apply movement
            let nextX = boss.x + (moveX * stepSize);
            let nextY = boss.y + (moveY * stepSize);

            // Clamp to board boundaries
            nextX = Math.max(1, Math.min(BOARD_WIDTH_CELLS - boss.width - 1, nextX));
            nextY = Math.max(1, Math.min(BOARD_HEIGHT_CELLS - boss.height - 1, nextY));

            boss.x = nextX;
            boss.y = nextY;
            boss.lastMove = timestamp;
        }

        // D. Collision/Damage Logic (AABB)
        // Using a slightly smaller hitbox for the player to feel fair
        const playerBox = { x: playerHead.x + 0.2, y: playerHead.y + 0.2, width: 0.6, height: 0.6 };
        const bossBox = { x: boss.x + 0.1, y: boss.y + 0.1, width: boss.width - 0.2, height: boss.height - 0.2 };

        if (checkAABB(playerBox, bossBox)) {
            if (isVulnerable) {
                // --- PLAYER DAMAGES BOSS ---
                boss.hp--;
                playSfx('explosion');
                vfx.push({ type: 'shockwave', x: bossCenter.x, y: bossCenter.y, color: '#FF0000' });
                vfx.push({ type: 'explosion', x: bossCenter.x, y: bossCenter.y, color: '#FF0000' });

                if (boss.hp <= 0) {
                    isBossDead = true;
                } else {
                    // BOSS stays same size but resets sequence

                    // Reroll Sequence (Shields UP)
                    boss.requiredSequence = generateRandomSequence(3);

                    // TELEPORT AWAY
                    let safe = false;
                    let attempts = 0;
                    while (!safe && attempts < 50) {
                        const margin = 2;
                        const maxX = BOARD_WIDTH_CELLS - boss.width - margin;
                        const maxY = BOARD_HEIGHT_CELLS - boss.height - margin;

                        const randX = Math.floor(Math.random() * (maxX - margin)) + margin;
                        const randY = Math.floor(Math.random() * (maxY - margin)) + margin;

                        // Check distance (> 15 tiles away)
                        if (getDistance({ x: randX, y: randY }, playerHead) > 15) {
                            boss.x = randX;
                            boss.y = randY;
                            safe = true;
                        }
                        attempts++;
                    }
                    if (!safe) {
                        // Fallback teleport to center if logic fails
                        boss.x = 20; boss.y = 15;
                    }

                    vfx.push({ type: 'emp', x: playerHead.x, y: playerHead.y });
                }
            } else {
                // --- BOSS DAMAGES PLAYER (Shields Up) ---
                damageToPlayer = 1; // Explicit damage signal

                // NO RECOIL: Boss stays on course or simply continues
                // This prevents the "pushing" feeling reported by the user

                vfx.push({ type: 'shield_break', x: (playerHead.x + bossCenter.x) / 2, y: (playerHead.y + bossCenter.y) / 2 });
            }
        }
    }

    // 2. THE TIMEKEEPER (Spawns Anchors. Teleports)
    else if (boss.type === 'timekeeper') {
        // Spawn logic / Teleport
        if (!boss.nextSpawnTime || timestamp > boss.nextSpawnTime) {
            const count = 3;
            for (let i = 0; i < count; i++) {
                pickupsToAdd.push({
                    id: `anchor-${timestamp}-${i}`,
                    x: Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 2)) + 1,
                    y: Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 2)) + 1,
                    itemType: 'chronos_anchor',
                    expiresAt: timestamp + 8000 // 8 seconds to collect
                });
            }
            boss.nextSpawnTime = timestamp + 4000; // Faster teleport (4s instead of 10s)

            // Teleport boss random
            boss.x = Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 4)) + 2;
            boss.y = Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 4)) + 2;
            playSfx('portal_enter');
            vfx.push({ type: 'emp', x: boss.x, y: boss.y });
        }

        // Check expired anchors
        const expired = state.pickups.filter(p => p.itemType === 'chronos_anchor' && p.expiresAt && p.expiresAt < timestamp);
        if (expired.length > 0) {
            damageToPlayer = 1 * expired.length; // Damage for missed anchors
            vfx.push({ type: 'shield_break', x: playerHead.x, y: playerHead.y });
        }
    }

    // 3. THE COLOSSUS (Encircle check)
    else if (boss.type === 'colossus') {
        // Check if player snake creates a polygon around boss center
        // Only if snake is long enough
        if (state.snake.length > 15) {
            const polygon = state.snake.map(s => ({ x: s.x, y: s.y }));
            // Simple bounding box check first for optimization
            const minX = Math.min(...polygon.map(p => p.x));
            const maxX = Math.max(...polygon.map(p => p.x));
            const minY = Math.min(...polygon.map(p => p.y));
            const maxY = Math.max(...polygon.map(p => p.y));

            if (bossCenter.x > minX && bossCenter.x < maxX && bossCenter.y > minY && bossCenter.y < maxY) {
                if (isPointInPolygon(bossCenter, polygon)) {
                    boss.hp -= 1; // Drain fast per tick
                    vfx.push({ type: 'impact', x: boss.x + Math.random() * boss.width, y: boss.y + Math.random() * boss.height, color: '#FFA500' });
                    if (timestamp % 200 === 0) playSfx('damage');

                    if (boss.hp <= 0) isBossDead = true;
                }
            }
        }

        // Colossus pulses damage if you touch it
        const playerBox = { x: playerHead.x, y: playerHead.y, width: 1, height: 1 };
        const bossBox = { x: boss.x, y: boss.y, width: boss.width, height: boss.height };

        if (checkAABB(playerBox, bossBox)) {
            damageToPlayer = 1;
        }
    }

    // 4. THE RIVAL (Race)
    else if (boss.type === 'rival') {
        // Spawn Omega Particles if low
        const omegas = state.pickups.filter(p => p.itemType === 'omega_particle');
        if (omegas.length < 3) {
            pickupsToAdd.push({
                id: `omega-${timestamp}`,
                x: Math.floor(Math.random() * (BOARD_WIDTH_CELLS - 2)) + 1,
                y: Math.floor(Math.random() * (BOARD_HEIGHT_CELLS - 2)) + 1,
                itemType: 'omega_particle'
            });
        }

        // AI Movement (Grid Based)
        // Move every 120ms (slightly faster)
        if (timestamp - boss.lastMove > 120) {
            let target = omegas[0];
            let minDist = Infinity;
            omegas.forEach(o => {
                const d = getDistance(boss, o);
                if (d < minDist) { minDist = d; target = o; }
            });

            if (target) {
                let dx = target.x - boss.x;
                let dy = target.y - boss.y;
                let stepX = 0;
                let stepY = 0;

                // Simple grid chase
                if (Math.abs(dx) > Math.abs(dy)) {
                    stepX = Math.sign(dx);
                } else {
                    stepY = Math.sign(dy);
                }

                // Set position (Integer snap)
                boss.x = Math.round(boss.x + stepX);
                boss.y = Math.round(boss.y + stepY);
                boss.lastMove = timestamp;
            }
        }

        // Pickup Check
        const hitOmega = omegas.find(o => Math.round(o.x) === boss.x && Math.round(o.y) === boss.y);
        if (hitOmega) {
            boss.rivalScore = (boss.rivalScore || 0) + 1;
            playSfx('pickup_bad');
            // Cleanup handled in gameLogic loop usually, but for Rival we force removal logic there
        }

        if ((boss.rivalScore || 0) >= 10) {
            // Boss Wins -> Player Dies
            damageToPlayer = 999;
        }
    }

    return { boss, vfx, pickupsToAdd, damageToPlayer, isBossDead };
};