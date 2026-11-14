import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import {
  DocumentCategory,
  MalayalamLetterData,
  GulfCvData,
  RentalAgreementData,
  TeacherMarkListData,
  computeStudentStats,
} from '../types/documents';
import { normalizeMalayalamChillaksharam } from './languageTranslator';

export interface ExtractedTextEntry {
  text: string;
  xMm: number;
  yMm: number;
  fontSizePt: number;
  isBold: boolean;
  color: string;
}

/**
 * Extracts all readable text elements and their exact relative A4 coordinates (in mm)
 * from the offscreen A4 container so that jsPDF can embed genuine vector text streams.
 */
function extractTextEntriesFromClone(clone: HTMLElement): ExtractedTextEntry[] {
  const entries: ExtractedTextEntry[] = [];
  const cloneRect = clone.getBoundingClientRect();
  if (!cloneRect || cloneRect.width === 0 || cloneRect.height === 0) return entries;

  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as HTMLElement | null;

  while (node) {
    if (node.classList && node.classList.contains('no-print')) {
      node = walker.nextNode() as HTMLElement | null;
      continue;
    }

    const tagName = node.tagName.toLowerCase();
    const isTextLeaf =
      node.children.length === 0 ||
      tagName === 'span' ||
      tagName === 'p' ||
      tagName === 'h1' ||
      tagName === 'h2' ||
      tagName === 'h3' ||
      tagName === 'td' ||
      tagName === 'th';

    if (isTextLeaf) {
      const text = (node.textContent || '').trim().normalize('NFC');
      if (text.length > 0) {
        const rect = node.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const style = window.getComputedStyle(node);
          const fontSizePx = parseFloat(style.fontSize || '14') || 14;
          const fontSizePt = Math.max(8, Math.min(22, Math.round(fontSizePx * 0.75)));
          const isBold = style.fontWeight === 'bold' || parseInt(style.fontWeight || '400', 10) >= 600;
          const color = style.color || '#0f172a';

          const relLeft = rect.left - cloneRect.left;
          const relTop = rect.top - cloneRect.top;
          const xMm = Math.max(4, Math.min(204, (relLeft * 210) / 794));
          const yMm = Math.max(4, Math.min(292, (relTop * 297) / 1123 + fontSizePt * 0.35));

          entries.push({ text, xMm, yMm, fontSizePt, isBold, color });
        }
      }
    }
    node = walker.nextNode() as HTMLElement | null;
  }
  return entries;
}

export interface RenderedA4Result {
  canvas: HTMLCanvasElement;
  textEntries: ExtractedTextEntry[];
}

/**
 * Bakes computed layout, spacing, flexbox, grid, border, and typography styles
 * from the live browser DOM directly into inline `element.style` attributes.
 * This guarantees that `html2canvas` renders 100% accurate A4 margins, centered headings,
 * right-aligned signatures, and tables even on mobile browsers where cloned iframe stylesheets lag.
 */
function bakeComputedStylesIntoClone(root: HTMLElement): void {
  // First convert any 12-column CSS grids into deterministic flex rows with exact measured pixel widths
  // so html2canvas never collapses .col-span-8 / .col-span-6 / .col-span-9 into a 1-letter vertical column!
  const twelveColGrids = Array.from(root.querySelectorAll<HTMLElement>('.grid-cols-12'));
  for (const gridEl of twelveColGrids) {
    const gridRect = gridEl.getBoundingClientRect();
    const children = Array.from(gridEl.children) as HTMLElement[];
    const childWidths = children.map((ch) => Math.max(40, Math.round(ch.getBoundingClientRect().width)));

    gridEl.style.display = 'flex';
    gridEl.style.flexDirection = 'row';
    gridEl.style.flexWrap = 'nowrap';
    gridEl.style.justifyContent = 'space-between';
    gridEl.style.alignItems = 'flex-start';
    if (gridRect.width > 0) {
      gridEl.style.width = `${Math.round(gridRect.width)}px`;
    }

    children.forEach((ch, idx) => {
      const w = childWidths[idx];
      ch.style.width = `${w}px`;
      ch.style.minWidth = `${w}px`;
      ch.style.maxWidth = `${w}px`;
      ch.style.flex = `0 0 ${w}px`;
      ch.style.boxSizing = 'border-box';
    });
  }

  const allNodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  const styleProps: Array<keyof CSSStyleDeclaration> = [
    'display',
    'boxSizing',
    'position',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'flexDirection',
    'flexWrap',
    'justifyContent',
    'alignItems',
    'alignSelf',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'gridTemplateColumns',
    'gridColumnStart',
    'gridColumnEnd',
    'gap',
    'rowGap',
    'columnGap',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'fontStyle',
    'lineHeight',
    'letterSpacing',
    'textAlign',
    'textDecorationLine',
    'textTransform',
    'whiteSpace',
    'color',
    'backgroundColor',
    'borderCollapse',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'borderRadius',
  ];

  // Measure all bounding rects upfront before mutating inline styles
  const measuredWidths = new Map<HTMLElement, number>();
  for (const el of allNodes) {
    const r = el.getBoundingClientRect();
    if (r.width > 0) {
      measuredWidths.set(el, Math.round(r.width));
    }
  }

  for (const el of allNodes) {
    const cs = window.getComputedStyle(el);
    for (const prop of styleProps) {
      const val = cs[prop];
      if (typeof val === 'string' && val.length > 0) {
        try {
          (el.style as any)[prop] = val;
        } catch {
          // ignore read-only style properties
        }
      }
    }

    // Lock explicit measured pixel width on block/flex/grid containers & replaced inputs so text never squashes vertically or shifts right
    const tag = el.tagName.toLowerCase();
    const measuredW = measuredWidths.get(el);
    if (
      measuredW &&
      measuredW > 24 &&
      tag !== 'span' &&
      tag !== 'table' &&
      tag !== 'tbody' &&
      tag !== 'thead' &&
      tag !== 'tr' &&
      tag !== 'td' &&
      tag !== 'th' &&
      tag !== 'img'
    ) {
      el.style.width = `${measuredW}px`;
      el.style.maxWidth = `${measuredW}px`;
    }

    // Explicit class-based structural safeguards so layout is preserved even if a parent was hidden
    const cls = typeof el.className === 'string' ? el.className : '';
    if (/\btext-center\b/.test(cls)) el.style.textAlign = 'center';
    if (/\btext-right\b/.test(cls)) el.style.textAlign = 'right';
    if (/\btext-justify\b/.test(cls)) el.style.textAlign = 'justify';
    if (/\bunderline\b/.test(cls)) el.style.textDecoration = 'underline';
    if (/\b(font-bold|font-extrabold|font-black)\b/.test(cls)) el.style.fontWeight = '700';
    else if (/\bfont-semibold\b/.test(cls)) el.style.fontWeight = '600';

    if (/\bflex\b/.test(cls) && !/\bgrid-cols-12\b/.test(cls)) el.style.display = 'flex';
    if (/\bflex-col\b/.test(cls)) el.style.flexDirection = 'column';
    if (/\bflex-row\b/.test(cls)) el.style.flexDirection = 'row';
    if (/\bjustify-between\b/.test(cls)) el.style.justifyContent = 'space-between';
    if (/\bjustify-center\b/.test(cls)) el.style.justifyContent = 'center';
    if (/\bitems-center\b/.test(cls)) el.style.alignItems = 'center';
    if (/\bitems-end\b/.test(cls)) el.style.alignItems = 'flex-end';
    if (/\bitems-start\b/.test(cls)) el.style.alignItems = 'flex-start';

    if (/\bpx-10\b/.test(cls)) {
      el.style.paddingLeft = '40px';
      el.style.paddingRight = '40px';
    } else if (/\bpx-9\b/.test(cls)) {
      el.style.paddingLeft = '36px';
      el.style.paddingRight = '36px';
    } else if (/\bpx-8\b/.test(cls)) {
      el.style.paddingLeft = '32px';
      el.style.paddingRight = '32px';
    } else if (/\bpl-4\b/.test(cls)) {
      el.style.paddingLeft = '16px';
    }

    if (/\bpy-9\b/.test(cls)) {
      el.style.paddingTop = '36px';
      el.style.paddingBottom = '36px';
    } else if (/\bpy-8\b/.test(cls)) {
      el.style.paddingTop = '32px';
      el.style.paddingBottom = '32px';
    }
  }
}

