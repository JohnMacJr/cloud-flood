# Security Plan — Daily Flood

## Overview

This document describes the security model for Daily Flood's leaderboard system. Score submission is validated server-side via a Cloud Run API before being written to Firestore.

---

## Architecture

```
Client → Cloud Run API → Firestore (server write via Admin SDK)
```

- **Score writes**: Go through the Cloud Run API, which validates the game solution server-side
- **Score reads**: Direct Firestore reads from the client (auth-gated by security rules)
- **Client writes**: Denied by Firestore security rules (`allow write: if false`)

---

## Server-Side Validation

The Cloud Run API performs the following validation on every score submission:

1. **Verify Firebase ID token** — Authenticate the user
2. **Validate dateKey** — Must be today's UTC date (no past/future submissions)
3. **Check for duplicates** — One submission per user per UTC date (reject duplicates)
4. **Regenerate board** — Use the same deterministic seed as the frontend
5. **Replay moves** — Apply each submitted move to the board, skipping same-color no-ops
6. **Verify solution** — Confirm the board is fully solved after replay
7. **Compute move count** — Count only valid moves (server-side, never trusted from client)
8. **Write score** — Atomically write to both Firestore collections via Admin SDK

### What This Protects Against

| Threat                          | Protected? | How                                     |
|--------------------------------|------------|-----------------------------------------|
| Unauthenticated writes          | ✅ Yes     | Firebase ID token verification          |
| Writing to other users           | ✅ Yes     | UID from verified token, not client      |
| Fabricated scores (e.g. 1 move)  | ✅ Yes     | Server-side move replay                 |
| Replaying someone else's moves   | ✅ Yes     | UID bound to token, not request body     |
| Submitting for past/future dates | ✅ Yes     | dateKey must equal today's UTC date      |
| Multiple submissions per day     | ✅ Yes     | Duplicate check before write            |
| Client-side Firestore tampering  | ✅ Yes     | `allow write: if false` in rules        |
| Invalid data types               | ✅ Yes     | Zod schema validation                   |
| Invalid color IDs                | ✅ Yes     | Zod validates 0–4 range                 |
| Negative/zero scores             | ✅ Yes     | Server computes count from replay       |

---

## Firestore Security Rules

```
leaderboards/{dateKey}/scores/{uid}
  read:  authenticated users only
  write: DENIED (only Cloud Run Admin SDK can write)

users/{uid}/scores/{dateKey}
  read:  authenticated + uid match (owner only)
  write: DENIED (only Cloud Run Admin SDK can write)
```

The Firebase Admin SDK bypasses Firestore security rules entirely — it operates through IAM service account permissions, not the rules engine. This means:

- Client-side writes are always blocked
- Only the Cloud Run service account can create/update score documents
- The service account should use least-privilege IAM roles (see below)

---

## Service Account & IAM

### Principle of Least Privilege

The Cloud Run service should use a **dedicated service account** with minimal permissions:

| IAM Role                           | Purpose                        |
|-------------------------------------|-------------------------------|
| `roles/datastore.user`             | Read/write Firestore documents |
| `roles/firebase.sdkAdminServiceAgent` | Verify Firebase Auth tokens  |

**Do NOT use the default Compute Engine service account** in production. It typically has `roles/editor`, which grants far more access than needed.

### Recommendations

- Create a dedicated `cloud-flood-api` service account
- Grant only the roles listed above
- Rotate service account keys periodically (for local development)
- Never commit `service-account-key.json` to source control

---

## Authentication Flow

1. User signs in via Google OAuth (Firebase Auth)
2. Client obtains a Firebase ID token via `user.getIdToken()`
3. Client sends the token in the `Authorization: Bearer <token>` header
4. Cloud Run API verifies the token using `admin.auth().verifyIdToken()`
5. UID is extracted from the verified token (never from the request body)

---

## CORS Configuration

The API allows requests only from whitelisted origins:

- `http://localhost:5173` (local development)
- `https://cloud-flood.web.app` (production)
- `https://cloud-flood.firebaseapp.com` (Firebase alternate domain)

---

## Logging

The backend logs:
- Request received (endpoint, method)
- Authenticated UID
- Score validation success/failure
- Duplicate submission rejection
- Firestore write success/failure

**It does NOT log:**
- Firebase ID tokens
- Service account keys
- Full request bodies
- User email addresses

---

## Summary

| Aspect              | Implementation                   |
|---------------------|----------------------------------|
| Score submission     | Server-side (Cloud Run API)      |
| Game validation      | Full move replay                 |
| Firestore writes     | Admin SDK only                   |
| Client writes        | Denied (`allow write: if false`) |
| Anti-cheat           | Strong (server replay)           |
| Duplicate prevention | One submission per user per day  |
| Auth requirement     | Firebase ID token                |
| Read access          | Auth-gated (Firestore rules)     |
| IAM                  | Least-privilege service account  |
