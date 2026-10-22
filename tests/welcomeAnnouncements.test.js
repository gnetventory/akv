import { describe, it, expect } from 'vitest';
import {
  isRecentlyJoined,
  getRecentMembers,
  getEffectiveTimestamp,
  isMemberProfileUpdate,
  cleanPhoneNumber,
  getWhatsAppGroupShareUrl,
  getWhatsAppDirectChatUrl,
  getMemberWelcomeIcebreakerUrl,
  generateWelcomeAnnouncement,
  generateDirectWelcome,
} from '../src/utils/welcomeAnnouncements';

describe('welcomeAnnouncements utility tests', () => {
  const mockMember = {
    id: 'mem-101',
    name: 'Mohamed Moselhy (محمد مصيلحي)',
    role: 'Managing Partner',
    business: 'Phoenix Growth Partners',
    stage: 'scaling',
    location: { city: 'Cairo', country: 'Egypt' },
    lookingFor: 'Strategic partnerships and commercial clients',
    canHelp: 'Business development, scaling strategy, investment readiness',
    phone: '+20 100 123 4567',
    linkedin: 'https://linkedin.com/in/moselhy',
    website: 'https://phoenixgrowth.agency',
    tags: ['Consulting', 'Growth', 'Business Development'],
    createdAt: new Date().toISOString(),
  };

  describe('getEffectiveTimestamp', () => {
    it('returns timestamp from formTimestamp, createdAt, or updatedAt', () => {
      const ts = '2026-10-12T10:00:00.000Z';
      expect(getEffectiveTimestamp({ formTimestamp: ts })).toBe(new Date(ts).getTime());
      expect(getEffectiveTimestamp({ createdAt: ts })).toBe(new Date(ts).getTime());
      expect(getEffectiveTimestamp({ updatedAt: ts })).toBe(new Date(ts).getTime());
      expect(getEffectiveTimestamp(null)).toBe(0);
      expect(getEffectiveTimestamp({})).toBe(0);
    });
  });

  describe('isRecentlyJoined', () => {
    it('returns true for member created today', () => {
      expect(isRecentlyJoined({ createdAt: new Date().toISOString() })).toBe(true);
      expect(isRecentlyJoined({ formTimestamp: new Date().toISOString() })).toBe(true);
    });

    it('returns false for member created 30 days ago', () => {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(isRecentlyJoined({ createdAt: past }, 14)).toBe(false);
    });

    it('returns false for member without timestamps', () => {
      expect(isRecentlyJoined({})).toBe(false);
      expect(isRecentlyJoined(null)).toBe(false);
    });
  });

  describe('isMemberProfileUpdate', () => {
    it('detects profile update by explicit flags or status', () => {
      expect(isMemberProfileUpdate({ isProfileUpdate: true })).toBe(true);
      expect(isMemberProfileUpdate({ appStatus: 'APPROVED_UPDATE' })).toBe(true);
      expect(isMemberProfileUpdate({ submissionType: 'update' })).toBe(true);
    });

    it('does not falsely flag members with updatedAt diffs unless explicitly flagged', () => {
      const created = '2026-10-01T10:00:00.000Z';
      const updated = '2026-10-12T12:00:00.000Z';
      expect(isMemberProfileUpdate({ createdAt: created, updatedAt: updated })).toBe(false);
    });

    it('returns false for fresh member creation', () => {
      const now = new Date().toISOString();
      expect(isMemberProfileUpdate({ createdAt: now, updatedAt: now })).toBe(false);
      expect(isMemberProfileUpdate({ createdAt: now })).toBe(false);
    });
  });

  describe('cleanPhoneNumber', () => {
    it('cleans Egyptian local phone starting with 01', () => {
      expect(cleanPhoneNumber('01001234567')).toBe('201001234567');
    });

    it('cleans international phone with spaces and dashes', () => {
      expect(cleanPhoneNumber('+20 100-123-4567')).toBe('201001234567');
    });

    it('handles empty input gracefully', () => {
      expect(cleanPhoneNumber('')).toBe('');
      expect(cleanPhoneNumber(null)).toBe('');
    });
  });

  describe('WhatsApp URL builders', () => {
    it('generates valid WhatsApp group share link', () => {
      const url = getWhatsAppGroupShareUrl('Hello World!');
      expect(url).toBe('https://api.whatsapp.com/send?text=Hello%20World!');
    });

    it('generates valid WhatsApp direct chat link with phone', () => {
      const url = getWhatsAppDirectChatUrl('+20 100 123 4567', 'Welcome!');
      expect(url).toContain('https://api.whatsapp.com/send?phone=201001234567');
      expect(url).toContain('text=Welcome!');
    });

    it('generates personalized 1-click peer welcome icebreaker for fresh joiners', () => {
      const url = getMemberWelcomeIcebreakerUrl(mockMember);
      expect(url).toContain('https://api.whatsapp.com/send?phone=201001234567');
      expect(url).toContain(encodeURIComponent('محمد'));
      expect(url).toContain(encodeURIComponent('Phoenix Growth Partners'));
      expect(decodeURIComponent(url)).toContain('أرحب بيك');
    });

    it('generates personalized 1-click peer congratulations icebreaker for profile updates', () => {
      const updatedMember = { ...mockMember, isProfileUpdate: true };
      const url = getMemberWelcomeIcebreakerUrl(updatedMember);
      expect(decodeURIComponent(url)).toContain('تحديث بروفايلك');
      expect(decodeURIComponent(url)).toContain('أباركلك');
    });
  });

  describe('generateWelcomeAnnouncement', () => {
    it('generates Egyptian Arabic founder announcement by default for fresh joiners', () => {
      const text = generateWelcomeAnnouncement(mockMember, { tone: 'egyptian' });
      expect(text).toContain('رحّبوا معانا بإنضمام عضو جديد لمجتمع BGM');
      expect(text).toContain('Phoenix Growth Partners');
      expect(text).toContain('Managing Partner');
      expect(text).toContain('Cairo');
      expect(text).toContain('محتاج / بيدوّر على');
      expect(text).toContain('يقدر يفيد المجتمع في');
      expect(text).toContain('?member=mem-101');
    });

    it('generates Egyptian Profile Update announcement when mode is update', () => {
      const text = generateWelcomeAnnouncement(mockMember, { tone: 'egyptian', mode: 'update' });
      expect(text).toContain('تحديث بروفايل في مجتمع رواد الأعمال BGM');
      expect(text).toContain('آخر تطورات الزميل/ة');
      expect(text).toContain('كارت العضوية المحدّث في الدايركتوري');
    });

    it('generates English announcement when tone is english', () => {
      const text = generateWelcomeAnnouncement(mockMember, { tone: 'english' });
      expect(text).toContain('WELCOME NEW BGM COMMUNITY MEMBER');
      expect(text).toContain('Phoenix Growth Partners');
      expect(text).toContain('Role:');
      expect(text).toContain('Currently Looking For:');
      expect(text).toContain('Smart Directory Card:');
    });

    it('generates English Profile Update announcement when mode is update', () => {
      const text = generateWelcomeAnnouncement(mockMember, { tone: 'english', mode: 'update' });
      expect(text).toContain('BGM MEMBER PROFILE UPDATE / SPOTLIGHT');
      expect(text).toContain('Updated Smart Directory Card:');
    });

    it('generates Formal Arabic announcement when tone is arabic', () => {
      const text = generateWelcomeAnnouncement(mockMember, { tone: 'arabic' });
      expect(text).toContain('إعلان انضمام عضو جديد إلى مجتمع رواد الأعمال BGM');
      expect(text).toContain('يبحث حالياً عن:');
      expect(text).toContain('يمكنه تقديم المساعدة في:');
    });

    it('generates Formal Arabic Profile Update announcement when mode is update', () => {
      const text = generateWelcomeAnnouncement(mockMember, { tone: 'arabic', mode: 'update' });
      expect(text).toContain('تحديث بيانات عضو في مجتمع رواد الأعمال BGM');
      expect(text).toContain('رابط بطاقة العضوية المحدثة:');
    });

    it('incorporates custom AI hook when provided', () => {
      const customHook = 'Specialist in scaling enterprise revenue models across MENA.';
      const text = generateWelcomeAnnouncement(mockMember, {
        tone: 'english',
        customHook,
      });
      expect(text).toContain(customHook);
    });
  });

  describe('generateDirectWelcome', () => {
    it('generates Egyptian direct welcome message to the founder', () => {
      const msg = generateDirectWelcome(mockMember, { tone: 'egyptian' });
      expect(msg).toContain('منور مجتمع رواد الأعمال BGM');
      expect(msg).toContain('?member=mem-101');
    });

    it('generates Egyptian direct message for profile updates', () => {
      const msg = generateDirectWelcome(mockMember, { tone: 'egyptian', mode: 'update' });
      expect(msg).toContain('تم اعتماد ونشر التحديثات الجديدة لكارت عضويتك');
      expect(msg).toContain('?member=mem-101');
    });

    it('generates English direct welcome message to the founder', () => {
      const msg = generateDirectWelcome(mockMember, { tone: 'english' });
      expect(msg).toContain('Welcome to the BGM Entrepreneurs Community');
      expect(msg).toContain('?member=mem-101');
    });

    it('generates English direct message for profile updates', () => {
      const msg = generateDirectWelcome(mockMember, { tone: 'english', mode: 'update' });
      expect(msg).toContain('Your profile updates have been reviewed and published');
      expect(msg).toContain('?member=mem-101');
    });
  });

  describe('getRecentMembers', () => {
    it('strictly sorts members descending by effective timestamp', () => {
      const now = Date.now();
      const list = [
        { id: 'old', name: 'Old', status: 'active', formTimestamp: new Date(now - 864e5 * 10).toISOString() },
        { id: 'newest', name: 'Newest', status: 'active', formTimestamp: new Date(now - 864e5 * 1).toISOString() },
        { id: 'middle', name: 'Middle', status: 'active', createdAt: new Date(now - 864e5 * 4).toISOString() },
      ];
      const recent = getRecentMembers(list, 14, 3);
      expect(recent.map((m) => m.id)).toEqual(['newest', 'middle', 'old']);
    });

    it('filters out pending and rejected members', () => {
      const list = [
        { id: '1', name: 'A', status: 'active', createdAt: new Date().toISOString() },
        { id: '2', name: 'B', status: 'active', createdAt: new Date().toISOString() },
        { id: '3', name: 'C', status: 'pending', createdAt: new Date().toISOString() },
        { id: '4', name: 'D', status: 'rejected', createdAt: new Date().toISOString() },
      ];
      const recent = getRecentMembers(list, 14, 5);
      expect(recent.length).toBe(2);
      expect(recent.map((m) => m.id)).toEqual(['1', '2']);
    });
  });
});
