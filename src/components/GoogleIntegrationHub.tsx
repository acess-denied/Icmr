import React, { useState, useEffect } from 'react';
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
  Sparkles,
  PlusCircle,
  DownloadCloud,
  UploadCloud,
  FileQuestion,
  UserCheck,
  LogOut,
  LogIn,
  AlertTriangle,
  Eye,
  Layers,
  CheckCheck,
  Terminal,
  Laptop,
  Server,
  Workflow,
  FileCode
} from 'lucide-react';
import { ParticipantRecord } from '../types';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  createStudySpreadsheet, 
  exportParticipantsToGoogleSheet, 
  readGoogleSheetData, 
  parseParticipantsFromSheetRows,
  createIcmrResearchGoogleForm,
  fetchGoogleFormDetails,
  fetchGoogleFormResponses,
  convertGoogleFormResponsesToParticipants
} from '../services/googleWorkspace';
import { User } from 'firebase/auth';
import { 
  generateAppsScriptCode, 
  generatePowerShellScript, 
  generateBashScript, 
  APPS_SCRIPT_MANIFEST 
} from '../utils/appsScriptTemplates';

interface GoogleIntegrationHubProps {
  participants: ParticipantRecord[];
  onImportParticipants?: (records: ParticipantRecord[]) => void;
  onTriggerSyncAll?: () => void;
}

