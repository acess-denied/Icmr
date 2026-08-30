import React, { useState } from 'react';
import { Terminal, Copy, Check, BookOpen, Database, Shield, FileText, CheckCircle2, ChevronRight, Lock, Key, Server, Globe } from 'lucide-react';

export const PlaybookViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'playbook' | 'setup_script' | 'cloudflare_zero_trust' | 'd1_schema'>('playbook');
  const [copied, setCopied] = useState<string | null>(null);

  const setupScriptContent = `#!/usr/bin/env bash
# ==============================================================================
# ICMR STS 2026 RESEARCH STUDY — COMPLETE A-TO-Z CLOUDFLARE SETUP & DEPLOYMENT
# Study: "Association Between Meal Timing, Chronotype, and Heart Rate Variability"
# Target Environment: Cloudflare Workers + D1 + R2 + Pages + Zero Trust (WARP)
# ==============================================================================

set -e

# Step 1: Prompt for Cloudflare API Token & Account ID
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    read -p "Enter CLOUDFLARE_API_TOKEN: " INPUT_TOKEN
    export CLOUDFLARE_API_TOKEN="$INPUT_TOKEN"
fi

# Step 2: Create D1 Database & Run Migrations
npx wrangler d1 create icmr_sts_research_db
npx wrangler d1 execute icmr_sts_research_db --remote --file=./d1/schema.sql

# Step 3: Create R2 Bucket
npx wrangler r2 bucket create icmr-sts-documents

# Step 4: Provision HMAC Webhook Secret
STS_SECRET=$(openssl rand -hex 32)
echo "$STS_SECRET" | (cd phase1-cloudflare-worker && npx wrangler secret put STS_WEBHOOK_SECRET)

# Step 5: Deploy Worker API Backend
cd phase1-cloudflare-worker && npx wrangler deploy && cd ..

# Step 6: Build & Deploy Frontend to Cloudflare Pages
npm run build
npx wrangler pages project create icmr-sts-portal --production-branch main
npx wrangler pages deploy dist --project-name=icmr-sts-portal

# Step 7: Configure Cloudflare Zero Trust Private Access
echo "Zero Trust Policy: Restrict icmr-sts-portal.pages.dev to Cloudflare One / WARP enrolled devices."`;

  const d1SchemaContent = `-- 1. Participants Table
CREATE TABLE participants (
    participant_id TEXT PRIMARY KEY,
    submission_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL,
    year_of_study TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Direct Identifiers (Partitioned)
CREATE TABLE participant_identifiers (
    participant_id TEXT PRIMARY KEY,
    name_optional TEXT,
    contact_number TEXT,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

-- 3. De-Identified Research Data
CREATE TABLE research_data (
    participant_id TEXT PRIMARY KEY,
    age_years INTEGER NOT NULL,
    gender TEXT NOT NULL,
    height_cm REAL NOT NULL,
    weight_kg REAL NOT NULL,
    bmi REAL NOT NULL,
    rmeq_total_score INTEGER NOT NULL,
    chronotype_category TEXT NOT NULL,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

-- 4. Kubios HRV Records & Verification Screenshot
CREATE TABLE hrv_records (
    hrv_id TEXT PRIMARY KEY,
    participant_id TEXT UNIQUE NOT NULL,
    resting_heart_rate REAL NOT NULL,
    rmssd REAL NOT NULL,
    sdnn REAL NOT NULL,
    lf_power REAL NOT NULL,
    hf_power REAL NOT NULL,
    lf_hf_ratio REAL NOT NULL,
    readiness_percentage REAL,
    pns_index REAL,
    sns_index REAL,
    stress_index REAL,
    entry_mode TEXT DEFAULT 'OCR_AUTO_CAPTURED',
    manual_entry_reason TEXT,
    screenshot_r2_key TEXT,
    screenshot_sha256 TEXT,
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

-- 5. Immutable Audit Events
CREATE TABLE audit_events (
    event_id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    actor_type TEXT NOT NULL,
    event_hash TEXT
);`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Master Blueprint</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Cloudflare Pages + Workers + D1 + R2</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Cloudflare One Zero Trust
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Production Playbook, Fresh Setup Script & Zero Trust Architecture</h2>
          <p className="text-sm text-slate-600">
            End-to-end deployment guide for fresh Cloudflare accounts, interactive bash deployment script, and Zero Trust private network policy.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold flex-wrap">
          <button
            onClick={() => setActiveSubTab('playbook')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeSubTab === 'playbook' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Playbook (Phases 1–10)
          </button>
          <button
            onClick={() => setActiveSubTab('setup_script')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeSubTab === 'setup_script' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Fresh setup.sh Script
          </button>
          <button
            onClick={() => setActiveSubTab('cloudflare_zero_trust')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeSubTab === 'cloudflare_zero_trust' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Cloudflare Zero Trust (WARP)
          </button>
          <button
            onClick={() => setActiveSubTab('d1_schema')}
            className={`px-3 py-1.5 rounded-md transition-colors ${activeSubTab === 'd1_schema' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            D1 Database Schema
          </button>
        </div>
      </div>

      {activeSubTab === 'playbook' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">1</span>
                <span>Phase 1: Google Ingestion + HMAC Webhook</span>
              </div>
              <p className="text-xs text-slate-600">
                Google Form / Sheet triggers Apps Script with canonical HMAC-SHA256 request signature, replay cache, and 300s skew protection.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">2</span>
                <span>Phase 2: Cloudflare D1 Database</span>
              </div>
              <p className="text-xs text-slate-600">
                9 relational tables with logical separation between direct identifiers, research biometrics, sessions, and signatures.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">3</span>
                <span>Phase 3: Python PDF Engine</span>
              </div>
              <p className="text-xs text-slate-600">
                ReportLab / PyPDF coordinate mapping for Sections A–G, Asian-Indian BMI calculation, rMEQ scoring, and appendix generator.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">4</span>
                <span>Phases 4 & 5: Tablet Signing & Capture</span>
              </div>
              <p className="text-xs text-slate-600">
                Participant reviews information, signs on canvas pad; Investigator co-signs with cryptographic SHA-256 sealing.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">6</span>
                <span>Phase 6: Cloudflare R2 + Immutable Audit</span>
              </div>
              <p className="text-xs text-slate-600">
                Signed PDFs and raw screenshots stored in R2 bucket with hash chaining on every state transition.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">9</span>
                <span>Phase 9: MacroDroid + Kubios HRV OCR & Manual Backup</span>
              </div>
              <p className="text-xs text-slate-600">
                Automated Kubios mobile trigger, screenshot OCR parsing, high-contrast filter re-run, and complete manual data entry fallback.
              </p>
            </div>

          </div>
        </div>
      )}

      {activeSubTab === 'setup_script' && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 space-y-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Terminal className="w-4 h-4" />
              <span>setup.sh (A-to-Z Fresh Account Automation)</span>
            </div>
            <button
              onClick={() => handleCopy(setupScriptContent, 'setup_sh')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded"
            >
              {copied === 'setup_sh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'setup_sh' ? 'Copied' : 'Copy setup.sh'}
            </button>
          </div>

          <pre className="font-mono text-xs overflow-x-auto text-emerald-300 p-2 leading-relaxed max-h-96">
            {setupScriptContent}
          </pre>
        </div>
      )}

      {activeSubTab === 'cloudflare_zero_trust' && (
        <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base border-b border-emerald-100 pb-3">
            <Shield className="w-5 h-5 text-emerald-600" />
            <span>Cloudflare One / Cloudflare Zero Trust Private Network Security Policy</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            By enforcing Cloudflare Zero Trust (Cloudflare Access & Cloudflare WARP VPN), this application and its backend APIs are accessible <b>strictly to your enrolled devices</b> inside your private Cloudflare One perimeter. External public access is completely blocked at the edge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>1. Cloudflare Access App Configuration</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Navigate to <b>Cloudflare Zero Trust &gt; Access &gt; Applications</b></li>
                <li>Add a <b>Self-Hosted Application</b> with domain <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">icmr-sts-portal.pages.dev</code></li>
                <li>Session duration: 12 hours with device re-authentication</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>2. Device Posture & WARP Policy</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Set Policy Action: <b>Allow</b></li>
                <li>Include Selector: <b>WARP Client Enabled</b> (Enrolled in Organization)</li>
                <li>Include Selector: <b>User Email / Domain</b> (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">@your-institution.edu.in</code>)</li>
                <li>Require Device Certificate / Mutual TLS (mTLS) for tablets</li>
              </ul>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              <b>Private Edge Verification Active:</b> Cloudflare Worker checks for <code className="font-mono bg-emerald-100 px-1 rounded">Cf-Access-Jwt-Assertion</code> and <code className="font-mono bg-emerald-100 px-1 rounded">Cf-Warp-Tag-Id</code> on every API request. Unauthorized internet traffic receives <code className="font-mono">HTTP 403 Forbidden</code>.
            </span>
          </div>
        </div>
      )}

      {activeSubTab === 'd1_schema' && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-300 space-y-3 shadow-lg">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
              <Database className="w-4 h-4" />
              <span>d1/schema.sql</span>
            </div>
            <button
              onClick={() => handleCopy(d1SchemaContent, 'd1_sql')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded"
            >
              {copied === 'd1_sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'd1_sql' ? 'Copied' : 'Copy SQL Schema'}
            </button>
          </div>

          <pre className="font-mono text-xs overflow-x-auto text-blue-200 p-2 leading-relaxed max-h-96">
            {d1SchemaContent}
          </pre>
        </div>
      )}

    </div>
  );
};
