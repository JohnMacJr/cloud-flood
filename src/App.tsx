import { useReducer, useCallback, useEffect, useRef } from 'react';
import { generateBoard } from './lib/boardGen';
import { applyMove, getCapturedColor, isSolved } from './lib/floodFill';
import { getTodayDateStr, getPuzzleNumber } from './lib/puzzle';
import { useAuth } from './hooks/useAuth';
import { useLeaderboard } from './hooks/useLeaderboard';
import Board from './components/Board';
import ColorPicker from './components/ColorPicker';
import GameHeader from './components/GameHeader';
import Controls from './components/Controls';
import CompletionModal from './components/CompletionModal';

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
  | { type: 'NEW_DAY' };

function createInitialState(): GameState {
  const dateStr = getTodayDateStr();
  const board = generateBoard(dateStr);
  return {
    dateStr,
    puzzleNumber: getPuzzleNumber(dateStr),
    initialBoard: board,
    board,
    moveCount: 0,
    moveHistory: [],
    solved: false,
    showModal: false,
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

      return {
        ...state,
        board: newBoard,
        moveCount: state.moveCount + 1,
        moveHistory: [...state.moveHistory, action.color],
        solved,
        showModal: solved,
        scoreSaved: solved ? false : state.scoreSaved,
      };
    }

    case 'RESET': {
      return {
        ...state,
        board: state.initialBoard,
        moveCount: 0,
        moveHistory: [],
        solved: false,
        showModal: false,
        scoreSaved: false,
      };
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
        showModal: false,
        moveCount: action.moves,
      };

    case 'NEW_DAY':
      // UTC date changed — generate fresh puzzle
      return createInitialState();

    default:
      return state;
  }
}

// ── App ────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { user, signIn } = useAuth();
  const leaderboard = useLeaderboard(state.dateStr, user);

  // Track whether we've already triggered auto-save for the current solve
  const autoSaveTriggered = useRef(false);

  // Track whether we've already checked for an existing score on this session
  const existingScoreChecked = useRef(false);

  // ── UTC midnight rollover detection ──
  useEffect(() => {
    const interval = setInterval(() => {
      const currentDate = getTodayDateStr();
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

  const handleReset = useCallback(() => {
    autoSaveTriggered.current = false;
    dispatch({ type: 'RESET' });
  }, []);

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
    <div className="min-h-dvh bg-[#f0eeeb] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <GameHeader
          dateStr={state.dateStr}
          puzzleNumber={state.puzzleNumber}
          moveCount={state.moveCount}
        />

        {/* Already-played message */}
        {alreadyPlayed && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-gray-400">
              You already completed today's puzzle in{' '}
              <span className="font-semibold text-gray-600">{leaderboard.userScore!.moves} moves</span>.
              Come back tomorrow for a new one!
            </p>
          </div>
        )}

        {/* Board */}
        <div className="bg-white rounded-2xl p-3 border border-gray-200">
          <Board board={state.board} />
        </div>

        {/* Color Picker — hidden if already played */}
        {!alreadyPlayed && (
          <ColorPicker
            currentColor={currentColor}
            onPickColor={handlePickColor}
            disabled={state.solved}
          />
        )}

        {/* Controls — hidden if already played */}
        {!alreadyPlayed && (
          <Controls
            onReset={handleReset}
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
            onClose={handleCloseModal}
            saveStatusMessage={saveStatusMessage}
            onSignIn={signIn}
          />
        )}
      </div>
    </div>
  );
}
