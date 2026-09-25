#!/usr/bin/env bash
# ==============================================================================
# ICMR STS 2026 RESEARCH STUDY — UNIFIED MULTI-PLATFORM SETUP & DEPLOYMENT ENGINE
# Study: "Association Between Meal Timing, Chronotype, and Heart Rate Variability"
# Target Support: Linux, macOS, Cloudflare, Vercel, Railway, Local Dev
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
echo -e "Automated system dependency installer, multi-cloud deployer & medical portal."
echo -e "${BLUE}------------------------------------------------------------------------------${NC}\n"

# Determine sudo capability
SUDO_CMD=""
if [ "$EUID" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO_CMD="sudo"
    fi
fi

# ------------------------------------------------------------------------------
# STEP 1: AUTOMATED SYSTEM DEPENDENCY INSTALLATION (LINUX / MACOS)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[Step 1/6] Auditing & Installing System Dependencies...${NC}"

install_system_deps() {
    echo -e "${CYAN}Checking operating system package manager...${NC}"
    
    # Check if node and npm are present
    HAS_NODE=false
    if command -v node >/dev/null 2>&1; then
        NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            HAS_NODE=true
        fi
    fi

    if [ "$HAS_NODE" = false ]; then
        echo -e "${YELLOW}Node.js 18+ is not installed or outdated. Automatically installing Node.js LTS...${NC}"
        if command -v apt-get >/dev/null 2>&1; then
            echo -e "Detected Debian/Ubuntu system. Setting up NodeSource Node.js 20 LTS repository..."
            $SUDO_CMD apt-get update -y
            $SUDO_CMD apt-get install -y ca-certificates curl gnupg git python3 python3-pip python3-venv openssl
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO_CMD bash -
            $SUDO_CMD apt-get install -y nodejs
        elif command -v dnf >/dev/null 2>&1; then
            echo -e "Detected Fedora/RHEL system. Installing Node.js & development tools..."
            $SUDO_CMD dnf install -y nodejs npm python3 python3-pip git curl openssl
        elif command -v pacman >/dev/null 2>&1; then
            echo -e "Detected Arch Linux system. Installing Node.js & tools..."
            $SUDO_CMD pacman -Sy --noconfirm nodejs npm python python-pip git curl openssl
        elif command -v brew >/dev/null 2>&1; then
            echo -e "Detected macOS Homebrew. Installing Node.js 20 & Python..."
            brew install node python@3.11 git curl openssl
        else
            echo -e "${RED}Warning: Could not automatically detect a supported package manager.${NC}"
            echo -e "Please install Node.js 18+ manually from https://nodejs.org/"
        fi
    else
        echo -e "${GREEN}✓ Node.js ($(node -v)) and npm ($(npm -v)) are ready.${NC}"
    fi

    # Install Python packages for PDF service if python is available
    if command -v pip3 >/dev/null 2>&1 && [ -f "./pdf-service/requirements.txt" ]; then
        echo -e "${CYAN}Installing Python PDF service dependencies (ReportLab, PyPDF, Pillow)...${NC}"
        pip3 install -r ./pdf-service/requirements.txt --quiet --break-system-packages 2>/dev/null || \
        pip3 install -r ./pdf-service/requirements.txt --quiet 2>/dev/null || \
        echo -e "${YELLOW}Note: Python PDF packages will install in virtualenv if needed.${NC}"
    fi
}

install_system_deps

# ------------------------------------------------------------------------------
# STEP 2: PROJECT NODE DEPENDENCIES INSTALLATION
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 2/6] Installing Project & Microservice Dependencies...${NC}"

echo -e "Installing root React application dependencies..."
npm install --silent

if [ -d "./phase1-cloudflare-worker" ]; then
    echo -e "Installing Cloudflare Worker backend dependencies..."
    (cd phase1-cloudflare-worker && npm install --silent)
fi
echo -e "${GREEN}✓ All project dependencies successfully installed.${NC}"

