import React, { useEffect, useRef, useState } from 'react';
import { Camera, Move, Plus, Trash2, Upload, Users, FileCheck2, EyeOff, Eye, ClipboardList, AlertTriangle, Info } from 'lucide-react';
import {
  DocumentCategory,
  DocumentOutputLanguage,
  DocumentAuditIssue,
  DocumentAuditSection,
  MalayalamLetterData,
  GulfCvData,
  RentalAgreementData,
  TeacherMarkListData,
  TeacherMarkListStudent,
  MARKLIST_PRESET_MODELS,
  CV_PRESET_MODELS,
  computeStudentStats,
} from '../types/documents';
import {
  getA4SheetLabels,
} from '../utils/languageTranslator';

export interface SheetCustomOverlayItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  isBold: boolean;
  color: string;
  bgColor: string;
  isWhiteout: boolean;
}

interface A4DocumentSheetProps {
  sheetRef: React.RefObject<HTMLDivElement | null>;
  category: DocumentCategory;
  outputLanguage?: DocumentOutputLanguage;
  letterData: MalayalamLetterData;
  gulfCvData: GulfCvData;
  agreementData: RentalAgreementData;
  markListData: TeacherMarkListData;
  isUnlocked: boolean;
  isEditMode: boolean;
  fontSizeScale: 'sm' | 'md' | 'lg';
  activeSheetTool?: 'select_edit' | 'add_text' | 'whiteout';
  showTouchBorders?: boolean;
  overlayItems?: SheetCustomOverlayItem[];
  onUpdateOverlayItems?: (items: SheetCustomOverlayItem[]) => void;
  onResetToolToSelect?: () => void;
  onUpdateLetter: (updated: MalayalamLetterData) => void;
  onUpdateGulfCv: (updated: GulfCvData) => void;
  onUpdateAgreement: (updated: RentalAgreementData) => void;
  onUpdateMarkList: (updated: TeacherMarkListData) => void;
  onEnableEditMode?: () => void;
  auditIssues?: DocumentAuditIssue[];
  showMistakeBadges?: boolean;
  highlightedAuditSection?: DocumentAuditSection | null;
  onFixAuditIssue?: (issue: DocumentAuditIssue) => void;
  onSelectQuickTemplateById?: (templateId: string) => void;
}

