import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit3,
  FileAudio,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Mic,
  Paperclip,
  Printer,
  Send,
  Share2,
  Sparkles,
  Square,
  Trash2,
  UserCheck,
  Volume2,
  VolumeX,
  GraduationCap,
} from 'lucide-react';
import {
  ChatMessage,
  DocumentCategory,
  DocumentOutputLanguage,
  FollowUpQuestion,
  MalayalamLetterData,
  GulfCvData,
  RentalAgreementData,
  TeacherMarkListData,
  OwnerBusinessConfig,
  QUICK_TEMPLATES,
  QuickTemplateItem,
  MARKLIST_PRESET_MODELS,
  CV_PRESET_MODELS,
} from '../types/documents';
import {
  OUTPUT_LANGUAGE_OPTIONS,
  convertMalayalamToEnglish,
  mergeSpeechRecognitionPieces,
  normalizeSpokenMalayalamTranscript,
} from '../utils/languageTranslator';
import {
  GovFormTemplate,
  KERALA_GOV_FORMS_MASTER,
} from '../data/keralaGovForms';

interface WhatsAppBotPanelProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  isRecording: boolean;
  formattedTimer: string;
  activeCategory: DocumentCategory;
  letterData: MalayalamLetterData;
  gulfCvData: GulfCvData;
  agreementData: RentalAgreementData;
  markListData: TeacherMarkListData;
  isUnlocked: boolean;
  ownerConfig: OwnerBusinessConfig;
  onSendMessage: (text: string, preferredCategory?: DocumentCategory | 'auto') => void;
  onStartRecording: (
    fieldContextLabel?: string,
    forceMediaRecorder?: boolean,
    preAcquiredStream?: MediaStream
  ) => void;
  onFinishAndSendRecording: () => void;
  onCancelRecording: () => void;
  onUploadAudioFile: (file: File) => void;
  onUploadUniversalAttachment: (file: File) => void;
  onUploadCvPhoto: (photoDataUrl: string) => void;
  onDirectUpdateLetter: (updated: MalayalamLetterData) => void;
  onDirectUpdateGulfCv: (updated: GulfCvData) => void;
  onDirectUpdateAgreement: (updated: RentalAgreementData) => void;
  onDirectUpdateMarkList: (updated: TeacherMarkListData) => void;
  onRequestPdfDownload: () => void;
  onRequestPrint: () => void;
  onRequestWhatsAppShare: (targetPhone?: string) => void;
  onSwitchToStudioPreview: () => void;
  onEnableEditMode?: () => void;
  onOpenAutoFillCvModal?: () => void;
  onSelectGovForm?: (form: GovFormTemplate) => void;
  onSelectQuickTemplate?: (tpl: QuickTemplateItem) => void;
  onOpenFeedbackModal?: () => void;
  isSpeaking?: boolean;
  onToggleSpeakDocument?: () => void;
  liveTranscript?: string;
  outputLanguage?: DocumentOutputLanguage;
  isTranslatingLanguage?: boolean;
  onSelectOutputLanguage?: (lang: DocumentOutputLanguage) => void;
}

type QuickCategoryTabKey =
  | 'revenue_village'
  | 'panchayat_kseb'
  | 'ration_mvd_police_bank'
  | 'resignation_job'
  | 'gulf_cv_agreement'
  | 'school_teacher';

const CITIZEN_QUICK_CATEGORIES: Array<{
  key: QuickCategoryTabKey;
  labelMalayalam: string;
  badgeIcon: string;
}> = [
  {
    key: 'revenue_village',
    labelMalayalam: 'വില്ലേജ്',
    badgeIcon: '🏛️',
  },
  {
    key: 'panchayat_kseb',
    labelMalayalam: 'പഞ്ചായത്ത് · KSEB',
    badgeIcon: '🏢',
  },
  {
    key: 'ration_mvd_police_bank',
    labelMalayalam: 'റേഷൻ · പോലീസ്',
    badgeIcon: '🪪',
  },
  {
    key: 'resignation_job',
    labelMalayalam: 'രാജിക്കത്ത്',
    badgeIcon: '📄',
  },
  {
    key: 'gulf_cv_agreement',
    labelMalayalam: 'CV · കരാർ',
    badgeIcon: '✈️',
  },
  {
    key: 'school_teacher',
    labelMalayalam: 'സ്കൂൾ · മദ്രസ',
    badgeIcon: '🎓',
  },
];

