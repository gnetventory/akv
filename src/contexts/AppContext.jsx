/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMembers,
  saveMembers,
  getAPIKey,
  saveAPIKey,
  getDarkMode,
  saveDarkMode,
  invalidateMembersCache,
  syncFromDisk,
  getMapConfig,
  saveMapConfig,
} from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { initGemini } from '../utils/gemini';
import { syncFromGoogleSheets } from '../utils/sheetsSync';

// ─── Context Definitions ──────────────────────────────────────────────────────
const MembersContext = createContext(null);
const UIContext = createContext(null);
const FiltersContext = createContext(null);

// ─── AppProvider (composes all three) ────────────────────────────────────────
export function AppProvider({ children }) {
  // ── Data layer ───────────────────────────────────────────────────────────
  const [members, setMembersState] = useState(getMembers);

  // ── UI layer ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(getDarkMode);
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
    } catch {
      return 'en';
    }
  });
  const [apiKey, setApiKeyState] = useState(getAPIKey);
  const [mapConfig, setMapConfigState] = useState(getMapConfig);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null); // { type, message }

  // ── Filter layer ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'radar' | 'table'

  const refreshMembers = useCallback(() => {
    invalidateMembersCache();
    setMembersState(getMembers());
  }, []);

  // Public-facing members: only show approved/active ones.
  // Members without a status field (legacy data, seed data) are treated as active.
  const activeMembers = useMemo(
    () => members.filter((m) => !m.status || m.status === 'active'),
    [members]
  );

  const [isSheetsSyncing, setIsSheetsSyncing] = useState(false);

  // Initialize on mount & Fetch remote members from Google Sheets API
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (apiKey) initGemini(apiKey);

    // Initial load from storage & background sync from disk
    syncFromDisk().then((diskData) => {
      if (diskData && Array.isArray(diskData.members)) {
        // Only set diskData members if they don't downgrade fresher local records
        setMembersState((prev) => (prev.length <= diskData.members.length ? diskData.members : prev));
      }
      // Silently pull latest form submissions from Google Sheets
      setIsSheetsSyncing(true);
      syncFromGoogleSheets()
        .then((result) => {
          if (result && result.success) {
            invalidateMembersCache();
            setMembersState(getMembers());
          }
        })
        .catch(() => {
          // Sync failure is silent — app works fine from local data
        })
        .finally(() => {
          setIsSheetsSyncing(false);
        });
    });

    // ── Real-time Cross-Tab & Same-Tab Storage Event Synchronization ─────────
    const handleStorageEvent = (e) => {
      if (!e.key || e.key === STORAGE_KEYS.MEMBERS) {
        invalidateMembersCache();
        setMembersState(getMembers());
      }
      if (e.key === STORAGE_KEYS.DARK_MODE) {
        const newDm = getDarkMode();
        setDarkMode(newDm);
        document.documentElement.classList.toggle('dark', newDm);
      }
    };

    const handleCustomStorageUpdate = () => {
      invalidateMembersCache();
      setMembersState(getMembers());
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('sed_storage_updated', handleCustomStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('sed_storage_updated', handleCustomStorageUpdate);
    };
  }, []);

  // ── UI actions ─────────────────────────────────────────────────────────
  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'ar' ? 'en' : 'ar';
      try {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, next);
      } catch {
        // ignore
      }
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang) => {
    const safeLang = lang === 'ar' ? 'ar' : 'en';
    setLanguageState(safeLang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, safeLang);
    } catch {
      // ignore
    }
    document.documentElement.lang = safeLang;
    document.documentElement.dir = safeLang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      saveDarkMode(next);
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  const updateApiKey = useCallback((key) => {
    saveAPIKey(key);
    setApiKeyState(key);
    initGemini(key);
  }, []);

  const updateMapConfig = useCallback((config) => {
    const saved = saveMapConfig(config);
    setMapConfigState(saved);
  }, []);

  const notify = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // ── Stable context values ────────────────────────────────────────────────
  const membersValue = useMemo(
    () => ({
      members, // ALL members (including pending) — for admin use
      activeMembers, // Public-safe: only status='active' or no status (legacy)
      setMembersState,
      refreshMembers,
      isSheetsSyncing,
    }),
    [members, activeMembers, refreshMembers, isSheetsSyncing]
  );

  const uiValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      darkMode,
      toggleDarkMode,
      language,
      toggleLanguage,
      setLanguage,
      apiKey,
      updateApiKey,
      mapConfig,
      updateMapConfig,
      sidebarOpen,
      setSidebarOpen,
      notification,
      notify,
      isSheetsSyncing,
    }),
    [
      activeTab,
      darkMode,
      toggleDarkMode,
      language,
      toggleLanguage,
      setLanguage,
      apiKey,
      updateApiKey,
      mapConfig,
      updateMapConfig,
      sidebarOpen,
      notification,
      notify,
      isSheetsSyncing,
    ]
  );

  const filtersValue = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      stageFilter,
      setStageFilter,
      viewMode,
      setViewMode,
    }),
    [searchQuery, stageFilter, viewMode]
  );

  return (
    <MembersContext.Provider value={membersValue}>
      <UIContext.Provider value={uiValue}>
        <FiltersContext.Provider value={filtersValue}>{children}</FiltersContext.Provider>
      </UIContext.Provider>
    </MembersContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
export function useMembers() {
  const ctx = useContext(MembersContext);
  if (!ctx) throw new Error('useMembers must be used within AppProvider');
  return ctx;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within AppProvider');
  return ctx;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used within AppProvider');
  return ctx;
}

// ─── Legacy useApp hook (backward compat — aggregates all three) ──────────────
export function useApp() {
  const members = useMembers();
  const ui = useUI();
  const filters = useFilters();
  return { ...members, ...ui, ...filters };
}
