import React, { useState } from 'react';
import { Users, FileCheck, Activity, Award, Search, Filter, ArrowUpRight, Zap, CheckCircle2, Clock, Download, Eye } from 'lucide-react';
import { ParticipantRecord, AuditEvent } from '../types';

interface DashboardProps {
  participants: ParticipantRecord[];
  auditLogs: AuditEvent[];
  onSelectParticipant: (participant: ParticipantRecord) => void;
  onNavigateTab: (tab: 'dashboard' | 'signer' | 'hrv' | 'pdf' | 'macrodroid' | 'playbook') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  participants,
  auditLogs,
  onSelectParticipant,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = p.participant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.submission_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.chronotype_category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const enrolledCount = participants.length;
  const consentedCount = participants.filter((p) => p.status !== 'PENDING_CONSENT').length;
  const hrvCount = participants.filter((p) => p.hrv_record !== undefined || p.status === 'HRV_ATTACHED' || p.status === 'FINALIZED').length;
  const finalizedCount = participants.filter((p) => p.status === 'FINALIZED').length;

  return (
    <div className="space-y-6">
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

      {/* Participants Table with Search & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Study Enrollment & Case Record Form Queue</h3>
            <p className="text-xs text-slate-500">Real-time status of participant questionnaire responses, tablet consent, and Kubios biometric attachment.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, chronotype..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-60"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg py-1.5 px-3 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_CONSENT">Pending Consent</option>
              <option value="HRV_PENDING">HRV Pending</option>
              <option value="FINALIZED">Finalized & Sealed</option>
            </select>
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
              {filteredParticipants.map((p) => (
                <tr key={p.participant_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-blue-700">{p.participant_id}</div>
                    <div className="text-[10px] text-slate-400">{p.submission_id}</div>
                  </td>
                  <td className="p-3.5">{p.year_of_study}</td>
                  <td className="p-3.5">
                    <span className="font-semibold">{p.bmi}</span>
                    <span className="text-[10px] text-slate-400 block">{p.weight_kg}kg / {p.height_cm}cm</span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Append-Only Audit Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h4 className="font-bold text-slate-900 text-sm">Real-time Cryptographic Audit Event Stream</h4>
          <span className="text-[11px] font-mono text-slate-500">Hash-Chained SHA-256 Ledger</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[11px]">
          {auditLogs.map((log, idx) => (
            <div key={log.event_id ? `${log.event_id}-${idx}` : `audit-${idx}`} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-slate-700">
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
    </div>
  );
};
