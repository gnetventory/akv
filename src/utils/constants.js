// ─── Stage Definitions ────────────────────────────────────────────────────────
export const STAGES = {
  idea: {
    label: 'Idea Phase',
    tenure: 'Concept',
    color: 'slate',
    bg: 'bg-stone-100 dark:bg-stone-800',
    text: 'text-stone-700 dark:text-stone-300',
    border: 'border-stone-300 dark:border-stone-700',
    icon: '💡',
  },
  starting: {
    label: 'Starting',
    tenure: '<1 Year',
    color: 'emerald',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: '🌱',
  },
  running: {
    label: 'Running',
    tenure: '1–3 Years',
    color: 'amber',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    icon: '⚙️',
  },
  growing: {
    label: 'Growing',
    tenure: '3+ Years',
    color: 'indigo',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
    icon: '🚀',
  },
};

export const STAGE_OPTIONS = ['idea', 'starting', 'running', 'growing'];

// ─── Controlled Canonical Sectors ──────────────────────────────────────────────
export const CONTROLLED_SECTORS = [
  { id: 'tech_saas', label: 'Technology, Software & AI', keywords: ['tech', 'software', 'saas', 'ai', 'ml', 'app', 'web', 'it', 'cloud', 'data', 'برمجة', 'تقنية'] },
  { id: 'ecommerce_retail', label: 'E-Commerce, D2C & Retail', keywords: ['e-commerce', 'ecommerce', 'retail', 'd2c', 'shop', 'fashion', 'store', 'marketplace', 'تجارة إلكترونية', 'تسوق'] },
  { id: 'marketing_media', label: 'Marketing, Media & Design', keywords: ['marketing', 'media', 'brand', 'design', 'content', 'social media', 'creative', 'ads', 'تسويق', 'إعلام'] },
  { id: 'logistics_ops', label: 'Logistics & Supply Chain', keywords: ['logistic', 'supply chain', 'freight', 'shipping', 'warehouse', 'delivery', 'export', 'import', 'لوجستيات', 'شحن', 'تصدير'] },
  { id: 'fintech_finance', label: 'FinTech & Financial Services', keywords: ['fintech', 'finance', 'payment', 'banking', 'invest', 'accounting', 'مدفوعات', 'مالية'] },
  { id: 'health_wellness', label: 'Healthcare & HealthTech', keywords: ['health', 'medtech', 'pharma', 'clinic', 'wellness', 'biotech', 'صحة', 'طب'] },
  { id: 'realestate_proptech', label: 'Real Estate & PropTech', keywords: ['proptech', 'real estate', 'property', 'broker', 'construction', 'عقارات', 'تطوير عقاري'] },
  { id: 'food_beverage', label: 'Food, Beverage & AgTech', keywords: ['food', 'beverage', 'f&b', 'restaurant', 'cafe', 'agtech', 'agriculture', 'أغذية', 'مطاعم', 'زراعة'] },
  { id: 'education_hr', label: 'EdTech, HR & Talent', keywords: ['edtech', 'education', 'hr', 'talent', 'recruit', 'hiring', 'training', 'تعليم', 'توظيف'] },
  { id: 'advisory_legal', label: 'Advisory, Legal & Consulting', keywords: ['consulting', 'advisory', 'legal', 'law', 'strategy', 'tax', 'استشارات', 'قانوني'] },
];

export function getMemberCanonicalSector(member) {
  if (!member) return 'General Venture';
  const combined = `${member.business || ''} ${member.role || ''} ${(member.tags || []).join(' ')} ${member.lookingFor || ''} ${member.canHelp || ''}`.toLowerCase();
  for (const s of CONTROLLED_SECTORS) {
    if (s.keywords.some((k) => combined.includes(k))) {
      return s.label;
    }
  }
  return 'General Venture';
}

// ─── Legacy Industry Tags (kept for backwards-compatibility) ────────────────────
export const INDUSTRY_TAGS = [
  'FinTech',
  'EdTech',
  'HealthTech',
  'E-commerce',
  'SaaS',
  'AI/ML',
  'Marketing',
  'Branding',
  'Design',
  'Mobile Apps',
  'Web Dev',
  'Food Tech',
  'Sustainability',
  'Logistics',
  'Real Estate',
  'Travel',
  'Social Media',
  'Content Creation',
  'Consulting',
  'Manufacturing',
  'Agriculture',
  'Fashion',
  'Retail',
  'Media',
  'Legal',
  'Finance',
  'Healthcare',
  'Education',
  'Marketplace',
  'HR Tech',
  'PropTech',
];

// ─── LocalStorage Keys ─────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  MEMBERS: 'sed_members',
  EXCHANGE: 'sed_exchange_posts',
  API_KEY: 'sed_gemini_api_key',
  DARK_MODE: 'sed_dark_mode',
  NIA_PIN: 'sed_nia_pin',
  ADMIN_PIN: 'sed_admin_pin',
  APP_SETTINGS: 'sed_app_settings',
  MAP_CONFIG: 'sed_map_config',
  SHEETS_CONFIG: 'sed_sheets_config',
  TOMBSTONES: 'sed_tombstones',
  NIA_EMAIL: 'sed_nia_email',
  ADMIN_EMAIL: 'sed_admin_email',
  NIA_PHONE: 'sed_nia_phone',
};

