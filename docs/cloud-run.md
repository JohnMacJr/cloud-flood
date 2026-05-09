# Cloud Run Backend — Deployment Guide

## Overview

The Cloud Run backend (`services/api/`) provides server-side score validation for Daily Flood. When a player completes the daily puzzle, the frontend sends the full move sequence to the Cloud Run API. The backend replays the moves against the deterministically generated board, verifies the solution, and writes the validated score to Firestore using the Firebase Admin SDK.

## Architecture

```
Client (SPA)
  │
  ├─ Reads ──→ Firestore (direct, via Firebase JS SDK)
  │             • Leaderboard scores
  │             • User score history
  │
  └─ Writes ──→ Cloud Run API ──→ Firestore (via Admin SDK)
                  │
                  ├─ Verifies Firebase ID token
                  ├─ Regenerates daily board from date seed
                  ├─ Replays submitted move sequence
                  ├─ Validates board is solved
                  ├─ Checks for duplicate submission
                  └─ Writes verified score
```

## Prerequisites

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) (`gcloud`)
- Docker (for local container testing or Cloud Build)
- A Firebase/GCP project with:
  - Firebase Auth enabled (Google sign-in)
  - Firestore enabled
  - Cloud Run API enabled
- A service account key JSON file (for local development only)

## Local Development

### 1. Install dependencies

```bash
cd services/api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account key JSON
- Set `ALLOWED_ORIGINS` (default includes `http://localhost:5173`)

### 3. Start the dev server

```bash
npm run dev
```

The API runs at `http://localhost:8080`.

### 4. Configure the frontend

In the root `.env` (or `.env.local`), add:

```
VITE_API_BASE_URL=http://localhost:8080
```

Then start the frontend:

```bash
npm run dev
```

## API Endpoints

| Method | Path                   | Auth     | Description                    |
|--------|------------------------|----------|--------------------------------|
| GET    | `/health`              | None     | Health check                   |
| POST   | `/api/submit-score`    | Required | Submit and validate move sequence |
| GET    | `/api/leaderboard/today` | Required | Today's top 10 scores          |
| GET    | `/api/me/today`        | Required | Current user's score for today |

### POST /api/submit-score

**Request:**
```json
{
  "dateKey": "2026-05-09",
  "moves": [1, 2, 3, 0, 4, 1, ...]
}
```

**Response (201):**
```json
{
  "dateKey": "2026-05-09",
  "puzzleNumber": 3,
  "moves": 18
}
```

The `moves` count in the response is computed server-side by replaying the sequence. Same-color moves (no-ops) are skipped.

## Deploying to Cloud Run

### 1. Build and push the Docker image

```bash
cd services/api

# Build with Cloud Build (recommended)
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/cloud-flood-api

# Or build locally and push
docker build -t gcr.io/YOUR_PROJECT_ID/cloud-flood-api .
docker push gcr.io/YOUR_PROJECT_ID/cloud-flood-api
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy cloud-flood-api \
  --image gcr.io/YOUR_PROJECT_ID/cloud-flood-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ALLOWED_ORIGINS=https://cloud-flood.web.app,https://cloud-flood.firebaseapp.com"
```

> **Note:** `--allow-unauthenticated` allows public HTTP access to the Cloud Run service. Authentication is handled at the application level via Firebase ID tokens, not at the Cloud Run IAM level.

### 3. Update frontend environment

Set the Cloud Run URL in your frontend environment:

```
VITE_API_BASE_URL=https://cloud-flood-api-XXXXX-uc.a.run.app
```

Rebuild and redeploy the frontend:

```bash
npm run build
firebase deploy --only hosting
```

### 4. Deploy updated Firestore rules

```bash
firebase deploy --only firestore:rules
```

## Service Account & IAM

### Principle of Least Privilege

The Cloud Run service should use a dedicated service account with minimal permissions:

| Permission | Purpose |
|------------|---------|
| `roles/datastore.user` | Read/write Firestore documents |
| `roles/firebase.sdkAdminServiceAgent` | Verify Firebase Auth tokens |

**Do NOT use the default compute service account in production.** Create a dedicated service account:

```bash
gcloud iam service-accounts create cloud-flood-api \
  --display-name "Cloud Flood API"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:cloud-flood-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

Then deploy Cloud Run with this service account:

```bash
gcloud run deploy cloud-flood-api \
  --service-account cloud-flood-api@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  ...
```

### Local Development

For local development, download a key for the service account:

```bash
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account cloud-flood-api@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Set `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json` in your `.env`.

> **⚠️ Never commit `service-account-key.json` to source control.** It is excluded by `.gitignore`.

## Shared Game Logic

The backend duplicates pure game logic files from the frontend:

| Backend file                      | Frontend source              |
|-----------------------------------|------------------------------|
| `src/shared/constants.ts`         | `src/lib/constants.ts`       |
| `src/shared/seededRandom.ts`      | `src/lib/seededRandom.ts`    |
| `src/shared/boardGen.ts`          | `src/lib/boardGen.ts`        |
| `src/shared/floodFill.ts`         | `src/lib/floodFill.ts`       |
| `src/shared/puzzle.ts`            | `src/lib/puzzle.ts`          |

### Why duplicated?

These files are pure TypeScript with no browser or Vite dependencies, making them safe to copy. A full monorepo refactor (e.g. extracting a shared `packages/game-logic` workspace) was deferred to keep this change focused.

### Future cleanup

Extract the shared logic into a shared package:

```
packages/
  game-logic/
    src/
      constants.ts
      seededRandom.ts
      boardGen.ts
      floodFill.ts
      puzzle.ts
    package.json
    tsconfig.json
```

Both the frontend (`src/lib/`) and backend (`services/api/src/shared/`) would then import from `@cloud-flood/game-logic`.

**Until then:** When modifying game logic (e.g. changing the PRNG, color count, or board size), update **both** copies and run tests in both directories.

## Testing

```bash
cd services/api

# Run tests
npm test

# Build (type-check)
npm run build
```

## Logging

The backend logs:
- Request received (endpoint, method)
- Authenticated UID
- Score validation success/failure
- Duplicate submission rejection
- Firestore write success/failure

**It does NOT log tokens, secrets, or full request bodies.**
