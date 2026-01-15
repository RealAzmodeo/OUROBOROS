
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

export const LEVEL_00: LevelData = {
    id: 0,
    name: "Training Sim",
    integrity: 2,
    sequence: ['alpha', 'beta'],
    enemyCountBonus: 0,
    enemyTypes: [],
    tickRate: 150, // Slower for tutorial
    layout: [
        ...emptyRows(BOARD_HEIGHT_CELLS)
    ]
};
