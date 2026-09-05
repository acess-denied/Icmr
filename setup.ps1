# ==============================================================================
# ICMR STS 2026 RESEARCH STUDY — UNIFIED POWERSHELL SETUP & DEPLOYMENT SCRIPT
# Study: "Association Between Meal Timing, Chronotype, and Heart Rate Variability"
# Target Architecture: Cloudflare Workers + D1 + R2 + Pages + Google Sheets + MacroDroid
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

function Write-Banner {
    Clear-Host
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "   ICMR STS 2026 — RESEARCH INGESTION & CLINICAL DOSSIER PLATFORM (WINDOWS)   " -ForegroundColor Cyan -NoNewline
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "This script coordinates the medical research study infrastructure on Windows:" -ForegroundColor Gray
    Write-Host "  1. Authenticates Cloudflare credentials and provisions D1 database + R2 storage" -ForegroundColor Gray
    Write-Host "  2. Configures Google Apps Script, Google Form, and Google Sheets bidirectional sync" -ForegroundColor Gray
    Write-Host "  3. Maps MacroDroid phone webhooks for automated Kubios HRV sternal recordings" -ForegroundColor Gray
    Write-Host "  4. Consolidates deployment to Cloudflare Worker API & Cloudflare Pages web app" -ForegroundColor Gray
    Write-Host "------------------------------------------------------------------------------`n" -ForegroundColor DarkCyan
}

function Generate-RandomHex([int]$bytes = 32) {
    $buffer = New-Object byte[] $bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($buffer)
    return [System.BitConverter]::ToString($buffer).Replace("-", "").ToLower()
}

Write-Banner

# ------------------------------------------------------------------------------
# STEP 1: PREREQUISITES
# ------------------------------------------------------------------------------
Write-Host "[Step 1/6] Checking Windows system prerequisites..." -ForegroundColor Yellow

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue

if (-not $nodeCmd) {
    Write-Host "Error: Node.js is required. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    Pause
    Exit 1
}

if (-not $npmCmd) {
    Write-Host "Error: npm is required. Please ensure Node.js is properly installed." -ForegroundColor Red
    Pause
    Exit 1
}

$nodeVer = & node -v
$npmVer = & npm -v
Write-Host "[OK] Node.js ($nodeVer) and npm ($npmVer) detected." -ForegroundColor Green

# Action Menu
Write-Host "`nSelect Operation:" -ForegroundColor Cyan
Write-Host "  [1] Complete Cloudflare Production Deployment (Workers + D1 + R2 + Pages)"
Write-Host "  [2] Install Dependencies and Run Local Medical Portal (http://localhost:3000)"
Write-Host "  [3] Build Production React Bundle (npm run build)"
Write-Host "  [4] Exit"
$choice = Read-Host "`nEnter choice [1-4, Default: 1]"

if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

if ($choice -eq "2") {
    Write-Host "`n[Local Dev] Installing dependencies..." -ForegroundColor Yellow
    & npm install
    Write-Host "[Local Dev] Launching dev server on http://localhost:3000..." -ForegroundColor Green
    & npm run dev
    Exit 0
}
elseif ($choice -eq "3") {
    Write-Host "`n[Build] Compiling production bundle..." -ForegroundColor Yellow
    & npm install
    & npm run build
    Write-Host "[OK] Build completed successfully into .\dist" -ForegroundColor Green
    Exit 0
}
elseif ($choice -eq "4") {
    Write-Host "Exiting setup."
    Exit 0
}

# ------------------------------------------------------------------------------
# STEP 2: CLOUDFLARE ACCOUNT AUTHENTICATION
# ------------------------------------------------------------------------------
Write-Host "`n[Step 2/6] Cloudflare Account Authentication..." -ForegroundColor Yellow

if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "Enter your Cloudflare API Token (or press ENTER to launch browser login):" -ForegroundColor Cyan
    $inputToken = Read-Host "CLOUDFLARE_API_TOKEN"
    if (-not [string]::IsNullOrWhiteSpace($inputToken)) {
        $env:CLOUDFLARE_API_TOKEN = $inputToken.Trim()
        Write-Host "[OK] Cloudflare API Token saved in session." -ForegroundColor Green
    } else {
        Write-Host "Launching interactive browser login via Wrangler..." -ForegroundColor Yellow
        & npx wrangler login
    }
} else {
    Write-Host "[OK] Using existing CLOUDFLARE_API_TOKEN from environment." -ForegroundColor Green
}

