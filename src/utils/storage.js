/* eslint-disable no-unused-vars */
import { STORAGE_KEYS, SEED_MEMBERS } from './constants';
import { generateId } from './helpers';

// ─── Module-level cache (fast synchronous access) ─────────────────────────────
let _membersCache = null;
let _exchangeCache = null;

export function invalidateMembersCache() {
  _membersCache = null;
  _exchangeCache = null;
}

function notifyStorageChange() {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sed_storage_updated', { detail: { key: STORAGE_KEYS.MEMBERS } })
      );
    }
  } catch {
    // ignore
  }
}

// Background sync to disk via Vite middleware
async function pushToDisk(payload) {
  try {
    if (typeof fetch !== 'undefined') {
      await fetch('/api/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    // Server not available (offline or static build) — localStorage handles persistence
  }
}

export async function syncFromDisk() {
  try {
    if (typeof fetch !== 'undefined') {
      const res = await fetch('/api/storage');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          if (Array.isArray(data.members)) {
            // Only update local storage if local storage does not already have a richer/fresher member list
            const currentLocalRaw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
            const currentLocal = currentLocalRaw ? JSON.parse(currentLocalRaw) : null;
            if (!Array.isArray(currentLocal) || currentLocal.length <= data.members.length) {
              _membersCache = data.members;
              localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(data.members));
            } else {
              _membersCache = currentLocal;
            }
          }
          if (Array.isArray(data.tombstones)) {
            const wasCleared = localStorage.getItem('sed_tombstones_cleared_at');
            if (!wasCleared || data.tombstones.length === 0) {
              localStorage.setItem(STORAGE_KEYS.TOMBSTONES, JSON.stringify(data.tombstones));
            }
          }
          if (data.sheetsConfig && typeof data.sheetsConfig === 'object') {
            localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(data.sheetsConfig));
          }
          const diskPin = data.niaPIN || data.adminPIN;
          if (diskPin) {
            localStorage.setItem(STORAGE_KEYS.NIA_PIN, diskPin);
            localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, diskPin);
          }
          if (Array.isArray(data.exchangePosts)) {
            _exchangeCache = data.exchangePosts;
            localStorage.setItem(STORAGE_KEYS.EXCHANGE, JSON.stringify(data.exchangePosts));
          }
          if (data.niaPhone) {
            localStorage.setItem(STORAGE_KEYS.NIA_PHONE, data.niaPhone);
          }
          if (data.apiKey) {
            localStorage.setItem(STORAGE_KEYS.API_KEY, data.apiKey);
          }
          localStorage.setItem('sed_initialized', 'true');
          notifyStorageChange();
          return data;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Members ──────────────────────────────────────────────────────────────────
export function getMembers() {
  if (_membersCache !== null) return _membersCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    const seededFlag = localStorage.getItem('sed_community_seeded_v1');

    if (!raw || !seededFlag) {
      // First load or upgrading from legacy demo data to real community members
      _membersCache = SEED_MEMBERS;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(SEED_MEMBERS));
      localStorage.setItem('sed_community_seeded_v1', 'true');
      localStorage.setItem('sed_initialized', 'true');
      pushToDisk({ members: SEED_MEMBERS });
      return _membersCache;
    }

    const parsed = JSON.parse(raw);
    _membersCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_MEMBERS;
    return _membersCache;
  } catch {
    _membersCache = SEED_MEMBERS;
    return _membersCache;
  }
}

export function saveMembers(members) {
  const safeList = Array.isArray(members) ? members : [];
  _membersCache = safeList;
  localStorage.setItem('sed_initialized', 'true');
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(safeList));
  notifyStorageChange();
  pushToDisk({ members: safeList });
}

