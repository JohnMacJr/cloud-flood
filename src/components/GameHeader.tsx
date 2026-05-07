import { formatDate } from '../lib/puzzle';

interface GameHeaderProps {
  dateStr: string;
  puzzleNumber: number;
  moveCount: number;
}

export default function GameHeader({
  dateStr,
  puzzleNumber,
  moveCount,
}: GameHeaderProps) {
  return (
    <div className="text-center space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Daily Flood
      </h1>
      <p className="text-sm text-gray-400">
        {formatDate(dateStr)} · Puzzle #{puzzleNumber}
      </p>
      <div className="mt-3">
        <span className="text-5xl font-extrabold tabular-nums text-gray-900">
          {moveCount}
        </span>
        <span className="text-sm text-gray-400 ml-2">
          {moveCount === 1 ? 'move' : 'moves'}
        </span>
      </div>
    </div>
  );
}
