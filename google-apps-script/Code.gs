/**
 * Smart Entrepreneurs Directory — 2-Way Sync Webhook + Email Notifications
 *
 * Instructions:
 * 1. Open your Google Sheet linked to your Google Form.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Replace all code in Code.gs with this script.
 * 4. Click "Deploy" > "New deployment" (or "Manage deployments" > Edit > New version).
 * 5. Select type "Web app". Execute as: "Me". Who has access: "Anyone".
 * 6. Click "Deploy", authorize access, and copy the Web App URL.
 * 7. Paste the Web App URL into the Smart Directory Admin Portal.
 * 8. In Admin Portal → enter your email → click "Save & Push to Apps Script".
 * 9. Back in Apps Script: Triggers (clock icon) > "+ Add Trigger":
 *    Function: onFormSubmit | Source: From spreadsheet | Event: On form submit
 *    Save & authorize → you'll now get email alerts on every new submission!
 */

// ─── PropertiesService Config Helpers ─────────────────────────────────────────
function setAdminConfig(config) {
  var props = PropertiesService.getScriptProperties();
  if (config.adminEmail) props.setProperty('ADMIN_EMAIL', config.adminEmail);
  if (config.adminPortalUrl) props.setProperty('ADMIN_PORTAL_URL', config.adminPortalUrl);
}

function getAdminConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    adminEmail: props.getProperty('ADMIN_EMAIL') || '',
    adminPortalUrl: props.getProperty('ADMIN_PORTAL_URL') || 'https://smart-entrepreneurs-directory.vercel.app/admin.html'
  };
}