export function addMember(memberData) {
  const members = getMembers();
  const member = {
    ...memberData,
    id: memberData.id || generateId(),
    createdAt: memberData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [member, ...members];
  saveMembers(updated);
  return member;
}

export function addMembers(newMembers) {
  const existing = getMembers();
  const existingNames = new Set(existing.map((m) => m.name?.toLowerCase().trim()));
  const toAdd = (newMembers || [])
    .filter((m) => m && m.name && !existingNames.has(m.name.toLowerCase().trim()))
    .map((m) => ({
      ...m,
      id: m.id || generateId(),
      createdAt: m.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  const merged = [...toAdd, ...existing];
  saveMembers(merged);
  return toAdd;
}

export function updateMember(id, updates) {
  const members = getMembers();
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  const updatedMember = {
    ...members[idx],
    ...updates,
    locallyEdited: true,
    updatedAt: new Date().toISOString(),
  };
  members[idx] = updatedMember;
  saveMembers([...members]);
  return members[idx];
}

export function deleteMember(id, options = {}) {
  const { recordTombstone = true, skipNameTombstone = false } = options;
  const members = getMembers();
  const target = members.find((m) => m.id === id);
  if (target && recordTombstone) {
    // Record tombstone to permanently prevent resurrection during Google Sheets sync
    if (target.name && !skipNameTombstone) addTombstone(target.name.trim().toLowerCase());
    if (target.id) addTombstone(target.id);
    if (target.sheetRowIndex) addTombstone(`sheet-row-${target.sheetRowIndex}`);
  }
  const filtered = members.filter((m) => m.id !== id);
  saveMembers(filtered);
}

export function getMember(id) {
  return getMembers().find((m) => m.id === id) || null;
}

// ─── Load Sample Demo Profiles (Explicit Admin Trigger) ──────────────────────
export function loadDemoSeedData() {
  saveMembers(SEED_MEMBERS);
  return SEED_MEMBERS;
}

// ─── API Key ──────────────────────────────────────────────────────────────────
export function getAPIKey() {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function saveAPIKey(key) {
  const clean = (key || '').trim();
  localStorage.setItem(STORAGE_KEYS.API_KEY, clean);
  pushToDisk({ apiKey: clean });
}

export function clearAPIKey() {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  pushToDisk({ apiKey: '' });
}

// ─── Dark Mode ────────────────────────────────────────────────────────────────
export function getDarkMode() {
  const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
  if (stored !== null) return stored === 'true';
  return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
}

export function saveDarkMode(isDark) {
  localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
  pushToDisk({ darkMode: isDark });
}

// ─── NIA PIN ──────────────────────────────────────────────────────────────────
// Default hash aligned with persistent directory_db.json
const DEFAULT_PIN_HASH = '0568510e983947061ab03d780ad117058058af692fea26606e03d102f62f34f4';

export function getNiaPIN() {
  return (
    localStorage.getItem(STORAGE_KEYS.NIA_PIN) ||
    localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) ||
    DEFAULT_PIN_HASH
  );
}

export function saveNiaPIN(pinHash) {
  const safeHash = pinHash || DEFAULT_PIN_HASH;
  localStorage.setItem(STORAGE_KEYS.NIA_PIN, safeHash);
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, safeHash);
  pushToDisk({ adminPIN: safeHash, niaPIN: safeHash });
  notifyStorageChange();
}

export function clearNiaPIN() {
  localStorage.setItem(STORAGE_KEYS.NIA_PIN, DEFAULT_PIN_HASH);
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, DEFAULT_PIN_HASH);
  pushToDisk({ adminPIN: DEFAULT_PIN_HASH, niaPIN: DEFAULT_PIN_HASH });
  notifyStorageChange();
}

// Aliases for backwards compatibility
export const getAdminPIN = getNiaPIN;
export const saveAdminPIN = saveNiaPIN;
export const clearAdminPIN = clearNiaPIN;

// ─── Map Configuration ────────────────────────────────────────────────────────
export function getMapConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAP_CONFIG);
    if (!raw) {
      return {
        provider: 'esri_world',
        apiKey: '',
        styleId: '',
        customTileUrl: '',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      provider: 'esri_world',
      apiKey: '',
      styleId: '',
      customTileUrl: '',
    };
  }
}

export function saveMapConfig(config) {
  const safe = {
    provider: config?.provider || 'esri_world',
    apiKey: (config?.apiKey || '').trim(),
    styleId: (config?.styleId || '').trim(),
    customTileUrl: (config?.customTileUrl || '').trim(),
  };
  localStorage.setItem(STORAGE_KEYS.MAP_CONFIG, JSON.stringify(safe));
  pushToDisk({ mapConfig: safe });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sed_map_config_updated', { detail: safe }));
  }
  return safe;
}

// ─── Full Backup Export / Import ─────────────────────────────────────────────
export function exportAllData() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    members: getMembers(),
  };
}

export function importAllData(data, mode = 'merge') {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup file');

  const incomingMembers = data.members || (Array.isArray(data) ? data : []);

  if (mode === 'replace') {
    saveMembers(incomingMembers);
  } else {
    // Merge mode: add new members by unique ID or Name
    const existing = getMembers();
    const existingIds = new Set(existing.map((m) => m.id));
    const newItems = incomingMembers.filter((m) => !existingIds.has(m.id));
    saveMembers([...existing, ...newItems]);
  }
}

export function clearAllData() {
  _membersCache = [];
  _exchangeCache = [];
  localStorage.setItem('sed_initialized', 'true');
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
  notifyStorageChange();
  pushToDisk({ members: [] });
}

// ─── Google Sheets Sync Configuration ────────────────────────────────────────
const DEFAULT_SHEETS_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SHEETS_URL) ||
  'https://script.google.com/macros/s/AKfycbw4LsEO25x4cShDWg8nI6DSwqURApEB9aMNgT6nb7rPGRkOxlS2nP144PxJLtO6eR9F8Q/exec';

export function getSheetsConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);
    if (!raw) {
      return {
        apiUrl: DEFAULT_SHEETS_URL,
        autoSync: false,
        lastSyncAt: null,
        lastSyncStatus: null,
      };
    }
    const parsed = JSON.parse(raw);
    // Always ensure a URL is present even if stored config has empty string
    if (!parsed.apiUrl) parsed.apiUrl = DEFAULT_SHEETS_URL;
    return parsed;
  } catch {
    return {
      apiUrl: DEFAULT_SHEETS_URL,
      autoSync: false,
      lastSyncAt: null,
      lastSyncStatus: null,
    };
  }
}

