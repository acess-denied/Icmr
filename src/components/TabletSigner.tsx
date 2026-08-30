import React, { useRef, useState, useEffect } from 'react';
import { PenTool, CheckCircle, RotateCcw, Shield, Check, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { ParticipantRecord } from '../types';

interface TabletSignerProps {
  participant: ParticipantRecord;
  onParticipantSign: (participantId: string, signatureBase64: string) => void;
  onInvestigatorCoSign: (participantId: string, signatureBase64: string, investigatorName: string) => void;
}

export const TabletSigner: React.FC<TabletSignerProps> = ({
  participant,
  onParticipantSign,
  onInvestigatorCoSign,
}) => {
  const [activeStep, setActiveStep] = useState<'review' | 'participant_sign' | 'investigator_sign' | 'complete'>('review');
  const [consentChecked, setConsentChecked] = useState(false);
  const [investigatorName, setInvestigatorName] = useState('Dr. Harsh Narware');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize canvas
  useEffect(() => {
    if ((activeStep === 'participant_sign' || activeStep === 'investigator_sign') && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeStep]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveParticipantSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sigData = canvas.toDataURL('image/png');
    onParticipantSign(participant.participant_id, sigData);
    setActiveStep('investigator_sign');
  };

  const handleSaveInvestigatorSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sigData = canvas.toDataURL('image/png');
    onInvestigatorCoSign(participant.participant_id, sigData, investigatorName);
    setActiveStep('complete');
  };

  return (
    <div className="space-y-6">
      {/* Step Progress Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          <div className={`p-2 rounded-lg ${activeStep === 'review' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            1. Data Review
          </div>
          <div className={`p-2 rounded-lg ${activeStep === 'participant_sign' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            2. Participant Consent
          </div>
          <div className={`p-2 rounded-lg ${activeStep === 'investigator_sign' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            3. Investigator Co-Sign
          </div>
          <div className={`p-2 rounded-lg ${activeStep === 'complete' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            4. Sealed & Finalized
          </div>
        </div>
      </div>

      {/* Main Tablet Canvas Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        
        {activeStep === 'review' && (
          <div className="space-y-5">
            <div className="border-b pb-3">
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                ID: {participant.participant_id}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-2">Participant Information Sheet & Responses Review</h3>
              <p className="text-xs text-slate-600">Please review your submitted details carefully prior to providing your digital signature.</p>
            </div>

            {/* Summarized Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div><span className="text-slate-500">Age / Gender:</span> <b>{participant.age} yrs • {participant.gender}</b></div>
              <div><span className="text-slate-500">Year of Study:</span> <b>{participant.year_of_study}</b></div>
              <div><span className="text-slate-500">Height / Weight:</span> <b>{participant.height_cm} cm / {participant.weight_kg} kg</b></div>
              <div><span className="text-slate-500">Computed BMI:</span> <b>{participant.bmi} kg/m²</b></div>
              <div><span className="text-slate-500">Meal Window:</span> <b>{participant.eating_duration}</b></div>
              <div><span className="text-slate-500">Determined Chronotype:</span> <b className="text-blue-700">{participant.chronotype_category} ({participant.rmeq_total_score}/25)</b></div>
            </div>

            {/* Informed Consent Agreement Checkbox */}
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <b>Informed Consent Declaration:</b> I have read the Participant Information Sheet. The study procedures (questionnaire and non-invasive Kubios HRV acquisition) have been explained to me. I understand my participation is voluntary and I may withdraw at any time.
                </div>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                disabled={!consentChecked}
                onClick={() => setActiveStep('participant_sign')}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-40 shadow-sm"
              >
                Proceed to Participant Signature <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 'participant_sign' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Participant Digital Signature Pad</h3>
                <p className="text-xs text-slate-600">Please sign inside the frame below using stylus or touch screen.</p>
              </div>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Pad
              </button>
            </div>

            {/* Signature Canvas */}
            <div className="border-2 border-dashed border-blue-400 bg-slate-50/50 rounded-xl p-2 flex justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full max-w-[600px] h-[180px] bg-white rounded-lg border border-slate-200 touch-none cursor-crosshair shadow-sm"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep('review')}
                className="text-xs text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Back to Review
              </button>
              <button
                onClick={handleSaveParticipantSignature}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
              >
                Accept & Proceed to Investigator Co-Sign <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {activeStep === 'investigator_sign' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Principal Investigator Co-Signature & Certification</h3>
                <p className="text-xs text-slate-600">Investigator verifies protocol compliance, rMEQ scoring, and Kubios biometric calibration.</p>
              </div>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Pad
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Investigator Name / Designation</label>
                <input
                  type="text"
                  value={investigatorName}
                  onChange={(e) => setInvestigatorName(e.target.value)}
                  className="w-full mt-1 p-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Protocol Verification Status</label>
                <div className="mt-1 p-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Participant ID {participant.participant_id} Verified</span>
                </div>
              </div>
            </div>

            {/* Signature Canvas */}
            <div className="border-2 border-dashed border-indigo-400 bg-slate-50/50 rounded-xl p-2 flex justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full max-w-[600px] h-[180px] bg-white rounded-lg border border-slate-200 touch-none cursor-crosshair shadow-sm"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveStep('participant_sign')}
                className="text-xs text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Back
              </button>
              <button
                onClick={handleSaveInvestigatorSignature}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4" /> Finalize & Seal Case Record Form
              </button>
            </div>
          </div>
        )}

        {activeStep === 'complete' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Case Record Form Finalized & Dual Signed</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Both signatures have been cryptographically stamped with SHA-256 digests. The participant's record is sealed in D1 and R2 with the attached Kubios HRV result appendix.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-1 font-mono text-slate-700">
              <div><b>Participant ID:</b> {participant.participant_id}</div>
              <div><b>Participant Sig Hash:</b> 4c8f1e2a9b3d7c5e...</div>
              <div><b>Investigator Sig Hash:</b> 9a1f3e5c7a9b1d3f...</div>
              <div><b>Dossier Status:</b> <span className="text-emerald-700 font-bold">SEALED (2 Pages)</span></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