/**
 * Renders the A4 sheet inside an offscreen 794px-wide (210mm @ 96DPI) desktop stage
 * so that even on a narrow 360px mobile screen (or when the preview tab is hidden),
 * the resulting canvas always has true A4 proportions and NEVER squashes or left-flushes text.
 */
async function renderCleanA4Canvas(
  element: HTMLElement,
  scale = 3.2,
  autoFitOnePage = true
): Promise<RenderedA4Result> {
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.ready,
        document.fonts.load('400 16px "Noto Sans Malayalam"'),
        document.fonts.load('700 16px "Noto Sans Malayalam"'),
        document.fonts.load('400 16px "Plus Jakarta Sans"'),
        document.fonts.load('700 16px "Plus Jakarta Sans"'),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 120));
    } catch {
      // Proceed if font preloader is unsupported
    }
  }

  // Create offscreen desktop A4 stage (794px = 210mm, 1123px = 297mm at 96 DPI)
  const stage = document.createElement('div');
  stage.style.position = 'fixed';
  stage.style.left = '-10000px';
  stage.style.top = '0';
  stage.style.width = '794px';
  stage.style.minHeight = '1123px';
  stage.style.backgroundColor = '#FFFFFF';
  stage.style.color = '#0F172A';
  stage.style.fontFamily = "'Noto Sans Malayalam', 'Plus Jakarta Sans', sans-serif";
  stage.style.zIndex = '-9999';
  stage.style.pointerEvents = 'none';
  stage.style.overflow = 'visible';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '794px';
  clone.style.minWidth = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minHeight = '1123px';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.margin = '0';
  clone.style.backgroundColor = '#FFFFFF';
  clone.style.color = '#0F172A';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.boxSizing = 'border-box';
  clone.style.overflow = 'visible';

  // Remove any .no-print overlays/watermarks/helper buttons from the PDF clone
  clone.querySelectorAll('.no-print').forEach((node) => node.remove());

  // Upgrade any viewport-dependent `sm:` classes inside the clone so 360px mobile screens
  // still evaluate desktop A4 columns, padding, and font sizes
  clone.querySelectorAll<HTMLElement>('[class*="sm:"]').forEach((el) => {
    el.className = el.className
      .replace(/\bgrid-cols-1\s+sm:grid-cols-2\b/g, 'grid-cols-2')
      .replace(/\bgrid-cols-2\s+sm:grid-cols-4\b/g, 'grid-cols-4')
      .replace(/\bsm:(px-\d+|py-\d+|p-\d+|text-[^\s]+|grid-cols-\d+)\b/g, '$1');
  });

  // Mount stage & clone in document.body FIRST so getComputedStyle & getBoundingClientRect work even if the preview tab was hidden on mobile!
  stage.appendChild(clone);
  document.body.appendChild(stage);

  try {
    // Wait for all images (like candidate photo, official logos, etc.) to decode completely
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 350);
            }
          })
      )
    );

    // Sync live input/textarea values from original DOM to cloned DOM and convert to styled printed blocks
    const origInputs = element.querySelectorAll('input, textarea');
    const cloneInputs = clone.querySelectorAll('input, textarea');
    origInputs.forEach((orig, idx) => {
      const target = cloneInputs[idx] as HTMLInputElement | HTMLTextAreaElement | undefined;
      if (!target) return;
      const isTextarea = target.tagName.toLowerCase() === 'textarea';
      const rawInputVal = (orig as HTMLInputElement | HTMLTextAreaElement).value || '';
      // Never print unedited "ഉദാ: ..." example hints into the final PDF
      const cleanedInputVal = /^ഉദാ\s*:/i.test(rawInputVal.trim()) ? '' : rawInputVal;
      const val = normalizeMalayalamChillaksharam(cleanedInputVal);
      const cls = target.className || '';
      const computed = window.getComputedStyle(target);
      const targetRect = target.getBoundingClientRect();

      // Check if this input has an explicit compact width class (e.g., w-14, w-16, w-20, w-28, w-36, w-40)
      const compactWidthMatch = cls.match(/\bw-(9|10|11|12|14|16|20|24|28|32|36|40|44|52)\b/);
      const hasCompactFixedWidth = Boolean(compactWidthMatch);
      const isBlockField = isTextarea || !hasCompactFixedWidth;

      const rep = document.createElement(isBlockField ? 'div' : 'span');
      rep.textContent = val;
      rep.className = cls
        .replace(/border[^\s]*/g, '')
        .replace(/bg-amber[^\s]*/g, '')
        .replace(/focus:[^\s]*/g, '')
        .replace(/\bmin-w-0\b/g, '');

      // Copy computed typography & alignment directly onto the replacement element
      rep.style.fontFamily = computed.fontFamily || "'Noto Sans Malayalam', 'Plus Jakarta Sans', sans-serif";
      rep.style.fontSize = computed.fontSize || '14.5px';
      rep.style.fontWeight = computed.fontWeight || '400';
      rep.style.fontStyle = computed.fontStyle || 'normal';
      rep.style.lineHeight = computed.lineHeight && computed.lineHeight !== 'normal' ? computed.lineHeight : '1.72';
      rep.style.color = computed.color || '#0F172A';
      rep.style.textAlign = computed.textAlign || 'start';
      rep.style.textDecorationLine = computed.textDecorationLine || 'none';
      rep.style.marginTop = computed.marginTop || '0px';
      rep.style.marginBottom = computed.marginBottom || '0px';
      rep.style.boxSizing = 'border-box';

      // Explicit class-based overrides for alignment, weight, and underline
      if (/\btext-center\b/.test(cls)) rep.style.textAlign = 'center';
      if (/\btext-right\b/.test(cls)) rep.style.textAlign = 'right';
      if (/\btext-justify\b/.test(cls)) rep.style.textAlign = 'justify';
      if (/\bunderline\b/.test(cls)) {
        rep.style.textDecoration = 'underline';
        rep.style.textUnderlineOffset = '4px';
      }
      if (/\b(font-bold|font-extrabold|font-black)\b/.test(cls)) {
        rep.style.fontWeight = '700';
      } else if (/\bfont-semibold\b/.test(cls)) {
        rep.style.fontWeight = '600';
      }

      if (isBlockField) {
        rep.style.display = 'block';
        if (targetRect.width > 36) {
          rep.style.width = `${Math.round(targetRect.width)}px`;
          rep.style.minWidth = `${Math.round(targetRect.width)}px`;
        } else {
          rep.style.width = '100%';
        }
        if (/\bflex-1\b/.test(cls)) {
          rep.style.flex = '1 1 0%';
        }
        rep.style.whiteSpace = 'pre-wrap';
        rep.style.wordBreak = 'normal';
        rep.style.overflowWrap = 'break-word';
      } else {
        rep.style.display = 'inline-block';
        // Convert Tailwind w-N class to exact pixel width so w-full never overrides w-16 / w-20!
        const tailwindNum = compactWidthMatch ? parseInt(compactWidthMatch[1], 10) : 0;
        const explicitPx = tailwindNum > 0 ? tailwindNum * 4 : Math.round(targetRect.width);
        if (explicitPx > 10) {
          rep.style.width = `${explicitPx}px`;
          rep.style.maxWidth = `${explicitPx}px`;
        }
        if (/\bshrink-0\b/.test(cls)) {
          rep.style.flexShrink = '0';
          rep.style.marginRight = '4px';
        }
        rep.style.whiteSpace = 'pre-wrap';
        rep.style.wordBreak = 'normal';
        rep.style.overflowWrap = 'break-word';
      }

      target.replaceWith(rep);
    });

    // Clean up unedited example ("ഉദാ: ...") rows in 2-3 column government forms only (never touch marklists or dotted blank forms!)
    const tables = Array.from(clone.querySelectorAll('table'));
    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
      if (rows.length >= 3) {
        const isMultiColMarkList = rows.some((r) => r.querySelectorAll('td, th').length >= 4);
        if (isMultiColMarkList) continue;
        const filledRows = rows.filter((r) => {
          const cells = Array.from(r.querySelectorAll('td'));
          if (cells.length < 2) return true;
          const valCell = cells[cells.length - 1];
          const text = (valCell.textContent || '').trim();
          return text.length > 0 && !/^ഉദാ\s*:/i.test(text) && text !== '-';
        });
        if (filledRows.length >= 2 && filledRows.length < rows.length) {
          rows.forEach((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            if (cells.length >= 2) {
              const valCell = cells[cells.length - 1];
              const text = (valCell.textContent || '').trim();
              if ((!text || /^ഉദാ\s*:/i.test(text) || text === '-') && !text.includes('....')) {
                r.remove();
              }
            }
          });
          const remainingRows = Array.from(table.querySelectorAll('tbody tr, tr'));
          remainingRows.forEach((r, idx) => {
            const firstCell = r.querySelector('td:first-child');
            if (firstCell && /^\d+$/.test((firstCell.textContent || '').trim())) {
              firstCell.textContent = String(idx + 1);
            }
          });
        }
      }
    }

    // Apply Unicode NFC + atomic Malayalam chillaksharam (ൺ, ൻ, ർ, ൽ, ൾ, ൿ) normalization across all text nodes
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let textNode = walker.nextNode();
    while (textNode) {
      if (textNode.nodeValue) {
        textNode.nodeValue = normalizeMalayalamChillaksharam(textNode.nodeValue);
      }
      textNode = walker.nextNode();
    }

    // Allow browser layout & OpenType Malayalam shaping to settle
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 120);
      });
    });

    // Dynamic Single-Page Auto-Fit: if content exceeds 1123px (297mm), tighten spacing and font size
    // without using CSS zoom (which breaks html2canvas coordinate calculations).
    if (autoFitOnePage && clone.scrollHeight > 1123) {
      const innerPage =
        clone.querySelector<HTMLElement>('[data-a4-single-page-inner="true"]') || clone;

      const rawOverflowRatio = 1123 / clone.scrollHeight;
      const targetFontPx = Math.max(10.5, Math.floor(14 * rawOverflowRatio * 10) / 10);
      innerPage.style.paddingTop = '22px';
      innerPage.style.paddingBottom = '22px';
      innerPage.style.fontSize = `${targetFontPx}px`;
      innerPage.style.lineHeight = rawOverflowRatio < 0.82 ? '1.36' : '1.46';

      clone.querySelectorAll<HTMLElement>('.mb-8, .mb-6, .mt-10').forEach((el) => {
        el.style.marginBottom = '10px';
        el.style.marginTop = '8px';
      });
      clone.querySelectorAll<HTMLElement>('.space-y-3, .space-y-4').forEach((el) => {
        el.style.rowGap = '6px';
      });
    }

    // Render full height of the clone so nothing is ever clipped at the bottom;
    // buildProportionalA4PdfFromCanvas proportionally scales single-page documents onto 1 A4 page!
    const renderHeight = Math.max(1123, clone.scrollHeight);

    // Bake all computed styles & exact measured pixel widths directly into inline style attributes
    bakeComputedStylesIntoClone(clone);

    const textEntries = extractTextEntriesFromClone(clone);

    const rawCanvas = await html2canvas(clone, {
      scale,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      width: 794,
      height: renderHeight,
      windowWidth: 1280,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
    });
    const trimmedCanvas = trimTrailingBlankCanvasSpace(rawCanvas, scale);
    return { canvas: trimmedCanvas, textEntries };
  } finally {
    if (stage.parentNode) {
      stage.parentNode.removeChild(stage);
    }
  }
}

