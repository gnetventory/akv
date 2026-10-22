import { describe, it, expect } from 'vitest';
import {
  getInitials,
  parseMemberName,
  getAvatarGradient,
  normalizePhone,
  buildWhatsAppUrl,
  memberMatchesSearch,
  generateId,
  isStale,
} from '../src/utils/helpers';

describe('helpers.js unit tests', () => {
  it('parseMemberName splits English and Arabic names correctly', () => {
    expect(parseMemberName('(WALAA SALMAN) ولاء سالمان')).toEqual({
      english: 'WALAA SALMAN',
      arabic: 'ولاء سالمان',
      primary: 'WALAA SALMAN',
    });
    expect(parseMemberName('AHMAD KHALIL (أحمد خليل)')).toEqual({
      english: 'AHMAD KHALIL',
      arabic: 'أحمد خليل',
      primary: 'AHMAD KHALIL',
    });
    expect(parseMemberName('محمد ناجح (MOHAMED NAGEH)')).toEqual({
      english: 'MOHAMED NAGEH',
      arabic: 'محمد ناجح',
      primary: 'MOHAMED NAGEH',
    });
    expect(parseMemberName('John Doe')).toEqual({
      english: 'John Doe',
      arabic: '',
      primary: 'John Doe',
    });
    expect(parseMemberName('أحمد علي')).toEqual({
      english: '',
      arabic: 'أحمد علي',
      primary: 'أحمد علي',
    });
  });

  it('getInitials extracts initials correctly', () => {
    expect(getInitials('Maria Silva')).toBe('MS');
    expect(getInitials('(WALAA SALMAN) ولاء سالمان')).toBe('WS');
    expect(getInitials('Ahmed')).toBe('AH');
    expect(getInitials('')).toBe('SE');
  });

  it('getAvatarGradient returns valid gradient class', () => {
    const gradient = getAvatarGradient('Maria');
    expect(gradient).toContain('from-');
    expect(gradient).toContain('to-');
  });

  it('normalizePhone strips non-digit characters', () => {
    expect(normalizePhone('+1 (555) 234-5678')).toBe('15552345678');
    expect(normalizePhone('')).toBe('');
  });

  it('buildWhatsAppUrl creates correct URL', () => {
    expect(buildWhatsAppUrl('+1 555 234 5678')).toBe('https://wa.me/15552345678');
    expect(buildWhatsAppUrl('')).toBeNull();
  });

  it('memberMatchesSearch filters member correctly', () => {
    const member = {
      name: 'Maria Silva',
      role: 'Digital Marketer',
      business: 'GreenBrand Studio',
      canHelp: 'Brand strategy',
      lookingFor: 'Partnerships',
      tags: ['Marketing', 'Sustainability'],
      location: { country: 'Brazil', city: 'São Paulo' },
    };

    expect(memberMatchesSearch(member, 'maria')).toBe(true);
    expect(memberMatchesSearch(member, 'sustainability')).toBe(true);
    expect(memberMatchesSearch(member, 'brazil')).toBe(true);
    expect(memberMatchesSearch(member, 'nonexistent')).toBe(false);
  });

  it('generateId returns non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('isStale correctly identifies outdated timestamps', () => {
    const freshDate = new Date().toISOString();
    const staleDate = new Date(Date.now() - 100 * 864e5).toISOString(); // 100 days ago

    expect(isStale(freshDate, 90)).toBe(false);
    expect(isStale(staleDate, 90)).toBe(true);
  });
});
