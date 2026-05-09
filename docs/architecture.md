# Cloud Architecture — Daily Flood

## Overview

Daily Flood is a daily color-flood puzzle game deployed on Firebase with a Cloud Run backend for server-side score validation. This document describes the current cloud architecture.

## System Diagram

```
┌─────────────────────────────────────────────────┐
│                   Client (SPA)                  │
│           React + TypeScript + Vite             │
│                                                 │
│  ┌───────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Game Logic│  │  Auth Hook │  │ Leaderboard│ │
│  │  (local)  │  │(useAuth.ts)│  │   Hook     │ │
│  └───────────┘  └─────┬──────┘  └──┬────┬────┘ │
│                       │            │    │       │
└───────────────────────┼────────────┼────┼───────┘
                        │            │    │
                        ▼            │    │
              ┌──────────────┐       │    │
              │ Firebase Auth│       │    │
              │   (Google)   │       │    │
              └──────────────┘       │    │
                                     │    │
                    Reads (direct) ──┘    └── Writes (API)
                        │                      │
                        ▼                      ▼
              ┌──────────────┐       ┌──────────────┐
              │  Firestore   │◄──────│  Cloud Run   │
              │  (Database)  │       │  (API)       │
              └──────────────┘       └──────────────┘
                        │
                        ▼
              ┌──────────────┐
              │   Firebase   │
              │   Hosting    │
              └──────────────┘
```

## Services Used

| Service          | Purpose                              |
|------------------|--------------------------------------|
| Firebase Hosting | Serve the static SPA                 |
| Firebase Auth    | User identity (Google sign-in)       |
| Firestore        | Leaderboard + user score persistence |
| Cloud Run        | Server-side score validation API     |

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
2. Frontend records the full move sequence (color IDs chosen at each step)
3. Frontend sends the move sequence + dateKey to the Cloud Run API with a Firebase ID token
4. Cloud Run API:
   a. Verifies the Firebase ID token
   b. Validates dateKey is today's UTC date
   c. Checks Firestore for existing submission (one play per day)
   d. Regenerates the daily board server-side from the date seed
   e. Replays the submitted moves, skipping same-color no-ops
   f. Verifies the board is solved after all moves
   g. Computes the validated move count
   h. Writes verified score to both Firestore collections via Admin SDK
5. Frontend receives the validated score and updates the UI
6. Leaderboard reads continue as direct Firestore subscriptions (real-time updates)

## Security Model

See [security-plan.md](./security-plan.md) for the full security analysis.

### Summary

- Firestore security rules enforce:
  - Only authenticated users can read leaderboard scores
  - Only the document owner (`uid` match) can read their own score history
  - **All client-side writes are denied** (`allow write: if false`)
- Score writes are performed exclusively by the Cloud Run API via Firebase Admin SDK
- The Admin SDK bypasses Firestore security rules through IAM permissions
- Server-side move replay prevents fabricated or tampered scores

## Environment Variables

### Frontend (Vite)

| Variable                         | Description              |
|----------------------------------|--------------------------|
| `VITE_FIREBASE_API_KEY`          | Firebase API key         |
| `VITE_FIREBASE_AUTH_DOMAIN`      | Auth domain              |
| `VITE_FIREBASE_PROJECT_ID`       | Project ID               |
| `VITE_FIREBASE_STORAGE_BUCKET`   | Storage bucket           |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender      |
| `VITE_FIREBASE_APP_ID`           | App ID                   |
| `VITE_API_BASE_URL`              | Cloud Run API base URL   |

### Backend (Cloud Run)

| Variable                         | Description              |
|----------------------------------|--------------------------|
| `PORT`                           | Server port (default 8080) |
| `ALLOWED_ORIGINS`                | Comma-separated CORS origins |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account key path (local only) |

## Deployment

### Frontend + Firestore Rules

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

### Cloud Run API

See [cloud-run.md](./cloud-run.md) for the full deployment guide.

```bash
cd services/api
gcloud builds submit --tag gcr.io/PROJECT_ID/cloud-flood-api
gcloud run deploy cloud-flood-api --image gcr.io/PROJECT_ID/cloud-flood-api ...
```

## Roadmap

- [x] Local single-player game
- [x] Firebase Hosting deployment
- [x] Firebase Auth (Google sign-in)
- [x] Firestore leaderboard
- [x] User score persistence & stats
- [x] Cloud Run backend (server-side score validation)
- [ ] Shared game logic package extraction
- [ ] Streak tracking
- [ ] Additional game modes
