import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
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

function userScoreRef(uid: string, dateKey: string) {
  return doc(requireDb(), 'users', uid, 'scores', dateKey);
}

// ── Write ──────────────────────────────────────────────

export type SaveResult = 'saved' | 'kept' | 'error';

/**
 * Save the user's score for today.
 * Only updates if the new score is strictly better (fewer moves).
 * Writes to both `leaderboards/{dateKey}/scores/{uid}` and
 * `users/{uid}/scores/{dateKey}`.
 */
export async function submitScore(
  user: User,
  dateKey: string,
  puzzleNumber: number,
  moves: number,
): Promise<SaveResult> {
  try {
    // Check for existing score
    const existingDoc = await getDoc(leaderboardScoreRef(dateKey, user.uid));
    if (existingDoc.exists()) {
      const existing = existingDoc.data() as LeaderboardEntry;
      if (existing.moves <= moves) {
        return 'kept'; // existing score is same or better
      }
    }

    const displayName = user.displayName || user.email || 'Anonymous';

    const leaderboardData: LeaderboardEntry = {
      uid: user.uid,
      displayName,
      photoURL: user.photoURL,
      moves,
      solvedAt: serverTimestamp() as unknown as Timestamp,
    };

    const userScoreData: UserScoreEntry = {
      moves,
      puzzleNumber,
      solvedAt: serverTimestamp() as unknown as Timestamp,
    };

    // Write to both collections
    await Promise.all([
      setDoc(leaderboardScoreRef(dateKey, user.uid), leaderboardData),
      setDoc(userScoreRef(user.uid, dateKey), userScoreData),
    ]);

    return 'saved';
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
  const q = query(scoresCol, orderBy('moves', 'asc'), orderBy('solvedAt', 'asc'), limit(max));
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
