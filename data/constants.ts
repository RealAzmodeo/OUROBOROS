
import { Upgrade, ItemType } from '../types';

export const BASE_UPGRADES: Omit<Upgrade, 'level'>[] = [
    // --- SCALABLE UPGRADES (Levels 1-5) ---
    { id: 'battery', name: 'Reserve Power', description: 'Start level with +1 charged segment per level.', type: 'battery', maxLevel: 5, value: 1, valuePerLevel: 1 },
    { id: 'wireless', name: 'Harmonic Resonance', description: 'Matches fill +1 extra segments per level.', type: 'wireless', maxLevel: 3, value: 1, valuePerLevel: 1 },
    { id: 'chassis', name: 'Shield Generator', description: 'Max Shield Capacity increased by +1.', type: 'chassis', maxLevel: 5, value: 1, valuePerLevel: 1 },
    { id: 'agility', name: 'Nano Thrusters', description: 'Invulnerability lasts +1s longer per level.', type: 'agility', maxLevel: 5, value: 2000, valuePerLevel: 1000 },
    { id: 'magnet', name: 'Attractor Beam', description: 'Attracts COINS only. Range +3 cells/level.', type: 'magnet', maxLevel: 5, value: 3, valuePerLevel: 2 },
    { id: 'greed', name: 'Data Miner', description: 'Score multiplier increased by +10% per level.', type: 'greed', maxLevel: 5, value: 10, valuePerLevel: 10 },
    { id: 'stasis', name: 'Stasis Field', description: 'Spawns Golden Stasis Orbs. Freeze time increases per level.', type: 'stasis', maxLevel: 3, value: 10000, valuePerLevel: 2000 },
    
    // --- NEW UPGRADES ---
    { id: 'harvester_alpha', name: 'Residue Harvester α', description: 'Collecting Alpha (Circle) grants +1 Credit.', type: 'harvester_alpha', maxLevel: 5, value: 1, valuePerLevel: 1 },
    { id: 'velocity_sync', name: 'Velocity Sync', description: 'Press [SHIFT] to reduce speed. Level inc duration & cooldown.', type: 'velocity_sync', maxLevel: 5, value: 10, valuePerLevel: 5 },
    { id: 'integrity_echo', name: 'Integrity Echo', description: 'Taking damage grants +0.5s extra immunity.', type: 'integrity_echo', maxLevel: 5, value: 500, valuePerLevel: 250 },
    { id: 'replicator', name: 'Matter Replicator', description: '10% Chance to spawn random matter nearby when charging.', type: 'replicator', maxLevel: 5, value: 10, valuePerLevel: 10 },

    // --- BINARY UPGRADES (Max Level 1) ---
    { id: 'volatile', name: 'Volatile Core', description: 'Collect 3 Beta (Square) to EMP enemies.', type: 'volatile', maxLevel: 1, value: 1, valuePerLevel: 0, isBinary: true },
    { id: 'phase', name: 'Phase Shift', description: 'Collect 3 Alpha (Circle) for Invulnerability.', type: 'phase', maxLevel: 1, value: 1, valuePerLevel: 0, isBinary: true },
    { id: 'weaver', name: 'Matter Weaver', description: 'Collect 3 Gamma (Diamond) to Repair Hull.', type: 'weaver', maxLevel: 1, value: 1, valuePerLevel: 0, isBinary: true },
    { id: 'stabilizer', name: 'Hull Stabilizer', description: 'Wall impacts only destroy charge, not fatal.', type: 'stabilizer', maxLevel: 1, value: 1, valuePerLevel: 0, isBinary: true },
    { id: 'focus', name: 'Targeting System', description: 'Visual guide to next required item.', type: 'focus', maxLevel: 1, value: 1, valuePerLevel: 0, isBinary: true },
];

export const MECHANIC_DB = [
    { id: 'alpha', name: 'Alpha Matter', description: 'Primary resource (Circle). Used for growth.' },
    { id: 'beta', name: 'Beta Matter', description: 'Secondary resource (Square). Used for growth.' },
    { id: 'gamma', name: 'Gamma Matter', description: 'Tertiary resource (Diamond). Used for growth.' },
    { id: 'stasis_orb', name: 'Stasis Orb', description: 'Temporarily freezes all enemies.' },
    { id: 'portal', name: 'Slipgate', description: 'Exit level. Requires specific matter sequence match.' },
    { id: 'shield', name: 'Shield Charge', description: 'A consumable layer of protection.' },
];

export const VFX_DB = [
    { id: 'explosion', name: 'Bit Fragmentation', description: 'Visual data corruption occurring when an entity is destroyed. Debris fades into the grid.' },
    { id: 'portal_vfx', name: 'Slipgate Stability', description: 'When the sequence matches, the portal emits stable data packets (particles) indicating a secure connection.' },
    { id: 'crt', name: 'Cathode Ray Filter', description: 'A post-processing layer simulating the scanlines and chromatic aberration of vintage display hardware.' },
    { id: 'stasis_field', name: 'Chronal Distortion', description: 'Gold particle suspension representing time dilation around hostile entities.' },
    { id: 'trail', name: 'Motion Echo', description: 'Residual light trails left by high-speed movement of hostile units.' },
    { id: 'coin_rotate', name: 'Credit Spin', description: '2D Rotation effect for currency items, simulating data chip activity.' },
    { id: 'pickup_sparkle', name: 'Matter Resonance', description: 'Particles emitting from collectable items to indicate their unstable but usable state.' },
    { id: 'shield_orbitals', name: 'Defensive Orbitals', description: 'Orbiting energy nodes representing active shield layers.' },
    { id: 'targeting_arrow', name: 'Navigational Beacon', description: 'Heads-up display indicator pointing towards the next objective.' },
    { id: 'invulnerability', name: 'Phase Shift', description: 'Visual glitching and opacity oscillation indicating temporary immunity to collision damage.' },
    { id: 'grid_warp', name: 'Grid Warping', description: 'Gravitational lensing effect applied to the virtual grid, simulating heavy mass or energy density.' },
    { id: 'digital_rain', name: 'Data Cascade', description: 'Vertical streams of raw binary and hex data, representing the underlying code matrix.' }
];

export const ITEM_TYPES: ItemType[] = ['alpha', 'beta', 'gamma'];
