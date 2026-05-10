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
import type { AppUser } from './useAuth';

export interface LeaderboardState {
  scores: LeaderboardEntry[];
  loading: boolean;
  userScore: LeaderboardEntry | null;
  userRank: number | null;
  userStats: { totalCompleted: number; bestScore: number | null } | null;
  saveStatus: SaveResult | 'pending' | null;
  saveScore: (
    user: AppUser,
    dateKey: string,
    moveHistory: number[],
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
  user: AppUser | null,
): LeaderboardState {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userScoreData, setUserScoreData] = useState<{
    score: LeaderboardEntry | null;
    dateKey: string;
    uid: string | undefined;
  }>({ score: null, dateKey, uid: user?.uid });
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
      setUserScoreData({ score: null, dateKey, uid: user?.uid });
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
        if (own) setUserScoreData({ score: own, dateKey, uid: user.uid });
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
      setUserScoreData({ score: null, dateKey, uid: user?.uid });
      setUserStats(null);
      setSaveStatus(null);
      return;
    }

    setSaveStatus(null);

    // Fetch the user's score for today (may not be in top 10)
    getUserTodayScore(user.uid, dateKey).then((score) => {
      setUserScoreData({ score: score || null, dateKey, uid: user.uid });
    });

    // Fetch aggregate stats
    getUserStats(user.uid).then(setUserStats);
  }, [user, dateKey]);

  // ── Score submission (via Cloud Run API) ─────────────
  const saveScore = useCallback(
    async (
      u: AppUser,
      dk: string,
      moveHistory: number[],
    ) => {
      if (!isFirebaseConfigured) return;
      setSaveStatus('pending');
      const result = await submitScore(u, dk, moveHistory);
      setSaveStatus(result);

      // Refresh user stats after saving
      if (result === 'saved') {
        const updated = await getUserStats(u.uid);
        setUserStats(updated);
        const score = await getUserTodayScore(u.uid, dk);
        if (score) setUserScoreData({ score, dateKey: dk, uid: u.uid });
      }
    },
    [],
  );

  // Derived userScore matching the active date and user
  const userScore =
    userScoreData.dateKey === dateKey && userScoreData.uid === user?.uid
      ? userScoreData.score
      : null;

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
