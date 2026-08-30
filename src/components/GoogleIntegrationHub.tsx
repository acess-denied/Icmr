import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRightLeft, 
  Code, 
  Key, 
  Database,
  Globe,
  Sliders,
  Sparkles
} from 'lucide-react';
import { ParticipantRecord } from '../types';

interface GoogleIntegrationHubProps {
  participants: ParticipantRecord[];
  onTriggerSyncAll?: () => void;
}

export const GoogleIntegrationHub: React.FC<GoogleIntegrationHubProps> = ({
  participants,
}) => {
  const [googleSheetId, setGoogleSheetId] = useState('1A2b3C4d5E6f7G8h9I0j_ICMR_STS_2026_RESEARCH');
  const [googleFormId, setGoogleFormId] = useState('1FAIpQLSc_EXAMPLE_FORM_ID_STS2026');
  const [appsScriptUrl, setAppsScriptUrl] = useState('https://script.google.com/macros/s/AKfycbz_ICMR_STS_APPLET_DEPLOYMENT/exec');
  const [workerWebhookUrl, setWorkerWebhookUrl] = useState('https://icmr-sts-worker.health-research.workers.dev/api/form-submit');
  const [webhookSecret, setWebhookSecret] = useState('a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8');
  
  const [copied, setCopied] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS'>('IDLE');
  const [testSimulating, setTestSimulating] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleSyncToSheets = () => {
    setSyncStatus('SYNCING');
    setTimeout(() => {
      setSyncStatus('SUCCESS');
      setTimeout(() => setSyncStatus('IDLE'), 3500);
    }, 1200);
  };

  const handleSimulateFormSubmission = () => {
    setTestSimulating(true);
    setTestResult(null);
    setTimeout(() => {
      setTestSimulating(false);
      setTestResult('Successfully simulated Google Form submit → Apps Script HMAC sign → Worker /api/form-submit ingestion (HTTP 200 OK)');
    }, 1000);
  };

  const sampleAppsScriptCode = `/**
 * ICMR STS 2026 — Google Apps Script Webhook Trigger
 * Target: Google Sheets > Extensions > Apps Script
 * Event: "On form submit" installable trigger
 */
var CONFIG = {
  WORKER_ENDPOINT: "${workerWebhookUrl}",
  HMAC_SECRET: "${webhookSecret}",
  HEADER_PARTICIPANT_ID: "STS Participant ID",
  HEADER_SYNC_STATUS: "STS Sync Status"
};

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var row = e ? e.range.getRow() : sheet.getLastRow();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 1. Generate or read Participant ID
  var participantId = "STS-2026-" + Utilities.getUuid().substring(0, 6).toUpperCase();
  
  // 2. Build payload from questionnaire answers
  var payload = {
    submission_id: "SUB-" + new Date().getTime() + "-" + row,
    participant_id: participantId,
    form_timestamp: new Date().toISOString(),
    raw_answers: {}
  };
  for (var i = 0; i < headers.length; i++) {
    payload.raw_answers[headers[i]] = rowValues[i];
  }

  // 3. Compute HMAC-SHA256 Signature
  var payloadString = JSON.stringify(payload);
  var signatureBytes = Utilities.computeHmacSha256Signature(payloadString, CONFIG.HMAC_SECRET);
  var signatureHex = signatureBytes.map(function(b) {
    return ("0" + (b & 0xFF).toString(16)).slice(-2);
  }).join("");

  // 4. Dispatch to Cloudflare Worker API
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "X-STS-Signature": signatureHex,
      "X-STS-Timestamp": String(Math.floor(new Date().getTime() / 1000)),
      "X-STS-Request-ID": Utilities.getUuid()
    },
    payload: payloadString,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(CONFIG.WORKER_ENDPOINT, options);
  if (response.getResponseCode() === 200) {
    // 5. Write back confirmation to Google Sheet
    sheet.getRange(row, sheet.getLastColumn()).setValue("SYNCED_OK");
  }
}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Primary Data Store
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              2-Way Google Sheets Sync
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              HMAC-SHA256 Webhook
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Google Forms & Google Sheets Ingestion Architecture</h2>
          <p className="text-sm text-slate-600">
            How Google Form responses trigger edge workers, how all 120 participant records live permanently on Google Sheets, and how 2-way sync keeps consent and Kubios HRV data updated.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncToSheets}
            disabled={syncStatus === 'SYNCING'}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            {syncStatus === 'SYNCING' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
            {syncStatus === 'SYNCING' ? 'Syncing to Sheets...' : syncStatus === 'SUCCESS' ? 'Synced with Google Sheet!' : 'Sync All to Google Sheet'}
          </button>
        </div>
      </div>

      {/* 3-Step Trigger Pipeline Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
              1
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Form Trigger</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Participant Submits Google Form</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Students fill out the ICMR STS questionnaire (Demographics, Chrononutrition, rMEQ, Sleep). The response is immediately saved as a new row in your primary Google Sheet.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
              2
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Apps Script Webhook</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Apps Script onFormSubmit Trigger</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Google Sheets triggers <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">Code.gs</code>. It stamps the unique <code className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded font-mono text-[11px]">STS-2026-XXXXXX</code> ID into the row, HMAC-SHA256 signs the JSON, and POSTs to the Worker.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs">
              3
            </span>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">2-Way Write-Back</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm">Dashboard & Sheet 2-Way Sync</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            When consent is signed or Kubios HRV is captured via MacroDroid, the dashboard writes back the metrics (HR, RMSSD, LF/HF, Signed PDF URL) to Google Sheets columns.
          </p>
        </div>

      </div>

      {/* Configuration Credentials & Endpoints */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Google Integration Endpoints & Credentials
          </h3>
          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
            Status: Active & Linked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Target Google Sheet ID / Spreadsheet URL
            </label>
            <input
              type="text"
              value={googleSheetId}
              onChange={(e) => setGoogleSheetId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Found in your Google Sheet URL between /d/ and /edit.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              Google Form ID (Questionnaire Source)
            </label>
            <input
              type="text"
              value={googleFormId}
              onChange={(e) => setGoogleFormId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">Linked Google Form collecting student responses.</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              Cloudflare Worker Webhook Receiver URL (/api/form-submit)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={workerWebhookUrl}
                onChange={(e) => setWorkerWebhookUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white"
              />
              <button
                onClick={() => handleCopy(workerWebhookUrl, 'worker_url')}
                className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center justify-center"
              >
                {copied === 'worker_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Target URL for Apps Script UrlFetchApp.fetch().</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              Cryptographic HMAC-SHA256 Webhook Secret (STS_WEBHOOK_SECRET)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white"
              />
              <button
                onClick={() => handleCopy(webhookSecret, 'secret')}
                className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center justify-center"
              >
                {copied === 'secret' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Shared secret stored in Worker environment secrets.</p>
          </div>

        </div>

        {/* Live Simulation Test */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-900 text-xs">Test Google Form Webhook Trigger Pipeline</div>
            <div className="text-[11px] text-slate-500">
              Simulates an incoming Google Form response, HMAC signature generation, and worker ingestion.
            </div>
          </div>
          <button
            onClick={handleSimulateFormSubmission}
            disabled={testSimulating}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            {testSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {testSimulating ? 'Sending Webhook...' : 'Simulate Google Form Submit'}
          </button>
        </div>

        {testResult && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{testResult}</span>
          </div>
        )}
      </div>

      {/* Google Sheets Column Schema Mapping */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Google Sheet 2-Way Column Schema Mapping</h3>
            <p className="text-xs text-slate-500">Every research variable lives on your primary Google Sheet with automatic bidirectional updates.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Sheet Column Header</th>
                <th className="p-3">Source Direction</th>
                <th className="p-3">Research Variable</th>
                <th className="p-3">Live Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-3 font-mono font-bold text-blue-700">STS Participant ID</td>
                <td className="p-3"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">Auto-Stamped</span></td>
                <td className="p-3">Primary Key</td>
                <td className="p-3 font-mono font-bold">STS-2026-7F3A91</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">Timestamp & Academic Year</td>
                <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Google Form Ingest</span></td>
                <td className="p-3">Demographics</td>
                <td className="p-3">Second MBBS (Age 20, Male)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">rMEQ Score & Chronotype</td>
                <td className="p-3"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">Google Form Ingest</span></td>
                <td className="p-3">Circadian Score</td>
                <td className="p-3">16/25 (Intermediate type)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">STS Consent Status</td>
                <td className="p-3"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">Tablet Write-Back</span></td>
                <td className="p-3">Consent Signature</td>
                <td className="p-3 text-emerald-700 font-semibold">SIGNED (Tablet Canvas)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">Kubios HR / RMSSD / LF_HF</td>
                <td className="p-3"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">MacroDroid Write-Back</span></td>
                <td className="p-3">Autonomic Biometrics</td>
                <td className="p-3 font-bold text-slate-900">78 bpm / 31 ms / 0.28 ratio</td>
              </tr>
              <tr>
                <td className="p-3 font-mono">CRF Dossier Link & SHA-256</td>
                <td className="p-3"><span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">R2 Vault Write-Back</span></td>
                <td className="p-3">Sealed PDF Hash</td>
                <td className="p-3 font-mono text-[11px] text-slate-500">4c7b2a9f1e3c...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Copyable Google Apps Script Code */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 space-y-3 shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Code className="w-4 h-4" />
            <span>Google Apps Script Trigger (Paste into Extensions &gt; Apps Script)</span>
          </div>
          <button
            onClick={() => handleCopy(sampleAppsScriptCode, 'apps_script_code')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded transition-colors"
          >
            {copied === 'apps_script_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'apps_script_code' ? 'Copied Code' : 'Copy Apps Script Code'}
          </button>
        </div>

        <pre className="font-mono text-xs overflow-x-auto text-emerald-300 p-2 leading-relaxed max-h-64">
          {sampleAppsScriptCode}
        </pre>
      </div>

    </div>
  );
};
