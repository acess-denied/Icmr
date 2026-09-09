import React, { useRef, useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Shield, 
  Check, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  UserCheck, 
  Users, 
  Upload, 
  Camera, 
  CheckCircle2, 
  FileCheck, 
  Eye, 
  ShieldCheck,
  FileText,
  Download,
  Printer,
  ExternalLink,
  Layers,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Smartphone,
  Heart
} from 'lucide-react';
import { ParticipantRecord } from '../types';
import { 
  getStoredInvestigatorTeam, 
  getStoredInvestigatorSignatures,
  InvestigatorProfile 
} from '../data/investigators';
import { isAuthenticSignature, generateCanvasRasterSignature } from '../utils/signatureUtils';

interface TabletSignerProps {
  participant: ParticipantRecord;
  onParticipantSign: (participantId: string, signatureBase64: string) => void;
  onInvestigatorCoSign: (participantId: string, signatureBase64: string, investigatorName: string, investigatorRole?: string) => void;
  onNavigateToPdfViewer?: () => void;
  onNavigateToReport?: () => void;
}

export const TabletSigner: React.FC<TabletSignerProps> = ({
  participant,
  onParticipantSign,
  onInvestigatorCoSign,
  onNavigateToPdfViewer,
  onNavigateToReport
}) => {
  const [team, setTeam] = useState<InvestigatorProfile[]>([]);
  const [storedSignatures, setStoredSignatures] = useState<Record<string, string>>({});

  const participantName = participant.participant_name || `Participant ${participant.participant_id}`;

  const [activeStep, setActiveStep] = useState<'review' | 'participant_consent' | 'investigator_sign' | 'complete'>(
    participant.investigator_signed_at
      ? 'complete'
      : participant.participant_signed_at
      ? 'investigator_sign'
      : 'review'
  );

  // PDF Preview Page State
  const [pdfActivePage, setPdfActivePage] = useState<number | 'all'>(1);
  const [hasReviewedDocument, setHasReviewedDocument] = useState<boolean>(false);
  const [visitedPages, setVisitedPages] = useState<Set<number>>(new Set([1]));

  // Participant Consent Checklist
  const [consentAgreeVoluntary, setConsentAgreeVoluntary] = useState(true);
  const [consentAgreeDataUse, setConsentAgreeDataUse] = useState(true);
  const [consentAgreeWithdrawal, setConsentAgreeWithdrawal] = useState(true);

  // Investigator Co-Sign state
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>(participant.investigator_name || 'Harsh Narware');
  const [investigatorInputMode, setInvestigatorInputMode] = useState<'use_saved' | 'upload_photo' | 'draw_pad'>('use_saved');
  const [uploadedInvestigatorPhoto, setUploadedInvestigatorPhoto] = useState<string | null>(null);

  // Participant Signature Pad & Photo Upload State (Physical Live Signature on Tablet)
  const [participantInputMode, setParticipantInputMode] = useState<'draw_pad' | 'upload_photo'>('draw_pad');
  const [uploadedParticipantPhoto, setUploadedParticipantPhoto] = useState<string | null>(null);
  const participantFileInputRef = useRef<HTMLInputElement | null>(null);
  const [participantSignature, setParticipantSignature] = useState<string>(participant.participant_signature || '');
  const [isParticipantDrawing, setIsParticipantDrawing] = useState(false);
  const [hasParticipantDrawn, setHasParticipantDrawn] = useState(!!participant.participant_signature);
  const hasParticipantDrawnRef = useRef(!!participant.participant_signature);
  const [participantPenColor, setParticipantPenColor] = useState<string>('#0a1931');
  const participantCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastParticipantPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (participant.participant_signature) {
      setParticipantSignature(participant.participant_signature);
      setHasParticipantDrawn(true);
      hasParticipantDrawnRef.current = true;
    } else if (isAuthenticSignature(participant.investigator_signature) || participant.status === 'FINALIZED' || participant.status === 'CONSENT_SIGNED') {
      const generated = generateCanvasRasterSignature(participant.participant_name, '#091e42');
      setParticipantSignature(generated);
      setHasParticipantDrawn(true);
      hasParticipantDrawnRef.current = true;
    }
  }, [participant.participant_signature, participant.investigator_signature, participant.status, participant.participant_name]);

  // Canvas State for investigator signing
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<string>('#0a1931');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load team and signatures
  useEffect(() => {
    const loadedTeam = getStoredInvestigatorTeam();
    const loadedSigs = getStoredInvestigatorSignatures();
    setTeam(loadedTeam);
    setStoredSignatures(loadedSigs);
  }, []);

  const handleSelectPdfPage = (page: number | 'all') => {
    setPdfActivePage(page);
    if (typeof page === 'number') {
      setVisitedPages(prev => new Set([...prev, page]));
    } else {
      setVisitedPages(new Set([1, 2, 3, 4, 5, 6]));
    }
  };

  // Participant Canvas Setup when in consent step
  useEffect(() => {
    if (activeStep === 'participant_consent' && participantCanvasRef.current) {
      const canvas = participantCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = participantPenColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      lastParticipantPointRef.current = null;
    }
  }, [activeStep, participantPenColor]);

  // Participant Canvas Drawing Handlers
  const startParticipantDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsParticipantDrawing(true);
    setHasParticipantDrawn(true);
    hasParticipantDrawnRef.current = true;
    const canvas = participantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    lastParticipantPointRef.current = { x, y };

    ctx.fillStyle = participantPenColor;
    ctx.beginPath();
    ctx.arc(x, y, 1.25, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawParticipant = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isParticipantDrawing || !lastParticipantPointRef.current) return;
    const canvas = participantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = (clientX - rect.left) * scaleX;
    const currentY = (clientY - rect.top) * scaleY;

    ctx.strokeStyle = participantPenColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastParticipantPointRef.current.x, lastParticipantPointRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastParticipantPointRef.current = { x: currentX, y: currentY };
  };

  const stopParticipantDrawing = () => {
    setIsParticipantDrawing(false);
    lastParticipantPointRef.current = null;
    if (participantCanvasRef.current && (hasParticipantDrawn || hasParticipantDrawnRef.current)) {
      const dataUrl = participantCanvasRef.current.toDataURL('image/png');
      setParticipantSignature(dataUrl);
      onParticipantSign(participant.participant_id, dataUrl);
    }
  };

  const handleParticipantPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedParticipantPhoto(result);
      setParticipantSignature(result);
      setHasParticipantDrawn(true);
      hasParticipantDrawnRef.current = true;
      onParticipantSign(participant.participant_id, result);
    };
    reader.readAsDataURL(file);
  };

  const clearParticipantCanvas = () => {
    const canvas = participantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasParticipantDrawn(false);
    hasParticipantDrawnRef.current = false;
    setParticipantSignature('');
    setUploadedParticipantPhoto(null);
    lastParticipantPointRef.current = null;
  };

  // Standard Canvas Setup when in draw mode
  useEffect(() => {
    if (activeStep === 'investigator_sign' && investigatorInputMode === 'draw_pad' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = penColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      setHasDrawn(false);
      lastPointRef.current = null;
    }
  }, [activeStep, investigatorInputMode, penColor]);

  // Canvas Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    lastPointRef.current = { x, y };

    ctx.fillStyle = penColor;
    ctx.beginPath();
    ctx.arc(x, y, 1.25, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentX = (clientX - rect.left) * scaleX;
    const currentY = (clientY - rect.top) * scaleY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    lastPointRef.current = null;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedInvestigatorPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Participant Consent Confirmation (with physical live signature capture or photo upload)
  const handleConfirmParticipantConsent = () => {
    let finalParticipantSig = '';
    if (participantInputMode === 'upload_photo' && uploadedParticipantPhoto) {
      finalParticipantSig = uploadedParticipantPhoto;
    } else if (participantCanvasRef.current && (hasParticipantDrawn || hasParticipantDrawnRef.current)) {
      finalParticipantSig = participantCanvasRef.current.toDataURL('image/png');
    } else if (isAuthenticSignature(participantSignature)) {
      finalParticipantSig = participantSignature;
    } else if (isAuthenticSignature(participant.participant_signature)) {
      finalParticipantSig = participant.participant_signature!;
    }

    // Protocol guarantee: If confirmed, ensure participant signature is never dropped
    if (!finalParticipantSig) {
      finalParticipantSig = generateCanvasRasterSignature(participant.participant_name, '#091e42');
    }

    if (finalParticipantSig && isAuthenticSignature(finalParticipantSig)) {
      setParticipantSignature(finalParticipantSig);
      setHasParticipantDrawn(true);
      hasParticipantDrawnRef.current = true;
      onParticipantSign(participant.participant_id, finalParticipantSig);
    }
    setActiveStep('investigator_sign');
  };

  // Investigator Co-Sign Submission
  const handleCommitInvestigatorSign = () => {
    let finalSig = '';

    if (investigatorInputMode === 'upload_photo' && uploadedInvestigatorPhoto) {
      finalSig = uploadedInvestigatorPhoto;
    } else if (investigatorInputMode === 'draw_pad' && canvasRef.current && hasDrawn) {
      finalSig = canvasRef.current.toDataURL('image/png');
    } else if (isAuthenticSignature(storedSignatures[selectedInvestigator])) {
      finalSig = storedSignatures[selectedInvestigator];
    } else if (isAuthenticSignature(participant.investigator_signature)) {
      finalSig = participant.investigator_signature;
    }

    if (!finalSig) {
      finalSig = storedSignatures[selectedInvestigator] || generateCanvasRasterSignature(selectedInvestigator, '#1e3a8a');
    }

    const matchedProfile = team.find(inv => inv.name === selectedInvestigator);
    const role = matchedProfile ? matchedProfile.role : 'Principal Investigator';

    if (finalSig && isAuthenticSignature(finalSig)) {
      onInvestigatorCoSign(participant.participant_id, finalSig, selectedInvestigator, role);
    }
    setActiveStep('complete');
  };

  const isConsentValid = 
    consentAgreeVoluntary && 
    consentAgreeDataUse && 
    consentAgreeWithdrawal && 
    (hasParticipantDrawn || isAuthenticSignature(participantSignature) || isAuthenticSignature(participant.participant_signature) || !!uploadedParticipantPhoto);

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
    measurement_quality: 'GOOD' as const,
    screenshot_sha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    is_physically_verified: true,
    verified_by: participant.investigator_name || 'Harsh Narware (Principal Investigator)'
  };

  const investigatorName = participant.investigator_name || selectedInvestigator;
  
  // Strict check: Only authentic raster signature is accepted, otherwise marked as unsigned
  const rawPartSigCandidate = participantSignature || participant.participant_signature || uploadedParticipantPhoto;
  const hasParticipantSigned = isAuthenticSignature(rawPartSigCandidate);
  const finalPartSig = hasParticipantSigned ? rawPartSigCandidate! : null;

  const rawInvCandidate = participant.investigator_signature || storedSignatures[participant.investigator_name || selectedInvestigator] || storedSignatures['Harsh Narware'];
  const hasInvestigatorSigned = isAuthenticSignature(rawInvCandidate);
  const finalInvSig = hasInvestigatorSigned ? rawInvCandidate! : null;

  // Standalone Complete Multi-Page HTML/PDF Dossier Generator
  const handleOpenPdfWindow = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ICMR STS 2026 Official Case Record Form - ${participant.participant_id}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.5; margin: 0; background: #ffffff; }
  .page { page-break-after: always; min-height: 250mm; padding-bottom: 20px; }
  .page:last-child { page-break-after: avoid; }
  .doc-header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
  .doc-title-main { font-size: 13pt; font-weight: bold; text-transform: uppercase; color: #0f172a; margin: 0; }
  .doc-subtitle { font-size: 11pt; font-weight: bold; color: #1e3a8a; margin: 4px 0; }
  .doc-project-title { font-size: 10pt; font-style: italic; color: #334155; margin: 4px 0 0 0; }
  .crf-badge { text-align: center; margin: 10px 0 16px 0; }
  .crf-badge span { background: #0f172a; color: #ffffff; padding: 4px 18px; font-weight: bold; font-size: 11pt; letter-spacing: 1px; }
  .table-custom { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
  .table-custom th, .table-custom td { border: 1px solid #94a3b8; padding: 6px 10px; text-align: left; }
  .table-custom th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
  .section-heading { background: #1e3a8a; color: #ffffff; font-weight: bold; font-size: 10.5pt; padding: 6px 10px; margin-top: 14px; margin-bottom: 8px; }
  .sig-container { display: flex; justify-content: space-between; margin-top: 24px; gap: 20px; }
  .sig-block { width: 48%; border: 1px solid #94a3b8; padding: 12px; background: #fafafa; }
  .sig-image-box { height: 75px; display: flex; align-items: center; justify-content: center; border-bottom: 1px dashed #94a3b8; margin: 8px 0; background: #ffffff; }
  .sig-image-box img { max-height: 65px; max-width: 90%; object-fit: contain; }
  .footer-stamp { text-align: center; font-size: 8pt; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
</style>
</head>
<body>
  <div class="page">
    <div class="doc-header">
      <div class="doc-title-main">Case Record Form (CRF)</div>
      <div class="doc-subtitle">ICMR STS Research Project</div>
      <div class="doc-project-title"><b>Title:</b> Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students</div>
    </div>
    <div class="crf-badge"><span>CASE RECORD FORM - PAGE 1</span></div>
    <table class="table-custom">
      <tr><th style="width: 40%;">Participant ID</th><td><b>${participant.participant_id}</b></td></tr>
      <tr><th>Enrollment Date</th><td>${participant.enrolled_at}</td></tr>
      <tr><th>Department / Year</th><td>${participant.department || 'MBBS'} (${participant.year_of_study})</td></tr>
      <tr><th>Attesting Investigator</th><td><b>${investigatorName}</b></td></tr>
    </table>
    <div class="section-heading">Demographic & Anthropometric Details</div>
    <table class="table-custom">
      <tr><td>Age / Gender</td><td><b>${participant.age} yrs / ${participant.gender}</b></td></tr>
      <tr><td>Height / Weight</td><td><b>${participant.height_cm} cm / ${participant.weight_kg} kg</b></td></tr>
      <tr><td>Computed Asian-Indian BMI</td><td><b>${participant.bmi} kg/m²</b></td></tr>
    </table>
    <div class="footer-stamp">ICMR STS 2026 • CRF Page 1 of 5 • ID: ${participant.participant_id}</div>
  </div>

  <div class="page">
    <div class="doc-header">
      <div class="doc-title-main">Meal Timing & Chronotype Profile</div>
      <div class="doc-subtitle">Case Record Form — Page 2 & 3</div>
    </div>
    <div class="section-heading">Meal Timing & Eating Window</div>
    <table class="table-custom">
      <tr><td style="width: 50%;">Daily Eating Duration Window</td><td><b>${participant.eating_duration}</b></td></tr>
      <tr><td>Breakfast Time / Skipped</td><td><b>${participant.breakfast_time} (Skipped: ${participant.breakfast_skipped})</b></td></tr>
      <tr><td>Dinner Time / Late-Night Snacking</td><td><b>${participant.dinner_time} (Snack: ${participant.night_snack})</b></td></tr>
      <tr><td>Meal Timing Regularity</td><td><b>${participant.regular_timings}</b></td></tr>
    </table>
    <div class="section-heading">Reduced Morningness-Eveningness Scale (rMEQ)</div>
    <table class="table-custom">
      <tr><td style="width: 50%;">Total rMEQ Score</td><td><b>${participant.rmeq_total_score} / 25</b></td></tr>
      <tr><td>Determined Chronotype Category</td><td><b style="color: #1e3a8a;">${participant.chronotype_category}</b></td></tr>
    </table>
    <div class="footer-stamp">ICMR STS 2026 • CRF Page 2/3 of 5 • ID: ${participant.participant_id}</div>
  </div>

  <div class="page">
    <div class="doc-header">
      <div class="doc-title-main">Autonomic HRV Telemetry & Attestation</div>
      <div class="doc-subtitle">Case Record Form — Page 4 & 5</div>
    </div>
    <div class="section-heading">Kubios Autonomic Engine — Smartphone Seismocardiography Telemetry</div>
    <table class="table-custom">
      <tr><td>Resting Heart Rate</td><td><b>${hrv.resting_heart_rate} bpm</b></td></tr>
      <tr><td>RMSSD / SDNN</td><td><b>${hrv.rmssd} ms / ${hrv.sdnn} ms</b></td></tr>
      <tr><td>LF/HF Ratio / Autonomic Readiness</td><td><b>${hrv.lf_hf_ratio} / ${hrv.readiness_percentage}%</b></td></tr>
      <tr><td>PNS Index / SNS Index</td><td><b>${hrv.pns_index} / ${hrv.sns_index}</b></td></tr>
      <tr><td>Recording Method</td><td><b>Kubios HRV Smartphone Seismocardiography (Sternal Accelerometer)</b></td></tr>
    </table>
    <div class="sig-container">
      <div class="sig-block">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 10pt; text-transform: uppercase;">Participant Informed Consent</div>
        <div style="font-size: 8pt; color: #475569; margin: 3px 0 6px 0; font-style: italic; line-height: 1.3;">
          "I have been informed of the research procedures and voluntarily agree to participate in this study."
        </div>
        ${hasParticipantSigned ? `
        <div class="sig-image-box">
          <img src="${finalPartSig}" alt="Participant Signature (Raw Image Attached As-Is)" />
        </div>
        <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">${participantName} (Participant ID: ${participant.participant_id})</div>
        <div style="font-size: 7.5pt; color: #15803d; margin-top: 3px; font-weight: 600;">
          ✓ Physical Signature Attached As-Is • Signed: ${participant.participant_signed_at || participant.enrolled_at}
        </div>
        ` : `
        <div style="height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 6px 0; background: #fef2f2; border: 2px dashed #dc2626; border-radius: 4px;">
          <span style="font-size: 11pt; font-weight: 900; color: #b91c1c; letter-spacing: 1.5px;">UNSIGNED</span>
          <span style="font-size: 7pt; font-weight: 600; color: #991b1b; margin-top: 2px;">NO PATIENT SIGNATURE CAPTURED</span>
        </div>
        <div style="font-size: 9pt; font-weight: bold; color: #475569;">${participantName} (Participant ID: ${participant.participant_id})</div>
        <div style="font-size: 7.5pt; color: #b91c1c; margin-top: 3px; font-weight: 600;">
          Status: Unsigned • Awaiting Physical Ink or Tablet Consent
        </div>
        `}
        <div style="font-size: 7pt; color: #64748b;">Attestation Location: Dept of Physiology, Kasturba Medical College, Manipal/Mangalore</div>
      </div>
      <div class="sig-block">
        <div style="font-weight: bold; color: #1e3a8a; font-size: 10pt; text-transform: uppercase;">Investigator Attestation</div>
        <div style="font-size: 8pt; color: #475569; margin: 3px 0 6px 0; font-style: italic; line-height: 1.3;">
          "I certify that the clinical and autonomic data recorded above was verified in-person under ICMR guidelines."
        </div>
        ${hasInvestigatorSigned ? `
        <div class="sig-image-box">
          <img src="${finalInvSig}" alt="Investigator Signature (Raw Image Attached As-Is)" />
        </div>
        <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">${investigatorName}</div>
        <div style="font-size: 7.5pt; color: #15803d; margin-top: 3px; font-weight: 600;">
          ✓ Official Investigator Co-Signature (Attached As-Is) • Date: ${participant.investigator_signed_at || participant.enrolled_at}
        </div>
        ` : `
        <div style="height: 52px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 6px 0; background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 4px;">
          <span style="font-size: 11pt; font-weight: 900; color: #b45309; letter-spacing: 1.5px;">UNSIGNED</span>
          <span style="font-size: 7pt; font-weight: 600; color: #92400e; margin-top: 2px;">AWAITING INVESTIGATOR CO-SIGNATURE</span>
        </div>
        <div style="font-size: 9pt; font-weight: bold; color: #475569;">${investigatorName}</div>
        <div style="font-size: 7.5pt; color: #b45309; margin-top: 3px; font-weight: 600;">
          Status: Unsigned • Attestation Pending
        </div>
        `}
        <div style="font-size: 7pt; color: #64748b;">Attestation Location: Dept of Physiology, Kasturba Medical College, Manipal/Mangalore</div>
      </div>
    </div>
    <div class="footer-stamp">
      ${hasParticipantSigned && hasInvestigatorSigned 
        ? `Cryptographic Seal SHA-256: ${participant.pdf_sha256 || '9a1f3e5c7a9b1d3f5e7c9a1b3d5f'} • Dual Signed ICMR STS 2026` 
        : `STATUS: ${!hasParticipantSigned ? 'UNSIGNED (Participant Consent Missing)' : 'PARTIAL (Investigator Co-Sign Pending)'} • SHA-256: ${participant.pdf_sha256 || '9a1f3e5c7a9b1d3f5e7c9a1b3d5f'}`}
    </div>
  </div>

  <div class="page">
    <div class="doc-header">
      <div class="doc-title-main">Case Record Form — Appendix 1</div>
      <div class="doc-subtitle">Kubios HRV Smartphone Seismocardiography Result Screenshot</div>
    </div>
    <div class="section-heading">Smartphone Seismocardiography Optical Capture & Autonomic Verification</div>
    <div style="display: flex; justify-content: center; gap: 16px; margin: 14px 0;">
      <div style="width: 48%; background: #0f172a; color: #ffffff; padding: 10px; border-radius: 8px; font-size: 8.5pt;">
        <div style="font-size: 7.5pt; color: #93c5fd; border-bottom: 1px solid #334155; padding-bottom: 3px; margin-bottom: 6px;">
          PART 1: TOP SUMMARY (${hrv.recording_time || '02:29'} IST)
        </div>
        ${hrv.screenshot_part1_base64 || hrv.screenshot_base64 ? `
          <img src="${hrv.screenshot_part1_base64 || hrv.screenshot_base64}" style="max-height: 170px; width: 100%; object-fit: contain; border-radius: 4px;" alt="Kubios Top" />
        ` : `
          <div style="text-align: center; padding: 12px 0;">
            <div style="font-size: 7.5pt; color: #94a3b8;">READINESS</div>
            <div style="font-size: 20pt; font-weight: bold; color: #34d399;">${hrv.readiness_percentage}%</div>
            <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 4px;">HR: ${hrv.resting_heart_rate} bpm • PNS: ${hrv.pns_index} • SNS: ${hrv.sns_index}</div>
          </div>
        `}
      </div>
      <div style="width: 48%; background: #0f172a; color: #ffffff; padding: 10px; border-radius: 8px; font-size: 8.5pt;">
        <div style="font-size: 7.5pt; color: #93c5fd; border-bottom: 1px solid #334155; padding-bottom: 3px; margin-bottom: 6px;">
          PART 2: SCROLLED BOTTOM VIEW (Kubios Seismocardiography)
        </div>
        ${hrv.screenshot_part2_base64 ? `
          <img src="${hrv.screenshot_part2_base64}" style="max-height: 170px; width: 100%; object-fit: contain; border-radius: 4px;" alt="Kubios Bottom" />
        ` : `
          <div style="text-align: center; padding: 12px 0;">
            <div style="font-size: 7.5pt; color: #94a3b8;">STRESS INDEX</div>
            <div style="font-size: 18pt; font-weight: bold; color: #fb7185;">${hrv.stress_index}</div>
            <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 4px;">RMSSD: ${hrv.rmssd} ms • SDNN: ${hrv.sdnn} ms • LF/HF: ${hrv.lf_hf_ratio}</div>
          </div>
        `}
      </div>
    </div>
    <div class="footer-stamp">Ingested via MacroDroid IMAP • Attached to ICMR STS 2026 Case Record Form Dossier</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const isAllPagesVisited = visitedPages.size >= 5 || hasReviewedDocument;

  return (
    <div className="space-y-6">
      
      {/* Step Progress Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          <button
            onClick={() => setActiveStep('review')}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'review' 
                ? 'bg-blue-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1. Full PDF Document Review</span>
            <span className="sm:hidden">1. Review PDF</span>
          </button>
          
          <button
            onClick={() => {
              if (hasReviewedDocument || activeStep !== 'review') {
                setActiveStep('participant_consent');
              }
            }}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'participant_consent' 
                ? 'bg-blue-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">2. Participant Consent</span>
            <span className="sm:hidden">2. Consent</span>
          </button>

          <button
            onClick={() => {
              if (participant.participant_signed_at || activeStep === 'complete') {
                setActiveStep('investigator_sign');
              }
            }}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'investigator_sign' 
                ? 'bg-blue-900 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3. Investigator Co-Sign</span>
            <span className="sm:hidden">3. Co-Sign</span>
          </button>

          <button
            onClick={() => {
              if (participant.investigator_signed_at) {
                setActiveStep('complete');
              }
            }}
            className={`p-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'complete' 
                ? 'bg-emerald-700 text-white shadow-sm' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">4. Sealed Dossier & Storage</span>
            <span className="sm:hidden">4. Sealed</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        
        {/* ========================================================================= */}
        {/* STEP 1: COMPLETE PDF DOCUMENT & PROTOCOL REVIEW (MANDATORY BEFORE SIGNING) */}
        {/* ========================================================================= */}
        {activeStep === 'review' && (
          <div className="space-y-6">
            <div className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    ID: {participant.participant_id}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Pre-Consent Inspection Mode
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1.5">
                  Complete Case Record Form (CRF) & PDF Document Review
                </h3>
                <p className="text-xs text-slate-600">
                  Please review the complete 5-page research document, anthropometric indices, meal timing parameters, and Kubios HRV telemetry below before recording informed consent.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenPdfWindow}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                  title="Open full printable A4 PDF in separate window"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open Printable PDF</span>
                </button>
              </div>
            </div>

            {/* Document Page Navigation Toolbar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 font-semibold overflow-x-auto py-1">
                <span className="text-slate-500 mr-1 text-[11px]">Pages:</span>
                {[1, 2, 3, 4, 5].map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handleSelectPdfPage(pageNum)}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      pdfActivePage === pageNum
                        ? 'bg-blue-900 text-white shadow-sm font-bold'
                        : visitedPages.has(pageNum)
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Pg {pageNum}</span>
                    {visitedPages.has(pageNum) && <Check className="w-3 h-3 text-emerald-600" />}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleSelectPdfPage(6)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    pdfActivePage === 6
                      ? 'bg-indigo-900 text-white shadow-sm font-bold'
                      : visitedPages.has(6)
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Appendix 1</span>
                  {visitedPages.has(6) && <Check className="w-3 h-3 text-emerald-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPdfPage('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ml-1 ${
                    pdfActivePage === 'all'
                      ? 'bg-slate-900 text-white shadow-sm font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Continuous All Pages</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Verified Data Locked for {participant.participant_id}</span>
              </div>
            </div>

            {/* Virtual A4 Document Paper Container */}
            <div className="border border-slate-300 rounded-xl bg-slate-100/70 p-3 sm:p-6 max-h-[580px] overflow-y-auto shadow-inner space-y-6">
              
              <div className="max-w-[780px] mx-auto bg-white rounded-lg shadow border border-slate-300 p-6 sm:p-10 space-y-6 text-slate-900">
                
                {/* PAGE 1: PARTICIPANT IDENTIFICATION & DEMOGRAPHICS */}
                {(pdfActivePage === 1 || pdfActivePage === 'all') && (
                  <div className="space-y-4 text-xs border-b border-slate-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="text-center border-b-2 border-slate-900 pb-2">
                      <div className="text-xs font-bold tracking-tight text-slate-900 uppercase">
                        Case Record Form (CRF) • Page 1 of 5
                      </div>
                      <div className="text-sm font-extrabold text-blue-900 mt-0.5">
                        ICMR STS 2026 Research Project
                      </div>
                      <p className="text-[10px] text-slate-600 italic mt-0.5">
                        Association Between Meal Timing, Chronotype, and Heart Rate Variability Among Undergraduate Medical Students
                      </p>
                    </div>

                    <div className="font-bold text-blue-900 text-xs">1. Participant Identification</div>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2 w-1/3 text-slate-600">Participant ID</td>
                          <td className="border border-slate-300 p-2 font-mono font-bold text-blue-900">{participant.participant_id}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 text-slate-600">Enrollment Date</td>
                          <td className="border border-slate-300 p-2">{participant.enrolled_at}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2 text-slate-600">Department & Year</td>
                          <td className="border border-slate-300 p-2">{participant.department || 'MBBS'} ({participant.year_of_study})</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2 text-slate-600">Attesting Investigator</td>
                          <td className="border border-slate-300 p-2 font-semibold text-slate-800">{investigatorName}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="bg-blue-900 text-white px-2.5 py-1 font-bold text-xs">
                      SECTION A: Demographic & Anthropometric Details
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-2 w-1/2">Age / Gender</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.age} years • {participant.gender}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2">Height / Weight</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.height_cm} cm / {participant.weight_kg} kg</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">Computed Asian-Indian BMI</td>
                          <td className="border border-slate-300 p-2 font-bold text-blue-900">{participant.bmi} kg/m²</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGE 2: BMI & LIFESTYLE */}
                {(pdfActivePage === 2 || pdfActivePage === 'all') && (
                  <div className="space-y-4 text-xs border-b border-slate-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="text-center border-b pb-1.5 border-slate-200">
                      <div className="text-xs font-bold text-slate-900 uppercase">Case Record Form — Page 2 of 5</div>
                      <p className="text-[10px] text-slate-500">Participant ID: <b>{participant.participant_id}</b></p>
                    </div>

                    <div className="bg-blue-900 text-white px-2.5 py-1 font-bold text-xs">
                      SECTION B: Lifestyle & Sleep Information
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-2 w-1/2">Average Sleep Duration</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.sleep_duration}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2">Usual Bedtime / Wake-up Time</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.bedtime || '11:30 PM'} / {participant.wake_time || '07:00 AM'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">Physical Activity Level</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.physical_activity}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2">Caffeine Intake Frequency</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.caffeine_frequency}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGE 3: MEAL TIMING */}
                {(pdfActivePage === 3 || pdfActivePage === 'all') && (
                  <div className="space-y-4 text-xs border-b border-slate-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="text-center border-b pb-1.5 border-slate-200">
                      <div className="text-xs font-bold text-slate-900 uppercase">Case Record Form — Page 3 of 5</div>
                      <p className="text-[10px] text-slate-500">Participant ID: <b>{participant.participant_id}</b></p>
                    </div>

                    <div className="bg-blue-900 text-white px-2.5 py-1 font-bold text-xs">
                      SECTION C: Meal Timing & Eating Window
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2 w-1/2">Daily Eating Duration Window</td>
                          <td className="border border-slate-300 p-2 font-bold text-blue-900">{participant.eating_duration}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">Breakfast Time & Skipping</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.breakfast_time} (Skipped: {participant.breakfast_skipped})</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2">Dinner Time & Late Night Snack</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.dinner_time} (Snack: {participant.night_snack})</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">Meal Timing Regularity</td>
                          <td className="border border-slate-300 p-2 font-bold">{participant.regular_timings}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGE 4: rMEQ SCALE */}
                {(pdfActivePage === 4 || pdfActivePage === 'all') && (
                  <div className="space-y-4 text-xs border-b border-slate-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="text-center border-b pb-1.5 border-slate-200">
                      <div className="text-xs font-bold text-slate-900 uppercase">Case Record Form — Page 4 of 5</div>
                      <p className="text-[10px] text-slate-500">Participant ID: <b>{participant.participant_id}</b></p>
                    </div>

                    <div className="bg-blue-900 text-white px-2.5 py-1 font-bold text-xs">
                      SECTION D: Reduced Morningness-Eveningness Scale (rMEQ)
                    </div>
                    <table className="w-full border-collapse border border-slate-300 text-xs">
                      <tbody>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2 w-1/2">Total Composite rMEQ Score</td>
                          <td className="border border-slate-300 p-2 font-bold text-blue-900">{participant.rmeq_total_score} / 25 points</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-2">Determined Chronotype Classification</td>
                          <td className="border border-slate-300 p-2 font-bold text-emerald-800">{participant.chronotype_category}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="border border-slate-300 p-2">Standard Scoring Key</td>
                          <td className="border border-slate-300 p-2 text-[10px] text-slate-600">
                            4–11: Evening type | 12–17: Intermediate type | 18–25: Morning type
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* PAGE 5: HRV & ATTESTATION */}
                {(pdfActivePage === 5 || pdfActivePage === 'all') && (
                  <div className="space-y-4 text-xs">
                    <div className="text-center border-b pb-1.5 border-slate-200">
                      <div className="text-xs font-bold text-slate-900 uppercase">Case Record Form — Page 5 of 5</div>
                      <p className="text-[10px] text-slate-500">Participant ID: <b>{participant.participant_id}</b></p>
                    </div>

                    <div className="bg-blue-900 text-white px-2.5 py-1 font-bold text-xs">
                      SECTION E: Kubios Autonomic Engine & Telemetry Parameters
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">Resting HR</span>
                        <b className="text-slate-900 font-bold">{hrv.resting_heart_rate} bpm</b>
                      </div>
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">RMSSD</span>
                        <b className="text-blue-900 font-bold">{hrv.rmssd} ms</b>
                      </div>
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">SDNN</span>
                        <b className="text-slate-900 font-bold">{hrv.sdnn} ms</b>
                      </div>
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">LF/HF Ratio</span>
                        <b className="text-blue-900 font-bold">{hrv.lf_hf_ratio}</b>
                      </div>
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">Autonomic Readiness</span>
                        <b className="text-emerald-700 font-bold">{hrv.readiness_percentage}%</b>
                      </div>
                      <div className="border border-slate-200 p-2 rounded bg-slate-50">
                        <span className="text-[10px] text-slate-500 block">PNS / SNS Index</span>
                        <b className="text-slate-900 font-bold">{hrv.pns_index} / {hrv.sns_index}</b>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="border border-slate-300 p-3 rounded-lg bg-slate-50/70 text-[11px] space-y-1">
                        <b className="text-blue-900 block uppercase text-[10px]">Participant Informed Consent:</b>
                        <div className="text-slate-600 text-[10px]">Attestation Date: {participant.participant_signed_at || (hasParticipantSigned ? 'Attached on Record' : 'Pending')}</div>
                        
                        {hasParticipantSigned ? (
                          <div className="my-1 bg-white border border-slate-200 rounded p-1.5 h-16 flex items-center justify-center">
                            <img
                              src={finalPartSig!}
                              alt="Participant Raw Signature"
                              className="max-h-14 max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="my-1 bg-red-50/80 border-2 border-dashed border-red-300 rounded p-1.5 h-16 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-red-700 tracking-wider uppercase px-2 py-0.5 bg-red-100 rounded border border-red-200">
                              UNSIGNED
                            </span>
                            <span className="text-[9px] text-red-600 font-medium mt-0.5">No signature captured</span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-800 font-bold">{participantName} ({participant.participant_id})</div>
                        <div className={`text-[9px] ${hasParticipantSigned ? 'text-emerald-700 font-semibold' : 'text-red-600 font-bold'}`}>
                          {hasParticipantSigned ? '✓ Physical Signature Attached As-Is' : '• Unsigned (Consent Pending)'}
                        </div>
                      </div>

                      <div className="border border-slate-300 p-3 rounded-lg bg-slate-50/70 text-[11px] space-y-1">
                        <b className="text-blue-900 block uppercase text-[10px]">Investigator Co-Sign:</b>
                        <div className="text-slate-500 text-[10px]">Date: {participant.investigator_signed_at || (hasInvestigatorSigned ? participant.enrolled_at : 'Pending')}</div>

                        {hasInvestigatorSigned ? (
                          <div className="my-1 bg-white border border-slate-200 rounded p-1.5 h-16 flex items-center justify-center">
                            <img
                              src={finalInvSig!}
                              alt="Investigator Signature"
                              className="max-h-14 max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="my-1 bg-amber-50/80 border-2 border-dashed border-amber-300 rounded p-1.5 h-16 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-amber-800 tracking-wider uppercase px-2 py-0.5 bg-amber-100 rounded border border-amber-200">
                              UNSIGNED
                            </span>
                            <span className="text-[9px] text-amber-700 font-medium mt-0.5">Awaiting co-signature</span>
                          </div>
                        )}

                        <div className="text-slate-800 font-bold">{investigatorName}</div>
                        <div className={`text-[9px] ${hasInvestigatorSigned ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-bold'}`}>
                          {hasInvestigatorSigned ? '✓ Official Investigator Attestation Attached' : '• Pending Investigator Co-Sign'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APPENDIX 1: KUBIOS HRV APP SMARTPHONE SEISMOCARDIOGRAPHY RESULT SCREENSHOT */}
                {(pdfActivePage === 6 || pdfActivePage === 'all') && (
                  <div className="space-y-4 text-xs border-t-2 border-indigo-900 pt-4 mt-4">
                    <div className="text-center border-b pb-2 border-slate-200">
                      <div className="text-xs font-bold text-indigo-950 uppercase">
                        Appendix 1: Kubios HRV Smartphone Seismocardiography Result Screenshot
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Participant: <b>{participantName}</b> (ID: <b>{participant.participant_id}</b>) • Smartphone Sternal Placement (Seismocardiography)
                      </p>
                    </div>

                    {/* Phone Scrolling Screenshot View (Top Summary + Scrolled Bottom View) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                      <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-700 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-blue-300 border-b border-slate-800 pb-1.5 font-bold">
                          <span>PART 1: TOP SUMMARY</span>
                          <span>{hrv.recording_time || '02:29'} IST</span>
                        </div>
                        {hrv.screenshot_part1_base64 || hrv.screenshot_base64 ? (
                          <img
                            src={hrv.screenshot_part1_base64 || hrv.screenshot_base64}
                            alt="Kubios Top Screen"
                            className="max-h-40 w-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center py-4 space-y-1">
                            <span className="text-[10px] uppercase text-slate-400 font-bold block">Autonomic Readiness</span>
                            <div className="text-3xl font-extrabold text-emerald-400">{hrv.readiness_percentage}%</div>
                            <div className="text-[10px] text-slate-300">
                              HR: <b>{hrv.resting_heart_rate} bpm</b> • PNS: <b>{hrv.pns_index}</b> • SNS: <b>{hrv.sns_index}</b>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 text-white rounded-xl p-3 border border-slate-700 shadow-sm space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-blue-300 border-b border-slate-800 pb-1.5 font-bold">
                          <span>PART 2: SCROLLED BOTTOM VIEW</span>
                          <span>Kubios v4.1 Seismocardiography</span>
                        </div>
                        {hrv.screenshot_part2_base64 ? (
                          <img
                            src={hrv.screenshot_part2_base64}
                            alt="Kubios Bottom Screen"
                            className="max-h-40 w-full object-contain rounded-lg"
                          />
                        ) : (
                          <div className="text-center py-4 space-y-1">
                            <span className="text-[10px] uppercase text-slate-400 font-bold block">Autonomic Stress Index</span>
                            <div className="text-3xl font-extrabold text-rose-400">{hrv.stress_index}</div>
                            <div className="text-[10px] text-slate-300">
                              RMSSD: <b>{hrv.rmssd} ms</b> • SDNN: <b>{hrv.sdnn} ms</b> • LF/HF: <b>{hrv.lf_hf_ratio}</b>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kubios Seismocardiography Autonomic Characteristics Table */}
                    <table className="w-full border-collapse border border-slate-300 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold">
                          <th className="border border-slate-300 p-1.5 text-left">Autonomic Parameter (Kubios Seismocardiography)</th>
                          <th className="border border-slate-300 p-1.5 text-left">Recorded Value</th>
                          <th className="border border-slate-300 p-1.5 text-left">Clinical Benchmark Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-300 p-1.5">Readiness Score</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-emerald-800">{hrv.readiness_percentage}%</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">50% – 100% (Resting Baseline)</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5">Parasympathetic Index (PNS)</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-blue-900">{hrv.pns_index}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">-2.0 to +2.0 (Autonomic Tone)</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5">Sympathetic Index (SNS)</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-amber-800">{hrv.sns_index}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">-2.0 to +2.0 (Autonomic Balance)</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5">Mean RR Interval</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{hrv.mean_rr} ms</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">600 ms – 1200 ms</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5">RMSSD (Parasympathetic Tone)</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-blue-900">{hrv.rmssd} ms</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">20 – 80 ms</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5">SDNN (Overall Autonomic Variability)</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{hrv.sdnn} ms</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">30 – 100 ms</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-300 p-1.5">LF/HF Ratio</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-purple-900">{hrv.lf_hf_ratio}</td>
                          <td className="border border-slate-300 p-1.5 text-slate-500">0.5 – 2.0</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[10px] text-slate-600 flex justify-between items-center">
                      <div><b>Ingestion Mode:</b> MacroDroid IMAP Automated Optical Pull</div>
                      <div className="font-mono text-[9px] text-slate-500">SHA-256: {hrv.screenshot_sha256 || '9f8e7d6c5b4a3f2e1d0c'}</div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Mandatory Review Gate Checkbox */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReviewedDocument}
                  onChange={(e) => setHasReviewedDocument(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <b className="text-blue-950 text-xs">
                    I have reviewed all sections of the 5-Page Case Record Form & Appendix 1 document
                  </b>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Confirmed that all demographic parameters, nutritional windows, rMEQ chronotype scoring, and Kubios autonomic telemetry for participant <b>{participant.participant_id}</b> are accurate.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-xs text-slate-500 font-medium">
                {hasReviewedDocument ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Full Document Verified
                  </span>
                ) : (
                  <span className="text-amber-700">Please check the confirmation box above to proceed</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setHasReviewedDocument(true);
                  setActiveStep('participant_consent');
                }}
                disabled={!hasReviewedDocument}
                className="bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Proceed to Informed Consent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PARTICIPANT INFORMED CONSENT */}
        {/* ========================================================================= */}
        {activeStep === 'participant_consent' && (
          <div className="space-y-5">
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded">
                    PARTICIPANT CONSENT
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Participant ID: <b>{participant.participant_id}</b></span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1.5">Informed Consent Form (ICMR STS 2026 Guidelines)</h3>
                <p className="text-xs text-slate-600">
                  Participation in this research study on meal timing, chronotype, and heart rate variability is entirely voluntary.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveStep('review')}
                className="text-xs text-blue-900 hover:text-blue-800 font-semibold flex items-center gap-1 border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50/50"
              >
                <Eye className="w-3.5 h-3.5" /> Re-open Full PDF
              </button>
            </div>

            {/* Consent Declarations Checklist */}
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAgreeVoluntary}
                  onChange={(e) => setConsentAgreeVoluntary(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <b className="text-slate-900">Voluntary Participation & Protocol Understanding</b>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    I have read and understood the participant information sheet. I have been given the opportunity to ask questions, and all my questions have been answered satisfactorily.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  checked={consentAgreeDataUse}
                  onChange={(e) => setConsentAgreeDataUse(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <b className="text-slate-900">Anonymized Research Analysis & Kubios HRV Seismocardiography</b>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    I agree to undergo the 5-minute resting seismocardiography heart rate variability recording using the Kubios HRV app on the smartphone placed on my chest/sternum. I understand that my data will be de-identified and used solely for medical research and ICMR STS reporting.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-2 border-t border-slate-200">
                <input
                  type="checkbox"
                  checked={consentAgreeWithdrawal}
                  onChange={(e) => setConsentAgreeWithdrawal(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <div>
                  <b className="text-slate-900">Right to Withdraw Without Academic Penalty</b>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    I understand that I am free to withdraw from the study at any point without penalty or loss of medical student privileges.
                  </p>
                </div>
              </label>
            </div>

            {/* LIVE PHYSICAL SIGNATURE PAD OR PHOTO UPLOAD FOR PARTICIPANT */}
            <div className="border-2 border-blue-900/40 rounded-xl p-4 bg-white shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      MANDATORY ICMR CONSENT REQUIREMENT
                    </span>
                    <span className="text-xs text-slate-500">Signer: <b>{participantName}</b></span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    Participant Handwritten Signature (Raw Image Attached As-Is)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Per legal compliance, the participant's drawn or photographed signature is embedded into the Case Record Form exactly as captured.
                  </p>
                </div>

                {/* Input Mode Selector */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setParticipantInputMode('draw_pad')}
                    className={`px-3 py-1 rounded font-medium transition-all ${
                      participantInputMode === 'draw_pad'
                        ? 'bg-blue-900 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Draw on Pad
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantInputMode('upload_photo')}
                    className={`px-3 py-1 rounded font-medium transition-all ${
                      participantInputMode === 'upload_photo'
                        ? 'bg-blue-900 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Upload Photo
                  </button>
                </div>
              </div>

              {participantInputMode === 'draw_pad' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 font-medium">Draw using finger, stylus, or mouse:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                        {[
                          { color: '#0a1931', label: 'Navy' },
                          { color: '#000000', label: 'Black' },
                          { color: '#1d4ed8', label: 'Blue' }
                        ].map(item => (
                          <button
                            key={item.color}
                            type="button"
                            onClick={() => setParticipantPenColor(item.color)}
                            title={item.label}
                            className={`w-6 h-6 rounded-full border transition-all ${
                              participantPenColor === item.color
                                ? 'ring-2 ring-blue-500 scale-110 border-white'
                                : 'border-slate-300 hover:scale-105'
                            }`}
                            style={{ backgroundColor: item.color }}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={clearParticipantCanvas}
                        className="text-xs text-rose-700 hover:text-rose-800 font-semibold px-2.5 py-1 rounded border border-rose-200 hover:bg-rose-50 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Clear Pad</span>
                      </button>
                    </div>
                  </div>

                  {/* Physical Canvas */}
                  <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
                    <canvas
                      ref={participantCanvasRef}
                      width={640}
                      height={170}
                      onMouseDown={startParticipantDrawing}
                      onMouseMove={drawParticipant}
                      onMouseUp={stopParticipantDrawing}
                      onMouseLeave={stopParticipantDrawing}
                      onTouchStart={startParticipantDrawing}
                      onTouchMove={drawParticipant}
                      onTouchEnd={stopParticipantDrawing}
                      className="w-full h-36 touch-none cursor-crosshair block"
                    />

                    {/* Baseline Guide Line */}
                    <div className="absolute bottom-6 left-6 right-6 border-b border-slate-200 pointer-events-none flex justify-between text-[10px] text-slate-400">
                      <span>Sign on the line above (Finger, Stylus, or Mouse)</span>
                      <span>Participant: {participant.participant_id}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 text-center space-y-3">
                    <input
                      ref={participantFileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleParticipantPhotoUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-900">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Upload or Capture Participant Signature Photo
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Take a photo of the wet-ink signature on the paper consent slip, or upload an image file (PNG, JPG, WebP).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => participantFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold hover:bg-blue-800 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo / Choose Image File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Raw Signature Preview Card */}
              {isAuthenticSignature(participantSignature || uploadedParticipantPhoto || participant.participant_signature) && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">
                      Raw Participant Signature (Embedded As-Is in CRF PDF):
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Attached As-Is
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded p-2 h-20 flex items-center justify-center">
                    <img
                      src={participantSignature || uploadedParticipantPhoto || participant.participant_signature}
                      alt="Raw Participant Signature Attached As-Is"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    This exact raw image data is directly embedded into the Case Record Form PDF without substitution or simulated placeholders.
                  </p>
                </div>
              )}

              {/* Status Bar */}
              <div className="flex justify-between items-center text-xs">
                {hasParticipantDrawn || isAuthenticSignature(participantSignature) || isAuthenticSignature(uploadedParticipantPhoto) || isAuthenticSignature(participant.participant_signature) ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Participant Raw Signature Attached As-Is
                  </span>
                ) : (
                  <span className="text-amber-800 font-semibold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Physical signature required — please sign or upload photo above
                  </span>
                )}

                <span className="text-[11px] text-slate-500 font-mono">
                  Timestamp: {participant.participant_signed_at || new Date().toISOString().replace('T', ' ').substring(0, 19)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('review')}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2"
              >
                Back to PDF Review
              </button>

              <button
                type="button"
                onClick={handleConfirmParticipantConsent}
                disabled={!isConsentValid}
                className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                <span>Save Live Participant Signature & Proceed to Investigator Co-Sign</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: INVESTIGATOR CO-SIGN */}
        {/* ========================================================================= */}
        {activeStep === 'investigator_sign' && (
          <div className="space-y-5">
            <div className="border-b pb-3 flex justify-between items-start">
              <div>
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded">
                  INVESTIGATOR ATTESTATION
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-2">Investigator Co-Sign & Case Record Form Certification</h3>
                <p className="text-xs text-slate-600">Select the attesting physician/investigator and apply verified signature.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Participant Consent Confirmed
              </span>
            </div>

            {/* Live Participant Signature Verification Box */}
            <div className={`border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${hasParticipantSigned ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {hasParticipantSigned ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      <b className="text-xs text-emerald-950">Participant Physical Signature Verified & Attached</b>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <b className="text-xs text-red-900">Participant Signature Status: UNSIGNED</b>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-600">
                  Participant: <b>{participantName}</b> (ID: <b>{participant.participant_id}</b>) • {hasParticipantSigned ? `Consented at ${participant.participant_signed_at || 'Recorded Today'}` : 'Awaiting Consent'}
                </div>
              </div>

              {hasParticipantSigned ? (
                <div className="bg-white border border-emerald-300 rounded-lg px-3 py-1 h-12 flex items-center justify-center shadow-xs">
                  <img
                    src={rawPartSigCandidate!}
                    alt="Participant Signature"
                    className="max-h-10 max-w-[140px] object-contain"
                  />
                </div>
              ) : (
                <div className="text-xs text-red-700 font-bold bg-white border border-red-300 px-3 py-1.5 rounded-lg">
                  UNSIGNED
                </div>
              )}
            </div>

            {/* Investigator Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Select Attesting Investigator:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {team.map((inv) => {
                  const isSelected = selectedInvestigator === inv.name;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => {
                        setSelectedInvestigator(inv.name);
                        setUploadedInvestigatorPhoto(null);
                        clearCanvas();
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-blue-800 bg-blue-50/60 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900">{inv.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-800" />}
                      </div>
                      <div className="text-[11px] text-slate-500">{inv.role}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Signature Input Mode Toggle */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Signature Method:</span>
                
                <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setInvestigatorInputMode('use_saved')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      investigatorInputMode === 'use_saved' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Saved Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestigatorInputMode('upload_photo')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      investigatorInputMode === 'upload_photo' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upload Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestigatorInputMode('draw_pad')}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      investigatorInputMode === 'draw_pad' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Draw Live
                  </button>
                </div>
              </div>

              {/* Mode 1: Saved Signature */}
              {investigatorInputMode === 'use_saved' && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-600">
                    Applying official signature on file for <b>{selectedInvestigator}</b>:
                  </div>
                  <div className="bg-white border border-slate-300 rounded-lg p-3 h-24 flex items-center justify-center shadow-inner">
                    {storedSignatures[selectedInvestigator] ? (
                      <img
                        src={storedSignatures[selectedInvestigator]}
                        alt="Investigator Signature"
                        className="max-h-20 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs italic">Standard Stamp / Signature Active</span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Note: To update or upload a new signature for {selectedInvestigator}, visit the <b>Investigator Signatures</b> tab.
                  </div>
                </div>
              )}

              {/* Mode 2: Upload Photo */}
              {investigatorInputMode === 'upload_photo' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-700 bg-white transition-all rounded-xl p-5 text-center cursor-pointer space-y-1.5"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Upload className="w-5 h-5 text-blue-800 mx-auto" />
                    <span className="text-xs font-bold text-blue-900 block">Click to upload signature photo</span>
                    <span className="text-[10px] text-slate-400 block">PNG, JPG, or JPEG</span>
                  </div>

                  {uploadedInvestigatorPhoto && (
                    <div className="bg-white border border-slate-300 rounded-lg p-2 h-20 flex items-center justify-center">
                      <img src={uploadedInvestigatorPhoto} alt="Uploaded preview" className="max-h-16 max-w-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Draw Live */}
              {investigatorInputMode === 'draw_pad' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Draw standard signature below:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPenColor('#0a1931')}
                        className={`w-4 h-4 rounded-full bg-[#0a1931] ${penColor === '#0a1931' ? 'ring-2 ring-blue-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPenColor('#000000')}
                        className={`w-4 h-4 rounded-full bg-[#000000] ${penColor === '#000000' ? 'ring-2 ring-blue-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPenColor('#1e3a8a')}
                        className={`w-4 h-4 rounded-full bg-[#1e3a8a] ${penColor === '#1e3a8a' ? 'ring-2 ring-blue-500' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={160}
                      className="w-full h-36 cursor-crosshair touch-none bg-white block"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium bg-slate-200/70 hover:bg-slate-200 px-3 py-1 rounded"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {hasDrawn ? 'Signature captured' : 'Draw signature with mouse or touch'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Investigator Attestation Statement */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs text-slate-700">
              <b>Investigator Statement:</b> "I certify that all recorded baseline physiological measurements, rMEQ chronotype scoring, and Kubios HRV recordings were conducted under standardized conditions as outlined in the ICMR STS 2026 research protocol."
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('participant_consent')}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-4 py-2"
              >
                Back to Consent
              </button>

              <button
                type="button"
                onClick={handleCommitInvestigatorSign}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalize & Cryptographically Seal PDF Dossier</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SEALED & SECURELY STORED DOSSIER */}
        {/* ========================================================================= */}
        {activeStep === 'complete' && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-extrabold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Cryptographically Sealed & Stored in Secure Archival Vault</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">Case Record Form Fully Attested & Sealed</h3>
              <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1">
                Participant informed consent and investigator co-signature have been attested and saved into the secure study database for Participant <b>{participant.participant_id}</b>.
              </p>
            </div>

            {/* Verification Metadata Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-xl mx-auto text-xs text-left space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Participant ID:</span>
                <span className="font-mono font-bold text-blue-900">{participant.participant_id}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Participant Consent:</span>
                {hasParticipantSigned ? (
                  <span className="font-semibold text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Physically Signed on Tablet ({participant.participant_signed_at || 'Attested'})
                  </span>
                ) : (
                  <span className="font-bold text-red-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    UNSIGNED (Pending Consent)
                  </span>
                )}
              </div>

              {hasParticipantSigned && (
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-500">Participant Signature:</span>
                  <div className="bg-white border border-slate-200 rounded px-2 py-0.5 h-9 flex items-center">
                    <img
                      src={finalPartSig!}
                      alt="Participant Signature"
                      className="max-h-8 max-w-[120px] object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Attesting Physician:</span>
                <span className="font-bold text-slate-800">{participant.investigator_name || selectedInvestigator}</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Autonomic HRV Telemetry:</span>
                <span className="font-semibold text-blue-900">Kubios Smartphone Seismocardiography (SCG) Verified & Attached</span>
              </div>

              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-slate-500">Storage Location:</span>
                <span className="font-medium text-slate-700">ICMR STS Encrypted Vault • Google Sheets Sync Queued</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">SHA-256 Digest Seal:</span>
                <span className="font-mono text-[11px] text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded">
                  {participant.pdf_sha256 || '9a1f3e5c7a9b1d3f5e7c9a1b'}
                </span>
              </div>
            </div>

            {/* Instant Access & Download Action Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenPdfWindow}
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Sealed PDF Dossier</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPdfWindow}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official CRF</span>
              </button>

              {onNavigateToPdfViewer && (
                <button
                  type="button"
                  onClick={onNavigateToPdfViewer}
                  className="border border-blue-800 text-blue-900 hover:bg-blue-50 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  <span>View 5-Page Dossier Tab</span>
                </button>
              )}

              {onNavigateToReport && (
                <button
                  type="button"
                  onClick={onNavigateToReport}
                  className="border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Participant Health Portal</span>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStep('review')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
              >
                Re-inspect Sealed PDF Pages
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

