import type { Request, Response, NextFunction } from 'express';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

/**
 * Extend Express Request to carry the verified Firebase user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

/**
 * Middleware that verifies a Firebase ID token from the Authorization header.
 * Attaches the decoded token to `req.user`.
 * Returns 401 if the token is missing or invalid.
 */
export async function verifyAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[auth] Missing or malformed Authorization header');
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.user = decoded;
    console.log(`[auth] Authenticated uid=${decoded.uid}`);
    next();
  } catch (error) {
    console.warn('[auth] Invalid ID token:', (error as Error).message);
    res.status(401).json({ error: 'Invalid or expired ID token' });
  }
}