export const WhatsAppBotPanel: React.FC<WhatsAppBotPanelProps> = ({
  messages,
  isGenerating,
  isRecording,
  formattedTimer,
  activeCategory,
  letterData,
  gulfCvData,
  agreementData,
  markListData,
  isUnlocked,
  ownerConfig,
  onSendMessage,
  onStartRecording,
  onFinishAndSendRecording,
  onCancelRecording,
  onUploadAudioFile,
  onUploadUniversalAttachment,
  onUploadCvPhoto,
  onDirectUpdateLetter,
  onDirectUpdateGulfCv,
  onDirectUpdateAgreement,
  onDirectUpdateMarkList,
  onRequestPdfDownload,
  onRequestPrint,
  onRequestWhatsAppShare,
  onSwitchToStudioPreview,
  onEnableEditMode,
  onOpenAutoFillCvModal,
  onSelectGovForm,
  onSelectQuickTemplate,
  onOpenFeedbackModal,
  isSpeaking = false,
  onToggleSpeakDocument,
  liveTranscript = '',
  outputLanguage = 'ml',
  isTranslatingLanguage = false,
  onSelectOutputLanguage,
}) => {
  const [inputText, setInputText] = useState('');
  const [subTab, setSubTab] = useState<'chat' | 'webhook_inbox'>('chat');
  const [showCameraMenu, setShowCameraMenu] = useState<boolean>(false);
  const [expandedQuickCategory, setExpandedQuickCategory] =
    useState<QuickCategoryTabKey | null>(null);
  const [activeQuickCategoryIdx, setActiveQuickCategoryIdx] = useState<number>(0);
  const pillTouchStartXRef = useRef<number | null>(null);

  const handlePrevQuickCategory = (steps: number = 1) => {
    setActiveQuickCategoryIdx(
      (prev) => (prev - steps + CITIZEN_QUICK_CATEGORIES.length * 5) % CITIZEN_QUICK_CATEGORIES.length
    );
  };

  const handleNextQuickCategory = (steps: number = 1) => {
    setActiveQuickCategoryIdx(
      (prev) => (prev + steps) % CITIZEN_QUICK_CATEGORIES.length
    );
  };

  const pillTouchStartTimeRef = useRef<number>(0);

  const handlePillTouchStart = (e: React.TouchEvent) => {
    pillTouchStartXRef.current = e.touches[0].clientX;
    pillTouchStartTimeRef.current = Date.now();
  };

  const handlePillTouchEnd = (e: React.TouchEvent) => {
    if (pillTouchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - pillTouchStartXRef.current;
    const elapsed = Math.max(1, Date.now() - pillTouchStartTimeRef.current);
    const velocity = Math.abs(diff) / elapsed;

    if (Math.abs(diff) > 18) {
      let steps = 1;
      if (Math.abs(diff) > 110 || velocity > 0.7) {
        steps = 3;
      } else if (Math.abs(diff) > 50 || velocity > 0.38) {
        steps = 2;
      }

      if (diff > 0) {
        handlePrevQuickCategory(steps);
      } else {
        handleNextQuickCategory(steps);
      }
    }
    pillTouchStartXRef.current = null;
  };
  const [micPermissionHelpOpen, setMicPermissionHelpOpen] = useState<boolean>(false);

  // Inline answers keyed by `${messageId}_${questionId}` or `${questionId}`
  const [inlineFieldValues, setInlineFieldValues] = useState<Record<string, string>>({});

  // Dedicated inline input-box voice dictation state (does NOT send a WhatsApp voice bubble!)
  const [dictatingBoxKey, setDictatingBoxKey] = useState<string | null>(null);
  const [isTranscribingBoxKey, setIsTranscribingBoxKey] = useState<string | null>(null);
  const inlineMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const inlineStreamRef = useRef<MediaStream | null>(null);
  const inlineChunksRef = useRef<Blob[]>([]);
  const inlineSpeechRecRef = useRef<any>(null);
  const inlineLiveTranscriptRef = useRef<string>('');

  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [simPhone, setSimPhone] = useState('+91 98475 11223');
  const [simName, setSimName] = useState('ഹംസ കെ. (Hamsa K)');
  const [simMessage, setSimMessage] = useState(
    'ഞാൻ ജോലി ചെയ്യുന്ന സ്ഥാപനത്തിൽ നിന്ന് വ്യക്തിപരമായ കാരണങ്ങളാൽ രാജിവെക്കാൻ മാനേജർക്ക് നൽകാൻ ഒരു രാജിക്കത്ത് വേണം. പേര് രാഹുൽ നായർ, സീനിയർ അക്കൗണ്ടന്റ്, മലബാർ ട്രേഡേഴ്സ് കൊച്ചി.'
  );
  const [isSimulatingOrder, setIsSimulatingOrder] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const cvPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const universalFileInputRef = useRef<HTMLInputElement | null>(null);
  const scanPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll ONLY the internal chat box, never hijack the main window scroll!
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isGenerating]);

  const stopInlineVoiceCleanly = () => {
    if (inlineSpeechRecRef.current) {
      try {
        inlineSpeechRecRef.current.onresult = null;
        inlineSpeechRecRef.current.onerror = null;
        inlineSpeechRecRef.current.onend = null;
        inlineSpeechRecRef.current.stop();
      } catch {
        // Ignore
      }
      inlineSpeechRecRef.current = null;
    }
    if (inlineStreamRef.current) {
      inlineStreamRef.current.getTracks().forEach((t) => t.stop());
      inlineStreamRef.current = null;
    }
  };

  const inlineSpeechRecFailedRef = useRef<boolean>(false);
  const pendingInlineTargetRef = useRef<{
    boxKey: string;
    onFillValue: (val: string) => void;
  } | null>(null);
  const directVoiceCaptureInputRef = useRef<HTMLInputElement | null>(null);

  const isAppleOrSafariBrowser = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isAppleHW =
      /Mac|iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
    return isAppleHW || isSafariBrowser;
  };

  const normalizeInlineVoiceValueForBox = (boxKey: string, rawVal: string): string => {
    const trimmed = rawVal.trim();
    if (!trimmed) return '';
    if (activeCategory === 'gulf_cv' || outputLanguage === 'en' || boxKey.includes('_cv_')) {
      const isNameOrPlace =
        boxKey.includes('name') || boxKey.includes('place') || boxKey.includes('loc');
      return convertMalayalamToEnglish(trimmed, isNameOrPlace);
    }
    return trimmed;
  };

  const startInlineMediaRecorder = async (
    boxKey: string,
    onFillValue: (val: string) => void,
    preAcquiredStream?: MediaStream
  ) => {
    try {
      const stream =
        preAcquiredStream ||
        (await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        }));
      inlineStreamRef.current = stream;
      inlineChunksRef.current = [];
      setDictatingBoxKey(boxKey);

      const supportedMime =
        typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
          ? MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : ''
          : '';

      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);
      inlineMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          inlineChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const mimeType = (recorder.mimeType || supportedMime || 'audio/mp4').split(';')[0];
        const blob = new Blob(inlineChunksRef.current, { type: mimeType });
        stopInlineVoiceCleanly();
        setDictatingBoxKey(null);

        if (blob.size < 200) return;

        setIsTranscribingBoxKey(boxKey);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const dataUrl = reader.result as string;
              const audioBase64 = dataUrl.split(',')[1] || '';
              if (!audioBase64) return;

              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioBase64, mimeType }),
              });
              const data = await res.json();
              let finalTr = normalizeInlineVoiceValueForBox(
                boxKey,
                data.transcript || inlineLiveTranscriptRef.current || ''
              );
              if (finalTr) {
                if (
                  activeCategory === 'gulf_cv' &&
                  (outputLanguage === 'en' || outputLanguage === 'ml') &&
                  /[\u0D00-\u0D7F]/.test(finalTr)
                ) {
                  try {
                    const transRes = await fetch('/api/translate-text', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: finalTr, targetLanguage: 'en' }),
                    });
                    if (transRes.ok) {
                      const transData = await transRes.json();
                      if (transData?.translatedText) {
                        finalTr = transData.translatedText;
                      }
                    }
                  } catch {
                    finalTr = convertMalayalamToEnglish(finalTr, false);
                  }
                }
                onFillValue(finalTr);
              }
            } catch {
              if (inlineLiveTranscriptRef.current) {
                let fallbackTr = normalizeInlineVoiceValueForBox(
                  boxKey,
                  inlineLiveTranscriptRef.current
                );
                if (
                  activeCategory === 'gulf_cv' &&
                  (outputLanguage === 'en' || outputLanguage === 'ml') &&
                  /[\u0D00-\u0D7F]/.test(fallbackTr)
                ) {
                  fallbackTr = convertMalayalamToEnglish(fallbackTr, false);
                }
                onFillValue(fallbackTr);
              }
            } finally {
              setIsTranscribingBoxKey(null);
            }
          };
          reader.readAsDataURL(blob);
        } catch {
          setIsTranscribingBoxKey(null);
        }
      };

      recorder.start(250);
    } catch {
      setDictatingBoxKey(null);
      setMicPermissionHelpOpen(true);
    }
  };

  // Dictate voice directly into a specific input box (without sending a WhatsApp message!)
  const handleToggleInlineFieldVoice = async (
    boxKey: string,
    onFillValue: (val: string) => void
  ) => {
    // If already dictating into this box, stop and finish transcription
    if (dictatingBoxKey === boxKey) {
      if (
        inlineMediaRecorderRef.current &&
        inlineMediaRecorderRef.current.state !== 'inactive'
      ) {
        inlineMediaRecorderRef.current.stop();
      } else {
        stopInlineVoiceCleanly();
        setDictatingBoxKey(null);
      }
      return;
    }

    // Stop any previous inline dictation
    if (dictatingBoxKey) {
      stopInlineVoiceCleanly();
      setDictatingBoxKey(null);
    }

    pendingInlineTargetRef.current = { boxKey, onFillValue };
    inlineLiveTranscriptRef.current = '';
    inlineChunksRef.current = [];

    // On macOS / iOS / Safari (or if SpeechRecognition previously failed), use MediaRecorder directly so clicking Allow works immediately!
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec && !isAppleOrSafariBrowser() && !inlineSpeechRecFailedRef.current) {
      try {
        setDictatingBoxKey(boxKey);
        const rec = new SpeechRec();
        rec.lang = 'ml-IN';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (ev: any) => {
          const pieces: string[] = [];
          for (let i = 0; i < ev.results.length; i++) {
            const piece = (ev.results[i][0]?.transcript || '').trim();
            if (piece) pieces.push(piece);
          }
          const merged = normalizeSpokenMalayalamTranscript(mergeSpeechRecognitionPieces(pieces));
          const cleaned = normalizeInlineVoiceValueForBox(boxKey, merged);
          if (cleaned) {
            inlineLiveTranscriptRef.current = cleaned;
            onFillValue(cleaned);
          }
        };
        rec.onend = () => {
          setDictatingBoxKey((prev) => (prev === boxKey ? null : prev));
        };
        rec.onerror = async (ev: any) => {
          const errCode = String(ev?.error || '').toLowerCase();
          if (
            errCode.includes('not-allowed') ||
            errCode.includes('permission') ||
            errCode.includes('denied') ||
            errCode.includes('language') ||
            errCode.includes('audio-capture') ||
            errCode.includes('network')
          ) {
            inlineSpeechRecFailedRef.current = true;
            stopInlineVoiceCleanly();
            await startInlineMediaRecorder(boxKey, onFillValue);
          } else {
            setDictatingBoxKey((prev) => (prev === boxKey ? null : prev));
          }
        };
        rec.start();
        inlineSpeechRecRef.current = rec;
        return;
      } catch {
        inlineSpeechRecFailedRef.current = true;
      }
    }

    await startInlineMediaRecorder(boxKey, onFillValue);
  };

  // Directly apply a question field's value onto the live A4 document state immediately
  const applySingleFieldDirectlyToA4 = (
    fieldLabel: string,
    value: string,
    structuredFieldId?: string
  ) => {
    const cleanVal = value.trim();
    if (!cleanVal) return;

    if (activeCategory === 'malayalam_letter') {
      const nextLetter: MalayalamLetterData = {
        ...letterData,
        structuredFields: letterData.structuredFields
          ? letterData.structuredFields.map((f) => ({ ...f }))
          : letterData.structuredFields,
      };

      // 1. If this question corresponds to a specific structuredField (e.g. Caste, Father's Name, SSLC, Income, Purpose, Police Complaint, etc.)
      if (structuredFieldId && nextLetter.structuredFields) {
        const idx = nextLetter.structuredFields.findIndex((f) => f.id === structuredFieldId);
        if (idx !== -1) {
          nextLetter.structuredFields[idx].value = cleanVal;
          // If it's the primary applicant/owner/student name row (index 0), also sync senderName
          if (idx === 0) {
            nextLetter.senderName = cleanVal;
          }
          // Dynamically sync Police / KSEB / Bank subject & body paragraphs when user changes the complaint/service reason
          if (structuredFieldId === 'complaintSubject') {
            nextLetter.subject = `${cleanVal} സംബന്ധിച്ച് അടിയന്തര അന്വേഷണം നടത്തി നിയമനടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള പരാതി.`;
          } else if (structuredFieldId === 'incidentDetails') {
            nextLetter.bodyParagraphs = [
              `മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ബോധിപ്പിക്കുന്ന പരാതി വിവരം: ${cleanVal}`,
              'മേൽപ്പറഞ്ഞ സംഭവത്തിൽ അടിയന്തരമായി അന്വേഷണം നടത്തി കുറ്റക്കാർക്കെതിരെ ഉചിതമായ നിയമനടപടികൾ സ്വീകരിക്കണമെന്നും എനിക്ക് നീതി ലഭ്യമാക്കണമെന്നും വിനീതമായി അപേക്ഷിക്കുന്നു.',
            ];
          } else if (structuredFieldId === 'lostItemDetails') {
            nextLetter.subject = `${cleanVal} നഷ്ടപ്പെട്ടതു സംബന്ധിച്ച പരാതിയും ഡ്യൂപ്ലിക്കേറ്റ് എടുക്കുന്നതിനായി സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനുമുള്ള അപേക്ഷ.`;
          } else if (structuredFieldId === 'policeStation') {
            nextLetter.recipientOffice = cleanVal.endsWith(',') ? cleanVal : `${cleanVal},`;
          } else if (structuredFieldId === 'serviceType') {
            nextLetter.subject = `വൈദ്യുതി കണക്ഷൻ — ${cleanVal} സംബന്ധിച്ച അപേക്ഷ.`;
          } else if (structuredFieldId === 'bankingRequest') {
            nextLetter.subject = `ബാങ്ക് അക്കൗണ്ട് — ${cleanVal} സംബന്ധിച്ച അപേക്ഷ.`;
          }
          onDirectUpdateLetter(nextLetter);
          return;
        }
      }

      // 2. Also check if fieldLabel matches any structuredField label directly
      if (nextLetter.structuredFields && nextLetter.structuredFields.length > 0) {
        const matchedIdx = nextLetter.structuredFields.findIndex(
          (f) => f.label === fieldLabel || fieldLabel.includes(f.label)
        );
        if (matchedIdx !== -1) {
          nextLetter.structuredFields[matchedIdx].value = cleanVal;
          if (matchedIdx === 0) {
            nextLetter.senderName = cleanVal;
          }
          onDirectUpdateLetter(nextLetter);
          return;
        }
      }

      // 3. Standard fields (Address, Office, Sender Name, Subject, Guardian)
      if (
        fieldLabel.includes('മേൽവിലാസം') ||
        fieldLabel.includes('Address') ||
        (fieldLabel.includes('വിലാസ') && !fieldLabel.includes('പേരും'))
      ) {
        const phoneMatch = cleanVal.match(/\b([6-9]\d{4}[\s\-]?\d{5})\b/);
        if (phoneMatch?.[1]) {
          nextLetter.senderPhone = phoneMatch[1].replace(/\s+/g, '');
        }
        if (/^[\d\s+\-()]{8,15}$/.test(cleanVal.trim())) {
          nextLetter.senderPhone = cleanVal.trim();
        } else {
          const addrWithoutPhone = phoneMatch?.[0]
            ? cleanVal
                .replace(phoneMatch[0], '')
                .replace(/(ഫോൺ|phone|mob|mobile)\s*[:\-]?\s*$/i, '')
                .replace(/[,،\s]+$/, '')
                .trim()
            : cleanVal;
          if (addrWithoutPhone) {
            nextLetter.senderAddress = addrWithoutPhone;
          }
        }
      } else if (
        fieldLabel.includes('പിതാവിന്റെ') ||
        fieldLabel.includes('മാതാവിന്റെ') ||
        fieldLabel.includes('രക്ഷിതാ')
      ) {
        nextLetter.parentOrGuardianName = cleanVal;
        const parentFld = nextLetter.structuredFields?.find(
          (f) => f.label.includes('പിതാവിന്റെ') || f.label.includes('മാതാവിന്റെ')
        );
        if (parentFld) parentFld.value = cleanVal;
      } else if (
        fieldLabel.includes('ആർക്കാണ്') ||
        fieldLabel.includes('കമ്പനി') ||
        fieldLabel.includes('സ്ഥാപന') ||
        fieldLabel.includes('ഓഫീസ്') ||
        fieldLabel.includes('സ്കൂൾ') ||
        fieldLabel.includes('പള്ളി') ||
        fieldLabel.includes('മഹല്ല്') ||
        fieldLabel.includes('സമിതി') ||
        fieldLabel.includes('വില്ലേജ്')
      ) {
        const parts = cleanVal.split(/[,،]/).map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          nextLetter.recipientOffice = `${parts[0]},`;
          nextLetter.recipientPlace = `${parts.slice(1).join(', ')}.`;
          nextLetter.place = parts[parts.length - 1];
        } else {
          nextLetter.recipientOffice = cleanVal.endsWith(',') ? cleanVal : `${cleanVal},`;
          if (nextLetter.recipientPlace.includes('[')) {
            nextLetter.recipientPlace = 'കേരളം.';
          }
        }
      } else if (
        fieldLabel.includes('വിഷയം') ||
        fieldLabel.includes('കാരണം') ||
        fieldLabel.includes('ആവശ്യം') ||
        fieldLabel.includes('Subject') ||
        fieldLabel.includes('Topic')
      ) {
        nextLetter.subject = cleanVal;
        const purpFld = nextLetter.structuredFields?.find(
          (f) => f.label.includes('ആവശ്യം') || f.label.includes('കാര്യം') || f.label.includes('കാരണം')
        );
        if (purpFld) purpFld.value = cleanVal;
      } else if (
        fieldLabel.includes('പേരും') ||
        fieldLabel.includes('അപേക്ഷക') ||
        fieldLabel.includes('വിദ്യാർത്ഥി') ||
        fieldLabel.includes('പേര്') ||
        fieldLabel.includes('Name')
      ) {
        nextLetter.senderName = cleanVal;
        if (nextLetter.structuredFields && nextLetter.structuredFields.length > 0) {
          nextLetter.structuredFields[0].value = cleanVal;
        }
        if (nextLetter.senderAddress.includes('[')) {
          nextLetter.senderAddress = 'കേരളം';
        }
      }
      onDirectUpdateLetter(nextLetter);
    } else if (activeCategory === 'gulf_cv') {
      const nextCv = { ...gulfCvData };
      const isNameOrPlace =
        fieldLabel.includes('പേര്') ||
        fieldLabel.includes('Name') ||
        fieldLabel.includes('സ്ഥലം') ||
        fieldLabel.includes('Location');
      const cvVal =
        outputLanguage === 'ml' || outputLanguage === 'en'
          ? convertMalayalamToEnglish(cleanVal, isNameOrPlace)
          : cleanVal;
      if (fieldLabel.includes('പേരും') || fieldLabel.includes('പേര്') || fieldLabel.includes('Name')) {
        nextCv.fullName = cvVal.toUpperCase();
        nextCv.signatureName = cvVal.toUpperCase();
      } else if (fieldLabel.includes('ഫോൺ') || fieldLabel.includes('Phone')) {
        nextCv.phone = cvVal;
        nextCv.whatsapp = cvVal;
      } else if (fieldLabel.includes('സ്ഥലം') || fieldLabel.includes('Location')) {
        nextCv.currentLocation = cvVal;
        nextCv.cvPlace = cvVal.split(',')[0]?.trim() || cvVal;
      } else if (fieldLabel.includes('പാസ്പോർട്ട്') || fieldLabel.includes('വിസ') || fieldLabel.includes('Visa')) {
        if (cleanVal.includes('ആവശ്യമില്ല') || cleanVal.toLowerCase().includes('domestic') || cleanVal === '-') {
          nextCv.visaStatus = '-';
          nextCv.passportNumber = '-';
        } else {
          nextCv.visaStatus = cvVal;
        }
      } else if (fieldLabel.includes('ജോലി') || fieldLabel.includes('Job')) {
        nextCv.jobTitle = cvVal.toUpperCase();
      }
      onDirectUpdateGulfCv(nextCv);
    } else if (activeCategory === 'rental_agreement') {
      const nextAg = { ...agreementData };
      if (fieldLabel.includes('ഉടമ') || fieldLabel.includes('ഒന്നാം')) {
        nextAg.firstPartyDetails = cleanVal;
      } else if (fieldLabel.includes('വാടകക്കാരൻ') || fieldLabel.includes('രണ്ടാം')) {
        nextAg.secondPartyDetails = cleanVal;
      } else if (fieldLabel.includes('കെട്ടിട') || fieldLabel.includes('Property')) {
        nextAg.schedulePropertyDetails = cleanVal;
      }
      onDirectUpdateAgreement(nextAg);
    } else if (activeCategory === 'teacher_marklist') {
      const nextMl = { ...markListData };
      if (fieldLabel.includes('പരീക്ഷ') || fieldLabel.includes('Exam')) {
        nextMl.examTitle = cleanVal;
      } else if (fieldLabel.includes('ക്ലാസും')) {
        nextMl.classAndDivision = cleanVal;
      } else {
        nextMl.schoolName = cleanVal;
      }
      onDirectUpdateMarkList(nextMl);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/whatsapp/orders');
      const data = await res.json();
      if (data.orders) {
        setIncomingOrders(data.orders);
      }
    } catch {
      // Ignore fetch errors
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim(), 'auto');
    setInputText('');
  };

  // Handle CV Passport Photo Upload
  const handleCvPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadCvPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowCameraMenu(false);
  };

  // Handle Universal File Upload (PDF, Image/Photo, Text, CSV, Audio)
  const handleUniversalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = (file.type || '').toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (
      mime.startsWith('audio/') ||
      ['ogg', 'opus', 'mp3', 'm4a', 'wav', 'aac', 'webm'].includes(ext)
    ) {
      onUploadAudioFile(file);
    } else {
      onUploadUniversalAttachment(file);
    }
    e.target.value = '';
    setShowCameraMenu(false);
  };

  // Submit all filled inline answers for a bot message's followUpQuestions
  const handleSubmitInlineAnswers = (questions: FollowUpQuestion[], msgId: string) => {
    const collected: string[] = [];
    questions.forEach((q) => {
      const key = `${msgId}_${q.id}`;
      const val = (inlineFieldValues[key] ?? inlineFieldValues[q.id] ?? '').trim();
      if (val) {
        applySingleFieldDirectlyToA4(q.fieldLabelMalayalam, val, q.structuredFieldId);
        collected.push(`${q.fieldLabelMalayalam}: ${val}`);
      }
    });

    if (collected.length === 0) return;
    onSendMessage(collected.join('\n'), activeCategory);
  };

  // Submit a single question field immediately
  const handleSubmitSingleQuestionField = (q: FollowUpQuestion, msgId: string) => {
    const key = `${msgId}_${q.id}`;
    const val = (inlineFieldValues[key] ?? inlineFieldValues[q.id] ?? q.defaultValue ?? '').trim();
    if (!val) return;
    applySingleFieldDirectlyToA4(q.fieldLabelMalayalam, val, q.structuredFieldId);
    onSendMessage(`${q.fieldLabelMalayalam}: ${val}`, activeCategory);
  };

  const handleSimulateExternalWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim() || isSimulatingOrder) return;
    setIsSimulatingOrder(true);
    try {
      const res = await fetch('/api/whatsapp/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromPhone: simPhone,
          senderProfileName: simName,
          incomingText: simMessage,
        }),
      });
      const data = await res.json();
      if (data.order) {
        setIncomingOrders((prev) => [data.order, ...prev]);
        onSendMessage(simMessage, 'auto');
      }
    } finally {
      setIsSimulatingOrder(false);
    }
  };

  // Helper to get items for the currently expanded citizen category in WhatsApp panel
  const getCategoryItems = (catKey: QuickCategoryTabKey) => {
    if (catKey === 'revenue_village') {
      const govForms = KERALA_GOV_FORMS_MASTER.filter((f) => f.categoryKey === 'revenue_edistrict');
      return { govForms, quickTemplates: [] as QuickTemplateItem[] };
    }
    if (catKey === 'panchayat_kseb') {
      const govForms = KERALA_GOV_FORMS_MASTER.filter(
        (f) =>
          f.categoryKey === 'lsgd_panchayat' ||
          f.categoryKey === 'welfare_pension' ||
          f.id === 'kseb-ownership-meter-tariff' ||
          f.id === 'kwa-water-connection-complaint'
      );
      return { govForms, quickTemplates: [] as QuickTemplateItem[] };
    }
    if (catKey === 'ration_mvd_police_bank') {
      const govForms = KERALA_GOV_FORMS_MASTER.filter(
        (f) =>
          f.categoryKey === 'civil_supplies_ration' ||
          f.categoryKey === 'mvd_motor' ||
          f.id.startsWith('police-') ||
          f.id === 'bank-account-loan-upi-application'
      );
      return { govForms, quickTemplates: [] as QuickTemplateItem[] };
    }
    if (catKey === 'resignation_job') {
      const govForms = KERALA_GOV_FORMS_MASTER.filter(
        (f) =>
          f.id === 'general-company-resignation' ||
          f.id === 'job-resignation-official' ||
          f.id === 'experience-salary-certificate-request' ||
          f.id === 'mahallu-temple-church-resignation-noc' ||
          f.id === 'service-ksr-leave-application' ||
          f.id === 'service-gpf-gis-sli-medical-spark'
      );
      return { govForms, quickTemplates: [] as QuickTemplateItem[] };
    }
    if (catKey === 'gulf_cv_agreement') {
      const quickTemplates = QUICK_TEMPLATES.filter(
        (t) => t.category === 'gulf_cv' || t.category === 'rental_agreement'
      );
      return { govForms: [] as GovFormTemplate[], quickTemplates };
    }
    // school_teacher (includes School + Madrasa & Usthad + 8 Mark List Models)
    const govForms = KERALA_GOV_FORMS_MASTER.filter(
      (f) =>
        f.id === 'kppha-school-tc-admission' ||
        f.id === 'school-student-leave-letter' ||
        f.id.startsWith('madrasa-')
    );
    const quickTemplates = QUICK_TEMPLATES.filter(
      (t) =>
        t.subGroup === 'സ്കൂൾ & കുട്ടികൾ (School)' ||
        t.subGroup === 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)' ||
        t.category === 'teacher_marklist'
    );
    return { govForms, quickTemplates };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full shadow-xs">
      {/* Hidden File Inputs for Universal Attachments & Photos */}
      <input
        ref={universalFileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.txt,.csv,.doc,.docx,audio/*,.ogg,.opus,.mp3,.m4a,.wav,.aac,.webm"
        onChange={handleUniversalFileChange}
        className="hidden"
      />
      <input
        ref={scanPhotoInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf"
        onChange={handleUniversalFileChange}
        className="hidden"
      />
      <input
        ref={cvPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleCvPhotoChange}
        className="hidden"
      />

      {/* Top Light Minimal Console Bar */}
      <div className="bg-emerald-50/90 text-slate-900 px-3 sm:px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-emerald-200/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs border border-emerald-400/50">
            <Mic className="w-4 h-4 text-white stroke-[2.4]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900 truncate">
              1. പറയുക<span className="hidden sm:inline"> / പൂരിപ്പിക്കുക</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleSpeakDocument && (
            <button
              type="button"
              onClick={onToggleSpeakDocument}
              title={isSpeaking ? 'വായിച്ചു കേൾപ്പിക്കുന്നത് നിർത്തുക' : 'ഡോക്യുമെന്റ് വായിച്ചു കേൾക്കുക (Speak)'}
              className={`btn-round-3d w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-400 text-amber-950 border border-amber-500 shadow-[0_3px_0_0_#b45309] animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-[0_3px_0_0_#cbd5e1]'
              }`}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-amber-950" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-700" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => universalFileInputRef.current?.click()}
            className="btn-round-3d min-h-[34px] px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-[11px] font-malayalam font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
          >
            <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
            <span>ഫയൽ / PDF</span>
          </button>

          {onOpenAutoFillCvModal && (
            <button
              type="button"
              onClick={onOpenAutoFillCvModal}
              className="btn-round-3d min-h-[34px] px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-[11px] font-malayalam font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-amber-700" />
              <span>CV പേസ്റ്റ്</span>
            </button>
          )}
        </div>
      </div>

      {subTab === 'chat' ? (
        <>
          {/* =================================================================
              1. 3-STEP GUIDE CARD (Shown on initial screen; auto-collapses once chatting starts)
             ================================================================= */}
          {messages.length <= 1 && (
            <div className="p-3 sm:p-4 bg-gradient-to-br from-emerald-950 to-emerald-900 border-b border-white/5">
              <div className="glass-card rounded-2xl p-2.5 sm:p-3 flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-lg">
                  💡
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-malayalam font-black text-xs text-white">
                    3 സ്റ്റെപ്പിൽ പേപ്പർ റെഡി!
                  </h4>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2 text-[10px] font-malayalam text-white/85">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[8px] shrink-0">1</span>
                      <span>മൈക്കിൽ പറയുക (അല്ലെങ്കിൽ ടൈപ്പ് ചെയ്യുക)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-malayalam text-white/85">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[8px] shrink-0">2</span>
                      <span>പേപ്പറിൽ നേരിട്ട് തൊട്ട് തിരുത്തുക</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-malayalam text-white/85">
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[8px] shrink-0">3</span>
                      <span>PDF ഡൗൺലോഡ് ചെയ്യുക</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              2. 3D VOICE COMMAND BOX (Compact when conversation is active)
             ================================================================= */}
          <div
            className={`bg-[#071A15] text-white border-b border-white/5 relative overflow-hidden transition-all ${
              messages.length > 1 && !isRecording
                ? 'px-3.5 py-2.5 flex items-center justify-between gap-3'
                : 'p-4 sm:p-5 flex flex-col items-center justify-center gap-3.5'
            }`}
          >
            {/* Background Decorative Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className={`relative z-10 ${messages.length > 1 && !isRecording ? 'text-left min-w-0' : 'text-center'}`}>
              <h3 className="font-malayalam font-black text-xs sm:text-base text-white">
                🎙️ മൈക്കിൽ പറയുക
              </h3>
              <p className="font-malayalam text-[10px] sm:text-[11px] text-emerald-400/80 mt-0.5 truncate">
                ഉദാ: "വരുമാന സർട്ടിഫിക്കറ്റ്", "രാജിക്കത്ത്", "ബയോഡാറ്റ"
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-center gap-6 shrink-0">
              {/* Left Soundwave */}
              {isRecording && (
                <div className="wave-container h-8">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}

              <button
                type="button"
                disabled={isGenerating}
                onClick={() => (isRecording ? onFinishAndSendRecording() : onStartRecording())}
                className={`mic-3d-btn ${
                  messages.length > 1 && !isRecording ? 'w-12 h-12' : 'w-[68px] h-[68px]'
                } rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
                  isRecording ? 'animate-pulse scale-110' : ''
                }`}
              >
                {isRecording ? (
                  <Square className="w-7 h-7 text-white fill-white" />
                ) : (
                  <Mic className={`${messages.length > 1 ? 'w-5 h-5' : 'w-7 h-7'} text-white stroke-[2.5]`} />
                )}
              </button>

              {/* Right Soundwave */}
              {isRecording && (
                <div className="wave-container h-8">
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                  <div className="wave-bar"></div>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="relative z-10 mt-1 font-mono-num font-black text-amber-400 text-sm tracking-widest animate-pulse">
                {formattedTimer}
              </div>
            )}
          </div>
          {!isRecording ? (
            <>
                {/* 1-Tap Category Pills — 3D Circular Revolving Orbit (Preserves exact pill dimensions with 3D cylinder animation) */}
                <div className="pt-2 border-t border-slate-200/80 space-y-1 select-none">
                  <div className="relative flex items-center justify-between gap-1">
                    {/* Left 3D Round Carousel Rotate Button */}
                    <button
                      type="button"
                      onClick={() => handlePrevQuickCategory(1)}
                      title="മുൻപത്തെ കാറ്റഗറി"
                      className="btn-round-3d w-6 h-6 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-[0_1px_0_0_#cbd5e1] shrink-0 z-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* 3D Circular Orbit Perspective Stage */}
                    <div
                      onTouchStart={handlePillTouchStart}
                      onTouchEnd={handlePillTouchEnd}
                      className="stage-3d-orbit-pill relative flex-1 h-[36px] flex items-center justify-center overflow-visible"
                    >
                      {CITIZEN_QUICK_CATEGORIES.map((cat, idx) => {
                        const n = CITIZEN_QUICK_CATEGORIES.length;
                        let offset = (idx - activeQuickCategoryIdx) % n;
                        if (offset > n / 2) offset -= n;
                        if (offset < -n / 2) offset += n;

                        const isCenter = offset === 0;
                        const isOpen = expandedQuickCategory === cat.key;

                        let transform = '';
                        let zIndex = 10;
                        let opacity = 0.55;
                        let pointerEvents: 'auto' | 'none' = 'auto';

                        if (offset === 0) {
                          transform = 'translate3d(0, 0, 26px) scale(1) rotateY(0deg)';
                          zIndex = 30;
                          opacity = 1;
                        } else if (offset === 1) {
                          transform = 'translate3d(82px, 0, 4px) scale(0.90) rotateY(-18deg) rotateZ(1deg)';
                          zIndex = 20;
                          opacity = 0.88;
                        } else if (offset === -1) {
                          transform = 'translate3d(-82px, 0, 4px) scale(0.90) rotateY(18deg) rotateZ(-1deg)';
                          zIndex = 20;
                          opacity = 0.88;
                        } else if (offset === 2) {
                          transform = 'translate3d(144px, 0, -18px) scale(0.78) rotateY(-28deg)';
                          zIndex = 10;
                          opacity = 0.65;
                        } else if (offset === -2) {
                          transform = 'translate3d(-144px, 0, -18px) scale(0.78) rotateY(28deg)';
                          zIndex = 10;
                          opacity = 0.65;
                        } else {
                          transform = 'translate3d(0, 0, -40px) scale(0.68) rotateY(180deg)';
                          zIndex = 5;
                          opacity = 0;
                          pointerEvents = 'none';
                        }

                        return (
                          <div
                            key={cat.key}
                            style={{
                              transform,
                              zIndex,
                              opacity,
                              pointerEvents,
                            }}
                            className="pill-3d-orbit-item absolute cursor-pointer"
                            onClick={() => {
                              if (isCenter) {
                                setExpandedQuickCategory((prev) => (prev === cat.key ? null : cat.key));
                              } else {
                                setActiveQuickCategoryIdx(idx);
                                setExpandedQuickCategory(cat.key);
                              }
                            }}
                          >
                            <div
                              className={`h-[32px] px-3 rounded-full text-[11px] font-malayalam font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shadow-xs border ${
                                isCenter
                                  ? 'bg-emerald-600 text-white font-black border-emerald-400 shadow-[0_3px_0_0_#065f46,0_6px_14px_rgba(5,150,105,0.3)]'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-[0_2px_6px_rgba(15,23,42,0.08)]'
                              }`}
                            >
                              <span className="text-xs">{cat.badgeIcon}</span>
                              <span>{cat.labelMalayalam}</span>
                              {isCenter ? (
                                <span className="text-[9px] text-white/90 font-bold ml-0.5">
                                  {isOpen ? '▲' : '▼'}
                                </span>
                              ) : (
                                <span className="text-[8px] text-slate-400 font-bold">
                                  ▼
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right 3D Round Carousel Rotate Button */}
                    <button
                      type="button"
                      onClick={() => handleNextQuickCategory(1)}
                      title="അടുത്ത കാറ്റഗറി"
                      className="btn-round-3d w-6 h-6 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-[0_1px_0_0_#cbd5e1] shrink-0 z-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Expanded Sub-Items List for Selected Category */}
                  {expandedQuickCategory && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2 space-y-1.5 max-h-[145px] overflow-y-auto">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-malayalam font-bold text-emerald-900">
                          ഫോം തിരഞ്ഞെടുക്കുക:
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedQuickCategory(null)}
                          className="text-[10px] font-malayalam text-slate-600 underline cursor-pointer shrink-0"
                        >
                          ✕ അടയ്ക്കുക
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getCategoryItems(expandedQuickCategory).govForms.map((gf) => (
                          <button
                            key={gf.id}
                            type="button"
                            onClick={() => {
                              if (onSelectGovForm) {
                                onSelectGovForm(gf);
                              } else {
                                onSendMessage(`${gf.titleMalayalam} വേണം`, 'malayalam_letter');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-600 text-slate-900 hover:text-white border border-slate-200 text-[11px] font-malayalam font-bold text-left transition-colors cursor-pointer shadow-2xs"
                          >
                            • {gf.titleMalayalam.split('(')[0].trim()}
                          </button>
                        ))}
                        {getCategoryItems(expandedQuickCategory).quickTemplates.map((qt) => (
                          <button
                            key={qt.id}
                            type="button"
                            onClick={() => {
                              if (onSelectQuickTemplate) {
                                onSelectQuickTemplate(qt);
                              } else {
                                onSendMessage(qt.sampleVoicePrompt, qt.category);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-600 text-slate-900 hover:text-white border border-slate-200 text-[11px] font-malayalam font-bold text-left transition-colors cursor-pointer shadow-2xs"
                          >
                            • {qt.titleMalayalam.split('(')[0].trim()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </>
          ) : (
              <div className="bg-slate-950/90 rounded-2xl p-3 border border-amber-400/50 space-y-2">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="btn-round-3d w-10 h-10 rounded-full bg-red-600 border border-red-400 flex items-center justify-center animate-pulse shrink-0 shadow-[0_3px_0_0_#991b1b]">
                      <Mic className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-malayalam font-extrabold text-xs sm:text-sm text-white">
                          കേൾക്കുന്നു...
                        </span>
                        <span className="font-mono-num font-bold text-sm text-amber-300">
                          {formattedTimer}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onCancelRecording}
                      className="btn-round-3d min-h-[42px] px-4 rounded-full bg-white/10 hover:bg-red-600 border border-white/20 text-white text-xs font-malayalam font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-[0_2px_0_0_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-[0_1px_0_0_rgba(0,0,0,0.3)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>വേണ്ട</span>
                    </button>
                    <button
                      type="button"
                      onClick={onFinishAndSendRecording}
                      className="btn-round-3d flex-1 sm:flex-initial min-h-[42px] px-5 rounded-full bg-[#25D366] hover:bg-emerald-400 border border-emerald-300 text-slate-950 font-malayalam font-black text-xs flex items-center justify-center gap-2 shadow-[0_3px_0_0_#065f46,0_8px_16px_rgba(5,150,105,0.3)] active:translate-y-0.5 active:shadow-[0_1px_0_0_#065f46] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>പൂർത്തിയായി ✓</span>
                    </button>
                  </div>
                </div>

                {liveTranscript && (
                  <div className="bg-black/40 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-malayalam text-amber-200">
                    <span className="font-bold text-white">🎙️ </span>
                    "{liveTranscript}"
                  </div>
                )}
              </div>
            )}

          {/* Chat Messages Canvas */}
          <div
            ref={chatScrollContainerRef}
            className="flex-1 bg-[#EFEAE2] p-3.5 sm:p-4 overflow-y-auto space-y-3.5 max-h-[680px] min-h-[380px]"
          >
            {(() => {
              const lastBotMsgIndex = messages.map((m) => m.sender).lastIndexOf('bot');
              return messages.map((msg, msgIdx) => {
                const isLatestBotMessage = msg.sender === 'bot' && msgIdx === lastBotMsgIndex;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`w-full max-w-[97%] sm:max-w-[92%] rounded-2xl px-3.5 sm:px-4 py-3 shadow-2xs text-xs sm:text-sm font-malayalam leading-relaxed ${
                        msg.sender === 'user'
                          ? 'w-auto bg-[#DCF8C6] text-slate-900 rounded-tr-xs'
                          : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/80'
                      }`}
                    >
                      {/* Playable Voice Note Audio Player inside WhatsApp Bubble */}
                      {msg.audioUrl && (
                        <div className="mb-2.5 bg-black/5 rounded-xl p-2 border border-black/10">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900 mb-1">
                            <span className="flex items-center gap-1">
                              <FileAudio className="w-3.5 h-3.5" />
                              <span>അയച്ച വോയ്‌സ് റെക്കോർഡ്</span>
                            </span>
                            {msg.audioDuration && (
                              <span className="font-mono-num">{msg.audioDuration}</span>
                            )}
                          </div>
                          <audio controls src={msg.audioUrl} className="w-full h-8" />
                        </div>
                      )}

                      {/* Uploaded File / PDF / Document Badge */}
                      {msg.attachmentName && (
                        <div className="mb-2 bg-emerald-900/10 border border-emerald-800/20 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-950">
                          {msg.attachmentType === 'pdf' ? (
                            <FileText className="w-4 h-4 text-red-600 shrink-0" />
                          ) : msg.attachmentType === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-sky-700 shrink-0" />
                          )}
                          <span className="truncate">{msg.attachmentName}</span>
                        </div>
                      )}

                      {msg.photoUrl && (
                        <div className="mb-2">
                          <img
                            src={msg.photoUrl}
                            alt="Uploaded Image"
                            referrerPolicy="no-referrer"
                            className="max-w-[160px] max-h-[160px] object-cover rounded-lg border border-slate-300"
                          />
                        </div>
                      )}

                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* ===========================================================
                          SUB-FORM OPTIONS CHOOSER (e.g. 5 Types of Police Complaints,
                          Village Certificates, Panchayat Applications, etc.)
                         =========================================================== */}
                      {msg.sender === 'bot' &&
                        msg.subFormOptions &&
                        msg.subFormOptions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-emerald-200 bg-emerald-50/80 rounded-xl p-3 space-y-2">
                            <p className="text-xs font-extrabold text-emerald-950">
                              {msg.subFormPromptTitle ||
                                '📋 താഴെ കാണുന്ന ഓപ്ഷനുകളിൽ നിന്ന് നിങ്ങളുടെ ആവശ്യം തിരഞ്ഞെടുക്കുക:'}
                            </p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.subFormOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    if (opt.govFormId) {
                                      const found = KERALA_GOV_FORMS_MASTER.find(
                                        (f) => f.id === opt.govFormId
                                      );
                                      if (found && onSelectGovForm) {
                                        onSelectGovForm(found);
                                        return;
                                      }
                                    }
                                    if (opt.customPrompt) {
                                      onSendMessage(opt.customPrompt, 'malayalam_letter');
                                    } else {
                                      onSendMessage(opt.titleMalayalam, 'malayalam_letter');
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2.5 rounded-xl bg-white hover:bg-emerald-700 hover:text-white border border-emerald-300 text-slate-900 transition-colors cursor-pointer shadow-2xs group flex items-start gap-2.5"
                                >
                                  <div className="btn-round-3d w-5 h-5 rounded-full border border-emerald-400 bg-emerald-50 text-emerald-800 group-hover:bg-white group-hover:text-emerald-700 shadow-[0_2px_0_0_#6ee7b7] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                                    ✓
                                  </div>
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    {opt.badgeIcon && (
                                      <span className="text-sm shrink-0">{opt.badgeIcon}</span>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-extrabold leading-snug">
                                        {opt.titleMalayalam}
                                      </p>
                                      {opt.subtitleMalayalam && (
                                        <p className="text-[11px] text-slate-600 group-hover:text-emerald-100 mt-0.5 leading-snug">
                                          {opt.subtitleMalayalam}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* ===========================================================
                          LIVE INTERACTIVE EDITING FIELDS INSIDE WHATSAPP BOT MESSAGE
                          Renders directly inside the incoming WhatsApp message bubble!
                         =========================================================== */}
                      {isLatestBotMessage ? (
                        <div className="mt-3 bg-amber-50/90 border border-amber-200 rounded-xl p-3 space-y-2.5">
                          <p className="font-malayalam font-bold text-xs text-amber-950 leading-relaxed">
                            ഓരോ കോളത്തിലും നേരിട്ട് ടൈപ്പ് ചെയ്യുകയോ 🎙️ വോയ്‌സ് ബട്ടൺ അമർത്തി പറയുകയോ ചെയ്യാം:
                          </p>

                          {activeCategory === 'malayalam_letter' && (
                            <div className="grid grid-cols-1 gap-2">
                              {letterData.structuredFields && letterData.structuredFields.length > 0 ? (
                                (() => {
                                  const sfs = letterData.structuredFields || [];
                                  const hasAddressInStructured = sfs.some(
                                    (f) =>
                                      f.id === 'address' ||
                                      f.label.includes('വിലാസ') ||
                                      f.label.includes('മേൽവിലാസ')
                                  );
                                  const hasOfficeInStructured = sfs.some(
                                    (f) =>
                                      f.id === 'policeStation' ||
                                      f.id === 'villageOffice' ||
                                      f.label.includes('സ്റ്റേഷൻ') ||
                                      f.label.includes('ഓഫീസ്') ||
                                      f.label.includes('വില്ലേജ്') ||
                                      f.label.includes('സ്ഥാപന') ||
                                      f.label.includes('ബാങ്ക്') ||
                                      f.label.includes('സ്കൂൾ')
                                  );

                                  const syncStructuredFieldToLetter = (idx: number, val: string) => {
                                    const sfItem = sfs[idx];
                                    const nextFields = sfs.map((f, fIdx) =>
                                      fIdx === idx ? { ...f, value: val } : f
                                    );
                                    const nextLetter: MalayalamLetterData = {
                                      ...letterData,
                                      structuredFields: nextFields,
                                    };
                                    if (idx === 0) {
                                      const phMatch = val.match(/\b([6-9]\d{4}[\s\-]?\d{5})\b/);
                                      if (phMatch?.[1]) {
                                        nextLetter.senderPhone = phMatch[1].replace(/\s+/g, '');
                                        const nameOnly = val
                                          .replace(phMatch[0], '')
                                          .replace(/[,،\-\s]+$/, '')
                                          .trim();
                                        nextLetter.senderName = nameOnly || val;
                                      } else {
                                        nextLetter.senderName = val;
                                      }
                                    } else if (
                                      sfItem &&
                                      (sfItem.id === 'address' ||
                                        sfItem.label.includes('വിലാസ') ||
                                        sfItem.label.includes('മേൽവിലാസ'))
                                    ) {
                                      const phMatch = val.match(/\b([6-9]\d{4}[\s\-]?\d{5})\b/);
                                      if (phMatch?.[1]) {
                                        nextLetter.senderPhone = phMatch[1].replace(/\s+/g, '');
                                      }
                                      if (/^[\d\s+\-()]{8,15}$/.test(val.trim())) {
                                        nextLetter.senderPhone = val.trim();
                                      } else {
                                        nextLetter.senderAddress = val;
                                      }
                                    } else if (
                                      sfItem &&
                                      (sfItem.id === 'policeStation' ||
                                        sfItem.id === 'villageOffice' ||
                                        sfItem.label.includes('സ്റ്റേഷൻ') ||
                                        sfItem.label.includes('ഓഫീസ്') ||
                                        sfItem.label.includes('വില്ലേജ്'))
                                    ) {
                                      nextLetter.recipientOffice = val.endsWith(',') ? val : `${val},`;
                                    } else if (sfItem && sfItem.id === 'complaintSubject') {
                                      nextLetter.subject = `${val} സംബന്ധിച്ച് അടിയന്തര അന്വേഷണം നടത്തി നിയമനടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള പരാതി.`;
                                    } else if (sfItem && sfItem.id === 'incidentDetails') {
                                      nextLetter.bodyParagraphs = [
                                        `മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ബോധിപ്പിക്കുന്ന പരാതി വിവരം: ${val}`,
                                        'മേൽപ്പറഞ്ഞ സംഭവത്തിൽ അടിയന്തരമായി അന്വേഷണം നടത്തി കുറ്റക്കാർക്കെതിരെ ഉചിതമായ നിയമനടപടികൾ സ്വീകരിക്കണമെന്നും എനിക്ക് നീതി ലഭ്യമാക്കണമെന്നും വിനീതമായി അപേക്ഷിക്കുന്നു.',
                                      ];
                                    }
                                    onDirectUpdateLetter(nextLetter);
                                  };

                                  return (
                                    <>
                                      {sfs.map((sf, idx) => {
                                        const voiceKey = `msg_${msg.id}_sf_${sf.id || idx}`;
                                        const matchingQ = msg.followUpQuestions?.find(
                                          (q) =>
                                            q.structuredFieldId === sf.id ||
                                            q.fieldLabelMalayalam === sf.label
                                        );
                                        const isExampleHint = /^ഉദാ\s*:/i.test((sf.value || '').trim());
                                        const displayVal = isExampleHint ? '' : sf.value;
                                        const displayPlaceholder = isExampleHint
                                          ? sf.value
                                          : sf.placeholder || `${sf.label} ഇവിടെ എഴുതുക...`;

                                        return (
                                          <div
                                            key={sf.id || idx}
                                            className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5"
                                          >
                                            <label className="block font-malayalam font-bold text-xs text-slate-900">
                                              {idx + 1}. {sf.label}:
                                            </label>
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="text"
                                                value={displayVal}
                                                onChange={(e) =>
                                                  syncStructuredFieldToLetter(idx, e.target.value)
                                                }
                                                placeholder={displayPlaceholder}
                                                className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                              />
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleToggleInlineFieldVoice(voiceKey, (val) =>
                                                    syncStructuredFieldToLetter(idx, val)
                                                  )
                                                }
                                                className={`btn-round-3d min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                                  dictatingBoxKey === voiceKey
                                                    ? 'bg-red-600 animate-pulse'
                                                    : 'bg-emerald-700 hover:bg-emerald-800'
                                                }`}
                                              >
                                                {isTranscribingBoxKey === voiceKey ? (
                                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                  <Mic className="w-3.5 h-3.5" />
                                                )}
                                                <span>
                                                  {dictatingBoxKey === voiceKey ? 'നിർത്തുക' : 'വോയ്‌സ്'}
                                                </span>
                                              </button>
                                            </div>

                                            {matchingQ?.quickSuggestions &&
                                              matchingQ.quickSuggestions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                  {matchingQ.quickSuggestions.map((sug, sIdx) => (
                                                    <button
                                                      key={sIdx}
                                                      type="button"
                                                      onClick={() =>
                                                        applySingleFieldDirectlyToA4(
                                                          sf.label,
                                                          sug,
                                                          sf.id
                                                        )
                                                      }
                                                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-emerald-700 hover:text-white text-emerald-950 border border-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
                                                    >
                                                      + {sug}
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                          </div>
                                        );
                                      })}

                                      {/* Only show extra Address box if NOT already in structuredFields */}
                                      {!hasAddressInStructured && (
                                        <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                          <label className="block font-malayalam font-bold text-xs text-slate-900">
                                            {sfs.length + 1}. മേൽവിലാസം (Address):
                                          </label>
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="text"
                                              value={letterData.senderAddress}
                                              onChange={(e) =>
                                                onDirectUpdateLetter({
                                                  ...letterData,
                                                  senderAddress: e.target.value,
                                                })
                                              }
                                              placeholder="വീട്ടുപേര്, വാർഡ്, സ്ഥലം..."
                                              className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleToggleInlineFieldVoice(`msg_${msg.id}_addr`, (val) =>
                                                  onDirectUpdateLetter({ ...letterData, senderAddress: val })
                                                )
                                              }
                                              className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                                dictatingBoxKey === `msg_${msg.id}_addr`
                                                  ? 'bg-red-600 animate-pulse'
                                                  : 'bg-emerald-700 hover:bg-emerald-800'
                                              }`}
                                            >
                                              <Mic className="w-3.5 h-3.5" />
                                              <span>
                                                {dictatingBoxKey === `msg_${msg.id}_addr`
                                                  ? 'നിർത്തുക'
                                                  : 'വോയ്‌സ്'}
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Only show extra Office box if NOT already in structuredFields */}
                                      {!hasOfficeInStructured && (
                                        <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                          <label className="block font-malayalam font-bold text-xs text-slate-900">
                                            {sfs.length + (hasAddressInStructured ? 1 : 2)}. ആർക്കാണ് നൽകേണ്ടത് (ഓഫീസ് & സ്ഥലം):
                                          </label>
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              type="text"
                                              value={letterData.recipientOffice}
                                              onChange={(e) =>
                                                onDirectUpdateLetter({
                                                  ...letterData,
                                                  recipientOffice: e.target.value,
                                                })
                                              }
                                              placeholder="ഉദാ: വില്ലേജ് ഓഫീസ് / ഗ്രാമപഞ്ചായത്ത് / താലൂക്ക് ഓഫീസ്"
                                              className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleToggleInlineFieldVoice(`msg_${msg.id}_office`, (val) =>
                                                  onDirectUpdateLetter({
                                                    ...letterData,
                                                    recipientOffice: val,
                                                  })
                                                )
                                              }
                                              className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                                dictatingBoxKey === `msg_${msg.id}_office`
                                                  ? 'bg-red-600 animate-pulse'
                                                  : 'bg-emerald-700 hover:bg-emerald-800'
                                              }`}
                                            >
                                              <Mic className="w-3.5 h-3.5" />
                                              <span>
                                                {dictatingBoxKey === `msg_${msg.id}_office`
                                                  ? 'നിർത്തുക'
                                                  : 'വോയ്‌സ്'}
                                              </span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()
                              ) : (
                                <>
                                  {/* Field 1: Applicant Name */}
                                  <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                    <label className="block font-malayalam font-bold text-xs text-slate-900">
                                      1.{' '}
                                      {letterData.letterLayoutVariant === 'school_leave'
                                        ? 'വിദ്യാർത്ഥിയുടെ പേരും ക്ലാസും:'
                                        : 'അപേക്ഷകന്റെ പേര് (Applicant Name):'}
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={letterData.senderName}
                                        onChange={(e) =>
                                          onDirectUpdateLetter({
                                            ...letterData,
                                            senderName: e.target.value,
                                          })
                                        }
                                        placeholder="നിങ്ങളുടെ പേര് ഇവിടെ എഴുതുക..."
                                        className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleInlineFieldVoice(`msg_${msg.id}_sender`, (val) =>
                                            onDirectUpdateLetter({ ...letterData, senderName: val })
                                          )
                                        }
                                        className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                          dictatingBoxKey === `msg_${msg.id}_sender`
                                            ? 'bg-red-600 animate-pulse'
                                            : 'bg-emerald-700 hover:bg-emerald-800'
                                        }`}
                                      >
                                        {isTranscribingBoxKey === `msg_${msg.id}_sender` ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Mic className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                          {dictatingBoxKey === `msg_${msg.id}_sender`
                                            ? 'നിർത്തുക'
                                            : 'വോയ്‌സ്'}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Field 2: Address */}
                                  <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                    <label className="block font-malayalam font-bold text-xs text-slate-900">
                                      2. മേൽവിലാസം (Address):
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={letterData.senderAddress}
                                        onChange={(e) =>
                                          onDirectUpdateLetter({
                                            ...letterData,
                                            senderAddress: e.target.value,
                                          })
                                        }
                                        placeholder="വീട്ടുപേര്, വാർഡ്, സ്ഥലം..."
                                        className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleInlineFieldVoice(
                                            `msg_${msg.id}_addr_std`,
                                            (val) =>
                                              onDirectUpdateLetter({
                                                ...letterData,
                                                senderAddress: val,
                                              })
                                          )
                                        }
                                        className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                          dictatingBoxKey === `msg_${msg.id}_addr_std`
                                            ? 'bg-red-600 animate-pulse'
                                            : 'bg-emerald-700 hover:bg-emerald-800'
                                        }`}
                                      >
                                        <Mic className="w-3.5 h-3.5" />
                                        <span>
                                          {dictatingBoxKey === `msg_${msg.id}_addr_std`
                                            ? 'നിർത്തുക'
                                            : 'വോയ്‌സ്'}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Field 3: Office / Institution Name */}
                                  <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                    <label className="block font-malayalam font-bold text-xs text-slate-900">
                                      3. ആർക്കാണ് കൊടുക്കേണ്ടത് (ഓഫീസ് / സ്ഥാപനം & സ്ഥലം):
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={letterData.recipientOffice}
                                        onChange={(e) =>
                                          onDirectUpdateLetter({
                                            ...letterData,
                                            recipientOffice: e.target.value,
                                          })
                                        }
                                        placeholder="ഉദാ: പഞ്ചായത്ത് / വില്ലേജ് ഓഫീസ് / സ്ഥാപനം"
                                        className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleInlineFieldVoice(
                                            `msg_${msg.id}_office_std`,
                                            (val) =>
                                              onDirectUpdateLetter({
                                                ...letterData,
                                                recipientOffice: val,
                                              })
                                          )
                                        }
                                        className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                          dictatingBoxKey === `msg_${msg.id}_office_std`
                                            ? 'bg-red-600 animate-pulse'
                                            : 'bg-emerald-700 hover:bg-emerald-800'
                                        }`}
                                      >
                                        {isTranscribingBoxKey === `msg_${msg.id}_office_std` ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Mic className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                          {dictatingBoxKey === `msg_${msg.id}_office_std`
                                            ? 'നിർത്തുക'
                                            : 'വോയ്‌സ്'}
                                        </span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Field 4: Subject / Reason */}
                                  <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                    <label className="block font-malayalam font-bold text-xs text-slate-900">
                                      4. വിഷയം / ആവശ്യം (Subject):
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={letterData.subject}
                                        onChange={(e) =>
                                          onDirectUpdateLetter({
                                            ...letterData,
                                            subject: e.target.value,
                                          })
                                        }
                                        placeholder="കത്തിലെ വിഷയം ഇവിടെ എഴുതുക..."
                                        className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900 bg-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleToggleInlineFieldVoice(
                                            `msg_${msg.id}_subject`,
                                            (val) =>
                                              onDirectUpdateLetter({ ...letterData, subject: val })
                                          )
                                        }
                                        className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                          dictatingBoxKey === `msg_${msg.id}_subject`
                                            ? 'bg-red-600 animate-pulse'
                                            : 'bg-emerald-700 hover:bg-emerald-800'
                                        }`}
                                      >
                                        {isTranscribingBoxKey === `msg_${msg.id}_subject` ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Mic className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                          {dictatingBoxKey === `msg_${msg.id}_subject`
                                            ? 'നിർത്തുക'
                                            : 'വോയ്‌സ്'}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {activeCategory === 'gulf_cv' && (
                            <div className="grid grid-cols-1 gap-2">
                              {/* 8 Universal CV Models Selector Strip (Fresher, IT, Teacher, Nurse, Accountant, Sales, UK/Europe, Gulf) */}
                              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-malayalam font-extrabold text-xs text-emerald-950">
                                    💼 ഏത് ജോലിക്കും · ഏത് നാട്ടിലേക്കും (8 സിവി മോഡലുകൾ):
                                  </span>
                                  <span className="text-[10px] font-malayalam font-bold text-emerald-700">
                                    1-Click മാറ്റാം
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  {CV_PRESET_MODELS.map((preset) => {
                                    const isCurrent = gulfCvData.jobTitle === preset.data.jobTitle;
                                    return (
                                      <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() =>
                                          onDirectUpdateGulfCv({
                                            ...preset.data,
                                            photoDataUrl:
                                              gulfCvData.photoDataUrl || preset.data.photoDataUrl,
                                          })
                                        }
                                        className={`px-2 py-1.5 rounded-lg text-[11px] font-malayalam font-bold text-left transition-all cursor-pointer border truncate ${
                                          isCurrent
                                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                                            : 'bg-white hover:bg-emerald-100 text-slate-900 border-emerald-200'
                                        }`}
                                      >
                                        {preset.badge}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {onOpenAutoFillCvModal && (
                                <button
                                  type="button"
                                  onClick={onOpenAutoFillCvModal}
                                  className="w-full py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-malayalam font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                  <span>
                                    ✨ പഴയ സിവി / വിവരങ്ങൾ പേസ്റ്റ് ചെയ്ത് ഓട്ടോ-ഫിൽ ചെയ്യാം
                                  </span>
                                </button>
                              )}

                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  1. നിങ്ങളുടെ മുഴുവൻ പേര് (Full Name & Signature):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={gulfCvData.fullName}
                                    onChange={(e) =>
                                      onDirectUpdateGulfCv({
                                        ...gulfCvData,
                                        fullName: e.target.value,
                                        signatureName: e.target.value,
                                      })
                                    }
                                    className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs bg-white text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleInlineFieldVoice(`msg_${msg.id}_cv_name`, (val) =>
                                        onDirectUpdateGulfCv({
                                          ...gulfCvData,
                                          fullName: val.toUpperCase(),
                                          signatureName: val.toUpperCase(),
                                        })
                                      )
                                    }
                                    className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                      dictatingBoxKey === `msg_${msg.id}_cv_name`
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-emerald-700 hover:bg-emerald-800'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>
                                      {dictatingBoxKey === `msg_${msg.id}_cv_name`
                                        ? 'നിർത്തുക'
                                        : 'വോയ്‌സ്'}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  2. അപേക്ഷിക്കുന്ന ജോലി / തസ്തിക (Job Title — ഏത് ജോലിയും):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={gulfCvData.jobTitle}
                                    onChange={(e) =>
                                      onDirectUpdateGulfCv({
                                        ...gulfCvData,
                                        jobTitle: e.target.value,
                                      })
                                    }
                                    placeholder="ഉദാ: ACCOUNTANT / SOFTWARE ENGINEER / TEACHER / NURSE / DRIVER"
                                    className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs bg-white text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleInlineFieldVoice(`msg_${msg.id}_cv_job`, (val) =>
                                        onDirectUpdateGulfCv({
                                          ...gulfCvData,
                                          jobTitle: val.toUpperCase(),
                                        })
                                      )
                                    }
                                    className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                      dictatingBoxKey === `msg_${msg.id}_cv_job`
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-emerald-700 hover:bg-emerald-800'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>
                                      {dictatingBoxKey === `msg_${msg.id}_cv_job`
                                        ? 'നിർത്തുക'
                                        : 'വോയ്‌സ്'}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  3. സ്ഥലം / ജില്ല / രാജ്യം (Location — നാട്ടിലോ വിദേശത്തോ):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={gulfCvData.currentLocation}
                                    onChange={(e) =>
                                      onDirectUpdateGulfCv({
                                        ...gulfCvData,
                                        currentLocation: e.target.value,
                                        cvPlace:
                                          e.target.value.split(',')[0]?.trim() || e.target.value,
                                      })
                                    }
                                    placeholder="ഉദാ: Kozhikode, Kerala / Kochi / Bengaluru / London / Dubai"
                                    className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs bg-white text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleInlineFieldVoice(`msg_${msg.id}_cv_loc`, (val) =>
                                        onDirectUpdateGulfCv({
                                          ...gulfCvData,
                                          currentLocation: val,
                                          cvPlace: val.split(',')[0]?.trim() || val,
                                        })
                                      )
                                    }
                                    className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                      dictatingBoxKey === `msg_${msg.id}_cv_loc`
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-emerald-700 hover:bg-emerald-800'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>
                                      {dictatingBoxKey === `msg_${msg.id}_cv_loc`
                                        ? 'നിർത്തുക'
                                        : 'വോയ്‌സ്'}
                                    </span>
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {[
                                    'Kozhikode, Kerala, India',
                                    'Kochi, Ernakulam, Kerala',
                                    'Thiruvananthapuram, Kerala',
                                    'Bengaluru, India',
                                    'London, UK',
                                    'Dubai, UAE',
                                  ].map((loc) => (
                                    <button
                                      key={loc}
                                      type="button"
                                      onClick={() =>
                                        onDirectUpdateGulfCv({
                                          ...gulfCvData,
                                          currentLocation: loc,
                                          cvPlace: loc.split(',')[0]?.trim() || loc,
                                        })
                                      }
                                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-700 hover:text-white text-slate-700 text-[10px] font-medium cursor-pointer"
                                    >
                                      + {loc}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  4. ഫോൺ & ഇമെയിൽ (Phone & Email):
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={gulfCvData.phone}
                                      onChange={(e) =>
                                        onDirectUpdateGulfCv({
                                          ...gulfCvData,
                                          phone: e.target.value,
                                          whatsapp: e.target.value,
                                        })
                                      }
                                      placeholder="ഫോൺ നമ്പർ"
                                      className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs bg-white text-slate-900"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleInlineFieldVoice(`msg_${msg.id}_cv_ph`, (val) =>
                                          onDirectUpdateGulfCv({
                                            ...gulfCvData,
                                            phone: val,
                                            whatsapp: val,
                                          })
                                        )
                                      }
                                      className={`min-h-[38px] px-2.5 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                        dictatingBoxKey === `msg_${msg.id}_cv_ph`
                                          ? 'bg-red-600 animate-pulse'
                                          : 'bg-emerald-700 hover:bg-emerald-800'
                                      }`}
                                    >
                                      <Mic className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={gulfCvData.email}
                                    onChange={(e) =>
                                      onDirectUpdateGulfCv({
                                        ...gulfCvData,
                                        email: e.target.value,
                                      })
                                    }
                                    placeholder="ഇമെയിൽ (Email)"
                                    className="min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs bg-white text-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeCategory === 'rental_agreement' && (
                            <div className="grid grid-cols-1 gap-2">
                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  1. ഒന്നാം കക്ഷി (കെട്ടിട ഉടമയുടെ പേരും വിലാസവും):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={agreementData.firstPartyDetails}
                                    onChange={(e) =>
                                      onDirectUpdateAgreement({
                                        ...agreementData,
                                        firstPartyDetails: e.target.value,
                                      })
                                    }
                                    className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam bg-white text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleInlineFieldVoice(`msg_${msg.id}_ag_p1`, (val) =>
                                        onDirectUpdateAgreement({
                                          ...agreementData,
                                          firstPartyDetails: val,
                                        })
                                      )
                                    }
                                    className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                      dictatingBoxKey === `msg_${msg.id}_ag_p1`
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-emerald-700 hover:bg-emerald-800'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>
                                      {dictatingBoxKey === `msg_${msg.id}_ag_p1`
                                        ? 'നിർത്തുക'
                                        : 'വോയ്‌സ്'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  2. രണ്ടാം കക്ഷി (വാടകക്കാരന്റെ പേരും വിലാസവും):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={agreementData.secondPartyDetails}
                                    onChange={(e) =>
                                      onDirectUpdateAgreement({
                                        ...agreementData,
                                        secondPartyDetails: e.target.value,
                                      })
                                    }
                                    className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam bg-white text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleInlineFieldVoice(`msg_${msg.id}_ag_p2`, (val) =>
                                        onDirectUpdateAgreement({
                                          ...agreementData,
                                          secondPartyDetails: val,
                                        })
                                      )
                                    }
                                    className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                      dictatingBoxKey === `msg_${msg.id}_ag_p2`
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-emerald-700 hover:bg-emerald-800'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>
                                      {dictatingBoxKey === `msg_${msg.id}_ag_p2`
                                        ? 'നിർത്തുക'
                                        : 'വോയ്‌സ്'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeCategory === 'teacher_marklist' && (
                            <div className="grid grid-cols-1 gap-2">
                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-extrabold text-xs text-emerald-950">
                                  📋 8 മാർക്ക് ലിസ്റ്റ് മോഡലുകൾ (LP/UP ഗ്രേഡ് · ഹൈസ്കൂൾ · മദ്രസ):
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {MARKLIST_PRESET_MODELS.map((preset) => (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => onDirectUpdateMarkList(preset.buildData())}
                                      className={`text-left px-2 py-1.5 rounded-lg border text-[11px] font-malayalam font-bold cursor-pointer ${
                                        markListData.modelPresetId === preset.id
                                          ? 'bg-emerald-800 text-white border-emerald-900'
                                          : 'bg-emerald-50 hover:bg-emerald-100 text-slate-900 border-emerald-200'
                                      }`}
                                    >
                                      {preset.badgeIcon} {preset.titleMalayalam}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  1. സ്കൂളിന്റെ / മദ്രസയുടെ പേര്:
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={markListData.schoolName}
                                    onChange={(e) =>
                                      onDirectUpdateMarkList({
                                        ...markListData,
                                        schoolName: e.target.value,
                                      })
                                    }
                                    className="flex-1 min-h-[38px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam bg-white text-slate-900"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleInlineFieldVoice(
                                        `msg_${msg.id}_ml_school`,
                                        (val) =>
                                          onDirectUpdateMarkList({
                                            ...markListData,
                                            schoolName: val,
                                          })
                                      )
                                    }
                                    className={`min-h-[38px] px-3 rounded-lg text-white text-xs font-malayalam font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                                      dictatingBoxKey === `msg_${msg.id}_ml_school`
                                        ? 'bg-red-600 animate-pulse'
                                        : 'bg-emerald-700 hover:bg-emerald-800'
                                    }`}
                                  >
                                    <Mic className="w-3.5 h-3.5" />
                                    <span>
                                      {dictatingBoxKey === `msg_${msg.id}_ml_school`
                                        ? 'നിർത്തുക'
                                        : 'വോയ്‌സ്'}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                                <label className="block font-malayalam font-bold text-xs text-slate-900">
                                  2. പരീക്ഷയുടെ പേരും ക്ലാസും:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  <input
                                    type="text"
                                    value={markListData.examTitle}
                                    onChange={(e) =>
                                      onDirectUpdateMarkList({
                                        ...markListData,
                                        examTitle: e.target.value,
                                      })
                                    }
                                    placeholder="പരീക്ഷയുടെ പേര്"
                                    className="min-h-[36px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam bg-white text-slate-900"
                                  />
                                  <input
                                    type="text"
                                    value={markListData.classAndDivision}
                                    onChange={(e) =>
                                      onDirectUpdateMarkList({
                                        ...markListData,
                                        classAndDivision: e.target.value,
                                      })
                                    }
                                    placeholder="ക്ലാസ് & ഡിവിഷൻ"
                                    className="min-h-[36px] border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam bg-white text-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={onSwitchToStudioPreview}
                              className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>2. തയ്യാറായ A4 പേപ്പർ കാണുക / തിരുത്തുക →</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        msg.sender === 'bot' &&
                        msg.followUpQuestions &&
                        msg.followUpQuestions.length > 0 && (
                          <div className="mt-3 bg-amber-50/90 border border-amber-200 rounded-xl p-3 space-y-2.5">
                            <p className="font-malayalam font-bold text-xs text-amber-950 leading-relaxed">
                              ഓരോ കോളത്തിലും നേരിട്ട് ടൈപ്പ് ചെയ്യുകയോ 🎙️ വോയ്‌സ് ബട്ടൺ അമർത്തി പറയുകയോ ചെയ്യാം:
                            </p>

                            {msg.followUpQuestions.map((q, qIdx) => {
                              const fieldKey = `${msg.id}_${q.id}`;
                              const currentVal =
                                inlineFieldValues[fieldKey] ??
                                inlineFieldValues[q.id] ??
                                q.defaultValue ??
                                '';
                              const isThisBoxDictating = dictatingBoxKey === fieldKey;
                              const isThisBoxTranscribing = isTranscribingBoxKey === fieldKey;

                              return (
                                <div
                                  key={q.id}
                                  className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-1.5"
                                >
                                  <label className="block font-malayalam font-bold text-xs text-slate-900">
                                    {qIdx + 1}. {q.fieldLabelMalayalam}:
                                  </label>

                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={currentVal}
                                      onFocus={() => {
                                        if (
                                          inlineFieldValues[fieldKey] === undefined &&
                                          q.defaultValue
                                        ) {
                                          setInlineFieldValues((prev) => ({
                                            ...prev,
                                            [fieldKey]: q.defaultValue || '',
                                          }));
                                        }
                                      }}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setInlineFieldValues((prev) => ({
                                          ...prev,
                                          [fieldKey]: val,
                                          [q.id]: val,
                                        }));
                                        applySingleFieldDirectlyToA4(
                                          q.fieldLabelMalayalam,
                                          val,
                                          q.structuredFieldId
                                        );
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleSubmitSingleQuestionField(q, msg.id);
                                        }
                                      }}
                                      placeholder={
                                        isThisBoxDictating
                                          ? '🎙️ ഇപ്പോൾ സമാധാനമായി പറയുക...'
                                          : `${q.fieldLabelMalayalam} ഇവിടെ ടൈപ്പ് ചെയ്യുക...`
                                      }
                                      className="flex-1 min-h-[38px] bg-white border border-slate-300 rounded-lg px-2.5 text-xs font-malayalam text-slate-900"
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleInlineFieldVoice(fieldKey, (spokenVal) => {
                                          setInlineFieldValues((prev) => ({
                                            ...prev,
                                            [fieldKey]: spokenVal,
                                            [q.id]: spokenVal,
                                          }));
                                          applySingleFieldDirectlyToA4(
                                            q.fieldLabelMalayalam,
                                            spokenVal,
                                            q.structuredFieldId
                                          );
                                        })
                                      }
                                      className={`btn-round-3d min-h-[38px] px-3.5 rounded-full text-white text-xs font-malayalam font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                                        isThisBoxDictating
                                          ? 'bg-red-600 hover:bg-red-700 animate-pulse border-red-500 shadow-[0_2px_0_0_#991b1b]'
                                          : 'bg-emerald-700 hover:bg-emerald-800 border-emerald-800 shadow-[0_2px_0_0_#065f46]'
                                      }`}
                                    >
                                      {isThisBoxTranscribing ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Mic className="w-3.5 h-3.5" />
                                      )}
                                      <span>
                                        {isThisBoxTranscribing
                                          ? 'എഴുതുന്നു...'
                                          : isThisBoxDictating
                                          ? 'നിർത്തുക'
                                          : 'വോയ്‌സ്'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      )}

                  {/* Single Clean Link to A4 Preview for Older Bot Replies (No duplicate PDF/Print/WhatsApp buttons in chat!) */}
                  {msg.sender === 'bot' && msg.documentCategory && !isLatestBotMessage && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={onSwitchToStudioPreview}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>A4 പേപ്പർ കാണുക / തിരുത്തുക →</span>
                      </button>
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500 font-mono-num">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && (
                      <CheckCheck className="w-3.5 h-3.5 text-sky-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}

            {isGenerating && (
              <div className="flex items-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-2.5 text-xs font-malayalam text-slate-700">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
                  <span>
                    AI നിങ്ങളുടെ വിവരങ്ങൾ പരിശോധിച്ച് ഔദ്യോഗിക A4 ഡോക്യുമെന്റ് തയ്യാറാക്കുന്നു...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* =================================================================
              BOTTOM BAR: EITHER ACTIVE WHATSAPP VOICE RECORDER OR INPUT BAR
             ================================================================= */}
          {isRecording ? (
            <div className="bg-emerald-950 text-white p-3 border-t border-emerald-800 flex items-center justify-between gap-2.5">
              {/* Trash / Cancel Recording Button */}
              <button
                type="button"
                onClick={onCancelRecording}
                className="min-h-[46px] px-3 rounded-xl bg-white/10 hover:bg-red-600 text-white text-xs font-malayalam font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>ഒഴിവാക്കുക</span>
              </button>

              {/* Recording Timer */}
              <div className="flex flex-col items-center text-center min-w-0">
                <div className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-red-400 fill-red-400 animate-pulse shrink-0" />
                  <span className="font-mono-num font-bold text-base text-emerald-300">
                    {formattedTimer}
                  </span>
                </div>
                <span className="text-[11px] font-malayalam text-emerald-100 truncate max-w-[220px]">
                  സമാധാനമായി മുഴുവൻ കാര്യവും പറയുക...
                </span>
              </div>

              {/* Send Voice Note Button */}
              <button
                type="button"
                onClick={onFinishAndSendRecording}
                className="min-h-[46px] px-4 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-malayalam font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-md"
              >
                <span>വോയ്‌സ് ചേർക്കുക</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative bg-[#F0F2F5] p-2.5 sm:p-3 border-t border-slate-200">
              {/* Camera Choice Popover (Scan Photo/Document vs CV Passport Photo) */}
              {showCameraMenu && (
                <div className="absolute bottom-16 left-3 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 w-72 space-y-1.5">
                  <p className="text-[11px] font-malayalam font-bold text-slate-500 px-2 py-0.5">
                    ഫോട്ടോ / ക്യാമറ ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക:
                  </p>
                  <button
                    type="button"
                    onClick={() => scanPhotoInputRef.current?.click()}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-xs font-malayalam font-bold text-slate-900 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <p>എഴുതിയ കുറിപ്പ് / സർട്ടിഫിക്കറ്റ് ഫോട്ടോ</p>
                      <p className="text-[10px] font-normal text-slate-500">
                        ഫോട്ടോയിലെ വിവരങ്ങൾ വായിച്ച് A4 ഫയൽ ഉണ്ടാക്കാൻ
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => cvPhotoInputRef.current?.click()}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-xs font-malayalam font-bold text-slate-900 flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <p>പാസ്‌പോർട്ട് സൈസ് ഫോട്ടോ (Gulf CV)</p>
                      <p className="text-[10px] font-normal text-slate-500">
                        ഗൾഫ് ബയോഡാറ്റയിൽ നിങ്ങളുടെ ഫോട്ടോ വെക്കാൻ
                      </p>
                    </div>
                  </button>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5 sm:gap-2">
                {/* Camera Button (Opens Photo Scan or CV Photo selector) */}
                <button
                  type="button"
                  onClick={() => setShowCameraMenu((prev) => !prev)}
                  title="ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക (കുറിപ്പ് ഫോട്ടോ അല്ലെങ്കിൽ പാസ്‌പോർട്ട് ഫോട്ടോ)"
                  className="btn-round-3d min-h-[40px] min-w-[40px] sm:min-h-[46px] sm:min-w-[46px] rounded-full bg-white hover:bg-slate-50 border border-slate-300 flex items-center justify-center text-slate-700 transition-all shrink-0 cursor-pointer shadow-[0_3px_0_0_#94a3b8] active:translate-y-0.5 active:shadow-[0_1px_0_0_#94a3b8]"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Universal File / Media Attachment Button (PDF, Photo, Text, CSV, Audio) */}
                <button
                  type="button"
                  onClick={() => universalFileInputRef.current?.click()}
                  title="PDF, ഫോട്ടോ, ടെക്സ്റ്റ്, മാർക്ക് ലിസ്റ്റ്, വോയ്‌സ് ഓഡിയോ തുടങ്ങി ഏത് ഫയലും അപ്‌ലോഡ് ചെയ്യുക"
                  className="btn-round-3d min-h-[40px] min-w-[40px] sm:min-h-[46px] sm:min-w-[46px] rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 transition-all shrink-0 cursor-pointer shadow-[0_3px_0_0_#6ee7b7] active:translate-y-0.5 active:shadow-[0_1px_0_0_#6ee7b7]"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Multi-line-preserving Textarea Input (preserves newlines when pasting CVs or Letters!) */}
                <textarea
                  rows={inputText.includes('\n') ? Math.min(4, inputText.split('\n').length) : 1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !inputText.includes('\n')) {
                      e.preventDefault();
                      handleFormSubmit(e);
                    }
                  }}
                  placeholder="ഇവിടെ ടൈപ്പ് ചെയ്യാം / വോയ്‌സ് പറയാം..."
                  className="flex-1 min-h-[40px] sm:min-h-[46px] max-h-28 py-2 sm:py-3 bg-white border border-slate-300 rounded-2xl px-3 sm:px-4 text-xs sm:text-sm font-malayalam text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-emerald-700 resize-none leading-snug"
                />

                {/* Start WhatsApp-Style Voice Note Recording Button (3D Round Action Button) */}
                {!inputText.trim() ? (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onStartRecording()}
                    title="വോയ്‌സ് നോട്ട് റെക്കോർഡ് ചെയ്യാൻ അമർത്തുക"
                    className="btn-round-3d w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#25D366] via-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-[0_4px_0_0_#065f46,0_8px_16px_rgba(5,150,105,0.3)] active:translate-y-1 active:shadow-[0_1px_0_0_#065f46] border-2 border-emerald-300"
                  >
                    <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.7]" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isGenerating}
                    title="സന്ദേശം അയക്കുക"
                    className="btn-round-3d w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#075E54] to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-[0_4px_0_0_#042f2c,0_8px_16px_rgba(7,94,84,0.3)] active:translate-y-1 active:shadow-[0_1px_0_0_#042f2c]"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </form>
            </div>
          )}
        </>
      ) : (
        /* =================================================================
           EXTERNAL WHATSAPP NUMBER AUTOMATION & OPERATOR ORDER INBOX
           ================================================================= */
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto max-h-[560px]">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2.5">
            <h3 className="font-malayalam font-bold text-sm text-emerald-950 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>വാട്സാപ്പിൽ ലഭിച്ച ഫോട്ടോ / PDF / വോയ്‌സ് / ടെക്സ്റ്റ് ഫയൽ A4 PDF ആക്കാം</span>
            </h3>
            <p className="font-malayalam text-xs text-emerald-900 leading-relaxed">
              ഒരു ഉപഭോക്താവ് നിങ്ങളുടെ വാട്സാപ്പിലേക്ക് അയച്ചുതന്ന വോയ്‌സ് റെക്കോർഡ്, എഴുതിയ പേപ്പറിന്റെ ഫോട്ടോ,
              പഴയ സിവി PDF, അല്ലെങ്കിൽ മാർക്ക് ലിസ്റ്റ് ഫയൽ താഴെ അപ്‌ലോഡ് ചെയ്താൽ മതി — AI അത് വായിച്ച് ഉടൻ
              A4 PDF ആക്കി തരും!
            </p>
            <button
              type="button"
              onClick={() => universalFileInputRef.current?.click()}
              className="w-full min-h-[44px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-malayalam font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Paperclip className="w-4 h-4" />
              <span>വാട്സാപ്പ് ഫയൽ അപ്‌ലോഡ് ചെയ്യുക (Photo / PDF / Audio / Text)</span>
            </button>
          </div>

          {/* Simulate a Customer Sending a Direct WhatsApp Message */}
          <form
            onSubmit={handleSimulateExternalWhatsApp}
            className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
          >
            <p className="font-malayalam font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>
                അല്ലെങ്കിൽ വാട്സാപ്പിൽ വന്ന ടെക്സ്റ്റ് മെസ്സേജ് ഇവിടെ പേസ്റ്റ് ചെയ്ത് A4 PDF ആക്കുക:
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="ഉപഭോക്താവിന്റെ പേര്"
                className="min-h-[42px] bg-white border border-slate-300 rounded-lg px-3 text-xs font-malayalam"
              />
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                placeholder="വാട്സാപ്പ് നമ്പർ"
                className="min-h-[42px] bg-white border border-slate-300 rounded-lg px-3 text-xs font-mono-num"
              />
            </div>
            <textarea
              rows={2}
              value={simMessage}
              onChange={(e) => setSimMessage(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-malayalam"
              placeholder="ഉപഭോക്താവ് അയച്ച വാട്സാപ്പ് മെസ്സേജ്..."
            />
            <button
              type="submit"
              disabled={isSimulatingOrder}
              className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-malayalam font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isSimulatingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>വാട്സാപ്പ് മെസ്സേജിൽ നിന്ന് A4 ഫയൽ നിർമ്മിക്കുന്നു...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>വാട്സാപ്പ് ഓർഡർ സ്വീകരിച്ച് A4 PDF തയ്യാറാക്കുക</span>
                </>
              )}
            </button>
          </form>

          {/* Incoming WhatsApp Orders List */}
          <div className="space-y-2.5">
            <h4 className="font-malayalam font-bold text-xs text-slate-700 uppercase tracking-wider">
              ലഭിച്ച വാട്സാപ്പ് ഓർഡറുകൾ ({incomingOrders.length})
            </h4>
            {incomingOrders.map((ord) => (
              <div
                key={ord.id}
                className="border border-slate-200 rounded-xl p-3.5 bg-white hover:border-emerald-300 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    <span className="font-malayalam font-bold text-xs text-slate-900">
                      {ord.senderProfileName}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="font-mono-num text-xs text-slate-600">
                      {ord.fromPhone}
                    </span>
                  </div>
                  <span className="font-mono-num text-[11px] text-slate-500">
                    {ord.receivedAt}
                  </span>
                </div>

                <p className="font-malayalam text-xs text-slate-800 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  "{ord.incomingText}"
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-malayalam font-semibold text-emerald-800">
                    തയ്യാറാക്കിയത്: {ord.generatedSummary}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSendMessage(ord.incomingText, ord.detectedType);
                        setSubTab('chat');
                      }}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-malayalam font-semibold cursor-pointer shrink-0"
                    >
                      A4 ഷീറ്റിൽ തുറക്കുക
                    </button>
                    <button
                      type="button"
                      onClick={() => onRequestWhatsAppShare(ord.fromPhone)}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-malayalam font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span>വാട്സാപ്പിൽ അയക്കുക</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRequestPrint}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-malayalam font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5 shrink-0" />
                      <span>പ്രിന്റ്</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Direct Native Audio Capture Input for iOS/macOS/Android */}
      <input
        ref={directVoiceCaptureInputRef}
        type="file"
        accept="audio/*,video/mp4,audio/mp4,audio/m4a,audio/wav,audio/webm"
        capture="user"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setMicPermissionHelpOpen(false);
            onUploadAudioFile(file);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Malayalam Microphone Direct Allow Pop-up Modal */}
      {micPermissionHelpOpen && (
        <div
          onClick={() => setMicPermissionHelpOpen(false)}
          className="no-print fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3.5 font-malayalam"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shrink-0">
                  🎙️
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    മൈക്ക് ഓൺ ചെയ്യുക (Direct Allow)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    സെറ്റിംഗ്സിൽ പോകാതെ ഇവിടെനിന്നുതന്നെ നേരിട്ട് മൈക്ക് ഓൺ ചെയ്യാം
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMicPermissionHelpOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Direct Allow & Start Button right inside the popup */}
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
                    setMicPermissionHelpOpen(false);
                    if (pendingInlineTargetRef.current) {
                      const { boxKey, onFillValue } = pendingInlineTargetRef.current;
                      await startInlineMediaRecorder(boxKey, onFillValue, stream);
                    } else {
                      onStartRecording(undefined, true, stream);
                    }
                    return;
                  } catch {
                    // If browser/OS blocked getUserMedia, trigger native voice recorder below
                  }
                }
                directVoiceCaptureInputRef.current?.click();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(5,150,105,0.3)] transition-all active:scale-98 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-amber-300 shrink-0" />
              <span>1. ഇവിടെ തൊട്ട് മൈക്ക് Direct Allow ചെയ്യുക (Allow Now)</span>
            </button>

            {/* 2. Direct iOS/macOS Native Voice Recorder Fallback (Works even if Safari/Mac Settings block web mic) */}
            <button
              type="button"
              onClick={() => {
                setMicPermissionHelpOpen(false);
                directVoiceCaptureInputRef.current?.click();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 font-malayalam font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FileAudio className="w-4 h-4 text-amber-800 shrink-0" />
              <span>2. iOS / Mac ഡയറക്റ്റ് വോയ്‌സ് റെക്കോർഡർ തുറക്കുക</span>
            </button>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <p className="font-bold text-slate-900">💡 ശ്രദ്ധിക്കുക (Mac / iPhone / Android):</p>
              <p className="text-[11px]">
                മുകളിലെ പച്ച ബട്ടണിൽ തൊടുമ്പോൾ വരുന്ന ചെറിയ വിൻഡോയിൽ <strong>&apos;Allow&apos;</strong> അമർത്തിയാൽ ഉടൻ റെക്കോർഡിംഗ് തുടങ്ങും. അല്ലെങ്കിൽ ഫോൺ/മാക് കീബോർഡിലെ 🎙️ മൈക്ക് ചിഹ്നം അമർത്തിയും നേരിട്ട് സംസാരിക്കാം.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setMicPermissionHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold cursor-pointer"
              >
                അടയ്ക്കുക (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
