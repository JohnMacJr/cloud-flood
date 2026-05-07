import { useReducer, useCallback } from 'react';
import { generateBoard } from './lib/boardGen';
import { applyMove, getCapturedColor, isSolved } from './lib/floodFill';
import { getTodayDateStr, getPuzzleNumber } from './lib/puzzle';
import Board from './components/Board';
import ColorPicker from './components/ColorPicker';
import GameHeader from './components/GameHeader';
import Controls from './components/Controls';
import CompletionModal from './components/CompletionModal';

// ── State ──────────────────────────────────────────────

interface GameState {
  dateStr: string;
  puzzleNumber: number;
  initialBoard: number[][];
  board: number[][];
  moveCount: number;
  solved: boolean;
  showModal: boolean;
}

type GameAction =
  | { type: 'MOVE'; color: number }
  | { type: 'RESET' }
  | { type: 'CLOSE_MODAL' };

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
      };
    }

    case 'RESET': {
      return {
        ...state,
        board: state.initialBoard,
        moveCount: 0,
        solved: false,
        showModal: false,
      };
    }

    case 'CLOSE_MODAL':
      return { ...state, showModal: false };

    default:
      return state;
  }
}

// ── App ────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const handlePickColor = useCallback(
    (color: number) => dispatch({ type: 'MOVE', color }),
    [],
  );

  const handleReset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const handleCloseModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);

  const currentColor = getCapturedColor(state.board);

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

        {/* Completion Modal */}
        {state.showModal && (
          <CompletionModal
            puzzleNumber={state.puzzleNumber}
            moveCount={state.moveCount}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
}
