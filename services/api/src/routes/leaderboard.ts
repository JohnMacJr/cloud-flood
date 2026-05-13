import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAuth } from '../middleware/auth.js';
import { getGameDateKey } from '../shared/puzzle.js';

export const leaderboardRouter = Router();

/**
 * GET /api/leaderboard/today
 *
 * Returns today's top 10 scores ordered by moves ascending.
 * Requires authentication.
 */
leaderboardRouter.get('/api/leaderboard/today', verifyAuth, async (_req, res) => {
  const dateKey = getGameDateKey();
  const db = getFirestore();

  try {
    const snapshot = await db
      .collection(`leaderboards/${dateKey}/scores`)
      .orderBy('moves', 'asc')
      .limit(10)
      .get();

    const scores = snapshot.docs.map((doc) => doc.data());

    res.json({ dateKey, scores });
  } catch (error) {
    console.error('[leaderboard] Query failed:', (error as Error).message);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});
