/**
 * Zinnia 2026 — Google Sheets live sync
 * =====================================================================
 * Pulls every tab of the admin export into this spreadsheet on a timer,
 * so coordinators can read and filter registrations without an admin
 * login and without anybody re-downloading a workbook.
 *
 * It reads GET /api/admin/export/sync, which serialises the SAME tab list
 * the .xlsx download is built from (export_service._collect_sheets), so
 * the sheet and the workbook cannot disagree about their contents.
 *
 * ---------------------------------------------------------------------
 * SETUP (once)
 * ---------------------------------------------------------------------
 * 1. Extensions -> Apps Script, paste this file, Save.
 * 2. Project Settings -> Script Properties, add two properties:
 *
 *      SYNC_URL   https://zinnia-gcee.vercel.app/api/admin/export/sync
 *      SYNC_KEY   <the SHEET_SYNC_KEY value set in Vercel>
 *
 *    Put them HERE, never in a cell — anyone with view access reads cells.
 * 3. Run installTrigger() once, and approve the permission prompt.
 * 4. Reload the spreadsheet: a "Zinnia Sync" menu appears.
 *
 * The trigger runs as whoever installs it, against their Apps Script
 * quota, and keeps running if that person later loses sheet access.
 * Install it from the account that should own the automation.
 *
 * ---------------------------------------------------------------------
 * SHARING
 * ---------------------------------------------------------------------
 * This spreadsheet ends up holding every participant's name, email and
 * phone number. Share it with named accounts only. "Anyone with the
 * link" publishes the entire registration roster.
 */

var SYNC_INTERVAL_MINUTES = 5;
var STATUS_TAB = 'Sync status';

/** Spreadsheet menu, so a coordinator can force a refresh mid-desk. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Zinnia Sync')
    .addItem('Sync now', 'syncNow')
    .addSeparator()
    .addItem('Start auto-sync', 'installTrigger')
    .addItem('Stop auto-sync', 'removeTrigger')
    .addToUi();
}

function installTrigger() {
  removeTrigger();
  ScriptApp.newTrigger('syncNow')
    .timeBased()
    .everyMinutes(SYNC_INTERVAL_MINUTES)
    .create();
  SpreadsheetApp.getActive().toast(
    'Auto-sync every ' + SYNC_INTERVAL_MINUTES + ' minutes.', 'Zinnia Sync', 5);
}

function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncNow') ScriptApp.deleteTrigger(t);
  });
}

/** The whole job. Safe to run by hand at any time. */
function syncNow() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SYNC_URL');
  // SHEET_SYNC_KEY is what the variable is called in Vercel, so that is the
  // name people naturally copy across. Accept either rather than failing with
  // a message that does not mention the name they actually used.
  var key = props.getProperty('SYNC_KEY') || props.getProperty('SHEET_SYNC_KEY');
  if (!url || !key) {
    throw new Error(
      'Set SYNC_URL and SYNC_KEY (or SHEET_SYNC_KEY) in Project Settings -> ' +
      'Script Properties. Found: ' +
      (url ? 'SYNC_URL ok' : 'SYNC_URL MISSING') + ', ' +
      (key ? 'key ok' : 'key MISSING') + '.');
  }

  var res = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: 'Bearer ' + key },
    // Without this a 401 throws before we can read WHY it failed.
    muteHttpExceptions: true,
    followRedirects: true,
  });

  var code = res.getResponseCode();
  var body = res.getContentText();

  // Bail BEFORE touching the spreadsheet. A failed fetch must leave the
  // last good data in place rather than blanking the sheet coordinators
  // are looking at.
  if (code !== 200) {
    writeStatus_('FAILED', 'HTTP ' + code + ' — ' + body.slice(0, 300));
    throw new Error('Sync failed: HTTP ' + code + ' ' + body.slice(0, 300));
  }

  var payload = JSON.parse(body);
  if (!payload.success || !payload.tabs) {
    writeStatus_('FAILED', 'Unexpected response shape.');
    throw new Error('Sync failed: unexpected response shape.');
  }

  var ss = SpreadsheetApp.getActive();
  var written = [];
  payload.tabs.forEach(function (tab) {
    written.push(tab.name + ': ' + tab.rows.length);
    writeTab_(ss, tab);
  });

  writeStatus_('OK', written.join('\n'), payload.generated_at);
}

/** One tab: headers, rows, text formats, and no leftovers. */
function writeTab_(ss, tab) {
  var sheet = ss.getSheetByName(tab.name) || ss.insertSheet(tab.name);
  var numCols = tab.headers.length;

  // Text format goes on BEFORE the values. A phone number written as
  // "+919876543210" into a normal cell is parsed as a FORMULA and renders
  // #ERROR!, and a txn_ref with a leading zero silently loses it.
  (tab.text_columns || []).forEach(function (i) {
    sheet.getRange(1, i + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
  });

  var values = [tab.headers].concat(tab.rows);

  // Grow the grid first if the roster outgrew it; setValues cannot write
  // past the last row.
  if (values.length > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), values.length - sheet.getMaxRows() + 10);
  }
  if (numCols > sheet.getMaxColumns()) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), numCols - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, values.length, numCols).setValues(values);

  // Yesterday's longer roster would otherwise leave ghost rows below the
  // new data — a cancelled registration that never disappears.
  var stale = sheet.getLastRow() - values.length;
  if (stale > 0) {
    sheet.getRange(values.length + 1, 1, stale, sheet.getMaxColumns()).clearContent();
  }

  sheet.getRange(1, 1, 1, numCols)
    .setFontWeight('bold')
    .setBackground('#2C4788')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

/** A tab that says whether the last run worked, and when. */
function writeStatus_(state, detail, generatedAt) {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(STATUS_TAB) || ss.insertSheet(STATUS_TAB);
  sheet.clear();
  sheet.getRange(1, 1, 5, 2).setValues([
    ['Zinnia 2026 — sheet sync', ''],
    ['Last run', new Date()],
    ['Result', state],
    ['Data generated at', generatedAt || ''],
    ['Detail', detail || ''],
  ]);
  sheet.getRange(1, 1).setFontWeight('bold');
  sheet.getRange('A1:A5').setFontWeight('bold');
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 460);
  sheet.getRange(5, 2).setWrap(true);
}
