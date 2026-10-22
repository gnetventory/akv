/* eslint-disable no-unused-vars, no-useless-escape */
import { AVATAR_GRADIENTS, STAGES } from './constants';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

// ─── Avatar & Name Parsing ───────────────────────────────────────────────────
export function parseMemberName(rawName = '') {
  if (!rawName || typeof rawName !== 'string') {
    return { english: '', arabic: '', primary: '' };
  }

  const str = rawName.trim();
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const englishRegex = /[a-zA-Z]/;

  // Check if string contains parentheses e.g. "A (B)" or "(A) B" or "[A] B"
  const match = str.match(/^(.*?)\s*[\(\[](.*?)[\)\]]\s*(.*?)$/);
  if (match) {
    const part1 = (match[1] || match[3] || '').trim();
    const partInParen = (match[2] || '').trim();

    let english = '';
    let arabic = '';

    if (englishRegex.test(part1) && arabicRegex.test(partInParen)) {
      english = part1;
      arabic = partInParen;
    } else if (arabicRegex.test(part1) && englishRegex.test(partInParen)) {
      arabic = part1;
      english = partInParen;
    } else if (englishRegex.test(part1)) {
      english = part1;
      arabic = partInParen;
    } else if (arabicRegex.test(part1)) {
      arabic = part1;
      english = partInParen;
    } else {
      english = partInParen || part1;
    }

    return {
      english: english.replace(/[\(\)\[\]]/g, '').trim(),
      arabic: arabic.replace(/[\(\)\[\]]/g, '').trim(),
      primary: english || arabic || str,
    };
  }

  // If no parentheses, split by words
  const words = str.split(/\s+/);
  const engWords = [];
  const arWords = [];
  words.forEach((w) => {
    if (arabicRegex.test(w)) arWords.push(w);
    else if (englishRegex.test(w)) engWords.push(w);
    else {
      if (engWords.length > 0) engWords.push(w);
      else if (arWords.length > 0) arWords.push(w);
    }
  });

  const english = engWords.join(' ').replace(/[\(\)\[\]]/g, '').trim();
  const arabic = arWords.join(' ').replace(/[\(\)\[\]]/g, '').trim();

  return {
    english,
    arabic,
    primary: english || arabic || str,
  };
}

export function getInitials(name = '') {
  if (!name || typeof name !== 'string') return 'SE';

  const { english, arabic, primary } = parseMemberName(name);
  const targetName = english || primary || name;

  // Extract words containing English letters only
  const words = targetName
    .split(/[\s\-_,.:;@/\\+]+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    const single = words[0].toUpperCase();
    return single.length >= 2 ? single.slice(0, 2) : single;
  }

  const allEnglishLetters = targetName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (allEnglishLetters.length >= 2) {
    return allEnglishLetters.slice(0, 2);
  }
  if (allEnglishLetters.length === 1) {
    return allEnglishLetters;
  }

  return 'SE';
}

export function getAvatarGradient(name = '') {
  if (!name || typeof name !== 'string') return AVATAR_GRADIENTS[0];
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

// ─── Dates ─────────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  try {
    if (!dateStr) return 'recently';
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function isStale(dateStr, thresholdDays = 90) {
  try {
    if (!dateStr) return false;
    return differenceInDays(new Date(), new Date(dateStr)) >= thresholdDays;
  } catch {
    return false;
  }
}

export function daysSince(dateStr) {
  try {
    if (!dateStr) return 0;
    return differenceInDays(new Date(), new Date(dateStr));
  } catch {
    return 0;
  }
}

// ─── Stage helpers ─────────────────────────────────────────────────────────────
export function getStage(stageKey) {
  return STAGES[stageKey] || STAGES.idea;
}

// ─── Phone number normalizer & WhatsApp ────────────────────────────────────────
export function normalizePhone(phone = '') {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/[\s\-().+]/g, '');
}

export function buildWhatsAppUrl(phone = '', name = '') {
  const num = normalizePhone(phone);
  if (!num || num.length < 5) return null;
  return `https://wa.me/${num}`;
}

// ─── LinkedIn Validation & Normalization ───────────────────────────────────────
const INVALID_LINKEDIN_VALUES = new Set([
  'none',
  'n/a',
  'na',
  'no',
  'null',
  'undefined',
  'false',
  '0',
  'test',
  'hnaklinked',
  'linkedin',
  'profile',
]);

