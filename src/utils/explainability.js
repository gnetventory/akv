// ─── Explainability & Behavioral Gamification Engine ───────────────────────────
// Generates transparent scoring breakdowns, actionable boost advice, and executive badges

import { categorizeText, CAPABILITY_VERTICALS } from './executiveAnalytics';
import { isValidLinkedInUrl, getMemberWebsites } from './helpers';

/**
 * 1. Profile Strength & Ecosystem Readiness Explainer
 */
export function explainProfileStrength(member) {
  if (!member) {
    return {
      score: 40,
      tier: {
        name: 'Alliance Bronze',
        level: 1,
        color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
        nextTier: 'Alliance Silver (55%)',
        ptsNeeded: 15,
      },
      checklist: [],
      specialBadges: [],
      boostAdvice: 'Complete your profile to unlock search visibility.',
      isComplete: false,
    };
  }

  let score = 40; // Endowed Baseline (40%)
  const checklist = [];

  // Item 1: Endowed Base (40%)
  checklist.push({
    id: 'base_alliance',
    label: 'Verified Community Membership',
    description: 'Active cohort verification granted upon joining the network',
    done: true,
    points: 40,
    tip: 'Completed',
  });

  // Item 2: Online Presence (+15%)
  const websites = getMemberWebsites(member);
  const hasWebsite = websites.length > 0 || (member.website && member.website.trim().length > 3);
  if (hasWebsite) {
    score += 15;
    checklist.push({
      id: 'online_presence',
      label: 'Digital Presence & Links',
      description: 'Website, social media, portfolio, or catalogue configured',
      done: true,
      points: 15,
      tip: 'Completed',
    });
  } else {
    checklist.push({
      id: 'online_presence',
      label: 'Add Website / Portfolio Link',
      description: 'Help founders explore your business, products, or service portfolio',
      done: false,
      points: 15,
      tip: 'Add a website, TikTok, Facebook, or portfolio URL in your profile',
    });
  }

  // Item 3: LinkedIn Profile (+15%)
  const hasLinkedin = isValidLinkedInUrl(member.linkedin);
  if (hasLinkedin) {
    score += 15;
    checklist.push({
      id: 'linkedin',
      label: 'LinkedIn Professional Identity',
      description: 'Professional credentials & corporate background verified',
      done: true,
      points: 15,
      tip: 'Completed',
    });
  } else {
    checklist.push({
      id: 'linkedin',
      label: 'Connect LinkedIn Profile',
      description: 'Build trust with other founders through verified professional background',
      done: false,
      points: 15,
      tip: 'Add your LinkedIn personal handle or company page',
    });
  }

  // Item 4: Synergy & Industry Tags (2+ tags) (+15%)
  const hasTags = Array.isArray(member.tags) && member.tags.length >= 2;
  if (hasTags) {
    score += 15;
    checklist.push({
      id: 'tags',
      label: 'Synergy & Industry Tags (2+)',
      description: `${member.tags.length} industry tags configured for search and match radar`,
      done: true,
      points: 15,
      tip: 'Completed',
    });
  } else {
    checklist.push({
      id: 'tags',
      label: 'Select 2+ Industry Tags',
      description: 'Ensure the AI MatchMaker can connect you with relevant partners',
      done: false,
      points: 15,
      tip: 'Add at least 2 relevant industry tags to your profile',
    });
  }

  // Item 5: Defined Value Proposition & Offers (+15%)
  const hasValueProp =
    (member.canHelp && member.canHelp.trim().length >= 10) ||
    (member.lookingFor && member.lookingFor.trim().length >= 10);
  if (hasValueProp) {
    score += 15;
    checklist.push({
      id: 'value_prop',
      label: 'Value Proposition & Collaboration Asks',
      description: 'Clear "How I Can Help" and "Looking For" collaboration statements',
      done: true,
      points: 15,
      tip: 'Completed',
    });
  } else {
    checklist.push({
      id: 'value_prop',
      label: 'Define "How I Can Help" & Asks',
      description: 'State your superpowers and what partnerships you are currently seeking',
      done: false,
      points: 15,
      tip: 'Fill in your "Can Help With" and "Looking For" fields',
    });
  }

  score = Math.min(100, score);

  // Determine Tier & Progression
  let tier = {
    name: 'Alliance Bronze',
    level: 1,
    icon: '🥉',
    color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
    nextTier: 'Alliance Silver (55%)',
    ptsNeeded: Math.max(0, 55 - score),
  };

  if (score >= 95) {
    tier = {
      name: 'Ecosystem Pioneer',
      level: 4,
      icon: '💎',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300',
      nextTier: 'Max Level (100%)',
      ptsNeeded: 0,
    };
  } else if (score >= 70) {
    tier = {
      name: 'Alliance Gold',
      level: 3,
      icon: '🥇',
      color: 'text-orange-700 bg-orange-50 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300',
      nextTier: 'Ecosystem Pioneer (95%)',
      ptsNeeded: Math.max(0, 95 - score),
    };
  } else if (score >= 55) {
    tier = {
      name: 'Alliance Silver',
      level: 2,
      icon: '🥈',
      color: 'text-sky-700 bg-sky-50 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300',
      nextTier: 'Alliance Gold (70%)',
      ptsNeeded: Math.max(0, 70 - score),
    };
  }

  // Specialty Badges
  const specialBadges = [];
  const textBlob = `${member.role || ''} ${member.business || ''} ${member.canHelp || ''} ${member.lookingFor || ''} ${(member.tags || []).join(' ')}`.toLowerCase();

  // Badge 1: Deal Maker
  if (
    member.canHelp &&
    member.canHelp.length >= 15 &&
    member.lookingFor &&
    member.lookingFor.length >= 15
  ) {
    specialBadges.push({
      id: 'deal_maker',
      title: 'Deal Maker',
      icon: '🤝',
      description: 'High reciprocity profile with active bilateral asks and concrete offerings',
      color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
    });
  }

  // Badge 2: Super Connector
  if (Array.isArray(member.tags) && member.tags.length >= 3 && hasWebsite) {
    specialBadges.push({
      id: 'super_connector',
      title: 'Super Connector',
      icon: '⚡',
      description: 'Multi-vertical founder with extensive collaboration touchpoints',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300',
    });
  }

  // Badge 3: Cross-Border Exporter
  if (
    textBlob.includes('export') ||
    textBlob.includes('تصدير') ||
    textBlob.includes('import') ||
    textBlob.includes('استيراد') ||
    textBlob.includes('cross-border') ||
    textBlob.includes('gcc') ||
    textBlob.includes('mena') ||
    textBlob.includes('international')
  ) {
    specialBadges.push({
      id: 'exporter',
      title: 'Cross-Border Operator',
      icon: '🌍',
      description: 'Active international trade or cross-border expansion capability',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
    });
  }

  // Badge 4: Active Mentor & Advisor
  if (
    textBlob.includes('mentor') ||
    textBlob.includes('advisor') ||
    textBlob.includes('consultant') ||
    textBlob.includes('استشار') ||
    textBlob.includes('إرشاد') ||
    textBlob.includes('coach')
  ) {
    specialBadges.push({
      id: 'mentor',
      title: 'Ecosystem Advisor',
      icon: '🧭',
      description: 'Provides advisory, consulting, and mentorship to fellow founders',
      color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    });
  }

  // Actionable Boost Tips
  const missingItems = checklist.filter((item) => !item.done);
  let boostAdvice = 'Profile is fully optimized at 100% Ecosystem Pioneer level!';
  if (missingItems.length > 0) {
    boostAdvice = `To reach ${tier.nextTier}, ${missingItems[0].tip} (+${missingItems[0].points}%).`;
  }

  return {
    score,
    tier,
    checklist,
    specialBadges,
    boostAdvice,
    isComplete: score >= 100,
  };
}

