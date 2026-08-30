# ICMR STS 2026 Research Ingestion & Clinical Dossier Platform

> **Study Title**: *Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students*  
> **Protocol / Ethics Ref**: `IEC/STS/2026/042` | **Target Cohort**: 120 MBBS Undergraduates  
> **Infrastructure Target**: Cloudflare Workers + D1 SQL + R2 Vault + Cloudflare Pages + Cloudflare Zero Trust (WARP VPN)

---

## 🔬 1. Project Scope & Architecture Overview

This platform provides an end-to-end, privacy-preserving, and audit-compliant clinical data pipeline for medical research under Indian Council of Medical Research (ICMR) Short Term Studentship (STS) protocols.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLINICAL DATA PIPELINE                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  [ Google Form ] ──► [ Google Sheet ]
                              │
                              ▼ (onFormSubmit Trigger + Canonical HMAC-SHA256 Signature)
                  [ Cloudflare Worker Edge API ]
                              │
             ┌────────────────┴────────────────┬───────────────────────────┐
             ▼                                 ▼                           ▼
    [ Cloudflare D1 SQL ]              [ Cloudflare R2 ]         [ Cloudflare Zero Trust ]
    (9 Relational Tables)           (Signed Dossiers & Raw)       (WARP Device Restriction)
             │                                 │                           │
             └────────────────┬────────────────┴───────────────────────────┘
                              ▼
           [ Cloudflare Pages Frontend Web Application ]
                              │
   ┌──────────────────────────┼────────────────────────────┬────────────────────────┐
   ▼                          ▼                            ▼                        ▼
[ Investigator Hub ]   [ Tablet Signer ]        [ Kubios HRV Studio ]     [ Dossier PDF ]
- Sorting & Filters    - Participant Canvas     - MacroDroid Integration  - Page 1: CRF
- Bulk SPSS/CSV Export - Investigator Co-Sign   - AI OCR + Manual Backup  - Page 2: Appendix
```

---

## 🛡️ 2. Google Sheets Integration: How It Works

### **No Google API Keys or OAuth Secrets Required**
We **do NOT** ask for your Google account password, Google Cloud API keys, or OAuth credentials. Instead, the system uses a **Cryptographic Push Webhook**:

1. **Google Form Submission**: When an MBBS student completes your Google Form, the response is recorded in your Google Sheet.
2. **Apps Script Trigger (`onFormSubmit`)**: An embedded script in your Sheet generates a random, cryptographically unique ID (`STS-2026-XXXXXX`).
3. **HMAC-SHA256 Signing**: The script builds a canonical payload and signs it using a shared secret (`STS_WEBHOOK_SECRET`) stored only in script properties.
4. **HTTPS Webhook POST**: Google sends the signed payload to `https://icmr-sts-worker.<subdomain>.workers.dev/api/form-submit`.
5. **Instant Edge Verification**: The Cloudflare Worker verifies the signature, enforces replay protection, and saves the data to the D1 database.
6. **Sheet Sync Back**: Apps Script records `STS Sync Status = SYNCED` in the Sheet so entries are never duplicated.

---

## 🚀 3. Automated 1-Click Cloudflare Deployment (`./setup.sh`)

The root `setup.sh` script automates the complete provisioning and deployment on a fresh Cloudflare account.

### **Prerequisites**
- Node.js 18+ and `npm` installed.
- OpenSSL (pre-installed on macOS/Linux).
- A free or paid Cloudflare account.

### **Deployment Command**
```bash
chmod +x setup.sh
./setup.sh
```

### **What the Script Provisions Automatically**
1. **Cloudflare Authentication**: Connects via `CLOUDFLARE_API_TOKEN` or interactive Wrangler browser login.
2. **D1 SQL Database**: Creates `icmr_sts_research_db` and runs the 9-table schema migration (`./d1/schema.sql`).
3. **R2 Object Vault**: Provisions `icmr-sts-documents` bucket for storing high-resolution Kubios screenshots and finalized dossiers.
4. **HMAC Secrets**: Generates a 256-bit cryptographically secure secret and injects it into Worker secrets (`STS_WEBHOOK_SECRET`).
5. **Worker Edge Backend**: Deploys `icmr-sts-worker` to Cloudflare edge locations worldwide.
6. **Pages Web Application**: Builds the React 19 / Tailwind CSS application (`npm run build`) and deploys to Cloudflare Pages (`icmr-sts-portal.pages.dev`).
7. **Cloudflare Zero Trust Instructions**: Outlines the exact policy rules to lock the portal to your Cloudflare One WARP VPN.

