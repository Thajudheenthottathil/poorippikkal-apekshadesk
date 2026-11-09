import React, { useEffect, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Bold,
  Download,
  Edit3,
  Eraser,
  Eye,
  EyeOff,
  FileText,
  Italic,
  Loader2,
  Move,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Type as TypeIcon,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export interface PdfEditableTextItem {
  id: string;
  pageIndex: number;
  origText: string;
  text: string;
  origX: number;
  origY: number;
  origWidth: number;
  origHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: 'malayalam' | 'sans' | 'serif' | 'mono';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  bgColor: string;
  isModified: boolean;
  isNew: boolean;
  isWhiteoutOnly?: boolean;
}

export interface RenderedPdfPage {
  pageIndex: number;
  widthPx: number;
  heightPx: number;
  highResScale: number;
  backgroundDataUrl: string;
}

interface DirectPdfEditorProps {
  file: File | null;
  fileName: string;
  pdfEditPrice: number;
  isUnlocked: boolean;
  onRequestProtectedExport: (
    action: 'download' | 'print',
    exportCallback: () => Promise<void>
  ) => void;
  onUploadNewPdfClick: () => void;
  onSwitchToLetterFormatView: () => void;
  onClosePdfEditor?: () => void;
  onShowToast: (msg: string) => void;
}

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

async function ensurePdfJsLoaded(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PDFJS_CDN_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
          resolve(window.pdfjsLib);
        }
      });
      return;
    }

    const script = document.createElement('script');
    script.src = PDFJS_CDN_URL;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));
    document.head.appendChild(script);
  });
}

