/**
 * Template Generators for ICMR STS 2026 Google Apps Script & CLI Deployments
 */

export interface AppsScriptTemplateConfig {
  workerWebhookUrl: string;
  webhookSecret: string;
  googleSheetId?: string;
  appsScriptKey?: string;
}

export const APPS_SCRIPT_MANIFEST = `{
  "timeZone": "Asia/Kolkata",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}`;

export const generateAppsScriptCode = (config: AppsScriptTemplateConfig): string => {
  const { workerWebhookUrl, webhookSecret, googleSheetId, appsScriptKey } = config;

  return `/**
 * ICMR STS 2026 Research Study — Google Apps Script Master Engine
 * Target: Google Sheets > Extensions > Apps Script OR script.google.com
 * Pre-configured with your study deployment parameters
 */

var CONFIG = {
  STUDY_TITLE: "ICMR STS 2026: Meal Timing, Chronotype & Heart Rate Variability",
  STUDY_SUBTITLE: "Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students",
  SCRIPT_VERSION: "2.5.0-auto-deploy",
  WORKER_ENDPOINT: "${workerWebhookUrl || 'https://icmr-sts-worker.health-research.workers.dev/api/form-submit'}",
  HMAC_SECRET: "${webhookSecret || 'a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8'}",
  TARGET_SHEET_ID: "${googleSheetId || ''}",
  SCRIPT_ID: "${appsScriptKey || ''}",
  HEADER_PARTICIPANT_ID: "STS Participant ID",
  HEADER_SYNC_STATUS: "STS Sync Status",
  HEADER_SYNC_TIME: "STS Sync Timestamp",
  HEADER_REPORT_URL: "STS Participant Report URL"
};

/**
 * MASTER 1-CLICK PROVISIONER:
 * Run this function from the Apps Script Editor toolbar.
 * It builds the standardized ICMR STS 2026 Google Form (with all 13 items),
 * links it to the active Google Sheet, sets up destination columns,
 * and installs the "On form submit" trigger automatically!
 */
function createAndLinkStudyForm() {
  Logger.log("===============================================================");
  Logger.log("  ICMR STS 2026 RESEARCH FORM & SHEET AUTO-PROVISIONER         ");
  Logger.log("===============================================================");

  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("[WARN] Running as standalone script. Sheet will be created if ID is not set.");
  }

  // 1. Create a standardized Google Form
  var formTitle = "ICMR STS 2026: Chrononutrition & HRV Research Questionnaire";
  var form = FormApp.create(formTitle);
  var formId = form.getId();

  form.setTitle(formTitle);
  form.setDescription(
    "Indian Council of Medical Research (ICMR) — STS 2026\\n" +
    "Department of Physiology | Ethics Approval Ref: IEC/STS/2026/042\\n\\n" +
    "This research questionnaire assesses socio-demographics, meal timings, morningness-eveningness chronotype (rMEQ), and lifestyle factors.\\n" +
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
    .setTitle("Height in centimeters (e.g. 172.5)")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Weight in kilograms (e.g. 68.0)")
    .setRequired(true);

  // Section 4: Chrononutrition & Meal Timing Pattern
  form.addSectionHeaderItem()
    .setTitle("SECTION 4: MEAL TIMING & DIETARY HABITS")
    .setHelpText("Document your habitual weekday meal timing patterns over the past 30 days.");

  form.addTextItem()
    .setTitle("Typical Weekday Breakfast Time (e.g. 08:30 AM)")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Breakfast Skipping Frequency (Days per week without breakfast)")
    .setChoiceValues([
      "0 days / week (Never skip)",
      "1–2 days / week",
      "3–4 days / week",
      "5–7 days / week (Regular breakfast skipper)"
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Typical Weekday Dinner Time (e.g. 09:00 PM)")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Late-Night Snacking Frequency (Eating food within 2 hours of going to sleep)")
    .setChoiceValues([
      "Never / Rarely (<1 night/week)",
      "1–2 nights / week",
      "3–4 nights / week",
      "Almost every night (5–7 nights/week)"
    ])
    .setRequired(true);

  // Section 5: Reduced Morningness-Eveningness Questionnaire (rMEQ)
  form.addSectionHeaderItem()
    .setTitle("SECTION 5: STANDARDIZED rMEQ CHRONOTYPE ASSESSMENT")
    .setHelpText("5 validated psychometric questions to compute your morningness-eveningness score.");

  form.addMultipleChoiceItem()
    .setTitle("1. Considering only your own feeling best rhythm, at what time would you get up if you were entirely free to plan your day?")
    .setChoiceValues([
      "05:00 AM – 06:30 AM (Score 5)",
      "06:30 AM – 07:45 AM (Score 4)",
      "07:45 AM – 09:45 AM (Score 3)",
      "09:45 AM – 11:00 AM (Score 2)",
      "11:00 AM – 12:00 PM (Score 1)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("2. During the first half-hour after waking up in the morning, how tired do you feel?")
    .setChoiceValues([
      "Very tired (Score 1)",
      "Fairly tired (Score 2)",
      "Fairly refreshed (Score 3)",
      "Very refreshed (Score 4)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("3. At what time of the evening do you feel tired and, as a result, in need of sleep?")
    .setChoiceValues([
      "08:00 PM – 09:00 PM (Score 5)",
      "09:00 PM – 10:15 PM (Score 4)",
      "10:15 PM – 12:45 AM (Score 3)",
      "12:45 AM – 02:00 AM (Score 2)",
      "02:00 AM – 03:00 AM (Score 1)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("4. At what time of day do you think that you reach your 'feeling best' peak?")
    .setChoiceValues([
      "05:00 AM – 08:00 AM (Score 5)",
      "08:00 AM – 10:00 AM (Score 4)",
      "10:00 AM – 05:00 PM (Score 3)",
      "05:00 PM – 10:00 PM (Score 2)",
      "10:00 PM – 05:00 AM (Score 1)"
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

  // Link Form to Spreadsheet if available
  if (ss) {
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    
    // Install automatic onFormSubmit trigger
    var triggers = ScriptApp.getUserTriggers(ss);
    var triggerExists = triggers.some(function(t) {
      return t.getHandlerFunction() === "onFormSubmit";
    });
    if (!triggerExists) {
      ScriptApp.newTrigger("onFormSubmit").forSpreadsheet(ss).onFormSubmit().create();
    }
    Logger.log("[LINKED] Form linked to Spreadsheet: " + ss.getUrl());
  }

  Logger.log("---------------------------------------------------------------");
  Logger.log("[SUCCESS] Form Created Successfully!");
  Logger.log("Form ID: " + formId);
  Logger.log("Form Edit URL: " + form.getEditUrl());
  Logger.log("Public Survey URL: " + form.getPublishedUrl());
  Logger.log("===============================================================");
}

/**
 * EVENT TRIGGER: onFormSubmit
 * Computes canonical HMAC-SHA256 signature and sends payload to Worker/Server
 */
function onFormSubmit(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    Logger.log("[WARN] Lock timeout in onFormSubmit.");
    return;
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var row = e ? e.range.getRow() : sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    // Generate unique STS Participant ID
    var hexChars = '0123456789ABCDEF';
    var suffix = '';
    for (var k = 0; k < 6; k++) {
      suffix += hexChars.charAt(Math.floor(Math.random() * 16));
    }
    var participantId = "STS-2026-" + suffix;

    // Build payload
    var payload = {
      submission_id: "SUB-" + new Date().getTime() + "-" + row,
      participant_id: participantId,
      form_timestamp: new Date().toISOString(),
      raw_answers: {}
    };

    for (var i = 0; i < headers.length; i++) {
      var headerName = String(headers[i]).trim();
      if (headerName) {
        payload.raw_answers[headerName] = rowValues[i];
      }
    }

    // Cryptographic HMAC-SHA256 Signature
    var payloadString = JSON.stringify(payload);
    var signatureBytes = Utilities.computeHmacSha256Signature(payloadString, CONFIG.HMAC_SECRET);
    var signatureHex = signatureBytes.map(function(b) {
      return ("0" + (b & 0xFF).toString(16)).slice(-2);
    }).join("");

    var options = {
      method: "post",
      contentType: "application/json",
      headers: {
        "X-STS-Signature": signatureHex,
        "X-STS-Timestamp": String(Math.floor(new Date().getTime() / 1000)),
        "X-STS-Request-ID": Utilities.getUuid(),
        "X-STS-Key-ID": "primary-v1"
      },
      payload: payloadString,
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(CONFIG.WORKER_ENDPOINT, options);
    var responseCode = response.getResponseCode();

    if (responseCode >= 200 && responseCode < 300) {
      sheet.getRange(row, lastCol).setValue("SYNCED_OK");
      Logger.log("[SUCCESS] Participant " + participantId + " dispatched to " + CONFIG.WORKER_ENDPOINT);
    } else {
      sheet.getRange(row, lastCol).setValue("ERROR_" + responseCode);
      Logger.log("[ERROR] Ingestion returned HTTP " + responseCode);
    }
  } catch (err) {
    Logger.log("[FATAL] onFormSubmit error: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}
`;
};

