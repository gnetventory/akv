// ─── False-Alarm-Proof Duplicate Detection & Profile Diff Engine ──────────────
// Multi-factor confidence evaluation to protect admins from false duplicate alarms

import { getLinkedInHandle, isValidLinkedInUrl } from './helpers';

/**
 * Normalizes phone numbers to digits only
 */
export function normalizePhoneDigits(phone = '') {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes member names for comparison
 */
export function normalizeMemberName(name = '') {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[\s\-_,.:;@()[\]/+]+/g, ' ')
    .trim();
}

/**
 * Evaluates duplicate status with strict multi-factor rules
 */
export function detectDuplicateMatch(candidate, existingMembers = []) {
  if (!candidate || typeof candidate !== 'object') {
    return {
      isDuplicate: false,
      confidence: 0,
      confidenceLevel: 'none',
      matchedMember: null,
      matchReason: '',
      matchedFields: [],
    };
  }

  const candidatePhone = normalizePhoneDigits(candidate.phone);
  const candidateHandle = getLinkedInHandle(candidate.linkedin);
  const candidateNormName = normalizeMemberName(candidate.name);
  const candidateNameWords = candidateNormName.split(/\s+/).filter(Boolean);

  const GENERIC_NAMES = new Set([
    'member',
    'entrepreneur',
    'founder',
    'guest',
    'unknown',
    'ahmed',
    'mohamed',
    'ali',
    'sara',
    'user',
  ]);

  for (const existing of existingMembers) {
    if (!existing || existing.id === candidate.id) continue;
    if (existing.status === 'rejected') continue;

    const existingPhone = normalizePhoneDigits(existing.phone);
    const existingHandle = getLinkedInHandle(existing.linkedin);
    const existingNormName = normalizeMemberName(existing.name);
    const existingNameWords = existingNormName.split(/\s+/).filter(Boolean);

    const matchedFields = [];

    // 1. Phone Match Check (>= 8 digits) -> 100% High Confidence
    const hasPhoneMatch =
      candidatePhone.length >= 8 &&
      existingPhone.length >= 8 &&
      candidatePhone === existingPhone;

    if (hasPhoneMatch) {
      matchedFields.push('phone');
    }

    // 2. Verified LinkedIn Handle Match -> 100% High Confidence
    const hasLinkedInMatch =
      candidateHandle &&
      existingHandle &&
      candidateHandle.length >= 3 &&
      candidateHandle.toLowerCase() === existingHandle.toLowerCase();

    if (hasLinkedInMatch) {
      matchedFields.push('linkedin');
    }

    // 3. Exact Full Name Match (must have at least 2 distinct words and not generic)
    const hasFullNameMatch =
      candidateNameWords.length >= 2 &&
      existingNameWords.length >= 2 &&
      candidateNormName === existingNormName &&
      !GENERIC_NAMES.has(candidateNormName);

    if (hasFullNameMatch) {
      matchedFields.push('name');
    }

    // Multi-factor confidence scoring
    if (hasPhoneMatch && hasLinkedInMatch) {
      return {
        isDuplicate: true,
        confidence: 100,
        confidenceLevel: 'high',
        matchedMember: existing,
        matchReason: `Exact Phone (${candidate.phone}) and LinkedIn Handle match`,
        matchedFields: ['phone', 'linkedin'],
      };
    }

    if (hasPhoneMatch) {
      return {
        isDuplicate: true,
        confidence: 100,
        confidenceLevel: 'high',
        matchedMember: existing,
        matchReason: `Exact WhatsApp Phone Match (${candidate.phone})`,
        matchedFields: ['phone'],
      };
    }

    if (hasLinkedInMatch) {
      return {
        isDuplicate: true,
        confidence: 95,
        confidenceLevel: 'high',
        matchedMember: existing,
        matchReason: `Exact LinkedIn Profile Handle Match (@${candidateHandle})`,
        matchedFields: ['linkedin'],
      };
    }

    if (hasFullNameMatch) {
      return {
        isDuplicate: true,
        confidence: 85,
        confidenceLevel: 'medium',
        matchedMember: existing,
        matchReason: `Exact Full Name Match ("${existing.name}")`,
        matchedFields: ['name'],
      };
    }
  }

  return {
    isDuplicate: false,
    confidence: 0,
    confidenceLevel: 'none',
    matchedMember: null,
    matchReason: '',
    matchedFields: [],
  };
}

/**
 * Generates field-by-field side-by-side diff between old existing profile and new pending submission
 */
export function compareProfiles(oldMember = {}, newMember = {}) {
  const fields = [
    { key: 'name', label: 'Full Name' },
    { key: 'role', label: 'Role & Profession' },
    { key: 'business', label: 'Business / Project' },
    { key: 'stage', label: 'Venture Stage' },
    {
      key: 'location',
      label: 'Location',
      format: (loc) => (loc ? `${loc.city || ''}, ${loc.country || ''}`.replace(/^, |, $/, '') : ''),
    },
    { key: 'phone', label: 'WhatsApp Phone' },
    { key: 'linkedin', label: 'LinkedIn Profile' },
    {
      key: 'websites',
      label: 'Websites & Links',
      format: (w, m) =>
        Array.isArray(w) && w.length > 0 ? w.join(', ') : m?.website || 'None',
    },
    { key: 'lookingFor', label: 'Looking For / Asks' },
    { key: 'canHelp', label: 'Can Help With / Offers' },
    {
      key: 'tags',
      label: 'Industry Tags',
      format: (tags) => (Array.isArray(tags) ? tags.join(', ') : ''),
    },
  ];

  return fields.map((f) => {
    const rawOld = oldMember ? oldMember[f.key] : '';
    const rawNew = newMember ? newMember[f.key] : '';

    const oldVal = f.format ? f.format(rawOld, oldMember) : String(rawOld || '').trim();
    const newVal = f.format ? f.format(rawNew, newMember) : String(rawNew || '').trim();

    const isChanged = Boolean(newVal && oldVal && oldVal.toLowerCase() !== newVal.toLowerCase());
    const isNew = Boolean(newVal && !oldVal);
    const isIdentical = Boolean(oldVal && newVal && oldVal.toLowerCase() === newVal.toLowerCase());

    return {
      field: f.key,
      label: f.label,
      oldVal: oldVal || '—',
      newVal: newVal || '—',
      isChanged,
      isNew,
      isIdentical,
    };
  });
}
