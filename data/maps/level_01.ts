
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

export const LEVEL_01: LevelData = {
    id: 1,
    name: "Tutorial",
    integrity: 4,
    sequence: ['alpha'],
    enemyCountBonus: 2,
    enemyTypes: ['static'],
    tickRate: 100,
    layout: [
        ...emptyRows(BOARD_HEIGHT_CELLS)
    ]
};
