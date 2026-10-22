#!/usr/bin/env node

/**
 * CLI WhatsApp & Markdown Chat Parser
 * Usage:
 *   node scripts/parse-whatsapp-chat.js <file1.txt|file1.md> [file2.txt ...] [--out output.json] [--apiKey AIzaSy...]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions for parsing
function parseWhatsAppChatText(rawText) {
  const lines = rawText.split(/\r?\n/);
  const messages = [];
  let currentMsg = null;

  const iosPattern = /^\[(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+([^:]+?):\s+(.*)$/;
  const androidPattern = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s+-\s+([^:]+?):\s+(.*)$/;
  const bracketPattern = /^\[(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?),?\s+(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\]\s+([^:]+?):\s+(.*)$/;

  for (const line of lines) {
    if (!line) continue;
    const match = line.match(iosPattern) || line.match(androidPattern) || line.match(bracketPattern);
    if (match) {
      if (currentMsg) messages.push(currentMsg);
      currentMsg = {
        timestamp: `${match[1]} ${match[2]}`,
        sender: match[3].trim(),
        text: match[4] || '',
      };
    } else if (currentMsg) {
      currentMsg.text += '\n' + line;
    }
  }
  if (currentMsg) messages.push(currentMsg);
  return messages;
}

function parseMarkdownNotes(rawMarkdown) {
  const blocks = rawMarkdown.split(/(?=\n#{1,3}\s+|\n---+\n|\n\d+\.\s+\*\*Name|\n\*\*(?:Full )?Name\*\*)/i);
  const messages = [];

  blocks.forEach((block, idx) => {
    const trimmed = block.trim();
    if (trimmed.length < 15) return;
    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)$/m);
    const nameMatch = trimmed.match(/\*\*(?:Full )?Name\*\*\s*[:\-]?\s*([^\n\r*]+)/i);
    const sender = headerMatch ? headerMatch[1].trim() : (nameMatch ? nameMatch[1].trim() : `Member ${idx + 1}`);

    messages.push({
      timestamp: 'Markdown Note',
      sender,
      text: trimmed,
    });
  });
  return messages;
}

function isIntroMessage(text) {
  if (!text || text.length < 20) return false;
  const lower = text.toLowerCase();
  const introPatterns = [
    /name\s*:/i,
    /business\s*:/i,
    /looking for\s*:/i,
    /can help\s*:/i,
    /what do you do\s*:/i,
    /location\s*:/i,
    /where are you\s*:/i,
    /i am a\s+/i,
    /i'm a\s+/i,
    /my name is\s+/i,
    /i run a\s+/i,
    /founder of\s+/i,
    /ceo of\s+/i,
    /startup\s+/i,
  ];
  return introPatterns.some((p) => p.test(lower));
}

function extractIndustryTags(text) {
  const lower = text.toLowerCase();
  const tags = new Set();
  if (lower.includes('e-commerce') || lower.includes('shop') || lower.includes('retail')) tags.add('E-commerce');
  if (lower.includes('import') || lower.includes('export') || lower.includes('logistics')) tags.add('Logistics');
  if (lower.includes('food') || lower.includes('restaurant')) tags.add('Food Tech');
  if (lower.includes('fashion') || lower.includes('clothing')) tags.add('Fashion');
  if (lower.includes('marketing') || lower.includes('branding') || lower.includes('ads')) tags.add('Marketing');
  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('data')) tags.add('AI/ML');
  if (lower.includes('saas') || lower.includes('software')) tags.add('SaaS');
  if (lower.includes('fintech') || lower.includes('finance') || lower.includes('wallet')) tags.add('FinTech');
  if (tags.size === 0) tags.add('Entrepreneur');
  return Array.from(tags);
}

function parseRuleBased(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let name = '', role = '', business = '', stage = 'idea', lookingFor = '', canHelp = '', country = 'Egypt', city = 'Cairo';
  const phone = (rawText.match(/(?:\+|00)\d{10,14}/) || [])[0] || '';

  lines.forEach((line) => {
    const nameM = line.match(/^(?:Full Name|Name)\s*[:\-]\s*(.*)$/i);
    if (nameM) name = nameM[1].trim();
    const roleM = line.match(/^(?:Role|Profession|Title|What do you do)\s*[:\-]\s*(.*)$/i);
    if (roleM) role = roleM[1].trim();
    const bizM = line.match(/^(?:Business|Company|Project|Startup)\s*[:\-]\s*(.*)$/i);
    if (bizM) business = bizM[1].trim();
    const lookM = line.match(/^(?:Looking for|Seeking|Need)\s*[:\-]\s*(.*)$/i);
    if (lookM) lookingFor = lookM[1].trim();
    const helpM = line.match(/^(?:Can help|Offering|Help with)\s*[:\-]\s*(.*)$/i);
    if (helpM) canHelp = helpM[1].trim();
    const locM = line.match(/^(?:Location|City|Country)\s*[:\-]\s*(.*)$/i);
    if (locM) {
      const parts = locM[1].split(/,|\-/);
      if (parts.length >= 2) {
        city = parts[0].trim();
        country = parts[1].trim();
      } else {
        city = locM[1].trim();
      }
    }
  });

  if (!name) {
    const match = rawText.match(/(?:My name is|I am|I'm)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/);
    if (match) name = match[1].trim();
  }

  return {
    name: name || 'Entrepreneur Member',
    role: role || 'Founder',
    business: business || 'Strategic Venture',
    stage,
    lookingFor,
    canHelp,
    location: { country, city },
    phone,
    tags: extractIndustryTags(rawText),
    status: 'active',
    appStatus: 'APPROVED',
  };
}

async function parseIntroWithGemini(rawText, genAI) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Extract structured profile from this founder intro message.
Return JSON ONLY:
{
  "name": "",
  "role": "",
  "business": "",
  "stage": "idea|starting|running|growing",
  "lookingFor": "",
  "canHelp": "",
  "location": { "country": "Egypt", "city": "Cairo" },
  "phone": "",
  "tags": ["Tag1", "Tag2"]
}

Message:
"""
${rawText}
"""`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1));
  throw new Error('Failed to parse JSON response');
}

// ── CLI Main Execution ────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Smart Directory — WhatsApp & Markdown Chat Parser CLI

Usage:
  node scripts/parse-whatsapp-chat.js <file1.txt|file1.md> [file2.txt ...] [options]

Options:
  --apiKey <key>     Gemini API Key for AI extraction (optional, falls back to rule-based parser)
  --out <path>       Output JSON file path (default: data/extracted_members.json)
  --help, -h         Show help
`);
    process.exit(0);
  }

  let apiKey = process.env.GEMINI_API_KEY || '';
  let outputFile = path.join(process.cwd(), 'data', 'extracted_members.json');
  const inputFiles = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apiKey' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      inputFiles.push(args[i]);
    }
  }

  if (inputFiles.length === 0) {
    console.error('❌ Error: Please provide at least one input chat file (.txt or .md)');
    process.exit(1);
  }

  let genAI = null;
  if (apiKey) {
    console.log('🤖 Gemini AI Engine initialized.');
    genAI = new GoogleGenerativeAI(apiKey);
  } else {
    console.log('⚡ Running in high-speed local NLP rule-based mode (No API Key provided).');
  }

  const allCandidateMessages = [];

  for (const filePath of inputFiles) {
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: File not found: ${filePath}`);
      continue;
    }

    console.log(`📖 Reading: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const isMd = filePath.endsWith('.md');
    const messages = isMd ? parseMarkdownNotes(content) : parseWhatsAppChatText(content);
    console.log(`   └─ Found ${messages.length} raw message blocks.`);

    const candidates = messages.filter((m) => isIntroMessage(m.text) || isMd);
    console.log(`   └─ Identified ${candidates.length} candidate introduction(s).`);
    allCandidateMessages.push(...candidates);
  }

  console.log(`\n🔍 Total intros to process: ${allCandidateMessages.length}`);
  const extractedProfiles = [];

  for (let i = 0; i < allCandidateMessages.length; i++) {
    const cand = allCandidateMessages[i];
    process.stdout.write(`\r[${i + 1}/${allCandidateMessages.length}] Parsing intro from "${cand.sender}"...`);

    let profile = null;
    if (genAI) {
      try {
        profile = await parseIntroWithGemini(cand.text, genAI);
      } catch {
        profile = parseRuleBased(cand.text);
      }
    } else {
      profile = parseRuleBased(cand.text);
    }

    if (profile && (profile.name || profile.role || profile.business)) {
      if (!profile.name || profile.name === 'Entrepreneur Member') {
        if (cand.sender && !cand.sender.startsWith('+')) profile.name = cand.sender;
      }
      if (!profile.phone && cand.sender && cand.sender.startsWith('+')) {
        profile.phone = cand.sender;
      }

      extractedProfiles.push({
        id: `profile_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...profile,
        createdAt: new Date().toISOString(),
      });
    }
  }

  console.log('\n\n✅ Extraction Complete!');
  console.log(`🎉 Successfully parsed ${extractedProfiles.length} business profile(s).`);

  // Ensure output dir exists
  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(extractedProfiles, null, 2), 'utf-8');
  console.log(`💾 Saved profile database to: ${outputFile}\n`);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