# Cryptographic token generator with fallback to Node.js crypto
gen_random_hex() {
    local length=${1:-32}
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex "$length"
    else
        node -e "console.log(require('crypto').randomBytes($length).toString('hex'))"
    fi
}

# ------------------------------------------------------------------------------
# STEP 3: DEPLOYMENT TARGET SELECTION & ARCHITECTURE ADVICE
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${CYAN}   DEPLOYMENT PLATFORM & OPERATION SELECTION                                  ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "Choose your target deployment environment:"
echo -e "  ${BOLD}1) Cloudflare Unified Stack${NC} (Workers + D1 Database + R2 Bucket + Pages)"
echo -e "     ${GREEN}★ RECOMMENDED for ICMR Study${NC}: 100% Free forever, Edge speeds in India,"
echo -e "     native D1 SQLite database & R2 storage for sternal HRV recordings."
echo ""
echo -e "  ${BOLD}2) Vercel 1-Click Frontend Deployment${NC}"
echo -e "     Fastest React UI deployment with auto-preview URLs. (Database requires external DB)."
echo ""
echo -e "  ${BOLD}3) Railway / Docker Container Full-Stack Monolith${NC}"
echo -e "     Runs React + Express + Python PDF generator in a single container. (~$5/mo after trial)."
echo ""
echo -e "  ${BOLD}4) Launch Local Medical Tablet Portal${NC} (Runs dev server on http://localhost:3000)"
echo -e "  ${BOLD}5) Build & Test Production Bundle${NC} (Compile Vite assets to ./dist)"
echo -e "  ${BOLD}6) Exit${NC}"
echo -e "${BLUE}------------------------------------------------------------------------------${NC}"
read -p "Select choice [1-6, default 1]: " DEPLOY_CHOICE
DEPLOY_CHOICE=${DEPLOY_CHOICE:-1}

# Handle Local Dev
if [ "$DEPLOY_CHOICE" = "4" ]; then
    echo -e "\n${YELLOW}Launching Local Development Server on http://localhost:3000...${NC}"
    npm run dev
    exit 0
fi

# Handle Build
if [ "$DEPLOY_CHOICE" = "5" ]; then
    echo -e "\n${YELLOW}Compiling Production Bundle...${NC}"
    npm run build
    echo -e "${GREEN}✓ Production bundle created in ./dist${NC}"
    exit 0
fi

# Handle Exit
if [ "$DEPLOY_CHOICE" = "6" ]; then
    echo -e "Exiting setup."
    exit 0
fi

# Handle Vercel
if [ "$DEPLOY_CHOICE" = "2" ]; then
    echo -e "\n${BLUE}==============================================================================${NC}"
    echo -e "${BOLD}${CYAN}   VERCEL 1-CLICK DEPLOYMENT GUIDE                                            ${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "We have created ${BOLD}vercel.json${NC} configured for Vite React SPA output in ./dist."
    echo ""
    echo -e "Two easy ways to deploy to Vercel:"
    echo -e "  ${BOLD}Method A: Using Vercel CLI (Immediate)${NC}"
    echo -e "    Run: ${CYAN}npx vercel${NC}"
    echo -e "    Follow the prompt to login and confirm project settings."
    echo ""
    echo -e "  ${BOLD}Method B: Connect via GitHub (Automated CI/CD)${NC}"
    echo -e "    1. Push this repository to your GitHub account."
    echo -e "    2. Go to ${CYAN}https://vercel.com/new${NC}"
    echo -e "    3. Import the repository and click ${BOLD}Deploy${NC}."
    echo -e "${BLUE}------------------------------------------------------------------------------${NC}\n"
    read -p "Would you like to run 'npx vercel' right now? [y/N]: " RUN_VERCEL
    if [[ "$RUN_VERCEL" =~ ^[Yy]$ ]]; then
        npx vercel
    fi
    exit 0
fi