/**
 * 2. AI Collaboration MatchMaker Synergy Explainer
 */
export function explainMemberSynergy(targetMember, candidateMember) {
  if (!targetMember || !candidateMember || targetMember.id === candidateMember.id) {
    return {
      score: 0,
      dimensions: [],
      rationale: 'No complementarity identified between these profiles.',
      boostAdvice: 'Add more detailed collaboration asks to discover synergy.',
    };
  }

  let totalScore = 0;
  const dimensions = [];

  const targetNeeds = (targetMember.lookingFor || '').toLowerCase();
  const candOffers = (candidateMember.canHelp || '').toLowerCase();
  const targetOffers = (targetMember.canHelp || '').toLowerCase();
  const candNeeds = (candidateMember.lookingFor || '').toLowerCase();

  // 1. Reciprocal Need ⇄ Offer Match (up to 55 pts)
  const needOfferMatch1 =
    targetNeeds.length > 3 &&
    candOffers.length > 3 &&
    candOffers.split(/[\s,.\-؛،]+/).some((w) => w.length > 3 && targetNeeds.includes(w));

  const needOfferMatch2 =
    targetOffers.length > 3 &&
    candNeeds.length > 3 &&
    targetOffers.split(/[\s,.\-؛،]+/).some((w) => w.length > 3 && candNeeds.includes(w));

  let needOfferPts = 0;
  let needOfferDesc = 'No direct keyword overlap in asks and offerings';
  if (needOfferMatch1 && needOfferMatch2) {
    needOfferPts = 55;
    needOfferDesc = 'Bilateral 2-way match: Target asks match Candidate offers, and vice-versa';
  } else if (needOfferMatch1) {
    needOfferPts = 35;
    needOfferDesc = 'Direct match: Candidate offers match Target asks';
  } else if (needOfferMatch2) {
    needOfferPts = 35;
    needOfferDesc = 'Direct match: Target offers match Candidate asks';
  }

  totalScore += needOfferPts;
  dimensions.push({
    id: 'need_offer',
    label: 'Reciprocal Need ⇄ Offer Alignment',
    icon: '⚡',
    score: needOfferPts,
    maxScore: 55,
    description: needOfferDesc,
  });

  // 2. Capability Vertical Cross-matching (up to 25 pts)
  const targetNeedCats = categorizeText(targetMember.lookingFor);
  const candOfferCats = categorizeText(candidateMember.canHelp);
  const targetOfferCats = categorizeText(targetMember.canHelp);
  const candNeedCats = categorizeText(candidateMember.lookingFor);

  const crossMatch1 = targetNeedCats.filter((c) => candOfferCats.includes(c));
  const crossMatch2 = targetOfferCats.filter((c) => candNeedCats.includes(c));

  let verticalPts = 0;
  let verticalDesc = 'Independent industry domains';
  if (crossMatch1.length > 0 || crossMatch2.length > 0) {
    verticalPts = 25;
    const matchedLabels = [...crossMatch1, ...crossMatch2]
      .map((id) => CAPABILITY_VERTICALS.find((v) => v.id === id)?.label || id)
      .filter((v, i, a) => a.indexOf(v) === i);
    verticalDesc = `Synergistic capabilities in: ${matchedLabels.join(', ')}`;
  }

  totalScore += verticalPts;
  dimensions.push({
    id: 'verticals',
    label: 'Capability Vertical Cross-Match',
    icon: '💼',
    score: verticalPts,
    maxScore: 25,
    description: verticalDesc,
  });

  // 3. Shared Industry & Synergy Tags (up to 25 pts)
  const tTags = targetMember.tags || [];
  const cTags = candidateMember.tags || [];
  const sharedTags = tTags.filter((t) => cTags.some((ct) => ct.toLowerCase() === t.toLowerCase()));

  let tagPts = 0;
  let tagDesc = 'No shared industry tags';
  if (sharedTags.length >= 2) {
    tagPts = 25;
    tagDesc = `Strong shared domain focus: ${sharedTags.join(', ')}`;
  } else if (sharedTags.length === 1) {
    tagPts = 15;
    tagDesc = `Shared industry tag: ${sharedTags[0]}`;
  }

  totalScore += tagPts;
  dimensions.push({
    id: 'tags',
    label: 'Shared Industry & Market Focus',
    icon: '🏷️',
    score: tagPts,
    maxScore: 25,
    description: tagDesc,
  });

  // 4. Geographic Complementarity (up to 10 pts)
  const tLoc = targetMember.location || {};
  const cLoc = candidateMember.location || {};
  let geoPts = 0;
  let geoDesc = 'Global / remote ecosystem connection';
  if (tLoc.city && cLoc.city && tLoc.city.toLowerCase() === cLoc.city.toLowerCase()) {
    geoPts = 10;
    geoDesc = `Local co-location in ${tLoc.city} facilitates fast offline meetings`;
  } else if (
    tLoc.country &&
    cLoc.country &&
    tLoc.country.toLowerCase() === cLoc.country.toLowerCase()
  ) {
    geoPts = 5;
    geoDesc = `Same national ecosystem in ${tLoc.country}`;
  }

  totalScore += geoPts;
  dimensions.push({
    id: 'geo',
    label: 'Geographic Proximity',
    icon: '📍',
    score: geoPts,
    maxScore: 10,
    description: geoDesc,
  });

  // 5. Stage Compatibility (up to 5 pts)
  let stagePts = 0;
  let stageDesc = 'Venture stage alignment';
  if (
    (targetMember.stage === 'idea' || targetMember.stage === 'starting') &&
    (candidateMember.stage === 'running' || candidateMember.stage === 'growing')
  ) {
    stagePts = 5;
    stageDesc = 'Early-stage founder paired with an established operator';
  } else if (targetMember.stage === candidateMember.stage) {
    stagePts = 5;
    stageDesc = `Peer stage collaboration (${targetMember.stage})`;
  }

  totalScore += stagePts;
  dimensions.push({
    id: 'stage',
    label: 'Venture Stage Complementarity',
    icon: '🚀',
    score: stagePts,
    maxScore: 5,
    description: stageDesc,
  });

  totalScore = Math.min(100, Math.max(0, totalScore));

  // Rationale Formulation
  let rationale = `${candidateMember.name} and ${targetMember.name} share complementary strengths in ${candidateMember.business || candidateMember.role}.`;
  if (needOfferMatch1 && needOfferMatch2) {
    rationale = `High two-way synergy: ${candidateMember.name} offers exact capabilities sought by ${targetMember.name}, with mutual collaboration opportunities.`;
  } else if (needOfferMatch1) {
    rationale = `${candidateMember.name}'s capabilities directly match what ${targetMember.name} is looking for.`;
  } else if (sharedTags.length > 0) {
    rationale = `Strong shared domain alignment in ${sharedTags.join(' & ')}.`;
  }

  // Boost Advice
  let boostAdvice = 'High affinity match ready for warm introduction!';
  if (totalScore < 70) {
    boostAdvice = 'Tip: Adding specific target markets or exact collaboration needs will sharpen reciprocity scoring.';
  }

  return {
    score: totalScore,
    dimensions,
    rationale,
    boostAdvice,
  };
}

/**
 * 3. Surprise Synergy Serendipity Explainer
 */
export function explainSurpriseSynergy(founder) {
  if (!founder) return 'Serendipitous pairing from active verified community cohort.';

  const reasons = [];
  if (founder.canHelp) reasons.push(`Offers: "${founder.canHelp.slice(0, 70)}..."`);
  if (founder.lookingFor) reasons.push(`Seeking: "${founder.lookingFor.slice(0, 70)}..."`);
  if (Array.isArray(founder.tags) && founder.tags.length > 0) {
    reasons.push(`Key Verticals: ${founder.tags.slice(0, 3).join(', ')}`);
  }

  return reasons.join(' · ') || 'Surfaced to encourage serendipitous cross-domain collaboration.';
}
