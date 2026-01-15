

import { LevelData, ItemType, EnemyType } from '../types';
import { ITEM_TYPES } from './constants';

// --- MANUAL IMPORTS (Fallback) ---
// We import these explicitly so the game ALWAYS works, even if auto-loading fails.
import { LEVEL_00 } from './maps/level_00';
import { LEVEL_01 } from './maps/level_01';
import { LEVEL_02 } from './maps/level_02';
import { LEVEL_03 } from './maps/level_03';
import { LEVEL_04 } from './maps/level_04';
// LEVEL_05 is overridden by BOSS_LEVEL_05
import { LEVEL_06 } from './maps/level_06';
import { LEVEL_07 } from './maps/level_07';
import { LEVEL_08 } from './maps/level_08';
import { LEVEL_09 } from './maps/level_09';

const BOSS_LEVEL_05: LevelData = { id: 5, name: "Boss: The Cipher", integrity: 5, sequence: [], enemyCountBonus: 0, enemyTypes: [], tickRate: 100, layout: [] };
const BOSS_LEVEL_10: LevelData = { id: 10, name: "Boss: Timekeeper", integrity: 5, sequence: [], enemyCountBonus: 0, enemyTypes: [], tickRate: 100, layout: [] };
const BOSS_LEVEL_15: LevelData = { id: 15, name: "Boss: Colossus", integrity: 5, sequence: [], enemyCountBonus: 0, enemyTypes: [], tickRate: 100, layout: [] };
const BOSS_LEVEL_20: LevelData = { id: 20, name: "Boss: Rival", integrity: 5, sequence: [], enemyCountBonus: 0, enemyTypes: [], tickRate: 100, layout: [] };

const MANUAL_LEVELS: LevelData[] = [
    LEVEL_00, LEVEL_01, LEVEL_02, LEVEL_03, LEVEL_04, BOSS_LEVEL_05, LEVEL_06, LEVEL_07, LEVEL_08, LEVEL_09
];

MANUAL_LEVELS.push(BOSS_LEVEL_10, BOSS_LEVEL_15, BOSS_LEVEL_20);

let AUTO_LEVELS: LevelData[] = [];

// --- STRATEGY 1: VITE (import.meta.glob) ---
try {
    // @ts-ignore
    const modules = import.meta.glob('./maps/*.ts', { eager: true });

    const viteLevels = Object.values(modules).flatMap((mod: any) => {
        return Object.values(mod).filter((val: any) =>
            val && typeof val === 'object' && 'id' in val && 'layout' in val
        ) as LevelData[];
    });

    if (viteLevels.length > 0) {
        AUTO_LEVELS = viteLevels;
    }
} catch (e) {
    // Vite loading failed or not in Vite environment
}

// --- STRATEGY 2: WEBPACK (require.context) ---
// Only try if Vite failed to find anything
if (AUTO_LEVELS.length === 0) {
    try {
        // @ts-ignore
        const context = require.context('./maps', false, /\.ts$/);
        const webpackLevels: LevelData[] = [];

        context.keys().forEach((key: string) => {
            const mod = context(key);
            // Webpack modules might export the object directly or as 'default' or named
            Object.values(mod).forEach((val: any) => {
                if (val && typeof val === 'object' && 'id' in val && 'layout' in val) {
                    webpackLevels.push(val as LevelData);
                }
            });
        });

        if (webpackLevels.length > 0) {
            AUTO_LEVELS = webpackLevels;
        }
    } catch (e) {
        // Webpack loading failed
    }
}

// --- FINAL MERGE ---
// If auto-loading found maps, use them (this allows adding new files without editing this file).
// If auto-loading returned 0 (environment issue), fallback to the manual list.
let FINAL_LEVELS = AUTO_LEVELS.length > 0 ? AUTO_LEVELS : MANUAL_LEVELS;

// Deduplicate by ID (taking the last one found if duplicates exist)
const levelMap = new Map<number, LevelData>();
FINAL_LEVELS.forEach(l => levelMap.set(l.id, l));

// Force Boss Levels into the final list if missing (for manual testing access)
if (!levelMap.has(5)) levelMap.set(5, BOSS_LEVEL_05);
if (!levelMap.has(10)) levelMap.set(10, BOSS_LEVEL_10);
if (!levelMap.has(15)) levelMap.set(15, BOSS_LEVEL_15);
if (!levelMap.has(20)) levelMap.set(20, BOSS_LEVEL_20);