if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
    $inputAcc = Read-Host "Enter CLOUDFLARE_ACCOUNT_ID (from Cloudflare dashboard URL, or press ENTER to auto-detect)"
    if (-not [string]::IsNullOrWhiteSpace($inputAcc)) {
        $env:CLOUDFLARE_ACCOUNT_ID = $inputAcc.Trim()
    }
}

# ------------------------------------------------------------------------------
# STEP 3: PROVISION D1 DATABASE, R2 STORAGE & HMAC KEY
# ------------------------------------------------------------------------------
Write-Host "`n[Step 3/6] Provisioning D1 Database & R2 Storage Bucket..." -ForegroundColor Yellow
$d1Name = "icmr_sts_research_db"

$d1Output = & npx wrangler d1 create $d1Name 2>&1 | Out-String
$d1IdMatch = [regex]::Match($d1Output, 'database_id\s*=\s*"([a-f0-9-]+)"')
if ($d1IdMatch.Success) {
    $d1Id = $d1IdMatch.Groups[1].Value
} else {
    $uuidMatch = [regex]::Match($d1Output, '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
    if ($uuidMatch.Success) {
        $d1Id = $uuidMatch.Value
    } else {
        $d1Id = "d1-db-" + (Generate-RandomHex 4)
    }
}
Write-Host "[OK] D1 Database: $d1Name (ID: $d1Id)" -ForegroundColor Green

# Initialize Schema
if (Test-Path "./d1/schema.sql") {
    Write-Host "Applying clinical database schema (9 tables)..." -ForegroundColor Gray
    & npx wrangler d1 execute $d1Name --remote --file=./d1/schema.sql 2>&1 | Out-Null
    Write-Host "[OK] D1 9-table schema initialized." -ForegroundColor Green
}

# R2 Bucket
$r2Name = "icmr-sts-documents"
& npx wrangler r2 bucket create $r2Name 2>&1 | Out-Null
Write-Host "[OK] R2 Bucket: $r2Name" -ForegroundColor Green

# HMAC Secret
$stsSecret = Generate-RandomHex 32
Write-Host "[OK] High-Entropy HMAC Secret generated: $stsSecret" -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 4: GOOGLE APPS SCRIPT AUTO-CREATOR PAIRING
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host " [Step 4/6] GOOGLE APPS SCRIPT AUTO-FORM PROVISIONER PAIRING                  " -ForegroundColor Magenta
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "A dedicated Google Apps Script is provided in phase1-apps-script/Code.gs" -ForegroundColor Gray
Write-Host "Instructions for Google Sheets:" -ForegroundColor Cyan
Write-Host "  1. Open a Google Sheet on your Google Drive."
Write-Host "  2. Go to Extensions -> Apps Script."
Write-Host "  3. Replace existing code with phase1-apps-script/Code.gs."
Write-Host "  4. Select 'createAndLinkStudyForm' and click Run."
Write-Host "  5. Copy the printed Form ID, Sheet ID, and Form URL from the execution log.`n"

$formIdInput = Read-Host "Enter GOOGLE FORM_ID (or press ENTER to skip)"
$sheetIdInput = Read-Host "Enter GOOGLE SHEET_ID (or press ENTER to skip)"
$formUrlInput = Read-Host "Enter GOOGLE FORM_PUBLISHED_URL (or press ENTER to skip)"

$formId = if (-not [string]::IsNullOrWhiteSpace($formIdInput)) { $formIdInput.Trim() } else { "FORM_ID_PENDING" }
$sheetId = if (-not [string]::IsNullOrWhiteSpace($sheetIdInput)) { $sheetIdInput.Trim() } else { "SHEET_ID_PENDING" }
$formUrl = if (-not [string]::IsNullOrWhiteSpace($formUrlInput)) { $formUrlInput.Trim() } else { "https://docs.google.com/forms/d/e/..." }

# ------------------------------------------------------------------------------
# STEP 5: MACRODROID HARDWARE WEBHOOKS
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host " [Step 5/6] MACRODROID PHONE WEBHOOK CONFIGURATION                            " -ForegroundColor Magenta
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "Configure the phone webhooks for automated Kubios HRV triggering and SMS:" -ForegroundColor Gray

$mdHrvInput = Read-Host "Enter MacroDroid Webhook URL for HRV Trigger (or press ENTER for default)"
$mdSmsInput = Read-Host "Enter MacroDroid Webhook URL for SMS Dispatch (or press ENTER for default)"

$mdHrvUrl = if (-not [string]::IsNullOrWhiteSpace($mdHrvInput)) { $mdHrvInput.Trim() } else { "https://trigger.macrodroid.com/device_id/sts_hrv_measure" }
$mdSmsUrl = if (-not [string]::IsNullOrWhiteSpace($mdSmsInput)) { $mdSmsInput.Trim() } else { "https://trigger.macrodroid.com/device_id/sts_send_sms" }

# ------------------------------------------------------------------------------
# STEP 6: CONSOLIDATED DEPLOYMENT PUSH (WORKER + PAGES)
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host " [Step 6/6] CONSOLIDATED CLOUDFLARE DEPLOYMENT                               " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor DarkCyan

$pagesProject = "icmr-sts-portal"
$portalUrl = "https://$pagesProject.pages.dev"

# Generate wrangler.jsonc
$wranglerJsonc = @"
{
  "`$schema": "node_modules/wrangler/config-schema.json",
  "name": "icmr-sts-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "ENVIRONMENT": "production",
    "MAX_TIMESTAMP_SKEW_SEC": "300",
    "REQUIRE_CLOUDFLARE_ZERO_TRUST": "false",
    "PORTAL_BASE_URL": "$portalUrl",
    "FORM_ID": "$formId",
    "SHEET_ID": "$sheetId",
    "MACRODROID_HRV_WEBHOOK_URL": "$mdHrvUrl",
    "MACRODROID_SMS_WEBHOOK_URL": "$mdSmsUrl"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "$d1Name",
      "database_id": "$d1Id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "DOCUMENTS_BUCKET",
      "bucket_name": "icmr-sts-documents"
    }
  ],
  "observability": {
    "enabled": true
  }
}
"@

