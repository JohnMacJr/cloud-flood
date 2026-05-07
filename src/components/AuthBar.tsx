import type { User } from 'firebase/auth';

interface AuthBarProps {
  user: User | null;
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
          <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end items-center gap-3 h-10 animate-fade-in">
      <div className="flex items-center gap-2">
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt=""
            className="w-7 h-7 rounded-full ring-2 ring-gray-100"
            referrerPolicy="no-referrer"
          />
        )}
        <span className="text-sm text-gray-500 max-w-[140px] truncate">
          {user.displayName || user.email}
        </span>
      </div>
      <button
        id="sign-out-btn"
        onClick={onSignOut}
        className="px-3 py-1.5 rounded-lg text-xs font-medium
          text-gray-400 hover:text-gray-600 hover:bg-gray-100
          transition-all duration-150 cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
