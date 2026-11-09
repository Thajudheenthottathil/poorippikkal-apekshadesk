import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  Copy,
  CreditCard,
  Eye,
  HeartHandshake,
  IndianRupee,
  KeyRound,
  Link2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  User,
  X,
} from 'lucide-react';
import { CompletedTransaction, OwnerBusinessConfig } from '../types/documents';
import { CustomerFeedbackItem } from './FeedbackModal';

interface OwnerSettingsModalProps {
  isOpen: boolean;
  config: OwnerBusinessConfig;
  transactions: CompletedTransaction[];
  onClose: () => void;
  onSaveConfig: (newConfig: OwnerBusinessConfig, adminPin?: string) => void;
  isStandalonePage?: boolean;
  onBackToFrontend?: () => void;
}

type TabKey = 'identity' | 'contact' | 'payment' | 'pricing' | 'share' | 'feedback';

export const OwnerSettingsModal: React.FC<OwnerSettingsModalProps> = ({
  isOpen,
  config,
  transactions,
  onClose,
  onSaveConfig,
  isStandalonePage = false,
  onBackToFrontend,
}) => {
  const [formState, setFormState] = useState<OwnerBusinessConfig>(config);
  const [activeTab, setActiveTab] = useState<TabKey>('payment');
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');

  // Server Feedback Inbox State
  const [feedbackList, setFeedbackList] = useState<CustomerFeedbackItem[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState<boolean>(false);

  // Admin PIN Gate so customers cannot modify owner settings
  const [isPinAuthenticated, setIsPinAuthenticated] = useState<boolean>(false);
  const [pinAttempt, setPinAttempt] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    setFormState(config);
  }, [config]);

  const fetchServerFeedbacks = async () => {
    setIsLoadingFeedback(true);
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.feedbacks)) {
          setFeedbackList(data.feedbacks);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  useEffect(() => {
    if ((isOpen || isStandalonePage) && isPinAuthenticated) {
      fetchServerFeedbacks();
    }
  }, [isOpen, isStandalonePage, isPinAuthenticated]);

  const handleDeleteSingleFeedback = async (id: string) => {
    try {
      const res = await fetch(`/api/feedback/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedbackList((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const handleClearAllFeedback = async () => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedbackList([]);
      }
    } catch {
      // Ignore
    }
  };

  const buildAiStudioPromptForFeedback = (items: CustomerFeedbackItem[]) => {
    if (items.length === 0) return '';
    const lines = items.map(
      (f, idx) =>
        `${idx + 1}. [${f.categoryLabelMalayalam}] "${f.message}" (ആവശ്യപ്പെട്ടത്: ${f.senderName})`
    );
    return `ഉപഭോക്താക്കൾ ഫീഡ്‌ബാക്ക് വഴി ആവശ്യപ്പെട്ട താഴെ പറയുന്ന പുതിയ ഫോമുകളും മാറ്റങ്ങളും നിലവിലുള്ള സംവിധാനങ്ങൾക്ക് ഒരു തകരാറും വരാതെ നമ്മുടെ ആപ്പിൽ ചേർക്കുക:\n\n${lines.join(
      '\n'
    )}`;
  };

  // Generate live UPI QR preview whenever UPI ID changes
  useEffect(() => {
    if (!isOpen && !isStandalonePage) return;
    const upiUri = `upi://pay?pa=${encodeURIComponent(
      formState.upiId || 'parayamprint@okaxis'
    )}&pn=${encodeURIComponent(
      formState.shopName || formState.ownerName || 'Citizen Service Center'
    )}&am=15&cu=INR&tn=${encodeURIComponent('Service Center Test QR')}`;

    QRCode.toDataURL(upiUri, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrPreviewUrl(url))
      .catch(() => setQrPreviewUrl(''));
  }, [isOpen, isStandalonePage, formState.upiId, formState.shopName, formState.ownerName]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen || isStandalonePage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isStandalonePage, onClose]);

  if (!isOpen && !isStandalonePage) return null;

  const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);

  const cleanWaPhone = (formState.whatsappNumber || '919847000000').replace(/[^0-9]/g, '');
  const customerDirectWaLink = `https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(
    `നമസ്കാരം, ${formState.shopName || 'സേവന കേന്ദ്രത്തിൽ'} നിന്ന് എനിക്ക് ഒരു A4 ഡോക്യുമെന്റ് (അപേക്ഷ / രാജിക്കത്ത് / ഗൾഫ് CV / വാടക കരാർ / മാർക്ക് ലിസ്റ്റ്) തയ്യാറാക്കി തരാമോ?`
  )}`;
  // Ensure public URLs always use ais-pre- (Public Shared URL) rather than ais-dev- (Internal Dev Proxy)
  // so any customer or WhatsApp recipient can open the website without "Page not found / Go to gallery" errors
  const getPublicOrigin = () => {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  };

  const publicOrigin = (formState.customDomainUrl || '').trim().replace(/\/+$/, '') || getPublicOrigin();
  const webhookUrl = `${publicOrigin}/api/whatsapp/webhook`;

  // 1. Clean Customer Frontend Website URL (Pure domain without query parameters)
  // All business settings (UPI ID, shop name, location, pricing) are already saved on the server
  // in .owner-config.json and load automatically, providing customers with a short, clean link.
  const customerFrontendUrl = publicOrigin;

  // 2. Owner / Admin Backend Website URL (Dedicated Backend Portal for Owner)
  const adminBackendUrl = `${publicOrigin}?admin=1`;

  const waPromoText = `📄 *${formState.shopName || 'പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)'}*\n📍 ${formState.location || 'കേരളം'}\n📞 ഫോൺ / WhatsApp: ${formState.centerPhone || formState.whatsappNumber}\n\nമലയാളം അപേക്ഷകൾ, ഫോമുകൾ, വാടക കരാർ, ഗൾഫ് CV & സ്കൂൾ-മദ്രസ മാർക്ക് ലിസ്റ്റ് — ഫോണിൽ പറയാം, 10 സെക്കൻഡിൽ A4 PDF ആയി തയ്യാറാക്കാം! കൂടാതെ ഏത് PDF ഫയലും അപ്‌ലോഡ് ചെയ്ത് തിരുത്താം.\n\n👉 ഉടൻ അപേക്ഷ പൂരിപ്പിക്കാൻ ലിങ്കിൽ തൊടുക:\n${customerFrontendUrl}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = pinAttempt.trim();
    if (!entered) {
      setPinError('ദയവായി അഡ്മിൻ പിൻ നമ്പർ നൽകുക.');
      return;
    }
    if (
      entered === 'thaju9526118768' ||
      (config.akshayaPin && entered === config.akshayaPin.trim())
    ) {
      setIsPinAuthenticated(true);
      setPinError('');
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
        setIsPinAuthenticated(true);
        setPinError('');
        return;
      }
    } catch {
      // Ignore network errors
    }
    setPinError('പിൻ നമ്പർ തെറ്റാണ്. ദയവായി ശരിയായ പിൻ നമ്പർ നൽകുക.');
  };

  const handleApplyPresetShop = (name: string, tagline?: string) => {
    setFormState((prev) => ({
      ...prev,
      shopName: name,
      centerTagline: tagline || prev.centerTagline,
    }));
  };

  const handleApplyPresetLocation = (loc: string) => {
    setFormState((prev) => ({
      ...prev,
      location: loc,
    }));
  };

  const handleApplyPricingPreset = (type: 'akshaya' | 'budget' | 'standard') => {
    if (type === 'akshaya') {
      setFormState((prev) => ({
        ...prev,
        pricing: {
          malayalam_letter: 15,
          gulf_cv: 25,
          rental_agreement: 29,
          teacher_marklist: 20,
          pdf_edit: 10,
        },
      }));
    } else if (type === 'budget') {
      setFormState((prev) => ({
        ...prev,
        pricing: {
          malayalam_letter: 10,
          gulf_cv: 15,
          rental_agreement: 20,
          teacher_marklist: 15,
          pdf_edit: 5,
        },
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        pricing: {
          malayalam_letter: 20,
          gulf_cv: 30,
          rental_agreement: 35,
          teacher_marklist: 25,
          pdf_edit: 15,
        },
      }));
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('സേവന കേന്ദ്രത്തിന്റെ വിവരങ്ങൾ ഡിഫോൾട്ട് അവസ്ഥയിലേക്ക് മാറ്റണമെന്നുണ്ടോ?')) {
      setFormState({
        shopName: 'പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)',
        centerTagline:
          'മലയാളം അപേക്ഷകൾ, ഫോമുകൾ, വാടക കരാർ, ഗൾഫ് CV & മാർക്ക് ലിസ്റ്റ് — ഫോണിൽ പറയാം, 10 സെക്കൻഡിൽ തയ്യാറാക്കാം.',
        ownerName: 'Apeksha Desk Online Service',
        location: 'കേരളം (Online Application & PDF Desk)',
        centerPhone: '+91 98470 00000',
        whatsappNumber: '+91 98470 00000',
        email: 'thajudheenabdulrehman@gmail.com',
        workingHours: '24×7 ഓൺലൈൻ അപേക്ഷാ ഡെസ്ക്',
        upiId: 'thajudheenabdulrehman@oksbi',
        akshayaPin: 'thaju9526118768',
        freeModeEnabled: true,
        cartFeatureEnabled: true,
        homePrinterBusinessModeEnabled: false,
        pricing: {
          malayalam_letter: 5,
          gulf_cv: 5,
          rental_agreement: 5,
          teacher_marklist: 5,
          pdf_edit: 5,
        },
        whatsappWebhookToken: 'parayam_print_verify_2026',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formState, pinAttempt.trim());
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      if (!isStandalonePage) {
        onClose();
      }
    }, 1000);
  };

  // PIN Lock View (if not authenticated yet)
  const renderPinGate = () => (
    <div className="p-6 sm:p-8 max-w-md mx-auto text-center space-y-5 my-auto">
      <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
        <Lock className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-malayalam font-extrabold text-base sm:text-lg text-slate-900">
          ഓണർ / അഡ്മിൻ ബാക്ക്-എൻഡ് ലോഗിൻ (Admin Login)
        </h3>
        <p className="font-malayalam text-xs text-slate-600 leading-relaxed">
          നിങ്ങളുടെ UPI ID, ഫോൺ നമ്പർ, സർവീസ് നിരക്കുകൾ എന്നിവ കസ്റ്റമർമാർ മാറ്റാതിരിക്കാൻ അഡ്മിൻ പിൻ നൽകി തുറക്കുക.
        </p>
      </div>

      <form onSubmit={handlePinLogin} className="space-y-3">
        <input
          type="password"
          value={pinAttempt}
          onChange={(e) => setPinAttempt(e.target.value)}
          placeholder="നിങ്ങളുടെ രഹസ്യ അഡ്മിൻ പിൻ നൽകുക"
          autoFocus
          className="w-full min-h-[48px] text-center font-mono-num text-lg font-extrabold tracking-widest bg-slate-50 border border-slate-300 rounded-xl px-4 focus:outline-none focus:border-emerald-700"
        />
        {pinError && (
          <p className="text-xs font-malayalam font-bold text-red-600">{pinError}</p>
        )}

        <div className="pt-1">
          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <Unlock className="w-4 h-4" />
            <span>അഡ്മിൻ പാനൽ തുറക്കുക</span>
          </button>
        </div>
      </form>
    </div>
  );

  const dashboardContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-white border border-slate-200 rounded-2xl w-full overflow-hidden shadow-2xl flex flex-col ${
        isStandalonePage ? 'max-w-5xl mx-auto my-6' : 'max-w-3xl my-4 sm:my-8 max-h-[92vh]'
      }`}
    >
      {/* ===================================================================
          HEADER: Back to Customer Website, Title & Close
         =================================================================== */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white shrink-0">
        <button
          type="button"
          onClick={isStandalonePage && onBackToFrontend ? onBackToFrontend : onClose}
          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-malayalam font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>കസ്റ്റമർ ഫ്രണ്ട്-എൻഡ് വെബ്സൈറ്റിലേക്ക് മടങ്ങുക</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-malayalam font-extrabold text-sm sm:text-base text-white truncate">
              ഓണർ അഡ്മിൻ ബാക്ക്-എൻഡ് പാനൽ (Admin Backend)
            </h2>
          </div>
        </div>

        {!isStandalonePage && (
          <button
            type="button"
            onClick={onClose}
            title="അടയ്ക്കുക (Close)"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isPinAuthenticated ? (
        renderPinGate()
      ) : (
        <>
          {/* ===================================================================
              SEPARATE FRONTEND vs BACKEND LINKS BANNER (Always visible at top!)
             =================================================================== */}
          <div className="bg-emerald-950 text-white px-4 sm:px-6 py-3.5 shrink-0 border-b border-emerald-900 space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Customer Frontend Link */}
              <div className="bg-white/10 border border-emerald-400/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-malayalam font-extrabold uppercase tracking-wider text-emerald-300 block">
                    1. കസ്റ്റമർ ഫ്രണ്ട്-എൻഡ് വെബ്സൈറ്റ് (Customer Website)
                  </span>
                  <p className="text-[11px] font-mono-num font-semibold text-emerald-200 truncate">
                    {customerFrontendUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(customerFrontendUrl, 'topFrontUrl')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-malayalam font-extrabold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedKey === 'topFrontUrl' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>കോപ്പി ചെയ്തു!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>ലിങ്ക് കോപ്പി</span>
                    </>
                  )}
                </button>
              </div>

              {/* Admin Backend Link */}
              <div className="bg-white/10 border border-amber-400/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-malayalam font-extrabold uppercase tracking-wider text-amber-300 block">
                    2. നിങ്ങളുടെ അഡ്മിൻ ബാക്ക്-എൻഡ് (Admin Backend Link)
                  </span>
                  <p className="text-[11px] font-mono-num text-slate-200 truncate">
                    {adminBackendUrl}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(adminBackendUrl, 'topAdminUrl')}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-extrabold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedKey === 'topAdminUrl' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>കോപ്പി ചെയ്തു!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>അഡ്മിൻ ലിങ്ക്</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Center Identity & Revenue Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-malayalam font-bold text-amber-300">
                  🏢 {formState.shopName || 'ഡിജിറ്റൽ ജനസേവന കേന്ദ്രം'}
                </span>
                <span className="text-slate-300 font-mono-num">
                  UPI: <strong className="text-white">{formState.upiId || 'Not set'}</strong>
                </span>
              </div>
              <span className="text-slate-300 font-malayalam">
                ഇതുവരെയുള്ള വരുമാനം:{' '}
                <strong className="text-emerald-300 font-mono-num">₹{totalRevenue}</strong> (
                {transactions.length} ഫയലുകൾ)
              </span>
            </div>
          </div>

          {/* ===================================================================
              NAVIGATION TABS
             =================================================================== */}
          <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50/80 overflow-x-auto shrink-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'payment'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>1. UPI ID & പിൻ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'pricing'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>2. സേവന നിരക്കുകൾ (വില)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('identity')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'identity'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>3. സ്ഥാപനത്തിന്റെ പേര് & ലൊക്കേഷൻ</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'contact'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>4. ഫോൺ & വാട്സാപ്പ്</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'share'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>5. ലിങ്ക് & Google SEO</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('feedback');
                fetchServerFeedbacks();
              }}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeTab === 'feedback'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-100/80 text-amber-950 hover:bg-amber-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>6. 📥 ഫീഡ്‌ബാക്ക് ഇൻബോക്സ് ({feedbackList.length})</span>
            </button>
          </div>

          {/* ===================================================================
              FORM BODY (Scrollable Container)
             =================================================================== */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: PAYMENT & PIN */}
            {activeTab === 'payment' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* UPI Configuration */}
                  <div className="space-y-4">
                    <div className="border-2 border-emerald-500 rounded-xl p-4 bg-emerald-50/50 space-y-3">
                      <label className="block font-malayalam text-xs sm:text-sm font-extrabold text-emerald-950">
                        നിങ്ങളുടെ UPI ID ഇവിടെ നൽകുക (GPay / PhonePe / Paytm)
                      </label>
                      <input
                        type="text"
                        value={formState.upiId}
                        onChange={(e) => setFormState({ ...formState, upiId: e.target.value })}
                        placeholder="yourname@okaxis അല്ലെങ്കിൽ 9847000000@ybl"
                        className="w-full min-h-[46px] font-mono-num font-bold text-sm bg-white border border-emerald-400 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                      />
                      <p className="text-[11px] font-malayalam text-emerald-900">
                        ★ കസ്റ്റമർമാർ ഫ്രണ്ട്-എൻഡ് വെബ്സൈറ്റിൽ QR സ്കാൻ ചെയ്യുമ്പോൾ പണം നേരിട്ട് നിങ്ങളുടെ ഈ UPI അക്കൗണ്ടിലേക്ക് വരും.
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                      <label className="block font-malayalam text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>അഡ്മിൻ ലോഗിൻ പിൻ & സ്റ്റാഫ് അൺലോക്ക് പിൻ (Admin PIN)</span>
                      </label>
                      <input
                        type="text"
                        value={formState.akshayaPin}
                        onChange={(e) =>
                          setFormState({ ...formState, akshayaPin: e.target.value })
                        }
                        placeholder="1234"
                        className="w-full min-h-[44px] font-mono-num font-extrabold text-base bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                      />
                      <p className="text-[11px] font-malayalam text-slate-600">
                        ഈ അഡ്മിൻ പാനൽ തുറക്കാനും, കസ്റ്റമറിൽ നിന്ന് നേരിട്ട് പണം (Cash) വാങ്ങുമ്പോൾ QR സ്കാൻ ചെയ്യാതെ ഫയൽ അൺലോക്ക് ചെയ്യാനും ഈ പിൻ ഉപയോഗിക്കാം.
                      </p>
                    </div>
                  </div>

                  {/* Live QR Code Preview Card */}
                  <div className="border border-emerald-300 rounded-xl p-4 bg-emerald-50/50 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-malayalam font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-700" />
                      <span>നിങ്ങളുടെ ലൈവ് UPI QR കോഡ് ടെസ്റ്റ് പ്രീവ്യൂ</span>
                    </span>
                    <p className="text-[11px] font-malayalam text-emerald-800 mb-3">
                      നിങ്ങളുടെ ഫോണിലെ GPay / PhonePe ക്യാമറ തുറന്ന് സ്കാൻ ചെയ്തു പരിശോധിക്കാം:
                    </p>

                    {qrPreviewUrl ? (
                      <div className="bg-white p-3 rounded-2xl border border-slate-300 shadow-md">
                        <img
                          src={qrPreviewUrl}
                          alt="Test UPI QR"
                          className="w-36 h-36 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-slate-200 rounded-2xl flex items-center justify-center text-xs text-slate-500 font-malayalam">
                        QR ലോഡ് ചെയ്യുന്നു...
                      </div>
                    )}

                    <div className="mt-2.5 font-mono-num text-xs font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                      {formState.upiId || 'No UPI ID'}
                    </div>
                  </div>
                </div>

                {/* Free Mode Toggle */}
                <div className="border border-emerald-300 rounded-xl p-4 bg-emerald-50/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-malayalam font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-700" />
                      <span>100% സൗജന്യ മോഡ് (Free Mode for Citizens)</span>
                    </span>
                    <p className="text-[11px] font-malayalam text-emerald-900">
                      ഇത് ഓഫ് (OFF) ചെയ്താൽ കസ്റ്റമർമാർ നിങ്ങൾ നിശ്ചയിച്ച തുക UPI വഴി അടച്ചാൽ മാത്രമേ PDF ഡൗൺലോഡ് ചെയ്യാൻ സാധിക്കൂ.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formState.freeModeEnabled}
                      onChange={(e) =>
                        setFormState({ ...formState, freeModeEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {/* Home Printer Business & Delivery Mode ON/OFF Toggle Switch (Default: OFF until setup is ready) */}
                <div className="border-2 border-amber-400 rounded-xl p-4 bg-amber-50/80 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-malayalam font-extrabold text-xs sm:text-sm text-amber-950">
                        🏠 ഹോം പ്രിന്റർ പ്രിന്റിംഗ് & ഡെലിവറി ബിസിനസ് മോഡൽ (Business Mode Switch)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-malayalam font-black ${
                          formState.homePrinterBusinessModeEnabled
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-amber-300'
                        }`}
                      >
                        {formState.homePrinterBusinessModeEnabled ? 'ON (പ്രവർത്തനത്തിലാണ്)' : 'OFF (ഓഫ് ചെയ്തിരിക്കുന്നു)'}
                      </span>
                    </div>
                    <p className="text-[11px] font-malayalam text-amber-950 leading-relaxed">
                      <strong>⚠️ ശ്രദ്ധിക്കുക:</strong> പ്രിന്ററും ഡെലിവറി സംവിധാനവും പൂർണ്ണമായി സജ്ജീകരിച്ച ശേഷം മാത്രം ഇത് <strong>ON</strong> ചെയ്യുക. ഇത് <strong>OFF</strong> ആയിരിക്കുമ്പോൾ ഉപഭോക്താക്കൾക്ക് <strong>"🛒 കാർട്ട്"</strong> വഴി 10 ഫയലുകൾ വരെ ഒരുമിച്ച് ചേർത്ത് ഡിജിറ്റൽ PDF ഡൗൺലോഡ് ചെയ്യാൻ മാത്രമേ സാധിക്കൂ (പ്രിന്റ് ചെയ്ത് ഡെലിവറി ചെയ്യും എന്ന വാഗ്ദാനമോ ഓപ്ഷനോ സൈറ്റിൽ കാണിക്കില്ല).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(formState.homePrinterBusinessModeEnabled)}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          homePrinterBusinessModeEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {/* Default Printout Language Setting */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-malayalam font-bold text-xs sm:text-sm text-slate-900">
                      🌐 ഡീഫോൾട്ട് പ്രിന്റ് ഔട്ട് ഭാഷ (Default Printout Language)
                    </span>
                    <p className="text-[11px] font-malayalam text-slate-600">
                      തുടക്കത്തിൽ വെബ്സൈറ്റ് തുറക്കുമ്പോൾ A4 പേപ്പർ ഏത് ഭാഷയിലാണോ വരേണ്ടത് അത് ഇവിടെ തിരഞ്ഞെടുക്കാം (കസ്റ്റമർമാർക്ക് മുകളിൽ നിന്ന് എപ്പോൾ വേണമെങ്കിലും ഭാഷ മാറ്റാനും സാധിക്കും):
                    </p>
                  </div>
                  <select
                    value={formState.defaultOutputLanguage || 'ml'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        defaultOutputLanguage: e.target.value as any,
                      })
                    }
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 font-malayalam font-bold text-xs text-slate-900 focus:outline-none focus:border-emerald-700 cursor-pointer shrink-0"
                  >
                    <option value="ml">മലയാളം (Malayalam - Default)</option>
                    <option value="en">English (ഇംഗ്ലീഷ്)</option>
                    <option value="ar">العربية (അറബിക് / Arabic)</option>
                    <option value="hi">हिंदी (ഹിന്ദി / Hindi)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: PRICING & RATES */}
            {activeTab === 'pricing' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-malayalam font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-emerald-700" />
                      <span>ഓരോ സേവനത്തിന്റെയും ഡൗൺലോഡ് / പ്രിന്റ് നിരക്കുകൾ (₹)</span>
                    </h4>
                    <p className="text-[11px] font-malayalam text-slate-500">
                      കസ്റ്റമർ ഫ്രണ്ട്-എൻഡ് വെബ്സൈറ്റിൽ ഈ നിരക്കുകളാണ് കാണിക്കുക.
                    </p>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-malayalam text-slate-600 font-semibold">
                      പാക്കേജ്:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyPricingPreset('akshaya')}
                      className="px-2.5 py-1 text-xs font-malayalam rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer"
                    >
                      അക്ഷയ നിരക്ക്
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPricingPreset('budget')}
                      className="px-2.5 py-1 text-xs font-malayalam rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer"
                    >
                      കുറഞ്ഞ നിരക്ക്
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPricingPreset('standard')}
                      className="px-2.5 py-1 text-xs font-malayalam rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer"
                    >
                      സാധാരണ നിരക്ക്
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                      1. ഔദ്യോഗിക അപേക്ഷ / രാജിക്കത്ത് / സ്കൂൾ ലീവ്
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricing.malayalam_letter}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricing: {
                              ...formState.pricing,
                              malayalam_letter: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full font-mono-num font-extrabold text-base bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                      2. പ്രവാസി ഗൾഫ് CV (English ATS Bio-Data)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricing.gulf_cv}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricing: {
                              ...formState.pricing,
                              gulf_cv: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full font-mono-num font-extrabold text-base bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                      3. മുദ്രപ്പത്ര വാടക കരാർ & സത്യവാങ്മൂലം
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricing.rental_agreement}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricing: {
                              ...formState.pricing,
                              rental_agreement: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full font-mono-num font-extrabold text-base bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                      4. ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ് (Consolidated Mark List)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-slate-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricing.teacher_marklist || 20}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricing: {
                              ...formState.pricing,
                              teacher_marklist: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full font-mono-num font-extrabold text-base bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/60">
                    <label className="block font-malayalam text-xs font-bold text-emerald-950 mb-1">
                      5. ഏത് PDF അപ്‌ലോഡ് ചെയ്തും തിരുത്തൽ (PDF Touch-Edit)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-num text-emerald-800 font-bold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={formState.pricing.pdf_edit ?? 10}
                        onChange={(e) =>
                          setFormState({
                            ...formState,
                            pricing: {
                              ...formState.pricing,
                              pdf_edit: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full font-mono-num font-extrabold text-base bg-white border border-emerald-400 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: IDENTITY & LOCATION */}
            {activeTab === 'identity' && (
              <div className="space-y-5 animate-fadeIn">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                  <label className="block font-malayalam text-xs font-bold text-slate-900">
                    നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ / സേവന കേന്ദ്രത്തിന്റെ പേര് (Center / Shop Name)
                  </label>
                  <input
                    type="text"
                    value={formState.shopName}
                    onChange={(e) => setFormState({ ...formState, shopName: e.target.value })}
                    placeholder="ഉദാ: പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)"
                    className="w-full min-h-[44px] font-malayalam font-semibold text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                  />

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-malayalam font-semibold text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>വേഗത്തിൽ തിരഞ്ഞെടുക്കാവുന്ന പേരുകൾ:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyPresetShop(
                            'പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)',
                            'മലയാളം അപേക്ഷകൾ, ഫോമുകൾ, വാടക കരാർ, ഗൾഫ് CV & മാർക്ക് ലിസ്റ്റ് — ഫോണിൽ പറയാം, 10 സെക്കൻഡിൽ തയ്യാറാക്കാം.'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-malayalam rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-800 transition-colors cursor-pointer"
                      >
                        + പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyPresetShop(
                            'കേരള PDF സ്റ്റുഡിയോ — ഓൺലൈൻ PDF എഡിറ്റർ & ഫോം മേക്കർ',
                            'അപേക്ഷകൾ, ഗൾഫ് CV, വാടക കരാർ PDF ഡൗൺലോഡ് & എഡിറ്റിംഗ്'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-malayalam rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-800 transition-colors cursor-pointer"
                      >
                        + കേരള PDF സ്റ്റുഡിയോ
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyPresetShop(
                            'ഡിജിറ്റൽ ജനസേവന കേന്ദ്രം (Digital Citizen Service Center)',
                            'ഡിജിറ്റൽ അപേക്ഷകളും പ്രിന്റിംഗും ഗൾഫ് ബയോഡാറ്റയും'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-malayalam rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-400 text-slate-800 transition-colors cursor-pointer"
                      >
                        + ഡിജിറ്റൽ ജനസേവന കേന്ദ്രം
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location & Full Address */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                  <label className="block font-malayalam text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span>ലൊക്കേഷൻ & മേൽവിലാസം (Location / Address)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formState.location || ''}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="ഉദാ: മെയിൻ റോഡ്, ബസ് സ്റ്റാൻഡിന് എതിർവശം, തിരുവനന്തപുരം"
                    className="w-full font-malayalam text-sm bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-emerald-700"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyPresetLocation(
                          'മെയിൻ റോഡ്, കെ.എസ്.ആർ.ടി.സി ബസ് സ്റ്റാൻഡിന് സമീപം'
                        )
                      }
                      className="px-2 py-0.5 text-[11px] font-malayalam rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer"
                    >
                      + ബസ് സ്റ്റാൻഡിന് സമീപം
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleApplyPresetLocation(
                          'ഗ്രാമപഞ്ചായത്ത് ഓഫീസിന് എതിർവശം, മെയിൻ ജംഗ്ഷൻ'
                        )
                      }
                      className="px-2 py-0.5 text-[11px] font-malayalam rounded bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer"
                    >
                      + പഞ്ചായത്ത് ഓഫീസിന് എതിർവശം
                    </button>
                  </div>
                </div>

                {/* Owner / In-charge Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-emerald-700" />
                      <span>ഉടമസ്ഥന്റെ പേര് (Owner Name)</span>
                    </label>
                    <input
                      type="text"
                      value={formState.ownerName}
                      onChange={(e) => setFormState({ ...formState, ownerName: e.target.value })}
                      placeholder="നിങ്ങളുടെ പേര്"
                      className="w-full min-h-[44px] font-malayalam text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <span>പ്രവർത്തന സമയം (Working Hours)</span>
                    </label>
                    <input
                      type="text"
                      value={formState.workingHours || ''}
                      onChange={(e) => setFormState({ ...formState, workingHours: e.target.value })}
                      placeholder="തിങ്കൾ - ശനി: 8:30 AM - 7:30 PM"
                      className="w-full min-h-[44px] font-malayalam text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONTACT DETAILS */}
            {activeTab === 'contact' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                      വാട്സാപ്പ് ബിസിനസ് നമ്പർ (WhatsApp)
                    </label>
                    <input
                      type="text"
                      value={formState.whatsappNumber}
                      onChange={(e) =>
                        setFormState({ ...formState, whatsappNumber: e.target.value })
                      }
                      placeholder="+91 98470 00000"
                      className="w-full min-h-[44px] font-mono-num text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                      ഓഫീസ് ഫോൺ നമ്പർ (Office / Mobile)
                    </label>
                    <input
                      type="text"
                      value={formState.centerPhone || ''}
                      onChange={(e) =>
                        setFormState({ ...formState, centerPhone: e.target.value })
                      }
                      placeholder="0471 2000000 / 98470 00000"
                      className="w-full min-h-[44px] font-mono-num text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-700" />
                      <span>ഇമെയിൽ വിലാസം (Official Email)</span>
                    </label>
                    <input
                      type="email"
                      value={formState.email || ''}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      placeholder="service@email.com"
                      className="w-full min-h-[44px] font-mono-num text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-emerald-700" />
                      <span>യൂസർ ഗൈഡ് വീഡിയോ ലിങ്ക് (YouTube / Video URL - നിർബന്ധമില്ല)</span>
                    </label>
                    <input
                      type="url"
                      value={formState.guideVideoUrl || ''}
                      onChange={(e) =>
                        setFormState({ ...formState, guideVideoUrl: e.target.value })
                      }
                      placeholder="https://youtube.com/watch?v=... (ഒഴിച്ചിട്ടാൽ ബിൽറ്റ്-ഇൻ മലയാളം വീഡിയോ ഗൈഡ് പ്രവർത്തിക്കും)"
                      className="w-full min-h-[44px] font-mono-num text-sm bg-white border border-slate-300 rounded-xl px-3.5 focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SHARE & WEBHOOK */}
            {activeTab === 'share' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Public Access Verified Notice */}
                <div className="bg-emerald-100/90 border border-emerald-400 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="text-lg">🌐</span>
                  <div className="space-y-0.5">
                    <h5 className="font-malayalam font-extrabold text-xs text-emerald-950">
                      പബ്ലിക് വെബ്സൈറ്റ് ലിങ്ക് തയ്യാറാണ് (Public Live URL)
                    </h5>
                    <p className="font-malayalam text-[11px] text-emerald-900 leading-relaxed">
                      താഴെ നൽകിയിരിക്കുന്നത് ഔദ്യോഗിക പബ്ലിക് ലിങ്കാണ് (<code className="font-mono-num font-bold bg-white px-1 py-0.5 rounded text-emerald-800">ais-pre-...</code>). ഇത് ആർക്കും ഏത് മൊബൈലിലും WhatsApp-ലും ലോഗിൻ ആവശ്യമില്ലാതെ സാധാരണ ഒരു വെബ്സൈറ്റ് പോലെ തുറക്കാൻ സാധിക്കും (എഐ സ്റ്റുഡിയോ ലോഗിൻ വേണ്ട).
                    </p>
                  </div>
                </div>

                {/* 1. Customer Frontend Website Link */}
                <div className="border-2 border-emerald-500 rounded-xl p-4 bg-emerald-50/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                        1. കസ്റ്റമർമാർക്ക് അയച്ചു കൊടുക്കാനുള്ള ഫ്രണ്ട്-എൻഡ് വെബ്സൈറ്റ് ലിങ്ക് (Customer Frontend Website)
                      </h4>
                      <p className="text-[11px] font-malayalam text-slate-600">
                        ഈ ലിങ്ക് തുറക്കുന്ന കസ്റ്റമർമാർക്ക് അഡ്മിൻ പാനൽ കാണില്ല. അവർ അടയ്ക്കുന്ന പണം നിങ്ങളുടെ UPI ID-യിലേക്ക് എത്തും.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-emerald-200">
                    <input
                      type="text"
                      readOnly
                      value={customerFrontendUrl}
                      className="flex-1 min-w-[200px] bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-num text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(customerFrontendUrl, 'appShareUrl')}
                      className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-malayalam font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'appShareUrl' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-300" />
                          <span>കോപ്പി ചെയ്തു!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>കസ്റ്റമർ ലിങ്ക് കോപ്പി</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(waPromoText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-[#25D366] hover:bg-emerald-500 text-slate-950 text-xs font-malayalam font-extrabold flex items-center gap-1.5 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>വാട്സാപ്പിൽ അയക്കുക</span>
                    </a>
                  </div>
                </div>

                {/* 2. Owner Admin Backend Website Link */}
                <div className="border border-amber-400 rounded-xl p-4 bg-amber-50/60 space-y-2">
                  <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                    2. നിങ്ങൾക്ക് (ഉടമസ്ഥന്) മാത്രം ഉപയോഗിക്കാനുള്ള അഡ്മിൻ ബാക്ക്-എൻഡ് ലിങ്ക് (Admin Backend URL)
                  </h4>
                  <p className="text-[11px] font-malayalam text-slate-700">
                    വില മാറ്റാനും UPI ID മാറ്റാനും വരുമാനം പരിശോധിക്കാനും ഈ ലിങ്ക് നിങ്ങളുടെ ഫോണിൽ സേവ് ചെയ്തു വെക്കുക (PIN: {formState.akshayaPin || '1234'}):
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={adminBackendUrl}
                      className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-mono-num text-slate-800 font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(adminBackendUrl, 'adminUrlCopy')}
                      className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'adminUrlCopy' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>കോപ്പി ചെയ്തു</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>അഡ്മിൻ ലിങ്ക് കോപ്പി</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Direct Customer WhatsApp Link */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <p className="text-xs font-malayalam text-slate-700 font-semibold">
                    3. ഉപഭോക്താക്കൾക്ക് നിങ്ങളുടെ വാട്സാപ്പിലേക്ക് നേരിട്ട് മെസ്സേജ് അയക്കാനുള്ള ലിങ്ക്:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={customerDirectWaLink}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-num text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(customerDirectWaLink, 'waLink')}
                      className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-malayalam font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'waLink' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>കോപ്പി ചെയ്തു</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>കോപ്പി</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 4. Google Search Console Verification & Custom Domain / Vercel Setup */}
                <div className="border-2 border-sky-400 rounded-2xl p-4 bg-sky-50/70 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-sky-950 flex items-center gap-1.5">
                      <span>🔍 4. ഗൂഗിൾ സെർച്ചിൽ (Google Search Console) സൈറ്റ് ചേർക്കാനും Vercel / Render ഫ്രീ ഡൊമൈൻ എടുക്കാനും:</span>
                    </h4>
                    <p className="font-malayalam text-[11px] text-sky-900 leading-relaxed">
                      മുമ്പ് കോഡിലുണ്ടായിരുന്ന <code className="bg-white px-1 rounded">.ai.studio</code> എന്ന ടെസ്റ്റിംഗ് ലിങ്ക് നീക്കം ചെയ്ത് യഥാർത്ഥ പബ്ലിക് ഡൊമൈൻ (<code className="bg-white px-1 rounded">{publicOrigin}</code>), Sitemap (<code className="bg-white px-1 rounded">{publicOrigin}/sitemap.xml</code>) എന്നിവ ഓട്ടോമാറ്റിക് ആക്കിയിട്ടുണ്ട്.
                    </p>
                  </div>

                  {/* Google Search Console Verification Code Input */}
                  <div className="bg-white border border-sky-200 rounded-xl p-3.5 space-y-2">
                    <label className="block font-malayalam text-xs font-extrabold text-slate-900">
                      A) Google Search Console Verification Code (HTML Tag / Code):
                    </label>
                    <input
                      type="text"
                      value={formState.googleSiteVerification || ''}
                      onChange={(e) => {
                        let raw = e.target.value.trim();
                        const match = raw.match(/content=["']([^"']+)["']/i);
                        if (match && match[1]) {
                          raw = match[1];
                        }
                        setFormState({ ...formState, googleSiteVerification: raw });
                      }}
                      placeholder="ഉദാ: google-site-verification കോഡ് അല്ലെങ്കിൽ <meta name='google-site-verification' content='...' />"
                      className="w-full min-h-[42px] font-mono-num text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 focus:outline-none focus:border-emerald-700"
                    />
                    <p className="font-malayalam text-[11px] text-slate-600">
                      💡 <strong>Google Search Console</strong>-ൽ നിങ്ങളുടെ വെബ്സൈറ്റ് ലിങ്ക് നൽകി <strong>"HTML tag"</strong> അല്ലെങ്കിൽ <strong>"HTML file"</strong> എന്ന ഓപ്ഷനിൽ കിട്ടുന്ന കോഡ് ഇവിടെ പേസ്റ്റ് ചെയ്ത് താഴെ <strong>"മാറ്റങ്ങൾ സേവ് ചെയ്യുക"</strong> അമർത്തിയാൽ ഉടൻ തന്നെ Google Verification പൂർത്തിയാകും!
                    </p>
                  </div>

                  {/* Custom / Vercel / Netlify / Render Domain Input */}
                  <div className="bg-white border border-sky-200 rounded-xl p-3.5 space-y-2">
                    <label className="block font-malayalam text-xs font-extrabold text-slate-900">
                      B) കസ്റ്റം ഡൊമൈൻ / Vercel / Render ലിങ്ക് (ഉണ്ടെങ്കിൽ മാത്രം ചേർക്കുക):
                    </label>
                    <input
                      type="url"
                      value={formState.customDomainUrl || ''}
                      onChange={(e) =>
                        setFormState({ ...formState, customDomainUrl: e.target.value })
                      }
                      placeholder="ഉദാ: https://epaper-kerala.vercel.app അല്ലെങ്കിൽ https://epaperkerala.in"
                      className="w-full min-h-[42px] font-mono-num text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 focus:outline-none focus:border-emerald-700"
                    />
                    <p className="font-malayalam text-[11px] text-slate-600">
                      നിങ്ങൾ Vercel / Render / സ്വന്തം ഡൊമൈനിലേക്ക് സൈറ്റ് മാറ്റുമ്പോൾ ആ പുതിയ ലിങ്ക് ഇവിടെ നൽകിയാൽ ഷെയർ ബട്ടണുകളിലും Sitemap-ലും ആ പേര് വരും.
                    </p>
                  </div>

                  {/* Ready-to-use Vercel / Render / Netlify Config Guide */}
                  <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2 text-[11px] font-malayalam">
                    <p className="font-extrabold text-amber-300 text-xs">
                      🚀 ചെറുതും മനോഹരവുമായ സൗജന്യ ലിങ്ക് (epaper-kerala.vercel.app / onrender.com) എങ്ങനെ എടുക്കാം?
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      ഈ പ്രോജക്റ്റിൽ നമ്മൾ <strong>vercel.json</strong>, <strong>netlify.toml</strong>, <strong>render.yaml</strong> എന്നീ ഫയലുകൾ സജ്ജമാക്കി വെച്ചിട്ടുണ്ട്:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-emerald-200">
                      <li>AI Studio-യുടെ മുകളിൽ വലതുവശത്തുള്ള <strong>Export to GitHub</strong> (അല്ലെങ്കിൽ <strong>Download ZIP</strong>) ക്ലിക്ക് ചെയ്യുക.</li>
                      <li><strong>Render.com</strong> അല്ലെങ്കിൽ <strong>Vercel.com</strong>-ൽ സൗജന്യമായി ലോഗിൻ ചെയ്ത് ആ GitHub പ്രോജക്റ്റ് സെലക്ട് ചെയ്യുക (ഒരു കോഡും മാറ്റേണ്ടതില്ല).</li>
                      <li>നിമിഷങ്ങൾക്കകം <code className="text-amber-300">epaper-kerala.vercel.app</code> പോലെയുള്ള ചെറിയ ലിങ്ക് ലഭിക്കും. ആ ലിങ്ക് നേരിട്ട് Google Search Console-ൽ ചേർക്കാം!</li>
                    </ol>
                  </div>
                </div>

                {/* 5. Meta WhatsApp Cloud API Webhook */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <p className="text-xs font-malayalam text-slate-700 font-semibold">
                    5. Meta WhatsApp Cloud API Webhook URL:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-num text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookUrl, 'webhook')}
                      className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-malayalam font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === 'webhook' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>കോപ്പി ചെയ്തു</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>കോപ്പി</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SERVER FEEDBACK INBOX & AI STUDIO PROMPT GENERATOR */}
            {activeTab === 'feedback' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-amber-950 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-700" />
                        <span>
                          കസ്റ്റമർ ഫീഡ്‌ബാക്ക് & പുതിയ ഫോം ആവശ്യങ്ങൾ ({feedbackList.length} / 200)
                        </span>
                      </h4>
                      <p className="font-malayalam text-[11px] text-amber-900 mt-0.5">
                        സെർവർ ജാം ആകാതിരിക്കാൻ പരമാവധി 200 ഫീഡ്‌ബാക്കുകൾ വരെ സൂക്ഷിക്കുകയും ആവശ്യമില്ലാത്തവ നിങ്ങൾക്ക് എപ്പോൾ വേണമെങ്കിലും ഡിലീറ്റ് ചെയ്യാനും സാധിക്കും.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchServerFeedbacks}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-amber-300 text-xs font-malayalam font-bold text-slate-800 cursor-pointer"
                      >
                        🔄 പുതുക്കുക (Refresh)
                      </button>

                      {feedbackList.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                buildAiStudioPromptForFeedback(feedbackList),
                                'allFeedbackPrompt'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-malayalam font-extrabold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            {copiedKey === 'allFeedbackPrompt' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-amber-300" />
                                <span>AI പ്രോംപ്റ്റ് കോപ്പി ചെയ്തു!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>📋 എല്ലാം AI പ്രോംപ്റ്റായി കോപ്പി ചെയ്യുക</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleClearAllFeedback}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>എല്ലാം ഡിലീറ്റ് ചെയ്യുക (Clear All)</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isLoadingFeedback ? (
                  <div className="p-8 text-center text-xs font-malayalam text-slate-500">
                    ഫീഡ്‌ബാക്കുകൾ സെർവറിൽ നിന്ന് ലോഡ് ചെയ്യുന്നു...
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-2 bg-slate-50">
                    <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-malayalam font-bold text-xs sm:text-sm text-slate-700">
                      നിലവിൽ സെർവറിൽ ഫീഡ്‌ബാക്കുകൾ ഒന്നും തന്നെയില്ല.
                    </p>
                    <p className="font-malayalam text-[11px] text-slate-500">
                      കസ്റ്റമർമാർ ഫ്രണ്ട്-എൻഡ് വെബ്സൈറ്റിലെ "💬 അഭിപ്രായം / പുതിയ ഫോം" ബട്ടൺ വഴി അയക്കുന്ന എല്ലാ വിവരങ്ങളും ഇവിടെ കാണാം.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {feedbackList.map((item) => (
                      <div
                        key={item.id}
                        className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-emerald-300 transition-colors space-y-2 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[11px] font-malayalam font-extrabold ${
                                item.category === 'new_form'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : item.category === 'improvement'
                                  ? 'bg-amber-100 text-amber-950'
                                  : 'bg-sky-100 text-sky-900'
                              }`}
                            >
                              {item.categoryLabelMalayalam}
                            </span>
                            <span className="font-malayalam font-bold text-xs text-slate-900">
                              👤 {item.senderName}
                            </span>
                            {item.senderPhone && (
                              <a
                                href={`https://wa.me/${item.senderPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono-num text-xs text-emerald-700 font-bold underline"
                              >
                                📞 {item.senderPhone}
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-[11px] text-slate-500">
                              {item.createdAt}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  buildAiStudioPromptForFeedback([item]),
                                  `fb_${item.id}`
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-malayalam font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `fb_${item.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span>കോപ്പി ആയി!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>AI പ്രോംപ്റ്റ് കോപ്പി</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingleFeedback(item.id)}
                              title="ഈ ഫീഡ്‌ബാക്ക് ഡിലീറ്റ് ചെയ്യുക"
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-[11px] font-malayalam font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>ഡിലീറ്റ്</span>
                            </button>
                          </div>
                        </div>

                        <p className="font-malayalam text-xs sm:text-sm text-slate-800 bg-slate-50 rounded-lg p-2.5 border border-slate-100 whitespace-pre-line">
                          {item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================================
                FOOTER ACTION BAR: Reset, Saved Notice, and Save Changes
               =================================================================== */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-malayalam text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ഡിഫോൾട്ട് ആക്കുക</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                {savedNotice && (
                  <span className="text-xs font-malayalam font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>സെർവറിൽ സേവ് ചെയ്തു!</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-malayalam font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>സേവ് ചെയ്യുക (Save Changes)</span>
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-slate-900 p-3 sm:p-6 flex flex-col">
        {dashboardContent}
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
    >
      {dashboardContent}
    </div>
  );
};
