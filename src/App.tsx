import { useReducer, useCallback, useEffect, useRef } from 'react';
import { generateBoard } from './lib/boardGen';
import { applyMove, getCapturedColor, isSolved } from './lib/floodFill';
import { getGameDateKey, getPuzzleNumber } from './lib/puzzle';
import { useAuth } from './hooks/useAuth';
import { useLeaderboard } from './hooks/useLeaderboard';
import Board from './components/Board';
import ColorPicker from './components/ColorPicker';
import GameHeader from './components/GameHeader';
import CompletionModal from './components/CompletionModal';
import AuthBar from './components/AuthBar';
import NextPuzzleCountdown from './components/NextPuzzleCountdown';
import Leaderboard from './components/Leaderboard';

// ── State ──────────────────────────────────────────────

interface GameState {
  dateStr: string;
  puzzleNumber: number;
  initialBoard: number[][];
  board: number[][];
  moveCount: number;
  moveHistory: number[];
  solved: boolean;
  showModal: boolean;
  scoreSaved: boolean;
}

type GameAction =
  | { type: 'MOVE'; color: number }
  | { type: 'RESET' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'MARK_SAVED' }
  | { type: 'LOCK_COMPLETED'; moves: number }
  | { type: 'NEW_DAY' }
  | { type: 'SIGN_OUT_RESET' };

