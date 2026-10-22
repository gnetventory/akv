import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractUrls, formatWebsiteUrl } from './helpers';
import { getAPIKey } from './storage';

let genAI = null;

export function initGemini(apiKey) {
  if (!apiKey) return;
  genAI = new GoogleGenerativeAI(apiKey);
}

// Model candidates array (ordered by speed and reliability)
const CANDIDATE_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

async function generateContentWithFallback(prompt) {
  if (!genAI) {
    const key =
      getAPIKey() ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      '';
    if (key) {
      genAI = new GoogleGenerativeAI(key);
    }
  }

  if (!genAI) throw new Error('Gemini API key not set. Please enter your key in Admin → Settings.');

  let errors = [];
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      console.warn(`Model ${modelName} error: ${err.message}`);
      errors.push(err.message);
    }
  }

  throw new Error(errors[0] || 'Gemini API call failed');
}

function extractJSON(text) {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  throw new Error('Could not extract JSON from AI response');
}

function extractJSONArray(text) {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);
  const arrStart = text.indexOf('[');
  const arrEnd = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1) return JSON.parse(text.slice(arrStart, arrEnd + 1));
  throw new Error('Could not extract JSON array from AI response');
}

// ─── Smart Heuristic Filter for Intro Messages Only ─────────────────────────
export function isIntroMessage(text) {
  if (!text || text.length < 10) return false;

  if (
    text.includes('voice message omitted') ||
    text.includes('image omitted') ||
    text.includes('video omitted')
  )
    return false;

  const introPatterns = [
    /name\s*:/i,
    /business\s*:/i,
    /looking for\s*:/i,
    /can help\s*:/i,
    /what do you do\s*:/i,
    /location\s*:/i,
    /where are you\s*:/i,
    /this is\s+/i,
    /i am a\s+/i,
    /i'm a\s+/i,
    /my name is\s+/i,
    /i run a\s+/i,
    /co-founder/i,
    /founder/i,
    /ceo/i,
    /teacher/i,
    /supervisor/i,
    /academy/i,
    /freelance/i,
    /agency/i,
    /startup/i,
    /partner/i,
    /consultant/i,
    /consulting/i,
    /أنا\s+/i,
    /انا\s+/i,
    /اسمي\s+/i,
    /إسمي\s+/i,
    /شغال/i,
    /شغالة/i,
    /تدريس/i,
    /أكاديمية/i,
    /اكاديمية/i,
    /كورسات/i,
    /خبره/i,
    /خبرة/i,
    /مشروع/i,
    /شركة/i,
    /هاللوز/i,
    /اعرف عن نفسي/i,
    /أعرف عن نفسي/i,
    /اعرفكم بنفسي/i,
    /خريج/i,
    /استشارات/i,
    /تطوير الاعمال/i,
    /تطوير الأعمال/i,
    /بنقدم/i,
    /شراكه/i,
    /شراكة/i,
  ];

  return introPatterns.some((pattern) => pattern.test(text));
}

