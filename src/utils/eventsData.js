/**
 * Community Events Data & Utilities for Smart Entrepreneurs Directory
 */

export const INITIAL_COMMUNITY_EVENTS = [
  {
    id: 'evt-cairo-breakfast',
    title: 'Cairo Founders Mastermind & Breakfast',
    titleAr: 'فطور ولقاء رواد الأعمال بالقاهرة الجديدة',
    tagline: 'High-intimacy peer advisory & cross-border growth strategies',
    format: 'offline', // 'offline' | 'online'
    category: 'Mastermind',
    date: '2026-10-24',
    displayDate: 'Sat, Oct 24, 2026',
    time: '10:00 AM - 1:00 PM CLT',
    startIso: '20261024T080000Z',
    endIso: '20261024T110000Z',
    location: 'KD Hub, New Cairo, Egypt',
    locationAr: 'التجمع الخامس، القاهرة',
    mapsUrl: 'https://maps.google.com/?q=New+Cairo+Egypt',
    hostName: 'Dr. Tarek El-Kady',
    hostRole: 'Angel Syndicate Lead & Scale Advisor',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&auto=format&fit=crop&q=80',
    description: 'An exclusive, high-trust closed gathering for active founders in the Smart Directory. We will unpack real case studies on scaling operations into the Gulf, hiring top senior engineering talent, and structuring early-stage equity.',
    attendeesCount: 38,
    capacity: 50,
    tags: ['#growth', '#syndicate', '#cairo'],
    featured: true,
    whatsappNumber: '+201000000000',
  },
  {
    id: 'evt-b2b-sales-masterclass',
    title: 'Scaling B2B Enterprise Sales Across GCC & Egypt',
    titleAr: 'جلسة تدريبية: مبيعات الشركات B2B في الخليج ومصر',
    tagline: 'Virtual tactical session on enterprise sales cycles & pilot closing',
    format: 'online',
    category: 'Virtual Masterclass',
    date: '2026-10-29',
    displayDate: 'Thu, Oct 29, 2026',
    time: '7:00 PM - 8:30 PM CLT',
    startIso: '20261029T170000Z',
    endIso: '20261029T183000Z',
    location: 'Live on Google Meet & Zoom',
    locationAr: 'عبر الإنترنت (Google Meet)',
    meetingUrl: 'https://meet.google.com/xyz-smart-dir',
    hostName: 'Nourhan Mansour',
    hostRole: 'VP of Commercial Strategy',
    hostAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&auto=format&fit=crop&q=80',
    description: 'Hands-on breakdown of enterprise pipelines: how to move from warm intros to paid multi-year contracts, navigating procurement, and accelerating enterprise sales cycles in Saudi Arabia and the UAE.',
    attendeesCount: 74,
    capacity: 100,
    tags: ['#sales', '#enterprise', '#gcc'],
    featured: false,
    whatsappNumber: '+201000000000',
  },
  {
    id: 'evt-zamalek-angel-mixer',
    title: 'Zamalek Angel & Founder Evening Mixer',
    titleAr: 'لقاء المستثمرين الملائكيين ومؤسسي الشركات بالزمالك',
    tagline: 'Casual sunset networking, syndicate pitches & co-founder connections',
    format: 'offline',
    category: 'Networking Mixer',
    date: '2026-11-06',
    displayDate: 'Fri, Nov 6, 2026',
    time: '6:30 PM - 9:30 PM CLT',
    startIso: '20261106T163000Z',
    endIso: '20261106T193000Z',
    location: 'The Loft, Zamalek, Cairo',
    locationAr: 'الزمالك، القاهرة',
    mapsUrl: 'https://maps.google.com/?q=Zamalek+Cairo+Egypt',
    hostName: 'Sherif Mostafa',
    hostRole: 'Ecosystem Builder & Venture Partner',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80',
    description: 'An informal evening connecting pre-seed and seed stage entrepreneurs with angel syndicates, active investors, and potential co-founders in a relaxed atmosphere.',
    attendeesCount: 42,
    capacity: 60,
    tags: ['#angel', '#fundraising', '#zamalek'],
    featured: false,
    whatsappNumber: '+201000000000',
  },
  {
    id: 'evt-alex-tech-roundtable',
    title: 'Alexandria Tech Founders & AI Builders Meetup',
    titleAr: 'ملتقى رواد التقنية والذكاء الاصطناعي بالإسكندرية',
    tagline: 'Deep dive into AI-driven workflows, tech stacks & local talent hubs',
    format: 'offline',
    category: 'Tech Roundtable',
    date: '2026-11-14',
    displayDate: 'Sat, Nov 14, 2026',
    time: '2:00 PM - 5:00 PM CLT',
    startIso: '20261114T120000Z',
    endIso: '20261114T150000Z',
    location: 'Silicon Hub, Smouha, Alexandria',
    locationAr: 'سموحة، الإسكندرية',
    mapsUrl: 'https://maps.google.com/?q=Smouha+Alexandria+Egypt',
    hostName: 'Karim Zaki',
    hostRole: 'CTO & Tech Syndicate Member',
    hostAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=240&auto=format&fit=crop&q=80',
    description: 'Bringing Alexandria-based software architects, CTOs, and tech founders together to exchange experience on generative AI in production, cloud economics, and hiring tech leads.',
    attendeesCount: 29,
    capacity: 40,
    tags: ['#tech', '#ai', '#alexandria'],
    featured: false,
    whatsappNumber: '+201000000000',
  },
  {
    id: 'evt-gulf-expansion-ama',
    title: 'Expanding to Saudi Arabia & UAE: Legal, Tax & Banking',
    titleAr: 'التوسع في السعودية والإمارات: التراخيص والضرائب والبنوك',
    tagline: 'AMA session on MISA licenses, ADGM/DIFC setups & bank account opening',
    format: 'online',
    category: 'Expansion AMA',
    date: '2026-11-20',
    displayDate: 'Fri, Nov 20, 2026',
    time: '6:00 PM - 7:30 PM CLT',
    startIso: '20261120T160000Z',
    endIso: '20261120T173000Z',
    location: 'Live Interactive Webinar (Zoom)',
    locationAr: 'عبر الإنترنت (Zoom)',
    meetingUrl: 'https://zoom.us/j/smart-dir-gulf',
    hostName: 'Omar Al-Husseini',
    hostRole: 'Cross-Border Legal & Market Entry Specialist',
    hostAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=240&auto=format&fit=crop&q=80',
    description: 'Clear, unvarnished guidance on establishing regional entities in Riyadh (MISA / RHQ) and Dubai/Abu Dhabi (DIFC / ADGM), cost breakdown, tax residency, and corporate banking setup.',
    attendeesCount: 88,
    capacity: 120,
    tags: ['#ksa', '#uae', '#legal'],
    featured: false,
    whatsappNumber: '+201000000000',
  },
];

const RSVP_STORAGE_KEY = 'smart_directory_user_rsvps';

/**
 * Generate 1-Click Google Calendar Add Link
 */
export function generateGoogleCalendarUrl({ title, description, location, startIso, endIso }) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: title || 'Smart Entrepreneurs Gathering',
    details: description || 'Smart Entrepreneurs Directory Community Gathering',
    location: location || 'Online / Cairo',
    dates: `${startIso}/${endIso}`,
  });
  return `${baseUrl}&${params.toString()}`;
}

/**
 * Get Saved User RSVPs from Local Storage
 */
export function getSavedRsvps() {
  try {
    const raw = localStorage.getItem(RSVP_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load RSVPs', e);
    return [];
  }
}

/**
 * Toggle RSVP status for an event
 */
export function toggleEventRsvp(eventId) {
  try {
    const rsvps = getSavedRsvps();
    let updated;
    const isRsvped = rsvps.includes(eventId);
    if (isRsvped) {
      updated = rsvps.filter((id) => id !== eventId);
    } else {
      updated = [...rsvps, eventId];
    }
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(updated));
    return !isRsvped;
  } catch (e) {
    console.error('Failed to update RSVP', e);
    return false;
  }
}
