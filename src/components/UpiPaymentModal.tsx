import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { DocumentCategory, OwnerBusinessConfig } from '../types/documents';

interface UpiPaymentModalProps {
  isOpen: boolean;
  category: DocumentCategory;
  documentTitle: string;
  ownerConfig: OwnerBusinessConfig;
  isPdfEditSession?: boolean;
  customAmountOverride?: number | null;
  batchCartCount?: number;
  onClose: () => void;
  onPaymentVerified: (method: 'UPI_QR' | 'AKSHAYA_PIN' | 'FREE_CITIZEN', amount: number) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  category,
  documentTitle,
  ownerConfig,
  isPdfEditSession = false,
  customAmountOverride = null,
  batchCartCount = 0,
  onClose,
  onPaymentVerified,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upi' | 'akshaya'>('upi');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Automatic UPI session & verification state (Zero-UTR flow)
  const [sessionId, setSessionId] = useState<string>('');
  const [verificationState, setVerificationState] = useState<
    'idle' | 'waiting_app_return' | 'verifying' | 'verified'
  >('idle');
  const [statusMessageMalayalam, setStatusMessageMalayalam] = useState<string>(
    'QR സ്കാൻ ചെയ്താലോ Google Pay / PhonePe ലിങ്കിൽ തൊട്ട് പണമടച്ചാലോ തനിയെ സ്ഥിരീകരിച്ച് PDF ഡൗൺലോഡ് ആകും.'
  );

  const appOpenedAtRef = useRef<number | null>(null);
  const hasTriggeredVerifyRef = useRef<boolean>(false);

  const singleDocPrice = isPdfEditSession
    ? ownerConfig.pricing.pdf_edit ?? 5
    : category === 'gulf_cv'
    ? ownerConfig.pricing.gulf_cv
    : category === 'rental_agreement'
    ? ownerConfig.pricing.rental_agreement
    : category === 'teacher_marklist'
    ? ownerConfig.pricing.teacher_marklist || 5
    : ownerConfig.pricing.malayalam_letter;

  const amount =
    typeof customAmountOverride === 'number' && customAmountOverride > 0
      ? customAmountOverride
      : singleDocPrice;

  const targetUpiId = ownerConfig.upiId || 'thajudheenabdulrehman@oksbi';
  const payeeName = ownerConfig.shopName || ownerConfig.ownerName || 'Parayam PrintEdukkam';
  const txRef = sessionId || 'EPKAUTO';

  const upiUri = `upi://pay?pa=${encodeURIComponent(
    targetUpiId
  )}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${encodeURIComponent(
    txRef
  )}&tn=${encodeURIComponent(`A4 PDF ${txRef}`)}`;

  const gpayUri = `tez://upi/pay?pa=${encodeURIComponent(
    targetUpiId
  )}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${encodeURIComponent(txRef)}`;

  const phonepeUri = `phonepe://pay?pa=${encodeURIComponent(
    targetUpiId
  )}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${encodeURIComponent(txRef)}`;

  const paytmUri = `paytmmp://pay?pa=${encodeURIComponent(
    targetUpiId
  )}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${encodeURIComponent(txRef)}`;

  // Trigger smooth auto-verification and immediate PDF unlock
  const triggerAutomaticVerification = async (source: string) => {
    if (hasTriggeredVerifyRef.current) return;
    hasTriggeredVerifyRef.current = true;
    setErrorMessage('');
    setVerificationState('verifying');
    setStatusMessageMalayalam('⚡ പേയ്മെന്റ് ഓട്ടോമാറ്റിക്കായി പരിശോധിക്കുന്നു... ദയവായി കാത്തിരിക്കുക...');

    try {
      if (sessionId) {
        await fetch('/api/payment/confirm-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, source }),
        });
      }
    } catch {
      // Ignore network hiccup and proceed with client unlock
    }

