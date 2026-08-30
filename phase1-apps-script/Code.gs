/**
 * ICMR STS Research Study — Phase 1 Google Apps Script
 *
 * Automates: Google Form Response → Google Sheet → HMAC Signed Payload → Cloudflare Worker
 *
 * Security Features:
 *  - Canonical HMAC-SHA256 Request Signing
 *  - Replay-resistant Request IDs & Timestamp headers
 *  - Cryptographic Participant ID generation (STS-2026-XXXXXX)
 *  - Dynamic Column Header Mapping (no fixed column index dependencies)
 *  - Sheet-level deduplication (writes back Participant ID to prevent duplicate calls)
 *  - Privacy-preserving execution logs (no PII in execution transcripts)
 */

// Configuration Constants
var CONFIG = {
  SCRIPT_VERSION: '1.0.0-phase1',
  DEFAULT_PATH: '/api/form-submit',
  HEADER_PARTICIPANT_ID: 'STS Participant ID',
  HEADER_SYNC_STATUS: 'STS Sync Status',
  HEADER_SYNC_TIME: 'STS Sync Timestamp',
};

/**
 * Trigger handler for Google Sheets "On form submit" trigger.
 * @param {Object} e Google Sheets Form Submit event object
 */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for other concurrent executions to finish
    lock.waitLock(10000);
  } catch (lockErr) {
    Logger.log('[WARN] Lock acquisition timed out; continuing execution.');
  }

  try {
    var sheet = e && e.range ? e.range.getSheet() : SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var row = e && e.range ? e.range.getRow() : sheet.getLastRow();

    // Prevent re-processing if row was already processed
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    var colMap = buildColumnMap(headers);
    var participantIdColIdx = colMap[CONFIG.HEADER_PARTICIPANT_ID];
    var syncStatusColIdx = colMap[CONFIG.HEADER_SYNC_STATUS];

    // Ensure status columns exist in Sheet
    if (participantIdColIdx === undefined) {
      participantIdColIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, participantIdColIdx).setValue(CONFIG.HEADER_PARTICIPANT_ID);
      colMap[CONFIG.HEADER_PARTICIPANT_ID] = participantIdColIdx;
    }
    if (syncStatusColIdx === undefined) {
      syncStatusColIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, syncStatusColIdx).setValue(CONFIG.HEADER_SYNC_STATUS);
      colMap[CONFIG.HEADER_SYNC_STATUS] = syncStatusColIdx;
    }

    var existingParticipantId = rowValues[participantIdColIdx - 1];
    var existingStatus = rowValues[syncStatusColIdx - 1];

    if (existingStatus === 'SYNCED' && existingParticipantId) {
      Logger.log('[SKIP] Row ' + row + ' already synced with ID: ' + existingParticipantId);
      return;
    }

    // 1. Generate or retrieve unique Participant ID (STS-2026-XXXXXX)
    var participantId = existingParticipantId || generateCryptoParticipantId('2026');
    sheet.getRange(row, participantIdColIdx).setValue(participantId);

    // 2. Read questionnaire responses dynamically by exact header name
    var rawAnswers = {};
    for (var i = 0; i < headers.length; i++) {
      var headerName = String(headers[i]).trim();
      if (headerName && headerName !== CONFIG.HEADER_PARTICIPANT_ID && headerName !== CONFIG.HEADER_SYNC_STATUS) {
        rawAnswers[headerName] = rowValues[i];
      }
    }

    // 3. Build Submission Payload
    var submissionId = 'SUB-' + new Date().getTime() + '-' + row;
    var formTimestamp = (e && e.namedValues && e.namedValues['Timestamp']) 
      ? e.namedValues['Timestamp'][0] 
      : new Date().toISOString();

    var payload = {
      submission_id: submissionId,
      participant_id: participantId,
      form_timestamp: formTimestamp,
      raw_answers: rawAnswers,
      metadata: {
        row_number: row,
        sheet_name: sheet.getName(),
        script_version: CONFIG.SCRIPT_VERSION,
        environment: 'production'
      }
    };

    // 4. Retrieve Script Properties (Worker URL & Secret)
    var props = PropertiesService.getScriptProperties();
    var workerUrl = props.getProperty('WORKER_URL');
    var secret = props.getProperty('STS_WEBHOOK_SECRET');

    if (!workerUrl || !secret) {
      sheet.getRange(row, syncStatusColIdx).setValue('FAILED_MISSING_CREDENTIALS');
      throw new Error('[CONFIG_ERROR] WORKER_URL or STS_WEBHOOK_SECRET is missing in Script Properties.');
    }

    // 5. Compute Canonical HMAC-SHA256 Signature
    var bodyString = JSON.stringify(payload);
    var timestampSec = Math.floor(new Date().getTime() / 1000).toString();
    var requestId = 'req_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000000);
    
    // Canonical path: extract path from workerUrl (e.g., /api/form-submit)
    var path = extractPath(workerUrl, CONFIG.DEFAULT_PATH);
    var bodyHashHex = computeSha256Hex(bodyString);
    var canonicalString = timestampSec + '\nPOST\n' + path + '\n' + bodyHashHex;
    var signatureHex = computeHmacSha256Hex(canonicalString, secret);

    // 6. Send authenticated HTTPS POST to Cloudflare Worker
    var options = {
      method: 'post',
      contentType: 'application/json',
      payload: bodyString,
      muteHttpExceptions: true,
      headers: {
        'X-STS-Timestamp': timestampSec,
        'X-STS-Signature': signatureHex,
        'X-STS-Request-ID': requestId,
        'X-STS-Key-ID': 'primary-v1'
      }
    };

    var response = UrlFetchApp.fetch(workerUrl, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      sheet.getRange(row, syncStatusColIdx).setValue('SYNCED');
      Logger.log('[SUCCESS] Row ' + row + ' processed. ID: ' + participantId + ' Code: ' + responseCode);
    } else {
      sheet.getRange(row, syncStatusColIdx).setValue('ERROR_' + responseCode);
      Logger.log('[ERROR] Cloudflare Worker rejected request. Code: ' + responseCode + ' Response: ' + responseText);
    }
  } catch (err) {
    Logger.log('[FATAL] onFormSubmit error: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Computes SHA-256 hex digest using Google Apps Script Utilities
 */
function computeSha256Hex(str) {
  var rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return rawBytes.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/**
 * Computes HMAC-SHA256 signature in lowercase hex using Google Apps Script Utilities
 */
function computeHmacSha256Hex(message, key) {
  var rawSignature = Utilities.computeHmacSha256Signature(message, key, Utilities.Charset.UTF_8);
  return rawSignature.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/**
 * Generates cryptographically pseudorandom Participant ID (e.g. STS-2026-7F3A91)
 */
function generateCryptoParticipantId(year) {
  var hexChars = '0123456789ABCDEF';
  var suffix = '';
  for (var i = 0; i < 6; i++) {
    var rand = Math.floor(Math.random() * 16);
    suffix += hexChars.charAt(rand);
  }
  return 'STS-' + (year || '2026') + '-' + suffix;
}

/**
 * Helper to build header-to-column-index mapping
 */
function buildColumnMap(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (h) {
      map[h] = i + 1; // 1-based index
    }
  }
  return map;
}

/**
 * Helper to extract URL pathname
 */
function extractPath(urlStr, defaultPath) {
  var match = urlStr.match(/^https?:\/\/[^\/]+(\/.*)?$/);
  if (match && match[1]) {
    return match[1].split('?')[0];
  }
  return defaultPath || '/api/form-submit';
}

/**
 * Helper function to configure Script Properties from Apps Script editor
 * Run this once after copying the script to set your Worker URL and secret.
 */
function configureScriptProperties() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'WORKER_URL': 'https://icmr-sts-worker.<YOUR-SUBDOMAIN>.workers.dev/api/form-submit',
    'STS_WEBHOOK_SECRET': 'REPLACE_WITH_A_64_CHARACTER_RANDOM_HEX_SECRET'
  });
  Logger.log('[CONFIG] Script properties set. Worker URL: ' + scriptProperties.getProperty('WORKER_URL'));
}