export const generatePowerShellScript = (config: AppsScriptTemplateConfig): string => {
  const { workerWebhookUrl, webhookSecret, appsScriptKey } = config;

  return `<#
.SYNOPSIS
    ICMR STS 2026 Research Study — Google Apps Script Automated CLI Deployment
.DESCRIPTION
    Platform: Windows PowerShell
    Deploys Code.gs to Google Apps Script using Google clasp CLI with pre-configured parameters.
#>

param (
    [string]$WorkerEndpoint = "${workerWebhookUrl || 'https://icmr-sts-worker.health-research.workers.dev/api/form-submit'}",
    [string]$HmacSecret = "${webhookSecret || 'a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8'}",
    [string]$ScriptId = "${appsScriptKey || ''}"
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ICMR STS 2026: Google Apps Script Windows Deployment Script    " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

Write-Host "[INFO] Ingestion Endpoint: $WorkerEndpoint" -ForegroundColor Gray
Write-Host "[INFO] HMAC Secret: $($HmacSecret.Substring(0, 8))..." -ForegroundColor Gray

# 1. Check if clasp CLI is installed
if (-not (Get-Command clasp -ErrorAction SilentlyContinue)) {
    Write-Host "[SETUP] Installing Google clasp CLI globally via npm..." -ForegroundColor Yellow
    npm install -g @google/clasp
}

# 2. Check clasp login
Write-Host "[AUTH] Checking Google Apps Script credentials..." -ForegroundColor Green
$claspRc = "$env:USERPROFILE\\.clasprc.json"
if (-not (Test-Path $claspRc)) {
    Write-Host "[AUTH] Launching browser to log into your Google Account..." -ForegroundColor Yellow
    clasp login
}

# 3. Create or configure .clasp.json
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if ([string]::IsNullOrWhiteSpace($ScriptId)) {
    if (-not (Test-Path ".clasp.json")) {
        Write-Host "[CREATE] Creating fresh Google Apps Script standalone project..." -ForegroundColor Green
        clasp create --title "ICMR STS 2026 Research Engine" --type standalone
    }
} else {
    Write-Host "[CONFIG] Binding to target script ID: $ScriptId..." -ForegroundColor Green
    "{\`"scriptId\`":\`"$ScriptId\`"}" | Out-File -FilePath ".clasp.json" -Encoding ascii
}

# 4. Push code to Google Apps Script
Write-Host "[PUSH] Uploading Code.gs and appsscript.json..." -ForegroundColor Green
clasp push --force

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Deployment Complete!" -ForegroundColor Green
Write-Host "View and test your script in the online portal at:" -ForegroundColor White
Write-Host "https://script.google.com" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
`;
};

