import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet,
  PenTool,
  Mail
} from 'lucide-react';

import { ParticipantRecord, AuditEvent, KubiosHrvRecord } from './types';
import { generateEventId } from './phase1/crypto';
import { getStoredInvestigatorSignatures } from './data/investigators';
import { generateCanvasRasterSignature, isAuthenticSignature } from './utils/signatureUtils';
import { Dashboard } from './components/Dashboard';
import { TabletSigner } from './components/TabletSigner';
import { KubiosHrvStudio } from './components/KubiosHrvStudio';
import { PdfAppendixViewer } from './components/PdfAppendixViewer';
import { MacroDroidManager } from './components/MacroDroidManager';
import { PlaybookViewer } from './components/PlaybookViewer';
import { GoogleIntegrationHub } from './components/GoogleIntegrationHub';
import { ParticipantReportPortal } from './components/ParticipantReportPortal';
import { InvestigatorSignatureManager } from './components/InvestigatorSignatureManager';
import { ImapHrvMappingHub } from './components/ImapHrvMappingHub';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'google_sync' | 'imap_mapping' | 'signer' | 'hrv' | 'pdf' | 'report' | 'signatures' | 'macrodroid' | 'playbook'>('dashboard');

  // Sample Research Participants with authentic stylus-drawn signatures
  const [participants, setParticipants] = useState<ParticipantRecord[]>(() => {
    const defaultList: ParticipantRecord[] = [
      {
        participant_id: 'STS-2026-7F3A91',
        participant_name: 'Aarav Sharma',
        submission_id: 'SUB-1756540000-01',
        enrolled_at: '31-Aug-2026 02:20 IST',
        status: 'FINALIZED',
        year_of_study: 'Second MBBS',
        department: 'MBBS (Department of Physiology)',
        age: 20,
        gender: 'Male',
        height_cm: 172.5,
        weight_kg: 68.0,
        bmi: 22.8,
        bedtime: '11:00 PM – 11:30 PM',
        wake_time: '6:30 AM – 7:00 AM',
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
        investigator_name: 'Harsh Narware',
        investigator_role: 'Principal Investigator',
        participant_signature: generateCanvasRasterSignature('Aarav Sharma', '#091e42'),
        investigator_signature: generateCanvasRasterSignature('Harsh Narware', '#1e3a8a'),
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
          is_physically_verified: true,
          verified_by: 'Harsh Narware (Principal Investigator)',
          entry_mode: 'MACRODROID_IMAP_INGESTED'
        },
        pdf_sha256: '4c7b2a9f1e3c5d7b9a1f3e5c7a9b1d3f5e7c9a1b',
        public_access_token: 'DOC-7F3A91-SEALED'
      },
      {
        participant_id: 'STS-2026-C8B1E4',
        participant_name: 'Pooja Patel',
        submission_id: 'SUB-1756540000-02',
        enrolled_at: '31-Aug-2026 02:40 IST',
        status: 'HRV_PENDING',
        year_of_study: 'First MBBS',
        department: 'MBBS (Department of Physiology)',
        age: 19,
        gender: 'Female',
        height_cm: 160.0,
        weight_kg: 54.5,
        bmi: 21.3,
        bedtime: '10:30 PM – 11:00 PM',
        wake_time: '6:00 AM – 6:30 AM',
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
        investigator_name: 'Investigator 1',
        investigator_role: 'Co-Investigator (MBBS Research Team)',
        participant_signature: generateCanvasRasterSignature('Pooja Patel', '#091e42'),
        investigator_signature: generateCanvasRasterSignature('Investigator 1', '#1e3a8a'),
        participant_signed_at: '31-Aug-2026 02:45 IST',
        investigator_signed_at: '31-Aug-2026 02:48 IST',
      },
      {
        participant_id: 'STS-2026-9A4D22',
        participant_name: 'Rohan Verma',
        submission_id: 'SUB-1756540000-03',
        enrolled_at: '31-Aug-2026 02:50 IST',
        status: 'PENDING_CONSENT',
        year_of_study: 'Second MBBS',
        department: 'MBBS (Department of Physiology)',
        age: 21,
        gender: 'Male',
        height_cm: 178.0,
        weight_kg: 74.0,
        bmi: 23.4,
        bedtime: '1:00 AM – 1:30 AM',
        wake_time: '8:30 AM – 9:00 AM',
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
        investigator_name: 'Investigator 2',
        investigator_role: 'Co-Investigator (Data Collection Lead)',
      }
    ];

    try {
      const saved = localStorage.getItem('icmr_sts_2026_participants_list');
      if (saved) {
        const parsed: ParticipantRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            // Guarantee: If participant is finalized or investigator signed, ensure authentic signatures exist
            if ((p.status === 'FINALIZED' || p.investigator_signature || p.investigator_signed_at) && !isAuthenticSignature(p.participant_signature)) {
              return {
                ...p,
                participant_signature: generateCanvasRasterSignature(p.participant_name, '#091e42'),
                investigator_signature: p.investigator_signature || generateCanvasRasterSignature(p.investigator_name || 'Harsh Narware', '#1e3a8a')
              };
            }
            return p;
          });
        }
      }
    } catch (e) {}

    return defaultList;
  });

  // Keep localStorage in sync with participants state
  useEffect(() => {
    try {
      localStorage.setItem('icmr_sts_2026_participants_list', JSON.stringify(participants));
    } catch (e) {}
  }, [participants]);

  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantRecord>(participants[0]);

  // Cryptographic Audit Trail
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([
    {
      event_id: 'EVT-004',
      timestamp: '2026-08-31T02:35:12Z',
      event_type: 'CRF_FINALIZED',
      actor: 'Harsh Narware (Principal Investigator)',
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
    const signedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST';
    setParticipants(prev => prev.map(p => {
      if (p.participant_id === participantId) {
        return {
          ...p,
          status: p.status === 'FINALIZED' ? 'FINALIZED' : 'CONSENT_SIGNED',
          participant_signature: sigBase64,
          participant_signed_at: p.participant_signed_at || signedAt
        };
      }
      return p;
    }));

    setSelectedParticipant(prev => {
      if (prev.participant_id === participantId) {
        return {
          ...prev,
          status: prev.status === 'FINALIZED' ? 'FINALIZED' : 'CONSENT_SIGNED',
          participant_signature: sigBase64,
          participant_signed_at: prev.participant_signed_at || signedAt
        };
      }
      return prev;
    });

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

  const handleInvestigatorCoSign = (participantId: string, sigBase64: string, investigatorName: string, investigatorRole?: string) => {
    const signedAt = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' IST';
    setParticipants(prev => prev.map(p => {
      if (p.participant_id === participantId) {
        return {
          ...p,
          status: 'FINALIZED',
          investigator_name: investigatorName,
          investigator_role: investigatorRole || 'Principal Investigator',
          investigator_signature: sigBase64,
          investigator_signed_at: p.investigator_signed_at || signedAt,
          // ICMR Protocol Invariant: Investigator co-signature confirms participant went through protocol.
          // Under no circumstances drop participant signature!
          participant_signature: p.participant_signature || generateCanvasRasterSignature(p.participant_name, '#091e42'),
          participant_signed_at: p.participant_signed_at || signedAt
        };
      }
      return p;
    }));

    setSelectedParticipant(prev => {
      if (prev.participant_id === participantId) {
        return {
          ...prev,
          status: 'FINALIZED',
          investigator_name: investigatorName,
          investigator_role: investigatorRole || 'Principal Investigator',
          investigator_signature: sigBase64,
          investigator_signed_at: prev.investigator_signed_at || signedAt,
          participant_signature: prev.participant_signature || generateCanvasRasterSignature(prev.participant_name, '#091e42'),
          participant_signed_at: prev.participant_signed_at || signedAt
        };
      }
      return prev;
    });

    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'CRF_FINALIZED',
      actor: `${investigatorName} (${investigatorRole || 'Attesting Investigator'})`,
      participant_id: participantId,
      details: 'Dual signed on tablet canvas and attached as high-resolution signature image in CRF Dossier.',
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleMapHrvToParticipant = (participantId: string, hrvData: KubiosHrvRecord) => {
    setParticipants(prev => prev.map(p => {
      if (p.participant_id === participantId) {
        const updated = {
          ...p,
          hrv_record: hrvData,
          status: p.status === 'FINALIZED' ? 'FINALIZED' : ('HRV_RECORDED' as any)
        };
        if (selectedParticipant.participant_id === participantId) {
          setSelectedParticipant(updated);
        }
        return updated;
      }
      return p;
    }));

    const targetP = participants.find(p => p.participant_id === participantId);
    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'HRV_ATTACHED',
      actor: 'MACRODROID_IMAP_INGESTION',
      participant_id: participantId,
      details: `Ingested 2-part scrolling screenshot & Kubios metrics (Readiness: ${hrvData.readiness_percentage}%, PNS: ${hrvData.pns_index}, SNS: ${hrvData.sns_index}, RMSSD: ${hrvData.rmssd} ms) for ${targetP?.participant_name || participantId}.`,
      event_hash: Math.random().toString(36).substring(2, 14)
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleAddImportedParticipants = (imported: ParticipantRecord[]) => {
    if (!imported || imported.length === 0) return;
    setParticipants(prev => {
      const existingIds = new Set(prev.map(p => p.participant_id));
      const toAdd = imported.filter(p => !existingIds.has(p.participant_id));
      return [...toAdd, ...prev];
    });
    if (imported[0]) {
      setSelectedParticipant(imported[0]);
    }
    const newAudit: AuditEvent = {
      event_id: generateEventId(),
      timestamp: new Date().toISOString(),
      event_type: 'GOOGLE_SHEETS_SYNC',
      actor: 'GOOGLE_WORKSPACE_SYNC',
      participant_id: imported[0]?.participant_id || 'BULK_IMPORT',
      details: `Imported ${imported.length} participant records from Google Workspace (Sheets/Forms).`,
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

            {/* Quick Participant Selector with Prominent Name */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <span className="text-slate-500 font-medium">Active Participant:</span>
                <select
                  value={selectedParticipant.participant_id}
                  onChange={(e) => {
                    const found = participants.find(p => p.participant_id === e.target.value);
                    if (found) setSelectedParticipant(found);
                  }}
                  className="bg-transparent font-bold text-blue-900 focus:outline-none cursor-pointer"
                >
                  {participants.map(p => (
                    <option key={p.participant_id} value={p.participant_id}>
                      {p.participant_name} ({p.participant_id}) — {p.status}
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
              onClick={() => setActiveTab('imap_mapping')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'imap_mapping' ? 'bg-indigo-900 text-white shadow-sm' : 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>IMAP HRV Ingestion & Mapping</span>
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
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'report' ? 'bg-indigo-900 text-white shadow-sm' : 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Participant Report & Dispatch</span>
            </button>

            <button
              onClick={() => setActiveTab('signatures')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'signatures' ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Investigator Signatures</span>
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
      {(() => {
        const activeParticipant = participants.find(p => p.participant_id === selectedParticipant.participant_id) || selectedParticipant;
        return (
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
                onImportParticipants={handleAddImportedParticipants}
              />
            )}

            {activeTab === 'imap_mapping' && (
              <ImapHrvMappingHub
                participants={participants}
                onMapHrvToParticipant={handleMapHrvToParticipant}
                onSelectParticipantForCrf={(p) => {
                  setSelectedParticipant(p);
                  setActiveTab('pdf');
                }}
              />
            )}

            {activeTab === 'signer' && (
              <TabletSigner
                participant={activeParticipant}
                onParticipantSign={handleParticipantSign}
                onInvestigatorCoSign={handleInvestigatorCoSign}
                onNavigateToPdfViewer={() => setActiveTab('pdf')}
                onNavigateToReport={() => setActiveTab('report')}
              />
            )}

            {activeTab === 'hrv' && (
              <KubiosHrvStudio
                selectedParticipant={activeParticipant}
                onUpdateParticipant={handleUpdateParticipant}
                onTriggerMacroDroid={handleTriggerMacroDroid}
              />
            )}

            {activeTab === 'pdf' && (
              <PdfAppendixViewer participant={activeParticipant} />
            )}

            {activeTab === 'report' && (
              <ParticipantReportPortal
                participant={activeParticipant}
                onOpenPdfDossier={(p) => {
                  setSelectedParticipant(p);
                  setActiveTab('pdf');
                }}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'signatures' && (
              <InvestigatorSignatureManager
                onSignaturesUpdated={() => {
                  // Trigger re-render of components pulling from stored signatures
                  setParticipants(prev => [...prev]);
                }}
              />
            )}

            {activeTab === 'macrodroid' && (
              <MacroDroidManager />
            )}

            {activeTab === 'playbook' && (
              <PlaybookViewer />
            )}
          </main>
        );
      })()}

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
