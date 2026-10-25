// ─── AKV Manager Business Insights & Analytics Engine ──────────────────────────
// Computes supply & demand, service shortages, top locations, and survey insights

import { getSurveyResponses, getCollabRequests } from './storage';

export function calculateManagerInsights(members = []) {
  const safeMembers = Array.isArray(members) ? members : [];
  const surveys = getSurveyResponses();
  const collabs = getCollabRequests();

  // 1. Supply & Demand (Requests vs Offers)
  let totalAsks = 0;
  let totalOffers = 0;
  const asksByCategory = {};
  const offersByCategory = {};

  const CATEGORY_KEYWORDS = {
    'Tech & Development': ['tech', 'dev', 'software', 'app', 'developer', 'saas', 'ai', 'برمجة', 'مطور'],
    'Marketing & Growth': ['marketing', 'growth', 'sales', 'ads', 'media', 'branding', 'leads', 'تسويق', 'مبيعات'],
    'Tax, Legal & Finance': ['tax', 'legal', 'accounting', 'audit', 'law', 'lawyer', 'finance', 'ضرائب', 'قانوني', 'محاسبة'],
    'Funding & Investment': ['funding', 'invest', 'investor', 'capital', 'angel', 'تمويل', 'مستثمر'],
    'Logistics & Operations': ['logistics', 'shipping', 'supply chain', 'warehouse', 'شحن', 'لوجستيات'],
    'Hiring & HR': ['hiring', 'talent', 'recruit', 'hr', 'team', 'توظيف', 'فريق'],
  };

  safeMembers.forEach((m) => {
    const lookingText = (m.lookingFor || '').toLowerCase();
    const canHelpText = (m.canHelp || '').toLowerCase();

    if (lookingText.length > 5) totalAsks++;
    if (canHelpText.length > 5) totalOffers++;

    Object.entries(CATEGORY_KEYWORDS).forEach(([cat, keywords]) => {
      const isAsk = keywords.some((kw) => lookingText.includes(kw));
      const isOffer = keywords.some((kw) => canHelpText.includes(kw));

      if (isAsk) asksByCategory[cat] = (asksByCategory[cat] || 0) + 1;
      if (isOffer) offersByCategory[cat] = (offersByCategory[cat] || 0) + 1;
    });
  });

  // Calculate liquidity ratio (Offers / Asks)
  const liquidityRatio = totalAsks > 0 ? (totalOffers / totalAsks).toFixed(2) : '1.00';

  // 2. Service Shortages (High Demand, Low Supply)
  const serviceGaps = Object.keys(CATEGORY_KEYWORDS).map((cat) => {
    const asks = asksByCategory[cat] || 0;
    const offers = offersByCategory[cat] || 0;
    const shortageScore = asks - offers;
    return {
      category: cat,
      asks,
      offers,
      shortageScore,
      status: shortageScore > 3 ? 'High Shortage' : shortageScore < -3 ? 'High Supply' : 'Balanced',
    };
  }).sort((a, b) => b.shortageScore - a.shortageScore);

  // 3. Top Member Locations
  const locationCounts = {
    'New Cairo / Tagamo3': 0,
    'Sheikh Zayed / 6th of October': 0,
    'Maadi & Central Cairo': 0,
    'Alexandria & Delta': 0,
    'Regional (KSA / UAE / Gulf)': 0,
    'Other / Unspecified': 0,
  };

  safeMembers.forEach((m) => {
    const loc = `${m.location?.city || ''} ${m.location?.country || ''} ${m.originalText || ''}`.toLowerCase();
    if (loc.includes('tagamo') || loc.includes('new cairo') || loc.includes('تجمع') || loc.includes('القاهرة الجديدة')) {
      locationCounts['New Cairo / Tagamo3']++;
    } else if (loc.includes('zayed') || loc.includes('october') || loc.includes('زايد') || loc.includes('اكتوبر')) {
      locationCounts['Sheikh Zayed / 6th of October']++;
    } else if (loc.includes('maadi') || loc.includes('معادي') || loc.includes('downtown') || loc.includes('وسط')) {
      locationCounts['Maadi & Central Cairo']++;
    } else if (loc.includes('alex') || loc.includes('اسكندرية') || loc.includes('إسكندرية')) {
      locationCounts['Alexandria & Delta']++;
    } else if (loc.includes('saudi') || loc.includes('ksa') || loc.includes('uae') || loc.includes('dubai') || loc.includes('سعودية') || loc.includes('امارات')) {
      locationCounts['Regional (KSA / UAE / Gulf)']++;
    } else {
      locationCounts['Other / Unspecified']++;
    }
  });

  const locationBreakdown = Object.entries(locationCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: safeMembers.length > 0 ? Math.round((count / safeMembers.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 4. Survey Insights
  const surveyCategories = {};
  surveys.forEach((s) => {
    const cat = s.category || 'General';
    if (!surveyCategories[cat]) surveyCategories[cat] = [];
    surveyCategories[cat].push(s);
  });

  return {
    totalMembers: safeMembers.length,
    totalAsks,
    totalOffers,
    liquidityRatio,
    serviceGaps,
    locationBreakdown,
    totalSurveys: surveys.length,
    recentSurveys: surveys.slice(0, 8),
    totalCollabs: collabs.length,
    recentCollabs: collabs.slice(0, 5),
  };
}
