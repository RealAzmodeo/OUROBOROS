

import { Upgrade, DifficultyModifier, ModifierType, EnemyType, ItemType } from '../types';
import { BASE_UPGRADES, ITEM_TYPES } from '../data/constants';
import { ENEMY_DB } from '../data/enemies';

const ENEMY_TYPES: EnemyType[] = ['static', 'patrol', 'wanderer', 'chaser'];

export const ANOMALY_DB: { type: ModifierType, name: string, description: string }[] = [
    { type: 'speed_boost', name: 'System Overclock', description: 'Game Speed increased by 10%.' },
    { type: 'extra_enemy', name: 'Hostile Surge', description: 'Spawns an additional enemy type in the sector.' },
    { type: 'extra_sequence', name: 'Sequence Extension', description: 'Adds an additional required item to the sequence.' },
    { type: 'extra_integrity', name: 'Hardened Hull', description: 'Target Integrity Requirement increased by 2.' },
    { type: 'enemy_speed', name: 'Aggression Logic', description: 'Enemies move 5% faster.' },
    { type: 'portal_traps', name: 'Exit Blockade', description: 'Slipgate spawns with trap fortifications.' },
    { type: 'magnetic_wall', name: 'Magnetic Interference', description: 'Walls attract the chassis when nearby.' },
    { type: 'sequence_corruption', name: 'Data Corruption', description: 'Sequence goal is hidden from HUD.' },
    { type: 'trap_migration', name: 'Mobile Hazards', description: 'Traps relocate periodically.' },
    { type: 'flickering_matter', name: 'Phase Instability', description: 'Items flicker in and out of visibility.' },
    { type: 'rapid_decay', name: 'Entropy Field', description: 'Empty segments decay if not filled quickly.' },
    { type: 'enemy_replication', name: 'Mitosis Protocol', description: 'Killing enemies spawns Static Nodes.' },
    { type: 'head_trauma', name: 'Impact Sensitivity', description: 'Self-collision is instantly lethal.' },
    { type: 'credit_scramble', name: 'Financial Glitch', description: 'Coins have a 25% chance to grant 0 credits.' },
];

const getAnomalyDef = (type: ModifierType) => ANOMALY_DB.find(a => a.type === type)!;

const generateRandomModifier = (): DifficultyModifier => {
    const roll = Math.random();
    
    // 1. Increase Speed (10%)
    if (roll < 0.10) {
        const def = getAnomalyDef('speed_boost');
        return { type: 'speed_boost', name: def.name, description: def.description };
    }
    // 2. Extra Enemy (15%)
    if (roll < 0.25) {
        const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        const name = ENEMY_DB.find(e => e.type === type)?.name || type;
        const def = getAnomalyDef('extra_enemy');
        return { type: 'extra_enemy', name: def.name, description: `Spawn +1 ${name}`, data: type };
    }
    // 3. Extra Sequence (10%)
    if (roll < 0.35) {
        const type = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        const def = getAnomalyDef('extra_sequence');
        return { type: 'extra_sequence', name: def.name, description: `Sequence +1 ${type.toUpperCase()}`, data: type };
    }
    // 4. Integrity (10%)
    if (roll < 0.45) {
        const def = getAnomalyDef('extra_integrity');
        return { type: 'extra_integrity', name: def.name, description: def.description };
    }
    // 5. Enemy Speed (10%)
    if (roll < 0.55) {
        const def = getAnomalyDef('enemy_speed');
        return { type: 'enemy_speed', name: def.name, description: def.description };
    }
    // 6. Portal Traps (5%)
    if (roll < 0.60) {
        const def = getAnomalyDef('portal_traps');
        return { type: 'portal_traps', name: def.name, description: def.description };
    }
    
    // NEW ANOMALIES (40% pool)
    
    // 7. Magnetic Wall (5%)
    if (roll < 0.65) {
        const def = getAnomalyDef('magnetic_wall');
        return { type: 'magnetic_wall', name: def.name, description: def.description };
    }
    // 8. Sequence Corruption (5%)
    if (roll < 0.70) {
        const def = getAnomalyDef('sequence_corruption');
        return { type: 'sequence_corruption', name: def.name, description: def.description };
    }
    // 9. Trap Migration (5%)
    if (roll < 0.75) {
        const def = getAnomalyDef('trap_migration');
        return { type: 'trap_migration', name: def.name, description: def.description };
    }
    // 10. Flickering Matter (5%)
    if (roll < 0.80) {
        const def = getAnomalyDef('flickering_matter');
        return { type: 'flickering_matter', name: def.name, description: def.description };
    }
    // 11. Rapid Decay (5%)
    if (roll < 0.85) {
        const def = getAnomalyDef('rapid_decay');
        return { type: 'rapid_decay', name: def.name, description: def.description };
    }
    // 12. Enemy Replication (5%)
    if (roll < 0.90) {
        const def = getAnomalyDef('enemy_replication');
        return { type: 'enemy_replication', name: def.name, description: def.description };
    }
    // 13. Head Trauma (5%)
    if (roll < 0.95) {
        const def = getAnomalyDef('head_trauma');
        return { type: 'head_trauma', name: def.name, description: def.description };
    }
    // 14. Credit Scramble (5%)
    const def = getAnomalyDef('credit_scramble');
    return { type: 'credit_scramble', name: def.name, description: def.description };
};

