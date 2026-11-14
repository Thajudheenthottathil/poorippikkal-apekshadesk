import React, { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import {
  DocumentOutputLanguage,
  GulfCvData,
  MalayalamLetterData,
} from '../types/documents';
import {
  applyLocalLanguageConversionToCv,
  applyLocalLanguageConversionToLetter,
} from '../utils/languageTranslator';

interface AtsResumeTailorModalProps {
  isOpen: boolean;
  gulfCvData: GulfCvData;
  outputLanguage: DocumentOutputLanguage;
  onChangeOutputLanguage: (lang: DocumentOutputLanguage) => void;
  autoFillCvText: string;
  onChangeAutoFillCvText: (val: string) => void;
  onExecuteAutoFillCv: () => void;
  isGeneratingAutoFill: boolean;
  onApplyTailoredCv: (updatedCv: GulfCvData, lang: DocumentOutputLanguage) => void;
  onApplyCoverLetter: (coverLetter: MalayalamLetterData, lang: DocumentOutputLanguage) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

interface CoachSuggestionItem {
  id: string;
  field: 'professionalSummary' | 'experienceBullet' | 'coreSkills' | 'jobTitle';
  label: string;
  proposedText?: string;
  proposedSkills?: string[];
  status?: 'pending' | 'accepted' | 'rejected';
}

interface TrackedJobApplication {
  id: string;
  company: string;
  role: string;
  matchScore: number;
  language: DocumentOutputLanguage;
  date: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
}

const JOB_TRACKER_STORAGE_KEY = 'apeksha_desk_ats_job_tracker_v1';

const LANGUAGE_OPTIONS: Array<{ code: DocumentOutputLanguage; label: string }> = [
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'en', label: 'English (ഇംഗ്ലീഷ്)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'ur', label: 'اردو (Urdu)' },
];

const MULTILINGUAL_STOPWORDS = new Set([
  // English stopwords
  'about', 'above', 'across', 'after', 'again', 'against', 'all', 'almost', 'alone', 'along',
  'already', 'also', 'although', 'always', 'among', 'amount', 'and', 'another', 'any', 'anyone',
  'anything', 'anywhere', 'applicant', 'application', 'apply', 'applying', 'are', 'area', 'areas',
  'around', 'available', 'back', 'based', 'because', 'become', 'been', 'before', 'behind', 'being',
  'below', 'best', 'better', 'between', 'both', 'bring', 'build', 'building', 'business', 'candidate',
  'candidates', 'career', 'closely', 'company', 'competitive', 'complete', 'completed', 'day', 'days',
  'degree', 'department', 'description', 'desired', 'details', 'develop', 'developing', 'different',
  'directly', 'does', 'doing', 'done', 'during', 'duties', 'duty', 'each', 'early', 'easy', 'effective',
  'effectively', 'either', 'else', 'email', 'employee', 'employees', 'employer', 'employment', 'ensure',
  'ensuring', 'environment', 'equal', 'essential', 'established', 'even', 'every', 'everyone', 'everything',
  'excellent', 'existing', 'expected', 'experience', 'experienced', 'fast', 'field', 'find', 'first',
  'following', 'for', 'form', 'forward', 'free', 'from', 'full', 'fully', 'further', 'general', 'get',
  'getting', 'give', 'given', 'giving', 'global', 'goal', 'goals', 'good', 'great', 'group', 'growing',
  'growth', 'handle', 'handling', 'hands', 'hard', 'have', 'having', 'help', 'helping', 'here', 'high',
  'highly', 'hire', 'hiring', 'hold', 'holding', 'hours', 'how', 'however', 'ideal', 'ideally',
  'immediately', 'impact', 'important', 'improve', 'improving', 'include', 'includes', 'including',
  'individual', 'individuals', 'industry', 'information', 'into', 'involved', 'job', 'join', 'joining',
  'keep', 'keeping', 'key', 'kind', 'know', 'knowledge', 'known', 'large', 'last', 'later', 'lead',
  'leading', 'learn', 'learning', 'least', 'less', 'level', 'like', 'likely', 'line', 'list', 'local',
  'located', 'location', 'long', 'look', 'looking', 'made', 'main', 'maintain', 'maintaining', 'major',
  'make', 'making', 'manage', 'management', 'manager', 'managing', 'many', 'market', 'may', 'mean',
  'means', 'meet', 'meeting', 'member', 'members', 'minimum', 'month', 'months', 'more', 'most', 'mostly',
  'move', 'moving', 'much', 'multiple', 'must', 'name', 'need', 'needed', 'needs', 'new', 'next', 'none',
  'normal', 'not', 'note', 'nothing', 'now', 'number', 'numbers', 'offer', 'offered', 'offering', 'office',
  'often', 'once', 'one', 'ones', 'online', 'only', 'open', 'opening', 'operate', 'operating', 'opportunity',
  'optional', 'order', 'organization', 'organizational', 'other', 'others', 'our', 'out', 'overall', 'over',
  'own', 'package', 'part', 'particular', 'particularly', 'partner', 'partners', 'passionate', 'past',
  'pay', 'people', 'per', 'perform', 'performance', 'performing', 'period', 'person', 'personal', 'place',
  'plan', 'planning', 'plans', 'play', 'please', 'plus', 'point', 'points', 'policies', 'policy',
  'position', 'positions', 'positive', 'possible', 'post', 'potential', 'preferred', 'prepare', 'preparing',
  'present', 'previous', 'primarily', 'primary', 'prior', 'proactive', 'problem', 'problems', 'process',
  'processes', 'produce', 'product', 'products', 'professional', 'professionals', 'program', 'programs',
  'project', 'projects', 'promote', 'proven', 'provide', 'provided', 'providing', 'public', 'qualification',
  'qualifications', 'qualified', 'quality', 'quick', 'quickly', 'range', 'rate', 'rather', 'reach', 'ready',
  'real', 'really', 'receive', 'recent', 'recently', 'record', 'regular', 'regularly', 'related',
  'relationship', 'relationships', 'relevant', 'reliable', 'report', 'reporting', 'reports', 'require',
  'required', 'requirement', 'requirements', 'requires', 'requiring', 'responsibility', 'responsibilities',
  'responsible', 'result', 'results', 'resume', 'review', 'right', 'role', 'roles', 'run', 'running',
  'salary', 'same', 'schedule', 'search', 'seeking', 'seen', 'select', 'selected', 'self', 'send',
  'senior', 'sense', 'service', 'services', 'set', 'setting', 'several', 'shall', 'share', 'sharing',
  'shift', 'short', 'should', 'show', 'showing', 'shown', 'side', 'similar', 'simple', 'since', 'single',
  'site', 'situation', 'size', 'skill', 'skilled', 'skills', 'small', 'solid', 'solution', 'solutions',
  'some', 'someone', 'something', 'sometimes', 'soon', 'sound', 'specific', 'specifically', 'staff',
  'stage', 'standard', 'standards', 'start', 'starting', 'state', 'status', 'stay', 'step', 'steps',
  'still', 'strong', 'strongly', 'structure', 'submit', 'success', 'successful', 'successfully', 'such',
  'suitable', 'summary', 'support', 'supporting', 'sure', 'system', 'systems', 'take', 'taken', 'taking',
  'target', 'targets', 'task', 'tasks', 'team', 'teams', 'technical', 'technology', 'term', 'terms',
  'than', 'that', 'the', 'their', 'them', 'themselves', 'then', 'there', 'therefore', 'these', 'they',
  'thing', 'things', 'think', 'thinking', 'third', 'this', 'those', 'though', 'three', 'through',
  'throughout', 'thus', 'time', 'timely', 'times', 'title', 'today', 'together', 'tool', 'tools', 'top',
  'total', 'toward', 'towards', 'track', 'training', 'true', 'turn', 'two', 'type', 'types', 'under',
  'understand', 'understanding', 'unit', 'until', 'up', 'upon', 'use', 'used', 'useful', 'user', 'users',
  'using', 'usually', 'valid', 'value', 'values', 'various', 'very', 'via', 'view', 'visit', 'want',
  'way', 'ways', 'week', 'weeks', 'well', 'were', 'what', 'whatever', 'when', 'where', 'whether', 'which',
  'while', 'who', 'whole', 'whom', 'whose', 'why', 'wide', 'will', 'willing', 'with', 'within', 'without',
  'word', 'words', 'work', 'working', 'works', 'world', 'would', 'write', 'writing', 'written', 'year',
  'years', 'yet', 'you', 'your', 'yours', 'yourself',
  // Common Malayalam functional stopwords
  'എന്ന', 'എന്നിവ', 'അല്ലെങ്കിൽ', 'കൂടാതെ', 'വേണ്ടി', 'ഉള്ള', 'ആയ', 'ഒരു', 'ഇത്', 'ആണ്', 'ഉണ്ട്',
  'തസ്തിക', 'ജോലി', 'കമ്പനി', 'സ്ഥാപനം', 'ആവശ്യകതകൾ', 'വിലാസം', 'പേര്',
]);

const PRIORITY_ATS_PHRASES = [
  'defensive driving',
  'route navigation',
  'fleet management',
  'preventive maintenance',
  'vehicle inspection',
  'rta regulations',
  'gcc experience',
  'uae driving license',
  'heavy vehicle',
  'light vehicle',
  'customer service',
  'cash handling',
  'inventory management',
  'supply chain',
  'warehouse operations',
  'quality assurance',
  'health and safety',
  'hse compliance',
  'financial reporting',
  'accounts payable',
  'accounts receivable',
  'bank reconciliation',
  'vat filing',
  'tally erp',
  'microsoft excel',
  'ms office',
  'project management',
  'sales operations',
  'lead generation',
  'client relations',
  'patient care',
  'infection control',
  'data entry',
  'document control',
  'technical support',
  'troubleshooting',
  'network administration',
  'ഡ്രൈവിംഗ് ലൈസൻസ്',
  'കസ്റ്റമർ സർവീസ്',
  'അക്കൗണ്ടിംഗ്',
  'ടാലി',
  'ജിഎസ്ടി',
  'സെയിൽസ്',
  'മാനേജ്മെന്റ്',
];

const SAMPLE_JOB_DESCRIPTIONS: Array<{
  label: string;
  lang: DocumentOutputLanguage;
  role: string;
  company: string;
  jd: string;
}> = [
  {
    label: '🌴 മലയാളം JD (സെയിൽസ് & ഓഫീസ് അഡ്മിൻ)',
    lang: 'ml',
    role: 'സെയിൽസ് & ഓഫീസ് അഡ്മിനിസ്ട്രേറ്റർ (Sales & Office Admin)',
    company: 'മലബാർ ഗോൾഡ് & റീട്ടെയിൽ ഗ്രൂപ്പ്, കൊച്ചി',
    jd: `തസ്തിക: സെയിൽസ് & ഓഫീസ് അഡ്മിനിസ്ട്രേറ്റർ
സ്ഥാപനം: മലബാർ ഗോൾഡ് & റീട്ടെയിൽ ഗ്രൂപ്പ്, കൊച്ചി
ആവശ്യകതകൾ:
- കസ്റ്റമർ സർവീസ്, ബില്ലിംഗ്, ഇൻവെന്ററി മാനേജ്മെന്റ്, ക്യാഷ് ഹാൻഡ്‌ലിംഗ് എന്നിവയിൽ പ്രവൃത്തിപരിചയം.
- കമ്പ്യൂട്ടർ പരിജ്ഞാനം, MS Office, Excel, Tally, GST Billing എന്നിവയിൽ പ്രാവീണ്യം.
- മലയാളം, ഇംഗ്ലീഷ് ഭാഷകളിൽ മികച്ച ആശയവിനിമയ ശേഷിയും ടീം മാനേജ്മെന്റ് കഴിവും.`,
  },
  {
    label: '🚛 Transport / Driver (UAE & GCC)',
    lang: 'en',
    role: 'Light & Heavy Vehicle Driver / Fleet Coordinator',
    company: 'Al Futtaim Logistics LLC, Dubai',
    jd: `Job Title: Light & Heavy Vehicle Driver / Fleet Coordinator
Company: Al Futtaim Logistics LLC, Dubai, UAE
Requirements:
- Valid UAE Driving License with proven GCC experience and clean traffic record.
- Strong knowledge of Defensive Driving, Route Navigation across Dubai, Abu Dhabi, and Sharjah, and RTA Regulations.
- Experience in Vehicle Inspection, Preventive Maintenance, Delivery Documentation, and Customer Service.
- Ability to handle GPS Navigation, Time Management, Safety Compliance, and Basic Arabic / English communication.`,
  },
  {
    label: '📊 Accountant / Finance (Corporate)',
    lang: 'en',
    role: 'Senior Accountant & VAT Executive',
    company: 'Emirates Trading & Finance Group',
    jd: `Job Title: Senior Accountant & Finance Executive
Company: Emirates Trading & Finance Group
Requirements:
- Hands-on experience in Financial Reporting, Accounts Payable, Accounts Receivable, and Bank Reconciliation.
- Proficiency in Tally ERP, Zoho Books, Microsoft Excel, and UAE VAT Filing compliance.
- Strong skills in Payroll Processing, Audit Preparation, Cash Flow Management, Invoicing, and Cost Control.`,
  },
];

/**
 * 100% Deterministic Multilingual ATS Keyword Extractor & Matcher
 * Supports Malayalam, English, Arabic, Hindi, Tamil, and Urdu scripts via Unicode property escapes.
 */
export function analyzeAtsKeywordMatchDeterministically(
  cv: GulfCvData,
  jobDescription: string
): {
  scorePercent: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  totalKeywords: number;
} {
  const cleanJd = (jobDescription || '').trim();
  if (!cleanJd) {
    return { scorePercent: 0, matchedKeywords: [], missingKeywords: [], totalKeywords: 0 };
  }

  const jdLower = cleanJd.toLowerCase();

  const expText = (cv.workExperience || [])
    .map((e) => `${e.role} ${e.company} ${e.location} ${(e.highlights || []).join(' ')}`)
    .join(' ');
  const eduText = (cv.education || [])
    .map((e) => `${e.degree} ${e.institution}`)
    .join(' ');

  const resumeCorpus = [
    cv.jobTitle || '',
    cv.professionalSummary || '',
    (cv.coreSkills || []).join(' '),
    expText,
    eduText,
    cv.drivingLicense || '',
    cv.visaStatus || '',
    (cv.languages || []).join(' '),
  ]
    .join(' ')
    .toLowerCase();

  const extractedKeywords = new Map<string, string>();

  // 1. Check multi-word priority phrases
  for (const phrase of PRIORITY_ATS_PHRASES) {
    if (jdLower.includes(phrase.toLowerCase())) {
      const display = phrase
        .split(' ')
        .map((w) =>
          /^[a-zA-Z]+$/.test(w)
            ? w.length <= 3 && w === w.toUpperCase()
              ? w.toUpperCase()
              : w.charAt(0).toUpperCase() + w.slice(1)
            : w
        )
        .join(' ');
      extractedKeywords.set(phrase.toLowerCase(), display);
    }
  }

  // 2. Unicode-aware token extraction (Malayalam, English, Arabic, Hindi, Tamil, Urdu)
  const unicodeTokenRegex = /[\p{L}\p{M}\p{N}+#./-]{3,28}/gu;
  const rawTokens = cleanJd.match(unicodeTokenRegex) || [];

  for (const token of rawTokens) {
    const cleaned = token.replace(/[.,;:!?()[\]]+$/g, '').trim();
    const lower = cleaned.toLowerCase();
    if (lower.length < 3) continue;
    if (MULTILINGUAL_STOPWORDS.has(lower)) continue;
    if (/^\d+$/.test(lower)) continue;

    let alreadyCoveredInPhrase = false;
    for (const existingPhrase of extractedKeywords.keys()) {
      if (existingPhrase.includes(' ') && existingPhrase.split(' ').includes(lower)) {
        alreadyCoveredInPhrase = true;
        break;
      }
    }
    if (alreadyCoveredInPhrase) continue;

    if (!extractedKeywords.has(lower)) {
      const isLatin = /^[a-zA-Z0-9+#./-]+$/.test(cleaned);
      const display = isLatin
        ? cleaned === cleaned.toUpperCase() && cleaned.length <= 5
          ? cleaned
          : cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
        : cleaned;
      extractedKeywords.set(lower, display);
    }
    if (extractedKeywords.size >= 24) break;
  }

  const allKeywords = Array.from(extractedKeywords.entries());
  if (allKeywords.length === 0) {
    return { scorePercent: 100, matchedKeywords: [], missingKeywords: [], totalKeywords: 0 };
  }

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const [lowerKey, displayKey] of allKeywords) {
    if (resumeCorpus.includes(lowerKey)) {
      matchedKeywords.push(displayKey);
    } else {
      missingKeywords.push(displayKey);
    }
  }

  const scorePercent = Math.round((matchedKeywords.length / allKeywords.length) * 100);
  return {
    scorePercent,
    matchedKeywords,
    missingKeywords,
    totalKeywords: allKeywords.length,
  };
}

export const AtsResumeTailorModal: React.FC<AtsResumeTailorModalProps> = ({
  isOpen,
  gulfCvData,
  outputLanguage,
  onChangeOutputLanguage,
  autoFillCvText,
  onChangeAutoFillCvText,
  onExecuteAutoFillCv,
  isGeneratingAutoFill,
  onApplyTailoredCv,
  onApplyCoverLetter,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ats_tailor' | 'ai_coach' | 'job_tracker' | 'paste_raw_cv'
  >('ats_tailor');
  const [targetLanguage, setTargetLanguage] = useState<DocumentOutputLanguage>(outputLanguage || 'en');
  const [targetJobTitle, setTargetJobTitle] = useState(gulfCvData.jobTitle || '');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedMissingKeywords, setSelectedMissingKeywords] = useState<string[]>([]);
  const [isTailoring, setIsTailoring] = useState(false);
  const [lastGeneratedCoverLetter, setLastGeneratedCoverLetter] =
    useState<MalayalamLetterData | null>(null);

  // AI Coach Chat State (Facility #3: Accept / Reject Suggestions)
  const [coachQuestion, setCoachQuestion] = useState('');
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachReplyText, setCoachReplyText] = useState('');
  const [coachSuggestions, setCoachSuggestions] = useState<CoachSuggestionItem[]>([]);

  // Job Tracker State (Facility #6: Track Applied Jobs in localStorage)
  const [trackedJobs, setTrackedJobs] = useState<TrackedJobApplication[]>(() => {
    try {
      const saved = localStorage.getItem(JOB_TRACKER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOpen && gulfCvData.jobTitle) {
      setTargetJobTitle(gulfCvData.jobTitle);
    }
  }, [isOpen, gulfCvData.jobTitle]);

  useEffect(() => {
    try {
      localStorage.setItem(JOB_TRACKER_STORAGE_KEY, JSON.stringify(trackedJobs));
    } catch {
      // Ignore storage quota issues
    }
  }, [trackedJobs]);

  const analysis = useMemo(
    () => analyzeAtsKeywordMatchDeterministically(gulfCvData, jobDescription),
    [gulfCvData, jobDescription]
  );

  useEffect(() => {
    setSelectedMissingKeywords(analysis.missingKeywords);
  }, [jobDescription, analysis.missingKeywords.join('|')]);

  if (!isOpen) return null;

  const toggleMissingKeyword = (kw: string) => {
    setSelectedMissingKeywords((prev) =>
      prev.includes(kw) ? prev.filter((item) => item !== kw) : [...prev, kw]
    );
  };

  const logJobToTracker = (companyName: string, roleName: string, score: number) => {
    const newEntry: TrackedJobApplication = {
      id: `job-${Date.now()}`,
      company: companyName || 'Hiring Company',
      role: roleName || gulfCvData.jobTitle || 'Target Role',
      matchScore: score,
      language: targetLanguage,
      date: new Date().toLocaleDateString('en-IN'),
      status: 'saved',
    };
    setTrackedJobs((prev) => [newEntry, ...prev.slice(0, 29)]);
  };

  const buildDeterministicTailoredResult = () => {
    const cleanRole = (targetJobTitle || gulfCvData.jobTitle || 'Professional').trim();
    const cleanCompany = (targetCompany || 'Hiring Manager').trim();
    const kwsToAdd =
      selectedMissingKeywords.length > 0
        ? selectedMissingKeywords
        : analysis.missingKeywords.slice(0, 8);

    const existingSkills = Array.isArray(gulfCvData.coreSkills) ? [...gulfCvData.coreSkills] : [];
    const mergedSkillsSet = new Set<string>([...existingSkills, ...kwsToAdd]);
    const updatedSkills = Array.from(mergedSkillsSet).slice(0, 16);

    const topKwString = kwsToAdd.slice(0, 4).join(', ');
    let updatedSummary = gulfCvData.professionalSummary || '';
    if (topKwString) {
      if (targetLanguage === 'ml') {
        updatedSummary = `${cleanRole} തസ്തികയിൽ മികച്ച പ്രവൃത്തിപരിചയവും ${topKwString} എന്നിവയിൽ പ്രത്യേക പ്രാവീണ്യവുമുള്ള ഉദ്യോഗാർത്ഥി. ${updatedSummary}`;
      } else {
        updatedSummary = `Results-driven ${cleanRole} with proven expertise in ${topKwString}. ${updatedSummary}`;
      }
    }

    const updatedExperience = Array.isArray(gulfCvData.workExperience)
      ? gulfCvData.workExperience.map((exp, idx) => {
          if (idx === 0 && kwsToAdd.length > 0) {
            const extraBullet =
              targetLanguage === 'ml'
                ? `${kwsToAdd.slice(0, 3).join(', ')} എന്നിവ പ്രയോജനപ്പെടുത്തി സ്ഥാപനത്തിന്റെ പ്രവർത്തന മികവ് വർദ്ധിപ്പിച്ചു.`
                : `Applied strong proficiency in ${kwsToAdd.slice(0, 3).join(', ')} to streamline daily operations and achieve organizational quality targets.`;
            const currentHighlights = Array.isArray(exp.highlights) ? exp.highlights : [];
            const hasAlready = currentHighlights.some((h) =>
              h.toLowerCase().includes(kwsToAdd[0].toLowerCase())
            );
            return {
              ...exp,
              highlights: hasAlready
                ? currentHighlights
                : [...currentHighlights, extraBullet].slice(0, 5),
            };
          }
          return exp;
        })
      : [];

    const rawTailoredCv: GulfCvData = {
      ...gulfCvData,
      jobTitle: cleanRole.toUpperCase(),
      professionalSummary: updatedSummary.trim(),
      coreSkills: updatedSkills,
      workExperience: updatedExperience,
    };

    const tailoredCv = applyLocalLanguageConversionToCv(rawTailoredCv, targetLanguage);
    const todayFormatted = new Date().toLocaleDateString(
      targetLanguage === 'ml' ? 'ml-IN' : 'en-GB'
    );

    const baseCoverLetter: MalayalamLetterData =
      targetLanguage === 'ml'
        ? {
            documentHeading: `ജോലി അപേക്ഷാ കവർ ലെറ്റർ (Cover Letter — ${cleanRole})`,
            letterLayoutVariant: 'official_letter',
            fromLabelOverride: 'അപേക്ഷകൻ (Applicant)',
            senderName: tailoredCv.fullName || 'ഉദ്യോഗാർത്ഥി',
            senderAddress: `${tailoredCv.currentLocation || 'കേരളം'}\nEmail: ${tailoredCv.email || ''}`,
            senderPhone: tailoredCv.phone || '',
            toLabelOverride: 'സ്വീകർത്താവ് (To)',
            recipientTitle: 'ബഹുമാനപ്പെട്ട എച്ച്.ആർ മാനേജർ (HR / Hiring Manager) മുമ്പാകെ,',
            recipientOffice: cleanCompany,
            recipientPlace: tailoredCv.currentLocation || 'കേരളം',
            subjectLabelOverride: 'വിഷയം',
            subject: `${cleanRole} തസ്തികയിലേക്കുള്ള ജോലി അപേക്ഷ സംബന്ധിച്ച്.`,
            reference: '',
            salutation: 'ബഹുമാനപ്പെട്ട സർ / മാഡം,',
            bodyParagraphs: [
              `നിങ്ങളുടെ സ്ഥാപനത്തിലെ ${cleanRole} തസ്തികയിലേക്ക് അപേക്ഷിക്കുന്നതിനായി എന്റെ പുതുക്കിയ ബയോഡാറ്റ (ATS Resume) ഇതോടൊപ്പം സമർപ്പിക്കുന്നു. ഈ മേഖലയിലുള്ള എന്റെ പ്രവൃത്തിപരിചയവും ${updatedSkills.slice(0, 5).join(', ')} എന്നിവയിലുള്ള പ്രാവീണ്യവും ഈ തസ്തികയ്ക്ക് തികച്ചും അനുയോജ്യമാണ്.`,
              `സ്ഥാപനത്തിന്റെ ലക്ഷ്യങ്ങൾ കൈവരിക്കുന്നതിനായി ആത്മാർത്ഥതയോടെയും കൃത്യനിഷ്ഠയോടെയും പ്രവർത്തിക്കാൻ ഞാൻ സന്നദ്ധനാണ്. എന്റെ യോഗ്യതകൾ നേരിട്ട് ബോധ്യപ്പെടുത്തുന്നതിനായി ഒരു ഇന്റർവ്യൂ അവസരം നൽകണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.`,
            ],
            closingPhrase: 'വിശ്വസ്തതയോടെ,',
            placeLabelOverride: 'സ്ഥലം',
            place: tailoredCv.cvPlace || tailoredCv.currentLocation || 'കേരളം',
            dateLabelOverride: 'തീയതി',
            date: todayFormatted,
            signatureLabelOverride: 'ഒപ്പ്',
            enclosures: ['1. പുതുക്കിയ ബയോഡാറ്റ (ATS Resume)', '2. സർട്ടിഫിക്കറ്റുകളുടെ പകർപ്പ്'],
          }
        : {
            documentHeading: `COVER LETTER — APPLICATION FOR ${cleanRole.toUpperCase()}`,
            letterLayoutVariant: 'official_letter',
            fromLabelOverride: 'From (Applicant)',
            senderName: tailoredCv.fullName || 'Candidate Name',
            senderAddress: `${tailoredCv.currentLocation || ''}\nEmail: ${tailoredCv.email || ''}`,
            senderPhone: tailoredCv.phone || '',
            toLabelOverride: 'To',
            recipientTitle: 'The Hiring Manager / HR Department,',
            recipientOffice: cleanCompany,
            recipientPlace: tailoredCv.currentLocation || '',
            subjectLabelOverride: 'Subject',
            subject: `Application for the position of ${cleanRole}`,
            reference: '',
            salutation: 'Dear Hiring Manager,',
            bodyParagraphs: [
              `I am writing to express my strong interest in the ${cleanRole} position at ${cleanCompany}. With proven hands-on experience and core competencies in ${updatedSkills.slice(0, 6).join(', ')}, I am confident in my ability to contribute immediately to your team.`,
              `In my previous roles, I have consistently maintained high standards of operational excellence, reliability, and teamwork. My updated ATS-optimized resume is attached for your review.`,
              `Thank you for your time and consideration. I welcome the opportunity to discuss how my background and skills align with the goals of ${cleanCompany}.`,
            ],
            closingPhrase: 'Sincerely,',
            placeLabelOverride: 'Location',
            place: tailoredCv.cvPlace || tailoredCv.currentLocation || '',
            dateLabelOverride: 'Date',
            date: todayFormatted,
            signatureLabelOverride: 'Signature',
            enclosures: ['1. Updated ATS-Optimized Curriculum Vitae (Resume)'],
          };

    const coverLetterData = applyLocalLanguageConversionToLetter(baseCoverLetter, targetLanguage);
    return { tailoredCv, coverLetterData };
  };

  const applyTailorSuccess = (
    tailoredCv: GulfCvData,
    coverLetterData: MalayalamLetterData | null,
    openCoverLetterImmediately: boolean
  ) => {
    onChangeOutputLanguage(targetLanguage);
    onApplyTailoredCv(tailoredCv, targetLanguage);
    if (coverLetterData) {
      setLastGeneratedCoverLetter(coverLetterData);
    }

    const updatedMatch = analyzeAtsKeywordMatchDeterministically(
      tailoredCv,
      jobDescription
    );
    logJobToTracker(
      targetCompany || 'Hiring Company',
      tailoredCv.jobTitle || targetJobTitle,
      updatedMatch.scorePercent
    );

    if (openCoverLetterImmediately && coverLetterData) {
      onApplyCoverLetter(coverLetterData, targetLanguage);
      onClose();
      onShowToast('✉️ കവർ ലെറ്റർ (Cover Letter) A4 ഷീറ്റിൽ തയ്യാറായി!');
    } else {
      onShowToast(
        `🎯 സിവി തിരഞ്ഞെടുത്ത ഭാഷയിൽ Tailor ചെയ്തു! പുതിയ Match Score: ${updatedMatch.scorePercent}%`
      );
    }
  };

  const handleRunAtsTailor = async (openCoverLetterImmediately = false) => {
    if (!jobDescription.trim()) {
      onShowToast('ദയവായി ഒരു Job Description പേസ്റ്റ് ചെയ്യുക (അല്ലെങ്കിൽ Sample JD ബട്ടൺ ക്ലിക്ക് ചെയ്യുക).');
      return;
    }
    setIsTailoring(true);
    try {
      const response = await fetch('/api/ats-tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gulfCvData,
          jobDescription,
          targetJobTitle: targetJobTitle || gulfCvData.jobTitle,
          targetCompany: targetCompany || 'Hiring Manager',
          selectedMissingKeywords,
          targetLanguage,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (!data?.tailoredCv) {
        throw new Error('Missing tailoredCv');
      }
      applyTailorSuccess(
        data.tailoredCv,
        data.coverLetterData || null,
        openCoverLetterImmediately
      );
    } catch {
      const fallback = buildDeterministicTailoredResult();
      applyTailorSuccess(
        fallback.tailoredCv,
        fallback.coverLetterData,
        openCoverLetterImmediately
      );
    } finally {
      setIsTailoring(false);
    }
  };

  const handleAskResumeCoach = async (presetQuestion?: string) => {
    const q = (presetQuestion ?? coachQuestion).trim();
    if (!q) {
      onShowToast('ദയവായി നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ മുകളിലെ ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.');
      return;
    }
    setIsCoachLoading(true);
    try {
      const response = await fetch('/api/ats-resume-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gulfCvData,
          jobDescription,
          userQuestion: q,
          targetLanguage,
          missingKeywords: analysis.missingKeywords,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data?.coachReply) {
        setCoachReplyText(data.coachReply);
      }
      if (Array.isArray(data?.suggestions) && data.suggestions.length > 0) {
        setCoachSuggestions(
          data.suggestions.map((s: any, idx: number) => ({
            id: s.id || `sug-${Date.now()}-${idx}`,
            field: s.field || 'professionalSummary',
            label: s.label || 'Resume Improvement Suggestion',
            proposedText: s.proposedText || '',
            proposedSkills: Array.isArray(s.proposedSkills) ? s.proposedSkills : [],
            status: 'pending',
          }))
        );
      } else {
        throw new Error('Empty suggestions');
      }
    } catch {
      const missingTop = analysis.missingKeywords.slice(0, 5);
      const roleName = targetJobTitle || gulfCvData.jobTitle || 'Target Role';
      const reply =
        targetLanguage === 'ml'
          ? `നിങ്ങളുടെ സിവി പരിശോധിച്ചു! നിലവിലെ ATS Match Score ${analysis.scorePercent}% ആണ്. ${
              missingTop.length > 0
                ? `ഈ ജോലിക്ക് തിരഞ്ഞെടുക്കപ്പെടാൻ "${missingTop.join(', ')}" എന്നീ പ്രധാന വാക്കുകൾ (Keywords) കൂടി സിവിയിൽ ഉൾപ്പെടുത്തുന്നത് വളരെ നല്ലതാണ്.`
                : 'നിങ്ങളുടെ സിവിയിൽ പ്രധാനപ്പെട്ട എല്ലാ കീവേഡുകളും ഉൾപ്പെട്ടിട്ടുണ്ട്!'
            } താഴെ നൽകിയിരിക്കുന്ന നിർദ്ദേശങ്ങൾ (Suggestions) പരിശോധിച്ച് 'Accept' അമർത്തിയാൽ ഉടൻ സിവിയിൽ ചേർക്കാം.`
          : `I analyzed your resume against the ${roleName} requirements (Current ATS Match: ${analysis.scorePercent}%). ${
              missingTop.length > 0
                ? `Adding missing ATS keywords such as ${missingTop.join(', ')} will significantly boost your shortlisting score.`
                : 'Your resume already covers the primary keywords!'
            } Review the actionable suggestions below and click "Accept" to apply them directly to your A4 Resume.`;

      setCoachReplyText(reply);
      const fallbackSuggestions: CoachSuggestionItem[] = [
        {
          id: `sug-sum-${Date.now()}`,
          field: 'professionalSummary',
          label:
            targetLanguage === 'ml'
              ? '1. പ്രൊഫഷണൽ സമ്മറി (Summary) കൂടുതൽ മികച്ചതാക്കാം'
              : '1. Strengthen Professional Summary with ATS Keywords',
          proposedText:
            targetLanguage === 'ml'
              ? `${roleName} തസ്തികയിൽ മികച്ച പ്രവൃത്തിപരിചയവും ${
                  missingTop.slice(0, 3).join(', ') || 'പ്രൊഫഷണൽ'
                } നൈപുണ്യവുമുള്ള ഉദ്യോഗാർത്ഥി. സ്ഥാപനത്തിന്റെ ലക്ഷ്യങ്ങൾ സമയബന്ധിതമായി പൂർത്തിയാക്കാൻ പ്രതിജ്ഞാബദ്ധൻ.`
              : `Results-focused ${roleName} with proven expertise in ${
                  missingTop.slice(0, 3).join(', ') || 'core operations, quality compliance, and team coordination'
                }, dedicated to delivering measurable operational excellence.`,
          status: 'pending',
        },
        {
          id: `sug-exp-${Date.now() + 1}`,
          field: 'experienceBullet',
          label:
            targetLanguage === 'ml'
              ? '2. പ്രവൃത്തിപരിചയത്തിൽ (Work Experience) പുതിയ പോയിന്റ് ചേർക്കാം'
              : '2. Add High-Impact Work Experience Bullet Point',
          proposedText:
            targetLanguage === 'ml'
              ? `${
                  missingTop.slice(0, 2).join(', ') || 'കസ്റ്റമർ സർവീസ്'
                } എന്നിവയിൽ മികച്ച പ്രകടനം കാഴ്ചവെക്കുകയും കൃത്യതയോടെ ചുമതലകൾ നിർവഹിക്കുകയും ചെയ്തു.`
              : `Spearheaded daily ${roleName} workflows utilizing ${
                  missingTop.slice(0, 2).join(' and ') || 'industry best practices'
                }, achieving 100% compliance and high client satisfaction.`,
          status: 'pending',
        },
      ];
      if (missingTop.length > 0) {
        fallbackSuggestions.push({
          id: `sug-sk-${Date.now() + 2}`,
          field: 'coreSkills',
          label:
            targetLanguage === 'ml'
              ? '3. വിട്ടുപോയ പ്രധാന കീവേഡുകൾ (Core Skills) ചേർക്കാം'
              : '3. Add Missing Job Description Keywords to Core Skills',
          proposedSkills: missingTop,
          status: 'pending',
        });
      }
      setCoachSuggestions(fallbackSuggestions);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const handleAcceptCoachSuggestion = (item: CoachSuggestionItem) => {
    let nextCv = { ...gulfCvData };
    if (item.field === 'professionalSummary' && item.proposedText) {
      nextCv.professionalSummary = item.proposedText;
    } else if (item.field === 'jobTitle' && item.proposedText) {
      nextCv.jobTitle = item.proposedText;
    } else if (item.field === 'experienceBullet' && item.proposedText) {
      const existingExp = Array.isArray(nextCv.workExperience) ? [...nextCv.workExperience] : [];
      if (existingExp.length > 0) {
        existingExp[0] = {
          ...existingExp[0],
          highlights: [...(existingExp[0].highlights || []), item.proposedText].slice(0, 5),
        };
      } else {
        existingExp.push({
          role: nextCv.jobTitle || 'Professional',
          company: targetCompany || 'Employer',
          location: nextCv.currentLocation || 'Kerala',
          duration: '2021 – Present',
          highlights: [item.proposedText],
        });
      }
      nextCv.workExperience = existingExp;
    } else if (item.field === 'coreSkills' && item.proposedSkills && item.proposedSkills.length > 0) {
      const merged = new Set([...(nextCv.coreSkills || []), ...item.proposedSkills]);
      nextCv.coreSkills = Array.from(merged).slice(0, 16);
    }

    onApplyTailoredCv(nextCv, targetLanguage);
    setCoachSuggestions((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: 'accepted' } : s))
    );
    onShowToast('✓ നിർദ്ദേശം (Suggestion) നിങ്ങളുടെ സിവിയിൽ ചേർത്തു!');
  };

  const handleRejectCoachSuggestion = (id: string) => {
    setCoachSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
  };

  const scoreColorClass =
    analysis.scorePercent >= 80
      ? 'text-emerald-700 bg-emerald-50 border-emerald-400'
      : analysis.scorePercent >= 50
      ? 'text-amber-800 bg-amber-50 border-amber-400'
      : 'text-rose-700 bg-rose-50 border-rose-300';

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border-2 border-emerald-500 space-y-4 max-h-[92vh] overflow-y-auto my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                Multilingual ATS Resume, Cover Letter &amp; Job Tracker Studio
              </span>
              <h3 className="font-malayalam text-sm sm:text-lg font-black text-slate-900">
                🎯 ATS സിവി ടെയ്‌ലറിംഗ്, മാച്ച് സ്കോർ, AI ചാറ്റ് &amp; കവർ ലെറ്റർ (എല്ലാ ഭാഷകളിലും)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Universal Output Language Selector Bar (All 6 Languages) */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-malayalam font-extrabold text-emerald-950">
            <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>ഏത് ഭാഷയിലാണ് സിവിയും കവർ ലെറ്ററും വേണ്ടത്? (Output Language):</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setTargetLanguage(lang.code);
                  onChangeOutputLanguage(lang.code);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all border ${
                  targetLanguage === lang.code
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('ats_tailor')}
            className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-malayalam font-extrabold transition-all cursor-pointer ${
              activeTab === 'ats_tailor'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            🎯 1. ATS Tailor &amp; Match %
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_coach')}
            className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-malayalam font-extrabold transition-all cursor-pointer ${
              activeTab === 'ai_coach'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            💬 2. AI സിവി കോച്ച് (Chat)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('job_tracker')}
            className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-malayalam font-extrabold transition-all cursor-pointer ${
              activeTab === 'job_tracker'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            📌 3. Job Tracker ({trackedJobs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste_raw_cv')}
            className={`py-2 px-2.5 rounded-xl text-[11px] sm:text-xs font-malayalam font-extrabold transition-all cursor-pointer ${
              activeTab === 'paste_raw_cv'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white/60'
            }`}
          >
            📋 4. പഴയ സിവി ഒട്ടിക്കുക
          </button>
        </div>

        {/* TAB 1: ATS RESUME TAILOR & MATCH SCORE */}
        {activeTab === 'ats_tailor' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 font-malayalam">
                  Step 1: ജോലി വിവരണം (Job Description) ഏത് ഭാഷയിലും താഴെ പേസ്റ്റ് ചെയ്യാം:
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">മാതൃക (Sample JD):</span>
                  {SAMPLE_JOB_DESCRIPTIONS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTargetLanguage(sample.lang);
                        onChangeOutputLanguage(sample.lang);
                        setTargetJobTitle(sample.role);
                        setTargetCompany(sample.company);
                        setJobDescription(sample.jd);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-300 text-[11px] font-bold text-slate-800 cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 font-malayalam block mb-1">
                    അപേക്ഷിക്കുന്ന തസ്തിക (Target Job Title)
                  </label>
                  <input
                    type="text"
                    value={targetJobTitle}
                    onChange={(e) => setTargetJobTitle(e.target.value)}
                    placeholder="ഉദാ: Senior Accountant / സെയിൽസ് മാനേജർ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 font-malayalam block mb-1">
                    കമ്പനിയുടെ പേര് (Target Company Name)
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="ഉദാ: Al Futtaim Group / മലബാർ ഗോൾഡ്"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="LinkedIn, Indeed, Naukri, അല്ലെങ്കിൽ വാട്സാപ്പ് ജോബ് പരസ്യത്തിലെ വിവരങ്ങൾ (മലയാളത്തിലോ ഇംഗ്ലീഷിലോ മറ്റ് ഭാഷകളിലോ) ഇവിടെ പേസ്റ്റ് ചെയ്യുക..."
                className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 text-xs text-slate-900 focus:outline-none leading-relaxed"
              />
            </div>

            {jobDescription.trim() && (
              <div className="border-2 border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      100% Deterministic Keyword Analysis (എല്ലാ ഭാഷകളിലും കൃത്യമായ സ്കോർ)
                    </span>
                    <h4 className="font-malayalam font-black text-sm text-slate-900">
                      📊 ATS Match Score: ജോലിക്ക് വേണ്ട {analysis.totalKeywords} കീവേഡുകളിൽ{' '}
                      {analysis.matchedKeywords.length} എണ്ണം നിങ്ങളുടെ സിവിയിലുണ്ട്
                    </h4>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-2xl border-2 font-black text-base sm:text-xl text-center shrink-0 ${scoreColorClass}`}
                  >
                    {analysis.scorePercent}% Match
                  </div>
                </div>

                {/* Matched Keywords */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-emerald-800 font-malayalam flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      നിങ്ങളുടെ സിവിയിൽ ഇപ്പോൾ തന്നെയുള്ള കീവേഡുകൾ ({analysis.matchedKeywords.length}):
                    </span>
                  </div>
                  {analysis.matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matchedKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px] font-bold"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 font-malayalam">
                      നിലവിൽ മാച്ച് ചെയ്യുന്ന കീവേഡുകൾ കുറവാണ്. താഴെയുള്ള കീവേഡുകൾ ടിക്ക് ചെയ്ത് Tailor ബട്ടൺ അമർത്തുക!
                    </p>
                  )}
                </div>

                {/* Missing Keywords */}
                {analysis.missingKeywords.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-bold text-amber-900 font-malayalam">
                      ⚠️ സിവിയിൽ ഇല്ലാത്ത കീവേഡുകൾ (നിങ്ങൾക്കറിയാവുന്ന സ്കില്ലുകൾ മാത്രം ടിക്ക് ചെയ്യുക — അറിയാത്തവ അൺ-ടിക്ക് ചെയ്യാം):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingKeywords.map((kw) => {
                        const isChecked = selectedMissingKeywords.includes(kw);
                        return (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => toggleMissingKeyword(kw)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-2xs'
                                : 'bg-slate-100 border-slate-300 text-slate-500 line-through'
                            }`}
                          >
                            {isChecked ? '☑ ' : '☐ '}
                            {kw}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={isTailoring}
                onClick={() => handleRunAtsTailor(false)}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
              >
                {isTailoring ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                )}
                <span>✨ Tailor Resume to Job (സിവി മാറ്റി എഴുതുക)</span>
              </button>

              <button
                type="button"
                disabled={isTailoring}
                onClick={() => {
                  if (lastGeneratedCoverLetter) {
                    onApplyCoverLetter(lastGeneratedCoverLetter, targetLanguage);
                    onClose();
                    onShowToast('✉️ കവർ ലെറ്റർ (Cover Letter) A4 ഷീറ്റിൽ തയ്യാറായി!');
                  } else {
                    handleRunAtsTailor(true);
                  }
                }}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
              >
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>✉️ കവർ ലെറ്റർ തയ്യാറാക്കുക (Cover Letter)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: AI RESUME COACH CHAT WITH ACCEPT / REJECT SUGGESTIONS */}
        {activeTab === 'ai_coach' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <div className="text-xs font-malayalam font-bold text-slate-800">
                💬 AI സിവി കോച്ചിനോട് ഏത് ഭാഷയിലും ചോദിക്കാം (ഓരോ നിർദ്ദേശവും Accept / Reject ചെയ്യാം):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'എന്റെ സിവി എങ്ങനെ കൂടുതൽ മികച്ചതാക്കാം? (Help me improve my resume)',
                  'ഈ ജോലിക്ക് എന്റെ സിവി എത്രത്തോളം അനുയോജ്യമാണ്? (How does my resume compare?)',
                  'കൂടുതൽ ശക്തമായ പ്രൊഫഷണൽ സമ്മറി എഴുതി തരൂ (Write a stronger summary)',
                ].map((qText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCoachQuestion(qText);
                      handleAskResumeCoach(qText);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-300 text-[11px] font-malayalam font-bold text-slate-800 cursor-pointer"
                  >
                    ⚡ {qText}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={coachQuestion}
                  onChange={(e) => setCoachQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAskResumeCoach();
                  }}
                  placeholder="നിങ്ങളുടെ ചോദ്യം മലയാളത്തിലോ ഇംഗ്ലീഷിലോ ഇവിടെ ചോദിക്കുക..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={isCoachLoading}
                  onClick={() => handleAskResumeCoach()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-malayalam font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isCoachLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>ചോദിക്കുക</span>
                </button>
              </div>
            </div>

            {coachReplyText && (
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-3.5 text-xs font-malayalam text-slate-800 leading-relaxed">
                🤖 <strong>AI Coach:</strong> {coachReplyText}
              </div>
            )}

            {coachSuggestions.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-malayalam font-black text-slate-900">
                  ✨ നിർദ്ദേശങ്ങൾ (Suggestions — ഇഷ്ടപ്പെട്ടവ Accept ചെയ്യുക):
                </h4>
                {coachSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className={`border rounded-2xl p-3.5 space-y-2 transition-all ${
                      sug.status === 'accepted'
                        ? 'bg-emerald-50 border-emerald-400'
                        : sug.status === 'rejected'
                        ? 'bg-slate-100 border-slate-200 opacity-50'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-malayalam font-black text-emerald-950">
                        {sug.label}
                      </span>
                      {sug.status === 'accepted' ? (
                        <span className="text-[11px] font-bold text-emerald-700">
                          ✓ സിവിയിൽ ചേർത്തു (Accepted)
                        </span>
                      ) : sug.status === 'rejected' ? (
                        <span className="text-[11px] font-bold text-slate-500">
                          ✕ ഒഴിവാക്കി (Rejected)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAcceptCoachSuggestion(sug)}
                            className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-malayalam font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>സ്വീകരിക്കുക (Accept)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectCoachSuggestion(sug.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 text-[11px] font-malayalam font-bold cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                    {sug.proposedText && (
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {sug.proposedText}
                      </p>
                    )}
                    {sug.proposedSkills && sug.proposedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {sug.proposedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-950 text-[11px] font-bold"
                          >
                            + {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOB APPLICATION TRACKER */}
        {activeTab === 'job_tracker' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-xs font-malayalam text-slate-700">
                📌 <strong>Job Tracker:</strong> നിങ്ങൾ സിവി Tailor ചെയ്തതും അപേക്ഷിച്ചതുമായ ജോലികളുടെ സ്റ്റാറ്റസ് ഇവിടെ സൂക്ഷിക്കാം.
              </div>
              <button
                type="button"
                onClick={() =>
                  logJobToTracker(
                    targetCompany || 'New Company',
                    targetJobTitle || gulfCvData.jobTitle || 'Job Role',
                    analysis.scorePercent || 85
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-malayalam font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ജോലി ചേർക്കുക</span>
              </button>
            </div>

            {trackedJobs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-malayalam text-slate-600">
                  ഇതുവരെ ജോലികളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല. സിവി Tailor ചെയ്യുമ്പോൾ തനിയെ ഇവിടെ ചേർക്കപ്പെടും!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {trackedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {job.role}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-black">
                          {job.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        🏢 {job.company} · 📅 {job.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={job.status}
                        onChange={(e) => {
                          const nextStatus = e.target.value as TrackedJobApplication['status'];
                          setTrackedJobs((prev) =>
                            prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
                          );
                        }}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-malayalam font-bold text-slate-800 bg-slate-50"
                      >
                        <option value="saved">📝 തയ്യാറാക്കി (Saved)</option>
                        <option value="applied">📤 അപേക്ഷിച്ചു (Applied)</option>
                        <option value="interview">🤝 ഇന്റർവ്യൂ (Interview)</option>
                        <option value="offer">🎉 ജോലി ലഭിച്ചു (Offer)</option>
                        <option value="rejected">✕ ഒഴിവാക്കി (Closed)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          setTrackedJobs((prev) => prev.filter((j) => j.id !== job.id))
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PASTE EXISTING CV TEXT */}
        {activeTab === 'paste_raw_cv' && (
          <div className="space-y-3">
            <p className="text-xs font-malayalam text-slate-600">
              നിങ്ങളുടെ പഴയ സിവിയിലെ വിവരങ്ങൾ ഏത് ഭാഷയിലും താഴെ പേസ്റ്റ് ചെയ്താൽ ഒറ്റ ക്ലിക്കിൽ പ്രൊഫഷണൽ A4 സിവിയായി മാറ്റാം:
            </p>
            <textarea
              rows={8}
              value={autoFillCvText}
              onChange={(e) => onChangeAutoFillCvText(e.target.value)}
              placeholder="നിങ്ങളുടെ പഴയ സിവി അല്ലെങ്കിൽ ബയോഡാറ്റ വിവരങ്ങൾ ഇവിടെ പേസ്റ്റ് ചെയ്യുക..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-emerald-600 font-mono text-xs text-slate-900 focus:outline-none"
            />
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isGeneratingAutoFill}
                onClick={onExecuteAutoFillCv}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-malayalam font-extrabold flex items-center gap-2 cursor-pointer"
              >
                {isGeneratingAutoFill ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>ഓട്ടോ-ഫിൽ ചെയ്ത് തുടങ്ങാം</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-malayalam">
          <span>
            💡 സിവിയിൽ മാറ്റങ്ങൾ വരുത്തിയ ശേഷം വലതുവശത്തെ A4 ഷീറ്റിൽ നേരിട്ട് കാണാനും PDF ഡൗൺലോഡ് ചെയ്യാനും സാധിക്കും.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer shrink-0"
          >
            A4 ഷീറ്റ് കാണുക →
          </button>
        </div>
      </div>
    </div>
  );
};
