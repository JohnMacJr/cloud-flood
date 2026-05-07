import { GRID_SIZE } from './constants';

const DIRECTIONS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

/**
 * Returns the set of cells connected to (startRow, startCol)
 * that share the same color, via BFS.
 * Each cell is encoded as "row,col".
 */
export function getFloodRegion(
  board: number[][],
  startRow: number,
  startCol: number,
): Set<string> {
  const targetColor = board[startRow][startCol];
  const visited = new Set<string>();
  const queue: [number, number][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < GRID_SIZE &&
        nc >= 0 &&
        nc < GRID_SIZE &&
        !visited.has(key) &&
        board[nr][nc] === targetColor
      ) {
        visited.add(key);
        queue.push([nr, nc]);
      }
    }
  }

  return visited;
}

/**
 * Deep-clone a board.
 */
export function cloneBoard(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

/**
 * Apply a move: change the captured region (flood from 0,0) to `color`,
 * then absorb any newly adjacent tiles of `color`.
 *
 * Returns the new board state. Does NOT mutate the input.
 */
export function applyMove(board: number[][], color: number): number[][] {
  const newBoard = cloneBoard(board);

  // Get current captured region (everything connected to 0,0 with the same color)
  const capturedRegion = getFloodRegion(newBoard, 0, 0);

  // Change every cell in the captured region to the new color
  for (const key of capturedRegion) {
    const [r, c] = key.split(',').map(Number);
    newBoard[r][c] = color;
  }

  // The flood region from 0,0 now naturally absorbs any newly adjacent tiles
  // of the chosen color — getFloodRegion handles this since we already painted.
  // But we need to keep expanding: after painting, adjacent same-color tiles
  // are now connected. The getFloodRegion call on the updated board handles it.
  // No extra work needed because we already set the region to `color`,
  // and on the next move getFloodRegion will naturally include them.

  return newBoard;
}

/**
 * Returns true if every cell on the board is the same color.
 */
export function isSolved(board: number[][]): boolean {
  const target = board[0][0];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] !== target) return false;
    }
  }
  return true;
}

/**
 * Returns the current color of the captured region (top-left cell).
 */
export function getCapturedColor(board: number[][]): number {
  return board[0][0];
}
