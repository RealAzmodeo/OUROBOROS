
import { useCallback } from 'react';
import { GameState, Upgrade, LevelData, Segment, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS, DifficultyModifier } from '../types';
import { getLevelData } from '../data/levels';
import { parseLevel } from '../utils/levelParser';
import { spawnRandomEnemy, createEnemy } from '../utils/enemySystem';
import { spawnPickupsIfNeeded, spawnCoins, findSafeSnakePosition } from '../utils/spawning';
import { resolveUpgradePurchase, generateShopChoices } from '../utils/shopSystem';
import { getDistance } from '../utils/geometry';
import { audio } from '../utils/audio';
import { spawnBoss } from '../utils/bossSystem';

// Constants needed
const CARD_COST = 200;
const REROLL_COST = 50;

export const useGameActions = (
    setGameState: (updater: (prev: GameState) => GameState) => void,
    unlock: (...ids: string[]) => void,
    resetInput: (dir?: { x: number, y: number }) => void,
    setCountdown: (val: number) => void,
    setTutorialStep: (step: number) => void,
    setLastShownStep: (step: number) => void,
    setTutorialInputHistory: (s: Set<string>) => void,
    setShowTutorialMsg: (val: boolean) => void,
    highScore: number
) => {

    const initializeLevel = useCallback((levelData: LevelData, existingUpgrades: Upgrade[], activeModifiers: DifficultyModifier[], existingScore: number, existingCurrency: number, isTestMode: boolean) => {
        let parsedLevel = parseLevel(levelData);

        // BOSS LEVEL LOGIC
        // Every 5th level is a boss level (5, 10, 15...)
        const isBossLevel = levelData.id % 5 === 0 && levelData.id !== 0 && !isTestMode;
        let boss = undefined;

        if (isBossLevel) {
            // Override map layout to be empty arena
            const emptyLayout = Array(BOARD_HEIGHT_CELLS).fill('.'.repeat(BOARD_WIDTH_CELLS));
            // Add border walls
            emptyLayout[0] = '#'.repeat(BOARD_WIDTH_CELLS);
            emptyLayout[BOARD_HEIGHT_CELLS - 1] = '#'.repeat(BOARD_WIDTH_CELLS);
            for (let i = 1; i < BOARD_HEIGHT_CELLS - 1; i++) {
                emptyLayout[i] = '#' + '.'.repeat(BOARD_WIDTH_CELLS - 2) + '#';
            }

            parsedLevel = parseLevel({
                ...levelData,
                layout: emptyLayout,
                enemyCountBonus: 0,
                enemyTypes: []
            });

            boss = spawnBoss(levelData.id);
        }

        const battery = existingUpgrades.find(u => u.type === 'battery');
        const batteryLevel = battery ? battery.level : 0;
        const shieldUpgrade = existingUpgrades.find(u => u.type === 'chassis');
        const startShields = shieldUpgrade ? shieldUpgrade.level : 0;

        let tickRate = parsedLevel.config.tickRate;
        // GLOBAL SPEED ADJUSTMENT: 2.2x multiplier for much slower gameplay
        tickRate = Math.floor(tickRate * 2.2);

        if (levelData.id > 1 && !isTestMode) {
            const speedIncreaseFactor = Math.pow(1.03, levelData.id - 1);
            tickRate = tickRate / speedIncreaseFactor;
        }

        let targetIntegrity = parsedLevel.config.integrity;
        let sequence = [...parsedLevel.config.sequence];
        let extraEnemies: any[] = [];
        let enemySpeedMult = 1.0;

        activeModifiers.forEach(mod => {
            if (mod.type === 'speed_boost') {
                tickRate = Math.max(30, tickRate * 0.9);
            } else if (mod.type === 'extra_integrity') {
                targetIntegrity += 2;
            } else if (mod.type === 'extra_sequence') {
                sequence.push(mod.data);
            } else if (mod.type === 'enemy_speed') {
                enemySpeedMult *= 0.95;
            } else if (mod.type === 'extra_enemy') {
                extraEnemies.push(mod.data);
            }
        });

        // SPAWN LOGIC
        // If Boss level, force spawn in corner to avoid Colossus/Boss overlap
        let startPos = { x: 0, y: 0 };
        if (isBossLevel) {
            startPos = { x: 4, y: 4 }; // Top Left safe corner
        } else {
            startPos = findSafeSnakePosition(parsedLevel.walls, parsedLevel.enemies);
        }

        const startSnake: Segment[] = [
            { id: 'h', x: startPos.x, y: startPos.y, isCharged: false, type: 'head' }
        ];

        if (batteryLevel > 0) {
            for (let i = 0; i < batteryLevel; i++) {
                // If boss level, grow tail downwards or right, away from walls
                const tailX = isBossLevel ? startPos.x : startPos.x - (i + 1);
                const tailY = isBossLevel ? startPos.y + (i + 1) : startPos.y;
                startSnake.push({ id: `b-init-${i}`, x: tailX, y: tailY, isCharged: true, type: 'body', variant: 'alpha' });
            }
        }

        const validPreplacedEnemies = parsedLevel.enemies.filter(e => {
            return getDistance(startSnake[0], e) > 5;
        });

        const randomEnemies = Array(parsedLevel.config.enemyCountBonus).fill(null).map(() => {
            const e = spawnRandomEnemy(startSnake, parsedLevel.walls, parsedLevel.config.enemyTypes);
            if (!isTestMode) unlock(e.type);
            return e;
        });

        const modEnemies = extraEnemies.map(type => {
            const e = createEnemy(type, 0, 0, 'curse-enemy');
            let valid = false;
            let attempts = 0;
            while (!valid && attempts < 20) {
                e.x = Math.floor(Math.random() * BOARD_WIDTH_CELLS);
                e.y = Math.floor(Math.random() * BOARD_HEIGHT_CELLS);
                const dist = getDistance(startSnake[0], e);
                if (dist > 10) valid = true;
                attempts++;
            }
            return e;
        });

        const allEnemies = [...validPreplacedEnemies, ...randomEnemies, ...modEnemies];

        allEnemies.forEach(e => {
            if (e.moveSpeed > 0) {
                e.moveSpeed = Math.max(1, Math.floor(e.moveSpeed * enemySpeedMult));
            }
        });

        if (!isTestMode) parsedLevel.enemies.forEach(e => unlock(e.type));

        // Reset Tutorial State
        setTutorialStep(-1);
        setLastShownStep(-1);
        setTutorialInputHistory(new Set());
        setShowTutorialMsg(false);

        setGameState(prev => ({
            ...prev,
            snake: startSnake,
            enemies: allEnemies,
            pickups: (levelData.id === 0) ? [] : spawnPickupsIfNeeded([], startSnake, parsedLevel.walls, existingUpgrades),
            coins: (levelData.id === 0) ? [] : spawnCoins(10, startSnake, parsedLevel.walls),
            particles: [],
            walls: parsedLevel.walls,
            score: existingScore,
            highScore: highScore,
            currency: existingCurrency,
            status: 'countdown',
            level: levelData.id,
            targetIntegrity: targetIntegrity,
            activeUpgrades: existingUpgrades,
            activeModifiers: activeModifiers,
            portal: undefined,
            boss: boss,
            pendingType: null,
            stats: { alphaChain: 0, betaCount: 0, gammaCount: 0 },
            tickRate: tickRate,
            activeLevelConfig: levelData,
            isTesting: isTestMode,
            comboMeter: 0,
            adrenalineMult: 1,
            shakeMagnitude: 0
        }));

        setCountdown(3);
        // Start moving right by default
        resetInput({ x: 1, y: 0 });
    }, [setGameState, setCountdown, resetInput, unlock, highScore, setTutorialStep, setLastShownStep, setTutorialInputHistory, setShowTutorialMsg]);

    const startLevel = useCallback((level: number, existingUpgrades: Upgrade[], activeModifiers: DifficultyModifier[], existingScore: number, existingCurrency: number) => {
        const levelData = getLevelData(level);
        initializeLevel(levelData, existingUpgrades, activeModifiers, existingScore, existingCurrency, false);
    }, [initializeLevel]);

    const selectUpgrade = useCallback((gameState: GameState, upgradeChoice: Upgrade) => {
        const isFree = gameState.shop.freePickAvailable;
        const cost = isFree ? 0 : CARD_COST;

        if (!isFree && gameState.currency < cost) return;

        audio.play('ui_select');
        const newUpgrades = resolveUpgradePurchase(gameState.activeUpgrades, upgradeChoice);

        const newModifiers = [...gameState.activeModifiers];
        if (upgradeChoice.difficultyModifier) {
            newModifiers.push(upgradeChoice.difficultyModifier);
            unlock(upgradeChoice.difficultyModifier.type);
        }

        const nextLevelChoices = gameState.shop.choices.map(c => {
            if (c.type === upgradeChoice.type && !c.isBinary && c.level < c.maxLevel) {
                const nextLvl = c.level + 1;
                return { ...c, level: nextLvl, description: "UPGRADED" };
            }
            return c;
        });

        setGameState(prev => ({
            ...prev,
            currency: prev.currency - cost,
            activeUpgrades: newUpgrades,
            activeModifiers: newModifiers,
            shop: { ...prev.shop, freePickAvailable: false, choices: nextLevelChoices }
        }));
    }, [setGameState, unlock]);

    const rerollShop = useCallback((gameState: GameState) => {
        if (gameState.currency >= REROLL_COST) {
            audio.play('ui_select');
            setGameState(prev => ({
                ...prev,
                currency: prev.currency - REROLL_COST,
                shop: { ...prev.shop, choices: generateShopChoices(prev.activeUpgrades) }
            }));
        }
    }, [setGameState]);

    const handleAbility = useCallback(() => {
        setGameState(prev => {
            if (prev.status !== 'playing') return prev;

            const now = Date.now();
            const syncUpgrade = prev.activeUpgrades.find(u => u.type === 'velocity_sync');

            if (syncUpgrade) {
                if (now >= prev.buffs.velocitySyncCooldownUntil) {
                    const duration = 3000;
                    const cdTime = 5000 - ((syncUpgrade.level - 1) * 750);
                    audio.play('powerup');
                    return {
                        ...prev,
                        buffs: {
                            ...prev.buffs,
                            velocitySyncActiveUntil: now + duration,
                            velocitySyncCooldownUntil: now + duration + cdTime
                        }
                    };
                }
            }
            return prev;
        });
    }, [setGameState]);

    const handleDash = useCallback(() => {
        setGameState(prev => {
            if (prev.status !== 'playing') return prev;
            const now = Date.now();
            if (now < prev.buffs.dashCooldownUntil) return prev;

            audio.play('powerup');
            return {
                ...prev,
                buffs: {
                    ...prev.buffs,
                    dashActiveUntil: now + 300,
                    dashCooldownUntil: now + 5000 // 5s cooldown for experiment
                },
                shakeMagnitude: 10 // Kick off a shake
            };
        });
    }, [setGameState]);

    const startEvasionDebug = useCallback((seenEvasionTutorial: boolean) => {
        resetInput({ x: 0, y: 0 });
        const nextStatus = seenEvasionTutorial ? 'evasion' : 'evasion_tutorial';
        setGameState(prev => ({
            ...prev,
            snake: [{ id: 'h', x: 20, y: 15, isCharged: false, type: 'head' }],
            enemies: [],
            pickups: [],
            coins: [],
            particles: [],
            walls: [],
            score: 0,
            currency: 500,
            activeUpgrades: [],
            activeModifiers: [],
            status: nextStatus,
            level: 1,
            targetIntegrity: 5,
            requiredSequence: ['alpha'],
            buffs: {
                invulnerableUntil: 0,
                stasisUntil: 0,
                currentShields: 0,
                velocitySyncActiveUntil: 0,
                velocitySyncCooldownUntil: 0,
                dashActiveUntil: 0,
                dashCooldownUntil: 0
            },
            stats: { alphaChain: 0, betaCount: 0, gammaCount: 0 },
            shop: { choices: [], freePickAvailable: false },
            isTesting: true,
            evasionLevel: 1,
            comboMeter: 0,
            adrenalineMult: 1,
            shakeMagnitude: 0,
            evasionState: {
                playerX: Math.floor(BOARD_WIDTH_CELLS / 2),
                obstacles: [],
                coins: [],
                timer: 20000,
                spawnTimer: 0,
                gridOffset: 0,
                coinsCollected: 0
            }
        }));
        audio.play('portal_enter');
    }, [setGameState, resetInput]);

    return {
        initializeLevel,
        startLevel,
        selectUpgrade,
        rerollShop,
        handleAbility,
        handleDash,
        startEvasionDebug
    };
}
