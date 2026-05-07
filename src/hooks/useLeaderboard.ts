import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  submitScore,
  getUserTodayScore,
  getUserStats,
  type LeaderboardEntry,
  type SaveResult,
} from '../lib/leaderboard';
import type { User } from 'firebase/auth';

export interface LeaderboardState {
  scores: LeaderboardEntry[];
  loading: boolean;
  userScore: LeaderboardEntry | null;
  userRank: number | null;
  userStats: { totalCompleted: number; bestScore: number | null } | null;
  saveStatus: SaveResult | 'pending' | null;
  saveScore: (
    user: User,
    dateKey: string,
    puzzleNumber: number,
    moves: number,
  ) => Promise<void>;
}

/**
 * Hook that subscribes to today's leaderboard in real-time
 * and provides score submission + user stats.
 *
 * Only subscribes when a user is signed in (auth-gated reads).
 * Gracefully degrades if Firebase is not configured.
 */
export function useLeaderboard(
  dateKey: string,
  user: User | null,
): LeaderboardState {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userScore, setUserScore] = useState<LeaderboardEntry | null>(null);
  const [userStats, setUserStats] = useState<{
    totalCompleted: number;
    bestScore: number | null;
  } | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveResult | 'pending' | null>(null);

  // Ref to track the latest scores for rank computation
  const scoresRef = useRef<LeaderboardEntry[]>([]);
  scoresRef.current = scores;

  // ── Real-time leaderboard subscription (auth-gated) ──
  useEffect(() => {
    if (!user || !db || !isFirebaseConfigured) {
      setScores([]);
      setLoading(false);
      setUserScore(null);
      setUserStats(null);
      return;
    }

    setLoading(true);
    const scoresCollection = collection(db, 'leaderboards', dateKey, 'scores');
    const q = query(
      scoresCollection,
      orderBy('moves', 'asc'),
      limit(10),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map((d) => d.data() as LeaderboardEntry);
        setScores(entries);
        setLoading(false);

        // Update user's own score from the snapshot
        const own = entries.find((e) => e.uid === user.uid);
        if (own) setUserScore(own);
      },
      (error) => {
        console.error('Leaderboard subscription error:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [dateKey, user]);

  // ── Load user's score + stats when user changes ──
  useEffect(() => {
    if (!user || !isFirebaseConfigured) {
      setUserScore(null);
      setUserStats(null);
      setSaveStatus(null);
      return;
    }

    // Fetch the user's score for today (may not be in top 10)
    getUserTodayScore(user.uid, dateKey).then((score) => {
      if (score) setUserScore(score);
    });

    // Fetch aggregate stats
    getUserStats(user.uid).then(setUserStats);
  }, [user, dateKey]);

  // ── Score submission ─────────────────────────────────
  const saveScore = useCallback(
    async (
      u: User,
      dk: string,
      puzzleNumber: number,
      moves: number,
    ) => {
      if (!isFirebaseConfigured) return;
      setSaveStatus('pending');
      const result = await submitScore(u, dk, puzzleNumber, moves);
      setSaveStatus(result);

      // Refresh user stats after saving
      if (result === 'saved') {
        const updated = await getUserStats(u.uid);
        setUserStats(updated);
        const score = await getUserTodayScore(u.uid, dk);
        if (score) setUserScore(score);
      }
    },
    [],
  );

  // ── Compute user rank ────────────────────────────────
  const userRank = (() => {
    if (!user || !userScore) return null;
    const idx = scores.findIndex((s) => s.uid === user.uid);
    return idx >= 0 ? idx + 1 : null;
  })();

  return {
    scores,
    loading,
    userScore,
    userRank,
    userStats,
    saveStatus,
    saveScore,
  };
}
