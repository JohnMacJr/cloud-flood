import type { User } from 'firebase/auth';
import type { LeaderboardEntry, SaveResult } from '../lib/leaderboard';

interface LeaderboardProps {
  user: User | null;
  scores: LeaderboardEntry[];
  loading: boolean;
  userScore: LeaderboardEntry | null;
  userRank: number | null;
  userStats: { totalCompleted: number; bestScore: number | null } | null;
  saveStatus: SaveResult | 'pending' | null;
  onSignIn: () => void;
}

function SaveStatusBadge({ status }: { status: SaveResult | 'pending' | null }) {
  if (!status) return null;

  const config = {
    pending: { text: 'Saving…', color: 'text-gray-400' },
    saved: { text: '✓ Score saved', color: 'text-emerald-600' },
    kept: { text: '✓ Best score kept', color: 'text-amber-600' },
    error: { text: '✗ Save failed', color: 'text-red-500' },
  }[status];

  return (
    <span className={`text-xs font-medium ${config.color} animate-fade-in`}>
      {config.text}
    </span>
  );
}

export default function Leaderboard({
  user,
  scores,
  loading,
  userScore,
  userRank,
  userStats,
  saveStatus,
  onSignIn,
}: LeaderboardProps) {
  // ── Not signed in ──
  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center space-y-3 max-w-sm mx-auto">
        <p className="text-sm text-gray-400">
          Sign in to view the leaderboard and save your daily score.
        </p>
        <button
          id="leaderboard-sign-in-btn"
          onClick={onSignIn}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium
            hover:bg-gray-800 transition-all duration-150 cursor-pointer"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-4 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <span>🏆</span> Today's Leaderboard
        </h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

      {/* User stats bar */}
      {(userScore || userStats) && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
          {userScore && (
            <div>
              <span className="text-gray-900 font-semibold text-sm tabular-nums">
                {userScore.moves}
              </span>{' '}
              moves today
            </div>
          )}
          {userRank && (
            <div>
              Rank{' '}
              <span className="text-gray-900 font-semibold text-sm tabular-nums">
                #{userRank}
              </span>
            </div>
          )}
          {userStats && userStats.totalCompleted > 0 && (
            <>
              <div>
                <span className="text-gray-900 font-semibold text-sm tabular-nums">
                  {userStats.totalCompleted}
                </span>{' '}
                {userStats.totalCompleted === 1 ? 'puzzle' : 'puzzles'} solved
              </div>
              {userStats.bestScore !== null && (
                <div>
                  Best{' '}
                  <span className="text-gray-900 font-semibold text-sm tabular-nums">
                    {userStats.bestScore}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && scores.length === 0 && (
        <p className="text-sm text-gray-300 text-center py-4">
          No scores yet today. Be the first!
        </p>
      )}

      {/* Scores table */}
      {!loading && scores.length > 0 && (
        <div className="space-y-1">
          {scores.map((entry, index) => {
            const isUser = user && entry.uid === user.uid;
            const rank = index + 1;
            const medal =
              rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

            return (
              <div
                key={entry.uid}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-colors duration-150 animate-slide-up
                  ${isUser
                    ? 'bg-blue-50 border border-blue-100'
                    : 'hover:bg-gray-50'
                  }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Rank */}
                <span className="w-7 text-center text-sm font-semibold text-gray-300 tabular-nums">
                  {medal || rank}
                </span>

                {/* Avatar */}
                {entry.photoURL ? (
                  <img
                    src={entry.photoURL}
                    alt=""
                    className="w-7 h-7 rounded-full flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {(entry.displayName || '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Name */}
                <span
                  className={`flex-1 text-sm truncate ${
                    isUser ? 'font-semibold text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {entry.displayName}
                  {isUser && (
                    <span className="text-[10px] text-blue-400 ml-1.5 font-normal">
                      you
                    </span>
                  )}
                </span>

                {/* Moves */}
                <span
                  className={`text-sm tabular-nums font-semibold ${
                    isUser ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {entry.moves}
                </span>
                <span className="text-[10px] text-gray-300">moves</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