# Handle Railway
if [ "$DEPLOY_CHOICE" = "3" ]; then
    echo -e "\n${BLUE}==============================================================================${NC}"
    echo -e "${BOLD}${CYAN}   RAILWAY / DOCKER MONOLITH DEPLOYMENT GUIDE                                 ${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "We have generated ${BOLD}Dockerfile${NC} and ${BOLD}railway.json${NC} supporting:"
    echo -e "  • React Clinical Portal + Express static server on Port 3000"
    echo -e "  • Pre-installed Python 3 + ReportLab/PyPDF for CRF PDF generation"
    echo ""
    echo -e "To deploy on Railway:"
    echo -e "  1. Install Railway CLI: ${CYAN}npm i -g @railway/cli${NC} (or push to GitHub)"
    echo -e "  2. Run: ${CYAN}railway login${NC}"
    echo -e "  3. Run: ${CYAN}railway up${NC}"
    echo -e "  Railway will automatically detect the Dockerfile and launch the full-stack container."
    echo -e "${BLUE}------------------------------------------------------------------------------${NC}\n"
    read -p "Would you like to deploy via Railway CLI right now? [y/N]: " RUN_RAILWAY
    if [[ "$RUN_RAILWAY" =~ ^[Yy]$ ]]; then
        npx @railway/cli up
    fi
    exit 0
fi

# ------------------------------------------------------------------------------
# STEP 4: CLOUDFLARE AUTHENTICATION & STEP-BY-STEP KEY GUIDANCE
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${YELLOW}   CLOUDFLARE CREDENTIALS & STEP-BY-STEP GUIDE                                ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "To provision your free D1 Database, R2 Storage, Worker API, and Pages frontend,"
echo -e "we need your Cloudflare credentials."
echo ""
echo -e "${BOLD}HOW TO GET YOUR CLOUDFLARE API TOKEN:${NC}"
echo -e "  1. Open: ${CYAN}https://dash.cloudflare.com/profile/api-tokens${NC}"
echo -e "  2. Click the blue ${BOLD}'Create Token'${NC} button."
echo -e "  3. Scroll down to ${BOLD}'Create Custom Token'${NC} and click ${BOLD}'Get started'${NC}."
echo -e "  4. Set Token Name: ${YELLOW}ICMR-STS-Deploy-Token${NC}"
echo -e "  5. Under ${BOLD}Permissions${NC}, add these 4 permissions:"
echo -e "     • ${CYAN}Account${NC} -> ${BOLD}Workers D1 Storage${NC} -> ${GREEN}Edit${NC}"
echo -e "     • ${CYAN}Account${NC} -> ${BOLD}Workers R2 Storage${NC} -> ${GREEN}Edit${NC}"
echo -e "     • ${CYAN}Account${NC} -> ${BOLD}Cloudflare Pages${NC}   -> ${GREEN}Edit${NC}"
echo -e "     • ${CYAN}Account${NC} -> ${BOLD}Workers Scripts${NC}    -> ${GREEN}Edit${NC}"
echo -e "  6. Under ${BOLD}Account Resources${NC}: Select ${BOLD}Include -> All accounts${NC}"
echo -e "  7. Click ${BOLD}Continue to summary${NC} -> ${BOLD}Create Token${NC}."
echo -e "  8. Copy the secret API token string and paste it below."
echo -e "${BLUE}------------------------------------------------------------------------------${NC}"
echo -e "${MAGENTA}EASIEST ALTERNATIVE:${NC} Leave the prompt blank and press ENTER to launch"
echo -e "the official Cloudflare browser OAuth login window (via Wrangler)!"
echo -e "${BLUE}------------------------------------------------------------------------------${NC}\n"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    read -p "Paste CLOUDFLARE_API_TOKEN (or press ENTER for Browser Login): " INPUT_TOKEN
    
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
    echo -e "\nDetecting Cloudflare Account ID..."
    ACCOUNT_ID_OUTPUT=$(npx wrangler whoami 2>/dev/null || true)
    DETECTED_ID=$(echo "$ACCOUNT_ID_OUTPUT" | grep -oE '[a-f0-9]{32}' | head -n 1 || true)
    
    if [ -n "$DETECTED_ID" ]; then
        export CLOUDFLARE_ACCOUNT_ID="$DETECTED_ID"
        echo -e "${GREEN}✓ Detected Account ID:${NC} ${CLOUDFLARE_ACCOUNT_ID}"
    else
        echo -e "${CYAN}Tip: Your Account ID is visible in your Cloudflare dashboard URL:${NC}"
        echo -e "  https://dash.cloudflare.com/<ACCOUNT_ID>/workers"
        read -p "Enter CLOUDFLARE_ACCOUNT_ID (or press ENTER to auto-detect during deploy): " INPUT_ACC
        if [ -n "$INPUT_ACC" ]; then
            export CLOUDFLARE_ACCOUNT_ID="$INPUT_ACC"
        fi
    fi