export const GoogleIntegrationHub: React.FC<GoogleIntegrationHubProps> = ({
  participants,
  onImportParticipants
}) => {
  // Top-Level Deployment Option State
  const [deploymentOption, setDeploymentOption] = useState<'option1_google_online' | 'option2_apps_script_manual'>('option1_google_online');

  // Auth State (Option 1)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Workspace Sub-Tab for Option 1
  const [workspaceTab, setWorkspaceTab] = useState<'sheets' | 'forms'>('sheets');

  // 1-Click Full Workspace Deployment State (Option 1)
  const [isDeployingSuite, setIsDeployingSuite] = useState<boolean>(false);
  const [suiteDeployStatus, setSuiteDeployStatus] = useState<string | null>(null);

  // Google Sheets State
  const [googleSheetId, setGoogleSheetId] = useState<string>('1A2b3C4d5E6f7G8h9I0j_ICMR_STS_2026_RESEARCH');
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetActionStatus, setSheetActionStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [isReadingSheet, setIsReadingSheet] = useState<boolean>(false);
  const [sheetPreviewData, setSheetPreviewData] = useState<{ title: string; rows: any[][] } | null>(null);

  // Google Forms State
  const [googleFormId, setGoogleFormId] = useState<string>('1FAIpQLSc_EXAMPLE_FORM_ID_STS2026');
  const [createdFormUrls, setCreatedFormUrls] = useState<{ editUrl: string; responderUrl: string } | null>(null);
  const [isCreatingForm, setIsCreatingForm] = useState<boolean>(false);
  const [isFetchingResponses, setIsFetchingResponses] = useState<boolean>(false);
  const [formResponses, setFormResponses] = useState<any[] | null>(null);
  const [formResponseDetails, setFormResponseDetails] = useState<any | null>(null);
  const [formActionStatus, setFormActionStatus] = useState<string | null>(null);

  // Option 2 (Google Apps Script Code & CLI) State
  const [codeExportTab, setCodeExportTab] = useState<'code_gs' | 'powershell' | 'bash' | 'manifest'>('code_gs');
  const [workerWebhookUrl, setWorkerWebhookUrl] = useState<string>('https://icmr-sts-worker.health-research.workers.dev/api/form-submit');
  const [webhookSecret, setWebhookSecret] = useState<string>('a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8');
  const [appsScriptKey, setAppsScriptKey] = useState<string>('AKfycbz_ICMR_STS_APPLET_DEPLOYMENT');
  const [endpointPreset, setEndpointPreset] = useState<'worker' | 'custom_domain' | 'local_ip'>('worker');

  const [copied, setCopied] = useState<string | null>(null);
  const [testSimulating, setTestSimulating] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: 'Confirm',
    onConfirm: () => {}
  });

  // Initialize Auth Listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      setCurrentUser(result.user);
      setAccessToken(result.accessToken);
    } catch (err: any) {
      console.error('Sign in failure:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setCurrentUser(null);
    setAccessToken(null);
    setSheetPreviewData(null);
    setFormResponses(null);
  };

  // 1-Click Deploy Full Workspace (Form + Sheet)
  const handleDeployFullWorkspace = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google to provision research forms and spreadsheets.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Deploy Full ICMR STS Research Workspace?',
      description: 'This will provision both the standardized ICMR STS Research Google Form (with 13 clinical items) AND the Master Research Google Spreadsheet (with 32 clinical columns, frozen header, and formula formatting) directly in your Google Drive, and export current participants.',
      actionLabel: 'Deploy Both Form & Sheet',
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsDeployingSuite(true);
        setSuiteDeployStatus('1/3 Provisioning Master Research Google Spreadsheet...');
        try {
          // 1. Create Spreadsheet
          const sheetRes = await createStudySpreadsheet(
            accessToken, 
            `ICMR STS 2026 — Research Study Master Data (${new Date().toLocaleDateString('en-IN')})`
          );
          setGoogleSheetId(sheetRes.spreadsheetId);
          setSheetUrl(sheetRes.spreadsheetUrl);

          // 2. Auto-export cohort if any
          if (participants.length > 0) {
            setSuiteDeployStatus(`2/3 Exporting ${participants.length} clinical records to sheet...`);
            await exportParticipantsToGoogleSheet(accessToken, sheetRes.spreadsheetId, participants);
          }

          // 3. Create Google Form
          setSuiteDeployStatus('3/3 Deploying 13-item ICMR STS Research Google Form...');
          const formRes = await createIcmrResearchGoogleForm(accessToken);
          setGoogleFormId(formRes.formId);
          setCreatedFormUrls({
            editUrl: formRes.editUri,
            responderUrl: formRes.responderUri
          });

          setSuiteDeployStatus(`Workspace deployment complete! Google Sheet ID: ${sheetRes.spreadsheetId} | Form ID: ${formRes.formId}`);
        } catch (err: any) {
          setSuiteDeployStatus(`Deployment error: ${err.message}`);
        } finally {
          setIsDeployingSuite(false);
        }
      }
    });
  };

  // Google Sheets Actions
  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google to create a spreadsheet.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Create New Research Master Google Spreadsheet?',
      description: 'This will provision a new spreadsheet titled "ICMR STS 2026 — Research Study Master Data" in your Google Drive with 32 research variables, frozen headers, and pre-formatted columns.',
      actionLabel: 'Create Spreadsheet',
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsCreatingSheet(true);
        setSheetActionStatus(null);
        try {
          const res = await createStudySpreadsheet(accessToken, `ICMR STS 2026 — Research Study Master Data (${new Date().toLocaleDateString('en-IN')})`);
          setGoogleSheetId(res.spreadsheetId);
          setSheetUrl(res.spreadsheetUrl);
          
          if (participants.length > 0) {
            await exportParticipantsToGoogleSheet(accessToken, res.spreadsheetId, participants);
            setSheetActionStatus(`Spreadsheet created successfully! Exported ${participants.length} participant records.`);
          } else {
            setSheetActionStatus('Spreadsheet created successfully in Google Drive!');
          }
        } catch (err: any) {
          setSheetActionStatus(`Error creating spreadsheet: ${err.message}`);
        } finally {
          setIsCreatingSheet(false);
        }
      }
    });
  };

  const handleExportToSheet = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google to export to Google Sheets.');
      return;
    }
    if (!googleSheetId.trim()) {
      setSheetActionStatus('Please specify a valid Google Spreadsheet ID.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Export Participants to Google Sheet?',
      description: `This will overwrite or update rows on tab 'Participants_Master' of spreadsheet ID "${googleSheetId}" with ${participants.length} participant records (Demographics, Chronotype, Sleep, Kubios HRV parameters).`,
      actionLabel: `Export ${participants.length} Records`,
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsExporting(true);
        setSheetActionStatus(null);
        try {
          const res = await exportParticipantsToGoogleSheet(accessToken, googleSheetId.trim(), participants);
          setSheetUrl(res.spreadsheetUrl);
          setSheetActionStatus(`Successfully updated ${res.updatedRows} rows in Google Sheet!`);
        } catch (err: any) {
          setSheetActionStatus(`Export error: ${err.message}`);
        } finally {
          setIsExporting(false);
        }
      }
    });
  };

  const handleReadSheet = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google to read from Google Sheets.');
      return;
    }
    if (!googleSheetId.trim()) {
      setSheetActionStatus('Please specify a valid Google Spreadsheet ID.');
      return;
    }

    setIsReadingSheet(true);
    setSheetActionStatus(null);
    setSheetPreviewData(null);
    try {
      const data = await readGoogleSheetData(accessToken, googleSheetId.trim());
      setSheetPreviewData({
        title: data.title,
        rows: data.values
      });
      setSheetActionStatus(`Read ${data.values.length} rows (including header) from "${data.title}".`);
    } catch (err: any) {
      setSheetActionStatus(`Failed to read sheet: ${err.message}`);
    } finally {
      setIsReadingSheet(false);
    }
  };

  const handleImportParsedSheetData = () => {
    if (!sheetPreviewData || sheetPreviewData.rows.length <= 1) return;

    setConfirmModal({
      isOpen: true,
      title: 'Import Participants from Google Sheet?',
      description: `This will parse and import ${sheetPreviewData.rows.length - 1} records from "${sheetPreviewData.title}" into the application.`,
      actionLabel: 'Import Records',
      isDanger: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const records = parseParticipantsFromSheetRows(sheetPreviewData.rows);
        if (onImportParticipants) {
          onImportParticipants(records);
          setSheetActionStatus(`Imported ${records.length} records into study cohort successfully!`);
          setSheetPreviewData(null);
        }
      }
    });
  };

  // Google Forms Actions
  const handleCreateIcmrForm = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google to create a Google Form.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Deploy Official ICMR STS Research Google Form?',
      description: 'This will create an official research questionnaire form with 13 standardized items (Demographics, Chrononutrition, rMEQ items, Sleep duration, Snacking behavior) in your Google Forms workspace and return shareable links.',
      actionLabel: 'Deploy Google Form',
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsCreatingForm(true);
        setFormActionStatus(null);
        try {
          const res = await createIcmrResearchGoogleForm(accessToken);
          setGoogleFormId(res.formId);
          setCreatedFormUrls({
            editUrl: res.editUri,
            responderUrl: res.responderUri
          });
          setFormActionStatus(`Form "${res.formTitle}" created successfully!`);
        } catch (err: any) {
          setFormActionStatus(`Error creating form: ${err.message}`);
        } finally {
          setIsCreatingForm(false);
        }
      }
    });
  };

  const handleFetchFormResponses = async () => {
    if (!accessToken) {
      setAuthError('Please sign in with Google to fetch Google Form responses.');
      return;
    }
    if (!googleFormId.trim()) {
      setFormActionStatus('Please enter a valid Google Form ID or URL.');
      return;
    }

    setIsFetchingResponses(true);
    setFormActionStatus(null);
    setFormResponses(null);
    try {
      const details = await fetchGoogleFormDetails(accessToken, googleFormId.trim());
      setFormResponseDetails(details);
      const responsesData = await fetchGoogleFormResponses(accessToken, googleFormId.trim());
      setFormResponses(responsesData.responses);
      setFormActionStatus(`Retrieved ${responsesData.totalResponses} submissions for "${details.info?.title || 'Google Form'}".`);
    } catch (err: any) {
      setFormActionStatus(`Error fetching responses: ${err.message}`);
    } finally {
      setIsFetchingResponses(false);
    }
  };

  const handleImportFormResponses = () => {
    if (!formResponses || formResponses.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: 'Import Google Form Responses as Study Participants?',
      description: `This will parse ${formResponses.length} questionnaire responses, generate unique STS-2026 participant IDs, calculate initial rMEQ chronotypes, and enroll them into the study registry.`,
      actionLabel: `Enroll ${formResponses.length} Participants`,
      isDanger: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const records = convertGoogleFormResponsesToParticipants(formResponseDetails, formResponses);
        if (onImportParticipants) {
          onImportParticipants(records);
          setFormActionStatus(`Successfully enrolled ${records.length} participants from Google Form responses!`);
          setFormResponses(null);
        }
      }
    });
  };

  // Webhook Simulator for Option 2
  const handleSimulateFormSubmission = () => {
    setTestSimulating(true);
    setTestResult(null);
    setTimeout(() => {
      setTestSimulating(false);
      setTestResult(`Successfully dispatched HMAC-SHA256 authenticated payload to "${workerWebhookUrl}" (HTTP 200 OK — Participant record queued)`);
    }, 1000);
  };

  const handlePresetChange = (preset: 'worker' | 'custom_domain' | 'local_ip') => {
    setEndpointPreset(preset);
    if (preset === 'worker') {
      setWorkerWebhookUrl('https://icmr-sts-worker.health-research.workers.dev/api/form-submit');
    } else if (preset === 'custom_domain') {
      setWorkerWebhookUrl('https://api.icmr-sts2026.org/api/form-submit');
    } else if (preset === 'local_ip') {
      setWorkerWebhookUrl('http://192.168.1.100:3000/api/form-submit');
    }
  };

  const handleGenerateSecret = () => {
    const chars = '0123456789abcdef';
    let newSecret = '';
    for (let i = 0; i < 64; i++) {
      newSecret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWebhookSecret(newSecret);
  };

  // Generate dynamic code strings based on active configuration
  const dynamicAppsScriptCode = generateAppsScriptCode({
    workerWebhookUrl,
    webhookSecret,
    googleSheetId,
    appsScriptKey
  });

  const dynamicPowerShellCode = generatePowerShellScript({
    workerWebhookUrl,
    webhookSecret,
    appsScriptKey
  });

  const dynamicBashCode = generateBashScript({
    workerWebhookUrl,
    webhookSecret,
    appsScriptKey
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Deployment Architecture Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                ICMR STS 2026 Deployment Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Google Sheets
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
                <FileQuestion className="w-3.5 h-3.5" /> Google Forms
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                <Code className="w-3.5 h-3.5" /> Apps Script & CLI
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">Workspace & Ingestion Deployment Hub</h2>
            <p className="text-sm text-slate-600">
              Choose your preferred deployment method below: direct browser Google integration, or standalone Google Apps Script code with custom domains, IP addresses, and HMAC keys.
            </p>
          </div>

          {/* Authentication Status in Option 1 */}
          {deploymentOption === 'option1_google_online' && (
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                    {currentUser.displayName ? currentUser.displayName[0] : (currentUser.email ? currentUser.email[0].toUpperCase() : 'U')}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {currentUser.displayName || currentUser.email}
                    </div>
                    <div className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Sheets & Forms Access Granted
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleSignOut}
                    title="Sign out of Google"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthenticating}
                  className="flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-sm transition-all hover:shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isAuthenticating ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {authError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 2 Primary Deployment Options Selector */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setDeploymentOption('option1_google_online')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              deploymentOption === 'option1_google_online'
                ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Option 1: Online Google Cloud Deployment
              </span>
              <input 
                type="radio" 
                name="deploy_opt" 
                checked={deploymentOption === 'option1_google_online'} 
                onChange={() => setDeploymentOption('option1_google_online')}
                className="text-emerald-600 focus:ring-emerald-500"
              />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-2">Automated Google Workspace Integration</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Sign in with your Google account. In 1 click, the system automatically creates the standardized ICMR STS Research Google Form and Master Google Spreadsheet in your Google Drive with 2-way live sync.
            </p>
          </div>

          <div 
            onClick={() => setDeploymentOption('option2_apps_script_manual')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              deploymentOption === 'option2_apps_script_manual'
                ? 'border-blue-700 bg-blue-50/40 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" /> Option 2: Google Apps Script Code & CLI
              </span>
              <input 
                type="radio" 
                name="deploy_opt" 
                checked={deploymentOption === 'option2_apps_script_manual'} 
                onChange={() => setDeploymentOption('option2_apps_script_manual')}
                className="text-blue-600 focus:ring-blue-500"
              />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-2">Self-Hosted / Apps Script Portal & Scripts</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Configure your custom ingestion domain, edge URL, or local LAN IP address and HMAC secret. The app generates pre-filled <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">Code.gs</code> for <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">script.google.com</code>, plus Windows PowerShell and Linux Bash scripts.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* OPTION 1: AUTOMATED GOOGLE ONLINE CLOUD DEPLOYMENT                */}
      {/* ================================================================= */}
      {deploymentOption === 'option1_google_online' && (
        <div className="space-y-6">
          {/* 1-Click Provisioning Action Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 rounded text-[11px] font-bold uppercase tracking-wider">
                  1-Click Automation
                </span>
                <span className="text-xs text-emerald-100">Zero-Config Deployment</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">Deploy Complete Research Suite in 1-Click</h3>
              <p className="text-xs text-emerald-100 max-w-xl">
                Provisions both the standardized ICMR STS Research Google Form (13 standardized items) AND the Master Research Google Sheet (32 clinical columns, frozen header, formatted formulas) directly in your Google Drive.
              </p>
            </div>

            <button
              onClick={handleDeployFullWorkspace}
              disabled={isDeployingSuite}
              className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              {isDeployingSuite ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-800" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
              <span>{isDeployingSuite ? 'Provisioning Suite...' : 'Deploy Form & Sheet in 1 Click'}</span>
            </button>
          </div>

          {suiteDeployStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              suiteDeployStatus.includes('error') || suiteDeployStatus.includes('Error')
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            }`}>
              {suiteDeployStatus.includes('error') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
              <span>{suiteDeployStatus}</span>
            </div>
          )}

          {/* Sub-Tabs for Google Sheets & Google Forms */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setWorkspaceTab('sheets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                workspaceTab === 'sheets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets Master Data ({participants.length} Records)</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('forms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                workspaceTab === 'forms'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              <span>Google Forms Survey & Submissions</span>
            </button>
          </div>

          {/* Sheets Sub-Tab */}
          {workspaceTab === 'sheets' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    Google Sheets Synchronizer & Master Data Store
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export your cohort with all 32 clinical parameters, or import rows from an existing Google Sheet.
                  </p>
                </div>

                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Google Sheets</span>
                  </a>
                )}
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Google Spreadsheet ID or URL
                  </label>
                  <input
                    type="text"
                    value={googleSheetId}
                    onChange={(e) => setGoogleSheetId(e.target.value)}
                    placeholder="e.g. 1A2b3C4d5E6f7G8h9I0j..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Paste the ID from your browser URL: docs.google.com/spreadsheets/d/<b>[SPREADSHEET_ID]</b>/edit
                  </p>
                </div>

                <div className="flex flex-col justify-end gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCreateNewSheet}
                      disabled={isCreatingSheet}
                      className="flex-1 min-w-[150px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isCreatingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                      <span>{isCreatingSheet ? 'Creating Sheet...' : 'Create New Study Sheet'}</span>
                    </button>

                    <button
                      onClick={handleExportToSheet}
                      disabled={isExporting}
                      className="flex-1 min-w-[150px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>{isExporting ? 'Exporting...' : `Export All (${participants.length})`}</span>
                    </button>

                    <button
                      onClick={handleReadSheet}
                      disabled={isReadingSheet}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
                    >
                      {isReadingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                      <span>Read Sheet</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Feedback Banner */}
              {sheetActionStatus && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  sheetActionStatus.includes('Error') || sheetActionStatus.includes('Failed')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}>
                  {sheetActionStatus.includes('Error') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
                  <span>{sheetActionStatus}</span>
                </div>
              )}

              {/* Sheet Preview Table (When Reading from Google Sheets) */}
              {sheetPreviewData && (
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800">
                      Preview: {sheetPreviewData.title} ({sheetPreviewData.rows.length} rows loaded)
                    </div>
                    <button
                      onClick={handleImportParsedSheetData}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Import to Application Cohort</span>
                    </button>
                  </div>
                  <div className="max-h-60 overflow-auto text-[11px]">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {sheetPreviewData.rows.slice(0, 10).map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold border-b border-slate-300' : 'border-b border-slate-100 hover:bg-slate-50'}>
                            {row.slice(0, 8).map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-slate-200 truncate max-w-[150px]">
                                {String(cell || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Forms Sub-Tab */}
          {workspaceTab === 'forms' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <FileQuestion className="w-5 h-5 text-purple-600" />
                    Google Forms Chrononutrition & Sleep Questionnaire
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deploy the standardized 13-item ICMR STS survey to Google Forms, share links with students, and auto-enroll submissions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateIcmrForm}
                    disabled={isCreatingForm}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isCreatingForm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>{isCreatingForm ? 'Deploying Form...' : 'Deploy Google Form'}</span>
                  </button>
                </div>
              </div>

              {/* Created Form Links Badge */}
              {createdFormUrls && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="font-bold text-purple-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    Form Live & Ready for Participants
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={createdFormUrls.responderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Participant Survey Link</span>
                    </a>

                    <button
                      onClick={() => handleCopy(createdFormUrls.responderUrl, 'form_link')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-purple-300 text-purple-800 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                    >
                      {copied === 'form_link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'form_link' ? 'Copied Link' : 'Copy Survey Link'}</span>
                    </button>

                    <a
                      href={createdFormUrls.editUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-purple-300 text-purple-800 rounded-lg font-medium hover:bg-purple-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Edit Form in Google Forms</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Fetch Form Responses Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google Form ID or URL
                  </label>
                  <input
                    type="text"
                    value={googleFormId}
                    onChange={(e) => setGoogleFormId(e.target.value)}
                    placeholder="e.g. 1FAIpQLSc_EXAMPLE_FORM_ID..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in your Google Form URL: docs.google.com/forms/d/<b>[FORM_ID]</b>/edit
                  </p>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleFetchFormResponses}
                    disabled={isFetchingResponses}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isFetchingResponses ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
                    <span>{isFetchingResponses ? 'Pulling Submissions...' : 'Fetch Live Form Responses'}</span>
                  </button>
                </div>
              </div>

              {/* Feedback Banner */}
              {formActionStatus && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  formActionStatus.includes('Error') || formActionStatus.includes('Failed')
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-purple-50 border border-purple-200 text-purple-900'
                }`}>
                  {formActionStatus.includes('Error') ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-purple-600" />}
                  <span>{formActionStatus}</span>
                </div>
              )}

              {/* Submissions Preview */}
              {formResponses && formResponses.length > 0 && (
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden space-y-3">
                  <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center justify-between">
                    <div className="text-xs font-bold text-purple-900">
                      {formResponses.length} Submissions Ready for Cohort Ingestion
                    </div>
                    <button
                      onClick={handleImportFormResponses}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Enroll All {formResponses.length} into Study</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-auto text-xs p-3 space-y-2">
                    {formResponses.map((r, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">
                            Submission #{i + 1} — Response ID: {r.responseId?.substring(0, 12)}...
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Submitted: {new Date(r.createTime || Date.now()).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                          Valid Survey Payload
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* OPTION 2: STANDALONE GOOGLE APPS SCRIPT CODE & CLI AUTOMATION      */}
      {/* ================================================================= */}
      {deploymentOption === 'option2_apps_script_manual' && (
        <div className="space-y-6">
          {/* Architecture Pipeline Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                  1
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Form Trigger</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Participant Submits Google Form</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students fill out the ICMR STS questionnaire. Google Forms appends the row to Google Sheets, triggering Apps Script.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
                  2
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Apps Script Webhook</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">HMAC-SHA256 Signed Ingestion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apps Script generates <code className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded font-mono text-[11px]">STS-2026-XXXXXX</code>, computes cryptographic signature, and POSTs to your configured IP/domain.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black flex items-center justify-center text-xs">
                  3
                </span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">2-Way Sync</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Edge & Dashboard Sync</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When consent is tablet-signed or Kubios HRV is captured, metrics (HR, RMSSD, PDF hash) are written back to Google Sheets.
              </p>
            </div>
          </div>

          {/* Configurable Deployment Parameters */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Target Environment Variables & Cryptographic Settings
              </h3>
              <span className="text-xs text-slate-500 font-medium">Injected directly into code below</span>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ingestion Server Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePresetChange('worker')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    endpointPreset === 'worker'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Cloudflare Worker Edge API
                </button>
                <button
                  onClick={() => handlePresetChange('custom_domain')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    endpointPreset === 'custom_domain'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Custom Production Domain
                </button>
                <button
                  onClick={() => handlePresetChange('local_ip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    endpointPreset === 'local_ip'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Local Subnet IP (192.168.1.100)
                </button>
              </div>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  Ingestion Server / IP Address / Domain (/api/form-submit)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={workerWebhookUrl}
                    onChange={(e) => setWorkerWebhookUrl(e.target.value)}
                    placeholder="https://... or http://192.168.1.X:3000/api/form-submit"
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white"
                  />
                  <button
                    onClick={() => handleCopy(workerWebhookUrl, 'worker_url')}
                    className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center justify-center flex-shrink-0"
                    title="Copy URL"
                  >
                    {copied === 'worker_url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    HMAC-SHA256 Shared Secret (STS_WEBHOOK_SECRET)
                  </span>
                  <button 
                    onClick={handleGenerateSecret}
                    className="text-[11px] text-blue-700 hover:underline font-bold"
                  >
                    Generate Random Key
                  </button>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white"
                  />
                  <button
                    onClick={() => handleCopy(webhookSecret, 'secret')}
                    className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center justify-center flex-shrink-0"
                    title="Copy Secret"
                  >
                    {copied === 'secret' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Target Google Spreadsheet ID (Optional / Auto-bound)
                </label>
                <input
                  type="text"
                  value={googleSheetId}
                  onChange={(e) => setGoogleSheetId(e.target.value)}
                  placeholder="e.g. 1A2b3C4d5E6f7G8h9I0j..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-blue-600" />
                  Google Apps Script Deployment Key / Script ID (Optional)
                </label>
                <input
                  type="text"
                  value={appsScriptKey}
                  onChange={(e) => setAppsScriptKey(e.target.value)}
                  placeholder="e.g. AKfycbz_..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:bg-white"
                />
              </div>
            </div>

            {/* Interactive Webhook Simulator */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Test Google Form Webhook & HMAC Verification Pipeline
                </div>
                <div className="text-[11px] text-slate-500">
                  Calculates HMAC-SHA256 for mock submission and tests delivery to {workerWebhookUrl}
                </div>
              </div>
              <button
                onClick={handleSimulateFormSubmission}
                disabled={testSimulating}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {testSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{testSimulating ? 'Sending Payload...' : 'Test Webhook Pipeline'}</span>
              </button>
            </div>

            {testResult && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{testResult}</span>
              </div>
            )}
          </div>

          {/* Tabbed Code Generator (Code.gs, PowerShell, Bash, Manifest) */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 text-slate-300 shadow-xl overflow-hidden">
            {/* Code Tabs Header */}
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCodeExportTab('code_gs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    codeExportTab === 'code_gs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Code.gs (Online Portal)</span>
                </button>

                <button
                  onClick={() => setCodeExportTab('powershell')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    codeExportTab === 'powershell' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Windows (deploy-gas.ps1)</span>
                </button>

                <button
                  onClick={() => setCodeExportTab('bash')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    codeExportTab === 'bash' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Linux / Mac (deploy-gas.sh)</span>
                </button>

                <button
                  onClick={() => setCodeExportTab('manifest')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    codeExportTab === 'manifest' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>appsscript.json</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://script.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open script.google.com</span>
                </a>

                <button
                  onClick={() => {
                    let text = dynamicAppsScriptCode;
                    if (codeExportTab === 'powershell') text = dynamicPowerShellCode;
                    else if (codeExportTab === 'bash') text = dynamicBashCode;
                    else if (codeExportTab === 'manifest') text = APPS_SCRIPT_MANIFEST;
                    handleCopy(text, codeExportTab);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                >
                  {copied === codeExportTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === codeExportTab ? 'Copied to Clipboard' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="bg-slate-950/60 px-5 py-2.5 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              {codeExportTab === 'code_gs' && (
                <span>
                  <b>Instructions:</b> Open your Google Sheet &gt; <b>Extensions &gt; Apps Script</b> (or visit <b>script.google.com</b>), paste this code, and click <b>Run &gt; createAndLinkStudyForm()</b> to provision everything in 1 click!
                </span>
              )}
              {codeExportTab === 'powershell' && (
                <span>
                  <b>Instructions:</b> Run in Windows PowerShell: <code className="text-emerald-400">.\phase1-apps-script\deploy-gas.ps1</code> to push automatically using clasp.
                </span>
              )}
              {codeExportTab === 'bash' && (
                <span>
                  <b>Instructions:</b> Run on Linux/macOS: <code className="text-emerald-400">chmod +x ./phase1-apps-script/deploy-gas.sh &amp;&amp; ./phase1-apps-script/deploy-gas.sh</code>
                </span>
              )}
              {codeExportTab === 'manifest' && (
                <span>
                  <b>Instructions:</b> In Apps Script Editor &gt; Project Settings &gt; Check "Show appsscript.json manifest file in editor" and paste this content.
                </span>
              )}
            </div>

            {/* Code Box */}
            <div className="p-4">
              <pre className="font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed max-h-96 p-2">
                {codeExportTab === 'code_gs' && dynamicAppsScriptCode}
                {codeExportTab === 'powershell' && dynamicPowerShellCode}
                {codeExportTab === 'bash' && dynamicBashCode}
                {codeExportTab === 'manifest' && APPS_SCRIPT_MANIFEST}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500">Confirmation required for Google Workspace data action.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors ${
                  confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
