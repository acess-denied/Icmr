import React, { useState } from 'react';
import { Smartphone, Download, Copy, Check, ExternalLink, Zap, Terminal, FileCode, Shield, CheckCircle2 } from 'lucide-react';

export const MacroDroidManager: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const macroJsonContent = `{
  "macro_name": "ICMR_STS_Kubios_HRV_AutoCapture",
  "version": "1.0",
  "triggers": [
    {
      "type": "Webhook",
      "identifier": "sts_hrv_measure",
      "query_parameters": ["participant_id", "request_id"]
    }
  ],
  "actions": [
    { "step": 1, "action": "Set Variable", "name": "var_participant_id", "value": "{trigger_param:participant_id}" },
    { "step": 2, "action": "Set Clipboard", "value": "{var_participant_id}" },
    { "step": 3, "action": "Launch App", "package": "com.kubios.hrv" },
    { "step": 4, "action": "Wait & Click", "target": "Start Measurement" },
    { "step": 5, "action": "Paste Tag", "text": "Participant: {var_participant_id}" },
    { "step": 6, "action": "Wait for Screen Text", "text": "RESULT", "timeout": 180 },
    { "step": 7, "action": "Take Screenshot", "path": "/storage/emulated/0/Pictures/Screenshots/STS_Kubios_Result.jpg" },
    { "step": 8, "action": "OCR Text Extraction", "output_var": "var_ocr_text" },
    {
      "step": 9,
      "action": "HTTP POST",
      "url": "https://icmr-sts-worker.workers.dev/api/hrv",
      "body": {
        "participant_id": "{var_participant_id}",
        "ocr_raw_text": "{var_ocr_text}",
        "screenshot_base64": "{file_base64:/storage/emulated/0/Pictures/Screenshots/STS_Kubios_Result.jpg}"
      }
    }
  ]
}`;

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Sensor Automation</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">MacroDroid + Kubios OCR</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">MacroDroid Mobile Automation Package</h2>
          <p className="text-sm text-slate-600">
            Exportable macro definitions, webhook triggers, and step-by-step configuration for automated Kubios HRV acquisition.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCopy(macroJsonContent, 'macro_export')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
          >
            {copiedSection === 'macro_export' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedSection === 'macro_export' ? 'Copied Macro JSON!' : 'Copy Macro JSON'}
          </button>
        </div>
      </div>

      {/* Grid: 3-Step Setup Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center justify-center text-sm">1</div>
          <h3 className="font-bold text-slate-900 text-sm">Install Apps on Android</h3>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Install <b>Kubios HRV</b> from Play Store.</li>
            <li>Install <b>MacroDroid</b> & grant Accessibility + Screen Overlay permissions.</li>
            <li>Pair Bluetooth ECG Sensor (Polar H10).</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-700 font-bold rounded-lg flex items-center justify-center text-sm">2</div>
          <h3 className="font-bold text-slate-900 text-sm">Import Macro Definition</h3>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>In MacroDroid, tap <b>Export/Import</b> → <b>Import</b>.</li>
            <li>Select <code className="font-mono text-slate-800">STS_Kubios_HRV_Capture.macro.json</code>.</li>
            <li>Enable the <b>sts_hrv_measure</b> Webhook trigger.</li>
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 bg-emerald-50 text-emerald-700 font-bold rounded-lg flex items-center justify-center text-sm">3</div>
          <h3 className="font-bold text-slate-900 text-sm">Trigger & Auto-Ingest</h3>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Tablet sends participant ID to phone webhook.</li>
            <li>Macro auto-pastes ID tag in Kubios note.</li>
            <li>Auto-captures screenshot & sends HTTP POST.</li>
          </ul>
        </div>

      </div>

      {/* Code Viewer: Macro JSON */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 space-y-3 shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <FileCode className="w-4 h-4" />
            <span>macrodroid/STS_Kubios_HRV_Capture.macro.json</span>
          </div>
          <button
            onClick={() => handleCopy(macroJsonContent, 'macro_code')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded"
          >
            {copiedSection === 'macro_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSection === 'macro_code' ? 'Copied' : 'Copy'}
          </button>
        </div>

        <pre className="font-mono text-xs overflow-x-auto text-slate-300 p-2 leading-relaxed max-h-96">
          {macroJsonContent}
        </pre>
      </div>
    </div>
  );
};