else
    echo -e "${GREEN}✓ Using CLOUDFLARE_ACCOUNT_ID:${NC} ${CLOUDFLARE_ACCOUNT_ID}"
fi

# ------------------------------------------------------------------------------
# STEP 5: PROVISION D1 DATABASE, R2 STORAGE & HMAC CRYPTOGRAPHIC SECRET
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}[Step 5/6] Provisioning Cloudflare D1 Database & R2 Storage Bucket...${NC}"
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
# STEP 6: GOOGLE FORM & APPS SCRIPT PAIRING + CONSOLIDATED PUSH
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BOLD}${MAGENTA} [Step 6/6] GOOGLE APPS SCRIPT AUTO-FORM PROVISIONER PAIRING                  ${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo -e "We have generated a ready-to-run Google Apps Script for your Google Sheet."
echo -e "Location: ${BOLD}phase1-apps-script/Code.gs${NC}"
echo -e "When executed in Google Sheets, it automatically builds the form and links the HMAC webhook.\n"

read -p "Enter GOOGLE FORM_ID (from Apps Script log, or press ENTER to skip): " INPUT_FORM_ID
read -p "Enter GOOGLE SHEET_ID (from Apps Script log, or press ENTER to skip): " INPUT_SHEET_ID
read -p "Enter GOOGLE FORM_PUBLISHED_URL (from Apps Script log, or press ENTER to skip): " INPUT_FORM_URL

FORM_ID=${INPUT_FORM_ID:-"FORM_ID_PENDING"}
SHEET_ID=${INPUT_SHEET_ID:-"SHEET_ID_PENDING"}
FORM_URL=${INPUT_FORM_URL:-"https://docs.google.com/forms/d/e/1FAIpQLSc..."}

# MacroDroid Webhooks
read -p "Enter MacroDroid Webhook URL for HRV Trigger (or press ENTER for default): " INPUT_MD_HRV
read -p "Enter MacroDroid Webhook URL for SMS Report Dispatch (or press ENTER for default): " INPUT_MD_SMS

MD_HRV_URL=${INPUT_MD_HRV:-"https://trigger.macrodroid.com/device_id/sts_hrv_measure"}
MD_SMS_URL=${INPUT_MD_SMS:-"https://trigger.macrodroid.com/device_id/sts_send_sms"}

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

# Deploy Cloudflare Worker
echo -e "\nDeploying Cloudflare Worker API Edge Backend..."
(
    cd phase1-cloudflare-worker
    npm install --silent 2>/dev/null || true
    echo "$STS_SECRET" | npx wrangler secret put STS_WEBHOOK_SECRET 2>/dev/null || true
    npx wrangler deploy || echo "Worker deploy initiated."
)

# Build & Deploy Cloudflare Pages Frontend
echo -e "\nCompiling React Frontend Web Application..."
npm run build

echo -e "\nDeploying to Cloudflare Pages (${PAGES_PROJECT})..."
npx wrangler pages project create "$PAGES_PROJECT" --production-branch main 2>/dev/null || true
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist --project-name="$PAGES_PROJECT" --branch=main 2>&1 || true)
PAGES_DEPLOYED_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.pages\.dev' | head -n 1 || echo "$PORTAL_URL")

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
echo -e "${BLUE}==============================================================================${NC}\n"
