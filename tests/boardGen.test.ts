import { describe, it, expect } from 'vitest';
import { generateBoard } from '../src/lib/boardGen';
import { GRID_SIZE, NUM_COLORS } from '../src/lib/constants';

describe('Board Generation', () => {
  it('same date generates the same board', () => {
    const board1 = generateBoard('2026-05-07');
    const board2 = generateBoard('2026-05-07');
    expect(board1).toEqual(board2);
  });

  it('different dates generate different boards', () => {
    const board1 = generateBoard('2026-05-07');
    const board2 = generateBoard('2026-05-08');
    // It's theoretically possible for two dates to collide, but extremely unlikely.
    // We check they're not identical.
    const flat1 = board1.flat().join(',');
    const flat2 = board2.flat().join(',');
    expect(flat1).not.toBe(flat2);
  });

  it('generated board is 8×8', () => {
    const board = generateBoard('2026-01-15');
    expect(board.length).toBe(GRID_SIZE);
    for (const row of board) {
      expect(row.length).toBe(GRID_SIZE);
    }
  });

  it('generated board only uses color IDs 0–4', () => {
    const board = generateBoard('2026-03-20');
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThan(NUM_COLORS);
      }
    }
  });
});
