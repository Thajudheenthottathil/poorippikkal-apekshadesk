import React, { useState, useRef, useEffect } from 'react';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Landmark,
  Home,
  GraduationCap,
  FilePenLine,
} from 'lucide-react';
import { DocumentCategory } from '../types/documents';

export interface ServiceItem {
  id: DocumentCategory | 'pdf_edit';
  title: string;
  tagline: string;
  iconBg: string;
   desktopDesc: string;
  badge: string;
  bgGradient: string;
  activeBorder: string;
  accentColor: string;
}

export const SERVICE_ITEMS: ServiceItem[] = [
  {
    id: 'gulf_cv',
    title: 'ജോബ് CV',
    tagline: 'All Jobs · 8 Models',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-700 text-white border-sky-300 shadow-[0_3px_8px_rgba(2,132,199,0.35)]',
    desktopDesc: 'IT, ടീച്ചർ, നേഴ്സ്, ഫ്രഷർ, ഓഫീസ്, UK/EU & ഗൾഫ് CV',
    badge: 'ഏറ്റവും പുതിയ ATS ഫോർമാറ്റ്',
    bgGradient: 'from-sky-50 via-white to-sky-100/60',
    activeBorder: 'border-sky-500 shadow-[0_6px_0_0_#0284c7,0_18px_32px_-6px_rgba(14,165,133,0.35)]',
    accentColor: 'text-sky-800 bg-sky-100 border-sky-300',
  },
  {
    id: 'malayalam_letter',
    title: 'സർക്കാർ അപേക്ഷ',
    tagline: 'വില്ലേജ് · പഞ്ചായത്ത്',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-emerald-300 shadow-[0_3px_8px_rgba(5,150,105,0.35)]',
    desktopDesc: 'വില്ലേജ്, പഞ്ചായത്ത്, റേഷൻ, രാജിക്കത്ത്, സ്കൂൾ ലീവ്',
    badge: 'ഔദ്യോഗിക ഭരണഭാഷാ ശൈലി',
    bgGradient: 'from-emerald-50 via-white to-emerald-100/60',
    activeBorder: 'border-emerald-600 shadow-[0_6px_0_0_#047857,0_18px_32px_-6px_rgba(5,150,105,0.35)]',
    accentColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
  },
  {
    id: 'rental_agreement',
    title: 'വാടകക്കരാർ',
    tagline: 'മുദ്രപ്പത്രം · Stamp Paper',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-300 shadow-[0_3px_8px_rgba(217,119,6,0.35)]',
    desktopDesc: 'വീട് / കടമുറി കരാർ, 11 മാസ കേരള നിയമ വ്യവസ്ഥകൾ',
    badge: 'മുദ്രപ്പത്രം ഗ്യാപ്പ് അഡ്ജസ്റ്റ്',
    bgGradient: 'from-amber-50 via-white to-amber-100/60',
    activeBorder: 'border-amber-500 shadow-[0_6px_0_0_#b45309,0_18px_32px_-6px_rgba(245,158,11,0.35)]',
    accentColor: 'text-amber-900 bg-amber-100 border-amber-300',
  },
  {
    id: 'teacher_marklist',
    title: 'മാർക്ക് ലിസ്റ്റ്',
    tagline: 'സ്കൂൾ · മദ്രസ',
    iconBg: 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-300 shadow-[0_3px_8px_rgba(126,34,206,0.35)]',
    desktopDesc: 'സ്കൂൾ, മദ്രസ, ട്യൂഷൻ പരീക്ഷാ ടാബുലേഷൻ ടേബിൾ',
    badge: 'ഓട്ടോ ഗ്രേഡിംഗ് സിസ്റ്റം',
    bgGradient: 'from-purple-50 via-white to-purple-100/60',
    activeBorder: 'border-purple-600 shadow-[0_6px_0_0_#7e22ce,0_18px_32px_-6px_rgba(147,51,234,0.35)]',
    accentColor: 'text-purple-900 bg-purple-100 border-purple-300',
  },
  {
    id: 'pdf_edit',
    title: 'PDF തിരുത്താം',
    tagline: 'Upload & Edit Any PDF',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-700 text-white border-rose-300 shadow-[0_3px_8px_rgba(225,29,72,0.35)]',
    desktopDesc: 'പഴയ PDF അപ്‌ലോഡ് ചെയ്ത് പേപ്പറിലെ അക്ഷരങ്ങൾ നേരിട്ട് തിരുത്താം',
    badge: 'ഡയറക്റ്റ് ടച്ച് എഡിറ്റിംഗ്',
    bgGradient: 'from-rose-50 via-white to-rose-100/60',
    activeBorder: 'border-rose-500 shadow-[0_6px_0_0_#be123c,0_18px_32px_-6px_rgba(244,63,94,0.35)]',
    accentColor: 'text-rose-900 bg-rose-100 border-rose-300',
  },
];

