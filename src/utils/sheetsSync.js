import { generateId, extractUrls } from './helpers';
import {
  getMembers,
  saveMembers,
  getTombstones,
  addTombstone,
  getSheetsConfig,
  saveSheetsConfig,
  saveNiaPIN,
} from './storage';

/**
 * ─── Google Apps Script Code Template (Code.gs) ─────────────────────────────────
 * Ready to copy & paste into Google Sheets -> Extensions -> Apps Script.
 * Supports:
 * - doGet: returns all submissions as JSON with automatic column normalization
 * - doPost: updates or marks rows as DELETED with timestamp and audit note
 */
export function getGoogleAppsScriptCode() {
  return `/**
 * Smart Entrepreneurs Directory — 2-Way Sync Webhook
 * 
 * Instructions:
 * 1. Open your Google Sheet linked to your Google Form.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace all code in Code.gs with this script.
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type "Web app".
 * 6. Set "Execute as": "Me", and "Who has access": "Anyone".
 * 7. Click "Deploy", authorize access, and copy the Web App URL.
 * 8. Paste the Web App URL into the Smart Directory Admin Portal!
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ success: true, rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    var obj = { sheetRowIndex: i + 1 };
    for (var j = 0; j < headers.length; j++) {
      var headerKey = normalizeHeader(headers[j]);
      obj[headerKey] = rowData[j] !== undefined ? rowData[j] : '';
    }
    rows.push(obj);
  }

  var adminPinHash = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN_HASH') || '';

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    totalRows: rows.length,
    rows: rows,
    adminPinHash: adminPinHash,
    syncedAt: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents || '{}');
    var action = payload.action; // 'update' | 'delete' | 'add' | 'setConfig'

    if (action === 'setConfig') {
      var cfg = payload.config || {};
      if (cfg.adminEmail !== undefined) {
        PropertiesService.getScriptProperties().setProperty('ADMIN_EMAIL', String(cfg.adminEmail).trim());
      }
      if (cfg.adminPinHash !== undefined) {
        PropertiesService.getScriptProperties().setProperty('ADMIN_PIN_HASH', String(cfg.adminPinHash).trim());
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Admin config saved' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var member = payload.member || {};
    var audit = payload.audit || {};
    var timestamp = new Date().toISOString();

    ensureAuditHeaders(sheet);

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { return String(h).trim(); });
    var statusCol = headers.indexOf('App_Status') + 1;
    var syncAtCol = headers.indexOf('Last_App_Sync_At') + 1;
    var notesCol  = headers.indexOf('App_Notes') + 1;

    // Match row by sheetRowIndex, email, or name
    var targetRowIndex = -1;
    if (member.sheetRowIndex && member.sheetRowIndex <= data.length) {
      targetRowIndex = parseInt(member.sheetRowIndex, 10);
    } else {
      var nameCol = findColIndex(headers, ['Name', 'Full Name', 'Founder Name']);
      for (var i = 1; i < data.length; i++) {
        if (nameCol > -1 && String(data[i][nameCol]).trim().toLowerCase() === String(member.name || '').trim().toLowerCase()) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    if (action === 'delete') {
      if (targetRowIndex > 1) {
        if (statusCol > 0) sheet.getRange(targetRowIndex, statusCol).setValue('DELETED');
        if (syncAtCol > 0) sheet.getRange(targetRowIndex, syncAtCol).setValue(timestamp);
        if (notesCol > 0)  sheet.getRange(targetRowIndex, notesCol).setValue(audit.reason || 'Deleted by Admin in Web App');
        sheet.getRange(targetRowIndex, 1, 1, headers.length).setBackground('#FFF1F2'); // Light red highlight
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: 'delete',
        row: targetRowIndex,
        timestamp: timestamp
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update') {
      if (targetRowIndex > 1) {
        if (statusCol > 0) sheet.getRange(targetRowIndex, statusCol).setValue('EDITED_IN_APP');
        if (syncAtCol > 0) sheet.getRange(targetRowIndex, syncAtCol).setValue(timestamp);
        if (notesCol > 0)  sheet.getRange(targetRowIndex, notesCol).setValue(audit.notes || 'Updated by Admin in Web App');
        sheet.getRange(targetRowIndex, 1, 1, headers.length).setBackground('#F0FDF4'); // Light green highlight
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: 'update',
        row: targetRowIndex,
        timestamp: timestamp
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Action processed' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureAuditHeaders(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var required = ['App_Status', 'Last_App_Sync_At', 'App_Notes'];
  var lastCol = sheet.getLastColumn();

  for (var i = 0; i < required.length; i++) {
    var req = required[i];
    if (headers.indexOf(req) === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(req).setFontWeight('bold').setBackground('#E2E8F0');
    }
  }
}

function findColIndex(headers, aliases) {
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].toLowerCase();
    for (var j = 0; j < aliases.length; j++) {
      if (h.indexOf(aliases[j].toLowerCase()) > -1) return i;
    }
  }
  return -1;
}

function normalizeHeader(header) {
  var h = String(header || '').toLowerCase().trim();
  if (h.indexOf('timestamp') > -1) return 'formTimestamp';
  if (h.indexOf('email') > -1) return 'email';
  if (h.indexOf('phone') > -1 || h.indexOf('whatsapp') > -1 || h.indexOf('mobile') > -1) return 'phone';
  if (h.indexOf('linkedin') > -1) return 'linkedin';
  // Q9: "How long have you been running your business?" — MUST come before business check
  // because the header contains the word "business"
  if (h.indexOf('how long') > -1 || h.indexOf('been running') > -1 || h.indexOf('been in') > -1 ||
      h.indexOf('duration') > -1 || h.indexOf('years in') > -1 || h.indexOf('business age') > -1 ||
      h.indexOf('stage') > -1) return 'stage';
  if (h.indexOf('name') > -1 && h.indexOf('company') === -1 && h.indexOf('business') === -1) return 'name';
  if (h.indexOf('role') > -1 || h.indexOf('profession') > -1 || h.indexOf('title') > -1 || h.indexOf('do you do') > -1) return 'role';
  // Q5: "What are you currently looking for?" — MUST come before city check ("where are you")
  // "currently" removed from stage check to avoid false match here
  if (h.indexOf('looking for') > -1 || h.indexOf('seeking') > -1) return 'lookingFor';
  // Q6: "What can you offer to other members?"
  if (h.indexOf('offer') > -1 || h.indexOf('can help') > -1 || h.indexOf('offering') > -1) return 'canHelp';
  // Q7: "Business or Project Pitch"
  if (h.indexOf('business') > -1 || h.indexOf('project') > -1 || h.indexOf('pitch') > -1 || h.indexOf('venture') > -1 || h.indexOf('company') > -1) return 'business';
  if (h.indexOf('country') > -1) return 'country';
  // Q8: "Where are you based?" — "based" and "where are you" added
  if (h.indexOf('city') > -1 || h.indexOf('governorate') > -1 || h.indexOf('district') > -1 ||
      h.indexOf('where are you') > -1 || h.indexOf('based') > -1 || h.indexOf('location') > -1) return 'city';
  // Q10: "Industry (...)"
  if (h.indexOf('industry') > -1 || h.indexOf('tag') > -1 || h.indexOf('sector') > -1) return 'tags';
  if (h.indexOf('secondary website') > -1 || h.indexOf('other website') > -1 || h.indexOf('website 2') > -1 || h.indexOf('link 2') > -1) return 'secondaryWebsite';
  if (h.indexOf('website') > -1 || h.indexOf('site') > -1 || h.indexOf('url') > -1 || h.indexOf('link') > -1 || h.indexOf('portfolio') > -1) return 'website';
  if (h.indexOf('catalog') > -1 || h.indexOf('catalogue') > -1 || h.indexOf('brochure') > -1) return 'catalogues';
  if (h.indexOf('app_status') > -1) return 'appStatus';
  if (h.indexOf('last_app_sync_at') > -1) return 'lastAppSyncAt';
  if (h.indexOf('app_notes') > -1) return 'appNotes';
  return h.replace(/[^a-z0-9]/gi, '_');
}`;
}

