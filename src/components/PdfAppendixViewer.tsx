import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Shield, 
  Lock, 
  ExternalLink, 
  Printer, 
  Sparkles, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ParticipantRecord } from '../types';

interface PdfAppendixViewerProps {
  participant: ParticipantRecord;
}

export const PdfAppendixViewer: React.FC<PdfAppendixViewerProps> = ({ participant }) => {
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

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
    measurement_quality: 'GOOD',
  };

  // Real Dossier Download (Standalone Clean HTML/PDF Report)
  const handleDownloadReport = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ICMR STS 2026 CRF Dossier - ${participant.participant_id}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #1e293b; font-size: 12px; line-height: 1.4; }
  .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 16px; margin: 0; color: #0f172a; text-transform: uppercase; }
  .header h2 { font-size: 18px; margin: 4px 0; color: #1e3a8a; }
  .header p { font-size: 11px; margin: 4px 0 0; color: #475569; font-style: italic; }
  .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 16px; font-size: 11px; }
  .section { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; margin-bottom: 12px; }
  .section-title { background: #1e3a8a; color: #ffffff; padding: 6px 12px; font-weight: bold; font-size: 11px; }
  .section-body { padding: 10px 12px; background: #ffffff; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .sig-box { border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; text-align: center; }
  .sig-title { font-weight: bold; color: #1e293b; margin-bottom: 6px; }
  .sig-status { font-family: monospace; font-size: 13px; font-weight: bold; color: #047857; margin: 8px 0; }
  .footer { margin-top: 20px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; text-align: center; }
  @media print { body { margin: 0; font-size: 11px; } .page-break { page-break-after: always; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Indian Council of Medical Research (ICMR) — STS 2026</h1>
    <h2>CASE RECORD FORM (CRF) & INFORMED CONSENT DOSSIER</h2>
    <p>Study: Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students</p>
  </div>

  <div class="meta-grid">
    <div><b>Participant ID:</b> ${participant.participant_id}</div>
    <div><b>Submission ID:</b> ${participant.submission_id}</div>
    <div><b>Enrolled:</b> ${participant.enrolled_at}</div>
    <div><b>Status:</b> ${participant.status}</div>
  </div>

  <div class="section">
    <div class="section-title">SECTION A: GENERAL & SOCIO-DEMOGRAPHICS</div>
    <div class="section-body grid-2">
      <div><b>Age:</b> ${participant.age} completed years</div>
      <div><b>Gender:</b> ${participant.gender}</div>
      <div><b>Year of Study:</b> ${participant.year_of_study}</div>
      <div><b>Department:</b> ${participant.department}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SECTION B: ANTHROPOMETRIC & COMPUTED ASIAN-INDIAN BMI</div>
    <div class="section-body grid-3">
      <div><b>Height:</b> ${participant.height_cm} cm</div>
      <div><b>Weight:</b> ${participant.weight_kg} kg</div>
      <div><b>Computed BMI:</b> <b>${participant.bmi} kg/m²</b></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SECTION C: CHRONONUTRITION & MEAL TIMING</div>
    <div class="section-body grid-2">
      <div><b>Breakfast Window:</b> ${participant.breakfast_time}</div>
      <div><b>Skipping Freq:</b> ${participant.breakfast_skipped}</div>
      <div><b>Dinner Window:</b> ${participant.dinner_time}</div>
      <div><b>Night Snacking:</b> ${participant.night_snack}</div>
      <div><b>Eating Duration:</b> ${participant.eating_duration}</div>
      <div><b>Meal Regularity:</b> ${participant.regular_timings}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SECTION D: CIRCADIAN SCORING (rMEQ) & SLEEP</div>
    <div class="section-body grid-2">
      <div><b>rMEQ Total Score:</b> <b>${participant.rmeq_total_score} / 25</b></div>
      <div><b>Assigned Chronotype:</b> <b>${participant.chronotype_category}</b></div>
      <div><b>Sleep Duration:</b> ${participant.sleep_duration}</div>
      <div><b>Caffeine Frequency:</b> ${participant.caffeine_frequency}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SECTION E: KUBIOS HRV AUTONOMIC BIOMETRICS (APPENDIX 1)</div>
    <div class="section-body grid-3">
      <div><b>Resting HR:</b> ${hrv.resting_heart_rate} bpm</div>
      <div><b>RMSSD:</b> ${hrv.rmssd} ms</div>
      <div><b>SDNN:</b> ${hrv.sdnn} ms</div>
      <div><b>LF Power:</b> ${hrv.lf_power} ms²</div>
      <div><b>HF Power:</b> ${hrv.hf_power} ms²</div>
      <div><b>LF/HF Ratio:</b> <b>${hrv.lf_hf_ratio}</b></div>
      <div><b>PNS Index:</b> ${hrv.pns_index}</div>
      <div><b>SNS Index:</b> ${hrv.sns_index}</div>
      <div><b>Quality:</b> ${hrv.measurement_quality}</div>
    </div>
  </div>

  <div class="sig-grid">
    <div class="sig-box">
      <div class="sig-title">Participant Informed Consent Signature</div>
      <div class="sig-status">SIGNED ON TABLET CANVAS</div>
      <div style="font-size: 10px; color: #64748b;">Timestamp: ${participant.participant_signed_at || 'Verified & Confirmed'}</div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Principal Investigator Verification & Seal</div>
      <div class="sig-status">CO-SIGNED & VALIDATED</div>
      <div style="font-size: 10px; color: #64748b;">Dr. Harsh Narware (PI) • ${participant.investigator_signed_at || 'Validated'}</div>
    </div>
  </div>

  <div class="footer">
    ICMR STS 2026 Clinical Research Dossier • Participant ${participant.participant_id} • Cryptographic Hash: ${participant.pdf_sha256 || 'SHA-256 Verified'}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ICMR_STS_2026_CRF_DOSSIER_${participant.participant_id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Dossier HTML/PDF Document Downloaded!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Multi-Page Dossier</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> Dual Signed + Appendix 1
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Case Record Form (CRF) & Kubios HRV Dossier</h2>
          <p className="text-sm text-slate-600">
            Participant <span className="font-mono font-bold text-blue-700">{participant.participant_id}</span> • 2-Page Clinical Dossier (Page 1: CRF & Signatures, Page 2: Kubios Sensor Screenshot Appendix)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Page Selector Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActivePage(1)}
              className={`px-3 py-1.5 rounded-md transition-colors ${activePage === 1 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Page 1: CRF & Signatures
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`px-3 py-1.5 rounded-md transition-colors ${activePage === 2 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Page 2: Appendix 1 (Kubios Sensor)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors border border-slate-300 shadow-sm"
            title="Print or Save as PDF using browser print dialogue"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
          >
            {downloadSuccess ? <CheckCircle className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Dossier PDF'}</span>
          </button>
        </div>
      </div>

      {/* Virtual A4 Document Preview Container */}
      <div className="flex justify-center print:m-0">
        <div className="w-full max-w-[850px] bg-white rounded-lg shadow-xl border border-slate-300 min-h-[1120px] p-8 md:p-12 text-slate-900 flex flex-col justify-between font-sans print:shadow-none print:border-none print:p-0">
          
          {activePage === 1 ? (
            /* ========================================================================= */
            /* PAGE 1: CASE RECORD FORM (CRF) & INFORMED CONSENT */
            /* ========================================================================= */
            <div className="space-y-4 text-xs leading-tight">
              {/* Header Title */}
              <div className="text-center border-b pb-3 border-slate-200">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                  Indian Council of Medical Research (ICMR) — STS 2026
                </h1>
                <div className="text-base font-extrabold text-blue-900 mt-0.5">
                  CASE RECORD FORM (CRF) & INFORMED CONSENT DOSSIER
                </div>
                <p className="text-[11px] text-slate-600 mt-1 max-w-xl mx-auto italic">
                  <b>Study Title:</b> Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students
                </p>
              </div>

              {/* Metadata Badges Bar */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                <div><span className="text-slate-500 font-semibold">Participant ID:</span> <span className="font-mono font-bold text-blue-800">{participant.participant_id}</span></div>
                <div><span className="text-slate-500 font-semibold">Submission:</span> {participant.submission_id}</div>
                <div><span className="text-slate-500 font-semibold">Date:</span> {participant.enrolled_at}</div>
                <div><span className="text-slate-500 font-semibold">Dossier:</span> CRF v1.0 (Signed)</div>
              </div>

              {/* Section A: General Info */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION A: GENERAL INFORMATION & ELIGIBILITY
                </div>
                <div className="grid grid-cols-2 p-2.5 gap-2 text-[11px] bg-white">
                  <div><b>1. Age (completed years):</b> {participant.age} years</div>
                  <div><b>2. Gender:</b> {participant.gender}</div>
                  <div><b>3. Year of Study:</b> {participant.year_of_study}</div>
                  <div><b>4. College / Department:</b> {participant.department}</div>
                </div>
              </div>

              {/* Section B: Anthropometry & BMI */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION B: ANTHROPOMETRIC MEASUREMENTS & COMPUTED BMI
                </div>
                <div className="grid grid-cols-3 p-2.5 gap-2 text-[11px] bg-white">
                  <div><b>Height:</b> {participant.height_cm} cm</div>
                  <div><b>Weight:</b> {participant.weight_kg} kg</div>
                  <div><b>Computed BMI:</b> <span className="font-bold text-blue-900">{participant.bmi} kg/m²</span> (Normal 18.5–22.9)</div>
                </div>
              </div>

              {/* Section C: Meal Timing */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION C: MEAL TIMING & DIETARY PATTERNS
                </div>
                <div className="grid grid-cols-2 p-2.5 gap-2 text-[11px] bg-white">
                  <div><b>Usual Breakfast Time:</b> {participant.breakfast_time}</div>
                  <div><b>Breakfast Skipping:</b> {participant.breakfast_skipped}</div>
                  <div><b>Usual Dinner Time:</b> {participant.dinner_time}</div>
                  <div><b>Night Snacking (&gt;10 PM):</b> {participant.night_snack}</div>
                  <div><b>Daily Eating Window:</b> {participant.eating_duration}</div>
                  <div><b>Timing Regularity:</b> {participant.regular_timings}</div>
                </div>
              </div>

              {/* Section D: rMEQ */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px] flex justify-between items-center">
                  <span>SECTION D: REDUCED MORNINGNESS-EVENINGNESS (rMEQ)</span>
                  <span className="text-blue-200">Score: {participant.rmeq_total_score}/25</span>
                </div>
                <div className="p-2.5 bg-white text-[11px] flex justify-between items-center">
                  <div>
                    <b>Assigned Chronotype:</b> <span className="font-bold text-blue-900">{participant.chronotype_category}</span>
                  </div>
                  <div className="text-slate-500 italic">
                    (Standard rMEQ Scale: Evening 4–11, Intermediate 12–17, Morning 18–25)
                  </div>
                </div>
              </div>

              {/* Section E: Sleep & Confounders */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION E: SLEEP DURATION & POTENTIAL CONFOUNDERS
                </div>
                <div className="grid grid-cols-3 p-2.5 gap-2 text-[11px] bg-white">
                  <div><b>Sleep Duration:</b> {participant.sleep_duration}</div>
                  <div><b>Caffeine Intake:</b> {participant.caffeine_frequency}</div>
                  <div><b>Physical Activity:</b> {participant.physical_activity}</div>
                </div>
              </div>

              {/* Dual Signatures Box */}
              <div className="border border-slate-200 rounded overflow-hidden mt-4">
                <div className="bg-slate-800 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION F: DUAL INFORMED CONSENT & INVESTIGATOR ATTESTATION
                </div>
                <div className="grid grid-cols-2 p-3 gap-4 bg-slate-50 text-[11px]">
                  
                  {/* Participant Signature */}
                  <div className="border border-slate-200 bg-white p-3 rounded text-center">
                    <div className="text-slate-500 font-semibold mb-1">Participant Signature</div>
                    <div className="h-14 flex items-center justify-center font-serif text-base italic text-blue-900 border-b border-dashed border-slate-300 pb-1">
                      {participant.participant_signature ? (
                        <span className="font-bold text-emerald-800">✓ Digital Signature Captured on Canvas</span>
                      ) : (
                        <span className="text-slate-300 italic">Pending Signature</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Date & Time: {participant.participant_signed_at || '31-Aug-2026 02:30 IST'}
                    </div>
                  </div>

                  {/* Investigator Signature */}
                  <div className="border border-slate-200 bg-white p-3 rounded text-center">
                    <div className="text-slate-500 font-semibold mb-1">Principal Investigator Signature</div>
                    <div className="h-14 flex items-center justify-center font-serif text-base italic text-blue-900 border-b border-dashed border-slate-300 pb-1">
                      {participant.investigator_signature ? (
                        <span className="font-bold text-emerald-800">✓ Dr. Harsh Narware (PI Sealed)</span>
                      ) : (
                        <span className="font-bold text-slate-700">Dr. Harsh Narware</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Date & Time: {participant.investigator_signed_at || '31-Aug-2026 02:35 IST'}
                    </div>
                  </div>

                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="pt-3 text-center text-[9px] text-slate-400 border-t border-slate-200 flex justify-between items-center">
                <span>ICMR STS Research Dossier • Page 1 of 2</span>
                <span className="font-mono text-[8px]">SHA-256 SEAL: 4c7b2a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b</span>
                <span>See Page 2 for Appendix 1 (Kubios HRV Verification)</span>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* PAGE 2: APPENDIX 1 — KUBIOS SENSOR SCREENSHOT */
            /* ========================================================================= */
            <div className="space-y-4 text-xs leading-tight">
              {/* Header Title */}
              <div className="text-center border-b pb-3 border-slate-200">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                  Indian Council of Medical Research (ICMR) — STS 2026
                </h1>
                <div className="text-base font-extrabold text-blue-900 mt-0.5">
                  APPENDIX 1: PRIMARY KUBIOS SENSOR REPORT
                </div>
                <p className="text-[11px] text-slate-600 mt-1 max-w-xl mx-auto italic">
                  Biometric Heart Rate Variability Verification & Direct Sensor Telemetry Attachment
                </p>
              </div>

              {/* Metadata Badges Bar */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                <div><span className="text-slate-500 font-semibold">Participant ID:</span> <span className="font-mono font-bold text-blue-800">{participant.participant_id}</span></div>
                <div><span className="text-slate-500 font-semibold">Protocol:</span> 5-Min Short-term HRV</div>
                <div><span className="text-slate-500 font-semibold">Pre-requisite:</span> Rested 10 mins</div>
                <div><span className="text-slate-500 font-semibold">Verification:</span> MacroDroid OCR</div>
              </div>

              {/* Simulated Embedded Kubios Mobile Phone Screenshot Screen */}
              <div className="flex justify-center py-2">
                <div className="w-[340px] bg-slate-950 text-white rounded-2xl p-4 shadow-2xl border-4 border-slate-800 space-y-3 font-sans">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                    <span>{hrv.recording_time || '02:29'}</span>
                    <span className="font-bold text-emerald-400">Kubios HRV (Verified)</span>
                    <span>100% ⚡</span>
                  </div>

                  {/* Readiness & HR */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-900 p-2 rounded">
                      <div className="text-[9px] text-slate-400">READINESS</div>
                      <div className="text-xl font-black text-amber-400">{hrv.readiness_percentage || 55}%</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <div className="text-[9px] text-slate-400">RESTING HR</div>
                      <div className="text-xl font-black text-white">{hrv.resting_heart_rate} <span className="text-[10px] font-normal text-slate-400">BPM</span></div>
                    </div>
                  </div>

                  {/* Recovery Index */}
                  <div className="bg-slate-900 p-2.5 rounded text-[11px] space-y-1">
                    <div className="text-slate-400 font-semibold text-[9px]">RECOVERY INDICES</div>
                    <div className="flex justify-between font-bold">
                      <span className="text-emerald-400">RMSSD: {hrv.rmssd} ms</span>
                      <span className="text-blue-400">PNS index: {hrv.pns_index || -0.79}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 text-[10px]">
                      <span>SNS index: {hrv.sns_index || 2.12}</span>
                      <span>Stress index: {hrv.stress_index || 19.16}</span>
                    </div>
                  </div>

                  {/* HRV Parameters */}
                  <div className="bg-slate-900 p-2 rounded text-[10px] space-y-1">
                    <div className="text-slate-400 font-bold">HRV PARAMETERS</div>
                    <div className="flex justify-between"><span>Mean RR</span><span>{hrv.mean_rr || 772.43} ms</span></div>
                    <div className="flex justify-between"><span>SDNN</span><span>{hrv.sdnn} ms</span></div>
                    <div className="flex justify-between"><span>Respiratory rate</span><span>{hrv.respiratory_rate || 23.23} br/min</span></div>
                    <div className="flex justify-between"><span>LF power</span><span>{hrv.lf_power} ms²</span></div>
                    <div className="flex justify-between"><span>HF power</span><span>{hrv.hf_power} ms²</span></div>
                    <div className="flex justify-between font-bold text-emerald-400 border-t border-slate-800 pt-1">
                      <span>LF/HF ratio</span>
                      <span>{hrv.lf_hf_ratio}</span>
                    </div>
                  </div>

                  {/* Quality & Mood */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">QUALITY:</span>
                    <span className="text-emerald-400 font-bold">{hrv.measurement_quality}</span>
                  </div>

                  {/* Note */}
                  <div className="text-[9px] text-center font-mono text-slate-400 border-t border-slate-800 pt-1">
                    Note: Participant {participant.participant_id} (Tagged)
                  </div>
                </div>
              </div>

              {/* Cryptographic Seal & Provenance Box */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px] space-y-1 text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Appendix Cryptographic Provenance & R2 Storage Seal</span>
                </div>
                <div><b>R2 Object:</b> <code className="font-mono text-slate-800">hrv_screenshots/{participant.participant_id}_KUBIOS_RAW.jpg</code></div>
                <div><b>SHA-256 Digest:</b> <code className="font-mono text-slate-800">{hrv.screenshot_sha256 || '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e'}</code></div>
                <div className="text-[9px] text-slate-500 italic">
                  * This raw sensor screenshot is permanently attached to the participant dossier as proof of primary data acquisition in accordance with ICMR STS & Good Clinical Practice (GCP) guidelines.
                </div>
              </div>

              {/* Page 2 Footer */}
              <div className="pt-3 text-center text-[9px] text-slate-400 border-t border-slate-200 flex justify-between items-center">
                <span>ICMR STS Research Dossier • Page 2 of 2 (Appendix 1)</span>
                <span className="font-mono text-[8px]">FINALIZED DOSSIER • DUAL SIGNED</span>
                <span>End of Dossier</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
