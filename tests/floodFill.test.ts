import { describe, it, expect } from 'vitest';
import {
  getFloodRegion,
  applyMove,
  isSolved,
  getCapturedColor,
} from '../src/lib/floodFill';

describe('Flood Fill', () => {
  it('captures adjacent matching tiles', () => {
    // Board where top-left 2×2 is color 0
    const board = [
      [0, 0, 1, 1, 2, 2, 3, 3],
      [0, 0, 1, 1, 2, 2, 3, 3],
      [1, 1, 2, 2, 3, 3, 4, 4],
      [1, 1, 2, 2, 3, 3, 4, 4],
      [2, 2, 3, 3, 4, 4, 0, 0],
      [2, 2, 3, 3, 4, 4, 0, 0],
      [3, 3, 4, 4, 0, 0, 1, 1],
      [3, 3, 4, 4, 0, 0, 1, 1],
    ];

    const region = getFloodRegion(board, 0, 0);
    expect(region.size).toBe(4); // top-left 2×2
    expect(region.has('0,0')).toBe(true);
    expect(region.has('0,1')).toBe(true);
    expect(region.has('1,0')).toBe(true);
    expect(region.has('1,1')).toBe(true);
  });

  it('flood fill absorbs newly adjacent tiles after a move', () => {
    // Color 0 at (0,0), color 1 at (0,1) and (0,2)
    // After choosing color 1, the region should include (0,0), (0,1), (0,2)
    const board = [
      [0, 1, 1, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2],
    ];

    const newBoard = applyMove(board, 1);
    // After move, (0,0), (0,1), (0,2) should all be color 1
    expect(newBoard[0][0]).toBe(1);
    expect(newBoard[0][1]).toBe(1);
    expect(newBoard[0][2]).toBe(1);

    // The flood region from (0,0) should now be at least 3
    const region = getFloodRegion(newBoard, 0, 0);
    expect(region.size).toBeGreaterThanOrEqual(3);
  });

  it('selecting the current color does not change the board', () => {
    const board = [
      [0, 1, 2, 3, 4, 0, 1, 2],
      [1, 2, 3, 4, 0, 1, 2, 3],
      [2, 3, 4, 0, 1, 2, 3, 4],
      [3, 4, 0, 1, 2, 3, 4, 0],
      [4, 0, 1, 2, 3, 4, 0, 1],
      [0, 1, 2, 3, 4, 0, 1, 2],
      [1, 2, 3, 4, 0, 1, 2, 3],
      [2, 3, 4, 0, 1, 2, 3, 4],
    ];

    const currentColor = getCapturedColor(board);
    expect(currentColor).toBe(0);

    // Applying the same color should produce an identical board
    const newBoard = applyMove(board, currentColor);
    expect(newBoard).toEqual(board);
  });

  it('solved-state detection works on a uniform board', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(3));
    expect(isSolved(board)).toBe(true);
  });

  it('solved-state detection returns false on a non-uniform board', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(3));
    board[7][7] = 1;
    expect(isSolved(board)).toBe(false);
  });
});
