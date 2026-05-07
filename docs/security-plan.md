# Security Plan — Daily Flood

## Overview

This document describes the security model for Daily Flood's leaderboard system, including the current Phase 1 implementation (client-side writes) and the planned Phase 2 hardening (server-side validation via Cloud Run).

---

## Phase 1: Firebase-Only (Current)

### Architecture

- Score submission happens entirely on the client
- Firestore security rules provide the only backend validation
- No server-side game logic verification

### Security Controls

#### Firestore Security Rules

```
leaderboards/{dateKey}/scores/{uid}
  read:  authenticated users only
  write: authenticated + uid match + moves is positive int

users/{uid}/scores/{dateKey}
  read:  authenticated + uid match (owner only)
  write: authenticated + uid match + moves is positive int
```

#### What Phase 1 Protects Against

| Threat                  | Protected? | How                              |
|------------------------|------------|----------------------------------|
| Unauthenticated writes | ✅ Yes     | `request.auth != null` rule      |
| Writing to other users | ✅ Yes     | `request.auth.uid == uid` rule   |
| Reading other users' history | ✅ Yes | Owner-only read on `users/` |
| Invalid data types     | ✅ Yes     | `moves is int` rule              |
| Negative/zero scores   | ✅ Yes     | `moves > 0` rule                 |

#### What Phase 1 Does NOT Protect Against

> [!WARNING]
> **Known Limitations (Phase 1)**
>
> The following threats are NOT mitigated in Phase 1. These are accepted risks for the initial Firebase-only deployment.

| Threat                          | Protected? | Mitigation Plan             |
|--------------------------------|------------|-----------------------------|
| Fabricated scores (e.g. 1 move)| ❌ No      | Phase 2: server validation  |
| Replaying someone else's solution | ❌ No   | Phase 2: server validation  |
| Automated/bot submissions      | ❌ No      | Phase 2: rate limiting      |
| Leaderboard data scraping      | ⚠️ Partial | Auth-gated reads help       |

### Risk Assessment

For a daily puzzle game in its early stages, the Phase 1 security model is **acceptable** because:

1. **Low stakes** — No prizes, no monetary value attached to scores
2. **Daily reset** — Leaderboard resets every day, limiting damage from any manipulation
3. **Small user base** — Limited attack surface during initial launch
4. **Auth-gated** — Casual abuse is prevented; attacker must authenticate

---

## Phase 2: Cloud Run Backend (Planned)

### Goal

Move official score submission to a Cloud Run backend service that performs **server-side game validation** before writing to Firestore.

### Architecture Change

```
Phase 1 (current):
  Client → Firestore (direct write)

Phase 2 (planned):
  Client → Cloud Run API → Firestore (server write)
```

### Server-Side Validation

The Cloud Run service will:

1. **Receive the user's move sequence** (not just the final score)
2. **Regenerate the daily board** server-side using the same deterministic seed
3. **Replay the moves** to verify each one is valid
4. **Verify the board is solved** after the final move
5. **Write the validated score** to Firestore using admin credentials
6. **Reject invalid or fabricated submissions**

### Additional Phase 2 Security Features

| Feature            | Description                                     |
|-------------------|-------------------------------------------------|
| Move validation    | Replay move sequence server-side                |
| Rate limiting      | Max submissions per user per day                |
| Admin SDK writes   | Firestore writes use admin credentials          |
| Locked rules       | Client-side writes to leaderboard disabled      |
| Audit logging      | Log all score submissions for review            |

### Updated Firestore Rules (Phase 2)

```
leaderboards/{dateKey}/scores/{uid}
  read:  authenticated users only
  write: deny (only Cloud Run service account can write)

users/{uid}/scores/{dateKey}
  read:  authenticated + uid match
  write: deny (only Cloud Run service account can write)
```

### Migration Path

1. Deploy Cloud Run score validation service
2. Update client to submit moves to Cloud Run API instead of direct Firestore write
3. Update Firestore rules to deny client-side writes
4. Keep read access for authenticated users

---

## Summary

| Aspect              | Phase 1              | Phase 2                  |
|---------------------|----------------------|--------------------------|
| Score submission     | Client-side          | Server-side (Cloud Run)  |
| Game validation      | None                 | Full move replay         |
| Firestore writes     | Client (rules-gated) | Admin SDK only           |
| Anti-cheat           | Minimal              | Strong                   |
| Rate limiting        | None                 | Per-user, per-day        |
| Auth requirement     | Yes                  | Yes                      |
| Read access          | Auth-gated           | Auth-gated               |