export function isValidLinkedInUrl(url = '') {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase().replace(/^@/, '');
  if (clean.length < 3 || INVALID_LINKEDIN_VALUES.has(clean)) return false;
  // Valid if it looks like a url or a valid profile handle
  return /^[a-zA-Z0-9_\-\.\/:]+$/.test(clean);
}

export function formatLinkedInUrl(url = '') {
  if (!isValidLinkedInUrl(url)) return null;
  const clean = url.trim().replace(/^@/, '');

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  if (clean.startsWith('linkedin.com/') || clean.startsWith('www.linkedin.com/')) {
    return `https://${clean}`;
  }
  if (clean.startsWith('in/')) {
    return `https://linkedin.com/${clean}`;
  }
  return `https://linkedin.com/in/${clean}`;
}

export function getLinkedInHandle(url = '') {
  if (!isValidLinkedInUrl(url)) return null;
  const clean = url
    .trim()
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/(in\/)?/, '')
    .replace(/\/$/, '');
  return clean || null;
}

const VALID_TLDS = new Set([
  'com',
  'org',
  'net',
  'io',
  'ai',
  'co',
  'app',
  'dev',
  'me',
  'eg',
  'sa',
  'ae',
  'uk',
  'us',
  'de',
  'fr',
  'tech',
  'agency',
  'store',
  'online',
  'club',
  'space',
  'site',
  'info',
  'biz',
  'design',
  'global',
  'cloud',
  'digital',
  'link',
  'page',
  'social',
  'group',
  'media',
  'news',
  'tv',
  'fm',
  'xyz',
  'cc',
  'gg',
  'ly',
  'sh',
  'to',
  'is',
  'world',
  'network',
  'pro',
  'solutions',
]);

const KNOWN_PLATFORM_DOMAINS = [
  'tiktok.com',
  'facebook.com',
  'fb.me',
  'fb.com',
  'fb.watch',
  'instagram.com',
  'instagr.am',
  'youtube.com',
  'youtu.be',
  'linkedin.com',
  'twitter.com',
  'x.com',
  'github.com',
  'behance.net',
  'dribbble.com',
  'medium.com',
  't.me',
  'wa.me',
  'threads.net',
  'pinterest.com',
  'snapchat.com',
  'substack.com',
  'spotify.com',
  'soundcloud.com',
  'calendly.com',
];

export function isValidUrlOrDomain(input = '') {
  if (!input || typeof input !== 'string') return false;
  const clean = input.trim().toLowerCase();
  if (clean.length < 4 || clean.includes(' ') || clean.includes('\n') || clean.includes('\r'))
    return false;

  // Ignore invalid words / phrases
  const INVALID_TOKENS = new Set([
    'null',
    'undefined',
    'false',
    'true',
    'n/a',
    'na',
    'none',
    'nil',
    'no',
    'name:',
    'role:',
    'e.g.',
    'i.e.',
    'etc.',
    'starting',
    'running',
    'growing',
    'idea',
    'logistics',
    'consultant',
  ]);
  if (INVALID_TOKENS.has(clean)) return false;

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    try {
      const parsed = new URL(clean);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  }

  // Check known platforms
  if (
    KNOWN_PLATFORM_DOMAINS.some(
      (domain) => clean.startsWith(domain) || clean.startsWith('www.' + domain)
    )
  ) {
    return true;
  }

  // Check standard domain pattern with valid TLD
  const match = clean.match(/^(?:www\.)?([a-z0-9\-_]+(?:\.[a-z0-9\-_]+)*)\.([a-z]{2,})(?:\/.*)?$/);
  if (match) {
    const tld = match[2].toLowerCase();
    return VALID_TLDS.has(tld);
  }

  return false;
}