// ─── Form Submit Trigger — Email Notification to Admin ────────────────────────
// Set up: Apps Script > Triggers > + Add Trigger > onFormSubmit > On form submit
function onFormSubmit(e) {
  var config = getAdminConfig();
  if (!config.adminEmail) return;

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var values = (e && e.values) ? e.values : [];

    // Fallback: If e.values is undefined (e.g. installable trigger object variation), read the last row
    if (!values || values.length === 0) {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        values = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
      }
    }

    var member = {};
    for (var i = 0; i < headers.length; i++) {
      var key = normalizeHeader(String(headers[i]));
      member[key] = values[i] !== undefined ? String(values[i]) : '';
    }

    var name       = member.name       || 'Unknown';
    var role       = member.role       || '';
    var business   = member.business   || '';
    var city       = member.city       || '';
    var phone      = member.phone      || '';
    var linkedin   = member.linkedin   || '';
    var stage      = member.stage      || '';
    var lookingFor = member.lookingFor || '';
    var canHelp    = member.canHelp    || '';
    var submitted  = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' });

    // Clean plain text subject (avoids unescaped UTF-8 4-byte surrogate issues in strict mail clients)
    var subject = '[Smart Directory] New Member Pending Approval: ' + name;

    // Rich HTML email body using Unicode escape sequences (\\uXXXX) to guarantee flawless email rendering across all mail clients
    var htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:12px">'
      + '<div style="background:linear-gradient(135deg,#059669,#047857);padding:20px;border-radius:10px;margin-bottom:20px">'
      + '<h2 style="color:white;margin:0;font-size:20px;font-weight:800">\u2728 New Member Pending Approval</h2>'
      + '<p style="color:#d1fae5;margin:4px 0 0;font-size:13px">Smart Entrepreneurs Directory</p></div>'
      + '<table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">'
      + '<tr style="background:#f0fdf4"><td style="padding:10px 14px;font-weight:700;color:#065f46;width:35%">Name</td><td style="padding:10px 14px">' + escapeHtml(name) + '</td></tr>'
      + '<tr><td style="padding:10px 14px;font-weight:700;color:#065f46">Role</td><td style="padding:10px 14px">' + escapeHtml(role) + '</td></tr>'
      + '<tr style="background:#f0fdf4"><td style="padding:10px 14px;font-weight:700;color:#065f46">Business</td><td style="padding:10px 14px">' + escapeHtml(business) + '</td></tr>'
      + '<tr><td style="padding:10px 14px;font-weight:700;color:#065f46">Location</td><td style="padding:10px 14px">' + escapeHtml(city) + '</td></tr>'
      + '<tr style="background:#f0fdf4"><td style="padding:10px 14px;font-weight:700;color:#065f46">Phone</td><td style="padding:10px 14px">' + escapeHtml(phone) + '</td></tr>'
      + '<tr><td style="padding:10px 14px;font-weight:700;color:#065f46">LinkedIn</td><td style="padding:10px 14px">' + (linkedin ? ('<a href="' + escapeHtml(linkedin) + '" target="_blank">' + escapeHtml(linkedin) + '</a>') : '—') + '</td></tr>'
      + '<tr style="background:#f0fdf4"><td style="padding:10px 14px;font-weight:700;color:#065f46">Stage</td><td style="padding:10px 14px">' + escapeHtml(stage) + '</td></tr>'
      + '<tr><td style="padding:10px 14px;font-weight:700;color:#065f46">Looking For</td><td style="padding:10px 14px">' + escapeHtml(lookingFor) + '</td></tr>'
      + '<tr style="background:#f0fdf4"><td style="padding:10px 14px;font-weight:700;color:#065f46">Can Help</td><td style="padding:10px 14px">' + escapeHtml(canHelp) + '</td></tr>'
      + '<tr><td style="padding:10px 14px;font-weight:700;color:#065f46">Submitted</td><td style="padding:10px 14px">' + escapeHtml(submitted) + '</td></tr>'
      + '</table>'
      + '<div style="margin-top:20px;text-align:center">'
      + '<a href="' + config.adminPortalUrl + '" style="display:inline-block;background:#059669;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">\u2714 Review &amp; Approve in Admin Portal \u2192</a>'
      + '</div>'
      + '<p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">Smart Entrepreneurs Directory \u00B7 Automated Notification</p></div>';

    GmailApp.sendEmail(
      config.adminEmail,
      subject,
      name + ' submitted a form and is pending approval. Visit: ' + config.adminPortalUrl,
      { htmlBody: htmlBody, name: 'Smart Directory' }
    );
  } catch (err) {
    console.log('Email notification error: ' + err.toString());
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    totalRows: rows.length,
    rows: rows,
    syncedAt: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents || '{}');
    var action = payload.action; // 'update' | 'delete' | 'add' | 'setConfig'
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

    if (action === 'setConfig') {
      var configData = payload.config || {};
      setAdminConfig(configData);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: 'setConfig',
        message: 'Admin configuration saved to Apps Script'
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
  if (h.indexOf('how long') > -1 || h.indexOf('been running') > -1 || h.indexOf('been in') > -1 ||
      h.indexOf('duration') > -1 || h.indexOf('years in') > -1 || h.indexOf('business age') > -1 ||
      h.indexOf('stage') > -1) return 'stage';
  if (h.indexOf('name') > -1 && h.indexOf('company') === -1 && h.indexOf('business') === -1) return 'name';
  if (h.indexOf('role') > -1 || h.indexOf('profession') > -1 || h.indexOf('title') > -1 || h.indexOf('do you do') > -1) return 'role';
  // Q5: "What are you currently looking for?" — MUST come before city check ("where are you")
  if (h.indexOf('looking for') > -1 || h.indexOf('seeking') > -1) return 'lookingFor';
  // Q6: "What can you offer to other members?"
  if (h.indexOf('offer') > -1 || h.indexOf('can help') > -1 || h.indexOf('offering') > -1) return 'canHelp';
  // Q7: "Business or Project Pitch"
  if (h.indexOf('business') > -1 || h.indexOf('project') > -1 || h.indexOf('pitch') > -1 || h.indexOf('venture') > -1 || h.indexOf('company') > -1) return 'business';
  if (h.indexOf('country') > -1) return 'country';
  // Q8: "Where are you based?"
  if (h.indexOf('city') > -1 || h.indexOf('governorate') > -1 || h.indexOf('district') > -1 ||
      h.indexOf('where are you') > -1 || h.indexOf('based') > -1 || h.indexOf('location') > -1) return 'city';
  // Q10: "Industry (...)"
  if (h.indexOf('industry') > -1 || h.indexOf('tag') > -1 || h.indexOf('sector') > -1) return 'tags';
  if (h.indexOf('app_status') > -1) return 'appStatus';
  if (h.indexOf('last_app_sync_at') > -1) return 'lastAppSyncAt';
  if (h.indexOf('app_notes') > -1) return 'appNotes';
  return h.replace(/[^a-z0-9]/gi, '_');
}
