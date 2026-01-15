
import { LevelData, BOARD_WIDTH_CELLS, BOARD_HEIGHT_CELLS } from '../../types';

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH_CELLS);
const emptyRows = (count: number) => Array(count).fill(EMPTY_ROW);

// INSTRUCTIONS:
// 1. Create a new file in 'data/maps/', e.g., 'level_07.ts'
// 2. Paste this code.
// 3. CHANGE 'id: 7' below to the correct sequential number (previous max + 1).
// 4. That's it! The game will automatically load it.

export const LEVEL_07: LevelData = {
    id: 7, // <<< ENSURE THIS IS UNIQUE AND SEQUENTIAL
    name: "level_07",
    integrity: 5,
    sequence: ['alpha', 'beta'],
    enemyCountBonus: 3,
    enemyTypes: ['static', 'patrol', 'wanderer', 'chaser'], 
    tickRate: 100,
    layout: [
        ...emptyRows(7),
        "..........####.####.....................",
        ".........#..#.##.###.#..................",
        "........#.####.....#..#.................",
        "........#.##.......#.##.................",
        "........#.#.......#.##..................",
        "........###.........#.#.................",
        ".........#.....#.....#..................",
        "........####.#....#.##..................",
        ".........###.#..#.#.#...................",
        "........#####.#..##.#...................",
        "..............#..#......................",
        "........#.......#.......................",
        "...............#........................",
        ".........##..#..........................",
        ...emptyRows(9)
    ]
};
