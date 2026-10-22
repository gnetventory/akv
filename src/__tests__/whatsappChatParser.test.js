import { describe, it, expect } from 'vitest';
import {
  parseRawFileToMessages,
  parseWhatsAppChatText,
  parseMarkdownNotes,
  extractIntroCandidates,
  analyzeDuplicates,
} from '../utils/whatsappChatParser';

describe('WhatsApp & Markdown Chat Parser Engine', () => {
  it('parses iOS format WhatsApp messages properly', () => {
    const rawChat = `[12/03/24, 14:30:15] Karim Mostafa: Hello everyone! Glad to be here.
[12/03/24, 14:32:00] Tarek Helmy: Name: Tarek Helmy
Role: Founder & CEO
Business: SwiftPay — B2B invoicing platform in Cairo
Stage: Running
Looking for: Strategic angels
Can help: FinTech compliance
Location: Cairo, Egypt`;

    const messages = parseWhatsAppChatText(rawChat);
    expect(messages.length).toBe(2);
    expect(messages[0].sender).toBe('Karim Mostafa');
    expect(messages[1].sender).toBe('Tarek Helmy');
    expect(messages[1].text).toContain('SwiftPay');
  });

  it('parses Android format WhatsApp messages properly', () => {
    const rawChat = `15/04/2024, 10:15 - Sarah Mansour: Hi team!
15/04/2024, 10:18 - Sarah Mansour: Name: Sarah Mansour
Role: Head of Product
Business: EduGrow
Stage: Starting
Location: Alexandria, Egypt
Looking for: React developers
Can help: Product management`;

    const messages = parseWhatsAppChatText(rawChat);
    expect(messages.length).toBe(2);
    expect(messages[1].sender).toBe('Sarah Mansour');
    expect(messages[1].text).toContain('EduGrow');
  });

  it('parses Markdown format notes properly', () => {
    const markdown = `# Member Intros

## Nouran Zaki
**Role:** AI Engineer
**Business:** NeuroVision — Medical imaging diagnostics
**Stage:** Idea
**Location:** Giza, Egypt
**Seeking:** Hospital pilot partners
**Offering:** Computer vision architecture

---

## Omar Khaled
**Role:** Growth Lead
**Business:** QuickShip Logistics
**Stage:** Running
**Location:** Cairo, Egypt`;

    const messages = parseMarkdownNotes(markdown);
    expect(messages.length).toBe(2);
    expect(messages[0].sender).toBe('Nouran Zaki');
    expect(messages[1].sender).toBe('Omar Khaled');
  });

  it('filters candidate introductions and ignores casual chatter', () => {
    const messages = [
      { sender: 'User A', text: 'Good morning guys!' },
      { sender: 'User B', text: '<Media omitted>' },
      { sender: 'User C', text: 'Are we having the call at 5 PM today?' },
      {
        sender: 'Youssef El-Sayed',
        text: `Name: Youssef El-Sayed
Role: Founder
Business: Agritech sensor nodes
Stage: Starting
Looking for: Seed funding
Can help: IoT hardware design`,
      },
    ];

    const candidates = extractIntroCandidates(messages);
    expect(candidates.length).toBe(1);
    expect(candidates[0].sender).toBe('Youssef El-Sayed');
  });

  it('accurately identifies duplicate profiles by phone, LinkedIn, and name', () => {
    const existing = [
      { id: '1', name: 'Amr Diab', phone: '+201011112222', linkedin: 'amrdiab', role: 'CEO' },
    ];

    const newExtracted = [
      { id: 'n1', name: 'Amr Diab', phone: '+201011112222', role: 'CEO & Founder' },
      { id: 'n2', name: 'Layla Hassan', phone: '+201099998888', role: 'CTO' },
    ];

    const staged = analyzeDuplicates(newExtracted, existing);
    expect(staged.length).toBe(2);
    expect(staged[0].isDuplicate).toBe(true);
    expect(staged[0].selectedForImport).toBe(false);
    expect(staged[1].isDuplicate).toBe(false);
    expect(staged[1].selectedForImport).toBe(true);
  });
});