/**
 * Scans from the bottom of the rendered canvas upward to remove any trailing blank white space
 * caused by mobile viewport scrollHeight or minHeight inflation.
 */
function trimTrailingBlankCanvasSpace(
  canvas: HTMLCanvasElement,
  scale: number
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  let lastContentRow = 0;
  const rowStep = Math.max(1, Math.floor(scale));
  const colStep = Math.max(2, Math.floor(scale * 2));

  for (let y = height - 1; y >= 0; y -= rowStep) {
    let rowHasInk = false;
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x += colStep) {
      const idx = rowOffset + x * 4;
      const r = imageData[idx];
      const g = imageData[idx + 1];
      const b = imageData[idx + 2];
      const a = imageData[idx + 3];
      if (a > 10 && (r < 250 || g < 250 || b < 250)) {
        rowHasInk = true;
        break;
      }
    }
    if (rowHasInk) {
      lastContentRow = y;
      break;
    }
  }

  const bottomPaddingPx = Math.round(28 * scale);
  const minOnePageHeightPx = Math.round(400 * scale);
  const trimmedHeight = Math.min(
    height,
    Math.max(minOnePageHeightPx, lastContentRow + bottomPaddingPx)
  );

  if (trimmedHeight >= height - 8) {
    return canvas;
  }

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = width;
  trimmedCanvas.height = trimmedHeight;
  const tCtx = trimmedCanvas.getContext('2d');
  if (tCtx) {
    tCtx.fillStyle = '#FFFFFF';
    tCtx.fillRect(0, 0, width, trimmedHeight);
    tCtx.drawImage(canvas, 0, 0, width, trimmedHeight, 0, 0, width, trimmedHeight);
  }
  return trimmedCanvas;
}

