

import { EnemyType } from '../types';

interface EnemyConfig {
    type: EnemyType;
    name: string;
    description: string;
    color: string;
    baseSpeed: number; // Ticks per move (lower is faster)
    behavior: 'static' | 'patrol' | 'random' | 'chase' | 'boss';
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
        description: 'Actively pursues the chassis. Speed increases with threat level.',
        color: '#FF0033',
        baseSpeed: 2,
        behavior: 'chase'
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