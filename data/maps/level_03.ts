
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

export const LEVEL_03: LevelData = {
    id: 3,
    name: "The Pillars",
    integrity: 6,
    sequence: ['alpha', 'beta'],
    enemyCountBonus: 3,
    enemyTypes: ['static', 'patrol', 'wanderer'],
    tickRate: 95,
    layout: [
        ...emptyRows(5),
        ".....##..........................##.....",
        ".....##..........................##.....",
        ...emptyRows(16),
        ".....##..........................##.....",
        ".....##..........................##.....",
        ...emptyRows(5)
    ]
};
