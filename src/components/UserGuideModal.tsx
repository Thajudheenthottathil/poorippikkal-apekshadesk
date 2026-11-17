import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Mic,
  FileText,
  Download,
  Briefcase,
  X,
  ArrowRight,
  Camera,
  Video,
  Sparkles,
  Loader2,
  MousePointerClick,
  Send,
  MessageSquare,
  BookOpen,
  Film,
} from 'lucide-react';
import { DocumentCategory } from '../types/documents';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: DocumentCategory) => void;
  onOpenPdfUpload: () => void;
  whatsappNumber?: string;
  customVideoUrl?: string;
}

interface VideoGuideScene {
  id: number;
  durationSec: number;
  badge: string;
  titleMalayalam: string;
  shortTextMalayalam: string;
  voiceScriptMalayalam: string;
  imagePrompt: string;
  highlightStep:
    | 'overview'
    | 'job_cv'
    | 'gov_letter'
    | 'form_fill'
    | 'a4_preview'
    | 'multi_lang'
    | 'ai_superpower'
    | 'edit_pdf';
  handStart: { x: number; y: number };
  handTarget: { x: number; y: number };
  tapLabelMalayalam: string;
  screenshotUrl?: string;
  aiBackdropDataUrl?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

const DEFAULT_VIDEO_SCENES: VideoGuideScene[] = [
  {
    id: 1,
    durationSec: 9,
    badge: 'സീൻ 1 / 8 · ഹോം സ്ക്രീൻ & 5 സേവനങ്ങൾ',
    titleMalayalam: '1. വേണ്ട സേവനം വിരൽകൊണ്ട് തൊട്ട് തിരഞ്ഞെടുക്കുക',
    shortTextMalayalam:
      'മുകളിലെ 5 കാർഡുകളിൽ നിന്ന് നിങ്ങൾക്ക് വേണ്ട സേവനം (ജോബ് CV, സർക്കാർ അപേക്ഷ, വാടകക്കരാർ, മാർക്ക് ലിസ്റ്റ്, PDF തിരുത്തൽ) അല്ലെങ്കിൽ "55+ ഫോമുകൾ" തൊട്ട് തിരഞ്ഞെടുക്കുക.',
    voiceScriptMalayalam:
      'നമസ്കാരം, പറയാം പ്രിന്റെടുക്കാം വെബ്സൈറ്റിലേക്ക് സ്വാഗതം. ആദ്യം മുകളിലെ അഞ്ച് കാർഡുകളിൽ നിന്ന് നിങ്ങൾക്ക് വേണ്ട സേവനം വിരൽകൊണ്ട് തൊട്ട് തിരഞ്ഞെടുക്കുക.',
    imagePrompt:
      'Modern clean Kerala digital citizen service portal interface on smartphone desk, warm emerald and gold studio lighting, ultra detailed 8k commercial photography',
    highlightStep: 'overview',
    handStart: { x: 78, y: 82 },
    handTarget: { x: 32, y: 42 },
    tapLabelMalayalam: 'ഇവിടെ തൊടുക: 💼 ജോബ് CV / സർക്കാർ അപേക്ഷ',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-25-30-004_com.android.chrome_eded9c0f.jpg',
  },
  {
    id: 2,
    durationSec: 10,
    badge: 'സീൻ 2 / 8 · എല്ലാ ജോലികൾക്കുമുള്ള CV / ബയോഡാറ്റ',
    titleMalayalam: '2. നാട്ടിലെയും വിദേശത്തെയും ഏത് ജോലിക്കും പ്രൊഫഷണൽ CV!',
    shortTextMalayalam:
      'IT, ടീച്ചർ, നേഴ്സ്, ഫ്രഷർ, അക്കൗണ്ടന്റ്, സെയിൽസ്, UK/യൂറോപ്പ്, ഗൾഫ് — 8 റെഡിമെയ്ഡ് CV മോഡലുകളിൽ ഏതും ഒറ്റ ക്ലിക്കിൽ തിരഞ്ഞെടുത്ത് ഫോട്ടോ ചേർക്കാം.',
    voiceScriptMalayalam:
      'നാട്ടിലോ വിദേശത്തോ ഏത് ജോലിക്ക് അപേക്ഷിക്കാനും എട്ട് തരം സിവി മോഡലുകൾ ഇതിലുണ്ട്. ഐടി, ടീച്ചർ, നേഴ്സ്, ഫ്രഷർ, ഓഫീസ്, യുകെ അല്ലെങ്കിൽ ഗൾഫ് സിവി തിരഞ്ഞെടുത്ത് ഫോട്ടോ ചേർക്കാം.',
    imagePrompt:
      'Professional executive A4 resume biodata document with photo on modern office desk, clean typography, studio lighting, 8k',
    highlightStep: 'job_cv',
    handStart: { x: 74, y: 78 },
    handTarget: { x: 46, y: 34 },
    tapLabelMalayalam: '8 CV മോഡലുകളിൽ ഒന്ന് തിരഞ്ഞെടുക്കുക',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-29-31-232_com.android.chrome_1528de02.jpg',
  },
  {
    id: 3,
    durationSec: 9,
    badge: 'സീൻ 3 / 8 · 55+ സർക്കാർ ഫോമുകളും മൈക്കും',
    titleMalayalam: '3. വില്ലേജ് / പഞ്ചായത്ത് / KSEB ഫോമുകൾ & വോയ്‌സ്',
    shortTextMalayalam:
      'വരുമാനം, ജാതി, KSEB, റേഷൻ കാർഡ്, രാജിക്കത്ത് — പച്ച "🎙️ തൊട്ട് പറയൂ" ബട്ടൺ അമർത്തി സാധാരണ സംസാരിക്കുന്നതുപോലെ നിങ്ങളുടെ ആവശ്യം പറയുക.',
    voiceScriptMalayalam:
      'വില്ലേജ് ഓഫീസ്, പഞ്ചായത്ത്, കെഎസ്ഇബി തുടങ്ങി അമ്പത്തിയഞ്ചിലധികം ഫോമുകൾ ഇതിലുണ്ട്. പച്ച മൈക്ക് ബട്ടൺ തൊട്ട് നിങ്ങളുടെ പേരും ആവശ്യവും സാധാരണ സംസാരിക്കുന്നതുപോലെ പറയുക.',
    imagePrompt:
      'Close up of glowing emerald voice microphone button on smartphone screen with golden sound waves, professional product video shot, 8k',
    highlightStep: 'gov_letter',
    handStart: { x: 25, y: 30 },
    handTarget: { x: 68, y: 76 },
    tapLabelMalayalam: 'മൈക്കിൽ തൊട്ട് സംസാരിക്കുക (🎙️ തൊട്ട് പറയൂ)',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-25-40-025_com.android.chrome_6383faa6.jpg',
  },
  {
    id: 4,
    durationSec: 9,
    badge: 'സീൻ 4 / 8 · ലളിതമായ വിവരങ്ങൾ പൂരിപ്പിക്കൽ',
    titleMalayalam: '4. പേര്, വിലാസം, ഫോൺ നമ്പർ എന്നിവ നൽകുക',
    shortTextMalayalam:
      'താഴെ കാണുന്ന ബോക്സുകളിൽ നിങ്ങളുടെ പേര്, വിലാസം, ഫോൺ നമ്പർ, സമർപ്പിക്കുന്ന ഓഫീസ് എന്നിവ ടൈപ്പ് ചെയ്യുകയോ വോയ്‌സ് ആയി പറയുകയോ ചെയ്യാം.',
    voiceScriptMalayalam:
      'താഴെ കാണുന്ന കോളങ്ങളിൽ നിങ്ങളുടെ പേര്, വിലാസം, ഫോൺ നമ്പർ എന്നിവ എളുപ്പത്തിൽ പൂരിപ്പിക്കാം. ടൈപ്പ് ചെയ്യാൻ ബുദ്ധിമുട്ടുണ്ടെങ്കിൽ മൈക്കിൽ പറഞ്ഞാലും മതി.',
    imagePrompt:
      'Smartphone form input fields in Malayalam with green checkmarks, clean modern UI, 8k',
    highlightStep: 'form_fill',
    handStart: { x: 75, y: 80 },
    handTarget: { x: 48, y: 46 },
    tapLabelMalayalam: 'വിവരങ്ങൾ പൂരിപ്പിച്ച് "പേപ്പറിലേക്ക് ചേർക്കുക" തൊടുക',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-26-36-380_com.android.chrome_0c34a112.jpg',
  },
  {
    id: 5,
    durationSec: 9,
    badge: 'സീൻ 5 / 8 · A4 പേപ്പർ പ്രിവ്യൂ & തൊട്ട് തിരുത്തൽ',
    titleMalayalam: '5. "2. A4 പേപ്പർ" തൊട്ട് പേപ്പറിൽ നേരിട്ട് തിരുത്താം!',
    shortTextMalayalam:
      'താഴെയുള്ള "2. A4 പേപ്പർ" ബട്ടൺ തൊട്ടാൽ പൂർണ്ണമായ A4 പേപ്പർ കാണാം. പേപ്പറിലെ ഏത് അക്ഷരത്തിലും വിരൽകൊണ്ട് നേരിട്ട് തൊട്ട് തിരുത്താൻ സാധിക്കും!',
    voiceScriptMalayalam:
      'താഴെയുള്ള രണ്ടാമത്തെ എ ഫോർ പേപ്പർ ബട്ടൺ തൊട്ടാൽ നിങ്ങളുടെ അപേക്ഷ പേപ്പറിൽ കാണാം. പേപ്പറിലെ ഏത് വാക്കിലും വിരൽകൊണ്ട് നേരിട്ട് തൊട്ട് തിരുത്താൻ സാധിക്കും.',
    imagePrompt:
      'Crisp official A4 Malayalam application paper preview on smartphone screen, studio lighting, 8k',
    highlightStep: 'a4_preview',
    handStart: { x: 24, y: 88 },
    handTarget: { x: 52, y: 54 },
    tapLabelMalayalam: 'പേപ്പറിലെ ഏത് വാക്കിലും തൊട്ട് തിരുത്താം',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-26-40-543_com.android.chrome_a1b0b30d.jpg',
  },
  {
    id: 6,
    durationSec: 9,
    badge: 'സീൻ 6 / 8 · 6 ഭാഷകളിലേക്ക് ഒറ്റ ക്ലിക്കിൽ മാറ്റാം',
    titleMalayalam: '6. മലയാളം, ഇംഗ്ലീഷ്, അറബിക്, ഹിന്ദി, തമിഴ്, ഉറുദു!',
    shortTextMalayalam:
      'നിങ്ങൾ തയ്യാറാക്കിയ അപേക്ഷയോ കത്തോ ഒറ്റ ക്ലിക്കിൽ ഇംഗ്ലീഷ്, അറബിക്, ഹിന്ദി, തമിഴ്, ഉറുദു അല്ലെങ്കിൽ മലയാളം ഭാഷകളിലേക്ക് മാറ്റാൻ സാധിക്കും.',
    voiceScriptMalayalam:
      'നിങ്ങൾ മലയാളത്തിൽ തയ്യാറാക്കിയ അപേക്ഷ ഒറ്റ ക്ലിക്കിൽ ഇംഗ്ലീഷ്, അറബിക്, ഹിന്ദി, തമിഴ് അല്ലെങ്കിൽ ഉറുദു ഭാഷകളിലേക്ക് മാറ്റാൻ സാധിക്കും.',
    imagePrompt:
      'Multilingual translation menu on smartphone showing Malayalam English Arabic Hindi Tamil options, 8k',
    highlightStep: 'multi_lang',
    handStart: { x: 78, y: 76 },
    handTarget: { x: 50, y: 38 },
    tapLabelMalayalam: 'ആവശ്യമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-28-27-437_com.android.chrome_385bb28c.jpg',
  },
  {
    id: 7,
    durationSec: 9,
    badge: 'സീൻ 7 / 8 · ഹഗ്ഗിംഗ് ഫേസ് എഐ സൂപ്പർ-പവർ',
    titleMalayalam: '7. "🚀 എഐ CV പവർ-ബൂസ്റ്റ്" & "✨ ഔദ്യോഗിക ഭാഷയാക്കുക"',
    shortTextMalayalam:
      'ഹഗ്ഗിംഗ് ഫേസ് എഐ ഉപയോഗിച്ച് നിങ്ങളുടെ സിവി കൂടുതൽ മികച്ചതാക്കാനും അപേക്ഷകൾ നല്ല ഔദ്യോഗിക ഭാഷയിലാക്കാനും അക്ഷരത്തെറ്റുകൾ തിരുത്താനും ഒറ്റ ക്ലിക്ക് മതി!',
    voiceScriptMalayalam:
      'എഐ സൂപ്പർ പവർ ബട്ടൺ അമർത്തിയാൽ നിങ്ങളുടെ സിവി അന്താരാഷ്ട്ര നിലവാരത്തിലേക്ക് ഉയർത്താനും അപേക്ഷകൾ മികച്ച ഔദ്യോഗിക ഭാഷയിലാക്കാനും സാധിക്കും.',
    imagePrompt:
      'AI superpower enhancement toolbar on mobile app with golden sparkles, studio product shot, 8k',
    highlightStep: 'ai_superpower',
    handStart: { x: 74, y: 80 },
    handTarget: { x: 44, y: 34 },
    tapLabelMalayalam: 'ഇവിടെ തൊടുക: 🚀 എഐ പവർ-ബൂസ്റ്റ്',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-29-33-183_com.android.chrome_960a92f4.jpg',
  },
  {
    id: 8,
    durationSec: 10,
    badge: 'സീൻ 8 / 8 · ഒറ്റ പേജ് A4 PDF ഡൗൺലോഡ് & പ്രിന്റ്',
    titleMalayalam: '8. പച്ച "PDF" ബട്ടൺ അമർത്തി ഫോണിൽ സേവ് ചെയ്യാം!',
    shortTextMalayalam:
      'എല്ലാം ശരിയായാൽ മുകളിലോ താഴെയോ ഉള്ള പച്ച "PDF" ബട്ടൺ അമർത്തി ഫോണിൽ സേവ് ചെയ്യാം, പ്രിന്റ് എടുക്കാം, അല്ലെങ്കിൽ വാട്സാപ്പിൽ ഷെയർ ചെയ്യാം!',
    voiceScriptMalayalam:
      'എല്ലാം ശരിയായാൽ പച്ച പിഡിഎഫ് ബട്ടൺ അമർത്തി വൃത്തിയുള്ള ഒറ്റ പേജ് എ ഫോർ പിഡിഎഫ് ഫോണിൽ ഡൗൺലോഡ് ചെയ്യാം, അല്ലെങ്കിൽ നേരിട്ട് പ്രിന്റ് എടുക്കാം.',
    imagePrompt:
      'Clean A4 official document preview on mobile and laptop with green PDF download button highlighted, high contrast commercial UI, 8k',
    highlightStep: 'edit_pdf',
    handStart: { x: 42, y: 62 },
    handTarget: { x: 84, y: 88 },
    tapLabelMalayalam: 'ഇവിടെ തൊടുക: ⬇ PDF ഡൗൺലോഡ്',
    screenshotUrl:
      '/assets/aistudio/Screenshot_2026-11-06-17-27-31-217_com.android.chrome_ba6382e6.jpg',
  },
];

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }
  return null;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  onOpenPdfUpload,
  customVideoUrl,
}) => {
  const [scenes, setScenes] = useState<VideoGuideScene[]>(DEFAULT_VIDEO_SCENES);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sceneIndex, setSceneIndex] = useState<number>(0);
  const [sceneElapsedMs, setSceneElapsedMs] = useState<number>(0);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [showCustomBuilder, setShowCustomBuilder] = useState<boolean>(false);
  const [isExportingVideo, setIsExportingVideo] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [isGeneratingHfAssets, setIsGeneratingHfAssets] = useState<boolean>(false);
  const [hfAssetsReady, setHfAssetsReady] = useState<boolean>(false);

  // Tucked-away AI Help Chatbot State (Closed by default as a small button!)
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [helpChatMessages, setHelpChatMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      text: string;
      suggestedAction?:
        | 'malayalam_letter'
        | 'gulf_cv'
        | 'rental_agreement'
        | 'teacher_marklist'
        | 'pdf_upload';
      suggestedActionLabel?: string;
    }>
  >([
    {
      id: 'help-welcome',
      role: 'assistant',
      text: 'നമസ്കാരം! 🙏 ഞാൻ നിങ്ങളുടെ എഐ സഹായിയാണ്. ഈ വെബ്സൈറ്റിനെക്കുറിച്ചോ ഏത് അപേക്ഷയെക്കുറിച്ചും താഴെ ചോദിക്കൂ — ചുരുക്കി കൃത്യമായി പറഞ്ഞുതരാം!',
    },
  ]);
  const [helpInput, setHelpInput] = useState<string>('');
  const [isAskingHelpAi, setIsAskingHelpAi] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement | null>(null);
  const helpChatEndRef = useRef<HTMLDivElement | null>(null);

  // Preload server-side Malayalam neural voiceover audio + Hugging Face FLUX scene backdrops
  const loadHfStudioVideoAssets = async (withAiBackdrops = true) => {
    if (isGeneratingHfAssets) return;
    setIsGeneratingHfAssets(true);
    try {
      const response = await fetch('/api/hf-generate-guide-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generateAiBackdrops: withAiBackdrops,
          scenes: scenes.map((sc) => ({
            id: sc.id,
            voiceScriptMalayalam: sc.voiceScriptMalayalam,
            imagePrompt: sc.imagePrompt,
            titleMalayalam: sc.titleMalayalam,
          })),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.scenes)) {
          setScenes((prev) =>
            prev.map((sc) => {
              const found = data.scenes.find((item: any) => item.id === sc.id);
              if (!found) return sc;
              return {
                ...sc,
                audioBase64: found.audioBase64 || sc.audioBase64,
                audioMimeType: found.audioMimeType || sc.audioMimeType || 'audio/mpeg',
                aiBackdropDataUrl: found.aiBackdropDataUrl || sc.aiBackdropDataUrl,
              };
            })
          );
          setHfAssetsReady(true);
        }
      }
    } catch {
      // Fallback gracefully if network is slow
    } finally {
      setIsGeneratingHfAssets(false);
    }
  };

  // Automatically preload Malayalam Studio Voiceover audio when modal opens
  useEffect(() => {
    if (isOpen && !hfAssetsReady && !isGeneratingHfAssets) {
      loadHfStudioVideoAssets(true);
    }
  }, [isOpen]);

  const stopSpeech = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {
        // ignore
      }
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speakScene = async (scene: VideoGuideScene) => {
    stopSpeech();
    if (!voiceEnabled) return;

    // 1. Prefer real server-generated Malayalam Studio MP3/FLAC voiceover!
    if (scene.audioBase64) {
      try {
        const audioSrc = `data:${scene.audioMimeType || 'audio/mpeg'};base64,${scene.audioBase64}`;
        const audio = new Audio(audioSrc);
        activeAudioRef.current = audio;
        await audio.play();
        return;
      } catch {
        // Fallback below if autoplay blocked
      }
    }

    // 2. Fetch on-the-fly from /api/malayalam-tts-audio if not yet cached
    try {
      const res = await fetch('/api/malayalam-tts-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.voiceScriptMalayalam }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.audioBase64) {
          setScenes((prev) =>
            prev.map((s) =>
              s.id === scene.id
                ? { ...s, audioBase64: data.audioBase64, audioMimeType: data.mimeType || 'audio/mpeg' }
                : s
            )
          );
          const audioSrc = `data:${data.mimeType || 'audio/mpeg'};base64,${data.audioBase64}`;
          const audio = new Audio(audioSrc);
          activeAudioRef.current = audio;
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to browser speechSynthesis
    }

    // 3. Final fallback to browser speechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scene.voiceScriptMalayalam);
        utterance.lang = 'ml-IN';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const malayalamVoice = voices.find(
          (v) => v.lang.toLowerCase().includes('ml') || v.name.toLowerCase().includes('malayalam')
        );
        if (malayalamVoice) {
          utterance.voice = malayalamVoice;
        }
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore TTS errors
      }
    }
  };

  // Instant 0-cost client-side answer matcher so common questions NEVER consume LLM API quota!
  const getZeroCostLocalAnswer = (
    questionText: string
  ): {
    reply: string;
    suggestedAction?:
      | 'malayalam_letter'
      | 'gulf_cv'
      | 'rental_agreement'
      | 'teacher_marklist'
      | 'pdf_upload';
    suggestedActionLabel?: string;
  } | null => {
    const q = questionText.toLowerCase();
    if (q.includes('എന്തിനാണ്') || q.includes('എന്താണ് ഈ') || q.includes('ഉപയോഗം')) {
      return {
        reply:
          'മലയാളത്തിൽ സംസാരിച്ചുകൊണ്ട് 1 മിനിറ്റിൽ ഗൾഫ് CV, വില്ലേജ്/പഞ്ചായത്ത് അപേക്ഷകൾ, വാടകക്കരാർ, മാർക്ക് ലിസ്റ്റ് എന്നിവ തയ്യാറാക്കി A4 PDF പ്രിന്റ് എടുക്കാനുള്ള സംവിധാനമാണിത്.',
        suggestedAction: 'malayalam_letter',
        suggestedActionLabel: 'അപേക്ഷ തയ്യാറാക്കാം',
      };
    }
    if (q.includes('cv') || q.includes('സിവി') || q.includes('ബയോഡാറ്റ') || q.includes('ജോലി')) {
      return {
        reply:
          '1️⃣ "✈️ ഗൾഫ് CV" കാർഡിൽ തൊടുക.\n2️⃣ മൈക്കിൽ മലയാളത്തിൽ പേരും ജോലിയും പറഞ്ഞാൽ 100% ഇംഗ്ലീഷ് A4 CV തയ്യാറാകും.\n3️⃣ ഫോട്ടോ ചേർത്ത് "PDF" ബട്ടൺ അമർത്തുക.',
        suggestedAction: 'gulf_cv',
        suggestedActionLabel: '✈️ ഗൾഫ് CV തുറക്കുക',
      };
    }
    if (q.includes('തിരുത്ത') && !q.includes('pdf')) {
      return {
        reply:
          'താഴെയുള്ള "2. പേപ്പർ കാണുക" ബട്ടൺ തൊട്ടാൽ A4 പേപ്പർ കാണാം. പേപ്പറിലെ ഏത് വാക്കിലും വിരൽകൊണ്ട് നേരിട്ട് തൊട്ട് അക്ഷരങ്ങൾ തിരുത്താം!',
        suggestedAction: 'malayalam_letter',
        suggestedActionLabel: 'പേപ്പർ തുറക്കുക',
      };
    }
    if (q.includes('വാടക') || q.includes('കരാർ') || q.includes('മുദ്രപ്പത്ര')) {
      return {
        reply:
          '"📜 വാടകക്കരാർ" കാർഡ് തൊട്ടാൽ വീട്/കടമുറി വാടകക്കരാർ റെഡിയാകും. മുദ്രപ്പത്രത്തിൽ (Stamp Paper) പ്രിന്റ് എടുക്കാൻ മുകളിൽ 3 ഇഞ്ച് / 3.5 ഇഞ്ച് ഗ്യാപ്പ് ക്രമീകരിക്കാം.',
        suggestedAction: 'rental_agreement',
        suggestedActionLabel: '📜 വാടകക്കരാർ തുറക്കുക',
      };
    }
    if (q.includes('pdf') || q.includes('പിഡിഎഫ്') || q.includes('പഴയ')) {
      return {
        reply:
          '"📄 PDF തിരുത്താം" കാർഡിൽ തൊട്ട് നിങ്ങളുടെ ഫോണിലുള്ള പഴയ PDF അപ്‌ലോഡ് ചെയ്താൽ അതിലെ ഏത് എഴുത്തും മായ്ക്കാനും പുതിയത് എഴുതാനും സാധിക്കും.',
        suggestedAction: 'pdf_upload',
        suggestedActionLabel: '📄 PDF അപ്‌ലോഡ് ചെയ്യുക',
      };
    }
    if (q.includes('വരുമാന') || q.includes('ജാതി') || q.includes('വില്ലേജ്')) {
      return {
        reply:
          'വരുമാന സർട്ടിഫിക്കറ്റ്, ജാതി സർട്ടിഫിക്കറ്റ് എന്നിവയ്ക്ക് ആധാർ കാർഡ്, റേഷൻ കാർഡ്, നികുതി രസീത് പകർപ്പുകൾ മതി. "🏛️ സർക്കാർ അപേക്ഷ" കാർഡിൽ തൊട്ട് ഫോം എടുക്കാം.',
        suggestedAction: 'malayalam_letter',
        suggestedActionLabel: '🏛️ വില്ലേജ് ഫോം എടുക്കുക',
      };
    }
    return null;
  };

  const handleAskHelpChatbot = async (rawQuestion?: string) => {
    const q = (rawQuestion ?? helpInput).trim();
    if (!q || isAskingHelpAi) return;
    if (!rawQuestion) setHelpInput('');

    const userMsgId = `u-${Date.now()}`;
    const updatedHistory = [...helpChatMessages, { id: userMsgId, role: 'user' as const, text: q }];
    setHelpChatMessages(updatedHistory);

    const localMatch = getZeroCostLocalAnswer(q);
    if (localMatch) {
      setHelpChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: localMatch.reply,
          suggestedAction: localMatch.suggestedAction,
          suggestedActionLabel: localMatch.suggestedActionLabel,
        },
      ]);
      setTimeout(() => {
        helpChatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
      return;
    }

    setIsAskingHelpAi(true);
    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          history: updatedHistory.slice(-4).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      const replyText =
        data?.reply ||
        '1️⃣ വേണ്ട കാർഡ് തൊട്ട് മൈക്കിൽ പറയുക.\n2️⃣ "2. പേപ്പർ കാണുക" തൊട്ട് തിരുത്തുക.\n3️⃣ "PDF" ബട്ടൺ അമർത്തി സേവ് ചെയ്യുക.';
      setHelpChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          suggestedAction: data?.suggestedAction,
          suggestedActionLabel: data?.suggestedActionLabel,
        },
      ]);
    } catch {
      setHelpChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: '1️⃣ വേണ്ട കാർഡ് തൊട്ട് മൈക്കിൽ പറയുക.\n2️⃣ "2. പേപ്പർ കാണുക" തൊട്ട് ഏത് അക്ഷരവും മാറ്റുക.\n3️⃣ "PDF" ബട്ടൺ അമർത്തി സേവ് ചെയ്യുക.',
        },
      ]);
    } finally {
      setIsAskingHelpAi(false);
      setTimeout(() => {
        helpChatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  };

  const currentScene = scenes[sceneIndex] || scenes[0];
  const youtubeEmbed = getYoutubeEmbedUrl(customVideoUrl);
  const isDirectVideoFile =
    !youtubeEmbed && customVideoUrl && /\.(mp4|webm|ogg)(\?.*)?$/i.test(customVideoUrl.trim());

  const sceneProgress = Math.min(1, sceneElapsedMs / (currentScene.durationSec * 1000));
  const moveRatio = Math.min(1, sceneProgress / 0.28);
  const easedMove = 1 - Math.pow(1 - moveRatio, 3);
  const currentHandX =
    currentScene.handStart.x + (currentScene.handTarget.x - currentScene.handStart.x) * easedMove;
  const currentHandY =
    currentScene.handStart.y + (currentScene.handTarget.y - currentScene.handStart.y) * easedMove;
  const isTappingNow = sceneProgress >= 0.28;

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setSceneIndex(0);
      setSceneElapsedMs(0);
      stopSpeech();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    speakScene(currentScene);

    const stepMs = 50;
    timerRef.current = window.setInterval(() => {
      setSceneElapsedMs((prev) => {
        const next = prev + stepMs;
        if (next >= currentScene.durationSec * 1000) {
          if (sceneIndex < scenes.length - 1) {
            setSceneIndex((s) => s + 1);
            return 0;
          } else {
            setIsPlaying(false);
            return currentScene.durationSec * 1000;
          }
        }
        return next;
      });
    }, stepMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, sceneIndex, voiceEnabled]);

  if (!isOpen) return null;

  const totalDurationMs = scenes.reduce((acc, s) => acc + s.durationSec * 1000, 0);
  const completedPriorMs = scenes
    .slice(0, sceneIndex)
    .reduce((acc, s) => acc + s.durationSec * 1000, 0);
  const overallProgressPercent = Math.min(
    100,
    Math.round(((completedPriorMs + sceneElapsedMs) / totalDurationMs) * 100)
  );

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeech();
    } else {
      if (
        sceneIndex === scenes.length - 1 &&
        sceneElapsedMs >= currentScene.durationSec * 1000
      ) {
        setSceneIndex(0);
        setSceneElapsedMs(0);
      }
      setIsPlaying(true);
    }
  };

  const handleRestartVideo = () => {
    stopSpeech();
    setSceneIndex(0);
    setSceneElapsedMs(0);
    setIsPlaying(true);
  };

  const handleUploadSceneScreenshot = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setScenes((prev) =>
        prev.map((sc, idx) => (idx === sceneIndex ? { ...sc, screenshotUrl: dataUrl } : sc))
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSetHandTargetOnStage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showCustomBuilder) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(8, Math.min(92, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.max(8, Math.min(92, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setScenes((prev) =>
      prev.map((sc, idx) =>
        idx === sceneIndex
          ? {
              ...sc,
              handTarget: { x: xPct, y: yPct },
            }
          : sc
      )
    );
    setSceneElapsedMs(Math.round(currentScene.durationSec * 1000 * 0.45));
  };

  // High-Professional 1080p HD Video + Embedded Malayalam Studio Voiceover Exporter
  const handleExportHandTouchVideo = async () => {
    if (isExportingVideo) return;
    stopSpeech();
    setIsPlaying(false);
    setIsExportingVideo(true);
    setExportProgress(3);
    setExportStatusText('Hugging Face AI വിഷ്വലുകളും മലയാളം ശബ്ദവും തയ്യാറാക്കുന്നു...');

    try {
      // Step 1: Ensure all 5 scenes have server-generated Malayalam voiceover MP3 + AI backdrops
      let workingScenes = [...scenes];
      try {
        const res = await fetch('/api/hf-generate-guide-scenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            generateAiBackdrops: true,
            scenes: workingScenes.map((sc) => ({
              id: sc.id,
              voiceScriptMalayalam: sc.voiceScriptMalayalam,
              imagePrompt: sc.imagePrompt,
              titleMalayalam: sc.titleMalayalam,
            })),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.scenes)) {
            workingScenes = workingScenes.map((sc) => {
              const match = data.scenes.find((item: any) => item.id === sc.id);
              return match
                ? {
                    ...sc,
                    audioBase64: match.audioBase64 || sc.audioBase64,
                    audioMimeType: match.audioMimeType || sc.audioMimeType || 'audio/mpeg',
                    aiBackdropDataUrl: match.aiBackdropDataUrl || sc.aiBackdropDataUrl,
                  }
                : sc;
            });
            setScenes(workingScenes);
            setHfAssetsReady(true);
          }
        }
      } catch {
        // Continue with available assets
      }

      setExportProgress(12);
      setExportStatusText('1080p HD ക്യാൻവാസും ഓഡിയോ ട്രാക്കും ക്രമീകരിക്കുന്നു...');

      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsExportingVideo(false);
        return;
      }

      // Load screenshots and AI backdrops for each scene
      const loadImg = (src?: string) =>
        new Promise<HTMLImageElement | null>((resolve) => {
          if (!src) {
            resolve(null);
            return;
          }
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });

      const sceneScreenshots = await Promise.all(workingScenes.map((sc) => loadImg(sc.screenshotUrl)));
      const sceneAiBackdrops = await Promise.all(
        workingScenes.map((sc) => loadImg(sc.aiBackdropDataUrl))
      );

      // Set up WebAudio Context to embed REAL Malayalam voiceover + gentle studio chime into the video stream!
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = AudioCtx ? new AudioCtx() : null;
      const audioDest = audioCtx ? audioCtx.createMediaStreamDestination() : null;

      // Decode Malayalam voiceover buffers ahead of time so we know exact scene durations
      const decodedAudioBuffers: Array<AudioBuffer | null> = await Promise.all(
        workingScenes.map(async (sc) => {
          if (!audioCtx || !sc.audioBase64) return null;
          try {
            const binary = window.atob(sc.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            return await audioCtx.decodeAudioData(bytes.buffer.slice(0));
          } catch {
            return null;
          }
        })
      );

      const canvasStream = canvas.captureStream(30);
      const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
      if (audioDest && audioDest.stream.getAudioTracks().length > 0) {
        combinedTracks.push(...audioDest.stream.getAudioTracks());
      }
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4_500_000,
      });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start(200);

      // Helper to draw vector 3D hand pointer on HD canvas
      const drawVectorHandCursor = (x: number, y: number, isTapping: boolean, frameIdx: number) => {
        ctx.save();
        if (isTapping) {
          const r1 = ((frameIdx % 24) / 24) * 78 + 24;
          const r2 = (((frameIdx + 12) % 24) / 24) * 78 + 24;
          ctx.beginPath();
          ctx.arc(x, y, r1, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.lineWidth = 7;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, r2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
          ctx.lineWidth = 5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, 28, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.fill();
        }

        ctx.translate(x, y);
        if (isTapping) {
          ctx.scale(0.92, 0.92);
        }

        // Outer glow shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;

        // Crisp stylized vector pointer hand
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(-12, 0, 24, 52, 12);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(-24, 28, 62, 54, 20);
        ctx.fill();
        ctx.stroke();

        // Fingertip highlight dot
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const fps = 24;
      const sceneDurationsSec = workingScenes.map((sc, idx) => {
        const buf = decodedAudioBuffers[idx];
        return buf ? Math.max(5.5, Math.min(11, buf.duration + 0.8)) : 6.5;
      });
      const totalFrames = sceneDurationsSec.reduce((acc, d) => acc + Math.round(d * fps), 0);
      let renderedFrames = 0;

      for (let sIdx = 0; sIdx < workingScenes.length; sIdx++) {
        const sc = workingScenes[sIdx];
        const screenshotImg = sceneScreenshots[sIdx];
        const aiBackdropImg = sceneAiBackdrops[sIdx];
        const voiceBuf = decodedAudioBuffers[sIdx];
        const durationSec = sceneDurationsSec[sIdx];
        const framesForScene = Math.round(durationSec * fps);

        setExportStatusText(`സീൻ ${sIdx + 1} / ${workingScenes.length} റെക്കോർഡ് ചെയ്യുന്നു...`);

        // Trigger Malayalam voiceover audio into both the recorded stream AND speakers
        if (audioCtx && audioDest && voiceBuf) {
          try {
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }
            const source = audioCtx.createBufferSource();
            source.buffer = voiceBuf;
            source.connect(audioDest);
            if (voiceEnabled) {
              source.connect(audioCtx.destination);
            }
            source.start();
          } catch {
            // ignore audio routing error
          }
        }

        const frameIntervalMs = 1000 / fps;
        for (let f = 0; f < framesForScene; f++) {
          const frameStart = performance.now();
          const p = f / framesForScene;
          const mRatio = Math.min(1, p / 0.28);
          const ease = 1 - Math.pow(1 - mRatio, 3);
          const hx = sc.handStart.x + (sc.handTarget.x - sc.handStart.x) * ease;
          const hy = sc.handStart.y + (sc.handTarget.y - sc.handStart.y) * ease;
          const tapping = p >= 0.28;

          // 1. Studio Cinema Background (AI FLUX Backdrop or Deep Emerald Gradient)
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, '#022C22');
          grad.addColorStop(0.5, '#064E3B');
          grad.addColorStop(1, '#0F172A');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (aiBackdropImg) {
            ctx.save();
            ctx.globalAlpha = 0.22;
            ctx.drawImage(aiBackdropImg, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          }

          // 2. Top Broadcast Header Banner
          ctx.fillStyle = 'rgba(7, 94, 84, 0.96)';
          ctx.fillRect(0, 0, canvas.width, 165);
          ctx.fillStyle = '#FBBF24';
          ctx.fillRect(0, 160, canvas.width, 6);

          ctx.fillStyle = '#FBBF24';
          ctx.font = 'bold 30px "Noto Sans Malayalam", sans-serif';
          ctx.fillText(sc.badge, 48, 66);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 40px "Noto Sans Malayalam", sans-serif';
          ctx.fillText('പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)', 48, 126);

          // 3. Center Phone / App Interactive Stage Frame
          const px = 70;
          const py = 210;
          const pw = 940;
          const ph = 1180;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 16;
          ctx.beginPath();
          ctx.roundRect(px, py, pw, ph, 42);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
          ctx.clip();

          // Smooth camera zoom toward hand target when tapping
          const zoomFactor = tapping ? 1.06 : 1.0;
          const tx = px + (pw * sc.handTarget.x) / 100;
          const ty = py + (ph * sc.handTarget.y) / 100;
          ctx.translate(tx, ty);
          ctx.scale(zoomFactor, zoomFactor);
          ctx.translate(-tx, -ty);

          ctx.fillStyle = '#0F172A';
          ctx.fillRect(px, py, pw, ph);

          if (screenshotImg) {
            const scale = Math.min(pw / screenshotImg.width, ph / screenshotImg.height);
            const dw = screenshotImg.width * scale;
            const dh = screenshotImg.height * scale;
            ctx.drawImage(screenshotImg, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh);
          } else {
            ctx.fillStyle = '#075E54';
            ctx.fillRect(px, py, pw, 120);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 34px "Noto Sans Malayalam", sans-serif';
            ctx.fillText('പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് (Apeksha Desk)', px + 40, py + 74);
          }

          // Draw Vector Hand Gesture & Floating Callout Pill
          const fingerX = px + (pw * hx) / 100;
          const fingerY = py + (ph * hy) / 100;
          drawVectorHandCursor(fingerX, fingerY, tapping, f);

          const pillW = 540;
          const pillX = Math.max(px + 24, Math.min(px + pw - pillW - 24, fingerX - pillW / 2));
          const pillY = Math.min(py + ph - 95, fingerY + 95);
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, 68, 18);
          ctx.fill();
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 28px "Noto Sans Malayalam", sans-serif';
          ctx.fillText(sc.tapLabelMalayalam.slice(0, 34), pillX + 26, pillY + 44);

          ctx.restore();

          // 4. Broadcast Lower-Third Malayalam Subtitle Box
          ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
          ctx.fillRect(0, 1430, canvas.width, 490);
          ctx.fillStyle = '#10B981';
          ctx.fillRect(0, 1430, canvas.width * p, 10);

          ctx.fillStyle = '#FBBF24';
          ctx.font = 'bold 38px "Noto Sans Malayalam", sans-serif';
          ctx.fillText(sc.titleMalayalam.slice(0, 44), 54, 1515);

          ctx.fillStyle = '#F8FAFC';
          ctx.font = '31px "Noto Sans Malayalam", sans-serif';
          const words = sc.voiceScriptMalayalam.split(' ');
          let line = '';
          let yLine = 1585;
          for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (test.length > 42) {
              ctx.fillText(line, 54, yLine);
              line = w;
              yLine += 52;
            } else {
              line = test;
            }
          }
          if (line) {
            ctx.fillText(line, 54, yLine);
          }

          renderedFrames++;
          setExportProgress(Math.min(99, 12 + Math.round((renderedFrames / totalFrames) * 87)));

          const elapsed = performance.now() - frameStart;
          const waitMs = Math.max(8, Math.round(frameIntervalMs - elapsed));
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }

      recorder.stop();
      const videoBlob = await recordingDone;
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parayam-printedukkam-malayalam-guide-hd.webm';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore export error
    } finally {
      setIsExportingVideo(false);
      setExportProgress(0);
      setExportStatusText('');
    }
  };

  return (
    <div
      onClick={() => {
        stopSpeech();
        onClose();
      }}
      className="no-print fixed inset-0 z-[100] bg-slate-900/65 backdrop-blur-xs flex items-start justify-center pt-2 sm:pt-6 p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Top Modal Header */}
        <div className="bg-[#075E54] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-malayalam font-black text-sm sm:text-base text-white truncate">
                യൂസർ മാനുവൽ & പ്രൊഫഷണൽ എഐ വീഡിയോ ഗൈഡ്
              </h2>
              <p className="font-malayalam text-[11px] text-emerald-100 truncate">
                ഘട്ടം ഘട്ടമായുള്ള മലയാളം യൂസർ മാനുവലും സ്റ്റുഡിയോ ശബ്ദത്തോടുകൂടിയ വീഡിയോ ഗൈഡും
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title="അടയ്ക്കുക"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable User Manual Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 font-malayalam">
          {/* =================================================================
              SECTION 1: "എന്തിനാണ് ഈ വെബ്സൈറ്റ്?" — CLEAR INTRODUCTION
             ================================================================= */}
          <div className="bg-emerald-50/90 border-2 border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white text-[11px] font-black">
                  ഭാഗം 1 · ആമുഖം
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  എന്തിനാണ് ഈ വെബ്സൈറ്റ്?
                </h3>
              </div>

              {/* Small Tucked-Away AI Chatbot Toggle Button in Top Right of Manual */}
              <button
                type="button"
                onClick={() => setIsChatbotOpen((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isChatbotOpen ? 'ചാറ്റ് അടയ്ക്കുക ✕' : '🤖 സംശയം ചോദിക്കാം'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 font-bold leading-relaxed">
              👉{' '}
              <span className="text-emerald-900 underline">
                ഇതിൽ നിങ്ങൾക്ക് എന്ത് അപേക്ഷയും തയ്യാറാക്കാൻ പറ്റും!
              </span>{' '}
              ടൈപ്പിംഗ് അറിയാത്തവർക്കും കമ്പ്യൂട്ടർ ഇല്ലാത്തവർക്കും സ്വന്തം ഫോണിൽ മലയാളത്തിൽ
              സംസാരിച്ചുകൊണ്ട് 1 മിനിറ്റിൽ പ്രിന്റ് എടുക്കാൻ തയ്യാറായ A4 പേപ്പർ (PDF) ഉണ്ടാക്കാനുള്ള
              ഡിജിറ്റൽ ജനസേവന സംവിധാനമാണിത്.
            </p>

            {/* Collapsible AI Chatbot Box (Only opens when user taps the small button!) */}
            {isChatbotOpen && (
              <div className="mt-3 pt-3 border-t border-emerald-200 bg-white rounded-2xl p-3 space-y-2.5 border shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs text-emerald-950">
                    🤖 എഐ സഹായി — ഏത് സംശയവും ചോദിക്കാം:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChatbotOpen(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                  >
                    ✕ അടയ്ക്കുക
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    'ജോലിക്ക് ഇംഗ്ലീഷ് CV എങ്ങനെ ഉണ്ടാക്കാം?',
                    'അക്ഷരങ്ങൾ എങ്ങനെ തൊട്ട് തിരുത്താം?',
                    'വാടകക്കരാർ മുദ്രപ്പത്രത്തിൽ എങ്ങനെ എടുക്കാം?',
                    'പഴയ PDF എങ്ങനെ തിരുത്താം?',
                    'വരുമാന സർട്ടിഫിക്കറ്റിന് എന്തൊക്കെ രേഖകൾ വേണം?',
                  ].map((qChip) => (
                    <button
                      key={qChip}
                      type="button"
                      onClick={() => handleAskHelpChatbot(qChip)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      ? {qChip}
                    </button>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-h-44 overflow-y-auto space-y-2">
                  {helpChatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[92%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        {msg.text.replace(/\*\*/g, '')}
                        {msg.role === 'assistant' &&
                          msg.suggestedAction &&
                          msg.suggestedActionLabel && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  stopSpeech();
                                  if (msg.suggestedAction === 'pdf_upload') {
                                    onOpenPdfUpload();
                                  } else if (msg.suggestedAction) {
                                    onSelectCategory(msg.suggestedAction);
                                  }
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer"
                              >
                                <span>{msg.suggestedActionLabel}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                  {isAskingHelpAi && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 px-2 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>ഉത്തരം തയ്യാറാക്കുന്നു...</span>
                    </div>
                  )}
                  <div ref={helpChatEndRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskHelpChatbot();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={helpInput}
                    onChange={(e) => setHelpInput(e.target.value)}
                    placeholder="നിങ്ങളുടെ സംശയം ഇവിടെ ടൈപ്പ് ചെയ്യുക..."
                    className="flex-1 min-h-[36px] bg-white text-slate-900 placeholder:text-slate-400 rounded-xl px-3 py-1 text-xs font-bold border border-slate-300 focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    disabled={isAskingHelpAi || !helpInput.trim()}
                    className="min-h-[36px] px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ചോദിക്കുക</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* =================================================================
              SECTION 2: STEP-BY-STEP USER MANUAL (എങ്ങനെ ഉപയോഗിക്കണം? — 4 സ്റ്റെപ്പുകൾ)
             ================================================================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-black">
                ഭാഗം 2 · യൂസർ ഗൈഡ്
              </span>
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                എങ്ങനെ ഉപയോഗിക്കണം? (ഘട്ടം ഘട്ടമായുള്ള നിർദ്ദേശങ്ങൾ)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    വേണ്ട പേപ്പർ തിരഞ്ഞെടുക്കുക
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  മുകളിലെ 5 കാർഡുകളിൽ നിന്ന് നിങ്ങൾക്ക് വേണ്ട പേപ്പർ (
                  <strong>ഗൾഫ് CV, സർക്കാർ അപേക്ഷ, വാടകക്കരാർ, മാർക്ക് ലിസ്റ്റ്, PDF തിരുത്തൽ</strong>
                  ) വിരൽകൊണ്ട് തൊടുക. അല്ലെങ്കിൽ <strong>"55+ ഫോമുകൾ"</strong> ബട്ടൺ തൊട്ട് ഫോം
                  തിരഞ്ഞെടുക്കുക.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    മൈക്കിൽ പറയുക / പൂരിപ്പിക്കുക
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  പച്ച <strong>"🎙️ തൊട്ട് പറയൂ"</strong> ബട്ടൺ അമർത്തി നിങ്ങളുടെ പേര്, വിലാസം, ആവശ്യം
                  എന്നിവ സാധാരണ സംസാരിക്കുന്നതുപോലെ പറയുക. അല്ലെങ്കിൽ താഴെ കാണുന്ന കോളങ്ങളിൽ നേരിട്ട്
                  ടൈപ്പ് ചെയ്യാം.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    പേപ്പറിൽ നേരിട്ട് തൊട്ട് തിരുത്തുക
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  മൊബൈലിൽ ഏറ്റവും താഴെയുള്ള <strong>"2. പേപ്പർ കാണുക"</strong> ബട്ടൺ തൊട്ടാൽ
                  (ലാപ്‌ടോപ്പിൽ വലതുവശത്ത്) A4 പേപ്പർ കാണാം. പേപ്പറിലെ{' '}
                  <strong>ഏത് അക്ഷരത്തിലും നേരിട്ട് തൊട്ട്</strong> തിരുത്തലുകൾ വരുത്താം!
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <span className="font-black text-xs sm:text-sm text-slate-900">
                    PDF സേവ് ചെയ്യുക / പ്രിന്റ് എടുക്കുക
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  വിവരങ്ങൾ എല്ലാം ശരിയായാൽ <strong>"PDF"</strong> ബട്ടൺ അമർത്തി ഫോണിലേക്കോ
                  കമ്പ്യൂട്ടറിലേക്കോ ഡൗൺലോഡ് ചെയ്യാം, നേരിട്ട് <strong>"പ്രിന്റ്"</strong> എടുക്കാം,
                  അല്ലെങ്കിൽ വാട്സാപ്പിലേക്ക് <strong>"ഷെയർ"</strong> ചെയ്യാം.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================================
              SECTION 3: "ഇതിൽ എന്തൊക്കെ പേപ്പറുകൾ തയ്യാറാക്കാം?" — DETAILED SERVICE MANUAL
             ================================================================= */}
          <div className="bg-amber-50/90 border-2 border-amber-200 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[11px] font-black">
                  ഭാഗം 3 · സേവനങ്ങൾ
                </span>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  ഇതിൽ എന്തൊക്കെ പേപ്പറുകൾ തയ്യാറാക്കാം?
                </h3>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <strong>1. 💼 ജോലിക്കാര്യം — എല്ലാ നാട്ടിലെയും ജോബ് CV (8 മോഡലുകൾ) & രാജിക്കത്ത്:</strong>{' '}
                  കേരളത്തിലോ ഇന്ത്യയിലോ യു.കെ/യൂറോപ്പ്/കാനഡയിലോ ഗൾഫിലോ ജോലിക്ക് അപേക്ഷിക്കാൻ{' '}
                  <strong>8 തരം പ്രൊഫഷണൽ ഇംഗ്ലീഷ് A4 CV മോഡലുകൾ (IT, ടീച്ചർ, നേഴ്സ്, ഫ്രഷർ, ഓഫീസ്, സെയിൽസ്, UK/EU, ഗൾഫ്)</strong>{' '}
                  ഫോട്ടോ സഹിതം റെഡിയാകും! കൂടാതെ ജോലി അപേക്ഷ, അവധി അപേക്ഷ, രാജിക്കത്ത് എന്നിവയും എടുക്കാം.
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <strong>2. 🏛️ 55+ സർക്കാർ & പൊതു അപേക്ഷകൾ:</strong> വില്ലേജ് ഓഫീസ് (വരുമാനം, ജാതി,
                  കൈവശാവകാശം, നോൺ-ക്രീമിലെയർ), പഞ്ചായത്ത് (കെട്ടിട നമ്പർ, ജനന/മരണ സർട്ടിഫിക്കറ്റ്),
                  KSEB, വാട്ടർ അതോറിറ്റി, റേഷൻ കാർഡ്, പോലീസ് പരാതി, ബാങ്ക് അപേക്ഷകൾ എന്നിവയെല്ലാം
                  കൃത്യമായ ഫോർമാറ്റിൽ തയ്യാറാക്കാം.
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <strong>3. 📜 വാടകക്കരാർ & സത്യവാങ്മൂലം (മുദ്രപ്പത്രം പ്രിന്റിംഗ്):</strong> വീട്
                  അല്ലെങ്കിൽ കടമുറി വാടകക്കരാർ തയ്യാറാക്കാം. മുദ്രപ്പത്രത്തിൽ (Stamp Paper) പ്രിന്റ്
                  എടുക്കുമ്പോൾ മുകളിലെ മുദ്ര ഒഴിവാക്കാൻ{' '}
                  <strong>3 ഇഞ്ച് / 3.5 ഇഞ്ച് / 4 ഇഞ്ച് ഒഴിഞ്ഞ സ്ഥലം (Margin)</strong> സെറ്റ് ചെയ്യാം.
                </div>
              </li>

              <li className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-amber-200/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <strong>4. 🎓 സ്കൂൾ / മദ്രസ മാർക്ക് ലിസ്റ്റ് & 📄 പഴയ PDF തിരുത്തൽ:</strong>{' '}
                  അധ്യാപകർക്ക് കുട്ടികളുടെ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് തയ്യാറാക്കാം. കൂടാതെ നിങ്ങളുടെ
                  ഫോണിലുള്ള <strong>പഴയ PDF അപ്‌ലോഡ് ചെയ്ത്</strong> അതിലെ ഏത് എഴുത്തും തിരുത്തി പുതിയ
                  PDF ആക്കാം.
                </div>
              </li>
            </ul>
          </div>

          {/* =================================================================
              SECTION 4: HIGH-PROFESSIONAL HUGGING FACE AI + MALAYALAM STUDIO VIDEO PLAYER
             ================================================================= */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-md">
            <div className="px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    ഭാഗം 4 · ഹൈ-പ്രൊഫഷണൽ എഐ വീഡിയോ ഗൈഡ് (മലയാളം ശബ്ദവിവരണം + HD വിഷ്വൽസ്)
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isGeneratingHfAssets}
                  onClick={() => loadHfStudioVideoAssets(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600/50 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {isGeneratingHfAssets ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI റെൻഡറിംഗ്...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{hfAssetsReady ? '✓ HF AI Studio Ready' : '⚡ HF AI ബൂസ്റ്റ്'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCustomBuilder((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    showCustomBuilder
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{showCustomBuilder ? 'സ്റ്റുഡിയോ അടയ്ക്കുക' : '📸 കസ്റ്റം എഡിറ്റ്'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = !voiceEnabled;
                    setVoiceEnabled(next);
                    if (!next) stopSpeech();
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {voiceEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ശബ്ദം ON</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <span>ശബ്ദം OFF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {youtubeEmbed ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={youtubeEmbed}
                  title="User Guide Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : isDirectVideoFile ? (
              <div className="aspect-video w-full bg-black">
                <video src={customVideoUrl} controls className="w-full h-full" />
              </div>
            ) : null}

            {/* Built-in High-Professional Studio Video Stage */}
            <div className="p-3.5 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/80 space-y-3.5">
              {/* Top Scene Badge & 5-Scene Chapter Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                  {currentScene.badge}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {scenes.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSceneIndex(idx);
                        setSceneElapsedMs(0);
                        if (isPlaying) {
                          speakScene(s);
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                        sceneIndex === idx
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      സീൻ {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {showCustomBuilder && (
                <div className="bg-slate-950/90 border border-amber-400/40 rounded-2xl p-3 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        സീൻ {sceneIndex + 1}-ലേക്ക് സ്ക്രീൻഷോട്ട് ചേർക്കാം & തൊടേണ്ട സ്ഥലം ക്ലിക്ക് ചെയ്യാം:
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => screenshotInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>സ്ക്രീൻഷോട്ട് മാറ്റുക</span>
                      </button>
                      <input
                        ref={screenshotInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadSceneScreenshot(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      താഴെ കാണുന്ന സ്ക്രീനിൽ എവിടെ ക്ലിക്ക് ചെയ്താലും അവിടേക്ക് കൈവിരൽ നീങ്ങി തൊടുന്ന മോഷൻ ക്രമീകരിക്കപ്പെടും.
                    </span>
                  </p>
                </div>
              )}

              {/* Cinema Stage with AI Backdrop + Live Interactive App Mockup + Vector 3D Hand Gesture */}
              <div
                onClick={handleSetHandTargetOnStage}
                className={`relative bg-slate-950 border-2 border-slate-700 rounded-2xl overflow-hidden select-none shadow-2xl ${
                  showCustomBuilder ? 'cursor-crosshair ring-2 ring-amber-400' : ''
                }`}
              >
                {/* Optional Hugging Face FLUX AI Studio Backdrop Layer */}
                {currentScene.aiBackdropDataUrl && (
                  <img
                    src={currentScene.aiBackdropDataUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                  />
                )}

                <div
                  className="relative w-full min-h-[420px] sm:min-h-[520px] p-2 sm:p-4 flex flex-col items-center justify-center transition-transform duration-300"
                  style={{
                    transform: isTappingNow ? 'scale(1.02)' : 'scale(1)',
                    transformOrigin: `${currentScene.handTarget.x}% ${currentScene.handTarget.y}%`,
                  }}
                >
                  {/* Full-Height Real Mobile Screenshot Showcase for All 8 Scenes */}
                  {currentScene.screenshotUrl ? (
                    <div className="relative w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl flex items-center justify-center">
                      <img
                        src={currentScene.screenshotUrl}
                        alt={currentScene.titleMalayalam}
                        className="max-w-full max-h-full w-auto h-full object-contain mx-auto select-none"
                      />
                      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-emerald-500/40 pointer-events-none">
                        <span className="text-[11px] font-bold text-emerald-300 truncate">
                          {currentScene.badge}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] shrink-0">
                          FULL SCREENSHOT {sceneIndex + 1}/8
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* High-Precision Vector 3D Hand Cursor Overlay */}
                  <div
                    className="pointer-events-none absolute z-20 transition-all duration-75"
                    style={{
                      left: `${currentHandX}%`,
                      top: `${currentHandY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {isTappingNow && (
                      <>
                        <span className="absolute -left-7 -top-7 w-14 h-14 rounded-full bg-amber-400/60 animate-ping" />
                        <span className="absolute -left-5 -top-5 w-10 h-10 rounded-full border-2 border-emerald-400 bg-emerald-400/30" />
                      </>
                    )}

                    <div
                      className={`relative flex flex-col items-center transition-transform duration-150 ${
                        isTappingNow ? 'scale-90 translate-y-1' : 'scale-105'
                      }`}
                    >
                      {/* Crisp SVG Vector Hand Pointer */}
                      <svg
                        viewBox="0 0 64 64"
                        className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)]"
                      >
                        <circle cx="28" cy="10" r="7" fill="#FBBF24" />
                        <path
                          d="M24 10 C24 6, 32 6, 32 10 L32 30 L46 30 C50 30, 52 34, 52 38 L50 52 C49 56, 45 58, 40 58 L22 58 C17 58, 14 54, 13 48 L11 36 C10 32, 14 29, 18 31 L24 34 Z"
                          fill="#FFFFFF"
                          stroke="#0F172A"
                          strokeWidth="3.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="mt-0.5 px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-malayalam font-black text-[10px] sm:text-[11px] whitespace-nowrap shadow-lg border border-slate-900">
                        {currentScene.tapLabelMalayalam}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Broadcast Lower-Third Malayalam Subtitle Bar */}
                <div className="bg-slate-950/95 px-4 py-3 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-extrabold text-xs sm:text-sm text-amber-300">
                      {currentScene.titleMalayalam}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                      {currentScene.audioBase64 ? '🔊 Studio Voice HD' : '🔊 Malayalam Voice'}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-100 leading-relaxed">
                    {currentScene.voiceScriptMalayalam}
                  </p>
                </div>
              </div>

              {/* Video Controls & Progress Bar */}
              <div className="space-y-2.5">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-100"
                    style={{ width: `${overallProgressPercent}%` }}
                  />
                </div>

                {isExportingVideo && exportStatusText && (
                  <div className="bg-emerald-950/90 border border-emerald-500/40 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs text-emerald-200 font-bold">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <span>{exportStatusText}</span>
                    </div>
                    <span className="text-amber-300 font-black">{exportProgress}%</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-slate-950" />
                        <span>താൽക്കാലികമായി നിർത്തുക (Pause)</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>▶ പ്രൊഫഷണൽ ഗൈഡ് വീഡിയോ പ്ലേ ചെയ്യുക</span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isExportingVideo}
                      onClick={handleExportHandTouchVideo}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      {isExportingVideo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>HD റെക്കോർഡിംഗ് {exportProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>🎬 ശബ്ദത്തോടുകൂടിയ HD വീഡിയോ ഡൗൺലോഡ്</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestartVideo}
                      className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ആദ്യം മുതൽ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================================
              SECTION 5: QUICK LAUNCH BUTTONS (ഇപ്പോൾ തന്നെ തുടങ്ങാൻ)
             ================================================================= */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onSelectCategory('malayalam_letter');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>അപേക്ഷ എഴുതാൻ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onSelectCategory('gulf_cv');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5 text-sky-700" />
                <span>ഇംഗ്ലീഷ് CV ഉണ്ടാക്കാൻ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopSpeech();
                  onOpenPdfUpload();
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <span>📄 പഴയ PDF തിരുത്താൻ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Sticky Close Button */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsChatbotOpen((prev) => !prev)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 font-malayalam font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>🤖 എഐ സഹായി</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-[#075E54] hover:bg-emerald-800 text-white font-malayalam font-black text-xs sm:text-sm cursor-pointer shadow-xs transition-colors"
          >
            മനസ്സിലായി, തുടങ്ങാം ✓
          </button>
        </div>
      </div>
    </div>
  );
};
