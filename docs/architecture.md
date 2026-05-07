# Cloud Architecture — Daily Flood

## Overview

Daily Flood is a daily color-flood puzzle game deployed on Firebase. This document describes the cloud architecture for Phase 1 (Firebase-only) and the planned Phase 2 (Cloud Run backend).

## System Diagram

```
┌─────────────────────────────────────────────────┐
│                   Client (SPA)                  │
│           React + TypeScript + Vite             │
│                                                 │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Game Logic│  │  Auth Hook │  │ Leaderboard│ │
│  │  (local)  │  │(useAuth.ts)│  │   Hook     │ │
│  └───────────┘  └─────┬──────┘  └─────┬──────┘ │
│                       │               │         │
└───────────────────────┼───────────────┼─────────┘
                        │               │
                        ▼               ▼
              ┌──────────────┐  ┌──────────────┐
              │ Firebase Auth│  │  Firestore   │
              │   (Google)   │  │  (Database)  │
              └──────────────┘  └──────────────┘
                        │               │
                        ▼               │
              ┌──────────────┐          │
              │   Firebase   │◄─────────┘
              │   Hosting    │
              └──────────────┘
```

## Services Used

| Service          | Purpose                              | Phase |
|------------------|--------------------------------------|-------|
| Firebase Hosting | Serve the static SPA                 | 1     |
| Firebase Auth    | User identity (Google sign-in)       | 1     |
| Firestore        | Leaderboard + user score persistence | 1     |
| Cloud Run        | Server-side score validation         | 2     |

## Data Model

### Firestore Collections

```
firestore/
├── leaderboards/
│   └── {dateKey}/                    # e.g. "2026-05-07"
│       └── scores/
│           └── {uid}/                # One doc per user per day
│               ├── uid: string
│               ├── displayName: string
│               ├── photoURL: string | null
│               ├── moves: number
│               └── solvedAt: Timestamp
│
└── users/
    └── {uid}/
        └── scores/
            └── {dateKey}/            # One doc per day per user
                ├── moves: number
                ├── puzzleNumber: number
                └── solvedAt: Timestamp
```

### Why Two Collections?

- **`leaderboards/{dateKey}/scores`** — Optimized for querying today's top scores across all users. Indexed by `moves` (ascending) and `solvedAt` (ascending) for efficient leaderboard queries.
- **`users/{uid}/scores`** — Optimized for querying a single user's history. Enables stats like "total puzzles completed" and "personal best" without scanning all leaderboard documents.

## Authentication Flow

1. User clicks "Sign in with Google"
2. `signInWithPopup()` opens Google OAuth consent
3. Firebase Auth returns a `User` object with `uid`, `displayName`, `photoURL`
4. `onAuthStateChanged` listener updates React state
5. Auth token is automatically included in Firestore requests

## Score Submission Flow

1. User completes the daily puzzle (all cells same color)
2. If signed in, the app auto-submits the score via client-side Firestore write
3. The app checks if the user already has a score for today
4. If the existing score is better (fewer moves), the existing score is kept
5. If the new score is better, both collections are updated
6. If the user was signed out during solve, signing in triggers a recovery save

## Security Model

See [security-plan.md](./security-plan.md) for the full security analysis, including Phase 1 limitations and the Phase 2 mitigation plan.

### Phase 1 Summary

- Firestore security rules enforce:
  - Only authenticated users can read leaderboard scores
  - Only the document owner (`uid` match) can write their own score
  - Score `moves` must be a positive integer
- Client-side writes are trusted (no server-side game validation)

## Environment Variables

All Firebase configuration is stored in environment variables (`.env` file) using Vite's `VITE_` prefix:

| Variable                         | Description          |
|----------------------------------|----------------------|
| `VITE_FIREBASE_API_KEY`          | Firebase API key     |
| `VITE_FIREBASE_AUTH_DOMAIN`      | Auth domain          |
| `VITE_FIREBASE_PROJECT_ID`       | Project ID           |
| `VITE_FIREBASE_STORAGE_BUCKET`   | Storage bucket       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender  |
| `VITE_FIREBASE_APP_ID`           | App ID               |

## Deployment

```bash
# Build the SPA
npm run build

# Deploy hosting + Firestore rules
firebase deploy --only hosting,firestore:rules
```

## Future: Phase 2 (Cloud Run)

Phase 2 will introduce a Cloud Run backend for:
- Server-side game validation (anti-cheat)
- Official score submission via API
- Rate limiting
- Additional game modes

See [security-plan.md](./security-plan.md) for details.
