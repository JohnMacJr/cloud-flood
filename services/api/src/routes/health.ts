import { Router } from 'express';

export const healthRouter = Router();

/**
 * GET /health
 * Simple health-check endpoint. No auth required.
 */
healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
