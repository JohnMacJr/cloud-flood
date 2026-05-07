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
  solved: boolean;
  showModal: boolean;
  scoreSaved: boolean;
}

type GameAction =
  | { type: 'MOVE'; color: number }
  | { type: 'RESET' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'MARK_SAVED' };

function createInitialState(): GameState {
  const dateStr = getTodayDateStr();
  const board = generateBoard(dateStr);
  return {
    dateStr,
    puzzleNumber: getPuzzleNumber(dateStr),
    initialBoard: board,
    board,
    moveCount: 0,
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
        solved: false,
        showModal: false,
        scoreSaved: false,
      };
    }

    case 'CLOSE_MODAL':
      return { ...state, showModal: false };

    case 'MARK_SAVED':
      return { ...state, scoreSaved: true };

    default:
      return state;
  }
}

// ── App ────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const leaderboard = useLeaderboard(state.dateStr, user);

  // Track whether we've already triggered auto-save for the current solve
  const autoSaveTriggered = useRef(false);

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
        .saveScore(user, state.dateStr, state.puzzleNumber, state.moveCount)
        .then(() => dispatch({ type: 'MARK_SAVED' }));
    }
  }, [state.solved, user, state.scoreSaved, state.dateStr, state.puzzleNumber, state.moveCount, leaderboard]);

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
        .saveScore(user, state.dateStr, state.puzzleNumber, state.moveCount)
        .then(() => dispatch({ type: 'MARK_SAVED' }));
    }
  }, [user, state.solved, state.scoreSaved, state.dateStr, state.puzzleNumber, state.moveCount, leaderboard]);

  // Save status message for the completion modal
  const saveStatusMessage = (() => {
    if (!state.solved) return null;
    if (!user) return 'sign-in' as const;
    if (leaderboard.saveStatus === 'pending') return 'pending' as const;
    if (leaderboard.saveStatus === 'saved') return 'saved' as const;
    if (leaderboard.saveStatus === 'kept') return 'kept' as const;
    if (leaderboard.saveStatus === 'error') return 'error' as const;
    return null;
  })();

  return (
    <div className="min-h-dvh bg-[#f0eeeb] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">


        {/* Header */}
        <GameHeader
          dateStr={state.dateStr}
          puzzleNumber={state.puzzleNumber}
          moveCount={state.moveCount}
        />

        {/* Board */}
        <div className="bg-white rounded-2xl p-3 border border-gray-200">
          <Board board={state.board} />
        </div>

        {/* Color Picker */}
        <ColorPicker
          currentColor={currentColor}
          onPickColor={handlePickColor}
          disabled={state.solved}
        />

        {/* Controls */}
        <Controls
          onReset={handleReset}
          disabled={state.solved}
        />

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
