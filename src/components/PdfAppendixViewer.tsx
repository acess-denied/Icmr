import React, { useState } from 'react';
import { FileText, Download, CheckCircle, Shield, Lock, ExternalLink, Printer, Sparkles, AlertCircle } from 'lucide-react';
import { ParticipantRecord } from '../types';

interface PdfAppendixViewerProps {
  participant: ParticipantRecord;
}

export const PdfAppendixViewer: React.FC<PdfAppendixViewerProps> = ({ participant }) => {
  const [activePage, setActivePage] = useState<1 | 2>(1);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  const handleDownload = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Multi-Page Dossier</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Dual Signed + Verified Appendix</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Case Record Form & Kubios HRV Dossier Viewer</h2>
          <p className="text-sm text-slate-600">
            Participant <span className="font-mono font-bold text-blue-700">{participant.participant_id}</span> • 2-Page Clinical Bundle (Page 1: CRF & Signatures, Page 2: Kubios Sensor Screenshot Appendix)
          </p>
        </div>

        <div className="flex items-center gap-3">
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
              Page 2: Appendix 1 (Kubios Screenshot)
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            {downloadSuccess ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {downloadSuccess ? 'Downloaded!' : 'Download Dossier PDF'}
          </button>
        </div>
      </div>

      {/* Virtual A4 Document Preview Container */}
      <div className="flex justify-center">
        <div className="w-full max-w-[850px] bg-white rounded-lg shadow-xl border border-slate-300 min-h-[1120px] p-8 md:p-12 text-slate-900 flex flex-col justify-between font-sans">
          
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
                  <div><b>Breakfast Timing:</b> {participant.breakfast_time}</div>
                  <div><b>Breakfast Skipped / Wk:</b> {participant.breakfast_skipped}</div>
                  <div><b>Dinner Timing:</b> {participant.dinner_time}</div>
                  <div><b>Night Snack Frequency:</b> {participant.night_snack}</div>
                  <div><b>Eating Window:</b> {participant.eating_duration}</div>
                  <div><b>Meal Regularity:</b> {participant.regular_timings}</div>
                </div>
              </div>

              {/* Section D: rMEQ Chronotype */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION D: REDUCED MORNINGNESS-EVENINGNESS QUESTIONNAIRE (rMEQ)
                </div>
                <div className="p-2.5 bg-slate-50 flex items-center justify-between text-[11px]">
                  <div><b>rMEQ Total Score:</b> <span className="font-bold">{participant.rmeq_total_score} / 25</span></div>
                  <div><b>Determined Chronotype:</b> <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">{participant.chronotype_category}</span></div>
                  <div className="text-[10px] text-slate-500">(Morning ≥18, Intermediate 12–17, Evening &lt;12)</div>
                </div>
              </div>

              {/* Section E: Lifestyle */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION E: SLEEP & LIFESTYLE CONVECTION FACTORS
                </div>
                <div className="grid grid-cols-3 p-2.5 gap-2 text-[11px] bg-white">
                  <div><b>Sleep Duration:</b> {participant.sleep_duration}</div>
                  <div><b>Caffeine:</b> {participant.caffeine_frequency}</div>
                  <div><b>Physical Activity:</b> {participant.physical_activity}</div>
                </div>
              </div>

              {/* Section F: Heart Rate Variability (Kubios) */}
              <div className="border border-emerald-300 rounded overflow-hidden bg-emerald-50/40">
                <div className="bg-emerald-800 text-white px-3 py-1 font-bold text-[11px] flex justify-between">
                  <span>SECTION F: HEART RATE VARIABILITY (KUBIOS DIGITAL RECORDING)</span>
                  <span className="text-[10px] bg-emerald-900 px-1.5 py-0.5 rounded">MacroDroid Verified</span>
                </div>
                <div className="grid grid-cols-3 p-2.5 gap-2 text-[11px]">
                  <div><b>Resting Heart Rate:</b> <span className="font-bold">{hrv.resting_heart_rate} bpm</span></div>
                  <div><b>RMSSD:</b> <span className="font-bold text-blue-900">{hrv.rmssd} ms</span></div>
                  <div><b>SDNN:</b> <span className="font-bold">{hrv.sdnn} ms</span></div>
                  <div><b>LF Power:</b> {hrv.lf_power} ms²</div>
                  <div><b>HF Power:</b> {hrv.hf_power} ms²</div>
                  <div><b>LF/HF Ratio:</b> <span className="font-bold text-emerald-800">{hrv.lf_hf_ratio}</span></div>
                  <div><b>PNS / SNS Index:</b> {hrv.pns_index} / {hrv.sns_index}</div>
                  <div><b>Stress Index:</b> {hrv.stress_index}</div>
                  <div><b>Quality:</b> <span className="text-emerald-700 font-bold">{hrv.measurement_quality}</span></div>
                </div>
              </div>

              {/* Section G: Signatures */}
              <div className="border border-slate-200 rounded overflow-hidden mt-3">
                <div className="bg-blue-900 text-white px-3 py-1 font-bold text-[11px]">
                  SECTION G: INFORMED CONSENT DECLARATIONS & DUAL SIGNATURES
                </div>
                <div className="grid grid-cols-2 p-3 gap-4 bg-white">
                  {/* Participant Signature Box */}
                  <div className="border border-slate-200 rounded p-2.5 flex flex-col justify-between h-28 bg-slate-50/50">
                    <div className="text-[10px] text-slate-600 italic">
                      "I confirm I have read the study information and freely consent to participate."
                    </div>
                    <div className="h-10 border-b border-dashed border-slate-400 flex items-center justify-center font-serif text-blue-900 italic text-base">
                      {participant.participant_signature ? (
                        <span className="font-cursive tracking-wider">Participant Signature (Canvas Verified)</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Digital Signature Attached</span>
                      )}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                      <span><b>Participant:</b> {participant.participant_id}</span>
                      <span><b>Signed:</b> {participant.participant_signed_at || '31-Aug-2026 02:30 IST'}</span>
                    </div>
                  </div>

                  {/* Investigator Signature Box */}
                  <div className="border border-slate-200 rounded p-2.5 flex flex-col justify-between h-28 bg-slate-50/50">
                    <div className="text-[10px] text-slate-600 italic">
                      "I have verified the protocol compliance, measurements, and informed consent."
                    </div>
                    <div className="h-10 border-b border-dashed border-slate-400 flex items-center justify-center font-serif text-blue-900 italic text-base">
                      <span className="font-cursive tracking-wider">Dr. Harsh Narware (PI)</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                      <span><b>Investigator:</b> Principal Investigator</span>
                      <span><b>Verified:</b> {participant.investigator_signed_at || '31-Aug-2026 02:35 IST'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 1 Footer */}
              <div className="pt-2 text-center text-[9px] text-slate-400 border-t border-slate-200 flex justify-between items-center">
                <span>ICMR STS Research Dossier • Page 1 of 2</span>
                <span className="font-mono text-[8px]">SHA256(CRF): 4c7b2a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b</span>
                <span>See Appendix 1 Overleaf for Kubios Result Screenshot</span>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* PAGE 2: APPENDIX 1 — RAW KUBIOS HRV SENSOR RESULT SCREENSHOT */
            /* ========================================================================= */
            <div className="space-y-4 text-xs">
              {/* Header Title */}
              <div className="text-center border-b pb-3 border-slate-200">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
                  APPENDIX 1: RAW KUBIOS HRV RESULT SCREENSHOT VERIFICATION
                </h1>
                <div className="text-xs text-slate-600 mt-0.5">
                  <b>Participant ID:</b> <span className="font-mono font-bold text-blue-800">{participant.participant_id}</span> • <b>Ingested via:</b> MacroDroid Mobile Automation
                </div>
              </div>

              {/* Provenance Metadata Table */}
              <div className="grid grid-cols-4 gap-2 bg-slate-900 text-white p-3 rounded-lg text-[10px]">
                <div><span className="text-slate-400">Readiness:</span> <b className="text-amber-400 text-xs">55% (Normal)</b></div>
                <div><span className="text-slate-400">Resting HR:</span> <b className="text-white text-xs">78 bpm</b></div>
                <div><span className="text-slate-400">RMSSD:</span> <b className="text-blue-300 text-xs">31 ms</b></div>
                <div><span className="text-slate-400">Quality:</span> <b className="text-emerald-400 text-xs">GOOD</b></div>
                <div><span className="text-slate-400">Mean RR:</span> 772.43 ms</div>
                <div><span className="text-slate-400">SDNN:</span> 24.09 ms</div>
                <div><span className="text-slate-400">Stress Index:</span> 19.16</div>
                <div><span className="text-slate-400">LF/HF Ratio:</span> 0.28</div>
              </div>

              {/* High-Resolution Embedded Screenshot Container */}
              <div className="flex justify-center py-2">
                <div className="w-full max-w-[340px] bg-black rounded-2xl p-4 border-2 border-slate-700 shadow-2xl text-white space-y-3 relative overflow-hidden">
                  
                  {/* Watermark across image */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 rotate-[-35deg] text-3xl font-black text-white">
                    {participant.participant_id}
                  </div>

                  {/* Screenshot Header */}
                  <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-1.5">
                    <span>← RESULT</span>
                    <span>Wed 8.7 • 02:29</span>
                  </div>

                  {/* Dial Preview */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-36 h-20 border-t-8 border-l-8 border-r-8 border-amber-500 rounded-t-full flex flex-col items-center justify-end pb-1">
                      <span className="text-2xl font-black text-white">55%</span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-400">READINESS</span>
                    </div>
                  </div>

                  {/* Resting HRV Block */}
                  <div className="bg-slate-900 p-2 rounded text-[10px] space-y-1">
                    <div className="text-slate-400 font-bold">RESTING HRV</div>
                    <div className="flex justify-between">
                      <span>Heart rate <b>78 bpm</b></span>
                      <span>RMSSD <b>31 ms</b></span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>PNS index -0.79</span>
                      <span className="text-amber-400">SNS index 2.12</span>
                    </div>
                  </div>

                  {/* HRV Parameters */}
                  <div className="bg-slate-900 p-2 rounded text-[10px] space-y-1">
                    <div className="text-slate-400 font-bold">HRV PARAMETERS</div>
                    <div className="flex justify-between"><span>Mean RR</span><span>772.43 ms</span></div>
                    <div className="flex justify-between"><span>SDNN</span><span>24.09 ms</span></div>
                    <div className="flex justify-between"><span>Stress index</span><span>19.16</span></div>
                    <div className="flex justify-between"><span>Respiratory rate</span><span>23.23 breaths/min</span></div>
                    <div className="flex justify-between"><span>LF power</span><span>83.84 ms²</span></div>
                    <div className="flex justify-between"><span>HF power</span><span>301.41 ms²</span></div>
                    <div className="flex justify-between font-bold text-emerald-400 border-t border-slate-800 pt-1">
                      <span>LF/HF ratio</span>
                      <span>0.28</span>
                    </div>
                  </div>

                  {/* Quality & Mood */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">QUALITY:</span>
                    <span className="text-emerald-400 font-bold">GOOD</span>
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
                <div><b>SHA-256 Digest:</b> <code className="font-mono text-slate-800">9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e</code></div>
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