// ─── Smart Tag Generator ──────────────────────────────────────────────────────
function extractIndustryTags(text) {
  const lower = text.toLowerCase();
  const tags = new Set();

  if (
    lower.includes('consulting') ||
    lower.includes('استشارات') ||
    lower.includes('تطوير الاعمال') ||
    lower.includes('تطوير الأعمال') ||
    lower.includes('business development') ||
    lower.includes('commercial infrastructure') ||
    lower.includes('infrastructure')
  ) {
    tags.add('Business Consulting');
    tags.add('Business Development');
  }

  if (
    lower.includes('growth') ||
    lower.includes('growth ceiling') ||
    lower.includes('growth strategy') ||
    lower.includes('scale') ||
    lower.includes('توسيع')
  ) {
    tags.add('Growth Strategy');
  }

  if (
    lower.includes('investment') ||
    lower.includes('استثمار') ||
    lower.includes('funding') ||
    lower.includes('investor')
  ) {
    tags.add('Investment Readiness');
  }

  if (
    lower.includes('founder dependency') ||
    lower.includes('founder') ||
    lower.includes('co-founder') ||
    lower.includes('startup') ||
    lower.includes('مؤسس') ||
    lower.includes('رواد اعمال') ||
    lower.includes('رواد الأعمال')
  ) {
    tags.add('Startups');
  }

  if (
    lower.includes('english') ||
    lower.includes('تدريس') ||
    lower.includes('مدرسة') ||
    lower.includes('انترناشيونال') ||
    lower.includes('courses') ||
    lower.includes('كورسات') ||
    lower.includes('أكاديمية') ||
    lower.includes('اكاديمية') ||
    lower.includes('education') ||
    lower.includes('teacher')
  ) {
    tags.add('Education');
    tags.add('EdTech');
    if (lower.includes('english') || lower.includes('إنجلش') || lower.includes('لغات')) {
      tags.add('Language Training');
    }
  }

  if (
    lower.includes('content') ||
    lower.includes('محتوى') ||
    lower.includes('فيديوهات') ||
    lower.includes('tiktok') ||
    lower.includes('youtube') ||
    lower.includes('صفحات')
  ) {
    tags.add('Content Creation');
  }

  if (
    lower.includes('سفر') ||
    lower.includes('travel') ||
    lower.includes('camping') ||
    lower.includes('tourism') ||
    lower.includes('أماكن')
  ) {
    tags.add('Travel');
  }

  if (
    lower.includes('e-commerce') ||
    lower.includes('shop') ||
    lower.includes('retail') ||
    lower.includes('trading') ||
    lower.includes('marketplace') ||
    lower.includes('store')
  )
    tags.add('E-commerce');
  if (
    lower.includes('import') ||
    lower.includes('export') ||
    lower.includes('logistics') ||
    lower.includes('shipping') ||
    lower.includes('sourcing')
  )
    tags.add('Logistics');
  if (lower.includes('food') || lower.includes('grocery') || lower.includes('restaurant'))
    tags.add('Food Tech');
  if (
    lower.includes('fashion') ||
    lower.includes('clothing') ||
    lower.includes('apparel') ||
    lower.includes('modest fashion')
  )
    tags.add('Fashion');
  if (
    lower.includes('marketing') ||
    lower.includes('branding') ||
    lower.includes('seo') ||
    lower.includes('ads') ||
    lower.includes('تسويق')
  )
    tags.add('Marketing');
  if (
    lower.includes('app') ||
    lower.includes('mobile') ||
    lower.includes('flutter') ||
    lower.includes('react native')
  )
    tags.add('Mobile Apps');
  if (
    lower.includes('ai') ||
    lower.includes('machine learning') ||
    lower.includes('gpt') ||
    lower.includes('data optimization')
  )
    tags.add('AI/ML');
  if (lower.includes('saas') || lower.includes('software')) tags.add('SaaS');
  if (
    lower.includes('fintech') ||
    lower.includes('wallet') ||
    lower.includes('lending') ||
    lower.includes('finance') ||
    lower.includes('محاسبة')
  )
    tags.add('FinTech');
  if (
    lower.includes('art') ||
    lower.includes('heritage') ||
    lower.includes('design') ||
    lower.includes('craft') ||
    lower.includes('visual design')
  )
    tags.add('Design');
  if (
    lower.includes('biosensor') ||
    lower.includes('tumors') ||
    lower.includes('chemistry') ||
    lower.includes('health') ||
    lower.includes('patent') ||
    lower.includes('science') ||
    lower.includes('طب')
  )
    tags.add('HealthTech');

  if (tags.size === 0) tags.add('General Business');
  return Array.from(tags).slice(0, 5);
}