// ─── Default Nia Contact Config (Customizable in admin / localStorage) ─────────
export const DEFAULT_NIA_CONTACT = {
  name: 'Omnia Bahaaeldin (Nia)',
  role: 'Growth Business Consultant & Founder',
  phone: '201000998449', // Editable in admin portal or settings
  whatsappNumber: '201000998449',
};

// ─── Map Tile Providers & API Configuration ────────────────────────────────────
export const MAP_TILE_PRESETS = [
  {
    id: 'esri_world',
    name: 'Esri World Street Map (100% Free, No Watermark)',
    description: 'High-resolution worldwide street cartography — 100% Free, No key needed',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
    requiresKey: false,
  },
];

// ─── Staleness Threshold ──────────────────────────────────────────────────────
export const STALENESS_DAYS = 90;

// ─── Avatar Gradient Palette ──────────────────────────────────────────────────
export const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-violet-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-sky-600',
  'from-red-500 to-orange-600',
  'from-green-500 to-emerald-600',
];

import communityMembersData from '../data/community_members.json';

// ─── Seed / Real Community Members ───────────────────────────────────────────
export const SEED_MEMBERS = communityMembersData.map((m, idx) => ({
  ...m,
  id: m.id || `community-${idx + 1}`,
  createdAt: m.createdAt || new Date(Date.now() - (idx + 1) * 36e5).toISOString(),
  updatedAt: m.updatedAt || new Date().toISOString(),
}));

// ─── Official Member Intake & Update Google Form ──────────────────────────────
export const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeWXJF6cXtxMIQPLK3eKyDtfhdmIIK17oP8f9hS0WGgHysF5g/viewform?usp=header';

// ─── Navigation Tabs ──────────────────────────────────────────────────────────
export const NAV_TABS = [
  {
    id: 'dashboard',
    label: 'Community Snapshot',
    icon: 'BarChart3',
    description: 'Overview of members, community needs & gaps',
  },
  { id: 'directory', label: 'Directory', icon: 'Users', description: 'Browse all founders & ventures' },
  {
    id: 'exchange',
    label: 'Problem Board',
    icon: 'HelpCircle',
    description: 'Founder block exchange: share problems & get peer solutions',
  },
  {
    id: 'radar',
    label: 'Find Your Match',
    icon: 'Radio',
    description: 'Complementary founder synergies & pairings',
  },
  {
    id: 'map',
    label: 'Alliance Atlas',
    icon: 'Globe',
    description: 'Egypt, Gulf & Regional founder distribution',
  },
];

// ─── Country Flag Map (top common countries) ─────────────────────────────────
export const COUNTRY_FLAGS = {
  Afghanistan: '🇦🇫',
  Albania: '🇦🇱',
  Algeria: '🇩🇿',
  Argentina: '🇦🇷',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Bahrain: '🇧🇭',
  Bangladesh: '🇧🇩',
  Belgium: '🇧🇪',
  Brazil: '🇧🇷',
  Canada: '🇨🇦',
  Chile: '🇨🇱',
  China: '🇨🇳',
  Colombia: '🇨🇴',
  'Czech Republic': '🇨🇿',
  Denmark: '🇩🇰',
  Egypt: '🇪🇬',
  Ethiopia: '🇪🇹',
  Finland: '🇫🇮',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Ghana: '🇬🇭',
  Greece: '🇬🇷',
  Hungary: '🇭🇺',
  India: '🇮🇳',
  Indonesia: '🇮🇩',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  Ireland: '🇮🇪',
  Israel: '🇮🇱',
  Italy: '🇮🇹',
  Japan: '🇯🇵',
  Jordan: '🇯🇴',
  Kenya: '🇰🇪',
  Kuwait: '🇰🇼',
  Lebanon: '🇱🇧',
  Libya: '🇱🇾',
  Malaysia: '🇲🇾',
  Mexico: '🇲🇽',
  Morocco: '🇲🇦',
  Netherlands: '🇳🇱',
  'New Zealand': '🇳🇿',
  Nigeria: '🇳🇬',
  Norway: '🇳🇴',
  Oman: '🇴🇲',
  Pakistan: '🇵🇰',
  Peru: '🇵🇪',
  Philippines: '🇵🇭',
  Poland: '🇵🇱',
  Portugal: '🇵🇹',
  Qatar: '🇶🇦',
  Romania: '🇷🇴',
  Russia: '🇷🇺',
  'Saudi Arabia': '🇸🇦',
  Senegal: '🇸🇳',
  Singapore: '🇸🇬',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  Spain: '🇪🇸',
  Sudan: '🇸🇩',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Syria: '🇸🇾',
  Taiwan: '🇹🇼',
  Tanzania: '🇹🇿',
  Thailand: '🇹🇭',
  Tunisia: '🇹🇳',
  Turkey: '🇹🇷',
  UAE: '🇦🇪',
  Uganda: '🇺🇬',
  UK: '🇬🇧',
  Ukraine: '🇺🇦',
  'United Arab Emirates': '🇦🇪',
  'United Kingdom': '🇬🇧',
  'United States': '🇺🇸',
  USA: '🇺🇸',
  Venezuela: '🇻🇪',
  Vietnam: '🇻🇳',
  Yemen: '🇾🇪',
  Zimbabwe: '🇿🇼',
};

export const getCountryFlag = (country) => COUNTRY_FLAGS[country] || '🌍';
