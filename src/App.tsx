import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  Eraser,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  HelpCircle,
  Loader2,
  Maximize2,
  MessageSquare,
  Mic,
  Paperclip,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShoppingCart,
  Sliders,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Truck,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CartDocumentItem,
  ChatMessage,
  CompletedTransaction,
  DocumentCategory,
  DocumentOutputLanguage,
  FollowUpQuestion,
  getMissingDocumentFields,
  isPlaceholderOrEmpty,
  GulfCvData,
  INITIAL_AGREEMENT_DATA,
  INITIAL_GULF_CV_DATA,
  INITIAL_LETTER_DATA,
  INITIAL_MARKLIST_DATA,
  MalayalamLetterData,
  MARKLIST_PRESET_MODELS,
  MissingFieldItem,
  OwnerBusinessConfig,
  QUICK_TEMPLATES,
  QuickTemplateItem,
  RentalAgreementData,
  TeacherMarkListData,
  TemplateSubGroup,
  DocumentAuditIssue,
  DocumentAuditSection,
  auditDocumentReadiness,
  buildEditableQuestionsForDocument,
  buildEditableQuestionsForLetter,
  mergeCvWithPreset,
  mergeLetterWithExisting,
  parseInstantMarkListCommandOrNames,
  sanitizeAgreementData,
} from './types/documents';
import {
  convertGovFormToLetterData,
  GOV_FORM_CATEGORIES,
  GovFormCategoryKey,
  GovFormTemplate,
  KERALA_GOV_FORMS_MASTER,
  matchesGovFormSearch,
  matchGovFormFromPrompt,
} from './data/keralaGovForms';
import { useMalayalamVoice, RecordedAudioPayload } from './hooks/useMalayalamVoice';
import { usePWAInstall } from './hooks/usePWAInstall';
import { A4DocumentSheet, SheetCustomOverlayItem } from './components/A4DocumentSheet';
import { UpiPaymentModal } from './components/UpiPaymentModal';
import { OwnerSettingsModal } from './components/OwnerSettingsModal';
import { WhatsAppBotPanel } from './components/WhatsAppBotPanel';
import { PWAInstallButton } from './components/PWAInstallButton';
import { DirectPdfEditor } from './components/DirectPdfEditor';
import { FeedbackModal } from './components/FeedbackModal';
import { UserGuideModal } from './components/UserGuideModal';
import { ThreeDServiceCarousel } from './components/ThreeDServiceCarousel';
import { PrintCartAndDeliveryModal } from './components/PrintCartAndDeliveryModal';
import { FreemiumSampleLibraryAndGeoSection } from './components/FreemiumSampleLibraryAndGeoSection';
import { AtsResumeTailorModal } from './components/AtsResumeTailorModal';
import {
  extractReadableTextFromPdfBuffer,
  generateAndDownloadA4Pdf,
  playDocumentReadyChime,
  shareDocumentOnWhatsApp,
  speakDocumentInMalayalam,
  stopSpeakingMalayalam,
} from './utils/pdfExport';
import { parseStructuredCvFromText } from './utils/cvParser';
import {
  applyLocalLanguageConversionToCv,
  applyLocalLanguageConversionToLetter,
  detectRequestedOutputLanguage,
  normalizeSpokenMalayalamTranscript,
  OUTPUT_LANGUAGE_OPTIONS,
  translateActiveDocumentViaServer,
} from './utils/languageTranslator';

const STORAGE_CONFIG_KEY = 'parayam_owner_config_v8';
const STORAGE_TX_KEY = 'parayam_transactions_v3';
const STORAGE_CART_KEY = 'parayam_print_cart_v1';

const DEFAULT_OWNER_CONFIG: OwnerBusinessConfig = {
  shopName: 'പൂരിപ്പിക്കൽ അപേക്ഷ ഡെസ്ക് | പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Poorippikkal Apekshadesk)',
  centerTagline:
    'മലയാളം അപേക്ഷകൾ, ഫോമുകൾ, വാടക കരാർ, ഗൾഫ് CV & മാർക്ക് ലിസ്റ്റ് — ഫോണിൽ പറയാം, 10 സെക്കൻഡിൽ തയ്യാറാക്കാം.',
  ownerName: 'Apeksha Desk Online Service',
  location: 'കേരളം (Online Application & PDF Desk)',
  centerPhone: '+91 98470 00000',
  whatsappNumber: '+91 98470 00000',
  email: 'service.kerala@email.com',
  workingHours: '24×7 ഓൺലൈൻ അപേക്ഷാ ഡെസ്ക്',
  upiId: 'thajudheenabdulrehman@oksbi',
  akshayaPin: '',
  freeModeEnabled: true,
  cartFeatureEnabled: true,
  homePrinterBusinessModeEnabled: false,
  defaultOutputLanguage: 'ml',
  pricing: {
    malayalam_letter: 5,
    gulf_cv: 5,
    rental_agreement: 5,
    teacher_marklist: 5,
    pdf_edit: 5,
  },
  whatsappWebhookToken: 'parayam_print_verify_2026',
};

const TEMPLATE_SUBGROUPS: TemplateSubGroup[] = [
  'എല്ലാം (All)',
  'സ്കൂൾ & കുട്ടികൾ (School)',
  'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
  'അക്ഷയ & വില്ലേജ് ഓഫീസ്',
  'പഞ്ചായത്ത് & KSEB & റേഷൻ',
  'രാജിക്കത്ത് & സ്ഥാപനം',
  'പോലീസ് & ബാങ്ക് & RTO',
  'പ്രവാസി ഗൾഫ് CV',
  'വാടക കരാർ & സത്യവാങ്മൂലം',
  'ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ്',
];