function canvasHasVisibleContent(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) return false;
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let inkPixels = 0;
  for (let i = 0; i < data.length; i += 64) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a > 10 && (r < 248 || g < 248 || b < 248)) {
      inkPixels++;
      if (inkPixels > 12) return true;
    }
  }
  return false;
}

export interface PdfExportOptions {
  autoFitOnePage?: boolean;
  mode?: 'print_hd' | 'ats_vector';
  gulfCvData?: GulfCvData;
  category?: DocumentCategory;
  textEntries?: ExtractedTextEntry[];
}

/**
 * Finds a clean horizontal whitespace row (blank scanline between lines of text)
 * near `idealBreakY` so multi-page PDFs never slice through the middle of Malayalam/English text.
 */
function findSafeHorizontalPageBreak(
  canvas: HTMLCanvasElement,
  idealBreakY: number,
  minBreakY: number
): number {
  const ctx = canvas.getContext('2d');
  if (!ctx || idealBreakY >= canvas.height) return Math.min(idealBreakY, canvas.height);

  const width = canvas.width;
  const startY = Math.max(0, Math.min(canvas.height - 1, Math.floor(idealBreakY)));
  const endY = Math.max(0, Math.floor(minBreakY));
  if (startY <= endY) return startY;

  const stripHeight = startY - endY + 1;
  const imageData = ctx.getImageData(0, endY, width, stripHeight).data;
  const colStep = 4;

  // Scan upward from startY toward endY to find a completely blank horizontal row
  for (let offset = stripHeight - 1; offset >= 0; offset--) {
    let rowIsBlank = true;
    const rowStartIdx = offset * width * 4;
    for (let x = 0; x < width; x += colStep) {
      const idx = rowStartIdx + x * 4;
      const r = imageData[idx];
      const g = imageData[idx + 1];
      const b = imageData[idx + 2];
      const a = imageData[idx + 3];
      if (a > 12 && (r < 245 || g < 245 || b < 245)) {
        rowIsBlank = false;
        break;
      }
    }
    if (rowIsBlank) {
      return endY + offset;
    }
  }

  return idealBreakY;
}

/**
 * Generates a 100% genuine native vector ATS-compliant A4 PDF for Gulf CV / Resume
 * with zero full-page raster overlays and zero hidden/1pt white text tricks.
 */
