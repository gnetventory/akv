// ─── UX Psychology & Behavioral Economics Engine ─────────────────────────────

/**
 * 1. Endowed Progress Effect: Profile Strength Meter
 * Starts users with an endowed baseline score (40%) representing their active alliance status,
 * making goal completion much more psychologically achievable and enticing.
 */
export function calculateProfileStrength(member) {
  if (!member) return { score: 40, checklist: [], isComplete: false, level: 'Active Member' };

  let score = 40; // Endowed Baseline (40%)
  const checklist = [];

  // Check 1: Primary website or social link (+15%)
  const hasWebsite =
    (member.website && member.website.trim().length > 3) ||
    (Array.isArray(member.websites) && member.websites.length > 0);
  if (hasWebsite) {
    score += 15;
    checklist.push({ label: 'Online Presence (Website/Social)', done: true, points: 15 });
  } else {
    checklist.push({ label: 'Add Website / Social Link', done: false, points: 15 });
  }

  // Check 2: LinkedIn Profile (+15%)
  const hasLinkedin = member.linkedin && member.linkedin.includes('linkedin.com');
  if (hasLinkedin) {
    score += 15;
    checklist.push({ label: 'LinkedIn Verified', done: true, points: 15 });
  } else {
    checklist.push({ label: 'Connect LinkedIn Profile', done: false, points: 15 });
  }

  // Check 3: Clear Collaboration Tags (>= 2 tags) (+15%)
  const hasTags = Array.isArray(member.tags) && member.tags.length >= 2;
  if (hasTags) {
    score += 15;
    checklist.push({ label: 'Synergy Tags Configured', done: true, points: 15 });
  } else {
    checklist.push({ label: 'Select 2+ Industry Tags', done: false, points: 15 });
  }

  // Check 4: Can Help / Value Proposition Defined (+15%)
  const hasCanHelp = member.canHelp && member.canHelp.trim().length >= 10;
  if (hasCanHelp) {
    score += 15;
    checklist.push({ label: 'Offers & Superpowers Defined', done: true, points: 15 });
  } else {
    checklist.push({ label: 'Add "How I Can Help"', done: false, points: 15 });
  }

  // Determine Psychological Tier Level
  let level = 'Alliance Bronze';
  let badgeColor = 'text-amber-600 bg-amber-50 border-amber-200';
  if (score >= 95) {
    level = 'Ecosystem Pioneer (100%)';
    badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300';
  } else if (score >= 70) {
    level = 'Alliance Gold';
    badgeColor = 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300';
  } else if (score >= 55) {
    level = 'Alliance Silver';
    badgeColor = 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300';
  }

  return {
    score: Math.min(100, score),
    checklist,
    isComplete: score >= 100,
    level,
    badgeColor,
  };
}

/**
 * 2. Bookmarks & Watchlist Storage (Loss Aversion)
 * Lets founders save promising connections with zero friction.
 */
const BOOKMARKS_STORAGE_KEY = 'sed_bookmarked_founders';

export function getBookmarkedIds() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmarkId(id) {
  try {
    const current = getBookmarkedIds();
    const exists = current.includes(id);
    const updated = exists ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
    return !exists;
  } catch {
    return false;
  }
}

export function isMemberBookmarked(id) {
  const current = getBookmarkedIds();
  return current.includes(id);
}

/**
 * 3. Personalized WhatsApp Warm Intro Generator (Admin-Only Tool)
 * Creates frictionless, high-respect bilingual warm intros for alliance admins.
 */
export function generateWhatsAppWarmIntro(member, language = 'ar') {
  if (!member) return '';

  const founderName = member.name?.split(' ')[0] || 'Founder';
  const business = member.business || 'your venture';

  if (language === 'ar') {
    return `السلام عليكم أستاذ ${founderName}، تحياتي لحضرتك من مجتمع رواد الأعمال Smart Directory & Alliance. اطلعت على مشروعكم المتميز (${business}) وحابب أتواصل مع حضرتك بخصوص فرص التعاون والشراكات المتاحة. أهلاً بك معنا دائماً! ✨`;
  }

  return `Hello ${founderName}, warm greetings from the Smart Directory & Alliance Community! I was reviewing your impressive work at ${business} and wanted to reach out regarding synergistic partnership and expansion opportunities. Looking forward to connecting! ✨`;
}

/**
 * 4. Serendipity Dice 🎲: High-Affinity Random Founder Match
 * Delights the user with an unexpected high-synergy founder pairing.
 */
export function getRandomSynergyFounder(allMembers, currentMemberId = null) {
  if (!Array.isArray(allMembers) || allMembers.length === 0) return null;

  const pool = currentMemberId
    ? allMembers.filter((m) => m.id !== currentMemberId)
    : allMembers;

  if (pool.length === 0) return null;

  // Filter pool preferring members with rich bios / websites
  const qualityPool = pool.filter((m) => m.business && (m.canHelp || m.lookingFor));
  const candidateList = qualityPool.length >= 3 ? qualityPool : pool;

  const randomIndex = Math.floor(Math.random() * candidateList.length);
  return candidateList[randomIndex];
}
