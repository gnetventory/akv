/**
 * WhatsApp Chat & Markdown File Extraction Engine
 * Parses raw WhatsApp exports (.txt) and Markdown intro notes (.md)
 * Filters actual introductions, performs batch profile extraction with AI,
 * and handles cross-file deduplication.
 */

import { parseIntro, parseLocalRuleBased, isIntroMessage } from './gemini';

/**
 * Parses raw text from a WhatsApp chat export (.txt) or Markdown notes file (.md)
 * into an array of individual message blocks with sender, timestamp, and text.
 */
export function parseRawFileToMessages(rawContent, filename = '') {
  if (!rawContent || typeof rawContent !== 'string') return [];

  const isMarkdown = filename.toLowerCase().endsWith('.md');

  if (isMarkdown) {
    return parseMarkdownNotes(rawContent);
  } else {
    return parseWhatsAppChatText(rawContent);
  }
}

/**
 * Parses standard WhatsApp chat log formats:
 * - iOS format: [DD/MM/YY, HH:MM:SS AM/PM] Sender: Message
 * - Android format: DD/MM/YYYY, HH:MM - Sender: Message
 * - Android with seconds: DD/MM/YYYY, HH:MM:SS - Sender: Message
 * - Web format: [HH:MM, DD/MM/YYYY] Sender: Message
 */
export function parseWhatsAppChatText(rawText) {
  const lines = rawText.split(/\r?\n/);
  const messages = [];
  let currentMsg = null;

  // Regex patterns for WhatsApp message headers
  const iosPattern =
    /^\[(\d{1,2}[-./]\d{1,2}[-./]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+([^:]+?):\s+(.*)$/;
  const androidPattern =
    /^(\d{1,2}[-./]\d{1,2}[-./]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s+-\s+([^:]+?):\s+(.*)$/;
  const bracketPattern =
    /^\[(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?),?\s+(\d{1,2}[-./]\d{1,2}[-./]\d{2,4})\]\s+([^:]+?):\s+(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    let match = line.match(iosPattern) || line.match(androidPattern) || line.match(bracketPattern);

    if (match) {
      if (currentMsg) {
        messages.push(currentMsg);
      }

      const rawSender = match[3].trim();
      const text = match[4] || '';

      currentMsg = {
        timestamp: `${match[1]} ${match[2]}`,
        sender: rawSender,
        text: text,
        raw: line,
      };
    } else if (currentMsg) {
      // Append multi-line message content
      currentMsg.text += '\n' + line;
      currentMsg.raw += '\n' + line;
    } else {
      // Initial text before first timestamp
      if (line.trim().length > 10) {
        currentMsg = {
          timestamp: 'Unknown',
          sender: 'Unknown',
          text: line,
          raw: line,
        };
      }
    }
  }

  if (currentMsg) {
    messages.push(currentMsg);
  }

  return messages;
}

/**
 * Parses Markdown introduction files (.md).
 * Recognizes section breaks (---), headers (## Member Name), or numbered lists (1. Name: ...).
 */
export function parseMarkdownNotes(rawMarkdown) {
  const blocks = rawMarkdown.split(
    /(?=\n#{1,3}\s+|\n---+\n|\n\d+\.\s+\*\*Name|\n\*\*(?:Full )?Name\*\*)/i
  );
  const messages = [];

  blocks.forEach((block, idx) => {
    const trimmed = block.trim();
    if (trimmed.length < 15) return;

    // Skip standalone top-level document title headers
    if (/^#\s+[^#\n]+$/m.test(trimmed) && !trimmed.includes(':') && !trimmed.includes('**')) {
      return;
    }

    // Extract sender name from markdown header if present
    const headerMatch = trimmed.match(/^#{2,3}\s+(.+)$/m) || trimmed.match(/^#\s+(.+)$/m);
    const nameMatch =
      trimmed.match(/\*\*(?:Full )?Name\*\*\s*[:-]?\s*([^\n\r*]+)/i) ||
      trimmed.match(/(?:Name\s*[:-])\s*([^\n\r]+)/i);

    const sender = headerMatch
      ? headerMatch[1].trim()
      : nameMatch
        ? nameMatch[1].trim()
        : `Member ${idx + 1}`;

    messages.push({
      timestamp: 'Markdown Note',
      sender,
      text: trimmed,
      raw: trimmed,
    });
  });

  return messages;
}

/**
 * Filters out casual messages, voice notes, media notes, and scheduling banter
 * to return only candidate member introduction blocks.
 */
export function extractIntroCandidates(messages) {
  const candidates = [];

  messages.forEach((msg) => {
    const text = msg.text || '';
    if (text.length < 20) return;

    // Filter out WhatsApp system notes
    if (
      text.includes('Messages and calls are end-to-end encrypted') ||
      text.includes('<Media omitted>') ||
      text.includes('<image omitted>') ||
      text.includes('<voice message omitted>') ||
      text.includes('<video omitted>') ||
      text.includes('<This message was edited>') ||
      text.includes("joined using this group's invite link") ||
      text.includes('added') ||
      text.includes('left')
    ) {
      return;
    }

    if (isIntroMessage(text) || msg.timestamp === 'Markdown Note') {
      candidates.push({
        ...msg,
        candidateId: `cand_${Math.random().toString(36).substring(2, 9)}`,
      });
    }
  });

  return candidates;
}

/**
 * Batch processes intro candidates using Gemini AI (with local NLP fallback)
 * and reports progress to a callback.
 */
export async function processIntroCandidatesBatch(candidates, apiKey, onProgress) {
  const results = [];
  const total = candidates.length;

  for (let i = 0; i < total; i++) {
    const candidate = candidates[i];
    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i + 1) / total) * 100),
      currentSender: candidate.sender,
    });

    try {
      let parsed = null;
      if (apiKey) {
        parsed = await parseIntro(candidate.text);
      } else {
        parsed = parseLocalRuleBased(candidate.text);
      }

      if (parsed && (parsed.name || parsed.role || parsed.business)) {
        // Fallback sender name if AI did not extract clean name
        if (!parsed.name || parsed.name === 'Entrepreneur Member') {
          if (
            candidate.sender &&
            candidate.sender !== 'Unknown' &&
            !candidate.sender.startsWith('+')
          ) {
            parsed.name = candidate.sender;
          }
        }

        // Capture phone if sender is a phone number and not already set
        if (!parsed.phone && candidate.sender && candidate.sender.startsWith('+')) {
          parsed.phone = candidate.sender;
        }

        results.push({
          id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ...parsed,
          sourceTimestamp: candidate.timestamp,
          sourceSender: candidate.sender,
          rawExcerpt: candidate.text.slice(0, 200),
          createdAt: new Date().toISOString(),
          status: 'active',
          appStatus: 'APPROVED',
        });
      }
    } catch (err) {
      console.warn(`Failed parsing candidate "${candidate.sender}":`, err.message);
      // Try local rule-based parsing as fallback
      const fallback = parseLocalRuleBased(candidate.text);
      if (fallback) {
        results.push({
          id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ...fallback,
          sourceTimestamp: candidate.timestamp,
          sourceSender: candidate.sender,
          rawExcerpt: candidate.text.slice(0, 200),
          createdAt: new Date().toISOString(),
          status: 'active',
          appStatus: 'APPROVED',
        });
      }
    }
  }

  return results;
}