function buildGenuineAtsVectorGulfCvPdf(cv: GulfCvData): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 16;

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > pageHeight - 14) {
      pdf.addPage('a4', 'portrait');
      cursorY = 16;
    }
  };

  // Optional candidate passport photo (top-right, preserving natural aspect ratio)
  const hasPhoto = Boolean(cv.photoDataUrl && cv.photoDataUrl.startsWith('data:image/'));
  const headerTextWidth = hasPhoto ? contentWidth - 34 : contentWidth;

  if (hasPhoto && cv.photoDataUrl) {
    try {
      const imgFormat = cv.photoDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.3);
      pdf.rect(pageWidth - marginX - 28, 12, 28, 35);
      pdf.addImage(cv.photoDataUrl, imgFormat, pageWidth - marginX - 27.5, 12.5, 27, 34, undefined, 'FAST');
    } catch {
      // Ignore invalid photo data URL
    }
  }

  // Full Name & Job Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  const nameLines = pdf.splitTextToSize((cv.fullName || 'CANDIDATE NAME').toUpperCase(), headerTextWidth);
  pdf.text(nameLines, marginX, cursorY);
  cursorY += nameLines.length * 7;

  if (cv.jobTitle) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11.5);
    pdf.setTextColor(5, 150, 105);
    const roleLines = pdf.splitTextToSize(cv.jobTitle.toUpperCase(), headerTextWidth);
    pdf.text(roleLines, marginX, cursorY);
    cursorY += roleLines.length * 5.5;
  }

  // Contact & Location Bar
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);
  const contactParts = [
    cv.currentLocation ? `Location: ${cv.currentLocation}` : '',
    cv.phone ? `Phone: ${cv.phone}` : '',
    cv.whatsapp && cv.whatsapp !== cv.phone ? `WhatsApp: ${cv.whatsapp}` : '',
    cv.email ? `Email: ${cv.email}` : '',
  ].filter(Boolean);
  if (contactParts.length > 0) {
    const contactLines = pdf.splitTextToSize(contactParts.join('  |  '), headerTextWidth);
    pdf.text(contactLines, marginX, cursorY);
    cursorY += contactLines.length * 4.8;
  }

  const visaParts = [
    cv.visaStatus ? `Visa Status: ${cv.visaStatus}` : '',
    cv.passportNumber ? `Passport No: ${cv.passportNumber}` : '',
    cv.drivingLicense ? `Driving License: ${cv.drivingLicense}` : '',
  ].filter(Boolean);
  if (visaParts.length > 0) {
    const visaLines = pdf.splitTextToSize(visaParts.join('  |  '), headerTextWidth);
    pdf.text(visaLines, marginX, cursorY);
    cursorY += visaLines.length * 4.8;
  }

  if (hasPhoto && cursorY < 50) {
    cursorY = 50;
  }

  const drawSectionHeader = (title: string) => {
    ensureSpace(12);
    cursorY += 3;
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.4);
    pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(title.toUpperCase(), marginX, cursorY);
    cursorY += 4.5;
  };

  // 1. Professional Summary
  if (cv.professionalSummary) {
    drawSectionHeader('PROFESSIONAL SUMMARY');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 41, 59);
    const sumLines = pdf.splitTextToSize(cv.professionalSummary, contentWidth);
    ensureSpace(sumLines.length * 4.6);
    pdf.text(sumLines, marginX, cursorY);
    cursorY += sumLines.length * 4.6 + 2;
  }

  // 2. Core Skills
  if (cv.coreSkills && cv.coreSkills.length > 0) {
    drawSectionHeader('CORE COMPETENCIES & TECHNICAL SKILLS');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 41, 59);
    const skillsText = cv.coreSkills.map((s) => `• ${s}`).join('    ');
    const skillLines = pdf.splitTextToSize(skillsText, contentWidth);
    ensureSpace(skillLines.length * 4.6);
    pdf.text(skillLines, marginX, cursorY);
    cursorY += skillLines.length * 4.6 + 2;
  }

  // 3. Work Experience
  if (cv.workExperience && cv.workExperience.length > 0) {
    drawSectionHeader('PROFESSIONAL WORK EXPERIENCE');
    cv.workExperience.forEach((exp) => {
      ensureSpace(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${exp.role || ''} — ${exp.company || ''}`, marginX, cursorY);
      if (exp.duration) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        pdf.text(exp.duration, pageWidth - marginX, cursorY, { align: 'right' });
      }
      cursorY += 4.8;
      if (exp.highlights && exp.highlights.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.2);
        pdf.setTextColor(30, 41, 59);
        exp.highlights.forEach((hl) => {
          const hlLines = pdf.splitTextToSize(`• ${hl}`, contentWidth - 3);
          ensureSpace(hlLines.length * 4.4);
          pdf.text(hlLines, marginX + 2, cursorY);
          cursorY += hlLines.length * 4.4;
        });
      }
      cursorY += 2.2;
    });
  }

  // 4. Education & Certifications
  if (cv.education && cv.education.length > 0) {
    drawSectionHeader('EDUCATION & ACADEMIC QUALIFICATIONS');
    cv.education.forEach((edu) => {
      ensureSpace(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${edu.degree || ''} — ${edu.institution || ''}`, marginX, cursorY);
      if (edu.year) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.text(edu.year, pageWidth - marginX, cursorY, { align: 'right' });
      }
      cursorY += 5.2;
    });
  }

  // 5. Personal & Passport Details
  drawSectionHeader('PERSONAL & PASSPORT PARTICULARS');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.2);
  pdf.setTextColor(30, 41, 59);
  const personalRows = [
    cv.nationality ? `Nationality: ${cv.nationality}` : '',
    cv.dateOfBirth ? `Date of Birth: ${cv.dateOfBirth}` : '',
    cv.maritalStatus ? `Marital Status: ${cv.maritalStatus}` : '',
    cv.passportExpiry ? `Passport Expiry: ${cv.passportExpiry}` : '',
    cv.languages && cv.languages.length > 0
      ? `Languages Known: ${cv.languages.join(', ')}`
      : '',
  ].filter(Boolean);
  personalRows.forEach((row) => {
    ensureSpace(5);
    pdf.text(row, marginX, cursorY);
    cursorY += 4.6;
  });

  // 6. Declaration
  ensureSpace(18);
  cursorY += 4;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8.8);
  pdf.setTextColor(71, 85, 105);
  const decl =
    cv.declaration ||
    'I hereby declare that the above-mentioned particulars are true and correct to the best of my knowledge and belief.';
  const declLines = pdf.splitTextToSize(decl, contentWidth);
  pdf.text(declLines, marginX, cursorY);
  cursorY += declLines.length * 4.4 + 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`Place: ${cv.cvPlace || cv.currentLocation || ''}`, marginX, cursorY);
  pdf.text(
    (cv.signatureName || cv.fullName || '').toUpperCase(),
    pageWidth - marginX,
    cursorY,
    { align: 'right' }
  );

  return pdf;
}

function buildProportionalA4PdfFromCanvas(
  canvas: HTMLCanvasElement,
  options?: PdfExportOptions
): jsPDF {
  // 1. If ATS Vector mode is requested for a Gulf CV, return a 100% genuine native vector PDF
  // (No full-page raster image covering text, and no hidden 1pt white text!)
  if (options?.mode === 'ats_vector' && options?.gulfCvData) {
    return buildGenuineAtsVectorGulfCvPdf(options.gulfCvData);
  }

  const isSinglePageCategory =
    options?.category === 'malayalam_letter' ||
    options?.category === 'gulf_cv' ||
    options?.category === 'rental_agreement' ||
    Boolean(options?.gulfCvData);

  const autoFitOnePage = isSinglePageCategory || options?.autoFitOnePage !== false;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pageHeight = 297;
  const pageHeightPx = Math.round((canvas.width * 297) / 210);

  // 2. Guaranteed Single-Page A4 Mode for All Single-Page Categories:
  // Proportionally fit onto EXACTLY 1 A4 page while preserving exact aspect ratio (never stretching or squashing!)
  if (autoFitOnePage || canvas.height <= pageHeightPx + 15) {
    const rawHeightMm = (canvas.height * pdfWidth) / canvas.width;
    const scaleFactor = rawHeightMm > pageHeight ? pageHeight / rawHeightMm : 1;
    const fittedWidthMm = pdfWidth * scaleFactor;
    const fittedHeightMm = Math.min(pageHeight, rawHeightMm * scaleFactor);
    const offsetXMm = Math.max(0, (pdfWidth - fittedWidthMm) / 2);
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', offsetXMm, 0, fittedWidthMm, fittedHeightMm, undefined, 'FAST');
    return pdf;
  }

  // 3. Multi-page document with Smart Whitespace Line-Break Detection & Clean Top/Bottom Continuation Margins:
  // Never slices through the middle of a Malayalam/English text line and never distorts aspect ratio!
  let currentY = 0;
  let addedPagesCount = 0;
  const maxPagesSafety = 25;

  while (currentY < canvas.height - 24 && addedPagesCount < maxPagesSafety) {
    const isFirstPage = addedPagesCount === 0;
    const topMarginMm = isFirstPage ? 0 : 12;
    const bottomMarginMm = 10;
    const usableHeightMm = pageHeight - topMarginMm - bottomMarginMm;
    const maxSliceHeightPx = Math.round((usableHeightMm * canvas.width) / pdfWidth);

    let nextBreakY = currentY + maxSliceHeightPx;
    if (nextBreakY < canvas.height) {
      const minSearchY = currentY + Math.round(maxSliceHeightPx * 0.72);
      nextBreakY = findSafeHorizontalPageBreak(canvas, nextBreakY, minSearchY);
    } else {
      nextBreakY = canvas.height;
    }

    const sourceH = Math.max(1, nextBreakY - currentY);
    if (sourceH < 24) break;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceH;
    const pageCtx = pageCanvas.getContext('2d');
    if (pageCtx) {
      pageCtx.fillStyle = '#FFFFFF';
      pageCtx.fillRect(0, 0, pageCanvas.width, sourceH);
      pageCtx.drawImage(
        canvas,
        0,
        currentY,
        canvas.width,
        sourceH,
        0,
        0,
        canvas.width,
        sourceH
      );
    }

    if (addedPagesCount > 0 && !canvasHasVisibleContent(pageCanvas)) {
      currentY = nextBreakY;
      continue;
    }

    if (addedPagesCount > 0) {
      pdf.addPage('a4', 'portrait');
    }
    addedPagesCount++;

    // Exact proportional height in mm so text and photos are NEVER stretched or squashed
    const sliceHeightMm = Math.min(usableHeightMm, (sourceH * pdfWidth) / canvas.width);
    const sliceData = pageCanvas.toDataURL('image/png');
    pdf.addImage(
      sliceData,
      'PNG',
      0,
      topMarginMm,
      pdfWidth,
      sliceHeightMm,
      undefined,
      'FAST'
    );

    currentY = nextBreakY;
  }

  return pdf;
}

