
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

export const LEVEL_04: LevelData = {
    id: 4,
    name: "Corridor",
    integrity: 7,
    sequence: ['gamma', 'alpha'],
    enemyCountBonus: 3,
    enemyTypes: ['static', 'patrol', 'wanderer'],
    tickRate: 90,
    layout: [
        ...emptyRows(10),
        "##########....................##########",
        ...emptyRows(8),
        "##########....................##########",
        ...emptyRows(10)
    ]
};
