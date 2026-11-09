import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, render a clean badge or null
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-malayalam font-bold text-emerald-800 shrink-0">
        ✓ ആപ്പ്
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title="മൊബൈൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക"
        className="flex items-center justify-center gap-1 min-h-[34px] sm:min-h-[38px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 sm:px-3 py-1 text-xs font-malayalam font-extrabold shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">ആപ്പ് ഇൻസ്റ്റാൾ</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="മൊബൈൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക (iOS)"
          className="flex items-center justify-center gap-1 min-h-[34px] sm:min-h-[38px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 sm:px-3 py-1 text-xs font-malayalam font-extrabold shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">ആപ്പ് ഇൻസ്റ്റാൾ</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-malayalam font-bold text-base text-slate-900">
                  iPhone / iPad-ൽ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാൻ
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-malayalam text-xs text-slate-700 leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 text-sm">1.</span>
                  <span>സഫാരി ബ്രൗസറിന്റെ താഴെയുള്ള <strong>Share (ഷെയർ) ⎋</strong> ഐക്കൺ അമർത്തുക.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 text-sm">2.</span>
                  <span>താഴേക്ക് സ്ക്രോൾ ചെയ്ത് <strong>"Add to Home Screen" (ഹോം സ്ക്രീനിലേക്ക് ചേർക്കുക) ⊞</strong> തിരഞ്ഞെടുക്കുക.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-emerald-700 text-sm">3.</span>
                  <span>മുകളിൽ വലതുവശത്തുള്ള <strong>Add</strong> അമർത്തുക. ഇപ്പോൾ നിങ്ങളുടെ ഫോണിൽ ആപ്പ് റെഡി!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[42px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-malayalam font-bold text-xs cursor-pointer"
              >
                മനസ്സിലായി (ശരി)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