/**
 * ─── Normalize incoming Google Sheet row into Member object ───────────────────
 */
export function normalizeSheetRow(row = {}) {
  if (!row || typeof row !== 'object') return null;

  // Helper: search row for a value by trying multiple key patterns
  const pick = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && String(row[k]).trim()) return String(row[k]).trim();
    }
    // Also try searching all keys for partial matches
    for (const k of keys) {
      const found = Object.keys(row).find((rk) => rk.toLowerCase().includes(k.toLowerCase()));
      if (found && String(row[found]).trim()) return String(row[found]).trim();
    }
    return '';
  };

  // Extract name (supports raw column variations, numbered questions, and Arabic headers)
  const name =
    pick('name', 'founder', 'fullname', 'full_name', 'الاسم', 'اسم') ||
    String(
      row.name ||
        row.founderName ||
        row.full_name ||
        row['1__full_name'] ||
        row['1_full_name'] ||
        row['1__name'] ||
        row['1_name'] ||
        ''
    ).trim();
  if (!name) return null;

  // Extract email
  const email = pick('email', 'mail', 'emailAddress', 'email_address', 'بريد', 'عنوان_البريد');

  // Determine stage — handles the actual Google Form Q9 answers:
  // "💡 Idea" | "Less Than a year" | "1–3 years" | "3–5 years" | "5+ years"
  // NOTE: Form uses en dashes (–), so we normalize before checking
  const rawStageRaw = String(
    row.stage ||
      row.businessAge ||
      pick('stage', 'businessAge', 'how_long', 'been_running', 'business_age', 'مرحلة', 'عمر') ||
      ''
  );
  const rawStage = rawStageRaw.toLowerCase().replace(/[–—]/g, '-'); // normalize en/em dash → hyphen
  let stage = 'idea';
  // Exact form answer patterns (checked first, most specific)
  if (rawStage.includes('5+') || rawStage.includes('3-5') || rawStage.includes('3 to 5')) {
    stage = 'growing';
  } else if (rawStage.includes('1-3') || rawStage.includes('1 to 3')) {
    stage = 'running';
  } else if (
    rawStage.includes('less than') ||
    rawStage.includes('under 1') ||
    rawStage.includes('under one')
  ) {
    stage = 'starting';
  } else if (rawStage.includes('idea') || rawStage.includes('plan') || rawStage.includes('💡')) {
    stage = 'idea';
    // Generic maturity keywords (fallback)
  } else if (
    rawStage.includes('grow') ||
    rawStage.includes('scale') ||
    rawStage.includes('series')
  ) {
    stage = 'growing';
  } else if (
    rawStage.includes('run') ||
    rawStage.includes('trad') ||
    rawStage.includes('revenue') ||
    rawStage.includes('seed')
  ) {
    stage = 'running';
  } else if (
    rawStage.includes('start') ||
    rawStage.includes('mvp') ||
    rawStage.includes('early') ||
    rawStage.includes('launch')
  ) {
    stage = 'starting';
  }

  // Tags
  let tags = [];
  const rawTags = row.tags || pick('tags', 'tag', 'industry', 'sector', 'مجال', 'قطاع');
  if (Array.isArray(rawTags)) {
    tags = rawTags;
  } else if (typeof rawTags === 'string' && rawTags.trim()) {
    tags = rawTags
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Country & City
  const country = String(row.country || pick('country', 'دولة', 'بلد') || 'Egypt').trim();
  const city = String(
    row.city ||
      pick('city', 'district', 'governorate', 'location', 'where_are_you', 'based', 'مدينة', 'مكان') ||
      'Cairo'
  ).trim();

  // Unique Form ID key for stable matching
  const formTimestamp = row.formTimestamp || row.timestamp || '';
  const sheetRowIndex = row.sheetRowIndex || null;
  const sheetId = `sheet-row-${sheetRowIndex || name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  // Determine approval status:
  // - New form submissions (no App_Status) → 'pending' (awaiting admin approval)
  // - Previously approved/active → 'active' (visible in public directory)
  const appStatusRaw = String(row.appStatus || '')
    .toUpperCase()
    .trim();
  let status = 'pending'; // default for new form submissions
  if (['APPROVED', 'ACTIVE', 'EDITED_IN_APP'].includes(appStatusRaw)) {
    status = 'active';
  } else if (['REJECTED', 'DELETED'].includes(appStatusRaw)) {
    status = 'rejected';
  }

  // Extract websites, secondary websites & catalogues (supports multiple URLs)
  const rawWebsites = [];
  const primaryWeb = pick('website', 'site', 'url', 'link', 'portfolio', 'موقع');
  const secondaryWeb = pick(
    'secondaryWebsite',
    'secondary_website',
    'website_2',
    'other_website',
    'website2',
    'link_2'
  );
  const rawCatalogues = pick('catalogues', 'catalogue', 'catalog', 'brochure');

  if (primaryWeb) rawWebsites.push(...extractUrls(primaryWeb));
  if (secondaryWeb) rawWebsites.push(...extractUrls(secondaryWeb));

  const website = rawWebsites[0] || '';
  const secondaryWebsite = rawWebsites[1] || '';
  const websitesList = rawWebsites.filter(Boolean);
  const catalogues = rawCatalogues ? extractUrls(rawCatalogues) : [];

  return {
    id: sheetId,
    sheetRowIndex,
    name,
    email: email || '',
    role:
      pick('role', 'profession', 'title', 'what_do_you_do', 'do_you_do', 'وظيفة', 'عمل') ||
      'Founder',
    business: pick('business', 'pitch', 'project', 'venture', 'company', 'مشروع', 'بيزنس', 'فكرة'),
    stage,
    lookingFor: pick('lookingFor', 'looking_for', 'seeking', 'looking', 'تبحث', 'احتياج', 'محتاج'),
    canHelp: pick(
      'canHelp',
      'can_help',
      'what_can_you_help',
      'offer',
      'offering',
      '8__what_can_you_help',
      'مساعدة',
      'تقدم',
      'خبرة'
    ),
    location: { country, city },
    phone: pick('phone', 'whatsapp', 'mobile', 'هاتف', 'واتساب', 'موبايل', 'تليفون'),
    linkedin: pick('linkedin', 'لينكد'),
    website,
    secondaryWebsite,
    websites: websitesList,
    catalogues: catalogues.length > 0 ? catalogues : undefined,
    tags: tags.length > 0 ? tags : ['Startup'],
    appStatus: appStatusRaw || 'PENDING',
    status, // 'pending' | 'active' | 'rejected'
    formTimestamp,
    createdAt: formTimestamp ? new Date(formTimestamp).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFromGoogleForm: true,
  };
}

/**
 * ─── Test Connection to Google Apps Script ────────────────────────────────────
 */
export async function testSheetsConnection(url) {
  if (!url || !url.trim().startsWith('http')) {
    throw new Error('Please provide a valid Google Apps Script Web App URL starting with https://');
  }

  const res = await fetch(url.trim(), { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Connection failed with HTTP status ${res.status}`);
  }
  const data = await res.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON response from Google Apps Script Web App');
  }
  return {
    success: true,
    totalRows: data.totalRows || (Array.isArray(data.rows) ? data.rows.length : 0),
    data,
  };
}

