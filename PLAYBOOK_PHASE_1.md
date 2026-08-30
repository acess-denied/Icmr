# ICMR STS Research Study — Phase 1 Deployment Playbook
**Study Title:** *Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students: A Cross-Sectional Study*  
**Phase 1 Goal:** Establish the secure, authenticated machine-to-machine bridge from **Google Form / Google Sheet** via **Google Apps Script** to **Cloudflare Worker** with canonical HMAC-SHA256 signature verification, de-identification separation, and privacy-preserving audit logging.

---

## 1. Architecture & Security Flow

```
[ Participant completes Google Form ]
               │
               ▼
[ Google Sheets receives new row ]
               │
               ▼
[ Apps Script onFormSubmit Trigger fires ]
  ├─ 1. Reads dynamic column headers (matches Document A questions verbatim)
  ├─ 2. Generates Cryptographic Participant ID: STS-2026-XXXXXX
  ├─ 3. Writes Participant ID back to Google Sheet (Idempotency lock)
  ├─ 4. Builds Canonical Request:
  │      <TIMESTAMP_SEC>\nPOST\n/api/form-submit\n<BODY_SHA256_HEX>
  ├─ 5. Signs Canonical Request with HMAC-SHA256 using Script Property Secret
  └─ 6. Dispatches authenticated HTTPS POST to Cloudflare Worker
               │
               ▼
[ Cloudflare Worker: POST /api/form-submit ]
  ├─ 1. Verifies presence of X-STS-Timestamp & X-STS-Signature headers
  ├─ 2. Replay check & Clock-skew window validation (max 300 seconds)
  ├─ 3. Computes expected HMAC-SHA256 signature using constant-time comparison
  ├─ 4. Rejects tampered/expired requests with 401 / 400
  ├─ 5. De-identifies research payload (separates Name/Contacts from biometric data)
  ├─ 6. Emits privacy-preserving audit event to console (NO health or PII data in logs)
  └─ 7. Returns structured confirmation (HTTP 200) with Participant ID & Submission ID
```

---

## 2. Secrets & Configuration Matrix

| Secret / Config Key | Where to Configure | Purpose | Sample Value |
| :--- | :--- | :--- | :--- |
| `STS_WEBHOOK_SECRET` | **Cloudflare Secret** (`wrangler secret put STS_WEBHOOK_SECRET`) & **Google Apps Script Property** | 256-bit shared secret used for HMAC-SHA256 request signing & verification | `d8f2a93c4e7b1a0f6e5d8c2b4a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b3d5f` |
| `WORKER_URL` | **Google Apps Script Property** (`PropertiesService`) | Target HTTPS endpoint of the deployed Worker | `https://icmr-sts-worker.<YOUR_SUBDOMAIN>.workers.dev/api/form-submit` |
| `MAX_TIMESTAMP_SKEW_SEC` | Cloudflare Worker Environment Variable (`wrangler.jsonc`) | Tolerance for clock drift between Google servers and Cloudflare (default: 300s) | `300` |
| `ENVIRONMENT` | Cloudflare Worker Environment Variable (`wrangler.jsonc`) | Environment descriptor | `production` |

---

## 3. Step-by-Step Deployment Instructions

### Step A: Deploy Cloudflare Worker

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Navigate to the worker directory**:
   ```bash
   cd phase1-cloudflare-worker
   ```

3. **Set the Secret Key in Cloudflare**:
   Generate a secure 64-character random hex string:
   ```bash
   # On macOS/Linux:
   openssl rand -hex 32
   ```
   Save this secret in your Cloudflare Worker:
   ```bash
   npx wrangler secret put STS_WEBHOOK_SECRET
   # When prompted, paste your generated 64-character hex secret
   ```

4. **Deploy the Worker**:
   ```bash
   npx wrangler deploy
   ```
   Note the assigned Worker URL output (e.g. `https://icmr-sts-worker.<subdomain>.workers.dev`).

---

### Step B: Configure Google Apps Script in Google Sheets

1. Open your **Google Sheet** linked to the ICMR STS Google Form.
2. In the top menu, click **Extensions** > **Apps Script**.
3. Replace the default code with the contents of `phase1-apps-script/Code.gs`.
4. Replace `appsscript.json` (via Project Settings > Show "appsscript.json" manifest) with `phase1-apps-script/appsscript.json`.
5. **Configure Script Properties** (Secrets):
   - Option 1 (Via Editor UI): Click the gear icon (**Project Settings**) on the left sidebar > scroll down to **Script Properties** > click **Add script property**:
     - `WORKER_URL`: `https://icmr-sts-worker.<subdomain>.workers.dev/api/form-submit`
     - `STS_WEBHOOK_SECRET`: `<your_same_64_character_hex_secret>`
   - Option 2 (Via Function): In the editor dropdown, select `configureScriptProperties`, update the values, and click **Run**.
6. **Set up the "On form submit" Trigger**:
   - On the left sidebar of Apps Script, click the **Triggers** (alarm clock) icon.
   - Click **Add Trigger** (bottom right):
     - Choose which function to run: `onFormSubmit`
     - Choose which deployment should run: `Head`
     - Select event source: `From spreadsheet`
     - Select event type: `On form submit`
     - Failure notification settings: `Notify me daily` (or immediately)
   - Click **Save** and authorize permissions when prompted.

---

## 4. Verification & Testing Procedure

### Test 1: Self-Test via Apps Script
1. In the Apps Script Editor function dropdown, select `testSendSampleFormResponse`.
2. Click **Run**.
3. View the **Execution log**:
   ```text
   [TEST RESULT] Status Code: 200
   [TEST RESULT] Body: {
     "success": true,
     "participant_id": "STS-2026-7F3A91",
     "submission_id": "TEST-1756540000000",
     "status": "QUEUED_FOR_CRF_GENERATION",
     "message": "Form response successfully authenticated, validated, and de-identified."
   }
   ```

### Test 2: Live cURL / Shell HMAC Verification
Run the included test script against your live Worker:
```bash
cd phase1-cloudflare-worker
chmod +x test-hmac.sh
./test-hmac.sh "https://icmr-sts-worker.<YOUR_SUBDOMAIN>.workers.dev" "your_64_char_secret"
```

**Expected Test Results:**
1. `GET /api/health` → `200 OK` (`{"status": "healthy", ...}`)
2. `POST /api/form-submit` (Valid HMAC) → `200 OK` (`{"success": true, "participant_id": "STS-2026-XXXXXX", ...}`)
3. `POST /api/form-submit` (Tampered HMAC) → `401 Unauthorized` (`{"error": "INVALID_SIGNATURE"}`)
4. `POST /api/form-submit` (Expired Timestamp) → `400 Bad Request` (`{"error": "REQUEST_EXPIRED_OR_CLOCK_SKEW"}`)

### Test 3: End-to-End Live Form Submission
1. Open the Google Form as a respondent.
2. Fill in sample data and click **Submit**.
3. Switch to the linked Google Sheet:
   - Check that two new columns are automatically created/updated: `STS Participant ID` and `STS Sync Status`.
   - Verify `STS Sync Status` displays **`SYNCED`**.
   - Verify `STS Participant ID` displays a unique code (e.g. `STS-2026-E41B89`).

---

## 5. Security & Privacy Audit Verification
Check the Cloudflare Worker live logs (`npx wrangler tail`):
```text
[AUDIT] FORM_SUBMITTED | participant=STS-2026-7F3A91 | sub_id=SUB-1756540000-2 | consent=true | time=14ms
```
- Notice that no names, medical histories, or contact numbers appear anywhere in the server log.
