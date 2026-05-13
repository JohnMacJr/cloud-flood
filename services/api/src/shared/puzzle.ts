/**
 * Puzzle utilities — shared between frontend and backend.
 *
 * ⚠️  DUPLICATED from src/lib/puzzle.ts
 *     Keep in sync until a shared package is extracted.
 *     See docs/cloud-run.md for the future cleanup plan.
 */

import { EPOCH_DATE } from './constants.js';

/**
 * Returns the current date as YYYY-MM-DD in America/Los_Angeles.
 */
export function getGameDateKey(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Returns the UTC date as YYYY-MM-DD.
 * Used for legacy score fallback.
 */
export function getUtcDateKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the non-negative countdown to the next Pacific midnight.
 */
export function getTimeUntilNextPuzzle(date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

  let s = 60 - second;
  let m = 59 - minute;
  let h = 23 - hour;

  if (s === 60) {
    s = 0;
    m += 1;
  }
  if (m === 60) {
    m = 0;
    h += 1;
  }

  // Ensure non-negative
  return {
    hours: Math.max(0, h),
    minutes: Math.max(0, m),
    seconds: Math.max(0, s),
  };
}

/**
 * Calculates the Date representing the next midnight in America/Los_Angeles.
 */
export function getNextPacificMidnight(date = new Date()): Date {
  const { hours, minutes, seconds } = getTimeUntilNextPuzzle(date);
  const msUntil = (hours * 3600 + minutes * 60 + seconds) * 1000 - date.getMilliseconds();
  return new Date(date.getTime() + Math.max(0, msUntil));
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
