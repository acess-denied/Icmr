# ICMR STS 2026 Research Ingestion & Clinical Dossier Platform

> **Study Title:** *Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Medical Undergraduates*  
> **Protocol ID:** `IEC/STS/2026/042` | **Host Department:** Department of Physiology  
> **Principal Investigator:** Harsh Narware | **Co-Investigators:** Investigator 1, Investigator 2, Investigator 3  

---

## 🌟 Overview & Architecture

This repository contains the complete, production-ready research platform designed for the ICMR STS 2026 physiological study. It implements an automated, zero-latency pipeline connecting:

1. **Google Forms & Google Sheets**: Self-administered chrononutrition and rMEQ questionnaire with automatic sheet pairing.
2. **Google Apps Script (`Code.gs`)**: Automatically creates the Google Form, maps all question items, signs responses with HMAC-SHA256, and pushes them to Cloudflare.
3. **Cloudflare Worker (`phase1-cloudflare-worker`)**: Edge API that validates cryptographic signatures, enforces schema integrity, manages D1 SQL records, and handles hardware triggers.
4. **Cloudflare D1 & R2**: Relational edge SQL database and S3-compatible storage for sealed 5-page research PDF dossiers and raw Kubios screenshots.
5. **Investigator Team Portal (React 19 + Tailwind)**: Multi-investigator control center with investigator role assignment, live filtering, and SPSS/R clinical dataset CSV exports.
6. **Tablet Signing Canvas**: Dual biometric signature capture pad that stamps real high-resolution signature images into the final CRF dossier.
7. **Kubios HRV Studio**: Optical Character Recognition (OCR) engine with a mandatory **Physical "OK" Verification** step and manual fallback to guarantee zero false-ingestions.
8. **5-Page Official ICMR STS Case Record Form (CRF) Dossier**: Print-ready, high-resolution multi-page legal document with participant and investigator signatures, full socio-demographics, chrononutrition metrics, and Kubios HRV screenshot appendix.
9. **Multi-Channel Participant Delivery**:
   - **WhatsApp 1-Click Direct Button**: Instantly opens WhatsApp with pre-formatted clinical diagnosis and PDF link.
   - **MacroDroid SMS Automation**: Triggers the researcher's phone to dispatch SMS directly from the device's SIM card.
   - **Participant Portal View**: Immediate web-accessible diagnostic summary with PDF download.

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│      Google Form       │ ───> │   Google Apps Script    │ ───> │    Cloudflare Worker    │
│  (MBBS Questionnaire)  │      │  (HMAC-SHA256 Signed)   │      │    (Edge Validation)    │
└────────────────────────┘      └─────────────────────────┘      └────────────┬────────────┘
                                                                              │
                                      ┌───────────────────────────────────────┴─────────────────┐
                                      ▼                                                         ▼
                          ┌───────────────────────┐                                 ┌───────────────────────┐
                          │   Cloudflare D1 SQL   │                                 │   Cloudflare R2       │
                          │   (9-Table Database)  │                                 │   (Sealed Documents)  │
                          └───────────────────────┘                                 └───────────────────────┘
                                      ▲                                                         ▲
                                      │                                                         │
                                      └───────────────────────┬─────────────────────────────────┘
                                                              │
                                                ┌─────────────┴─────────────┐
                                                ▼                           ▼
                                    ┌───────────────────────┐   ┌───────────────────────┐
                                    │ Investigator Dashboard│   │   Participant Portal  │
                                    │ (Tablet Signer / OCR) │   │ (WhatsApp / SMS / PDF)│
                                    └───────────────────────┘   └───────────────────────┘
