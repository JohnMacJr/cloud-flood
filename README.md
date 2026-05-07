# Daily Flood

A daily color-flood puzzle game. Capture the entire 8×8 board in as few moves as possible!

Everyone gets the same puzzle each day — come back tomorrow for a new one.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (included with Node.js)

### Install Dependencies

```bash
npm install
```

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

### Preview Production Build

```bash
npm run preview
```

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Daily Flood puzzle game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cloud-flood.git
git push -u origin main
```

---

## Deploy to Firebase Hosting

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Log in to Firebase

```bash
firebase login
```

### 3. Set Your Project ID

Copy the example config and replace the placeholder with your real Firebase project ID:

```bash
cp .firebaserc.example .firebaserc
```

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual project ID.

### 4. Build and Deploy

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at `https://YOUR_PROJECT_ID.web.app`.

> **Note:** Do not commit `.firebaserc` — it contains your project-specific ID and is excluded by `.gitignore`.

---

## Project Structure

```
cloud-flood/
├── src/
│   ├── lib/           # Pure game logic (no React dependencies)
│   ├── components/    # React UI components
│   ├── App.tsx        # Main app with state management
│   ├── main.tsx       # Entry point
│   └── index.css      # Tailwind + custom styles
├── tests/             # Vitest test files
├── firebase.json      # Firebase Hosting config
├── vite.config.ts     # Vite + Tailwind + Vitest config
└── index.html         # HTML entry point
```

## Roadmap

This is currently the local single-player version. Future cloud-native features will include:

- Backend API
- Authentication
- Database (leaderboards, streaks)
- Cloud deployment via Cloud Run

---

## License

MIT
