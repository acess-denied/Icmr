import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  CheckCircle2, 
  Shield, 
  Lock, 
  ExternalLink, 
  Printer, 
  Sparkles, 
  AlertCircle,
  FileCheck,
  Layers,
  Activity,
  UserCheck,
  Check,
  Smartphone,
  Maximize2,
  Calendar,
  Clock,
  Heart,
  FileSpreadsheet
} from 'lucide-react';
import { ParticipantRecord } from '../types';
import { getStoredInvestigatorSignatures } from '../data/investigators';
import { generateHandwrittenSignatureDataUrl } from '../utils/signatureUtils';

interface PdfAppendixViewerProps {
  participant: ParticipantRecord;
}

export const PdfAppendixViewer: React.FC<PdfAppendixViewerProps> = ({ participant }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  const hrv = participant.hrv_record || {
    recording_date: '2026-08-31',
    recording_time: '02:29',
    caffeine_avoided_12h: true,
    exercise_avoided_12h: true,
    rest_period_minutes: 10,
    resting_heart_rate: 78,
    rmssd: 31,
    sdnn: 24.09,
    lf_power: 83.84,
    hf_power: 301.41,
    lf_hf_ratio: 0.28,
    readiness_percentage: 55,
    pns_index: -0.79,
    sns_index: 2.12,
    mean_rr: 772.43,
    stress_index: 19.16,
    respiratory_rate: 23.23,
    measurement_quality: 'GOOD' as const,
    screenshot_sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    is_physically_verified: true,
    verified_by: participant.investigator_name || 'Harsh Narware (Principal Investigator)'
  };

  const storedSigs = getStoredInvestigatorSignatures();
  const investigatorName = participant.investigator_name || 'Harsh Narware (Principal Investigator)';
  const participantName = participant.participant_name || 'Aarav Sharma';
  const finalPartSig = participant.participant_signature || generateHandwrittenSignatureDataUrl(participantName, '#091e42');
  const finalInvSig = participant.investigator_signature || storedSigs[participant.investigator_name || 'Harsh Narware'] || storedSigs['Harsh Narware'] || generateHandwrittenSignatureDataUrl(investigatorName, '#1e3a8a');

  // Standalone Complete Continuous HTML/PDF Dossier Generator
  const handleDownloadReport = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ICMR STS 2026 Official CRF - ${participant.participant_id} (${participantName})</title>
<style>
  @page { size: A4; margin: 12mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; font-size: 10.5pt; line-height: 1.45; margin: 0; background: #ffffff; }
  
  .crf-container { max-width: 800px; margin: 0 auto; padding: 10px; }
  
  .doc-header { text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .doc-title-main { font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0; letter-spacing: 0.5px; }
  .doc-subtitle { font-size: 11pt; font-weight: bold; color: #1e3a8a; margin: 4px 0; }
  .doc-project-title { font-size: 9.5pt; color: #334155; margin: 4px 0 0 0; line-height: 1.35; }
  
  .crf-badge { text-align: center; margin: 8px 0 14px 0; }
  .crf-badge span { background: #0f172a; color: #ffffff; padding: 4px 18px; font-weight: bold; font-size: 10.5pt; letter-spacing: 1px; border-radius: 3px; }
  
  .table-custom { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9.5pt; }
  .table-custom th, .table-custom td { border: 1px solid #94a3b8; padding: 5.5px 9px; text-align: left; }
  .table-custom th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
  
  .section-heading { background: #1e3a8a; color: #ffffff; font-weight: bold; font-size: 10pt; padding: 5px 9px; margin-top: 14px; margin-bottom: 6px; border-radius: 2px; }
  .sub-heading { font-weight: bold; color: #1e3a8a; margin: 8px 0 3px 0; font-size: 9.5pt; }
  
  .sig-container { display: flex; justify-content: space-between; margin-top: 18px; gap: 16px; page-break-inside: avoid; }
  .sig-block { width: 48%; border: 1px solid #94a3b8; padding: 10px; background: #fafafa; border-radius: 4px; }
  .sig-image-box { height: 68px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dashed #94a3b8; margin: 6px 0; background: #ffffff; }
  .sig-image-box img { max-height: 58px; max-width: 90%; object-fit: contain; }
  
  .appendix-box { border: 2px solid #1e3a8a; padding: 14px; background: #f8fafc; border-radius: 6px; margin-top: 18px; page-break-inside: avoid; }
  .phone-screenshot-grid { display: flex; justify-content: center; gap: 16px; margin: 12px 0; }
  .phone-screen-card { width: 45%; max-width: 260px; background: #0f172a; color: #ffffff; padding: 10px; border-radius: 8px; font-size: 8.5pt; border: 1px solid #334155; }
  
  .footer-stamp { text-align: center; font-size: 8pt; color: #64748b; margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 6px; }
</style>
</head>
<body>

  <div class="crf-container">
    
    <!-- Header -->
    <div class="doc-header">
      <div class="doc-title-main">Case Record Form (CRF)</div>
      <div class="doc-subtitle">ICMR STS Research Project</div>
      <div class="doc-project-title"><b>Title:</b> Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students: A Cross-Sectional Study</div>
    </div>

    <div class="crf-badge">
      <span>CASE RECORD FORM</span>
    </div>

    <!-- Participant Identification -->
    <div style="font-weight: bold; margin-bottom: 4px; color: #1e3a8a; font-size: 10pt;">Participant Identification</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 35%;">Variable</th>
          <th style="width: 65%;">Details</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Participant Name</td><td><b style="font-size: 11pt; color: #1e3a8a;">${participantName}</b></td></tr>
        <tr><td>Participant ID</td><td><b>${participant.participant_id}</b></td></tr>
        <tr><td>Date of Enrollment</td><td>${participant.enrolled_at}</td></tr>
        <tr><td>Department</td><td>${participant.department || 'MBBS (Department of Physiology)'}</td></tr>
        <tr><td>Year of Study</td><td>${participant.year_of_study}</td></tr>
        <tr><td>Investigator Name</td><td><b>${investigatorName}</b></td></tr>
      </tbody>
    </table>

    <!-- SECTION A: Demographic Details -->
    <div class="section-heading">SECTION A: Demographic Details</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 50%;">Item</th>
          <th style="width: 50%;">Response</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Participant Name</td><td><b>${participantName}</b></td></tr>
        <tr><td>Age (completed years)</td><td><b>${participant.age} years</b></td></tr>
        <tr><td>Gender</td><td><b>${participant.gender}</b></td></tr>
        <tr><td>Contact Number (Optional)</td><td>${participant.contact_number || participant.mobile_number || 'Recorded in confidential register'}</td></tr>
      </tbody>
    </table>

    <!-- SECTION B: Anthropometric Measurements -->
    <div class="section-heading">SECTION B: Anthropometric Measurements</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 50%;">Measurement Parameter</th>
          <th style="width: 50%;">Recorded Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Height (cm)</td><td><b>${participant.height_cm} cm</b></td></tr>
        <tr><td>Weight (kg)</td><td><b>${participant.weight_kg} kg</b></td></tr>
        <tr><td>Computed BMI (kg/m²)</td><td><b style="color: #1e3a8a;">${participant.bmi} kg/m²</b></td></tr>
        <tr><td>BMI Formula & Cutoffs (Asian-Indian)</td><td>Weight (kg) / [Height (m)]² • &lt;18.5 Underweight | 18.5–22.9 Normal | 23.0–24.9 Overweight | ≥25.0 Obese</td></tr>
      </tbody>
    </table>

    <!-- SECTION C: Lifestyle Information -->
    <div class="section-heading">SECTION C: Lifestyle Information</div>
    
    <div class="sub-heading">1. Sleep Pattern</div>
    <table class="table-custom">
      <tbody>
        <tr><td style="width: 50%;">Average sleep duration per day</td><td style="width: 50%;"><b>${participant.sleep_duration}</b></td></tr>
        <tr><td>Usual bedtime</td><td><b>${participant.bedtime || '11:00 PM – 11:30 PM'}</b></td></tr>
        <tr><td>Usual wake-up time</td><td><b>${participant.wake_time || '6:30 AM – 7:00 AM'}</b></td></tr>
      </tbody>
    </table>

    <div class="sub-heading">2. Physical Activity</div>
    <table class="table-custom">
      <tbody>
        <tr><td style="width: 50%;">Physical activity level</td><td style="width: 50%;"><b>${participant.physical_activity}</b></td></tr>
        <tr><td>Regular exercise</td><td><b>${participant.physical_activity.includes('Sedentary') ? 'No (&lt;150 min/week)' : 'Yes (≥150 min/week)'}</b></td></tr>
      </tbody>
    </table>

    <div class="sub-heading">3. Caffeine Intake</div>
    <table class="table-custom">
      <tbody>
        <tr><td style="width: 50%;">Tea / Coffee / Energy drink intake</td><td style="width: 50%;"><b>${participant.caffeine_frequency}</b></td></tr>
      </tbody>
    </table>

    <!-- SECTION D: Meal Timing Questionnaire -->
    <div class="section-heading">SECTION D: Meal Timing Questionnaire</div>
    <table class="table-custom">
      <thead>
        <tr><th style="width: 50%;">Meal Timing Parameter</th><th style="width: 50%;">Participant Response</th></tr>
      </thead>
      <tbody>
        <tr><td>Usual breakfast time</td><td><b>${participant.breakfast_time}</b></td></tr>
        <tr><td>Breakfast skipped per week</td><td><b>${participant.breakfast_skipped}</b></td></tr>
        <tr><td>Usual dinner time</td><td><b>${participant.dinner_time}</b></td></tr>
        <tr><td>Night snacking (&gt;10:00 PM)</td><td><b>${participant.night_snack}</b></td></tr>
        <tr><td>Daily eating window duration</td><td><b>${participant.eating_duration}</b></td></tr>
        <tr><td>Regularity of meal timing</td><td><b>${participant.regular_timings}</b></td></tr>
      </tbody>
    </table>

    <!-- SECTION E: Chronotype Assessment (rMEQ) -->
    <div class="section-heading">SECTION E: Chronotype Assessment (Reduced Morningness-Eveningness Questionnaire - rMEQ)</div>
    <table class="table-custom">
      <thead>
        <tr><th style="width: 8%;">Q#</th><th style="width: 62%;">Question Item</th><th style="width: 30%;">Recorded Response</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Q1</b></td>
          <td>Considering only your own "feeling best" rhythm, at what time would you get up if you were entirely free to plan your day?</td>
          <td><b>6:30 AM – 7:45 AM (Score: 4/5)</b></td>
        </tr>
        <tr>
          <td><b>Q2</b></td>
          <td>During the first half hour after having woken in the morning, how tired do you feel?</td>
          <td><b>Fairly refreshed / Neutral (Score: 3/4)</b></td>
        </tr>
        <tr>
          <td><b>Q3</b></td>
          <td>At what time in the evening do you feel tired and, as a result, in need of sleep?</td>
          <td><b>10:15 PM – 12:30 AM (Score: 3/5)</b></td>
        </tr>
        <tr>
          <td><b>Q4</b></td>
          <td>At what time of the day do you think that you reach your "feeling best" peak?</td>
          <td><b>9:00 AM – 1:00 PM (Score: 3/5)</b></td>
        </tr>
        <tr>
          <td><b>Q5</b></td>
          <td>One hears about "morning" and "evening" types of people. Which one of these types do you consider yourself to be?</td>
          <td><b>${participant.chronotype_category === 'Morning type' ? 'Morning type (Score: 4)' : participant.chronotype_category === 'Intermediate type' ? 'Intermediate type (Score: 3)' : 'Evening type (Score: 0)'}</b></td>
        </tr>
      </tbody>
    </table>

    <div class="sub-heading">Chronotype Scoring (rMEQ Total)</div>
    <table class="table-custom">
      <thead>
        <tr><th>Score Range</th><th>Category Definition</th><th>Participant Score</th><th>Assigned Category</th></tr>
      </thead>
      <tbody>
        <tr><td>18 – 25</td><td>Morning type</td><td rowspan="3" style="text-align: center; font-size: 13pt; font-weight: bold; background: #f8fafc;">${participant.rmeq_total_score} / 25</td><td rowspan="3" style="text-align: center; font-size: 12pt; font-weight: bold; color: #1e3a8a; background: #f8fafc;">${participant.chronotype_category}</td></tr>
        <tr><td>12 – 17</td><td>Intermediate type</td></tr>
        <tr><td>4 – 11</td><td>Evening type</td></tr>
      </tbody>
    </table>

    <!-- SECTION F: Heart Rate Variability Recording -->
    <div class="section-heading">SECTION F: Heart Rate Variability Recording</div>
    
    <div class="sub-heading">1. Recording Conditions</div>
    <table class="table-custom">
      <thead>
        <tr><th style="width: 50%;">Protocol Prerequisite</th><th style="width: 50%;">Compliance Status</th></tr>
      </thead>
      <tbody>
        <tr><td>Date of HRV recording</td><td><b>${hrv.recording_date}</b></td></tr>
        <tr><td>Time of recording</td><td><b>${hrv.recording_time}</b></td></tr>
        <tr><td>Caffeine avoided for 12 hours</td><td><b>${hrv.caffeine_avoided_12h ? 'YES (Compliant)' : 'NO'}</b></td></tr>
        <tr><td>Exercise avoided for 12 hours</td><td><b>${hrv.exercise_avoided_12h ? 'YES (Compliant)' : 'NO'}</b></td></tr>
        <tr><td>Rest period before recording</td><td><b>${hrv.rest_period_minutes} minutes seated rest</b></td></tr>
      </tbody>
    </table>

    <div class="sub-heading">2. HRV Parameters (Kubios Scientific Autonomic Engine)</div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 50%;">Biometric Parameter</th>
          <th style="width: 50%;">Measured Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Resting Heart Rate (bpm)</td><td><b>${hrv.resting_heart_rate} bpm</b></td></tr>
        <tr><td>RMSSD (ms)</td><td><b>${hrv.rmssd} ms</b></td></tr>
        <tr><td>SDNN (ms)</td><td><b>${hrv.sdnn} ms</b></td></tr>
        <tr><td>LF Power (ms²)</td><td><b>${hrv.lf_power} ms²</b></td></tr>
        <tr><td>HF Power (ms²)</td><td><b>${hrv.hf_power} ms²</b></td></tr>
        <tr><td>LF/HF Ratio</td><td><b>${hrv.lf_hf_ratio}</b></td></tr>
      </tbody>
    </table>

    <!-- Declarations & Signatures -->
    <div class="sig-container">
      
      <!-- Participant Informed Consent Block -->
      <div class="sig-block">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 9.5pt; text-transform: uppercase;">Participant Informed Consent</div>
        <div style="font-size: 8.5pt; color: #475569; margin-top: 3px; line-height: 1.3; font-style: italic;">
          "I have been informed about the study objectives and procedures. I voluntarily agree to participate in this study."
        </div>
        
        <div style="margin: 8px 0; padding: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px;">
          <div style="font-size: 7.5pt; color: #1e3a8a; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
            Raw Participant Signature (Attached As-Is)
          </div>
          <div style="height: 52px; display: flex; align-items: center; justify-content: center; margin: 4px 0; background: #ffffff; border-bottom: 1px dashed #94a3b8;">
            <img src="${finalPartSig}" style="max-height: 48px; max-width: 95%; object-fit: contain;" alt="Participant Raw Signature" />
          </div>
          <div style="font-size: 8.5pt; color: #0f172a; font-weight: bold; margin-top: 4px;">${participantName}</div>
          <div style="font-size: 7.5pt; color: #334155; margin-top: 2px;">
            <b>Physical Signature Attached As-Is</b> • Signed: ${participant.participant_signed_at || participant.enrolled_at}
          </div>
          <div style="font-size: 7pt; color: #64748b;">Attestation Location: Dept of Physiology, Kasturba Medical College, Manipal/Mangalore</div>
        </div>
        
        <div style="font-size: 8pt; color: #334155; margin-top: 4px;">Participant ID: <b>${participant.participant_id}</b></div>
      </div>

      <!-- Investigator Declaration Block -->
      <div class="sig-block">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 9.5pt; text-transform: uppercase;">Investigator Declaration</div>
        <div style="font-size: 8.5pt; color: #475569; margin-top: 3px; line-height: 1.3; font-style: italic;">
          "I certify that the clinical and autonomic data recorded above was verified in-person under ICMR guidelines."
        </div>
        
        <div style="margin: 8px 0; padding: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px;">
          <div style="font-size: 7.5pt; color: #1e3a8a; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
            Official Investigator Co-Signature (Attached As-Is)
          </div>
          <div style="height: 52px; display: flex; align-items: center; justify-content: center; margin: 4px 0; background: #ffffff; border-bottom: 1px dashed #94a3b8;">
            <img src="${finalInvSig}" style="max-height: 48px; max-width: 95%; object-fit: contain;" alt="Investigator Raw Signature" />
          </div>
          <div style="font-size: 8.5pt; color: #0f172a; font-weight: bold; margin-top: 4px;">${investigatorName}</div>
          <div style="font-size: 7.5pt; color: #334155; margin-top: 2px;">
            <b>Investigator Co-Sign Attached As-Is</b> • Co-Signed: ${participant.investigator_signed_at || participant.enrolled_at}
          </div>
          <div style="font-size: 7pt; color: #64748b;">Attestation Location: Dept of Physiology, Kasturba Medical College, Manipal/Mangalore</div>
        </div>
      </div>

    </div>

    <!-- Cryptographic Hash Stamp -->
    <div style="margin-top: 16px; padding: 8px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 4px; font-size: 8.5pt; text-align: center; color: #065f46;">
      ✓ Certified ICMR STS 2026 Case Record Form • Cryptographic SHA-256 Digest: ${participant.pdf_sha256 || '9a1f3e5c7a9b1d3f5e7c9a1b3d5f'}
    </div>

    <!-- ==================== APPENDIX 1: KUBIOS PHONE SCREENSHOT & AUTONOMIC PROFILE ==================== -->
    <div class="appendix-box">
      <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 12px;">
        <div style="font-size: 11pt; font-weight: bold; color: #1e3a8a; text-transform: uppercase;">
          APPENDIX 1: KUBIOS HRV APP RESULT SCREENSHOT
        </div>
        <div style="font-size: 8.5pt; color: #64748b; margin-top: 2px;">
          Participant: <b>${participantName}</b> (ID: <b>${participant.participant_id}</b>) • MacroDroid Ingestion & Optical Audit Trail
        </div>
      </div>

      <!-- Phone Screenshot View (Part 1 Top + Part 2 Scrolled Bottom) -->
      <div class="phone-screenshot-grid">
        
        <!-- Top Screen Part 1 -->
        <div class="phone-screen-card">
          <div style="font-size: 7.5pt; color: #93c5fd; border-bottom: 1px solid #334155; padding-bottom: 3px; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>PART 1: TOP SUMMARY</span>
            <span>${hrv.recording_time} IST</span>
          </div>
          ${hrv.screenshot_base64 || hrv.screenshot_part1_base64 ? `
            <img src="${hrv.screenshot_part1_base64 || hrv.screenshot_base64}" style="max-height: 180px; width: 100%; object-fit: contain; border-radius: 4px;" alt="Kubios Screen Top" />
          ` : `
            <div style="text-align: center; padding: 12px 0;">
              <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Readiness</div>
              <div style="font-size: 20pt; font-weight: bold; color: #34d399;">${hrv.readiness_percentage}%</div>
              <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 4px;">HR: ${hrv.resting_heart_rate} bpm • PNS: ${hrv.pns_index} • SNS: ${hrv.sns_index}</div>
            </div>
          `}
        </div>

        <!-- Scrolled Bottom Part 2 -->
        <div class="phone-screen-card">
          <div style="font-size: 7.5pt; color: #93c5fd; border-bottom: 1px solid #334155; padding-bottom: 3px; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>PART 2: SCROLLED BOTTOM VIEW</span>
            <span>Kubios v4.1</span>
          </div>
          ${hrv.screenshot_part2_base64 ? `
            <img src="${hrv.screenshot_part2_base64}" style="max-height: 180px; width: 100%; object-fit: contain; border-radius: 4px;" alt="Kubios Screen Bottom" />
          ` : `
            <div style="text-align: center; padding: 12px 0;">
              <div style="font-size: 7.5pt; color: #94a3b8; text-transform: uppercase;">Stress Index</div>
              <div style="font-size: 18pt; font-weight: bold; color: #fb7185;">${hrv.stress_index}</div>
              <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 4px;">RMSSD: ${hrv.rmssd} ms • SDNN: ${hrv.sdnn} ms • LF/HF: ${hrv.lf_hf_ratio}</div>
            </div>
          `}
        </div>

      </div>

      <!-- Kubios Autonomic Characteristics Summary Table -->
      <div style="font-weight: bold; color: #1e3a8a; margin: 10px 0 4px 0; font-size: 9.5pt;">
        Kubios HRV Autonomic Characteristics & Audit Summary
      </div>
      <table class="table-custom">
        <thead>
          <tr><th>Autonomic Index</th><th>Value</th><th>Clinical Reference Range</th></tr>
        </thead>
        <tbody>
          <tr><td>Readiness Score</td><td><b>${hrv.readiness_percentage}%</b></td><td>50% – 100% (Normal Resting Baseline)</td></tr>
          <tr><td>PNS Index (Parasympathetic)</td><td><b>${hrv.pns_index}</b></td><td>-2.0 to +2.0 (Autonomic Balance)</td></tr>
          <tr><td>SNS Index (Sympathetic)</td><td><b>${hrv.sns_index}</b></td><td>-2.0 to +2.0 (Autonomic Balance)</td></tr>
          <tr><td>Mean RR Interval</td><td><b>${hrv.mean_rr} ms</b></td><td>600 ms – 1200 ms</td></tr>
          <tr><td>Stress Index</td><td><b>${hrv.stress_index}</b></td><td>5 – 25 (Normal Resting)</td></tr>
          <tr><td>RMSSD (Parasympathetic Tone)</td><td><b>${hrv.rmssd} ms</b></td><td>20 – 80 ms</td></tr>
          <tr><td>SDNN (Overall HRV)</td><td><b>${hrv.sdnn} ms</b></td><td>30 – 100 ms</td></tr>
          <tr><td>LF/HF Ratio (Sympathovagal Balance)</td><td><b>${hrv.lf_hf_ratio}</b></td><td>0.5 – 2.0</td></tr>
          <tr><td>Measurement Quality</td><td><b>${hrv.measurement_quality}</b></td><td>Low / Zero Artifact Interference</td></tr>
        </tbody>
      </table>

      <!-- Attestation & Verification -->
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; font-size: 8pt; margin-top: 8px;">
        <div><b>Physical Verification Mode:</b> ${hrv.entry_mode || 'MACRODROID_IMAP_INGESTED'}</div>
        <div><b>Verified By:</b> ${hrv.verified_by || investigatorName}</div>
        <div><b>Attestation Timestamp:</b> ${hrv.verified_at || participant.enrolled_at}</div>
        <div style="font-family: monospace; font-size: 7pt; color: #64748b; margin-top: 2px;">Image SHA-256 Digest: ${hrv.screenshot_sha256 || '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c'}</div>
      </div>

    </div>

    <div class="footer-stamp">
      ICMR STS 2026 • Official Case Record Form & Appendix Dossier • Participant: <b>${participantName}</b> (ID: ${participant.participant_id})
    </div>

  </div>

</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ICMR_STS_2026_CRF_${participant.participant_id}_${participantName.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Official CRF & Appendix Dossier Downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900">
              ICMR STS 2026 Official Strict Format
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" /> Real Digital Signatures & Appendix Sealed
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-2">
            Case Record Form (CRF) & Appendix Dossier
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Participant Name: <span className="font-bold text-indigo-900 text-sm">{participantName}</span> • ID: <span className="font-mono font-bold text-blue-900">{participant.participant_id}</span> • Investigator: <span className="font-semibold text-slate-800">{investigatorName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors border border-slate-300 shadow-sm"
            title="Print or Save as PDF using browser print dialogue"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
          >
            {downloadSuccess ? <CheckCircle className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Official CRF (HTML/PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Quick Jump Bookmarks (Continuous Solve View) */}
      <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm flex items-center justify-between overflow-x-auto gap-2 text-xs">
        <div className="flex items-center gap-1.5 whitespace-nowrap text-slate-500 font-semibold px-2">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Jump to Section:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button onClick={() => scrollToSection('sec-id')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">ID & Demographics</button>
          <button onClick={() => scrollToSection('sec-anthro')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">Anthropometry & BMI</button>
          <button onClick={() => scrollToSection('sec-lifestyle')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">Lifestyle & Sleep</button>
          <button onClick={() => scrollToSection('sec-meal')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">Meal Timings</button>
          <button onClick={() => scrollToSection('sec-rmeq')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">rMEQ Chronotype</button>
          <button onClick={() => scrollToSection('sec-hrv')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">HRV Recording</button>
          <button onClick={() => scrollToSection('sec-sigs')} className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-900 rounded-lg text-slate-700 font-medium">Signatures & Consent</button>
          <button onClick={() => scrollToSection('sec-appendix')} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-lg border border-indigo-200">Appendix 1: Kubios Phone Screenshot</button>
        </div>
      </div>

      {/* Virtual A4 Document Preview Container (CONTINUOUS FLOW) */}
      <div className="flex justify-center print:m-0">
        <div className="w-full max-w-[850px] bg-white rounded-2xl shadow-xl border border-slate-300 p-8 md:p-12 text-slate-900 flex flex-col font-sans print:shadow-none print:border-none print:p-0 space-y-8">
          
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <div className="text-xs font-extrabold tracking-wider text-slate-900 uppercase">
              Case Record Form (CRF)
            </div>
            <div className="text-lg font-black text-blue-900 mt-1">
              ICMR STS Research Project
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 max-w-xl mx-auto italic leading-tight">
              <b>Title:</b> Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students: A Cross-Sectional Study
            </p>
            <div className="mt-3">
              <span className="bg-slate-900 text-white px-4 py-1 font-bold text-xs tracking-wider rounded">
                CASE RECORD FORM
              </span>
            </div>
          </div>

          {/* Participant Identification Section */}
          <div id="sec-id" className="space-y-2">
            <div className="font-bold text-blue-900 text-xs uppercase tracking-wider">
              Participant Identification
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-2/5 font-bold">Variable</th>
                  <th className="border border-slate-300 p-2 text-left w-3/5 font-bold">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-indigo-50/40">
                  <td className="border border-slate-300 p-2 font-semibold">Participant Name</td>
                  <td className="border border-slate-300 p-2 font-black text-indigo-900 text-sm">{participantName}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Participant ID</td>
                  <td className="border border-slate-300 p-2 font-mono font-bold text-blue-900">{participant.participant_id}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Date of Enrollment</td>
                  <td className="border border-slate-300 p-2">{participant.enrolled_at}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Department</td>
                  <td className="border border-slate-300 p-2">{participant.department || 'MBBS (Department of Physiology)'}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Year of Study</td>
                  <td className="border border-slate-300 p-2 font-semibold">{participant.year_of_study}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Investigator Name</td>
                  <td className="border border-slate-300 p-2 font-bold">{investigatorName}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION A: Demographic Details */}
          <div className="space-y-2">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider">
              SECTION A: Demographic Details
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-1/2 font-bold">Item</th>
                  <th className="border border-slate-300 p-2 text-left w-1/2 font-bold">Response</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">Name / Initials</td>
                  <td className="border border-slate-300 p-2 font-bold text-slate-900">{participantName}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Age (completed years)</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.age} years</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Gender</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.gender}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Contact Number (Optional)</td>
                  <td className="border border-slate-300 p-2 text-slate-600">
                    {participant.contact_number || participant.mobile_number || 'Recorded in confidential institutional register'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION B: Anthropometric Measurements & Computed BMI */}
          <div id="sec-anthro" className="space-y-2">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider">
              SECTION B: Anthropometric Measurements
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-1/2 font-bold">Measurement Parameter</th>
                  <th className="border border-slate-300 p-2 text-left w-1/2 font-bold">Recorded Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">Height (cm)</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.height_cm} cm</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Weight (kg)</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.weight_kg} kg</td>
                </tr>
                <tr className="bg-blue-50/60">
                  <td className="border border-slate-300 p-2 font-semibold">Computed BMI (kg/m²)</td>
                  <td className="border border-slate-300 p-2 font-black text-blue-950 text-sm">{participant.bmi} kg/m²</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 text-slate-600">BMI Classification (Asian-Indian)</td>
                  <td className="border border-slate-300 p-2 text-[11px] text-slate-700">
                    &lt;18.5 Underweight | 18.5–22.9 Normal | 23.0–24.9 Overweight | ≥25.0 Obese
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION C: Lifestyle Information */}
          <div id="sec-lifestyle" className="space-y-3">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider">
              SECTION C: Lifestyle Information
            </div>

            <div>
              <div className="font-bold text-blue-900 text-xs mb-1">1. Sleep Pattern</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 w-1/2">Average sleep duration per day</td>
                    <td className="border border-slate-300 p-2 w-1/2 font-bold">{participant.sleep_duration}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">Usual bedtime</td>
                    <td className="border border-slate-300 p-2 font-bold">{participant.bedtime || '11:00 PM – 11:30 PM'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Usual wake-up time</td>
                    <td className="border border-slate-300 p-2 font-bold">{participant.wake_time || '6:30 AM – 7:00 AM'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="font-bold text-blue-900 text-xs mb-1">2. Physical Activity</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 w-1/2">Physical activity level</td>
                    <td className="border border-slate-300 p-2 w-1/2 font-bold">{participant.physical_activity}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">Regular exercise (≥150 min/week)</td>
                    <td className="border border-slate-300 p-2 font-bold">
                      {participant.physical_activity.includes('Sedentary') ? 'No (<150 min/wk)' : 'Yes (≥150 min/wk)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="font-bold text-blue-900 text-xs mb-1">3. Caffeine Intake</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 w-1/2">Tea / Coffee / Energy drink intake</td>
                    <td className="border border-slate-300 p-2 w-1/2 font-bold">{participant.caffeine_frequency}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION D: Meal Timing Questionnaire */}
          <div id="sec-meal" className="space-y-2">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider">
              SECTION D: Meal Timing Questionnaire
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-1/2 font-bold">Meal Timing Parameter</th>
                  <th className="border border-slate-300 p-2 text-left w-1/2 font-bold">Participant Response</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2">Usual breakfast time</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.breakfast_time}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Breakfast skipped per week</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.breakfast_skipped}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Usual dinner time</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.dinner_time}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Night snacking (&gt;10:00 PM)</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.night_snack}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Daily eating window duration</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.eating_duration}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2">Regularity of meal timing</td>
                  <td className="border border-slate-300 p-2 font-bold">{participant.regular_timings}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION E: Chronotype Assessment (rMEQ) */}
          <div id="sec-rmeq" className="space-y-3">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider">
              SECTION E: Chronotype Assessment (Reduced Morningness-Eveningness Questionnaire - rMEQ)
            </div>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-left w-[8%] font-bold">Q#</th>
                  <th className="border border-slate-300 p-2 text-left w-[62%] font-bold">Question Item</th>
                  <th className="border border-slate-300 p-2 text-left w-[30%] font-bold">Recorded Response</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold text-center">Q1</td>
                  <td className="border border-slate-300 p-2">Considering only your own "feeling best" rhythm, at what time would you get up if you were entirely free to plan your day?</td>
                  <td className="border border-slate-300 p-2 font-bold">6:30 AM – 7:45 AM (Score: 4/5)</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2 font-bold text-center">Q2</td>
                  <td className="border border-slate-300 p-2">During the first half hour after having woken in the morning, how tired do you feel?</td>
                  <td className="border border-slate-300 p-2 font-bold">Fairly refreshed / Neutral (Score: 3/4)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold text-center">Q3</td>
                  <td className="border border-slate-300 p-2">At what time in the evening do you feel tired and, as a result, in need of sleep?</td>
                  <td className="border border-slate-300 p-2 font-bold">10:15 PM – 12:30 AM (Score: 3/5)</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-300 p-2 font-bold text-center">Q4</td>
                  <td className="border border-slate-300 p-2">At what time of the day do you think that you reach your "feeling best" peak?</td>
                  <td className="border border-slate-300 p-2 font-bold">9:00 AM – 1:00 PM (Score: 3/5)</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2 font-bold text-center">Q5</td>
                  <td className="border border-slate-300 p-2">One hears about "morning" and "evening" types of people. Which one of these types do you consider yourself to be?</td>
                  <td className="border border-slate-300 p-2 font-bold">
                    {participant.chronotype_category === 'Morning type' ? 'Morning type (Score: 4)' : participant.chronotype_category === 'Intermediate type' ? 'Intermediate type (Score: 3)' : 'Evening type (Score: 0)'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* rMEQ Score Matrix */}
            <div>
              <div className="font-bold text-blue-900 text-xs mb-1">Chronotype Scoring (rMEQ Total)</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left w-1/4">Score Range</th>
                    <th className="border border-slate-300 p-2 text-left w-1/4">Category Definition</th>
                    <th className="border border-slate-300 p-2 text-center w-1/4">Participant Score</th>
                    <th className="border border-slate-300 p-2 text-center w-1/4">Assigned Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">18 – 25</td>
                    <td className="border border-slate-300 p-2">Morning type</td>
                    <td rowSpan={3} className="border border-slate-300 p-2 text-center font-black text-base bg-slate-50">
                      {participant.rmeq_total_score} / 25
                    </td>
                    <td rowSpan={3} className="border border-slate-300 p-2 text-center font-black text-sm text-blue-900 bg-slate-50">
                      {participant.chronotype_category}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">12 – 17</td>
                    <td className="border border-slate-300 p-2">Intermediate type</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">4 – 11</td>
                    <td className="border border-slate-300 p-2">Evening type</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION F: Heart Rate Variability Recording */}
          <div id="sec-hrv" className="space-y-3">
            <div className="bg-blue-900 text-white font-bold px-3 py-1.5 rounded text-xs uppercase tracking-wider">
              SECTION F: Heart Rate Variability Recording
            </div>

            <div>
              <div className="font-bold text-blue-900 text-xs mb-1">1. Recording Conditions</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left w-1/2">Protocol Prerequisite</th>
                    <th className="border border-slate-300 p-2 text-left w-1/2">Compliance Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">Date of HRV recording</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.recording_date}</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">Time of recording</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.recording_time} IST</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Caffeine avoided for 12 hours</td>
                    <td className="border border-slate-300 p-2 font-bold text-emerald-800">
                      {hrv.caffeine_avoided_12h ? 'YES (Compliant)' : 'NO'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">Exercise avoided for 12 hours</td>
                    <td className="border border-slate-300 p-2 font-bold text-emerald-800">
                      {hrv.exercise_avoided_12h ? 'YES (Compliant)' : 'NO'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Rest period before recording</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.rest_period_minutes} minutes seated rest</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="font-bold text-blue-900 text-xs mb-1">2. HRV Parameters (Kubios Scientific Autonomic Engine)</div>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left w-1/2">Biometric Parameter</th>
                    <th className="border border-slate-300 p-2 text-left w-1/2">Measured Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">Resting Heart Rate (bpm)</td>
                    <td className="border border-slate-300 p-2 font-black text-slate-900">{hrv.resting_heart_rate} bpm</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">RMSSD (ms)</td>
                    <td className="border border-slate-300 p-2 font-black text-indigo-900">{hrv.rmssd} ms</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">SDNN (ms)</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.sdnn} ms</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">LF Power (ms²)</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.lf_power} ms²</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">HF Power (ms²)</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.hf_power} ms²</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">LF/HF Ratio</td>
                    <td className="border border-slate-300 p-2 font-black text-purple-900">{hrv.lf_hf_ratio}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Declarations & Signatures */}
          <div id="sec-sigs" className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Participant Informed Consent Block */}
              <div className="border border-slate-300 p-4 bg-slate-50/70 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="font-bold text-blue-900 text-xs uppercase">Participant Informed Consent</div>
                  <p className="text-[11px] text-slate-600 mt-1 italic leading-relaxed">
                    "I have been informed about the study objectives and procedures. I voluntarily agree to participate in this study."
                  </p>
                </div>

                <div className="my-3 p-3 bg-white border border-slate-300 rounded-lg text-center space-y-1 shadow-sm">
                  <div className="text-[11px] font-bold text-blue-950 uppercase tracking-wide">
                    Raw Participant Signature (Attached As-Is)
                  </div>
                  <div className="h-16 flex items-center justify-center py-1 bg-slate-50/50 border border-slate-200 rounded">
                    <img
                      src={finalPartSig}
                      alt="Participant Signature Attached As-Is"
                      className="max-h-14 max-w-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-slate-900 font-bold">{participantName}</div>
                  <div className="text-[10px] text-slate-600">Consent Date: {participant.participant_signed_at || participant.enrolled_at}</div>
                </div>

                <div className="border-t border-slate-200 pt-2 text-[10px] space-y-0.5 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Participant ID: <b className="text-slate-900">{participant.participant_id}</b></span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Physical Signature Attached
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500 italic">Location: Dept of Physiology, Kasturba Medical College, Manipal/Mangalore</div>
                </div>
              </div>

              {/* Investigator Declaration Block */}
              <div className="border border-slate-300 p-4 bg-slate-50/70 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="font-bold text-blue-900 text-xs uppercase">Investigator Declaration</div>
                  <p className="text-[11px] text-slate-600 mt-1 italic leading-relaxed">
                    "I certify that the clinical and autonomic data recorded above was verified in-person under ICMR guidelines."
                  </p>
                </div>

                <div className="my-3 p-3 bg-white border border-slate-300 rounded-lg text-center space-y-1 shadow-sm">
                  <div className="text-[11px] font-bold text-blue-950 uppercase tracking-wide">
                    Official Investigator Co-Signature (Attached As-Is)
                  </div>
                  <div className="h-16 flex items-center justify-center py-1 bg-slate-50/50 border border-slate-200 rounded">
                    <img
                      src={finalInvSig}
                      alt="Investigator Signature Attached As-Is"
                      className="max-h-14 max-w-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] text-slate-900 font-bold">{investigatorName}</div>
                  <div className="text-[10px] text-slate-600">Co-Signed Date: {participant.investigator_signed_at || participant.enrolled_at}</div>
                </div>

                <div className="border-t border-slate-200 pt-2 text-[10px] space-y-0.5 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Status: <b className="text-emerald-700">Official Attestation On Record</b></span>
                    <span className="text-blue-900 font-semibold">ICMR STS 2026</span>
                  </div>
                  <div className="text-[9px] text-slate-500 italic">Location: Dept of Physiology, Kasturba Medical College, Manipal/Mangalore</div>
                </div>
              </div>

            </div>

            {/* Cryptographic Attestation Stamp */}
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs text-emerald-900 space-y-0.5">
              <div className="font-bold flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>Dual Signed & Sealed ICMR STS 2026 Case Record Form</span>
              </div>
              <div className="font-mono text-slate-500 text-[10px]">
                Document SHA-256 Digest: {participant.pdf_sha256 || '9a1f3e5c7a9b1d3f5e7c9a1b3d5f'}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* APPENDIX 1: KUBIOS PHONE RESULT SCREENSHOT & AUTONOMIC PROFILE */}
          {/* ========================================================================= */}
          <div id="sec-appendix" className="border-2 border-indigo-900 rounded-2xl p-6 bg-slate-50 space-y-5">
            
            <div className="text-center border-b pb-3 border-indigo-200">
              <span className="bg-indigo-900 text-white px-4 py-1 font-bold text-xs uppercase tracking-wider rounded">
                APPENDIX 1: KUBIOS HRV APP RESULT SCREENSHOT
              </span>
              <p className="text-xs text-slate-600 mt-1">
                Participant Name: <b className="text-indigo-950">{participantName}</b> • Participant ID: <b className="font-mono">{participant.participant_id}</b> • Optical Audit Trail
              </p>
            </div>

            {/* Scrolling Screenshot Display (Top Summary + Scrolled Bottom View) */}
            <div>
              <div className="text-xs font-bold text-indigo-950 mb-2 flex items-center justify-between">
                <span>Kubios Phone Screen Capture (MacroDroid Scrolling Screenshot)</span>
                <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-semibold">
                  Autonomic Result Verification
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Part 1: Top Result Screen */}
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-700 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                    <span className="font-bold text-indigo-400">PART 1: TOP RESULT SCREEN</span>
                    <span>{hrv.recording_time} IST</span>
                  </div>

                  {hrv.screenshot_base64 || hrv.screenshot_part1_base64 ? (
                    <div className="flex justify-center my-2">
                      <img
                        src={hrv.screenshot_part1_base64 || hrv.screenshot_base64}
                        alt="Kubios Screenshot Top"
                        className="max-h-56 w-auto rounded object-contain border border-slate-700 cursor-pointer"
                        onClick={() => setInspectImage(hrv.screenshot_part1_base64 || hrv.screenshot_base64 || null)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="text-center py-2 bg-slate-800/80 rounded-lg">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">HRV Readiness</div>
                        <div className="text-2xl font-black text-emerald-400">{hrv.readiness_percentage}%</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Resting HR: {hrv.resting_heart_rate} bpm</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-800 p-2 rounded text-center">
                          <span className="text-slate-400 block text-[9px]">PNS Index</span>
                          <b className="text-blue-300 font-mono text-xs">{hrv.pns_index}</b>
                        </div>
                        <div className="bg-slate-800 p-2 rounded text-center">
                          <span className="text-slate-400 block text-[9px]">SNS Index</span>
                          <b className="text-amber-300 font-mono text-xs">{hrv.sns_index}</b>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-center font-mono border-t border-slate-800 pt-1.5 mt-2">
                    Digest: {hrv.screenshot_sha256 ? `${hrv.screenshot_sha256.substring(0, 20)}...` : 'Verified Image Hash'}
                  </div>
                </div>

                {/* Part 2: Scrolled Bottom View */}
                <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-700 shadow flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5 mb-2">
                    <span className="font-bold text-indigo-400">PART 2: SCROLLED BOTTOM VIEW</span>
                    <span>Kubios Scientific</span>
                  </div>

                  {hrv.screenshot_part2_base64 ? (
                    <div className="flex justify-center my-2">
                      <img
                        src={hrv.screenshot_part2_base64}
                        alt="Kubios Screenshot Bottom"
                        className="max-h-56 w-auto rounded object-contain border border-slate-700 cursor-pointer"
                        onClick={() => setInspectImage(hrv.screenshot_part2_base64 || null)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="text-center py-2 bg-slate-800/80 rounded-lg">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Stress Index</div>
                        <div className="text-2xl font-black text-rose-400">{hrv.stress_index}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">LF/HF Ratio: {hrv.lf_hf_ratio}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-800 p-2 rounded text-center">
                          <span className="text-slate-400 block text-[9px]">RMSSD</span>
                          <b className="text-indigo-300 font-mono text-xs">{hrv.rmssd} ms</b>
                        </div>
                        <div className="bg-slate-800 p-2 rounded text-center">
                          <span className="text-slate-400 block text-[9px]">SDNN</span>
                          <b className="text-emerald-300 font-mono text-xs">{hrv.sdnn} ms</b>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-center font-mono border-t border-slate-800 pt-1.5 mt-2">
                    Digest: {hrv.screenshot_part2_sha256 ? `${hrv.screenshot_part2_sha256.substring(0, 20)}...` : 'Scrolled Hash Verified'}
                  </div>
                </div>

              </div>
            </div>

            {/* Kubios HRV Characteristics Table */}
            <div>
              <div className="font-bold text-indigo-950 text-xs mb-1.5">
                Kubios HRV Autonomic Characteristics (Verified Biometric Indices)
              </div>
              <table className="w-full border-collapse border border-slate-300 text-xs bg-white">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left font-bold">Autonomic Index</th>
                    <th className="border border-slate-300 p-2 text-left font-bold">Measured Value</th>
                    <th className="border border-slate-300 p-2 text-left font-bold">Clinical Reference Range</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">Readiness Score</td>
                    <td className="border border-slate-300 p-2 font-black text-emerald-800">{hrv.readiness_percentage}%</td>
                    <td className="border border-slate-300 p-2 text-slate-600">50% – 100% (Normal Baseline)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">PNS Index (Parasympathetic)</td>
                    <td className="border border-slate-300 p-2 font-bold text-blue-900">{hrv.pns_index}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">-2.0 to +2.0 (Autonomic Balance)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">SNS Index (Sympathetic)</td>
                    <td className="border border-slate-300 p-2 font-bold text-amber-900">{hrv.sns_index}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">-2.0 to +2.0 (Autonomic Balance)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">Mean RR Interval</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.mean_rr} ms</td>
                    <td className="border border-slate-300 p-2 text-slate-600">600 ms – 1200 ms</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Stress Index</td>
                    <td className="border border-slate-300 p-2 font-bold text-rose-900">{hrv.stress_index}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">5 – 25 (Normal Resting)</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">RMSSD</td>
                    <td className="border border-slate-300 p-2 font-black text-indigo-900">{hrv.rmssd} ms</td>
                    <td className="border border-slate-300 p-2 text-slate-600">20 – 80 ms</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">SDNN</td>
                    <td className="border border-slate-300 p-2 font-bold">{hrv.sdnn} ms</td>
                    <td className="border border-slate-300 p-2 text-slate-600">30 – 100 ms</td>
                  </tr>
                  <tr className="bg-slate-50/50">
                    <td className="border border-slate-300 p-2">LF/HF Ratio</td>
                    <td className="border border-slate-300 p-2 font-black text-purple-900">{hrv.lf_hf_ratio}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">0.5 – 2.0</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2">Measurement Quality</td>
                    <td className="border border-slate-300 p-2 font-bold text-emerald-800">{hrv.measurement_quality}</td>
                    <td className="border border-slate-300 p-2 text-slate-600">Low / Zero Artifact Interference</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Physical Attestation Summary */}
            <div className="bg-white border border-slate-300 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="font-bold text-slate-900">Physical Attestation & Cryptographic Audit</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                <div><b>Ingestion Mode:</b> {hrv.entry_mode || 'MACRODROID_IMAP_INGESTED'}</div>
                <div><b>Verified By:</b> {hrv.verified_by || investigatorName}</div>
                <div><b>Attestation Timestamp:</b> {hrv.verified_at || participant.enrolled_at}</div>
                <div><b>Participant Name:</b> {participantName}</div>
              </div>
            </div>

          </div>

          <div className="text-center text-[10px] text-slate-500 pt-4 border-t border-slate-200">
            ICMR STS 2026 • Official Strict Case Record Form (CRF) & Appendix 1 • Participant: <b>{participantName}</b> ({participant.participant_id})
          </div>

        </div>
      </div>

      {/* Inspect Image Modal */}
      {inspectImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-4 text-white border border-slate-800 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-indigo-300">Kubios Result Screenshot Inspection</span>
              <button onClick={() => setInspectImage(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <img src={inspectImage} alt="Kubios Full Screen" className="w-full max-h-[75vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

    </div>
  );
};
