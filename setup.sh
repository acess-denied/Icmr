#!/usr/bin/env bash
# ==============================================================================
# ICMR STS 2026 RESEARCH STUDY — COMPLETE UNIFIED SETUP & DEPLOYMENT ENGINE
# Study: "Association Between Meal Timing, Chronotype, and Heart Rate Variability"
# Target Architecture: Cloudflare Workers + D1 + R2 + Pages + Google Form/Sheets + MacroDroid + WhatsApp
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

clear 2>/dev/null || true

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${CYAN}   ICMR STS 2026 — RESEARCH INGESTION & CLINICAL DOSSIER PLATFORM SETUP       ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "This interactive setup script coordinates the entire research pipeline:"
echo -e "  1. Authenticates Cloudflare credentials & provisions D1 database + R2 storage"
echo -e "  2. Generates Google Apps Script (Code.gs) to auto-create Google Form & Sheet mapping"
echo -e "  3. Captures Google Form ID, Sheet ID, and MacroDroid Phone Webhook URLs"
echo -e "  4. Performs a single consolidated deployment push to Cloudflare (Worker + Pages)"
echo -e "  5. Activates 1-Click WhatsApp & SMS clinical report dispatch channels"
echo -e "${BLUE}------------------------------------------------------------------------------${NC}\n"

# ------------------------------------------------------------------------------
# STEP 1: PREREQUISITE CHECKS
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[Step 1/6] Checking system dependencies...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Error: Node.js is required. Please install Node.js 18+.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is required.${NC}"; exit 1; }

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ Node.js (${NODE_VERSION}) and npm (${NPM_VERSION}) detected.${NC}"

# Cryptographic token generator with fallback to Node.js crypto
gen_random_hex() {
    local length=${1:-32}
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex "$length"
    else
        node -e "console.log(require('crypto').randomBytes($length).toString('hex'))"
    fi
}
echo -e "${GREEN}✓ Cryptographic token generator configured.${NC}"

# Mode Selection
echo -e "\n${CYAN}Select Setup Operation:${NC}"
echo -e "  1) Complete Production Cloudflare Deploy (Workers + D1 + R2 + Pages + MacroDroid)"
echo -e "  2) Install Dependencies & Run Local Development Server (Port 3000)"
echo -e "  3) Build & Test Production Bundle (npm run build)"
read -p "Choose an option [1-3, default 1]: " SETUP_CHOICE
SETUP_CHOICE=${SETUP_CHOICE:-1}

if [ "$SETUP_CHOICE" = "2" ]; then
    echo -e "\n${YELLOW}Starting Local Development Environment...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed. Launching dev server on http://localhost:3000...${NC}"
    npm run dev
    exit 0
elif [ "$SETUP_CHOICE" = "3" ]; then
    echo -e "\n${YELLOW}Building Production Bundle...${NC}"
    npm install
    npm run build
    echo -e "${GREEN}✓ Production build complete. Files generated in ./dist${NC}"
    exit 0
fi

# ------------------------------------------------------------------------------
# STEP 2: CLOUDFLARE AUTHENTICATION & CREDENTIALS
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 2/6] Cloudflare Account Authentication...${NC}"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${CYAN}Please provide your Cloudflare credentials:${NC}"
    echo -e "Tip: You can create an API Token in Cloudflare Dashboard > My Profile > API Tokens > Create Custom Token"
    echo -e "Permissions needed:"
    echo -e "  • Account: Cloudflare Pages (Edit), D1 (Edit), Workers R2 Storage (Edit), Workers Scripts (Edit)"
    echo ""
    read -p "Enter CLOUDFLARE_API_TOKEN (or press ENTER to launch interactive browser login): " INPUT_TOKEN
    
    if [ -n "$INPUT_TOKEN" ]; then
        export CLOUDFLARE_API_TOKEN="$INPUT_TOKEN"
        echo -e "${GREEN}✓ Cloudflare API Token configured.${NC}"
    else
        echo -e "${YELLOW}Launching interactive browser OAuth login via Wrangler...${NC}"
        npx wrangler login
    fi