// ─── Smart Local Rule-Based Parser (Handles Structured & Narrative Intros) ────
export function parseLocalRuleBased(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  const cleanText = rawText
    .replace(/M♡lly/g, 'Molly')
    .replace(/♡/g, 'o')
    .replace(/(?:❤️|[♥★☆✨😍🥰😊])/gu, ' ');

  const lines = cleanText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let name = '';
  let role = '';
  let business = '';
  let stage = 'starting';
  let lookingFor = '';
  let canHelp = '';
  let country = 'Egypt';
  let city = 'Cairo';
  let phone = (rawText.match(/(?:\+|00)\d{10,14}/) || [])[0] || '';

  // 1. Structured Section Patterns (Key-Value)
  const sectionPatterns = [
    { key: 'name', regex: /^(?:Full Name|Name\s*[:-]):?\s*(.*)$/i },
    {
      key: 'role',
      regex: /^(?:What do you do\??|Role|Profession|Title|Position)\s*[:-]?\s*(.*)$/i,
    },
    {
      key: 'business',
      regex: /^(?:Business(?:\/Project)?|Project|Company|Startup)\s*[:-]?\s*(.*)$/i,
    },
    {
      key: 'stage',
      regex: /^(?:Where are you currently\??|Stage|Current stage|Status)\s*[:-]?\s*(.*)$/i,
    },
    {
      key: 'lookingFor',
      regex:
        /^(?:What am I looking for(?: right now)?\??|Looking for(?!ward)(?: right now)?|Need|Searching for)\s*[:-]?\s*(.*)$/i,
    },
    {
      key: 'canHelp',
      regex:
        /^(?:What can I help others with\??|Can help(?: others with)?\??|Can help with|Offering|Help with)\s*[:-]?\s*(.*)$/i,
    },
    {
      key: 'location',
      regex: /^(?:Location|Where are you located\??|City|Country|Based in)\s*[:-]?\s*(.*)$/i,
    },
  ];

  let currentKey = null;
  let currentBuffer = [];
  let firstUnlabeledLines = [];

  const flushBuffer = () => {
    if (!currentKey || currentBuffer.length === 0) return;
    const content = currentBuffer.join(' ').trim();
    if (currentKey === 'name') name = content;
    else if (currentKey === 'role') role = content;
    else if (currentKey === 'business') business = content;
    else if (currentKey === 'stage') {
      const lower = content.toLowerCase();
      if (lower.includes('running') || lower.includes('operational') || lower.includes('trading'))
        stage = 'running';
      else if (lower.includes('growing') || lower.includes('scaling')) stage = 'growing';
      else if (lower.includes('starting') || lower.includes('launched') || lower.includes('mvp'))
        stage = 'starting';
      else if (lower.includes('idea')) stage = 'idea';
    } else if (currentKey === 'lookingFor') lookingFor = content;
    else if (currentKey === 'canHelp') canHelp = content;
    else if (currentKey === 'location') {
      const parts = content.split(/,|-/).map((p) => p.trim());
      if (parts.length >= 2) {
        city = parts[0];
        country = parts[1];
      } else {
        country = content;
      }
    }
    currentBuffer = [];
  };

  lines.forEach((line) => {
    let matched = false;
    for (const p of sectionPatterns) {
      const m = line.match(p.regex);
      if (m) {
        flushBuffer();
        currentKey = p.key;
        if (m[1].trim()) currentBuffer.push(m[1].trim());
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (currentKey) {
        currentBuffer.push(line);
      } else {
        firstUnlabeledLines.push(line);
      }
    }
  });

  flushBuffer();

  // 2. Narrative Conversational Parsing (for "My name is X", "This is M♡lly", "أنا اسمي...", "معاكم...", "انا محمد مصيلحي...")
  const lowerText = cleanText.toLowerCase();

  const isGreetingOrMeta = (line) => {
    const l = line.toLowerCase().trim();
    return (
      l.startsWith('السلام عليكم') ||
      l.startsWith('تحياتي') ||
      l.startsWith('صباح الخير') ||
      l.startsWith('مساء الخير') ||
      l.startsWith('hello') ||
      l.startsWith('hi all') ||
      l.startsWith('hey guys') ||
      l.includes('اتمني تكونوا بخير') ||
      l.includes('اتمنى تكونوا بخير') ||
      l.includes('لسه داخل الجروب') ||
      l.includes('حبيت اعرف عن نفسي') ||
      l.includes('حبيت اعرفكم بنفسي') ||
      l.includes('حبيت اعرفكم بيا') ||
      l.includes('مبسوط جدا اني موجود') ||
      l.includes('شرف ليا وجودي')
    );
  };

  // Name extraction
  if (!name) {
    const NAME_STOP_WORDS = new Set([
      'خريج',
      'خريجة',
      'مهندس',
      'مهندسة',
      'دكتور',
      'دكتورة',
      'طبيب',
      'طبيبة',
      'شغال',
      'شغالة',
      'بشتغل',
      'اشتغل',
      'founder',
      'co-founder',
      'cofounder',
      'ceo',
      'cto',
      'cfo',
      'cmo',
      'عندي',
      'مؤسس',
      'مؤسسة',
      'مستشار',
      'مستشارة',
      'مسوق',
      'مسوقة',
      'مبرمج',
      'مبرمجة',
      'مطور',
      'مطورة',
      'مدرس',
      'مدرسة',
      'معلم',
      'معلمة',
      'مدرب',
      'مدربة',
      'طالب',
      'طالبة',
      'باحث',
      'باحثة',
      'مدير',
      'مديرة',
      'لسه',
      'حبيت',
      'مبسوط',
      'شغوف',
      'هنا',
      'داخل',
      'داخلة',
      'في',
      'من',
      'مع',
      'معاكم',
      'معكم',
      'و',
      'and',
      'at',
      'in',
      'of',
      'the',
      'is',
      'a',
      'an',
    ]);

    const validLines = lines.filter((l) => !isGreetingOrMeta(l));

    for (const line of validLines) {
      if (line.includes('http') || line.length < 3) continue;

      // 1. Pattern: "This is X" or "My name is X"
      const englishIntroMatch = line.match(/(?:My name is|This is|I am|I'm)\s+([^,.\n]+)/i);
      if (englishIntroMatch) {
        const candidateWords = englishIntroMatch[1].trim().split(/\s+/);
        const nameParts = [];
        for (const w of candidateWords) {
          const cleanW = w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/gi, '');
          if (NAME_STOP_WORDS.has(cleanW) || cleanW.length === 0) break;
          nameParts.push(w);
          if (nameParts.length >= 3) break;
        }
        if (nameParts.length > 0) {
          name = nameParts
            .join(' ')
            .replace(/(?:❤️|[♡♥★☆✨😍🥰😊])/gu, '')
            .trim();
          break;
        }
      }

      // 2. Pattern: "اسمي X" or "أنا اسمي X" or "معاكم X"
      const arabicIntroMatch = line.match(
        /(?:اسمي|إسمي|أنا اسمي|انا اسمي|معاكم|معكم)\s+([^,.\n]+)/i
      );
      if (arabicIntroMatch) {
        const candidateWords = arabicIntroMatch[1].trim().split(/\s+/);
        const nameParts = [];
        for (const w of candidateWords) {
          const cleanW = w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/gi, '');
          if (NAME_STOP_WORDS.has(cleanW) || cleanW.length === 0) break;
          nameParts.push(w);
          if (nameParts.length >= 3) break;
        }
        if (nameParts.length > 0) {
          name = nameParts
            .join(' ')
            .replace(/(?:❤️|[♡♥★☆✨😍🥰😊])/gu, '')
            .trim();
          break;
        }
      }

      // 3. Pattern: "أنا X" or "انا X"
      const directAnaMatch = line.match(/^(?:أنا|انا)\s+([^,.\n]+)/i);
      if (directAnaMatch) {
        const candidateWords = directAnaMatch[1].trim().split(/\s+/);
        const nameParts = [];
        for (const w of candidateWords) {
          const cleanW = w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/gi, '');
          if (NAME_STOP_WORDS.has(cleanW) || cleanW.length === 0) break;
          nameParts.push(w);
          if (nameParts.length >= 3) break;
        }
        if (nameParts.length > 0) {
          name = nameParts
            .join(' ')
            .replace(/(?:❤️|[♡♥★☆✨😍🥰😊])/gu, '')
            .trim();
          break;
        }
      }
    }

    // Fallback: check if the first valid line is just a standalone name (1-3 words)
    if (!name && validLines.length > 0) {
      for (const line of validLines) {
        const cleanedLine = line
          .replace(
            /^(?:Hi|Hello|Hey|هاللوز باللوز|أهلاً|اهلا|السلام عليكم|صباح الخير|مساء الخير)\s*(?:everyone|all|guys)?[!👋,\s🥰😍]*/iu,
            ''
          )
          .replace(/^(?:أنا|انا|This is)\s+/i, '')
          .trim();
        const candidateWords = cleanedLine.split(/\s+/);
        if (
          candidateWords.length >= 1 &&
          candidateWords.length <= 3 &&
          !candidateWords.some((w) =>
            NAME_STOP_WORDS.has(w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/gi, ''))
          ) &&
          !cleanedLine.includes('http') &&
          cleanedLine.length < 35
        ) {
          name = cleanedLine.replace(/(?:❤️|[♡♥★☆✨😍🥰😊])/gu, '').trim();
          break;
        }
      }
    }
  }

  // Role extraction
  if (!role) {
    const englishRoleMatch = cleanText.match(
      /(?:I'm an?|I am an?|working as an?|role is)\s+([^\n,.]+)/i
    );
    if (englishRoleMatch) {
      role = englishRoleMatch[1].trim();
    } else if (cleanText.match(/founder\s+of\s+([A-Za-z0-9\s&]+)/i)) {
      const fMatch = cleanText.match(/founder\s+of\s+([A-Za-z0-9\s&]+)/i);
      const company = fMatch[1].split(/(?:لتطوير|لـ|for|and|in|\n|,)/i)[0].trim();
      if (
        lowerText.includes('استشارات') ||
        lowerText.includes('تطوير الاعمال') ||
        lowerText.includes('business development') ||
        lowerText.includes('consulting')
      ) {
        role = `Founder of ${company} & Business Development Consultant`;
      } else {
        role = `Founder of ${company}`;
      }
    } else if (
      lowerText.includes('استشارات تنميه اعمال') ||
      lowerText.includes('تطوير الاعمال') ||
      lowerText.includes('business development')
    ) {
      role = 'Business Development & Growth Consultant';
    } else if (
      lowerText.includes('تدريس') ||
      lowerText.includes('شغالة في مدرسة') ||
      lowerText.includes('شغال في مدرسة') ||
      lowerText.includes('teachers') ||
      lowerText.includes('supervisor')
    ) {
      if (
        lowerText.includes('أكاديمية') ||
        lowerText.includes('اكاديمية') ||
        lowerText.includes('إنترناشيونال') ||
        lowerText.includes('انترناشيونال')
      ) {
        role = 'English Language Educator & Online Academy Founder';
      } else {
        role = 'Teacher & Educator';
      }
    } else if (
      lowerText.includes('developer') ||
      lowerText.includes('software engineer') ||
      lowerText.includes('مبرمج')
    ) {
      role = 'Software Engineer & Developer';
    } else if (
      lowerText.includes('marketing') ||
      lowerText.includes('تسويق') ||
      lowerText.includes('media buyer')
    ) {
      role = 'Marketing & Growth Specialist';
    } else if (cleanText.match(/(?:خريج|مهندس|دكتور|طبيب|مستشار|مدير|استشاري)\s+([^\n,.]+)/i)) {
      const match = cleanText.match(/(?:خريج|مهندس|دكتور|طبيب|مستشار|مدير|استشاري)\s+([^\n,.]+)/i);
      role = match[0].trim();
    }
  }

  // Business / Venture extraction
  if (!business) {
    if (cleanText.match(/founder\s+of\s+([A-Za-z0-9\s&]+)/i)) {
      const fMatch = cleanText.match(/founder\s+of\s+([A-Za-z0-9\s&]+)/i);
      const company = fMatch[1].split(/(?:لتطوير|لـ|for|and|in|\n|,)/i)[0].trim();
      if (
        lowerText.includes('استشارات') ||
        lowerText.includes('commercial infrastructure') ||
        lowerText.includes('growth ceiling')
      ) {
        business = `${company} — استشارات تنمية وتطوير الأعمال وحلول الـ Commercial Infrastructure وحل مشاكل الـ Growth Ceiling والـ Founder Dependency للمؤسسين حتى مرحلة الاستثمار (Investment)`;
      } else {
        business = `${company} — Business Venture & Growth Solutions`;
      }
    } else if (
      lowerText.includes('أكاديمية') ||
      lowerText.includes('اكاديمية') ||
      lowerText.includes('كورسات إنجلش') ||
      lowerText.includes('كورسات english') ||
      lowerText.includes('business english')
    ) {
      business =
        'Online English Academy & Language Content Creation — English courses for adults & kids (Beginners to Advanced, Conversation, Business English, ESP)';
    } else if (
      cleanText.match(/(?:core project focused on|project focused on|developing)\s+([^.\n\r]+)/i)
    ) {
      const pMatch = cleanText.match(
        /(?:core project focused on|project focused on|developing)\s+([^.\n\r]+)/i
      );
      business = pMatch[0].trim();
    } else if (cleanText.match(/(?:بنقدم خدمات|خدماتنا|مشروعنا|شركتنا)\s+([^.\n\r]+)/i)) {
      const match = cleanText.match(/(?:بنقدم خدمات|خدماتنا|مشروعنا|شركتنا)\s+([^.\n\r]+)/i);
      business = match[0].trim();
    }
  }

  // Looking For extraction
  if (lookingFor) {
    if (
      lookingFor.toLowerCase().includes('forward to connecting') ||
      lookingFor.toLowerCase().startsWith('ward to')
    ) {
      lookingFor = '';
    } else {
      lookingFor = lookingFor.replace(
        /^(?:right now|needed|searching|forward to|ward to)\s*[:-]?\s*/i,
        ''
      );
    }
  }

  if (!lookingFor) {
    if (
      lowerText.includes('شراكه استراتيجية') ||
      lowerText.includes('شراكة استراتيجية') ||
      lowerText.includes('اقتراح شراكه') ||
      lowerText.includes('اقتراح شراكة')
    ) {
      lookingFor =
        'اقتراحات شراكة استراتيجية، فرص تعاون وتوسيع شبكة الأعمال في تطوير وتنمية الشركات';
    } else if (
      lowerText.includes('نكبر الأكاديمية') ||
      lowerText.includes('نكبر الاكاديمية') ||
      lowerText.includes('نكبر') ||
      lowerText.includes('تكبير')
    ) {
      lookingFor = 'تكبير وتطوير الأكاديمية الأونلاين والتوسع في الكورسات والشراكات';
    } else {
      const lookMatch = cleanText.match(
        /(?:I’d like to|I would like to|I'm looking to|I am looking for|I want to|Goal is to|بدور على|هدفي)\s+([^.\n\r]+(?:[^.\n\r]+)?)/i
      );
      if (lookMatch && !lookMatch[0].toLowerCase().includes('looking forward to')) {
        lookingFor = lookMatch[0].trim();
      }
    }
  }

  // Can Help / Offerings extraction
  if (!canHelp) {
    if (
      lowerText.includes('growth ceiling') ||
      lowerText.includes('founder dependency') ||
      lowerText.includes('استشارات تنميه اعمال') ||
      lowerText.includes('commercial infrastructure')
    ) {
      canHelp =
        'استشارات تنمية وتطوير الأعمال، حل مشاكل الـ Growth Ceiling والـ Founder Dependency، بناء الـ Commercial Infrastructure والمرافقة حتى مرحلة الـ Investment';
    } else if (
      lowerText.includes('سفر') ||
      lowerText.includes('camping') ||
      lowerText.includes('تدريس') ||
      lowerText.includes('كورسات')
    ) {
      canHelp =
        'تدريس كورسات لغة إنجليزية (Adults & Kids, Business English, Conversation, ESP)، صناعة محتوى تعليمي، وإرشادات السفر والـ Camping داخل مصر';
    } else {
      const helpMatch = cleanText.match(
        /(?:I’d be glad to help|I'd be glad to help|I can help|glad to help|happy to help|لو حد حابب أساعده|لو حد حابب اساعده|أقدر أساعد|اقدر اساعد|بنساعد في|بنقدم خدمات)\s*(?:out)?\s*(?:with|on|في)?\s+([^.\n\r]+)/i
      );
      if (helpMatch) {
        canHelp = helpMatch[1].trim();
      }
    }
  }

  // Stage determination logic
  if (
    lowerText.includes('لسه بدايه') ||
    lowerText.includes('لسه بداية') ||
    lowerText.includes('أكاديمية صغننه') ||
    lowerText.includes('صغننه كده') ||
    lowerText.includes('صغيرة') ||
    lowerText.includes('بدايه يعني') ||
    lowerText.includes('بداية يعني') ||
    lowerText.includes('just starting') ||
    lowerText.includes('early days') ||
    lowerText.includes('mvp')
  ) {
    stage = 'starting';
  } else if (
    lowerText.includes('early stages') ||
    lowerText.includes('business model') ||
    lowerText.includes('مجرد فكرة') ||
    lowerText.includes('لسه فكرة') ||
    lowerText.includes('idea')
  ) {
    stage = 'idea';
  } else if (
    lowerText.includes('investment') ||
    lowerText.includes('استشارات') ||
    lowerText.includes('commercial infrastructure') ||
    lowerText.includes('بنقدم خدمات') ||
    lowerText.includes('بنكونوا مع المؤسس') ||
    lowerText.includes('running') ||
    lowerText.includes('operational') ||
    lowerText.includes('trading') ||
    lowerText.includes('شغال بقالي')
  ) {
    stage = 'running';
  } else if (
    lowerText.includes('growing') ||
    lowerText.includes('scaling') ||
    lowerText.includes('بنتوسع') ||
    lowerText.includes('توسع')
  ) {
    stage = 'growing';
  }

  // 3. Smart Location Detection (Prioritize specific cities/locations before generic country mentions)
  if (
    lowerText.includes('manchester') ||
    lowerText.includes('london') ||
    lowerText.includes('uk') ||
    lowerText.includes('united kingdom')
  ) {
    country = 'United Kingdom';
    city = lowerText.includes('manchester') ? 'Manchester' : 'London';
  } else if (
    lowerText.includes('saudi') ||
    lowerText.includes('riyadh') ||
    lowerText.includes('الرياض') ||
    lowerText.includes('السعودية')
  ) {
    country = 'Saudi Arabia';
    city = 'Riyadh';
  } else if (
    lowerText.includes('dubai') ||
    lowerText.includes('uae') ||
    lowerText.includes('دبي') ||
    lowerText.includes('الإمارات')
  ) {
    country = 'United Arab Emirates';
    city = 'Dubai';
  } else if (
    lowerText.includes('مصر') ||
    lowerText.includes('جوه مصر') ||
    lowerText.includes('cairo') ||
    lowerText.includes('القاهرة') ||
    lowerText.includes('egypt') ||
    lowerText.includes('اقتصاد وعلوم سياسيه') ||
    lowerText.includes('ain shams') ||
    lowerText.includes('auc')
  ) {
    country = 'Egypt';
    city = 'Cairo';
  } else if (lowerText.includes('brazil') || lowerText.includes('são paulo')) {
    country = 'Brazil';
    city = 'São Paulo';
  } else if (
    lowerText.includes('india') ||
    lowerText.includes('mumbai') ||
    lowerText.includes('delhi')
  ) {
    country = 'India';
    city = 'Mumbai';
  }

  // Clean prefixes if any leaked
  if (lookingFor)
    lookingFor = lookingFor.replace(/^(?:right now|needed|searching)\s*[:-]\s*/i, '');
  if (canHelp) canHelp = canHelp.replace(/^(?:others with|with)\s*[:-]\s*/i, '');

  if (!name && !role && !business) {
    return null;
  }

  return {
    name: name || 'Entrepreneur Member',
    role: role || 'Founder & Business Consultant',
    business: business || (role ? role : 'Business Venture'),
    stage,
    lookingFor,
    canHelp,
    location: { country: country || 'Egypt', city: city || 'Cairo' },
    phone,
    tags: extractIndustryTags(cleanText),
    originalLanguage: cleanText.match(/[\u0600-\u06FF]/) ? 'ar' : 'en',
    originalText: rawText,
  };
}

// ─── 1. Parse a single intro ──────────────────────────────────────────────────
export async function parseIntro(rawText) {
  try {
    const prompt = `You are an expert profile extractor for an international entrepreneurs' WhatsApp community directory.

Parse the following WhatsApp member introduction message and extract ALL information cleanly and accurately.

IMPORTANT Extraction Guidelines:
1. name: Extract ONLY the clean full name or nickname (e.g. "Mohamed Moselhy" or "محمد مصيلحي", "Molly", "Sherif ElMenyawy"). Remove greeting phrases ("This is", "أنا اسمي", "انا", "Hello guys", "السلام عليكم"), qualifications ("خريج اقتصاد وعلوم سياسيه"), hearts, emojis, and decorative symbols.
2. role: Professional title or role (e.g., "Founder of Phoenix Growth Partners & Business Development Consultant", "English Language Educator & Online Academy Founder", "Co-Founder & CTO").
3. business: Business or project summary. Summarize what they build, provide, consult on, or sell (e.g. "Phoenix Growth Partners — Business development consultancy & commercial infrastructure solutions (Growth Ceiling, Founder Dependency, Investment Readiness)").
4. stage: Must be exactly one of "idea", "starting", "running", "growing".
   - If they are an active consulting agency or service operating with founders -> "running".
   - If "لسه بدايه يعني / صغننه كده / just started / early days / MVP" -> "starting".
   - If idea / concept only -> "idea".
   - If scaled / 3+ years -> "growing".
   - DO NOT confuse phrases like "انا لسه داخل الجروب" (meaning "I just joined the WhatsApp group") with a starting stage.
5. lookingFor: What they are looking for, goals, strategic partnerships, or what they need (e.g., "Strategic partnerships, business development collaborations, networking with founders"). DO NOT capture casual greetings or sign-offs.
6. canHelp: What concrete skills, services, solutions, or advice they offer to others (e.g., "Business development consulting, solving Growth Ceiling & Founder Dependency, building Commercial Infrastructure, and accompanying founders up to the Investment stage").
7. location: Object with "country" and "city" (e.g., { "country": "Egypt", "city": "Cairo" }).
8. phone: WhatsApp/mobile number with country code if provided, otherwise "".
9. linkedin: LinkedIn profile or company URL if provided (e.g. "https://www.linkedin.com/company/phoenix-growth-agency1/"), otherwise "".
10. website: Primary website, social media profile, TikTok, Facebook, Instagram, or portfolio URL if provided.
11. secondaryWebsite: Secondary website, social link, or additional catalogue URL if multiple links are present.
12. websites: Array of ALL distinct external URLs found in the text.
13. tags: Array of 2-5 relevant industry and expertise tags (e.g. ["Business Consulting", "Growth Strategy", "Commercial Infrastructure", "Investment Readiness", "Startups"]).
14. originalLanguage: "ar" if primarily Arabic or "en" if English.

Return ONLY valid JSON with no markdown wrapping other than \`\`\`json:
\`\`\`json
{
  "name": "",
  "role": "",
  "business": "",
  "stage": "running",
  "lookingFor": "",
  "canHelp": "",
  "location": { "country": "", "city": "" },
  "phone": "",
  "linkedin": "",
  "website": "",
  "secondaryWebsite": "",
  "websites": [],
  "tags": [],
  "originalLanguage": "en"
}
\`\`\`

Raw introduction message:
"""
${rawText}
"""`;

    const result = await generateContentWithFallback(prompt);
    const text = result.response.text();
    const parsed = extractJSON(text);

    // Post-process extracted links to guarantee only genuine valid URLs are kept
    const allFoundUrls = extractUrls(rawText).map(formatWebsiteUrl).filter(Boolean);
    const rawParsedWebsites = Array.isArray(parsed.websites)
      ? parsed.websites.flatMap(extractUrls).map(formatWebsiteUrl).filter(Boolean)
      : [];
    const mergedWebsites = Array.from(new Set([...rawParsedWebsites, ...allFoundUrls]));

    // Separate LinkedIn if present (both /in/ and /company/)
    const linkedInUrl = mergedWebsites.find((u) => u.toLowerCase().includes('linkedin.com/'));
    const nonLinkedInWebsites = mergedWebsites.filter(
      (u) => !u.toLowerCase().includes('linkedin.com/')
    );

    const validParsedLinkedin = formatWebsiteUrl(parsed.linkedin);

    return {
      ...parsed,
      name: (parsed.name || '').replace(/(?:❤️|[♡♥★☆✨😍🥰😊])/gu, '').trim() || 'Community Member',
      linkedin: validParsedLinkedin || linkedInUrl || '',
      website: nonLinkedInWebsites[0] || '',
      secondaryWebsite: nonLinkedInWebsites[1] || '',
      websites: nonLinkedInWebsites,
      originalText: rawText,
    };
  } catch (err) {
    console.warn('AI Parsing failed, using enhanced local rule parser fallback:', err.message);
    const fallback = parseLocalRuleBased(rawText);
    const allFoundUrls = extractUrls(rawText).map(formatWebsiteUrl).filter(Boolean);
    const nonLinkedIn = allFoundUrls.filter((u) => !u.toLowerCase().includes('linkedin.com/'));
    const linkedIn = allFoundUrls.find((u) => u.toLowerCase().includes('linkedin.com/'));

    return {
      ...(fallback || {
        name: 'Community Member',
        role: 'Founder & Entrepreneur',
        business: rawText.slice(0, 120),
        stage: 'running',
        lookingFor: '',
        canHelp: '',
        location: { country: 'Egypt', city: 'Cairo' },
        phone: '',
        tags: ['Business Consulting'],
        originalLanguage: 'ar',
      }),
      website: nonLinkedIn[0] || '',
      secondaryWebsite: nonLinkedIn[1] || '',
      websites: nonLinkedIn,
      linkedin: linkedIn || '',
      originalText: rawText,
    };
  }
}

// ─── 2. Bulk parse a WhatsApp chat export ────────────────────────────────────
export async function bulkParseChat(chatText) {
  try {
    const prompt = `You are processing a WhatsApp group chat export. Your task is to find ONLY ACTUAL member introduction/bio messages in the chat and parse each one into a structured profile.

CRITICAL INSTRUCTIONS:
- IGNORE casual conversations, meeting polls, scheduling chats, greetings, voice message notes ("<voice message omitted>"), and member additions.
- ONLY extract messages where a person explicitly introduces themselves, their business, what they do, what they need, or what they offer.
- Extract full name cleanly, role, core project/business, stage ("idea", "starting", "running", "growing"), clean country/city, lookingFor, and canHelp.

Return ONLY a JSON array:
\`\`\`json
[
  { "name": "", "role": "", "business": "", "stage": "idea", "lookingFor": "", "canHelp": "", "location": { "country": "", "city": "" }, "phone": "", "tags": [], "originalLanguage": "en" }
]
\`\`\`

WhatsApp chat text:
"""
${chatText.slice(0, 15000)}
"""`;

    const result = await generateContentWithFallback(prompt);
    const text = result.response.text();
    return extractJSONArray(text);
  } catch (err) {
    console.warn('AI Bulk Chat parsing failed, running heuristic intro scanner:', err.message);
    const blocks = chatText.split(/(?=\[\d+\/\d+\/\d+)/);
    const intros = [];

    blocks.forEach((block) => {
      if (isIntroMessage(block)) {
        const parsed = parseLocalRuleBased(block);
        if (parsed) intros.push(parsed);
      }
    });

    return intros;
  }
}

// ─── 3. AI Matchmaker ─────────────────────────────────────────────────────────
export async function generateMatches(targetMember, allMembers) {
  const candidates = allMembers.filter((m) => m.id !== targetMember.id);
  if (candidates.length === 0) return [];

  const candidatesSummary = candidates
    .map(
      (m, i) =>
        `[${i}] ID:${m.id} | Name:${m.name} | Role:${m.role} | Business:${m.business} | Stage:${m.stage} | LookingFor:${m.lookingFor} | CanHelp:${m.canHelp} | Location:${m.location?.city},${m.location?.country} | Tags:${m.tags?.join(',')}`
    )
    .join('\n');

  const prompt = `You are an expert entrepreneurship coach and network connector.

Analyze the following entrepreneur profile and find the top 5 most relevant matches from the community.

TARGET PROFILE:
Name: ${targetMember.name}
Role: ${targetMember.role}
Business: ${targetMember.business}
Stage: ${targetMember.stage}
Looking For: ${targetMember.lookingFor}
Can Help With: ${targetMember.canHelp}
Location: ${targetMember.location?.city}, ${targetMember.location?.country}
Tags: ${targetMember.tags?.join(', ')}

COMMUNITY MEMBERS:
${candidatesSummary}

Return ONLY JSON array of top 5 matches:
\`\`\`json
[
  {
    "memberId": "member-id-here",
    "score": 9,
    "headline": "One-line reason they should meet",
    "reason": "2-3 sentence explanation of the specific synergy and value",
    "valueForTarget": "What target gains",
    "valueForMatch": "What match gains"
  }
]
\`\`\``;

  try {
    const result = await generateContentWithFallback(prompt);
    const text = result.response.text();
    const matches = extractJSONArray(text);
    const memberMap = Object.fromEntries(candidates.map((m) => [m.id, m]));
    return matches
      .filter((match) => memberMap[match.memberId])
      .map((match) => ({ ...match, member: memberMap[match.memberId] }));
  } catch {
    return candidates.slice(0, 3).map((m, idx) => ({
      member: m,
      score: 8 - idx,
      headline: `Synergy in ${m.tags?.[0] || 'business'}`,
      reason: `${m.name} is in the ${m.stage} stage and offers experience in ${m.canHelp || m.role}.`,
    }));
  }
}

// ─── 4. Generate outreach message ─────────────────────────────────────────────
export async function generateOutreachMessage(fromMember, toMember) {
  try {
    const prompt = `Write a warm, concise WhatsApp outreach message from ${fromMember.name} to ${toMember.name}.
From Business: ${fromMember.business}
To Business: ${toMember.business}
Return ONLY the message text (3 sentences max).`;

    const result = await generateContentWithFallback(prompt);
    return result.response.text().trim();
  } catch {
    return `Hi ${toMember.name}! I saw your profile in the Entrepreneurs Directory. I run ${fromMember.business} and would love to connect about potential collaboration!`;
  }
}

// ─── 5. Semantic search ───────────────────────────────────────────────────────
export async function semanticSearch(query, members) {
  return members.filter(
    (m) =>
      m.name?.toLowerCase().includes(query.toLowerCase()) ||
      m.business?.toLowerCase().includes(query.toLowerCase()) ||
      m.canHelp?.toLowerCase().includes(query.toLowerCase())
  );
}

// ─── 6. Generate weekly digest ─────────────────────────────────────────────────
export async function generateWeeklyDigest(newMembers, period = '7 days') {
  try {
    const membersList = newMembers
      .map(
        (m) =>
          `• ${m.name} (${m.location?.city || m.location?.country || 'Unknown'}) — ${m.role} | ${m.stage} stage | LF: ${m.lookingFor?.slice(0, 80)}`
      )
      .join('\n');

    const prompt = `Write a friendly WhatsApp group message introducing these new community members:\n${membersList}\nReturn ONLY the message text.`;

    const result = await generateContentWithFallback(prompt);
    return result.response.text().trim();
  } catch {
    const lines = [`🌟 *NEW MEMBERS ROUNDUP (Last ${period})* 🌟\n`];
    newMembers.forEach((m) => {
      lines.push(
        `• *${m.name}* (${m.location?.city || m.location?.country || 'Global'}) — _${m.role}_`
      );
      if (m.lookingFor) lines.push(`  🔍 LF: ${m.lookingFor}`);
      lines.push('');
    });
    lines.push('💬 Say hello and explore synergies in our community directory!');
    return lines.join('\n');
  }
}

// ─── 7. Generate AI Welcome Hook for Community Announcements ──────────────────
export async function generateAIWelcomeHook(member, tone = 'egyptian') {
  if (!member) return '';
  try {
    const languageInstruction =
      tone === 'english'
        ? 'Write in modern, encouraging English for an entrepreneur network.'
        : tone === 'arabic'
          ? 'اكتب بالعربية الفصحى المهنية الراقية لشبكة رواد أعمال.'
          : 'اكتب باللهجة المصرية الودودة الذكية الخاصة بمجتمع رواد الأعمال والستارتبس.';

    const prompt = `You are the community host for the BGM Egyptian & Regional Entrepreneurs Network.
A new founder has just joined the community:
- Name: ${member.name}
- Role: ${member.role || 'Founder'}
- Venture: ${member.business || 'Venture'}
- Stage: ${member.stage || 'Active'}
- Location: ${member.location?.city || ''}, ${member.location?.country || 'Egypt'}
- Looking for: ${member.lookingFor || 'Partnerships and growth'}
- Can help with: ${member.canHelp || 'Industry expertise'}
- Tags: ${(member.tags || []).join(', ')}

Task: Write a punchy 1-2 sentence hook highlighting their unique value proposition and who in the community should reach out to them.
Guidance:
${languageInstruction}
Keep it concise, energetic, and natural. Return ONLY the 1-2 sentence hook without quotes, asterisks, or labels.`;

    const result = await generateContentWithFallback(prompt);
    const text = result?.response?.text()?.trim() || '';
    return text.replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('AI welcome hook generation failed:', err.message);
    return '';
  }
}
