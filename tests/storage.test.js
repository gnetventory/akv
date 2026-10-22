import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMembers,
  saveMembers,
  addMember,
  addMembers,
  updateMember,
  deleteMember,
  clearAllData,
  loadDemoSeedData,
  getAdminPIN,
  saveAdminPIN,
} from '../src/utils/storage';

describe('storage.js unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAllData();
  });

  it('getMembers returns empty array when empty without ghost resurrection', () => {
    const members = getMembers();
    expect(members).toEqual([]);
    expect(members.length).toBe(0);
  });

  it('loadDemoSeedData populates demo seed profiles', () => {
    const seed = loadDemoSeedData();
    expect(seed.length).toBeGreaterThan(0);
    expect(getMembers().length).toBe(seed.length);
  });

  it('addMember inserts new member at the top', () => {
    const newMember = { name: 'Test User', role: 'Tester', business: 'Test Co' };
    const added = addMember(newMember);
    expect(added.id).toBeDefined();
    expect(getMembers()[0].name).toBe('Test User');
  });

  it('addMembers deduplicates members by name', () => {
    saveMembers([{ id: '1', name: 'Existing Member' }]);
    const batch = [
      { name: 'Existing Member', role: 'Duplicate' },
      { name: 'Unique Member', role: 'New' },
    ];
    const added = addMembers(batch);
    expect(added.length).toBe(1);
    expect(added[0].name).toBe('Unique Member');
  });

  it('updateMember modifies member correctly', () => {
    const added = addMember({ name: 'Update Target', role: 'Old Role' });
    const updated = updateMember(added.id, { role: 'New Role' });
    expect(updated.role).toBe('New Role');
  });

  it('deleteMember removes member permanently', () => {
    const added = addMember({ name: 'Delete Target' });
    deleteMember(added.id);
    const members = getMembers();
    expect(members.find((m) => m.id === added.id)).toBeUndefined();
  });

  it('clearAllData completely empties records', () => {
    addMember({ name: 'Member A' });
    addMember({ name: 'Member B' });
    expect(getMembers().length).toBe(2);
    clearAllData();
    expect(getMembers().length).toBe(0);
  });

  it('saveAdminPIN persists custom PIN hash', () => {
    const customHash = 'custom_hash_12345';
    saveAdminPIN(customHash);
    expect(getAdminPIN()).toBe(customHash);
  });
});
