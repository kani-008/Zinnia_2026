/**
 * Zinnia 2026 — registration leads
 * =====================================================================
 * One row per person who submitted the personal details form, whether or not
 * they went on to verify their email or pay. It is the list of people who
 * started and stopped, which the main registration sheet cannot show: nothing
 * reaches the database until payment.
 *
 * The backend POSTs each submission here (backend/services/leads_sheet.py).
 * No database is involved, and this sheet is independent of the main
 * "Registration data" sheet and its sync.
 *
 * ---------------------------------------------------------------------
 * SETUP (once)
 * ---------------------------------------------------------------------
 * 1. Create a NEW Google Sheet. Do not use the Registration data sheet: a
 *    separate file has its own sharing list, so this one can go to volunteers
 *    making follow-up calls without also handing them every paid participant.
 *
 * 2. In that sheet: Extensions -> Apps Script. Delete the sample code, paste
 *    this whole file, and Save.
 *
 * 3. Project Settings (gear icon) -> Script Properties -> Add script property:
 *
 *        LEADS_SHEET_KEY   <the same value as LEADS_SHEET_KEY in the backend>
 *
 *    Here, never in a cell - anyone with view access reads cells.
 *
 * 4. Back in the editor, choose `setup` in the function dropdown and Run it.
 *    Approve the permission prompt. It creates the Leads tab and its headers.
 *
 * 5. Deploy -> New deployment -> gear icon -> Web app.
 *        Execute as:      Me
 *        Who has access:  Anyone
 *    Deploy, then copy the Web app URL (it ends in /exec).
 *
 *    "Anyone" is required because the backend calls this without a Google
 *    login. The key from step 3 is what keeps everybody else out, so treat it
 *    like a password.
 *
 * 6. Put that URL in the backend as LEADS_SHEET_URL, locally in .env AND in
 *    the Vercel project's environment variables, then redeploy.
 *
 * AFTER EDITING THIS SCRIPT: the /exec URL keeps running the version it was
 * deployed with. Use Deploy -> Manage deployments -> edit (pencil) -> Version:
 * New version -> Deploy. Creating a brand new deployment instead gives you a
 * DIFFERENT URL, and the backend would keep posting to the old one.
 *
 * ---------------------------------------------------------------------
 * SHARING
 * ---------------------------------------------------------------------
 * These are UNVERIFIED details. Anyone can type someone else's email or phone
 * into the form. Share with named accounts only, and check before contacting
 * anyone that the details are really theirs.
 */

var SHEET_NAME = 'Leads';
var HEADERS = ['Submitted at', 'Name', 'Email', 'Phone', 'College', 'Department', 'Year', 'Food'];
var EMAIL_COL = 3;           // 1-based column of Email in HEADERS
var TIMEZONE = 'Asia/Kolkata';

/** Run once from the editor. Safe to run again. */
function setup() {
  sheet_();
  var key = PropertiesService.getScriptProperties().getProperty('LEADS_SHEET_KEY');
  SpreadsheetApp.getActive().toast(
    key ? 'Leads tab ready. Key is set.' : 'Leads tab ready. LEADS_SHEET_KEY is NOT set yet.',
    'Zinnia leads', 8);
}

/**
 * Lets you open the /exec URL in a browser to confirm the deployment is live.
 * Returns nothing about the data.
 */
function doGet() {
  return json_({ ok: true, service: 'zinnia-leads' });
}

/** Called by the backend for every details-form submission. */
function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }

  var expected = PropertiesService.getScriptProperties().getProperty('LEADS_SHEET_KEY');
  // Refuse outright when no key is configured, rather than accepting anything.
  if (!expected || body.key !== expected) {
    return json_({ ok: false, error: 'unauthorized' });
  }

  var d = body.details || {};
  var email = String(d.email || '').trim().toLowerCase();
  if (!email) return json_({ ok: false, error: 'missing email' });

  // Two submissions arriving together would otherwise both miss each other's
  // row and both append - one person, two lines.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return json_({ ok: false, error: 'busy' });

  try {
    var sheet = sheet_();
    var stamp = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    var row = [stamp, d.name, email, d.phone, d.college, d.department, d.year, d.food_preference]
      .map(safe_);

    // One row per email address: filling the form again updates that person's
    // details and time rather than adding a duplicate line.
    var target = findEmailRow_(sheet, email) || sheet.getLastRow() + 1;

    var range = sheet.getRange(target, 1, 1, HEADERS.length);
    // Plain text, set BEFORE the values: a phone number written into a normal
    // cell loses a leading zero, and anything starting with + is parsed.
    range.setNumberFormat('@');
    range.setValues([row]);

    return json_({ ok: true, row: target });
  } catch (err) {
    return json_({ ok: false, error: 'write failed' });
  } finally {
    lock.releaseLock();
  }
}

/** The Leads tab, created with headers on first use. */
function sheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getRange(1, 1).getValue() !== HEADERS[0]) {
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setValues([HEADERS])
      .setFontWeight('bold')
      .setBackground('#2C4788')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Row number holding this email, or 0. */
function findEmailRow_(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var hit = sheet.getRange(2, EMAIL_COL, last - 1, 1)
    .createTextFinder(email)
    .matchEntireCell(true)
    .matchCase(false)
    .findNext();
  return hit ? hit.getRow() : 0;
}

/**
 * Text, trimmed, and never a formula. A "name" beginning with = or + would
 * otherwise run as a formula for everyone who opens the sheet; a leading
 * apostrophe forces it to be stored as the literal text that was typed.
 */
function safe_(value) {
  var s = value === null || value === undefined ? '' : String(value).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