// ─── Multi-Website & Resource URL Helpers ─────────────────────────────────────
export function extractUrls(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.flatMap(extractUrls).filter(Boolean);
  const str = String(input);

  // Match full URLs with protocols or known domain patterns
  const urlRegex =
    /(?:https?:\/\/|www\.)[^\s,;"'<>]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|io|ai|co|app|dev|me|eg|sa|ae|uk|us|de|fr|tech|agency|store|online|club|space|site|info|biz|design|global|cloud|digital|link|page|social|group|media|news|tv|fm|xyz|cc|gg|ly|sh|to|is|world|network|pro|solutions)(?:\/[^\s,;"'<>]*)?/gi;

  const matches = str.match(urlRegex) || [];
  const validUrls = matches
    .map((u) => u.trim().replace(/[.,;:]+$/, ''))
    .filter((u) => isValidUrlOrDomain(u));

  return Array.from(new Set(validUrls));
}

export function formatWebsiteUrl(url = '') {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim().replace(/[.,;:]+$/, '');
  if (!clean || !isValidUrlOrDomain(clean)) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  return `https://${clean.replace(/^\/+/, '')}`;
}

export function getPlatformLabel(url = '') {
  if (!url || typeof url !== 'string') return 'Website';
  const clean = url.trim().toLowerCase();

  if (clean.includes('tiktok.com')) return 'TikTok';
  if (
    clean.includes('facebook.com') ||
    clean.includes('fb.me') ||
    clean.includes('fb.com') ||
    clean.includes('fb.watch')
  )
    return 'Facebook';
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) return 'Instagram';
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) return 'YouTube';
  if (clean.includes('linkedin.com')) return 'LinkedIn';
  if (clean.includes('twitter.com') || clean.includes('x.com')) return 'X (Twitter)';
  if (clean.includes('github.com')) return 'GitHub';
  if (clean.includes('behance.net')) return 'Behance';
  if (clean.includes('dribbble.com')) return 'Dribbble';
  if (clean.includes('medium.com')) return 'Medium';
  if (clean.includes('t.me') || clean.includes('telegram.org') || clean.includes('telegram.me'))
    return 'Telegram';
  if (clean.includes('wa.me') || clean.includes('whatsapp.com')) return 'WhatsApp';
  if (clean.includes('threads.net')) return 'Threads';
  if (clean.includes('pinterest.com')) return 'Pinterest';
  if (clean.includes('snapchat.com')) return 'Snapchat';
  if (clean.includes('substack.com')) return 'Substack';
  if (clean.includes('spotify.com')) return 'Spotify';
  if (clean.includes('soundcloud.com')) return 'SoundCloud';
  if (clean.includes('calendly.com')) return 'Calendly';

  // Domain fallback
  try {
    const formatted = formatWebsiteUrl(url);
    const parsed = new URL(formatted);
    const host = parsed.hostname.replace(/^www\./, '');
    return host || 'Website';
  } catch {
    const rawHost = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    return rawHost || 'Website';
  }
}

export function getPlatformBadgeStyle(url = '') {
  const label = getPlatformLabel(url);
  const lower = label.toLowerCase();
  if (lower.includes('tiktok')) {
    return {
      bg: 'bg-stone-900 text-white dark:bg-stone-800',
      border: 'border-stone-700',
      label: 'TikTok',
    };
  }
  if (lower.includes('facebook')) {
    return { bg: 'bg-blue-600 text-white', border: 'border-blue-700', label: 'Facebook' };
  }
  if (lower.includes('instagram')) {
    return { bg: 'bg-pink-600 text-white', border: 'border-pink-700', label: 'Instagram' };
  }
  if (lower.includes('youtube')) {
    return { bg: 'bg-red-600 text-white', border: 'border-red-700', label: 'YouTube' };
  }
  if (lower.includes('linkedin')) {
    return { bg: 'bg-sky-700 text-white', border: 'border-sky-800', label: 'LinkedIn' };
  }
  if (lower === 'x (twitter)' || lower.includes('twitter')) {
    return { bg: 'bg-stone-900 text-white', border: 'border-stone-800', label: 'X' };
  }
  if (lower.includes('github')) {
    return { bg: 'bg-stone-800 text-white', border: 'border-stone-700', label: 'GitHub' };
  }
  return {
    bg: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300',
    border: 'border-stone-200 dark:border-stone-700',
    label,
  };
}

export function getDomainLabel(url = '') {
  return getPlatformLabel(url);
}

/**
 * Returns a deduplicated array of all websites, secondary websites,
 * and online links for a member profile.
 */