export function App() {
  // Primary Mode: 'whatsapp_bot' (Direct Voice Note / File Upload / Chat) vs 'voice_studio' (Form Studio)
  const [workspaceMode, setWorkspaceMode] = useState<'whatsapp_bot' | 'voice_studio'>(
    'whatsapp_bot'
  );
  // Mobile responsive view tab ('input' vs 'preview')
  const [mobileViewTab, setMobileViewTab] = useState<'input' | 'preview'>('input');

  // Active Document Category & State (Supports Google Search deep links via ?service=...)
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>(() => {
    if (typeof window === 'undefined') return 'malayalam_letter';
    const service = new URLSearchParams(window.location.search).get('service') || '';
    if (service.includes('rental-agreement')) return 'rental_agreement';
    if (service.includes('mark-list')) return 'teacher_marklist';
    if (service.includes('gulf-cv') || service.includes('biodata')) return 'gulf_cv';
    return 'malayalam_letter';
  });
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<TemplateSubGroup>(() => {
    if (typeof window === 'undefined') return 'എല്ലാം (All)';
    const service = new URLSearchParams(window.location.search).get('service') || '';
    if (service.includes('village-office')) return 'അക്ഷയ & വില്ലേജ് ഓഫീസ്';
    if (service.includes('panchayat')) return 'പഞ്ചായത്ത് & KSEB & റേഷൻ';
    if (service.includes('rental-agreement')) return 'വാടക കരാർ & സത്യവാങ്മൂലം';
    if (service.includes('mark-list')) return 'ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ്';
    if (service.includes('gulf-cv') || service.includes('biodata')) return 'പ്രവാസി ഗൾഫ് CV';
    if (service.includes('resignation')) return 'രാജിക്കത്ത് & സ്ഥാപനം';
    return 'എല്ലാം (All)';
  });

  const [letterData, setLetterData] = useState<MalayalamLetterData>(INITIAL_LETTER_DATA);
  const [gulfCvData, setGulfCvData] = useState<GulfCvData>(INITIAL_GULF_CV_DATA);
  const [agreementData, setAgreementData] = useState<RentalAgreementData>(
    INITIAL_AGREEMENT_DATA
  );
  const [markListData, setMarkListData] = useState<TeacherMarkListData>(INITIAL_MARKLIST_DATA);

  // Universal In-Place PDF Touch-Edit Tools State (Default showTouchBorders = false so it looks like a real PDF!)
  const [sheetTool, setSheetTool] = useState<'select_edit' | 'add_text' | 'whiteout'>(
    'select_edit'
  );
  const [showTouchBorders, setShowTouchBorders] = useState<boolean>(false);
  const [sheetOverlayItems, setSheetOverlayItems] = useState<SheetCustomOverlayItem[]>([]);
  const [showFindReplaceBar, setShowFindReplaceBar] = useState<boolean>(false);
  const [showMobilePreviewTools, setShowMobilePreviewTools] = useState<boolean>(false);
  const [isMicHelpModalOpen, setIsMicHelpModalOpen] = useState<boolean>(false);

  // Printout Output Language State (Default: 'ml' - മലയാളം, automatically switches to 'en' when gulf_cv is selected)
  const [outputLanguage, setOutputLanguage] = useState<DocumentOutputLanguage>('ml');
  const [isTranslatingLanguage, setIsTranslatingLanguage] = useState<boolean>(false);

  // Screen-Aligned Interactive Zoomable A4 PDF Viewer State
  const pdfViewportRef = useRef<HTMLDivElement | null>(null);
  const whatsappSectionRef = useRef<HTMLDivElement | null>(null);
  const a4PreviewSectionRef = useRef<HTMLDivElement | null>(null);
  const [pdfZoomMode, setPdfZoomMode] = useState<'fit' | number>('fit');
  const [fitScale, setFitScale] = useState<number>(1);
  const [measuredSheetHeight, setMeasuredSheetHeight] = useState<number>(1123);

  // Top Unified Search & Quick Examples Browser State
  const [topUnifiedSearch, setTopUnifiedSearch] = useState<string>('');
  const [showTopExamplesDrawer, setShowTopExamplesDrawer] = useState<boolean>(false);
  const [topFilterGroup, setTopFilterGroup] = useState<string>('all');
  const [showAllFormsCatalog, setShowAllFormsCatalog] = useState<boolean>(false);

  // Voice & Prompt Input State
  const [voicePromptText, setVoicePromptText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [assistantBannerMessage, setAssistantBannerMessage] = useState<string>(
    '🎙️ പറയുക · ⌨️ ടൈപ്പ് ചെയ്യുക · 📎 ഫയൽ ഇടുക'
  );
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>(() =>
    buildEditableQuestionsForLetter(INITIAL_LETTER_DATA)
  );
  const [followUpAnswerInputs, setFollowUpAnswerInputs] = useState<Record<string, string>>({});

  // WhatsApp Conversational History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-bot-1',
      sender: 'bot',
      text: '🙏 3 സ്റ്റെപ്പിൽ പേപ്പർ റെഡി:\n① 🎙️ മൈക്കിൽ പറയുക (അല്ലെങ്കിൽ താഴെ പൂരിപ്പിക്കുക)\n② ✏️ പേപ്പറിൽ തൊട്ട് തിരുത്തുക\n③ ⬇ PDF ഡൗൺലോഡ് ചെയ്യുക',
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      documentCategory: 'malayalam_letter',
      followUpQuestions: buildEditableQuestionsForLetter(INITIAL_LETTER_DATA),
      isComplete: true,
    },
  ]);

  // A4 Sheet Controls & Payment Unlock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [autoFitOnePage, setAutoFitOnePage] = useState<boolean>(true);
  const [isPdfEditSession, setIsPdfEditSession] = useState<boolean>(false);
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [showDirectPdfCanvas, setShowDirectPdfCanvas] = useState<boolean>(false);
  const [uploadedPdfFileName, setUploadedPdfFileName] = useState<string>('');
  const pdfExtractedFallbackRef = useRef<{
    letterData?: MalayalamLetterData;
    gulfCvData?: GulfCvData;
  } | null>(null);
  const appDirectAudioCaptureRef = useRef<HTMLInputElement | null>(null);
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [fontSizeScale, setFontSizeScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Modals & Share Popover
  const { isInstallable, install: triggerPwaInstall } = usePWAInstall();
  const [isPwaInstallModalOpen, setIsPwaInstallModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [customPaymentAmountOverride, setCustomPaymentAmountOverride] = useState<number | null>(
    null
  );
  const [isBatchCartPaymentFlow, setIsBatchCartPaymentFlow] = useState<boolean>(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);
  const [cartModalInitialTab, setCartModalInitialTab] = useState<
    'cart' | 'home_delivery' | 'partner_hub'
  >('cart');
  const [cartItems, setCartItems] = useState<CartDocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CART_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read error
    }
    return [];
  });
  const [isMissingFieldsModalOpen, setIsMissingFieldsModalOpen] = useState<boolean>(false);
  const [isAutoFillCvModalOpen, setIsAutoFillCvModalOpen] = useState<boolean>(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [isUserGuideModalOpen, setIsUserGuideModalOpen] = useState<boolean>(false);
  const [isCvReviewBannerOpen, setIsCvReviewBannerOpen] = useState<boolean>(false);
  const [isTopShareMenuOpen, setIsTopShareMenuOpen] = useState<boolean>(false);
  const [copiedTopLink, setCopiedTopLink] = useState<boolean>(false);
  const [isSuperpowerLoading, setIsSuperpowerLoading] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota warning
    }
  }, [cartItems]);

  const handlePwaInstallClick = async () => {
    if (isInstallable) {
      try {
        const res = await triggerPwaInstall();
        if (res) {
          showToast('✓ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു!');
          return;
        }
      } catch {
        // Fall back to guide modal
      }
    }
    setIsPwaInstallModalOpen(true);
  };

  const handleRunAiSuperpower = async (
    action: 'polish_official_malayalam' | 'expand_reason_paragraphs' | 'ats_boost_gulf_cv' | 'grammar_spell_fix'
  ) => {
    if (isSuperpowerLoading) return;
    setIsSuperpowerLoading(action);
    try {
      const response = await fetch('/api/hf-superpower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          category: activeCategory,
          outputLanguage,
          letterData,
          gulfCvData,
          agreementData,
        }),
      });
      const data = await response.json();
      if (data?.letterData && activeCategory === 'malayalam_letter') {
        setLetterData((prev) => mergeLetterWithExisting(data.letterData, prev));
      }
      if (data?.gulfCvData && activeCategory === 'gulf_cv') {
        setGulfCvData((prev) => mergeCvWithPreset(data.gulfCvData, prev));
      }
      if (data?.agreementData && activeCategory === 'rental_agreement') {
        setAgreementData((prev) => sanitizeAgreementData(data.agreementData, prev));
      }
      playDocumentReadyChime();
      showToast(data?.toastMalayalam || '⚡ എഐ സൂപ്പർ-പവർ വഴി പേപ്പർ കൂടുതൽ മികച്ചതാക്കി!');
    } catch {
      showToast('എഐ സൂപ്പർ-പവർ പ്രവർത്തിക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    } finally {
      setIsSuperpowerLoading('');
    }
  };

  const copyWebsiteLinkReliably = () => {
    const shareUrl = window.location.origin;
    try {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      // ignore fallback error
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedTopLink(true);
    setTimeout(() => setCopiedTopLink(false), 2500);
    showToast('✓ വെബ്സൈറ്റ് ലിങ്ക് കോപ്പി ആയി! വാട്സാപ്പിൽ ആർക്കും അയക്കാം.');
  };
  const [autoFillCvText, setAutoFillCvText] = useState<string>(
    `MUHAMMED SHAFEEK K.\n\nKozhikode, Kerala | +91 98470 12345 | shafeek.k@email.com\n\nProfessional Summary\n\nDedicated and safety-conscious Electrical Supervisor & HVAC Technician with 6+ years of GCC and India experience in commercial building maintenance, MEP installation, and troubleshooting.\n\nSkills\n\n. MEP & Electrical Maintenance\n. HVAC Chiller & Split AC Servicing\n. AutoCAD Electrical Drawing Reading\n. Gulf Safety & DEWA Compliance\n\nWork History\n\nSenior Electrical & MEP Technician\nAl-Futtaim Engineering - Dubai, UAE\n04/2021 to Current\n. Supervised daily preventive and corrective maintenance of LV switchgears, distribution boards, and HVAC units\n. Conducted safety inspections and resolved electrical faults across commercial towers\n\nElectrical Technician\nAster MIMS Hospital - Kozhikode, Kerala\n06/2018 to 02/2021\n. Maintained backup generators, UPS systems, and hospital electrical panels\n. Coordinated with biomedical and facility teams for 24/7 uninterrupted power supply\n\nEducation\n\nDiploma in Electrical & Electronics Engineering\nGovernment Polytechnic College - Kozhikode, Kerala\n2018`
  );

  const handleExecuteAutoFillCv = async () => {
    if (!autoFillCvText.trim()) {
      showToast('ദയവായി സിവി അല്ലെങ്കിൽ റെസ്യൂമെ ടെക്സ്റ്റ് ഇവിടെ നൽകുക.');
      return;
    }
    setIsGenerating(true);
    try {
      // 1. Instant deterministic client-side CV extraction (Always English for Gulf CV)
      const localParsed = parseStructuredCvFromText(autoFillCvText, INITIAL_GULF_CV_DATA);
      if (localParsed.gulfCvData) {
        const cvTargetLang: DocumentOutputLanguage =
          outputLanguage === 'ml' ? 'en' : outputLanguage;
        setOutputLanguage(cvTargetLang);
        setAutoFitOnePage(true);
        const localLangCv = applyLocalLanguageConversionToCv(
          {
            ...localParsed.gulfCvData,
            photoDataUrl: gulfCvData.photoDataUrl || '',
          },
          cvTargetLang
        );
        setGulfCvData(localLangCv);
        setActiveCategory('gulf_cv');
        setIsAutoFillCvModalOpen(false);
        setIsEditMode(true);
        setPdfZoomMode('fit');
        setMobileViewTab('preview');

        // Also run server translation to ensure every sentence/location matches cvTargetLang
        translateActiveDocumentViaServer({
          category: 'gulf_cv',
          targetLanguage: cvTargetLang,
          letterData,
          gulfCvData: localLangCv,
          agreementData,
          markListData,
        })
          .then((trData) => {
            if (trData.gulfCvData) {
              setGulfCvData((prev) => ({
                ...trData.gulfCvData!,
                photoDataUrl: prev.photoDataUrl || '',
              }));
            }
          })
          .catch(() => {});

        const nowTime = new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setChatMessages((prev) => [
          ...prev,
          {
            id: `user-autofill-${Date.now()}`,
            sender: 'user',
            text: `📋 സിവി ഓട്ടോ-ഫിൽ ടെക്സ്റ്റ് പേസ്റ്റ് ചെയ്തു (${localLangCv.fullName})`,
            timestamp: nowTime,
          },
          {
            id: `bot-autofill-${Date.now() + 1}`,
            sender: 'bot',
            text: `✨ "${localLangCv.fullName}" എന്ന പേരിലുള്ള സിവിയിലെ മുഴുവൻ വിവരങ്ങളും തിരഞ്ഞെടുത്ത പ്രിന്റ് ഭാഷയിലേക്ക് മാറ്റി A4 പിഡിഎഫ് ഷീറ്റിൽ ക്രമീകരിച്ചിട്ടുണ്ട്!\n\nവലതുവശത്തെ പിഡിഎഫ് സൂം ചെയ്ത് (Zoom +) ഏത് പേരിലും എഴുത്തിലും നേരിട്ട് തൊട്ട് സെലക്ട് ചെയ്ത് തിരുത്താം.`,
            timestamp: nowTime,
            documentCategory: 'gulf_cv',
            isComplete: true,
          },
        ]);
        playDocumentReadyChime();
        showToast(
          `✓ "${localLangCv.fullName}" A4 PDF റെഡി! സൂം ചെയ്ത് ഏത് എഴുത്തും നേരിട്ട് സെലക്ട് ചെയ്ത് തിരുത്താം.`
        );
        return;
      }

      // 2. Fallback server-side extraction for short/unstructured text
      const res = await fetch('/api/process-attachment-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'pasted_cv_resume.txt',
          mimeType: 'text/plain',
          extractedText: autoFillCvText,
          isFullPdfEdit: false,
          preferredCategory: 'gulf_cv',
          currentDocument: { letterData, gulfCvData, agreementData, markListData },
          conversationHistory: [],
        }),
      });
      const data = await res.json();
      if (data.gulfCvData) {
        setGulfCvData(data.gulfCvData);
      }
      setActiveCategory('gulf_cv');
      setIsAutoFillCvModalOpen(false);
      setIsCvReviewBannerOpen(true);
      setIsEditMode(true);
      setMobileViewTab('preview');
      showToast('✓ സിവി വിവരങ്ങൾ ഗൾഫ് സിവി മോഡലിലേക്ക് കൃത്യമായി അലൈൻ ചെയ്തു! ഇപ്പോൾ പരിശോധിക്കാം / എഡിറ്റ് ചെയ്യാം.');
    } catch {
      showToast('സിവി ഓട്ടോ-ഫിൽ ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു.');
    } finally {
      setIsGenerating(false);
    }
  };

  const [pendingActionAfterPay, setPendingActionAfterPay] = useState<
    'download' | 'download_ats' | 'print' | 'whatsapp'
  >('download');
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);
  // Dedicated Separate Admin Backend Portal vs Clean Customer Frontend Website
  const [isAdminBackendRoute, setIsAdminBackendRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      window.location.pathname.endsWith('/admin') ||
      window.location.hash === '#admin' ||
      params.get('admin') === '1'
    );
  });

  // Persisted Owner Config & Transactions
  const [ownerConfig, setOwnerConfig] = useState<OwnerBusinessConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (!saved) return DEFAULT_OWNER_CONFIG;
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_OWNER_CONFIG,
        ...parsed,
        pricing: {
          ...DEFAULT_OWNER_CONFIG.pricing,
          ...(parsed.pricing || {}),
        },
      };
    } catch {
      return DEFAULT_OWNER_CONFIG;
    }
  });

  const [transactions, setTransactions] = useState<CompletedTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TX_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const sheetRef = useRef<HTMLDivElement | null>(null);
  const cvPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const studioUniversalInputRef = useRef<HTMLInputElement | null>(null);
  const pdfEditUploadInputRef = useRef<HTMLInputElement | null>(null);
  const customPostPayCallbackRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(ownerConfig));
    } catch {
      // Ignore storage errors
    }
  }, [ownerConfig]);

  // Load Server-Persisted Owner Config on Initial Mount (URL query overrides disabled for security)
  useEffect(() => {
    const syncRemoteConfig = async () => {
      try {
        const res = await fetch('/api/owner-config');
        if (res.ok) {
          const data = await res.json();
          if (data?.config && typeof data.config === 'object') {
            setOwnerConfig((prev) => ({
              ...prev,
              ...data.config,
              pricing: {
                ...prev.pricing,
                ...(data.config.pricing || {}),
              },
            }));
          }
        }
      } catch {
        // Offline or static host fallback
      }
    };

    syncRemoteConfig();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TX_KEY, JSON.stringify(transactions));
    } catch {
      // Ignore storage errors
    }
  }, [transactions]);

  // Sync default output language from ownerConfig on initial load
  useEffect(() => {
    if (ownerConfig.defaultOutputLanguage) {
      setOutputLanguage(ownerConfig.defaultOutputLanguage);
    }
  }, [ownerConfig.defaultOutputLanguage]);

  // Automatically switch outputLanguage to 'en' whenever category changes to 'gulf_cv',
  // and back to 'ml' when switching to Malayalam official letters, agreements, or mark lists.
  const prevCategoryRef = useRef<DocumentCategory>(activeCategory);
  useEffect(() => {
    if (prevCategoryRef.current !== activeCategory) {
      prevCategoryRef.current = activeCategory;
      if (activeCategory === 'gulf_cv') {
        setOutputLanguage('en');
        setAutoFitOnePage(true);
        setGulfCvData((prev) => applyLocalLanguageConversionToCv(prev, 'en'));
      } else {
        setOutputLanguage('ml');
      }
    }
  }, [activeCategory]);

  // Subtle, smooth circular ripple animation on click for all .btn-round-3d activity buttons
  useEffect(() => {
    const handleRound3dRipple = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest('.btn-round-3d') as HTMLElement | null;
      if (!btn || (btn as HTMLButtonElement).disabled) return;

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height, 36);
      const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-wave-circle';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      btn.appendChild(ripple);
      const cleanup = () => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      };
      ripple.addEventListener('animationend', cleanup, { once: true });
      window.setTimeout(cleanup, 600);
    };

    document.addEventListener('pointerdown', handleRound3dRipple, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handleRound3dRipple);
    };
  }, []);

  // Measure PDF viewport width & A4 sheet height so the 794px A4 PDF always fits cleanly aligned on screen
  useEffect(() => {
    const updatePdfFitScale = () => {
      const container = pdfViewportRef.current;
      const availWidth = container
        ? Math.max(280, container.clientWidth - 20)
        : Math.max(280, window.innerWidth - 32);
      const computedScale = Math.min(1, Math.max(0.36, Number((availWidth / 794).toFixed(3))));
      setFitScale(computedScale);

      if (sheetRef.current) {
        setMeasuredSheetHeight(
          Math.max(1123, sheetRef.current.scrollHeight, sheetRef.current.offsetHeight)
        );
      }
    };

    updatePdfFitScale();
    window.addEventListener('resize', updatePdfFitScale);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updatePdfFitScale);
      if (pdfViewportRef.current) ro.observe(pdfViewportRef.current);
      if (sheetRef.current) ro.observe(sheetRef.current);
    }

    return () => {
      window.removeEventListener('resize', updatePdfFitScale);
      if (ro) ro.disconnect();
    };
  }, [mobileViewTab, activeCategory, letterData, gulfCvData, agreementData, markListData]);

  const activePdfScale = pdfZoomMode === 'fit' ? fitScale : pdfZoomMode;

  const handleZoomInPdf = () => {
    const current = Number(activePdfScale.toFixed(2));
    const next = Math.min(1.75, Number((current + 0.2).toFixed(2)));
    setPdfZoomMode(next);
  };

  const handleZoomOutPdf = () => {
    const current = Number(activePdfScale.toFixed(2));
    const next = Math.max(0.4, Number((current - 0.2).toFixed(2)));
    setPdfZoomMode(next);
  };

  // Switch Printout Output Language & immediately convert active A4 document
  const handleSelectOutputLanguage = async (newLang: DocumentOutputLanguage) => {
    const sourceCv = gulfCvData;
    const sourceLetter = letterData;
    setOutputLanguage(newLang);

    // 1. Instant local dictionary & semantic conversion (0ms, works 100% offline/client-side)
    const nextCv = applyLocalLanguageConversionToCv(sourceCv, newLang);
    const nextLetter = applyLocalLanguageConversionToLetter(sourceLetter, newLang);
    setGulfCvData(nextCv);
    setLetterData(nextLetter);

    const langObj = OUTPUT_LANGUAGE_OPTIONS.find((o) => o.code === newLang);
    showToast(`🌐 പ്രിന്റ് ഭാഷ "${langObj?.nativeLabel || newLang}" ആയി മാറ്റി — A4 PDF വിവർത്തനം ചെയ്യുന്നു...`);

    // 2. Full server-side translation for all sentences, skills, locations, and names (with seamless local fallback)
    setIsTranslatingLanguage(true);
    try {
      const trData = await translateActiveDocumentViaServer({
        category: activeCategory,
        targetLanguage: newLang,
        letterData: sourceLetter,
        gulfCvData: sourceCv,
        agreementData,
        markListData,
      });
      if (trData.gulfCvData) {
        setGulfCvData((prev) => ({
          ...trData.gulfCvData!,
          photoDataUrl: prev.photoDataUrl || '',
        }));
      }
      if (trData.letterData) {
        setLetterData(trData.letterData);
      }
      showToast(`✓ A4 PDF പൂർണ്ണമായും "${langObj?.nativeLabel || newLang}" ഭാഷയിലേക്ക് മാറ്റി!`);
    } catch {
      // Local dictionary & semantic conversion (nextCv / nextLetter) is already applied above!
      showToast(`✓ A4 PDF "${langObj?.nativeLabel || newLang}" ഭാഷയിലേക്ക് മാറ്റി!`);
    } finally {
      setIsTranslatingLanguage(false);
    }
  };

  // Screen & Navigation Stack for Native Mobile Experience
  const lastMobileBackTapTimeRef = useRef<number>(0);

  // Switch to A4 Preview tab and scroll directly to the PDF location
  const switchToPreview = (pushHistory = true) => {
    setMobileViewTab('preview');
    setTimeout(() => {
      const target = a4PreviewSectionRef.current || pdfViewportRef.current;
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 60);

    if (pushHistory && typeof window !== 'undefined') {
      try {
        if (window.location.hash !== '#preview') {
          window.history.pushState({ screen: 'preview' }, '', '#preview');
        }
      } catch {
        // Ignore iframe policy restrictions
      }
    }
  };

  // Switch back to Input/Voice tab and scroll directly to the WhatsApp / Voice section
  const switchBackToInput = () => {
    setMobileViewTab('input');
    setTimeout(() => {
      const target = whatsappSectionRef.current;
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 60);

    if (typeof window !== 'undefined') {
      try {
        if (window.location.hash === '#preview') {
          if (window.history && window.history.replaceState) {
            window.history.replaceState(
              { screen: 'input' },
              '',
              window.location.pathname + window.location.search
            );
          } else {
            window.location.hash = '';
          }
        }
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
        window.history.replaceState({ screen: 'input', root: true }, '', window.location.href);
      }
    } catch {
      // Ignore
    }

    const handlePopState = () => {
      if (isPaymentModalOpen) {
        setIsPaymentModalOpen(false);
        return;
      }
      if (isOwnerModalOpen) {
        setIsOwnerModalOpen(false);
        return;
      }
      if (isMissingFieldsModalOpen) {
        setIsMissingFieldsModalOpen(false);
        return;
      }
      if (mobileViewTab === 'preview') {
        switchBackToInput();
        return;
      }

      const now = Date.now();
      if (now - lastMobileBackTapTimeRef.current < 2500) {
        // Double-tap allowed exit
      } else {
        lastMobileBackTapTimeRef.current = now;
        showToast('പുറത്തു കടക്കാൻ ഒരിക്കൽ കൂടി ബാക്ക് അമർത്തുക (Double-tap Back to exit)');
        try {
          window.history.pushState(
            { screen: 'input' },
            '',
            window.location.pathname + window.location.search
          );
        } catch {
          // Ignore
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
        else if (isOwnerModalOpen) setIsOwnerModalOpen(false);
        else if (isMissingFieldsModalOpen) setIsMissingFieldsModalOpen(false);
        else if (mobileViewTab === 'preview') switchBackToInput();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaymentModalOpen, isOwnerModalOpen, isMissingFieldsModalOpen, mobileViewTab]);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 4200);
  };

  const handleToggleSpeakDocument = () => {
    if (isSpeaking) {
      stopSpeakingMalayalam();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    speakDocumentInMalayalam(
      activeCategory,
      letterData,
      gulfCvData,
      agreementData,
      markListData,
      () => setIsSpeaking(false)
    );
  };

  // Ensure Gulf CV category always defaults to 100% pure English ('en') if outputLanguage was 'ml'
  useEffect(() => {
    if (activeCategory === 'gulf_cv' && outputLanguage === 'ml') {
      setOutputLanguage('en');
      setGulfCvData((prev) => applyLocalLanguageConversionToCv(prev, 'en'));
    }
  }, [activeCategory, outputLanguage]);

  // Apply AI response data to state
  const applyAiDocumentResult = (data: any) => {
    const isDocUpdated = data.documentUpdated !== false && data.intent !== 'general_question';

    if (isDocUpdated) {
      setShowDirectPdfCanvas(false);
      const nextCat: DocumentCategory = data.detectedType || activeCategory;
      const effectiveLang: DocumentOutputLanguage =
        data.outputLanguage ||
        (nextCat === 'gulf_cv' && outputLanguage === 'ml' ? 'en' : outputLanguage);

      if (effectiveLang !== outputLanguage) {
        setOutputLanguage(effectiveLang);
      }
      if (data.detectedType) {
        setActiveCategory(data.detectedType);
      }
      let nextLet = letterData;
      let nextCv = gulfCvData;
      let nextAg = agreementData;
      let nextMl = markListData;

      if (data.letterData) {
        const converted = applyLocalLanguageConversionToLetter(data.letterData, effectiveLang);
        nextLet = mergeLetterWithExisting(converted, letterData);
        setLetterData(nextLet);
      }
      if (data.gulfCvData) {
        const cvTargetLang: DocumentOutputLanguage =
          effectiveLang === 'ml' ? 'en' : effectiveLang;
        const convertedCv = applyLocalLanguageConversionToCv(
          {
            ...data.gulfCvData,
            photoDataUrl: data.gulfCvData.photoDataUrl || gulfCvData.photoDataUrl,
          },
          cvTargetLang
        );
        nextCv = mergeCvWithPreset(convertedCv, gulfCvData);
        setGulfCvData(nextCv);
        if (nextCat === 'gulf_cv') {
          setIsCvReviewBannerOpen(true);
        }
      }
      if (data.agreementData) {
        nextAg = sanitizeAgreementData(data.agreementData, agreementData);
        setAgreementData(nextAg);
      }
      if (data.markListData) {
        nextMl = data.markListData;
        setMarkListData(nextMl);
      }

      const questions: FollowUpQuestion[] =
        Array.isArray(data.followUpQuestions) && data.followUpQuestions.length > 0
          ? data.followUpQuestions
          : buildEditableQuestionsForDocument(nextCat, nextLet, nextCv, nextAg, nextMl);
      setFollowUpQuestions(questions);
      setFollowUpAnswerInputs({});

      const replyText =
        data.assistantReplyMalayalam ||
        'നിങ്ങളുടെ വിവരങ്ങൾ ചേർത്ത് A4 ഡോക്യുമെന്റ് പുതുക്കിയിട്ടുണ്ട്!';
      setAssistantBannerMessage(replyText);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.spokenTranscript
          ? `🎙️ വോയ്‌സ് / ഫയൽ വിവരം: "${data.spokenTranscript}"\n\n${replyText}`
          : replyText,
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        documentCategory: nextCat,
        followUpQuestions: questions,
        subFormPromptTitle: data.subFormPromptTitle,
        subFormOptions: data.subFormOptions,
        isComplete: Boolean(data.isComplete),
      };

      setChatMessages((prev) => [...prev, botMsg]);
      if (data.spokenTranscript) {
        setVoicePromptText(data.spokenTranscript);
      }

      playDocumentReadyChime();
      setIsEditMode(true);
      switchToPreview(false);
      showToast('✨ നിങ്ങളുടെ A4 പേപ്പർ റെഡി! അക്ഷരങ്ങളിൽ നേരിട്ട് തൊട്ട് തിരുത്താം.');
      return;
    }

    const replyText =
      data.assistantReplyMalayalam ||
      'നിങ്ങളുടെ ചോദ്യത്തിനുള്ള മറുപടി താഴെ നൽകിയിട്ടുണ്ട്.';
    setAssistantBannerMessage(replyText);

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: data.spokenTranscript
        ? `🎙️ വോയ്‌സ് / ഫയൽ വിവരം: "${data.spokenTranscript}"\n\n${replyText}`
        : replyText,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      documentCategory: undefined,
      followUpQuestions: [],
      isComplete: Boolean(data.isComplete),
    };

    setChatMessages((prev) => [...prev, botMsg]);
    if (data.spokenTranscript) {
      setVoicePromptText(data.spokenTranscript);
    }
    showToast('നിങ്ങളുടെ ചോദ്യത്തിനുള്ള മറുപടി താഴെ നൽകിയിട്ടുണ്ട്.');
  };

  // 1. Process Recorded Voice Note OR Uploaded WhatsApp Audio File directly via Gemini Multimodal Audio
  const handleProcessAudioPayload = async (payload: RecordedAudioPayload) => {
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userAudioMsg: ChatMessage = {
      id: `user-audio-${Date.now()}`,
      sender: 'user',
      text: payload.fileName
        ? `വോയ്‌സ് റെക്കോർഡ് ഫയൽ അപ്‌ലോഡ് ചെയ്തു: ${payload.fileName}`
        : payload.backupTranscript
        ? `🎙️ "${payload.backupTranscript}"`
        : payload.fieldContextLabel
        ? `"${payload.fieldContextLabel}" വോയ്‌സ് റെക്കോർഡ് അയച്ചു`
        : 'വോയ്‌സ് റെക്കോർഡ് സന്ദേശം അയച്ചു',
      audioUrl: payload.audioUrl,
      audioDuration: payload.durationFormatted,
      timestamp: nowTime,
    };

    setChatMessages((prev) => [...prev, userAudioMsg]);
    setIsGenerating(true);

    try {
      const recentHistory = chatMessages.slice(-6).map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      const response = await fetch('/api/process-audio-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: payload.audioBase64,
          mimeType: payload.mimeType,
          backupTranscript: payload.backupTranscript || '',
          fieldContextLabel: payload.fieldContextLabel || '',
          preferredCategory: payload.fieldContextLabel ? activeCategory : 'auto',
          currentDocument: {
            letterData,
            gulfCvData,
            agreementData,
            markListData,
          },
          conversationHistory: recentHistory,
          outputLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Audio API HTTP ${response.status}`);
      }
      const data = await response.json();
      applyAiDocumentResult(data);
    } catch {
      const fallbackSpoken = normalizeSpokenMalayalamTranscript(
        (payload.backupTranscript || '').trim()
      );
      if (fallbackSpoken) {
        const effectiveText = payload.fieldContextLabel
          ? `${payload.fieldContextLabel}: ${fallbackSpoken}`
          : fallbackSpoken;
        const localMatch = matchGovFormFromPrompt(
          effectiveText,
          activeCategory === 'malayalam_letter' ? letterData : null
        );
        if (localMatch) {
          applyAiDocumentResult({
            detectedType: 'malayalam_letter',
            documentUpdated: true,
            spokenTranscript: fallbackSpoken,
            isComplete: localMatch.isComplete,
            assistantReplyMalayalam: localMatch.assistantReplyMalayalam,
            followUpQuestions: localMatch.followUpQuestions,
            subFormPromptTitle: localMatch.subFormPromptTitle,
            subFormOptions: localMatch.subFormOptions,
            letterData: localMatch.letterData,
          });
        } else {
          const customFallbackLetter: MalayalamLetterData = {
            ...letterData,
            documentHeading: 'ഔദ്യോഗിക അപേക്ഷ',
            letterLayoutVariant: 'official_letter',
            subject: 'അടിയന്തര നടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള അപേക്ഷ.',
            bodyParagraphs: [
              `മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പറയുന്ന വിഷയം അങ്ങയുടെ ശ്രദ്ധയിൽപ്പെടുത്തുന്നു: ${fallbackSpoken}`,
              'ഈ വിഷയത്തിൽ അടിയന്തരമായി രേഖകൾ പരിശോധിച്ച് അനുയോജ്യമായ നടപടി സ്വീകരിക്കണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
            ],
            date: new Date().toLocaleDateString('ml-IN'),
          };
          applyAiDocumentResult({
            detectedType: 'malayalam_letter',
            documentUpdated: true,
            spokenTranscript: fallbackSpoken,
            isComplete: false,
            assistantReplyMalayalam:
              '✅ നിങ്ങളുടെ വോയ്‌സ് സന്ദേശത്തിൽ നിന്നുള്ള വിവരങ്ങൾ ചേർത്ത് A4 അപേക്ഷ തയ്യാറായിട്ടുണ്ട്! താഴെ കാണുന്ന കോളങ്ങളിലോ A4 പേപ്പറിൽ നേരിട്ടോ വിവരങ്ങൾ തിരുത്താം.',
            followUpQuestions: buildEditableQuestionsForLetter(customFallbackLetter),
            letterData: customFallbackLetter,
          });
        }
      } else {
        showToast('നിങ്ങളുടെ ശബ്ദം വ്യക്തമായി കേൾക്കാൻ സാധിച്ചില്ല. ദയവായി ഒരിക്കൽ കൂടി പറയുകയോ ടൈപ്പ് ചെയ്യുകയോ ചെയ്യുക.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Process Universal File Upload OR Any-PDF Full-Text Live Edit (PDF, Photo/Image, Text, CSV)
  const handleUploadUniversalAttachment = async (file: File, forcePdfEdit = false) => {
    if (!file || isGenerating) return;
    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const mime = (file.type || '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    const isPdf = mime === 'application/pdf' || ext === 'pdf';
    const isTextLike =
      mime.startsWith('text/') || ['txt', 'csv', 'json', 'md'].includes(ext);

    setIsGenerating(true);

    if (isPdf || forcePdfEdit) {
      setIsPdfEditSession(true);
      setUploadedPdfFile(file);
      setUploadedPdfFileName(file.name);
      setShowDirectPdfCanvas(true);
      setMobileViewTab('preview');
      setIsUnlocked(false);
    }

    try {
      const recentHistory = chatMessages.slice(-6).map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      if (isTextLike) {
        const textContent = await file.text();
        const userFileMsg: ChatMessage = {
          id: `user-file-${Date.now()}`,
          sender: 'user',
          text: `ടെക്സ്റ്റ് / ഡാറ്റ ഫയൽ അപ്‌ലോഡ് ചെയ്തു: ${file.name}`,
          attachmentName: file.name,
          attachmentType: 'text',
          timestamp: nowTime,
        };
        setChatMessages((prev) => [...prev, userFileMsg]);

        const localCv = parseStructuredCvFromText(textContent, INITIAL_GULF_CV_DATA);
        if (localCv.isMultiLineCv && localCv.gulfCvData) {
          const mappedCv = {
            ...localCv.gulfCvData,
            photoDataUrl: gulfCvData.photoDataUrl || '',
          };
          setShowDirectPdfCanvas(false);
          setActiveCategory('gulf_cv');
          setGulfCvData(mappedCv);
          setIsCvReviewBannerOpen(true);
          setIsEditMode(true);
          setMobileViewTab('preview');
          setIsGenerating(false);
          showToast(
            `✨ "${mappedCv.fullName}" സിവി ഫയലിൽ നിന്ന് വിവരങ്ങൾ ഓട്ടോമാറ്റിക് ആയി അലൈൻ ചെയ്തു!`
          );
          return;
        }

        const res = await fetch('/api/process-attachment-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type || 'text/plain',
            extractedText: textContent,
            isFullPdfEdit: forcePdfEdit,
            preferredCategory: activeCategory,
            currentDocument: { letterData, gulfCvData, agreementData, markListData },
            conversationHistory: recentHistory,
          }),
        });
        const data = await res.json();
        applyAiDocumentResult(data);
        setIsEditMode(true);
        setIsGenerating(false);
        return;
      }

      const clientExtractedPdfText = isPdf ? await extractReadableTextFromPdfBuffer(file) : '';

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUrl = reader.result as string;
          const base64Data = dataUrl?.split(',')[1] || '';

          const userFileMsg: ChatMessage = {
            id: `user-file-${Date.now()}`,
            sender: 'user',
            text: isPdf
              ? `📄 എഡിറ്റ് ചെയ്യാനായി PDF അപ്‌ലോഡ് ചെയ്തു: ${file.name}`
              : `ഫോട്ടോ / ഇമേജ് അപ്‌ലോഡ് ചെയ്തു: ${file.name}`,
            photoUrl: isImage ? dataUrl : undefined,
            attachmentName: file.name,
            attachmentType: isPdf ? 'pdf' : 'image',
            timestamp: nowTime,
          };
          setChatMessages((prev) => [...prev, userFileMsg]);

          if (isPdf && !forcePdfEdit && clientExtractedPdfText) {
            const pdfCvCheck = parseStructuredCvFromText(
              clientExtractedPdfText,
              INITIAL_GULF_CV_DATA
            );
            if (pdfCvCheck.isMultiLineCv && pdfCvCheck.gulfCvData) {
              const mappedCv = {
                ...pdfCvCheck.gulfCvData,
                photoDataUrl: gulfCvData.photoDataUrl || '',
              };
              setGulfCvData(mappedCv);
              setActiveCategory('gulf_cv');
              setShowDirectPdfCanvas(false);
              setIsCvReviewBannerOpen(true);
              setIsEditMode(true);
              setMobileViewTab('preview');
              showToast(
                `✨ PDF സിവിയിൽ നിന്ന് "${mappedCv.fullName}" വിവരങ്ങൾ ഗൾഫ് സിവി മോഡലിലേക്ക് അലൈൻ ചെയ്തു!`
              );
              setIsGenerating(false);
              return;
            }
          }

          const res = await fetch('/api/process-attachment-doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data,
              mimeType: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
              fileName: file.name,
              extractedText: clientExtractedPdfText,
              isFullPdfEdit: isPdf || forcePdfEdit,
              preferredCategory: activeCategory,
              currentDocument: { letterData, gulfCvData, agreementData, markListData },
              conversationHistory: recentHistory,
            }),
          });
          const data = await res.json();
          if (!isPdf && !forcePdfEdit) {
            applyAiDocumentResult(data);
          } else {
            // Keep DirectPdfEditor open for PDF files while storing letter/CV fallback data in ref (only applied if user clicks 'A4 ലെറ്റർ ഫോർമാറ്റ്')
            pdfExtractedFallbackRef.current = {
              letterData: data.letterData,
              gulfCvData: data.gulfCvData,
            };
            setIsEditMode(true);
            showToast(
              `📄 "${file.name}" എഡിറ്റിങ്ങിനായി തുറന്നു! അക്ഷരങ്ങളിൽ നേരിട്ട് തൊട്ട് തിരുത്താം.`
            );
          }
        } catch {
          showToast('ഫയൽ പ്രോസസ്സ് ചെയ്യുന്നതിൽ ചെറിയ തടസ്സം നേരിട്ടു.');
        } finally {
          setIsGenerating(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsGenerating(false);
      showToast('ഫയൽ വായിക്കുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  };

  // Completely close & clear the currently opened PDF from DirectPdfEditor
  const handleCloseAndClearUploadedPdf = () => {
    setShowDirectPdfCanvas(false);
    setUploadedPdfFile(null);
    setUploadedPdfFileName('');
    setIsPdfEditSession(false);
    pdfExtractedFallbackRef.current = null;
    if (pdfEditUploadInputRef.current) {
      pdfEditUploadInputRef.current.value = '';
    }
    showToast('✓ തുറന്ന PDF ഒഴിവാക്കി! ഇനി മറ്റൊരു PDF എടുക്കുകയോ പുതിയ അപേക്ഷ തയ്യാറാക്കുകയോ ചെയ്യാം.');
  };

  // 1-Click Find & Replace across the entire active A4 document
  const handleFindAndReplaceInDocument = (e: React.FormEvent) => {
    e.preventDefault();
    const search = findText.trim();
    if (!search) {
      showToast('തിരുത്തേണ്ട വാക്ക് "കണ്ടെത്തുക (Find)" കോളത്തിൽ ടൈപ്പ് ചെയ്യുക.');
      return;
    }
    const replacement = replaceText;
    const replaceAllStr = (str: string) => (str ? str.split(search).join(replacement) : str);

    if (activeCategory === 'malayalam_letter') {
      setLetterData((prev) => ({
        ...prev,
        documentHeading: replaceAllStr(prev.documentHeading),
        senderName: replaceAllStr(prev.senderName),
        senderAddress: replaceAllStr(prev.senderAddress),
        senderPhone: replaceAllStr(prev.senderPhone),
        recipientTitle: replaceAllStr(prev.recipientTitle),
        recipientOffice: replaceAllStr(prev.recipientOffice),
        recipientPlace: replaceAllStr(prev.recipientPlace),
        subject: replaceAllStr(prev.subject),
        salutation: replaceAllStr(prev.salutation),
        bodyParagraphs: (prev.bodyParagraphs || []).map(replaceAllStr),
        structuredFields: (prev.structuredFields || []).map((f) => ({
          ...f,
          label: replaceAllStr(f.label),
          value: replaceAllStr(f.value),
        })),
        place: replaceAllStr(prev.place),
        date: replaceAllStr(prev.date),
      }));
    } else if (activeCategory === 'gulf_cv') {
      setGulfCvData((prev) => ({
        ...prev,
        fullName: replaceAllStr(prev.fullName),
        jobTitle: replaceAllStr(prev.jobTitle),
        phone: replaceAllStr(prev.phone),
        whatsapp: replaceAllStr(prev.whatsapp),
        email: replaceAllStr(prev.email),
        currentLocation: replaceAllStr(prev.currentLocation),
        visaStatus: replaceAllStr(prev.visaStatus),
        drivingLicense: replaceAllStr(prev.drivingLicense),
        passportNumber: replaceAllStr(prev.passportNumber),
        professionalSummary: replaceAllStr(prev.professionalSummary),
        cvPlace: replaceAllStr(prev.cvPlace || ''),
        signatureName: replaceAllStr(prev.signatureName || ''),
        coreSkills: (prev.coreSkills || []).map(replaceAllStr),
        workExperience: (prev.workExperience || []).map((exp) => ({
          ...exp,
          role: replaceAllStr(exp.role),
          company: replaceAllStr(exp.company),
          location: replaceAllStr(exp.location),
          duration: replaceAllStr(exp.duration),
          highlights: (exp.highlights || []).map(replaceAllStr),
        })),
        education: (prev.education || []).map((edu) => ({
          ...edu,
          degree: replaceAllStr(edu.degree),
          institution: replaceAllStr(edu.institution),
          year: replaceAllStr(edu.year),
        })),
      }));
    } else if (activeCategory === 'rental_agreement') {
      setAgreementData((prev) => ({
        ...prev,
        titleMalayalam: replaceAllStr(prev.titleMalayalam),
        firstPartyDetails: replaceAllStr(prev.firstPartyDetails),
        secondPartyDetails: replaceAllStr(prev.secondPartyDetails),
        preambleParagraph: replaceAllStr(prev.preambleParagraph),
        clauses: (prev.clauses || []).map(replaceAllStr),
        schedulePropertyDetails: replaceAllStr(prev.schedulePropertyDetails),
      }));
    } else if (activeCategory === 'teacher_marklist') {
      setMarkListData((prev) => ({
        ...prev,
        schoolName: replaceAllStr(prev.schoolName),
        examTitle: replaceAllStr(prev.examTitle),
        classAndDivision: replaceAllStr(prev.classAndDivision),
        classTeacherName: replaceAllStr(prev.classTeacherName),
      }));
    }

    setSheetOverlayItems((prev) =>
      prev.map((item) => ({
        ...item,
        text: replaceAllStr(item.text),
      }))
    );

    setFindText('');
    setReplaceText('');
    showToast(`✓ "${search}" മാറ്റി "${replacement}" ആക്കിയിട്ടുണ്ട്!`);
  };

  // Instant 0ms Template Loader for QUICK_TEMPLATES (so selecting ANY example immediately opens in the touch-to-edit display AND WhatsApp column editor!)
  const handleSelectQuickTemplateInstantly = (tpl: QuickTemplateItem, stayInChat = false) => {
    setPreBlankSnapshot(null);
    setShowDirectPdfCanvas(false);
    setIsPdfEditSession(false);
    setSheetOverlayItems([]);
    setSheetTool('select_edit');
    setIsEditMode(true);
    setShowTopExamplesDrawer(false);
    setActiveCategory(tpl.category);
    setVoicePromptText(tpl.sampleVoicePrompt);

    const todayStr = new Date().toLocaleDateString('ml-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let nextLetter = letterData;
    let nextCv = gulfCvData;
    let nextAg = agreementData;
    let nextMl = markListData;

    if (tpl.category === 'malayalam_letter') {
      const madrasaGovFormMap: Record<string, string> = {
        'madrasa-tc-application-tpl': 'madrasa-tc-certificate',
        'madrasa-usthad-leave-tpl': 'madrasa-usthad-leave-application',
        'madrasa-pta-notice-tpl': 'madrasa-pta-meeting-notice',
        'madrasa-student-abuse-complaint-tpl': 'madrasa-student-abuse-complaint',
      };
      if (madrasaGovFormMap[tpl.id]) {
        const matchedGovForm = KERALA_GOV_FORMS_MASTER.find(
          (f) => f.id === madrasaGovFormMap[tpl.id]
        );
        if (matchedGovForm) {
          handleSelectGovForm(matchedGovForm, stayInChat);
          return;
        }
      }

      if (tpl.id === 'school-project-cover') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'project_cover',
          documentHeading: 'സയൻസ് പ്രോജക്റ്റ് റിപ്പോർട്ട്',
          subject: 'ജലസംരക്ഷണവും മഴവെള്ള സംഭരണവും — പഠന പ്രോജക്റ്റ്',
          recipientOffice: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ, കോഴിക്കോട്',
          senderName: 'ആദിത്യൻ കെ. (ക്ലാസ് 8 B, റോൾ നമ്പർ: 14)',
          recipientTitle: 'ശ്രീമതി. സുജാത ടീച്ചർ (സയൻസ് വിഭാഗം)',
          date: '2026 - 2027',
        };
      } else if (tpl.id === 'school-speech-malayalam' || tpl.id === 'school-assembly-speech') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'school_speech',
          documentHeading: 'മലയാളം പ്രസംഗം — പരിസ്ഥിതി ദിനം',
          subject: 'പരിസ്ഥിതി ദിന സന്ദേശം',
          salutation: 'ബഹുമാനപ്പെട്ട അധ്യാപകരേ, പ്രിയപ്പെട്ട കൂട്ടുകാരേ, എല്ലാവർക്കും നമസ്കാരം!',
          bodyParagraphs: [
            'ഇന്ന് ജൂൺ 5, ലോക പരിസ്ഥിതി ദിനം. നമ്മുടെ ഭൂമിയെയും പ്രകൃതിയെയും സംരക്ഷിക്കേണ്ടതിന്റെ പ്രാധാന്യം ഓർമ്മിപ്പിക്കുന്ന ദിനമാണിന്ന്.',
            'മരങ്ങൾ നട്ടുപിടിപ്പിച്ചും പ്ലാസ്റ്റിക് മാലിന്യങ്ങൾ ഒഴിവാക്കിയും ജലസ്രോതസ്സുകൾ സംരക്ഷിച്ചും നമുക്ക് നമ്മുടെ നാടിനെ ഹരിതാഭമാക്കാം.',
            'ഒരു തൈ നടാം നമുക്കമ്മയ്ക്കായി, ഒരു തൈ നടാം കൊച്ചുമക്കൾക്കായി. നന്ദി, നമസ്കാരം!',
          ],
          senderName: 'അനന്യ ആർ., ക്ലാസ് 7 A',
          date: todayStr,
        };
      } else if (tpl.id === 'school-leave-student' || tpl.id === 'school-student-leave-letter') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'school_leave',
          documentHeading: 'അവധി അപേക്ഷ (Leave Letter)',
          senderName: 'അർജുൻ വി. (ക്ലാസ് 6 B)',
          senderAddress: 'വലിയവീട്ടിൽ, തൃശ്ശൂർ',
          senderPhone: '98470 00000',
          recipientTitle: 'ബഹുമാനപ്പെട്ട ക്ലാസ് ടീച്ചർ മുമ്പാകെ,',
          recipientOffice: 'സെന്റ് തോമസ് ഹൈസ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'ഒരു ദിവസത്തെ അവധി അനുവദിച്ചു കിട്ടുന്നതിനുള്ള അപേക്ഷ.',
          salutation: 'ബഹുമാനപ്പെട്ട ടീച്ചറേ,',
          bodyParagraphs: [
            'ഈ സ്കൂളിലെ ആറാം ക്ലാസ് B ഡിവിഷൻ വിദ്യാർത്ഥിയായ എനിക്ക് കടുത്ത പനിയും തലവേദനയും ആയതിനാൽ ഇന്ന് ക്ലാസ്സിൽ ഹാജരാകുവാൻ സാധിക്കുന്നതല്ല. ആയതിനാൽ എനിക്ക് ഇന്നത്തെ ഒരു ദിവസത്തെ അവധി അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
          ],
          parentOrGuardianName: 'വിജയൻ കെ. (രക്ഷിതാവ്)',
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-leave-tc') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: 'ടി.സി (Transfer Certificate) അപേക്ഷ',
          senderName: 'വിജയൻ കെ. (രക്ഷിതാവ്)',
          senderAddress: 'ശ്രീനിലയം, തൃശ്ശൂർ PO - 680001',
          senderPhone: '98470 12345',
          recipientTitle: 'ബഹുമാനപ്പെട്ട ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ മുമ്പാകെ,',
          recipientOffice: 'സെന്റ് തോമസ് ഹയർ സെക്കൻഡറി സ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'വിദ്യാർത്ഥിയുടെ ടി.സി (Transfer Certificate) അനുവദിച്ചു കിട്ടുന്നതിനുള്ള അപേക്ഷ.',
          salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
          bodyParagraphs: [
            'എന്റെ മകൻ / മകൾ അർജുൻ വിജയൻ ഈ സ്കൂളിൽ ഏഴാം ക്ലാസ് A ഡിവിഷനിൽ (അഡ്മിഷൻ നമ്പർ: 4521) പഠിച്ചുവരികയാണ്. ഞങ്ങളുടെ കുടുംബം എറണാകുളത്തേക്ക് താമസം മാറുന്നതിനാൽ തുടർപഠനത്തിനായി കുട്ടിയെ അവിടെയുള്ള സ്കൂളിൽ ചേർക്കേണ്ടതുണ്ട്.',
            'ആയതിനാൽ എന്റെ കുട്ടിയുടെ വിടുതൽ സർട്ടിഫിക്കറ്റും (TC) സ്വഭാവ സർട്ടിഫിക്കറ്റും എത്രയും വേഗം അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു. സ്കൂളിലേക്കുള്ള ഫീസുകളോ മറ്റ് കുടിശ്ശികകളോ നൽകാനില്ല എന്ന് ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.',
          ],
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-bonafide-study-certificate') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: 'പഠന സർട്ടിഫിക്കറ്റ് (Bonafide Certificate) അപേക്ഷ',
          senderName: 'അർജുൻ വിജയൻ (ക്ലാസ് 9 B)',
          senderAddress: 'ശ്രീനിലയം, തൃശ്ശൂർ PO - 680001 (രക്ഷിതാവ്: വിജയൻ കെ.)',
          senderPhone: '98470 12345',
          recipientTitle: 'ബഹുമാനപ്പെട്ട ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ മുമ്പാകെ,',
          recipientOffice: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'പഠന സർട്ടിഫിക്കറ്റ് (Bonafide / Study Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
          salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
          bodyParagraphs: [
            'ഞാൻ ഈ സ്കൂളിൽ ഒമ്പതാം ക്ലാസ് B ഡിവിഷനിൽ (റോൾ നമ്പർ: 14, അഡ്മിഷൻ നമ്പർ: 3890) പഠിച്ചുവരുന്ന വിദ്യാർത്ഥിയാണ്. എനിക്ക് സ്കോളർഷിപ്പ് അപേക്ഷ സമർപ്പിക്കുന്നതിനും ബാങ്ക് അക്കൗണ്ട് തുടങ്ങുന്നതിനുമായി ഞാൻ ഈ വിദ്യാലയത്തിലെ വിദ്യാർത്ഥിയാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്ന പഠന സർട്ടിഫിക്കറ്റ് (Bonafide Certificate) ആവശ്യമായി വന്നിരിക്കുന്നു.',
            'ആയതിനാൽ എനിക്ക് ഒരു പഠന സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
          ],
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-fee-concession-scholarship') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: 'ഫീസ് ഇളവ് / സ്കോളർഷിപ്പ് അപേക്ഷ',
          senderName: 'വിജയൻ കെ. (രക്ഷിതാവ്)',
          senderAddress: 'ശ്രീനിലയം, തൃശ്ശൂർ PO - 680001',
          senderPhone: '98470 12345',
          recipientTitle: 'ബഹുമാനപ്പെട്ട പ്രിൻസിപ്പൽ / ഹെഡ്മാസ്റ്റർ മുമ്പാകെ,',
          recipientOffice: 'സെന്റ് തോമസ് ഹയർ സെക്കൻഡറി സ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'സ്കൂൾ ഫീസ് ഇളവ് / സാമ്പത്തിക സഹായം അനുവദിച്ചു കിട്ടുന്നതിനുള്ള അപേക്ഷ.',
          salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
          bodyParagraphs: [
            'എന്റെ മകൻ / മകൾ അർജുൻ വിജയൻ ഈ വിദ്യാലയത്തിൽ എട്ടാം ക്ലാസ് A ഡിവിഷനിൽ പഠിച്ചുവരികയാണ്. പഠനത്തിൽ മികച്ച നിലവാരം പുലർത്തുന്ന വിദ്യാർത്ഥിയാണ്. എന്നാൽ ദിവസക്കൂലി തൊഴിലാളിയായ എനിക്ക് ഇപ്പോൾ കടുത്ത സാമ്പത്തിക ബുദ്ധിമുട്ട് അനുഭവപ്പെടുന്നതിനാൽ ഈ ടേമിലെ ഫീസ് ഒന്നിച്ച് അടയ്ക്കുവാൻ പ്രയാസമുണ്ട്.',
            'ആയതിനാൽ എന്റെ കുടുംബത്തിന്റെ സാമ്പത്തിക സ്ഥിതി പരിഗണിച്ച് കുട്ടിക്ക് ഫീസ് ഇളവോ (Fee Concession) സ്കോളർഷിപ്പ് സഹായമോ അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
          ],
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-study-tour-consent') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: 'പഠനയാത്ര രക്ഷിതാവിന്റെ സമ്മതപത്രം (Consent Letter)',
          senderName: 'വിജയൻ കെ. (രക്ഷിതാവ്)',
          senderAddress: 'ശ്രീനിലയം, തൃശ്ശൂർ PO - 680001',
          senderPhone: '98470 12345',
          recipientTitle: 'ബഹുമാനപ്പെട്ട ഹെഡ്മാസ്റ്റർ / ക്ലാസ് ടീച്ചർ മുമ്പാകെ,',
          recipientOffice: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'സ്കൂൾ പഠനയാത്രയിൽ (Study Tour) കുട്ടിയെ പങ്കെടുപ്പിക്കുന്നതിനുള്ള സമ്മതപത്രം.',
          salutation: 'ബഹുമാനപ്പെട്ട സർ / ടീച്ചറേ,',
          bodyParagraphs: [
            'ഈ സ്കൂളിലെ പത്താം ക്ലാസ് A ഡിവിഷൻ വിദ്യാർത്ഥിയായ എന്റെ മകൻ / മകൾ അർജുൻ വിജയനെ സ്കൂളിൽ നിന്നും സംഘടിപ്പിക്കുന്ന പഠനയാത്രയിൽ (Study Tour / Excursion) പങ്കെടുപ്പിക്കുന്നതിന് എനിക്ക് പൂർണ്ണ സമ്മതമാണെന്ന് ഇതിനാൽ അറിയിക്കുന്നു.',
            'യാത്രയിൽ അധ്യാപകർ നൽകുന്ന എല്ലാ നിർദ്ദേശങ്ങളും അച്ചടക്കവും കുട്ടി കൃത്യമായി പാലിക്കുമെന്ന് ഞാൻ ഉറപ്പുനൽകുന്നു. അടിയന്തര ആവശ്യങ്ങൾക്ക് ബന്ധപ്പെടേണ്ട ഫോൺ നമ്പർ: 98470 12345.',
          ],
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-conduct-condonation-letter') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: 'ഹാജർ കുറവ് പരിഹരിക്കൽ (Condonation) അപേക്ഷ',
          senderName: 'അർജുൻ വിജയൻ (ക്ലാസ് 10 A)',
          senderAddress: 'ശ്രീനിലയം, തൃശ്ശൂർ PO - 680001',
          senderPhone: '98470 12345',
          recipientTitle: 'ബഹുമാനപ്പെട്ട പ്രിൻസിപ്പൽ / ഹെഡ്മാസ്റ്റർ മുമ്പാകെ,',
          recipientOffice: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'ചികിത്സാ കാരണങ്ങളാൽ ഉണ്ടായ ഹാജർ കുറവ് പരിഹരിച്ച് (Attendance Condonation) പരീക്ഷ എഴുതാൻ അനുവദിക്കുന്നതിനുള്ള അപേക്ഷ.',
          salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
          bodyParagraphs: [
            'ഞാൻ ഈ സ്കൂളിലെ പത്താം ക്ലാസ് A ഡിവിഷൻ വിദ്യാർത്ഥിയാണ്. കഴിഞ്ഞ മാസത്തിൽ കടുത്ത പനിയും തുടർചികിത്സയും കാരണം ഡോക്ടറുടെ നിർദ്ദേശപ്രകാരം വിശ്രമത്തിലായിരുന്നതിനാൽ എനിക്ക് 12 ദിവസത്തെ ക്ലാസ്സുകളിൽ ഹാജരാകുവാൻ സാധിച്ചില്ല. ഇതുമൂലം എന്റെ ഹാജർ ശതമാനത്തിൽ ചെറിയ കുറവ് വന്നിട്ടുണ്ട്.',
            'മെഡിക്കൽ സർട്ടിഫിക്കറ്റ് ഇതോടൊപ്പം സമർപ്പിക്കുന്നു. ആയതിനാൽ എന്റെ ഹാജർ കുറവ് അനുഭാവപൂർവ്വം പരിഹരിച്ച് (Condonation) പൊതുപരീക്ഷ എഴുതുവാൻ അനുവദിക്കണമെന്നും സ്വഭാവ സർട്ടിഫിക്കറ്റ് നൽകണമെന്നും വിനീതമായി അപേക്ഷിക്കുന്നു.',
          ],
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-pta-meeting-notice') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: 'പി.ടി.എ (PTA) മീറ്റിംഗ് നോട്ടീസ്',
          senderName: 'ഹെഡ്മാസ്റ്റർ / പി.ടി.എ സെക്രട്ടറി',
          senderAddress: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ, തൃശ്ശൂർ',
          senderPhone: '98470 12345',
          recipientTitle: 'പ്രിയപ്പെട്ട രക്ഷിതാക്കളെ,',
          recipientOffice: 'എല്ലാ ക്ലാസ്സുകളിലെയും രക്ഷിതാക്കളുടെ അറിവിലേക്ക്,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'ക്ലാസ് പി.ടി.എ (PTA) യോഗവും പ്രോഗ്രസ് കാർഡ് വിതരണവും സംബന്ധിച്ച അറിയിപ്പ്.',
          salutation: 'പ്രിയ രക്ഷിതാവേ,',
          bodyParagraphs: [
            'നമ്മുടെ വിദ്യാലയത്തിലെ ഈ അധ്യയന വർഷത്തെ പാദവാർഷിക പരീക്ഷയുടെ ഫലപ്രഖ്യാപനവും ക്ലാസ് പി.ടി.എ (PTA) യോഗവും അടുത്ത വെള്ളിയാഴ്ച ഉച്ചയ്ക്ക് 2.00 മണിക്ക് അതത് ക്ലാസ് മുറികളിൽ വെച്ച് ചേരുന്നതാണ്.',
            'കുട്ടികളുടെ പഠന പുരോഗതി വിലയിരുത്തുന്നതിനും അധ്യാപകരുമായി നേരിട്ട് സംസാരിക്കുന്നതിനും പ്രോഗ്രസ് കാർഡ് ഒപ്പിട്ട് കൈപ്പറ്റുന്നതിനുമായി എല്ലാ രക്ഷിതാക്കളും കൃത്യസമയത്ത് തന്നെ യോഗത്തിൽ പങ്കെടുക്കണമെന്ന് സ്നേഹപൂർവ്വം അഭ്യർത്ഥിക്കുന്നു.',
          ],
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else if (tpl.id === 'school-teacher-casual-duty-leave') {
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'school_leave',
          documentHeading: 'അധ്യാപകരുടെ അവധി അപേക്ഷ (Teacher Casual / Duty Leave)',
          senderName: 'ശ്രീമതി. രാധിക കെ. (HST മലയാളം)',
          senderAddress: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ, തൃശ്ശൂർ',
          senderPhone: '98470 12345',
          recipientTitle: 'ബഹുമാനപ്പെട്ട ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ മുമ്പാകെ,',
          recipientOffice: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ,',
          recipientPlace: 'തൃശ്ശൂർ.',
          subject: 'ഒരു ദിവസത്തെ കാഷ്വൽ ലീവ് (Casual Leave) അനുവദിച്ചു കിട്ടുന്നതിനുള്ള അപേക്ഷ.',
          salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
          bodyParagraphs: [
            'ഈ വിദ്യാലയത്തിൽ എച്ച്.എസ്.ടി (മലയാളം) അധ്യാപികയായി ജോലി ചെയ്യുന്ന എനിക്ക് വ്യക്തിപരമായ അടിയന്തര ആവശ്യം ഉള്ളതിനാൽ നാളെ ജോലിയിൽ ഹാജരാകുവാൻ സാധിക്കുന്നതല്ല.',
            'ആയതിനാൽ എനിക്ക് ഈ കലണ്ടർ വർഷത്തെ അർഹതപ്പെട്ട കാഷ്വൽ ലീവിൽ നിന്നും ഒരു ദിവസത്തെ അവധി അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
          ],
          parentOrGuardianName: 'ശ്രീമതി. രാധിക കെ. (അധ്യാപികയുടെ ഒപ്പ്)',
          place: 'തൃശ്ശൂർ',
          date: todayStr,
        };
      } else {
        // Build clean, immediately touch-editable letter for any other Malayalam letter template
        const isResignation = tpl.subGroup === 'രാജിക്കത്ത് & സ്ഥാപനം' || tpl.id.includes('resignation');
        nextLetter = {
          ...INITIAL_LETTER_DATA,
          letterLayoutVariant: 'official_letter',
          documentHeading: isResignation ? 'രാജിക്കത്ത് (Resignation Letter)' : tpl.titleMalayalam,
          senderName: 'രാഹുൽ നായർ',
          senderAddress: 'ശ്രീനിലയം, കാക്കനാട്, എറണാകുളം',
          senderPhone: '98470 12345',
          recipientTitle: isResignation
            ? 'ബഹുമാനപ്പെട്ട മാനേജർ / മേധാവി മുമ്പാകെ,'
            : 'ബഹുമാനപ്പെട്ട ഓഫീസർ / അധികാരി മുമ്പാകെ,',
          recipientOffice: isResignation
            ? 'മലബാർ ട്രേഡേഴ്സ് പ്രൈവറ്റ് ലിമിറ്റഡ്,'
            : `${tpl.badgeText.split('·')[0].trim()},`,
          recipientPlace: 'എറണാകുളം, കേരളം.',
          subject: `${tpl.titleMalayalam} സംബന്ധിച്ച്.`,
          salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
          bodyParagraphs: [
            tpl.sampleVoicePrompt,
            'മേൽപ്പറഞ്ഞ വിഷയത്തിൽ എന്റെ അപേക്ഷ അനുഭാവപൂർവ്വം പരിഗണിച്ച് ആവശ്യമായ തുടർനടപടികൾ സ്വീകരിക്കണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.',
          ],
          place: 'എറണാകുളം',
          date: todayStr,
        };
      }
      setLetterData(nextLetter);
      setOutputLanguage('ml');
    } else if (tpl.category === 'gulf_cv') {
      const cvLang: DocumentOutputLanguage = 'en';
      setOutputLanguage(cvLang);
      setAutoFitOnePage(true);
      nextCv = applyLocalLanguageConversionToCv(
        {
          ...INITIAL_GULF_CV_DATA,
          jobTitle: tpl.titleMalayalam.includes('ഡ്രൈവർ')
            ? 'LIGHT & HEAVY VEHICLE DRIVER (GCC LICENSE)'
            : tpl.titleMalayalam.includes('നഴ്സ്')
            ? 'REGISTERED STAFF NURSE (B.Sc NURSING · DHA / HAAD)'
            : tpl.titleMalayalam.includes('ഇലക്ട്രീഷ്യൻ')
            ? 'INDUSTRIAL & BUILDING ELECTRICIAN / MEP TECHNICIAN'
            : 'SALES & ACCOUNTANT EXECUTIVE (GCC EXPERIENCE)',
        },
        cvLang
      );
      setGulfCvData(nextCv);
    } else if (tpl.category === 'rental_agreement') {
      setOutputLanguage('ml');
      nextAg = {
        ...INITIAL_AGREEMENT_DATA,
        titleMalayalam: tpl.titleMalayalam.includes('സത്യവാങ്മൂലം')
          ? 'സത്യവാങ്മൂലം (AFFIDAVIT)'
          : 'വാടക കരാർ പത്രം (RENTAL AGREEMENT)',
      };
      setAgreementData(nextAg);
    } else if (tpl.category === 'teacher_marklist') {
      const matchedPreset = tpl.markListPresetId
        ? MARKLIST_PRESET_MODELS.find((p) => p.id === tpl.markListPresetId)
        : undefined;
      if (matchedPreset) {
        nextMl = matchedPreset.buildData();
      } else {
        nextMl = {
          ...INITIAL_MARKLIST_DATA,
          examTitle: tpl.titleMalayalam,
        };
      }
      setMarkListData(nextMl);
    }

    const questions = buildEditableQuestionsForDocument(
      tpl.category,
      nextLetter,
      nextCv,
      nextAg,
      nextMl
    );
    setFollowUpQuestions(questions);
    setFollowUpAnswerInputs({});

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const botTemplateMsg: ChatMessage = {
      id: `bot-tpl-${Date.now()}`,
      sender: 'bot',
      text: `📄 "${tpl.titleMalayalam}" മാതൃക തുറന്നിട്ടുണ്ട്.\n\n• വാട്സാപ്പ് മോഡിൽ: താഴെ കാണുന്ന ഓരോ കോളത്തിലും നിങ്ങളുടെ വിവരങ്ങൾ നേരിട്ട് ടൈപ്പ് ചെയ്യുകയോ 🎙️ വോയ്‌സ് ബട്ടൺ അമർത്തി പറയുകയോ ചെയ്യാം.\n• പേപ്പർ മോഡിൽ: വലതുവശത്തെ A4 പേപ്പറിൽ നേരിട്ട് തൊട്ടും തിരുത്താം!`,
      timestamp: nowTime,
      documentCategory: tpl.category,
      followUpQuestions: questions,
      isComplete: true,
    };
    setChatMessages((prev) => [...prev, botTemplateMsg]);

    if (!stayInChat) {
      switchToPreview(true);
    }
    showToast(`✓ "${tpl.titleMalayalam}" തുറന്നു! ചാറ്റിലെ കോളങ്ങളിലോ A4 പേപ്പറിലോ തിരുത്താം.`);
  };

  // 3. Process Text Input or Quick Template via AI
  const handleGenerateOrRefine = async (
    rawInputPrompt: string,
    preferredCategory: DocumentCategory | 'auto' = 'auto'
  ) => {
    const cleanedInput = normalizeSpokenMalayalamTranscript(rawInputPrompt.trim());
    if (!cleanedInput || isGenerating) return;

    const requestedLang = detectRequestedOutputLanguage(
      cleanedInput,
      outputLanguage,
      preferredCategory !== 'auto' ? preferredCategory : activeCategory
    );
    if (requestedLang !== outputLanguage) {
      setOutputLanguage(requestedLang);
    }

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleanedInput,
      timestamp: nowTime,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Instant client-side check: If user pasted a full CV/Resume into WhatsApp Chat or Voice Studio,
    // extract and align every field immediately and convert to the selected Printout Language!
    const instantCvCheck = parseStructuredCvFromText(cleanedInput, INITIAL_GULF_CV_DATA);
    if (instantCvCheck.isMultiLineCv && instantCvCheck.gulfCvData) {
      const cvLang: DocumentOutputLanguage =
        requestedLang === 'ml' ? 'en' : requestedLang;
      setOutputLanguage(cvLang);
      setAutoFitOnePage(true);
      const mappedCv = applyLocalLanguageConversionToCv(
        {
          ...instantCvCheck.gulfCvData,
          photoDataUrl: gulfCvData.photoDataUrl || '',
        },
        cvLang
      );
      const cvQuestions = buildEditableQuestionsForDocument(
        'gulf_cv',
        letterData,
        mappedCv,
        agreementData,
        markListData
      );
      setShowDirectPdfCanvas(false);
      setActiveCategory('gulf_cv');
      setGulfCvData(mappedCv);
      setPdfZoomMode('fit');
      setFollowUpQuestions(cvQuestions);
      setFollowUpAnswerInputs({});

      // Also translate all sentences/locations to cvLang via server
      translateActiveDocumentViaServer({
        category: 'gulf_cv',
        targetLanguage: cvLang,
        letterData,
        gulfCvData: mappedCv,
        agreementData,
        markListData,
      })
        .then((trData) => {
          if (trData.gulfCvData) {
            setGulfCvData((prev) => ({
              ...trData.gulfCvData!,
              photoDataUrl: prev.photoDataUrl || '',
            }));
          }
        })
        .catch(() => {});

      const replyText = `✨ നിങ്ങൾ പേസ്റ്റ് ചെയ്ത സിവി (${mappedCv.fullName} · ${mappedCv.jobTitle} · ${mappedCv.currentLocation}) യഥാർത്ഥ A4 PDF രൂപത്തിലേക്ക് മാറ്റിയിട്ടുണ്ട്! താഴെ കാണുന്ന കോളങ്ങളിലോ വലതുവശത്തെ A4 പേപ്പറിലോ വിവരങ്ങൾ തിരുത്താം.`;
      setAssistantBannerMessage(replyText);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-cv-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: nowTime,
          documentCategory: 'gulf_cv',
          followUpQuestions: cvQuestions,
          isComplete: true,
        },
      ]);
      playDocumentReadyChime();
      setIsEditMode(true);
      setMobileViewTab('preview');
      showToast(`✨ "${mappedCv.fullName}" A4 PDF റെഡി! സൂം ചെയ്ത് ഏത് എഴുത്തും സെലക്ട് ചെയ്ത് തിരുത്താം.`);
      return;
    }

    // Instant client-side check for 100-Student Mark List / Attendance Register or Pasted Student Names
    // Prevents 25s server timeout when teachers request N students (e.g., "100 കുട്ടികളുടെ മാർക്ക് ലിസ്റ്റ്") or paste 30-100 names!
    const instantMarkListCheck = parseInstantMarkListCommandOrNames(
      cleanedInput,
      markListData,
      preferredCategory !== 'auto' ? preferredCategory : activeCategory
    );
    if (instantMarkListCheck && instantMarkListCheck.matched) {
      const updatedMl = instantMarkListCheck.markListData;
      setShowDirectPdfCanvas(false);
      setActiveCategory('teacher_marklist');
      setMarkListData(updatedMl);
      setPdfZoomMode('fit');
      const mlQuestions = buildEditableQuestionsForDocument(
        'teacher_marklist',
        letterData,
        gulfCvData,
        agreementData,
        updatedMl
      );
      setFollowUpQuestions(mlQuestions);
      setFollowUpAnswerInputs({});
      const replyMsg =
        instantMarkListCheck.replyMalayalam ||
        `✅ ${updatedMl.students.length} കുട്ടികളുടെ മാർക്ക് ലിസ്റ്റ് തയ്യാറായിട്ടുണ്ട്!`;
      setAssistantBannerMessage(replyMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-ml-instant-${Date.now()}`,
          sender: 'bot',
          text: replyMsg,
          timestamp: nowTime,
          documentCategory: 'teacher_marklist',
          followUpQuestions: mlQuestions,
          isComplete: true,
        },
      ]);
      playDocumentReadyChime();
      setIsEditMode(true);
      setMobileViewTab('preview');
      showToast(`✓ ${updatedMl.students.length} കുട്ടികളുടെ പട്ടിക 0.1 സെക്കൻഡിൽ തയ്യാറായി!`);
      return;
    }

    // Instant check for Sample requests (e.g. "resume sample", "cv sample", "റെസ്യൂം സാമ്പിൾ", "vadaka karar sample")
    const normUserPrompt = cleanedInput.toLowerCase();
    const isResumeSampleQuery =
      /\b(resume\s*(sample|format|template|maker)|cv\s*(sample|format|template|maker)|biodata\s*(sample|format)|gulf\s*cv(\s*sample)?)\b/i.test(
        normUserPrompt
      ) ||
      normUserPrompt.includes('റെസ്യൂം സാമ്പിൾ') ||
      normUserPrompt.includes('റെസ്യൂമെ സാമ്പിൾ') ||
      normUserPrompt.includes('സിവി സാമ്പിൾ') ||
      normUserPrompt.includes('ബയോഡാറ്റ സാമ്പിൾ') ||
      normUserPrompt.includes('സിവി മാതൃക');

    if (isResumeSampleQuery && !cleanedInput.includes('\n') && cleanedInput.split(/\s+/).length <= 5) {
      setShowDirectPdfCanvas(false);
      setOutputLanguage('en');
      setAutoFitOnePage(true);
      const enCv = applyLocalLanguageConversionToCv(gulfCvData, 'en');
      setGulfCvData(enCv);
      setActiveCategory('gulf_cv');
      const cvQuestions = buildEditableQuestionsForDocument(
        'gulf_cv',
        letterData,
        enCv,
        agreementData,
        markListData
      );
      setFollowUpQuestions(cvQuestions);
      setFollowUpAnswerInputs({});
      const replyMsg =
        '📋 അന്താരാഷ്ട്ര നിലവാരമുള്ള ഗൾഫ് CV / Resume മാതൃക ഇംഗ്ലീഷിൽ തയ്യാറായിട്ടുണ്ട്! നിങ്ങളുടെ പേര്, ജോലി തസ്തിക, അനുഭവം എന്നിവ വാട്സാപ്പ് കോളങ്ങളിലോ A4 പേപ്പറിൽ നേരിട്ടോ തിരുത്താം.';
      setAssistantBannerMessage(replyMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-cv-sample-${Date.now()}`,
          sender: 'bot',
          text: replyMsg,
          timestamp: nowTime,
          documentCategory: 'gulf_cv',
          followUpQuestions: cvQuestions,
          isComplete: true,
        },
      ]);
      playDocumentReadyChime();
      setIsEditMode(true);
      setMobileViewTab('preview');
      showToast('✓ ഗൾഫ് CV / Resume സാമ്പിൾ ഇംഗ്ലീഷിൽ തയ്യാറായി! വലതുവശത്തെ ഷീറ്റിൽ കാണാം.');
      return;
    }

    const isRentSampleQuery =
      /\b(rent\s*(agreement|karar|sample|format)|vadaka\s*karar\s*(sample|format|mathruka))\b/i.test(
        normUserPrompt
      ) ||
      normUserPrompt.includes('വാടക കരാർ സാമ്പിൾ') ||
      normUserPrompt.includes('വാടക കരാർ മാതൃക');

    if (isRentSampleQuery && !cleanedInput.includes('\n') && cleanedInput.split(/\s+/).length <= 5) {
      setShowDirectPdfCanvas(false);
      setActiveCategory('rental_agreement');
      const agQuestions = buildEditableQuestionsForDocument(
        'rental_agreement',
        letterData,
        gulfCvData,
        agreementData,
        markListData
      );
      setFollowUpQuestions(agQuestions);
      setFollowUpAnswerInputs({});
      const replyMsg =
        '🏠 കേരളത്തിലെ ഔദ്യോഗിക വീട് / കടമുറി വാടക കരാർ മാതൃക തയ്യാറായിട്ടുണ്ട്! കക്ഷികളുടെ വിവരങ്ങളും നിബന്ധനകളും തിരുത്താം.';
      setAssistantBannerMessage(replyMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-ag-sample-${Date.now()}`,
          sender: 'bot',
          text: replyMsg,
          timestamp: nowTime,
          documentCategory: 'rental_agreement',
          followUpQuestions: agQuestions,
          isComplete: true,
        },
      ]);
      playDocumentReadyChime();
      setIsEditMode(true);
      setMobileViewTab('preview');
      showToast('✓ വാടക കരാർ മാതൃക തയ്യാറായി!');
      return;
    }

    // Instant client-side check 2: Official Kerala Government / Akshaya Forms & Smart Voice Entity Filler
    // For short queries (<= 3 words) or structured follow-up replies, complete immediately in 0.1s.
    // For longer spoken sentences (> 3 words, e.g. "എന്റെ പേര് അബ്ദുറഹ്മാൻ, മഞ്ചേരിയിലാണ് വീട്, പ്ലാവ് മുറിക്കാൻ പഞ്ചായത്തിലേക്ക് അപേക്ഷ വേണം"),
    // ALSO populate the A4 sheet immediately in < 0.1s as an instant preview so the user never waits on slow networks!
    const promptWordCount = cleanedInput.split(/\s+/).filter(Boolean).length;
    const isStructuredFollowUpReply =
      cleanedInput.includes(':') &&
      activeCategory === 'malayalam_letter' &&
      Boolean(letterData.structuredFields && letterData.structuredFields.length > 0);

    if (requestedLang !== 'en') {
      const govFormMatch = matchGovFormFromPrompt(
        cleanedInput,
        activeCategory === 'malayalam_letter' ? letterData : null
      );
      if (govFormMatch) {
        const convertedLetter = applyLocalLanguageConversionToLetter(
          govFormMatch.letterData,
          requestedLang
        );
        const questionsForLetter = buildEditableQuestionsForLetter(convertedLetter);
        setShowDirectPdfCanvas(false);
        setActiveCategory('malayalam_letter');
        setLetterData(convertedLetter);
        setFollowUpQuestions(questionsForLetter);
        setFollowUpAnswerInputs({});

        if (promptWordCount <= 3 || isStructuredFollowUpReply || govFormMatch.isComplete) {
          if (requestedLang !== 'ml') {
            translateActiveDocumentViaServer({
              category: 'malayalam_letter',
              targetLanguage: requestedLang,
              letterData: convertedLetter,
              gulfCvData,
              agreementData,
              markListData,
            })
              .then((trData) => {
                if (trData.letterData) {
                  setLetterData(trData.letterData);
                }
              })
              .catch(() => {});
          }

          setAssistantBannerMessage(govFormMatch.assistantReplyMalayalam);
          setChatMessages((prev) => [
            ...prev,
            {
              id: `bot-gov-${Date.now()}`,
              sender: 'bot',
              text: govFormMatch.assistantReplyMalayalam,
              timestamp: nowTime,
              documentCategory: 'malayalam_letter',
              followUpQuestions: questionsForLetter,
              subFormPromptTitle: govFormMatch.subFormPromptTitle,
              subFormOptions: govFormMatch.subFormOptions,
              isComplete: govFormMatch.isComplete,
            },
          ]);
          playDocumentReadyChime();
          setIsEditMode(true);
          showToast(
            `✨ "${convertedLetter.documentHeading}" തയ്യാറായി! വാട്സാപ്പ് കോളങ്ങളിലോ A4 പേപ്പറിലോ തിരുത്താം.`
          );
          return;
        }
      }
    }

    setIsGenerating(true);

    try {
      const recentHistory = chatMessages.slice(-6).map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      const response = await fetch('/api/generate-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanedInput,
          preferredCategory,
          outputLanguage: requestedLang,
          currentDocument: {
            letterData,
            gulfCvData,
            agreementData,
            markListData,
          },
          conversationHistory: recentHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generate API HTTP ${response.status}`);
      }
      const data = await response.json();
      applyAiDocumentResult(data);
    } catch {
      // Category-aware deterministic client-side fallback so Rental Agreement, Gulf CV, Mark List, and School/Gov forms
      // NEVER get overwritten into a generic "ഔദ്യോഗിക അപേക്ഷ" when offline or when serverless API is unavailable!
      const effectiveTargetCat: DocumentCategory =
        preferredCategory !== 'auto'
          ? preferredCategory
          : /\b(rent|rental|agreement|affidavit|vadaka|karar)\b|വാടക|കരാർ|മുദ്രപ്പത്രം|സത്യവാങ്മൂലം/i.test(
              cleanedInput
            )
          ? 'rental_agreement'
          : /\b(cv|resume|biodata|visa|passport)\b|സിവി|ബയോഡാറ്റ|റെസ്യൂം|റെസ്യൂമെ/i.test(cleanedInput)
          ? 'gulf_cv'
          : /\b(mark\s*list|attendance|grade\s*sheet)\b|മാർക്ക്\s*ലിസ്റ്റ്|ഹാജർ\s*പട്ടിക|ഗ്രേഡ്\s*പട്ടിക/i.test(
              cleanedInput
            )
          ? 'teacher_marklist'
          : activeCategory;

      if (effectiveTargetCat === 'rental_agreement') {
        const nextAg: RentalAgreementData = {
          ...agreementData,
          clauses: [...(agreementData.clauses || INITIAL_AGREEMENT_DATA.clauses)],
          witnesses: [...(agreementData.witnesses || INITIAL_AGREEMENT_DATA.witnesses)],
        };
        if (/സത്യവാങ്മൂലം|affidavit/i.test(cleanedInput)) {
          nextAg.subType = 'സത്യവാങ്മൂലം (Affidavit)';
          nextAg.titleMalayalam = 'സത്യവാങ്മൂലം (AFFIDAVIT)';
        }
        const rentMatch = cleanedInput.match(
          /(?:മാസവാടക|വാടക|rent)\s*[:\-]?\s*₹?\s*([\d,]{3,9})/i
        );
        const advMatch = cleanedInput.match(
          /(?:അഡ്വാൻസ്|advance|deposit)\s*[:\-]?\s*₹?\s*([\d,]{3,9})/i
        );
        const allNums = Array.from(cleanedInput.matchAll(/\b(\d{4,7})\b/g)).map((m) => m[1]);
        const rentVal = rentMatch ? rentMatch[1].replace(/,/g, '') : allNums[0];
        const advVal = advMatch ? advMatch[1].replace(/,/g, '') : allNums[1];

        if (rentVal && nextAg.clauses.length > 0) {
          const formattedRent = Number(rentVal).toLocaleString('en-IN');
          nextAg.clauses[0] = `1. ടി കെട്ടിടത്തിന് പ്രതിമാസം ₹${formattedRent}/- വാടക നിശ്ചയിച്ചിട്ടുള്ളതും, ആയത് എല്ലാ ഇംഗ്ലീഷ് മാസവും 5-ാം തീയതിക്കകം രണ്ടാം കക്ഷി ഒന്നാം കക്ഷിക്ക് നൽകി രസീത് വാങ്ങേണ്ടതുമാകുന്നു.`;
        }
        if (advVal && nextAg.clauses.length > 1) {
          const formattedAdv = Number(advVal).toLocaleString('en-IN');
          nextAg.clauses[1] = `2. വാടക ഉറപ്പിലേക്കായി പലിശയില്ലാത്ത അഡ്വാൻസ് തുകയായി ₹${formattedAdv}/- രണ്ടാം കക്ഷി ഇന്ന് ഒന്നാം കക്ഷിയെ ഏൽപ്പിച്ചിട്ടുള്ളതും, കരാർ കാലാവധി കഴിഞ്ഞ് കെട്ടിടം ഒഴിയുമ്പോൾ വാടക കുടിശ്ശികയോ കേടുപാടുകളോ ഉണ്ടെങ്കിൽ ആയത് കിഴിച്ച് ബാക്കി തുക തിരികെ നൽകുന്നതുമാകുന്നു.`;
        }
        const lines = cleanedInput.split(/\r?\n/);
        for (const line of lines) {
          const kv = line.match(/^([^:]+):\s*(.+)$/);
          if (!kv) continue;
          const k = kv[1].trim();
          const v = kv[2].trim();
          if (/ഒന്നാം കക്ഷി|ഉടമ|owner|landlord|first/i.test(k)) nextAg.firstPartyDetails = v;
          else if (/രണ്ടാം കക്ഷി|വാടകക്കാരൻ|tenant|second/i.test(k)) nextAg.secondPartyDetails = v;
          else if (/സ്ഥലം|place/i.test(k)) nextAg.executionPlace = v;
          else if (/വസ്തു|കെട്ടിട|property|schedule/i.test(k)) nextAg.schedulePropertyDetails = v;
        }
        applyAiDocumentResult({
          detectedType: 'rental_agreement',
          documentUpdated: true,
          isComplete: true,
          assistantReplyMalayalam:
            '✅ നിങ്ങൾ നൽകിയ വിവരങ്ങൾ ചേർത്ത് വാടക കരാർ (Rental Agreement) A4 ഷീറ്റിൽ പുതുക്കിയിട്ടുണ്ട്! താഴെ കാണുന്ന കോളങ്ങളിലോ A4 പേപ്പറിലോ വിവരങ്ങൾ തിരുത്താം.',
          followUpQuestions: buildEditableQuestionsForDocument(
            'rental_agreement',
            letterData,
            gulfCvData,
            nextAg,
            markListData
          ),
          agreementData: nextAg,
        });
      } else if (effectiveTargetCat === 'gulf_cv') {
        const parsedCv = parseStructuredCvFromText(cleanedInput, gulfCvData);
        const nextCv: GulfCvData = parsedCv.gulfCvData
          ? { ...gulfCvData, ...parsedCv.gulfCvData, photoDataUrl: gulfCvData.photoDataUrl || '' }
          : { ...gulfCvData };
        const lines = cleanedInput.split(/\r?\n/);
        for (const line of lines) {
          const kv = line.match(/^([^:]+):\s*(.+)$/);
          if (!kv) continue;
          const k = kv[1].trim();
          const v = kv[2].trim();
          if (/പേര്|name/i.test(k)) nextCv.fullName = v;
          else if (/തസ്തിക|ജോലി|role|job|title|position/i.test(k)) nextCv.jobTitle = v;
          else if (/ഫോൺ|മൊബൈൽ|phone|mobile/i.test(k)) nextCv.phone = v;
          else if (/ഇമെയിൽ|email/i.test(k)) nextCv.email = v;
          else if (/സ്ഥലം|വിലാസം|location|address/i.test(k)) nextCv.currentLocation = v;
        }
        applyAiDocumentResult({
          detectedType: 'gulf_cv',
          documentUpdated: true,
          isComplete: true,
          assistantReplyMalayalam:
            '✅ നിങ്ങൾ നൽകിയ വിവരങ്ങൾ ചേർത്ത് സിവി (CV / Resume) A4 ഷീറ്റിൽ പുതുക്കിയിട്ടുണ്ട്!',
          followUpQuestions: buildEditableQuestionsForDocument(
            'gulf_cv',
            letterData,
            nextCv,
            agreementData,
            markListData
          ),
          gulfCvData: nextCv,
        });
      } else if (effectiveTargetCat === 'teacher_marklist') {
        const nextMl: TeacherMarkListData = { ...markListData };
        const lines = cleanedInput.split(/\r?\n/);
        for (const line of lines) {
          const kv = line.match(/^([^:]+):\s*(.+)$/);
          if (!kv) continue;
          const k = kv[1].trim();
          const v = kv[2].trim();
          if (/സ്കൂൾ|മദ്രസ|school|institution/i.test(k)) nextMl.schoolName = v;
          else if (/ക്ലാസ്|ഡിവിഷൻ|class/i.test(k)) nextMl.classAndDivision = v;
          else if (/പരീക്ഷ|exam|title/i.test(k)) nextMl.examTitle = v;
          else if (/ടീച്ചർ|ഉസ്താദ്|teacher/i.test(k)) nextMl.classTeacherName = v;
        }
        applyAiDocumentResult({
          detectedType: 'teacher_marklist',
          documentUpdated: true,
          isComplete: true,
          assistantReplyMalayalam:
            '✅ നിങ്ങൾ നൽകിയ വിവരങ്ങൾ ചേർത്ത് മാർക്ക് ലിസ്റ്റ് പുതുക്കിയിട്ടുണ്ട്!',
          followUpQuestions: buildEditableQuestionsForDocument(
            'teacher_marklist',
            letterData,
            gulfCvData,
            agreementData,
            nextMl
          ),
          markListData: nextMl,
        });
      } else {
        const fallbackGovMatch = matchGovFormFromPrompt(
          cleanedInput,
          activeCategory === 'malayalam_letter' ? letterData : null
        );
        if (fallbackGovMatch) {
          applyAiDocumentResult({
            detectedType: 'malayalam_letter',
            documentUpdated: true,
            isComplete: fallbackGovMatch.isComplete,
            assistantReplyMalayalam: fallbackGovMatch.assistantReplyMalayalam,
            followUpQuestions: fallbackGovMatch.followUpQuestions,
            subFormPromptTitle: fallbackGovMatch.subFormPromptTitle,
            subFormOptions: fallbackGovMatch.subFormOptions,
            letterData: fallbackGovMatch.letterData,
          });
        } else {
          const customFallbackLetter: MalayalamLetterData = {
            ...letterData,
            documentHeading: letterData.documentHeading || 'ഔദ്യോഗിക അപേക്ഷ',
            letterLayoutVariant: letterData.letterLayoutVariant || 'official_letter',
            subject:
              letterData.subject ||
              'അടിയന്തര നടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള അപേക്ഷ.',
            bodyParagraphs: [
              `മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പറയുന്ന വിഷയം അങ്ങയുടെ ശ്രദ്ധയിൽപ്പെടുത്തുന്നു: ${cleanedInput}`,
              'ഈ വിഷയത്തിൽ അടിയന്തരമായി രേഖകൾ പരിശോധിച്ച് അനുയോജ്യമായ നടപടി സ്വീകരിക്കണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
            ],
            date: new Date().toLocaleDateString('ml-IN'),
          };
          applyAiDocumentResult({
            detectedType: 'malayalam_letter',
            documentUpdated: true,
            isComplete: false,
            assistantReplyMalayalam:
              '✅ നിങ്ങൾ നൽകിയ വിവരങ്ങൾ ചേർത്ത് A4 അപേക്ഷ തയ്യാറായിട്ടുണ്ട്! താഴെ കാണുന്ന കോളങ്ങളിലോ A4 പേപ്പറിൽ നേരിട്ടോ വിവരങ്ങൾ തിരുത്താം.',
            followUpQuestions: buildEditableQuestionsForLetter(customFallbackLetter),
            letterData: customFallbackLetter,
          });
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // True WhatsApp-Style Voice Note Recorder & Audio File Uploader Hook
  const {
    isRecording,
    formattedTimer,
    liveTranscript,
    startRecording,
    finishAndSendRecording,
    cancelRecording,
    processUploadedAudioFile,
  } = useMalayalamVoice({
    onAudioReady: handleProcessAudioPayload,
    onError: (errMsg) => {
      showToast(errMsg);
      if (
        errMsg.includes('മൈക്രോഫോൺ') ||
        errMsg.toLowerCase().includes('allow') ||
        errMsg.toLowerCase().includes('permission')
      ) {
        setIsMicHelpModalOpen(true);
      }
    },
  });

  // Handle Follow-up Form Submission in Studio Mode
  const handleFollowUpAnswersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const combinedAnswers = followUpQuestions
      .map((q) => {
        const val = followUpAnswerInputs[q.id]?.trim();
        return val ? `${q.fieldLabelMalayalam}: ${val}` : '';
      })
      .filter(Boolean)
      .join('\n');

    if (!combinedAnswers) return;
    handleGenerateOrRefine(combinedAnswers, activeCategory);
  };

  // Handle Photo Upload for Gulf CV
  const handleUploadCvPhoto = (photoDataUrl: string) => {
    setGulfCvData((prev) => ({ ...prev, photoDataUrl }));
    setActiveCategory('gulf_cv');
    setChatMessages((prev) => [
      ...prev,
      {
        id: `photo-${Date.now()}`,
        sender: 'user',
        text: 'എന്റെ പാസ്പോർട്ട് സൈസ് ഫോട്ടോ ഗൾഫ് സിവിയിലേക്ക് ചേർത്തിട്ടുണ്ട്.',
        photoUrl: photoDataUrl,
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      {
        id: `bot-photo-${Date.now()}`,
        sender: 'bot',
        text: 'നിങ്ങളുടെ ഫോട്ടോ ഗൾഫ് ബയോഡാറ്റ (CV) A4 ഷീറ്റിൽ കൃത്യമായി ചേർത്തിട്ടുണ്ട്!',
        timestamp: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        documentCategory: 'gulf_cv',
        isComplete: true,
      },
    ]);
    showToast('ഫോട്ടോ ഗൾഫ് സിവിയിൽ ചേർത്തു!');
  };

  // Execute Final Download / Print / WhatsApp Share
  const executeOutputAction = async (
    actionType: 'download' | 'download_ats' | 'print' | 'whatsapp',
    targetPhone?: string
  ) => {
    if (actionType === 'print') {
      window.print();
      return;
    }

    if (actionType === 'whatsapp') {
      await shareDocumentOnWhatsApp(
        sheetRef.current,
        activeCategory,
        letterData,
        gulfCvData,
        agreementData,
        markListData,
        targetPhone
      );
      return;
    }

    if (!sheetRef.current) return;
    setIsDownloadingPdf(true);
    try {
      const titleBase =
        activeCategory === 'gulf_cv'
          ? `Gulf_CV_${gulfCvData.fullName}`
          : activeCategory === 'rental_agreement'
          ? agreementData.titleMalayalam
          : activeCategory === 'teacher_marklist'
          ? `MarkList_${markListData.classAndDivision}`
          : letterData.documentHeading;
      await generateAndDownloadA4Pdf(sheetRef.current, titleBase, {
        autoFitOnePage: activeCategory === 'gulf_cv' ? true : autoFitOnePage,
        mode: actionType === 'download_ats' ? 'ats_vector' : 'print_hd',
        category: activeCategory,
        gulfCvData,
      });
      showToast(
        actionType === 'download_ats'
          ? 'ATS Vector A4 PDF ഫയൽ ഡൗൺലോഡ് ആയി!'
          : '✓ A4 PDF ഫയൽ നിങ്ങളുടെ ഫോണിൽ/കമ്പ്യൂട്ടറിൽ ഡൗൺലോഡ് ആയി!'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const proceedAfterCompletenessCheck = (
    actionType: 'download' | 'download_ats' | 'print' | 'whatsapp',
    targetPhone?: string
  ) => {
    if (!ownerConfig.freeModeEnabled && !isUnlocked) {
      setPendingActionAfterPay(actionType);
      setPendingTargetPhone(targetPhone);
      setIsPaymentModalOpen(true);
      return;
    }
    executeOutputAction(actionType, targetPhone);
  };

  // Pre-Print / Pre-PDF Required Details Completeness Check State
  const [missingFieldsList, setMissingFieldsList] = useState<MissingFieldItem[]>([]);
  const [missingFieldDrafts, setMissingFieldDrafts] = useState<Record<string, string>>({});
  const [pendingOutputAction, setPendingOutputAction] = useState<
    'download' | 'download_ats' | 'print' | 'whatsapp'
  >('download');
  const [pendingTargetPhone, setPendingTargetPhone] = useState<string | undefined>(undefined);

  // Akshaya & Government Form Master Search State
  const [govFormSearchQuery, setGovFormSearchQuery] = useState<string>('');
  const [selectedGovCategory, setSelectedGovCategory] = useState<GovFormCategoryKey>('all');

  const sanitizeUnfilledPlaceholdersForOutput = () => {
    const cleanPlaceholderText = (text: string, dots = '........................................') => {
      if (!text) return dots;
      if (/^ഉദാ\s*:/i.test(text.trim())) return dots;
      return text.replace(/\[[^\]]+\]/g, dots);
    };

    if (activeCategory === 'malayalam_letter') {
      let changed = false;
      const nextLetter: MalayalamLetterData = {
        ...letterData,
        structuredFields: letterData.structuredFields
          ? letterData.structuredFields.map((f) => {
              const rawVal = (f.value || '').trim();
              if (!rawVal || /^ഉദാ\s*:/i.test(rawVal) || /\[[^\]]+\]/.test(rawVal)) {
                changed = true;
                return {
                  ...f,
                  value: rawVal ? cleanPlaceholderText(rawVal, '....................................') : '....................................',
                };
              }
              return f;
            })
          : letterData.structuredFields,
      };

      if (isPlaceholderOrEmpty(nextLetter.senderName)) {
        nextLetter.senderName = '........................................';
        changed = true;
      } else if (/\[[^\]]+\]/.test(nextLetter.senderName)) {
        nextLetter.senderName = cleanPlaceholderText(nextLetter.senderName);
        changed = true;
      }

      if (isPlaceholderOrEmpty(nextLetter.senderAddress)) {
        nextLetter.senderAddress = '........................................';
        changed = true;
      } else if (/\[[^\]]+\]/.test(nextLetter.senderAddress)) {
        nextLetter.senderAddress = cleanPlaceholderText(nextLetter.senderAddress);
        changed = true;
      }

      if (nextLetter.senderPhone && (/\[[^\]]+\]/.test(nextLetter.senderPhone) || /^ഉദാ\s*:/i.test(nextLetter.senderPhone.trim()))) {
        nextLetter.senderPhone = '';
        changed = true;
      }

      if (isPlaceholderOrEmpty(nextLetter.recipientOffice)) {
        nextLetter.recipientOffice = '........................................';
        changed = true;
      } else if (/\[[^\]]+\]/.test(nextLetter.recipientOffice)) {
        nextLetter.recipientOffice = cleanPlaceholderText(nextLetter.recipientOffice);
        changed = true;
      }

      if (nextLetter.recipientPlace && /\[[^\]]+\]/.test(nextLetter.recipientPlace)) {
        nextLetter.recipientPlace = cleanPlaceholderText(nextLetter.recipientPlace, '........................');
        changed = true;
      }

      if (nextLetter.place && /\[[^\]]+\]/.test(nextLetter.place)) {
        nextLetter.place = cleanPlaceholderText(nextLetter.place, '........................');
        changed = true;
      }

      if (nextLetter.bodyParagraphs && nextLetter.bodyParagraphs.some((p) => /\[[^\]]+\]/.test(p))) {
        nextLetter.bodyParagraphs = nextLetter.bodyParagraphs.map((p) =>
          cleanPlaceholderText(p, '........................')
        );
        changed = true;
      }

      if (changed) {
        setLetterData(nextLetter);
      }
    } else if (activeCategory === 'rental_agreement') {
      let changed = false;
      const nextAg = { ...agreementData };
      if (isPlaceholderOrEmpty(nextAg.firstPartyDetails) || /\[[^\]]+\]/.test(nextAg.firstPartyDetails)) {
        nextAg.firstPartyDetails = cleanPlaceholderText(
          nextAg.firstPartyDetails || '',
          '................................................................................'
        );
        changed = true;
      }
      if (isPlaceholderOrEmpty(nextAg.secondPartyDetails) || /\[[^\]]+\]/.test(nextAg.secondPartyDetails)) {
        nextAg.secondPartyDetails = cleanPlaceholderText(
          nextAg.secondPartyDetails || '',
          '................................................................................'
        );
        changed = true;
      }
      if (changed) {
        setAgreementData(nextAg);
      }
    }
  };

  const [preBlankSnapshot, setPreBlankSnapshot] = useState<{
    category: DocumentCategory;
    letterData: MalayalamLetterData;
    agreementData: RentalAgreementData;
    markListData: TeacherMarkListData;
    gulfCvData: GulfCvData;
  } | null>(null);

  const handleRestoreSampleFromBlankForm = () => {
    if (!preBlankSnapshot) return;
    setLetterData(preBlankSnapshot.letterData);
    setAgreementData(preBlankSnapshot.agreementData);
    setMarkListData(preBlankSnapshot.markListData);
    setGulfCvData(preBlankSnapshot.gulfCvData);
    setPreBlankSnapshot(null);
    showToast('↺ സാമ്പിൾ വിവരങ്ങൾ (Sample Form) തിരികെ കൊണ്ടുവന്നു!');
  };

  const handleConvertToBlankHandFillableForm = () => {
    setPreBlankSnapshot({
      category: activeCategory,
      letterData: JSON.parse(JSON.stringify(letterData)),
      agreementData: JSON.parse(JSON.stringify(agreementData)),
      markListData: JSON.parse(JSON.stringify(markListData)),
      gulfCvData: JSON.parse(JSON.stringify(gulfCvData)),
    });

    const dots = '........................................';
    const shortDots = '........................';

    const sanitizeBodyParagraphForBlankForm = (text: string): string => {
      return text
        .replace(/\[[^\]]+\]/g, shortDots)
        .replace(/അർജുൻ\s*വിജയനെ?/g, shortDots)
        .replace(/അർജുൻ\s*വി\.?/g, shortDots)
        .replace(/വിജയൻ\s*കെ\.?/g, shortDots)
        .replace(/ആദിത്യൻ\s*കെ\.?/g, shortDots)
        .replace(/അനന്യ\s*ആർ\.?/g, shortDots)
        .replace(/ശ്രീമതി\.\s*രാധിക\s*കെ\.?/g, shortDots)
        .replace(/ശ്രീമതി\.\s*സുജാത\s*ടീച്ചർ/g, shortDots)
        .replace(/രാഹുൽ\s*നായർ/g, shortDots)
        .replace(/\(അഡ്മിഷൻ\s*നമ്പർ\s*:\s*[^)]+\)/g, '(അഡ്മിഷൻ നമ്പർ: ................)')
        .replace(
          /\(റോൾ\s*നമ്പർ\s*:\s*\d+\s*,\s*അഡ്മിഷൻ\s*നമ്പർ\s*:\s*[^)]+\)/g,
          '(റോൾ നമ്പർ: .........., അഡ്മിഷൻ നമ്പർ: ................)'
        )
        .replace(
          /(?:ആറാം|ഏഴാം|എട്ടാം|ഒമ്പതാം|പത്താം|അഞ്ചാം)\s*ക്ലാസ്(?:\s*[A-Z]\s*ഡിവിഷ(?:നിൽ|ൻ))?/g,
          '.................. ക്ലാസ് ....... ഡിവിഷൻ'
        )
        .replace(/എറണാകുളത്തേക്ക്/g, '........................-ലേക്ക്')
        .replace(/12\s*ദിവസത്തെ/g, '........ ദിവസത്തെ')
        .replace(/98470\s*\d{5}/g, shortDots);
    };

    if (activeCategory === 'malayalam_letter') {
      const cleanedRecipientOffice = /സെന്റ് തോമസ്|ഗവ\.\s*മോഡൽ|മലബാർ ട്രേഡേഴ്സ്/.test(
        letterData.recipientOffice
      )
        ? dots
        : letterData.recipientOffice.replace(
            /,\s*(?:തൃശ്ശൂർ|കോഴിക്കോട്|എറണാകുളം|തിരുവനന്തപുരം|മലപ്പുറം|പാലക്കാട്|കണ്ണൂർ)\.?\s*$/g,
            `, ${shortDots}`
          );

      const nextLetter: MalayalamLetterData = {
        ...letterData,
        senderName: dots,
        senderAddress: dots,
        senderPhone: shortDots,
        recipientOffice: cleanedRecipientOffice,
        recipientPlace: shortDots,
        recipientTitle:
          letterData.letterLayoutVariant === 'project_cover' ? dots : letterData.recipientTitle,
        parentOrGuardianName: letterData.parentOrGuardianName
          ? dots
          : letterData.parentOrGuardianName,
        place: shortDots,
        date: shortDots,
        bodyParagraphs: (letterData.bodyParagraphs || []).map(sanitizeBodyParagraphForBlankForm),
        structuredFields: letterData.structuredFields
          ? letterData.structuredFields.map((f) => ({
              ...f,
              value: '....................................',
            }))
          : letterData.structuredFields,
      };
      setLetterData(nextLetter);
    } else if (activeCategory === 'rental_agreement') {
      setAgreementData({
        ...agreementData,
        executionPlace: shortDots,
        executionDate: shortDots,
        firstPartyDetails:
          'പേര്: ........................................, വയസ്സ്: ......, പിതാവ്: ........................................, വീട്ടുപേര്: ........................................, സ്ഥലം: ........................, ഫോൺ: ........................',
        secondPartyDetails:
          'പേര്: ........................................, വയസ്സ്: ......, പിതാവ്: ........................................, വീട്ടുപേര്: ........................................, സ്ഥലം: ........................, ഫോൺ: ........................',
        clauses: (agreementData.clauses || []).map((cl) =>
          cl
            .replace(
              /₹\s*[\d,]+\/-\s*(?:\([^)]+\))?/g,
              '₹................/- (................................................ രൂപ മാത്രം)'
            )
            .replace(/\d+-ാം\s*തീയതിക്കകം/g, '......-ാം തീയതിക്കകം')
        ),
        schedulePropertyDetails:
          'ജില്ല: ........................, താലൂക്ക്: ........................, വില്ലേജ്: ........................, പഞ്ചായത്ത്/നഗരസഭ: ...................................., വാർഡ് നമ്പർ: ........., കെട്ടിട നമ്പർ: .................., വിസ്തീർണ്ണം: .................. ച.അടി.',
        witnesses: [
          '1. പേര് & വിലാസം: ............................................................ (ഒപ്പ്: ...........................)',
          '2. പേര് & വിലാസം: ............................................................ (ഒപ്പ്: ...........................)',
        ],
      });
    } else if (activeCategory === 'teacher_marklist') {
      setMarkListData({
        ...markListData,
        schoolName: '........................................................................',
        classAndDivision: 'ക്ലാസ് & ഡിവിഷൻ : ........................',
        classTeacherName: '................................................',
        place: shortDots,
        date: shortDots,
        showSummaryBox: false,
        showSummaryCards: false,
        students: markListData.students.map((st, idx) => ({
          ...st,
          rollNo: String(idx + 1),
          studentName: '',
          marks: markListData.subjects.map(() => -1),
          subjectGrades: markListData.subjects.map(() => ''),
          totalOverride: '',
          percentageOverride: '',
          overallGradeOverride: '',
          rankOverride: '',
          remarks: '',
        })),
      });
    }
    showToast(
      '✓ വ്യക്തിഗത വിവരങ്ങൾ ഒഴിവാക്കി പേന കൊണ്ട് എഴുതി പൂരിപ്പിക്കാവുന്ന കാലി ഫോം (Blank Form) റെഡി! തിരികെ മാറ്റാൻ "↺ സാമ്പിൾ ഫോം" അമർത്താം.'
    );
  };

  const triggerProtectedAction = (
    actionType: 'download' | 'download_ats' | 'print' | 'whatsapp',
    targetPhone?: string
  ) => {
    // All personal details are 100% OPTIONAL. Never force or block users from printing/downloading a blank form.
    // Automatically convert any remaining bracketed placeholders into clean hand-fillable dotted lines.
    sanitizeUnfilledPlaceholdersForOutput();
    setTimeout(() => {
      proceedAfterCompletenessCheck(actionType, targetPhone);
    }, 60);
  };

  const handleSaveMissingFieldsAndProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCategory === 'malayalam_letter') {
      let nextLetter: MalayalamLetterData = {
        ...letterData,
        structuredFields: letterData.structuredFields
          ? letterData.structuredFields.map((f) => ({ ...f }))
          : letterData.structuredFields,
      };
      if (missingFieldDrafts.senderName?.trim()) {
        nextLetter.senderName = missingFieldDrafts.senderName.trim();
        if (nextLetter.structuredFields && nextLetter.structuredFields.length > 0) {
          nextLetter.structuredFields[0].value = nextLetter.senderName;
        }
      }
      if (missingFieldDrafts.recipientOffice?.trim()) {
        nextLetter.recipientOffice = missingFieldDrafts.recipientOffice.trim();
      }
      if (missingFieldDrafts.senderAddress?.trim()) {
        nextLetter.senderAddress = missingFieldDrafts.senderAddress.trim();
      }
      if (nextLetter.recipientPlace.includes('[')) {
        nextLetter.recipientPlace = 'കേരളം.';
      }
      if (nextLetter.senderPhone.includes('[')) {
        nextLetter.senderPhone = '';
      }
      nextLetter = applyLocalLanguageConversionToLetter(nextLetter, outputLanguage);
      setLetterData(nextLetter);
    } else if (activeCategory === 'rental_agreement') {
      const nextAg = { ...agreementData };
      if (missingFieldDrafts.firstParty?.trim()) {
        nextAg.firstPartyDetails = missingFieldDrafts.firstParty.trim();
      }
      if (missingFieldDrafts.secondParty?.trim()) {
        nextAg.secondPartyDetails = missingFieldDrafts.secondParty.trim();
      }
      setAgreementData(nextAg);
    }

    setIsMissingFieldsModalOpen(false);
    setTimeout(() => {
      proceedAfterCompletenessCheck(pendingOutputAction, pendingTargetPhone);
    }, 120);
  };

  const handleSelectGovForm = (form: GovFormTemplate, stayInChat = false) => {
    setPreBlankSnapshot(null);
    const converted = convertGovFormToLetterData(form);
    const questions = buildEditableQuestionsForLetter(converted);
    setShowDirectPdfCanvas(false);
    setIsPdfEditSession(false);
    setSheetOverlayItems([]);
    setSheetTool('select_edit');
    setIsEditMode(true);
    setShowTopExamplesDrawer(false);
    setActiveCategory('malayalam_letter');
    setLetterData(converted);
    setFollowUpQuestions(questions);
    setFollowUpAnswerInputs({});

    const nowTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const botGovMsg: ChatMessage = {
      id: `bot-gov-${Date.now()}`,
      sender: 'bot',
      text: `🏛️ "${form.titleMalayalam}" ഔദ്യോഗിക ഫോം തുറന്നിട്ടുണ്ട് (${form.portalName}).\n\n• ഫോം കോഡ്: ${form.formCode}\n• സമർപ്പിക്കേണ്ട ഓഫീസ്: ${form.recipientOffice}\n\n• വാട്സാപ്പ് മോഡിൽ: താഴെ ലിസ്റ്റ് ചെയ്തിരിക്കുന്ന ഓരോ കോളത്തിലും നിങ്ങളുടെ വിവരങ്ങൾ നേരിട്ട് ടൈപ്പ് ചെയ്യുകയോ 🎙️ വോയ്‌സ് ബട്ടൺ അമർത്തി പറയുകയോ ചെയ്യാം.\n• പേപ്പർ മോഡിൽ: വലതുവശത്തെ A4 ഷീറ്റിൽ നേരിട്ട് തൊട്ടും തിരുത്താം!`,
      timestamp: nowTime,
      documentCategory: 'malayalam_letter',
      followUpQuestions: questions,
      isComplete: true,
    };
    setChatMessages((prev) => [...prev, botGovMsg]);

    if (!stayInChat) {
      switchToPreview(true);
    }
    showToast(
      `✓ "${form.titleMalayalam}" ഫോം തുറന്നു! വാട്സാപ്പ് കോളങ്ങളിലോ A4 പേപ്പറിലോ തിരുത്താം.`
    );
  };

  const filteredGovForms = KERALA_GOV_FORMS_MASTER.filter((form) => {
    const matchesCat =
      selectedGovCategory === 'all' || form.categoryKey === selectedGovCategory;
    if (!matchesCat) return false;
    return matchesGovFormSearch(form, govFormSearchQuery);
  });

  // Top Unified Search Results (searches BOTH KERALA_GOV_FORMS_MASTER + QUICK_TEMPLATES)
  const unifiedQuery = topUnifiedSearch.toLowerCase().trim();
  const topMatchedGovForms = KERALA_GOV_FORMS_MASTER.filter((form) => {
    if (topFilterGroup !== 'all' && topFilterGroup !== 'gov') {
      if (topFilterGroup === 'madrasa') {
        if (!form.id.startsWith('madrasa-')) return false;
      } else if (topFilterGroup === 'school') {
        if (
          form.id !== 'kppha-school-tc-admission' &&
          form.id !== 'school-student-leave-letter' &&
          form.id !== 'service-ksr-leave-application' &&
          !form.id.startsWith('school-')
        )
          return false;
      } else if (form.categoryKey !== topFilterGroup) {
        return false;
      }
    }
    return matchesGovFormSearch(form, topUnifiedSearch);
  });

  const topMatchedQuickTemplates = QUICK_TEMPLATES.filter((tpl) => {
    if (topFilterGroup !== 'all' && topFilterGroup !== 'citizen') {
      if (
        topFilterGroup === 'madrasa' &&
        tpl.subGroup !== 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)' &&
        !tpl.markListPresetId?.startsWith('madrasa-')
      )
        return false;
      if (
        topFilterGroup === 'school' &&
        tpl.subGroup !== 'സ്കൂൾ & കുട്ടികൾ (School)' &&
        tpl.category !== 'teacher_marklist'
      )
        return false;
      if (topFilterGroup === 'resignation' && tpl.subGroup !== 'രാജിക്കത്ത് & സ്ഥാപനം') return false;
      if (topFilterGroup === 'cv_agreement' && tpl.category !== 'gulf_cv' && tpl.category !== 'rental_agreement') return false;
      if (['edistrict', 'ksmart', 'ksr_service', 'mvd_ration_welfare'].includes(topFilterGroup)) return false;
    }
    if (!unifiedQuery) return true;
    return (
      tpl.titleMalayalam.toLowerCase().includes(unifiedQuery) ||
      tpl.subtitleMalayalam.toLowerCase().includes(unifiedQuery) ||
      tpl.badgeText.toLowerCase().includes(unifiedQuery) ||
      tpl.subGroup.toLowerCase().includes(unifiedQuery) ||
      tpl.sampleVoicePrompt.toLowerCase().includes(unifiedQuery)
    );
  });

  const handlePaymentVerified = (
    method: 'UPI_QR' | 'AKSHAYA_PIN' | 'FREE_CITIZEN',
    amount: number
  ) => {
    setIsUnlocked(true);
    setIsPaymentModalOpen(false);
    setCustomPaymentAmountOverride(null);

    if (isBatchCartPaymentFlow) {
      setIsBatchCartPaymentFlow(false);
      setCartItems((prev) =>
        prev.map((item) => ({
          ...item,
          isPaidAndUnlocked: true,
        }))
      );
    }

    const docTitle =
      activeCategory === 'gulf_cv'
        ? `Gulf CV - ${gulfCvData.fullName}`
        : activeCategory === 'rental_agreement'
        ? agreementData.titleMalayalam
        : activeCategory === 'teacher_marklist'
        ? `${markListData.schoolName} - ${markListData.classAndDivision}`
        : letterData.subject;

    const newTx: CompletedTransaction = {
      id: `tx-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN'),
      category: activeCategory,
      title: isBatchCartPaymentFlow ? `Batch Cart (${cartItems.length} ഫയലുകൾ)` : docTitle,
      amount,
      method,
    };
    setTransactions((prev) => [newTx, ...prev]);

    setTimeout(() => {
      if (customPostPayCallbackRef.current) {
        const cb = customPostPayCallbackRef.current;
        customPostPayCallbackRef.current = null;
        cb();
      } else {
        executeOutputAction(pendingActionAfterPay, pendingTargetPhone);
      }
    }, 250);
  };

  // Multi-Document Cart & Home Printer Delivery Helper Functions
  const handleAddCurrentDocumentToCart = () => {
    const unitBasePrice =
      activeCategory === 'gulf_cv'
        ? ownerConfig.pricing.gulf_cv
        : activeCategory === 'rental_agreement'
        ? ownerConfig.pricing.rental_agreement
        : activeCategory === 'teacher_marklist'
        ? ownerConfig.pricing.teacher_marklist || 5
        : ownerConfig.pricing.malayalam_letter;

    const itemTitle =
      activeCategory === 'gulf_cv'
        ? `CV: ${gulfCvData.fullName || 'Biodata'} (${gulfCvData.jobTitle || 'Resume'})`
        : activeCategory === 'rental_agreement'
        ? agreementData.titleMalayalam || 'വാടക കരാർ'
        : activeCategory === 'teacher_marklist'
        ? `${markListData.examTitle || 'മാർക്ക് ലിസ്റ്റ്'} (${markListData.classAndDivision})`
        : `${letterData.documentHeading || 'അപേക്ഷ'} — ${letterData.senderName || letterData.subject.slice(0, 32)}`;

    const itemSubtitle =
      activeCategory === 'gulf_cv'
        ? 'ഇംഗ്ലീഷ് ബയോഡാറ്റ / CV'
        : activeCategory === 'rental_agreement'
        ? 'വാടക കരാർ / സത്യവാങ്മൂലം'
        : activeCategory === 'teacher_marklist'
        ? 'സ്കൂൾ / മദ്രസ മാർക്ക് ലിസ്റ്റ്'
        : letterData.recipientOffice || 'ഔദ്യോഗിക മലയാളം അപേക്ഷ';

    const defaultPaperType = 'normal_a4' as const;

    const newItem: CartDocumentItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      category: activeCategory,
      outputLanguage,
      title: itemTitle,
      subtitle: itemSubtitle,
      basePrice: unitBasePrice,
      copies: 1,
      paperType: defaultPaperType,
      isPaidAndUnlocked: isUnlocked || ownerConfig.freeModeEnabled,
      letterData: JSON.parse(JSON.stringify(letterData)),
      gulfCvData: JSON.parse(JSON.stringify(gulfCvData)),
      agreementData: JSON.parse(JSON.stringify(agreementData)),
      markListData: JSON.parse(JSON.stringify(markListData)),
      overlayItems: JSON.parse(JSON.stringify(sheetOverlayItems)),
    };

    setCartItems((prev) => {
      const next = [...prev, newItem];
      const count = next.length;
      if (ownerConfig.freeModeEnabled) {
        showToast(
          `🛒 "${itemTitle}" കാർട്ടിലേക്ക് ചേർത്തു! (ആകെ ${count} ഫയൽ — ഒരുമിച്ച് സൗജന്യമായി PDF ഡൗൺലോഡ് ചെയ്യാം)`
        );
      } else if (count >= 10) {
        showToast(`🏆 "${itemTitle}" കാർട്ടിൽ ചേർത്തു! (${count} ഫയലുകൾ — 30% മെഗാ ഓഫർ ലഭിച്ചു!)`);
      } else if (count >= 5) {
        showToast(`🔥 "${itemTitle}" കാർട്ടിൽ ചേർത്തു! (${count} ഫയലുകൾ — 20% ഓഫർ ലഭിച്ചു!)`);
      } else if (count >= 3) {
        showToast(`✨ "${itemTitle}" കാർട്ടിൽ ചേർത്തു! (${count} ഫയലുകൾ — 10% ഓഫർ ലഭിച്ചു!)`);
      } else {
        showToast(`🛒 "${itemTitle}" കാർട്ടിലേക്ക് ചേർത്തു! (ആകെ ${count} ഫയൽ — അടുത്ത ഫയൽ കൂടി നിർമ്മിക്കാം)`);
      }
      return next;
    });
  };

  const handleUpdateCartItem = (id: string, patch: Partial<CartDocumentItem>) => {
    setCartItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
    showToast('ഫയൽ കാർട്ടിൽ നിന്ന് നീക്കം ചെയ്തു.');
  };

  const handleClearCart = () => {
    setCartItems([]);
    showToast('പ്രിന്റ് കാർട്ട് കാലിയാക്കി.');
  };

  const handleLoadCartItemToEditor = (item: CartDocumentItem, andPrint = false) => {
    setShowDirectPdfCanvas(false);
    setActiveCategory(item.category);
    setOutputLanguage(item.outputLanguage || 'ml');
    if (item.letterData) setLetterData(item.letterData);
    if (item.gulfCvData) setGulfCvData(item.gulfCvData);
    if (item.agreementData) setAgreementData(item.agreementData);
    if (item.markListData) setMarkListData(item.markListData);
    setSheetOverlayItems(Array.isArray(item.overlayItems) ? item.overlayItems : []);
    if (item.isPaidAndUnlocked) {
      setIsUnlocked(true);
    }
    setMobileViewTab('preview');
    showToast(`📄 "${item.title}" A4 പേപ്പറിലേക്ക് തുറന്നു!`);
    if (andPrint) {
      setTimeout(() => {
        window.print();
      }, 450);
    }
  };

  const handleDownloadAllUnlockedCartPdfs = async () => {
    if (cartItems.length === 0) return;
    setIsCartModalOpen(false);
    setMobileViewTab('preview');
    showToast(`⚡ കാർട്ടിലെ ${cartItems.length} ഫയലുകളും ഓരോന്നായി PDF ഡൗൺലോഡ് ചെയ്യുന്നു...`);

    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      setActiveCategory(item.category);
      setOutputLanguage(item.outputLanguage || 'ml');
      if (item.letterData) setLetterData(item.letterData);
      if (item.gulfCvData) setGulfCvData(item.gulfCvData);
      if (item.agreementData) setAgreementData(item.agreementData);
      if (item.markListData) setMarkListData(item.markListData);
      setSheetOverlayItems(Array.isArray(item.overlayItems) ? item.overlayItems : []);

      // Wait briefly for React to render the sheet before exporting
      await new Promise((r) => setTimeout(r, 420));
      if (sheetRef.current) {
        await generateAndDownloadA4Pdf(sheetRef.current, `${i + 1}_${item.title}`, {
          autoFitOnePage: item.category === 'gulf_cv' ? true : autoFitOnePage,
          mode: 'print_hd',
          category: item.category,
          gulfCvData: item.gulfCvData,
        });
      }
    }

    showToast(`🎉 കാർട്ടിലെ എല്ലാ ${cartItems.length} A4 PDF ഫയലുകളും വിജയകരമായി ഡൗൺലോഡ് ആയി!`);
  };

  const [showMistakeBadges, setShowMistakeBadges] = useState<boolean>(true);
  const [highlightedAuditSection, setHighlightedAuditSection] =
    useState<DocumentAuditSection | null>(null);

  const auditIssues = auditDocumentReadiness(
    activeCategory,
    letterData,
    gulfCvData,
    agreementData,
    {
      markListData,
      overlayItems: sheetOverlayItems,
      measuredSheetHeight,
      autoFitOnePage,
    }
  );

  const handleJumpToAuditSection = (section?: DocumentAuditSection) => {
    if (!section) return;
    setShowMistakeBadges(true);
    setHighlightedAuditSection(section);
    if (sheetRef.current) {
      const targetEl = sheetRef.current.querySelector(
        `[data-audit-section="${section}"]`
      ) as HTMLElement | null;
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    window.setTimeout(() => {
      setHighlightedAuditSection((prev) => (prev === section ? null : prev));
    }, 2600);
  };

  const handleFixAuditIssue = (issue: DocumentAuditIssue) => {
    const todayFormatted = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());

    if (issue.fixActionId === 'set_today_date') {
      if (activeCategory === 'malayalam_letter') {
        setLetterData((prev) => ({ ...prev, date: todayFormatted }));
      } else if (activeCategory === 'rental_agreement') {
        setAgreementData((prev) => ({ ...prev, executionDate: todayFormatted }));
      } else if (activeCategory === 'teacher_marklist') {
        setMarkListData((prev) => ({ ...prev, date: todayFormatted }));
      }
      showToast(`✓ ഇന്നത്തെ തീയതി (${todayFormatted}) ചേർത്തു!`);
    } else if (issue.fixActionId === 'enable_autofit') {
      setAutoFitOnePage(true);
      setFontSizeScale('sm');
      showToast('✓ A4 ഒറ്റ പേജിൽ ഒതുങ്ങാൻ Auto-Fit ഓൺ ചെയ്തു!');
    } else if (issue.fixActionId === 'separate_overlaps') {
      setSheetOverlayItems((prev) =>
        prev.map((item, idx) => ({
          ...item,
          y: idx === 0 ? item.y : Math.max(item.y, (prev[idx - 1]?.y || 20) + 34 * idx),
        }))
      );
      showToast('✓ തമ്മിൽ കയറിക്കിടന്ന എഴുത്ത് ബോക്സുകൾ ക്രമീകരിച്ചു!');
    }
  };

  const currentDocTitle =
    activeCategory === 'gulf_cv'
      ? `${gulfCvData.fullName} – ${gulfCvData.jobTitle}`
      : activeCategory === 'rental_agreement'
      ? agreementData.titleMalayalam
      : activeCategory === 'teacher_marklist'
      ? `${markListData.schoolName} (${markListData.classAndDivision})`
      : letterData.subject;

  const filteredTemplates =
    selectedTemplateGroup === 'എല്ലാം (All)'
      ? QUICK_TEMPLATES
      : QUICK_TEMPLATES.filter((t) => t.subGroup === selectedTemplateGroup);

  // If the owner opened the Dedicated Admin Backend Website (/admin or ?admin=1 or #admin), render the full-page Admin Backend Portal!
  if (isAdminBackendRoute) {
    return (
      <>
        {statusToast && (
          <div className="no-print fixed bottom-6 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs font-malayalam max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusToast}</span>
          </div>
        )}
        <OwnerSettingsModal
          isOpen={true}
          isStandalonePage={true}
          config={ownerConfig}
          transactions={transactions}
          onClose={() => setIsAdminBackendRoute(false)}
          onBackToFrontend={() => {
            setIsAdminBackendRoute(false);
            try {
              if (window.location.hash === '#admin') {
                window.history.replaceState(null, '', window.location.pathname);
              }
            } catch {
              // ignore
            }
          }}
          onSaveConfig={async (newCfg, adminPin) => {
            setOwnerConfig(newCfg);
            try {
              await fetch('/api/owner-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: newCfg, adminPin }),
              });
            } catch {
              // Static host fallback uses localStorage
            }
            showToast(
              '✓ നിങ്ങളുടെ UPI ID-യും പുതിയ നിരക്കുകളും സെർവറിൽ സേവ് ചെയ്തു! കസ്റ്റമർ വെബ്സൈറ്റിൽ ഇത് ഉടൻ ലഭ്യമാകും.'
            );
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-emerald-200">
      {/* Hidden input specifically for "Upload Any PDF & Edit All Text" */}
      <input
        ref={pdfEditUploadInputRef}
        type="file"
        accept="application/pdf,.pdf,image/*,.txt,.doc,.docx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUploadUniversalAttachment(file, true);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Hidden Direct Native Audio Capture Input for macOS / iOS / Android fallback */}
      <input
        ref={appDirectAudioCaptureRef}
        type="file"
        accept="audio/*,video/mp4,audio/mp4,audio/m4a,audio/wav,audio/webm"
        capture="user"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setIsMicHelpModalOpen(false);
            processUploadedAudioFile(file);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* =====================================================================
          1. STICKY GLASS HEADER (min-h-64px) — World-class 3D Branding
         ===================================================================== */}
      <header className="no-print sticky top-0 left-0 right-0 z-50 min-h-[64px] h-auto py-2 glass-nav flex items-center justify-between gap-2 px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-400 to-amber-300 rounded-2xl blur-xs opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 border-2 border-amber-300/80 shadow-[0_3px_10px_rgba(16,185,129,0.45)] flex items-center justify-center text-white">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 stroke-[2.4]" />
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-malayalam font-black text-sm sm:text-base text-white leading-tight tracking-tight truncate">
              പൂരിപ്പിക്കാം<span className="hidden sm:inline"> – അപേക്ഷാ ഡെസ്ക്</span>
            </h1>
            <span className="hidden sm:block font-malayalam text-[10px] text-emerald-400 font-bold tracking-wide mt-0.5 truncate">
              അപേക്ഷ · വാടക കരാർ · ഗൾഫ് CV · മാർക്ക് ലിസ്റ്റ്
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* 0. Multi-Document PDF Cart Round 3D Button (Always Available) */}
          <button
            type="button"
            onClick={() => {
              setCartModalInitialTab('cart');
              setIsCartModalOpen(true);
            }}
            className="btn-round-3d relative min-h-[34px] sm:min-h-[36px] px-2 sm:px-3 flex items-center justify-center gap-1 rounded-full bg-amber-400/25 hover:bg-amber-400/40 border border-amber-300/50 text-amber-300 hover:text-white transition-all cursor-pointer shadow-lg active:translate-y-0.5"
            title="PDF കാർട്ട് · ഒരുമിച്ച് PDF ഡൗൺലോഡ്"
            aria-label="PDF കാർട്ട്"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="font-mono-num font-black text-[11px] sm:text-xs text-white">
              {cartItems.length}
            </span>
          </button>

          {/* 1. App Install (PWA / APK Web App) Round 3D Button */}
          <button
            type="button"
            onClick={handlePwaInstallClick}
            className="btn-round-3d w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-emerald-600/35 hover:bg-emerald-600/50 border border-emerald-400/40 text-emerald-300 hover:text-white transition-all cursor-pointer shadow-lg active:translate-y-0.5"
            title="ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാം (Install APK / Web App)"
            aria-label="ആപ്പ് ഇൻസ്റ്റാൾ"
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 2. Feedback Round 3D Button */}
          <button
            type="button"
            onClick={() => setIsFeedbackModalOpen(true)}
            className="hidden sm:flex btn-round-3d w-9 h-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-amber-300 hover:text-amber-200 transition-all cursor-pointer shadow-lg active:translate-y-0.5"
            title="ഫീഡ്ബാക്ക് നൽകാം (Feedback)"
            aria-label="ഫീഡ്ബാക്ക്"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* 3. Share Website Link Round 3D Button */}
          <button
            type="button"
            onClick={copyWebsiteLinkReliably}
            className="btn-round-3d w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all cursor-pointer shadow-lg active:translate-y-0.5"
            title="വെബ്സൈറ്റ് ലിങ്ക് ഷെയർ ചെയ്യാം"
            aria-label="ഷെയർ ലിങ്ക്"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* 4. Help Button ("മനസ്സിലായില്ലേ?") */}
          <button
            type="button"
            onClick={() => setIsUserGuideModalOpen(true)}
            className="btn-round-3d min-h-[34px] px-2.5 sm:px-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-malayalam font-black text-[10px] sm:text-[11px] flex items-center gap-1 cursor-pointer shadow-[0_3px_0_0_#b45309,0_8px_15px_rgba(245,158,11,0.25)] transition-all active:translate-y-0.5 shrink-0"
            title="ഉപയോഗിക്കേണ്ട വിധം കാണാം"
          >
            <HelpCircle className="w-3.5 h-3.5 stroke-[3] shrink-0" />
            <span className="whitespace-nowrap">മനസ്സിലായില്ലേ?</span>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {statusToast && (
        <div className="no-print fixed bottom-24 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 flex items-center gap-2.5 text-xs font-malayalam max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="break-words">{statusToast}</span>
        </div>
      )}

      {/* =====================================================================
          2. SEARCH & QUICK FILTER BAR (65% / 32% Split) + BATCH CART STRIP
         ===================================================================== */}
      <div className="no-print px-4 sm:px-6 pt-4 pb-2 space-y-3 relative">
        <div className="flex items-center justify-between gap-2.5 sm:gap-3">
          <div className="w-[65%] relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300" />
            </div>
            <input
              type="text"
              value={topUnifiedSearch}
              onChange={(e) => {
                setTopUnifiedSearch(e.target.value);
                if (e.target.value.trim()) {
                  setShowTopExamplesDrawer(true);
                }
              }}
              onFocus={() => setShowTopExamplesDrawer(true)}
              placeholder="ഫോം തിരയുക..."
              className="w-full h-[48px] pl-10 pr-4 bg-white/10 border border-white/10 rounded-2xl text-white font-malayalam text-sm placeholder:text-white/40 focus:outline-none search-neon-focus transition-all shadow-inner"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowTopExamplesDrawer((prev) => !prev)}
            className="w-[33%] sm:w-[32%] h-[48px] btn-round-3d bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer shadow-lg group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="font-mono-num font-black text-xs text-amber-400 relative z-10">
              55+ {showTopExamplesDrawer ? '▲' : '▼'}
            </span>
            <span className="font-malayalam text-[10px] font-bold text-white/90 relative z-10">ഫോമുകൾ</span>
          </button>
        </div>

        {/* Progressive Disclosure Search / 55+ Forms Drawer anchored directly below Search Bar */}
        {showTopExamplesDrawer && (
          <div className="bg-white text-slate-900 rounded-2xl p-3 sm:p-4 border-2 border-emerald-500 shadow-2xl space-y-3 relative z-40 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <h3 className="font-malayalam font-extrabold text-xs sm:text-sm text-emerald-900">
                {topUnifiedSearch
                  ? `🔍 "${topUnifiedSearch}" (${topMatchedGovForms.length + topMatchedQuickTemplates.length})`
                  : `📂 എല്ലാ ഫോമുകളും (${topMatchedGovForms.length + topMatchedQuickTemplates.length})`}
              </h3>
              <button
                type="button"
                onClick={() => setShowTopExamplesDrawer(false)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>അടയ്ക്കുക</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'എല്ലാം' },
                { id: 'edistrict', label: '🏛️ വില്ലേജ്' },
                { id: 'ksmart', label: '🏢 പഞ്ചായത്ത്' },
                { id: 'resignation', label: '📄 രാജിക്കത്ത്' },
                { id: 'school', label: '🎓 സ്കൂൾ' },
                { id: 'madrasa', label: '🕌 മദ്രസ' },
                { id: 'cv_agreement', label: '✈️ CV · കരാർ' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTopFilterGroup(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-malayalam font-bold transition-all whitespace-nowrap cursor-pointer ${
                    topFilterGroup === tab.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {topMatchedGovForms.length === 0 && topMatchedQuickTemplates.length === 0 && (
                <div className="py-8 text-center text-slate-400 font-malayalam">
                  <Search className="w-8 h-8 mx-auto opacity-20 mb-2" />
                  <p className="text-xs">ഫോമുകൾ ഒന്നും കണ്ടെത്താനായില്ല!</p>
                </div>
              )}

              {topMatchedGovForms.map((gf) => (
                <button
                  key={gf.id}
                  type="button"
                  onClick={() => {
                    handleSelectGovForm(gf);
                    setShowTopExamplesDrawer(false);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono-num font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded mb-1 inline-block">
                      {gf.formCode}
                    </span>
                    <h4 className="font-malayalam font-extrabold text-xs text-slate-900 truncate">
                      {gf.titleMalayalam}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}

              {topMatchedQuickTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    handleSelectQuickTemplateInstantly(tpl);
                    setShowTopExamplesDrawer(false);
                  }}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-malayalam font-bold text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded mb-1 inline-block">
                      {tpl.subGroup}
                    </span>
                    <h4 className="font-malayalam font-extrabold text-xs text-slate-900 truncate">
                      {tpl.titleMalayalam}
                    </h4>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Multi-Document Cart & Bulk Offer Quick Bar (Shows 30% Offer ONLY when Payment Mode is active; shows Free Batch Download when Free Mode is ON) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-malayalam font-black text-[10px] shrink-0">
              {ownerConfig.freeModeEnabled ? '🎁 സൗജന്യ ബാച്ച് PDF' : '30% വരെ ഓഫർ'}
            </span>
            <p className="font-malayalam text-[11px] text-emerald-100 font-bold truncate">
              {ownerConfig.freeModeEnabled
                ? '10 ഫയൽ വരെ കാർട്ടിലിട്ട് എല്ലാ A4 PDF ഫയലുകളും ഒരുമിച്ച് സൗജന്യമായി ഡൗൺലോഡ് ചെയ്യാം!'
                : ownerConfig.homePrinterBusinessModeEnabled
                ? '10 ഫയൽ വരെ കാർട്ടിലിട്ട് ഒരുമിച്ച് പേയ്‌മെന്റ് ചെയ്യാം · വീട്ടിലെ പ്രിന്റർ വഴി ഹോം ഡെലിവറിയും!'
                : '10 ഫയൽ വരെ കാർട്ടിലിട്ട് ഒറ്റ തവണ പേയ്‌മെന്റിൽ എല്ലാ A4 PDF-ഉം ഒരുമിച്ച് എടുക്കാം!'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAddCurrentDocumentToCart}
              className="btn-round-3d px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-malayalam font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>കാർട്ടിലിടുക</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCartModalInitialTab('cart');
                setIsCartModalOpen(true);
              }}
              className="btn-round-3d px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
            >
              <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>കാർട്ട് ({cartItems.length})</span>
            </button>

            {Boolean(ownerConfig.homePrinterBusinessModeEnabled) && (
              <button
                type="button"
                onClick={() => {
                  setCartModalInitialTab('home_delivery');
                  setIsCartModalOpen(true);
                }}
                className="btn-round-3d px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 font-malayalam font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span>ഹോം പ്രിന്റ്</span>
              </button>
            )}
          </div>
        </div>

        {/* =====================================================================
            3. CATEGORY 3D CARDS CAROUSEL (Strictly inside viewport)
           ===================================================================== */}
        <section className="relative space-y-2">
          <ThreeDServiceCarousel
            activeCategory={activeCategory}
            isPdfEditSession={isPdfEditSession}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setIsPdfEditSession(false);
              setShowDirectPdfCanvas(false);
              setUploadedPdfFile(null);
              setUploadedPdfFileName('');
              pdfExtractedFallbackRef.current = null;
              showToast('പുതിയ അപേക്ഷാ രീതിയിലേക്ക് മാറ്റി.');
            }}
            onOpenPdfUpload={() => pdfEditUploadInputRef.current?.click()}
          />

          {/* Active Uploaded PDF Control Strip (Visible anywhere so user can always Close/Cancel or Change PDF) */}
          {(showDirectPdfCanvas || uploadedPdfFile) && (
            <div className="no-print bg-slate-900/95 border border-amber-400/50 rounded-2xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-white shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-malayalam font-extrabold text-xs truncate">
                  തുറന്നിരിക്കുന്ന PDF: {uploadedPdfFileName || 'Uploaded.pdf'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => pdfEditUploadInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span>📂 മറ്റൊരു PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseAndClearUploadedPdf}
                  className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-malayalam font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                  title="ഈ PDF പൂർണ്ണമായും ക്ലോസ് ചെയ്യുക"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>PDF ക്ലോസ് ചെയ്യുക</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col pb-24 lg:pb-0">
        <div className="hidden lg:flex items-center justify-center gap-4 py-4 px-6 border-b border-white/5">
          <button
            type="button"
            onClick={() => setWorkspaceMode('whatsapp_bot')}
            className={`px-6 py-2.5 rounded-2xl font-malayalam font-black text-sm transition-all border-2 ${
              workspaceMode === 'whatsapp_bot'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            🎙️ പറയുക / പൂരിപ്പിക്കുക
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceMode('voice_studio')}
            className={`px-6 py-2.5 rounded-2xl font-malayalam font-black text-sm transition-all border-2 ${
              workspaceMode === 'voice_studio'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            📋 ഫോം എഡിറ്റർ
          </button>
        </div>

        <div className="flex-1 max-w-[1440px] mx-auto w-full p-0 sm:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            ref={whatsappSectionRef}
            className={`lg:col-span-5 h-full ${
              mobileViewTab === 'input' ? 'block' : 'hidden lg:block'
            } mobile-screen-transition`}
          >
            {workspaceMode === 'whatsapp_bot' ? (
              <WhatsAppBotPanel
                messages={chatMessages}
                isGenerating={isGenerating}
                isRecording={isRecording}
                formattedTimer={formattedTimer}
                activeCategory={activeCategory}
                letterData={letterData}
                gulfCvData={gulfCvData}
                agreementData={agreementData}
                markListData={markListData}
                isUnlocked={isUnlocked}
                ownerConfig={ownerConfig}
                onSendMessage={(text, cat) => handleGenerateOrRefine(text, cat || 'auto')}
                onStartRecording={startRecording}
                onFinishAndSendRecording={finishAndSendRecording}
                onCancelRecording={cancelRecording}
                onUploadAudioFile={processUploadedAudioFile}
                onUploadUniversalAttachment={handleUploadUniversalAttachment}
                onUploadCvPhoto={handleUploadCvPhoto}
                onDirectUpdateLetter={setLetterData}
                onDirectUpdateGulfCv={setGulfCvData}
                onDirectUpdateAgreement={setAgreementData}
                onDirectUpdateMarkList={setMarkListData}
                onRequestPdfDownload={() => triggerProtectedAction('download')}
                onRequestPrint={() => triggerProtectedAction('print')}
                onRequestWhatsAppShare={(target) => triggerProtectedAction('whatsapp', target)}
                onSwitchToStudioPreview={() => switchToPreview(true)}
                onEnableEditMode={() => setIsEditMode(true)}
                onOpenAutoFillCvModal={() => setIsAutoFillCvModalOpen(true)}
                onSelectGovForm={handleSelectGovForm}
                onSelectQuickTemplate={handleSelectQuickTemplateInstantly}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                isSpeaking={isSpeaking}
                onToggleSpeakDocument={handleToggleSpeakDocument}
                liveTranscript={liveTranscript}
                outputLanguage={outputLanguage}
                isTranslatingLanguage={isTranslatingLanguage}
                onSelectOutputLanguage={handleSelectOutputLanguage}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    📋
                  </div>
                  <h2 className="font-malayalam font-black text-sm text-slate-900">
                    ഫോം എഡിറ്റർ (Manual Editor)
                  </h2>
                </div>
                <p className="text-xs font-malayalam text-slate-600 leading-relaxed">
                  ഇവിടെ നിങ്ങൾക്ക് വിവരങ്ങൾ നേരിട്ട് ഓരോന്നായി നൽകാം. വോയ്‌സ് ടൈപ്പിംഗിനായി മൈക്ക് ബട്ടൺ ഉപയോഗിക്കുക.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                   <button
                    type="button"
                    onClick={() => setWorkspaceMode('whatsapp_bot')}
                    className="w-full py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-malayalam font-bold text-xs"
                  >
                    വോയ്‌സ് അസിസ്റ്റന്റിലേക്ക് മാറാം
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            ref={a4PreviewSectionRef}
            className={`lg:col-span-7 h-full ${
              mobileViewTab === 'preview' ? 'block' : 'hidden lg:block'
            } mobile-screen-transition space-y-4`}
          >
            {showDirectPdfCanvas ? (
              <div className="studio-desk-3d w-full rounded-2xl p-2.5 sm:p-4 bg-slate-900 flex flex-col gap-3 min-h-[500px]">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <button
                    type="button"
                    onClick={handleCloseAndClearUploadedPdf}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-malayalam font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>തിരികെ (PDF ഒഴിവാക്കുക)</span>
                  </button>
                  <span className="font-malayalam text-xs text-amber-300 font-bold">
                    ഒറിജിനൽ PDF എഡിറ്റർ
                  </span>
                  <button
                    type="button"
                    onClick={handleCloseAndClearUploadedPdf}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-malayalam font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>ക്ലോസ് (Close PDF)</span>
                  </button>
                </div>

                <DirectPdfEditor
                  file={uploadedPdfFile}
                  fileName={uploadedPdfFileName}
                  pdfEditPrice={ownerConfig.pricing.pdf_edit ?? 10}
                  isUnlocked={isUnlocked}
                  onRequestProtectedExport={(action, exportCallback) => {
                    if (ownerConfig.freeModeEnabled) {
                      exportCallback();
                      return;
                    }
                    customPostPayCallbackRef.current = exportCallback;
                    setPendingActionAfterPay(action);
                    setIsPaymentModalOpen(true);
                  }}
                  onUploadNewPdfClick={() => pdfEditUploadInputRef.current?.click()}
                  onSwitchToLetterFormatView={() => {
                    if (pdfExtractedFallbackRef.current?.letterData) {
                      setLetterData(pdfExtractedFallbackRef.current.letterData);
                    }
                    if (pdfExtractedFallbackRef.current?.gulfCvData) {
                      setGulfCvData(pdfExtractedFallbackRef.current.gulfCvData);
                    }
                    setShowDirectPdfCanvas(false);
                    showToast('A4 ലെറ്റർ ഫോർമാറ്റ് വ്യൂവിലേക്ക് മാറ്റി.');
                  }}
                  onClosePdfEditor={handleCloseAndClearUploadedPdf}
                  onShowToast={showToast}
                />
              </div>
            ) : (
              <>
                <div className="no-print bg-white text-slate-900 rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isDownloadingPdf}
                        onClick={() => triggerProtectedAction('download')}
                        className="btn-round-3d min-h-[38px] px-4 py-1.5 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 border border-emerald-400 shadow-[0_3px_0_0_#065f46,0_6px_12px_rgba(5,150,105,0.25)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#065f46] transition-all"
                      >
                        {isDownloadingPdf ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        ) : (
                          <Download className="w-3.5 h-3.5 stroke-[2.7] shrink-0" />
                        )}
                        <span>PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerProtectedAction('print')}
                        className="btn-round-3d min-h-[38px] px-4 py-1.5 rounded-full bg-gradient-to-b from-amber-100 to-amber-200 hover:from-amber-50 hover:to-amber-100 text-amber-950 border border-amber-300 font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_3px_0_0_#b45309,0_6px_12px_rgba(245,158,11,0.2)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#b45309] transition-all"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-900 shrink-0 stroke-[2.2]" />
                        <span>പ്രിന്റ്</span>
                      </button>

                      {/* 1-Click Blank Form Mode & Restore Sample Toggle (Works for Letters, Rental Agreements, and Mark Lists!) */}
                      {(activeCategory === 'malayalam_letter' ||
                        activeCategory === 'rental_agreement' ||
                        activeCategory === 'teacher_marklist') && (
                        <>
                          <button
                            type="button"
                            onClick={handleConvertToBlankHandFillableForm}
                            className="btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full bg-gradient-to-b from-slate-100 to-slate-200 hover:from-white hover:to-slate-100 text-slate-900 border border-slate-400 font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_3px_0_0_#475569] active:translate-y-0.5 transition-all"
                            title="വ്യക്തിഗത വിവരങ്ങൾ ടൈപ്പ് ചെയ്യാതെ പേന കൊണ്ട് എഴുതി പൂരിപ്പിക്കാവുന്ന കാലി ഫോം (Blank Form) ആക്കാൻ"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-800 shrink-0" />
                            <span>📝 കാലി ഫോം (പേന കൊണ്ട് എഴുതാൻ)</span>
                          </button>
                          {preBlankSnapshot && preBlankSnapshot.category === activeCategory && (
                            <button
                              type="button"
                              onClick={handleRestoreSampleFromBlankForm}
                              className="btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full bg-gradient-to-b from-emerald-100 to-emerald-200 hover:from-emerald-50 hover:to-emerald-100 text-emerald-950 border border-emerald-400 font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_3px_0_0_#047857] active:translate-y-0.5 transition-all"
                              title="സാമ്പിൾ വിവരങ്ങൾ തിരികെ കൊണ്ടുവരാൻ (Restore Sample Form)"
                            >
                              <span>↺ സാമ്പിൾ ഫോം തിരിച്ചെടുക്കുക</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* 1-Click English ATS Resume Tailor, Match Score & Cover Letter Studio (Jobsuit-style) */}
                      {activeCategory === 'gulf_cv' && (
                        <button
                          type="button"
                          onClick={() => setIsAutoFillCvModalOpen(true)}
                          className="btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-400 font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_3px_0_0_#312e81] active:translate-y-0.5 transition-all"
                          title="Job Description പേസ്റ്റ് ചെയ്ത് ATS Match Score (%) പരിശോധിക്കാനും ഇംഗ്ലീഷ് Resume & Cover Letter തയ്യാറാക്കാനും"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>🎯 ATS Resume Tailor &amp; Match %</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerProtectedAction('whatsapp')}
                        className="btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full bg-gradient-to-b from-sky-50 to-sky-100 hover:from-white hover:to-sky-50 text-sky-950 border border-sky-300 font-malayalam font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_3px_0_0_#0284c7,0_6px_12px_rgba(14,165,233,0.2)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#0284c7] transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5 text-sky-800 shrink-0" />
                        <span>ഷെയർ</span>
                      </button>

                      {/* Add to Batch Cart Button right on A4 Toolbar (Always Available) */}
                      <button
                        type="button"
                        onClick={handleAddCurrentDocumentToCart}
                        className="btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-slate-950 border border-amber-500 font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_3px_0_0_#b45309] active:translate-y-0.5 transition-all"
                        title={
                          ownerConfig.freeModeEnabled
                            ? '10 ഫയലുകൾ വരെ കാർട്ടിലിട്ട് ഒരുമിച്ച് ഡൗൺലോഡ് ചെയ്യാം'
                            : '10 ഫയലുകൾ വരെ കാർട്ടിലിട്ട് ഒറ്റ തവണ പേയ്‌മെന്റ് ചെയ്യാം'
                        }
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                        <span>+ കാർട്ടിലിടുക ({cartItems.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMobilePreviewTools((prev) => !prev)}
                        className={`btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full font-malayalam font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all border ${
                          showMobilePreviewTools
                            ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-[0_2px_0_0_#047857]'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-[0_3px_0_0_#94a3b8] active:translate-y-0.5 active:shadow-[0_1px_0_0_#94a3b8]'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5 shrink-0" />
                        <span>{showMobilePreviewTools ? 'ടൂൾസ് ✕' : 'ടൂൾസ്'}</span>
                      </button>

                      {/* Direct Voice Edit Mic Button on A4 Document */}
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => (isRecording ? finishAndSendRecording() : startRecording())}
                        className={`btn-round-3d min-h-[38px] px-3.5 py-1.5 rounded-full font-malayalam font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all border ${
                          isRecording
                            ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-[0_3px_0_0_#991b1b]'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500 shadow-[0_3px_0_0_#064e3b]'
                        }`}
                        title="മൈക്കിൽ സംസാരിച്ച് പേപ്പർ തിരുത്താം"
                      >
                        {isRecording ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-white text-white" />
                            <span className="font-mono-num font-bold">{formattedTimer} നിർത്തി അയക്കുക</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-white" />
                            <span>മൈക്കിൽ തിരുത്താം</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200">
                        <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <select
                          aria-label="പ്രിന്റ് ഭാഷ"
                          disabled={isTranslatingLanguage}
                          value={outputLanguage}
                          onChange={(e) =>
                            handleSelectOutputLanguage(e.target.value as DocumentOutputLanguage)
                          }
                          className="bg-transparent text-slate-900 text-xs font-malayalam font-bold focus:outline-none cursor-pointer"
                        >
                          {OUTPUT_LANGUAGE_OPTIONS.map((lang) => (
                            <option
                              key={lang.code}
                              value={lang.code}
                              className="bg-white text-slate-900"
                            >
                              {lang.nativeLabel}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={handleZoomOutPdf}
                          title="സൂം കുറയ്ക്കുക"
                          className="btn-round-3d w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center cursor-pointer border border-slate-300 shadow-[0_2px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-[0_1px_0_0_#cbd5e1]"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPdfZoomMode((prev) => (prev === 'fit' ? 1 : 'fit'))
                          }
                          className={`btn-round-3d min-h-[26px] px-2.5 rounded-full text-[11px] font-malayalam font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            pdfZoomMode === 'fit'
                              ? 'bg-emerald-600 text-white font-black shadow-[0_2px_0_0_#065f46]'
                              : 'bg-white text-slate-800 border border-slate-300 shadow-[0_2px_0_0_#cbd5e1]'
                          }`}
                        >
                          <span>{pdfZoomMode === 'fit' ? `Fit` : `${Math.round(activePdfScale * 100)}%`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleZoomInPdf}
                          title="സൂം കൂട്ടുക"
                          className="btn-round-3d w-7 h-7 rounded-full bg-white hover:bg-slate-50 text-slate-800 flex items-center justify-center cursor-pointer border border-slate-300 shadow-[0_2px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-[0_1px_0_0_#cbd5e1]"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`${showMobilePreviewTools ? 'block' : 'hidden'} pt-2 border-t border-slate-200 space-y-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSheetTool('select_edit');
                            setIsEditMode(true);
                            showToast('പേപ്പറിലെ ഏത് അക്ഷരത്തിലും നേരിട്ട് തൊട്ട് തിരുത്താം!');
                          }}
                          className={`btn-round-3d min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                            sheetTool === 'select_edit'
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>1. തൊട്ട് തിരുത്തുക</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSheetTool('add_text');
                            showToast('ഇനി പേപ്പറിൽ എവിടെ വേണമെങ്കിലും ക്ലിക്ക് ചെയ്താൽ അവിടെ പുതിയ എഴുത്ത് ചേർക്കാം!');
                          }}
                          className={`btn-round-3d min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                            sheetTool === 'add_text'
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>2. പുതിയ എഴുത്ത്</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSheetTool('whiteout');
                            showToast('ഇനി പേപ്പറിൽ മായ്ക്കേണ്ട ഭാഗത്ത് ക്ലിക്ക് ചെയ്താൽ Whiteout ബോക്സ് വീഴും!');
                          }}
                          className={`btn-round-3d min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                            sheetTool === 'whiteout'
                              ? 'bg-emerald-600 text-white border-emerald-700 font-black'
                              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <Eraser className="w-3.5 h-3.5" />
                          <span>3. മായ്ക്കുക</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Real-Time Pre-Print Mistake Checker Status Bar */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    {auditIssues.length === 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-malayalam font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>പ്രിന്റ് തെറ്റ് പരിശോധന: തെറ്റുകളൊന്നുമില്ല (Print Ready)</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-malayalam font-extrabold shrink-0">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>പ്രിന്റ് തെറ്റ് പരിശോധന ({auditIssues.length}):</span>
                        </span>
                        {auditIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-malayalam font-bold border transition-all ${
                              issue.severity === 'warning'
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-amber-300'
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-950 border-sky-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleJumpToAuditSection(issue.section)}
                              title={`${issue.labelMalayalam} — പേപ്പറിൽ ആ ഭാഗം കാണാൻ ക്ലിക്ക് ചെയ്യുക`}
                              className="cursor-pointer flex items-center gap-1 text-left"
                            >
                              <span>{issue.shortBadgeMalayalam || issue.labelMalayalam}</span>
                            </button>
                            {issue.fixActionId && (
                              <button
                                type="button"
                                onClick={() => handleFixAuditIssue(issue)}
                                className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[9.5px] font-extrabold cursor-pointer"
                              >
                                ✓ ശരിയാക്കുക
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {auditIssues.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowMistakeBadges((prev) => !prev)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-malayalam font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        title="പേപ്പറിലെ സൂചനാ ബാഡ്ജുകൾ കാണിക്കുക / മറയ്ക്കുക"
                      >
                        {showMistakeBadges ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>സൂചനകൾ മറയ്ക്കുക</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>സൂചനകൾ കാണിക്കുക</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  ref={pdfViewportRef}
                  className="print-only-container studio-desk-3d w-full max-w-full rounded-2xl p-2.5 sm:p-5 overflow-x-auto overflow-y-auto"
                >
                  <div
                    style={{
                      width: `${Math.round(794 * activePdfScale)}px`,
                      height: `${Math.round(measuredSheetHeight * activePdfScale)}px`,
                    }}
                    className="mx-auto relative transition-all duration-150 overflow-hidden a4-floating-3d rounded-xs"
                  >
                    <div
                      style={{
                        transform: `scale(${activePdfScale})`,
                        transformOrigin: 'top left',
                        width: '794px',
                      }}
                    >
                      <A4DocumentSheet
                        sheetRef={sheetRef}
                        category={activeCategory}
                        outputLanguage={outputLanguage}
                        letterData={letterData}
                        gulfCvData={gulfCvData}
                        agreementData={agreementData}
                        markListData={markListData}
                        isUnlocked={isUnlocked || ownerConfig.freeModeEnabled}
                        isEditMode={isEditMode}
                        fontSizeScale={fontSizeScale}
                        onUpdateLetter={setLetterData}
                        onUpdateGulfCv={setGulfCvData}
                        onUpdateAgreement={setAgreementData}
                        onUpdateMarkList={setMarkListData}
                        onEnableEditMode={() => setIsEditMode(true)}
                        activeSheetTool={sheetTool}
                        onResetToolToSelect={() => setSheetTool('select_edit')}
                        showTouchBorders={showTouchBorders}
                        overlayItems={sheetOverlayItems}
                        onUpdateOverlayItems={setSheetOverlayItems}
                        auditIssues={auditIssues}
                        showMistakeBadges={showMistakeBadges}
                        highlightedAuditSection={highlightedAuditSection}
                        onFixAuditIssue={handleFixAuditIssue}
                        onSelectQuickTemplateById={(tplId) => {
                          const foundTpl = QUICK_TEMPLATES.find((t) => t.id === tplId);
                          if (foundTpl) {
                            handleSelectQuickTemplateInstantly(foundTpl, false);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <section id="templates-section" className="no-print mt-6 pt-4 border-t border-slate-300/80 w-full max-w-full overflow-x-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-amber-400 flex items-center justify-center text-lg shrink-0">📂</div>
              <div>
                <h2 className="font-malayalam text-sm sm:text-base font-black text-slate-900">
                  എല്ലാ 55+ സർക്കാർ & പൊതു ഫോമുകളും (Form Library)
                </h2>
                <p className="font-malayalam text-xs text-slate-600">
                  വില്ലേജ് · പഞ്ചായത്ത് · KSEB · റേഷൻ · രാജിക്കത്ത് · ഗൾഫ് CV · മാർക്ക് ലിസ്റ്റ്
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDirectPdfCanvas(false);
                  setUploadedPdfFile(null);
                  setUploadedPdfFileName('');
                  setIsPdfEditSession(false);
                  pdfExtractedFallbackRef.current = null;
                  if (pdfEditUploadInputRef.current) {
                    pdfEditUploadInputRef.current.value = '';
                  }
                  setLetterData(INITIAL_LETTER_DATA);
                  setGulfCvData(INITIAL_GULF_CV_DATA);
                  setAgreementData(INITIAL_AGREEMENT_DATA);
                  setMarkListData(INITIAL_MARKLIST_DATA);
                  setSheetOverlayItems([]);
                  setFollowUpQuestions([]);
                  showToast('ആദ്യത്തെ മാതൃകയിലേക്ക് പുനഃക്രമീകരിച്ചു.');
                }}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-malayalam font-bold text-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>റീസെറ്റ്</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAllFormsCatalog((prev) => !prev)}
                className="flex-1 sm:flex-initial min-h-[40px] px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#16365F] text-white font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>{showAllFormsCatalog ? 'അടയ്ക്കുക ▲' : '55+ ഫോമുകൾ തുറക്കുക ▼'}</span>
              </button>
            </div>
          </div>

          {showAllFormsCatalog && (
            <div className="mt-4 bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 shadow-md space-y-6">
              <div className="relative">
                <Search className="w-4 h-4 text-[#0B2545] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={govFormSearchQuery}
                  onChange={(e) => setGovFormSearchQuery(e.target.value)}
                  placeholder="ഫോം തിരയുക (വരുമാനം, ജാതി, EWS, തണ്ടപ്പേർ, KSEB, റേഷൻ...)"
                  className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-[#0B2545] focus:bg-white font-malayalam text-xs sm:text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {GOV_FORM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedGovCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-malayalam font-bold transition-colors cursor-pointer ${
                      selectedGovCategory === cat.key ? 'bg-[#0B2545] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.labelMalayalam}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredGovForms.map((govForm) => (
                  <div key={govForm.id} className="card-3d-tile rounded-xl p-3 flex flex-col justify-between gap-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono-num font-bold text-[#0B2545] bg-slate-100 px-2 py-0.5 rounded">{govForm.formCode}</span>
                        <span className="text-[10px] font-malayalam font-bold text-slate-500">{govForm.categoryLabelMalayalam}</span>
                      </div>
                      <h3 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">{govForm.titleMalayalam}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => { handleSelectGovForm(govForm); setShowAllFormsCatalog(false); }}
                        className="flex-1 min-h-[36px] px-3 py-1.5 rounded-lg bg-[#0B2545] text-white font-malayalam font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>തുറക്കുക</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            4. FREEMIUM SAMPLE LIBRARY, TEACHERS' FREE VIRAL MAGNET & 2026 GEO / AI SEARCH DIRECTORY
           ===================================================================== */}
        <FreemiumSampleLibraryAndGeoSection
          ownerConfig={ownerConfig}
          onSelectTemplate={(tpl) => {
            handleSelectQuickTemplateInstantly(tpl, false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onRunCustomSamplePrompt={(samplePrompt, category) => {
            setShowDirectPdfCanvas(false);
            setIsPdfEditSession(false);
            setActiveCategory(category);
            handleGenerateOrRefine(samplePrompt, category);
            switchToPreview(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShowToast={showToast}
        />
      </main>

      <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-emerald-950/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-between gap-1.5 shadow-2xl w-full max-w-full overflow-hidden">
        {/* Tab 1: Chat Window */}
        <button
          type="button"
          onClick={switchBackToInput}
          className={`flex-1 min-h-[46px] px-2 rounded-2xl font-malayalam font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all min-w-0 cursor-pointer shadow-lg active:scale-95 ${
            mobileViewTab === 'input'
              ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white border border-emerald-400'
              : 'bg-white/5 text-white/70 border border-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-300" />
          <span className="truncate">
            1. ചാറ്റ്<span className="hidden sm:inline"> വിൻഡോ</span>
          </span>
        </button>

        {/* Center Universal Quick 3D Mic Action (Available Everywhere: Chat & A4 Paper!) */}
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => (isRecording ? finishAndSendRecording() : startRecording())}
          title={isRecording ? 'റെക്കോർഡിംഗ് നിർത്തുക' : 'മൈക്കിൽ പറയുക'}
          className={`btn-round-3d w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer border-2 active:scale-95 ${
            isRecording
              ? 'bg-red-600 border-red-300 text-white animate-pulse shadow-[0_4px_0_0_#991b1b,0_8px_20px_rgba(239,68,68,0.5)]'
              : 'bg-gradient-to-tr from-[#25D366] via-emerald-600 to-emerald-500 border-emerald-300 text-white shadow-[0_4px_0_0_#065f46,0_8px_18px_rgba(5,150,105,0.4)]'
          }`}
        >
          {isRecording ? (
            <Square className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
          ) : (
            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.7]" />
          )}
        </button>

        {/* Tab 2: Live A4 Paper Direct View & Touch Edit */}
        <button
          type="button"
          onClick={() => switchToPreview(true)}
          className={`flex-1 min-h-[46px] px-2 rounded-2xl font-malayalam font-black text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-all min-w-0 cursor-pointer shadow-lg active:scale-95 ${
            mobileViewTab === 'preview'
              ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white border border-emerald-400'
              : 'bg-white/5 text-white/70 border border-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-300" />
          <span className="truncate">
            2. <span className="hidden sm:inline">A4 </span>പേപ്പർ
          </span>
        </button>

        {/* Cart & Batch Checkout Action on Mobile Bottom Bar (Always Available) */}
        <button
          type="button"
          onClick={() => {
            setCartModalInitialTab('cart');
            setIsCartModalOpen(true);
          }}
          className="btn-round-3d min-h-[46px] px-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-amber-300/40 text-amber-300 font-malayalam font-black text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
          title={
            ownerConfig.freeModeEnabled
              ? 'PDF കാർട്ട് · ഒരുമിച്ച് ഡൗൺലോഡ്'
              : 'പ്രിന്റ് കാർട്ട് · ഒരുമിച്ച് പേയ്‌മെന്റ്'
          }
        >
          <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono-num font-bold">{cartItems.length}</span>
        </button>

        {/* PDF Download Action */}
        <button
          type="button"
          onClick={() => triggerProtectedAction('download')}
          className="btn-round-3d min-h-[46px] px-2.5 sm:px-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-malayalam font-black text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-[0_4px_0_0_#b45309]"
          title="PDF ഡൗൺലോഡ് ചെയ്യാം"
        >
          <Download className="w-3.5 h-3.5 stroke-[3] shrink-0" />
          <span className="font-mono-num font-bold">PDF</span>
        </button>
      </div>

      {isMissingFieldsModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
             <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-malayalam text-base sm:text-lg font-extrabold text-slate-900">പ്രിന്റ് / PDF എടുക്കും മുമ്പ് ഈ വിവരങ്ങൾ കൂടി പൂരിപ്പിക്കൂ!</h3>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-1">
              {missingFieldsList.map((item) => (
                <div key={item.key} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                  <label className="block font-malayalam text-xs font-bold text-slate-800">{item.labelMalayalam}</label>
                  <input type="text" value={missingFieldDrafts[item.key] || ''} onChange={(e) => setMissingFieldDrafts((prev) => ({ ...prev, [item.key]: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 focus:border-emerald-600 font-malayalam text-xs text-slate-900 focus:outline-none" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button type="button" onClick={handleSaveMissingFieldsAndProceed} className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-malayalam font-bold cursor-pointer">A4 PDF എടുക്കുക</button>
            </div>
          </div>
        </div>
      )}

      <AtsResumeTailorModal
        isOpen={isAutoFillCvModalOpen}
        gulfCvData={gulfCvData}
        outputLanguage={outputLanguage}
        onChangeOutputLanguage={handleSelectOutputLanguage}
        autoFillCvText={autoFillCvText}
        onChangeAutoFillCvText={setAutoFillCvText}
        onExecuteAutoFillCv={handleExecuteAutoFillCv}
        isGeneratingAutoFill={isGenerating}
        onApplyTailoredCv={(updatedCv, lang) => {
          setOutputLanguage(lang);
          setAutoFitOnePage(true);
          setGulfCvData(updatedCv);
          setActiveCategory('gulf_cv');
          setIsEditMode(true);
          setMobileViewTab('preview');
          playDocumentReadyChime();
        }}
        onApplyCoverLetter={(coverLetter, lang) => {
          setOutputLanguage(lang);
          setLetterData(coverLetter);
          setActiveCategory('malayalam_letter');
          setIsEditMode(true);
          setMobileViewTab('preview');
          playDocumentReadyChime();
        }}
        onClose={() => setIsAutoFillCvModalOpen(false)}
        onShowToast={showToast}
      />

      <PrintCartAndDeliveryModal
        isOpen={isCartModalOpen}
        initialTab={cartModalInitialTab}
        cartItems={cartItems}
        ownerConfig={ownerConfig}
        currentDocumentTitle={currentDocTitle}
        onClose={() => setIsCartModalOpen(false)}
        onAddCurrentDocumentToCart={handleAddCurrentDocumentToCart}
        onUpdateCartItem={handleUpdateCartItem}
        onRemoveCartItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onLoadCartItemToEditor={handleLoadCartItemToEditor}
        onRequestCombinedCartCheckout={(discountedAmount, onSuccessCallback) => {
          customPostPayCallbackRef.current = async () => {
            onSuccessCallback();
          };
          setCustomPaymentAmountOverride(discountedAmount);
          setIsBatchCartPaymentFlow(true);
          setIsPaymentModalOpen(true);
        }}
        onDownloadAllUnlockedCartPdfs={handleDownloadAllUnlockedCartPdfs}
        onShowToast={showToast}
      />

      <UpiPaymentModal
        isOpen={isPaymentModalOpen}
        category={activeCategory}
        documentTitle={
          isBatchCartPaymentFlow ? `ഒരുമിച്ച് പ്രിന്റ് കാർട്ട് (${cartItems.length} ഫയലുകൾ)` : currentDocTitle
        }
        ownerConfig={ownerConfig}
        isPdfEditSession={isPdfEditSession}
        customAmountOverride={customPaymentAmountOverride}
        batchCartCount={isBatchCartPaymentFlow ? cartItems.length : 0}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setCustomPaymentAmountOverride(null);
          setIsBatchCartPaymentFlow(false);
        }}
        onPaymentVerified={handlePaymentVerified}
      />
      <OwnerSettingsModal isOpen={isOwnerModalOpen} config={ownerConfig} transactions={transactions} onClose={() => setIsOwnerModalOpen(false)} onSaveConfig={async (newCfg, adminPin) => { setOwnerConfig(newCfg); try { await fetch('/api/owner-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config: newCfg, adminPin }), }); } catch { } showToast('✓ സേവ് ചെയ്തു!'); }} />
      <FeedbackModal isOpen={isFeedbackModalOpen} ownerConfig={ownerConfig} activeCategory={activeCategory} activeDocumentTitle={currentDocTitle} onClose={() => setIsFeedbackModalOpen(false)} />
      
      {/* Enhanced Interactive Microphone Permission Modal */}
      {isMicHelpModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 font-malayalam text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                  🎙️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    മൈക്ക് അനുമതി എങ്ങനെ നൽകാം?
                  </h3>
                  <span className="text-[11px] text-slate-500 font-bold">
                    വോയ്‌സ് റെക്കോർഡ് ചെയ്യാൻ മൈക്രോഫോൺ ആവശ്യമാണ്
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMicHelpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Direct Allow & Start Recording Button (Passes active stream straight into MediaRecorder for macOS/iOS) */}
            <button
              type="button"
              onClick={async () => {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                      audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                      },
                    });
                    setIsMicHelpModalOpen(false);
                    showToast('✓ മൈക്ക് ഓൺ ആയി! ഇപ്പോൾ സംസാരിക്കാം.');
                    startRecording(undefined, true, stream);
                    return;
                  } catch {
                    // If browser/OS blocked getUserMedia, open native audio recorder directly
                  }
                }
                setIsMicHelpModalOpen(false);
                appDirectAudioCaptureRef.current?.click();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(5,150,105,0.3)] transition-all active:scale-98 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-amber-300 shrink-0" />
              <span>1. ഇവിടെ തൊട്ട് മൈക്ക് Direct Allow ചെയ്യുക (Allow Now)</span>
            </button>

            {/* 2. Direct iOS / macOS Voice Recorder Fallback */}
            <button
              type="button"
              onClick={() => {
                setIsMicHelpModalOpen(false);
                appDirectAudioCaptureRef.current?.click();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-malayalam font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Mic className="w-4 h-4 text-amber-800 shrink-0" />
              <span>2. iOS / Mac ഡയറക്റ്റ് വോയ്‌സ് റെക്കോർഡർ തുറക്കുക</span>
            </button>

            {/* Step-by-step Instructions for Android / iOS / macOS */}
            <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                <span>💡</span> Mac / iPhone / Android-ൽ ശ്രദ്ധിക്കുക:
              </p>
              <p className="text-[11px] leading-relaxed text-slate-700">
                മുകളിലെ പച്ച ബട്ടണിൽ തൊടുമ്പോൾ വരുന്ന ചെറിയ വിൻഡോയിൽ <strong>&apos;Allow&apos;</strong> അമർത്തിയാൽ ഉടൻ റെക്കോർഡിംഗ് തുടങ്ങും. അല്ലെങ്കിൽ രണ്ടാമത്തെ ബട്ടൺ അമർത്തി നേരിട്ട് വോയ്‌സ് റെക്കോർഡ് ചെയ്യാം.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsMicHelpModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-malayalam font-extrabold text-xs cursor-pointer"
              >
                അടയ്ക്കുക (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APK / Web App Install Guide Modal */}
      {isPwaInstallModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 font-malayalam text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                  📱
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാം (APK / Web App)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-bold">
                    ഫോണിൽ ആപ്പ് പോലെ നേരിട്ട് ഉപയോഗിക്കാം
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPwaInstallModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isInstallable && (
              <button
                type="button"
                onClick={async () => {
                  const res = await triggerPwaInstall();
                  if (res) {
                    setIsPwaInstallModalOpen(false);
                    showToast('✓ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്തു!');
                  }
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-malayalam font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ഇപ്പോൾ തന്നെ ഇൻസ്റ്റാൾ ചെയ്യുക (Install Now)</span>
              </button>
            )}

            <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800">
              <p className="font-extrabold text-slate-900">
                📲 ഫോണിൽ ഹോം സ്ക്രീനിലേക്ക് ചേർക്കാൻ:
              </p>
              <div className="space-y-2 text-[11.5px] leading-relaxed text-slate-700">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <strong className="text-emerald-800">Android ഫോൺ (Chrome):</strong><br />
                  ബ്രൗസറിന്റെ മുകളിൽ വലതുവശത്തുള്ള <strong>മൂന്ന് കുത്തുകളിൽ (⋮)</strong> തൊടുക ➔ <strong>'Install app'</strong> അല്ലെങ്കിൽ <strong>'Add to Home screen'</strong> നൽകുക.
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <strong className="text-sky-800">iPhone / iPad (Safari):</strong><br />
                  സഫാരിയുടെ താഴെയുള്ള <strong>Share (⎋)</strong> ചിഹ്നത്തിൽ തൊടുക ➔ <strong>'Add to Home Screen' (⊞)</strong> നൽകുക.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsPwaInstallModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-malayalam font-extrabold text-xs cursor-pointer"
              >
                മനസ്സിലായി (ശരി)
              </button>
            </div>
          </div>
        </div>
      )}

      <UserGuideModal isOpen={isUserGuideModalOpen} onClose={() => setIsUserGuideModalOpen(false)} onSelectCategory={(cat) => { setIsPdfEditSession(false); setActiveCategory(cat); setMobileViewTab('input'); }} onOpenPdfUpload={() => pdfEditUploadInputRef.current?.click()} customVideoUrl={ownerConfig.guideVideoUrl} />

      <footer className="no-print mt-auto pt-4 pb-20 lg:pb-4 px-4 sm:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-400 font-malayalam">
          <span>
            © 2026 {ownerConfig.shopName || 'പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)'} · Thajudheen Thottathil ·{' '}
            <a href="mailto:thajukolari786@gmail.com" className="hover:text-slate-600 underline">
              thajukolari786@gmail.com
            </a>
          </span>
          <button type="button" onClick={() => { setIsAdminBackendRoute(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-slate-400 hover:text-emerald-800 underline cursor-pointer">Admin Portal</button>
        </div>
      </footer>
    </div>
  );
}

export default App;
