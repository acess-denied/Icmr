<#
.SYNOPSIS
    ICMR STS 2026 Research Study — Google Apps Script Automated CLI Deployment
.DESCRIPTION
    Platform: Windows PowerShell
    Deploys Code.gs and appsscript.json to Google Apps Script using clasp
#>

param (
    [string]$WorkerEndpoint = "https://icmr-sts-worker.health-research.workers.dev/api/form-submit",
    [string]$HmacSecret = "a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8",
    [string]$ScriptId = ""
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
$claspRc = "$env:USERPROFILE\.clasprc.json"
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