export function getMemberWebsites(member) {
  if (!member || typeof member !== 'object') return [];
  const rawLinks = [];

  // 1. Primary website
  if (member.website) {
    rawLinks.push(...extractUrls(member.website));
  }

  // 2. Secondary website
  if (member.secondaryWebsite) {
    rawLinks.push(...extractUrls(member.secondaryWebsite));
  }

  // 3. Array of websites or links
  if (Array.isArray(member.websites)) {
    member.websites.forEach((w) => {
      if (w) rawLinks.push(...extractUrls(w));
    });
  }
  if (Array.isArray(member.links)) {
    member.links.forEach((l) => {
      if (l) rawLinks.push(...extractUrls(l));
    });
  }

  // Deduplicate and format
  const result = [];
  const seen = new Set();

  rawLinks.forEach((raw) => {
    if (!raw || typeof raw !== 'string') return;
    const formatted = formatWebsiteUrl(raw);
    const lowerKey = formatted.toLowerCase().replace(/\/+$/, '');
    if (
      !seen.has(lowerKey) &&
      (formatted.startsWith('http://') || formatted.startsWith('https://'))
    ) {
      seen.add(lowerKey);
      result.push({
        url: formatted,
        label: getDomainLabel(formatted),
      });
    }
  });

  return result;
}

// ─── Arabic & Text Normalization ──────────────────────────────────────────────
export function normalizeSearchText(str = '') {
  if (!str || typeof str !== 'string') return '';
  return (
    str
      .toLowerCase()
      .trim()
      // Normalize Arabic Alef variations (أ, إ, آ -> ا)
      .replace(/[أإآ]/g, 'ا')
      // Normalize Yaa & Alef Maqsura (ى -> ي)
      .replace(/ى/g, 'ي')
      // Normalize Taa Marbuta & Haa (ة -> ه)
      .replace(/ة/g, 'ه')
      // Remove Arabic Tashkeel / Diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove special punctuation
      .replace(/[\s\-_,.:;@()\[\]\/+]/g, ' ')
  );
}

import { enhancedMemberMatchesSearch } from './searchEngine';

// ─── Search helpers ───────────────────────────────────────────────────────────
export function memberMatchesSearch(member, query) {
  return enhancedMemberMatchesSearch(member, query);
}

// ─── Unique ID ────────────────────────────────────────────────────────────────
export function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }
  return false;
}

// ─── Date formatting ─────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  try {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ─── PIN hashing ──────────────────────────────────────────────────────────────
function simpleHash(str) {
  let h1 = 0xdeadbeef ^ 0,
    h2 = 0x41c6ce57 ^ 0;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export async function hashPIN(pin) {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`sed-pin-salt-${pin}`);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback if Web Crypto API is unavailable
  }
  return `hash-${simpleHash(`sed-pin-salt-${pin}`)}`;
}

export async function verifyPIN(pin, hash) {
  const computed = await hashPIN(pin);
  return computed === hash;
}

// ─── Export / Import ─────────────────────────────────────────────────────────
export function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function isWithinDays(dateStr, days) {
  try {
    if (!dateStr) return false;
    return differenceInDays(new Date(), new Date(dateStr)) <= days;
  } catch {
    return false;
  }
}

// ─── Digital Business Card & vCard Generation ─────────────────────────────────
export function generateVCard(member, includePhone = false) {
  if (!member) return '';
  const name = member.name || 'Founder';
  const role = member.role || 'Entrepreneur';
  const business = member.business ? member.business.split('\n')[0] : 'Alliance Network';
  const phone = includePhone ? member.phone || '' : '';
  const email = member.email || '';
  const linkedin = member.linkedin || '';
  const city =
    typeof member.location === 'string'
      ? member.location
      : member.location?.city || member.location?.district || '';
  const country = typeof member.location === 'object' ? member.location?.country || '' : '';
  const location = [city, country].filter(Boolean).join(', ');

  const websites = getMemberWebsites(member);
  const websiteLines = websites.map((w) => `URL:${w.url}`);

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name}`,
    `TITLE:${role}`,
    `ORG:${business}`,
    phone ? `TEL;TYPE=CELL:${phone}` : '',
    email ? `EMAIL:${email}` : '',
    linkedin ? `URL:${linkedin}` : '',
    ...websiteLines,
    location ? `ADR;TYPE=WORK:;;${city};;;;${country}` : '',
    `NOTE:Member of Smart Entrepreneurs Directory`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\r\n');

  return vcard;
}

export function downloadVCardFile(member, includePhone = false) {
  if (!member) return;
  const vcardText = generateVCard(member, includePhone);
  const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (member.name || 'Member').replace(/[^a-zA-Z0-9_\-]/g, '_');
  link.href = url;
  link.setAttribute('download', `${safeName}_Contact.vcf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