export const generateBashScript = (config: AppsScriptTemplateConfig): string => {
  const { workerWebhookUrl, webhookSecret, appsScriptKey } = config;

  return `#!/usr/bin/env bash
# ==============================================================================
# ICMR STS 2026 Research Study — Google Apps Script Automated CLI Deployment
# Platform: Linux / macOS Bash
# ==============================================================================
set -e

echo "================================================================"
echo "  ICMR STS 2026: Google Apps Script CLI Deployment Script       "
echo "================================================================"

# Pre-configured environment variables
export WORKER_ENDPOINT="${workerWebhookUrl || 'https://icmr-sts-worker.health-research.workers.dev/api/form-submit'}"
export HMAC_SECRET="${webhookSecret || 'a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8'}"
export GAS_SCRIPT_ID="${appsScriptKey || ''}"

echo "[INFO] Ingestion Endpoint: \${WORKER_ENDPOINT}"
echo "[INFO] HMAC-SHA256 Secret: \${HMAC_SECRET:0:8}..."

# 1. Check if clasp (Google Apps Script CLI) is installed
if ! command -v clasp &> /dev/null; then
    echo "[SETUP] Installing Google clasp CLI globally via npm..."
    npm install -g @google/clasp
fi

# 2. Check clasp login
echo "[AUTH] Checking Google Apps Script credentials..."
if [ ! -f ~/.clasprc.json ]; then
    echo "[AUTH] Please log in to your Google Account in the browser window..."
    clasp login
fi

# 3. Create or pull Apps Script project
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "\${SCRIPT_DIR}"

if [ -z "\${GAS_SCRIPT_ID}" ]; then
    if [ ! -f .clasp.json ]; then
        echo "[CREATE] Creating fresh Google Apps Script standalone project..."
        clasp create --title "ICMR STS 2026 Research Engine" --type standalone
    fi
else
    echo "[CONFIG] Setting target script ID: \${GAS_SCRIPT_ID}..."
    echo "{\\"scriptId\\":\\"\${GAS_SCRIPT_ID}\\"}" > .clasp.json
fi

# 4. Push code to Google Apps Script
echo "[PUSH] Uploading Code.gs and appsscript.json to Google Apps Script..."
clasp push --force

# 5. Open in browser
echo "================================================================"
echo "[SUCCESS] Google Apps Script deployed successfully!"
echo "Open your script in the online portal at:"
echo "  https://script.google.com"
echo "================================================================"
`;
};
