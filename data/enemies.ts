

import { EnemyType } from '../types';

interface EnemyConfig {
    type: EnemyType;
    name: string;
    description: string;
    color: string;
    baseSpeed: number; // Ticks per move (lower is faster)
    behavior: 'static' | 'patrol' | 'random' | 'chase' | 'boss' | 'ghost' | 'replicator' | 'splitter';
}

export const ENEMY_REGISTRY: Record<EnemyType, EnemyConfig> = {
    static: {
        type: 'static',
        name: 'Static Node',
        description: 'Stationary hazard. Contact drains charge or hull.',
        color: '#FF0033', // Red
        baseSpeed: 0,
        behavior: 'static'
    },
    patrol: {
        type: 'patrol',
        name: 'Patrol Drone',
        description: 'Moves in a fixed loop. Predictable but dangerous.',
        color: '#FF0033',
        baseSpeed: 3,
        behavior: 'patrol'
    },
    wanderer: {
        type: 'wanderer',
        name: 'Drifter',
        description: 'Moves erratically. Hard to predict.',
        color: '#FF0033',
        baseSpeed: 4,
        behavior: 'random'
    },
    chaser: {
        type: 'chaser',
        name: 'Hunter-Killer',
        description: 'Actively pursues the chassis. Improved with pathfinding.',
        color: '#FF0033',
        baseSpeed: 2,
        behavior: 'chase'
    },
    ghost: {
        type: 'ghost',
        name: 'Phantasm',
        description: 'Bypasses structural barriers. Slow but persistent.',
        color: '#AA00FF', // Purple
        baseSpeed: 5,
        behavior: 'ghost'
    },
    replicator: {
        type: 'replicator',
        name: 'Binary Spore',
        description: 'Duplicates if not neutralized quickly.',
        color: '#00FFCC', // Teal
        baseSpeed: 4,
        behavior: 'replicator'
    },
    splitter: {
        type: 'splitter',
        name: 'Fragmenter',
        description: 'Splits into multiple smaller nodes on destruction.',
        color: '#FFAA00', // Orange
        baseSpeed: 3,
        behavior: 'splitter'
    },
    boss: {
        type: 'boss',
        name: 'Sector Guardian',
        description: 'High-threat entity guarding system core.',
        color: '#FF0000',
        baseSpeed: 0,
        behavior: 'boss'
    }
};

export const ENEMY_DB = Object.values(ENEMY_REGISTRY);