export const STATIC_LEVELS: LevelData[] = Array.from(levelMap.values()).sort((a, b) => a.id - b.id);

export const CUSTOM_LEVEL_START_ID = 1000;
const STORAGE_KEY = 'neon_ouroboros_custom_maps';

export const getCustomLevels = (): LevelData[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch { return []; }
};

export const saveCustomLevel = (level: LevelData) => {
    const levels = getCustomLevels();
    const existingIdx = levels.findIndex(l => l.name === level.name);
    const cleanLevel = { ...level, id: 0 };

    if (existingIdx >= 0) {
        levels[existingIdx] = cleanLevel;
    } else {
        levels.push(cleanLevel);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
};

export const deleteCustomLevel = (index: number) => {
    const levels = getCustomLevels();
    levels.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
};

export const getLevelData = (level: number): LevelData => {
    // 0. Tutorial Level (Always ID 0)
    if (level === 0) {
        const tutorial = STATIC_LEVELS.find(l => l.id === 0);
        if (tutorial) return tutorial;

        // Fallback tutorial if file is missing/deleted
        return {
            id: 0,
            name: "Training Sim (Fallback)",
            integrity: 2,
            sequence: ['alpha', 'beta'],
            enemyCountBonus: 0,
            enemyTypes: [],
            tickRate: 150,
            layout: Array(30).fill('.'.repeat(40))
        };
    }

    // 1. Custom Levels (ID >= 1000)
    if (level >= CUSTOM_LEVEL_START_ID) {
        const customLevels = getCustomLevels();
        const index = level - CUSTOM_LEVEL_START_ID;
        if (index >= 0 && index < customLevels.length) {
            return { ...customLevels[index], id: level };
        }
        return { ...STATIC_LEVELS[0] || { layout: [], sequence: [] } as any, name: "Data Missing" };
    }

    // 2. Campaign Levels
    // Find specific static level by ID
    const template = STATIC_LEVELS.find(l => l.id === level);
    if (template) {
        const randomizedSequence: ItemType[] = [];
        // If template has explicit sequence, randomize it for replayability unless specific tutorial
        // But for consistency let's just use random for now
        const len = template.sequence.length > 0 ? template.sequence.length : 3;
        for (let i = 0; i < len; i++) {
            const randomType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
            randomizedSequence.push(randomType);
        }
        return { ...template, sequence: randomizedSequence };
    }

    // 3. Endless Mode
    // If the requested level ID is NOT in our static list, we generate it.
    // We base the difficulty on how far past the last "official" level we are.
    const lastOfficialLevelId = STATIC_LEVELS.length > 0 ? STATIC_LEVELS[STATIC_LEVELS.length - 1].id : 0;
    const endlessLevelIndex = level - lastOfficialLevelId;

    // Pick a random map layout from available maps (excluding tutorial)
    const mapPool = STATIC_LEVELS.filter(l => l.id !== 0 && l.id < 10); // Exclude boss placeholders from pool
    const mapTemplate = mapPool.length > 0
        ? mapPool[Math.floor(Math.random() * mapPool.length)]
        : { layout: Array(30).fill('.'.repeat(40)) }; // Emergency fallback

    // Scale Integrity
    const baseIntegrity = 8;
    const targetIntegrity = baseIntegrity + Math.floor(endlessLevelIndex / 2);

    // Scale Sequence Complexity
    const sequenceLength = 3 + Math.floor(endlessLevelIndex / 5);
    const sequence: ItemType[] = [];
    for (let i = 0; i < sequenceLength; i++) {
        sequence.push(ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)]);
    }

    // Scale Enemies
    const baseEnemies = 4;
    const enemyCountBonus = baseEnemies + Math.floor(endlessLevelIndex / 3);

    let enemyTypes: EnemyType[] = ['static', 'patrol', 'wanderer'];
    if (endlessLevelIndex > 2) enemyTypes.push('chaser');
    if (endlessLevelIndex > 15) enemyTypes = ['chaser', 'wanderer'];

    // Scale Speed
    const baseSpeed = 85;
    const tickRate = Math.max(40, baseSpeed - (endlessLevelIndex * 2));

    return {
        id: level,
        name: `Endless Sector ${endlessLevelIndex}`,
        integrity: targetIntegrity,
        sequence: sequence,
        layout: mapTemplate.layout,
        enemyCountBonus: enemyCountBonus,
        enemyTypes: enemyTypes,
        tickRate: tickRate
    };
};
