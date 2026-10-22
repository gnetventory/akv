import { describe, it, expect } from 'vitest';
import { isIntroMessage, parseLocalRuleBased } from '../src/utils/gemini';

describe('gemini.js local rule-based parser tests', () => {
  it('isIntroMessage correctly identifies introduction posts', () => {
    const introText = `Name: Maria Silva
What do you do?: Digital Marketer
Business: GreenBrand Studio
Looking for: Sustainability partners
Can help with: Brand strategy`;

    const chatBanter = 'Hey guys, are we meeting next week for coffee?';

    expect(isIntroMessage(introText)).toBe(true);
    expect(isIntroMessage(chatBanter)).toBe(false);
  });

  it('parseLocalRuleBased extracts structured fields from text', () => {
    const rawIntro = `Name: Ahmed Hassan
Role: Mobile App Developer
Business: HalalGo - Food delivery platform
Looking for: Series A investors
Can help: Mobile app dev React Native
Location: Cairo, Egypt`;

    const parsed = parseLocalRuleBased(rawIntro);
    expect(parsed).not.toBeNull();
    expect(parsed.name).toBe('Ahmed Hassan');
    expect(parsed.role).toBe('Mobile App Developer');
    expect(parsed.business).toBe('HalalGo - Food delivery platform');
    expect(parsed.lookingFor).toBe('Series A investors');
    expect(parsed.canHelp).toBe('Mobile app dev React Native');
  });

  it('parseLocalRuleBased parses un-labeled multi-line intro (Mohamed El Sheikh test case)', () => {
    const exampleMessage = `Mohamed El Sheikh
Founder of Egypto 

Business/Project: Egypto (Egypt Trading Ltd, egypto.shop), Manchester-based. Currently import Egyptian products, food, modest fashion, papyrus and heritage art, rugs and gifts. Building toward a wider marketplace model where other Egyptian sellers can operate through Egypto too.

Where are you currently: Already running and trading, with the hub model in early planning.

What am I looking for right now: To be connected and connecting within the Egyptian businesses community for win-win situations, and connecting them to wholesale/retail partners in the UK.

What can I help others with: Sourcing from Egypt, import/export logistics, e-commerce setup, and just connecting people`;

    const parsed = parseLocalRuleBased(exampleMessage);

    expect(parsed).not.toBeNull();
    expect(parsed.name).toBe('Mohamed El Sheikh');
    expect(parsed.role).toBe('Founder of Egypto');
    expect(parsed.business).toContain('Egypto (Egypt Trading Ltd, egypto.shop)');
    expect(parsed.stage).toBe('running');
    expect(parsed.lookingFor).toBe('To be connected and connecting within the Egyptian businesses community for win-win situations, and connecting them to wholesale/retail partners in the UK.');
    expect(parsed.canHelp).toBe('Sourcing from Egypt, import/export logistics, e-commerce setup, and just connecting people');
    expect(parsed.location.city).toBe('Manchester');
    expect(parsed.location.country).toBe('United Kingdom');
  });

  it('parseLocalRuleBased parses narrative conversational intro (Mahmoud El Nasharty test case)', () => {
    const nashartyMessage = `Hi everyone! 👋

My name is Mahmoud El Nasharty. I'm a Research Associate in the Faculty of Science, Department of Chemistry, Ain Shams University.

My core project focused on developing ultra-sensitive nano-optical biosensors for the early diagnosis and prognosis of tumors, and we recently co-registered a patent based on a fluorescence technique. My work is already running and well established in academia; I am currently in the early stages of learning how to translate science into a business model.

Actually, I’d like to learn from all of you, develop my entrepreneurial ideas, and connect with new people. I would be genuinely happy to meet up and exchange insights with anyone here.

I’d be glad to help out with scientific research, data optimization, visual design, and simplifying complex scientific concepts.

Looking forward to connecting with you all!
https://www.linkedin.com/in/mahmoud-el-nasharty-95819222a/recent-activity/reactions/`;

    const parsed = parseLocalRuleBased(nashartyMessage);

    expect(parsed).not.toBeNull();
    expect(parsed.name).toBe('Mahmoud El Nasharty');
    expect(parsed.role).toContain('Research Associate');
    expect(parsed.business).toContain('developing ultra-sensitive nano-optical biosensors');
    expect(parsed.stage).toBe('idea');
    expect(parsed.lookingFor).toContain('learn from all of you');
    expect(parsed.canHelp).toContain('scientific research, data optimization, visual design');
    expect(parsed.location.city).toBe('Cairo');
    expect(parsed.location.country).toBe('Egypt');
  });

  it('parseLocalRuleBased returns null for casual chat messages', () => {
    const casualText = 'Hey everyone, check out this news link!';
    expect(parseLocalRuleBased(casualText)).toBeNull();
  });
});
