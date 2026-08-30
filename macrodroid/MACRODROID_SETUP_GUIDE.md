# MacroDroid + Kubios HRV Automation & OCR Pipeline Guide

## Objective
This guide outlines the exact, step-by-step procedure to automate **Kubios HRV** measurement on an Android smartphone using **MacroDroid**, tag the measurement with the unique **Participant ID**, capture the resulting biometric readout screen, extract data via OCR, and transmit both the metrics and the raw verification screenshot to the Cloudflare backend for inclusion in the final **Case Record Form (CRF) PDF Dossier**.

---

## 1. Prerequisites on the Phone
1. **Android Smartphone** running Android 9+ with USB debugging or standard accessibility enabled.
2. **Kubios HRV App** installed (`com.kubios.hrv`) and paired with your Polar H10 / Bluetooth ECG sensor.
3. **MacroDroid App** installed from Google Play Store (Grant *Accessibility*, *Overlay*, and *Notification/Storage* permissions).
4. **MacroDroid Webhook Feature** enabled:
   - In MacroDroid, open **Settings** → **Webhook Trigger URL**. Note your device ID (e.g., `a1b2c3d4-e5f6-7890`).

---

## 2. Macro Architecture & Execution Flow

```
[ Investigator Tablet ]
         │
         ▼ Tap "Trigger Kubios HRV for STS-2026-7F3A91"
[ HTTP GET to MacroDroid Webhook Server ]
   https://trigger.macrodroid.com/<DEVICE_ID>/sts_hrv_measure?participant_id=STS-2026-7F3A91
         │
         ▼
[ Phone triggers MacroDroid Action Sequence ]
  ├─ 1. Copy Participant ID to Android Clipboard
  ├─ 2. Auto-launch Kubios HRV App (`com.kubios.hrv`)
  ├─ 3. Tap "Start Measurement" / "New Recording"
  ├─ 4. Paste Participant ID ("STS-2026-7F3A91") into the measurement Note/Subject box
  ├─ 5. Wait for sensor countdown (e.g. 120 sec) until "RESULT" screen appears
  ├─ 6. Take crisp full-resolution screenshot: `STS_Kubios_Result.jpg`
  ├─ 7. Run on-device OCR / text grab on Result Screen
  └─ 8. Send HTTP POST to Cloudflare Worker `/api/hrv` with Base64 screenshot & metrics
         │
         ▼
[ Cloudflare Worker Ingests Data & Screenshot ]
  ├─ Saves metrics into D1 `hrv_records` table
  ├─ Saves raw screenshot into Cloudflare R2 (`hrv_screenshots/STS-2026-7F3A91.jpg`)
  ├─ Computes SHA-256 hash of screenshot for audit trail
  └─ Appends screenshot as Page 2 Appendix in the Finalized CRF PDF
```

---

## 3. How to Import the Macro

### Option A: Import JSON directly in MacroDroid
1. Transfer `macrodroid/STS_Kubios_HRV_Capture.macro.json` to your phone.
2. In MacroDroid, tap **Export/Import** → **Import** → select `STS_Kubios_HRV_Capture.macro.json`.
3. Activate the macro.

### Option B: Build Manually in MacroDroid (5 Minutes)
1. **Trigger**:
   - Add Trigger → **Connectivity** → **Webhook URL** → Identifier: `sts_hrv_measure`
2. **Actions**:
   - **Set Variable**: `var_participant_id` = `{trigger_param:participant_id}`
   - **Device Actions** → **Clipboard** → Set text to `{var_participant_id}`
   - **Applications** → **Launch Application** → **Kubios HRV**
   - **Device Actions** → **Wait** → 2 seconds
   - **UI Interaction** → **Click** → Identify "Start Recording" button
   - **Device Actions** → **Wait** → 120 seconds (or condition "Screen text contains RESULT")
   - **Screen** → **Take Screenshot** → Save to `/storage/emulated/0/Pictures/Screenshots/STS_Kubios_Result.jpg`
   - **Connectivity** → **HTTP Request**:
     - Request Type: `POST`
     - URL: `https://icmr-sts-worker.<your-subdomain>.workers.dev/api/hrv`
     - Content Type: `application/json`
     - Body:
       ```json
       {
         "participant_id": "{v=var_participant_id}",
         "recording_date": "{year}-{month_digit}-{day_of_month_digit}",
         "recording_time": "{hour_24}:{minute_digit}:{second_digit}",
         "ocr_raw_text": "{screen_text}",
         "screenshot_base64": "{file_base64:/storage/emulated/0/Pictures/Screenshots/STS_Kubios_Result.jpg}"
       }
       ```
3. **Save and Turn ON**.

---

## 4. Extraction & Validation Matrix

When the Kubios RESULT screen appears (as shown in your uploaded screenshot):

| Parameter | Kubios Readout (from Screen) | Target CRF Section F Field |
| :--- | :--- | :--- |
| **Resting Heart Rate** | `78 bpm` | Resting Heart Rate (bpm) |
| **RMSSD** | `31 ms` | RMSSD (ms) |
| **SDNN** | `24.09 ms` | SDNN (ms) |
| **LF Power** | `83.84 ms²` | LF Power (ms²) |
| **HF Power** | `301.41 ms²` | HF Power (ms²) |
| **LF/HF Ratio** | `0.28` | LF/HF Ratio |
| **Readiness** | `55%` | Autonomic Readiness Index |
| **PNS Index / SNS Index** | `-0.79 / 2.12` | Autonomic Tone Modulation |
| **Stress Index** | `19.16` | Sympathetic Stress Load |
| **Quality** | `GOOD` | Measurement Validity Flag |

---

## 5. Verification & PDF Appendix Attachment
1. Once uploaded, the Cloudflare Worker links the record to the participant.
2. The Python PDF Generator (`pdf-service/generate_crf_pdf.py`) takes the raw screenshot from R2 and creates:
   - **Page 1**: Verbatim Case Record Form (Anthropometry, rMEQ, Meal Timings, Section F HRV Values, Participant Digital Signature, Investigator Co-Signature).
   - **Page 2**: **Appendix 1 — Raw Kubios HRV Result Verification Screenshot** with timestamp watermark, participant ID tag, and SHA-256 seal.
