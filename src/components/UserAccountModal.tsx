import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { X, LogIn, LogOut, Cloud, CloudCheck, Shield, Sparkles, User, RefreshCw } from 'lucide-react';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectsCount: number;
}

export default function UserAccountModal({ isOpen, onClose, projectsCount }: UserAccountModalProps) {
  const { user, loading, signInWithGoogle, signOut, error, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    clearError();
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col justify-end transition-all">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-[#101010] border-t border-white/[0.08] rounded-t-3xl max-h-[85%] flex flex-col shadow-2xl z-10 p-5 space-y-4 select-none">
        {/* Grabber */}
        <div className="w-10 h-1 bg-stone-800 rounded-full mx-auto" onClick={onClose} />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-light text-white leading-none">
                Firebase Cloud Sync
              </h3>
              <p className="text-[9px] uppercase tracking-wider text-stone-500 font-mono mt-0.5">
                Authentication & Firestore Database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start justify-between gap-2">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-white text-xs font-bold">✕</button>
          </div>
        )}

        {user ? (
          /* Logged In View */
          <div className="space-y-4">
            <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-12 h-12 rounded-full border border-amber-500/40 shadow-md object-cover" 
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-lg flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {user.displayName || 'Project Lead'}
                </span>
                <span className="text-[10px] text-stone-400 block truncate font-mono">
                  {user.email}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Synced
                  </span>
                  <span className="text-[9px] text-stone-500 font-mono">
                    {projectsCount} project{projectsCount !== 1 ? 's' : ''} stored
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#141414] border border-white/[0.04] rounded-xl p-3 space-y-1.5 text-[11px] text-stone-400">
              <div className="flex items-center gap-2 text-stone-300 font-medium">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Zero-Trust Firestore Security</span>
              </div>
              <p className="text-[10px] leading-relaxed text-stone-500">
                Your projects, initiatives, milestones, and daily focus goals are backed up securely to Firebase Firestore with real-time multi-device sync.
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/[0.08] text-stone-300 hover:text-red-400 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          /* Not Logged In View */
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#161616] to-[#111111] border border-white/[0.06] rounded-2xl p-4 space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-white">
                Sign in to Sync with Firebase
              </h4>
              <p className="text-[11px] text-stone-400 leading-normal max-w-xs mx-auto">
                Connect your account to automatically synchronize your projects, milestones, deadlines, and daily focus across sessions and devices.
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full py-3 rounded-xl bg-white hover:bg-stone-200 active:scale-[0.99] text-stone-950 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting to Firebase...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>

            <p className="text-[9px] text-stone-500 text-center font-mono">
              Offline mode remains active if you choose not to sign in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
