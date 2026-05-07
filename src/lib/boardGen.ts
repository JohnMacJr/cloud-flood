import { GRID_SIZE, NUM_COLORS } from './constants';
import { dateToSeed, createRng } from './seededRandom';

/**
 * Generate an 8×8 board deterministically from a date string (YYYY-MM-DD).
 * Each cell is a color ID in [0, NUM_COLORS).
 */
export function generateBoard(dateStr: string): number[][] {
  const seed = dateToSeed(dateStr);
  const rng = createRng(seed);

  const board: number[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push(Math.floor(rng() * NUM_COLORS));
    }
    board.push(row);
  }

  return board;
}