function createInitialState(): GameState {
  const dateStr = getGameDateKey();
  let board = generateBoard(dateStr);
  let moveHistory: number[] = [];
  let moveCount = 0;

  try {
    const saved = localStorage.getItem(`dailyFloodProgress:${dateStr}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.moveHistory)) {
        moveHistory = parsed.moveHistory;
        for (const color of moveHistory) {
          const currentColor = getCapturedColor(board);
          if (color !== currentColor) {
            board = applyMove(board, color);
            moveCount++;
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to load local progress', e);
  }

  const solved = isSolved(board);

  return {
    dateStr,
    puzzleNumber: getPuzzleNumber(dateStr),
    initialBoard: generateBoard(dateStr),
    board,
    moveCount,
    moveHistory,
    solved,
    showModal: false, // Don't auto-show modal on initial load, even if solved locally
    scoreSaved: false,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE': {
      // Ignore if already solved
      if (state.solved) return state;

      // Ignore if choosing the current captured color
      const currentColor = getCapturedColor(state.board);
      if (action.color === currentColor) return state;

      const newBoard = applyMove(state.board, action.color);
      const solved = isSolved(newBoard);

      const newState = {
        ...state,
        board: newBoard,
        moveCount: state.moveCount + 1,
        moveHistory: [...state.moveHistory, action.color],
        solved,
        showModal: solved,
        scoreSaved: solved ? false : state.scoreSaved,
      };

      try {
        localStorage.setItem(
          `dailyFloodProgress:${state.dateStr}`,
          JSON.stringify({ moveHistory: newState.moveHistory })
        );
      } catch (e) {
        // ignore
      }

      return newState;
    }

    case 'CLOSE_MODAL':
      return { ...state, showModal: false };

    case 'MARK_SAVED':
      return { ...state, scoreSaved: true };

    case 'LOCK_COMPLETED':
      // Lock the game when we detect the user already has a saved score for today
      return {
        ...state,
        solved: true,
        scoreSaved: true,
        showModal: state.solved ? state.showModal : false,
        moveCount: action.moves,
      };

    case 'NEW_DAY':
      // UTC date changed — generate fresh puzzle
      return createInitialState();

    case 'SIGN_OUT_RESET':
      // User signed out. Clear their local game state to prevent leaking
      // a solved board or an official run to the signed-out local state.
      try {
        localStorage.removeItem(`dailyFloodProgress:${state.dateStr}`);
      } catch (e) {
        // ignore
      }
      // Regenerate fresh daily board
      return createInitialState();

    default:
      return state;
  }
}

// ── App ────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const leaderboard = useLeaderboard(state.dateStr, user);

  const handleSignOut = useCallback(async () => {
    await signOut();
    dispatch({ type: 'SIGN_OUT_RESET' });
  }, [signOut]);

  // Track whether we've already triggered auto-save for the current solve
  const autoSaveTriggered = useRef(false);

  // Track whether we've already checked for an existing score on this session
  const existingScoreChecked = useRef(false);

  // ── UTC midnight rollover detection ──
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = getGameDateKey();
      if (currentDate !== state.dateStr) {
        autoSaveTriggered.current = false;
        existingScoreChecked.current = false;
        dispatch({ type: 'NEW_DAY' });
      }
    }, 30_000); // check every 30 seconds
    return () => clearInterval(interval);
  }, [state.dateStr]);

  const handlePickColor = useCallback(
    (color: number) => dispatch({ type: 'MOVE', color }),
    [],
  );


  const handleCloseModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);

  const currentColor = getCapturedColor(state.board);

  // ── Lock game if user already has a score for today ──
  useEffect(() => {
    if (
      user &&
      leaderboard.userScore &&
      !existingScoreChecked.current
    ) {
      existingScoreChecked.current = true;
      // User already played today — lock the game
      dispatch({ type: 'LOCK_COMPLETED', moves: leaderboard.userScore.moves });
    }
  }, [user, leaderboard.userScore]);

  // Reset the check flag when user changes (sign out → sign in with different account)
  useEffect(() => {
    existingScoreChecked.current = false;
  }, [user]);

  // ── Auto-save score on solve (if signed in) ──
  useEffect(() => {
    if (
      state.solved &&
      user &&
      !state.scoreSaved &&
      !autoSaveTriggered.current
    ) {
      autoSaveTriggered.current = true;
      leaderboard
        .saveScore(user, state.dateStr, state.moveHistory)
        .then(() => dispatch({ type: 'MARK_SAVED' }));
    }
  }, [state.solved, user, state.scoreSaved, state.dateStr, state.moveHistory, leaderboard]);

  // ── Post-sign-in recovery: save pending score ──
  useEffect(() => {
    if (
      user &&
      state.solved &&
      !state.scoreSaved &&
      !autoSaveTriggered.current
    ) {
      autoSaveTriggered.current = true;
      leaderboard
        .saveScore(user, state.dateStr, state.moveHistory)
        .then(() => dispatch({ type: 'MARK_SAVED' }));
    }
  }, [user, state.solved, state.scoreSaved, state.dateStr, state.moveHistory, leaderboard]);

  // Save status message for the completion modal
  const saveStatusMessage = (() => {
    if (!state.solved) return null;
    if (!user) return 'sign-in' as const;
    if (leaderboard.saveStatus === 'pending') return 'pending' as const;
    if (leaderboard.saveStatus === 'saved') return 'saved' as const;
    if (leaderboard.saveStatus === 'duplicate') return 'duplicate' as const;
    if (leaderboard.saveStatus === 'error') return 'error' as const;
    return null;
  })();

  // Whether the user already completed today's puzzle (has a saved score)
  const alreadyPlayed = Boolean(user && leaderboard.userScore && state.scoreSaved);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Auth Bar */}
        <AuthBar
          user={user}
          loading={authLoading}
          onSignIn={signIn}
          onSignOut={handleSignOut}
        />

        {/* Header */}
        <GameHeader
          dateStr={state.dateStr}
          puzzleNumber={state.puzzleNumber}
          moveCount={state.moveCount}
        />

        {/* Board Container with Overlay */}
        <div className="relative">
          <div className={`bg-white/80 backdrop-blur-xl rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all duration-500 ${alreadyPlayed ? 'blur-[2px] opacity-40 pointer-events-none' : ''}`}>
            <Board board={state.board} />
          </div>

          {alreadyPlayed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/50 text-center max-w-[85%] pointer-events-auto">
                <NextPuzzleCountdown />
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    You solved today's puzzle in <span className="font-bold text-gray-900">{leaderboard.userScore!.moves} moves</span>.<br/>
                    Come back tomorrow.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Color Picker — hidden if already played */}
        {!alreadyPlayed && (
          <ColorPicker
            currentColor={currentColor}
            onPickColor={handlePickColor}
            disabled={state.solved}
          />
        )}



        {/* Leaderboard */}
        <Leaderboard
          user={user}
          scores={leaderboard.scores}
          loading={leaderboard.loading}
          userScore={leaderboard.userScore}
          userRank={leaderboard.userRank}
          userStats={leaderboard.userStats}
          saveStatus={leaderboard.saveStatus}
          onSignIn={signIn}
        />

        {/* Completion Modal */}
        {state.showModal && (
          <CompletionModal
            puzzleNumber={state.puzzleNumber}
            moveCount={state.moveCount}
            moveHistory={state.moveHistory}
            onClose={handleCloseModal}
            saveStatusMessage={saveStatusMessage}
            onSignIn={signIn}
          />
        )}
      </div>
    </div>
  );
}