export async function generateAndDownloadA4Pdf(
  element: HTMLElement,
  filenameBase: string,
  options?: PdfExportOptions
): Promise<Blob | null> {
  const explicitPages = Array.from(
    element.querySelectorAll<HTMLElement>('.a4-explicit-page')
  );

  let pdf: jsPDF;

  if (options?.mode === 'ats_vector' && options?.gulfCvData) {
    pdf = buildGenuineAtsVectorGulfCvPdf(options.gulfCvData);
  } else if (explicitPages.length > 1) {
    pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    const pdfWidth = 210;
    const pageHeight = 297;

    for (let i = 0; i < explicitPages.length; i++) {
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      const { canvas: pageCanvas } = await renderCleanA4Canvas(explicitPages[i], 3.2, false);
      const rawHeightMm = (pageCanvas.height * pdfWidth) / pageCanvas.width;
      const scaleFactor = rawHeightMm > pageHeight ? pageHeight / rawHeightMm : 1;
      const fittedWidthMm = pdfWidth * scaleFactor;
      const fittedHeightMm = Math.min(pageHeight, rawHeightMm * scaleFactor);
      const offsetXMm = Math.max(0, (pdfWidth - fittedWidthMm) / 2);
      const imgData = pageCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', offsetXMm, 0, fittedWidthMm, fittedHeightMm, undefined, 'FAST');
    }
  } else {
    const { canvas, textEntries } = await renderCleanA4Canvas(element, 3.2);
    pdf = buildProportionalA4PdfFromCanvas(canvas, { ...options, textEntries });
  }

  const safeName = filenameBase
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9_\u0D00-\u0D7F-]/g, '_')
    .slice(0, 45);
  const suffix = options?.mode === 'ats_vector' ? '_ATS_Vector_A4.pdf' : '_A4.pdf';
  const finalFilename = `${safeName || 'Parayam_Document'}${suffix}`;

  pdf.save(finalFilename);
  return pdf.output('blob');
}

/**
 * Extracts readable Unicode text streams from an uploaded PDF file in the browser
 * using pdf.js (handling FlateDecode compressed streams and Unicode CMaps accurately),
 * with a fallback to literal string scanning if pdf.js is unavailable.
 */
export async function extractReadableTextFromPdfBuffer(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();

    // 1. Primary: Use pdf.js (pdfjsLib) to decompress FlateDecode streams & ToUnicode CMaps
    const pdfjsLib = typeof window !== 'undefined' ? (window as any).pdfjsLib : null;
    if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const pdfDoc = await loadingTask.promise;
        const maxPages = Math.min(pdfDoc.numPages || 1, 15);
        const pageTexts: string[] = [];

        for (let p = 1; p <= maxPages; p++) {
          const page = await pdfDoc.getPage(p);
          const textContent = await page.getTextContent();
          const items = (textContent?.items || []) as Array<{ str?: string; hasEOL?: boolean }>;
          const lines: string[] = [];
          let currentLine = '';
          for (const item of items) {
            const s = (item.str || '').trim();
            if (s) {
              currentLine += (currentLine ? ' ' : '') + s;
            }
            if (item.hasEOL && currentLine) {
              lines.push(currentLine);
              currentLine = '';
            }
          }
          if (currentLine) lines.push(currentLine);
          if (lines.length > 0) {
            pageTexts.push(lines.join('\n'));
          }
        }

        const extracted = pageTexts.join('\n\n').trim().normalize('NFC');
        if (extracted.length > 10) {
          return extracted.slice(0, 8000);
        }
      } catch {
        // Fall through to raw literal fallback if PDF is encrypted or pdfjs fails
      }
    }

    // 2. Fallback: Extract uncompressed literal (...) strings
    const bytes = new Uint8Array(buffer);
    const rawLatin = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const matches: string[] = [];

    const parenRegex = /\(([^()\\]{2,250})\)/g;
    let m: RegExpExecArray | null;
    while ((m = parenRegex.exec(rawLatin)) !== null) {
      const cleaned = m[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, ' ')
        .replace(/[^\x20-\x7E\u0D00-\u0D7F]/g, '')
        .trim();
      if (cleaned.length >= 2 && !/^(Type|Font|Page|Catalog|FlateDecode|Obj|Length|Filter)/i.test(cleaned)) {
        matches.push(cleaned);
      }
    }

    const joined = matches.join('\n').replace(/[ \t]+/g, ' ').trim();
    return joined.length > 20 ? joined.slice(0, 4000).normalize('NFC') : '';
  } catch {
    return '';
  }
}

