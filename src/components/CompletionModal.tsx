import { useState } from 'react';
import { generateShareText } from '../lib/puzzle';

interface CompletionModalProps {
  puzzleNumber: number;
  moveCount: number;
  onClose: () => void;
}

export default function CompletionModal({
  puzzleNumber,
  moveCount,
  onClose,
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
          <p className="text-gray-300 text-xs">8×8 · 5 colors</p>
        </div>

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
