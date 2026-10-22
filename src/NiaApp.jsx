import React, { useState, useEffect } from 'react';
import { Shield, Sun, Moon, ExternalLink, KeyRound, Loader2, Eye, EyeOff, FileSpreadsheet, Users, Sparkles } from 'lucide-react';
import { AppProvider } from './contexts/AppContext';
import NiaPanel from './components/nia/NiaPanel';
import { grantNiaSession, isNiaSession, revokeNiaSession } from './utils/session';
import { getNiaPIN, saveNiaPIN, syncFromDisk, getDarkMode, saveDarkMode } from './utils/storage';
import { hashPIN, verifyPIN } from './utils/helpers';

// ─── PIN Gate (lives here in NIA app) ─────────────────────────────────────────
function NiaPINGate({ onUnlocked, onPinSet }) {
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockdownSecs, setLockdownSecs] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const SESSION_ATTEMPT_KEY = 'sed_nia_attempts';
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_ATTEMPT_KEY);
    if (raw) {
      try {
        const { lockedUntil } = JSON.parse(raw);
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining > 0) setLockdownSecs(remaining);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (lockdownSecs <= 0) return;
    const t = setInterval(() => setLockdownSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockdownSecs]);

  const recordFail = () => {
    const count = attemptCount + 1;
    setAttemptCount(count);
    if (count >= MAX_ATTEMPTS) {
      const lockedUntil = Date.now() + LOCKOUT_MS;
      sessionStorage.setItem(SESSION_ATTEMPT_KEY, JSON.stringify({ count, lockedUntil }));
      setLockdownSecs(Math.ceil(LOCKOUT_MS / 1000));
      setError('Too many failed attempts. Locked for 5 minutes.');
    } else {
      setError(`Wrong PIN. ${MAX_ATTEMPTS - count} attempt(s) remaining.`);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (lockdownSecs > 0 || loading || !pinInput) return;
    setLoading(true);
    setError('');
    try {
      // 1. Attempt secure serverless verification via /api/auth
      let authenticated = false;
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pinInput.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.success) {
            authenticated = true;
          }
        }
      } catch {
        // Fallback if offline or static host
      }

      // 2. Fallback to local stored hash verification if serverless endpoint is offline
      if (!authenticated) {
        const storedHash = getNiaPIN();
        const ok = await verifyPIN(pinInput.trim(), storedHash);
        if (ok) authenticated = true;
      }

      if (authenticated) {
        sessionStorage.removeItem(SESSION_ATTEMPT_KEY);
        setLockdownSecs(0);
        setAttemptCount(0);
        grantNiaSession();
        onUnlocked();
      } else {
        recordFail();
      }
    } catch (err) {
      setError('Verification error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPIN = async (e) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setError('PIN must be at least 4 characters.');
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setError('PINs do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const hash = await hashPIN(newPin.trim());
      saveNiaPIN(hash);
      onPinSet?.(hash);
      grantNiaSession();
      onUnlocked();
    } catch (err) {
      setError('Failed to set PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasPIN = Boolean(getNiaPIN());

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white text-3xl mb-3 shadow-lg shadow-emerald-600/20">
            ⚙️
          </div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 font-display">
            NIA Portal
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Smart Entrepreneurs Directory
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-7 shadow-xl space-y-5">
          {hasPIN ? (
            <>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Shield size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                    NIA Verification
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Enter your security credentials to access NIA governance
                  </p>
                </div>
              </div>

              {lockdownSecs > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-bold text-center">
                    Too many failed attempts — locked for {lockdownSecs}s
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem(SESSION_ATTEMPT_KEY);
                      setLockdownSecs(0);
                      setAttemptCount(0);
                      setError('');
                    }}
                    className="w-full text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 font-bold underline cursor-pointer text-center"
                  >
                    Reset Lockout Timer & Retry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUnlock} className="space-y-3.5">
                  <div>
                    <label className="label text-[10px]">Security Password / PIN</label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        placeholder="Enter security password"
                        className="input py-2.5 px-10 text-sm font-mono tracking-wider text-center w-full"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="space-y-1.5 text-center">
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          sessionStorage.removeItem(SESSION_ATTEMPT_KEY);
                          setAttemptCount(0);
                          setLockdownSecs(0);
                          setError('');
                        }}
                        className="text-[11px] text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 underline font-semibold cursor-pointer"
                      >
                        Reset Attempts Counter
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !pinInput}
                    className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={14} className="animate-spin" /> Verifying...
                      </span>
                    ) : (
                      'Unlock NIA Portal'
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-xl">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                    Set NIA Security PIN
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Create a PIN to protect your directory database
                  </p>
                </div>
              </div>

              <form onSubmit={handleSetPIN} className="space-y-3.5">
                <div>
                  <label className="label text-[10px]">New PIN (min 4 characters)</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Enter new PIN"
                    className="input py-2 text-xs"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label text-[10px]">Confirm New PIN</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Repeat PIN"
                    className="input py-2 text-xs"
                  />
                </div>
                {error && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 text-xs font-bold cursor-pointer"
                >
                  {loading ? 'Saving PIN...' : 'Set PIN & Enter NIA'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6">
          <a
            href="/index.html"
            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 inline-flex items-center gap-1 font-semibold transition-colors"
          >
            <ExternalLink size={12} /> Back to Public Directory
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── NIA App Shell ────────────────────────────────────────────────────────────
export default function NiaApp() {
  const [unlocked, setUnlocked] = useState(isNiaSession());
  const [darkMode, setDarkMode] = useState(getDarkMode());
  const [pinHash, setPinHash] = useState(getNiaPIN());
  const [isInitializing, setIsInitializing] = useState(true);
  const [adminTab, setAdminTab] = useState('overview');

  // Sync disk storage on mount to ensure persistent PIN and data are loaded
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);

    syncFromDisk()
      .then((diskData) => {
        if (diskData) {
          if (diskData.adminPIN || diskData.niaPIN) {
            setPinHash(diskData.niaPIN || diskData.adminPIN);
          } else {
            // Default PIN hash aligned with persistent directory_db.json
            const defaultHash = '0568510e983947061ab03d780ad117058058af692fea26606e03d102f62f34f4';
            saveNiaPIN(defaultHash);
            setPinHash(defaultHash);
          }
        }
        setIsInitializing(false);
      })
      .catch(() => {
        setIsInitializing(false);
      });

    const handleStorageUpdate = () => {
      setPinHash(getNiaPIN());
    };

    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('sed_storage_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('sed_storage_updated', handleStorageUpdate);
    };
  }, [darkMode]);

  const toggleDark = () => {
    const next = !darkMode;
    saveDarkMode(next);
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleLock = () => {
    revokeNiaSession();
    setUnlocked(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-500">
          <Loader2 size={16} className="animate-spin text-emerald-600" />
          <span>Loading secure NIA environment...</span>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      {!unlocked ? (
        <NiaPINGate
          onPinSet={(newHash) => setPinHash(newHash)}
          onUnlocked={() => setUnlocked(true)}
        />
      ) : (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-200 overflow-x-hidden">
          {/* NIA Header */}
          <header className="sticky top-0 z-40 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-3.5 sm:px-6 py-2.5 sm:py-3.5">
            <div className="flex items-center gap-3 sm:gap-4 max-w-[1600px] w-full mx-auto">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-sm sm:text-base font-black shadow-sm shrink-0">
                  ⚙️
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-tight leading-tight">
                    NIA Portal
                  </h1>
                  <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 leading-tight">
                    Smart Entrepreneurs Directory
                  </p>
                </div>
              </div>
              <div className="flex-1" />
              <a
                href="/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex sm:hidden p-2 rounded-xl text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                title="Public Directory"
              >
                <ExternalLink size={16} />
              </a>
              <a
                href="/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium transition-colors"
              >
                <ExternalLink size={13} /> Public Directory
              </a>
              <button
                onClick={toggleDark}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Toggle Dark Mode"
              >
                {darkMode ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-indigo-600" />
                )}
              </button>
            </div>
          </header>

          {/* NIA Content */}
          <main className="max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-10 py-4 sm:py-8 pb-24 lg:pb-8">
            <NiaPanel isNiaApp onLock={handleLock} activeTab={adminTab} setActiveTab={setAdminTab} />
          </main>

          {/* Mobile Bottom Admin Dock (Thumb Navigation) */}
          <nav
            aria-label="Admin Navigation Dock"
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 pb-[env(safe-area-inset-bottom,0px)] shadow-lg"
          >
            <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1 sm:px-2">
              <button
                type="button"
                onClick={() => {
                  setAdminTab('overview');
                  navigator.vibrate?.([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 ${
                  adminTab === 'overview'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <FileSpreadsheet size={18} />
                <span className="text-[10px] tracking-tight">Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminTab('members');
                  navigator.vibrate?.([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 relative ${
                  adminTab === 'members'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Users size={18} />
                <span className="text-[10px] tracking-tight">Members</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminTab('ai');
                  navigator.vibrate?.([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 ${
                  adminTab === 'ai'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Sparkles size={18} />
                <span className="text-[10px] tracking-tight">AI Match</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAdminTab('system');
                  navigator.vibrate?.([10]);
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer py-1 ${
                  adminTab === 'system'
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Shield size={18} />
                <span className="text-[10px] tracking-tight">Security</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </AppProvider>
  );
}
