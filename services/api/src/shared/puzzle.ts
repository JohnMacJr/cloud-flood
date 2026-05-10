/**
 * Puzzle utilities — shared between frontend and backend.
 *
 * ⚠️  DUPLICATED from src/lib/puzzle.ts
 *     Keep in sync until a shared package is extracted.
 *     See docs/cloud-run.md for the future cleanup plan.
 */

import { EPOCH_DATE } from './constants.js';

/**
 * Returns the current UTC date as YYYY-MM-DD.
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute the puzzle number: days since epoch (2026-05-07).
 */
export function getPuzzleNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const diff = date.getTime() - EPOCH_DATE.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1; // 1-indexed
}

/**
 * Format a date string for display: "May 7, 2026"
 */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Generate shareable result text.
 */
export function generateShareText(
  puzzleNumber: number,
  moves: number,
  moveHistory: number[],
): string {
  const EMOJI_MAP: Record<number, string> = {
    0: '🟥',
    1: '🟦',
    2: '🟩',
    3: '🟨',
    4: '🟪',
  };

  let emojiGrid = '';
  for (let i = 0; i < moveHistory.length; i++) {
    emojiGrid += EMOJI_MAP[moveHistory[i]] || '⬛';
    if ((i + 1) % 5 === 0 && i !== moveHistory.length - 1) {
      emojiGrid += '\n';
    }
  }

  return [
    `Daily Flood #${puzzleNumber}`,
    `Solved in ${moves} moves`,
    '',
    emojiGrid,
    '',
    'https://cloud-flood.web.app/',
  ].join('\n');
}