```

---

## 👥 Investigator Team Roles & Signature Architecture

The system supports a distributed data-collection team to streamline large-batch intake of medical undergraduates:

| Name | Role | Department / Designation | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Harsh Narware** | **Principal Investigator** | Department of Physiology | Protocol oversight, final CRF sealing, ethics adherence |
| **Investigator 1** | **Co-Investigator** | MBBS Research Team | In-person participant intake, informed consent, tablet signing |
| **Investigator 2** | **Co-Investigator** | Data Collection Lead | Anthropometry (Height, Weight, Asian-Indian BMI), rMEQ validation |
| **Investigator 3** | **Co-Investigator** | HRV & Signal Acquisition Lead | Polar H10 placement, Kubios HRV recording & physical OK audit |

### Dual Biometric Signature Engine
- **Canvas Signature Pad:** Captures smooth, high-resolution vector strokes with touch smoothing (`canvas.toDataURL('image/png')`).
- **Signature Image Rendering:** Both the **Participant Signature** and the **Attesting Investigator Signature** are dynamically embedded as real images directly in the generated 5-page CRF dossier and saved into the immutable audit trail.

---

## 📑 Official 5-Page ICMR STS Case Record Form (CRF) Dossier

The platform generates a standardized 5-page dossier conforming strictly to ICMR STS reporting guidelines:

1. **Page 1: Participant Information & Formal Consent Statement**  
   Institutional header, ethics approval metadata, study explanation, participant rights, voluntary consent acknowledgement, and embedded participant signature.
2. **Page 2: Socio-Demographic & Asian-Indian Anthropometric Profile**  
   Age, gender, academic batch (MBBS year), department, contact details, height, weight, calculated BMI, and WHO Asian-Indian obesity cutoffs.
3. **Page 3: Chrononutrition & Dietary Pattern Evaluation**  
   Wake/bed timings, breakfast timing and skipping frequency, dinner timing, night eating syndrome screening, eating window duration, and meal regularity.
4. **Page 4: Reduced Morningness-Eveningness Questionnaire (rMEQ) & Sleep Profile**  
   5-item rMEQ scoring (1–25), circadian chronotype classification (Morning / Intermediate / Evening type), sleep duration, caffeine intake, and physical activity score.
5. **Page 5: Heart Rate Variability (HRV) Assessment & Appendix 1 (Kubios Screenshot)**  
   Resting HR, RMSSD, SDNN, LF Power, HF Power, LF/HF Ratio, Parasympathetic (PNS) & Sympathetic (SNS) Indices, high-resolution Kubios mobile screenshot attachment, and final co-signature of the attesting investigator.

---

## 🔍 Kubios HRV Studio: OCR & Physical "OK" Verification

To prevent spurious OCR reading errors from contaminating the clinical dataset, data entry follows a rigorous 2-step verification protocol:

1. **OCR Pre-Extraction:** Optical character recognition reads heart rate, RMSSD, SDNN, frequency powers, and autonomic indices directly from uploaded screenshots or live mobile camera captures.
2. **Physical "OK" Button & Manual Tuning:** Extracted parameters are held in a **Staging Buffer**. The investigator reviews the screenshot side-by-side with the digitised numbers, makes any necessary minor corrections, checks the attestation box, and clicks **"Physical OK & Accept Ingestion"**.
3. **Manual Direct Entry Fallback:** If a screenshot is blurry or unreadable, the investigator can toggle **Manual Backup Entry** to enter values with real-time range validation.

---

## 🚀 Quick Start with `setup.sh`

The `./setup.sh` script automates the entire provisioning and deployment workflow from your PC:

```bash
chmod +x setup.sh
./setup.sh
```

### Setup Script Flow:
1. **Cloudflare Authentication**: Prompts for `CLOUDFLARE_API_TOKEN` or launches interactive browser login.
2. **Resource Provisioning**: Automatically initializes the D1 SQL database (`icmr_sts_research_db`), executes `./d1/schema.sql`, and creates the R2 bucket (`icmr-sts-documents`).
3. **HMAC Cryptographic Secret**: Generates a 64-character hex key for tamper-proof webhook verification.
4. **Google Form & Sheets Pairing**: 
   - Displays instructions to paste `phase1-apps-script/Code.gs` into your Google Sheet.
   - Running `createAndLinkStudyForm()` programmatically generates the complete Google Form.
   - The setup script prompts you to enter the `FORM_ID`, `SHEET_ID`, and `FORM_URL` from the execution log.
5. **MacroDroid Webhook Configuration**: Prompts for your device's MacroDroid webhook URLs for HRV measurement triggers and SMS dispatch.
6. **Consolidated Push**: Syncs all environment variables and secrets to Cloudflare and deploys both the Worker backend and Pages frontend in a single final push.

---

## 🩺 Clinical Interpretation Engine (`src/data/interpretationRules.ts`)

All diagnostic cutoffs, categorizations, and advice templates are centralized in `src/data/interpretationRules.ts` for transparent clinical customization:

### 1. Asian-Indian BMI Classification (WHO Consensus)
- **Underweight:** `< 18.5 kg/m²`
- **Normal weight:** `18.5 – 22.9 kg/m²`
- **Overweight:** `23.0 – 24.9 kg/m²`
- **Obesity:** `≥ 25.0 kg/m²`

### 2. Reduced Morningness-Eveningness Questionnaire (rMEQ)
- **Morning type (Lark):** Score `18 – 25`
- **Intermediate type:** Score `12 – 17`
- **Evening type (Owl):** Score `4 – 11`

### 3. Autonomic Balance & Cardiac Tone (Kubios HRV)
- **Vagal Modulation (RMSSD):** Standard resting adult range `25 – 65 ms`.
- **Sympathovagal Balance (LF/HF Ratio):** Optimal baseline `0.5 – 2.0`.
- **Parasympathetic (PNS) & Sympathetic (SNS) Indices**: Autonomic balance scores derived from Kubios analysis.

---

## 📱 MacroDroid Android Automation

MacroDroid automates the Android phone used by the research team for biometric measurements and participant communication:

### Macro 1: Kubios HRV Measurement Trigger
- **Trigger:** Webhook (`https://trigger.macrodroid.com/<DEVICE_ID>/sts_hrv_measure`)
- **Actions:**
  1. Turn off screen lock & wake device.
  2. Launch **Kubios HRV** app.
  3. Speak announcement: *"Preparing participant [participant_id] for HRV measurement"*.