/**
 * ─── 2-Way Sync Engine: Pull submissions from Google Sheets ────────────────────
 * Respects tombstones (deleted records) and preserves local edits.
 */
export async function syncFromGoogleSheets() {
  const config = getSheetsConfig();
  const url = config.apiUrl;
  if (!url || !url.trim()) {
    return { success: false, message: 'Google Sheets API URL is not configured' };
  }

  try {
    const res = await fetch(url.trim(), { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    if (data.adminPinHash && typeof data.adminPinHash === 'string' && data.adminPinHash.length >= 10) {
      saveNiaPIN(data.adminPinHash);
    }

    const rawRows = Array.isArray(data.rows) ? data.rows : [];
    const tombstones = new Set(getTombstones());
    // Filter out legacy mock seed data so Google Sheets is the source of truth
    const existingMembers = getMembers().filter(
      (m) => m && !String(m.id || '').startsWith('seed-') && !m.isDemoSeed
    );

    // Map existing members by Name (normalized), Email, and sheetRowIndex for lookup
    const existingByName = new Map();
    const existingById = new Map();
    const existingByEmail = new Map();
    existingMembers.forEach((m) => {
      if (m.name) existingByName.set(m.name.trim().toLowerCase(), m);
      if (m.email) existingByEmail.set(m.email.trim().toLowerCase(), m);
      if (m.id) existingById.set(m.id, m);
      if (m.sheetRowIndex) existingById.set(`sheet-row-${m.sheetRowIndex}`, m);
    });

    let addedCount = 0;
    let updatedCount = 0;
    let ignoredTombstoneCount = 0;
    const mergedList = [...existingMembers];

    rawRows.forEach((row) => {
      const normalized = normalizeSheetRow(row);
      if (!normalized) return;

      const normName = normalized.name.toLowerCase();
      const rowKey = `sheet-row-${normalized.sheetRowIndex}`;

      // 1. If row is marked DELETED in the sheet or is in our local tombstone list, SKIP!
      if (
        normalized.appStatus === 'DELETED' ||
        tombstones.has(rowKey) ||
        tombstones.has(normName) ||
        tombstones.has(normalized.id)
      ) {
        ignoredTombstoneCount++;
        return;
      }

      // 2. Check if member already exists in our app
      const existing =
        existingByName.get(normName) ||
        (normalized.email ? existingByEmail.get(normalized.email.toLowerCase()) : null) ||
        existingById.get(rowKey) ||
        existingById.get(normalized.id);

      if (existing) {
        // If the record was previously rejected in the app, but is now valid/pending in the sheet,
        // resurrect it into pending approvals!
        if (existing.status === 'rejected' && normalized.status === 'pending') {
          const idx = mergedList.findIndex((m) => m.id === existing.id);
          if (idx !== -1) {
            mergedList[idx] = {
              ...existing,
              ...normalized,
              status: 'pending',
              appStatus: 'PENDING',
              locallyEdited: false,
              id: existing.id,
              sheetRowIndex: normalized.sheetRowIndex || existing.sheetRowIndex,
            };
            updatedCount++;
            addedCount++;
          }
          return;
        }

        // If the user has manually edited this active record in the app, preserve their edits!
        if (existing.locallyEdited) {
          // Keep local edits intact, do not overwrite
          return;
        }

        // Otherwise update with fresh sheet data
        const idx = mergedList.findIndex((m) => m.id === existing.id);
        if (idx !== -1) {
          mergedList[idx] = {
            ...existing,
            ...normalized,
            id: existing.id, // Preserve established ID
            sheetRowIndex: normalized.sheetRowIndex || existing.sheetRowIndex,
            isProfileUpdate: true,
            updatedAt: new Date().toISOString(),
          };
          updatedCount++;
        }
      } else {
        // 3. New submission from Google Form!
        mergedList.push(normalized);
        existingByName.set(normName, normalized);
        if (normalized.email) existingByEmail.set(normalized.email.toLowerCase(), normalized);
        addedCount++;
      }
    });

    // Save final merged state
    saveMembers(mergedList);

    const syncStatus = {
      success: true,
      lastSyncAt: new Date().toISOString(),
      addedCount,
      updatedCount,
      ignoredTombstoneCount,
      totalRecords: mergedList.length,
    };

    saveSheetsConfig({
      ...config,
      lastSyncAt: syncStatus.lastSyncAt,
      lastSyncStatus: syncStatus,
    });

    return syncStatus;
  } catch (err) {
    console.error('Google Sheets Sync Failed:', err);
    const failStatus = {
      success: false,
      error: err.message,
      lastSyncAt: new Date().toISOString(),
    };
    saveSheetsConfig({ ...config, lastSyncStatus: failStatus });
    return failStatus;
  }
}

/**
 * ─── Push Record Deletion to Google Sheets Webhook with Audit Trail ────────────
 */
export async function pushMemberDeleteToSheets(member, reason = 'Deleted in Web App') {
  if (!member) return;

  // 1. Record Tombstone locally
  const normName = (member.name || '').trim().toLowerCase();
  if (normName) addTombstone(normName);
  if (member.id) addTombstone(member.id);
  if (member.sheetRowIndex) addTombstone(`sheet-row-${member.sheetRowIndex}`);

  // 2. Send Webhook to Google Apps Script
  const config = getSheetsConfig();
  if (!config.apiUrl || !config.apiUrl.trim()) return;

  try {
    await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Avoid CORS preflight in Apps Script
      body: JSON.stringify({
        action: 'delete',
        member: {
          id: member.id,
          name: member.name,
          sheetRowIndex: member.sheetRowIndex,
        },
        audit: {
          reason: reason || 'Deleted in Web App by Admin',
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.warn('Failed to push deletion to Google Sheets webhook:', err);
  }
}

/**
 * ─── Push Record Update to Google Sheets Webhook with Audit Trail ──────────────
 */
export async function pushMemberUpdateToSheets(member, updates = {}) {
  if (!member) return;

  const config = getSheetsConfig();
  if (!config.apiUrl || !config.apiUrl.trim()) return;

  try {
    const changedKeys = Object.keys(updates).filter((k) => updates[k] !== member[k]);
    const noteText =
      changedKeys.length > 0
        ? `Edited in Web App: ${changedKeys.join(', ')}`
        : 'Updated in Web App';

    await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'update',
        member: {
          id: member.id,
          name: updates.name || member.name,
          sheetRowIndex: member.sheetRowIndex,
          role: updates.role || member.role,
          business: updates.business || member.business,
          stage: updates.stage || member.stage,
          lookingFor: updates.lookingFor || member.lookingFor,
          canHelp: updates.canHelp || member.canHelp,
          phone: updates.phone || member.phone,
          linkedin: updates.linkedin || member.linkedin,
          tags: updates.tags || member.tags,
        },
        audit: {
          notes: noteText,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (err) {
    console.warn('Failed to push update to Google Sheets webhook:', err);
  }
}

/**
 * ─── Push Admin Config (email) to Google Apps Script PropertiesService ─────────
 * Called from Admin Panel when admin saves their notification email.
 * The Apps Script onFormSubmit trigger reads this email to send notifications.
 */
export async function pushAdminConfigToSheets({ adminEmail, adminPinHash } = {}) {
  const config = getSheetsConfig();
  if (!config.apiUrl || !config.apiUrl.trim())
    return { success: false, error: 'No Apps Script URL configured' };

  try {
    const payloadConfig = {
      adminPortalUrl: 'https://smart-entrepreneurs-directory.vercel.app/admin.html',
    };
    if (adminEmail !== undefined) payloadConfig.adminEmail = adminEmail;
    if (adminPinHash !== undefined) payloadConfig.adminPinHash = adminPinHash;

    const res = await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'setConfig',
        config: payloadConfig,
      }),
    });
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.warn('Failed to push admin config to Apps Script:', err);
    return { success: false, error: err.message };
  }
}

/**
 * ─── Approve a Pending Member ─────────────────────────────────────────────────
 * Sets status:'active', pushes APPROVED audit to Google Sheet.
 */
export async function approveMember(member) {
  const config = getSheetsConfig();
  if (!config.apiUrl || !config.apiUrl.trim()) return;
  try {
    await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'update',
        member: { id: member.id, name: member.name, sheetRowIndex: member.sheetRowIndex },
        audit: { notes: 'APPROVED by Admin in Web App', timestamp: new Date().toISOString() },
        appStatus: 'APPROVED',
      }),
    });
  } catch (err) {
    console.warn('Failed to push approval to Google Sheets:', err);
  }
}

/**
 * ─── Reject a Pending Member ──────────────────────────────────────────────────
 * Tombstones the member and pushes REJECTED audit to Google Sheet.
 */
export async function rejectMember(member, reason = 'Rejected by Admin') {
  const config = getSheetsConfig();
  if (!config.apiUrl || !config.apiUrl.trim()) return;
  try {
    await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'delete',
        member: { id: member.id, name: member.name, sheetRowIndex: member.sheetRowIndex },
        audit: { reason, timestamp: new Date().toISOString() },
        appStatus: 'REJECTED',
      }),
    });
  } catch (err) {
    console.warn('Failed to push rejection to Google Sheets:', err);
  }
}