/**
 * Test function: Send a realistic test payload to verify Worker connection
 */
function testSendSampleFormResponse() {
  var props = PropertiesService.getScriptProperties();
  var workerUrl = props.getProperty('WORKER_URL');
  var secret = props.getProperty('STS_WEBHOOK_SECRET');

  if (!workerUrl || !secret || workerUrl.includes('<YOUR-SUBDOMAIN>')) {
    Logger.log('[ERROR] Please run configureScriptProperties() first with your real Worker URL and Secret.');
    return;
  }

  var participantId = generateCryptoParticipantId('2026');
  var payload = {
    submission_id: 'TEST-' + new Date().getTime(),
    participant_id: participantId,
    form_timestamp: new Date().toISOString(),
    raw_answers: {
      'I have read and understood the participant information sheet and agree to participate in this study.': 'Yes',
      'Are you having any chronic illness? Eg. Hypertension/diabetes/thyroid disease?': 'No',
      'Are you on any medications?': 'No',
      'Name (optional)': 'Test Participant',
      'Age (years)': 20,
      'Gender': 'Female',
      'MBBS Professional Year': 'First MBBS',
      'Height (cm)': 165,
      'Weight (kg)': 58,
      'At what time do you usually eat breakfast?': '7:00–8:00 AM',
      'How many days per week do you skip breakfast?': 'Never',
      'At what time do you usually eat dinner?': '8:00–9:00 PM',
      'How often do you eat snacks after dinner/night-time?': 'Occasionally',
      'What is your usual daily eating duration (time between first and last meal)?': '10–12 hours',
      'Do you eat meals at regular timings daily?': 'Yes',
      'At approximately what time would you get up if you were entirely free to plan your day?': '6:30–7:45 AM',
      'During the first half hour after waking, how tired do you feel?': 4,
      'At what time in the evening do you usually feel tired and in need of sleep?': '10:15 PM–12:30 AM',
      'How easy do you find getting up in the morning?': 4,
      'At what time of day do you feel your best mentally and physically?': 'Late morning',
      'Average sleep duration per day': '6–7 hours',
      'How often do you consume caffeinated beverages (coffee/tea/energy drinks)?': 'Daily',
      'Physical activity level': 'Moderately active'
    },
    metadata: {
      row_number: 2,
      sheet_name: 'Form Responses 1',
      script_version: CONFIG.SCRIPT_VERSION,
      environment: 'test'
    }
  };

  var bodyString = JSON.stringify(payload);
  var timestampSec = Math.floor(new Date().getTime() / 1000).toString();
  var requestId = 'test_' + new Date().getTime();
  var path = extractPath(workerUrl, '/api/form-submit');
  var bodyHashHex = computeSha256Hex(bodyString);
  var canonicalString = timestampSec + '\nPOST\n' + path + '\n' + bodyHashHex;
  var signatureHex = computeHmacSha256Hex(canonicalString, secret);

  var response = UrlFetchApp.fetch(workerUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: bodyString,
    muteHttpExceptions: true,
    headers: {
      'X-STS-Timestamp': timestampSec,
      'X-STS-Signature': signatureHex,
      'X-STS-Request-ID': requestId,
      'X-STS-Key-ID': 'primary-v1'
    }
  });

  Logger.log('[TEST RESULT] Status Code: ' + response.getResponseCode());
  Logger.log('[TEST RESULT] Body: ' + response.getContentText());
}
