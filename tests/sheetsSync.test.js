import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  normalizeSheetRow,
  getGoogleAppsScriptCode,
  syncFromGoogleSheets,
  pushMemberDeleteToSheets,
  pushMemberUpdateToSheets,
} from '../src/utils/sheetsSync';
import {
  getMembers,
  saveMembers,
  addMember,
  updateMember,
  clearAllData,
  getTombstones,
  addTombstone,
  clearTombstones,
  saveSheetsConfig,
} from '../src/utils/storage';

describe('sheetsSync.js unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllData();
    clearTombstones();
    saveSheetsConfig({ apiUrl: 'https://script.google.com/test-endpoint' });
  });

  it('normalizeSheetRow converts raw Google Form headers to clean member object', () => {
    const rawFormRow = {
      sheetRowIndex: 2,
      name: 'Tamer Hosny',
      role: 'Founder & CTO',
      business: 'SolarTech Egypt',
      stage: 'Running and scaling',
      lookingFor: 'Seed funding $200k',
      canHelp: 'Clean energy hardware design',
      country: 'Egypt',
      city: 'Alexandria',
      phone: '+201099887766',
      linkedin: 'tamer-solartech',
      tags: 'CleanTech, Hardware, Solar',
      formTimestamp: '2026-09-28T12:00:00Z',
    };

    const normalized = normalizeSheetRow(rawFormRow);
    expect(normalized).not.toBeNull();
    expect(normalized.name).toBe('Tamer Hosny');
    expect(normalized.role).toBe('Founder & CTO');
    expect(normalized.business).toBe('SolarTech Egypt');
    expect(normalized.stage).toBe('running');
    expect(normalized.location.city).toBe('Alexandria');
    expect(normalized.location.country).toBe('Egypt');
    expect(normalized.tags).toEqual(['CleanTech', 'Hardware', 'Solar']);
    expect(normalized.isFromGoogleForm).toBe(true);
  });

  it('getGoogleAppsScriptCode returns complete script with doGet and doPost and audit headers', () => {
    const code = getGoogleAppsScriptCode();
    expect(code).toContain('function doGet(e)');
    expect(code).toContain('function doPost(e)');
    expect(code).toContain('App_Status');
    expect(code).toContain('Last_App_Sync_At');
    expect(code).toContain('App_Notes');
    expect(code).toContain('DELETED');
    expect(code).toContain('EDITED_IN_APP');
  });

  it('syncFromGoogleSheets skips tombstoned / deleted records', async () => {
    // Mock fetch
    const mockRows = [
      {
        sheetRowIndex: 2,
        name: 'Active Founder',
        role: 'CEO',
        stage: 'running',
        business: 'Active Co',
      },
      {
        sheetRowIndex: 3,
        name: 'Deleted Founder',
        role: 'Dev',
        stage: 'idea',
        business: 'Deleted Co',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows: mockRows }),
    });

    // Add tombstone for Deleted Founder
    addTombstone('deleted founder');

    const result = await syncFromGoogleSheets();
    expect(result.success).toBe(true);
    expect(result.addedCount).toBe(1);
    expect(result.ignoredTombstoneCount).toBe(1);

    const members = getMembers();
    expect(members.length).toBe(1);
    expect(members[0].name).toBe('Active Founder');
    expect(members.find((m) => m.name === 'Deleted Founder')).toBeUndefined();
  });

  it('syncFromGoogleSheets preserves locally edited fields', async () => {
    // Initially add member and edit in app
    const initial = addMember({
      name: 'Sarah Connor',
      role: 'Security Engineer',
      business: 'CyberShield',
      stage: 'idea',
    });

    updateMember(initial.id, {
      role: 'Chief Information Security Officer',
      business: 'CyberShield Global – Series A funded enterprise cybersecurity',
      stage: 'growing',
    });

    // Mock incoming Google Sheet row with old data
    const mockRows = [
      {
        sheetRowIndex: 4,
        name: 'Sarah Connor',
        role: 'Old Security Engineer Title',
        business: 'Old CyberShield Pitch',
        stage: 'idea',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows: mockRows }),
    });

    await syncFromGoogleSheets();

    const current = getMembers().find((m) => m.name === 'Sarah Connor');
    expect(current.role).toBe('Chief Information Security Officer');
    expect(current.stage).toBe('growing');
    expect(current.business).toContain('CyberShield Global');
  });

  it('pushMemberDeleteToSheets sends delete action with audit note', async () => {
    let capturedPayload = null;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedPayload = JSON.parse(options.body);
      return Promise.resolve({ ok: true });
    });

    const member = { id: 'm-1', name: 'Test Target', sheetRowIndex: 5 };
    await pushMemberDeleteToSheets(member, 'Removed by Admin');

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.action).toBe('delete');
    expect(capturedPayload.member.name).toBe('Test Target');
    expect(capturedPayload.audit.reason).toBe('Removed by Admin');
    expect(getTombstones()).toContain('test target');
  });

  it('pushMemberUpdateToSheets sends update action with changed fields note', async () => {
    let capturedPayload = null;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      capturedPayload = JSON.parse(options.body);
      return Promise.resolve({ ok: true });
    });

    const member = { id: 'm-2', name: 'Old Name', role: 'Dev', sheetRowIndex: 6 };
    const updates = { role: 'Lead Architect', stage: 'growing' };
    await pushMemberUpdateToSheets(member, updates);

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.action).toBe('update');
    expect(capturedPayload.member.role).toBe('Lead Architect');
    expect(capturedPayload.audit.notes).toContain('Edited in Web App');
  });
});
