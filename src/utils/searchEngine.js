// ─── Advanced Multilingual Stemming & Search Engine ───────────────────────────
// Supports English inflectional stemming & Arabic morphological root matching

import { STAGES } from './constants';

/**
 * Normalizes text for searching (lowercasing, unicode normalization, diacritics removal)
 */
export function normalizeSearchString(str = '') {
  if (!str || typeof str !== 'string') return '';
  return (
    str
      .toLowerCase()
      .trim()
      // Normalize Arabic Alef variations (أ, إ, آ -> ا)
      .replace(/[أإآ]/g, 'ا')
      // Normalize Yaa & Alef Maqsura (ى -> ي)
      .replace(/ى/g, 'ي')
      // Normalize Taa Marbuta (ة -> ه)
      .replace(/ة/g, 'ه')
      // Remove Arabic Tashkeel / Diacritics
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove special punctuation & symbols
      .replace(/[\s\-_,.:;@()[\]/+،؛"'`~!?]+/g, ' ')
      .trim()
  );
}

/**
 * English Inflectional Suffix Stemmer
 * Handles plurals, verb endings, and common agentive nouns
 */
export function stemEnglishWord(word = '') {
  if (!word || word.length < 3) return word;
  const w = word.toLowerCase().trim();

  // Explicit irregular mappings for high-frequency business & tech domains
  const IRREGULAR_MAP = {
    developers: 'develop',
    developer: 'develop',
    development: 'develop',
    developing: 'develop',
    programmers: 'program',
    programmer: 'program',
    programming: 'program',
    designers: 'design',
    designer: 'design',
    designing: 'design',
    designs: 'design',
    marketers: 'market',
    marketer: 'market',
    marketing: 'market',
    markets: 'market',
    sales: 'sale',
    selling: 'sale',
    sellers: 'sale',
    seller: 'sale',
    consultants: 'consult',
    consultant: 'consult',
    consulting: 'consult',
    consultancy: 'consult',
    consultancies: 'consult',
    partners: 'partner',
    partner: 'partner',
    partnerships: 'partner',
    partnership: 'partner',
    investors: 'invest',
    investor: 'invest',
    investing: 'invest',
    investment: 'invest',
    investments: 'invest',
    managers: 'manage',
    manager: 'manage',
    managing: 'manage',
    management: 'manage',
    engineers: 'engineer',
    engineer: 'engineer',
    engineering: 'engineer',
    founders: 'founder',
    founder: 'founder',
    founding: 'founder',
    advisors: 'advisor',
    adviser: 'advisor',
    advisers: 'advisor',
    advisory: 'advisor',
    logistics: 'logistic',
    operations: 'operat',
    operation: 'operat',
    operational: 'operat',
    operating: 'operat',
    operators: 'operat',
    operator: 'operat',
    startups: 'startup',
    businesses: 'business',
    companies: 'company',
    services: 'service',
    products: 'product',
  };

  if (IRREGULAR_MAP[w]) return IRREGULAR_MAP[w];

  // Algorithmic suffix stripping rules
  let stem = w;
  if (stem.endsWith('ies') && stem.length > 4) {
    return stem.slice(0, -3) + 'y';
  }
  if (stem.endsWith('ing') && stem.length > 5) {
    return stem.slice(0, -3);
  }
  if (stem.endsWith('ers') && stem.length > 5) {
    return stem.slice(0, -3);
  }
  if (stem.endsWith('er') && stem.length > 4) {
    return stem.slice(0, -2);
  }
  if (stem.endsWith('es') && stem.length > 4) {
    return stem.slice(0, -2);
  }
  if (stem.endsWith('s') && !stem.endsWith('ss') && stem.length > 3) {
    return stem.slice(0, -1);
  }
  if (stem.endsWith('ed') && stem.length > 4) {
    return stem.slice(0, -2);
  }
  if (stem.endsWith('ment') && stem.length > 6) {
    return stem.slice(0, -4);
  }
  if (stem.endsWith('tion') && stem.length > 6) {
    return stem.slice(0, -4);
  }

  return stem;
}

/**
 * Arabic Morphological Stemmer & Root Normalizer
 * Handles prefixes (الـ, و, ف, ب), suffixes (ين, ون, ات, ة, ي), and business root clustering
 */
export function stemArabicWord(word = '') {
  if (!word || word.length < 3) return word;
  let w = normalizeSearchString(word);

  // Common Arabic business root clusters
  const ARABIC_ROOT_MAP = {
    مطورين: 'طور',
    مطورون: 'طور',
    مطور: 'طور',
    تطوير: 'طور',
    تطويري: 'طور',
    مبرمجين: 'برمج',
    مبرمجون: 'برمج',
    مبرمج: 'برمج',
    برمجة: 'برمج',
    برمجه: 'برمج',
    مسوقين: 'سوق',
    مسوقون: 'سوق',
    مسوق: 'سوق',
    تسويق: 'سوق',
    تسويقي: 'سوق',
    تسويقيه: 'سوق',
    مبيعات: 'بيع',
    بائع: 'بيع',
    شركاء: 'شرك',
    شريك: 'شرك',
    شراكة: 'شرك',
    شراكه: 'شرك',
    شراكات: 'شرك',
    مستثمرين: 'ثمر',
    مستثمرون: 'ثمر',
    مستثمر: 'ثمر',
    استثمار: 'ثمر',
    استثماري: 'ثمر',
    تمويل: 'مول',
    ممول: 'مول',
    مصممين: 'صمم',
    مصممون: 'صمم',
    مصمم: 'صمم',
    تصميم: 'صمم',
    تصميمات: 'صمم',
    مستشارين: 'شور',
    مستشار: 'شور',
    استشارات: 'شور',
    استشارة: 'شور',
    استشاره: 'شور',
    لوجستيات: 'لوجست',
    لوجستي: 'لوجست',
    لوجستيه: 'لوجست',
    شحن: 'شحن',
    شاحنات: 'شحن',
    مؤسسين: 'اسس',
    مؤسس: 'اسس',
    تأسيس: 'اسس',
    تاسيس: 'اسس',
  };

  if (ARABIC_ROOT_MAP[w]) return ARABIC_ROOT_MAP[w];

  // Strip definite article 'ال' if word length > 4
  if (w.startsWith('ال') && w.length > 4) {
    w = w.slice(2);
  }

  // Strip leading conjunctions if word length > 4 (و, ف)
  if ((w.startsWith('و') || w.startsWith('ف')) && w.length > 4) {
    w = w.slice(1);
    if (w.startsWith('ال') && w.length > 4) {
      w = w.slice(2);
    }
  }

  if (ARABIC_ROOT_MAP[w]) return ARABIC_ROOT_MAP[w];

  // Strip suffixes
  if (w.endsWith('ين') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ون') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ات') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('يه') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ية') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ها') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('هم') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('كم') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('نا') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('ه') && w.length > 3) return w.slice(0, -1);
  if (w.endsWith('ي') && w.length > 3) return w.slice(0, -1);

  return w;
}

