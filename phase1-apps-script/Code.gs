/**
 * ICMR STS 2026 Research Study — Google Apps Script Master Engine
 *
 * Automates:
 *  1. One-Click Creation of Fresh Google Form with Complete Research Questionnaire
 *  2. Automatic Linking of Form Responses to Active Google Sheet
 *  3. Automatic Installation of "On form submit" Event Triggers
 *  4. Canonical HMAC-SHA256 Payload Signing & Dispatch to Cloudflare Worker Edge API
 *  5. 2-Way Sync (Writes back unique STS Participant ID, Sync Status, and Report URLs)
 *
 * Execution Steps in Google Sheets:
 *  - Open your Google Sheet > Extensions > Apps Script
 *  - Paste this entire code into Code.gs
 *  - Run createAndLinkStudyForm() to automatically create form & setup sheet
 *  - Copy the printed IDs/URLs into your setup.sh or Webhook settings
 */

var CONFIG = {
  STUDY_TITLE: "ICMR STS 2026: Meal Timing, Chronotype & Heart Rate Variability",
  STUDY_SUBTITLE: "Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students",
  SCRIPT_VERSION: "2.0.0-full-pipeline",
  DEFAULT_PATH: "/api/form-submit",
  HEADER_PARTICIPANT_ID: "STS Participant ID",
  HEADER_SYNC_STATUS: "STS Sync Status",
  HEADER_SYNC_TIME: "STS Sync Timestamp",
  HEADER_REPORT_URL: "STS Participant Report URL"
};

/**
 * MASTER SETUP FUNCTION:
 * Run this function once from the Apps Script Editor toolbar.
 * It builds the fresh Google Form, links it to this Sheet, installs the trigger,
 * and prints out all the IDs and URLs to the Execution Log!
 */