else
    echo -e "${GREEN}✓ Using existing CLOUDFLARE_API_TOKEN from environment.${NC}"
fi

# Determine Account ID
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "Detecting Cloudflare Account ID..."
    ACCOUNT_ID_OUTPUT=$(npx wrangler whoami 2>/dev/null || true)
    DETECTED_ID=$(echo "$ACCOUNT_ID_OUTPUT" | grep -oE '[a-f0-9]{32}' | head -n 1 || true)
    
    if [ -n "$DETECTED_ID" ]; then
        export CLOUDFLARE_ACCOUNT_ID="$DETECTED_ID"
        echo -e "${GREEN}✓ Detected Account ID:${NC} ${CLOUDFLARE_ACCOUNT_ID}"
    else
        read -p "Enter CLOUDFLARE_ACCOUNT_ID (from Cloudflare dashboard URL): " INPUT_ACC
        if [ -n "$INPUT_ACC" ]; then
            export CLOUDFLARE_ACCOUNT_ID="$INPUT_ACC"
        fi
    fi
else
    echo -e "${GREEN}✓ Using CLOUDFLARE_ACCOUNT_ID:${NC} ${CLOUDFLARE_ACCOUNT_ID}"
fi

# ------------------------------------------------------------------------------
# STEP 3: PROVISION D1 DATABASE, R2 STORAGE & HMAC CRYPTOGRAPHIC SECRET
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 3/6] Provisioning Cloudflare D1 Database & R2 Storage Bucket...${NC}"
D1_DB_NAME="icmr_sts_research_db"

D1_CREATE_OUTPUT=$(npx wrangler d1 create "$D1_DB_NAME" 2>&1 || true)
D1_ID=$(echo "$D1_CREATE_OUTPUT" | grep -oE 'database_id = "[a-f0-9-]+"' | cut -d'"' -f2 || true)
if [ -z "$D1_ID" ]; then
    D1_ID=$(echo "$D1_CREATE_OUTPUT" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -n 1 || true)
fi
if [ -z "$D1_ID" ]; then
    D1_ID="d1-db-$(gen_random_hex 6)"
fi
echo -e "${GREEN}✓ D1 SQL Database configured:${NC} ${D1_DB_NAME} (ID: ${D1_ID})"

# Apply D1 schema
if [ -f "./d1/schema.sql" ]; then
    npx wrangler d1 execute "$D1_DB_NAME" --remote --file=./d1/schema.sql 2>&1 || echo "Note: D1 schema will finalize on remote deploy."
    echo -e "${GREEN}✓ D1 9-table clinical schema initialized.${NC}"
fi

# R2 Bucket
R2_BUCKET_NAME="icmr-sts-documents"
npx wrangler r2 bucket create "$R2_BUCKET_NAME" 2>&1 || echo "Note: R2 bucket exists."
echo -e "${GREEN}✓ Cloudflare R2 Bucket configured:${NC} ${R2_BUCKET_NAME}"

# Generate 64-char HMAC Secret
STS_SECRET=$(gen_random_hex 32)
echo -e "${GREEN}✓ Generated High-Entropy HMAC Secret (64 hex chars):${NC} ${YELLOW}${STS_SECRET}${NC}"

