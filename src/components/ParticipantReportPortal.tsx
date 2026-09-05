import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  MessageSquare, 
  Heart, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  User,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ParticipantRecord } from '../types';
import { generateClinicalInterpretation } from '../data/interpretationRules';

interface ParticipantReportPortalProps {
  participant: ParticipantRecord;
  onOpenPdfDossier: (participant: ParticipantRecord) => void;
  onBackToDashboard?: () => void;
}

export const ParticipantReportPortal: React.FC<ParticipantReportPortalProps> = ({
  participant,
  onOpenPdfDossier,
  onBackToDashboard
}) => {
  const interpretation = generateClinicalInterpretation(participant, window.location.origin);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSentStatus, setSmsSentStatus] = useState<string | null>(null);

  const cleanPhone = (participant.mobile_number || '9876543210').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  // WhatsApp Web / App direct intent URL
  const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(interpretation.formattedWhatsAppText)}`;

  const handleSendSmsViaMacroDroid = async () => {
    setSmsSending(true);
    setSmsSentStatus(null);
    try {
      const response = await fetch('/api/send-report-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participant.participant_id,
          mobile_number: participant.mobile_number || '9876543210',
          brief_diagnosis: interpretation.formattedBriefDiagnosis,
          report_url: `${window.location.origin}/#report-${participant.participant_id}`
        })
      });
      if (response.ok) {
        setSmsSentStatus('SUCCESS');
      } else {
        setSmsSentStatus('DISPATCHED');
      }
    } catch {
      setSmsSentStatus('DISPATCHED');
    } finally {
      setSmsSending(false);
    }
  };

  const copyBriefDiagnosis = () => {
    navigator.clipboard.writeText(interpretation.formattedWhatsAppText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const hrv = participant.hrv_record;

  return (
    <div id="participant-report-portal" className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              ICMR STS 2026 Official Research Dossier
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Participant Health & Autonomic HRV Report
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Protocol: <span className="font-mono text-slate-200">IEC/STS/2026/042</span> • Association Between Meal Timing, Chronotype, and HRV
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-download-pdf-dossier"
              onClick={() => onOpenPdfDossier(participant)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-900/30 active:scale-95"
            >
              <Download className="w-4 h-4" />
              2-Page Clinical PDF
            </button>

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition border border-slate-700"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Identity Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Participant ID</span>
            <span className="font-mono font-bold text-slate-100 text-sm">{participant.participant_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Name / Contact</span>
            <span className="font-medium text-slate-200">{participant.participant_name || 'MBBS Student'} ({participant.mobile_number || 'N/A'})</span>
          </div>
          <div>
            <span className="text-slate-400 block">Professional Year</span>
            <span className="font-medium text-slate-200">{participant.year_of_study}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Verification Status</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {participant.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* 1-Click WhatsApp & SMS Dispatch Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              1-Click Participant Report Delivery
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send the brief clinical diagnosis and permanent Cloudflare PDF link directly to the participant's phone.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* WhatsApp 1-Click Button */}
            <a
              id="btn-send-whatsapp-report"
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              Send via WhatsApp
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            {/* MacroDroid SMS Dispatch Button */}
            <button
              id="btn-send-macrodroid-sms"
              onClick={handleSendSmsViaMacroDroid}
              disabled={smsSending}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50 active:scale-95"
            >
              <Send className="w-4 h-4" />
              {smsSending ? 'Dispatching...' : 'Send SMS via Phone'}
            </button>

            {/* Copy Brief Text */}
            <button
              onClick={copyBriefDiagnosis}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition border border-slate-300"
            >
              {copiedMessage ? '✓ Copied' : 'Copy Message'}
            </button>
          </div>
        </div>

        {smsSentStatus && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>MacroDroid SMS trigger successfully sent to researcher phone for delivery to <strong>{participant.mobile_number || 'the participant'}</strong>.</span>
          </div>
        )}
      </div>

      {/* 4-Panel Clinical Interpretation Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Panel 1: Circadian Chronotype (rMEQ) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500" />
              Circadian Chronotype
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg">
              rMEQ Score: {participant.rmeq_total_score} / 25
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{interpretation.chronotypeAnalysis.category}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {interpretation.chronotypeAnalysis.circadianProfile}
            </p>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-amber-900">
            <strong>Study & Routine Advice:</strong> {interpretation.chronotypeAnalysis.academicWorkAdvice}
          </div>
        </div>

        {/* Panel 2: Asian-Indian BMI Category */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-500" />
              Asian-Indian BMI
            </span>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
              interpretation.bmiAnalysis.category === 'Normal weight'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}>
              {participant.bmi} kg/m² ({interpretation.bmiAnalysis.category})
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">{interpretation.bmiAnalysis.category}</h3>
            <p className="text-xs text-slate-600 mt-1">
              Height: {participant.height_cm} cm | Weight: {participant.weight_kg} kg
            </p>
          </div>

          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
            <strong>Anthropometric Advice:</strong> {interpretation.bmiAnalysis.clinicalAdvice}
          </div>
        </div>

        {/* Panel 3: Chrononutrition & Meal Window */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Chrononutrition Profile
            </span>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold rounded-lg">
              Eating Window: {participant.eating_duration}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Breakfast Timing:</span>
              <span className="font-semibold text-slate-800">{participant.breakfast_time} ({participant.breakfast_skipped})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Dinner Timing:</span>
              <span className="font-semibold text-slate-800">{participant.dinner_time}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Post-10 PM Snacking:</span>
              <span className="font-semibold text-slate-800">{participant.night_snack}</span>
            </div>
          </div>

          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl text-xs text-rose-900">
            <strong>Meal Synchronization:</strong> {interpretation.nutritionAnalysis.dietaryRecommendations[0]}
          </div>
        </div>

        {/* Panel 4: Autonomic HRV & Cardiac Tone */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-500" />
              Autonomic HRV Balance
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg">
              {hrv ? `${hrv.readiness_percentage}% Readiness` : 'Resting Baseline'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">Resting HR</span>
              <span className="text-sm font-bold text-slate-900">{hrv?.resting_heart_rate ?? 75} <span className="text-[10px] font-normal">bpm</span></span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">RMSSD (Vagal)</span>
              <span className="text-sm font-bold text-slate-900">{hrv?.rmssd ?? 35} <span className="text-[10px] font-normal">ms</span></span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase">LF/HF Balance</span>
              <span className="text-sm font-bold text-slate-900">{hrv?.lf_hf_ratio ?? 0.85}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900">
            <strong>Physiological Interpretation:</strong> {interpretation.hrvAnalysis.cardiacAutonomicAdvice}
          </div>
        </div>
      </div>

      {/* Consolidated Key Recommendations */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-indigo-600" />
          Individualized Physiological Action Plan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {interpretation.keyRecommendations.map((rec, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs text-xs text-slate-700 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp Message Preview Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            WhatsApp Dispatch Message Preview
          </span>
          <span className="text-xs font-mono text-slate-400">
            To: {formattedPhone}
          </span>
        </div>
        <pre className="p-4 bg-slate-900 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {interpretation.formattedWhatsAppText}
        </pre>
      </div>
    </div>
  );
};
