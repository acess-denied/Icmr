#!/usr/bin/env bash
# ==============================================================================
# ICMR STS 2026 Research Study — Google Apps Script Automated CLI Deployment
# Platform: Linux / macOS Bash
# ==============================================================================
set -e

echo "================================================================"
echo "  ICMR STS 2026: Google Apps Script CLI Deployment Script       "
echo "================================================================"

# Configuration defaults (can be overridden by environment variables)
WORKER_ENDPOINT="${WORKER_ENDPOINT:-https://icmr-sts-worker.health-research.workers.dev/api/form-submit}"
HMAC_SECRET="${HMAC_SECRET:-a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8}"
SCRIPT_ID="${GAS_SCRIPT_ID:-}"

echo "[INFO] Ingestion Endpoint: ${WORKER_ENDPOINT}"
echo "[INFO] HMAC-SHA256 Secret: ${HMAC_SECRET:0:8}..."

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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

if [ -z "${SCRIPT_ID}" ]; then
    if [ ! -f .clasp.json ]; then
        echo "[CREATE] Creating fresh Google Apps Script standalone project..."
        clasp create --title "ICMR STS 2026 Research Engine" --type standalone
    fi
else
    echo "[CONFIG] Setting target script ID: ${SCRIPT_ID}..."
    echo "{\"scriptId\":\"${SCRIPT_ID}\"}" > .clasp.json
fi

# 4. Push code to Google Apps Script
echo "[PUSH] Uploading Code.gs and appsscript.json to Google Apps Script..."
clasp push --force

# 5. Open in browser
echo "================================================================"
echo "[SUCCESS] Google Apps Script deployed successfully!"
echo "Run clasp open to view your script in the online portal:"
echo "  script.google.com"
echo "================================================================"