export async function shareDocumentOnWhatsApp(
  element: HTMLElement | null,
  category: DocumentCategory,
  letterData: MalayalamLetterData,
  gulfCvData: GulfCvData,
  agreementData: RentalAgreementData,
  markListData?: TeacherMarkListData,
  targetPhone?: string
): Promise<void> {
  const filenameBase =
    category === 'gulf_cv'
      ? `Gulf_CV_${gulfCvData.fullName}`
      : category === 'rental_agreement'
      ? 'Kerala_Rent_Agreement'
      : category === 'teacher_marklist'
      ? 'Class_Mark_List_A4'
      : 'Kerala_Official_Application';

  const safeFileName = `${filenameBase
    .normalize('NFC')
    .replace(/[^a-zA-Z0-9_\u0D00-\u0D7F-]/g, '_')
    .slice(0, 45)}_A4.pdf`;

  let generatedPdf: jsPDF | null = null;

  // Build the real A4 PDF first so we can either native-share the file OR auto-download it before opening WhatsApp
  if (element) {
    try {
      const explicitPages = Array.from(
        element.querySelectorAll<HTMLElement>('.a4-explicit-page')
      );
      if (explicitPages.length > 1) {
        generatedPdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });
        const pdfWidth = 210;
        const pageHeight = 297;
        for (let i = 0; i < explicitPages.length; i++) {
          if (i > 0) generatedPdf.addPage('a4', 'portrait');
          const { canvas: pCanvas } = await renderCleanA4Canvas(explicitPages[i], 2.8, false);
          const rawHeightMm = (pCanvas.height * pdfWidth) / pCanvas.width;
          const scaleFactor = rawHeightMm > pageHeight ? pageHeight / rawHeightMm : 1;
          const fittedWidthMm = pdfWidth * scaleFactor;
          const fittedHeightMm = Math.min(pageHeight, rawHeightMm * scaleFactor);
          const offsetXMm = Math.max(0, (pdfWidth - fittedWidthMm) / 2);
          generatedPdf.addImage(
            pCanvas.toDataURL('image/png'),
            'PNG',
            offsetXMm,
            0,
            fittedWidthMm,
            fittedHeightMm,
            undefined,
            'FAST'
          );
        }
      } else {
        const { canvas, textEntries } = await renderCleanA4Canvas(element, 2.8);
        generatedPdf = buildProportionalA4PdfFromCanvas(canvas, {
          autoFitOnePage: true,
          category,
          gulfCvData,
          textEntries,
        });
      }

      if (navigator.share && navigator.canShare && !targetPhone) {
        const pdfBlob = generatedPdf.output('blob');
        const file = new File([pdfBlob], safeFileName, {
          type: 'application/pdf',
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: filenameBase,
            text: 'പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk) വഴി തയ്യാറാക്കിയ A4 PDF ഡോക്യുമെന്റ്.',
            files: [file],
          });
          return;
        }
      }

      // Desktop or direct-number share fallback: automatically save the PDF file so the user has the exact PDF ready to attach in WhatsApp!
      generatedPdf.save(safeFileName);
    } catch {
      // Fallback to WhatsApp text share below
    }
  }

  let formattedText = '';
  if (category === 'malayalam_letter') {
    if (letterData.letterLayoutVariant === 'school_speech') {
      formattedText = `*${letterData.documentHeading}*\n*വിഷയം:* ${letterData.subject}\n\n${letterData.salutation}\n\n${letterData.bodyParagraphs.join(
        '\n\n'
      )}\n\nതയ്യാറാക്കിയത്: ${letterData.senderName}`;
    } else if (letterData.letterLayoutVariant === 'project_cover') {
      formattedText = `*${letterData.documentHeading}*\n*സ്കൂൾ:* ${letterData.recipientOffice}\n*വിഷയം / പ്രോജക്റ്റ്:* ${letterData.subject}\n\n*സമർപ്പിക്കുന്നത്:* ${letterData.senderName} (${letterData.senderAddress})\n*സ്വീകരിക്കുന്നത്:* ${letterData.recipientTitle}\nതീയതി: ${letterData.date}`;
    } else {
      formattedText = `*${letterData.documentHeading}*\n\n*സമർപ്പിക്കുന്നത്:*\n${letterData.senderName}\n${letterData.senderAddress}${
        letterData.senderPhone ? `\nഫോൺ: ${letterData.senderPhone}` : ''
      }\n\n*സ്വീകർത്താവ്:*\n${letterData.recipientTitle}\n${letterData.recipientOffice}\n${letterData.recipientPlace}\n\n*വിഷയം:* ${letterData.subject}\n\n${letterData.salutation}\n\n${letterData.bodyParagraphs.join(
        '\n\n'
      )}\n\nസ്ഥലം: ${letterData.place}\nതീയതി: ${letterData.date}\n\n${letterData.closingPhrase}\n${
        letterData.senderName
      }`;
    }
  } else if (category === 'gulf_cv') {
    const skillsBlock =
      gulfCvData.coreSkills && gulfCvData.coreSkills.length > 0
        ? `\n\n*Core Skills:*\n${gulfCvData.coreSkills.map((s) => `• ${s}`).join('\n')}`
        : '';
    const expBlock =
      gulfCvData.workExperience && gulfCvData.workExperience.length > 0
        ? `\n\n*Work Experience:*\n${gulfCvData.workExperience
            .map((w) => `• ${w.role} — ${w.company} (${w.duration})`)
            .join('\n')}`
        : '';
    formattedText = `*GULF BIO-DATA / CV*\n*Name:* ${gulfCvData.fullName}\n*Role:* ${gulfCvData.jobTitle}\n*Location:* ${gulfCvData.currentLocation}\n*Phone:* ${gulfCvData.phone}\n*Visa Status:* ${gulfCvData.visaStatus}\n*License:* ${gulfCvData.drivingLicense}\n\n*Summary:*\n${gulfCvData.professionalSummary}${skillsBlock}${expBlock}`;
  } else if (category === 'teacher_marklist' && markListData) {
    const isGradeOnly = markListData.evaluationMode === 'lp_up_grade_only';
    const rows = markListData.students
      .map((st) => {
        const stats = computeStudentStats(
          st.marks,
          markListData.subjects.length,
          markListData.maxMarksPerSubject,
          st.subjectGrades,
          markListData.evaluationMode
        );
        if (isGradeOnly) {
          return `${st.rollNo}. ${st.studentName} — ഗ്രേഡ്: ${st.overallGradeOverride || stats.grade}${
            st.remarks ? ` (${st.remarks})` : ''
          }`;
        }
        return `${st.rollNo}. ${st.studentName} — ആകെ: ${stats.total}/${stats.maxTotal} (${stats.percentage}%) | ഗ്രേഡ്: ${stats.grade}`;
      })
      .join('\n');
    formattedText = `*${markListData.schoolName}*\n*${markListData.examTitle}*\n${markListData.classAndDivision} (${markListData.academicYear})\n\n${rows}\n\n${markListData.classTeacherName}`;
  } else {
    formattedText = `*${agreementData.titleMalayalam}*\nതീയതി: ${agreementData.executionDate}\nസ്ഥലം: ${agreementData.executionPlace}\n\n*${agreementData.firstPartyLabel}:*\n${agreementData.firstPartyDetails}\n\n*${agreementData.secondPartyLabel}:*\n${agreementData.secondPartyDetails}\n\n${agreementData.preambleParagraph}\n\n${agreementData.clauses.join(
      '\n\n'
    )}`;
  }

  if (generatedPdf) {
    formattedText = `📄 *[PDF ഫയൽ (${safeFileName}) ഡൗൺലോഡ് ചെയ്തിട്ടുണ്ട് — ദയവായി ഈ ചാറ്റിൽ Attach ചെയ്യുക]*\n\n${formattedText}`;
  }

  const cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedText.normalize('NFC'))}`
    : `https://wa.me/?text=${encodeURIComponent(formattedText.normalize('NFC'))}`;

  const anchor = document.createElement('a');
  anchor.href = waUrl;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Plays a gentle two-tone celebration chime when an A4 paper is generated
 */