function createAndLinkStudyForm() {
  Logger.log("===============================================================");
  Logger.log("  ICMR STS 2026 RESEARCH FORM & SHEET AUTO-PROVISIONER         ");
  Logger.log("===============================================================");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var sheetId = ss.getId();

  // 1. Create a fresh Google Form
  var formTitle = "ICMR STS 2026: Chrononutrition & HRV Research Questionnaire";
  var form = FormApp.create(formTitle);
  var formId = form.getId();

  form.setTitle(formTitle);
  form.setDescription(
    "Indian Council of Medical Research (ICMR) — STS 2026\n" +
    "Department of Physiology | Ethics Approval Ref: IEC/STS/2026/042\n\n" +
    "This research questionnaire assesses socio-demographics, meal timings, morningness-eveningness chronotype (rMEQ), and lifestyle factors.\n" +
    "Your responses are de-identified under Good Clinical Practice (GCP) guidelines. Your mobile number will be used solely to deliver your personalized clinical HRV and chronobiology report."
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false);

  // Section 1: Informed Consent Confirmation
  form.addSectionHeaderItem()
    .setTitle("SECTION 1: INFORMED PARTICIPANT CONSENT")
    .setHelpText("Please confirm that you have been briefed about this physiological research study.");
  
  form.addMultipleChoiceItem()
    .setTitle("I have read and understood the participant information sheet and voluntarily agree to participate in this study.")
    .setChoiceValues(["Yes, I agree", "No, I decline"])
    .setRequired(true);

  // Section 2: Contact & Identification
  form.addSectionHeaderItem()
    .setTitle("SECTION 2: PARTICIPANT DETAILS & REPORT DELIVERY")
    .setHelpText("Your mobile number is used to dispatch your personalized clinical HRV report and diagnosis.");

  form.addTextItem()
    .setTitle("Participant Full Name (Optional / Confidential)")
    .setRequired(false);

  form.addTextItem()
    .setTitle("Mobile Number / WhatsApp (Required for receiving your Clinical HRV Report & PDF link)")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("MBBS Professional Year / Batch")
    .setChoiceValues(["First MBBS", "Second MBBS", "Third MBBS (Part 1)", "Third MBBS (Part 2) / Final"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Age (completed years)")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Gender")
    .setChoiceValues(["Male", "Female", "Other / Prefer not to say"])
    .setRequired(true);

  // Section 3: Anthropometry
  form.addSectionHeaderItem()
    .setTitle("SECTION 3: ANTHROPOMETRIC MEASUREMENTS")
    .setHelpText("Measurements will be verified during laboratory recording for Asian-Indian BMI calculation.");

  form.addTextItem()
    .setTitle("Height (in centimeters, e.g. 172.5)")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Weight (in kilograms, e.g. 68.0)")
    .setRequired(true);

  // Section 4: Chrononutrition & Meal Timing
  form.addSectionHeaderItem()
    .setTitle("SECTION 4: CHRONONUTRITION & MEAL TIMING PATTERNS")
    .setHelpText("Report your habitual eating timings over the past 4 weeks.");

  form.addMultipleChoiceItem()
    .setTitle("At what time do you usually eat breakfast?")
    .setChoiceValues(["Before 7:00 AM", "7:00 AM – 8:00 AM", "8:00 AM – 9:00 AM", "9:00 AM – 10:00 AM", "After 10:00 AM / Skip"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("How many days per week do you skip breakfast?")
    .setChoiceValues(["Never / 0 days", "1–2 days / week", "3–4 days / week", "5–6 days / week", "Daily / 7 days"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("At what time do you usually eat dinner?")
    .setChoiceValues(["Before 7:30 PM", "7:30 PM – 8:30 PM", "8:30 PM – 9:30 PM", "9:30 PM – 10:30 PM", "After 10:30 PM"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("How often do you consume food or snacks after 10:00 PM (Late-night snacking)?")
    .setChoiceValues(["Never / Rarely (<1 day/week)", "1–2 days / week", "3–4 days / week", "Almost daily (5–7 days/week)"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("What is your usual daily eating window (interval between first and last meal)?")
    .setChoiceValues(["< 10 hours", "10 – 12 hours", "12 – 14 hours", "> 14 hours"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Do you eat meals at regular timings from day to day?")
    .setChoiceValues(["Always regular", "Regular on most days", "Irregular on most days", "Highly erratic / Shift-based"])
    .setRequired(true);

  // Section 5: Reduced Morningness-Eveningness Questionnaire (rMEQ)
  form.addSectionHeaderItem()
    .setTitle("SECTION 5: REDUCED MORNINGNESS-EVENINGNESS (rMEQ) SCALE")
    .setHelpText("Standardized 5-item scale to assess biological circadian chronotype.");

  form.addMultipleChoiceItem()
    .setTitle("1. Considering only your own 'feeling best' rhythm, at what time would you get up if you were entirely free to plan your day?")
    .setChoiceValues([
      "5:00 AM – 6:30 AM (Score 5)",
      "6:30 AM – 7:45 AM (Score 4)",
      "7:45 AM – 9:45 AM (Score 3)",
      "9:45 AM – 11:00 AM (Score 2)",
      "11:00 AM – 12:00 Noon (Score 1)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("2. During the first half hour after waking in the morning, how tired do you feel?")
    .setChoiceValues([
      "Very tired (Score 1)",
      "Fairly tired (Score 2)",
      "Fairly refreshed (Score 3)",
      "Very refreshed (Score 4)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("3. At what time in the evening do you feel tired and in need of sleep?")
    .setChoiceValues([
      "8:00 PM – 9:00 PM (Score 5)",
      "9:00 PM – 10:15 PM (Score 4)",
      "10:15 PM – 12:30 AM (Score 3)",
      "12:30 AM – 1:45 AM (Score 2)",
      "1:45 AM – 3:00 AM (Score 1)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("4. At what time of day do you think that you reach your 'feeling best' peak?")
    .setChoiceValues([
      "5:00 AM – 8:00 AM (Score 5)",
      "8:00 AM – 10:00 AM (Score 4)",
      "10:00 AM – 5:00 PM (Score 3)",
      "5:00 PM – 10:00 PM (Score 2)",
      "10:00 PM – 5:00 AM (Score 1)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("5. One hears about 'morning' and 'evening' types of people. Which one of these types do you consider yourself to be?")
    .setChoiceValues([
      "Definitely a 'morning' type (Score 6)",
      "Rather more a 'morning' than an 'evening' type (Score 4)",
      "Rather more an 'evening' than a 'morning' type (Score 2)",
      "Definitely an 'evening' type (Score 0)"
    ])
    .setRequired(true);

  // Section 6: Sleep & Confounders
  form.addSectionHeaderItem()
    .setTitle("SECTION 6: SLEEP DURATION & CARDIOVASCULAR CONFOUNDERS")
    .setHelpText("Screening factors that influence autonomic cardiac tone.");

  form.addMultipleChoiceItem()
    .setTitle("Average nocturnal sleep duration on college nights")
    .setChoiceValues(["< 5 hours", "5 – 6 hours", "6 – 7 hours", "7 – 8 hours", "> 8 hours"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("How often do you consume caffeinated beverages (tea/coffee/energy drinks)?")
    .setChoiceValues(["None / Rarely", "1 cup / day", "2–3 cups / day", "4+ cups / day"])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Habitual physical activity level")
    .setChoiceValues([
      "Sedentary (< 60 min/week)",
      "Mild active (60–150 min/week)",
      "Moderate active (150–300 min/week)",
      "Vigorous / Athlete (> 300 min/week)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Do you have any diagnosed chronic cardiovascular/endocrine illness or regular medications?")
    .setChoiceValues(["No, none (Healthy)", "Yes, on medication (Will be evaluated by PI)"])
    .setRequired(true);

  // 2. Link Form Destination to Active Google Sheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheetId);

  // 3. Setup Tracking Columns in Sheet
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var lastCol = sheet.getLastColumn();

  var colMap = buildColumnMap(headers);
  if (!colMap[CONFIG.HEADER_PARTICIPANT_ID]) {
    lastCol++;
    sheet.getRange(1, lastCol).setValue(CONFIG.HEADER_PARTICIPANT_ID);
  }
  if (!colMap[CONFIG.HEADER_SYNC_STATUS]) {
    lastCol++;
    sheet.getRange(1, lastCol).setValue(CONFIG.HEADER_SYNC_STATUS);
  }
  if (!colMap[CONFIG.HEADER_SYNC_TIME]) {
    lastCol++;
    sheet.getRange(1, lastCol).setValue(CONFIG.HEADER_SYNC_TIME);
  }
  if (!colMap[CONFIG.HEADER_REPORT_URL]) {
    lastCol++;
    sheet.getRange(1, lastCol).setValue(CONFIG.HEADER_REPORT_URL);
  }

  // 4. Install Form Submit Trigger
  installSubmitTrigger();

  // 5. Output All Details to Execution Log
  var formEditUrl = form.getEditUrl();
  var formPublishedUrl = form.getPublishedUrl();

  Logger.log("\n>>> SUCCESS: GOOGLE FORM CREATED & LINKED! <<<");
  Logger.log("FORM_ID: " + formId);
  Logger.log("FORM_EDIT_URL: " + formEditUrl);
  Logger.log("FORM_PUBLISHED_URL: " + formPublishedUrl);
  Logger.log("SHEET_ID: " + sheetId);
  Logger.log("SHEET_URL: " + ss.getUrl());
  Logger.log("TRIGGER_STATUS: onFormSubmit Trigger Installed Successfully");
  Logger.log("===============================================================");
  Logger.log("NEXT STEPS:");
  Logger.log("1. Copy the FORM_ID and SHEET_ID printed above.");
  Logger.log("2. Paste them into your setup.sh script or Dashboard Google Sync Hub.");
  Logger.log("3. Run configureScriptProperties() with your Cloudflare Worker URL.");
  Logger.log("===============================================================\n");

  return {
    formId: formId,
    formEditUrl: formEditUrl,
    formPublishedUrl: formPublishedUrl,
    sheetId: sheetId,
    sheetUrl: ss.getUrl()
  };
}

/**
 * Installs the installable "On form submit" trigger if not already present
 */
function installSubmitTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onFormSubmit") {
      Logger.log("[TRIGGER] 'onFormSubmit' trigger is already active.");
      return;
    }
  }
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();
  Logger.log("[TRIGGER] Installed new 'onFormSubmit' trigger successfully.");
}

/**
 * Trigger handler for Google Sheets Form Submit event
 */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lockErr) {
    Logger.log('[WARN] Lock wait timeout, continuing...');
  }

  try {
    var sheet = e && e.range ? e.range.getSheet() : SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var row = e && e.range ? e.range.getRow() : sheet.getLastRow();

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    var colMap = buildColumnMap(headers);

    var participantIdColIdx = colMap[CONFIG.HEADER_PARTICIPANT_ID];
    var syncStatusColIdx = colMap[CONFIG.HEADER_SYNC_STATUS];
    var syncTimeColIdx = colMap[CONFIG.HEADER_SYNC_TIME];
    var reportUrlColIdx = colMap[CONFIG.HEADER_REPORT_URL];

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
    if (syncTimeColIdx === undefined) {
      syncTimeColIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, syncTimeColIdx).setValue(CONFIG.HEADER_SYNC_TIME);
      colMap[CONFIG.HEADER_SYNC_TIME] = syncTimeColIdx;
    }
    if (reportUrlColIdx === undefined) {
      reportUrlColIdx = sheet.getLastColumn() + 1;
      sheet.getRange(1, reportUrlColIdx).setValue(CONFIG.HEADER_REPORT_URL);
      colMap[CONFIG.HEADER_REPORT_URL] = reportUrlColIdx;
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

    // 2. Read questionnaire responses dynamically
    var rawAnswers = {};
    for (var i = 0; i < headers.length; i++) {
      var headerName = String(headers[i]).trim();
      if (headerName && 
          headerName !== CONFIG.HEADER_PARTICIPANT_ID && 
          headerName !== CONFIG.HEADER_SYNC_STATUS &&
          headerName !== CONFIG.HEADER_SYNC_TIME &&
          headerName !== CONFIG.HEADER_REPORT_URL) {
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
    var portalBaseUrl = props.getProperty('PORTAL_BASE_URL') || 'https://icmr-sts-portal.pages.dev';

    var reportUrl = portalBaseUrl + '/#report-' + participantId;
    sheet.getRange(row, reportUrlColIdx).setValue(reportUrl);

    if (!workerUrl || !secret) {
      sheet.getRange(row, syncStatusColIdx).setValue('FAILED_MISSING_CREDENTIALS');
      Logger.log('[WARN] Worker URL or STS_WEBHOOK_SECRET missing in Script Properties.');
      return;
    }

    // 5. Compute Canonical HMAC-SHA256 Signature
    var bodyString = JSON.stringify(payload);
    var timestampSec = Math.floor(new Date().getTime() / 1000).toString();
    var requestId = 'req_' + new Date().getTime() + '_' + Math.floor(Math.random() * 1000000);
    
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

    if (responseCode >= 200 && responseCode < 300) {
      sheet.getRange(row, syncStatusColIdx).setValue('SYNCED');
      sheet.getRange(row, syncTimeColIdx).setValue(new Date().toISOString());
      Logger.log('[SUCCESS] Row ' + row + ' processed. ID: ' + participantId + ' Code: ' + responseCode);
    } else {
      sheet.getRange(row, syncStatusColIdx).setValue('ERROR_' + responseCode);
      Logger.log('[ERROR] Worker rejected payload. Code: ' + responseCode + ' Response: ' + response.getContentText());
    }
  } catch (err) {
    Logger.log('[FATAL] onFormSubmit error: ' + err.toString());
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Configure Script Properties for Worker endpoint and secret
 */
function configureScriptProperties() {
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'WORKER_URL': 'https://icmr-sts-worker.<YOUR-SUBDOMAIN>.workers.dev/api/form-submit',
    'STS_WEBHOOK_SECRET': 'REPLACE_WITH_YOUR_64_CHAR_HEX_SECRET',
    'PORTAL_BASE_URL': 'https://icmr-sts-portal.pages.dev'
  });
  Logger.log('[CONFIG] Script properties configured successfully.');
}

/**
 * Cryptographic helpers
 */
function computeSha256Hex(str) {
  var rawBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str, Utilities.Charset.UTF_8);
  return rawBytes.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function computeHmacSha256Hex(message, key) {
  var rawSignature = Utilities.computeHmacSha256Signature(message, key, Utilities.Charset.UTF_8);
  return rawSignature.map(function(byte) {
    var v = (byte < 0 ? byte + 256 : byte).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function generateCryptoParticipantId(year) {
  var hexChars = '0123456789ABCDEF';
  var suffix = '';
  for (var i = 0; i < 6; i++) {
    var rand = Math.floor(Math.random() * 16);
    suffix += hexChars.charAt(rand);
  }
  return 'STS-' + (year || '2026') + '-' + suffix;
}

function buildColumnMap(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    if (h) {
      map[h] = i + 1;
    }
  }
  return map;
}

function extractPath(urlStr, defaultPath) {
  var match = urlStr.match(/^https?:\/\/[^\/]+(\/.*)?$/);
  if (match && match[1]) {
    return match[1].split('?')[0];
  }
  return defaultPath || '/api/form-submit';
}