export function saveSheetsConfig(config) {
  const safe = {
    apiUrl: (config?.apiUrl || '').trim(),
    autoSync: Boolean(config?.autoSync),
    lastSyncAt: config?.lastSyncAt || null,
    lastSyncStatus: config?.lastSyncStatus || null,
  };
  localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(safe));
  pushToDisk({ sheetsConfig: safe });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sed_sheets_config_updated', { detail: safe }));
  }
  return safe;
}

// ─── Tombstones (Permanent Deletion Memory for Google Sheets Sync) ───────────
export function getTombstones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOMBSTONES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addTombstone(tombstoneKey) {
  if (!tombstoneKey || typeof tombstoneKey !== 'string') return;
  const clean = tombstoneKey.trim().toLowerCase();
  const current = getTombstones();
  if (!current.includes(clean)) {
    const updated = [...current, clean];
    try {
      localStorage.removeItem('sed_tombstones_cleared_at');
      localStorage.setItem(STORAGE_KEYS.TOMBSTONES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    pushToDisk({ tombstones: updated });
  }
}

export function removeTombstone(tombstoneKey) {
  if (!tombstoneKey) return;
  const clean = String(tombstoneKey).trim().toLowerCase();
  const current = getTombstones();
  const updated = current.filter((k) => k !== clean);
  try {
    localStorage.setItem(STORAGE_KEYS.TOMBSTONES, JSON.stringify(updated));
  } catch {
    // ignore
  }
  pushToDisk({ tombstones: updated });
}

export function clearTombstones() {
  try {
    localStorage.setItem(STORAGE_KEYS.TOMBSTONES, JSON.stringify([]));
    localStorage.setItem('sed_tombstones_cleared_at', Date.now().toString());
  } catch {
    // ignore
  }
  pushToDisk({ tombstones: [] });
}

// ─── NIA Notification Email ──────────────────────────────────────────────────
export function getNiaEmail() {
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.NIA_EMAIL) ||
      localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) ||
      ''
    );
  } catch {
    return '';
  }
}

export function saveNiaEmail(email) {
  const safe = String(email || '').trim();
  localStorage.setItem(STORAGE_KEYS.NIA_EMAIL, safe);
  localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, safe);
  pushToDisk({ adminEmail: safe, niaEmail: safe });
  return safe;
}

// Aliases for backwards compatibility
export const getAdminEmail = getNiaEmail;
export const saveAdminEmail = saveNiaEmail;

// ─── NIA Phone & Growth Diagnostic WhatsApp ──────────────────────────────────
export function getNiaPhone() {
  try {
    return (
      localStorage.getItem(STORAGE_KEYS.NIA_PHONE) ||
      '201000998449'
    );
  } catch {
    return '201000998449';
  }
}

export function saveNiaPhone(phone) {
  const safe = String(phone || '').replace(/[^0-9]/g, '');
  localStorage.setItem(STORAGE_KEYS.NIA_PHONE, safe);
  pushToDisk({ niaPhone: safe });
  return safe;
}

// ─── Founder Problem Board (Exchange Posts) ───────────────────────────────────
export function getExchangePosts() {
  if (_exchangeCache) return _exchangeCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXCHANGE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    _exchangeCache = Array.isArray(parsed) ? parsed : [];
    return _exchangeCache;
  } catch {
    return [];
  }
}

export function saveExchangePosts(posts) {
  const safe = Array.isArray(posts) ? posts : [];
  _exchangeCache = safe;
  try {
    localStorage.setItem(STORAGE_KEYS.EXCHANGE, JSON.stringify(safe));
  } catch {
    // ignore
  }
  pushToDisk({ exchangePosts: safe });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sed_exchange_updated', { detail: safe })
    );
  }
  return safe;
}

// ─── Survey Responses Storage ────────────────────────────────────────────────
export function getSurveyResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SURVEY_RESPONSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSurveyResponse(response) {
  if (!response) return [];
  const current = getSurveyResponses();
  const updated = [
    {
      id: response.id || generateId('survey'),
      ...response,
      createdAt: response.createdAt || new Date().toISOString(),
    },
    ...current,
  ];
  try {
    localStorage.setItem(STORAGE_KEYS.SURVEY_RESPONSES, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('akv_survey_updated', { detail: updated }));
    }
  } catch {
    // ignore
  }
  return updated;
}

// ─── Quick Match Bookmarks & Internal Requests ───────────────────────────────
export function getQuickMatchBookmarks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUICK_MATCH_BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuickMatchBookmark(memberId) {
  const current = getQuickMatchBookmarks();
  if (current.includes(memberId)) return current;
  const updated = [...current, memberId];
  try {
    localStorage.setItem(STORAGE_KEYS.QUICK_MATCH_BOOKMARKS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function getCollabRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLAB_REQUESTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCollabRequest(request) {
  const current = getCollabRequests();
  const updated = [
    {
      id: generateId('collab'),
      ...request,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];
  try {
    localStorage.setItem(STORAGE_KEYS.COLLAB_REQUESTS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}
