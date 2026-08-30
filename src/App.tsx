import React, { useState } from 'react';
import { 
  Activity, 
  FileText, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone, 
  BookOpen, 
  Key, 
  RefreshCw, 
  Zap, 
  Sliders,
  ChevronRight,
  Sparkles,
  Lock,
  FileSpreadsheet
} from 'lucide-react';

import { ParticipantRecord, AuditEvent, KubiosHrvRecord } from './types';
import { generateEventId } from './phase1/crypto';
import { Dashboard } from './components/Dashboard';
import { TabletSigner } from './components/TabletSigner';
import { KubiosHrvStudio } from './components/KubiosHrvStudio';
import { PdfAppendixViewer } from './components/PdfAppendixViewer';
import { MacroDroidManager } from './components/MacroDroidManager';
import { PlaybookViewer } from './components/PlaybookViewer';
import { GoogleIntegrationHub } from './components/GoogleIntegrationHub';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'signer' | 'hrv' | 'pdf' | 'macrodroid' | 'playbook' | 'google_sync'>('dashboard');

  // Sample Research Participants
  const [participants, setParticipants] = useState<ParticipantRecord[]>([
    {
      participant_id: 'STS-2026-7F3A91',
      submission_id: 'SUB-1756540000-01',
      enrolled_at: '31-Aug-2026 02:20 IST',
      status: 'FINALIZED',
      year_of_study: 'Second MBBS',
      department: 'Department of Physiology',
      age: 20,
      gender: 'Male',
      height_cm: 172.5,
      weight_kg: 68.0,
      bmi: 22.8,
      breakfast_time: '8:00 AM – 9:00 AM',
      breakfast_skipped: '0–1 days / week',
      dinner_time: '8:30 PM – 9:30 PM',
      night_snack: 'Never / Rarely',
      eating_duration: '11 hours',
      regular_timings: 'Regular on most days',
      rmeq_total_score: 16,
      chronotype_category: 'Intermediate type',
      sleep_duration: '6.5 hours / night',
      caffeine_frequency: '1 cup / day (Morning)',
      physical_activity: 'Moderate (150 min/wk)',
      participant_signature: 'DATA_URL_SIG_P1',
      investigator_signature: 'DATA_URL_SIG_INV1',
      participant_signed_at: '31-Aug-2026 02:30 IST',
      investigator_signed_at: '31-Aug-2026 02:35 IST',
      hrv_record: {
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
        screenshot_sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
      },
      pdf_sha256: '4c7b2a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b',
      public_access_token: 'DOC-7F3A91-SEALED'
    },
    {
      participant_id: 'STS-2026-C8B1E4',
      submission_id: 'SUB-1756540000-02',
      enrolled_at: '31-Aug-2026 02:40 IST',
      status: 'HRV_PENDING',
      year_of_study: 'First MBBS',
      department: 'Department of Physiology',
      age: 19,
      gender: 'Female',
      height_cm: 160.0,
      weight_kg: 54.5,
      bmi: 21.3,
      breakfast_time: '7:30 AM – 8:30 AM',
      breakfast_skipped: '0 days / week',
      dinner_time: '7:45 PM – 8:45 PM',
      night_snack: 'Never',
      eating_duration: '11.5 hours',
      regular_timings: 'Always regular',
      rmeq_total_score: 19,
      chronotype_category: 'Morning type',
      sleep_duration: '7.5 hours / night',
      caffeine_frequency: 'None / Rare',
      physical_activity: 'Active (300 min/wk)',
      participant_signature: 'DATA_URL_SIG_P2',
      participant_signed_at: '31-Aug-2026 02:45 IST',
    },
    {
      participant_id: 'STS-2026-9A4D22',
      submission_id: 'SUB-1756540000-03',
      enrolled_at: '31-Aug-2026 02:50 IST',
      status: 'PENDING_CONSENT',
      year_of_study: 'Second MBBS',
      department: 'Department of Physiology',
      age: 21,
      gender: 'Male',
      height_cm: 178.0,
      weight_kg: 74.0,
      bmi: 23.4,
      breakfast_time: '9:30 AM – 10:30 AM',
      breakfast_skipped: '3–4 days / week',
      dinner_time: '10:00 PM – 11:00 PM',
      night_snack: 'Frequently (3+ days/wk)',
      eating_duration: '14 hours',
      regular_timings: 'Irregular',
      rmeq_total_score: 9,
      chronotype_category: 'Evening type',
      sleep_duration: '5.5 hours / night',
      caffeine_frequency: '2–3 cups / day',
      physical_activity: 'Sedentary (<150 min/wk)',
    }
  ]);

  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantRecord>(participants[0]);

  // Cryptographic Audit Trail
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([
    {
      event_id: 'EVT-004',
      timestamp: '2026-08-31T02:35:12Z',
      event_type: 'CRF_FINALIZED',
      actor: 'Dr. Harsh Narware (PI)',
      participant_id: 'STS-2026-7F3A91',
      details: 'Dual signed & Kubios screenshot attached as Appendix 1 (2 Pgs sealed).',
      event_hash: '9a1f3e5c7a9b1d3f5e7c9a1b3d5f'
    },
    {
      event_id: 'EVT-003',
      timestamp: '2026-08-31T02:29:45Z',
      event_type: 'HRV_INGESTED',
      actor: 'MACRODROID_AUTOMATION',
      participant_id: 'STS-2026-7F3A91',
      details: 'Kubios OCR HR: 78 bpm, RMSSD: 31 ms, LF/HF: 0.28, Screenshot attached.',
      event_hash: 'd8f2a93c4e7b1a0f6e5d8c2b4a9f'
    },
    {
      event_id: 'EVT-002',
      timestamp: '2026-08-31T02:30:10Z',
      event_type: 'PARTICIPANT_SIGNED',
      actor: 'PARTICIPANT',
      participant_id: 'STS-2026-7F3A91',
      details: 'Participant consent confirmed via tablet canvas signature pad.',
      event_hash: '3e5c7a9b1d3f5e7c9a1b3d5f7b9a'
    },
    {
      event_id: 'EVT-001',
      timestamp: '2026-08-31T02:20:01Z',
      event_type: 'FORM_SUBMITTED',
      actor: 'GOOGLE_APPS_SCRIPT',
      participant_id: 'STS-2026-7F3A91',
      details: 'HMAC verified Google Sheets response mapped to STS-2026-7F3A91.',
      event_hash: '1a0f6e5d8c2b4a9f1e3c5d7b9a1f'
    }
  ]);

  const handleCreateParticipant = (newRecord: ParticipantRecord) => {
    setParticipants(prev => [newRecord, ...prev]);
    setSelectedParticipant(newRecord);

    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'MANUAL_FORM_SUBMISSION',
      actor: 'INVESTIGATOR_DIRECT_BACKUP',
      participant_id: newRecord.participant_id,
      details: `Direct Case Record Form entry created (Asian-Indian BMI: ${newRecord.bmi}, rMEQ: ${newRecord.rmeq_total_score}). Queued for Google Sheets sync.`,
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleUpdateParticipant = (updated: ParticipantRecord) => {
    setParticipants(prev => prev.map(p => p.participant_id === updated.participant_id ? updated : p));
    setSelectedParticipant(updated);

    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'HRV_ATTACHED',
      actor: 'MACRODROID_AUTOMATION',
      participant_id: updated.participant_id,
      details: `Attached Kubios screenshot and HRV parameters (RMSSD: ${updated.hrv_record?.rmssd} ms, LF/HF: ${updated.hrv_record?.lf_hf_ratio}).`,
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleTriggerMacroDroid = (participantId: string) => {
    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'MACRODROID_TRIGGERED',
      actor: 'INVESTIGATOR_TABLET',
      participant_id: participantId,
      details: `Dispatched webhook trigger to Android device with tag ${participantId}.`,
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleParticipantSign = (participantId: string, sigBase64: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.participant_id === participantId) {
        return {
          ...p,
          status: 'CONSENT_SIGNED',
          participant_signature: sigBase64,
          participant_signed_at: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST'
        };
      }
      return p;
    }));

    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'PARTICIPANT_SIGNED',
      actor: 'PARTICIPANT',
      participant_id: participantId,
      details: 'Participant consent confirmed via tablet canvas signature pad.',
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleInvestigatorCoSign = (participantId: string, sigBase64: string, investigatorName: string) => {
    setParticipants(prev => prev.map(p => {
      if (p.participant_id === participantId) {
        return {
          ...p,
          status: 'FINALIZED',
          investigator_signature: sigBase64,
          investigator_signed_at: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST'
        };
      }
      return p;
    }));

    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'CRF_FINALIZED',
      actor: investigatorName,
      participant_id: participantId,
      details: 'Dual signed and sealed in R2 with Kubios HRV Appendix.',
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col">
      
      {/* Top Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Study Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-white shadow-sm font-bold text-base">
                STS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">ICMR STS 2026</span>
                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" /> Google Sheets Integrated
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate max-w-sm sm:max-w-md md:max-w-lg">
                  Meal Timing, Chronotype, and Heart Rate Variability Research Portal
                </div>
              </div>
            </div>

            {/* Quick Participant Selector */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <span className="text-slate-500 font-medium">Active Participant:</span>
                <select
                  value={selectedParticipant.participant_id}
                  onChange={(e) => {
                    const found = participants.find(p => p.participant_id === e.target.value);
                    if (found) setSelectedParticipant(found);
                  }}
                  className="bg-transparent font-mono font-bold text-blue-800 focus:outline-none cursor-pointer"
                >
                  {participants.map(p => (
                    <option key={p.participant_id} value={p.participant_id}>
                      {p.participant_id} ({p.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Module Navigation Tabs */}
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar border-t border-slate-100 py-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Operations Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('google_sync')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'google_sync' ? 'bg-emerald-800 text-white shadow-sm' : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Google Forms & Sheets Hub</span>
            </button>

            <button
              onClick={() => setActiveTab('signer')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'signer' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tablet Signing Pad</span>
            </button>

            <button
              onClick={() => setActiveTab('hrv')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'hrv' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Kubios HRV & MacroDroid</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'pdf' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CRF & Appendix Viewer</span>
            </button>

            <button
              onClick={() => setActiveTab('macrodroid')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'macrodroid' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>MacroDroid Package</span>
            </button>

            <button
              onClick={() => setActiveTab('playbook')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'playbook' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Playbook & setup.sh</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            participants={participants}
            auditLogs={auditLogs}
            onSelectParticipant={(p) => setSelectedParticipant(p)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onParticipantCreated={handleCreateParticipant}
          />
        )}

        {activeTab === 'google_sync' && (
          <GoogleIntegrationHub
            participants={participants}
          />
        )}

        {activeTab === 'signer' && (
          <TabletSigner
            participant={selectedParticipant}
            onParticipantSign={handleParticipantSign}
            onInvestigatorCoSign={handleInvestigatorCoSign}
          />
        )}

        {activeTab === 'hrv' && (
          <KubiosHrvStudio
            selectedParticipant={selectedParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onTriggerMacroDroid={handleTriggerMacroDroid}
          />
        )}

        {activeTab === 'pdf' && (
          <PdfAppendixViewer participant={selectedParticipant} />
        )}

        {activeTab === 'macrodroid' && (
          <MacroDroidManager />
        )}

        {activeTab === 'playbook' && (
          <PlaybookViewer />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ICMR STS 2026 Research Ingestion Platform • Department of Physiology</span>
          <span className="font-mono text-[11px] text-slate-400">Google Sheets Ingest • Serverless Edge • D1 SQL Backup • R2 Storage</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
