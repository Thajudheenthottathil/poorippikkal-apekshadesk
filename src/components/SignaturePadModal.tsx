import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, PenTool, Upload, Trash2, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignatureDataUrl?: string;
  onSaveSignature: (signatureDataUrl: string | undefined) => void;
  titleMalayalam?: string;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  currentSignatureDataUrl,
  onSaveSignature,
  titleMalayalam = 'ഡിജിറ്റൽ ഒപ്പ് ചേർക്കുക (Digital Signature)',
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [penColor, setPenColor] = useState<'#1e3a8a' | '#0f172a'>('#1e3a8a'); // Royal Blue or Carbon Black
  const [penWidth, setPenWidth] = useState<number>(2.8);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [uploadedRawDataUrl, setUploadedRawDataUrl] = useState<string | null>(null);
  const [processedPhotoSignatureUrl, setProcessedPhotoSignatureUrl] = useState<string | null>(null);
  const [contrastThreshold, setContrastThreshold] = useState<number>(165);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 480;
    const height = rect.height || 200;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.clearRect(0, 0, width, height);
    setHasDrawn(false);
  }, [penColor, penWidth]);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      const timer = setTimeout(() => {
        initCanvas();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, initCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  }, [penColor, penWidth]);

  const getPointerCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const coords = getPointerCoords(e);
    if (!coords) return;
    isDrawingRef.current = true;
    lastPointRef.current = coords;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, penWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = penColor;
      ctx.fill();
      setHasDrawn(true);
    }
  };

  const drawMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getPointerCoords(e);
    const last = lastPointRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!coords || !last || !ctx) return;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    const midX = (last.x + coords.x) / 2;
    const midY = (last.y + coords.y) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = coords;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const cropCanvasToTransparentPng = (sourceCanvas: HTMLCanvasElement): string => {
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return sourceCanvas.toDataURL('image/png');
    const { width, height } = sourceCanvas;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let foundPixel = false;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 15) {
          foundPixel = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!foundPixel) return sourceCanvas.toDataURL('image/png');

    const pad = 14;
    const cropX = Math.max(0, minX - pad);
    const cropY = Math.max(0, minY - pad);
    const cropW = Math.min(width - cropX, maxX - minX + pad * 2);
    const cropH = Math.min(height - cropY, maxY - minY + pad * 2);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = cropW;
    outCanvas.height = cropH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return sourceCanvas.toDataURL('image/png');
    outCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return outCanvas.toDataURL('image/png');
  };

  // Process uploaded photo of signature on white paper -> transparent PNG
  const processPhotoSignature = useCallback(
    (rawUrl: string, threshold: number, targetInkHex: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxDim = 700;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const offCanvas = document.createElement('canvas');
        offCanvas.width = w;
        offCanvas.height = h;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const d = imgData.data;

        const targetR = targetInkHex === '#1e3a8a' ? 24 : 15;
        const targetG = targetInkHex === '#1e3a8a' ? 52 : 23;
        const targetB = targetInkHex === '#1e3a8a' ? 138 : 42;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < threshold) {
            const darkness = Math.min(1, (threshold - lum) / Math.max(30, threshold * 0.55));
            d[i] = targetR;
            d[i + 1] = targetG;
            d[i + 2] = targetB;
            d[i + 3] = Math.round(Math.min(255, darkness * 255));
          } else {
            d[i + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const cropped = cropCanvasToTransparentPng(offCanvas);
        setProcessedPhotoSignatureUrl(cropped);
      };
      img.src = rawUrl;
    },
    []
  );

  useEffect(() => {
    if (uploadedRawDataUrl) {
      processPhotoSignature(uploadedRawDataUrl, contrastThreshold, penColor);
    }
  }, [uploadedRawDataUrl, contrastThreshold, penColor, processPhotoSignature]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedRawDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      const croppedUrl = cropCanvasToTransparentPng(canvas);
      onSaveSignature(croppedUrl);
      onClose();
    } else if (activeTab === 'upload' && processedPhotoSignatureUrl) {
      onSaveSignature(processedPhotoSignatureUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <PenTool className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">{titleMalayalam}</h3>
              <p className="text-[11px] text-emerald-200">
                വിരൽ കൊണ്ട് വരയ്ക്കാം അല്ലെങ്കിൽ പേപ്പറിലെ ഒപ്പിന്റെ ഫോട്ടോ ചേർക്കാം
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="അടയ്ക്കുക"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-2.5 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'draw'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            1. വിരൽ കൊണ്ട് ഒപ്പിടുക
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            2. ഒപ്പിന്റെ ഫോട്ടോ അപ്‌ലോഡ്
          </button>
        </div>

        {/* Ink Color & Thickness Controls */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">മഷി നിറം (Ink):</span>
            <button
              type="button"
              onClick={() => setPenColor('#1e3a8a')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                penColor === '#1e3a8a'
                  ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-blue-800 inline-block" />
              നീല പേന (Blue)
            </button>
            <button
              type="button"
              onClick={() => setPenColor('#0f172a')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                penColor === '#0f172a'
                  ? 'bg-slate-200 border-slate-800 text-slate-900 ring-1 ring-slate-700'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" />
              കറുപ്പ് പേന (Black)
            </button>
          </div>

          {activeTab === 'draw' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-500">കനം:</span>
              {[2, 2.8, 4].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPenWidth(w)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    penWidth === w
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {w === 2 ? 'നേർത്തത്' : w === 2.8 ? 'സാധാരണ' : 'കട്ടിയുള്ളത്'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4">
          {activeTab === 'draw' ? (
            <div>
              <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={drawMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={drawMove}
                  onTouchEnd={stopDrawing}
                  className="w-full h-48 touch-none cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-xs font-semibold">
                      ഇവിടെ വിരൽ കൊണ്ടോ മൗസ് കൊണ്ടോ നിങ്ങളുടെ ഒപ്പ് വരയ്ക്കുക
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      (Sign inside this box)
                    </span>
                  </div>
                )}
                {/* Baseline guide */}
                <div className="pointer-events-none absolute bottom-9 left-8 right-8 border-b border-slate-200" />
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={initCanvas}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  മായ്ക്കുക (Clear)
                </button>
                <span className="text-[11px] text-slate-500">
                  സുതാര്യമായ (Transparent) ഒപ്പായി അപേക്ഷയിൽ ചേർക്കപ്പെടും
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl p-4 cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-emerald-700 mb-1" />
                <span className="text-xs font-bold text-emerald-950">
                  വെള്ള പേപ്പറിലെ ഒപ്പിന്റെ ഫോട്ടോ തിരഞ്ഞെടുക്കുക
                </span>
                <span className="text-[11px] text-emerald-700 mt-0.5">
                  ബാക്ക്ഗ്രൗണ്ട് ഓട്ടോമാറ്റിക്കായി നീക്കം ചെയ്ത് ഒപ്പ് മാത്രമാക്കും!
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {processedPhotoSignatureUrl && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> ബാക്ക്ഗ്രൗണ്ട് നീക്കം ചെയ്ത ഒപ്പ്:
                    </span>
                    <img
                      src={processedPhotoSignatureUrl}
                      alt="Processed Signature"
                      className="max-h-24 object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                      തെളിച്ചം (Clarity):
                    </span>
                    <input
                      type="range"
                      min={90}
                      max={220}
                      value={contrastThreshold}
                      onChange={(e) => setContrastThreshold(Number(e.target.value))}
                      className="w-full accent-emerald-700"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Existing signature preview / delete option */}
          {currentSignatureDataUrl && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">നിലവിലെ ഒപ്പ്:</span>
                <img
                  src={currentSignatureDataUrl}
                  alt="Current Signature"
                  className="h-8 object-contain border border-slate-200 rounded bg-white px-1.5"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  onSaveSignature(undefined);
                  onClose();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ഒപ്പ് നീക്കം ചെയ്യുക
              </button>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            റദ്ദാക്കുക
          </button>
          <button
            type="button"
            disabled={activeTab === 'draw' ? !hasDrawn : !processedPhotoSignatureUrl}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:pointer-events-none shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            അപേക്ഷയിൽ ഒപ്പ് ചേർക്കുക
          </button>
        </div>
      </div>
    </div>
  );
};
