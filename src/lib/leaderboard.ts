import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';

// ── Types ──────────────────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  moves: number;
  solvedAt: Timestamp | null;
}

export interface UserScoreEntry {
  moves: number;
  puzzleNumber: number;
  solvedAt: Timestamp | null;
}

// ── Helpers ────────────────────────────────────────────

function requireDb(): Firestore {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

function leaderboardScoreRef(dateKey: string, uid: string) {
  return doc(requireDb(), 'leaderboards', dateKey, 'scores', uid);
}

// ── Write (via Cloud Run API) ──────────────────────────

export type SaveResult = 'saved' | 'duplicate' | 'error';

/**
 * Submit the user's move sequence to the Cloud Run API for validation.
 * The backend replays the moves server-side, verifies the solution,
 * and writes the verified score to Firestore via Admin SDK.
 *
 * Does NOT write to Firestore directly — client writes are denied
 * by Firestore security rules.
 */
export async function submitScore(
  user: User,
  dateKey: string,
  moveHistory: number[],
): Promise<SaveResult> {
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL;
    if (!apiBase) {
      console.error('VITE_API_BASE_URL is not configured');
      return 'error';
    }

    const token = await user.getIdToken();

    const res = await fetch(`${apiBase}/api/submit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ dateKey, moves: moveHistory }),
    });

    if (res.status === 201) {
      return 'saved';
    }

    if (res.status === 409) {
      // Already submitted for this date
      return 'duplicate';
    }

    // Any other error
    const body = await res.json().catch(() => ({}));
    console.error('Score submission failed:', res.status, body);
    return 'error';
  } catch (error) {
    console.error('Failed to submit score:', error);
    return 'error';
  }
}

// ── Read ───────────────────────────────────────────────

/**
 * Fetch today's top scores (up to `max` entries).
 */
export async function getTodayScores(
  dateKey: string,
  max = 10,
): Promise<LeaderboardEntry[]> {
  const scoresCol = collection(requireDb(), 'leaderboards', dateKey, 'scores');
  const q = query(scoresCol, orderBy('moves', 'asc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as LeaderboardEntry);
}

/**
 * Get the current user's score for today, if any.
 */
export async function getUserTodayScore(
  uid: string,
  dateKey: string,
): Promise<LeaderboardEntry | null> {
  const snap = await getDoc(leaderboardScoreRef(dateKey, uid));
  return snap.exists() ? (snap.data() as LeaderboardEntry) : null;
}

/**
 * Get basic user stats across all saved puzzles.
 * Returns total completed puzzles and best score.
 */
export async function getUserStats(
  uid: string,
): Promise<{ totalCompleted: number; bestScore: number | null }> {
  const scoresCol = collection(requireDb(), 'users', uid, 'scores');
  const snapshot = await getDocs(scoresCol);

  if (snapshot.empty) {
    return { totalCompleted: 0, bestScore: null };
  }

  let best = Infinity;
  snapshot.docs.forEach((d) => {
    const data = d.data() as UserScoreEntry;
    if (data.moves < best) best = data.moves;
  });

  return {
    totalCompleted: snapshot.size,
    bestScore: best === Infinity ? null : best,
  };
}
