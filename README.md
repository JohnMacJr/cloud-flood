# Daily Flood

A daily color-flood puzzle game. Capture the entire 8×8 board in as few moves as possible!

Everyone gets the same puzzle each day — come back tomorrow for a new one.

## Features

- 🎨 8×8 board with 5 colorblind-friendly colors
- 🎯 Deterministic daily puzzle (same puzzle for everyone)
- 🔐 Google sign-in via Firebase Auth
- 🏆 Daily leaderboard powered by Firestore
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
```

3. In the Firebase Console, enable:
   - **Authentication** → Sign-in method → Google
   - **Firestore Database** → Create database (start in production mode)

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests

```bash
npm run test
```

### Build for Production

```bash
npm run build
```

The output goes to the `dist/` directory.

---

## Deploy

### Deploy Hosting + Firestore Rules

```bash
npm run build
firebase deploy --only hosting,firestore:rules
```

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
├── src/
│   ├── lib/              # Pure game logic + Firebase services
│   │   ├── boardGen.ts       # Deterministic board generation
│   │   ├── constants.ts      # Grid size, colors, epoch
│   │   ├── firebase.ts       # Firebase app/auth/db initialization
│   │   ├── floodFill.ts      # Flood fill algorithm
│   │   ├── leaderboard.ts    # Firestore read/write operations
│   │   ├── puzzle.ts         # Puzzle number, date formatting
│   │   └── seededRandom.ts   # Mulberry32 PRNG
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts        # Firebase Auth state
│   │   └── useLeaderboard.ts # Leaderboard subscription + stats
│   ├── components/        # React UI components
│   │   ├── AuthBar.tsx        # Sign-in/out bar
│   │   ├── Board.tsx          # Game board grid
│   │   ├── ColorPicker.tsx    # Color selection buttons
│   │   ├── CompletionModal.tsx# Win modal with share + save status
│   │   ├── Controls.tsx       # Reset button
│   │   ├── GameHeader.tsx     # Title, date, move counter
│   │   └── Leaderboard.tsx    # Leaderboard panel
│   ├── App.tsx            # Main app with state management
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind + custom styles
├── tests/                 # Vitest test files
├── docs/                  # Architecture documentation
│   ├── architecture.md       # System design & data model
│   └── security-plan.md      # Phase 1/2 security roadmap
├── firebase.json          # Firebase Hosting + Firestore config
├── firestore.rules        # Firestore security rules
├── .env.example           # Environment variable template
├── vite.config.ts         # Vite + Tailwind + Vitest config
└── index.html             # HTML entry point
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full cloud architecture documentation.

## Security

See [docs/security-plan.md](docs/security-plan.md) for the security model, including Phase 1 limitations and the Phase 2 Cloud Run migration plan.

## Roadmap

- [x] Local single-player game
- [x] Firebase Hosting deployment
- [x] Firebase Auth (Google sign-in)
- [x] Firestore leaderboard
- [x] User score persistence & stats
- [ ] Cloud Run backend (server-side score validation)
- [ ] Streak tracking
- [ ] Additional game modes

---

## License

MIT
