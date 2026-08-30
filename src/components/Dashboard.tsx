import React, { useState, useMemo } from 'react';
import { 
  Users, 
  FileCheck, 
  Activity, 
  Award, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Download, 
  Eye, 
  UserPlus, 
  FileSpreadsheet, 
  ArrowUpDown, 
  FileDown, 
  Share2, 
  Sparkles,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ParticipantRecord, AuditEvent } from '../types';
import { ManualParticipantFormModal } from './ManualParticipantFormModal';

interface DashboardProps {
  participants: ParticipantRecord[];
  auditLogs: AuditEvent[];
  onSelectParticipant: (participant: ParticipantRecord) => void;
  onNavigateTab: (tab: 'dashboard' | 'signer' | 'hrv' | 'pdf' | 'macrodroid' | 'playbook' | 'google_sync') => void;
  onParticipantCreated: (participant: ParticipantRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  participants,
  auditLogs,
  onSelectParticipant,
  onNavigateTab,
  onParticipantCreated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [chronotypeFilter, setChronotypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'ID' | 'DATE' | 'BMI' | 'RMEQ' | 'HR' | 'LF_HF'>('DATE');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Sorting & Filtering Logic
  const filteredAndSortedParticipants = useMemo(() => {
    return participants
      .filter((p) => {
        const matchesSearch = 
          p.participant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.submission_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.chronotype_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.year_of_study.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        const matchesChrono = chronotypeFilter === 'ALL' || p.chronotype_category === chronotypeFilter;
        return matchesSearch && matchesStatus && matchesChrono;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'ID') {
          comp = a.participant_id.localeCompare(b.participant_id);
        } else if (sortBy === 'DATE') {
          comp = a.enrolled_at.localeCompare(b.enrolled_at);
        } else if (sortBy === 'BMI') {
          comp = a.bmi - b.bmi;
        } else if (sortBy === 'RMEQ') {
          comp = a.rmeq_total_score - b.rmeq_total_score;
        } else if (sortBy === 'HR') {
          const hrA = a.hrv_record?.resting_heart_rate || 0;
          const hrB = b.hrv_record?.resting_heart_rate || 0;
          comp = hrA - hrB;
        } else if (sortBy === 'LF_HF') {
          const lfhfA = a.hrv_record?.lf_hf_ratio || 0;
          const lfhfB = b.hrv_record?.lf_hf_ratio || 0;
          comp = lfhfA - lfhfB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [participants, searchTerm, statusFilter, chronotypeFilter, sortBy, sortOrder]);

  const enrolledCount = participants.length;
  const consentedCount = participants.filter((p) => p.status !== 'PENDING_CONSENT').length;
  const hrvCount = participants.filter((p) => p.hrv_record !== undefined || p.status === 'HRV_ATTACHED' || p.status === 'FINALIZED').length;
  const finalizedCount = participants.filter((p) => p.status === 'FINALIZED').length;

  // Real CSV Export Generator for SPSS / R / Excel
  const handleExportCsv = () => {
    const headers = [
      'Participant_ID',
      'Submission_ID',
      'Enrolled_Timestamp',
      'Status',
      'MBBS_Year',
      'Department',
      'Age_Years',
      'Gender',
      'Height_cm',
      'Weight_kg',
      'BMI_kg_m2',
      'Breakfast_Time',
      'Breakfast_Skipping_Freq',
      'Dinner_Time',
      'Night_Snacking',
      'Eating_Duration_Hours',
      'Meal_Regularity',
      'rMEQ_Total_Score',
      'Chronotype_Category',
      'Sleep_Duration',
      'Caffeine_Freq',
      'Physical_Activity',
      'Participant_Signed',
      'Investigator_Signed',
      'HRV_Resting_HR_bpm',
      'HRV_RMSSD_ms',
      'HRV_SDNN_ms',
      'HRV_LF_Power',
      'HRV_HF_Power',
      'HRV_LF_HF_Ratio',
      'HRV_PNS_Index',
      'HRV_SNS_Index',
      'HRV_Stress_Index',
      'HRV_Mean_RR_ms',
      'HRV_Entry_Mode',
      'PDF_SHA256_Hash'
    ];

    const rows = participants.map((p) => [
      `"${p.participant_id}"`,
      `"${p.submission_id}"`,
      `"${p.enrolled_at}"`,
      `"${p.status}"`,
      `"${p.year_of_study}"`,
      `"${p.department}"`,
      p.age,
      `"${p.gender}"`,
      p.height_cm,
      p.weight_kg,
      p.bmi,
      `"${p.breakfast_time}"`,
      `"${p.breakfast_skipped}"`,
      `"${p.dinner_time}"`,
      `"${p.night_snack}"`,
      `"${p.eating_duration}"`,
      `"${p.regular_timings}"`,
      p.rmeq_total_score,
      `"${p.chronotype_category}"`,
      `"${p.sleep_duration}"`,
      `"${p.caffeine_frequency}"`,
      `"${p.physical_activity}"`,
      p.participant_signature ? 'YES' : 'NO',
      p.investigator_signature ? 'YES' : 'NO',
      p.hrv_record?.resting_heart_rate ?? '',
      p.hrv_record?.rmssd ?? '',
      p.hrv_record?.sdnn ?? '',
      p.hrv_record?.lf_power ?? '',
      p.hrv_record?.hf_power ?? '',
      p.hrv_record?.lf_hf_ratio ?? '',
      p.hrv_record?.pns_index ?? '',
      p.hrv_record?.sns_index ?? '',
      p.hrv_record?.stress_index ?? '',
      p.hrv_record?.mean_rr ?? '',
      `"${p.hrv_record?.entry_mode ?? ''}"`,
      `"${p.pdf_sha256 ?? ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICMR_STS_2026_RESEARCH_DATASET_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice('Exported SPSS / R Clinical Dataset CSV successfully!');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // Real JSON Export Generator
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      study_title: 'Association Between Meal Timing, Chronotype, and Heart Rate Variability',
      export_timestamp: new Date().toISOString(),
      participant_count: participants.length,
      participants: participants,
      audit_trail: auditLogs
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ICMR_STS_2026_FULL_BUNDLE_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadNotice('Exported Complete Research JSON Dataset successfully!');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // Real Audit Trail CSV Export
  const handleExportAuditCsv = () => {
    const headers = ['Event_ID', 'Timestamp_ISO', 'Event_Type', 'Actor', 'Participant_ID', 'Details', 'SHA256_Hash'];
    const rows = auditLogs.map(a => [
      `"${a.event_id}"`,
      `"${a.timestamp}"`,
      `"${a.event_type}"`,
      `"${a.actor}"`,
      `"${a.participant_id || ''}"`,
      `"${a.details.replace(/"/g, '""')}"`,
      `"${a.event_hash}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ICMR_STS_2026_AUDIT_LEDGER_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice('Exported Cryptographic Audit Trail CSV successfully!');
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              Department of Physiology
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" /> Google Sheets Ingestion Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              Cloudflare D1 + R2 Dual Backup
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1.5">ICMR STS 2026 Research Ingestion & Control Hub</h2>
          <p className="text-xs text-slate-500">
            Real-time synchronization between Google Forms, Google Sheets, Tablet Signatures, and Kubios HRV Biometrics.
          </p>
        </div>

        {/* Action Buttons: New Participant & Google Sheets Hub */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsManualFormOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4 text-blue-200" />
            <span>+ New Participant (Backup Form Fill)</span>
          </button>

          <button
            onClick={() => onNavigateTab('google_sync')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Google Sheets Hub</span>
          </button>
        </div>
      </div>

      {/* Download Alert Notice */}
      {downloadNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button onClick={() => setDownloadNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Enrolled Subjects</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{enrolledCount} <span className="text-xs font-normal text-slate-400">/ 120 target</span></div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">✓ Google Sheets Ingestion</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consent Signed</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{consentedCount}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-1">Tablet Canvas Dual Sign</div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kubios HRV Linked</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{hrvCount}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">MacroDroid + OCR Verified</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finalized Dossiers</div>
            <div className="text-2xl font-black text-purple-700 mt-1">{finalizedCount}</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1">R2 Stored & Sealed</div>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Participants Table with Search, Filter, Sort & Bulk Exports */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Study Enrollment & Case Record Form Queue</h3>
              <p className="text-xs text-slate-500">
                Displaying {filteredAndSortedParticipants.length} of {participants.length} total enrolled student subjects.
              </p>
            </div>

            {/* Bulk Download Export Suite */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-1">Export:</span>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors border border-slate-300"
                title="Download CSV for SPSS and R statistical analysis"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Dataset (SPSS CSV)</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors border border-slate-300"
                title="Download complete JSON data bundle"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-700" />
                <span>JSON Bundle</span>
              </button>
              <button
                onClick={handleExportAuditCsv}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors border border-slate-300"
                title="Download cryptographic audit ledger"
              >
                <Download className="w-3.5 h-3.5 text-purple-700" />
                <span>Audit Trail</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & Sort Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, year, chronotype..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg py-1.5 px-2.5 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_CONSENT">Pending Consent</option>
                <option value="CONSENT_SIGNED">Consent Signed</option>
                <option value="HRV_PENDING">HRV Pending</option>
                <option value="FINALIZED">Finalized & Sealed</option>
              </select>
            </div>

            {/* Chronotype Filter */}
            <div>
              <select
                value={chronotypeFilter}
                onChange={(e) => setChronotypeFilter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg py-1.5 px-2.5 bg-slate-50 text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Chronotypes</option>
                <option value="Morning type">Morning type</option>
                <option value="Intermediate type">Intermediate type</option>
                <option value="Evening type">Evening type</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full text-xs border border-slate-300 rounded-lg py-1.5 px-2 bg-slate-50 text-slate-700 focus:outline-none font-medium"
              >
                <option value="DATE">Sort: Date Enrolled</option>
                <option value="ID">Sort: Participant ID</option>
                <option value="RMEQ">Sort: rMEQ Score</option>
                <option value="BMI">Sort: BMI (kg/m²)</option>
                <option value="HR">Sort: Resting HR</option>
                <option value="LF_HF">Sort: LF/HF Ratio</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1.5 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center"
                title="Toggle Ascending / Descending"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Participant ID</th>
                <th className="p-3.5">Batch / Year</th>
                <th className="p-3.5">BMI (kg/m²)</th>
                <th className="p-3.5">rMEQ Chronotype</th>
                <th className="p-3.5">Resting HR / RMSSD</th>
                <th className="p-3.5">LF/HF Ratio</th>
                <th className="p-3.5">Workflow Status</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAndSortedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No participants matched your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSortedParticipants.map((p) => (
                  <tr key={p.participant_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-700">{p.participant_id}</div>
                      <div className="text-[10px] text-slate-400">{p.submission_id}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-900">{p.year_of_study}</div>
                      <div className="text-[10px] text-slate-500">{p.age} yrs • {p.gender}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold">{p.bmi}</span>
                      <span className="text-[10px] text-slate-400 block">{p.weight_kg}kg / {p.height_cm}cm</span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.chronotype_category === 'Morning type' ? 'bg-amber-100 text-amber-900' :
                        p.chronotype_category === 'Evening type' ? 'bg-indigo-100 text-indigo-900' :
                        'bg-blue-100 text-blue-900'
                      }`}>
                        {p.chronotype_category} ({p.rmeq_total_score}/25)
                      </span>
                    </td>
                    <td className="p-3.5">
                      {p.hrv_record ? (
                        <div>
                          <span className="font-bold text-slate-900">{p.hrv_record.resting_heart_rate} bpm</span>
                          <span className="text-[10px] text-blue-600 font-semibold ml-1.5">({p.hrv_record.rmssd} ms)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Measurement</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {p.hrv_record ? (
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {p.hrv_record.lf_hf_ratio}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {p.status === 'FINALIZED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Sealed (2 Pgs)
                        </span>
                      ) : p.status === 'HRV_PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" /> HRV Pending
                        </span>
                      ) : p.status === 'CONSENT_SIGNED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                          <CheckCircle2 className="w-3 h-3" /> Consent Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3" /> Ready to Sign
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onSelectParticipant(p);
                            onNavigateTab('signer');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
                          title="Open Tablet Signer"
                        >
                          Sign
                        </button>
                        <button
                          onClick={() => {
                            onSelectParticipant(p);
                            onNavigateTab('hrv');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                          title="Kubios HRV Studio"
                        >
                          HRV
                        </button>
                        <button
                          onClick={() => {
                            onSelectParticipant(p);
                            onNavigateTab('pdf');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition-colors flex items-center gap-1"
                          title="View PDF Dossier"
                        >
                          <Eye className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Append-Only Audit Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Real-time Cryptographic Audit Event Stream</h4>
            <p className="text-[11px] text-slate-500">Every submission, tablet signature, and biometric ingestion is immutably timestamped.</p>
          </div>
          <button
            onClick={handleExportAuditCsv}
            className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Download Ledger
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
          {auditLogs.map((log, idx) => (
            <div key={log.event_id ? `${log.event_id}-${idx}` : `audit-${idx}`} className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-100 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{log.timestamp.split('T')[1]?.substring(0, 8) || log.timestamp}</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">{log.event_type}</span>
                <span className="text-slate-800 font-semibold">{log.details}</span>
              </div>
              <div className="text-slate-400 text-[10px]">
                {log.event_hash.substring(0, 12)}...
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Participant Creation Modal */}
      <ManualParticipantFormModal
        isOpen={isManualFormOpen}
        onClose={() => setIsManualFormOpen(false)}
        onParticipantCreated={(newP) => {
          onParticipantCreated(newP);
          setDownloadNotice(`Enrolled ${newP.participant_id} directly into CRF queue and Google Sheet sync queue!`);
          setTimeout(() => setDownloadNotice(null), 4000);
        }}
      />

    </div>
  );
};
