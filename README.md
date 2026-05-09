# Daily Flood

A daily color-flood puzzle game. Capture the entire 9×9 board in as few moves as possible!

Everyone gets the same puzzle each day — come back tomorrow for a new one.

## Features

- 🎨 9×9 board with 5 colorblind-friendly colors
- 🎯 Deterministic daily puzzle (same puzzle for everyone)
- 🔐 Google sign-in via Firebase Auth
- 🏆 Daily leaderboard powered by Firestore
- 🛡️ Server-side score validation via Cloud Run
- 📊 Personal stats (total puzzles, best score)
- 📋 Share your result
- ⟲ Reset puzzle

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (included with Node.js)
- A Firebase project with Auth (Google provider) and Firestore enabled

### Install Dependencies

```bash
# Frontend
npm install

# Backend
cd services/api
npm install
```

### Configure Firebase

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Fill in your Firebase project values in `.env`. Find these in the [Firebase Console](https://console.firebase.google.com/) → Project Settings → General → Your apps → Web app:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_BASE_URL=http://localhost:8080
```

3. In the Firebase Console, enable:
   - **Authentication** → Sign-in method → Google
   - **Firestore Database** → Create database (start in production mode)

### Run Locally

```bash
# Start the backend API
cd services/api
npm run dev

# In another terminal, start the frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
# Frontend tests
npm run test

# Backend tests
cd services/api
npm run test
```

### Build for Production

```bash
# Frontend
npm run build

# Backend
cd services/api
npm run build
```

---

## Deploy

### Deploy Hosting + Firestore Rules

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

### Deploy Cloud Run API

See [docs/cloud-run.md](docs/cloud-run.md) for the full deployment guide.

### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`.

> **Note:** Do not commit `.firebaserc` or `.env` — they contain project-specific config and are excluded by `.gitignore`.

---

## Project Structure

```
cloud-flood/
├── src/                       # Frontend (React + TypeScript)
│   ├── lib/                      # Pure game logic + Firebase services
│   │   ├── boardGen.ts              # Deterministic board generation
│   │   ├── constants.ts             # Grid size, colors, epoch
│   │   ├── firebase.ts              # Firebase app/auth/db initialization
│   │   ├── floodFill.ts             # Flood fill algorithm
│   │   ├── leaderboard.ts           # Score submission (via Cloud Run API) + reads
│   │   ├── puzzle.ts                # Puzzle number, date formatting
│   │   └── seededRandom.ts          # Mulberry32 PRNG
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts               # Firebase Auth state
│   │   └── useLeaderboard.ts        # Leaderboard subscription + stats
│   ├── components/               # React UI components
│   │   ├── AuthBar.tsx              # Sign-in/out bar
│   │   ├── Board.tsx                # Game board grid
│   │   ├── ColorPicker.tsx          # Color selection buttons
│   │   ├── CompletionModal.tsx      # Win modal with share + save status
│   │   ├── Controls.tsx             # Reset button
│   │   ├── GameHeader.tsx           # Title, date, move counter
│   │   └── Leaderboard.tsx          # Leaderboard panel
│   ├── App.tsx                   # Main app with state management
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind + custom styles
├── services/
│   └── api/                      # Cloud Run backend (Express + TypeScript)
│       ├── src/
│       │   ├── shared/              # Duplicated pure game logic (see note below)
│       │   │   ├── constants.ts
│       │   │   ├── seededRandom.ts
│       │   │   ├── boardGen.ts
│       │   │   ├── floodFill.ts
│       │   │   └── puzzle.ts
│       │   ├── middleware/
│       │   │   └── auth.ts          # Firebase ID token verification
│       │   ├── routes/
│       │   │   ├── health.ts        # GET /health
│       │   │   ├── submitScore.ts   # POST /api/submit-score
│       │   │   ├── leaderboard.ts   # GET /api/leaderboard/today
│       │   │   └── me.ts           # GET /api/me/today
│       │   └── index.ts            # Express entry point
│       ├── tests/
│       │   └── validation.test.ts   # Backend validation tests
│       ├── Dockerfile               # Cloud Run container
│       ├── package.json
│       └── tsconfig.json
├── tests/                        # Frontend Vitest test files
├── docs/                         # Documentation
│   ├── architecture.md              # System design & data model
│   ├── cloud-run.md                 # Cloud Run deployment guide
│   └── security-plan.md            # Security model
├── firebase.json                 # Firebase Hosting + Firestore config
├── firestore.rules               # Firestore security rules
├── .env.example                  # Environment variable template
├── vite.config.ts                # Vite + Tailwind + Vitest config
└── index.html                    # HTML entry point
```

> **Note on shared game logic:** The backend (`services/api/src/shared/`) duplicates pure game logic from `src/lib/`. These files have no browser or Vite dependencies and are safe to copy. Future cleanup: extract into a shared `packages/game-logic` workspace package. See [docs/cloud-run.md](docs/cloud-run.md) for details.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full cloud architecture documentation.

## Security

See [docs/security-plan.md](docs/security-plan.md) for the security model.

## Cloud Run

See [docs/cloud-run.md](docs/cloud-run.md) for the Cloud Run deployment guide.

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

---

## License

MIT