/**
 * Generates a dynamic description for an upgrade card based on its current and next level.
 */
export const getUpgradeDescription = (base: any, nextLvl: number): string => {
    if (base.type === 'battery') return `Start level with ${nextLvl} charged segments.`;
    if (base.type === 'wireless') return `Matches fill ${nextLvl} extra segments.`;
    if (base.type === 'chassis') return `Max Shield Capacity: ${nextLvl}.`;
    if (base.type === 'agility') return `Invulnerability lasts ${nextLvl+1}s.`;
    if (base.type === 'magnet') return `Attracts COINS. Range ${nextLvl*2 + 3} cells.`;
    if (base.type === 'greed') return `Score multiplier +${nextLvl * 10}%.`;
    if (base.type === 'stasis') return `Spawns Golden Stasis Orbs. Freeze ${10 + (nextLvl-1)*2}s.`;
    return base.description;
};

/**
 * Generates 3 random upgrade cards based on current inventory.
 * Handles leveling up existing items or offering new ones.
 * Adds a CURSE (Difficulty Modifier) to each, ensuring uniqueness across the 3 choices.
 */
export const generateShopChoices = (currentUpgrades: Upgrade[]): Upgrade[] => {
    const shuffled = [...BASE_UPGRADES].sort(() => 0.5 - Math.random());
    const selectedBases = shuffled.slice(0, 3);
    
    // Generate 3 unique modifiers to ensure variety in the shop
    const modifiers: DifficultyModifier[] = [];
    let attempts = 0;
    while (modifiers.length < 3 && attempts < 50) {
        const mod = generateRandomModifier();
        
        // Check for duplicates:
        // We consider it a duplicate if Type AND Data match. 
        // Example: 'extra_enemy' (chaser) is different from 'extra_enemy' (static).
        // But 'speed_boost' is same as 'speed_boost'.
        const isDuplicate = modifiers.some(m => {
            if (m.type !== mod.type) return false;
            // If types are same, check data (e.g. enemy type or sequence item)
            if (m.data !== mod.data) return false;
            return true;
        });

        if (!isDuplicate) {
            modifiers.push(mod);
        }
        attempts++;
    }
    
    // Fallback if we failed to find uniques (extremely rare)
    while (modifiers.length < 3) {
        modifiers.push(generateRandomModifier());
    }
    
    const choices = selectedBases.map((base, index) => {
        const existing = currentUpgrades.find(u => u.type === base.type);
        const modifier = modifiers[index];
        
        // Case 1: Upgrade already owned
        if (existing) {
            // Case 1a: Binary upgrade (One-time purchase)
            if (existing.isBinary) {
                 return { ...existing, description: 'INSTALLED. Repair Hull +1.', level: 1, value: 0, difficultyModifier: modifier };
            }
            
            // Case 1b: Max level reached
            if (existing.level >= existing.maxLevel) {
                return { ...existing, description: 'MAX LEVEL REACHED. Repair Hull +1.', level: existing.level, value: existing.value, difficultyModifier: modifier }; 
            }

            // Case 1c: Leveled up version
            const nextLvl = existing.level + 1;
            const desc = getUpgradeDescription(base, nextLvl);
            
            return { 
                ...existing, 
                level: nextLvl,
                value: existing.value + existing.valuePerLevel,
                description: desc,
                difficultyModifier: modifier
            };
        }

        // Case 2: New Upgrade
        return { ...base, level: 1, difficultyModifier: modifier };
    });
    
    return choices;
};

/**
 * Resolves the purchase of an upgrade.
 * Returns the new list of active upgrades.
 */
export const resolveUpgradePurchase = (currentUpgrades: Upgrade[], choice: Upgrade): Upgrade[] => {
    const newUpgrades = [...currentUpgrades];
    const existingIdx = newUpgrades.findIndex(u => u.type === choice.type);
    
    // We strip the difficultyModifier before saving to activeUpgrades 
    // because modifiers are applied to GameState.activeModifiers, not the item itself permanently.
    const { difficultyModifier, ...rest } = choice;

    if (existingIdx !== -1) {
         if (newUpgrades[existingIdx].level < newUpgrades[existingIdx].maxLevel) {
             newUpgrades[existingIdx] = { ...rest } as Upgrade;
         }
    } else {
        newUpgrades.push({ ...rest } as Upgrade);
    }
    
    return newUpgrades;
};