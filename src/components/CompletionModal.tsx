import { useState } from 'react';
import { generateShareText } from '../lib/puzzle';
import { GRID_SIZE, NUM_COLORS } from '../lib/constants';

type SaveStatus = 'sign-in' | 'pending' | 'saved' | 'duplicate' | 'error' | null;

interface CompletionModalProps {
  puzzleNumber: number;
  moveCount: number;
  onClose: () => void;
  saveStatusMessage: SaveStatus;
  onSignIn: () => void;
}

function SaveStatusDisplay({
  status,
  onSignIn,
}: {
  status: SaveStatus;
  onSignIn: () => void;
}) {
  if (!status) return null;

  switch (status) {
    case 'sign-in':
      return (
        <button
          onClick={onSignIn}
          className="text-sm text-blue-500 hover:text-blue-600
            transition-colors duration-150 cursor-pointer font-medium"
        >
          Sign in to save your score →
        </button>
      );
    case 'pending':
      return (
        <p className="text-sm text-gray-400 animate-pulse">Saving score…</p>
      );
    case 'saved':
      return (
        <p className="text-sm text-emerald-600 font-medium animate-fade-in">
          ✓ Score saved to leaderboard
        </p>
      );
    case 'duplicate':
      return (
        <p className="text-sm text-amber-600 font-medium animate-fade-in">
          ✓ Score already submitted
        </p>
      );
    case 'error':
      return (
        <p className="text-sm text-red-500 font-medium animate-fade-in">
          ✗ Failed to save score
        </p>
      );
    default:
      return null;
  }
}

export default function CompletionModal({
  puzzleNumber,
  moveCount,
  onClose,
  saveStatusMessage,
  onSignIn,
}: CompletionModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = generateShareText(puzzleNumber, moveCount);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt
      prompt('Copy your result:', text);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-5 shadow-xl animate-scale-in">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">Puzzle Complete!</h2>

        <div className="space-y-1 bg-gray-50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Daily Flood #{puzzleNumber}</p>
          <p className="text-3xl font-extrabold text-gray-900 tabular-nums">
            {moveCount} <span className="text-lg font-normal text-gray-400">moves</span>
          </p>
          <p className="text-gray-300 text-xs">{GRID_SIZE}×{GRID_SIZE} · {NUM_COLORS} colors</p>
        </div>

        {/* Save status */}
        <SaveStatusDisplay status={saveStatusMessage} onSignIn={onSignIn} />

        <div className="flex flex-col gap-3">
          <button
            id="share-btn"
            onClick={handleShare}
            className="w-full py-3 rounded-xl bg-gray-900 text-white
              font-semibold hover:bg-gray-800
              transition-all duration-150 active:scale-[0.98]
              cursor-pointer"
          >
            {copied ? '✓ Copied!' : '📋 Share Result'}
          </button>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-100 text-gray-500
              hover:bg-gray-200 hover:text-gray-700
              transition-all duration-150 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
