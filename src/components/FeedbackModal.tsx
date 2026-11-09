import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquare,
  Mic,
  Send,
  Share2,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { OwnerBusinessConfig } from '../types/documents';

export type FeedbackCategoryType = 'new_form' | 'improvement' | 'general';

export interface CustomerFeedbackItem {
  id: string;
  category: FeedbackCategoryType;
  categoryLabelMalayalam: string;
  senderName: string;
  senderPhone: string;
  message: string;
  createdAt: string;
}

interface FeedbackModalProps {
  isOpen: boolean;
  ownerConfig: OwnerBusinessConfig;
  activeCategory?: string;
  activeDocumentTitle?: string;
  onClose: () => void;
  onSubmitted?: (item: CustomerFeedbackItem) => void;
}

const FEEDBACK_CATEGORIES: Array<{
  key: FeedbackCategoryType;
  labelMalayalam: string;
  badge: string;
  placeholder: string;
}> = [
  {
    key: 'new_form',
    labelMalayalam: '1. പുതിയ ഫോം / അപേക്ഷ ചേർക്കാൻ',
    badge: '📋 പുതിയ ഫോം',
    placeholder:
      'ഉദാ: "പാസ്പോർട്ട് വെരിഫിക്കേഷൻ അപേക്ഷാ ഫോം കൂടി ചേർക്കണം" അല്ലെങ്കിൽ "കെട്ടിട നിർമ്മാണ തൊഴിലാളി ക്ഷേമനിധി ഫോം വേണം"...',
  },
  {
    key: 'improvement',
    labelMalayalam: '2. തിരുത്തലുകൾ / മാറ്റങ്ങൾ നിർദ്ദേശിക്കാൻ',
    badge: '🔧 മാറ്റങ്ങൾ',
    placeholder:
      'ഉദാ: "ജാതി സർട്ടിഫിക്കറ്റ് ഫോമിൽ താലൂക്കിന്റെ പേര് കൂടി എഡിറ്റ് ചെയ്യാൻ കോളം വേണം"...',
  },
  {
    key: 'general',
    labelMalayalam: '3. പൊതുവായ അഭിപ്രായം / പ്രശംസ',
    badge: '⭐ അഭിപ്രായം',
    placeholder: 'ഈ വെബ്സൈറ്റിനെക്കുറിച്ചുള്ള നിങ്ങളുടെ അഭിപ്രായം ഇവിടെ എഴുതുകയോ വോയ്‌സ് വഴി പറയുകയോ ചെയ്യാം...',
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  ownerConfig,
  onClose,
  onSubmitted,
}) => {
  const [category, setCategory] = useState<FeedbackCategoryType>('new_form');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedItem, setSubmittedItem] = useState<CustomerFeedbackItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Voice Dictation State for Feedback Box
  const [isDictating, setIsDictating] = useState(false);
  const speechRecRef = useRef<any>(null);

  if (!isOpen) return null;

  const activeCatObj =
    FEEDBACK_CATEGORIES.find((c) => c.key === category) || FEEDBACK_CATEGORIES[0];

  const stopVoiceDictation = () => {
    if (speechRecRef.current) {
      try {
        speechRecRef.current.onresult = null;
        speechRecRef.current.onend = null;
        speechRecRef.current.onerror = null;
        speechRecRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecRef.current = null;
    }
    setIsDictating(false);
  };

  const handleToggleVoiceDictation = () => {
    if (isDictating) {
      stopVoiceDictation();
      return;
    }

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMsg('നിങ്ങളുടെ ബ്രൗസറിൽ വോയ്‌സ് ടൈപ്പിംഗ് ലഭ്യമല്ല. ദയവായി താഴെ ടൈപ്പ് ചെയ്യുക.');
      return;
    }

    try {
      setErrorMsg('');
      setIsDictating(true);
      const rec = new SpeechRec();
      rec.lang = 'ml-IN';
      rec.continuous = true;
      rec.interimResults = true;
      const baseText = message ? `${message.trim()} ` : '';

      rec.onresult = (ev: any) => {
        let spoken = '';
        for (let i = 0; i < ev.results.length; i++) {
          spoken += (ev.results[i][0]?.transcript || '') + ' ';
        }
        if (spoken.trim()) {
          setMessage(`${baseText}${spoken.trim()}`);
        }
      };
      rec.onend = () => setIsDictating(false);
      rec.onerror = () => setIsDictating(false);
      rec.start();
      speechRecRef.current = rec;
    } catch {
      setIsDictating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDictating) stopVoiceDictation();

    const cleanMsg = message.trim();
    if (!cleanMsg) {
      setErrorMsg('ദയവായി നിങ്ങളുടെ അഭിപ്രായമോ ആവശ്യമുള്ള ഫോമിന്റെ വിവരമോ രേഖപ്പെടുത്തുക.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          categoryLabelMalayalam: activeCatObj.labelMalayalam,
          senderName: senderName.trim() || 'പൗരൻ / ഉപഭോക്താവ്',
          senderPhone: senderPhone.trim() || '',
          message: cleanMsg,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ഫീഡ്‌ബാക്ക് അയക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
      }
      setSubmittedItem(data.feedback);
      if (onSubmitted && data.feedback) {
        onSubmitted(data.feedback);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'ഫീഡ്‌ബാക്ക് സെർവറിൽ സേവ് ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanWaPhone = (ownerConfig.whatsappNumber || '919847000000').replace(/[^0-9]/g, '');
  const targetEmail = ownerConfig.email || 'thajudheenabdulrehman@gmail.com';

  const formattedShareText = `*📢 ഉപഭോക്തൃ ഫീഡ്‌ബാക്ക് / പുതിയ ഫോം ആവശ്യം*\n• വിഭാഗം: ${activeCatObj.labelMalayalam}\n• പേര്: ${
    senderName.trim() || 'നൽകിയിട്ടില്ല'
  }\n• ഫോൺ: ${senderPhone.trim() || 'നൽകിയിട്ടില്ല'}\n\n*സന്ദേശം:*\n${message.trim()}`;

  const waUrl = `https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(formattedShareText)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(
    targetEmail
  )}?subject=${encodeURIComponent(
    `[Parayam PrintEdukkam Feedback] ${activeCatObj.badge}`
  )}&body=${encodeURIComponent(formattedShareText)}`;

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/60 backdrop-blur-xs pt-2 sm:pt-6 p-2.5 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-[#075E54] to-emerald-800 text-white px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-malayalam font-extrabold text-sm sm:text-base text-white">
                അഭിപ്രായം & പുതിയ ഫോം ആവശ്യപ്പെടാം
              </h3>
              <p className="font-malayalam text-[11px] text-emerald-100">
                നിങ്ങളുടെ നിർദ്ദേശങ്ങൾ നേരിട്ട് അഡ്മിൻ പാനലിലേക്ക് സേവ് ചെയ്യപ്പെടും!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedItem ? (
          <div className="p-5 sm:p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-malayalam font-extrabold text-base text-slate-900">
                നന്ദി! നിങ്ങളുടെ ഫീഡ്‌ബാക്ക് സെർവറിൽ രേഖപ്പെടുത്തിയിട്ടുണ്ട്.
              </h4>
              <p className="font-malayalam text-xs text-slate-600 leading-relaxed">
                അഡ്മിൻ പാനലിലെ ഫീഡ്‌ബാക്ക് ഇൻബോക്സിൽ ഇത് ലഭ്യമാണ്. ഉടൻ തന്നെ പരിശോധിച്ച് ആവശ്യമായ പുതിയ ഫോമുകളും മാറ്റങ്ങളും ചേർക്കുന്നതാണ്.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left space-y-1 text-xs font-malayalam">
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                {submittedItem.categoryLabelMalayalam}
              </span>
              <p className="text-slate-800 font-medium pt-1">"{submittedItem.message}"</p>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-malayalam font-bold text-slate-600">
                കൂടാതെ വാട്സാപ്പിലോ ഇമെയിലിലോ നേരിട്ട് അയക്കണമെന്നുണ്ടെങ്കിൽ:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>വാട്സാപ്പിൽ കൂടി അയക്കുക</span>
                </a>
                <a
                  href={mailtoUrl}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-malayalam font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>ഇമെയിലിൽ അയക്കുക</span>
                </a>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubmittedItem(null);
                  setMessage('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-malayalam font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                മറ്റൊരു അഭിപ്രായം കൂടി ചേർക്കുക
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-malayalam font-extrabold cursor-pointer"
              >
                അടയ്ക്കുക
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Category Picker */}
            <div className="space-y-1.5">
              <label className="block font-malayalam font-bold text-xs text-slate-900">
                എന്തിനെക്കുറിച്ചാണ് അറിയിക്കാനുള്ളത്?
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {FEEDBACK_CATEGORIES.map((cat) => {
                  const selected = category === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCategory(cat.key)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-malayalam font-bold flex items-center justify-between transition-all cursor-pointer ${
                        selected
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-600'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{cat.labelMalayalam}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                          selected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {cat.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Input + Voice Dictation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="font-malayalam font-bold text-xs text-slate-900">
                  നിങ്ങളുടെ നിർദ്ദേശം / ആവശ്യമുള്ള ഫോം: <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleToggleVoiceDictation}
                  className={`px-3 py-1 rounded-lg text-xs font-malayalam font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDictating
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {isDictating ? (
                    <>
                      <Square className="w-3 h-3 fill-white" />
                      <span>പറയുന്നത് നിർത്തുക</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>🎙️ വോയ്‌സ് വഴി പറയാം</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={activeCatObj.placeholder}
                className={`w-full rounded-xl border p-3 text-xs sm:text-sm font-malayalam text-slate-900 focus:outline-none ${
                  isDictating
                    ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20'
                    : 'border-slate-300 focus:border-emerald-700 bg-white'
                }`}
              />
            </div>

            {/* Optional Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block font-malayalam font-semibold text-[11px] text-slate-700 mb-1">
                  നിങ്ങളുടെ പേര് (നിർബന്ധമില്ല)
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="നിങ്ങളുടെ പേര്..."
                  className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3 text-xs font-malayalam focus:outline-none focus:border-emerald-700"
                />
              </div>
              <div>
                <label className="block font-malayalam font-semibold text-[11px] text-slate-700 mb-1">
                  ഫോൺ / വാട്സാപ്പ് നമ്പർ (നിർബന്ധമില്ല)
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="98470 00000"
                  className="w-full min-h-[40px] rounded-xl border border-slate-300 px-3 text-xs font-mono-num focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-malayalam font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded-xl border border-slate-300 text-xs font-malayalam font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                റദ്ദാക്കുക
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-malayalam font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>സേവ് ചെയ്യുന്നു...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ഫീഡ്‌ബാക്ക് അയക്കുക (Save to Server)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
