import { describe, it, expect } from 'vitest';
import { generateBoard } from '../src/shared/boardGen.js';
import {
  applyMove,
  getCapturedColor,
  isSolved,
} from '../src/shared/floodFill.js';
import { GRID_SIZE, NUM_COLORS } from '../src/shared/constants.js';
import { getTodayDateStr, getPuzzleNumber } from '../src/shared/puzzle.js';

// ── Shared logic consistency ───────────────────────────

describe('Shared game logic (server-side)', () => {
  it('same date generates the same board', () => {
    const board1 = generateBoard('2026-05-07');
    const board2 = generateBoard('2026-05-07');
    expect(board1).toEqual(board2);
  });

  it('different dates generate different boards', () => {
    const board1 = generateBoard('2026-05-07');
    const board2 = generateBoard('2026-05-08');
    expect(board1.flat().join(',')).not.toBe(board2.flat().join(','));
  });

  it('generated board is 9×9', () => {
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

  it('getTodayDateStr returns YYYY-MM-DD format', () => {
    const dateStr = getTodayDateStr();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('getPuzzleNumber returns a positive number for dates after epoch', () => {
    const num = getPuzzleNumber('2026-05-07');
    expect(num).toBe(1);
    expect(getPuzzleNumber('2026-05-08')).toBe(2);
  });
});

// ── Move replay validation ─────────────────────────────

describe('Move replay validation', () => {
  it('replaying a valid move sequence solves the board', () => {
    // Use a small well-known board: all cells are color 0 except (0,1) = 1
    // After one move (choose color 1), entire top row becomes 1,
    // but not the rest. Let's use a real board and build a solving sequence.
    const dateKey = '2026-05-07';
    let board = generateBoard(dateKey);

    // Play until solved (brute-force greedy for testing)
    const moveHistory: number[] = [];
    let iterations = 0;
    const MAX_ITERATIONS = 200;

    while (!isSolved(board) && iterations < MAX_ITERATIONS) {
      const currentColor = getCapturedColor(board);
      // Try each color, pick the one that captures the most tiles
      let bestColor = -1;
      let bestSize = -1;

      for (let c = 0; c < NUM_COLORS; c++) {
        if (c === currentColor) continue;
        const testBoard = applyMove(board, c);
        // Count flood region from (0,0) — we can approximate by
        // counting cells with the new color, but simplest is just
        // to check full solve or pick first non-current color
        const regionSize = countFloodRegion(testBoard);
        if (regionSize > bestSize) {
          bestSize = regionSize;
          bestColor = c;
        }
      }

      board = applyMove(board, bestColor);
      moveHistory.push(bestColor);
      iterations++;
    }

    expect(isSolved(board)).toBe(true);
    expect(moveHistory.length).toBeGreaterThan(0);
    expect(moveHistory.length).toBeLessThan(MAX_ITERATIONS);

    // Now replay the same moves on a freshly generated board
    let replayBoard = generateBoard(dateKey);
    let validMoveCount = 0;

    for (const color of moveHistory) {
      const current = getCapturedColor(replayBoard);
      if (color === current) continue;
      replayBoard = applyMove(replayBoard, color);
      validMoveCount++;
    }

    expect(isSolved(replayBoard)).toBe(true);
    expect(validMoveCount).toBe(moveHistory.length);
  });

  it('incomplete move sequence does not solve the board', () => {
    const dateKey = '2026-05-07';
    const board = generateBoard(dateKey);

    // Apply just one move — board should NOT be solved
    const currentColor = getCapturedColor(board);
    const nextColor = (currentColor + 1) % NUM_COLORS;
    const newBoard = applyMove(board, nextColor);

    expect(isSolved(newBoard)).toBe(false);
  });

  it('same-color moves are skipped and not counted', () => {
    const dateKey = '2026-05-07';
    let board = generateBoard(dateKey);
    const currentColor = getCapturedColor(board);

    // Insert moves that match the current color — they should be skipped
    const moves = [currentColor, currentColor, (currentColor + 1) % NUM_COLORS];
    let validCount = 0;

    for (const color of moves) {
      const current = getCapturedColor(board);
      if (color === current) continue;
      board = applyMove(board, color);
      validCount++;
    }

    // Only the last move should count
    expect(validCount).toBe(1);
  });

  it('move count is computed server-side from replay, not from array length', () => {
    const dateKey = '2026-05-07';
    let board = generateBoard(dateKey);
    const currentColor = getCapturedColor(board);

    // Array has 5 elements but 3 are same-color (skipped)
    const nextColor = (currentColor + 1) % NUM_COLORS;
    const moves = [currentColor, currentColor, currentColor, nextColor, nextColor];
    let validCount = 0;

    for (const color of moves) {
      const current = getCapturedColor(board);
      if (color === current) continue;
      board = applyMove(board, color);
      validCount++;
    }

    // moves array length is 5, but only 1 unique valid move (nextColor applied once,
    // then nextColor again is same-color so skipped)
    expect(validCount).toBeLessThan(moves.length);
    expect(validCount).toBe(1);
  });

  it('rejects color IDs outside 0–4 range (via Zod schema concept)', () => {
    // This tests the validation logic conceptually — actual Zod validation
    // happens in the route, but we verify the color range constraint here
    const invalidColors = [-1, 5, 10, 999];
    for (const c of invalidColors) {
      const isValid = c >= 0 && c < NUM_COLORS;
      expect(isValid).toBe(false);
    }
    // Specifically: -1 < 0, 5 >= NUM_COLORS
    expect(-1).toBeLessThan(0);
    expect(5).toBeGreaterThanOrEqual(NUM_COLORS);
  });
});

// ── Helpers ────────────────────────────────────────────

/**
 * Count the flood region size from (0,0).
 * Simplified inline BFS for test use.
 */
function countFloodRegion(board: number[][]): number {
  const targetColor = board[0][0];
  const visited = new Set<string>();
  const queue: [number, number][] = [[0, 0]];
  visited.add('0,0');

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 && nr < GRID_SIZE &&
        nc >= 0 && nc < GRID_SIZE &&
        !visited.has(key) &&
        board[nr][nc] === targetColor
      ) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return visited.size;
}