function sampleCanvasBackgroundHex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number
): string {
  try {
    const sx = Math.max(0, Math.floor((x - 2) * scale));
    const sy = Math.max(0, Math.floor((y - 2) * scale));
    const pixel = ctx.getImageData(sx, sy, 1, 1).data;
    if (pixel[3] < 128) return '#ffffff';
    // If very dark pixel (likely part of a letter or line), default to white paper background
    const brightness = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000;
    if (brightness < 175) return '#ffffff';
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`;
  } catch {
    return '#ffffff';
  }
}

export const DirectPdfEditor: React.FC<DirectPdfEditorProps> = ({
  file,
  fileName,
  pdfEditPrice,
  isUnlocked,
  onRequestProtectedExport,
  onUploadNewPdfClick,
  onSwitchToLetterFormatView,
  onClosePdfEditor,
  onShowToast,
}) => {
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [textItems, setTextItems] = useState<PdfEditableTextItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'select_edit' | 'add_text' | 'whiteout'>(
    'select_edit'
  );
  const [showAllBoxes, setShowAllBoxes] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isRunningOcr, setIsRunningOcr] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [passwordPromptOpen, setPasswordPromptOpen] = useState<boolean>(false);
  const [passwordDraft, setPasswordDraft] = useState<string>('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string>('');

  // Dragging state for moving text boxes on the PDF canvas
  const dragRef = useRef<{
    itemId: string;
    startClientX: number;
    startClientY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const selectedItem = textItems.find((item) => item.id === selectedItemId) || null;
  const modifiedCount = textItems.filter((i) => i.isModified || i.isNew).length;

  const handleResetAllPdfEdits = () => {
    setTextItems((prev) =>
      prev
        .filter((item) => !item.isNew)
        .map((item) => ({
          ...item,
          text: item.origText,
          x: item.origX,
          y: item.origY,
          width: item.origWidth + 8,
          height: item.origHeight,
          isModified: false,
        }))
    );
    setSelectedItemId(null);
    onShowToast('✓ PDF-ൽ വരുത്തിയ എല്ലാ തിരുത്തലുകളും പഴയപടിയാക്കി.');
  };

  // Load & Render Uploaded PDF or Image File
  useEffect(() => {
    if (!file) {
      setPages([]);
      setTextItems([]);
      setSelectedItemId(null);
      setPasswordPromptOpen(false);
      setPasswordErrorMsg('');
      return;
    }

    let cancelled = false;
    const loadFileIntoCanvasEditor = async () => {
      setIsLoadingPdf(true);
      setSelectedItemId(null);

      try {
        const mime = (file.type || '').toLowerCase();
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isImage =
          mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

        if (isImage) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const imageEl = new Image();
            imageEl.onload = () => resolve(imageEl);
            imageEl.onerror = reject;
            imageEl.src = dataUrl;
          });

          const baseDisplayWidth = 794;
          const aspect = img.naturalHeight / Math.max(1, img.naturalWidth);
          const displayHeight = Math.round(baseDisplayWidth * aspect);

          const singlePage: RenderedPdfPage = {
            pageIndex: 0,
            widthPx: baseDisplayWidth,
            heightPx: displayHeight,
            highResScale: 2,
            backgroundDataUrl: dataUrl,
          };

          if (!cancelled) {
            setPages([singlePage]);
            setTextItems([]);
            setIsLoadingPdf(false);
            // Automatically run AI OCR box detection on uploaded image
            runAiOcrOnPage(singlePage);
          }
          return;
        }

        // Load PDF via PDF.js (supports password-protected PDFs such as Aadhaar / bank statements)
        const pdfjsLib = await ensurePdfJsLoaded();
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          password: pdfPassword || undefined,
        });
        const pdfDoc = await loadingTask.promise;
        setPasswordPromptOpen(false);
        setPasswordErrorMsg('');

        const renderedPages: RenderedPdfPage[] = [];
        const extractedItems: PdfEditableTextItem[] = [];
        const baseDisplayWidth = 794;
        const highResMultiplier = 2.0;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const displayScale = baseDisplayWidth / unscaledViewport.width;
          const displayViewport = page.getViewport({ scale: displayScale });
          const renderViewport = page.getViewport({
            scale: displayScale * highResMultiplier,
          });

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(renderViewport.width);
          canvas.height = Math.round(renderViewport.height);
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvasContext: ctx,
              viewport: renderViewport,
            }).promise;
          }

          const pageObj: RenderedPdfPage = {
            pageIndex: pageNum - 1,
            widthPx: Math.round(displayViewport.width),
            heightPx: Math.round(displayViewport.height),
            highResScale: highResMultiplier,
            // Use JPEG 0.88 instead of uncompressed PNG to reduce RAM usage by ~80% on 10MB+ PDFs
            backgroundDataUrl: canvas.toDataURL('image/jpeg', 0.88),
          };
          renderedPages.push(pageObj);

          // Extract exact text coordinates from PDF page
          const textContent = await page.getTextContent();
          const rawFragments: Array<{
            str: string;
            x: number;
            y: number;
            width: number;
            height: number;
            fontSize: number;
            fontName: string;
          }> = [];

          for (const item of textContent.items) {
            const rawStr = (item.str || '').normalize('NFC');
            if (!rawStr.trim()) continue;

            const tx = pdfjsLib.Util.transform(displayViewport.transform, item.transform);
            const fontHeight = Math.max(
              9,
              Math.round(Math.hypot(tx[2], tx[3]) || Math.abs(tx[3]) || 12)
            );
            const x = Math.round(tx[4]);
            const y = Math.round(tx[5] - fontHeight * 0.86);
            const width = Math.max(
              18,
              Math.round((item.width || rawStr.length * 6) * displayScale)
            );
            const height = Math.max(14, Math.round(fontHeight * 1.24));

            rawFragments.push({
              str: rawStr,
              x,
              y,
              width,
              height,
              fontSize: fontHeight,
              fontName: String(item.fontName || '').toLowerCase(),
            });
          }

          // Sort top-to-bottom, then left-to-right
          rawFragments.sort((a, b) => {
            if (Math.abs(a.y - b.y) <= Math.max(a.fontSize, b.fontSize) * 0.45) {
              return a.x - b.x;
            }
            return a.y - b.y;
          });

          // Merge closely adjacent fragments on the same horizontal line into clean editable phrases
          const mergedLines: typeof rawFragments = [];
          for (const frag of rawFragments) {
            const last = mergedLines[mergedLines.length - 1];
            if (
              last &&
              Math.abs(last.y - frag.y) <= Math.max(last.fontSize, frag.fontSize) * 0.45 &&
              frag.x - (last.x + last.width) <= Math.max(last.fontSize, frag.fontSize) * 1.6 &&
              frag.x >= last.x - 4
            ) {
              const gapPx = frag.x - (last.x + last.width);
              const needsSpace =
                gapPx > 2 && !last.str.endsWith(' ') && !frag.str.startsWith(' ');
              last.str = `${last.str}${needsSpace ? ' ' : ''}${frag.str}`.normalize('NFC');
              const rightEdge = Math.max(last.x + last.width, frag.x + frag.width);
              last.width = rightEdge - last.x;
              last.height = Math.max(last.height, frag.height);
              last.fontSize = Math.round((last.fontSize + frag.fontSize) / 2);
            } else {
              mergedLines.push({ ...frag });
            }
          }

          mergedLines.forEach((line, idx) => {
            const sampledBg = ctx
              ? sampleCanvasBackgroundHex(ctx, line.x, line.y, highResMultiplier)
              : '#ffffff';
            const isMalayalamText = /[\u0D00-\u0D7F]/.test(line.str);
            const isBoldFont =
              line.fontName.includes('bold') || line.fontName.includes('black');

            extractedItems.push({
              id: `p${pageNum - 1}-item-${idx}`,
              pageIndex: pageNum - 1,
              origText: line.str,
              text: line.str,
              origX: line.x,
              origY: line.y,
              origWidth: line.width,
              origHeight: line.height,
              x: line.x,
              y: line.y,
              width: Math.max(line.width + 8, 36),
              height: line.height,
              fontSize: line.fontSize,
              fontFamily: isMalayalamText ? 'malayalam' : 'sans',
              fontWeight: isBoldFont ? 'bold' : 'normal',
              fontStyle: line.fontName.includes('italic') ? 'italic' : 'normal',
              color: '#0f172a',
              bgColor: sampledBg,
              isModified: false,
              isNew: false,
            });
          });
        }

        if (!cancelled) {
          setPages(renderedPages);
          setTextItems(extractedItems);
          setIsLoadingPdf(false);

          // If the PDF is a scanned PDF with 0 embedded text items, automatically run AI OCR on Page 1
          if (extractedItems.length === 0 && renderedPages.length > 0) {
            onShowToast(
              'ഇതൊരു സ്കാൻ ചെയ്ത PDF ആണ് — AI ഉപയോഗിച്ച് ഇതിലെ അക്ഷരങ്ങൾ എഡിറ്റിങ്ങിനായി വേർതിരിക്കുന്നു...'
            );
            runAiOcrOnPage(renderedPages[0]);
          }
        }
      } catch (err: any) {
        const isPasswordError =
          err?.name === 'PasswordException' ||
          err?.code === 1 ||
          err?.code === 2 ||
          String(err?.message || '').toLowerCase().includes('password');

        if (isPasswordError && !cancelled) {
          setIsLoadingPdf(false);
          setPasswordPromptOpen(true);
          if (pdfPassword) {
            setPasswordErrorMsg('നൽകിയ പാസ്‌വേഡ് തെറ്റാണ്. ദയവായി ശരിയായ PDF പാസ്‌വേഡ് നൽകുക.');
          } else {
            setPasswordErrorMsg('');
          }
          onShowToast('ഈ PDF പാസ്‌വേഡ് ഉപയോഗിച്ച് ലോക്ക് ചെയ്തിരിക്കുകയാണ്. ദയവായി പാസ്‌വേഡ് നൽകുക.');
          return;
        }

        console.error('DirectPdfEditor load error:', err);
        if (!cancelled) {
          setIsLoadingPdf(false);
          onShowToast('PDF തുറക്കുന്നതിൽ ചെറിയ തടസ്സം നേരിട്ടു.');
        }
      }
    };

    loadFileIntoCanvasEditor();
    return () => {
      cancelled = true;
    };
  }, [file, pdfPassword]);

  // Global mouse / pointer / touch move & up for dragging text boxes on the PDF canvas (Mobile + Desktop)
  useEffect(() => {
    const applyDragCoords = (clientX: number, clientY: number) => {
      if (!dragRef.current) return;
      const { itemId, startClientX, startClientY, initialX, initialY } = dragRef.current;
      const dx = Math.round((clientX - startClientX) / zoomScale);
      const dy = Math.round((clientY - startClientY) / zoomScale);

      setTextItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                x: Math.max(0, initialX + dx),
                y: Math.max(0, initialY + dy),
                isModified: true,
              }
            : item
        )
      );
    };

    const handleMouseMove = (e: MouseEvent) => applyDragCoords(e.clientX, e.clientY);
    const handlePointerMove = (e: PointerEvent) => applyDragCoords(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || !e.touches[0]) return;
      applyDragCoords(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleDragEnd = () => {
      dragRef.current = null;
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
  }, [zoomScale]);

  // Run AI OCR Bounding Box Detection on a Scanned PDF Page
  const runAiOcrOnPage = async (pageObj: RenderedPdfPage) => {
    if (isRunningOcr) return;
    setIsRunningOcr(true);
    try {
      const base64Data = pageObj.backgroundDataUrl.split(',')[1] || '';
      const res = await fetch('/api/ocr-pdf-page-boxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/png',
        }),
      });
      const data = await res.json();
      const boxes: Array<{
        text: string;
        ymin: number;
        xmin: number;
        ymax: number;
        xmax: number;
        isBold?: boolean;
      }> = Array.isArray(data?.boxes) ? data.boxes : [];

      if (boxes.length === 0) {
        onShowToast(
          '➕ "പുതിയ എഴുത്ത്" അല്ലെങ്കിൽ "⬜ മായ്ക്കുക" ടൂൾ ഉപയോഗിച്ച് പേജിൽ എവിടെയും ക്ലിക്ക് ചെയ്ത് എഡിറ്റ് ചെയ്യാം!'
        );
        return;
      }

      const newOcrItems: PdfEditableTextItem[] = boxes.map((box, idx) => {
        const x = Math.round((box.xmin / 1000) * pageObj.widthPx);
        const y = Math.round((box.ymin / 1000) * pageObj.heightPx);
        const width = Math.max(
          28,
          Math.round(((box.xmax - box.xmin) / 1000) * pageObj.widthPx)
        );
        const height = Math.max(
          16,
          Math.round(((box.ymax - box.ymin) / 1000) * pageObj.heightPx)
        );
        const fontSize = Math.max(10, Math.min(28, Math.round(height * 0.78)));
        const cleanText = (box.text || '').normalize('NFC');

        return {
          id: `ocr-p${pageObj.pageIndex}-${Date.now()}-${idx}`,
          pageIndex: pageObj.pageIndex,
          origText: cleanText,
          text: cleanText,
          origX: x,
          origY: y,
          origWidth: width,
          origHeight: height,
          x,
          y,
          width: width + 8,
          height,
          fontSize,
          fontFamily: /[\u0D00-\u0D7F]/.test(cleanText) ? 'malayalam' : 'sans',
          fontWeight: box.isBold ? 'bold' : 'normal',
          fontStyle: 'normal',
          color: '#0f172a',
          bgColor: '#ffffff',
          isModified: false,
          isNew: false,
        };
      });

      setTextItems((prev) => [
        ...prev.filter((i) => i.pageIndex !== pageObj.pageIndex || i.isModified || i.isNew),
        ...newOcrItems,
      ]);
      setShowAllBoxes(true);
      onShowToast(
        `✨ പേജിലെ ${newOcrItems.length} വാചകങ്ങൾ കണ്ടെത്തി! ഏത് അക്ഷരത്തിലും ക്ലിക്ക് ചെയ്ത് തിരുത്താം.`
      );
    } catch {
      onShowToast('സ്കാൻ ചെയ്ത പേജിൽ എവിടെയും ക്ലിക്ക് ചെയ്ത് തിരുത്താം.');
    } finally {
      setIsRunningOcr(false);
    }
  };

  // Update a specific text item
  const updateTextItem = (id: string, patch: Partial<PdfEditableTextItem>) => {
    setTextItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextText =
          patch.text !== undefined ? patch.text.normalize('NFC') : item.text;
        return {
          ...item,
          ...patch,
          text: nextText,
          isModified: true,
        };
      })
    );
  };

  // Click on PDF Page Canvas to Add New Text or Whiteout Box
  const handlePageCanvasClick = (
    e: React.MouseEvent<HTMLDivElement>,
    pageObj: RenderedPdfPage
  ) => {
    if (e.target !== e.currentTarget) return;

    if (activeTool === 'select_edit') {
      setSelectedItemId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.round((e.clientX - rect.left) / zoomScale);
    const clickY = Math.round((e.clientY - rect.top) / zoomScale);

    const isWhiteout = activeTool === 'whiteout';
    const newId = `custom-p${pageObj.pageIndex}-${Date.now()}`;

    const newItem: PdfEditableTextItem = {
      id: newId,
      pageIndex: pageObj.pageIndex,
      origText: '',
      text: isWhiteout ? '' : 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
      origX: clickX,
      origY: clickY - 10,
      origWidth: isWhiteout ? 130 : 160,
      origHeight: 24,
      x: clickX,
      y: clickY - 10,
      width: isWhiteout ? 130 : 180,
      height: 24,
      fontSize: 13,
      fontFamily: 'malayalam',
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#0f172a',
      bgColor: '#ffffff',
      isModified: true,
      isNew: true,
      isWhiteoutOnly: isWhiteout,
    };

    setTextItems((prev) => [...prev, newItem]);
    setSelectedItemId(newId);
    setActiveTool('select_edit');
    onShowToast(
      isWhiteout
        ? '⬜ മായ്ക്കാനുള്ള ബോക്സ് ചേർത്തു! ഇതിനുള്ളിൽ പുതിയ അക്ഷരങ്ങൾ ടൈപ്പ് ചെയ്യുകയോ വലിപ്പം മാറ്റുകയോ ചെയ്യാം.'
        : '➕ പുതിയ ടെക്സ്റ്റ് ബോക്സ് ചേർത്തു! അക്ഷരങ്ങൾ ടൈപ്പ് ചെയ്യാം.'
    );
  };

  // 1-Click Find & Replace directly on all Original PDF Text Boxes
  const handleFindAndReplaceOnPdf = (e: React.FormEvent) => {
    e.preventDefault();
    const search = findQuery.trim().normalize('NFC');
    if (!search) {
      onShowToast('മാറ്റേണ്ട പഴയ വാക്ക് "Find" കോളത്തിൽ ടൈപ്പ് ചെയ്യുക.');
      return;
    }
    const replacement = replaceQuery.normalize('NFC');
    let replacedBoxes = 0;

    setTextItems((prev) =>
      prev.map((item) => {
        if (item.text.includes(search)) {
          replacedBoxes++;
          const updatedText = item.text.split(search).join(replacement);
          return {
            ...item,
            text: updatedText,
            width: Math.max(item.width, updatedText.length * (item.fontSize * 0.58) + 16),
            isModified: true,
          };
        }
        return item;
      })
    );

    if (replacedBoxes > 0) {
      setFindQuery('');
      setReplaceQuery('');
      onShowToast(
        `✓ PDF-ലെ ${replacedBoxes} സ്ഥലങ്ങളിൽ "${search}" മാറ്റി "${replacement}" ആക്കിയിട്ടുണ്ട്!`
      );
    } else {
      onShowToast(`"${search}" എന്ന വാക്ക് ഈ PDF-ൽ കണ്ടെത്താനായില്ല.`);
    }
  };

  // Render Composite High-Res Canvas for Each Page & Export as Original PDF or Print
  const buildCompositePageCanvases = async (): Promise<HTMLCanvasElement[]> => {
    const compositeCanvases: HTMLCanvasElement[] = [];

    for (const pageObj of pages) {
      const scale = pageObj.highResScale || 2.0;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(pageObj.widthPx * scale);
      canvas.height = Math.round(pageObj.heightPx * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      // 1. Draw the original untouched high-res PDF page image
      const bgImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = pageObj.backgroundDataUrl;
      });
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // 2. For every modified or newly added text item on this page:
      const pageItems = textItems.filter(
        (item) => item.pageIndex === pageObj.pageIndex && (item.isModified || item.isNew)
      );

      for (const item of pageItems) {
        // 2a. Mask/Whiteout the original text position so the old PDF letters are 100% covered
        if (!item.isNew) {
          ctx.fillStyle = item.bgColor || '#ffffff';
          ctx.fillRect(
            Math.max(0, (item.origX - 2) * scale),
            Math.max(0, (item.origY - 2) * scale),
            (item.origWidth + 5) * scale,
            (item.origHeight + 4) * scale
          );
        }

        // 2b. Also mask the new box area if background color is set
        if (item.bgColor && item.bgColor !== 'transparent') {
          ctx.fillStyle = item.bgColor;
          ctx.fillRect(
            Math.max(0, (item.x - 2) * scale),
            Math.max(0, (item.y - 1) * scale),
            (item.width + 4) * scale,
            (item.height + 2) * scale
          );
        }

        // 2c. Draw the new NFC-normalized text at crisp print resolution (skip unedited default placeholders)
        const cleanText = (item.text || '').normalize('NFC').trim();
        const isDefaultPlaceholder =
          cleanText === 'ഇവിടെ ടൈപ്പ് ചെയ്യുക...' || /^\[.*\]$/.test(cleanText);
        if (cleanText && !isDefaultPlaceholder) {
          const scaledFontSize = Math.round(item.fontSize * scale);
          const fontStack =
            item.fontFamily === 'malayalam'
              ? '"Noto Sans Malayalam", "Manjari", sans-serif'
              : item.fontFamily === 'serif'
              ? '"Noto Serif Malayalam", Georgia, serif'
              : item.fontFamily === 'mono'
              ? '"JetBrains Mono", monospace'
              : '"Plus Jakarta Sans", Arial, sans-serif';

          ctx.font = `${item.fontStyle === 'italic' ? 'italic ' : ''}${
            item.fontWeight === 'bold' ? '700 ' : '500 '
          }${scaledFontSize}px ${fontStack}`;
          ctx.fillStyle = item.color || '#0f172a';
          ctx.textBaseline = 'top';

          const lines = cleanText.split('\n');
          lines.forEach((lineStr, lineIdx) => {
            ctx.fillText(
              lineStr,
              item.x * scale,
              (item.y + 1) * scale + lineIdx * scaledFontSize * 1.22
            );
          });
        }
      }

      compositeCanvases.push(canvas);
    }

    return compositeCanvases;
  };

  const executeDownloadEditedPdf = async () => {
    if (pages.length === 0 || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const canvases = await buildCompositePageCanvases();
      if (canvases.length === 0) return;

      const firstPage = pages[0];
      const orientation = firstPage.widthPx > firstPage.heightPx ? 'l' : 'p';
      const pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [firstPage.widthPx * 0.75, firstPage.heightPx * 0.75],
        compress: true,
      });

      canvases.forEach((canvas, idx) => {
        const pg = pages[idx];
        const ptWidth = pg.widthPx * 0.75;
        const ptHeight = pg.heightPx * 0.75;

        if (idx > 0) {
          pdf.addPage([ptWidth, ptHeight], ptWidth > ptHeight ? 'l' : 'p');
        }
        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        pdf.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
      });

      const baseName = (fileName || 'Edited_Document')
        .replace(/\.pdf$/i, '')
        .replace(/\s+/g, '_');
      pdf.save(`${baseName}_Edited.pdf`);
      onShowToast('✨ എഡിറ്റ് ചെയ്ത ഒറിജിനൽ PDF നിങ്ങളുടെ ഫോണിൽ/കമ്പ്യൂട്ടറിൽ ഡൗൺലോഡ് ആയി!');
    } catch (err) {
      console.error('Export edited PDF error:', err);
      onShowToast('PDF ഡൗൺലോഡ് ചെയ്യുന്നതിൽ ചെറിയ തടസ്സം നേരിട്ടു.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const executePrintEditedPdf = async () => {
    if (pages.length === 0 || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const canvases = await buildCompositePageCanvases();
      if (canvases.length === 0) return;

      // Replace a temporary print container in the DOM and invoke window.print()
      let printContainer = document.getElementById('direct-pdf-print-portal');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'direct-pdf-print-portal';
        document.body.appendChild(printContainer);
      }

      printContainer.innerHTML = '';
      canvases.forEach((c) => {
        const img = document.createElement('img');
        img.src = c.toDataURL('image/png');
        img.style.width = '100%';
        img.style.maxWidth = '210mm';
        img.style.display = 'block';
        img.style.pageBreakAfter = 'always';
        printContainer?.appendChild(img);
      });

      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* =====================================================================
          1. TOP PDF STUDIO HEADER & MODE SWITCHER
         ===================================================================== */}
      <div className="no-print bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-700 shadow-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono-num font-black text-xs">
              DIRECT PDF EDITOR · ₹{pdfEditPrice}
            </span>
            <div>
              <h3 className="font-malayalam font-extrabold text-xs sm:text-sm text-white">
                {fileName || 'Uploaded.pdf'} — ഒറിജിനൽ PDF വിൻഡോ എഡിറ്റർ
              </h3>
              <p className="font-malayalam text-[11px] text-emerald-300">
                ഒറിജിനൽ PDF-ലെ ഏത് അക്ഷരത്തിലും നേരിട്ട് ക്ലിക്ക് ചെയ്ത് ആ സ്ഥാനത്തുതന്നെ തിരുത്താം! ({modifiedCount} തിരുത്തലുകൾ)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onUploadNewPdfClick}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-950" />
              <span>മറ്റൊരു PDF എടുക്കുക</span>
            </button>

            {modifiedCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllPdfEdits}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-malayalam font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                title="ഈ PDF-ൽ വരുത്തിയ തിരുത്തലുകൾ മാത്രം ഒഴിവാക്കുക"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span>തിരുത്തൽ റീസെറ്റ്</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSwitchToLetterFormatView}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-malayalam font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>A4 ലെറ്റർ ഫോർമാറ്റ്</span>
            </button>

            {onClosePdfEditor && (
              <button
                type="button"
                onClick={() => {
                  setPages([]);
                  setTextItems([]);
                  setSelectedItemId(null);
                  onClosePdfEditor();
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-malayalam font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="ഈ PDF പൂർണ്ണമായും ഒഴിവാക്കി ക്ലോസ് ചെയ്യുക"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>PDF ക്ലോസ് ചെയ്യുക</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================
            2. MAIN PDF EDITING TOOLS & ACTION BAR
           =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTool('select_edit')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTool === 'select_edit'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>1. അക്ഷരത്തിൽ തൊട്ട് തിരുത്തുക</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool('add_text');
                onShowToast(
                  'ഇനി PDF പേജിൽ എവിടെ വേണമെങ്കിലും ക്ലിക്ക് ചെയ്താൽ അവിടെ പുതിയ അക്ഷരങ്ങൾ ടൈപ്പ് ചെയ്യാം!'
                );
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTool === 'add_text'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>2. പുതിയ എഴുത്ത് ചേർക്കുക</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTool('whiteout');
                onShowToast(
                  'ഇനി PDF-ൽ മായ്ക്കേണ്ട ഭാഗത്ത് ക്ലിക്ക് ചെയ്താൽ പഴയ അക്ഷരങ്ങൾ മറച്ച് പുതിയത് എഴുതാം!'
                );
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTool === 'whiteout'
                  ? 'bg-white text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>3. മായ്ക്കുക (Whiteout)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAllBoxes((prev) => !prev)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-malayalam font-semibold flex items-center gap-1.5 cursor-pointer border ${
                showAllBoxes
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {showAllBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showAllBoxes ? 'ബോക്സുകൾ: ON' : 'ബോക്സുകൾ: OFF'}</span>
            </button>

            {pages.length > 0 && (
              <div className="flex items-center gap-1">
                {pages.length > 1 && (
                  <select
                    value={activePageIndex}
                    onChange={(e) => setActivePageIndex(Number(e.target.value))}
                    title="OCR ചെയ്യേണ്ട പേജ് തിരഞ്ഞെടുക്കുക"
                    className="min-h-[38px] px-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-malayalam font-bold"
                  >
                    {pages.map((p) => (
                      <option key={p.pageIndex} value={p.pageIndex}>
                        പേജ് {p.pageIndex + 1}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  disabled={isRunningOcr}
                  onClick={() => runAiOcrOnPage(pages[activePageIndex] || pages[0])}
                  title="സ്കാൻ ചെയ്ത PDF-ലോ ഫോട്ടോയിലോ ഉള്ള അക്ഷരങ്ങൾ AI ഉപയോഗിച്ച് കണ്ടെത്തുക"
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-malayalam font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isRunningOcr ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>
                    AI അക്ഷര സ്കാൻ (OCR{pages.length > 1 ? ` · പേജ് ${activePageIndex + 1}` : ''})
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Primary Download & Print Edited Original PDF CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isExportingPdf}
              onClick={() => onRequestProtectedExport('download', executeDownloadEditedPdf)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-malayalam font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                ⬇ എഡിറ്റ് ചെയ്ത PDF ഡൗൺലോഡ് {!isUnlocked ? `(₹${pdfEditPrice})` : ''}
              </span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={() => onRequestProtectedExport('print', executePrintEditedPdf)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>🖨 പ്രിന്റ് {!isUnlocked ? `(₹${pdfEditPrice})` : ''}</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            3. QUICK FIND & REPLACE BAR ON THE ORIGINAL PDF
           =================================================================== */}
        <form
          onSubmit={handleFindAndReplaceOnPdf}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-1"
        >
          <div className="sm:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="PDF-ൽ മാറ്റേണ്ട പഴയ വാക്ക് / പേര് / തീയതി..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs font-malayalam placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="പുതിയ വാക്ക് / പേര് / തീയതി..."
            className="sm:col-span-5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs font-malayalam placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
          />
          <button
            type="submit"
            className="sm:col-span-2 min-h-[34px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-extrabold text-xs cursor-pointer"
          >
            എല്ലാം മാറ്റുക
          </button>
        </form>

        {/* ===================================================================
            4. SELECTED TEXT ITEM LIVE FORMATTING TOOLBAR (Font Size, Color, Move)
           =================================================================== */}
        {selectedItem && (
          <div className="bg-slate-950/90 border border-amber-400/50 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-malayalam font-bold text-amber-300 flex items-center gap-1">
                <TypeIcon className="w-3.5 h-3.5" />
                <span>തിരഞ്ഞെടുത്ത വാചകം:</span>
              </span>

              {/* Font Size Controls */}
              <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() =>
                    updateTextItem(selectedItem.id, {
                      fontSize: Math.max(8, selectedItem.fontSize - 1),
                    })
                  }
                  className="px-2 py-1 hover:bg-slate-700 text-white font-bold cursor-pointer"
                >
                  A-
                </button>
                <span className="px-2 font-mono-num text-[11px] text-amber-300">
                  {selectedItem.fontSize}px
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateTextItem(selectedItem.id, {
                      fontSize: Math.min(48, selectedItem.fontSize + 1),
                    })
                  }
                  className="px-2 py-1 hover:bg-slate-700 text-white font-bold cursor-pointer"
                >
                  A+
                </button>
              </div>

              {/* Bold & Italic */}
              <button
                type="button"
                onClick={() =>
                  updateTextItem(selectedItem.id, {
                    fontWeight: selectedItem.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  selectedItem.fontWeight === 'bold'
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  updateTextItem(selectedItem.id, {
                    fontStyle: selectedItem.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  selectedItem.fontStyle === 'italic'
                    ? 'bg-amber-400 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              {/* Text Color Picker */}
              <label className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <span className="font-malayalam text-[11px] text-slate-300">അക്ഷര നിറം:</span>
                <input
                  type="color"
                  value={selectedItem.color}
                  onChange={(e) => updateTextItem(selectedItem.id, { color: e.target.value })}
                  className="w-4 h-4 cursor-pointer bg-transparent border-0"
                />
              </label>

              {/* Background Patch Color Picker */}
              <label className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <span className="font-malayalam text-[11px] text-slate-300">ബാക്ക്ഗ്രൗണ്ട്:</span>
                <input
                  type="color"
                  value={
                    selectedItem.bgColor === 'transparent' ? '#ffffff' : selectedItem.bgColor
                  }
                  onChange={(e) => updateTextItem(selectedItem.id, { bgColor: e.target.value })}
                  className="w-4 h-4 cursor-pointer bg-transparent border-0"
                />
              </label>

              {/* Fine Position Nudge Buttons */}
              <div className="flex items-center gap-0.5 bg-slate-800 px-1.5 py-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => updateTextItem(selectedItem.id, { x: selectedItem.x - 2 })}
                  className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-white cursor-pointer"
                  title="ഇടത്തോട്ട് നീക്കുക"
                >
                  ⬅
                </button>
                <button
                  type="button"
                  onClick={() => updateTextItem(selectedItem.id, { y: selectedItem.y - 2 })}
                  className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-white cursor-pointer"
                  title="മുകളിലോട്ട് നീക്കുക"
                >
                  ⬆
                </button>
                <button
                  type="button"
                  onClick={() => updateTextItem(selectedItem.id, { y: selectedItem.y + 2 })}
                  className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-white cursor-pointer"
                  title="താഴോട്ട് നീക്കുക"
                >
                  ⬇
                </button>
                <button
                  type="button"
                  onClick={() => updateTextItem(selectedItem.id, { x: selectedItem.x + 2 })}
                  className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-white cursor-pointer"
                  title="വലത്തോട്ട് നീക്കുക"
                >
                  ➡
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Erase / Whiteout Text Content */}
              <button
                type="button"
                onClick={() => updateTextItem(selectedItem.id, { text: '' })}
                className="px-2.5 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white font-malayalam font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                title="പഴയ അക്ഷരങ്ങൾ പൂർണ്ണമായും മായ്ക്കുക"
              >
                <Trash2 className="w-3 h-3" />
                <span>മായ്ക്കുക (Erase)</span>
              </button>

              {/* Restore Original Text */}
              {!selectedItem.isNew && (
                <button
                  type="button"
                  onClick={() =>
                    setTextItems((prev) =>
                      prev.map((i) =>
                        i.id === selectedItem.id
                          ? {
                              ...i,
                              text: i.origText,
                              x: i.origX,
                              y: i.origY,
                              width: i.origWidth + 8,
                              height: i.origHeight,
                              isModified: false,
                            }
                          : i
                      )
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-malayalam text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>പഴയപടിയാക്കുക</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          5. ACTUAL ORIGINAL PDF PAGES VIEWPORT WITH IN-PLACE TEXT OVERLAYS
         ===================================================================== */}
      <div className="bg-slate-200/90 border-2 border-slate-300 rounded-2xl p-3 sm:p-5 overflow-x-auto">
        {/* Zoom & Page Count Strip */}
        <div className="no-print flex items-center justify-between gap-2 mb-3 text-xs font-malayalam text-slate-700">
          <span className="font-bold">
            ആകെ പേജുകൾ: {pages.length} ·{' '}
            {activeTool === 'add_text'
              ? '🟢 പേജിൽ എവിടെയും ക്ലിക്ക് ചെയ്ത് പുതിയ അക്ഷരം ചേർക്കുക'
              : activeTool === 'whiteout'
              ? '⬜ പേജിൽ മായ്ക്കേണ്ട ഭാഗത്ത് ക്ലിക്ക് ചെയ്യുക'
              : '✏️ ഏത് അക്ഷരത്തിലും നേരിട്ട് ക്ലിക്ക് ചെയ്ത് തിരുത്താം'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.max(0.65, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono-num font-bold px-2">{Math.round(zoomScale * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomScale((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {passwordPromptOpen ? (
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto my-6 border border-amber-300 shadow-lg space-y-4 text-center font-malayalam">
            <h4 className="font-extrabold text-base text-slate-900">
              🔒 പാസ്‌വേഡ് ഉള്ള PDF (Password Protected PDF)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              ഈ PDF തുറക്കാൻ പാസ്‌വേഡ് ആവശ്യമാണ് (ഉദാ: ആധാർ PDF ആണെങ്കിൽ പേരിന്റെ ആദ്യ 4 ഇംഗ്ലീഷ് വലിയ അക്ഷരങ്ങളും ജനന വർഷവും ചേർത്ത 8 അക്ക പാസ്‌വേഡ് നൽകുക).
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!passwordDraft.trim()) return;
                setPdfPassword(passwordDraft.trim());
              }}
              className="space-y-3"
            >
              <input
                type="password"
                value={passwordDraft}
                onChange={(e) => setPasswordDraft(e.target.value)}
                placeholder="PDF പാസ്‌വേഡ് ഇവിടെ ടൈപ്പ് ചെയ്യുക..."
                autoFocus
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 focus:border-emerald-600 text-sm font-mono text-slate-900 focus:outline-none"
              />
              {passwordErrorMsg && (
                <p className="text-xs font-bold text-red-600">{passwordErrorMsg}</p>
              )}
              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold cursor-pointer shadow-sm"
              >
                പാസ്‌വേഡ് നൽകി PDF തുറക്കുക
              </button>
            </form>
          </div>
        ) : isLoadingPdf ? (
          <div className="bg-white rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center min-h-[420px]">
            <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
            <p className="font-malayalam font-extrabold text-sm text-slate-900">
              നിങ്ങളുടെ ഒറിജിനൽ PDF വിൻഡോയിലേയ്ക്ക് തുറക്കുന്നു...
            </p>
            <p className="font-malayalam text-xs text-slate-500">
              എല്ലാ പേജുകളും അക്ഷരങ്ങളും അതേ സ്ഥാനത്ത് എഡിറ്റ് ചെയ്യാനായി ക്രമീകരിക്കുകയാണ്.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {pages.map((pageObj) => {
              const pageItems = textItems.filter(
                (item) => item.pageIndex === pageObj.pageIndex
              );

              return (
                <div
                  key={pageObj.pageIndex}
                  onClick={(e) => handlePageCanvasClick(e, pageObj)}
                  style={{
                    width: `${pageObj.widthPx * zoomScale}px`,
                    height: `${pageObj.heightPx * zoomScale}px`,
                  }}
                  className={`relative bg-white shadow-xl border border-slate-300 select-none overflow-hidden transition-all ${
                    activeTool !== 'select_edit' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  {/* Scaled Inner Coordinate Frame (matches 794px base coordinates) */}
                  <div
                    style={{
                      width: `${pageObj.widthPx}px`,
                      height: `${pageObj.heightPx}px`,
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'top left',
                    }}
                    className="relative"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        handlePageCanvasClick(e, pageObj);
                      }
                    }}
                  >
                    {/* 1. Original Untouched High-Res PDF Page Image */}
                    <img
                      src={pageObj.backgroundDataUrl}
                      alt={`PDF Page ${pageObj.pageIndex + 1}`}
                      draggable={false}
                      className="w-full h-full block pointer-events-none select-none"
                    />

                    {/* 2. Whiteout Masks covering Original PDF Text when Modified */}
                    {pageItems
                      .filter((item) => item.isModified && !item.isNew)
                      .map((item) => (
                        <div
                          key={`mask-${item.id}`}
                          style={{
                            left: `${Math.max(0, item.origX - 2)}px`,
                            top: `${Math.max(0, item.origY - 2)}px`,
                            width: `${item.origWidth + 5}px`,
                            height: `${item.origHeight + 4}px`,
                            backgroundColor: item.bgColor || '#ffffff',
                          }}
                          className="absolute pointer-events-none"
                        />
                      ))}

                    {/* 3. Interactive Editable Text Boxes Directly Over Original PDF Words */}
                    {pageItems.map((item) => {
                      const isSelected = selectedItemId === item.id;
                      const showOpaqueText = isSelected || item.isModified || item.isNew;

                      return (
                        <div
                          key={item.id}
                          style={{
                            left: `${item.x}px`,
                            top: `${item.y}px`,
                            minWidth: `${Math.max(24, item.width)}px`,
                            minHeight: `${Math.max(16, item.height)}px`,
                            backgroundColor: showOpaqueText
                              ? item.bgColor || '#ffffff'
                              : 'transparent',
                            zIndex: isSelected ? 30 : item.isModified ? 20 : 10,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItemId(item.id);
                          }}
                          className={`group absolute rounded-xs transition-shadow ${
                            isSelected
                              ? 'ring-2 ring-amber-500 shadow-md'
                              : item.isModified
                              ? 'ring-1 ring-emerald-500/70'
                              : showAllBoxes
                              ? 'border border-dashed border-amber-500/55 hover:border-solid hover:border-amber-500 hover:bg-amber-200/15'
                              : 'hover:ring-2 hover:ring-amber-400 hover:bg-amber-100/20'
                          }`}
                        >
                          {/* Drag Handle when Selected (Supports Mouse, Pointer & Touch) */}
                          {isSelected && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                dragRef.current = {
                                  itemId: item.id,
                                  startClientX: e.clientX,
                                  startClientY: e.clientY,
                                  initialX: item.x,
                                  initialY: item.y,
                                };
                              }}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                dragRef.current = {
                                  itemId: item.id,
                                  startClientX: e.clientX,
                                  startClientY: e.clientY,
                                  initialX: item.x,
                                  initialY: item.y,
                                };
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                                const touch = e.touches[0];
                                if (!touch) return;
                                dragRef.current = {
                                  itemId: item.id,
                                  startClientX: touch.clientX,
                                  startClientY: touch.clientY,
                                  initialX: item.x,
                                  initialY: item.y,
                                };
                              }}
                              title="വലിച്ച് നീക്കാൻ ഇവിടെ പിടിക്കുക (Drag to move)"
                              className="no-print absolute -top-5 left-0 px-1.5 py-0.5 rounded-t bg-amber-400 text-slate-950 text-[10px] font-malayalam font-extrabold flex items-center gap-1 cursor-move touch-none shadow-xs whitespace-nowrap"
                            >
                              <Move className="w-2.5 h-2.5" />
                              <span>നീക്കുക</span>
                            </div>
                          )}

                          <input
                            type="text"
                            value={item.text}
                            title="ഇവിടെ ക്ലിക്ക് ചെയ്ത് അക്ഷരങ്ങൾ മാറ്റാം"
                            onFocus={() => setSelectedItemId(item.id)}
                            onChange={(e) => {
                              const nextVal = e.target.value;
                              const estimatedW = Math.max(
                                item.origWidth + 8,
                                nextVal.length * (item.fontSize * 0.56) + 14
                              );
                              updateTextItem(item.id, {
                                text: nextVal,
                                width: estimatedW,
                              });
                            }}
                            style={{
                              fontSize: `${item.fontSize}px`,
                              lineHeight: `${Math.max(item.height, Math.round(item.fontSize * 1.2))}px`,
                              height: `${Math.max(item.height, Math.round(item.fontSize * 1.22))}px`,
                              width: `${Math.max(
                                item.width,
                                (item.text?.length || 1) * (item.fontSize * 0.56) + 12
                              )}px`,
                              fontWeight: item.fontWeight,
                              fontStyle: item.fontStyle,
                              color: showOpaqueText ? item.color : 'transparent',
                              caretColor: '#0f172a',
                              fontFamily:
                                item.fontFamily === 'malayalam'
                                  ? '"Noto Sans Malayalam", "Manjari", sans-serif'
                                  : item.fontFamily === 'serif'
                                  ? '"Noto Serif Malayalam", Georgia, serif'
                                  : item.fontFamily === 'mono'
                                  ? '"JetBrains Mono", monospace'
                                  : '"Plus Jakarta Sans", Arial, sans-serif',
                            }}
                            className="bg-transparent border-0 outline-none px-0.5 m-0 block w-full cursor-text selection:bg-amber-300/60"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