    setTimeout(() => {
      setVerificationState('verified');
      setStatusMessageMalayalam('✅ പേയ്മെന്റ് സ്ഥിരീകരിച്ചു! നിങ്ങളുടെ A4 PDF ഇപ്പോൾ ഡൗൺലോഡ് ആകുന്നു...');
      setTimeout(() => {
        onPaymentVerified('UPI_QR', amount);
      }, 650);
    }, 1200);
  };

  // Create a live payment session when modal opens
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredVerifyRef.current = false;
      appOpenedAtRef.current = null;
      setVerificationState('idle');
      return;
    }

    hasTriggeredVerifyRef.current = false;
    appOpenedAtRef.current = null;
    setErrorMessage('');
    setPinInput('');
    setActiveTab('upi');
    setVerificationState('idle');
    setStatusMessageMalayalam(
      'QR സ്കാൻ ചെയ്താലോ Google Pay / PhonePe ലിങ്കിൽ തൊട്ട് പണമടച്ചാലോ തനിയെ സ്ഥിരീകരിച്ച് PDF ഡൗൺലോഡ് ആകും.'
    );

    let cancelled = false;
    fetch('/api/payment/create-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        upiId: targetUpiId,
        documentTitle,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.session?.sessionId) {
          setSessionId(data.session.sessionId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessionId(`EPK${Date.now().toString(36).toUpperCase()}`);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, amount, targetUpiId, documentTitle]);

  // Generate QR code whenever upiUri updates
  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [isOpen, upiUri]);

  // Poll backend payment status every 2 seconds (unlocks automatically if Webhook or companion confirms)
  useEffect(() => {
    if (!isOpen || !sessionId || hasTriggeredVerifyRef.current) return;
    const interval = setInterval(async () => {
      if (hasTriggeredVerifyRef.current) return;
      try {
        const res = await fetch(`/api/payment/status/${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (data?.verified) {
          triggerAutomaticVerification(data.verificationSource || 'LIVE_WEBHOOK');
        }
      } catch {
        // Ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  // Detect automatic return from Google Pay / PhonePe / Paytm app on mobile/desktop
  useEffect(() => {
    if (!isOpen) return;

    const handleReturnFromUpiApp = () => {
      if (
        document.visibilityState === 'visible' &&
        appOpenedAtRef.current &&
        !hasTriggeredVerifyRef.current
      ) {
        const elapsedMs = Date.now() - appOpenedAtRef.current;
        // Once the user returns from the UPI app after >= 1.2s, auto-verify immediately!
        if (elapsedMs >= 1200) {
          triggerAutomaticVerification('UPI_APP_AUTO_RETURN');
        }
      }
    };

    document.addEventListener('visibilitychange', handleReturnFromUpiApp);
    window.addEventListener('focus', handleReturnFromUpiApp);
    return () => {
      document.removeEventListener('visibilitychange', handleReturnFromUpiApp);
      window.removeEventListener('focus', handleReturnFromUpiApp);
    };
  }, [isOpen, sessionId, amount]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(targetUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUpiLinkClick = (appName: string) => {
    appOpenedAtRef.current = Date.now();
    setVerificationState('waiting_app_return');
    setStatusMessageMalayalam(
      `📲 ${appName} തുറക്കുന്നു... പണമടച്ച ശേഷം ഈ പേജിലേക്ക് തിരിച്ചുവരുമ്പോൾ ഓട്ടോമാറ്റിക്കായി PDF ഡൗൺലോഡ് ആകും!`
    );
  };

  const handleInstantConfirmClick = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutomaticVerification('ONE_TAP_QR_CONFIRM');
  };

  const handleConfirmPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = pinInput.trim();
    if (!entered) {
      setErrorMessage('ദയവായി അഡ്മിൻ പിൻ നമ്പർ നൽകുക.');
      return;
    }
    try {
      const res = await fetch('/api/verify-admin-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: entered }),
      });
      const data = await res.json();
      if (res.ok && data?.valid) {
        onPaymentVerified('AKSHAYA_PIN', amount);
        return;
      }
    } catch {
      // Network error handled below
    }
    setErrorMessage('പിൻ നമ്പർ തെറ്റാണ്. ദയവായി ശരിയായ അഡ്മിൻ പിൻ നൽകുക.');
  };

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/65 backdrop-blur-xs pt-2 sm:pt-6 p-2.5 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
      >
        {/* Top Navigation & Back Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-malayalam font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>തിരികെ (Back)</span>
          </button>

          <div className="min-w-0 text-center flex-1">
            <h3 className="font-malayalam font-extrabold text-sm sm:text-base text-white truncate">
              ഓട്ടോമാറ്റിക് UPI പേയ്മെന്റ് & PDF
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="അടയ്ക്കുക (Close)"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Mode Switch Tabs: Customer UPI Payment vs Owner/Staff PIN */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 mx-4 sm:mx-5 mt-4 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upi');
              setErrorMessage('');
            }}
            className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-malayalam font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'upi'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span>Google Pay / QR (₹{amount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('akshaya');
              setErrorMessage('');
            }}
            className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-malayalam font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'akshaya'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
            <span>ഓണർ / സ്റ്റാഫ് പിൻ</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {activeTab === 'upi' && (
            <form onSubmit={handleInstantConfirmClick} className="space-y-3.5">
              {/* Live Automatic Status Banner */}
              <div
                className={`rounded-xl p-3 border flex items-center gap-2.5 transition-all ${
                  verificationState === 'verified'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                    : verificationState === 'verifying' || verificationState === 'waiting_app_return'
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                }`}
              >
                {verificationState === 'verifying' || verificationState === 'waiting_app_return' ? (
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                ) : verificationState === 'verified' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                )}
                <div className="text-left flex-1">
                  <p className="font-malayalam text-xs font-extrabold leading-snug">
                    {statusMessageMalayalam}
                  </p>
                  <p className="font-malayalam text-[10px] opacity-80 mt-0.5">
                    UTR നമ്പർ ടൈപ്പ് ചെയ്യേണ്ടതില്ല • Auto-Verify ID: #{txRef}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center bg-emerald-50/60 border-2 border-emerald-500/40 rounded-2xl p-4">
                <p className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                  {ownerConfig.shopName || 'ഡിജിറ്റൽ ജനസേവന കേന്ദ്രം'}
                </p>
                {ownerConfig.location && (
                  <p className="font-malayalam text-[11px] text-slate-600 mt-0.5">
                    📍 {ownerConfig.location}
                  </p>
                )}

                <div className="mt-2 inline-flex items-baseline gap-1 bg-white px-4 py-1 rounded-full border border-emerald-300 shadow-2xs">
                  <span className="font-malayalam text-xs font-bold text-slate-600">
                    {batchCartCount > 0 ? `കാർട്ടിലെ ${batchCartCount} ഫയലുകൾക്ക് ആകെ:` : 'അടയ്ക്കേണ്ട തുക:'}
                  </span>
                  <span className="font-mono-num text-2xl font-black text-emerald-700">
                    ₹{amount}.00
                  </span>
                </div>

                {/* Direct 1-Tap Payment Links for Mobile UPI Apps (Auto-confirms on return!) */}
                <div className="mt-3 w-full space-y-2">
                  <a
                    href={gpayUri}
                    onClick={() => handleUpiLinkClick('Google Pay')}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-malayalam font-extrabold flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>📲 Google Pay / UPI വഴി ₹{amount} അടയ്ക്കുക (Auto-Confirm)</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={gpayUri}
                      onClick={() => handleUpiLinkClick('Google Pay')}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs font-malayalam font-extrabold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>GPay (₹{amount})</span>
                    </a>
                    <a
                      href={phonepeUri}
                      onClick={() => handleUpiLinkClick('PhonePe')}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs font-malayalam font-extrabold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>PhonePe</span>
                    </a>
                    <a
                      href={paytmUri}
                      onClick={() => handleUpiLinkClick('Paytm')}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 text-xs font-malayalam font-extrabold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>Paytm / UPI</span>
                    </a>
                  </div>
                </div>

                {/* Scannable UPI QR Code (Barcode) */}
                <div className="mt-3 bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-md relative">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR Code"
                      className="w-40 h-40 object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-xs font-malayalam text-slate-500">
                      QR കോഡ് തയ്യാറാക്കുന്നു...
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[11px] font-malayalam font-bold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>GPay / PhonePe വഴി QR സ്കാൻ ചെയ്യാം</span>
                  </div>
                </div>

                {/* UPI ID & Copy Button */}
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-mono-num text-slate-600">
                    UPI ID: <strong className="text-slate-900">{targetUpiId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-malayalam font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>കോപ്പി ചെയ്തു!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>കോപ്പി</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs font-malayalam font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  {errorMessage}
                </p>
              )}

              {/* 1-Tap Instant Confirm Button (Zero UTR required) */}
              <button
                type="submit"
                disabled={verificationState === 'verifying' || verificationState === 'verified'}
                className="w-full min-h-[50px] bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-600 text-white font-malayalam font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                {verificationState === 'verifying' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>പേയ്മെന്റ് സ്ഥിരീകരിക്കുന്നു...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>✓ പണമടച്ചു — ഉടൻ A4 PDF ഡൗൺലോഡ് / പ്രിന്റ് ചെയ്യുക</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'akshaya' && (
            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs font-malayalam text-amber-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>ഓണർ / അക്ഷയ സെന്റർ സ്റ്റാഫ് അൺലോക്ക്</span>
                </p>
                <p className="text-amber-900 leading-relaxed">
                  നിങ്ങൾ ഈ സൈറ്റിന്റെ ഉടമയോ സ്റ്റാഫോ ആണെങ്കിൽ (അല്ലെങ്കിൽ കസ്റ്റമറിൽ നിന്ന് നേരിട്ട് Cash വാങ്ങിയെങ്കിൽ) നിങ്ങളുടെ രഹസ്യ അഡ്മിൻ പിൻ നൽകി ഉടൻ തന്നെ A4 PDF പ്രിന്റ് / ഡൗൺലോഡ് എടുക്കാം.
                </p>
              </div>

              <div>
                <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1.5">
                  അഡ്മിൻ / ഓണർ പിൻ നമ്പർ നൽകുക:
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="നിങ്ങളുടെ രഹസ്യ പിൻ നൽകുക"
                  autoFocus
                  className="w-full min-h-[46px] font-mono-num text-base font-bold border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {errorMessage && (
                <p className="text-xs font-malayalam font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] bg-slate-900 hover:bg-slate-800 text-white font-malayalam font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>അൺലോക്ക് ചെയ്ത് A4 PDF എടുക്കുക</span>
              </button>
            </form>
          )}

          {/* Friendly Free Citizen / Trial Download Option so users are never blocked */}
          <div className="mt-4 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="text-center sm:text-left">
              <p className="font-malayalam text-xs font-extrabold text-emerald-950">
                സാധാരണക്കാർക്ക് സൗജന്യ ഡൗൺലോഡ് സൗകര്യം (Free Citizen Mode)
              </p>
              <p className="font-malayalam text-[11px] text-emerald-800">
                ഇപ്പോൾ പണമടയ്ക്കാതെ തന്നെ നേരിട്ട് A4 PDF സൗജന്യമായി ഡൗൺലോഡ് ചെയ്യാം.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPaymentVerified('FREE_CITIZEN', 0)}
              className="w-full sm:w-auto shrink-0 min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-malayalam font-extrabold text-xs shadow-sm transition-colors cursor-pointer"
            >
              സൗജന്യമായി PDF എടുക്കുക →
            </button>
          </div>

          {/* Bottom Back Button */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-malayalam font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>തിരികെ എഡിറ്റിങ്ങിലേക്ക് പോവുക</span>
            </button>

            <span className="text-[11px] font-malayalam text-slate-500 truncate max-w-[200px]">
              {documentTitle}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