/**
 * Universal token stemmer (auto-detects English or Arabic)
 */
export function stemToken(token = '') {
  if (!token) return '';
  const clean = normalizeSearchString(token);
  if (/[\u0600-\u06FF]/.test(clean)) {
    return stemArabicWord(clean);
  }
  return stemEnglishWord(clean);
}

/**
 * Extracts normalized tokens and their corresponding stems from a text string
 */
export function tokenizeAndStem(text = '') {
  if (!text) return { rawTokens: [], stems: [] };
  const normalized = normalizeSearchString(text);
  const rawTokens = normalized.split(/\s+/).filter((t) => t.length > 0);
  const stems = rawTokens.map(stemToken);

  return {
    rawTokens,
    stems,
  };
}

/**
 * Enhanced Search Matcher with Stemming, Pluralization, and Morphological Expansion
 * Returns true if all search query tokens match anywhere in member profile
 */
export function enhancedMemberMatchesSearch(member, query) {
  if (!query || !query.trim()) return true;
  if (!member || typeof member !== 'object') return false;

  const qRaw = query.trim().toLowerCase();

  // Fast direct match on email, phone, and handle
  if (member.email && member.email.toLowerCase().includes(qRaw)) return true;
  if (member.phone && member.phone.replace(/[\s\-_+()]+/g, '').includes(qRaw.replace(/[\s\-_+()]+/g, ''))) return true;
  if (member.handle && member.handle.toLowerCase().includes(qRaw.replace(/^@/, ''))) return true;

  const qNorm = normalizeSearchString(query);
  const queryTokens = qNorm.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  const queryStems = queryTokens.map(stemToken);

  // Extract all searchable fields
  const locStr =
    typeof member.location === 'string'
      ? member.location
      : `${member.location?.city || ''} ${member.location?.district || ''} ${member.location?.country || ''}`;

  const stageLabel = STAGES[member.stage]?.label || '';
  const stageTenure = STAGES[member.stage]?.tenure || '';

  const memberTextBlob = [
    member.name,
    member.role,
    member.business,
    member.canHelp,
    member.lookingFor,
    member.email,
    member.phone,
    member.handle,
    member.stage,
    stageLabel,
    stageTenure,
    locStr,
    member.linkedin,
    member.website,
    member.secondaryWebsite,
    member.instagram,
    ...(Array.isArray(member.tags) ? member.tags : []),
    ...(Array.isArray(member.catalogues) ? member.catalogues : []),
  ]
    .filter(Boolean)
    .join(' ');

  const targetTokensAndStems = tokenizeAndStem(memberTextBlob);
  const targetRawJoined = normalizeSearchString(memberTextBlob);

  // Every token in the query must match either:
  // 1. As an exact substring in the text blob (for tokens >= 2 chars)
  // 2. As an exact or prefix token match (e.g. "dev" -> "developer", "kar" -> "karim")
  // 3. As a stemmed root match (e.g. "developers" -> stem "develop" matches "developer" -> stem "develop")
  return queryTokens.every((qToken, idx) => {
    const qStem = queryStems[idx];

    // 1. Direct substring match (e.g. "karim", "software", "logistic", "jimm21stt")
    if (qToken.length >= 2 && targetRawJoined.includes(qToken)) return true;

    // 2. Direct token exact or prefix match (prevents small unrelated words matching)
    if (
      targetTokensAndStems.rawTokens.some(
        (t) => t === qToken || (qToken.length >= 3 && t.startsWith(qToken))
      )
    ) {
      return true;
    }

    // 3. Stemmed / morphological match
    if (qStem && qStem.length >= 3) {
      if (
        targetTokensAndStems.stems.some(
          (s) => s === qStem || (qStem.length >= 4 && s.startsWith(qStem))
        )
      ) {
        return true;
      }
      if (targetRawJoined.includes(qStem)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Calculates search relevance score for ranking results
 */
export function calculateSearchRelevance(member, query) {
  if (!query || !query.trim()) return 100;
  if (!member) return 0;

  let score = 0;
  const qRaw = query.trim().toLowerCase();

  // Immediate boost for exact email, phone, or name matches
  if (member.email && member.email.toLowerCase().includes(qRaw)) score += 50;
  if (member.phone && member.phone.replace(/[\s\-_+()]+/g, '').includes(qRaw.replace(/[\s\-_+()]+/g, ''))) score += 40;

  const qNorm = normalizeSearchString(query);
  const queryTokens = qNorm.split(/\s+/).filter(Boolean);
  const queryStems = queryTokens.map(stemToken);

  const checkField = (fieldVal, weight) => {
    if (!fieldVal) return;
    const valNorm = normalizeSearchString(fieldVal);
    const { rawTokens, stems } = tokenizeAndStem(fieldVal);

    queryTokens.forEach((qToken, idx) => {
      const qStem = queryStems[idx];
      if (valNorm === qToken) {
        score += weight * 5;
      } else if (rawTokens.includes(qToken)) {
        score += weight * 4;
      } else if (rawTokens.some((t) => qToken.length >= 3 && t.startsWith(qToken))) {
        score += weight * 3;
      } else if (valNorm.includes(qToken)) {
        score += weight * 2;
      } else if (qStem && stems.includes(qStem)) {
        score += weight * 2;
      } else if (qStem && qStem.length >= 4 && stems.some((s) => s.startsWith(qStem))) {
        score += weight * 1.5;
      }
    });
  };

  // High weight: Name, Email, Role, Business, Phone
  checkField(member.name, 10);
  checkField(member.email, 10);
  checkField(member.role, 8);
  checkField(member.business, 7);
  checkField(member.phone, 6);

  // Medium weight: Asks, Offers, Tags
  checkField(member.lookingFor, 5);
  checkField(member.canHelp, 5);
  if (Array.isArray(member.tags)) {
    member.tags.forEach((t) => checkField(t, 4));
  }

  // Baseline weight: Location, Stage
  checkField(member.location?.city, 3);
  checkField(member.location?.country, 2);
  checkField(member.stage, 2);

  return score;
}
