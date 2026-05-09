import { useState } from 'react';
import type { AppUser } from '../hooks/useAuth';

interface AuthBarProps {
  user: AppUser | null;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function AuthBar({
  user,
  loading,
  onSignIn,
  onSignOut,
}: AuthBarProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (loading) {
    return (
      <div className="flex justify-end items-center h-10">
        <div className="w-24 h-8 rounded-lg bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-end items-center h-10">
        <button
          id="sign-in-btn"
          onClick={onSignIn}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-white border border-gray-200 text-sm font-medium text-gray-600
            hover:bg-gray-50 hover:text-gray-800 hover:border-gray-300
            transition-all duration-150 cursor-pointer
            shadow-sm hover:shadow"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end items-center gap-3 h-10 animate-fade-in">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">
          {user.nickname}
        </span>
      </div>
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <button
        id="sign-out-btn"
        onClick={() => setShowConfirm(true)}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 
          transition-colors duration-150 cursor-pointer"
      >
        Sign out
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-4 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900">Sign out of Daily Flood?</h3>
            <p className="text-sm text-gray-500">
              You won't be able to save your score or view the leaderboard until you sign back in. Your local puzzle progress will be kept.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  onSignOut();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
