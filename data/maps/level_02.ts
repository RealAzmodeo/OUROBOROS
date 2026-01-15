
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

export const LEVEL_02: LevelData = {
    id: 2,
    name: "The Trap",
    integrity: 5,
    sequence: ['beta', 'beta'],
    enemyCountBonus: 2,
    enemyTypes: ['static', 'patrol'],
    tickRate: 100,
    layout: [
        ...emptyRows(10),
        "..........TTTTTT........TTTTTT..........", 
        "..........T..................T..........",
        "..........T.......####.......T..........",
        "..........T.......####.......T..........",
        "..........T.......####.......T..........",
        "..........T.......####.......T..........",
        "..........T..................T..........",
        "..........TTTTTT........TTTTTT..........",
        ...emptyRows(10)
    ]
};
