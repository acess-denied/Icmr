import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  Upload, 
  Check, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  UserCheck, 
  Plus, 
  Sparkles,
  Info,
  CheckCircle2,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { 
  InvestigatorProfile, 
  getStoredInvestigatorTeam, 
  getStoredInvestigatorSignatures, 
  saveStoredInvestigatorSignature, 
  saveStoredInvestigatorTeam,
  createStandardSignaturePlaceholder
} from '../data/investigators';

interface InvestigatorSignatureManagerProps {
  onSignaturesUpdated?: (signatures: Record<string, string>) => void;
}

export const InvestigatorSignatureManager: React.FC<InvestigatorSignatureManagerProps> = ({
  onSignaturesUpdated
}) => {
  const [team, setTeam] = useState<InvestigatorProfile[]>([]);
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [selectedInvestigatorId, setSelectedInvestigatorId] = useState<string>('PI-HARSH');
  const [inputMode, setInputMode] = useState<'upload' | 'draw'>('upload');
  const [penColor, setPenColor] = useState<string>('#0a1931');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Upload state
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  // Load stored team & signatures on mount
  useEffect(() => {
    const loadedTeam = getStoredInvestigatorTeam();
    const loadedSigs = getStoredInvestigatorSignatures();
    setTeam(loadedTeam);
    setSignatures(loadedSigs);
  }, []);

  const activeInvestigator = team.find(inv => inv.id === selectedInvestigatorId) || team[0];
  const activeSignatureUrl = activeInvestigator ? signatures[activeInvestigator.name] : '';

  // Initialize Canvas when switching to draw mode
  useEffect(() => {
    if (inputMode === 'draw' && canvasRef.current) {
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
  }, [inputMode, selectedInvestigatorId, penColor]);

  // Standard Mouse/Touch Canvas Drawing Handlers
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

  // Standard File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      setUploadedPreview(imgUrl);
    };
    reader.readAsDataURL(file);
  };

  // Save Signature Action
  const handleCommitSignature = () => {
    if (!activeInvestigator) return;

    let finalSig = '';
    if (inputMode === 'upload' && uploadedPreview) {
      finalSig = uploadedPreview;
    } else if (inputMode === 'draw' && canvasRef.current && hasDrawn) {
      finalSig = canvasRef.current.toDataURL('image/png');
    } else {
      return;
    }

    // Persist signature
    saveStoredInvestigatorSignature(activeInvestigator.name, finalSig);
    
    // Update local state
    const updatedSigs = { ...signatures, [activeInvestigator.name]: finalSig };
    setSignatures(updatedSigs);

    // Update investigator lastUpdated time
    const updatedTeam = team.map(inv => {
      if (inv.id === activeInvestigator.id) {
        return {
          ...inv,
          signatureDataUrl: finalSig,
          lastUpdated: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        };
      }
      return inv;
    });
    setTeam(updatedTeam);
    saveStoredInvestigatorTeam(updatedTeam);

    // Reset upload/canvas
    setUploadedPreview(null);
    clearCanvas();

    setSaveSuccessMsg(`Official signature for ${activeInvestigator.name} updated and synchronized across all Case Record Forms.`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);

    if (onSignaturesUpdated) {
      onSignaturesUpdated(updatedSigs);
    }
  };

  // Reset or remove signature
  const handleResetSignature = () => {
    if (!activeInvestigator) return;
    const defaultPlaceholder = createStandardSignaturePlaceholder(activeInvestigator.name);
    saveStoredInvestigatorSignature(activeInvestigator.name, defaultPlaceholder);
    
    const updatedSigs = { ...signatures, [activeInvestigator.name]: defaultPlaceholder };
    setSignatures(updatedSigs);

    const updatedTeam = team.map(inv => {
      if (inv.id === activeInvestigator.id) {
        return { ...inv, signatureDataUrl: defaultPlaceholder, lastUpdated: 'Default signature' };
      }
      return inv;
    });
    setTeam(updatedTeam);
    saveStoredInvestigatorTeam(updatedTeam);

    setUploadedPreview(null);
    clearCanvas();

    setSaveSuccessMsg(`Reset signature for ${activeInvestigator.name}.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);

    if (onSignaturesUpdated) {
      onSignaturesUpdated(updatedSigs);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
              PHYSICIAN & INVESTIGATOR SIGNATURE PORTAL
            </span>
            <span className="text-xs text-slate-400 font-mono">ICMR STS 2026 Protocol</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Investigator Signatures Hub</h2>
          <p className="text-xs text-slate-600 max-w-2xl mt-1">
            Investigators can upload an actual photo/scan of their handwritten signature or sign directly on the digital pad. Saved signatures are automatically applied to Page 5 Case Record Form attestations, audit seals, and export dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Active Team Members</div>
            <div className="text-sm font-bold text-blue-900">{team.length} Investigators Configured</div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Team Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Investigator</span>
              <span className="text-[10px] text-slate-400">Click to configure</span>
            </div>

            <div className="space-y-2">
              {team.map((inv) => {
                const isSelected = inv.id === selectedInvestigatorId;
                const hasCustomSig = signatures[inv.name] && !signatures[inv.name].includes('StandardSignaturePlaceholder');

                return (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvestigatorId(inv.id);
                      setUploadedPreview(null);
                      clearCanvas();
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'border-blue-800 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{inv.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        inv.id === 'PI-HARSH' 
                          ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.role.split(' ')[0]}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">{inv.designation}</div>
                    
                    <div className="mt-1 pt-1.5 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status:</span>
                      <span className="font-medium text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Active on CRFs
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-700" /> Multi-Investigator Attribution
              </div>
              <p>
                Each physician/student investigator maintains their individual signature. During CRF attestations or tablet reviews, selecting the attesting physician automatically embeds their verified signature.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Signature Editor & Current Preview */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Active Investigator Profile Banner */}
          {activeInvestigator && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="text-xs font-mono font-bold text-blue-800 uppercase tracking-wider">{activeInvestigator.role}</div>
                  <h3 className="text-lg font-bold text-slate-900">{activeInvestigator.name}</h3>
                  <p className="text-xs text-slate-500">{activeInvestigator.designation} • {activeInvestigator.department}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" /> Ready for Attestation
                  </span>
                </div>
              </div>

              {/* Current Active Signature Display */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Current Active Signature on Record:</span>
                  <button
                    onClick={handleResetSignature}
                    className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> Reset / Clear
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 h-28 flex items-center justify-center overflow-hidden">
                  {activeSignatureUrl ? (
                    <img 
                      src={activeSignatureUrl} 
                      alt={`${activeInvestigator.name} Signature`}
                      className="max-h-24 max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs italic">No signature on file yet</div>
                  )}
                </div>
              </div>

              {/* Signature Input Options */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Update / Provide Signature
                  </span>

                  {/* Mode Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                    <button
                      onClick={() => setInputMode('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        inputMode === 'upload' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Signature Photo</span>
                    </button>

                    <button
                      onClick={() => setInputMode('draw')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        inputMode === 'draw' ? 'bg-white text-blue-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Draw on Digital Pad</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: Upload Photo / Scan */}
                {inputMode === 'upload' && (
                  <div className="space-y-3">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-700 bg-slate-50/70 hover:bg-blue-50/40 transition-all rounded-xl p-6 text-center cursor-pointer space-y-2"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>

                      <div>
                        <span className="text-xs font-bold text-blue-900 hover:underline">Click to upload signature photo/scan</span>
                        <span className="text-xs text-slate-500 block">or drag and drop signature image (PNG, JPG, SVG)</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Recommendation: Photo of handwritten pen signature on clean white paper
                      </div>
                    </div>

                    {/* Uploaded Preview */}
                    {uploadedPreview && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="text-xs font-semibold text-slate-700 flex justify-between items-center">
                          <span>Uploaded Photo Preview:</span>
                          <button
                            onClick={() => setUploadedPreview(null)}
                            className="text-[11px] text-rose-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="bg-white border border-slate-300 rounded p-2 h-24 flex items-center justify-center">
                          <img src={uploadedPreview} alt="Uploaded preview" className="max-h-20 max-w-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 2: Draw on Digital Pad */}
                {inputMode === 'draw' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Draw standard signature below with mouse, trackpad, or tablet stylus:</span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px]">Ink:</span>
                        <button
                          type="button"
                          onClick={() => setPenColor('#0a1931')}
                          className={`w-5 h-5 rounded-full bg-[#0a1931] border-2 transition-all ${penColor === '#0a1931' ? 'ring-2 ring-blue-500 scale-110' : 'border-transparent'}`}
                          title="Navy Blue"
                        />
                        <button
                          type="button"
                          onClick={() => setPenColor('#000000')}
                          className={`w-5 h-5 rounded-full bg-[#000000] border-2 transition-all ${penColor === '#000000' ? 'ring-2 ring-blue-500 scale-110' : 'border-transparent'}`}
                          title="Black Ink"
                        />
                        <button
                          type="button"
                          onClick={() => setPenColor('#1e3a8a')}
                          className={`w-5 h-5 rounded-full bg-[#1e3a8a] border-2 transition-all ${penColor === '#1e3a8a' ? 'ring-2 ring-blue-500 scale-110' : 'border-transparent'}`}
                          title="Royal Blue"
                        />
                      </div>
                    </div>

                    {/* Standard Drawing Canvas */}
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={180}
                        className="w-full h-44 cursor-crosshair touch-none bg-white block"
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
                        className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Clear Drawing
                      </button>

                      <span className="text-[11px] text-slate-400">
                        {hasDrawn ? 'Signature stroke captured' : 'Touch/Click & drag to draw signature'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Commit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCommitSignature}
                    disabled={inputMode === 'upload' ? !uploadedPreview : !hasDrawn}
                    className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Update {activeInvestigator.name}'s Signature</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
