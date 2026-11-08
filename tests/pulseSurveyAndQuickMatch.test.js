import { describe, it, expect, beforeEach } from 'vitest';
import { SURVEY_QUESTIONS } from '../src/utils/surveyQuestions';
import {
  getSurveyResponses,
  saveSurveyResponse,
  getQuickMatchBookmarks,
  saveQuickMatchBookmark,
  getCollabRequests,
  saveCollabRequest,
} from '../src/utils/storage';

describe('AKV CR-001 Survey & Quick Match unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('SURVEY_QUESTIONS contains valid bilingual question definitions', () => {
    expect(Array.isArray(SURVEY_QUESTIONS)).toBe(true);
    expect(SURVEY_QUESTIONS.length).toBeGreaterThan(0);

    for (const q of SURVEY_QUESTIONS) {
      expect(q.id).toBeDefined();
      expect(q.category).toBeDefined();
      expect(q.questionEn).toBeTruthy();
      expect(q.questionAr).toBeTruthy();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);

      for (const opt of q.options) {
        expect(opt.id).toBeDefined();
        expect(opt.textEn).toBeTruthy();
        expect(opt.textAr).toBeTruthy();
      }
    }
  });

  it('saveSurveyResponse records response with timestamp and generates id', () => {
    expect(getSurveyResponses()).toEqual([]);

    const sample = {
      email: 'founder@example.com',
      memberName: 'Sherif',
      category: 'Value',
      questionId: 'value_perception',
      questionText: 'How helpful is AKV?',
      answerId: 'daily_useful',
      answerText: 'Very helpful',
      language: 'en',
    };

    const updated = saveSurveyResponse(sample);
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBeDefined();
    expect(updated[0].createdAt).toBeDefined();
    expect(updated[0].email).toBe('founder@example.com');

    const fetched = getSurveyResponses();
    expect(fetched.length).toBe(1);
    expect(fetched[0].answerId).toBe('daily_useful');
  });

  it('saveQuickMatchBookmark stores unique member IDs', () => {
    expect(getQuickMatchBookmarks()).toEqual([]);

    saveQuickMatchBookmark('member-101');
    saveQuickMatchBookmark('member-202');
    saveQuickMatchBookmark('member-101'); // duplicate should be ignored

    const bookmarks = getQuickMatchBookmarks();
    expect(bookmarks.length).toBe(2);
    expect(bookmarks).toContain('member-101');
    expect(bookmarks).toContain('member-202');
  });

  it('saveCollabRequest stores requests with generated ID and timestamp', () => {
    expect(getCollabRequests()).toEqual([]);

    const request = {
      senderEmail: 'initiator@example.com',
      targetMemberId: 'member-303',
      targetMemberName: 'Nour',
      note: 'Looking forward to partnering on distribution',
      type: 'partnership',
    };

    const updated = saveCollabRequest(request);
    expect(updated.length).toBe(1);
    expect(updated[0].id).toBeDefined();
    expect(typeof updated[0].id).toBe('string');
    expect(updated[0].createdAt).toBeDefined();
    expect(updated[0].targetMemberName).toBe('Nour');

    const fetched = getCollabRequests();
    expect(fetched.length).toBe(1);
    expect(fetched[0].senderEmail).toBe('initiator@example.com');
  });
});