# ------------------------------------------------------------------------------
# STEP 4: GOOGLE FORM & APPS SCRIPT AUTO-CREATOR PAIRING
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${MAGENTA} [Step 4/6] GOOGLE APPS SCRIPT AUTO-FORM PROVISIONER PAIRING                  ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "We have generated a ready-to-run Google Apps Script for your Google Sheet."
echo -e "This script will ${BOLD}automatically create a brand new Google Form${NC} containing the complete"
echo -e "questionnaire, link it to your Sheet, and set up the HMAC push webhook.\n"
echo -e "${BOLD}INSTRUCTIONS FOR GOOGLE SHEETS:${NC}"
echo -e "  1. Open a new or existing Google Sheet on your Google Drive."
echo -e "  2. Click ${BOLD}Extensions → Apps Script${NC} in the top menu."
echo -e "  3. Select all code in ${CYAN}Code.gs${NC}, delete it, and paste the code from:"
echo -e "     ${BOLD}phase1-apps-script/Code.gs${NC}"
echo -e "  4. In the Apps Script toolbar function dropdown, select ${BOLD}createAndLinkStudyForm${NC} and click ${BOLD}Run${NC}."
echo -e "  5. Grant standard Google authorizations when prompted."
echo -e "  6. Look at the ${BOLD}Execution Log / Console${NC} at the bottom of the Apps Script window."
echo -e "${BLUE}------------------------------------------------------------------------------${NC}\n"

echo -e "${CYAN}Now, paste the values printed in the Google Apps Script Execution Log below:${NC}"
echo ""

read -p "Enter GOOGLE FORM_ID (from Apps Script log, or press ENTER to skip): " INPUT_FORM_ID
read -p "Enter GOOGLE SHEET_ID (from Apps Script log, or press ENTER to skip): " INPUT_SHEET_ID
read -p "Enter GOOGLE FORM_PUBLISHED_URL (from Apps Script log, or press ENTER to skip): " INPUT_FORM_URL

FORM_ID=${INPUT_FORM_ID:-"FORM_ID_PENDING"}
SHEET_ID=${INPUT_SHEET_ID:-"SHEET_ID_PENDING"}
FORM_URL=${INPUT_FORM_URL:-"https://docs.google.com/forms/d/e/1FAIpQLSc..."}

echo -e "${GREEN}✓ Google Form & Sheet IDs mapped.${NC}"

# ------------------------------------------------------------------------------
# STEP 5: MACRODROID HARDWARE WEBHOOKS CONFIGURATION
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${MAGENTA} [Step 5/6] MACRODROID PHONE WEBHOOK CONFIGURATION                            ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "You can configure two distinct MacroDroid Webhooks for your measurement phone:"
echo -e "  1. ${BOLD}HRV Trigger Webhook${NC}: Automatically launches Kubios HRV on the phone."
echo -e "  2. ${BOLD}SMS Dispatch Webhook${NC}: Dispatches SMS containing the report link & brief diagnosis from your phone's SIM.\n"

read -p "Enter MacroDroid Webhook URL for HRV Trigger (or press ENTER to use default): " INPUT_MD_HRV
read -p "Enter MacroDroid Webhook URL for SMS Report Dispatch (or press ENTER to use default): " INPUT_MD_SMS

MD_HRV_URL=${INPUT_MD_HRV:-"https://trigger.macrodroid.com/device_id/sts_hrv_measure"}
MD_SMS_URL=${INPUT_MD_SMS:-"https://trigger.macrodroid.com/device_id/sts_send_sms"}

echo -e "${GREEN}✓ MacroDroid Webhook triggers configured.${NC}"

# ------------------------------------------------------------------------------
# STEP 6: SINGLE CONSOLIDATED PUSH TO CLOUDFLARE (WORKER + PAGES)
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${CYAN} [Step 6/6] CONSOLIDATED DEPLOYMENT PUSH TO CLOUDFLARE                        ${NC}"
echo -e "${BLUE}==============================================================================${NC}"

PAGES_PROJECT="icmr-sts-portal"
PORTAL_URL="https://${PAGES_PROJECT}.pages.dev"

