export const GRID_SIZE = 8;
export const NUM_COLORS = 5;

/** Reference epoch: 2026-05-07 UTC (launch day, Puzzle #1) */
export const EPOCH_DATE = new Date(Date.UTC(2026, 4, 7));

export interface GameColor {
  id: number;
  name: string;
  hex: string;
  symbol: string;
}

/**
 * Colorblind-friendly palette (Wong 2011).
 * Symbols are shown on buttons only (not on tiles per user request).
 */
export const COLORS: GameColor[] = [
  { id: 0, name: 'Vermillion', hex: '#D55E00', symbol: '●' },
  { id: 1, name: 'Sky Blue',   hex: '#56B4E9', symbol: '■' },
  { id: 2, name: 'Teal',       hex: '#009E73', symbol: '▲' },
  { id: 3, name: 'Amber',      hex: '#F0E442', symbol: '◆' },
  { id: 4, name: 'Rose',       hex: '#CC79A7', symbol: '★' },
];
