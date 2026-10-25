import { describe, it, expect, beforeEach } from 'vitest';
import { calculateManagerInsights } from '../src/utils/managerAnalytics';
import { SURVEY_QUESTIONS } from '../src/utils/surveyQuestions';
import { saveSurveyResponse, getSurveyResponses, saveCollabRequest, getCollabRequests } from '../src/utils/storage';

describe('AKV Manager Business Insights & Analytics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly calculates supply, demand and liquidity ratios', () => {
    const mockMembers = [
      {
        id: '1',
        name: 'Ahmed Founder',
        lookingFor: 'Need senior tech developer for mobile app',
        canHelp: 'Can provide growth marketing and B2B sales leads',
        location: { city: 'New Cairo', country: 'Egypt' },
      },
      {
        id: '2',
        name: 'Sara Partner',
        lookingFor: 'Looking for accounting and legal tax advice',
        canHelp: 'Full stack web and mobile developer with React & Node',
        location: { city: 'Sheikh Zayed', country: 'Egypt' },
      },
      {
        id: '3',
        name: 'Omar Mentor',
        lookingFor: '',
        canHelp: 'Mentoring and advisory on fundraising and investors',
        location: { city: 'Maadi', country: 'Egypt' },
      },
    ];

    const insights = calculateManagerInsights(mockMembers);

    expect(insights.totalMembers).toBe(3);
    expect(insights.totalAsks).toBe(2);
    expect(insights.totalOffers).toBe(3);
    expect(parseFloat(insights.liquidityRatio)).toBeGreaterThan(1);
    expect(insights.serviceGaps).toBeDefined();
    expect(Array.isArray(insights.locationBreakdown)).toBe(true);
  });

  it('correctly categorizes location clusters', () => {
    const mockMembers = [
      { id: '1', location: { city: 'New Cairo' }, originalText: 'Based in Tagamo3' },
      { id: '2', location: { city: 'October' }, originalText: 'Office in Sheikh Zayed' },
      { id: '3', location: { city: 'Riyadh' }, originalText: 'Expanding to KSA / Gulf' },
    ];

    const insights = calculateManagerInsights(mockMembers);
    const tagamo3 = insights.locationBreakdown.find((l) => l.name.includes('Tagamo3'));
    const zayed = insights.locationBreakdown.find((l) => l.name.includes('Zayed'));

    expect(tagamo3.count).toBe(1);
    expect(zayed.count).toBe(1);
  });

  it('validates survey questions structure and bilingual fields', () => {
    expect(SURVEY_QUESTIONS.length).toBeGreaterThan(3);
    SURVEY_QUESTIONS.forEach((q) => {
      expect(q.id).toBeDefined();
      expect(q.questionEn).toBeTruthy();
      expect(q.questionAr).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      q.options.forEach((opt) => {
        expect(opt.textEn).toBeTruthy();
        expect(opt.textAr).toBeTruthy();
      });
    });
  });

  it('persists and retrieves survey responses and collab requests', () => {
    saveSurveyResponse({
      email: 'founder@test.com',
      questionId: 'value_perception',
      answerId: 'daily_useful',
      answerText: 'Very helpful',
    });

    const responses = getSurveyResponses();
    expect(responses.length).toBe(1);
    expect(responses[0].email).toBe('founder@test.com');

    saveCollabRequest({
      targetMemberId: 'target-1',
      senderEmail: 'partner@test.com',
      note: 'Would love to discuss joint project',
    });

    const collabs = getCollabRequests();
    expect(collabs.length).toBe(1);
    expect(collabs[0].senderEmail).toBe('partner@test.com');
  });
});
