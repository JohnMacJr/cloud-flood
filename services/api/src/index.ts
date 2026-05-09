import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { readFileSync, existsSync } from 'node:fs';

import { healthRouter } from './routes/health.js';
import { submitScoreRouter } from './routes/submitScore.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { meRouter } from './routes/me.js';

// ── Firebase Admin SDK initialization ──────────────────
// On Cloud Run, credentials are provided automatically via the
// default service account. Locally, use GOOGLE_APPLICATION_CREDENTIALS.
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credPath && existsSync(credPath)) {
  const serviceAccount = JSON.parse(
    readFileSync(credPath, 'utf-8'),
  ) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
  console.log('[init] Firebase Admin initialized with service account key');
} else {
  // Application Default Credentials (Cloud Run, Cloud Shell, etc.)
  initializeApp();
  console.log('[init] Firebase Admin initialized with default credentials');
}

// ── Express app ────────────────────────────────────────
const app = express();

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Body parsing
app.use(express.json({ limit: '16kb' }));

// ── Routes ─────────────────────────────────────────────
app.use(healthRouter);
app.use(submitScoreRouter);
app.use(leaderboardRouter);
app.use(meRouter);

// ── Start ──────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '8080', 10);
app.listen(PORT, () => {
  console.log(`[init] Cloud Flood API listening on port ${PORT}`);
  console.log(`[init] Allowed origins: ${allowedOrigins.join(', ')}`);
});

export { app };
