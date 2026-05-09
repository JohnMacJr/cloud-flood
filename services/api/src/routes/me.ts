import { Router } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { verifyAuth } from '../middleware/auth.js';
import { getTodayDateStr } from '../shared/puzzle.js';

export const meRouter = Router();

/**
 * GET /api/me/today
 *
 * Returns the authenticated user's score for today, if any.
 */
meRouter.get('/api/me/today', verifyAuth, async (req, res) => {
  const uid = req.user!.uid;
  const dateKey = getTodayDateStr();
  const db = getFirestore();

  try {
    const doc = await db.doc(`leaderboards/${dateKey}/scores/${uid}`).get();

    res.json({
      dateKey,
      score: doc.exists ? doc.data() : null,
    });
  } catch (error) {
    console.error(`[me/today] Query failed for uid=${uid}:`, (error as Error).message);
    res.status(500).json({ error: 'Failed to fetch score' });
  }
});