/**
 * Deduplicates newly extracted profiles against each other and existing directory members.
 * Identifies matches by normalized phone, LinkedIn handle, or exact name.
 */
export function analyzeDuplicates(newProfiles, existingMembers = []) {
  const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizePhone = (str) => (str || '').replace(/[^0-9]/g, '');

  const existingPhoneMap = new Map();
  const existingLinkedInMap = new Map();
  const existingNameMap = new Map();

  existingMembers.forEach((m) => {
    if (m.phone) existingPhoneMap.set(normalizePhone(m.phone), m);
    if (m.linkedin) existingLinkedInMap.set(normalize(m.linkedin), m);
    if (m.name) existingNameMap.set(normalize(m.name), m);
  });

  const staged = [];
  const seenInBatch = new Map();

  newProfiles.forEach((profile) => {
    const normPhone = normalizePhone(profile.phone);
    const normLinkedIn = normalize(profile.linkedin);
    const normName = normalize(profile.name);

    let matchExisting = null;
    let matchReason = '';

    if (normPhone && existingPhoneMap.has(normPhone)) {
      matchExisting = existingPhoneMap.get(normPhone);
      matchReason = `Phone match (${profile.phone})`;
    } else if (normLinkedIn && existingLinkedInMap.has(normLinkedIn)) {
      matchExisting = existingLinkedInMap.get(normLinkedIn);
      matchReason = 'LinkedIn match';
    } else if (normName && existingNameMap.has(normName)) {
      matchExisting = existingNameMap.get(normName);
      matchReason = `Name match (${matchExisting.name})`;
    }

    // Check if duplicate within current batch
    const batchKey = normPhone || normLinkedIn || normName;
    const isDuplicateInBatch = batchKey && seenInBatch.has(batchKey);
    if (batchKey) seenInBatch.set(batchKey, profile);

    staged.push({
      ...profile,
      isDuplicate: Boolean(matchExisting || isDuplicateInBatch),
      duplicateMatch: matchExisting || null,
      duplicateReason: matchExisting
        ? matchReason
        : isDuplicateInBatch
          ? 'Duplicate entry within this file'
          : null,
      selectedForImport: !matchExisting && !isDuplicateInBatch,
    });
  });

  return staged;
}