export const A4DocumentSheet: React.FC<A4DocumentSheetProps> = ({
  sheetRef,
  category,
  outputLanguage = 'ml',
  letterData,
  gulfCvData,
  agreementData,
  markListData,
  isUnlocked,
  fontSizeScale,
  activeSheetTool = 'select_edit',
  showTouchBorders = false,
  overlayItems = [],
  onUpdateOverlayItems,
  onResetToolToSelect,
  onUpdateLetter,
  onUpdateGulfCv,
  onUpdateAgreement,
  onUpdateMarkList,
  auditIssues = [],
  showMistakeBadges = true,
  highlightedAuditSection = null,
  onFixAuditIssue,
  onSelectQuickTemplateById,
}) => {
  const effectiveLang: DocumentOutputLanguage =
    category === 'gulf_cv' && outputLanguage === 'ml' ? 'en' : outputLanguage;
  const labels = getA4SheetLabels(effectiveLang);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const dragOverlayRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  useEffect(() => {
    const updateDragPosition = (clientX: number, clientY: number) => {
      if (!dragOverlayRef.current || !onUpdateOverlayItems) return;
      const { id, startX, startY, origX, origY } = dragOverlayRef.current;
      const dx = clientX - startX;
      const dy = clientY - startY;
      onUpdateOverlayItems(
        overlayItems.map((it) =>
          it.id === id
            ? { ...it, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) }
            : it
        )
      );
    };
    const handleMouseMove = (e: MouseEvent) => updateDragPosition(e.clientX, e.clientY);
    const handlePointerMove = (e: PointerEvent) => updateDragPosition(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragOverlayRef.current || !e.touches[0]) return;
      updateDragPosition(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleDragEnd = () => {
      dragOverlayRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [overlayItems, onUpdateOverlayItems]);

  const [rawCropPhotoUrl, setRawCropPhotoUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState<number>(1.15);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);
  const [cropShape, setCropShape] = useState<'passport' | 'circle'>('passport');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Immediately set the uploaded photo AND open the Passport Cropper so the user can align the face/head
        onUpdateGulfCv({
          ...gulfCvData,
          photoDataUrl: reader.result,
        });
        setRawCropPhotoUrl(reader.result);
        setCropZoom(1.1);
        setCropOffsetX(0);
        setCropOffsetY(0);
        setCropShape('passport');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleApplyCroppedPhoto = () => {
    if (!rawCropPhotoUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const outW = 400;
      const outH = 500;
      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setRawCropPhotoUrl(null);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outW, outH);

      if (cropShape === 'circle') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) * 0.46, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

      // Compute cover scaling biased toward the top-center of portrait photos (15% from top) so heads are never cut off
      const scaleCover = Math.max(outW / img.width, outH / img.height) * cropZoom;
      const drawW = img.width * scaleCover;
      const drawH = img.height * scaleCover;
      const drawX = (outW - drawW) / 2 + (cropOffsetX / 100) * outW;
      const drawY = (outH - drawH) * 0.18 + (cropOffsetY / 100) * outH;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      if (cropShape === 'circle') {
        ctx.restore();
      }

      const croppedDataUrl = canvas.toDataURL('image/png');
      onUpdateGulfCv({
        ...gulfCvData,
        photoDataUrl: croppedDataUrl,
      });
      setRawCropPhotoUrl(null);
    };
    img.onerror = () => setRawCropPhotoUrl(null);
    img.src = rawCropPhotoUrl;
  };

  const isMeaningfulCvField = (val?: string) => {
    if (!val) return false;
    const cleaned = val.trim().toLowerCase();
    return (
      cleaned.length > 0 &&
      cleaned !== '-' &&
      cleaned !== '--' &&
      cleaned !== 'none' &&
      cleaned !== 'nil' &&
      cleaned !== 'n/a' &&
      cleaned !== 'na' &&
      cleaned !== 'no' &&
      cleaned !== 'not applicable' &&
      cleaned !== 'ഇല്ല' &&
      cleaned !== 'ബാധകമല്ല'
    );
  };

  const textSizeClass =
    fontSizeScale === 'sm'
      ? 'text-[13.5px] leading-[1.72]'
      : fontSizeScale === 'lg'
      ? 'text-[16px] leading-[1.85]'
      : 'text-[14.5px] leading-[1.78]';

  const letterBodyCharCount = React.useMemo(() => {
    const bodyLen = (letterData.bodyParagraphs || []).join(' ').length;
    const subjLen = (letterData.subject || '').length;
    const structLen = (letterData.structuredFields || [])
      .map((f) => `${f.label} ${f.value}`)
      .join(' ').length;
    return bodyLen + subjLen + structLen;
  }, [letterData.bodyParagraphs, letterData.subject, letterData.structuredFields]);

  const hasBracketPlaceholder = (val: string) =>
    Boolean(val && val.includes('[') && val.includes(']'));

  // Helper class for seamless Direct Touch-to-Edit fields on the A4 PDF Sheet (looks 100% like printed PDF text until clicked/selected)
  const touchBoxClass = (val = '', customWidthClass = 'w-full') =>
    `${customWidthClass} min-w-0 bg-transparent transition-all rounded-xs px-0.5 focus:bg-sky-50/95 focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-text ${
      hasBracketPlaceholder(val)
        ? 'bg-amber-100/85 text-amber-950 border border-amber-400 px-1'
        : showTouchBorders
        ? 'border border-dashed border-sky-400/50 hover:border-sky-500 hover:bg-sky-50/35'
        : 'border border-transparent hover:bg-sky-50/50 hover:border-sky-300/60'
    }`;

  // Subtle Pre-Print Mistake Checker Badge rendered on the relevant A4 section (Hidden in Print/PDF)
  const renderSectionMistakeBadge = (section: DocumentAuditSection) => {
    if (!showMistakeBadges || !auditIssues || auditIssues.length === 0) return null;
    const sectionIssues = auditIssues.filter((i) => i.section === section);
    if (sectionIssues.length === 0) return null;

    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-print flex flex-wrap items-center gap-1.5 mb-1.5 select-none"
      >
        {sectionIssues.map((issue) => {
          const isWarn = issue.severity === 'warning';
          return (
            <div
              key={issue.id}
              title={issue.labelMalayalam}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-malayalam font-bold border shadow-2xs transition-all ${
                isWarn
                  ? 'bg-amber-50/95 text-amber-900 border-amber-300/90'
                  : 'bg-sky-50/95 text-sky-900 border-sky-200/90'
              }`}
            >
              {isWarn ? (
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              ) : (
                <Info className="w-3 h-3 text-sky-600 shrink-0" />
              )}
              <span>{issue.shortBadgeMalayalam || issue.labelMalayalam}</span>
              {issue.fixActionId && onFixAuditIssue && (
                <button
                  type="button"
                  onClick={() => onFixAuditIssue(issue)}
                  className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[9.5px] font-extrabold cursor-pointer"
                >
                  ✓ ശരിയാക്കുക
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const sectionHighlightClass = (section: DocumentAuditSection) => {
    if (highlightedAuditSection === section) {
      return 'ring-2 ring-amber-400 bg-amber-50/40 rounded-lg p-1 -m-1 transition-all duration-300';
    }
    return '';
  };

  // Handle clicking on the A4 sheet when 'add_text' or 'whiteout' tool is active
  const handleSheetCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeSheetTool === 'select_edit') {
      setSelectedOverlayId(null);
      return;
    }
    if (!sheetRef.current || !onUpdateOverlayItems) return;
    const rect = sheetRef.current.getBoundingClientRect();
    const clickX = Math.max(16, Math.round(e.clientX - rect.left - 20));
    const clickY = Math.max(16, Math.round(e.clientY - rect.top - 12));
    const isWhiteout = activeSheetTool === 'whiteout';
    const newId = `ov-${Date.now()}`;

    const newItem: SheetCustomOverlayItem = {
      id: newId,
      x: clickX,
      y: clickY,
      width: isWhiteout ? 140 : 200,
      height: 28,
      text: isWhiteout ? '' : 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
      fontSize: 14,
      isBold: false,
      color: '#0f172a',
      bgColor: '#ffffff',
      isWhiteout,
    };

    onUpdateOverlayItems([...overlayItems, newItem]);
    setSelectedOverlayId(newId);
    if (onResetToolToSelect) onResetToolToSelect();
  };

  const [showBulkPasteBox, setShowBulkPasteBox] = useState(false);
  const [bulkPasteNamesText, setBulkPasteNamesText] = useState('');
  const [showMarkListControls, setShowMarkListControls] = useState(false);
  const [customStudentCountInput, setCustomStudentCountInput] = useState<string>(
    String(markListData.students.length)
  );

  useEffect(() => {
    setCustomStudentCountInput(String(markListData.students.length));
  }, [markListData.students.length]);

  const isGradeOnlyMode = markListData.evaluationMode === 'lp_up_grade_only';
  const showTotalAndPct =
    markListData.showTotalAndPercentage !== undefined
      ? markListData.showTotalAndPercentage
      : !isGradeOnlyMode;
  const showRankCol =
    markListData.showRankColumn !== undefined ? markListData.showRankColumn : !isGradeOnlyMode;
  const showRemarksCol =
    markListData.showRemarksColumn !== undefined ? markListData.showRemarksColumn : isGradeOnlyMode;
  const showSummaryBox =
    markListData.showSummaryCards !== undefined ? markListData.showSummaryCards : true;
  const showHeadmasterBlock =
    markListData.showHeadmasterSignature !== undefined ? markListData.showHeadmasterSignature : true;

  // Compute ranks & stats for Teacher / Madrasa Mark List (supports LP/UP Grade-Only & Marks modes)
  const studentStatsMap = React.useMemo(() => {
    const statsWithTotals = markListData.students.map((st) => {
      const stats = computeStudentStats(
        st.marks,
        markListData.subjects.length,
        markListData.maxMarksPerSubject,
        st.subjectGrades,
        markListData.evaluationMode
      );
      return { id: st.id, studentName: st.studentName, stats };
    });

    const sortedTotals = Array.from(
      new Set(statsWithTotals.map((s) => s.stats.total))
    ).sort((a, b) => b - a);

    const rankById: Record<string, number> = {};
    statsWithTotals.forEach((item) => {
      rankById[item.id] = sortedTotals.indexOf(item.stats.total) + 1;
    });

    const totalStudents = statsWithTotals.length;
    const passedCount = statsWithTotals.filter((s) => s.stats.passed).length;
    const passPercentage =
      totalStudents > 0 ? Number(((passedCount / totalStudents) * 100).toFixed(1)) : 0;
    const aPlusCount = statsWithTotals.filter((s) =>
      isGradeOnlyMode ? s.stats.grade === 'A' : s.stats.grade === 'A+' || s.stats.grade === 'A'
    ).length;
    const topper = [...statsWithTotals].sort((a, b) => b.stats.total - a.stats.total)[0];

    return {
      byId: Object.fromEntries(statsWithTotals.map((s) => [s.id, s.stats])),
      rankById,
      totalStudents,
      passedCount,
      passPercentage,
      aPlusCount,
      topperName: topper ? topper.studentName : '-',
      topperScore: topper
        ? isGradeOnlyMode
          ? `ഗ്രേഡ് ${topper.stats.grade}`
          : `${topper.stats.total}/${topper.stats.maxTotal}`
        : '-',
    };
  }, [markListData, isGradeOnlyMode]);

  const handleAddStudentRows = (count = 1) => {
    const currentLen = markListData.students.length;
    const newRows: TeacherMarkListStudent[] = [];
    for (let i = 0; i < count; i++) {
      const roll = String(currentLen + i + 1);
      newRows.push({
        id: `st-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        rollNo: roll,
        studentName: `വിദ്യാർത്ഥി ${roll}`,
        marks: markListData.subjects.map(() => 80),
        subjectGrades: markListData.subjects.map(() => 'A'),
        remarks: isGradeOnlyMode ? 'വളരെ മികച്ച പഠന നിലവാരം' : 'വിജയിച്ചു',
      });
    }
    onUpdateMarkList({
      ...markListData,
      students: [...markListData.students, ...newRows],
    });
  };

  const handleSetExactStudentCount = (targetCount: number) => {
    const clamped = Math.max(1, Math.min(300, targetCount));
    setCustomStudentCountInput(String(clamped));
    const current = [...markListData.students];
    if (clamped <= current.length) {
      onUpdateMarkList({
        ...markListData,
        students: current.slice(0, clamped),
      });
      return;
    }
    const extraCount = clamped - current.length;
    handleAddStudentRows(extraCount);
  };

  const commitCustomStudentCountInput = () => {
    const parsed = parseInt(customStudentCountInput.trim(), 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 300) {
      if (parsed !== markListData.students.length) {
        handleSetExactStudentCount(parsed);
      }
    } else {
      setCustomStudentCountInput(String(markListData.students.length));
    }
  };

  const handleApplyBulkPastedNames = () => {
    const names = bulkPasteNamesText
      .split(/\r?\n/)
      .map((n) => n.replace(/^\d+[\s.)\-:]*/, '').trim())
      .filter(Boolean);
    if (names.length === 0) return;

    const newStudents: TeacherMarkListStudent[] = names.map((name, idx) => {
      const existing = markListData.students[idx];
      return {
        id: existing?.id || `st-bulk-${Date.now()}-${idx}`,
        rollNo: String(idx + 1),
        studentName: name,
        marks: existing?.marks?.length === markListData.subjects.length
          ? [...existing.marks]
          : markListData.subjects.map(() => 80),
        subjectGrades:
          existing?.subjectGrades?.length === markListData.subjects.length
            ? [...existing.subjectGrades]
            : markListData.subjects.map(() => 'A'),
        remarks: existing?.remarks || (isGradeOnlyMode ? 'വളരെ മികച്ച പഠന നിലവാരം' : 'വിജയിച്ചു'),
      };
    });

    onUpdateMarkList({
      ...markListData,
      students: newStudents,
    });
    setBulkPasteNamesText('');
    setShowBulkPasteBox(false);
  };

  const handleRemoveStudentRow = (id: string) => {
    if (markListData.students.length <= 1) return;
    const filtered = markListData.students
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, rollNo: String(idx + 1) }));
    onUpdateMarkList({
      ...markListData,
      students: filtered,
    });
  };

  const handleAddSubjectColumn = () => {
    if (markListData.subjects.length >= 10) return;
    const newSubjName = `വിഷയം ${markListData.subjects.length + 1}`;
    onUpdateMarkList({
      ...markListData,
      subjects: [...markListData.subjects, newSubjName],
      students: markListData.students.map((st) => ({
        ...st,
        marks: [...st.marks, 80],
        subjectGrades: [...(st.subjectGrades || markListData.subjects.map(() => 'A')), 'A'],
      })),
    });
  };

  const handleRemoveSubjectColumn = (sIdx: number) => {
    if (markListData.subjects.length <= 1) return;
    const nextSubjects = markListData.subjects.filter((_, i) => i !== sIdx);
    const nextStudents = markListData.students.map((st) => ({
      ...st,
      marks: st.marks.filter((_, i) => i !== sIdx),
      subjectGrades: (st.subjectGrades || []).filter((_, i) => i !== sIdx),
    }));
    onUpdateMarkList({
      ...markListData,
      subjects: nextSubjects,
      students: nextStudents,
    });
  };

  // Paginate students into true A4 pages without overflowing 297mm:
  // - Single page: up to 18 students (with summary + footer) or 22 (without summary)
  // - Multi-page: Page 1 has no signature footer so it holds 20 (with summary) or 24 (without summary);
  //   intermediate pages hold up to 25 students; final page (with grading scale + seal + signatures) holds at most 18 students.
  const paginatedMarkListPages = React.useMemo(() => {
    const all = markListData.students.map((student, globalIdx) => ({ student, globalIdx }));
    const singlePageMax = showSummaryBox ? 18 : 22;
    if (all.length <= singlePageMax) {
      return [all];
    }

    const firstPageMultiMax = showSummaryBox ? 20 : 24;
    const midPageMax = 25;
    const lastPageMaxWithFooter = 18;

    const pages: Array<Array<{ student: TeacherMarkListStudent; globalIdx: number }>> = [];
    pages.push(all.slice(0, firstPageMultiMax));
    let cursor = firstPageMultiMax;

    while (cursor < all.length) {
      const remaining = all.length - cursor;
      if (remaining <= lastPageMaxWithFooter) {
        pages.push(all.slice(cursor));
        break;
      }
      if (remaining <= midPageMax) {
        // Split so the intermediate page takes 18 rows and the final page comfortably fits the remaining rows + signature footer
        const takeForPenultimate = Math.min(18, remaining - 5);
        pages.push(all.slice(cursor, cursor + takeForPenultimate));
        cursor += takeForPenultimate;
      } else {
        pages.push(all.slice(cursor, cursor + midPageMax));
        cursor += midPageMax;
      }
    }
    return pages;
  }, [markListData.students, showSummaryBox]);

  return (
    <div
      id="a4-document-sheet"
      ref={sheetRef}
      dir={labels.dir}
      onClick={handleSheetCanvasClick}
      className={`a4-paper-sheet a4-floating-3d mx-auto bg-white text-[#0F172A] border border-slate-300 relative transition-all ${
        activeSheetTool !== 'select_edit' ? 'cursor-crosshair' : ''
      }`}
    >
      {/* Subtle Preview Watermark when locked */}
      {!isUnlocked && (
        <div
          aria-hidden="true"
          className="no-print pointer-events-none select-none absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden opacity-[0.06]"
        >
          <div className="-rotate-30 text-center space-y-16">
            <p className="text-4xl font-bold tracking-widest text-slate-900">
              പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് · PREVIEW
            </p>
            <p className="text-4xl font-bold tracking-widest text-slate-900">
              പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് · PREVIEW
            </p>
            <p className="text-4xl font-bold tracking-widest text-slate-900">
              പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് · PREVIEW
            </p>
          </div>
        </div>
      )}

      {/* Subtle Formatting Overlap / Page Overflow Badge at Top of Sheet (No-Print) */}
      {showMistakeBadges &&
        auditIssues.some((i) => i.section === 'formatting_overlap') && (
          <div
            data-audit-section="formatting_overlap"
            className="no-print px-8 pt-3 pb-0.5 flex flex-wrap items-center justify-end gap-1.5"
          >
            {renderSectionMistakeBadge('formatting_overlap')}
          </div>
        )}

      {/* =====================================================================
          1A. SCHOOL PROJECT FRONT PAGE (ORNAMENTAL BORDERED COVER PAGE)
         ===================================================================== */}
      {category === 'malayalam_letter' &&
        letterData.letterLayoutVariant === 'project_cover' && (
          <div className="font-malayalam p-10 min-h-[285mm] flex flex-col">
            <div className="flex-1 border-4 border-double border-emerald-900 p-10 flex flex-col justify-between text-center relative bg-white">
              <div className="space-y-3 pt-2">
                <p className="text-xs font-mono-num uppercase tracking-widest text-emerald-800 font-bold">
                  SCHOOL / COLLEGE ACADEMIC PROJECT REPORT
                </p>
                <input
                  type="text"
                  value={letterData.recipientOffice}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, recipientOffice: e.target.value })
                  }
                  placeholder="സ്കൂളിന്റെ പേര്"
                  className={`${touchBoxClass(letterData.recipientOffice)} text-center font-extrabold text-2xl text-slate-900`}
                />
                <div className="w-24 h-1 bg-emerald-700 mx-auto rounded-full" />
              </div>

              <div className="my-8 py-8 px-4 border-y-2 border-dashed border-emerald-800/40 bg-emerald-50/30 rounded-2xl space-y-3">
                <input
                  type="text"
                  value={letterData.documentHeading}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, documentHeading: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.documentHeading)} text-center font-bold text-sm text-emerald-900`}
                />
                <textarea
                  rows={2}
                  value={letterData.subject}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, subject: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.subject)} text-center font-extrabold text-2xl text-slate-950 resize-none`}
                />
                {letterData.bodyParagraphs.map((para, i) => (
                  <textarea
                    key={i}
                    rows={2}
                    value={para}
                    onChange={(e) => {
                      const next = [...letterData.bodyParagraphs];
                      next[i] = e.target.value;
                      onUpdateLetter({ ...letterData, bodyParagraphs: next });
                    }}
                    className={`${touchBoxClass(para)} text-center text-sm text-slate-700 resize-none`}
                  />
                ))}
              </div>

              <div className="space-y-6 pb-2">
                <div className="grid grid-cols-2 gap-6 text-left">
                  <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-1.5">
                    <p className="text-xs font-extrabold uppercase text-emerald-900 border-b border-slate-300 pb-1">
                      സമർപ്പിക്കുന്നത് (Submitted By) :
                    </p>
                    <input
                      type="text"
                      value={letterData.senderName}
                      onChange={(e) =>
                        onUpdateLetter({ ...letterData, senderName: e.target.value })
                      }
                      className={`${touchBoxClass(letterData.senderName)} font-bold text-sm text-slate-900`}
                    />
                    <textarea
                      rows={2}
                      value={letterData.senderAddress}
                      onChange={(e) =>
                        onUpdateLetter({ ...letterData, senderAddress: e.target.value })
                      }
                      className={`${touchBoxClass(letterData.senderAddress)} text-xs text-slate-700 resize-none`}
                    />
                  </div>

                  <div className="border-2 border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-1.5">
                    <p className="text-xs font-extrabold uppercase text-emerald-900 border-b border-slate-300 pb-1">
                      സ്വീകരിക്കുന്നത് (Submitted To) :
                    </p>
                    <input
                      type="text"
                      value={letterData.recipientTitle}
                      onChange={(e) =>
                        onUpdateLetter({ ...letterData, recipientTitle: e.target.value })
                      }
                      className={`${touchBoxClass(letterData.recipientTitle)} font-bold text-sm text-slate-900`}
                    />
                    <input
                      type="text"
                      value={letterData.recipientPlace}
                      onChange={(e) =>
                        onUpdateLetter({ ...letterData, recipientPlace: e.target.value })
                      }
                      className={`${touchBoxClass(letterData.recipientPlace)} text-xs text-slate-700`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200 gap-4">
                  <div className="flex items-center gap-1">
                    <span>സ്ഥലം :</span>
                    <input
                      type="text"
                      value={letterData.place}
                      onChange={(e) => onUpdateLetter({ ...letterData, place: e.target.value })}
                      className={`${touchBoxClass(letterData.place)} w-32`}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span>തീയതി :</span>
                    <input
                      type="text"
                      value={letterData.date}
                      onChange={(e) => onUpdateLetter({ ...letterData, date: e.target.value })}
                      className={`${touchBoxClass(letterData.date)} w-28 text-right`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================================
          1B. SCHOOL ASSEMBLY SPEECH SHEET (EASY STAGE READING FORMAT)
         ===================================================================== */}
      {category === 'malayalam_letter' &&
        letterData.letterLayoutVariant === 'school_speech' && (
          <div className="font-malayalam px-12 py-12">
            <div className="border-2 border-emerald-800/30 rounded-2xl p-8 bg-white space-y-6">
              <div className="text-center border-b-2 border-emerald-800/20 pb-4 space-y-1.5">
                <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
                  സ്കൂൾ അസംബ്ലി പ്രസംഗം (School Speech)
                </span>
                <input
                  type="text"
                  value={letterData.subject}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, subject: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.subject)} text-center font-extrabold text-xl text-slate-900`}
                />
              </div>

              <div className="bg-amber-50/70 border-l-4 border-amber-500 px-4 py-3 rounded-r-xl">
                <input
                  type="text"
                  value={letterData.salutation}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, salutation: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.salutation)} font-extrabold text-lg text-slate-900`}
                />
              </div>

              <div className="space-y-4 text-[16.5px] leading-[1.9] text-slate-900">
                {letterData.bodyParagraphs.map((para, idx) => (
                  <textarea
                    key={idx}
                    rows={Math.max(3, Math.ceil(para.length / 55))}
                    value={para}
                    onChange={(e) => {
                      const updated = [...letterData.bodyParagraphs];
                      updated[idx] = e.target.value;
                      onUpdateLetter({ ...letterData, bodyParagraphs: updated });
                    }}
                    className={`${touchBoxClass(para)} text-base leading-relaxed resize-y`}
                  />
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-sm text-slate-700 gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-bold shrink-0">പ്രസംഗം അവതരിപ്പിക്കുന്നത് : </span>
                  <input
                    type="text"
                    value={letterData.senderName}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, senderName: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.senderName)} font-extrabold text-slate-900`}
                  />
                </div>
                <input
                  type="text"
                  value={letterData.date}
                  onChange={(e) => onUpdateLetter({ ...letterData, date: e.target.value })}
                  className={`${touchBoxClass(letterData.date)} font-mono-num text-xs w-28 text-right`}
                />
              </div>
            </div>
          </div>
        )}

      {/* =====================================================================
          1C. OFFICIAL MALAYALAM LETTER / GOV FORM / RESIGNATION / PETITION
         ===================================================================== */}
      {category === 'malayalam_letter' &&
        letterData.letterLayoutVariant !== 'project_cover' &&
        letterData.letterLayoutVariant !== 'school_speech' && (
          <div
            data-a4-single-page-inner="true"
            className={`font-malayalam px-10 py-9 min-h-[1123px] flex flex-col justify-between ${
              letterBodyCharCount > 1100
                ? 'text-[10.8px] leading-[1.38]'
                : letterBodyCharCount > 800
                ? 'text-[11.5px] leading-[1.46]'
                : letterBodyCharCount > 500
                ? 'text-[13px] leading-[1.62]'
                : textSizeClass
            }`}
          >
            {/* Top Document Heading & Official Form Code */}
            <div className="text-center mb-6 space-y-1">
              {letterData.formCode && (
                <textarea
                  rows={Math.max(1, Math.ceil(letterData.formCode.length / 58))}
                  value={letterData.formCode}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, formCode: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.formCode)} text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 resize-none leading-snug`}
                />
              )}
              <textarea
                rows={Math.max(1, Math.ceil((letterData.documentHeading || '').length / 32))}
                value={letterData.documentHeading}
                onChange={(e) =>
                  onUpdateLetter({ ...letterData, documentHeading: e.target.value })
                }
                title="ഇവിടെ ക്ലിക്ക് ചെയ്ത് തലക്കെട്ട് തിരുത്താം"
                className={`${touchBoxClass(letterData.documentHeading)} text-center text-lg font-bold tracking-wide underline underline-offset-8 decoration-slate-400 resize-none leading-relaxed`}
              />
            </div>

            {/* Sender Section (സമർപ്പിക്കുന്നത്) */}
            <div
              data-audit-section="sender"
              className={`mb-6 ${sectionHighlightClass('sender')}`}
            >
              {renderSectionMistakeBadge('sender')}
              <input
                type="text"
                value={letterData.fromLabelOverride ?? labels.fromLabel}
                onChange={(e) =>
                  onUpdateLetter({ ...letterData, fromLabelOverride: e.target.value })
                }
                title="ഇവിടെ ക്ലിക്ക് ചെയ്ത് ഈ തലക്കെട്ട് മാറ്റുകയോ മായ്ക്കുകയോ ചെയ്യാം"
                className={`${touchBoxClass(letterData.fromLabelOverride ?? labels.fromLabel)} font-bold text-slate-900 mb-1 max-w-xs`}
              />
              <div className="pl-4 space-y-1 max-w-lg">
                <input
                  type="text"
                  value={letterData.senderName}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    const nextFields =
                      letterData.structuredFields && letterData.structuredFields.length > 0
                        ? letterData.structuredFields.map((f, idx) =>
                            idx === 0 ? { ...f, value: nextVal } : f
                          )
                        : letterData.structuredFields;
                    onUpdateLetter({
                      ...letterData,
                      senderName: nextVal,
                      structuredFields: nextFields,
                    });
                  }}
                  placeholder="നിങ്ങളുടെ പേര് ഇവിടെ ടൈപ്പ് ചെയ്യുക"
                  title="പേര് മാറ്റാൻ ഇവിടെ തൊടുക"
                  className={`${touchBoxClass(letterData.senderName)} font-semibold text-slate-900`}
                />
                <textarea
                  rows={Math.max(1, letterData.senderAddress.split('\n').length)}
                  value={letterData.senderAddress}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, senderAddress: e.target.value })
                  }
                  placeholder="വീട്ടുപേര്, വാർഡ്, സ്ഥലം"
                  title="വിലാസം മാറ്റാൻ ഇവിടെ തൊടുക"
                  className={`${touchBoxClass(letterData.senderAddress)} text-slate-800 resize-none`}
                />
                {letterData.senderPhone !== undefined && letterData.senderPhone !== '' && (
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <input
                      type="text"
                      value={letterData.phoneLabelOverride ?? labels.phoneLabel}
                      onChange={(e) =>
                        onUpdateLetter({ ...letterData, phoneLabelOverride: e.target.value })
                      }
                      className={`${touchBoxClass(letterData.phoneLabelOverride ?? labels.phoneLabel, 'w-16')} shrink-0`}
                    />
                    <input
                      type="text"
                      value={letterData.senderPhone}
                      onChange={(e) =>
                        onUpdateLetter({ ...letterData, senderPhone: e.target.value })
                      }
                      placeholder="ഫോൺ നമ്പർ"
                      className={`${touchBoxClass(letterData.senderPhone)} max-w-[220px]`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Recipient Section (സ്വീകർത്താവ്) */}
            <div
              data-audit-section="recipient"
              className={`mb-6 ${sectionHighlightClass('recipient')}`}
            >
              {renderSectionMistakeBadge('recipient')}
              <input
                type="text"
                value={letterData.toLabelOverride ?? labels.toLabel}
                onChange={(e) =>
                  onUpdateLetter({ ...letterData, toLabelOverride: e.target.value })
                }
                title="ഇവിടെ ക്ലിക്ക് ചെയ്ത് ഈ തലക്കെട്ട് മാറ്റുകയോ മായ്ക്കുകയോ ചെയ്യാം"
                className={`${touchBoxClass(letterData.toLabelOverride ?? labels.toLabel)} font-bold text-slate-900 mb-1 max-w-xs`}
              />
              <div className="pl-4 space-y-1 max-w-lg">
                <input
                  type="text"
                  value={letterData.recipientTitle}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, recipientTitle: e.target.value })
                  }
                  title="സ്വീകർത്താവിന്റെ പദവി തിരുത്താം"
                  className={`${touchBoxClass(letterData.recipientTitle)} font-semibold text-slate-900`}
                />
                <input
                  type="text"
                  value={letterData.recipientOffice}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, recipientOffice: e.target.value })
                  }
                  title="ഓഫീസിന്റെ / സ്ഥാപനത്തിന്റെ പേര് തിരുത്താം"
                  className={`${touchBoxClass(letterData.recipientOffice)} text-slate-900`}
                />
                <input
                  type="text"
                  value={letterData.recipientPlace}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, recipientPlace: e.target.value })
                  }
                  title="സ്ഥലം തിരുത്താം"
                  className={`${touchBoxClass(letterData.recipientPlace)} text-slate-800`}
                />
              </div>
            </div>

            {/* Salutation */}
            <div className="mb-3 max-w-xs">
              <input
                type="text"
                value={letterData.salutation}
                onChange={(e) =>
                  onUpdateLetter({ ...letterData, salutation: e.target.value })
                }
                className={`${touchBoxClass(letterData.salutation)} font-semibold`}
              />
            </div>

            {/* Subject (വിഷയം) */}
            <div
              data-audit-section="subject"
              className={`mb-4 pl-4 ${sectionHighlightClass('subject')}`}
            >
              {renderSectionMistakeBadge('subject')}
              <div className="flex items-start gap-1.5">
                <input
                  type="text"
                  value={letterData.subjectLabelOverride ?? labels.subjectLabel}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, subjectLabelOverride: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.subjectLabelOverride ?? labels.subjectLabel, 'w-20')} font-bold shrink-0 mt-0.5`}
                />
                <textarea
                  rows={Math.max(1, Math.ceil(letterData.subject.length / 55))}
                  value={letterData.subject}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, subject: e.target.value })
                  }
                  title="വിഷയം തിരുത്താൻ ഇവിടെ തൊടുക"
                  className={`${touchBoxClass(letterData.subject)} font-bold text-slate-900 underline decoration-slate-300 underline-offset-4 resize-none`}
                />
              </div>

              {letterData.reference !== undefined && letterData.reference !== '' && (
                <div className="flex items-center gap-1.5 mt-1 text-slate-700 font-medium">
                  <input
                    type="text"
                    value={letterData.referenceLabelOverride ?? 'സൂചന :'}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, referenceLabelOverride: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.referenceLabelOverride ?? 'സൂചന :', 'w-16')} shrink-0`}
                  />
                  <input
                    type="text"
                    value={letterData.reference}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, reference: e.target.value })
                    }
                    className={touchBoxClass(letterData.reference)}
                  />
                </div>
              )}
            </div>

            {/* Body Paragraphs (Directly Touch-Editable in Place — precedes Application Particulars Table) */}
            <div
              data-audit-section="body"
              className={`space-y-3 text-justify mb-6 ${sectionHighlightClass('body')}`}
            >
              {renderSectionMistakeBadge('body')}
              {letterData.bodyParagraphs.map((paragraph, idx) => (
                <div key={idx} className="relative group">
                  <textarea
                    rows={Math.max(2, Math.ceil(paragraph.length / 62))}
                    value={paragraph}
                    onChange={(e) => {
                      const updated = [...letterData.bodyParagraphs];
                      updated[idx] = e.target.value;
                      onUpdateLetter({ ...letterData, bodyParagraphs: updated });
                    }}
                    title="ഇവിടെ ക്ലിക്ക് ചെയ്ത് വാചകം മാറ്റാം"
                    className={`${touchBoxClass(paragraph)} leading-[1.82] text-slate-900 resize-y`}
                  />
                  {letterData.bodyParagraphs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = letterData.bodyParagraphs.filter((_, i) => i !== idx);
                        onUpdateLetter({ ...letterData, bodyParagraphs: updated });
                      }}
                      title="ഈ ഖണ്ഡിക ഒഴിവാക്കുക"
                      className="no-print opacity-0 group-hover:opacity-100 absolute -right-6 top-1 text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <div className="no-print pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateLetter({
                      ...letterData,
                      bodyParagraphs: [
                        ...letterData.bodyParagraphs,
                        'പുതിയ വാചകം ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
                      ],
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-800 border border-slate-300 text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>പുതിയ ഖണ്ഡിക (Paragraph) ചേർക്കുക</span>
                </button>
              </div>
            </div>

            {/* Official Structured Government / Akshaya Form Table ("താഴെ പട്ടികയിൽ") */}
            {letterData.structuredFields && letterData.structuredFields.length > 0 && (
              <div
                data-audit-section="structured_fields"
                className={`mb-7 ${sectionHighlightClass('structured_fields')}`}
              >
                {renderSectionMistakeBadge('structured_fields')}
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <input
                    type="text"
                    value={
                      letterData.structuredTableHeadingOverride ??
                      'അപേക്ഷാ വിവര പട്ടിക (Application Particulars) :'
                    }
                    onChange={(e) =>
                      onUpdateLetter({
                        ...letterData,
                        structuredTableHeadingOverride: e.target.value,
                      })
                    }
                    className={`${touchBoxClass(
                      letterData.structuredTableHeadingOverride ??
                        'അപേക്ഷാ വിവര പട്ടിക (Application Particulars) :'
                    )} font-bold text-xs sm:text-sm text-slate-900`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const nextFields = [
                        ...(letterData.structuredFields || []),
                        {
                          id: `fld-${Date.now()}`,
                          label: 'പുതിയ വിവരം',
                          value: '',
                          placeholder: 'ഇവിടെ പൂരിപ്പിക്കുക',
                        },
                      ];
                      onUpdateLetter({ ...letterData, structuredFields: nextFields });
                    }}
                    className="no-print px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>വരി ചേർക്കുക</span>
                  </button>
                </div>
                <table className="w-full border-collapse border border-slate-400 text-xs sm:text-[13px]">
                  <tbody>
                    {letterData.structuredFields.map((fld, fIdx) => {
                      const isEx = /^ഉദാ\s*:/i.test((fld.value || '').trim());
                      const displayVal = isEx ? '' : fld.value;
                      const placeholderVal = isEx
                        ? fld.value
                        : fld.placeholder || 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...';
                      return (
                        <tr key={fld.id || fIdx} className="border-b border-slate-300 align-top">
                          <td className="border border-slate-400 px-2 py-1.5 w-8 text-center font-mono-num font-semibold bg-slate-50/70">
                            {fIdx + 1}
                          </td>
                          <td className="border border-slate-400 px-2.5 py-1.5 w-[42%] font-semibold text-slate-900 bg-slate-50/40">
                            <textarea
                              rows={Math.max(1, Math.ceil((fld.label || '').length / 20))}
                              value={fld.label}
                              onChange={(e) => {
                                const next = [...(letterData.structuredFields || [])];
                                next[fIdx] = { ...fld, label: e.target.value };
                                onUpdateLetter({ ...letterData, structuredFields: next });
                              }}
                              className={`${touchBoxClass(fld.label)} resize-none leading-snug`}
                            />
                          </td>
                          <td className="border border-slate-400 px-2.5 py-1.5 font-medium text-slate-900">
                            <textarea
                              rows={Math.max(
                                1,
                                Math.ceil((displayVal || placeholderVal || '').length / 26)
                              )}
                              value={displayVal}
                              placeholder={placeholderVal}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                const next = [...(letterData.structuredFields || [])];
                                next[fIdx] = { ...fld, value: newVal };
                                const nextLetter = { ...letterData, structuredFields: next };
                                if (fIdx === 0 && newVal.trim()) {
                                  nextLetter.senderName = newVal;
                                } else if (
                                  fld.id === 'address' ||
                                  fld.label.includes('വിലാസ') ||
                                  fld.label.includes('മേൽവിലാസ')
                                ) {
                                  nextLetter.senderAddress = newVal;
                                } else if (
                                  fld.id === 'policeStation' ||
                                  fld.id === 'villageOffice' ||
                                  fld.label.includes('സ്റ്റേഷൻ') ||
                                  fld.label.includes('ഓഫീസ്') ||
                                  fld.label.includes('വില്ലേജ്')
                                ) {
                                  nextLetter.recipientOffice = newVal;
                                }
                                onUpdateLetter(nextLetter);
                              }}
                              className={`${touchBoxClass(displayVal)} resize-none leading-snug`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Place, Date & Signature Footer */}
            <div
              data-audit-section="footer_date_place"
              className={`mt-auto pt-2 flex flex-row justify-between items-end gap-6 pdf-keep-together ${sectionHighlightClass('footer_date_place')}`}
            >
              <div className="space-y-1.5">
                {renderSectionMistakeBadge('footer_date_place')}
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={letterData.placeLabelOverride ?? labels.placeLabel}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, placeLabelOverride: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.placeLabelOverride ?? labels.placeLabel, 'w-16')} font-semibold shrink-0`}
                  />
                  <input
                    type="text"
                    value={letterData.place}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, place: e.target.value })
                    }
                    className={touchBoxClass(letterData.place, 'w-40')}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={letterData.dateLabelOverride ?? labels.dateLabel}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, dateLabelOverride: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.dateLabelOverride ?? labels.dateLabel, 'w-16')} font-semibold shrink-0`}
                  />
                  <input
                    type="text"
                    value={letterData.date}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, date: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.date, 'w-36')} font-mono-num`}
                  />
                </div>
              </div>

              {letterData.letterLayoutVariant === 'school_leave' && (
                <div className="text-center min-w-[180px] space-y-6 border border-dashed border-slate-300 rounded-xl px-4 py-3">
                  <input
                    type="text"
                    value={
                      letterData.parentSignatureLabelOverride ??
                      "രക്ഷിതാവിന്റെ ഒപ്പ് (Parent's Signature)"
                    }
                    onChange={(e) =>
                      onUpdateLetter({
                        ...letterData,
                        parentSignatureLabelOverride: e.target.value,
                      })
                    }
                    className={`${touchBoxClass(
                      letterData.parentSignatureLabelOverride ??
                        "രക്ഷിതാവിന്റെ ഒപ്പ് (Parent's Signature)"
                    )} text-center text-xs font-bold text-slate-700`}
                  />
                  <input
                    type="text"
                    value={letterData.parentOrGuardianName ?? '(അച്ഛൻ / അമ്മ / രക്ഷിതാവ്)'}
                    onChange={(e) =>
                      onUpdateLetter({
                        ...letterData,
                        parentOrGuardianName: e.target.value,
                      })
                    }
                    className={`${touchBoxClass()} text-center text-xs text-slate-600`}
                  />
                </div>
              )}

              <div className="text-right min-w-[200px] space-y-6">
                <input
                  type="text"
                  value={letterData.closingPhrase}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, closingPhrase: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.closingPhrase)} text-right font-semibold`}
                />
                <div className="space-y-1">
                  <input
                    type="text"
                    value={letterData.signatureLabelOverride ?? labels.signatureLabel}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, signatureLabelOverride: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.signatureLabelOverride ?? labels.signatureLabel)} text-right text-xs text-slate-500`}
                  />
                  <input
                    type="text"
                    value={letterData.senderName}
                    onChange={(e) =>
                      onUpdateLetter({ ...letterData, senderName: e.target.value })
                    }
                    className={`${touchBoxClass(letterData.senderName)} text-right font-bold text-slate-900`}
                  />
                </div>
              </div>
            </div>

            {/* Enclosures (ഉള്ളടക്കം) */}
            {letterData.enclosures && letterData.enclosures.length > 0 && (
              <div className="mt-10 pt-4 border-t border-slate-200 text-xs text-slate-700">
                <input
                  type="text"
                  value={letterData.enclosuresLabelOverride ?? labels.enclosuresLabel}
                  onChange={(e) =>
                    onUpdateLetter({ ...letterData, enclosuresLabelOverride: e.target.value })
                  }
                  className={`${touchBoxClass(letterData.enclosuresLabelOverride ?? labels.enclosuresLabel)} font-bold mb-1 max-w-xs`}
                />
                <div className="space-y-1">
                  {letterData.enclosures.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="font-mono-num">{i + 1}.</span>
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const nextEnc = [...letterData.enclosures];
                          nextEnc[i] = e.target.value;
                          onUpdateLetter({ ...letterData, enclosures: nextEnc });
                        }}
                        className={touchBoxClass(item)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      {/* =====================================================================
          2. REAL A4 PDF RESUME / UNIVERSAL JOB CV (ALL JOBS & ALL COUNTRIES)
         ===================================================================== */}
      {category === 'gulf_cv' && (
        <div
          className="font-malayalam px-10 py-8 text-slate-900 min-h-[1123px] flex flex-col justify-between"
          data-cv-root="true"
          data-a4-single-page-inner="true"
        >
          {/* No-Print 1-Click Universal CV Model Switcher Bar */}
          <div className="no-print mb-4 bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold text-emerald-950">
                💼 സിവി മോഡൽ മാറ്റാം (എല്ലാ ജോലികൾക്കും · എല്ലാ നാട്ടിലേക്കും):
              </span>
              <span className="text-[10px] font-bold text-emerald-700">
                ഏത് അക്ഷരത്തിലും തൊട്ട് തിരുത്താം
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {CV_PRESET_MODELS.map((preset) => {
                const isCurrent = gulfCvData.jobTitle === preset.data.jobTitle;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onUpdateGulfCv({
                        ...preset.data,
                        photoDataUrl: gulfCvData.photoDataUrl || preset.data.photoDataUrl,
                      })
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-white hover:bg-emerald-100/80 text-slate-800 border-slate-300'
                    }`}
                  >
                    {preset.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Executive Resume Header */}
          <div
            data-audit-section="cv_header"
            className={`flex flex-row justify-between items-start gap-5 pb-4 border-b-2 border-slate-900 ${sectionHighlightClass('cv_header')}`}
          >
            <div className="flex-1 min-w-0 space-y-1.5">
              {renderSectionMistakeBadge('cv_header')}
              <input
                type="text"
                value={gulfCvData.fullName}
                onChange={(e) => {
                  const newName = e.target.value;
                  onUpdateGulfCv({
                    ...gulfCvData,
                    fullName: newName,
                    signatureName:
                      !gulfCvData.signatureName ||
                      gulfCvData.signatureName === gulfCvData.fullName
                        ? newName
                        : gulfCvData.signatureName,
                  });
                }}
                placeholder="CANDIDATE FULL NAME"
                title="പേര് മാറ്റാൻ ഇവിടെ സെലക്ട് ചെയ്ത് ടൈപ്പ് ചെയ്യുക"
                className={`${touchBoxClass(gulfCvData.fullName)} text-[23px] font-extrabold tracking-tight text-slate-900`}
              />
              <input
                type="text"
                value={gulfCvData.jobTitle}
                onChange={(e) =>
                  onUpdateGulfCv({ ...gulfCvData, jobTitle: e.target.value })
                }
                placeholder="JOB TITLE / ROLE"
                title="തസ്തിക മാറ്റാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക"
                className={`${touchBoxClass(gulfCvData.jobTitle)} text-sm font-bold tracking-wide text-emerald-800`}
              />

              {/* Clean Two-Row Contact Block (Never clips long locations or email addresses!) */}
              <div className="pt-1.5 space-y-1 text-xs text-slate-700">
                <div className="flex items-center gap-1.5 w-full">
                  <span className="font-semibold text-slate-900 shrink-0">
                    {labels.locationLabel}
                  </span>
                  <input
                    type="text"
                    value={gulfCvData.currentLocation}
                    onChange={(e) => {
                      const newLoc = e.target.value;
                      onUpdateGulfCv({
                        ...gulfCvData,
                        currentLocation: newLoc,
                        cvPlace: newLoc.split(',')[0]?.trim() ?? newLoc,
                      });
                    }}
                    className={`${touchBoxClass(gulfCvData.currentLocation)} font-medium text-slate-800`}
                  />
                </div>

                <div className="flex flex-row items-center gap-4 w-full">
                  {gulfCvData.phone && gulfCvData.phone !== '-' && (
                    <div className="flex items-center gap-1.5 w-[44%] min-w-0">
                      <span className="font-semibold text-slate-900 shrink-0">
                        {labels.mobileLabel}
                      </span>
                      <input
                        type="text"
                        value={gulfCvData.phone}
                        onChange={(e) =>
                          onUpdateGulfCv({
                            ...gulfCvData,
                            phone: e.target.value,
                            whatsapp: e.target.value,
                          })
                        }
                        className={`${touchBoxClass(gulfCvData.phone)} font-mono-num font-semibold text-slate-900`}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="font-semibold text-slate-900 shrink-0">
                      {labels.emailLabel}
                    </span>
                    <input
                      type="text"
                      value={gulfCvData.email}
                      onChange={(e) =>
                        onUpdateGulfCv({ ...gulfCvData, email: e.target.value })
                      }
                      className={`${touchBoxClass(gulfCvData.email)} text-slate-800`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Passport Photo (Strict 35mm x 45mm A4 passport proportion, stays 100% inside sheet boundaries) */}
            <div className={`shrink-0 flex flex-col items-center gap-1 ${!gulfCvData.photoDataUrl ? 'no-print' : ''}`}>
              {gulfCvData.photoDataUrl ? (
                <>
                  <div
                    onClick={() => {
                      setRawCropPhotoUrl(gulfCvData.photoDataUrl || null);
                      setCropZoom(1.05);
                      setCropOffsetX(0);
                      setCropOffsetY(0);
                    }}
                    title="ഫോട്ടോ ക്രോപ്പ് ചെയ്യാൻ / മാറ്റാൻ ക്ലിക്ക് ചെയ്യുക"
                    className="w-[100px] h-[125px] rounded border border-slate-300 bg-slate-50 overflow-hidden relative cursor-pointer group shrink-0"
                  >
                    <img
                      src={gulfCvData.photoDataUrl}
                      alt={gulfCvData.fullName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-[center_15%]"
                    />
                    <div className="no-print absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium p-1 text-center">
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>ക്രമീകരിക്കുക</span>
                    </div>
                  </div>
                  <div className="no-print flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRawCropPhotoUrl(gulfCvData.photoDataUrl || null);
                        setCropZoom(1.05);
                        setCropOffsetX(0);
                        setCropOffsetY(0);
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-[10px] font-bold border border-slate-200 cursor-pointer"
                      title="ഫോട്ടോ സൂം & അലൈൻ ചെയ്യുക"
                    >
                      ✂️ ക്രോപ്പ്
                    </button>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-800 text-[10px] font-bold border border-slate-200 cursor-pointer"
                      title="മറ്റൊരു ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക"
                    >
                      📷 മാറ്റുക
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateGulfCv({ ...gulfCvData, photoDataUrl: '' })}
                      className="px-1 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 cursor-pointer"
                      title="ഫോട്ടോ ഒഴിവാക്കുക"
                    >
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 text-[11px] font-medium text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>+ പാസ്പോർട്ട് ഫോട്ടോ</span>
                </button>
              )}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Compact Visa / License / Passport Strip — ONLY rendered in PDF/print if meaningful values exist */}
          {(isMeaningfulCvField(gulfCvData.visaStatus) ||
            isMeaningfulCvField(gulfCvData.drivingLicense) ||
            isMeaningfulCvField(gulfCvData.passportNumber)) && (
            <div className="mt-3 py-2 px-3 bg-slate-50/80 border-y border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
              {isMeaningfulCvField(gulfCvData.visaStatus) && (
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px] group">
                  <span className="text-slate-500 font-semibold shrink-0">{labels.visaLabel}</span>
                  <input
                    type="text"
                    value={gulfCvData.visaStatus}
                    onChange={(e) =>
                      onUpdateGulfCv({ ...gulfCvData, visaStatus: e.target.value })
                    }
                    className={`${touchBoxClass(gulfCvData.visaStatus)} font-bold text-slate-900`}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateGulfCv({ ...gulfCvData, visaStatus: '' })}
                    title="വിസ വിവരം ഒഴിവാക്കുക (Hide Visa in PDF)"
                    className="no-print opacity-60 hover:opacity-100 text-red-500 hover:bg-red-50 rounded px-1 text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
              {isMeaningfulCvField(gulfCvData.drivingLicense) && (
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px] group">
                  <span className="text-slate-500 font-semibold shrink-0">{labels.licenseLabel}</span>
                  <input
                    type="text"
                    value={gulfCvData.drivingLicense}
                    onChange={(e) =>
                      onUpdateGulfCv({ ...gulfCvData, drivingLicense: e.target.value })
                    }
                    className={`${touchBoxClass(gulfCvData.drivingLicense)} font-bold text-slate-900`}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateGulfCv({ ...gulfCvData, drivingLicense: '' })}
                    title="ലൈസൻസ് വിവരം ഒഴിവാക്കുക (Hide License in PDF)"
                    className="no-print opacity-60 hover:opacity-100 text-red-500 hover:bg-red-50 rounded px-1 text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
              {isMeaningfulCvField(gulfCvData.passportNumber) && (
                <div className="flex items-center gap-1.5 flex-1 min-w-[160px] group">
                  <span className="text-slate-500 font-semibold shrink-0">{labels.passportLabel}</span>
                  <input
                    type="text"
                    value={gulfCvData.passportNumber}
                    onChange={(e) =>
                      onUpdateGulfCv({ ...gulfCvData, passportNumber: e.target.value })
                    }
                    className={`${touchBoxClass(gulfCvData.passportNumber)} font-mono-num font-bold text-slate-900`}
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateGulfCv({ ...gulfCvData, passportNumber: '' })}
                    title="പാസ്പോർട്ട് നമ്പർ ഒഴിവാക്കുക (Hide Passport in PDF)"
                    className="no-print opacity-60 hover:opacity-100 text-red-500 hover:bg-red-50 rounded px-1 text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Restore Buttons for Optional Gulf Fields (Hidden in Print/PDF) */}
          {(!isMeaningfulCvField(gulfCvData.visaStatus) ||
            !isMeaningfulCvField(gulfCvData.drivingLicense) ||
            !isMeaningfulCvField(gulfCvData.passportNumber)) && (
            <div className="no-print mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-medium">ആവശ്യമെങ്കിൽ മാത്രം ചേർക്കാം:</span>
              {!isMeaningfulCvField(gulfCvData.visaStatus) && (
                <button
                  type="button"
                  onClick={() => onUpdateGulfCv({ ...gulfCvData, visaStatus: 'Visit Visa (Available Immediately)' })}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-semibold border border-slate-200 cursor-pointer"
                >
                  + Visa Status ചേർക്കുക
                </button>
              )}
              {!isMeaningfulCvField(gulfCvData.drivingLicense) && (
                <button
                  type="button"
                  onClick={() => onUpdateGulfCv({ ...gulfCvData, drivingLicense: 'Valid UAE / GCC Light Vehicle License' })}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-semibold border border-slate-200 cursor-pointer"
                >
                  + Driving License ചേർക്കുക
                </button>
              )}
              {!isMeaningfulCvField(gulfCvData.passportNumber) && (
                <button
                  type="button"
                  onClick={() => onUpdateGulfCv({ ...gulfCvData, passportNumber: 'Valid Indian Passport' })}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-semibold border border-slate-200 cursor-pointer"
                >
                  + Passport ചേർക്കുക
                </button>
              )}
            </div>
          )}

          {/* Professional Summary */}
          {gulfCvData.professionalSummary && (
            <div className="mt-5 pdf-keep-together">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                {labels.summaryHeading}
              </h2>
              <textarea
                rows={Math.max(2, Math.ceil(gulfCvData.professionalSummary.length / 82))}
                value={gulfCvData.professionalSummary}
                onChange={(e) =>
                  onUpdateGulfCv({ ...gulfCvData, professionalSummary: e.target.value })
                }
                className={`${touchBoxClass(gulfCvData.professionalSummary)} text-[13px] leading-[1.68] text-slate-800 resize-none`}
              />
            </div>
          )}

          {/* Work Experience */}
          <div
            data-audit-section="cv_experience"
            className={`mt-5 ${sectionHighlightClass('cv_experience')}`}
          >
            {renderSectionMistakeBadge('cv_experience')}
            <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-3 group">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                {labels.workHeading}
              </h2>
              <button
                type="button"
                onClick={() =>
                  onUpdateGulfCv({
                    ...gulfCvData,
                    workExperience: [
                      ...gulfCvData.workExperience,
                      {
                        role: 'Job Role / Title',
                        company: 'Institution / Company',
                        location: gulfCvData.cvPlace || '',
                        duration: '2022 – Present',
                        highlights: ['Key responsibility and achievement...'],
                      },
                    ],
                  })
                }
                className="no-print opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Job</span>
              </button>
            </div>

            <div className="space-y-4">
              {gulfCvData.workExperience.map((exp, idx) => (
                <div key={idx} className="text-[12.5px] space-y-1 relative group pdf-keep-together">
                  {/* Clean Two-Row Executive Job Header using explicit flex widths (Never squashes long company names vertically!) */}
                  <div className="space-y-0.5">
                    <div className="flex flex-row justify-between items-baseline gap-3 w-full">
                      <div className="w-[68%] min-w-0">
                        <input
                          type="text"
                          value={exp.role}
                          placeholder="Job Title / Role"
                          onChange={(e) => {
                            const next = [...gulfCvData.workExperience];
                            next[idx] = { ...exp, role: e.target.value };
                            onUpdateGulfCv({ ...gulfCvData, workExperience: next });
                          }}
                          className={`${touchBoxClass(exp.role)} font-extrabold text-slate-900 text-[13.5px]`}
                        />
                      </div>
                      <div className="w-[30%] text-right shrink-0">
                        <input
                          type="text"
                          value={exp.duration}
                          placeholder="Duration"
                          onChange={(e) => {
                            const next = [...gulfCvData.workExperience];
                            next[idx] = { ...exp, duration: e.target.value };
                            onUpdateGulfCv({ ...gulfCvData, workExperience: next });
                          }}
                          className={`${touchBoxClass(exp.duration)} font-mono-num text-[11.5px] font-semibold text-slate-600 text-right`}
                        />
                      </div>
                    </div>
                    <div className="flex flex-row justify-between items-baseline gap-3 w-full">
                      <div className="w-[68%] min-w-0">
                        <input
                          type="text"
                          value={exp.company}
                          placeholder="Company / Organization"
                          onChange={(e) => {
                            const next = [...gulfCvData.workExperience];
                            next[idx] = { ...exp, company: e.target.value };
                            onUpdateGulfCv({ ...gulfCvData, workExperience: next });
                          }}
                          className={`${touchBoxClass(exp.company)} font-bold text-emerald-800`}
                        />
                      </div>
                      <div className="w-[30%] text-right shrink-0">
                        {exp.location && (
                          <input
                            type="text"
                            value={exp.location}
                            placeholder="Location"
                            onChange={(e) => {
                              const next = [...gulfCvData.workExperience];
                              next[idx] = { ...exp, location: e.target.value };
                              onUpdateGulfCv({ ...gulfCvData, workExperience: next });
                            }}
                            className={`${touchBoxClass(exp.location)} text-[11.5px] text-slate-600 text-right`}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-line wrapping bullet points (Never cuts off long Malayalam/English lines!) */}
                  <div className="space-y-1 pl-3 pt-0.5">
                    {exp.highlights.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2">
                        <span className="mt-1 text-slate-500 select-none">•</span>
                        <textarea
                          rows={Math.max(1, Math.ceil(bullet.length / 80))}
                          value={bullet}
                          onChange={(e) => {
                            const nextExp = [...gulfCvData.workExperience];
                            const nextBullets = [...exp.highlights];
                            nextBullets[bIdx] = e.target.value;
                            nextExp[idx] = { ...exp, highlights: nextBullets };
                            onUpdateGulfCv({ ...gulfCvData, workExperience: nextExp });
                          }}
                          className={`${touchBoxClass(bullet)} leading-[1.58] text-slate-800 resize-none`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Core Skills Two-Column A4 Flex Row */}
          <div className="mt-5 flex flex-row justify-between items-start gap-7 w-full pdf-keep-together">
            <div className="w-[48%] min-w-0">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                {labels.educationHeading}
              </h2>
              <div className="space-y-3 text-[12.5px]">
                {gulfCvData.education.map((edu, idx) => (
                  <div key={idx} className="space-y-0.5 pdf-keep-together">
                    <div className="flex flex-row justify-between items-baseline gap-2 w-full">
                      <div className="w-[76%] min-w-0">
                        <textarea
                          rows={Math.max(1, Math.ceil(edu.degree.length / 38))}
                          value={edu.degree}
                          placeholder="Degree / Qualification"
                          onChange={(e) => {
                            const next = [...gulfCvData.education];
                            next[idx] = { ...edu, degree: e.target.value };
                            onUpdateGulfCv({ ...gulfCvData, education: next });
                          }}
                          className={`${touchBoxClass(edu.degree)} font-bold text-slate-900 resize-none leading-snug`}
                        />
                      </div>
                      <div className="w-[22%] text-right shrink-0">
                        {edu.year && (
                          <input
                            type="text"
                            value={edu.year}
                            placeholder="Year"
                            onChange={(e) => {
                              const next = [...gulfCvData.education];
                              next[idx] = { ...edu, year: e.target.value };
                              onUpdateGulfCv({ ...gulfCvData, education: next });
                            }}
                            className={`${touchBoxClass(edu.year)} font-mono-num text-right text-slate-500 text-[11px]`}
                          />
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={Math.max(1, Math.ceil(edu.institution.length / 44))}
                      value={edu.institution}
                      placeholder="University / Institution"
                      onChange={(e) => {
                        const next = [...gulfCvData.education];
                        next[idx] = { ...edu, institution: e.target.value };
                        onUpdateGulfCv({ ...gulfCvData, education: next });
                      }}
                      className={`${touchBoxClass(edu.institution)} text-slate-700 resize-none leading-snug block`}
                    />
                  </div>
                ))}

                {/* Languages Known under Education column */}
                {gulfCvData.languages && gulfCvData.languages.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      {labels.languagesHeading}
                    </p>
                    <textarea
                      rows={Math.max(1, Math.ceil(gulfCvData.languages.join(', ').length / 42))}
                      value={gulfCvData.languages.join(', ')}
                      onChange={(e) =>
                        onUpdateGulfCv({
                          ...gulfCvData,
                          languages: e.target.value
                            .split(',')
                            .map((s, idx) => (idx === 0 ? s : s.replace(/^\s+/, ''))),
                        })
                      }
                      className={`${touchBoxClass()} text-[12px] font-medium text-slate-800 resize-none`}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="w-[48%] min-w-0">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-2.5 group">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  {labels.skillsHeading}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateGulfCv({
                      ...gulfCvData,
                      coreSkills: [...gulfCvData.coreSkills, 'New Skill'],
                    })
                  }
                  className="no-print opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Skill</span>
                </button>
              </div>
              <div className="space-y-1 text-[12.5px] text-slate-800">
                {gulfCvData.coreSkills.map((skill, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5 text-slate-500 select-none">•</span>
                    <textarea
                      rows={Math.max(1, Math.ceil(skill.length / 40))}
                      value={skill}
                      onChange={(e) => {
                        const next = [...gulfCvData.coreSkills];
                        next[idx] = e.target.value;
                        onUpdateGulfCv({ ...gulfCvData, coreSkills: next });
                      }}
                      className={`${touchBoxClass(skill)} font-medium leading-snug resize-none`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Declaration & Signature */}
          <div className="mt-auto pt-3 border-t border-slate-200 text-xs text-slate-700 pdf-keep-together">
            <textarea
              rows={Math.max(1, Math.ceil((gulfCvData.declaration || '').length / 90))}
              value={gulfCvData.declaration}
              onChange={(e) =>
                onUpdateGulfCv({ ...gulfCvData, declaration: e.target.value })
              }
              className={`${touchBoxClass(gulfCvData.declaration)} italic mb-3 resize-none`}
            />
            <div className="flex flex-row justify-between items-end gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 shrink-0">
                  {labels.cvPlaceLabel}
                </span>
                <input
                  type="text"
                  value={
                    gulfCvData.cvPlace !== undefined
                      ? gulfCvData.cvPlace
                      : gulfCvData.currentLocation.split(',')[0] || ''
                  }
                  placeholder="City / Location"
                  onChange={(e) =>
                    onUpdateGulfCv({ ...gulfCvData, cvPlace: e.target.value })
                  }
                  className={`${touchBoxClass(gulfCvData.cvPlace, 'w-52')} font-semibold text-slate-900`}
                />
              </div>
              <div className="text-right min-w-[200px] space-y-0.5">
                <input
                  type="text"
                  value={
                    gulfCvData.signatureName !== undefined
                      ? gulfCvData.signatureName
                      : gulfCvData.fullName
                  }
                  placeholder="SIGNATURE"
                  onChange={(e) =>
                    onUpdateGulfCv({ ...gulfCvData, signatureName: e.target.value })
                  }
                  className={`${touchBoxClass(gulfCvData.signatureName)} text-right font-bold text-slate-900`}
                />
                <p className="text-[11px] text-slate-500">{labels.cvSignatureLabel}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. RENTAL AGREEMENT / AFFIDAVIT (STAMP PAPER READY - TOUCH TO EDIT)
         ===================================================================== */}
      {category === 'rental_agreement' && (
        <div
          data-a4-single-page-inner="true"
          className={`font-malayalam px-12 pb-8 min-h-[1123px] flex flex-col justify-between ${textSizeClass}`}
        >
          <div
            style={{ height: `${agreementData.stampPaperHeaderSpaceMm}mm` }}
            className="w-full relative flex items-center justify-center border-b border-dashed border-amber-300/80 mb-6 transition-all"
          >
            <div className="no-print text-center px-4 py-2 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs shadow-2xs space-y-1.5">
              <p className="font-bold">
                മുദ്രപ്പത്രത്തിന്റെ മൂല്യവും തലഭാഗത്തെ ഒഴിച്ചിടേണ്ട സ്ഥലവും:{' '}
                <span className="text-amber-700 font-extrabold">
                  {(agreementData.stampPaperHeaderSpaceMm / 25.4).toFixed(1)} ഇഞ്ച്
                </span>{' '}
                ({agreementData.stampPaperHeaderSpaceMm} mm)
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[10.5px] font-extrabold text-amber-900">മുദ്രപ്പത്രം:</span>
                {[
                  { label: '₹200 മുദ്രപത്രം', denom: '₹200', defaultMm: 90 },
                  { label: '₹500 മുദ്രപത്രം', denom: '₹500', defaultMm: 90 },
                  { label: '₹100 മുദ്രപത്രം', denom: '₹100', defaultMm: 90 },
                  { label: 'വെള്ള പേപ്പർ (Plain A4)', denom: 'plain', defaultMm: 20 },
                ].map((stampOpt) => {
                  const isSelected =
                    stampOpt.denom === 'plain'
                      ? agreementData.stampPaperHeaderSpaceMm <= 25 &&
                        !/₹(100|200|500)\s*രൂപയുടെ\s*മുദ്രപ്പത്രത്തിൽ/.test(
                          agreementData.preambleParagraph
                        )
                      : agreementData.preambleParagraph.includes(
                          `${stampOpt.denom} രൂപയുടെ മുദ്രപ്പത്രത്തിൽ`
                        );
                  return (
                    <button
                      key={stampOpt.denom}
                      type="button"
                      onClick={() => {
                        const basePreamble = agreementData.preambleParagraph
                          .replace(/\s*\(₹\d+\s*രൂപയുടെ\s*മുദ്രപ്പത്രത്തിൽ\s*തയ്യാറാക്കുന്നത്\)\.?\s*/g, '')
                          .replace(/\.$/, '');
                        const nextPreamble =
                          stampOpt.denom === 'plain'
                            ? `${basePreamble}.`
                            : `${basePreamble} (${stampOpt.denom} രൂപയുടെ മുദ്രപ്പത്രത്തിൽ തയ്യാറാക്കുന്നത്).`;
                        onUpdateAgreement({
                          ...agreementData,
                          stampPaperHeaderSpaceMm:
                            stampOpt.denom === 'plain'
                              ? 20
                              : agreementData.stampPaperHeaderSpaceMm <= 25
                              ? stampOpt.defaultMm
                              : agreementData.stampPaperHeaderSpaceMm,
                          preambleParagraph: nextPreamble,
                        });
                      }}
                      className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-extrabold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-white text-emerald-950 border border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {stampOpt.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold text-amber-800">തലഭാഗം ഗ്യാപ്പ്:</span>
                {[
                  { label: '0 ഇഞ്ച് (സാധാ പേപ്പർ)', mm: 20 },
                  { label: '3 ഇഞ്ച് (75mm)', mm: 75 },
                  { label: '3.5 ഇഞ്ച് (90mm)', mm: 90 },
                  { label: '4 ഇഞ്ച് (100mm)', mm: 100 },
                  { label: '⚡ 4.5 ഇഞ്ച് (114mm - Stamp Paper)', mm: 114 },
                ].map((preset) => (
                  <button
                    key={preset.mm}
                    type="button"
                    onClick={() =>
                      onUpdateAgreement({
                        ...agreementData,
                        stampPaperHeaderSpaceMm: preset.mm,
                      })
                    }
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      Math.abs(agreementData.stampPaperHeaderSpaceMm - preset.mm) <= 3
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            data-audit-section="agreement_header"
            className={`text-center mb-6 space-y-1.5 ${sectionHighlightClass('agreement_header')}`}
          >
            <div className="flex justify-center">
              {renderSectionMistakeBadge('agreement_header')}
            </div>
            <input
              type="text"
              value={agreementData.titleMalayalam}
              onChange={(e) =>
                onUpdateAgreement({ ...agreementData, titleMalayalam: e.target.value })
              }
              className={`${touchBoxClass(agreementData.titleMalayalam)} text-center text-lg font-bold underline underline-offset-8`}
            />
            <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <span>സ്ഥലം:</span>
                <input
                  type="text"
                  value={agreementData.executionPlace}
                  onChange={(e) =>
                    onUpdateAgreement({ ...agreementData, executionPlace: e.target.value })
                  }
                  className={`${touchBoxClass(agreementData.executionPlace)} w-28`}
                />
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <span>തീയതി:</span>
                <input
                  type="text"
                  value={agreementData.executionDate}
                  onChange={(e) =>
                    onUpdateAgreement({ ...agreementData, executionDate: e.target.value })
                  }
                  className={`${touchBoxClass(agreementData.executionDate)} font-mono-num w-28`}
                />
              </div>
            </div>
          </div>

          <div
            data-audit-section="agreement_parties"
            className={`space-y-4 mb-5 ${sectionHighlightClass('agreement_parties')}`}
          >
            {renderSectionMistakeBadge('agreement_parties')}
            <div>
              <input
                type="text"
                value={agreementData.firstPartyLabel}
                onChange={(e) =>
                  onUpdateAgreement({ ...agreementData, firstPartyLabel: e.target.value })
                }
                className={`${touchBoxClass(agreementData.firstPartyLabel)} font-bold text-slate-900`}
              />
              <textarea
                rows={2}
                value={agreementData.firstPartyDetails}
                onChange={(e) =>
                  onUpdateAgreement({
                    ...agreementData,
                    firstPartyDetails: e.target.value,
                  })
                }
                className={`${touchBoxClass(agreementData.firstPartyDetails)} pl-3 text-slate-800 mt-1 resize-none`}
              />
            </div>

            <div>
              <input
                type="text"
                value={agreementData.secondPartyLabel}
                onChange={(e) =>
                  onUpdateAgreement({ ...agreementData, secondPartyLabel: e.target.value })
                }
                className={`${touchBoxClass(agreementData.secondPartyLabel)} font-bold text-slate-900`}
              />
              <textarea
                rows={2}
                value={agreementData.secondPartyDetails}
                onChange={(e) =>
                  onUpdateAgreement({
                    ...agreementData,
                    secondPartyDetails: e.target.value,
                  })
                }
                className={`${touchBoxClass(agreementData.secondPartyDetails)} pl-3 text-slate-800 mt-1 resize-none`}
              />
            </div>
          </div>

          <textarea
            rows={2}
            value={agreementData.preambleParagraph}
            onChange={(e) =>
              onUpdateAgreement({ ...agreementData, preambleParagraph: e.target.value })
            }
            className={`${touchBoxClass(agreementData.preambleParagraph)} text-justify font-medium text-slate-900 mb-4 leading-[1.82] resize-none`}
          />

          <div className="space-y-3 text-justify mb-6">
            {agreementData.clauses.map((clause, idx) => (
              <div key={idx} className="pdf-keep-together">
                <textarea
                  rows={Math.max(2, Math.ceil(clause.length / 65))}
                  value={clause}
                  onChange={(e) => {
                    const updated = [...agreementData.clauses];
                    updated[idx] = e.target.value;
                    onUpdateAgreement({ ...agreementData, clauses: updated });
                  }}
                  className={`${touchBoxClass(clause)} leading-[1.8] text-slate-800 resize-y`}
                />
              </div>
            ))}
          </div>

          {agreementData.schedulePropertyDetails !== undefined &&
            (agreementData.subType !== 'സത്യവാങ്മൂലം (Affidavit)' ||
              Boolean(agreementData.schedulePropertyDetails?.trim())) && (
            <div className="border border-slate-300 rounded p-3.5 mb-6 bg-slate-50/40 pdf-keep-together">
              <input
                type="text"
                value={
                  agreementData.scheduleHeadingOverride ?? 'വസ്തു / കെട്ടിട പട്ടിക വിവരം :'
                }
                onChange={(e) =>
                  onUpdateAgreement({
                    ...agreementData,
                    scheduleHeadingOverride: e.target.value,
                  })
                }
                className={`${touchBoxClass(
                  agreementData.scheduleHeadingOverride ?? 'വസ്തു / കെട്ടിട പട്ടിക വിവരം :'
                )} font-bold text-slate-900 mb-1`}
              />
              <textarea
                rows={2}
                value={agreementData.schedulePropertyDetails}
                onChange={(e) =>
                  onUpdateAgreement({
                    ...agreementData,
                    schedulePropertyDetails: e.target.value,
                  })
                }
                className={`${touchBoxClass(agreementData.schedulePropertyDetails)} text-slate-800 text-xs leading-relaxed resize-none`}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 pt-4 mb-6 pdf-keep-together">
            <div>
              <input
                type="text"
                value={agreementData.firstPartyLabel}
                onChange={(e) =>
                  onUpdateAgreement({ ...agreementData, firstPartyLabel: e.target.value })
                }
                className={`${touchBoxClass(agreementData.firstPartyLabel)} font-bold text-slate-900`}
              />
              <input
                type="text"
                value={
                  agreementData.firstPartySignatureLabelOverride ??
                  'ഒപ്പ് : ........................................'
                }
                onChange={(e) =>
                  onUpdateAgreement({
                    ...agreementData,
                    firstPartySignatureLabelOverride: e.target.value,
                  })
                }
                className={`${touchBoxClass(
                  agreementData.firstPartySignatureLabelOverride ??
                    'ഒപ്പ് : ........................................'
                )} mt-6 text-xs text-slate-600`}
              />
            </div>
            <div className="text-right">
              <input
                type="text"
                value={agreementData.secondPartyLabel}
                onChange={(e) =>
                  onUpdateAgreement({ ...agreementData, secondPartyLabel: e.target.value })
                }
                className={`${touchBoxClass(agreementData.secondPartyLabel)} text-right font-bold text-slate-900`}
              />
              <input
                type="text"
                value={
                  agreementData.secondPartySignatureLabelOverride ??
                  'ഒപ്പ് : ........................................'
                }
                onChange={(e) =>
                  onUpdateAgreement({
                    ...agreementData,
                    secondPartySignatureLabelOverride: e.target.value,
                  })
                }
                className={`${touchBoxClass(
                  agreementData.secondPartySignatureLabelOverride ??
                    'ഒപ്പ് : ........................................'
                )} mt-6 text-right text-xs text-slate-600`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 pdf-keep-together">
            <input
              type="text"
              value={agreementData.witnessesHeadingOverride ?? 'സാക്ഷികൾ (Witnesses) :'}
              onChange={(e) =>
                onUpdateAgreement({
                  ...agreementData,
                  witnessesHeadingOverride: e.target.value,
                })
              }
              className={`${touchBoxClass(
                agreementData.witnessesHeadingOverride ?? 'സാക്ഷികൾ (Witnesses) :'
              )} font-bold text-slate-900 mb-2 max-w-xs`}
            />
            <div className="space-y-1.5 text-xs text-slate-800">
              {agreementData.witnesses.map((w, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={w}
                  onChange={(e) => {
                    const nextW = [...agreementData.witnesses];
                    nextW[idx] = e.target.value;
                    onUpdateAgreement({ ...agreementData, witnesses: nextW });
                  }}
                  className={touchBoxClass(w)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. TEACHER & MADRASA MARK LIST / PROGRESS REPORT (8 MODELS + MULTI-PAGE A4)
         ===================================================================== */}
      {category === 'teacher_marklist' && (
        <div className="font-malayalam text-slate-900">
          {/* NO-PRINT COMPACT TEACHER & USTHAD CONTROL BAR (Always shows key controls + 1-click School/Madrasa form switcher!) */}
          <div className="no-print bg-emerald-950 text-white px-3.5 py-2.5 border-b border-emerald-800 space-y-2.5">
            {/* Row 0: Quick Switcher for School & Madrasa Letters/Forms (1-Click access inside School/Madrasa category) */}
            {onSelectQuickTemplateById && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-emerald-800/80 scrollbar-none">
                <span className="text-[10.5px] font-extrabold text-amber-300 shrink-0">
                  🎓 സ്കൂൾ & മദ്രസ ഫോമുകൾ:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const found = MARKLIST_PRESET_MODELS.find((p) => p.id === 'class-attendance-register');
                    if (found) onUpdateMarkList(found.buildData());
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold shrink-0 cursor-pointer transition-colors ${
                    markListData.modelPresetId === 'class-attendance-register'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-900 hover:bg-emerald-800 text-emerald-100 border border-emerald-700'
                  }`}
                >
                  📋 ഹാജർ പട്ടിക
                </button>
                {[
                  { id: 'school-student-leave-letter', label: '📝 കുട്ടി ലീവ് ലെറ്റർ' },
                  { id: 'school-leave-tc', label: '📜 ടി.സി (TC) അപേക്ഷ' },
                  { id: 'school-bonafide-study-certificate', label: '🎓 ബോണഫൈഡ് സർട്ടിഫിക്കറ്റ്' },
                  { id: 'school-study-tour-consent', label: '🚌 പഠനയാത്ര സമ്മതപത്രം' },
                  { id: 'school-fee-concession-scholarship', label: '💰 ഫീസ് ഇളവ് അപേക്ഷ' },
                  { id: 'school-teacher-casual-duty-leave', label: '👨‍🏫 ടീച്ചർ ലീവ്' },
                  { id: 'school-pta-meeting-notice', label: '📢 PTA നോട്ടീസ്' },
                  { id: 'school-assembly-speech', label: '🎤 പ്രസംഗം' },
                  { id: 'school-project-cover', label: '📘 പ്രോജക്റ്റ് കവർ' },
                  { id: 'madrasa-tc-application-tpl', label: '🕌 മദ്രസ ടി.സി' },
                  { id: 'madrasa-usthad-leave-tpl', label: '🕌 ഉസ്താദ് ലീവ്' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectQuickTemplateById(item.id)}
                    className="px-2 py-0.5 rounded-md bg-emerald-900/90 hover:bg-amber-400 hover:text-slate-950 text-emerald-100 border border-emerald-700 text-[10.5px] font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {/* Row 1: Model Selector, +1 Student, +Subject, Bulk Paste Names, and More Options */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <select
                  aria-label="മാർക്ക് ലിസ്റ്റ് മോഡൽ തിരഞ്ഞെടുക്കുക"
                  value={markListData.modelPresetId || MARKLIST_PRESET_MODELS[0].id}
                  onChange={(e) => {
                    const found = MARKLIST_PRESET_MODELS.find((p) => p.id === e.target.value);
                    if (found) onUpdateMarkList(found.buildData());
                  }}
                  className="bg-emerald-900 text-white border border-emerald-700 rounded-lg px-2.5 py-1 text-xs font-malayalam font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {MARKLIST_PRESET_MODELS.map((preset) => (
                    <option key={preset.id} value={preset.id} className="bg-slate-900 text-white">
                      {preset.badgeIcon} {preset.titleMalayalam}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleAddStudentRows(1)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+1 കുട്ടി</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddSubjectColumn}
                  className="px-2.5 py-1 rounded-lg bg-white text-emerald-950 hover:bg-amber-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ വിഷയം</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBulkPasteBox((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/60 text-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>📋 പേരുകൾ ഒന്നിച്ച് പേസ്റ്റ് ചെയ്യാം</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 bg-emerald-900/90 border border-emerald-700 rounded-lg px-2 py-0.5 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span className="text-emerald-200 font-bold">എണ്ണം:</span>
                  {[15, 30, 50, 100].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSetExactStudentCount(cnt)}
                      className={`px-1.5 py-0.5 rounded font-mono-num font-bold cursor-pointer transition-colors ${
                        markListData.students.length === cnt
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-950 hover:bg-emerald-800 text-emerald-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <input
                    type="number"
                    min={1}
                    max={300}
                    aria-label="കുട്ടികളുടെ എണ്ണം ടൈപ്പ് ചെയ്യുക"
                    title="ഇഷ്ടമുള്ള കുട്ടികളുടെ എണ്ണം ടൈപ്പ് ചെയ്ത് Enter അമർത്തുക (1 - 300)"
                    value={customStudentCountInput}
                    onChange={(e) => setCustomStudentCountInput(e.target.value)}
                    onBlur={commitCustomStudentCountInput}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitCustomStudentCountInput();
                      }
                    }}
                    className="w-12 px-1 py-0.5 rounded bg-white text-slate-950 font-mono-num font-extrabold text-center text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button
                    type="button"
                    onClick={commitCustomStudentCountInput}
                    title="കുട്ടികളുടെ എണ്ണം ക്രമീകരിക്കുക"
                    className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[10px] cursor-pointer"
                  >
                    ✓
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMarkListControls((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  {showMarkListControls ? 'ക്രമീകരണങ്ങൾ ✕' : 'കൂടുതൽ ഓപ്ഷനുകൾ ▾'}
                </button>
              </div>
            </div>

            {showBulkPasteBox && (
              <div className="bg-emerald-900/95 border border-emerald-700 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-amber-200">
                  വാട്സാപ്പിൽ നിന്നോ എക്സലിൽ നിന്നോ കുട്ടികളുടെ പേരുകൾ (ഒരു വരിയിൽ ഒരാൾ വീതം — 100 പേർ വരെ) താഴെ പേസ്റ്റ് ചെയ്യുക:
                </p>
                <textarea
                  rows={4}
                  value={bulkPasteNamesText}
                  onChange={(e) => setBulkPasteNamesText(e.target.value)}
                  placeholder={'1. അർജുൻ കെ.\n2. ഫാത്തിമ സഹ്റ\n3. ആദിത്യൻ എസ്.\n...'}
                  className="w-full rounded-lg bg-white text-slate-900 p-2 text-xs font-malayalam focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPasteBox(false)}
                    className="px-3 py-1 rounded-lg bg-emerald-800 text-emerald-100 text-xs font-bold cursor-pointer"
                  >
                    അടയ്ക്കുക
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBulkPastedNames}
                    className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                  >
                    ✓ പേരുകൾ ചേർക്കുക
                  </button>
                </div>
              </div>
            )}

            {showMarkListControls && (
              <div className="pt-2 border-t border-emerald-800/80 space-y-2.5 text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-emerald-200 font-bold">രീതി:</span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          evaluationMode: 'lp_up_grade_only',
                          showTotalAndPercentage: false,
                          showRankColumn: false,
                          showRemarksColumn: true,
                          gradingScaleNote:
                            'കേരള SCERT CCE ഗ്രേഡിങ്ങ് സൂചിക (LP / UP — നമ്പർ മാർക്കില്ല): A : ഏറ്റവും മികച്ചത് | B : മികച്ചത് | C : ശരാശരി | D : മെച്ചപ്പെടേണ്ടത് | E : പ്രത്യേക പിന്തുണ ആവശ്യം',
                        })
                      }
                      className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                        isGradeOnlyMode
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800 border border-emerald-700'
                      }`}
                    >
                      LP/UP ഗ്രേഡ് മാത്രം (A–E)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          evaluationMode: 'marks_grade_rank',
                          showTotalAndPercentage: true,
                          showRankColumn: true,
                        })
                      }
                      className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                        !isGradeOnlyMode
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800 border border-emerald-700'
                      }`}
                    >
                      മാർക്ക് + ഗ്രേഡ് + റാങ്ക്
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          showTotalAndPercentage: !showTotalAndPct,
                        })
                      }
                      className={`px-2 py-1 rounded border text-[10.5px] font-bold cursor-pointer ${
                        showTotalAndPct
                          ? 'bg-emerald-800 border-emerald-500 text-white'
                          : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      }`}
                    >
                      {showTotalAndPct ? '✓ ആകെ & %' : '+ ആകെ & %'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          showRankColumn: !showRankCol,
                        })
                      }
                      className={`px-2 py-1 rounded border text-[10.5px] font-bold cursor-pointer ${
                        showRankCol
                          ? 'bg-emerald-800 border-emerald-500 text-white'
                          : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      }`}
                    >
                      {showRankCol ? '✓ റാങ്ക്' : '+ റാങ്ക്'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          showRemarksColumn: !showRemarksCol,
                        })
                      }
                      className={`px-2 py-1 rounded border text-[10.5px] font-bold cursor-pointer ${
                        showRemarksCol
                          ? 'bg-emerald-800 border-emerald-500 text-white'
                          : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      }`}
                    >
                      {showRemarksCol ? '✓ അഭിപ്രായം' : '+ അഭിപ്രായം'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          showSummaryCards: !showSummaryBox,
                        })
                      }
                      className={`px-2 py-1 rounded border text-[10.5px] font-bold cursor-pointer ${
                        showSummaryBox
                          ? 'bg-emerald-800 border-emerald-500 text-white'
                          : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                      }`}
                    >
                      {showSummaryBox ? '✓ സംഗ്രഹ ബോക്സ്' : '+ സംഗ്രഹ ബോക്സ്'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateMarkList({
                          ...markListData,
                          showHeadmasterSignature: !showHeadmasterBlock,
                        })
                      }
                      className={`px-2 py-1 rounded border text-[10.5px] font-bold flex items-center gap-1 cursor-pointer ${
                        showHeadmasterBlock
                          ? 'bg-emerald-800 border-emerald-500 text-white'
                          : 'bg-rose-950 border-rose-700 text-rose-200'
                      }`}
                    >
                      {showHeadmasterBlock ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>ഹെഡ്മാസ്റ്റർ ഒപ്പ്: ഉണ്ട്</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>ഹെഡ്മാസ്റ്റർ ഒപ്പ്: ഒഴിവാക്കി</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-800/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddStudentRows(5)}
                      className="px-2 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                    >
                      +5 കുട്ടികൾ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStudentRows(10)}
                      className="px-2 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                    >
                      +10 കുട്ടികൾ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* =================================================================
              MULTI-PAGE A4 RENDERING (.a4-explicit-page per sheet)
             ================================================================= */}
          {paginatedMarkListPages.map((pageRows, pageIdx) => {
            const totalPages = paginatedMarkListPages.length;
            const isFirstPage = pageIdx === 0;
            const isLastPage = pageIdx === totalPages - 1;

            return (
              <div
                key={pageIdx}
                className={`a4-explicit-page bg-white px-8 py-7 flex flex-col justify-between min-h-[296mm] ${
                  !isLastPage ? 'border-b-8 border-dashed border-slate-300' : ''
                }`}
              >
                <div>
                  {/* Page Header (Full on Page 1, Compact Continuation Header on Page 2+) */}
                  {isFirstPage ? (
                    <div
                      data-audit-section="marklist_header"
                      className={`text-center border-b-2 border-slate-900 pb-3 mb-3.5 space-y-1 ${sectionHighlightClass('marklist_header')}`}
                    >
                      <div className="flex justify-center">
                        {renderSectionMistakeBadge('marklist_header')}
                      </div>
                      <input
                        type="text"
                        value={markListData.schoolName}
                        onChange={(e) =>
                          onUpdateMarkList({ ...markListData, schoolName: e.target.value })
                        }
                        placeholder="സ്കൂളിന്റെ / മദ്രസയുടെ പേര്"
                        className={`${touchBoxClass(markListData.schoolName)} text-center text-base sm:text-lg font-extrabold text-slate-900`}
                      />
                      <input
                        type="text"
                        value={markListData.examTitle}
                        onChange={(e) =>
                          onUpdateMarkList({ ...markListData, examTitle: e.target.value })
                        }
                        placeholder="പരീക്ഷയുടെ പേര് / തലക്കെട്ട്"
                        className={`${touchBoxClass(markListData.examTitle)} text-center text-xs sm:text-sm font-bold text-emerald-800`}
                      />
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 text-xs font-semibold text-slate-700">
                        <input
                          type="text"
                          value={markListData.classAndDivision}
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              classAndDivision: e.target.value,
                            })
                          }
                          className={`${touchBoxClass(markListData.classAndDivision)} w-44 text-center`}
                        />
                        <span>·</span>
                        <input
                          type="text"
                          value={markListData.academicYear}
                          onChange={(e) =>
                            onUpdateMarkList({ ...markListData, academicYear: e.target.value })
                          }
                          className={`${touchBoxClass(markListData.academicYear)} w-36 text-center font-mono-num`}
                        />
                        {!isGradeOnlyMode && (
                          <>
                            <span>·</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={markListData.maxMarksLabel ?? 'പരമാവധി മാർക്ക്:'}
                                onChange={(e) =>
                                  onUpdateMarkList({
                                    ...markListData,
                                    maxMarksLabel: e.target.value,
                                  })
                                }
                                className={`${touchBoxClass(
                                  markListData.maxMarksLabel ?? 'പരമാവധി മാർക്ക്:'
                                )} w-28 text-right`}
                              />
                              <input
                                type="number"
                                min={5}
                                max={500}
                                value={markListData.maxMarksPerSubject}
                                onChange={(e) =>
                                  onUpdateMarkList({
                                    ...markListData,
                                    maxMarksPerSubject: Number(e.target.value) || 100,
                                  })
                                }
                                className="w-12 font-mono-num font-bold text-center border border-dashed border-amber-500/50 rounded px-1"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-b border-slate-400 pb-2 mb-3 text-xs text-slate-700">
                      <input
                        type="text"
                        value={markListData.schoolName}
                        onChange={(e) =>
                          onUpdateMarkList({ ...markListData, schoolName: e.target.value })
                        }
                        className={`${touchBoxClass(markListData.schoolName)} font-bold text-slate-900 max-w-md`}
                      />
                      <span className="font-mono-num font-bold text-slate-600 shrink-0">
                        {markListData.classAndDivision} · പേജ് {pageIdx + 1} / {totalPages}
                      </span>
                    </div>
                  )}

                  {/* Summary Cards (Only on Page 1 when enabled — Always 4 Columns on 794px A4 Sheet) */}
                  {isFirstPage && showSummaryBox && (
                    <div className="grid grid-cols-4 gap-2 mb-3.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                      <div>
                        <input
                          type="text"
                          value={markListData.summaryTotalStudentsLabel ?? 'ആകെ വിദ്യാർത്ഥികൾ'}
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryTotalStudentsLabel: e.target.value,
                            })
                          }
                          className={`${touchBoxClass(
                            markListData.summaryTotalStudentsLabel ?? 'ആകെ വിദ്യാർത്ഥികൾ'
                          )} text-slate-500 text-[10.5px]`}
                        />
                        <input
                          type="text"
                          value={
                            markListData.summaryTotalStudentsValueOverride ??
                            `${studentStatsMap.totalStudents} പേർ`
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryTotalStudentsValueOverride: e.target.value,
                            })
                          }
                          className={`${touchBoxClass()} font-mono-num font-extrabold text-sm text-slate-900`}
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={
                            markListData.summaryPassPercentageLabel ??
                            (isGradeOnlyMode ? 'പഠന നിലവാരം' : 'വിജയ ശതമാനം (Pass %)')
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryPassPercentageLabel: e.target.value,
                            })
                          }
                          className={`${touchBoxClass(
                            markListData.summaryPassPercentageLabel ?? 'വിജയ ശതമാനം (Pass %)'
                          )} text-slate-500 text-[10.5px]`}
                        />
                        <input
                          type="text"
                          value={
                            markListData.summaryPassPercentageValueOverride ??
                            (isGradeOnlyMode
                              ? '100% (എല്ലാവരും യോഗ്യത നേടി)'
                              : `${studentStatsMap.passPercentage}% (${studentStatsMap.passedCount}/${studentStatsMap.totalStudents})`)
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryPassPercentageValueOverride: e.target.value,
                            })
                          }
                          className={`${touchBoxClass()} font-mono-num font-extrabold text-sm text-emerald-700`}
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={
                            markListData.summaryAPlusCountLabel ??
                            (isGradeOnlyMode ? 'A ഗ്രേഡ് നേടിയവർ' : 'A+ / ഉന്നത ഗ്രേഡ്')
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryAPlusCountLabel: e.target.value,
                            })
                          }
                          className={`${touchBoxClass(
                            markListData.summaryAPlusCountLabel ?? 'A+ ഗ്രേഡ് നേടിയവർ'
                          )} text-slate-500 text-[10.5px]`}
                        />
                        <input
                          type="text"
                          value={
                            markListData.summaryAPlusCountValueOverride ??
                            `${studentStatsMap.aPlusCount} പേർ`
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryAPlusCountValueOverride: e.target.value,
                            })
                          }
                          className={`${touchBoxClass()} font-mono-num font-extrabold text-sm text-amber-800`}
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={
                            markListData.summaryTopperLabel ??
                            (isGradeOnlyMode ? 'മികച്ച പ്രകടനം' : 'ഒന്നാം സ്ഥാനം (Topper)')
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryTopperLabel: e.target.value,
                            })
                          }
                          className={`${touchBoxClass(
                            markListData.summaryTopperLabel ?? 'ഒന്നാം റാങ്ക് (Top Scorer)'
                          )} text-slate-500 text-[10.5px]`}
                        />
                        <input
                          type="text"
                          value={
                            markListData.summaryTopperValueOverride ??
                            `${studentStatsMap.topperName} (${studentStatsMap.topperScore})`
                          }
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              summaryTopperValueOverride: e.target.value,
                            })
                          }
                          className={`${touchBoxClass()} font-bold text-xs text-slate-900 truncate`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mark List / Grade Table (Fits 100% inside 794px A4 Sheet without horizontal clipping) */}
                  <div
                    data-audit-section="marklist_rows"
                    className={`w-full ${sectionHighlightClass('marklist_rows')}`}
                  >
                    {isFirstPage && renderSectionMistakeBadge('marklist_rows')}
                    <table className="w-full border-collapse border border-slate-400 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900">
                          <th className="border border-slate-400 px-1 py-1.5 text-center w-8">
                            <input
                              type="text"
                              value={markListData.rollNoHeader ?? 'നമ്പർ'}
                              onChange={(e) =>
                                onUpdateMarkList({
                                  ...markListData,
                                  rollNoHeader: e.target.value,
                                })
                              }
                              className="w-full text-center font-bold bg-transparent focus:bg-white focus:outline-none"
                            />
                          </th>
                          <th className="border border-slate-400 px-1.5 py-1.5 text-left w-[145px]">
                            <input
                              type="text"
                              value={markListData.studentNameHeader ?? 'വിദ്യാർത്ഥിയുടെ പേര്'}
                              onChange={(e) =>
                                onUpdateMarkList({
                                  ...markListData,
                                  studentNameHeader: e.target.value,
                                })
                              }
                              className="w-full text-left font-bold bg-transparent focus:bg-white focus:outline-none"
                            />
                          </th>
                          {markListData.subjects.map((subj, sIdx) => (
                            <th
                              key={sIdx}
                              className="border border-slate-400 px-1 py-1.5 text-center relative group"
                            >
                              <input
                                type="text"
                                value={subj}
                                onChange={(e) => {
                                  const nextSubjs = [...markListData.subjects];
                                  nextSubjs[sIdx] = e.target.value;
                                  onUpdateMarkList({ ...markListData, subjects: nextSubjs });
                                }}
                                className="w-full text-center font-bold bg-transparent focus:bg-white focus:outline-none"
                              />
                              {markListData.subjects.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectColumn(sIdx)}
                                  title="ഈ വിഷയം ഒഴിവാക്കുക"
                                  className="no-print opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1 bg-red-600 text-white rounded-full w-3.5 h-3.5 text-[9px] leading-none flex items-center justify-center cursor-pointer"
                                >
                                  ×
                                </button>
                              )}
                            </th>
                          ))}
                          {showTotalAndPct && (
                            <>
                              <th className="border border-slate-400 px-1.5 py-1.5 text-center bg-slate-200/70 w-16">
                                <input
                                  type="text"
                                  value={
                                    markListData.totalHeader ??
                                    `ആകെ (${
                                      markListData.subjects.length *
                                      markListData.maxMarksPerSubject
                                    })`
                                  }
                                  onChange={(e) =>
                                    onUpdateMarkList({
                                      ...markListData,
                                      totalHeader: e.target.value,
                                    })
                                  }
                                  className="w-full text-center font-bold bg-transparent focus:bg-white focus:outline-none"
                                />
                              </th>
                              <th className="border border-slate-400 px-1 py-1.5 text-center w-12">
                                <input
                                  type="text"
                                  value={markListData.percentageHeader ?? '%'}
                                  onChange={(e) =>
                                    onUpdateMarkList({
                                      ...markListData,
                                      percentageHeader: e.target.value,
                                    })
                                  }
                                  className="w-full text-center font-bold bg-transparent focus:bg-white focus:outline-none"
                                />
                              </th>
                            </>
                          )}
                          <th className="border border-slate-400 px-1.5 py-1.5 text-center w-14">
                            <input
                              type="text"
                              value={markListData.gradeHeader ?? 'ഗ്രേഡ്'}
                              onChange={(e) =>
                                onUpdateMarkList({
                                  ...markListData,
                                  gradeHeader: e.target.value,
                                })
                              }
                              className="w-full text-center font-bold bg-transparent focus:bg-white focus:outline-none"
                            />
                          </th>
                          {showRankCol && (
                            <th className="border border-slate-400 px-1 py-1.5 text-center w-12">
                              <input
                                type="text"
                                value={markListData.rankHeader ?? 'റാങ്ക്'}
                                onChange={(e) =>
                                  onUpdateMarkList({
                                    ...markListData,
                                    rankHeader: e.target.value,
                                  })
                                }
                                className="w-full text-center font-bold bg-transparent focus:bg-white focus:outline-none"
                              />
                            </th>
                          )}
                          {showRemarksCol && (
                            <th className="border border-slate-400 px-2 py-1.5 text-left min-w-[115px]">
                              <input
                                type="text"
                                value={markListData.remarksHeader ?? 'അഭിപ്രായം (Remarks)'}
                                onChange={(e) =>
                                  onUpdateMarkList({
                                    ...markListData,
                                    remarksHeader: e.target.value,
                                  })
                                }
                                className="w-full text-left font-bold bg-transparent focus:bg-white focus:outline-none"
                              />
                            </th>
                          )}
                          <th className="no-print border border-slate-400 px-1 py-1.5 text-center w-7">
                            -
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map(({ student, globalIdx }) => {
                          const stStats =
                            studentStatsMap.byId[student.id] ||
                            computeStudentStats(
                              student.marks,
                              markListData.subjects.length,
                              markListData.maxMarksPerSubject,
                              student.subjectGrades,
                              markListData.evaluationMode
                            );
                          const stRank = studentStatsMap.rankById[student.id] || globalIdx + 1;

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/80">
                              <td className="border border-slate-400 px-1 py-1 text-center font-mono-num font-semibold">
                                <input
                                  type="text"
                                  value={student.rollNo}
                                  onChange={(e) => {
                                    const nextStudents = [...markListData.students];
                                    nextStudents[globalIdx] = {
                                      ...student,
                                      rollNo: e.target.value,
                                    };
                                    onUpdateMarkList({ ...markListData, students: nextStudents });
                                  }}
                                  className="w-full text-center font-mono-num bg-transparent focus:bg-amber-50 focus:outline-none"
                                />
                              </td>
                              <td className="border border-slate-400 px-1.5 py-1 font-semibold">
                                <input
                                  type="text"
                                  value={student.studentName}
                                  onChange={(e) => {
                                    const nextStudents = [...markListData.students];
                                    nextStudents[globalIdx] = {
                                      ...student,
                                      studentName: e.target.value,
                                    };
                                    onUpdateMarkList({ ...markListData, students: nextStudents });
                                  }}
                                  className="w-full bg-transparent focus:bg-amber-50/60 focus:outline-none px-0.5 rounded"
                                />
                              </td>
                              {markListData.subjects.map((_, mIdx) => (
                                <td
                                  key={mIdx}
                                  className="border border-slate-400 px-1 py-1 text-center font-mono-num"
                                >
                                  {isGradeOnlyMode ? (
                                    <input
                                      type="text"
                                      value={student.subjectGrades?.[mIdx] ?? 'A'}
                                      onChange={(e) => {
                                        const baseGrades =
                                          student.subjectGrades &&
                                          student.subjectGrades.length ===
                                            markListData.subjects.length
                                            ? [...student.subjectGrades]
                                            : markListData.subjects.map(
                                                (__, idx) => student.subjectGrades?.[idx] || 'A'
                                              );
                                        baseGrades[mIdx] = e.target.value.toUpperCase();
                                        const nextStudents = [...markListData.students];
                                        nextStudents[globalIdx] = {
                                          ...student,
                                          subjectGrades: baseGrades,
                                        };
                                        onUpdateMarkList({
                                          ...markListData,
                                          students: nextStudents,
                                        });
                                      }}
                                      title="ഗ്രേഡ് മാറ്റാം (A, B, C, D, E)"
                                      className="w-10 text-center font-mono-num font-bold text-emerald-900 bg-transparent focus:bg-amber-50 focus:outline-none rounded"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      min={0}
                                      max={markListData.maxMarksPerSubject}
                                      value={
                                        student.marks[mIdx] !== undefined && student.marks[mIdx] >= 0
                                          ? student.marks[mIdx]
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const rawVal = e.target.value;
                                        const nextMarks = [...student.marks];
                                        nextMarks[mIdx] = rawVal === '' ? -1 : Number(rawVal) || 0;
                                        const nextStudents = [...markListData.students];
                                        nextStudents[globalIdx] = {
                                          ...student,
                                          marks: nextMarks,
                                        };
                                        onUpdateMarkList({
                                          ...markListData,
                                          students: nextStudents,
                                        });
                                      }}
                                      className="w-11 text-center font-mono-num bg-transparent focus:bg-amber-50 focus:outline-none rounded"
                                    />
                                  )}
                                </td>
                              ))}
                              {showTotalAndPct && (
                                <>
                                  <td className="border border-slate-400 px-1 py-1 text-center font-mono-num font-extrabold bg-slate-50">
                                    <input
                                      type="text"
                                      value={student.totalOverride ?? String(stStats.total)}
                                      onChange={(e) => {
                                        const nextStudents = [...markListData.students];
                                        nextStudents[globalIdx] = {
                                          ...student,
                                          totalOverride: e.target.value,
                                        };
                                        onUpdateMarkList({
                                          ...markListData,
                                          students: nextStudents,
                                        });
                                      }}
                                      className="w-full text-center font-mono-num font-extrabold bg-transparent focus:bg-amber-50 focus:outline-none"
                                    />
                                  </td>
                                  <td className="border border-slate-400 px-1 py-1 text-center font-mono-num font-semibold">
                                    <input
                                      type="text"
                                      value={
                                        student.percentageOverride ?? `${stStats.percentage}%`
                                      }
                                      onChange={(e) => {
                                        const nextStudents = [...markListData.students];
                                        nextStudents[globalIdx] = {
                                          ...student,
                                          percentageOverride: e.target.value,
                                        };
                                        onUpdateMarkList({
                                          ...markListData,
                                          students: nextStudents,
                                        });
                                      }}
                                      className="w-full text-center font-mono-num bg-transparent focus:bg-amber-50 focus:outline-none"
                                    />
                                  </td>
                                </>
                              )}
                              <td className="border border-slate-400 px-1 py-1 text-center font-mono-num font-bold text-emerald-800">
                                <input
                                  type="text"
                                  value={student.overallGradeOverride ?? stStats.grade}
                                  onChange={(e) => {
                                    const nextStudents = [...markListData.students];
                                    nextStudents[globalIdx] = {
                                      ...student,
                                      overallGradeOverride: e.target.value,
                                    };
                                    onUpdateMarkList({
                                      ...markListData,
                                      students: nextStudents,
                                    });
                                  }}
                                  className="w-full text-center font-mono-num font-bold text-emerald-800 bg-transparent focus:bg-amber-50 focus:outline-none"
                                />
                              </td>
                              {showRankCol && (
                                <td className="border border-slate-400 px-1 py-1 text-center font-mono-num font-bold">
                                  <input
                                    type="text"
                                    value={student.rankOverride ?? `#${stRank}`}
                                    onChange={(e) => {
                                      const nextStudents = [...markListData.students];
                                      nextStudents[globalIdx] = {
                                        ...student,
                                        rankOverride: e.target.value,
                                      };
                                      onUpdateMarkList({
                                        ...markListData,
                                        students: nextStudents,
                                      });
                                    }}
                                    className="w-full text-center font-mono-num font-bold bg-transparent focus:bg-amber-50 focus:outline-none"
                                  />
                                </td>
                              )}
                              {showRemarksCol && (
                                <td className="border border-slate-400 px-1.5 py-1 text-left">
                                  <input
                                    type="text"
                                    value={student.remarks ?? ''}
                                    onChange={(e) => {
                                      const nextStudents = [...markListData.students];
                                      nextStudents[globalIdx] = {
                                        ...student,
                                        remarks: e.target.value,
                                      };
                                      onUpdateMarkList({
                                        ...markListData,
                                        students: nextStudents,
                                      });
                                    }}
                                    placeholder="അഭിപ്രായം..."
                                    className="w-full text-[11px] bg-transparent focus:bg-amber-50 focus:outline-none"
                                  />
                                </td>
                              )}
                              <td className="no-print border border-slate-400 px-1 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudentRow(student.id)}
                                  title="ഈ വരി ഒഴിവാക്കുക"
                                  className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Editable Grading Scale Note (Shown on final page only so intermediate pages stay clean) */}
                  {isLastPage && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={
                          markListData.gradingScaleNote ??
                          (isGradeOnlyMode
                            ? 'കേരള SCERT CCE ഗ്രേഡിങ്ങ് സൂചിക (LP / UP — നമ്പർ മാർക്കില്ല): A : ഏറ്റവും മികച്ചത് | B : മികച്ചത് | C : ശരാശരി | D : മെച്ചപ്പെടേണ്ടത് | E : പ്രത്യേക പിന്തുണ ആവശ്യം'
                            : 'ഗ്രേഡിങ്ങ് സൂചിക: 90%+ : A+ | 80-89% : A | 70-79% : B+ | 60-69% : B | 50-59% : C+ | 40-49% : C | 30-39% : D+')
                        }
                        onChange={(e) =>
                          onUpdateMarkList({
                            ...markListData,
                            gradingScaleNote: e.target.value,
                          })
                        }
                        placeholder="ഗ്രേഡിങ്ങ് സൂചിക (ആവശ്യമില്ലെങ്കിൽ മായ്ച്ചു കളയാം)"
                        className={`${touchBoxClass(
                          markListData.gradingScaleNote ?? ''
                        )} text-[10.5px] text-slate-600`}
                      />
                    </div>
                  )}
                </div>

                {/* Page Footer: Full Seal & Signatures on Last Page ONLY; Compact Continuation Note on Intermediate Pages */}
                {isLastPage ? (
                  <>
                    <div
                      data-audit-section="marklist_footer"
                      className={`mt-6 pt-3 border-t border-slate-200 grid grid-cols-3 gap-4 items-end text-xs ${sectionHighlightClass('marklist_footer')}`}
                    >
                      <div className="space-y-1">
                        {renderSectionMistakeBadge('marklist_footer')}
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={markListData.placeLabel ?? 'സ്ഥലം :'}
                            onChange={(e) =>
                              onUpdateMarkList({ ...markListData, placeLabel: e.target.value })
                            }
                            className={`${touchBoxClass(
                              markListData.placeLabel ?? 'സ്ഥലം :'
                            )} font-semibold text-slate-700 w-14 shrink-0`}
                          />
                          <input
                            type="text"
                            value={markListData.place}
                            onChange={(e) =>
                              onUpdateMarkList({ ...markListData, place: e.target.value })
                            }
                            className={touchBoxClass(markListData.place)}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={markListData.dateLabel ?? 'തീയതി :'}
                            onChange={(e) =>
                              onUpdateMarkList({ ...markListData, dateLabel: e.target.value })
                            }
                            className={`${touchBoxClass(
                              markListData.dateLabel ?? 'തീയതി :'
                            )} font-semibold text-slate-700 w-14 shrink-0`}
                          />
                          <input
                            type="text"
                            value={markListData.date}
                            onChange={(e) =>
                              onUpdateMarkList({ ...markListData, date: e.target.value })
                            }
                            className={`${touchBoxClass(markListData.date)} font-mono-num`}
                          />
                        </div>
                      </div>

                      <div className="text-center space-y-4">
                        <input
                          type="text"
                          value={markListData.sealText ?? '(സ്കൂൾ സീൽ / School Seal)'}
                          onChange={(e) =>
                            onUpdateMarkList({ ...markListData, sealText: e.target.value })
                          }
                          placeholder="(സീൽ സ്ഥാനം — മായ്ക്കാം)"
                          className={`${touchBoxClass(
                            markListData.sealText ?? '(സ്കൂൾ സീൽ / School Seal)'
                          )} text-center text-slate-400 text-[11px]`}
                        />
                        <input
                          type="text"
                          value={markListData.classTeacherName}
                          onChange={(e) =>
                            onUpdateMarkList({
                              ...markListData,
                              classTeacherName: e.target.value,
                            })
                          }
                          placeholder="ക്ലാസ് ടീച്ചർ / ഉസ്താദ്"
                          className={`${touchBoxClass(
                            markListData.classTeacherName
                          )} text-center font-bold text-slate-800`}
                        />
                      </div>

                      <div className="text-right">
                        {showHeadmasterBlock ? (
                          <div className="space-y-4">
                            <input
                              type="text"
                              value={
                                markListData.headmasterSignatureLine ??
                                'ഒപ്പ് : ....................................'
                              }
                              onChange={(e) =>
                                onUpdateMarkList({
                                  ...markListData,
                                  headmasterSignatureLine: e.target.value,
                                })
                              }
                              placeholder="ഒപ്പ് സ്ഥാനം (മായ്ക്കാം)"
                              className={`${touchBoxClass(
                                markListData.headmasterSignatureLine ??
                                  'ഒപ്പ് : ....................................'
                              )} text-right text-slate-500 text-[11px]`}
                            />
                            <input
                              type="text"
                              value={markListData.headmasterTitle ?? 'ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ'}
                              onChange={(e) =>
                                onUpdateMarkList({
                                  ...markListData,
                                  headmasterTitle: e.target.value,
                                })
                              }
                              placeholder="ഹെഡ്മാസ്റ്റർ / സദർ മുഅല്ലിം (തൊട്ട് മാറ്റാം / മായ്ക്കാം)"
                              title="ഇവിടെ ക്ലിക്ക് ചെയ്ത് 'ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ' എന്നത് മാറ്റുകയോ പൂർണ്ണമായി മായ്ച്ചു കളയുകയോ ചെയ്യാം"
                              className={`${touchBoxClass(
                                markListData.headmasterTitle ?? 'ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ'
                              )} text-right font-bold text-slate-900`}
                            />
                          </div>
                        ) : (
                          <div className="no-print text-right">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateMarkList({
                                  ...markListData,
                                  showHeadmasterSignature: true,
                                })
                              }
                              className="text-[10px] text-slate-400 hover:text-emerald-700 underline cursor-pointer"
                            >
                              + ഹെഡ്മാസ്റ്റർ ഒപ്പ് വീണ്ടും ചേർക്കുക
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Viral Footer for Teachers' Free Mark List PDF */}
                    <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center">
                      <p className="font-malayalam text-[9.5px] font-semibold text-slate-500 tracking-wide">
                        Prepared via <strong>പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)</strong> | സർക്കാർ അപേക്ഷകൾ, വാടക കരാർ, ഗൾഫ് CV എന്നിവ 10 സെക്കൻഡിൽ ഫോണിൽ തയ്യാറാക്കാം.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 pt-2 border-t border-dashed border-slate-300 flex items-center justify-between text-[10.5px] text-slate-500 font-semibold">
                    <span>
                      {markListData.schoolName} · {markListData.classAndDivision}
                    </span>
                    <span className="font-mono-num">
                      തുടർച്ച അടുത്ത പേജിൽ (Page {pageIdx + 2} / {totalPages}) →
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          5. UNIVERSAL CUSTOM FLOATING TEXT & WHITEOUT BOXES OVERLAY
             (Allows "+ പുതിയ എഴുത്ത്" & "⬜ മായ്ക്കുക" on ANY selected template!)
         ===================================================================== */}
      {overlayItems.map((item) => {
        const isSelected = selectedOverlayId === item.id;
        return (
          <div
            key={item.id}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              minWidth: `${item.width}px`,
              minHeight: `${item.height}px`,
              backgroundColor: item.bgColor || '#ffffff',
              zIndex: isSelected ? 40 : 30,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOverlayId(item.id);
            }}
            className={`absolute rounded-xs ${
              isSelected
                ? 'ring-2 ring-amber-500 shadow-md'
                : showTouchBorders
                ? 'border border-dashed border-amber-500/60'
                : ''
            }`}
          >
            {isSelected && (
              <div className="no-print absolute -top-6 left-0 flex items-center gap-1 bg-slate-900 text-white px-1.5 py-0.5 rounded-t text-[10px] font-malayalam shadow">
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    dragOverlayRef.current = {
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: item.x,
                      origY: item.y,
                    };
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    dragOverlayRef.current = {
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: item.x,
                      origY: item.y,
                    };
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    const touch = e.touches[0];
                    if (!touch) return;
                    dragOverlayRef.current = {
                      id: item.id,
                      startX: touch.clientX,
                      startY: touch.clientY,
                      origX: item.x,
                      origY: item.y,
                    };
                  }}
                  className="flex items-center gap-0.5 cursor-move touch-none text-amber-300 font-bold pr-1"
                >
                  <Move className="w-2.5 h-2.5" />
                  <span>നീക്കുക</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!onUpdateOverlayItems) return;
                    onUpdateOverlayItems(overlayItems.filter((i) => i.id !== item.id));
                    setSelectedOverlayId(null);
                  }}
                  className="text-red-400 hover:text-red-300 px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
            <input
              type="text"
              value={item.text}
              placeholder={item.isWhiteout ? '' : 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...'}
              onChange={(e) => {
                if (!onUpdateOverlayItems) return;
                const val = e.target.value;
                onUpdateOverlayItems(
                  overlayItems.map((i) =>
                    i.id === item.id
                      ? {
                          ...i,
                          text: val,
                          width: Math.max(i.width, val.length * 9 + 20),
                        }
                      : i
                  )
                );
              }}
              style={{
                fontSize: `${item.fontSize}px`,
                fontWeight: item.isBold ? 'bold' : 'normal',
                color: item.color,
              }}
              className="w-full h-full bg-transparent border-0 outline-none px-1.5 py-0.5 font-malayalam"
            />
          </div>
        );
      })}

      {/* =====================================================================
          INTERACTIVE PASSPORT PHOTO CROPPER & ALIGNMENT MODAL (NO-PRINT)
         ===================================================================== */}
      {rawCropPhotoUrl && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="no-print fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 font-malayalam">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  ✂️ പാസ്പോർട്ട് ഫോട്ടോ ക്രോപ്പ് & അലൈൻ
                </h3>
                <p className="text-[11px] text-slate-500">
                  തല മുറിഞ്ഞുപോകാതിരിക്കാൻ സൂമും സ്ഥാനവും ക്രമീകരിക്കാം
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRawCropPhotoUrl(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="flex flex-col items-center justify-center bg-slate-100 rounded-xl p-4 border border-slate-200">
              <div
                className={`w-[140px] h-[175px] bg-white border-2 border-emerald-600 shadow-md overflow-hidden relative flex items-center justify-center ${
                  cropShape === 'circle' ? 'rounded-full' : 'rounded-md'
                }`}
              >
                <img
                  src={rawCropPhotoUrl}
                  alt="Crop Preview"
                  style={{
                    transform: `translate(${cropOffsetX}%, ${cropOffsetY}%) scale(${cropZoom})`,
                    transformOrigin: 'center 20%',
                  }}
                  className="w-full h-full object-cover object-[center_18%] transition-transform duration-75"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropShape('passport')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    cropShape === 'passport'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  ▭ പാസ്പോർട്ട് സൈസ്
                </button>
                <button
                  type="button"
                  onClick={() => setCropShape('circle')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    cropShape === 'circle'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  ◯ വട്ടത്തിലുള്ള ഫ്രെയിം
                </button>
              </div>
            </div>

            {/* Sliders for Zoom, Up/Down, Left/Right */}
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                  <span>സൂം (Zoom):</span>
                  <span>{Math.round(cropZoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="2.4"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                  <span>മുകളിലേക്കും താഴേക്കും (Up / Down):</span>
                  <span>{cropOffsetY}%</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={cropOffsetY}
                  onChange={(e) => setCropOffsetY(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-0.5">
                  <span>ഇടത്തോട്ടും വലത്തോട്ടും (Left / Right):</span>
                  <span>{cropOffsetX}%</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  step="1"
                  value={cropOffsetX}
                  onChange={(e) => setCropOffsetX(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCropZoom(1.05);
                  setCropOffsetX(0);
                  setCropOffsetY(0);
                  setCropShape('passport');
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                റീസെറ്റ് (Reset)
              </button>
              <button
                type="button"
                onClick={handleApplyCroppedPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                ✓ ഫോട്ടോ സിവിയിൽ ഉറപ്പിക്കുക
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
