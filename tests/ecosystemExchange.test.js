import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNiaPhone,
  saveNiaPhone,
  getExchangePosts,
  saveExchangePosts,
} from '../src/utils/storage';

describe('Founder Micro-Ecosystem & Growth Clinic storage tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getNiaPhone returns default configured phone when none is set', () => {
    const phone = getNiaPhone();
    expect(phone).toBe('201000998449');
  });

  it('saveNiaPhone stores and retrieves sanitized phone digits', () => {
    saveNiaPhone('+20 10 1234 5678');
    expect(getNiaPhone()).toBe('201012345678');
  });

  it('getExchangePosts returns empty array when empty', () => {
    expect(getExchangePosts()).toEqual([]);
  });

  it('saveExchangePosts saves and persists business block posts', () => {
    const mockPosts = [
      {
        id: 'block-1',
        authorName: 'Founder A',
        title: 'Scaling B2B in Egypt',
        responses: [],
      },
    ];
    saveExchangePosts(mockPosts);
    const retrieved = getExchangePosts();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].title).toBe('Scaling B2B in Egypt');
  });
});
