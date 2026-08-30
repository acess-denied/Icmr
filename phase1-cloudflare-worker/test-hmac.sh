#!/usr/bin/env bash
# ==============================================================================
# ICMR STS Research Study — Phase 1 HMAC Webhook Test Script (OpenSSL + cURL)
# ==============================================================================
# Usage:
#   chmod +x test-hmac.sh
#   ./test-hmac.sh [WORKER_URL] [SECRET]
#
# Default:
#   WORKER_URL="https://icmr-sts-worker.<YOUR_SUBDOMAIN>.workers.dev"
# ==============================================================================

set -e

WORKER_URL="${1:-http://localhost:8787}"
SECRET="${2:-d8f2a93c4e7b1a0f6e5d8c2b4a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b3d5f}"

echo "================================================================"
echo "ICMR STS Phase 1: Testing Cloudflare Worker Webhook Authentication"
echo "Target URL: $WORKER_URL"
echo "================================================================"

# 1. Health Check Ping
echo -e "\n[1/4] Testing Health Check: GET $WORKER_URL/api/health"
curl -s -i -X GET "$WORKER_URL/api/health"
echo ""

# 2. Build Sample Payload
TIMESTAMP=$(date +%s)
REQUEST_ID="test_curl_$(date +%s)"
PATH_NAME="/api/form-submit"

PAYLOAD='{
  "submission_id": "CURL-TEST-001",
  "participant_id": "STS-2026-A1B2C3",
  "form_timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "raw_answers": {
    "I have read and understood the participant information sheet and agree to participate in this study.": "Yes",
    "Are you having any chronic illness? Eg. Hypertension/diabetes/thyroid disease?": "No",
    "Are you on any medications?": "No",
    "Name (optional)": "Test Medical Student",
    "Age (years)": 20,
    "Gender": "Male",
    "MBBS Professional Year": "Second MBBS",
    "Height (cm)": 172,
    "Weight (kg)": 66,
    "At what time do you usually eat breakfast?": "7:00–8:00 AM",
    "How many days per week do you skip breakfast?": "1–2 days",
    "At what time do you usually eat dinner?": "8:00–9:00 PM",
    "How often do you eat snacks after dinner/night-time?": "Occasionally",
    "What is your usual daily eating duration (time between first and last meal)?": "10–12 hours",
    "Do you eat meals at regular timings daily?": "Yes",
    "At approximately what time would you get up if you were entirely free to plan your day?": "6:30–7:45 AM",
    "During the first half hour after waking, how tired do you feel?": 3,
    "At what time in the evening do you usually feel tired and in need of sleep?": "10:15 PM–12:30 AM",
    "How easy do you find getting up in the morning?": 4,
    "At what time of day do you feel your best mentally and physically?": "Late morning",
    "Average sleep duration per day": "6–7 hours",
    "How often do you consume caffeinated beverages (coffee/tea/energy drinks)?": "Daily",
    "Physical activity level": "Moderately active"
  },
  "metadata": {
    "script_version": "1.0.0-phase1",
    "environment": "curl-test"
  }
}'

# Compute Body SHA-256 Hex
BODY_HASH=$(printf "%s" "$PAYLOAD" | openssl dgst -sha256 | awk '{print $NF}')

# Build Canonical String: <TIMESTAMP>\n<METHOD>\n<PATH>\n<BODY_HASH>
CANONICAL_STRING="${TIMESTAMP}
POST
${PATH_NAME}
${BODY_HASH}"

# Compute HMAC-SHA256
SIGNATURE=$(printf "%s" "$CANONICAL_STRING" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

echo -e "\n[2/4] Testing Valid Form Ingestion: POST $WORKER_URL/api/form-submit"
echo "Timestamp : $TIMESTAMP"
echo "Request-ID: $REQUEST_ID"
echo "Signature : $SIGNATURE"

curl -s -i -X POST "$WORKER_URL$PATH_NAME" \
  -H "Content-Type: application/json" \
  -H "X-STS-Timestamp: $TIMESTAMP" \
  -H "X-STS-Signature: $SIGNATURE" \
  -H "X-STS-Request-ID: $REQUEST_ID" \
  -d "$PAYLOAD"
echo ""

# 3. Test Invalid Signature (Tamper Test)
echo -e "\n[3/4] Testing Tampered Signature Rejection (Expect 401 Unauthorized)"
curl -s -i -X POST "$WORKER_URL$PATH_NAME" \
  -H "Content-Type: application/json" \
  -H "X-STS-Timestamp: $TIMESTAMP" \
  -H "X-STS-Signature: bad_signature_hex_0000000000000000000000000000000000000000" \
  -H "X-STS-Request-ID: bad_sig_$REQUEST_ID" \
  -d "$PAYLOAD"
echo ""

# 4. Test Expired Timestamp (Replay/Skew Test)
OLD_TIMESTAMP=$((TIMESTAMP - 600)) # 10 minutes ago
OLD_CANONICAL="${OLD_TIMESTAMP}
POST
${PATH_NAME}
${BODY_HASH}"
OLD_SIGNATURE=$(printf "%s" "$OLD_CANONICAL" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

echo -e "\n[4/4] Testing Expired Timestamp (Expect 400 Expired/Skew)"
curl -s -i -X POST "$WORKER_URL$PATH_NAME" \
  -H "Content-Type: application/json" \
  -H "X-STS-Timestamp: $OLD_TIMESTAMP" \
  -H "X-STS-Signature: $OLD_SIGNATURE" \
  -H "X-STS-Request-ID: old_$REQUEST_ID" \
  -d "$PAYLOAD"
echo ""

echo "================================================================"
echo "Phase 1 Security & Authentication Verification Complete."
echo "================================================================"