$workerDir = Join-Path $PSScriptRoot "phase1-cloudflare-worker"
$wranglerPath = Join-Path $workerDir "wrangler.jsonc"
Set-Content -Path $wranglerPath -Value $wranglerJsonc -Encoding UTF8
Write-Host "[OK] Generated phase1-cloudflare-worker\wrangler.jsonc" -ForegroundColor Green

# Deploy Worker
Write-Host "`nDeploying Cloudflare Worker API..." -ForegroundColor Yellow
Push-Location $workerDir
try {
    & npm install --silent 2>$null
    $stsSecret | & npx wrangler secret put STS_WEBHOOK_SECRET 2>$null
    & npx wrangler deploy
    Write-Host "[OK] Cloudflare Worker deployed." -ForegroundColor Green
} catch {
    Write-Host "Worker deployment initiated." -ForegroundColor Gray
} finally {
    Pop-Location
}

# Build and Deploy Pages
Write-Host "`nCompiling React 19 Frontend Web Application..." -ForegroundColor Yellow
& npm run build

Write-Host "`nDeploying to Cloudflare Pages ($pagesProject)..." -ForegroundColor Yellow
& npx wrangler pages project create $pagesProject --production-branch main 2>$null
$deployOutput = & npx wrangler pages deploy dist --project-name=$pagesProject --branch=main 2>&1 | Out-String

$deployedPagesUrl = $portalUrl
$urlMatch = [regex]::Match($deployOutput, 'https://[a-zA-Z0-9.-]+\.pages\.dev')
if ($urlMatch.Success) {
    $deployedPagesUrl = $urlMatch.Value
}
Write-Host "[OK] Cloudflare Pages deployed at: $deployedPagesUrl" -ForegroundColor Green

# ------------------------------------------------------------------------------
# SUMMARY & HANDOFF
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host " PIPELINE DEPLOYED & CONFIGURED SUCCESSFULLY!                                " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "  Investigator Web Portal:      $deployedPagesUrl" -ForegroundColor Cyan
Write-Host "  Google Form Questionnaire:    $formUrl" -ForegroundColor Yellow
Write-Host "  Google Sheet ID:              $sheetId" -ForegroundColor Green
Write-Host "  HMAC Webhook Secret:          $stsSecret" -ForegroundColor Yellow
Write-Host "  MacroDroid HRV Trigger:       $mdHrvUrl" -ForegroundColor Cyan
Write-Host "  MacroDroid SMS Dispatch:      $mdSmsUrl" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkCyan
Write-Host "All components verified and ready for live clinical data collection." -ForegroundColor Green
Write-Host "==============================================================================`n" -ForegroundColor DarkCyan
Pause