export function playDocumentReadyChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playNote = (freq: number, startOffset: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + startOffset);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startOffset);
      osc.stop(ctx.currentTime + startOffset + duration);
    };

    playNote(587.33, 0, 0.18); // D5
    playNote(880, 0.14, 0.32); // A5
  } catch {
    // Ignore audio context restriction errors
  }
}

let activeTtsAudioElement: HTMLAudioElement | null = null;

/**
 * Reads the prepared document aloud in Malayalam using Gemini TTS (/api/tts-readback)
 * with instant fallback to browser SpeechSynthesis (ml-IN / en-IN)
 */
export async function speakDocumentInMalayalam(
  category: DocumentCategory,
  letterData: MalayalamLetterData,
  gulfCvData: GulfCvData,
  agreementData: RentalAgreementData,
  markListData: TeacherMarkListData,
  onEnd?: () => void
): Promise<void> {
  stopSpeakingMalayalam();

  let speechText = '';
  if (category === 'malayalam_letter') {
    if (letterData.letterLayoutVariant === 'school_leave') {
      speechText = `ദാ, നിങ്ങളുടെ സ്കൂൾ അവധി അപേക്ഷ തയ്യാറാണ്. താഴെ അച്ഛന്റെയോ അമ്മയുടെയോ ഒപ്പ് വാങ്ങാൻ സ്ഥലം ഇട്ടിട്ടുണ്ട്. കത്തിലെ വിവരങ്ങൾ കേൾക്കാം: സ്വീകർത്താവ്, ${letterData.recipientTitle} ${letterData.recipientOffice}. വിഷയം: ${letterData.subject}. ${letterData.salutation} ${letterData.bodyParagraphs.join(' ')}`;
    } else if (letterData.letterLayoutVariant === 'school_speech') {
      speechText = `നിങ്ങളുടെ സ്കൂൾ പ്രസംഗം തയ്യാറായിട്ടുണ്ട്. വിഷയം: ${letterData.subject}. പ്രസംഗം തുടങ്ങുന്നു: ${letterData.salutation} ${letterData.bodyParagraphs.join(' ')}`;
    } else if (letterData.letterLayoutVariant === 'project_cover') {
      speechText = `നിങ്ങളുടെ സ്കൂൾ പ്രോജക്റ്റ് കവർ പേജ് മനോഹരമായ ബോർഡറോടെ തയ്യാറായിട്ടുണ്ട്. പ്രോജക്റ്റ് വിഷയം: ${letterData.subject}. സമർപ്പിക്കുന്നത്: ${letterData.senderName}.`;
    } else {
      speechText = `നിങ്ങളുടെ ${letterData.documentHeading} തയ്യാറായിട്ടുണ്ട്. സമർപ്പിക്കുന്നത്: ${letterData.senderName}, ${letterData.senderAddress}. സ്വീകർത്താവ്: ${letterData.recipientTitle} ${letterData.recipientOffice}. വിഷയം: ${letterData.subject}. ${letterData.salutation} ${letterData.bodyParagraphs.join(' ')} വിശ്വസ്തതയോടെ, ${letterData.senderName}.`;
    }
  } else if (category === 'gulf_cv') {
    speechText = `നിങ്ങളുടെ ഗൾഫ് ബയോഡാറ്റ ഇംഗ്ലീഷിൽ തയ്യാറായിട്ടുണ്ട്. Name: ${gulfCvData.fullName}. Job Role: ${gulfCvData.jobTitle}. Visa Status: ${gulfCvData.visaStatus}. ${gulfCvData.professionalSummary}`;
  } else if (category === 'rental_agreement') {
    speechText = `നിങ്ങളുടെ ${agreementData.titleMalayalam} തയ്യാറായിട്ടുണ്ട്. ഒന്നാം കക്ഷി: ${agreementData.firstPartyDetails}. രണ്ടാം കക്ഷി: ${agreementData.secondPartyDetails}. ${agreementData.preambleParagraph} ${agreementData.clauses.slice(0, 2).join(' ')}`;
  } else {
    speechText = `${markListData.schoolName}, ${markListData.examTitle}, ${markListData.classAndDivision} മാർക്ക് ലിസ്റ്റ് പട്ടിക തയ്യാറായിട്ടുണ്ട്.`;
  }

  const normalizedSpeech = speechText.normalize('NFC');

  // 1. Try Server-Side Gemini 3.8 Flash Lite TTS first
  try {
    const response = await fetch('/api/tts-readback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: normalizedSpeech,
        voiceName: 'Kore',
      }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.audioBase64 && !data.fallbackToBrowserTts) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
        activeTtsAudioElement = audio;
        audio.onended = () => {
          activeTtsAudioElement = null;
          onEnd?.();
        };
        audio.onerror = () => {
          activeTtsAudioElement = null;
          onEnd?.();
        };
        await audio.play();
        return;
      }
    }
  } catch {
    // Fall through to Web Speech Synthesis below
  }

  // 2. Instant Client-Side Web Speech Synthesis Fallback (ml-IN / en-IN)
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(normalizedSpeech);
  utterance.lang = category === 'gulf_cv' ? 'en-IN' : 'ml-IN';
  utterance.rate = 0.94;

  const voices = window.speechSynthesis.getVoices();
  const mlVoice =
    voices.find((v) => v.lang.toLowerCase().includes('ml')) ||
    voices.find((v) => v.name.toLowerCase().includes('malayalam')) ||
    voices.find((v) => v.lang.toLowerCase().includes('in'));
  if (mlVoice && category !== 'gulf_cv') {
    utterance.voice = mlVoice;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export function stopSpeakingMalayalam(): void {
  if (activeTtsAudioElement) {
    try {
      activeTtsAudioElement.pause();
      activeTtsAudioElement.currentTime = 0;
    } catch {
      // Ignore
    }
    activeTtsAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

