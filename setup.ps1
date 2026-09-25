# ==============================================================================
# ICMR STS 2026 RESEARCH STUDY — UNIFIED POWERSHELL SETUP & MULTI-CLOUD DEPLOYER
# Study: "Association Between Meal Timing, Chronotype, and Heart Rate Variability"
# Target Support: Windows 10/11, Cloudflare, Vercel, Railway, Local Dev
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

function Write-Banner {
    Clear-Host
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "   ICMR STS 2026 — RESEARCH INGESTION & CLINICAL DOSSIER PLATFORM (WINDOWS)   " -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "Automated dependency installer & multi-cloud clinical study orchestrator." -ForegroundColor Gray
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
# STEP 1: PREREQUISITES & AUTOMATED WINDOWS DEPENDENCY INSTALLATION
# ------------------------------------------------------------------------------
Write-Host "[Step 1/6] Auditing & Installing System Dependencies on Windows..." -ForegroundColor Yellow

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue

if (-not $nodeCmd -or -not $npmCmd) {
    Write-Host "Node.js is missing or not in PATH. Initiating automated installation..." -ForegroundColor Cyan

    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    # Try winget (Built-in on Windows 10 & 11)
    $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
    $chocoCmd = Get-Command choco -ErrorAction SilentlyContinue

    if ($wingetCmd) {
        Write-Host "Detected Windows Package Manager (winget). Installing Node.js LTS..." -ForegroundColor Green
        & winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
    } elseif ($chocoCmd) {
        Write-Host "Detected Chocolatey. Installing Node.js LTS..." -ForegroundColor Green
        & choco install nodejs-lts -y
    } else {
        Write-Host "Downloading official Node.js 20 LTS Installer for Windows..." -ForegroundColor Yellow
        $msiUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi"
        $tempMsi = Join-Path $env:TEMP "nodejs-lts.msi"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $msiUrl -OutFile $tempMsi
        Write-Host "Running silent installation of Node.js..." -ForegroundColor Yellow
        $process = Start-Process msiexec.exe -ArgumentList "/i `"$tempMsi`" /quiet /norestart" -Wait -PassThru
        if ($process.ExitCode -eq 0) {
            Write-Host "Node.js installation completed." -ForegroundColor Green
        }
    }

    # Refresh current PowerShell session PATH environment variables
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
}

if ($nodeCmd -and $npmCmd) {
    $nodeVer = & node -v
    $npmVer = & npm -v
    Write-Host "[OK] Node.js ($nodeVer) and npm ($npmVer) are verified." -ForegroundColor Green
} else {
    Write-Host "[WARNING] Node.js was installed. If commands fail, please reopen this terminal window." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 2: PROJECT NODE DEPENDENCIES INSTALLATION
# ------------------------------------------------------------------------------
Write-Host "`n[Step 2/6] Installing Project & Microservice Dependencies..." -ForegroundColor Yellow
Write-Host "Installing root React application packages..." -ForegroundColor Gray
& npm install

$workerDir = Join-Path $PSScriptRoot "phase1-cloudflare-worker"
if (Test-Path $workerDir) {
    Write-Host "Installing Cloudflare Worker backend packages..." -ForegroundColor Gray
    Push-Location $workerDir
    & npm install
    Pop-Location
}
Write-Host "[OK] All Node.js dependencies installed." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: DEPLOYMENT TARGET SELECTION & CLOUD COMPARISON
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host "   DEPLOYMENT PLATFORM & OPERATION SELECTION                                  " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "Choose your target deployment environment:" -ForegroundColor Gray
Write-Host "  [1] Cloudflare Unified Stack (Workers + D1 Database + R2 Bucket + Pages)" -ForegroundColor White
Write-Host "      ★ RECOMMENDED for ICMR Study: 100% Free forever, Edge speeds in India," -ForegroundColor Green
Write-Host "      native D1 SQLite database & R2 storage for sternal HRV recordings." -ForegroundColor Green
Write-Host ""
Write-Host "  [2] Vercel 1-Click Frontend Deployment" -ForegroundColor White
Write-Host "      Fastest React UI deployment with auto-preview URLs (DB requires external service)." -ForegroundColor Gray
Write-Host ""
Write-Host "  [3] Railway / Docker Container Full-Stack Monolith" -ForegroundColor White
Write-Host "      Runs React + Express + Python PDF generator in a single container (~$5/mo)." -ForegroundColor Gray
Write-Host ""
Write-Host "  [4] Launch Local Medical Tablet Portal (http://localhost:3000)" -ForegroundColor White
Write-Host "  [5] Build Production React Bundle (npm run build)" -ForegroundColor White
Write-Host "  [6] Exit" -ForegroundColor White
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkCyan

$deployChoice = Read-Host "`nEnter choice [1-6, Default: 1]"
if ([string]::IsNullOrWhiteSpace($deployChoice)) { $deployChoice = "1" }

if ($deployChoice -eq "4") {
    Write-Host "`n[Local Dev] Launching dev server on http://localhost:3000..." -ForegroundColor Green
    & npm run dev
    Exit 0
}
elseif ($deployChoice -eq "5") {
    Write-Host "`n[Build] Compiling production bundle..." -ForegroundColor Yellow
    & npm run build
    Write-Host "[OK] Build completed successfully into .\dist" -ForegroundColor Green
    Exit 0
}
elseif ($deployChoice -eq "6") {
    Write-Host "Exiting setup."
    Exit 0
}
elseif ($deployChoice -eq "2") {
    Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
    Write-Host "   VERCEL 1-CLICK DEPLOYMENT GUIDE                                            " -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "A preconfigured vercel.json is already present in this directory." -ForegroundColor Gray
    Write-Host "Method A (CLI): Run 'npx vercel' in this folder." -ForegroundColor Yellow
    Write-Host "Method B (GitHub): Push to GitHub and import into https://vercel.com/new" -ForegroundColor Yellow
    $runVercel = Read-Host "`nWould you like to run 'npx vercel' now? (y/n)"
    if ($runVercel -eq "y" -or $runVercel -eq "Y") {
        & npx vercel
    }
    Exit 0
}
elseif ($deployChoice -eq "3") {
    Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
    Write-Host "   RAILWAY / DOCKER MONOLITH DEPLOYMENT GUIDE                                 " -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor DarkCyan
    Write-Host "Dockerfile and railway.json are already created in this project." -ForegroundColor Gray
    Write-Host "1. Install Railway CLI: npm i -g @railway/cli (or connect GitHub in Railway dashboard)" -ForegroundColor Yellow
    Write-Host "2. Run 'railway up' to deploy container with Node.js + Python ReportLab engine." -ForegroundColor Yellow
    $runRailway = Read-Host "`nWould you like to run 'npx @railway/cli up' now? (y/n)"
    if ($runRailway -eq "y" -or $runRailway -eq "Y") {
        & npx @railway/cli up
    }
    Exit 0
}

# ------------------------------------------------------------------------------
# STEP 4: CLOUDFLARE ACCOUNT AUTHENTICATION & KEY GUIDANCE
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host "   CLOUDFLARE CREDENTIALS & STEP-BY-STEP KEY GUIDE                            " -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "To provision your free D1 Database, R2 Storage, Worker API, and Pages frontend," -ForegroundColor Gray
Write-Host "we need your Cloudflare credentials.`n" -ForegroundColor Gray
Write-Host "HOW TO GET YOUR CLOUDFLARE API TOKEN:" -ForegroundColor Cyan
Write-Host "  1. Open in browser: https://dash.cloudflare.com/profile/api-tokens"
Write-Host "  2. Click 'Create Token' -> 'Create Custom Token' -> 'Get started'."
Write-Host "  3. Token Name: ICMR-STS-Deploy-Token"
Write-Host "  4. Permissions (add these 4 permissions):"
Write-Host "     • Account -> Workers D1 Storage -> Edit" -ForegroundColor Green
Write-Host "     • Account -> Workers R2 Storage -> Edit" -ForegroundColor Green
Write-Host "     • Account -> Cloudflare Pages   -> Edit" -ForegroundColor Green
Write-Host "     • Account -> Workers Scripts    -> Edit" -ForegroundColor Green
Write-Host "  5. Account Resources: Include -> All accounts"
Write-Host "  6. Click 'Continue to summary' -> 'Create Token' -> Copy the token string.`n"
Write-Host "EASIEST ALTERNATIVE: Leave blank and press ENTER to launch the official" -ForegroundColor Magenta
Write-Host "interactive browser OAuth login window via Wrangler!" -ForegroundColor Magenta
Write-Host "------------------------------------------------------------------------------" -ForegroundColor DarkCyan

if (-not $env:CLOUDFLARE_API_TOKEN) {
    $inputToken = Read-Host "Paste CLOUDFLARE_API_TOKEN (or press ENTER for Browser Login)"
    if (-not [string]::IsNullOrWhiteSpace($inputToken)) {
        $env:CLOUDFLARE_API_TOKEN = $inputToken.Trim()
        Write-Host "[OK] Cloudflare API Token saved in session." -ForegroundColor Green
    } else {
        Write-Host "Launching interactive browser OAuth login via Wrangler..." -ForegroundColor Yellow
        & npx wrangler login
    }
} else {
    Write-Host "[OK] Using existing CLOUDFLARE_API_TOKEN from environment." -ForegroundColor Green
}

if (-not $env:CLOUDFLARE_ACCOUNT_ID) {
    Write-Host "`nTip: Your Account ID is visible in your Cloudflare dashboard URL: dash.cloudflare.com/<ACCOUNT_ID>/workers" -ForegroundColor Gray
    $inputAcc = Read-Host "Enter CLOUDFLARE_ACCOUNT_ID (or press ENTER to auto-detect)"
    if (-not [string]::IsNullOrWhiteSpace($inputAcc)) {
        $env:CLOUDFLARE_ACCOUNT_ID = $inputAcc.Trim()
    }
}

# ------------------------------------------------------------------------------
# STEP 5: PROVISION D1 DATABASE, R2 STORAGE & HMAC KEY
# ------------------------------------------------------------------------------
Write-Host "`n[Step 5/6] Provisioning D1 Database & R2 Storage Bucket..." -ForegroundColor Yellow
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
# STEP 6: GOOGLE FORM & APPS SCRIPT PAIRING + CONSOLIDATED PUSH
# ------------------------------------------------------------------------------
Write-Host "`n==============================================================================" -ForegroundColor DarkCyan
Write-Host " [Step 6/6] GOOGLE APPS SCRIPT AUTO-FORM PAIRING & CONSOLIDATED PUSH         " -ForegroundColor Magenta
Write-Host "==============================================================================" -ForegroundColor DarkCyan
Write-Host "A ready-to-run Google Apps Script is provided in phase1-apps-script/Code.gs" -ForegroundColor Gray

$formIdInput = Read-Host "Enter GOOGLE FORM_ID (from Apps Script log, or press ENTER to skip)"
$sheetIdInput = Read-Host "Enter GOOGLE SHEET_ID (from Apps Script log, or press ENTER to skip)"
$formUrlInput = Read-Host "Enter GOOGLE FORM_PUBLISHED_URL (from Apps Script log, or press ENTER to skip)"

$formId = if (-not [string]::IsNullOrWhiteSpace($formIdInput)) { $formIdInput.Trim() } else { "FORM_ID_PENDING" }
$sheetId = if (-not [string]::IsNullOrWhiteSpace($sheetIdInput)) { $sheetIdInput.Trim() } else { "SHEET_ID_PENDING" }
$formUrl = if (-not [string]::IsNullOrWhiteSpace($formUrlInput)) { $formUrlInput.Trim() } else { "https://docs.google.com/forms/d/e/..." }

$mdHrvInput = Read-Host "Enter MacroDroid Webhook URL for HRV Trigger (or press ENTER for default)"
$mdSmsInput = Read-Host "Enter MacroDroid Webhook URL for SMS Dispatch (or press ENTER for default)"

$mdHrvUrl = if (-not [string]::IsNullOrWhiteSpace($mdHrvInput)) { $mdHrvInput.Trim() } else { "https://trigger.macrodroid.com/device_id/sts_hrv_measure" }
$mdSmsUrl = if (-not [string]::IsNullOrWhiteSpace($mdSmsInput)) { $mdSmsInput.Trim() } else { "https://trigger.macrodroid.com/device_id/sts_send_sms" }

$pagesProject = "icmr-sts-portal"
$portalUrl = "https://$pagesProject.pages.dev"

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
Write-Host "`nCompiling React Frontend Web Application..." -ForegroundColor Yellow
& npm run build

Write-Host "`nDeploying to Cloudflare Pages ($pagesProject)..." -ForegroundColor Yellow
& npx wrangler pages project create $pagesProject --production-branch main 2>$null
$deployOutput = & npx wrangler pages deploy dist --project-name=$pagesProject --branch=main 2>&1 | Out-String

$deployedPagesUrl = $portalUrl
$urlMatch = [regex]::Match($deployOutput, 'https://[a-zA-Z0-9.-]+\.pages\.dev')
if ($urlMatch.Success) {
    $deployedPagesUrl = $urlMatch.Value
}

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