function renderServiceVectorIcon(id: ServiceItem['id'], className = 'w-5 h-5') {
  switch (id) {
    case 'gulf_cv':
      return <Briefcase className={`${className} stroke-[2.2]`} />;
    case 'malayalam_letter':
      return <Landmark className={`${className} stroke-[2.2]`} />;
    case 'rental_agreement':
      return <Home className={`${className} stroke-[2.2]`} />;
    case 'teacher_marklist':
      return <GraduationCap className={`${className} stroke-[2.2]`} />;
    case 'pdf_edit':
      return <FilePenLine className={`${className} stroke-[2.2]`} />;
  }
}

interface ThreeDServiceCarouselProps {
  activeCategory: DocumentCategory;
  isPdfEditSession: boolean;
  onSelectCategory: (cat: DocumentCategory) => void;
  onOpenPdfUpload: () => void;
}

export function ThreeDServiceCarousel({
  activeCategory,
  isPdfEditSession,
  onSelectCategory,
  onOpenPdfUpload,
}: ThreeDServiceCarouselProps) {
  // Map current active document in app to index 0..4
  const selectedIdx = React.useMemo(() => {
    if (isPdfEditSession) return 4;
    switch (activeCategory) {
      case 'gulf_cv':
        return 0;
      case 'malayalam_letter':
        return 1;
      case 'rental_agreement':
        return 2;
      case 'teacher_marklist':
        return 3;
      default:
        return 1;
    }
  }, [activeCategory, isPdfEditSession]);

  // Visual wheel rotation index (spins freely without forcing selection)
  const [wheelIndex, setWheelIndex] = useState<number>(selectedIdx);

  // Sync wheel to active category when category changes externally
  useEffect(() => {
    setWheelIndex(selectedIdx);
  }, [selectedIdx]);

  // Explicit selection on card tap/click
  const handleSelectItem = (idx: number) => {
    setWheelIndex(idx);
    const item = SERVICE_ITEMS[idx];
    if (item.id === 'pdf_edit') {
      onOpenPdfUpload();
    } else {
      onSelectCategory(item.id as DocumentCategory);
    }
  };

  // Rotate wheel without immediately changing the active document
  const handleNext = (steps: number = 1) => {
    setWheelIndex((prev) => (prev + steps) % SERVICE_ITEMS.length);
  };

  const handlePrev = (steps: number = 1) => {
    setWheelIndex((prev) => (prev - steps + SERVICE_ITEMS.length * 5) % SERVICE_ITEMS.length);
  };

  // Touch drag tracking for rapid multi-card momentum spinning
  const touchStartXRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    const elapsed = Math.max(1, Date.now() - touchStartTimeRef.current);
    const velocity = Math.abs(diff) / elapsed; // px per ms

    if (Math.abs(diff) > 20) {
      let steps = 1;
      if (Math.abs(diff) > 130 || velocity > 0.8) {
        steps = 3;
      } else if (Math.abs(diff) > 65 || velocity > 0.45) {
        steps = 2;
      }

      if (diff > 0) {
        handlePrev(steps);
      } else {
        handleNext(steps);
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="w-full select-none">
      {/* =====================================================================
          MOBILE 3D CIRCULAR OVERLAPPING WHEEL (< lg)
         ===================================================================== */}
      <div className="block lg:hidden relative py-1.5">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="stage-3d-orbit relative h-[112px] sm:h-[122px] flex items-center justify-center overflow-visible"
        >
          {SERVICE_ITEMS.map((item, idx) => {
            const n = SERVICE_ITEMS.length;
            let offset = (idx - wheelIndex) % n;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;

            const isHero = offset === 0;
            const isCurrentlySelected = idx === selectedIdx;

            let transform = '';
            let zIndex = 10;
            let opacity = 0.65;
            let pointerEvents: 'auto' | 'none' = 'auto';

            if (isHero) {
              transform = 'translate3d(0, 0, 42px) scale(0.98) rotateY(0deg)';
              zIndex = 30;
              opacity = 1;
            } else if (offset === 1) {
              transform = 'translate3d(96px, 3px, 15px) scale(0.84) rotateY(-18deg) rotateZ(2deg)';
              zIndex = 20;
              opacity = 0.9;
            } else if (offset === -1) {
              transform = 'translate3d(-96px, 3px, 15px) scale(0.84) rotateY(18deg) rotateZ(-2deg)';
              zIndex = 20;
              opacity = 0.9;
            } else if (offset === 2) {
              transform = 'translate3d(154px, 7px, -20px) scale(0.72) rotateY(-28deg) rotateZ(3.5deg)';
              zIndex = 10;
              opacity = 0.7;
            } else if (offset === -2) {
              transform = 'translate3d(-154px, 7px, -20px) scale(0.72) rotateY(28deg) rotateZ(-3.5deg)';
              zIndex = 10;
              opacity = 0.7;
            }

            return (
              <div
                key={item.id}
                onClick={() => handleSelectItem(idx)}
                style={{
                  transform,
                  zIndex,
                  opacity,
                  pointerEvents,
                }}
                className="card-3d-orbit-item absolute w-[62%] max-w-[232px] cursor-pointer"
              >
                <div
                  className={`relative p-2.5 rounded-xl bg-gradient-to-br ${item.bgGradient} border-2 transition-all ${
                    isCurrentlySelected
                      ? `${item.activeBorder} ring-2 ring-emerald-500/25`
                      : isHero
                      ? 'border-emerald-400 shadow-[0_6px_16px_rgba(16,185,129,0.2)]'
                      : 'border-slate-300 shadow-[0_4px_12px_rgba(15,23,42,0.12)] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg} ${
                        isHero ? 'scale-105' : 'opacity-95'
                      }`}
                    >
                      {renderServiceVectorIcon(item.id, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-malayalam font-black text-xs sm:text-sm text-slate-900 leading-tight truncate">
                          {item.title}
                        </h3>
                        {isCurrentlySelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="font-malayalam text-[10px] font-bold text-slate-600 mt-0.5 truncate">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  {isHero && (
                    <div className="mt-1.5 pt-1 border-t border-slate-200/80 flex items-center justify-between text-[9px] font-malayalam">
                      {isCurrentlySelected ? (
                        <span className="text-emerald-800 font-extrabold flex items-center gap-0.5 truncate">
                          <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                          നിലവിലെ ഫോം
                        </span>
                      ) : (
                        <span className="text-amber-800 font-black flex items-center gap-0.5 truncate bg-amber-100/90 px-1.5 py-0.5 rounded">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          തിരഞ്ഞെടുക്കുക
                        </span>
                      )}
                      <span className="text-slate-500 font-bold shrink-0">തൊടാം ➔</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3D Round Orbit Navigation Controls */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={() => handlePrev(1)}
            title="മുൻപത്തെ സേവനം"
            className="btn-round-3d w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#94a3b8] active:translate-y-0.5 active:shadow-[0_1px_0_0_#94a3b8]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* 3D Orbit Position Dots */}
          <div className="flex items-center gap-1.5">
            {SERVICE_ITEMS.map((it, idx) => {
              const isCenter = idx === wheelIndex;
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setWheelIndex(idx)}
                  title={it.title}
                  className={`transition-all rounded-full cursor-pointer ${
                    isCenter
                      ? 'w-6 h-2 bg-emerald-600 rounded-full shadow-xs'
                      : isSelected
                      ? 'w-3 h-2 bg-emerald-400 rounded-full'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleNext(1)}
            title="അടുത്ത സേവനം"
            className="btn-round-3d w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#94a3b8] active:translate-y-0.5 active:shadow-[0_1px_0_0_#94a3b8]"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          DESKTOP 5-COLUMN PANORAMIC 3D GRID (>= lg)
         ===================================================================== */}
      <div className="hidden lg:grid grid-cols-5 gap-3 pt-0.5">
        {SERVICE_ITEMS.map((item, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectItem(idx)}
              className={`p-3.5 rounded-2xl text-left cursor-pointer flex items-start gap-3 transition-all ${
                isSelected
                  ? `${item.activeBorder} bg-gradient-to-br ${item.bgGradient} scale-[1.02] z-10 border-2`
                  : 'card-3d-tile bg-white text-slate-900 border-slate-300'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${item.iconBg}`}
              >
                {renderServiceVectorIcon(item.id, 'w-5 h-5')}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-malayalam font-black text-sm text-slate-900 leading-tight">
                    {item.title}
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-bold text-slate-600 mt-0.5 truncate">
                  {item.tagline}
                </div>
                <p className="font-malayalam text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {item.desktopDesc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