### Macro 2: SMS Report Dispatch
- **Trigger:** Webhook (`https://trigger.macrodroid.com/<DEVICE_ID>/sts_send_sms`)
- **Action:** Send SMS
  - **Destination:** `{url_param=mobile_number}`
  - **Message Body:** `{url_param=brief_diagnosis}\nReport: {url_param=report_url}`

---

## 📁 Repository Structure

```
├── d1/
│   └── schema.sql                  # Complete 9-table SQLite/D1 relational schema
├── phase1-apps-script/
│   └── Code.gs                     # Google Apps Script auto-form creator & HMAC push
├── phase1-cloudflare-worker/
│   ├── src/
│   │   └── index.ts                # Edge Worker API router & HMAC verifier
│   ├── package.json
│   └── wrangler.jsonc              # Worker bindings, D1, R2, and environment vars
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx           # Main investigator operations control panel & CSV export
│   │   ├── GoogleIntegrationHub.tsx# Google Form & Apps Script management UI
│   │   ├── KubiosHrvStudio.tsx     # HRV OCR & manual biometric entry with Physical OK button
│   │   ├── ManualParticipantFormModal.tsx # Direct backup entry form with investigator selector
│   │   ├── ParticipantReportPortal.tsx # Participant diagnosis & dispatch view
│   │   ├── PdfAppendixViewer.tsx   # 5-Page sealed official ICMR STS CRF dossier generator
│   │   └── TabletSigner.tsx        # HTML5 dual digital signature pad for participant & investigator
│   ├── data/
│   │   ├── investigators.ts        # Investigator team configuration & realistic SVG signatures
│   │   └── interpretationRules.ts  # Clinical cutoffs and message formatters
│   ├── App.tsx                     # Main application container & state management
│   ├── types.ts                    # Global TypeScript interfaces
│   └── main.tsx                    # React 19 entry point
├── setup.sh                        # Universal CLI orchestrator & deployment script
└── README.md                       # Comprehensive system documentation
```

---

## 📄 License & Ethical Compliance

- **Institutional Ethics Committee Approval:** Protocol `IEC/STS/2026/042`
- **Guidelines:** In accordance with ICMR Guidelines for Biomedical Research Involving Human Participants.
- **Principal Investigator:** Harsh Narware | Department of Physiology
