# ICMR STS 2026 End-to-End Clinical Research Automation Pipeline
## Master Playbook & Architectural Specification (Phases 1 – 10)

**Project Title:** Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students  
**Study Type:** ICMR Short Term Studentship (STS) 2026  
**Department:** Department of Physiology  
**Architecture:** Serverless Edge (Cloudflare Workers + D1 + R2) + Google Workspace + MacroDroid Mobile Ingestion + Python ReportLab Engine

---

## Complete Phase Breakdown

### Phase 1: Google Form → Sheet → Apps Script → HMAC Worker Ingestion
- **Google Form**: Contains all Document A verbatim questions across Demographics, Anthropometry, Meal Timings, rMEQ Chronotype, and Lifestyle.
- **Google Sheets Trigger**: `onFormSubmit` reads the latest row, generates a cryptographically random Participant ID (`STS-2026-XXXXXX`), locks the row in the sheet, and computes an HMAC-SHA256 signature using the shared secret.
- **Worker Verification**: `POST /api/form-submit` checks timestamp freshness (max 300s clock skew), prevents replays, verifies canonical HMAC-SHA256 signature, separates direct PII identifiers from research parameters, and queues the participant for tablet signing.

### Phase 2: Participant ID & Cloudflare D1 SQL Schema
- **Relational Tables**:
  - `participants` (Core identity, enrollment timestamp, workflow status)
  - `participant_identifiers` (Direct PII logically partitioned)
  - `research_data` (De-identified anthropometry, BMI, rMEQ score, chronotype, meal timings)
  - `signing_sessions` (Ephemeral token hashes with expiry)
  - `signatures` (Digital signature R2 keys, SHA-256 hashes, timestamps)
  - `hrv_records` (Kubios resting HR, RMSSD, SDNN, LF, HF, LF/HF, PNS/SNS index, Readiness, Screenshot R2 key)
  - `consent_documents` (Finalized multi-page PDF key, SHA-256 hash, download token)
  - `audit_events` (Immutable append-only hash-chained audit log)
  - `withdrawal_requests` (Ethical participant withdrawal audit trail)

### Phase 3: Python PDF Population & Layout Engine
- **ReportLab / PyPDF Service** (`pdf-service/generate_crf_pdf.py`):
  - Formats Section A through Section G verbatim.
  - Automatically calculates Asian-Indian BMI classification.
  - Scores the 5-item rMEQ (Morning type ≥18, Intermediate 12–17, Evening <12).
  - Embeds dual digital signatures with cryptographic hash strings.
  - Generates **Page 2: Appendix 1** with the original Kubios HRV screenshot attached and watermarked.

### Phase 4 & 5: Tablet Signing Interface & Dual Signature Capture
- **Participant Review**: Read-only display of questionnaire responses.
- **Consent Declaration**: Participant reviews PIS declaration and signs on an HTML5 high-resolution canvas.
- **Investigator Co-Signature**: Principal Investigator verifies participant measurements and signs on tablet.
- **State Transition**: Participant moves to `CONSENT_SIGNED` -> `INVESTIGATOR_SIGNED`.

### Phase 6: Cloudflare R2 Storage & Immutable Append-Only Audit Trail
- Multi-page finalized PDF and PNG signatures stored in Cloudflare R2 (`icmr-sts-documents`).
- SHA-256 hash calculated for every artifact.
- Chained audit events logged for every state transition (Actor, IP hash, Timestamp, Event Hash).

### Phase 7: Investigator Operations Dashboard & Cloudflare Access
- Google Auth Single Sign-On / Cloudflare Access RBAC.
- Real-time KPIs: Enrolled, Consented, HRV Attached, Finalized Dossiers.
- Participant Table with search, filter, status badges, and 1-click MacroDroid HRV trigger.
- Audit Log stream showing all cryptographic events.

### Phase 8: Participant Document Access & Ethical Withdrawal
- Ephemeral single-use download token generated for participant self-service.
- Participant can securely view their de-identified CRF & HRV report.
- Ethical withdrawal endpoint (`POST /api/withdrawal`) allowing participants to withdraw consent while preserving GCP statutory compliance.

### Phase 9: MacroDroid + Kubios HRV Mobile Ingestion
- **Trigger**: Webhook triggered from investigator tablet or manual floating action.
- **Automated Workflow**:
  1. Participant ID copied to Android clipboard.
  2. Kubios HRV app launched.
  3. Participant ID pasted into measurement tag.
  4. Automatic wait for measurement completion ("RESULT" screen).
  5. Crisp full-screen screenshot captured.
  6. On-device OCR reads Heart Rate, RMSSD, SDNN, LF/HF, PNS/SNS index, Readiness, and Quality.
  7. HTTP POST sent to Worker `/api/hrv` with Base64 screenshot and parameters.
  8. Cloudflare Worker attaches screenshot to participant record.

### Phase 10: Security Hardening & Consolidated Setup Script
- Automated deployment via `setup.sh`.
- Zero health/PII data in edge server logs.
- Strict CORS, Content Security Policy, and X-Frame-Options headers.