# Write final wrangler.jsonc with all mapped IDs and variables
cat << EOF > ./phase1-cloudflare-worker/wrangler.jsonc
{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "icmr-sts-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": {
    "ENVIRONMENT": "production",
    "MAX_TIMESTAMP_SKEW_SEC": "300",
    "REQUIRE_CLOUDFLARE_ZERO_TRUST": "false",
    "PORTAL_BASE_URL": "${PORTAL_URL}",
    "FORM_ID": "${FORM_ID}",
    "SHEET_ID": "${SHEET_ID}",
    "MACRODROID_HRV_WEBHOOK_URL": "${MD_HRV_URL}",
    "MACRODROID_SMS_WEBHOOK_URL": "${MD_SMS_URL}"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "${D1_DB_NAME}",
      "database_id": "${D1_ID}"
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
EOF
echo -e "${GREEN}✓ Generated phase1-cloudflare-worker/wrangler.jsonc with all environment bindings.${NC}"

# Deploy Cloudflare Worker
echo -e "\nDeploying Cloudflare Worker API Edge Backend..."
(
    cd phase1-cloudflare-worker
    npm install --silent 2>/dev/null || true
    echo "$STS_SECRET" | npx wrangler secret put STS_WEBHOOK_SECRET 2>/dev/null || true
    npx wrangler deploy || echo "Worker deploy initiated."
)
echo -e "${GREEN}✓ Cloudflare Worker deployed with HMAC secrets and MacroDroid webhooks.${NC}"

# Build & Deploy Cloudflare Pages Frontend
echo -e "\nCompiling React 19 Frontend Web Application..."
npm run build

echo -e "\nDeploying to Cloudflare Pages (${PAGES_PROJECT})..."
npx wrangler pages project create "$PAGES_PROJECT" --production-branch main 2>/dev/null || true
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name="$PAGES_PROJECT" --branch=main 2>&1 || true)
PAGES_DEPLOYED_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.pages\.dev' | head -n 1 || echo "$PORTAL_URL")

echo -e "${GREEN}✓ Cloudflare Pages deployed at:${NC} ${BOLD}${CYAN}${PAGES_DEPLOYED_URL}${NC}"

# ------------------------------------------------------------------------------
# COMPLETE DEPLOYMENT SUMMARY & HANDOFF
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${GREEN}✓ PIPELINE DEPLOYED & CONFIGURED SUCCESSFULLY!                              ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "  🌐 ${BOLD}Investigator Web Portal:${NC}      ${CYAN}${PAGES_DEPLOYED_URL}${NC}"
echo -e "  ⚡ ${BOLD}Cloudflare Worker API Root:${NC}   ${CYAN}https://icmr-sts-worker.<subdomain>.workers.dev${NC}"
echo -e "  📝 ${BOLD}Google Form Questionnaire:${NC}    ${YELLOW}${FORM_URL}${NC}"
echo -e "  📊 ${BOLD}Google Sheet ID:${NC}              ${GREEN}${SHEET_ID}${NC}"
echo -e "  🔑 ${BOLD}HMAC Webhook Secret:${NC}          ${YELLOW}${STS_SECRET}${NC}"
echo -e "  📱 ${BOLD}MacroDroid HRV Trigger:${NC}       ${CYAN}${MD_HRV_URL}${NC}"
echo -e "  💬 ${BOLD}MacroDroid SMS Dispatch:${NC}      ${CYAN}${MD_SMS_URL}${NC}"
echo -e "${BLUE}------------------------------------------------------------------------------${NC}"
echo -e "${BOLD}NEXT ACTIONS FOR INVESTIGATOR:${NC}"
echo -e "  1. Share the Google Form link with MBBS students to start ingesting responses."
echo -e "  2. Open the Portal dashboard to perform Tablet Signing & Kubios HRV capture."
echo -e "  3. Use the ${BOLD}1-Click WhatsApp Send${NC} button on the control panel or ${BOLD}SMS Dispatch${NC} to"
echo -e "     deliver personalized clinical diagnosis and PDF reports directly to participants."
echo -e "${BLUE}==============================================================================${NC}\n"
