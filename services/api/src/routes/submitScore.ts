import { Router } from 'express';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

import { verifyAuth } from '../middleware/auth.js';
import { generateBoard } from '../shared/boardGen.js';
import { applyMove, getCapturedColor, isSolved } from '../shared/floodFill.js';
import { getTodayDateStr, getPuzzleNumber } from '../shared/puzzle.js';
import { NUM_COLORS } from '../shared/constants.js';

export const submitScoreRouter = Router();

// ── Request validation schema ──────────────────────────
const SubmitScoreSchema = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateKey must be YYYY-MM-DD'),
  moves: z.array(
    z.number().int().min(0).max(NUM_COLORS - 1),
  ).min(1, 'At least one move is required'),
});

/**
 * POST /api/submit-score
 *
 * Accepts a move sequence, replays it server-side against the daily board,
 * validates the solution, and writes the verified score to Firestore.
 */
submitScoreRouter.post('/api/submit-score', verifyAuth, async (req, res) => {
  const uid = req.user!.uid;
  console.log(`[submit-score] Request received from uid=${uid}`);

  // ── 1. Parse & validate request body ─────────────────
  const parsed = SubmitScoreSchema.safeParse(req.body);
  if (!parsed.success) {
    console.warn(`[submit-score] Validation failed:`, parsed.error.flatten());
    res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { dateKey, moves } = parsed.data;

  // ── 2. Verify dateKey is today's UTC date ────────────
  const todayKey = getTodayDateStr();
  if (dateKey !== todayKey) {
    console.warn(`[submit-score] Rejected: dateKey=${dateKey} is not today (${todayKey})`);
    res.status(400).json({
      error: `dateKey must be today's UTC date (${todayKey})`,
    });
    return;
  }

  // ── 3. Check for existing submission ─────────────────
  const db = getFirestore();
  const leaderboardRef = db.doc(`leaderboards/${dateKey}/scores/${uid}`);
  const existingDoc = await leaderboardRef.get();

  if (existingDoc.exists) {
    console.warn(`[submit-score] Duplicate rejected: uid=${uid} already submitted for ${dateKey}`);
    res.status(409).json({
      error: 'Score already submitted for this date',
      existingMoves: existingDoc.data()?.moves,
    });
    return;
  }

  // ── 4. Regenerate board & replay moves ───────────────
  let board = generateBoard(dateKey);
  let validMoveCount = 0;

  for (const color of moves) {
    // Skip moves that match the current captured color (not counted)
    const currentColor = getCapturedColor(board);
    if (color === currentColor) {
      continue;
    }

    board = applyMove(board, color);
    validMoveCount++;
  }

  // ── 5. Verify the board is solved ────────────────────
  if (!isSolved(board)) {
    console.warn(`[submit-score] Validation failed: board not solved after ${validMoveCount} valid moves (uid=${uid})`);
    res.status(400).json({
      error: 'Board is not solved after replaying moves',
      validMoveCount,
    });
    return;
  }

  console.log(`[submit-score] Validated: uid=${uid}, ${validMoveCount} moves`);

  // ── 6. Get user profile from Firestore ───────────────
  let displayName = 'Anonymous';

  try {
    const userDoc = await db.doc(`users/${uid}`).get();
    if (userDoc.exists) {
      displayName = userDoc.data()?.nickname || 'Anonymous';
    }
  } catch {
    console.warn(`[submit-score] Could not fetch user profile for uid=${uid}, using defaults`);
  }

  // ── 7. Write to Firestore ────────────────────────────
  const puzzleNumber = getPuzzleNumber(dateKey);

  const leaderboardData = {
    uid,
    displayName,
    moves: validMoveCount,
    solvedAt: FieldValue.serverTimestamp(),
  };

  const userScoreData = {
    moves: validMoveCount,
    puzzleNumber,
    solvedAt: FieldValue.serverTimestamp(),
  };

  try {
    const batch = db.batch();
    batch.set(leaderboardRef, leaderboardData);
    batch.set(db.doc(`users/${uid}/scores/${dateKey}`), userScoreData);
    await batch.commit();

    console.log(`[submit-score] Firestore write success: uid=${uid}, moves=${validMoveCount}, puzzle=#${puzzleNumber}`);

    res.status(201).json({
      dateKey,
      puzzleNumber,
      moves: validMoveCount,
    });
  } catch (error) {
    console.error(`[submit-score] Firestore write failed for uid=${uid}:`, (error as Error).message);
    res.status(500).json({ error: 'Failed to save score' });
  }
});