---

## 🔒 4. Restricting Access via Cloudflare Zero Trust (Cloudflare One)

To guarantee that **nobody on the public internet can view your research portal**, configure Cloudflare Access:

1. Go to **Cloudflare Zero Trust Dashboard** (`dash.teams.cloudflare.com`) > **Access** > **Applications**.
2. Click **Add an Application** > Choose **Self-hosted**.
3. Set **Application domain** to your Cloudflare Pages URL (e.g. `icmr-sts-portal.pages.dev`).
4. Under **Policies**, create an **Allow** rule:
   - **Include**: *WARP* (Only devices running the Cloudflare WARP client).
   - **OR Include**: *Emails ending in* `@your-institution.edu.in`.
5. Save the application. Now, only enrolled devices on your private Cloudflare One network can access the portal.

---

## 📱 5. Hardware & Mobile Workflow

### **A. Tablet Informed Consent & Signature (`/tablet-signer`)**
- Full-screen clinical participant review with bilingual/clear declaration clauses.
- HTML5 responsive canvas with pressure/stylus support, instant clear/undo, and SHA-256 fingerprinting.
- Dual-role signature workflow: Participant signs first, followed by Investigator attestation.

### **B. Measurement Phone & Kubios HRV Bridge (`/macrodroid-manager`)**
- Trigger the measurement phone via MacroDroid webhook when the participant enters the clinical room.
- MacroDroid automatically opens the **Kubios HRV App** and initiates the 5-minute resting recording.
- Automatically captures the result screen and transmits metrics + screenshot to `/api/hrv`.

### **C. OCR Error Handling & Manual Fallback (`/hrv-studio`)**
- **Automated Mode**: Instant regex extraction of HR, RMSSD, SDNN, LF/HF ratio, readiness percentage, and autonomic indices from Kubios screenshots.
- **Redo OCR**: Single-click re-processing with adjustable image thresholding if lighting is sub-optimal.
- **Manual Backup Mode**: In case of complete OCR failure or camera malfunction, researchers can enter metrics manually. Requires selecting a clinical justification reason (e.g. *Lens Glare*, *Abnormal Artifacts*) and entering investigator sign-off for audit integrity.

---

## 📊 6. Clinical Dossier & Export Formats (`/pdf-dossier`)

The platform generates an official **2-Page Clinical Dossier**:
- **Page 1 (Case Record Form)**: Study header, de-identified participant demographics, rMEQ chronotype classification, meal timing window, and vector signatures.
- **Page 2 (Kubios Appendix)**: Embedded Kubios HRV report screenshot, autonomic readiness gauges, resting metrics table, and SHA-256 tamper-evident verification stamps.

### **Data Export Options**
- **SPSS-Ready CSV**: Standard numeric and string variables for direct import into IBM SPSS Statistics.
- **Full JSON Research Corpus**: Complete nested records including raw questionnaire answers and biometric timestamps.
- **Immutable Audit Trail Log**: Hash-chained CSV of every clinical action, timestamp, and actor identity.

---

## 🛠️ 7. Local Development & Testing

```bash
# Install dependencies
npm install

# Start Vite local development server
npm run dev

# Run TypeScript typecheck
npm run lint

# Build production bundle
npm run build
```

---

## 📜 8. Ethical & Regulatory Compliance
- **De-Identification**: Direct participant contact details are stored in logically separated tables and omitted from research exports.
- **Right to Withdraw**: Includes an ethical withdrawal pipeline (`/api/withdrawal`) in compliance with ICMR Ethical Guidelines for Biomedical Research (2017) and Good Clinical Practice (GCP).
