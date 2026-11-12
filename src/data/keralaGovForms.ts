import {
  type MalayalamLetterData,
  type StructuredFormField,
  type SubFormOptionChoice,
  buildEditableQuestionsForLetter,
} from '../types/documents.ts';
import {
  extractKeralaPlaceAndDistrict,
  normalizeSpokenMalayalamTranscript,
} from '../utils/languageTranslator.ts';

export interface OfficialKeralaPortal {
  id: string;
  nameMalayalam: string;
  nameEnglish: string;
  departmentMalayalam: string;
  descriptionMalayalam: string;
  url: string;
  badgeText: string;
}

export type GovFormCategoryKey =
  | 'all'
  | 'revenue_edistrict'
  | 'lsgd_panchayat'
  | 'welfare_pension'
  | 'civil_supplies_ration'
  | 'mvd_motor'
  | 'service_education'
  | 'general_resignation';

export interface GovFormTemplate {
  id: string;
  categoryKey: GovFormCategoryKey;
  categoryLabelMalayalam: string;
  formCode: string;
  titleMalayalam: string;
  titleEnglish: string;
  subtitleMalayalam: string;
  portalName: string;
  portalUrl: string;
  searchKeywords: string;
  recipientTitle: string;
  recipientOffice: string;
  subject: string;
  bodyParagraphs: string[];
  enclosures: string[];
  structuredFields: StructuredFormField[];
}

export const OFFICIAL_KERALA_PORTALS: OfficialKeralaPortal[] = [
  {
    id: 'portal-edistrict',
    nameMalayalam: 'ഇ-ഡിസ്ട്രിക്ട് കേരള (e-District Portal)',
    nameEnglish: 'e-District Kerala Common Forms',
    departmentMalayalam: 'റവന്യൂ / വില്ലേജ് ഓഫീസ് സർട്ടിഫിക്കറ്റുകൾ',
    descriptionMalayalam:
      'വരുമാനം, ജാതി, നേറ്റിവിറ്റി, നോൺ-ക്രീമിലെയർ, കൈവശാവകാശം, ഫാമിലി മെമ്പർഷിപ്പ് തുടങ്ങി എല്ലാ വില്ലേജ് ഓഫീസ് പൊതു അപേക്ഷാ ഫോമുകളും.',
    url: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    badgeText: 'റവന്യൂ വകുപ്പ്',
  },
  {
    id: 'portal-keralaservice',
    nameMalayalam: 'കേരള സർവീസ് ഫോമുകൾ (Kerala Service Forms)',
    nameEnglish: 'Kerala Service & Treasury Forms',
    departmentMalayalam: 'സർക്കാർ ജീവനക്കാർ & പെൻഷൻകാർ',
    descriptionMalayalam:
      'സർക്കാർ ജീവനക്കാർക്കുള്ള ലീവ് അപേക്ഷ (KSR), പി.എഫ് (GPF), എസ്.എൽ.ഐ, ജി.ഐ.എസ്, പെൻഷൻ, ലോൺ, ട്രഷറി ചലാൻ ഫോമുകൾ.',
    url: 'https://keralaservice.org/forms',
    badgeText: 'സർവീസ് ഫോമുകൾ',
  },
  {
    id: 'portal-kppha',
    nameMalayalam: 'വിദ്യാഭ്യാസ വകുപ്പ് ഫോമുകൾ (KPPHA Helpline)',
    nameEnglish: 'Kerala Education & School Forms',
    departmentMalayalam: 'പൊതുവിദ്യാഭ്യാസ വകുപ്പ് / അധ്യാപകർ',
    descriptionMalayalam:
      'സ്കൂൾ പ്രവേശനം, ടി.സി (TC), ജനനത്തീയതി തിരുത്തൽ, സ്കോളർഷിപ്പ്, അധ്യാപകരുടെ പ്രോപ്പർട്ടി സ്റ്റേറ്റ്മെന്റ്, പി.എഫ് ഫോമുകൾ.',
    url: 'https://kppha.in/page?id=forms-downloads',
    badgeText: 'വിദ്യാഭ്യാസം',
  },
  {
    id: 'portal-lsgd',
    nameMalayalam: 'തദ്ദേശ സ്വയംഭരണ വകുപ്പ് (LSGD / K-SMART)',
    nameEnglish: 'LSGD Kerala & K-SMART Portal',
    departmentMalayalam: 'പഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി / കോർപ്പറേഷൻ',
    descriptionMalayalam:
      'ജനന-മരണ-വിവാഹ രജിസ്ട്രേഷൻ ഫോമുകൾ, കെട്ടിട നിർമ്മാണ പെർമിറ്റ്, ഉടമസ്ഥാവകാശ മാറ്റം, വ്യാപാര ലൈസൻസ് (Trade License) ഫോമുകൾ.',
    url: 'https://lsgkerala.gov.in',
    badgeText: 'പഞ്ചായത്ത് / നഗരസഭ',
  },
  {
    id: 'portal-mvd',
    nameMalayalam: 'മോട്ടോർ വാഹന വകുപ്പ് (MVD Kerala / Parivahan)',
    nameEnglish: 'Motor Vehicles Department (RTO)',
    departmentMalayalam: 'ആർ.ടി.ഒ / വാഹന - ലൈസൻസ് സേവനങ്ങൾ',
    descriptionMalayalam:
      'ലേണേഴ്സ് ലൈസൻസ്, ഡ്രൈവിംഗ് ലൈസൻസ് പുതുക്കൽ, വാഹന ഉടമസ്ഥാവകാശ മാറ്റം (Form 29, 30), ഫിറ്റ്നസ് (Form 38), എൻ.ഒ.സി (Form 28).',
    url: 'https://parivahan.gov.in',
    badgeText: 'MVD / RTO',
  },
  {
    id: 'portal-civilsupplies',
    nameMalayalam: 'സിവിൽ സപ്ലൈസ് വകുപ്പ് (e-CivilSupplies)',
    nameEnglish: 'Civil Supplies & Ration Card Portal',
    departmentMalayalam: 'താലൂക്ക് സപ്ലൈ ഓഫീസ് (റേഷൻ കാർഡ്)',
    descriptionMalayalam:
      'പുതിയ റേഷൻ കാർഡ് അപേക്ഷ, അംഗങ്ങളെ ചേർക്കൽ/നീക്കം ചെയ്യൽ, വിലാസം മാറ്റൽ, മുൻഗണനാ കാർഡ് (PHH/AAY) അപേക്ഷകൾ.',
    url: 'https://civilsupplieskerala.gov.in',
    badgeText: 'റേഷൻ കാർഡ്',
  },
  {
    id: 'portal-welfarepension',
    nameMalayalam: 'സാമൂഹ്യ സുരക്ഷാ പെൻഷൻ (Sevana Pension)',
    nameEnglish: 'Social Security Welfare Pension Portal',
    departmentMalayalam: 'സാമൂഹ്യക്ഷേമ പെൻഷനുകൾ',
    descriptionMalayalam:
      'വാർദ്ധക്യകാല പെൻഷൻ, വിധവാ പെൻഷൻ, ഭിന്നശേഷി പെൻഷൻ, 50 വയസ്സ് കഴിഞ്ഞ അവിവാഹിത പെൻഷൻ, കർഷകത്തൊഴിലാളി പെൻഷൻ ഫോമുകൾ.',
    url: 'https://welfarepension.lsgkerala.gov.in',
    badgeText: 'ക്ഷേമ പെൻഷൻ',
  },
  {
    id: 'portal-registration-scst',
    nameMalayalam: 'രജിസ്ട്രേഷൻ & പട്ടികജാതി-വർഗ്ഗ വകുപ്പ്',
    nameEnglish: 'Registration & SC/ST Development Dept',
    departmentMalayalam: 'ആധാരം / വിവാഹം / SC-ST ധനസഹായം',
    descriptionMalayalam:
      'വസ്തു രജിസ്ട്രേഷൻ, ബാധ്യതാ സർട്ടിഫിക്കറ്റ് (EC), സ്പെഷ്യൽ മാര്യേജ് ആക്ട്, പട്ടികജാതി/വർഗ്ഗ വിവാഹ-ഭവന-ചികിത്സാ ധനസഹായ ഫോമുകൾ.',
    url: 'https://stdd.kerala.gov.in',
    badgeText: 'രജിസ്ട്രേഷൻ & SC/ST',
  },
];

export const GOV_FORM_CATEGORIES: Array<{
  key: GovFormCategoryKey;
  labelMalayalam: string;
  shortLabel: string;
}> = [
  { key: 'all', labelMalayalam: 'എല്ലാ ഫോമുകളും (All 42+ Forms)', shortLabel: 'എല്ലാം (42+)' },
  {
    key: 'revenue_edistrict',
    labelMalayalam: '1. റവന്യൂ / വില്ലേജ് (e-District)',
    shortLabel: 'വില്ലേജ് / e-District',
  },
  {
    key: 'lsgd_panchayat',
    labelMalayalam: '2. പഞ്ചായത്ത് / നഗരസഭ (LSGD)',
    shortLabel: 'പഞ്ചായത്ത് / K-SMART',
  },
  {
    key: 'welfare_pension',
    labelMalayalam: '3. സാമൂഹ്യക്ഷേമ പെൻഷൻ & CMDRF',
    shortLabel: 'പെൻഷൻ & CMDRF',
  },
  {
    key: 'civil_supplies_ration',
    labelMalayalam: '4. സിവിൽ സപ്ലൈസ് (റേഷൻ കാർഡ്)',
    shortLabel: 'റേഷൻ കാർഡ്',
  },
  {
    key: 'mvd_motor',
    labelMalayalam: '5. മോട്ടോർ വാഹനം (MVD / RTO)',
    shortLabel: 'MVD / RTO ഫോമുകൾ',
  },
  {
    key: 'service_education',
    labelMalayalam: '6. സർക്കാർ ജീവനക്കാർ & അധ്യാപകർ',
    shortLabel: 'സർവീസ് & സ്കൂൾ',
  },
  {
    key: 'general_resignation',
    labelMalayalam: '7. രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    shortLabel: 'രാജിക്കത്ത് & പൊതു അപേക്ഷ',
  },
];

export const KERALA_GOV_FORMS_MASTER: GovFormTemplate[] = [
  // ===========================================================================
  // CATEGORY 1: റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District അപേക്ഷകൾ)
  // ===========================================================================
  {
    id: 'edistrict-income',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Common Form — Income Certificate',
    titleMalayalam: 'വരുമാന സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Income Certificate)',
    titleEnglish: 'Income Certificate Application',
    subtitleMalayalam: 'വിദ്യാഭ്യാസ ആനുകൂല്യങ്ങൾ, സ്കോളർഷിപ്പ്, സർക്കാർ സഹായങ്ങൾ എന്നിവയ്ക്ക്',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'income certificate വരുമാന സർട്ടിഫിക്കറ്റ് വില്ലേജ് ഓഫീസ് edistrict village scholarship',
    recipientTitle: 'ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ്, തിരുവനന്തപുരം',
    subject: 'വാർഷിക വരുമാന സർട്ടിഫിക്കറ്റ് (Income Certificate) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ സ്ഥിരതാമസക്കാരനായ/യായ എനിക്ക് താഴെ പട്ടികയിൽ രേഖപ്പെടുത്തിയിട്ടുള്ള ആവശ്യത്തിനായി എന്റെ കുടുംബത്തിന്റെ വാർഷിക വരുമാന സർട്ടിഫിക്കറ്റ് ആവശ്യമായി വന്നിരിക്കുന്നു.',
      'ഞാൻ നൽകിയ വരുമാന വിവരങ്ങളും കുടുംബ വിവരങ്ങളും എന്റെ അറിവിലും വിശ്വാസത്തിലും സത്യമാണെന്ന് ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു. ആയതിനാൽ അടിയന്തരമായി വരുമാന സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ആധാർ കാർഡ് പകർപ്പ്', 'റേഷൻ കാർഡ് പകർപ്പ്', 'ഭൂനികുതി രസീത് / ശമ്പള സർട്ടിഫിക്കറ്റ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര്', value: 'രാജൻ കെ. വി.', placeholder: 'മുഴുവൻ പേര്' },
      { id: 'aadhaarNo', label: 'ആധാർ നമ്പർ', value: '8492 3104 4589', placeholder: '12 അക്ക ആധാർ നമ്പർ' },
      { id: 'rationCardNo', label: 'റേഷൻ കാർഡ് നമ്പർ', value: '1102048392', placeholder: 'റേഷൻ കാർഡ് നമ്പർ' },
      { id: 'annualIncome', label: 'കുടുംബ വാർഷിക വരുമാനം (₹)', value: '₹48,000/- (നാൽപ്പത്തിയെട്ടായിരം രൂപ)', placeholder: 'ഉദാ: ₹48,000/-' },
      { id: 'incomeSource', label: 'വരുമാന മാർഗ്ഗം / തൊഴിൽ', value: 'കൂലിപ്പണി / കൃഷി', placeholder: 'തൊഴിൽ' },
      { id: 'purpose', label: 'സർട്ടിഫിക്കറ്റ് ആവശ്യമായ കാര്യം', value: 'വിദ്യാഭ്യാസ സ്കോളർഷിപ്പ് / സർക്കാർ ആനുകൂല്യം', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'edistrict-caste',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Common Form — Caste / Community Certificate',
    titleMalayalam: 'ജാതി സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Caste / Community Certificate)',
    titleEnglish: 'Caste / Community Certificate Application',
    subtitleMalayalam: 'സ്കൂൾ/കോളേജ് അഡ്മിഷൻ, പി.എസ്.സി, സംവരണ ആനുകൂല്യങ്ങൾക്കായി',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'caste community certificate ജാതി സർട്ടിഫിക്കറ്റ് കമ്യൂണിറ്റി വില്ലേജ് edistrict',
    recipientTitle: 'ബഹുമാനപ്പെട്ട തഹസിൽദാർ / വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ് / താലൂക്ക് ഓഫീസ്',
    subject: 'ജാതി സർട്ടിഫിക്കറ്റ് (Caste / Community Certificate) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന മതത്തിലും ജാതിയിലും ഉൾപ്പെട്ട വ്യക്തിയാണ്. വിദ്യാഭ്യാസ / തൊഴിൽ ആവശ്യത്തിനായി എനിക്ക് ജാതി സർട്ടിഫിക്കറ്റ് ആവശ്യമായി വന്നിരിക്കുന്നു.',
      'ആയതിനാൽ അനുബന്ധ രേഖകൾ പരിശോധിച്ച് എനിക്ക് ജാതി സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ആധാർ കാർഡ് പകർപ്പ്', 'എസ്.എസ്.എൽ.സി (SSLC) ബുക്കിന്റെ പകർപ്പ്', 'റേഷൻ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര്', value: 'അഭിഷേക് കൃഷ്ണൻ', placeholder: 'മുഴുവൻ പേര്' },
      { id: 'fatherMotherName', label: 'പിതാവിന്റെ / മാതാവിന്റെ പേര്', value: 'കൃഷ്ണൻ കുട്ടി കെ.', placeholder: 'രക്ഷിതാവിന്റെ പേര്' },
      { id: 'religionCaste', label: 'മതവും ജാതിയും', value: 'ഹിന്ദു — ഈഴവ (OBC)', placeholder: 'മതം, ജാതി' },
      { id: 'sslcBookNo', label: 'SSLC രജിസ്റ്റർ നമ്പർ / വർഷം', value: '482910 / മാർച്ച് 2022', placeholder: 'SSLC വിവരം' },
      { id: 'purpose', label: 'സർട്ടിഫിക്കറ്റ് ആവശ്യമായ കാര്യം', value: 'ഉപരിപഠനം / പി.എസ്.സി വെരിഫിക്കേഷൻ', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'edistrict-ncl',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Common Form — Non-Creamy Layer Certificate',
    titleMalayalam: 'നോൺ-ക്രീമിലെയർ സർട്ടിഫിക്കറ്റ് (Non-Creamy Layer)',
    titleEnglish: 'Non-Creamy Layer Certificate Application',
    subtitleMalayalam: 'ഒ.ബി.സി (OBC) സംവരണ ആനുകൂല്യങ്ങൾക്കും പി.എസ്.സി / കേന്ദ്ര-സംസ്ഥാന ജോലികൾക്കും',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'non creamy layer ncl നോൺ ക്രീമിലെയർ സർട്ടിഫിക്കറ്റ് obc വില്ലേജ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ / തഹസിൽദാർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ്',
    subject: 'നോൺ-ക്രീമിലെയർ സർട്ടിഫിക്കറ്റ് (Non-Creamy Layer Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ പിന്നാക്ക വിഭാഗത്തിൽ (OBC) ഉൾപ്പെടുന്നയാളും സർക്കാർ നിശ്ചയിച്ചിട്ടുള്ള വരുമാന പരിധിക്കുള്ളിൽ വരുന്ന കുടുംബാംഗവുമാണ്.',
      'പി.എസ്.സി / തൊഴിൽ / ഉപരിപഠന സംവരണ ആവശ്യത്തിനായി എനിക്ക് നോൺ-ക്രീമിലെയർ സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ആധാർ കാർഡ് പകർപ്പ്', 'SSLC സർട്ടിഫിക്കറ്റ് പകർപ്പ്', 'റേഷൻ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര്', value: 'മുഹമ്മദ് ഷഫീഖ് കെ.', placeholder: 'പേര്' },
      { id: 'religionCaste', label: 'മതവും ജാതിയും (OBC)', value: 'ഇസ്ലാം — മാപ്പിള', placeholder: 'മതം, ജാതി' },
      { id: 'parentsOccupation', label: 'മാതാപിതാക്കളുടെ തൊഴിൽ', value: 'കൃഷി / കൂലിപ്പണി', placeholder: 'തൊഴിൽ' },
      { id: 'familyAnnualIncome', label: 'വാർഷിക കുടുംബ വരുമാനം', value: '₹60,000/-', placeholder: 'വരുമാനം' },
      { id: 'purpose', label: 'ആവശ്യം', value: 'പി.എസ്.സി / ഉപരിപഠന ആവശ്യത്തിന്', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'edistrict-nativity',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Common Form — Nativity / Residence Certificate',
    titleMalayalam: 'നേറ്റിവിറ്റി / റെസിഡൻസ് സർട്ടിഫിക്കറ്റ് (Nativity / Residence)',
    titleEnglish: 'Nativity & Residence Certificate Application',
    subtitleMalayalam: 'കേരളത്തിലെ ജനനവും സ്ഥിരതാമസവും തെളിയിക്കുന്നതിനുള്ള സർട്ടിഫിക്കറ്റ്',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'nativity residence domicile നേറ്റിവിറ്റി റെസിഡൻസ് സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ്',
    subject: 'നേറ്റിവിറ്റി / സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ് (Nativity / Residence Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ജന്മം കൊണ്ടും സ്ഥിരതാമസം കൊണ്ടും കേരള സംസ്ഥാനത്തെ പൗരനാണ്. എന്റെ ജനന-വിദ്യാഭ്യാസ രേഖകൾ ഇതോടൊപ്പം സമർപ്പിക്കുന്നു.',
      'ആയതിനാൽ എനിക്ക് നേറ്റിവിറ്റി / സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ജനന സർട്ടിഫിക്കറ്റ് / SSLC ബുക്ക് പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്', 'റേഷൻ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര്', value: 'അനന്യ എസ്. നായർ', placeholder: 'പേര്' },
      { id: 'placeOfBirth', label: 'ജനിച്ച സ്ഥലവും താലൂക്കും ജില്ലയും', value: 'നെടുമങ്ങാട്, തിരുവനന്തപുരം ജില്ല', placeholder: 'ജനന സ്ഥലം' },
      { id: 'yearsOfResidence', label: 'സ്ഥിരതാമസ കാലയളവ്', value: 'ജനനം മുതൽ (22 വർഷം)', placeholder: 'വർഷം' },
      { id: 'purpose', label: 'ആവശ്യം', value: 'കോളേജ് അഡ്മിഷൻ / പാസ്പോർട്ട് / തൊഴിൽ', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'edistrict-legal-heir',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Common Form — Legal Heirship / Family Membership',
    titleMalayalam: 'ലീഗൽ ഹെയർ / അനന്തരാവകാശ സർട്ടിഫിക്കറ്റ് (Legal Heirship)',
    titleEnglish: 'Legal Heirship Certificate Application',
    subtitleMalayalam: 'മരണപ്പെട്ട വ്യക്തിയുടെ നിയമപരമായ അവകാശികളെ സാക്ഷ്യപ്പെടുത്തുന്നതിനുള്ള അപേക്ഷ',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'legal heirship family membership ലീഗൽ ഹെയർ അനന്തരാവകാശ സർട്ടിഫിക്കറ്റ് ഫാമിലി മെമ്പർഷിപ്പ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട തഹസിൽദാർ / വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'താലൂക്ക് ഓഫീസ് / വില്ലേജ് ഓഫീസ്',
    subject: 'അനന്തരാവകാശ സർട്ടിഫിക്കറ്റ് (Legal Heirship / Family Membership Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിച്ചിരുന്ന എന്റെ പിതാവ്/മാതാവ്/ഭർത്താവ് താഴെ കാണിച്ചിരിക്കുന്ന തീയതിയിൽ മരണപ്പെട്ടിട്ടുള്ളതാണ്. പരേതന്റെ/പരേതയുടെ നിയമപരമായ അവകാശികൾ താഴെ പട്ടികയിൽ പറയുന്നവർ മാത്രമാണ്.',
      'ബാങ്ക് ഇടപാടുകൾക്കും വസ്തു സംബന്ധമായ ആവശ്യങ്ങൾക്കുമായി അനന്തരാവകാശ സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['മരണ സർട്ടിഫിക്കറ്റ് പകർപ്പ്', 'റേഷൻ കാർഡ് പകർപ്പ്', 'എല്ലാ അവകാശികളുടെയും ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'deceasedName', label: 'മരണപ്പെട്ട വ്യക്തിയുടെ പേര്', value: 'രാമചന്ദ്രൻ നായർ കെ.', placeholder: 'മരണപ്പെട്ടയാളുടെ പേര്' },
      { id: 'dateOfDeath', label: 'മരണപ്പെട്ട തീയതി', value: '12/01/2026', placeholder: 'തീയതി' },
      { id: 'applicantRelation', label: 'അപേക്ഷകനുമായുള്ള ബന്ധം', value: 'മകൻ / ഭാര്യ', placeholder: 'ബന്ധം' },
      { id: 'heirsList', label: 'അവകാശികളുടെ പേരും വയസ്സും ബന്ധവും', value: '1. ശാന്തകുമാരി (ഭാര്യ, 62), 2. രാജേഷ് ആർ. (മകൻ, 38), 3. രമ്യ ആർ. (മകൾ, 34)', placeholder: 'അവകാശികളുടെ വിവരങ്ങൾ' },
      { id: 'purpose', label: 'സർട്ടിഫിക്കറ്റ് ആവശ്യമായ കാര്യം', value: 'ബാങ്ക് നിക്ഷേപം / വസ്തു പോക്കുവരവ്', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'edistrict-possession-location',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Form — Possession & Location Sketch / Pokkuvaravu',
    titleMalayalam: 'പോസഷൻ സർട്ടിഫിക്കറ്റ് / ലൊക്കേഷൻ സ്കെച്ച് / പോക്കുവരവ്',
    titleEnglish: 'Possession Certificate, Location Sketch & Mutation',
    subtitleMalayalam: 'ഭൂമിയുടെ കൈവശാവകാശ സർട്ടിഫിക്കറ്റ്, ലൊക്കേഷൻ സ്കെച്ച്, പോക്കുവരവ് അപേക്ഷ',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'possession certificate location sketch pokkuvaravu പോസഷൻ കൈവശാവകാശ ലൊക്കേഷൻ സ്കെച്ച് പോക്കുവരവ് ഭൂനികുതി',
    recipientTitle: 'ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ്',
    subject: 'വസ്തുവിന്റെ കൈവശാവകാശ സർട്ടിഫിക്കറ്റും (Possession Certificate) ലൊക്കേഷൻ സ്കെച്ചും അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ പൂർണ്ണ ഉടമസ്ഥതയിലും കൈവശത്തിലുമുള്ള താഴെ പട്ടികയിൽ വിവരിക്കുന്ന വസ്തുവിന്റെ കൈവശാവകാശ സർട്ടിഫിക്കറ്റും ലൊക്കേഷൻ സ്കെച്ചും ബാങ്ക് ലോൺ / കെട്ടിട നിർമ്മാണ ആവശ്യത്തിനായി ആവശ്യമായി വന്നിരിക്കുന്നു.',
      'ആയതിനാൽ അടിയന്തരമായി രേഖകൾ പരിശോധിച്ച് സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['നടപ്പു സാമ്പത്തിക വർഷത്തെ ഭൂനികുതി രസീത് പകർപ്പ്', 'ആധാരത്തിന്റെ പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'ownerName', label: 'ഭൂവുടമയുടെ പേര്', value: 'സുരേഷ് കുമാർ ആർ.', placeholder: 'പേര്' },
      { id: 'surveyNo', label: 'സർവ്വേ നമ്പർ / റീ-സർവ്വേ നമ്പർ & ബ്ലോക്ക്', value: 'ബ്ലോക്ക് 12, റീ-സർവ്വേ നമ്പർ 245/3', placeholder: 'സർവ്വേ നമ്പർ' },
      { id: 'landExtent', label: 'വസ്തുവിന്റെ വിസ്തീർണ്ണം (ആർ / സെന്റ്)', value: '4.05 ആർ (10 സെന്റ്)', placeholder: 'വിസ്തീർണ്ണം' },
      { id: 'thandapperNo', label: 'തണ്ടപ്പേർ നമ്പർ & നികുതി രസീത് നമ്പർ', value: 'തണ്ടപ്പേർ നമ്പർ: 4821', placeholder: 'തണ്ടപ്പേർ നമ്പർ' },
      { id: 'purpose', label: 'ആവശ്യം', value: 'ഭവന വായ്പ / പഞ്ചായത്ത് കെട്ടിട പെർമിറ്റ്', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'edistrict-one-and-same-life',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Form — One and the Same / Relationship / Life Certificate',
    titleMalayalam: 'വൺ & ദി സെയിം / ലൈഫ് / റിലേഷൻഷിപ്പ് സർട്ടിഫിക്കറ്റ്',
    titleEnglish: 'One and the Same, Relationship & Life Certificate',
    subtitleMalayalam: 'പേരിലെ വ്യത്യാസം സാക്ഷ്യപ്പെടുത്തൽ, കുടുംബ ബന്ധം, ജീവിച്ചിരിക്കുന്നു എന്ന സർട്ടിഫിക്കറ്റ്',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'one and the same life relationship certificate വൺ ആൻഡ് ദി സെയിം ലൈഫ് റിലേഷൻഷിപ്പ് സർട്ടിഫിക്കറ്റ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ്',
    subject: 'വൺ ആൻഡ് ദി സെയിം സർട്ടിഫിക്കറ്റ് (One and the Same Certificate) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ ഔദ്യോഗിക രേഖകളിൽ പേരിൽ ചെറിയ വ്യത്യാസം കാണപ്പെടുന്നുണ്ട്. എന്നാൽ ഈ രണ്ട് പേരുകളിലും അറിയപ്പെടുന്നത് ഞാൻ ഒരാൾ തന്നെയാണ്.',
      'ആയതിനാൽ രണ്ട് പേരുകളും ഒരാളുടേത് തന്നെയാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്ന വൺ & ദി സെയിം സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ആധാർ കാർഡ് പകർപ്പ്', 'SSLC ബുക്ക് / പാസ്പോർട്ട് പകർപ്പ്', 'റേഷൻ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'primaryName', label: 'ആധാർ കാർഡിലെ പേര്', value: 'മുഹമ്മദ് അലി കെ. പി.', placeholder: 'ഒന്നാമത്തെ പേര്' },
      { id: 'secondaryName', label: 'മറ്റ് രേഖയിലെ പേര് (SSLC / ആധാരം)', value: 'എം. അലി കുഞ്ഞിപ്പറമ്പിൽ', placeholder: 'രണ്ടാമത്തെ പേര്' },
      { id: 'documentNames', label: 'വ്യത്യാസമുള്ള രേഖകളുടെ പേര്', value: 'ആധാർ കാർഡ്, വസ്തു ആധാരം', placeholder: 'രേഖകൾ' },
      { id: 'purpose', label: 'ആവശ്യം', value: 'ബാങ്ക് / വില്ലേജ് ഓഫീസ് രേഖകൾ ഏകീകരിക്കാൻ', placeholder: 'ആവശ്യം' },
    ],
  },

  // ===========================================================================
  // CATEGORY 2: തദ്ദേശ സ്വയംഭരണം (Panchayat / Municipality / K-SMART)
  // ===========================================================================
  {
    id: 'lsgd-birth-death-correction',
    categoryKey: 'lsgd_panchayat',
    categoryLabelMalayalam: 'തദ്ദേശ സ്വയംഭരണം (Panchayat / Municipality / K-SMART)',
    formCode: 'LSGD / K-SMART — Birth & Death Registration / Correction Form',
    titleMalayalam: 'ജനന / മരണ രജിസ്ട്രേഷനും പേര് തിരുത്തലിനുമുള്ള അപേക്ഷ',
    titleEnglish: 'Birth / Death Certificate Registration & Correction',
    subtitleMalayalam: 'പഞ്ചായത്ത് / നഗരസഭ ജനന-മരണ രജിസ്ട്രാർക്ക് പേര് ചേർക്കാനോ തിരുത്താനോ ഉള്ള അപേക്ഷ',
    portalName: 'LSGD Kerala / K-SMART',
    portalUrl: 'https://lsgkerala.gov.in',
    searchKeywords: 'birth death certificate correction ജനന മരണ സർട്ടിഫിക്കറ്റ് തിരുത്തൽ പഞ്ചായത്ത് ksmart',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ജനന-മരണ രജിസ്ട്രാർ / സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി കാര്യാലയം',
    subject: 'ജനന സർട്ടിഫിക്കറ്റിലെ പേര് / വിവരങ്ങൾ തിരുത്തി പുതിയ സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ / എന്റെ കുട്ടിയുടെ ജനന സർട്ടിഫിക്കറ്റിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന പ്രകാരം അക്ഷരത്തെറ്റ് കടന്നുകൂടിയിട്ടുണ്ട്.',
      'സ്കൂൾ / പാസ്പോർട്ട് രേഖകളുമായി ഒത്തുപോകുന്നതിനായി പ്രസ്തുത തെറ്റ് തിരുത്തി പുതിയ ജനന സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['നിലവിലെ ജനന സർട്ടിഫിക്കറ്റ് പകർപ്പ്', 'സ്കൂൾ സർട്ടിഫിക്കറ്റ് / ആധാർ കാർഡ് പകർപ്പ്', 'മാതാപിതാക്കളുടെ തിരിച്ചറിയൽ രേഖ'],
    structuredFields: [
      { id: 'childOrPersonName', label: 'കുട്ടിയുടെ / വ്യക്തിയുടെ ശരിയായ പേര്', value: 'ഫാത്തിമ സഹ്റ എം.', placeholder: 'ശരിയായ പേര്' },
      { id: 'dateAndHospital', label: 'ജനന തീയതിയും ആശുപത്രിയുടെ പേരും', value: '14/08/2016, താലൂക്ക് ആശുപത്രി', placeholder: 'തീയതി, ആശുപത്രി' },
      { id: 'regNoYear', label: 'രജിസ്ട്രേഷൻ നമ്പറും വർഷവും', value: 'Reg No: 1042 / 2016', placeholder: 'രജിസ്ട്രേഷൻ നമ്പർ' },
      { id: 'correctionNeeded', label: 'വരുത്തേണ്ട തിരുത്തൽ (തെറ്റായതും ശരിയായതും)', value: 'പിതാവിന്റെ പേരിലെ ഇനിഷ്യൽ K എന്നത് K. P. എന്ന് തിരുത്തുക', placeholder: 'തിരുത്തൽ വിവരം' },
    ],
  },
  {
    id: 'lsgd-marriage-reg-form1',
    categoryKey: 'lsgd_panchayat',
    categoryLabelMalayalam: 'തദ്ദേശ സ്വയംഭരണം (Panchayat / Municipality / K-SMART)',
    formCode: 'Kerala Marriage Rules — Form No. 1 (വിവാഹ രജിസ്ട്രേഷൻ)',
    titleMalayalam: 'വിവാഹ രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോം (Form 1 — പൊതു / ഹിന്ദു വിവാഹം)',
    titleEnglish: 'Marriage Registration Memorandum (Form 1)',
    subtitleMalayalam: 'കേരള വിവാഹ രജിസ്ട്രേഷൻ ചട്ടങ്ങൾ പ്രകാരം പഞ്ചായത്ത് / നഗരസഭയിൽ സമർപ്പിക്കാൻ',
    portalName: 'LSGD Kerala / K-SMART',
    portalUrl: 'https://lsgkerala.gov.in',
    searchKeywords: 'marriage registration form 1 വിവാഹ രജിസ്ട്രേഷൻ ഫോം പഞ്ചായത്ത് ksmart',
    recipientTitle: 'ബഹുമാനപ്പെട്ട തദ്ദേശ സ്വയംഭരണ വിവാഹ രജിസ്ട്രാർ അവർകൾക്ക്,',
    recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് / നഗരസഭാ കാര്യാലയം',
    subject: 'വിവാഹം രജിസ്റ്റർ ചെയ്ത് സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ (Form No. 1).',
    bodyParagraphs: [
      'താഴെ പട്ടികയിൽ വിവരിക്കുന്ന വരനും വധുവും തമ്മിലുള്ള വിവാഹം മതാചാരപ്രകാരം / നിയമപ്രകാരം നടന്നിട്ടുള്ളതാണ്. ആയത് തദ്ദേശ സ്വയംഭരണ സ്ഥാപനത്തിലെ വിവാഹ രജിസ്റ്ററിൽ ചേർത്ത് വിവാഹ സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: [
      'വരന്റെയും വധുവിന്റെയും ആധാർ / SSLC പകർപ്പ്',
      'വിവാഹ ക്ഷണക്കത്ത് / മണ്ഡപം അല്ലെങ്കിൽ മഹല്ല്/ക്ഷേത്ര/പള്ളി സർട്ടിഫിക്കറ്റ്',
      'ജോയിന്റ് ഫോട്ടോ (3 എണ്ണം)',
    ],
    structuredFields: [
      { id: 'groomDetails', label: 'വരന്റെ പേരും ജനനത്തീയതിയും വിലാസവും', value: 'അമൽ ജോസഫ് (DOB: 10/05/1996), വലിയപറമ്പിൽ വീട്, എറണാകുളം', placeholder: 'വരന്റെ വിവരങ്ങൾ' },
      { id: 'brideDetails', label: 'വധുവിന്റെ പേരും ജനനത്തീയതിയും വിലാസവും', value: 'അനീറ്റ മേരി (DOB: 22/09/1998), റോസ് വില്ല, തൃശ്ശൂർ', placeholder: 'വധുവിന്റെ വിവരങ്ങൾ' },
      { id: 'marriageDate', label: 'വിവാഹം നടന്ന തീയതി', value: '25/01/2026', placeholder: 'വിവാഹ തീയതി' },
      { id: 'marriageVenue', label: 'വിവാഹം നടന്ന സ്ഥലം / ഓഡിറ്റോറിയം / ആരാധനാലയം', value: 'സെന്റ് മേരീസ് ചർച്ച് പാരിഷ് ഹാൾ, ഇടപ്പള്ളി', placeholder: 'സ്ഥലം' },
      { id: 'witnessNames', label: 'സാക്ഷികളുടെ പേരും വിലാസവും (2 പേർ)', value: '1. തോമസ് കെ. ജെ., 2. വിനോദ് കുമാർ ആർ.', placeholder: 'സാക്ഷികൾ' },
    ],
  },
  {
    id: 'lsgd-building-ownership-permit',
    categoryKey: 'lsgd_panchayat',
    categoryLabelMalayalam: 'തദ്ദേശ സ്വയംഭരണം (Panchayat / Municipality / K-SMART)',
    formCode: 'LSGD / K-SMART — Building Ownership Transfer & Numbering',
    titleMalayalam: 'കെട്ടിട നികുതി ഉടമസ്ഥാവകാശ മാറ്റം & കെട്ടിട നമ്പർ അപേക്ഷ',
    titleEnglish: 'Building Ownership Transfer & Building Permit Application',
    subtitleMalayalam: 'പഞ്ചായത്ത് അസസ്മെന്റ് രജിസ്റ്ററിൽ വീടിന്റെ/കെട്ടിടത്തിന്റെ പേര് മാറ്റാനും നമ്പർ ലഭിക്കാനും',
    portalName: 'LSGD Kerala / K-SMART',
    portalUrl: 'https://lsgkerala.gov.in',
    searchKeywords: 'building tax ownership transfer house number permit കെട്ടിട നികുതി ഉടമസ്ഥാവകാശ മാറ്റം വീട്ടുനമ്പർ പെർമിറ്റ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി കാര്യാലയം',
    subject: 'കെട്ടിടത്തിന്റെ ഉടമസ്ഥാവകാശം രജിസ്റ്ററിൽ പേരിലേക്ക് മാറ്റിത്തരുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'ഈ പഞ്ചായത്തിലെ/നഗരസഭയിലെ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന വാർഡിലും കെട്ടിട നമ്പറിലുമുള്ള വീട്/കെട്ടിടം തീറാധാരം / ദാനാധാരം പ്രകാരം എന്റെ ഉടമസ്ഥതയിൽ വന്നിട്ടുള്ളതാണ്.',
      'ആയതിനാൽ പഞ്ചായത്ത് കെട്ടിട നികുതി രജിസ്റ്ററിൽ പ്രസ്തുത കെട്ടിടത്തിന്റെ ഉടമസ്ഥാവകാശം എന്റെ പേരിലേക്ക് മാറ്റി ഉത്തരവ് നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['വസ്തു ആധാരത്തിന്റെ പകർപ്പ്', 'വസ്തു പോക്കുവരവ് ചെയ്ത ഭൂനികുതി രസീത്', 'നിലവിലെ കെട്ടിട നികുതി രസീത്'],
    structuredFields: [
      { id: 'newOwnerName', label: 'പുതിയ ഉടമയുടെ (അപേക്ഷകന്റെ) പേര്', value: 'സുരേഷ് കുമാർ ആർ.', placeholder: 'പേര്' },
      { id: 'previousOwnerName', label: 'മുൻ ഉടമയുടെ പേര്', value: 'ഗോപാലകൃഷ്ണൻ നായർ', placeholder: 'മുൻ ഉടമ' },
      { id: 'wardAndDoorNo', label: 'വാർഡ് നമ്പറും നിലവിലെ കെട്ടിട നമ്പറും', value: 'വാർഡ് 8, കെട്ടിട നമ്പർ: 8/412', placeholder: 'വാർഡ് / കെട്ടിട നമ്പർ' },
      { id: 'deedNoDate', label: 'ആധാരം നമ്പറും സബ് രജിസ്ട്രാർ ഓഫീസും', value: 'ആധാരം നമ്പർ: 1842/2025, ഇടപ്പള്ളി SRO', placeholder: 'ആധാരം നമ്പർ' },
    ],
  },
  {
    id: 'lsgd-trade-license-nregs',
    categoryKey: 'lsgd_panchayat',
    categoryLabelMalayalam: 'തദ്ദേശ സ്വയംഭരണം (Panchayat / Municipality / K-SMART)',
    formCode: 'LSGD — Trade License (D&O) & NREGS Job Card Form',
    titleMalayalam: 'വ്യാപാര ലൈസൻസ് (Trade License) / തൊഴിലുറപ്പ് (NREGS) അപേക്ഷ',
    titleEnglish: 'Trade License (IFTE&OS) & NREGS Job Card Application',
    subtitleMalayalam: 'കടകൾക്കും സ്ഥാപനങ്ങൾക്കുമുള്ള പഞ്ചായത്ത് ലൈസൻസ് അല്ലെങ്കിൽ തൊഴിലുറപ്പ് ജോബ് കാർഡ്',
    portalName: 'LSGD Kerala / K-SMART',
    portalUrl: 'https://lsgkerala.gov.in',
    searchKeywords: 'trade license d&o shop license nregs job card വ്യാപാര ലൈസൻസ് തൊഴിലുറപ്പ് ജോബ് കാർഡ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി കാര്യാലയം',
    subject: 'സ്ഥാപനത്തിന് പുതിയ വ്യാപാര ലൈസൻസ് (Trade License) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പട്ടികയിൽ വിവരിക്കുന്ന കെട്ടിടത്തിൽ പുതിയതായി ഒരു വ്യാപാര സ്ഥാപനം ആരംഭിക്കുവാൻ ഉദ്ദേശിക്കുന്നു. ഇതിനാവശ്യമായ കെട്ടിട വാടക കരാറും മറ്റ് രേഖകളും ഇതോടൊപ്പം സമർപ്പിക്കുന്നു.',
      'ആയതിനാൽ സ്ഥാപനം പരിശോധന നടത്തി വ്യാപാര ലൈസൻസ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['കെട്ടിട വാടക കരാർ / ഉടമയുടെ സമ്മതപത്രം', 'കെട്ടിട നികുതി രസീത് പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'shopName', label: 'സ്ഥാപനത്തിന്റെ / കടയുടെ പേര്', value: 'മലബാർ സ്റ്റോഴ്സ് & ബേക്കറി', placeholder: 'സ്ഥാപനത്തിന്റെ പേര്' },
      { id: 'businessType', label: 'വ്യാപാരത്തിന്റെ സ്വഭാവം', value: 'പലചരക്ക് & ബേക്കറി വിൽപ്പന', placeholder: 'വ്യാപാര ഇനം' },
      { id: 'wardBuildingNo', label: 'വാർഡ് നമ്പറും കെട്ടിട നമ്പറും', value: 'വാർഡ് 11, കെട്ടിട നമ്പർ: 11/209', placeholder: 'കെട്ടിട നമ്പർ' },
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേരും ഫോൺ നമ്പറും', value: 'റഷീദ് കെ., ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ' },
    ],
  },
  {
    id: 'lsgd-tree-cutting-application',
    categoryKey: 'lsgd_panchayat',
    categoryLabelMalayalam: 'തദ്ദേശ സ്വയംഭരണം (Panchayat / Municipality / K-SMART)',
    formCode: 'LSGD — Dangerous Tree Cutting Petition (അപകടകരമായ മരം മുറിച്ചു മാറ്റുന്നതിനുള്ള അപേക്ഷ)',
    titleMalayalam: 'അപകടാവസ്ഥയിലായ മരം മുറിച്ചു മാറ്റാൻ പഞ്ചായത്ത് / നഗരസഭ സെക്രട്ടറിക്ക് അപേക്ഷ',
    titleEnglish: 'Application to Panchayat / Municipality Secretary for Cutting Dangerous Tree',
    subtitleMalayalam: 'വീടിനോ ജീവനോ സ്വത്തിനോ ഭീഷണിയായി നിൽക്കുന്ന മരം (പ്ലാവ് / തെങ്ങ് / മാവ്) മുറിച്ചു മാറ്റാനുള്ള അപേക്ഷ',
    portalName: 'LSGD Kerala / K-SMART',
    portalUrl: 'https://lsgkerala.gov.in',
    searchKeywords: 'tree cutting application panchayat മരം മുറിക്കാൻ അപേക്ഷ പ്ലാവ് തെങ്ങ് മാവ് അപകടാവസ്ഥയിലുള്ള മരം പഞ്ചായത്ത് സെക്രട്ടറി',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി കാര്യാലയം',
    subject: 'അപകടാവസ്ഥയിലായ മരം മുറിച്ചു മാറ്റുന്നതിന് അടിയന്തര നടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ സ്ഥിരതാമസക്കാരനായ ഞാൻ ബഹുമാനപ്പെട്ട സെക്രട്ടറിയുടെ അടിയന്തര ശ്രദ്ധയിലേക്കായി സമർപ്പിക്കുന്ന അപേക്ഷ. എന്റെ വീടിനോട് ചേർന്നുള്ള പുരയിടത്തിൽ / അതിർത്തിയിൽ നിൽക്കുന്ന വലിയ മരം കാറ്റിലും മഴയിലും ചരിഞ്ഞ് വീടിന് മുകളിലേക്ക് വീഴാറായ അതീവ അപകടാവസ്ഥയിലാണ് നിൽക്കുന്നത്.',
      'ശക്തമായ കാറ്റോ മഴയോ ഉണ്ടായാൽ പ്രസ്തുത മരം കടപുഴകി വീണ് എന്റെ വീടിനും കുടുംബാംഗങ്ങളുടെ ജീവനും സ്വത്തിനും വലിയ അപകടം സംഭവിക്കാൻ സാധ്യതയുണ്ട്. ആയതിനാൽ അടിയന്തരമായി സ്ഥലം പരിശോധിച്ച് അപകടാവസ്ഥയിലുള്ള പ്രസ്തുത മരം മുറിച്ചു മാറ്റുന്നതിന് ആവശ്യമായ ഉത്തരവ് നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['സ്ഥലത്തിന്റെ ഫോട്ടോ (ഉണ്ടെങ്കിൽ)', 'ഭൂനികുതി / വീട്ടുനികുതി രസീത് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര്', value: 'അബ്ദുറഹ്മാൻ കെ.', placeholder: 'നിങ്ങളുടെ പേര്' },
      { id: 'addressWard', label: 'വീട്ടുപേരും വാർഡ് നമ്പറും സ്ഥലവും', value: 'മഞ്ചേരി, വാർഡ് 10', placeholder: 'വിലാസം, സ്ഥലം' },
      { id: 'treeDetails', label: 'അപകടാവസ്ഥയിലുള്ള മരത്തിന്റെ വിവരണം', value: 'വീടിന് മുകളിലേക്ക് ചരിഞ്ഞു നിൽക്കുന്ന അപകടാവസ്ഥയിലുള്ള പ്ലാവ് / തെങ്ങ്', placeholder: 'ഉദാ: പ്ലാവ് / തെങ്ങ് / മാവ്' },
    ],
  },

  // ===========================================================================
  // CATEGORY 3: സാമൂഹ്യക്ഷേമ പെൻഷനുകളും സഹായങ്ങളും (Welfare Pensions & CMDRF)
  // ===========================================================================
  {
    id: 'pension-oldage-widow-disability',
    categoryKey: 'welfare_pension',
    categoryLabelMalayalam: 'സാമൂഹ്യക്ഷേമ പെൻഷനുകളും സഹായങ്ങളും',
    formCode: 'Sevana Pension — Social Security Pension Application',
    titleMalayalam: 'വാർദ്ധക്യകാല / വിധവാ / ഭിന്നശേഷി / അവിവാഹിത / കർഷകത്തൊഴിലാളി പെൻഷൻ',
    titleEnglish: 'Kerala Social Security Welfare Pension Application',
    subtitleMalayalam: 'ഇന്ദിരാഗാന്ധി ദേശീയ വാർദ്ധക്യകാല പെൻഷൻ, വിധവാ പെൻഷൻ, ഭിന്നശേഷി പെൻഷൻ അപേക്ഷ',
    portalName: 'Sevana Pension Portal',
    portalUrl: 'https://welfarepension.lsgkerala.gov.in',
    searchKeywords: 'pension old age widow disability unmarried agricultural വാർദ്ധക്യകാല വിധവാ ഭിന്നശേഷി അവിവാഹിത കർഷകത്തൊഴിലാളി പെൻഷൻ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി കാര്യാലയം',
    subject: 'സാമൂഹ്യ സുരക്ഷാ ക്ഷേമ പെൻഷൻ അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ നിർദ്ധന കുടുംബാംഗവും മറ്റ് സ്ഥിരവരുമാനമോ സർക്കാർ പെൻഷനുകളോ ഇല്ലാത്ത വ്യക്തിയുമാണ്. താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന വിഭാഗത്തിൽ സാമൂഹ്യ സുരക്ഷാ പെൻഷന് ഞാൻ അർഹനാണ്/അർഹയാണ്.',
      'ആയതിനാൽ എന്റെ രേഖകൾ പരിശോധിച്ച് പ്രതിമാസ ക്ഷേമ പെൻഷൻ അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: [
      'ആധാർ കാർഡ് & റേഷൻ കാർഡ് പകർപ്പ്',
      'വരുമാന സർട്ടിഫിക്കറ്റ് (വില്ലേജ് ഓഫീസിൽ നിന്നുള്ളത്)',
      'വയസ്സ് തെളിയിക്കുന്ന രേഖ / ഭർത്താവിന്റെ മരണ സർട്ടിഫിക്കറ്റ് / മെഡിക്കൽ ബോർഡ് സർട്ടിഫിക്കറ്റ്',
      'ബാങ്ക് പാസ്ബുക്കിന്റെ ആദ്യ പേജ് പകർപ്പ്',
    ],
    structuredFields: [
      { id: 'pensionScheme', label: 'അപേക്ഷിക്കുന്ന പെൻഷൻ വിഭാഗം', value: 'ഇന്ദിരാഗാന്ധി ദേശീയ വാർദ്ധക്യകാല പെൻഷൻ (60 വയസ്സിന് മുകളിൽ)', placeholder: 'വാർദ്ധക്യകാല / വിധവാ / ഭിന്നശേഷി പെൻഷൻ' },
      { id: 'applicantNameAge', label: 'അപേക്ഷകന്റെ പേരും വയസ്സും ജനനത്തീയതിയും', value: 'കല്യാണി അമ്മ (വയസ്സ്: 65, DOB: 12/04/1960)', placeholder: 'പേര്, വയസ്സ്' },
      { id: 'aadhaarAndRation', label: 'ആധാർ നമ്പറും റേഷൻ കാർഡ് നമ്പറും', value: 'ആധാർ: 8492-3104-3210, റേഷൻ കാർഡ്: 1209384712', placeholder: 'ആധാർ, റേഷൻ കാർഡ്' },
      { id: 'bankAccountIfsc', label: 'ബാങ്ക് അക്കൗണ്ട് നമ്പറും ശാഖയും IFSC കോഡും', value: 'കേരള ഗ്രാമീൺ ബാങ്ക്, A/c: 40129384712, IFSC: KLGB0040123', placeholder: 'ബാങ്ക് വിവരങ്ങൾ' },
      { id: 'annualIncome', label: 'വാർഷിക വരുമാനം (₹)', value: '₹24,000/-', placeholder: 'വാർഷിക വരുമാനം' },
    ],
  },
  {
    id: 'welfare-cmdrf-scst',
    categoryKey: 'welfare_pension',
    categoryLabelMalayalam: 'സാമൂഹ്യക്ഷേമ പെൻഷനുകളും സഹായങ്ങളും',
    formCode: 'CMDRF / SC-ST Dept — Medical & Welfare Financial Aid Form',
    titleMalayalam: 'മുഖ്യമന്ത്രിയുടെ ദുരിതാശ്വാസ നിധി (CMDRF) / പട്ടികജാതി-വർഗ്ഗ ധനസഹായം',
    titleEnglish: 'Chief Minister Distress Relief Fund (CMDRF) & SC/ST Aid',
    subtitleMalayalam: 'ഗുരുതര രോഗങ്ങൾക്കുള്ള ചികിത്സാ സഹായം, വിവാഹ-ഭവന-വിദ്യാഭ്യാസ ധനസഹായ അപേക്ഷ',
    portalName: 'CMDRF / SC-ST Portal',
    portalUrl: 'https://stdd.kerala.gov.in',
    searchKeywords: 'cmdrf chief minister relief medical aid sc st ധനസഹായം മുഖ്യമന്ത്രിയുടെ ദുരിതാശ്വാസ നിധി ചികിത്സാ സഹായം',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ജില്ലാ കളക്ടർ / തഹസിൽദാർ / വില്ലേജ് ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'കളക്ടറേറ്റ് / വില്ലേജ് ഓഫീസ്',
    subject: 'മുഖ്യമന്ത്രിയുടെ ദുരിതാശ്വാസ നിധിയിൽ (CMDRF) നിന്നും ചികിത്സാ ധനസഹായം ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ സാമ്പത്തികമായി വളരെ പിന്നാക്കം നിൽക്കുന്ന കുടുംബാംഗമാണ്. താഴെ പട്ടികയിൽ വിവരിക്കുന്ന രോഗത്തിന് തുടർചികിത്സ നടത്തിവരികയാണ്. ഭാരിച്ച ചികിത്സാ ചെലവ് താങ്ങാൻ എന്റെ കുടുംബത്തിന് നിവൃത്തിയില്ല.',
      'ആയതിനാൽ ഡോക്ടറുടെ മെഡിക്കൽ സർട്ടിഫിക്കറ്റും വരുമാന സർട്ടിഫിക്കറ്റും പരിഗണിച്ച് മുഖ്യമന്ത്രിയുടെ ദുരിതാശ്വാസ നിധിയിൽ നിന്നും പരമാവധി ചികിത്സാ ധനസഹായം അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: [
      'ഡോക്ടറുടെ ഒറിജിനൽ മെഡിക്കൽ സർട്ടിഫിക്കറ്റും ചികിത്സാ ബില്ലുകളും',
      'വില്ലേജ് ഓഫീസറുടെ വരുമാന സർട്ടിഫിക്കറ്റ്',
      'ആധാർ കാർഡ്, റേഷൻ കാർഡ്, ബാങ്ക് പാസ്ബുക്ക് പകർപ്പ്',
    ],
    structuredFields: [
      { id: 'patientNameAge', label: 'രോഗിയുടെ / അപേക്ഷകന്റെ പേരും വയസ്സും', value: 'ചന്ദ്രൻ പി. (വയസ്സ്: 58)', placeholder: 'പേര്, വയസ്സ്' },
      { id: 'diseaseAndHospital', label: 'രോഗവിവരവും ചികിത്സിക്കുന്ന ആശുപത്രിയുടെ പേരും', value: 'ഹൃദ്രോഗ ചികിത്സ — ഗവൺമെന്റ് മെഡിക്കൽ കോളേജ് ആശുപത്രി', placeholder: 'രോഗം, ആശുപത്രി' },
      { id: 'estimatedExpense', label: 'ചികിത്സയ്ക്ക് ചെലവായ / ആവശ്യമായ തുക (₹)', value: '₹1,25,000/-', placeholder: 'ചെലവ് തുക' },
      { id: 'bankAccountDetails', label: 'ബാങ്ക് അക്കൗണ്ട് നമ്പറും IFSC കോഡും', value: 'SBI ശാഖ, A/c: 30928172631, IFSC: SBIN0004321', placeholder: 'ബാങ്ക് അക്കൗണ്ട്' },
    ],
  },

  // ===========================================================================
  // CATEGORY 4: സിവിൽ സപ്ലൈസ് (റേഷൻ കാർഡ് സേവനങ്ങൾ)
  // ===========================================================================
  {
    id: 'ration-new-addition-transfer-phh',
    categoryKey: 'civil_supplies_ration',
    categoryLabelMalayalam: 'സിവിൽ സപ്ലൈസ് (റേഷൻ കാർഡ്)',
    formCode: 'e-CivilSupplies — Ration Card Common Application',
    titleMalayalam: 'റേഷൻ കാർഡ് അപേക്ഷ (പുതിയ കാർഡ് / പേര് ചേർക്കൽ / മാറ്റൽ / PHH മുൻഗണന)',
    titleEnglish: 'Ration Card New / Member Addition / Deletion / PHH Conversion',
    subtitleMalayalam: 'താലൂക്ക് സപ്ലൈ ഓഫീസർക്ക് സമർപ്പിക്കാനുള്ള റേഷൻ കാർഡ് സേവന അപേക്ഷാ ഫോം',
    portalName: 'e-CivilSupplies Kerala',
    portalUrl: 'https://civilsupplieskerala.gov.in',
    searchKeywords: 'ration card new addition deletion transfer phh aay റേഷൻ കാർഡ് പേര് ചേർക്കൽ നീക്കം ചെയ്യൽ മുൻഗണന സപ്ലൈ ഓഫീസ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട താലൂക്ക് സപ്ലൈ ഓഫീസർ (TSO) അവർകൾക്ക്,',
    recipientOffice: 'താലൂക്ക് സപ്ലൈ ഓഫീസ്',
    subject: 'റേഷൻ കാർഡിൽ അംഗങ്ങളെ ചേർക്കുന്നതിനും / പുതിയ കാർഡ് / മുൻഗണനാ വിഭാഗത്തിലേക്ക് മാറ്റുന്നതിനുമുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന റേഷൻ കാർഡ് ഉടമയാണ്. പ്രസ്തുത കാർഡിൽ താഴെ ആവശ്യപ്പെട്ടിട്ടുള്ള മാറ്റം വരുത്തി പുതിയ റേഷൻ കാർഡ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: [
      'നിലവിലെ റേഷൻ കാർഡ് പകർപ്പ്',
      'എല്ലാ അംഗങ്ങളുടെയും ആധാർ കാർഡ് പകർപ്പ്',
      'പഞ്ചായത്ത് ഉടമസ്ഥാവകാശ / സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ് അല്ലെങ്കിൽ റിഡക്ഷൻ സർട്ടിഫിക്കറ്റ്',
    ],
    structuredFields: [
      { id: 'serviceType', label: 'ആവശ്യമായ റേഷൻ കാർഡ് സേവനം', value: 'റേഷൻ കാർഡിൽ പുതിയ അംഗത്തിന്റെ പേര് ചേർക്കൽ / പുതിയ കാർഡ്', placeholder: 'പുതിയ കാർഡ് / പേര് ചേർക്കൽ / കട മാറ്റൽ / PHH' },
      { id: 'cardOwnerName', label: 'കാർഡ് ഉടമയുടെ (ഗൃഹനാഥയുടെ) പേര്', value: 'സുബൈദ ബീവി എം.', placeholder: 'കാർഡ് ഉടമയുടെ പേര്' },
      { id: 'existingCardArd', label: 'നിലവിലെ റേഷൻ കാർഡ് നമ്പറും റേഷൻ കട (ARD) നമ്പറും', value: 'കാർഡ് നമ്പർ: 1120394857, ARD നമ്പർ: 142', placeholder: 'കാർഡ് നമ്പർ, ARD നമ്പർ' },
      { id: 'memberDetails', label: 'ചേർക്കേണ്ട / ഒഴിവാക്കേണ്ട അംഗങ്ങളുടെ പേരും ആധാർ നമ്പറും', value: 'അമീന എസ്. (മകൾ, ആധാർ: 8492-3104-9012)', placeholder: 'അംഗങ്ങളുടെ വിവരങ്ങൾ' },
    ],
  },

  // ===========================================================================
  // CATEGORY 5: മോട്ടോർ വാഹനം (MVD / RTO Forms 1, 2, 28, 29, 30, 38)
  // ===========================================================================
  {
    id: 'mvd-license-form2',
    categoryKey: 'mvd_motor',
    categoryLabelMalayalam: 'മോട്ടോർ വാഹനം (MVD)',
    formCode: 'CMV Rules Form 2 & Form 1 — Driving / Learners License',
    titleMalayalam: 'ലേണേഴ്സ് / ഡ്രൈവിംഗ് ലൈസൻസ് പുതുക്കൽ / വിലാസം മാറ്റൽ (Form 2)',
    titleEnglish: 'Driving License Issue, Renewal & Address Change (Form 2)',
    subtitleMalayalam: 'ആർ.ടി.ഒ (RTO) ഓഫീസിൽ സമർപ്പിക്കാനുള്ള ലേണേഴ്സ് / ഡ്രൈവിംഗ് ലൈസൻസ് ഫോം 2',
    portalName: 'MVD Kerala / Parivahan',
    portalUrl: 'https://parivahan.gov.in',
    searchKeywords: 'mvd rto driving learners license renewal address change form 2 ഡ്രൈവിംഗ് ലേണേഴ്സ് ലൈസൻസ് പുതുക്കൽ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട റീജിയണൽ ട്രാൻസ്പോർട്ട് ഓഫീസർ (RTO / Joint RTO) അവർകൾക്ക്,',
    recipientOffice: 'റീജിയണൽ ട്രാൻസ്പോർട്ട് ഓഫീസ് (RTO)',
    subject: 'ഡ്രൈവിംഗ് ലൈസൻസ് പുതുക്കി ലഭിക്കുന്നതിനും / വിലാസം മാറ്റുന്നതിനുമുള്ള അപേക്ഷ (Form 2).',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ ഡ്രൈവിംഗ് ലൈസൻസ് പുതുക്കുന്നതിനായി / പുതിയ ലേണേഴ്സ് ലൈസൻസ് ലഭിക്കുന്നതിനായി കേന്ദ്ര മോട്ടോർ വാഹന ചട്ടം ഫോം 2 പ്രകാരമുള്ള വിവരങ്ങളും മെഡിക്കൽ സർട്ടിഫിക്കറ്റും ഇതോടൊപ്പം സമർപ്പിക്കുന്നു.',
      'ആയതിനാൽ എന്റെ അപേക്ഷ പരിഗണിച്ച് ആവശ്യമായ നടപടി സ്വീകരിക്കണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['നിലവിലെ ഡ്രൈവിംഗ് ലൈസൻസ് പകർപ്പ്', 'ഫോം 1 (സ്വയം സാക്ഷ്യപ്പെടുത്തിയത്) & ഫോം 1A (മെഡിക്കൽ സർട്ടിഫിക്കറ്റ്)', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര് (Name in Full)', value: 'മുഹമ്മദ് ഷഫീഖ് കെ.', placeholder: 'മുഴുവൻ പേര്' },
      { id: 'dlNumber', label: 'ഡ്രൈവിംഗ് ലൈസൻസ് നമ്പർ (പുതുക്കലാണെങ്കിൽ)', value: 'KL-01-20140028391', placeholder: 'ലൈസൻസ് നമ്പർ' },
      { id: 'vehicleClass', label: 'വാഹന വിഭാഗം (Class of Vehicle)', value: 'MCWG & LMV (മോട്ടോർ സൈക്കിളും ലൈറ്റ് മോട്ടോർ വാഹനവും)', placeholder: 'MCWG / LMV / Transport' },
      { id: 'dobAndBloodGroup', label: 'ജനനത്തീയതിയും രക്തഗ്രൂപ്പും (DOB & Blood Group)', value: '14/05/1993 · O+ve', placeholder: 'ജനനത്തീയതി, രക്തഗ്രൂപ്പ്' },
      { id: 'serviceRequested', label: 'ആവശ്യമായ സേവനം', value: 'ഡ്രൈവിംഗ് ലൈസൻസ് പുതുക്കൽ (Renewal of DL)', placeholder: 'Renewal / Address Change / New LL' },
    ],
  },
  {
    id: 'mvd-ownership-form29-30-28-38',
    categoryKey: 'mvd_motor',
    categoryLabelMalayalam: 'മോട്ടോർ വാഹനം (MVD)',
    formCode: 'CMV Rules Form 29, 30, 28 & 38 — Vehicle Transfer / NOC / Fitness',
    titleMalayalam: 'വാഹന ഉടമസ്ഥാവകാശം മാറ്റൽ (Form 29 & 30) / എൻ.ഒ.സി (Form 28) / ഫിറ്റ്നസ് (Form 38)',
    titleEnglish: 'Vehicle Ownership Transfer (Form 29/30), NOC (28) & Fitness (38)',
    subtitleMalayalam: 'വാഹനം വിൽക്കുമ്പോഴും വാങ്ങുമ്പോഴും ആർ.സി ബുക്കിൽ പേര് മാറ്റാനും എൻ.ഒ.സി / ഫിറ്റ്നസിനും',
    portalName: 'MVD Kerala / Parivahan',
    portalUrl: 'https://parivahan.gov.in',
    searchKeywords: 'form 29 form 30 form 28 form 38 vehicle ownership transfer noc fitness വാഹന ഉടമസ്ഥാവകാശം ആർസി ബുക്ക്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട രജിസ്റ്ററിംഗ് അതോറിറ്റി (RTO / Joint RTO) അവർകൾക്ക്,',
    recipientOffice: 'റീജിയണൽ ട്രാൻസ്പോർട്ട് ഓഫീസ് (RTO)',
    subject: 'വാഹനത്തിന്റെ ഉടമസ്ഥാവകാശം ആർ.സി ബുക്കിൽ മാറ്റിത്തരുന്നതിനുള്ള അറിയിപ്പും അപേക്ഷയും (Form 29 & Form 30).',
    bodyParagraphs: [
      'താഴെ പട്ടികയിൽ വിവരിക്കുന്ന രജിസ്ട്രേഷൻ നമ്പറിലുള്ള വാഹനം വിൽപ്പന കരാർ പ്രകാരം ഒന്നാം കക്ഷി (വിൽപ്പനക്കാരൻ) രണ്ടാം കക്ഷിക്ക് (വാങ്ങുന്നയാൾക്ക്) കൈമാറിയിട്ടുള്ളതാണ്.',
      'ആയതിനാൽ പ്രസ്തുത വാഹനത്തിന്റെ രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റിൽ (RC Book) ഉടമസ്ഥാവകാശം വാങ്ങുന്നയാളുടെ പേരിലേക്ക് മാറ്റിത്തരണമെന്ന് സംയുക്തമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ഒറിജിനൽ ആർ.സി ബുക്ക് (RC)', 'സാധുവായ ഇൻഷുറൻസ് & പുക പരിശോധന (PUCC) സർട്ടിഫിക്കറ്റ്', 'ഇരുകക്ഷികളുടെയും ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'vehicleRegNo', label: 'വാഹന രജിസ്ട്രേഷൻ നമ്പറും മോഡലും', value: 'KL-07-CS-4590 (Maruti Suzuki Swift)', placeholder: 'വാഹന നമ്പർ' },
      { id: 'chassisEngineNo', label: 'ചാസിസ് നമ്പറും എഞ്ചിൻ നമ്പറും', value: 'Chassis: MA3EJKD1S008291, Engine: K12MN49201', placeholder: 'ചാസിസ് & എഞ്ചിൻ നമ്പർ' },
      { id: 'sellerDetails', label: 'വിൽപ്പനക്കാരന്റെ (Transferor) പേരും വിലാസവും', value: 'അനിൽ കുമാർ കെ., ഇടപ്പള്ളി, കൊച്ചി', placeholder: 'വിൽക്കുന്നയാളുടെ പേര്' },
      { id: 'buyerDetails', label: 'വാങ്ങുന്നയാളുടെ (Transferee) പേരും വിലാസവും', value: 'വിഷ്ണു പ്രസാദ് ആർ., ആലുവ, എറണാകുളം', placeholder: 'വാങ്ങുന്നയാളുടെ പേര്' },
      { id: 'formType', label: 'അപേക്ഷാ ഫോം ഇനം', value: 'Form 29 & Form 30 (ഉടമസ്ഥാവകാശ മാറ്റം)', placeholder: 'Form 29 & 30 / Form 28 NOC / Form 38 Fitness' },
    ],
  },

  // ===========================================================================
  // CATEGORY 6: സർക്കാർ ജീവനക്കാർ / അധ്യാപകർ (Service, KSR, GPF, Pension, KPPHA)
  // ===========================================================================
  {
    id: 'service-ksr-leave-application',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'സർക്കാർ ജീവനക്കാർ / അധ്യാപകർ (Service & Misc)',
    formCode: 'KSR Form No. 13 — Application for Leave (Casual / Medical / LWA)',
    titleMalayalam: 'സർക്കാർ ജീവനക്കാരുടെ / അധ്യാപകരുടെ ലീവ് അപേക്ഷ (KSR Leave Form)',
    titleEnglish: 'Application for Leave (Casual Leave, Commuted/Medical Leave, LWA)',
    subtitleMalayalam: 'കെ.എസ്.ആർ (KSR) ചട്ടങ്ങൾ പ്രകാരമുള്ള കാഷ്വൽ ലീവ്, മെഡിക്കൽ ലീവ്, ശമ്പളമില്ലാത്ത അവധി ഫോം',
    portalName: 'Kerala Service Forms',
    portalUrl: 'https://keralaservice.org/forms',
    searchKeywords: 'leave application casual leave medical leave lwa ksr form 13 ലീവ് അപേക്ഷ അവധി സർക്കാർ ജീവനക്കാർ അധ്യാപകർ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ഓഫീസ് മേധാവി / ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ അവർകൾക്ക്,',
    recipientOffice: 'ഗവൺമെന്റ് ഓഫീസ് / ഹയർ സെക്കൻഡറി സ്കൂൾ',
    subject: 'അവധി (Casual Leave / Commuted Leave / LWA) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ (KSR Rule).',
    bodyParagraphs: [
      'ഈ ഓഫീസിൽ/സ്കൂളിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന തസ്തികയിൽ സേവനമനുഷ്ഠിക്കുന്ന എനിക്ക് താഴെ പറയുന്ന കാരണത്താൽ പട്ടികയിൽ രേഖപ്പെടുത്തിയ ദിവസങ്ങളിൽ അവധി അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['മെഡിക്കൽ സർട്ടിഫിക്കറ്റ് (മെഡിക്കൽ അവധിയാണെങ്കിൽ)'],
    structuredFields: [
      { id: 'employeeNamePen', label: 'ജീവനക്കാരന്റെ പേരും PEN നമ്പറും', value: 'ശ്രീമതി ദീപ നായർ (PEN: 648291)', placeholder: 'പേര്, PEN നമ്പർ' },
      { id: 'designationDept', label: 'തസ്തികയും വകുപ്പും / സ്കൂളും', value: 'എച്ച്.എസ്.ടി (HST മലയാളം), ഗവ. മോഡൽ എച്ച്.എസ്.എസ്', placeholder: 'തസ്തിക, ഓഫീസ്' },
      { id: 'basicPayScale', label: 'ശമ്പള സ്കെയിലും അടിസ്ഥാന ശമ്പളവും', value: '₹45,600 – ₹95,600 (Basic: ₹56,500/-)', placeholder: 'ശമ്പള വിവരം' },
      { id: 'leaveNatureAndDays', label: 'അവധിയുടെ സ്വഭാവവും ദിവസങ്ങളുടെ എണ്ണവും തീയതിയും', value: 'കാഷ്വൽ ലീവ് (Casual Leave) — 3 ദിവസം (10/03/2026 മുതൽ 12/03/2026 വരെ)', placeholder: 'ലീവ് ഇനം, തീയതികൾ' },
      { id: 'leaveReason', label: 'അവധി ആവശ്യപ്പെടാനുള്ള കാരണം', value: 'വ്യക്തിപരമായ ആവശ്യം / ചികിത്സാ ആവശ്യം', placeholder: 'കാരണം' },
    ],
  },
  {
    id: 'service-gpf-gis-sli-medical-spark',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'സർക്കാർ ജീവനക്കാർ / അധ്യാപകർ (Service & Misc)',
    formCode: 'Kerala Service — GPF Advance / SLI / GIS / Medical Reimbursement / SPARK',
    titleMalayalam: 'പി.എഫ് അഡ്വാൻസ് (GPF) / മെഡിക്കൽ റീഇംബേഴ്സ്മെന്റ് / GIS-SLI / പെൻഷൻ ഫോം',
    titleEnglish: 'GPF Temporary Advance / NRA, Medical Reimbursement & Pension Form',
    subtitleMalayalam: 'സർക്കാർ ജീവനക്കാർക്കും അധ്യാപകർക്കും പി.എഫ് ലോൺ, ചികിത്സാ റീഇംബേഴ്സ്മെന്റ്, പെൻഷൻ അപേക്ഷ',
    portalName: 'Kerala Service & KPPHA',
    portalUrl: 'https://keralaservice.org/forms',
    searchKeywords: 'gpf pf advance nra medical reimbursement gis sli spark prism pension പിഎഫ് അഡ്വാൻസ് മെഡിക്കൽ റീഇംബേഴ്സ്മെന്റ് പെൻഷൻ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ഡി.ഡി.ഒ (DDO) / ഉപജില്ലാ വിദ്യാഭ്യാസ ഓഫീസർ (AEO / DEO) അവർകൾക്ക്,',
    recipientOffice: 'ഡിപ്പാർട്ട്മെന്റ് / വിദ്യാഭ്യാസ ഓഫീസ്',
    subject: 'ജനറൽ പ്രൊവിഡന്റ് ഫണ്ടിൽ (GPF) നിന്നും താൽക്കാലിക അഡ്വാൻസ് / നോൺ-റീഫണ്ടബിൾ വിത്ത്ഡ്രോവൽ അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'താഴെ പട്ടികയിൽ വിവരിക്കുന്ന എന്റെ ജി.പി.എഫ് (GPF) അക്കൗണ്ടിൽ നിന്നും പട്ടികയിൽ രേഖപ്പെടുത്തിയ ആവശ്യത്തിനായി താൽക്കാലിക അഡ്വാൻസ് / എൻ.ആർ.എ അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു. അവസാന ക്രെഡിറ്റ് കാർഡും സ്റ്റേറ്റ്മെന്റും ഇതോടൊപ്പം ചേർക്കുന്നു.',
    ],
    enclosures: ['അവസാന വർഷത്തെ GPF അക്കൗണ്ട് സ്റ്റേറ്റ്മെന്റ് / ക്രെഡിറ്റ് കാർഡ്', 'SPARK സാലറി സ്ലിപ്പ് പകർപ്പ്'],
    structuredFields: [
      { id: 'subscriberNamePen', label: 'ജീവനക്കാരന്റെ പേരും PEN നമ്പറും', value: 'രാജേഷ് കുമാർ വി. (PEN: 492018)', placeholder: 'പേര്, PEN നമ്പർ' },
      { id: 'gpfAccountNo', label: 'GPF അക്കൗണ്ട് നമ്പറും പ്രതിമാസ വരിസംഖ്യയും', value: 'GPF No: EDN-148290 (വരിസംഖ്യ: ₹5,000/-)', placeholder: 'GPF നമ്പർ' },
      { id: 'balanceAtCredit', label: 'അക്കൗണ്ടിലുള്ള ആകെ ബാലൻസ് തുക (₹)', value: '₹4,80,000/-', placeholder: 'ബാലൻസ് തുക' },
      { id: 'amountRequired', label: 'ആവശ്യപ്പെടുന്ന തുകയും തിരിച്ചടവ് തവണകളും', value: '₹1,80,000/- (36 തവണകളായി തിരിച്ചടവ്)', placeholder: 'ആവശ്യമായ തുക' },
      { id: 'withdrawalPurpose', label: 'തുക പിൻവലിക്കുന്നതിനുള്ള ആവശ്യം', value: 'മകളുടെ ഉപരിപഠനം / ഭവന നവീകരണം / ചികിത്സ', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'kppha-school-tc-admission',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'സർക്കാർ ജീവനക്കാർ / അധ്യാപകർ (Service & Misc)',
    formCode: 'KPPHA Kerala Education — School Admission, TC & Scholarship Form',
    titleMalayalam: 'സ്കൂൾ പ്രവേശനം / ടി.സി (TC) / സ്കൂൾ രേഖ തിരുത്തൽ അപേക്ഷ (KPPHA)',
    titleEnglish: 'School Admission, Transfer Certificate (TC) & Record Correction',
    subtitleMalayalam: 'ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ മുമ്പാകെ ടി.സി, കോണ്ടക്ട് സർട്ടിഫിക്കറ്റ്, അഡ്മിഷൻ അപേക്ഷ',
    portalName: 'KPPHA Education Portal',
    portalUrl: 'https://kppha.in/page?id=forms-downloads',
    searchKeywords: 'school admission tc transfer certificate kppha scholarship സ്കൂൾ പ്രവേശനം ടിസി അപേക്ഷ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ അവർകൾക്ക്,',
    recipientOffice: 'ഗവൺമെന്റ് / എയ്ഡഡ് ഹയർ സെക്കൻഡറി സ്കൂൾ',
    subject: 'വിടുതൽ സർട്ടിഫിക്കറ്റും (TC) സ്വഭാവ സർട്ടിഫിക്കറ്റും അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ മകൻ/മകൾ ഈ സ്കൂളിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന ക്ലാസിൽ പഠിച്ചുവരികയായിരുന്നു. ഉപരിപഠനത്തിനായി / താമസം മാറുന്നതിനാൽ കുട്ടിയുടെ വിടുതൽ സർട്ടിഫിക്കറ്റും (TC) സ്വഭാവ സർട്ടിഫിക്കറ്റും അനുവദിച്ചു തരണമെന്ന് അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['സ്കൂൾ ഫീസ് / ലൈബ്രറി കുടിശ്ശിക ക്ലിയറൻസ്'],
    structuredFields: [
      { id: 'studentName', label: 'വിദ്യാർത്ഥിയുടെ പേര്', value: 'അഭിഷേക് കൃഷ്ണൻ', placeholder: 'വിദ്യാർത്ഥിയുടെ പേര്' },
      { id: 'admissionNoClass', label: 'അഡ്മിഷൻ നമ്പറും പഠിച്ചിരുന്ന ക്ലാസും ഡിവിഷനും', value: 'അഡ്മിഷൻ നമ്പർ: 4921, ക്ലാസ്: 10 - A', placeholder: 'അഡ്മിഷൻ നമ്പർ, ക്ലാസ്' },
      { id: 'parentName', label: 'രക്ഷിതാവിന്റെ പേരും ഫോൺ നമ്പറും', value: 'കൃഷ്ണൻ കുട്ടി കെ., ഫോൺ: 9847123456', placeholder: 'രക്ഷിതാവിന്റെ പേര്' },
      { id: 'reasonForTc', label: 'ടി.സി ആവശ്യപ്പെടാനുള്ള കാരണം', value: 'ഉപരിപഠനത്തിനായി (Plus One Admission)', placeholder: 'കാരണം' },
    ],
  },

  // ===========================================================================
  // CATEGORY 7: രാജിക്കത്ത്, KSEB, പോലീസ്, ബാങ്ക് (General & Resignation)
  // ===========================================================================
  {
    id: 'general-company-resignation',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Official Resignation Letter — Company / Institution / Office',
    titleMalayalam: 'കമ്പനി / ഓഫീസ് / സ്ഥാപന ജോലി രാജിക്കത്ത് (Job Resignation Letter)',
    titleEnglish: 'Official Job Resignation Letter (Malayalam)',
    subtitleMalayalam: 'ഏത് പ്രൈവറ്റ് കമ്പനി, കട, ആശുപത്രി, സ്കൂൾ, സംഘടന എന്നിവിടങ്ങളിൽ നിന്നും രാജിവെക്കാൻ',
    portalName: 'പൊതു മാതൃക',
    portalUrl: '',
    searchKeywords: 'resignation letter job company office രാജിക്കത്ത് ജോലി സ്ഥാപനം കമ്പനി കമ്മിറ്റി',
    recipientTitle: 'ബഹുമാനപ്പെട്ട മാനേജർ / എച്ച്.ആർ (HR) / അധികാരി അവർകൾക്ക്,',
    recipientOffice: 'മലബാർ ട്രേഡേഴ്സ് പ്രൈവറ്റ് ലിമിറ്റഡ്, എറണാകുളം',
    subject: 'സ്ഥാപനത്തിലെ ജോലിയിൽ നിന്നുള്ള രാജി സമർപ്പണം സംബന്ധിച്ച്.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ഈ സ്ഥാപനത്തിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന തസ്തികയിൽ സേവനമനുഷ്ഠിച്ചു വരികയാണ്. എന്നാൽ വ്യക്തിപരമായ കാരണങ്ങളാൽ / മെച്ചപ്പെട്ട മറ്റ് തൊഴിൽ അവസരങ്ങൾ ലഭിച്ചതിനാൽ ഈ തസ്തികയിൽ തുടർന്നു പ്രവർത്തിക്കുവാൻ എനിക്ക് സാധിക്കുന്നതല്ല.',
      'ആയതിനാൽ എന്റെ രാജിക്കത്ത് ദയവായി സ്വീകരിക്കണമെന്നും, സർവീസ് സംബന്ധമായ നടപടികൾ പൂർത്തിയാക്കി എനിക്ക് റിലീവിംഗ് ഓർഡറും എക്സ്പീരിയൻസ് സർട്ടിഫിക്കറ്റും നൽകണമെന്നും വിനീതമായി അഭ്യർത്ഥിക്കുന്നു. ഇതുവരെ സ്ഥാപനം എനിക്ക് നൽകിയ എല്ലാ സഹകരണങ്ങൾക്കും ഹൃദയപൂർവ്വം നന്ദി രേഖപ്പെടുത്തുന്നു.',
    ],
    enclosures: [],
    structuredFields: [
      { id: 'employeeName', label: 'നിങ്ങളുടെ മുഴുവൻ പേര്', value: 'രാഹുൽ നായർ കെ.', placeholder: 'നിങ്ങളുടെ പേര്' },
      { id: 'designation', label: 'നിലവിലെ തസ്തിക / ജോലി (Designation)', value: 'സീനിയർ അക്കൗണ്ടന്റ്', placeholder: 'തസ്തിക' },
      { id: 'companyName', label: 'കമ്പനിയുടെ / സ്ഥാപനത്തിന്റെ പേരും സ്ഥലവും', value: 'മലബാർ ട്രേഡേഴ്സ് പ്രൈവറ്റ് ലിമിറ്റഡ്, കൊച്ചി', placeholder: 'സ്ഥാപനത്തിന്റെ പേര്' },
      { id: 'effectiveDate', label: 'രാജി പ്രാബല്യത്തിൽ വരേണ്ട അവസാന പ്രവൃത്തി ദിവസം', value: '30/04/2026', placeholder: 'അവസാന തീയതി' },
      { id: 'resignReason', label: 'രാജിവെക്കാനുള്ള കാരണം', value: 'വ്യക്തിപരമായ കാരണങ്ങളാൽ / മറ്റൊരു തൊഴിൽ അവസരം ലഭിച്ചതിനാൽ', placeholder: 'കാരണം' },
    ],
  },
  {
    id: 'edistrict-land-conversion-form6',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'Kerala Paddy Land & Wetland Act — Form 6 / Form 5 (ഭൂമി തരം മാറ്റൽ)',
    titleMalayalam: 'ഭൂമി തരം മാറ്റൽ അപേക്ഷ (Form 5 / Form 6 — RDO ഓഫീസ്)',
    titleEnglish: 'Land Conversion & Data Bank Exclusion Application (Form 5 / Form 6)',
    subtitleMalayalam: 'റവന്യൂ ഡിവിഷണൽ ഓഫീസർക്ക് (RDO) പുരയിടമായി തരം മാറ്റുന്നതിനും ഡാറ്റാ ബാങ്കിൽ നിന്ന് ഒഴിവാക്കുന്നതിനും',
    portalName: 'ReLIS / e-District Revenue',
    portalUrl: 'https://revenue.kerala.gov.in',
    searchKeywords: 'form 6 form 5 land conversion paddy wetland rdo ഭൂമി തരം മാറ്റൽ ഡാറ്റാ ബാങ്ക് ആർഡിഒ വില്ലേജ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട റവന്യൂ ഡിവിഷണൽ ഓഫീസർ (RDO / Sub Collector) അവർകൾക്ക്,',
    recipientOffice: 'റവന്യൂ ഡിവിഷണൽ ഓഫീസ് (RDO)',
    subject: 'കേരള നെൽവയൽ-തണ്ണീർത്തട സംരക്ഷണ നിയമം ഫോം 6 / ഫോം 5 പ്രകാരം ഭൂമി തരം മാറ്റി കിട്ടുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ ഉടമസ്ഥതയിലുള്ള താഴെ പട്ടികയിൽ വിവരിക്കുന്ന വസ്തു റവന്യൂ രേഖകളിൽ നിലം എന്ന് രേഖപ്പെടുത്തിയിട്ടുള്ളതെങ്കിലും വർഷങ്ങളായി കരഭൂമിയായി കിടക്കുന്നതാണ്.',
      'ആയതിനാൽ ഭവന നിർമ്മാണ / ഗാർഹിക ആവശ്യത്തിനായി പ്രസ്തുത വസ്തു റവന്യൂ രേഖകളിൽ പുരയിടമായി തരം മാറ്റി ഉത്തരവ് നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['വസ്തു ആധാരത്തിന്റെ പകർപ്പ്', 'നടപ്പു വർഷത്തെ ഭൂനികുതി രസീത്', 'കൈവശാവകാശ സർട്ടിഫിക്കറ്റും ലൊക്കേഷൻ സ്കെച്ചും'],
    structuredFields: [
      { id: 'ownerName', label: 'ഭൂവുടമയുടെ പേരും വിലാസവും', value: 'മോഹനൻ നായർ കെ., ആലുവ', placeholder: 'പേര്, വിലാസം' },
      { id: 'villageTaluk', label: 'വില്ലേജും താലൂക്കും', value: 'ആലുവ വെസ്റ്റ് വില്ലേജ്, ആലുവ താലൂക്ക്', placeholder: 'വില്ലേജ്, താലൂക്ക്' },
      { id: 'surveyExtent', label: 'റീ-സർവ്വേ നമ്പറും വിസ്തീർണ്ണവും (ആർ / സെന്റ്)', value: 'റീ-സർവ്വേ: 114/2, വിസ്തീർണ്ണം: 3.64 ആർ (9 സെന്റ്)', placeholder: 'സർവ്വേ നമ്പർ, സെന്റ്' },
      { id: 'applicationType', label: 'അപേക്ഷാ ഫോം', value: 'ഫോം 6 (25 സെന്റിൽ താഴെ സൗജന്യ ഭൂമി തരം മാറ്റൽ)', placeholder: 'Form 6 / Form 5' },
    ],
  },
  {
    id: 'edistrict-ews-solvency-valuation',
    categoryKey: 'revenue_edistrict',
    categoryLabelMalayalam: 'റവന്യൂ / വില്ലേജ് സർട്ടിഫിക്കറ്റുകൾ (e-District)',
    formCode: 'e-District Form — EWS / Solvency / Land Valuation Certificate',
    titleMalayalam: 'ഇ.ഡബ്ല്യു.എസ് (EWS) / സോൾവൻസി / വാല്യുവേഷൻ സർട്ടിഫിക്കറ്റ്',
    titleEnglish: 'EWS (10% Reservation), Solvency & Valuation Certificate',
    subtitleMalayalam: 'മുന്നാക്ക വിഭാഗങ്ങളിലെ സാമ്പത്തികമായി പിന്നാക്കം നിൽക്കുന്നവർക്കുള്ള EWS സർട്ടിഫിക്കറ്റ് & വസ്തു മതിപ്പുവില',
    portalName: 'e-District Kerala',
    portalUrl: 'https://edistrict.kerala.gov.in/commonForm.jsp',
    searchKeywords: 'ews economically weaker section solvency valuation certificate ഇഡബ്ല്യുഎസ് മുന്നാക്ക സംവരണം സോൾവൻസി മതിപ്പുവില',
    recipientTitle: 'ബഹുമാനപ്പെട്ട വില്ലേജ് ഓഫീസർ / തഹസിൽദാർ അവർകൾക്ക്,',
    recipientOffice: 'വില്ലേജ് ഓഫീസ് / താലൂക്ക് ഓഫീസ്',
    subject: 'ഇ.ഡബ്ല്യു.എസ് (EWS - Economically Weaker Section) സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ സംവരണേതര (General) വിഭാഗത്തിൽ ഉൾപ്പെടുന്നയാളും സർക്കാർ നിശ്ചയിച്ചിട്ടുള്ള സാമ്പത്തിക പരിധിക്കുള്ളിൽ വരുന്ന കുടുംബാംഗവുമാണ്.',
      'വിദ്യാഭ്യാസ / പി.എസ്.സി / തൊഴിൽ ആവശ്യത്തിനായി എനിക്ക് ഇ.ഡബ്ല്യു.എസ് (EWS) സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ആധാർ കാർഡ് & റേഷൻ കാർഡ് പകർപ്പ്', 'SSLC സർട്ടിഫിക്കറ്റ് പകർപ്പ്', 'വസ്തു നികുതി രസീത് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേര്', value: 'ശ്രീജിത്ത് കുമാർ വി.', placeholder: 'പേര്' },
      { id: 'communityName', label: 'മതവും വിഭാഗവും (General)', value: 'ഹിന്ദു — നായർ', placeholder: 'വിഭാഗം' },
      { id: 'annualIncome', label: 'കുടുംബ വാർഷിക വരുമാനം', value: '₹1,20,000/- (4 ലക്ഷത്തിൽ താഴെ)', placeholder: 'വരുമാനം' },
      { id: 'purpose', label: 'ആവശ്യം', value: 'പി.എസ്.സി / കോളേജ് പ്രവേശന സംവരണം', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'kseb-ownership-meter-tariff',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'KSEB Section Office — Consumer Ownership Change & Meter Complaint',
    titleMalayalam: 'കെ.എസ്.ഇ.ബി (KSEB) ഉടമസ്ഥാവകാശ മാറ്റം / മീറ്റർ തകരാർ / പുതിയ കണക്ഷൻ',
    titleEnglish: 'KSEB Electricity Connection Ownership Transfer & Meter Application',
    subtitleMalayalam: 'കറന്റ് ബില്ലിൽ പേര് മാറ്റാൻ, മീറ്റർ പരിശോധിക്കാൻ, പോസ്റ്റ് മാറ്റാൻ, താരിഫ് മാറ്റാൻ',
    portalName: 'KSEB Web Portal',
    portalUrl: 'https://wss.kseb.in',
    searchKeywords: 'kseb electricity consumer ownership transfer meter complaint post shifting കെഎസ്ഇബി വൈദ്യുതി കറന്റ് ബിൽ പേര് മാറ്റൽ മീറ്റർ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട അസിസ്റ്റന്റ് എഞ്ചിനീയർ (Assistant Engineer) അവർകൾക്ക്,',
    recipientOffice: 'കെ.എസ്.ഇ.ബി (KSEB) ഇലക്ട്രിക്കൽ സെക്ഷൻ ഓഫീസ്',
    subject: 'വൈദ്യുതി കണക്ഷന്റെ ഉടമസ്ഥാവകാശം പേരിലേക്ക് മാറ്റിത്തരുന്നതിനുള്ള / സേവനത്തിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'ഈ ഇലക്ട്രിക്കൽ സെക്ഷൻ പരിധിയിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന കൺസ്യൂമർ നമ്പറിലുള്ള വൈദ്യുതി കണക്ഷൻ സ്ഥിതി ചെയ്യുന്ന കെട്ടിടം ഇപ്പോൾ എന്റെ ഉടമസ്ഥതയിലാണ്.',
      'ആയതിനാൽ കെ.എസ്.ഇ.ബി രേഖകളിൽ പ്രസ്തുത കൺസ്യൂമർ നമ്പറിന്റെ ഉടമസ്ഥാവകാശം എന്റെ പേരിലേക്ക് മാറ്റിത്തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['അവസാന മാസത്തെ വൈദ്യുതി ബിൽ രസീത് പകർപ്പ്', 'പഞ്ചായത്ത് കെട്ടിട ഉടമസ്ഥാവകാശ സർട്ടിഫിക്കറ്റ് / ആധാരം പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'consumerNo', label: 'കൺസ്യൂമർ നമ്പർ (Consumer Number - 13 അക്കം)', value: '1155829004123', placeholder: 'കൺസ്യൂമർ നമ്പർ' },
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ (പുതിയ ഉടമയുടെ) പേര്', value: 'അബ്ദുൾ റഹ്മാൻ പി.', placeholder: 'നിങ്ങളുടെ പേര്' },
      { id: 'oldOwnerName', label: 'നിലവിൽ ബില്ലിലുള്ള പേര്', value: 'കുഞ്ഞുമുഹമ്മദ് പി.', placeholder: 'പഴയ പേര്' },
      { id: 'serviceType', label: 'ആവശ്യമായ കെ.എസ്.ഇ.ബി സേവനം', value: 'കണക്ഷൻ ഉടമസ്ഥാവകാശം പേരിലേക്ക് മാറ്റൽ (Ownership Change)', placeholder: 'പേര് മാറ്റൽ / മീറ്റർ പരിശോധന / പോസ്റ്റ് മാറ്റൽ' },
    ],
  },
  {
    id: 'kwa-water-connection-complaint',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Kerala Water Authority (KWA) — Water Connection & Bill Complaint',
    titleMalayalam: 'വാട്ടർ അതോറിറ്റി (KWA) കുടിവെള്ള കണക്ഷൻ പേര് മാറ്റൽ / മീറ്റർ / ബിൽ പരാതി',
    titleEnglish: 'Kerala Water Authority Connection & Meter Application',
    subtitleMalayalam: 'വാട്ടർ കണക്ഷൻ ഉടമസ്ഥാവകാശം മാറ്റാൻ, അമിത ബിൽ തുക കുറയ്ക്കാൻ, പൈപ്പ് ലീക്ക് പരിഹരിക്കാൻ',
    portalName: 'e-Jalam KWA',
    portalUrl: 'https://epay.kwa.kerala.gov.in',
    searchKeywords: 'kwa water authority connection meter bill leak വാട്ടർ അതോറിറ്റി കുടിവെള്ള കണക്ഷൻ പൈപ്പ് ബിൽ',
    recipientTitle: 'ബഹുമാനപ്പെട്ട അസിസ്റ്റന്റ് എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ അവർകൾക്ക്,',
    recipientOffice: 'കേരള വാട്ടർ അതോറിറ്റി (KWA) സബ് ഡിവിഷൻ ഓഫീസ്',
    subject: 'ഗാർഹിക കുടിവെള്ള കണക്ഷൻ സംബന്ധമായ അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന കൺസ്യൂമർ നമ്പറിലുള്ള ഗാർഹിക കുടിവെള്ള ഉപഭോക്താവാണ്.',
      'പട്ടികയിൽ രേഖപ്പെടുത്തിയിട്ടുള്ള വിഷയത്തിൽ അടിയന്തര പരിശോധന നടത്തി ആവശ്യമായ പരിഹാരം ചെയ്തു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['അവസാന വാട്ടർ ബിൽ പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'kwaConsumerNo', label: 'വാട്ടർ കൺസ്യൂമർ നമ്പർ / പ്രേമിസ് ഐഡി', value: 'KWA-3920184', placeholder: 'കൺസ്യൂമർ നമ്പർ' },
      { id: 'applicantName', label: 'ഉപഭോക്താവിന്റെ പേരും ഫോൺ നമ്പറും', value: 'ജോർജ്ജ് കുട്ടി ടി., ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ' },
      { id: 'requestNature', label: 'ആവശ്യം / പരാതി വിവരം', value: 'കണക്ഷൻ ഉടമസ്ഥാവകാശം മാറ്റൽ / കേടായ വാട്ടർ മീറ്റർ മാറ്റിസ്ഥാപിക്കൽ', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'police-general-complaint',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Kerala Police Thuna — General Police Station Petition (പൊതു പരാതി)',
    titleMalayalam: 'പോലീസ് സ്റ്റേഷൻ പൊതു പരാതി (മോഷണം / തർക്കം / ഭീഷണി / വഞ്ചന / മറ്റ് വിഷയങ്ങൾ)',
    titleEnglish: 'General Police Station Petition / Complaint Letter',
    subtitleMalayalam: 'മോഷണം, വ്യക്തിപരമായ തർക്കം, ഭീഷണി, സാമ്പത്തിക വഞ്ചന, അതിർത്തി തർക്കം തുടങ്ങി ഏത് പരാതിയും നൽകാൻ',
    portalName: 'Kerala Police Thuna',
    portalUrl: 'https://thuna.keralapolice.gov.in',
    searchKeywords: 'police station general complaint petition theft dispute threat fraud പോലീസ് സ്റ്റേഷൻ പൊതു പരാതി മോഷണം തർക്കം ഭീഷണി വഞ്ചന',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO / സി.ഐ) അവർകൾക്ക്,',
    recipientOffice: 'പോലീസ് സ്റ്റേഷൻ',
    subject: 'അടിയന്തര അന്വേഷണം നടത്തി നിയമനടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള പരാതി.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പട്ടികയിൽ രേഖപ്പെടുത്തിയിട്ടുള്ള വിഷയത്തിൽ അങ്ങയുടെ അടിയന്തര ശ്രദ്ധയും നിയമസഹായവും തേടിക്കൊണ്ട് ബോധിപ്പിക്കുന്ന പരാതി.',
      'താഴെ പട്ടികയിൽ വിവരിച്ചിരിക്കുന്ന സംഭവത്തിൽ അടിയന്തരമായി അന്വേഷണം നടത്തി കുറ്റക്കാർക്കെതിരെ ഉചിതമായ നിയമനടപടികൾ സ്വീകരിക്കണമെന്നും എനിക്ക് നീതി ലഭ്യമാക്കണമെന്നും വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['അനുബന്ധ തെളിവുകൾ / രേഖകളുടെ പകർപ്പ് (ഉണ്ടെങ്കിൽ)', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'complainantName', label: 'പരാതിക്കാരന്റെ പേരും ഫോൺ നമ്പറും', value: 'നിസാർ അഹമ്മദ് കെ., ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ നമ്പർ' },
      { id: 'complaintSubject', label: 'എന്തിനെക്കുറിച്ചാണ് പരാതി? (പരാതിയുടെ വിഷയം)', value: 'വ്യക്തിപരമായ തർക്കം / സാമ്പത്തിക വഞ്ചന / മോഷണം / ഭീഷണി', placeholder: 'ഉദാ: മോഷണം / ഭീഷണി / സാമ്പത്തിക വഞ്ചന' },
      { id: 'incidentDetails', label: 'സംഭവിച്ച കാര്യം / പരാതിയുടെ ചുരുക്കം', value: 'പരാതിയുടെ പൂർണ്ണ വിവരം ഇവിടെ എഴുതുകയോ വോയ്‌സ് വഴി പറയുകയോ ചെയ്യുക', placeholder: 'സംഭവിച്ച കാര്യം ചുരുക്കത്തിൽ' },
      { id: 'oppositeParty', label: 'എതിർകക്ഷിയുടെ പേരും വിവരവും (ഉണ്ടെങ്കിൽ)', value: 'ബാധകമെങ്കിൽ എതിർകക്ഷിയുടെ പേരും വിലാസവും', placeholder: 'എതിർകക്ഷിയുടെ പേര്' },
      { id: 'incidentDatePlace', label: 'സംഭവം നടന്ന തീയതിയും സ്ഥലവും', value: '04/11/2026, ആലുവ', placeholder: 'തീയതിയും സ്ഥലവും' },
      { id: 'policeStation', label: 'പോലീസ് സ്റ്റേഷന്റെ പേര്', value: 'ആലുവ ഈസ്റ്റ് പോലീസ് സ്റ്റേഷൻ', placeholder: 'പോലീസ് സ്റ്റേഷൻ' },
    ],
  },
  {
    id: 'police-lost-document-complaint',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Kerala Police Thuna — Lost Document / Certificate & Non-Traceable Petition',
    titleMalayalam: 'രേഖകൾ / സർട്ടിഫിക്കറ്റ് / പാസ്പോർട്ട് / ആർ.സി ബുക്ക് നഷ്ടപ്പെട്ട പരാതി (Lost Document)',
    titleEnglish: 'Lost Document / Certificate Police Petition',
    subtitleMalayalam: 'എസ്.എസ്.എൽ.സി, ആധാർ, ആർ.സി ബുക്ക്, ലൈസൻസ്, പാസ്പോർട്ട്, ആധാരം എന്നിവ നഷ്ടപ്പെട്ടാൽ ഡ്യൂപ്ലിക്കേറ്റ് എടുക്കാൻ',
    portalName: 'Kerala Police Thuna',
    portalUrl: 'https://thuna.keralapolice.gov.in',
    searchKeywords: 'police complaint lost passport rc book sslc document thuna പോലീസ് പരാതി പാസ്പോർട്ട് നഷ്ടപ്പെട്ട സർട്ടിഫിക്കറ്റ് ആർസി ബുക്ക്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO / സി.ഐ) അവർകൾക്ക്,',
    recipientOffice: 'പോലീസ് സ്റ്റേഷൻ',
    subject: 'ഒറിജിനൽ രേഖകൾ നഷ്ടപ്പെട്ടതു സംബന്ധിച്ച പരാതിയും ഡ്യൂപ്ലിക്കേറ്റ് എടുക്കുന്നതിനായി സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനുമുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ കൈവശമുണ്ടായിരുന്ന താഴെ പട്ടികയിൽ വിവരിക്കുന്ന ഒറിജിനൽ രേഖ യാത്രാമധ്യേ നഷ്ടപ്പെട്ടു പോയിട്ടുള്ളതാണ്. പലയിടത്തും അന്വേഷിച്ചിട്ടും ആയത് തിരികെ ലഭിച്ചിട്ടില്ല.',
      'പ്രസ്തുത രേഖയുടെ ഡ്യൂപ്ലിക്കേറ്റ് ലഭിക്കുന്നതിനായി പോലീസ് സ്റ്റേഷനിൽ പരാതി രജിസ്റ്റർ ചെയ്ത് രസീതും നോൺ-ട്രേസബിൾ സർട്ടിഫിക്കറ്റും അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['നഷ്ടപ്പെട്ട രേഖയുടെ പകർപ്പ് (ഉണ്ടെങ്കിൽ)', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'complainantName', label: 'പരാതിക്കാരന്റെ പേരും ഫോൺ നമ്പറും', value: 'നിസാർ അഹമ്മദ് കെ., ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ' },
      { id: 'lostItemDetails', label: 'നഷ്ടപ്പെട്ട രേഖയുടെ / സാധനത്തിന്റെ പേരും നമ്പറും', value: 'ഒറിജിനൽ എസ്.എസ്.എൽ.സി (SSLC) ബുക്ക് / ആർ.സി ബുക്ക് / ഡ്രൈവിംഗ് ലൈസൻസ്', placeholder: 'ഏത് രേഖയാണ് നഷ്ടപ്പെട്ടത്?' },
      { id: 'lostDatePlace', label: 'നഷ്ടപ്പെട്ട തീയതിയും സ്ഥലവും', value: '01/11/2026-ൽ ബസ് സ്റ്റാൻഡിന് സമീപം വെച്ച്', placeholder: 'തീയതിയും സ്ഥലവും' },
      { id: 'policeStation', label: 'പോലീസ് സ്റ്റേഷന്റെ പേര്', value: 'ആലുവ ഈസ്റ്റ് പോലീസ് സ്റ്റേഷൻ', placeholder: 'പോലീസ് സ്റ്റേഷൻ' },
    ],
  },
  {
    id: 'police-cyber-fraud-complaint',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Kerala Police Cyber Cell — Online Financial Fraud & Cyber Crime Petition',
    titleMalayalam: 'സൈബർ പോലീസ് പരാതി — ഓൺലൈൻ പണം തട്ടിപ്പ് / വ്യാജ അക്കൗണ്ട് (Cyber Crime)',
    titleEnglish: 'Cyber Police Complaint (Online Financial Scam / UPI Fraud / Social Media)',
    subtitleMalayalam: 'UPI / ബാങ്ക് അക്കൗണ്ട് തട്ടിപ്പ്, വ്യാജ ലിങ്ക് വഴി പണം നഷ്ടപ്പെടൽ, സോഷ്യൽ മീഡിയ സൈബർ ഭീഷണി',
    portalName: 'Cyber Crime Portal / Thuna',
    portalUrl: 'https://www.cybercrime.gov.in',
    searchKeywords: 'cyber police complaint online fraud upi scam fake account സൈബർ പോലീസ് പരാതി ഓൺലൈൻ പണം തട്ടിപ്പ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO) / സൈബർ സെൽ ഓഫീസർ അവർകൾക്ക്,',
    recipientOffice: 'പോലീസ് സ്റ്റേഷൻ / സൈബർ പോലീസ് സ്റ്റേഷൻ',
    subject: 'ഓൺലൈൻ സാമ്പത്തിക തട്ടിപ്പ് / സൈബർ കുറ്റകൃത്യം സംബന്ധിച്ച് അടിയന്തര നടപടി ആവശ്യപ്പെട്ടുള്ള പരാതി.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ താഴെ പട്ടികയിൽ വിവരിക്കുന്ന പ്രകാരം ഓൺലൈൻ സാമ്പത്തിക തട്ടിപ്പിന് / സൈബർ കുറ്റകൃത്യത്തിന് ഇരയായിട്ടുള്ളതാണ്.',
      'ആയതിനാൽ അടിയന്തരമായി സൈബർ സെൽ മുഖേന അന്വേഷണം നടത്തി തട്ടിപ്പുകാരുടെ അക്കൗണ്ട് മരവിപ്പിക്കണമെന്നും എനിക്ക് നഷ്ടപ്പെട്ട തുക തിരികെ ലഭ്യമാക്കാൻ നടപടി സ്വീകരിക്കണമെന്നും വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ബാങ്ക് സ്റ്റേറ്റ്മെന്റ് / UPI ട്രാൻസാക്ഷൻ സ്ക്രീൻഷോട്ട്', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'complainantName', label: 'പരാതിക്കാരന്റെ പേരും ഫോൺ നമ്പറും', value: 'വിഷ്ണു പ്രസാദ് ആർ., ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ' },
      { id: 'cyberCrimeType', label: 'തട്ടിപ്പിന്റെ സ്വഭാവം (UPI / OTP / വ്യാജ ലിങ്ക് / സോഷ്യൽ മീഡിയ)', value: 'ഓൺലൈൻ UPI / ബാങ്ക് അക്കൗണ്ട് പണം തട്ടിപ്പ്', placeholder: 'തട്ടിപ്പിന്റെ ഇനം' },
      { id: 'amountAndUpiId', label: 'നഷ്ടപ്പെട്ട തുകയും ട്രാൻസാക്ഷൻ / അക്കൗണ്ട് വിവരവും', value: '₹15,000/- (UTR / Transaction ID: 430819283712)', placeholder: 'തുക, ട്രാൻസാക്ഷൻ നമ്പർ' },
      { id: 'incidentDateTime', label: 'തട്ടിപ്പ് നടന്ന തീയതിയും സമയവും', value: '03/11/2026 വൈകുന്നേരം 4:30 PM', placeholder: 'തീയതിയും സമയവും' },
      { id: 'policeStation', label: 'പോലീസ് സ്റ്റേഷൻ / സൈബർ സെൽ', value: 'സൈബർ പോലീസ് സ്റ്റേഷൻ / ലോക്കൽ പോലീസ് സ്റ്റേഷൻ', placeholder: 'പോലീസ് സ്റ്റേഷൻ' },
    ],
  },
  {
    id: 'police-accident-gd-entry',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Kerala Police Thuna — Motor Accident GD Entry & Insurance Request',
    titleMalayalam: 'വാഹന അപകടം — ജി.ഡി എൻട്രി (GD Entry) & ഇൻഷുറൻസ് സർട്ടിഫിക്കറ്റ് അപേക്ഷ',
    titleEnglish: 'Motor Vehicle Accident GD Entry Petition for Insurance Claim',
    subtitleMalayalam: 'വാഹന അപകടം നടന്നാൽ ഇൻഷുറൻസ് ക്ലെയിം ലഭിക്കുന്നതിനായി പോലീസ് GD എൻട്രി എടുക്കാൻ',
    portalName: 'Kerala Police Thuna',
    portalUrl: 'https://thuna.keralapolice.gov.in',
    searchKeywords: 'vehicle accident gd entry insurance claim police വാഹന അപകടം ജിഡി എൻട്രി ഇൻഷുറൻസ് പോലീസ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO) അവർകൾക്ക്,',
    recipientOffice: 'പോലീസ് സ്റ്റേഷൻ',
    subject: 'വാഹന അപകടം സംബന്ധിച്ച് ഇൻഷുറൻസ് ക്ലെയിമിനായി ജി.ഡി എൻട്രി (GD Entry) പകർപ്പ് ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന എന്റെ ഉടമസ്ഥതയിലുള്ള / ഞാൻ ഓടിച്ചിരുന്ന താഴെ പട്ടികയിൽ വിവരിക്കുന്ന വാഹനം പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന സ്ഥലത്തുവെച്ച് അപകടത്തിൽപ്പെടുകയും വാഹനത്തിന് കേടുപാടുകൾ സംഭവിക്കുകയും ചെയ്തിട്ടുള്ളതാണ്.',
      'വാഹനത്തിന്റെ ഇൻഷുറൻസ് ക്ലെയിം ലഭിക്കുന്നതിനായി പ്രസ്തുത അപകടം സംബന്ധിച്ച് പോലീസ് സ്റ്റേഷനിൽ ജി.ഡി എൻട്രി (GD Entry) രേഖപ്പെടുത്തി സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['വാഹനത്തിന്റെ ആർ.സി ബുക്ക് & ഇൻഷുറൻസ് പകർപ്പ്', 'ഡ്രൈവിംഗ് ലൈസൻസ് പകർപ്പ്', 'വാഹനത്തിന്റെ ഫോട്ടോ'],
    structuredFields: [
      { id: 'complainantName', label: 'വാഹന ഉടമയുടെ / ഡ്രൈവറുടെ പേരും ഫോൺ നമ്പറും', value: 'അനിൽ കുമാർ കെ., ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ' },
      { id: 'vehicleNumber', label: 'വാഹനത്തിന്റെ രജിസ്ട്രേഷൻ നമ്പറും മോഡലും', value: 'KL-07-CS-4590 (കാറാണ് / ബൈക്കാണ്)', placeholder: 'വാഹന നമ്പർ' },
      { id: 'accidentDatePlace', label: 'അപകടം നടന്ന തീയതിയും സമയവും സ്ഥലവും', value: '03/11/2026 രാവിലെ 9:30-ന് ഇടപ്പള്ളി ജംഗ്ഷനിൽ വെച്ച്', placeholder: 'തീയതി, സമയം, സ്ഥലം' },
      { id: 'accidentSummary', label: 'അപകടം ഉണ്ടായ വിധവും കേടുപാടുകളും', value: 'മുന്നിൽ പോയ വാഹനം പെട്ടെന്ന് ബ്രേക്ക് ചവിട്ടിയപ്പോൾ ഇടിച്ചതിനാൽ മുൻവശത്തെ ബമ്പറിനും ഹെഡ്‌ലൈറ്റിനും കേടുപാടുകൾ സംഭവിച്ചു', placeholder: 'അപകട വിവരം' },
      { id: 'policeStation', label: 'പോലീസ് സ്റ്റേഷന്റെ പേര്', value: 'പോലീസ് സ്റ്റേഷൻ', placeholder: 'പോലീസ് സ്റ്റേഷൻ' },
    ],
  },
  {
    id: 'police-permission-pcc-noc',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Kerala Police Thuna — Mike Permission / Public Event NOC / PCC',
    titleMalayalam: 'മൈക്ക് പെർമിഷൻ / പൊതുപരിപാടി അനുമതി / പോലീസ് ക്ലിയറൻസ് (PCC) അപേക്ഷ',
    titleEnglish: 'Loudspeaker (Mike) Permission, Event NOC & Police Clearance Application',
    subtitleMalayalam: 'ഉത്സവം, സമ്മേളനം, പൊതുപരിപാടി എന്നിവയ്ക്ക് മൈക്ക് അനുമതിക്കും പോലീസ് ക്ലിയറൻസിനും',
    portalName: 'Kerala Police Thuna',
    portalUrl: 'https://thuna.keralapolice.gov.in',
    searchKeywords: 'mike permission loudspeaker event noc pcc police clearance മൈക്ക് പെർമിഷൻ അനുമതി പോലീസ് ക്ലിയറൻസ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO) / ഡിവൈ.എസ്.പി അവർകൾക്ക്,',
    recipientOffice: 'പോലീസ് സ്റ്റേഷൻ / സബ് ഡിവിഷണൽ ഓഫീസ്',
    subject: 'പൊതുപരിപാടി നടത്തുന്നതിനും ഉച്ചഭാഷിണി (Mike Permission) ഉപയോഗിക്കുന്നതിനും പോലീസ് അനുമതി ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'താഴെ പട്ടികയിൽ വിവരിക്കുന്ന സംഘടനയുടെ / കമ്മിറ്റിയുടെ ആഭിമുഖ്യത്തിൽ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന തീയതിയിലും സ്ഥലത്തും വെച്ച് സമാധാനപരമായി പരിപാടി നടത്തുവാൻ തീരുമാനിച്ചിരിക്കുന്നു.',
      'നിയമപരമായ എല്ലാ നിബന്ധനകളും പാലിച്ചുകൊണ്ട് പ്രസ്തുത പരിപാടി നടത്തുന്നതിനും ശബ്ദവർദ്ധിനി (Mike) ഉപയോഗിക്കുന്നതിനും ആവശ്യമായ പോലീസ് അനുമതി (NOC) അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['പരിപാടിയുടെ നോട്ടീസ് / കമ്മിറ്റി കത്ത്', 'അപേക്ഷകന്റെ ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'applicantName', label: 'അപേക്ഷകന്റെ പേരും ഭാരവാഹിത്വവും ഫോൺ നമ്പറും', value: 'സെക്രട്ടറി, യുവജന കലാസമിതി, ഫോൺ: 9847123456', placeholder: 'പേര്, ഫോൺ' },
      { id: 'eventDetails', label: 'പരിപാടിയുടെ പേരും ആവശ്യവും', value: 'വാർഷിക കുടുംബസംഗമവും സാംസ്കാരിക സമ്മേളനവും — മൈക്ക് പെർമിഷൻ', placeholder: 'പരിപാടിയുടെ പേര്' },
      { id: 'eventDatePlaceTime', label: 'പരിപാടി നടക്കുന്ന തീയതിയും സമയവും സ്ഥലവും', value: '15/11/2026 വൈകുന്നേരം 5:00 മുതൽ രാത്രി 9:30 വരെ, പഞ്ചായത്ത് മൈതാനം', placeholder: 'തീയതി, സമയം, സ്ഥലം' },
      { id: 'policeStation', label: 'പോലീസ് സ്റ്റേഷന്റെ പേര്', value: 'പോലീസ് സ്റ്റേഷൻ', placeholder: 'പോലീസ് സ്റ്റേഷൻ' },
    ],
  },
  {
    id: 'bank-account-loan-upi-application',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Banking Common Letter — Account / Loan / UPI Refund / KYC',
    titleMalayalam: 'ബാങ്ക് മാനേജർക്കുള്ള അപേക്ഷ (അക്കൗണ്ട് / വിദ്യാഭ്യാസ-ഭവന ലോൺ / UPI തുക തിരികെ കിട്ടാൻ)',
    titleEnglish: 'Bank Manager Application (Account Closure / Loan / Wrong UPI Transfer / KYC)',
    subtitleMalayalam: 'അക്കൗണ്ട് ക്ലോസ് ചെയ്യാൻ, ചെക്ക് ബുക്ക്/ATM, ലോൺ അപേക്ഷ, തെറ്റായി പോയ UPI പണം തിരികെ കിട്ടാൻ',
    portalName: 'ബാങ്ക് മാതൃക',
    portalUrl: '',
    searchKeywords: 'bank manager account close loan education upi wrong transfer kyc atm ബാങ്ക് അക്കൗണ്ട് ലോൺ യുപിഐ തുക',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ബ്രാഞ്ച് മാനേജർ അവർകൾക്ക്,',
    recipientOffice: 'സ്റ്റേറ്റ് ബാങ്ക് ഓഫ് ഇന്ത്യ (SBI) / ഫെഡറൽ ബാങ്ക് ശാഖ',
    subject: 'ബാങ്ക് അക്കൗണ്ട് സേവനം / ഇടപാട് സംബന്ധിച്ച അപേക്ഷ.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ അങ്ങയുടെ ബാങ്ക് ശാഖയിലെ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന അക്കൗണ്ട് നമ്പർ ഉടമയാണ്.',
      'താഴെ പട്ടികയിൽ രേഖപ്പെടുത്തിയിട്ടുള്ള എന്റെ ആവശ്യം പരിഗണിച്ച് അടിയന്തരമായി അക്കൗണ്ടിൽ ആവശ്യമായ നടപടി സ്വീകരിക്കണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: ['ബാങ്ക് പാസ്ബുക്ക് ആദ്യ പേജ് പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്'],
    structuredFields: [
      { id: 'accountHolderName', label: 'അക്കൗണ്ട് ഉടമയുടെ പേര്', value: 'വിഷ്ണു പ്രസാദ് ആർ.', placeholder: 'നിങ്ങളുടെ പേര്' },
      { id: 'accountNumber', label: 'ബാങ്ക് അക്കൗണ്ട് നമ്പർ', value: '30948271625', placeholder: 'അക്കൗണ്ട് നമ്പർ' },
      { id: 'bankAndBranch', label: 'ബാങ്കിന്റെ പേരും ശാഖയും (Branch)', value: 'സ്റ്റേറ്റ് ബാങ്ക് ഓഫ് ഇന്ത്യ (SBI), ഇടപ്പള്ളി ശാഖ', placeholder: 'ബാങ്ക്, ശാഖ' },
      { id: 'bankingRequest', label: 'ആവശ്യമായ ബാങ്ക് സേവനം', value: 'പുതിയ എ.ടി.എം കാർഡും മൊബൈൽ നമ്പർ മാറ്റലും / വിദ്യാഭ്യാസ വായ്പ', placeholder: 'ആവശ്യം ഇവിടെ ടൈപ്പ് ചെയ്യുക' },
    ],
  },
  {
    id: 'mahallu-temple-church-resignation-noc',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'Religious / Community Committee — Membership Resignation & Marriage NOC',
    titleMalayalam: 'പള്ളി / മഹല്ല് / ക്ഷേത്ര / ഇടവക കമ്മിറ്റി രാജിക്കത്ത് & വിവാഹ NOC അപേക്ഷ',
    titleEnglish: 'Mahallu / Mosque / Temple / Parish Resignation & NOC Letter',
    subtitleMalayalam: 'മഹല്ല് ജമാഅത്ത്, ക്ഷേത്ര ഉപദേശക സമിതി, പള്ളി ഇടവക, റസിഡന്റ്സ് അസോസിയേഷൻ കത്തുകൾ',
    portalName: 'പൊതു മാതൃക',
    portalUrl: '',
    searchKeywords: 'mahallu mosque temple church parish resignation noc marriage പള്ളി മഹല്ല് ജമാഅത്ത് ക്ഷേത്രം ഇടവക രാജിക്കത്ത് വിവാഹ സർട്ടിഫിക്കറ്റ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട പ്രസിഡന്റ് / സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ടൗൺ ജുമാ മസ്ജിദ് മഹല്ല് ജമാഅത്ത് കമ്മിറ്റി / സമിതി',
    subject: 'മഹല്ല് / കമ്മിറ്റി അംഗത്വത്തിൽ നിന്നുള്ള രാജി സമർപ്പണം / സാക്ഷ്യപത്രം സംബന്ധിച്ച്.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ നിലവിൽ ഈ മഹല്ല് / സമിതിയിലെ അംഗമാണ്. എന്നാൽ വ്യക്തിപരമായ കാരണങ്ങളാൽ / മറ്റൊരു പ്രദേശത്തേക്ക് താമസം മാറുന്നതിനാൽ എനിക്ക് തുടർന്ന് ഈ അംഗത്വത്തിൽ തുടരുവാൻ സാധിക്കുന്നതല്ല.',
      'ആയതിനാൽ എന്റെ അപേക്ഷ ദയവായി സ്വീകരിച്ച് കമ്മിറ്റി രജിസ്റ്ററിൽ ആവശ്യമായ മാറ്റങ്ങൾ വരുത്തണമെന്നും, ഇതുവരെ കമ്മിറ്റി ഭാരവാഹികളും അംഗങ്ങളും നൽകിയ എല്ലാ സഹകരണങ്ങൾക്കും ഹൃദയപൂർവ്വം നന്ദി അറിയിക്കുകയും ചെയ്യുന്നു.',
    ],
    enclosures: [],
    structuredFields: [
      { id: 'memberName', label: 'അംഗത്തിന്റെ പേരും വീട്ടുപേരും', value: 'അബ്ദുൾ സലാം കെ. പി., ബൈത്തുൽ നൂർ', placeholder: 'പേര്, വീട്ടുപേര്' },
      { id: 'registerMemberNo', label: 'മഹല്ല് / കമ്മിറ്റി രജിസ്റ്റർ നമ്പർ', value: 'അംഗത്വ നമ്പർ: 248', placeholder: 'രജിസ്റ്റർ നമ്പർ' },
      { id: 'committeeName', label: 'പള്ളി / മഹല്ല് / സമിതിയുടെ പേരും സ്ഥലവും', value: 'ടൗൺ ജുമാ മസ്ജിദ് മഹല്ല് കമ്മിറ്റി, ആലുവ', placeholder: 'കമ്മിറ്റിയുടെ പേര്' },
      { id: 'letterPurpose', label: 'കത്തിന്റെ ആവശ്യം', value: 'അംഗത്വ രാജിക്കത്ത് / താമസം മാറ്റം / വിവാഹ NOC സർട്ടിഫിക്കറ്റ്', placeholder: 'ആവശ്യം' },
    ],
  },
  {
    id: 'experience-salary-certificate-request',
    categoryKey: 'general_resignation',
    categoryLabelMalayalam: 'രാജിക്കത്ത് / ബാങ്ക് / പോലീസ് / KSEB',
    formCode: 'HR / Institution — Experience & Salary Certificate Request',
    titleMalayalam: 'എക്സ്പീരിയൻസ് സർട്ടിഫിക്കറ്റ് & സാലറി സർട്ടിഫിക്കറ്റ് അപേക്ഷ',
    titleEnglish: 'Experience Certificate & Salary Certificate Request Letter',
    subtitleMalayalam: 'വിദേശ ജോലിക്കോ പുതിയ കമ്പനിയിൽ ചേരാനോ ബാങ്ക് ലോണിനോ വേണ്ടി സ്ഥാപന മേധാവിക്ക് നൽകാൻ',
    portalName: 'പൊതു മാതൃക',
    portalUrl: '',
    searchKeywords: 'experience certificate salary certificate relieving letter എക്സ്പീരിയൻസ് സർട്ടിഫിക്കറ്റ് സാലറി സർട്ടിഫിക്കറ്റ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട മാനേജിംഗ് ഡയറക്ടർ / എച്ച്.ആർ മാനേജർ അവർകൾക്ക്,',
    recipientOffice: 'സ്ഥാപനത്തിന്റെ / കമ്പനിയുടെ പേര്',
    subject: 'പ്രവൃത്തിപരിചയ സർട്ടിഫിക്കറ്റ് (Experience Certificate) / സാലറി സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'ഞാൻ അങ്ങയുടെ സ്ഥാപനത്തിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന കാലയളവിൽ സേവനമനുഷ്ഠിച്ചിട്ടുള്ളതാണ് / സേവനമനുഷ്ഠിച്ചു വരികയാണ്.',
      'ഉപരിപഠന / വിദേശ തൊഴിൽ / ബാങ്ക് വായ്പ ആവശ്യത്തിനായി എനിക്ക് സ്ഥാപനത്തിൽ നിന്നുള്ള എക്സ്പീരിയൻസ് സർട്ടിഫിക്കറ്റ് / സാലറി സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.',
    ],
    enclosures: [],
    structuredFields: [
      { id: 'staffName', label: 'ജീവനക്കാരന്റെ പേര്', value: 'അനൂപ് മേനോൻ ആർ.', placeholder: 'നിങ്ങളുടെ പേര്' },
      { id: 'jobRolePeriod', label: 'തസ്തികയും ജോലി ചെയ്ത കാലയളവും', value: 'അക്കൗണ്ട്സ് എക്സിക്യൂട്ടീവ് (2022 ജനുവരി മുതൽ 2026 മാർച്ച് വരെ)', placeholder: 'തസ്തിക, കാലയളവ്' },
      { id: 'companyName', label: 'സ്ഥാപനത്തിന്റെ പേര്', value: 'കേരള എന്റർപ്രൈസസ് പ്രൈവറ്റ് ലിമിറ്റഡ്', placeholder: 'സ്ഥാപനത്തിന്റെ പേര്' },
      { id: 'certificateNeeded', label: 'ആവശ്യമായ സർട്ടിഫിക്കറ്റ്', value: 'എക്സ്പീരിയൻസ് സർട്ടിഫിക്കറ്റ് (Experience Certificate)', placeholder: 'Experience / Salary Certificate' },
    ],
  },
  {
    id: 'school-student-leave-letter',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'സർക്കാർ ജീവനക്കാർ / അധ്യാപകർ (Service & Misc)',
    formCode: 'School Student — Leave Application & Fee Concession',
    titleMalayalam: 'സ്കൂൾ / കോളേജ് വിദ്യാർത്ഥികളുടെ ലീവ് ലെറ്റർ & ഫീസ് ഇളവ് അപേക്ഷ',
    titleEnglish: 'Student Leave Letter & Fee Concession Application',
    subtitleMalayalam: 'ക്ലാസ് ടീച്ചർക്കോ പ്രിൻസിപ്പലിനോ അവധി അപേക്ഷയും ഫീസ് ഇളവ് അപേക്ഷയും നൽകാൻ',
    portalName: 'സ്കൂൾ മാതൃക',
    portalUrl: '',
    searchKeywords: 'school student leave letter fee concession class teacher സ്കൂൾ ലീവ് ലെറ്റർ അവധി അപേക്ഷ വിദ്യാർത്ഥി',
    recipientTitle: 'ബഹുമാനപ്പെട്ട ക്ലാസ് ടീച്ചർ / ഹെഡ്മാസ്റ്റർ അവർകൾക്ക്,',
    recipientOffice: 'ഗവൺമെന്റ് ഹയർ സെക്കൻഡറി സ്കൂൾ',
    subject: 'അവധി (Leave) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'അങ്ങയുടെ ക്ലാസിൽ താഴെ പട്ടികയിൽ കാണിച്ചിരിക്കുന്ന ക്ലാസിലും ഡിവിഷനിലും പഠിക്കുന്ന വിദ്യാർത്ഥിയാണ് ഞാൻ. പനി / കുടുംബപരമായ ആവശ്യം കാരണം എനിക്ക് പട്ടികയിൽ സൂചിപ്പിച്ച ദിവസങ്ങളിൽ ക്ലാസിൽ ഹാജരാകുവാൻ സാധിച്ചിരുന്നില്ല.',
      'ആയതിനാൽ പ്രസ്തുത ദിവസങ്ങളിലെ എന്റെ അവധി ദയവായി അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: [],
    structuredFields: [
      { id: 'studentName', label: 'വിദ്യാർത്ഥിയുടെ പേര്', value: 'ആദിത്യൻ എസ്.', placeholder: 'കുട്ടിയുടെ പേര്' },
      { id: 'classRollNo', label: 'ക്ലാസും ഡിവിഷനും റോൾ നമ്പറും', value: 'ക്ലാസ് 9 - B, റോൾ നമ്പർ: 14', placeholder: 'ക്ലാസ്, റോൾ നമ്പർ' },
      { id: 'schoolName', label: 'സ്കൂളിന്റെ പേര്', value: 'ഗവ. മോഡൽ ഹയർ സെക്കൻഡറി സ്കൂൾ', placeholder: 'സ്കൂളിന്റെ പേര്' },
      { id: 'leaveDatesReason', label: 'അവധി തീയതികളും കാരണവും', value: '04/11/2026 മുതൽ 05/11/2026 വരെ (2 ദിവസം — പനി കാരണം)', placeholder: 'തീയതി, കാരണം' },
    ],
  },
  // =========================================================================
  // 11. മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (MADRASA & USTHAD SERVICES — SKIMVB / SAMASTHA / DAKSHINA / KNM / WISDOM)
  // =========================================================================
  {
    id: 'madrasa-tc-certificate',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    formCode: 'മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് (Madrasa Transfer Certificate / TC & Application)',
    titleMalayalam: 'മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് (മദ്രസ TC) & അപേക്ഷാ ഫോം',
    titleEnglish: 'Madrasa Transfer Certificate (TC) & Application',
    subtitleMalayalam: 'മറ്റൊരു മദ്രസയിലേക്ക് മാറുന്നതിനോ പൊതുപരീക്ഷാ രജിസ്ട്രേഷനോ വേണ്ടിയുള്ള മദ്രസ TC മാതൃക',
    portalName: 'മദ്രസ ഓഫീസ് മാതൃക',
    portalUrl: '',
    searchKeywords: 'madrasa tc transfer certificate മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് മദ്രസ ടിസി സമസ്ത ഉസ്താദ് സദർ മുഅല്ലിം',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സദർ മുഅല്ലിം / മദ്രസ സെക്രട്ടറി അവർകൾക്ക്,',
    recipientOffice: 'ഹയാത്തുൽ ഇസ്‌ലാം മദ്രസ',
    subject: 'മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് (TC) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ / സാക്ഷ്യപത്രം.',
    bodyParagraphs: [
      'താഴെ പട്ടികയിൽ വിവരങ്ങൾ ചേർത്തിരിക്കുന്ന വിദ്യാർത്ഥി ഈ മദ്രസയിലെ പഠനം പൂർത്തിയാക്കിയതിനാലോ താമസസ്ഥലം മാറിയതിനാലോ മറ്റൊരു മദ്രസയിൽ തുടർപഠനം നടത്തുന്നതിനായി മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് (TC) അനുവദിച്ചു നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
      'സാക്ഷ്യപത്രം: മുകളിൽ പേരുള്ള വിദ്യാർത്ഥി ഈ മദ്രസയിൽ കൃത്യമായി പഠനം നടത്തിയതായും മദ്രസയിലേക്ക് അടയ്ക്കാനുള്ള ഫീസോ മറ്റ് കുടിശ്ശികകളോ ഇല്ലെന്നും സാക്ഷ്യപ്പെടുത്തുന്നു.',
    ],
    enclosures: [
      'മദ്രസ അഡ്മിഷൻ രജിസ്റ്റർ നമ്പർ വിവരം',
    ],
    structuredFields: [
      { id: 'studentName', label: 'വിദ്യാർത്ഥിയുടെ പേര്', value: 'മുഹമ്മദ് റയ്യാൻ കെ.', placeholder: 'കുട്ടിയുടെ പേര്' },
      { id: 'parentName', label: 'രക്ഷിതാവിന്റെ പേരും വിലാസവും', value: 'അബ്ദുൽ റഹ്മാൻ കെ., ബൈത്തുൽ നൂർ', placeholder: 'രക്ഷിതാവിന്റെ പേര്, വീട്ടുപേര്' },
      { id: 'admissionNo', label: 'അഡ്മിഷൻ നമ്പറും ചേർന്ന തീയതിയും', value: 'Adm No: 418 / 2022', placeholder: 'അഡ്മിഷൻ നമ്പർ' },
      { id: 'classStudied', label: 'പഠിച്ചിരുന്ന ക്ലാസും വിജയിച്ച ക്ലാസും', value: 'അഞ്ചാം ക്ലാസ് (Class V — വിജയിച്ചു)', placeholder: 'ക്ലാസ് വിവരം' },
      { id: 'boardRegNo', label: 'മദ്രസ ബോർഡ് അംഗീകാര നമ്പർ (SKIMVB / Board Reg No)', value: 'Reg No: 3842', placeholder: 'രജിസ്റ്റർ നമ്പർ' },
      { id: 'reasonForLeaving', label: 'വിടുതൽ സർട്ടിഫിക്കറ്റ് ആവശ്യപ്പെടാനുള്ള കാരണം', value: 'താമസസ്ഥലം മാറുന്നതിനാൽ / ഉപരിപഠനത്തിന്', placeholder: 'കാരണം' },
    ],
  },
  {
    id: 'madrasa-admission-form',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    formCode: 'മദ്രസ പുതിയ അഡ്മിഷൻ അപേക്ഷാ ഫോം (Madrasa Student Admission Form)',
    titleMalayalam: 'മദ്രസ പുതിയ വിദ്യാർത്ഥി പ്രവേശന (Admission) അപേക്ഷാ ഫോം',
    titleEnglish: 'Madrasa New Student Admission Application Form',
    subtitleMalayalam: 'മദ്രസയിൽ ഒന്നാം ക്ലാസിലേക്കോ മറ്റ് ക്ലാസുകളിലേക്കോ പുതിയ കുട്ടികളെ ചേർക്കുന്നതിനുള്ള അപേക്ഷാ ഫോം',
    portalName: 'മദ്രസ അഡ്മിഷൻ രജിസ്റ്റർ',
    portalUrl: '',
    searchKeywords: 'madrasa admission form new student മദ്രസ അഡ്മിഷൻ പ്രവേശന അപേക്ഷ ഫോം പുതിയ കുട്ടി',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സദർ മുഅല്ലിം / മദ്രസ മാനേജ്മെന്റ് കമ്മിറ്റി മുമ്പാകെ,',
    recipientOffice: 'നൂറുൽ ഹുദാ മദ്രസ',
    subject: 'മദ്രസയിൽ പുതിയ വിദ്യാർത്ഥി പ്രവേശനം (Admission) അനുവദിച്ചു ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    bodyParagraphs: [
      'താഴെ പട്ടികയിൽ വിവരങ്ങൾ നൽകിയിരിക്കുന്ന എന്റെ കുട്ടിയെ അങ്ങയുടെ മദ്രസയിൽ പ്രവേശിപ്പിച്ചു പഠിപ്പിക്കുന്നതിന് ദയവായി അനുമതി നൽകണമെന്ന് അപേക്ഷിക്കുന്നു.',
      'മദ്രസയുടെ അച്ചടക്കവും സമയക്രമവും നിയമങ്ങളും പൂർണ്ണമായും പാലിച്ചുകൊള്ളാമെന്നും കുട്ടിയുടെ പഠനത്തിൽ രക്ഷിതാവെന്ന നിലയിൽ പ്രത്യേകം ശ്രദ്ധ ചെലുത്തിക്കൊള്ളാമെന്നും ഇതിനാൽ ഉറപ്പുനൽകുന്നു.',
    ],
    enclosures: [
      'ജനന സർട്ടിഫിക്കറ്റ് / ആധാർ പകർപ്പ്',
      'മുൻ മദ്രസയിലെ TC (മറ്റൊരു മദ്രസയിൽ നിന്ന് വരുന്നവരാണെങ്കിൽ)',
    ],
    structuredFields: [
      { id: 'studentName', label: 'വിദ്യാർത്ഥിയുടെ പൂർണ്ണമായ പേര്', value: 'ഫാത്തിമ സഹ്റ പി.', placeholder: 'കുട്ടിയുടെ പേര്' },
      { id: 'dobAge', label: 'ജനന തീയതിയും വയസ്സും', value: '12/05/2019 (7 വയസ്സ്)', placeholder: 'DD/MM/YYYY' },
      { id: 'classApplied', label: 'പ്രവേശനം ആഗ്രഹിക്കുന്ന ക്ലാസ്', value: 'ഒന്നാം ക്ലാസ് (Class I)', placeholder: 'ക്ലാസ് 1 / 2 / 3...' },
      { id: 'fatherMotherName', label: 'പിതാവിന്റെ / മാതാവിന്റെ പേര്', value: 'ഹംസ പി. / ആമിന കെ.', placeholder: 'രക്ഷിതാവിന്റെ പേര്' },
      { id: 'houseAddress', label: 'വീട്ടുപേരും മഹല്ല് / വിലാസവും', value: 'സഫ മൻസിൽ, വാർഡ് 8', placeholder: 'വീട്ടുപേര്, വിലാസം' },
      { id: 'schoolDetails', label: 'പഠിക്കുന്ന സ്കൂളും ക്ലാസും', value: 'ഗവ. എൽ.പി സ്കൂൾ — ക്ലാസ് 2', placeholder: 'സ്കൂൾ വിവരം' },
      { id: 'mobileNumber', label: 'വാട്സാപ്പ് / മൊബൈൽ നമ്പർ', value: '9847123456', placeholder: 'ഫോൺ നമ്പർ' },
    ],
  },
  {
    id: 'madrasa-usthad-leave-application',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    formCode: 'മദ്രസ ഉസ്താദ് / മുഅല്ലിം അവധി & കമ്മിറ്റി അപേക്ഷ (Usthad / Muallim Application)',
    titleMalayalam: 'മദ്രസ ഉസ്താദ് / മുഅല്ലിം അവധി അപേക്ഷ & കമ്മിറ്റി അപേക്ഷ',
    titleEnglish: 'Madrasa Usthad / Muallim Leave & Management Committee Request',
    subtitleMalayalam: 'ഉസ്താദുമാർക്ക് അവധി അപേക്ഷ, ശമ്പള വർദ്ധനവ്, സർട്ടിഫിക്കറ്റ് ആവശ്യങ്ങൾ എന്നിവ മദ്രസ കമ്മിറ്റിക്ക് നൽകാൻ',
    portalName: 'മദ്രസ കമ്മിറ്റി മാതൃക',
    portalUrl: '',
    searchKeywords: 'madrasa usthad muallim leave application committee മദ്രസ ഉസ്താദ് മുഅല്ലിം അവധി അപേക്ഷ സദർ മുഅല്ലിം കമ്മിറ്റി',
    recipientTitle: 'ബഹുമാനപ്പെട്ട പ്രസിഡന്റ് / സെക്രട്ടറി / സദർ മുഅല്ലിം അവർകൾക്ക്,',
    recipientOffice: 'മദ്രസ മാനേജ്മെന്റ് കമ്മിറ്റി',
    subject: 'അവധി (Leave) / മദ്രസ അധ്യാപക അപേക്ഷ സംബന്ധിച്ച്.',
    bodyParagraphs: [
      'ഈ മദ്രസയിൽ മുഅല്ലിമായി സേവനമനുഷ്ഠിച്ചു വരുന്ന എനിക്ക് താഴെ പട്ടികയിൽ സൂചിപ്പിച്ച കാരണത്താൽ പ്രസ്തുത ദിവസങ്ങളിൽ മദ്രസയിൽ ഹാജരാകുവാൻ സാധിക്കുന്നതല്ല.',
      'ആയതിനാൽ എന്റെ ക്ലാസുകൾക്ക് പകരമായി സഹഅധ്യാപകരെ ചുമതലപ്പെടുത്തിക്കൊണ്ട് പ്രസ്തുത ദിവസങ്ങളിലെ എന്റെ അവധി അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.',
    ],
    enclosures: [],
    structuredFields: [
      { id: 'usthadName', label: 'ഉസ്താദിന്റെ / മുഅല്ലിമിന്റെ പേര്', value: 'അബ്ദുൽ കരീം മുസ്‌ലിയാർ / മൗലവി', placeholder: 'ഉസ്താദിന്റെ പേര്' },
      { id: 'designation', label: 'തസ്തിക & പഠിപ്പിക്കുന്ന ക്ലാസുകൾ', value: 'സദർ മുഅല്ലിം / അസിസ്റ്റന്റ് മുഅല്ലിം (ക്ലാസ് 4, 5)', placeholder: 'തസ്തിക, ക്ലാസ്' },
      { id: 'msrNumber', label: 'മുഅല്ലിം സർവീസ് രജിസ്റ്റർ നമ്പർ (MSR No — ഉണ്ടെങ്കിൽ)', value: 'MSR-45210', placeholder: 'MSR നമ്പർ' },
      { id: 'leaveDatesReason', label: 'അവധി തീയതികളും കാരണവും', value: '10/11/2026 മുതൽ 12/11/2026 വരെ (കുടുംബപരമായ ആവശ്യം)', placeholder: 'തീയതി, കാരണം' },
    ],
  },
  {
    id: 'madrasa-pta-meeting-notice',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    formCode: 'മദ്രസ രക്ഷാകർത്തൃ യോഗം / നബിദിന / വാർഷിക നോട്ടീസ് (Madrasa PTA & Notice)',
    titleMalayalam: 'മദ്രസ രക്ഷാകർത്തൃ യോഗം (PTA) / പരീക്ഷാ മുന്നൊരുക്ക നോട്ടീസ്',
    titleEnglish: 'Madrasa Parent-Teacher Meeting (PTA) & Exam Notice',
    subtitleMalayalam: 'മദ്രസ പരീക്ഷ, പഠന പുരോഗതി, നബിദിന പരിപാടികൾ എന്നിവയ്ക്കായി രക്ഷിതാക്കളെ ക്ഷണിച്ചുകൊണ്ടുള്ള നോട്ടീസ്',
    portalName: 'മദ്രസ നോട്ടീസ്',
    portalUrl: '',
    searchKeywords: 'madrasa pta notice parent meeting നബിദിനം മദ്രസ നോട്ടീസ് രക്ഷാകർത്തൃ യോഗം ഉസ്താദ്',
    recipientTitle: 'പ്രിയപ്പെട്ട മദ്രസ വിദ്യാർത്ഥി രക്ഷിതാക്കൾ അറിയുന്നതിന്,',
    recipientOffice: 'മദ്രസ മാനേജ്മെന്റ് കമ്മിറ്റി & അധ്യാപക സമിതി',
    subject: 'മദ്രസ രക്ഷാകർത്തൃ യോഗം (PTA Meeting) & പരീക്ഷാ മുന്നൊരുക്കം സംബന്ധിച്ച അറിയിപ്പ്.',
    bodyParagraphs: [
      'അസ്സലാമു അലൈക്കും വറഹ്മത്തുല്ലാഹി വബറകാത്തുഹു. നമ്മുടെ മദ്രസയിലെ കുട്ടികളുടെ പഠന പുരോഗതി വിലയിരുത്തുന്നതിനും വരാനിരിക്കുന്ന വാർഷിക / പൊതുപരീക്ഷയുടെ മുന്നൊരുക്കങ്ങൾ ചർച്ച ചെയ്യുന്നതിനുമായി താഴെ കാണുന്ന സമയത്ത് മദ്രസ ഹാളിൽ വെച്ച് രക്ഷാകർത്തൃ യോഗം (PTA Meeting) ചേരുന്നതാണ്.',
      'തങ്ങളുടെ കുട്ടികളുടെ മതപഠന-സ്വഭാവ രൂപീകരണത്തിൽ അധ്യാപകരുമായി നേരിട്ട് സംസാരിക്കുന്നതിനായി എല്ലാ രക്ഷിതാക്കളും കൃത്യസമയത്ത് തന്നെ യോഗത്തിൽ പങ്കെടുക്കണമെന്ന് സ്നേഹപൂർവ്വം അഭ്യർത്ഥിക്കുന്നു.',
    ],
    enclosures: [],
    structuredFields: [
      { id: 'madrasaName', label: 'മദ്രസയുടെ പേര്', value: 'ഹയാത്തുൽ ഇസ്‌ലാം മദ്രസ', placeholder: 'മദ്രസയുടെ പേര്' },
      { id: 'meetingDateDay', label: 'യോഗം നടക്കുന്ന തീയതിയും ദിവസവും', value: '2026 നവംബർ 15 ഞായറാഴ്ച', placeholder: 'തീയതി, ദിവസം' },
      { id: 'meetingTimeVenue', label: 'സമയവും സ്ഥലവും', value: 'രാവിലെ 9:30 മണിക്ക് — മദ്രസ ഓഡിറ്റോറിയത്തിൽ', placeholder: 'സമയം, സ്ഥലം' },
      { id: 'agendaTopic', label: 'പ്രധാന ചർച്ചാ വിഷയം', value: 'പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് പരിശോധന, ഹാജർ നില, പൊതുപരീക്ഷാ ഒരുക്കം', placeholder: 'വിഷയം' },
    ],
  },
  {
    id: 'madrasa-student-abuse-complaint',
    categoryKey: 'service_education',
    categoryLabelMalayalam: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    formCode: 'മദ്രസയിൽ ഉസ്താദ് / അധ്യാപകൻ കുട്ടിയെ പീഡിപ്പിച്ചതിനെതിരെയുള്ള ഔദ്യോഗിക പരാതി (Complaint Against Madrasa Teacher Abuse)',
    titleMalayalam: 'മദ്രസയിൽ വെച്ച് ഉസ്താദ് കുട്ടിയെ പീഡിപ്പിച്ചതിൽ / ഉപദ്രവിച്ചതിൽ നടപടി ആവശ്യപ്പെട്ടുള്ള പരാതി',
    titleEnglish: 'Formal Complaint Against Abuse / Harassment of Student by Madrasa Teacher (Usthad)',
    subtitleMalayalam: 'മദ്രസ വിദ്യാർത്ഥിക്ക് നേരെയുണ്ടായ ശാരീരിക-മാനസിക പീഡനത്തിനെതിരെ മദ്രസ കമ്മിറ്റി / പോലീസ് സ്റ്റേഷൻ / ചൈൽഡ് വെൽഫെയർ കമ്മിറ്റിക്ക് നൽകാനുള്ള പരാതി',
    portalName: 'മദ്രസ കമ്മിറ്റി / പോലീസ് / ചൈൽഡ് ലൈൻ (1098)',
    portalUrl: '',
    searchKeywords: 'madrasa usthad abuse complaint harassment beating childline police മദ്രസ ഉസ്താദ് പീഡനം പരാതി കുട്ടിയെ തല്ലി ഉപദ്രവിച്ചു മർദ്ദിച്ചു ചൈൽഡ് ലൈൻ പോലീസ്',
    recipientTitle: 'ബഹുമാനപ്പെട്ട സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO) / മദ്രസ മാനേജ്മെന്റ് കമ്മിറ്റി പ്രസിഡന്റ് & സെക്രട്ടറി മുമ്പാകെ,',
    recipientOffice: 'പോലീസ് സ്റ്റേഷൻ / മദ്രസ മാനേജ്മെന്റ് കമ്മിറ്റി',
    subject: 'മദ്രസ വിദ്യാർത്ഥിക്ക് നേരെ അധ്യാപകന്റെ (ഉസ്താദിന്റെ) ഭാഗത്തുനിന്നുണ്ടായ പീഡനത്തിൽ കർശന നിയമനടപടി സ്വീകരിക്കുന്നത് സംബന്ധിച്ച്.',
    bodyParagraphs: [
      'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ബഹുമാനപ്പെട്ട അധികാരികളുടെ അടിയന്തര ശ്രദ്ധയിലേക്കായി സമർപ്പിക്കുന്ന പരാതി. എന്റെ കുട്ടിയായ താഴെ പറയുന്ന വിദ്യാർത്ഥി പ്രസ്തുത മദ്രസയിൽ പഠിച്ചുവരികയാണ്. എന്നാൽ മദ്രസയിലെ അധ്യാപകനായ (ഉസ്താദ്) താഴെ പേര് ചേർത്തിട്ടുള്ള വ്യക്തി എന്റെ കുട്ടിയെ ക്രൂരമായി ശാരീരികമായും മാനസികമായും പീഡിപ്പിക്കുകയും ഉപദ്രവിക്കുകയും ചെയ്തിരിക്കുകയാണ്.',
      'ഈ സംഭവം കാരണം കുട്ടി കടുത്ത ശാരീരിക വേദനയിലും മാനസിക ആഘാതത്തിലുമാണ് (ഭയത്തിലാണ്) കഴിയുന്നത്. ആയതിനാൽ പ്രസ്തുത സംഭവത്തെക്കുറിച്ച് അടിയന്തരമായി അന്വേഷണം നടത്തി കുറ്റക്കാരനായ ഉസ്താദിനെതിരെ ബാലനീതി നിയമപ്രകാരവും (Juvenile Justice Act / Child Protection Laws) മറ്റ് പ്രസക്തമായ നിയമവ്യവസ്ഥകൾ പ്രകാരവും കർശനമായ നിയമനടപടികളും അച്ചടക്ക നടപടിയും സ്വീകരിക്കണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
    ],
    enclosures: [
      'ആശുപത്രി ചികിത്സാ രേഖയുടെ (OP Ticket / Wound Certificate) പകർപ്പ് (ഉണ്ടെങ്കിൽ)',
      'രക്ഷിതാവിന്റെ ആധാർ കാർഡ് പകർപ്പ്',
    ],
    structuredFields: [
      { id: 'madrasaNamePlace', label: 'മദ്രസയുടെ പേരും സ്ഥലവും', value: 'ഹയാത്തുൽ ഇസ്‌ലാം മദ്രസ', placeholder: 'മദ്രസയുടെ പേര്, സ്ഥലം' },
      { id: 'studentNameClassAge', label: 'പീഡനത്തിനിരയായ കുട്ടിയുടെ പേരും ക്ലാസ്സും വയസ്സും', value: 'മുഹമ്മദ് അമീൻ (വയസ്സ്: 10, ക്ലാസ്സ്: 5)', placeholder: 'കുട്ടിയുടെ പേര്, വയസ്സ്, ക്ലാസ്സ്' },
      { id: 'accusedUsthadName', label: 'പരാതിക്കാരനായ / കുറ്റാരോപിതനായ ഉസ്താദിന്റെ പേര്', value: 'അബ്ദുൽ റഷീദ് മുസ്‌ലിയാർ (മദ്രസ അധ്യാപകൻ)', placeholder: 'ഉസ്താദിന്റെ പേര്' },
      { id: 'incidentDateDetails', label: 'സംഭവം നടന്ന തീയതിയും പീഡന വിവരങ്ങളും', value: 'കഴിഞ്ഞ ദിവസം മദ്രസ ക്ലാസ് സമയത്ത് വെച്ച് കുട്ടിയെ അകാരണമായി വടികൊണ്ട് ക്രൂരമായി മർദ്ദിക്കുകയും മാനസികമായി പീഡിപ്പിക്കുകയും ചെയ്തു', placeholder: 'തീയതി, നടന്ന സംഭവം' },
      { id: 'complaintSubmittedTo', label: 'പരാതി സമർപ്പിക്കുന്ന അധികാരി (പോലീസ് / മദ്രസ കമ്മിറ്റി / ചൈൽഡ് ലൈൻ)', value: 'സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO) & മദ്രസ മാനേജ്മെന്റ് കമ്മിറ്റി', placeholder: 'പോലീസ് സ്റ്റേഷൻ / കമ്മിറ്റി' },
    ],
  },
];

export function convertGovFormToLetterData(form: GovFormTemplate): MalayalamLetterData {
  const todayMl = new Date().toLocaleDateString('ml-IN');
  const genericOffice = form.recipientOffice
    .replace(/,\s*തിരുവനന്തപുരം/g, '')
    .trim();

  return {
    documentHeading: form.titleMalayalam,
    formCode: form.formCode,
    portalName: form.portalName,
    portalUrl: form.portalUrl,
    senderName: '',
    senderAddress: '',
    senderPhone: '',
    recipientTitle: form.recipientTitle,
    recipientOffice: genericOffice,
    recipientPlace: 'കേരളം.',
    subject: form.subject,
    reference: '',
    salutation: 'സർ / മാഡം,',
    bodyParagraphs: [...form.bodyParagraphs],
    closingPhrase: 'വിശ്വസ്തതയോടെ,',
    place: '',
    date: todayMl,
    enclosures: [...form.enclosures],
    structuredFields: form.structuredFields.map((f) => {
      const sampleVal = (f.value || '').trim();
      return {
        ...f,
        // Never pre-fill a stranger's personal name, Aadhaar, Ration card, or income as the live value;
        // provide it as a clean placeholder hint so unedited fields remain empty until filled by the user.
        value: '',
        placeholder: sampleVal ? `ഉദാ: ${sampleVal}` : f.placeholder || 'ഇവിടെ പൂരിപ്പിക്കുക...',
      };
    }),
  };
}

/**
 * Normalizes mixed-script / Manglish / voice-to-text variations
 * (e.g., "എനിക്ക് വരുമാന സർട്ടിഫikat അപേക്ഷ വേണം", "varumana certificate", "jathi సర్ട്ടിഫിക്കറ്റ്")
 */
export function normalizeMixedGovQuery(raw: string): string {
  if (!raw) return '';
  let s = raw.normalize('NFC').toLowerCase().trim();
  // Replace mixed Malayalam+English voice-to-text artifacts like "സർട്ടിഫikat", "സർട്ടിഫicate", "സെർട്ടിഫിക്കറ്റ്"
  s = s
    .replace(/സർട്ടിഫ[a-z]+/gi, 'സർട്ടിഫിക്കറ്റ് certificate')
    .replace(/സെർട്ടിഫ[a-z\u0D00-\u0D7F]*/gi, 'സർട്ടിഫിക്കറ്റ് certificate')
    .replace(/സർട്ടിഫിക്കറ്റ്|സർട്ടിഫിക്കറ്|സർട്ടിഫികറ്റ്/g, 'സർട്ടിഫിക്കറ്റ് certificate')
    .replace(/\b(varumanam|varumana)\b/gi, 'വരുമാന income')
    .replace(/\b(jathi|jaathi|caste)\b/gi, 'ജാതി caste')
    .replace(/\b(nativity|residence|sthirathamasam)\b/gi, 'നേറ്റിവിറ്റി സ്ഥിരതാമസ nativity')
    .replace(/\b(pokkuvaravu|possession|kaivasavakasam)\b/gi, 'പോക്കുവരവ് കൈവശാവകാശ possession')
    .replace(/\b(anantharavakasam|legal\s*heir|heirship)\b/gi, 'അനന്തരാവകാശ ലീഗൽ ഹെയർ legal heir')
    .replace(/\b(ration\s*card|ration)\b/gi, 'റേഷൻ കാർഡ് ration')
    .replace(/\b(pension|vardhakya|vidhava)\b/gi, 'പെൻഷൻ വാർദ്ധക്യകാല വിധവാ pension')
    .replace(/\b(birth|janana)\b/gi, 'ജനന birth')
    .replace(/\b(death|marana)\b/gi, 'മരണ death')
    .replace(/\b(marriage|vivaha|vivaham)\b/gi, 'വിവാഹ marriage')
    .replace(/\b(kseb|electricity|current\s*bill|vaidyuthi)\b/gi, 'കെ.എസ്.ഇ.ബി വൈദ്യുതി kseb')
    .replace(/\b(kwa|water\s*authority|kudivellam)\b/gi, 'വാട്ടർ അതോറിറ്റി കുടിവെള്ള kwa')
    .replace(/\b(driving\s*licen[cs]e|learners|rto|mvd)\b/gi, 'ഡ്രൈവിംഗ് ലൈസൻസ് mvd rto')
    .replace(/\b(rajikkathu|raji|resign|resignation)\b/gi, 'രാജിക്കത്ത് രാജി resignation')
    .replace(/\b(apeksha|application)\b/gi, 'അപേക്ഷ application');
  return s;
}

/**
 * Multi-token & fuzzy search matcher for search bars so queries like
 * "വരുമാന സർട്ടിഫikat" or "എനിക്ക് വരുമാന സർട്ടിഫിക്കറ്റ് വേണം" match accurately.
 */
export function matchesGovFormSearch(form: GovFormTemplate, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  const normalizedQ = normalizeMixedGovQuery(rawQuery);
  const haystack = `${form.titleMalayalam} ${form.titleEnglish} ${form.subtitleMalayalam} ${form.formCode} ${form.searchKeywords} ${form.subject} ${form.recipientOffice}`
    .normalize('NFC')
    .toLowerCase();

  if (haystack.includes(rawQuery.toLowerCase().trim()) || haystack.includes(normalizedQ)) {
    return true;
  }

  // Strip common filler words so natural sentences like "എനിക്ക് വരുമാന സർട്ടിഫikat അപേക്ഷ വേണം" match core keywords
  const stopWords = new Set([
    'എനിക്ക്',
    'എന്റെ',
    'ഒരു',
    'വേണം',
    'വേണ്ടി',
    'തരുമോ',
    'തരിക',
    'ചെയ്യണം',
    'അപേക്ഷ',
    'ഫോം',
    'സർട്ടിഫിക്കറ്റ്',
    'സർട്ടിഫിക്കറ്റിനുള്ള',
    'ലഭിക്കുന്നതിന്',
    'ലഭിക്കാൻ',
    'കിട്ടാൻ',
    'application',
    'certificate',
    'form',
    'for',
    'need',
    'want',
    'please',
    'kerala',
  ]);

  const tokens = normalizedQ
    .split(/[\s,.;:!?/\\()[\]\-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !stopWords.has(t));

  if (tokens.length === 0) {
    // Only filler/generic words like "സർട്ടിഫിക്കറ്റ് അപേക്ഷ" were typed
    return (
      haystack.includes('സർട്ടിഫിക്കറ്റ്') ||
      haystack.includes('certificate') ||
      haystack.includes('അപേക്ഷ')
    );
  }

  return tokens.some((tok) => haystack.includes(tok));
}

export interface MatchedGovFormResult {
  form: GovFormTemplate;
  letterData: MalayalamLetterData;
  assistantReplyMalayalam: string;
  followUpQuestions: Array<{
    id: string;
    fieldLabelMalayalam: string;
    questionMalayalam: string;
    quickSuggestions: string[];
    defaultValue?: string;
    structuredFieldId?: string;
  }>;
  subFormPromptTitle?: string;
  subFormOptions?: SubFormOptionChoice[];
  isComplete: boolean;
}

export const POLICE_SUB_FORM_OPTIONS: SubFormOptionChoice[] = [
  {
    id: 'opt-police-general',
    badgeIcon: '🚨',
    titleMalayalam: '1. പൊതുവായ പോലീസ് പരാതി (മോഷണം / തർക്കം / ഭീഷണി / വഞ്ചന / മറ്റ് പരാതികൾ)',
    subtitleMalayalam: 'വ്യക്തിപരമായ തർക്കം, മോഷണം, സാമ്പത്തിക വഞ്ചന, അതിർത്തി തർക്കം തുടങ്ങി ഏത് വിഷയത്തിലുമുള്ള പരാതി',
    govFormId: 'police-general-complaint',
  },
  {
    id: 'opt-police-lost',
    badgeIcon: '🪪',
    titleMalayalam: '2. രേഖകൾ / സർട്ടിഫിക്കറ്റ് / പാസ്പോർട്ട് / RC ബുക്ക് നഷ്ടപ്പെട്ട പരാതി (Lost Document)',
    subtitleMalayalam: 'SSLC ബുക്ക്, ആധാർ, ലൈസൻസ്, RC ബുക്ക്, പാസ്പോർട്ട്, ആധാരം എന്നിവ നഷ്ടപ്പെട്ടാൽ ഡ്യൂപ്ലിക്കേറ്റ് എടുക്കാൻ',
    govFormId: 'police-lost-document-complaint',
  },
  {
    id: 'opt-police-cyber',
    badgeIcon: '📱',
    titleMalayalam: '3. സൈബർ പോലീസ് പരാതി — ഓൺലൈൻ പണം തട്ടിപ്പ് / വ്യാജ അക്കൗണ്ട് (Cyber Cell)',
    subtitleMalayalam: 'UPI തട്ടിപ്പ്, വ്യാജ ലിങ്ക് വഴി പണം നഷ്ടപ്പെടൽ, സോഷ്യൽ മീഡിയ ഭീഷണി എന്നിവയ്ക്ക്',
    govFormId: 'police-cyber-fraud-complaint',
  },
  {
    id: 'opt-police-accident',
    badgeIcon: '🚗',
    titleMalayalam: '4. വാഹന അപകടം — ജി.ഡി എൻട്രി (GD Entry) & ഇൻഷുറൻസ് അപേക്ഷ',
    subtitleMalayalam: 'വാഹന അപകടത്തിന് ശേഷം ഇൻഷുറൻസ് ക്ലെയിം ലഭിക്കുന്നതിനായി പോലീസ് GD എൻട്രിക്ക്',
    govFormId: 'police-accident-gd-entry',
  },
  {
    id: 'opt-police-permission',
    badgeIcon: '📢',
    titleMalayalam: '5. മൈക്ക് പെർമിഷൻ / പൊതുപരിപാടി അനുമതി / പോലീസ് ക്ലിയറൻസ് (PCC)',
    subtitleMalayalam: 'ഉത്സവം, സമ്മേളനം, മൈക്ക് അനുമതി, പോലീസ് ക്ലിയറൻസ് സർട്ടിഫിക്കറ്റ് എന്നിവയ്ക്ക്',
    govFormId: 'police-permission-pcc-noc',
  },
];

export const VILLAGE_SUB_FORM_OPTIONS: SubFormOptionChoice[] = [
  {
    id: 'opt-vil-income',
    badgeIcon: '📄',
    titleMalayalam: '1. വരുമാന സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Income Certificate)',
    govFormId: 'edistrict-income',
  },
  {
    id: 'opt-vil-caste',
    badgeIcon: '📄',
    titleMalayalam: '2. ജാതി സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Caste Certificate)',
    govFormId: 'edistrict-caste',
  },
  {
    id: 'opt-vil-nativity',
    badgeIcon: '📄',
    titleMalayalam: '3. നേറ്റിവിറ്റി / സ്ഥിരതാമസ സർട്ടിഫിക്കറ്റ് (Nativity)',
    govFormId: 'edistrict-nativity',
  },
  {
    id: 'opt-vil-possession',
    badgeIcon: '🏡',
    titleMalayalam: '4. കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് / പോക്കുവരവ് / ലൊക്കേഷൻ സ്കെച്ച്',
    govFormId: 'edistrict-possession-location',
  },
  {
    id: 'opt-vil-ncl',
    badgeIcon: '📄',
    titleMalayalam: '5. നോൺ-ക്രീമിലെയർ സർട്ടിഫിക്കറ്റ് (Non-Creamy Layer)',
    govFormId: 'edistrict-ncl',
  },
  {
    id: 'opt-vil-heir',
    badgeIcon: '👨‍👩‍👧‍👦',
    titleMalayalam: '6. അനന്തരാവകാശ / ഫാമിലി മെമ്പർഷിപ്പ് സർട്ടിഫിക്കറ്റ് (Legal Heirship)',
    govFormId: 'edistrict-legal-heir',
  },
  {
    id: 'opt-vil-onesame',
    badgeIcon: '📄',
    titleMalayalam: '7. വൺ & ദി സെയിം / ലൈഫ് സർട്ടിഫിക്കറ്റ് (One and the Same)',
    govFormId: 'edistrict-one-and-same-life',
  },
  {
    id: 'opt-vil-form6',
    badgeIcon: '🌾',
    titleMalayalam: '8. ഭൂമി തരം മാറ്റൽ അപേക്ഷ (Form 5 / Form 6 — RDO)',
    govFormId: 'edistrict-land-conversion-form6',
  },
];

export const PANCHAYAT_SUB_FORM_OPTIONS: SubFormOptionChoice[] = [
  {
    id: 'opt-pan-birth',
    badgeIcon: '👶',
    titleMalayalam: '1. ജനന / മരണ സർട്ടിഫിക്കറ്റ് രജിസ്ട്രേഷനും പേര് തിരുത്തലും',
    govFormId: 'lsgd-birth-death-correction',
  },
  {
    id: 'opt-pan-marriage',
    badgeIcon: '💍',
    titleMalayalam: '2. വിവാഹ രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോം (Form No. 1)',
    govFormId: 'lsgd-marriage-reg-form1',
  },
  {
    id: 'opt-pan-building',
    badgeIcon: '🏠',
    titleMalayalam: '3. കെട്ടിട നികുതി ഉടമസ്ഥാവകാശ മാറ്റം & വീട്ടുനമ്പർ അപേക്ഷ',
    govFormId: 'lsgd-building-ownership-permit',
  },
  {
    id: 'opt-pan-trade',
    badgeIcon: '🏪',
    titleMalayalam: '4. വ്യാപാര ലൈസൻസ് (Trade License) & തൊഴിലുറപ്പ് അപേക്ഷ',
    govFormId: 'lsgd-trade-license-nregs',
  },
  {
    id: 'opt-pan-pension',
    badgeIcon: '👵',
    titleMalayalam: '5. വാർദ്ധക്യകാല / വിധവാ / ഭിന്നശേഷി ക്ഷേമ പെൻഷൻ അപേക്ഷ',
    govFormId: 'pension-oldage-widow-disability',
  },
  {
    id: 'opt-pan-tree',
    badgeIcon: '🌳',
    titleMalayalam: '6. അപകടാവസ്ഥയിലായ മരം (പ്ലാവ് / തെങ്ങ്) മുറിച്ചു മാറ്റാനുള്ള അപേക്ഷ',
    govFormId: 'lsgd-tree-cutting-application',
  },
];

export const MADRASA_SUB_FORM_OPTIONS: SubFormOptionChoice[] = [
  {
    id: 'opt-mad-tc',
    badgeIcon: '🕌',
    titleMalayalam: '1. മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് (മദ്രസ TC) & അപേക്ഷാ ഫോം',
    subtitleMalayalam: 'മറ്റൊരു മദ്രസയിലേക്ക് മാറുന്നതിനോ പൊതുപരീക്ഷാ രജിസ്ട്രേഷനോ വേണ്ടിയുള്ള മദ്രസ TC',
    govFormId: 'madrasa-tc-certificate',
  },
  {
    id: 'opt-mad-adm',
    badgeIcon: '📖',
    titleMalayalam: '2. മദ്രസ പുതിയ വിദ്യാർത്ഥി പ്രവേശന (Admission) അപേക്ഷാ ഫോം',
    subtitleMalayalam: 'ഒന്നാം ക്ലാസിലേക്കോ മറ്റ് ക്ലാസുകളിലേക്കോ പുതിയ കുട്ടികളെ ചേർക്കുന്നതിനുള്ള ഫോം',
    govFormId: 'madrasa-admission-form',
  },
  {
    id: 'opt-mad-usthad',
    badgeIcon: '👳‍♂️',
    titleMalayalam: '3. മദ്രസ ഉസ്താദ് / മുഅല്ലിം അവധി അപേക്ഷ & കമ്മിറ്റി അപേക്ഷ',
    subtitleMalayalam: 'ഉസ്താദുമാർക്ക് അവധി അപേക്ഷയും മറ്റ് അപേക്ഷകളും മദ്രസ കമ്മിറ്റിക്ക് നൽകാൻ',
    govFormId: 'madrasa-usthad-leave-application',
  },
  {
    id: 'opt-mad-pta',
    badgeIcon: '📢',
    titleMalayalam: '4. മദ്രസ രക്ഷാകർത്തൃ യോഗം (PTA) / പരീക്ഷാ നോട്ടീസ്',
    subtitleMalayalam: 'രക്ഷിതാക്കളെ യോഗത്തിലേക്ക് ക്ഷണിച്ചുകൊണ്ടുള്ള മദ്രസ നോട്ടീസ് മാതൃക',
    govFormId: 'madrasa-pta-meeting-notice',
  },
  {
    id: 'opt-mad-complaint',
    badgeIcon: '⚖️',
    titleMalayalam: '5. മദ്രസയിൽ ഉസ്താദ് കുട്ടിയെ പീഡിപ്പിച്ചതിൽ / ഉപദ്രവിച്ചതിൽ പരാതി',
    subtitleMalayalam: 'കുട്ടികൾക്ക് നേരെയുള്ള ശാരീരിക-മാനസിക പീഡനത്തിനെതിരെ മദ്രസ കമ്മിറ്റി / പോലീസ് / ചൈൽഡ് ലൈനിൽ നൽകാനുള്ള പരാതി',
    govFormId: 'madrasa-student-abuse-complaint',
  },
];

/**
 * Extracts user-supplied details from a prompt (either free-form or follow-up answers)
 * and applies them to both `letterData` and `structuredFields`.
 */
function applyExtractedDetailsToGovLetter(
  rawPrompt: string,
  letter: MalayalamLetterData
): { updated: MalayalamLetterData; extractedAny: boolean } {
  const prompt = normalizeSpokenMalayalamTranscript(rawPrompt);
  const next: MalayalamLetterData = {
    ...letter,
    bodyParagraphs: [...(letter.bodyParagraphs || [])],
    enclosures: [...(letter.enclosures || [])],
    structuredFields: (letter.structuredFields || []).map((f) => ({ ...f })),
  };
  let extractedAny = false;

  const lines = prompt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Check structured key: value lines from followUpQuestions submission
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const keyLabel = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (!val) continue;

      if (
        keyLabel.includes('പേര്') ||
        keyLabel.includes('വിലാസ') ||
        keyLabel.includes('അപേക്ഷക') ||
        keyLabel.includes('വിദ്യാർത്ഥി') ||
        keyLabel.includes('ജീവനക്കാര')
      ) {
        const parts = val.split(/[,،]/).map((p) => p.trim()).filter(Boolean);
        if (parts[0]) {
          next.senderName = parts[0];
          if (next.structuredFields && next.structuredFields.length > 0) {
            next.structuredFields[0].value = parts[0];
          }
          extractedAny = true;
        }
        if (parts.length > 1) {
          next.senderAddress = parts.slice(1).join(', ');
          next.place = parts[parts.length - 1];
          extractedAny = true;
        }
      } else if (
        keyLabel.includes('വില്ലേജ്') ||
        keyLabel.includes('ഓഫീസ്') ||
        keyLabel.includes('പഞ്ചായത്ത്') ||
        keyLabel.includes('സ്ഥാപന') ||
        keyLabel.includes('സ്കൂൾ') ||
        keyLabel.includes('ബാങ്ക്') ||
        keyLabel.includes('സ്റ്റേഷൻ')
      ) {
        next.recipientOffice = val.endsWith(',') ? val : `${val},`;
        const placeGuess = val
          .replace(/വില്ലേജ് ഓഫീസ്|ഗ്രാമപഞ്ചായത്ത്|മുൻസിപ്പാലിറ്റി|താലൂക്ക് ഓഫീസ്|പോലീസ് സ്റ്റേഷൻ/g, '')
          .replace(/[,]/g, '')
          .trim();
        if (placeGuess) {
          next.recipientPlace = `${placeGuess}.`;
          next.place = placeGuess;
        }
        extractedAny = true;
      } else if (keyLabel.includes('വരുമാന') || keyLabel.includes('തുക')) {
        const incField = next.structuredFields?.find(
          (f) => f.id.toLowerCase().includes('income') || f.label.includes('വരുമാന') || f.label.includes('തുക')
        );
        if (incField) {
          incField.value = val;
          extractedAny = true;
        }
      } else if (keyLabel.includes('ആവശ്യം') || keyLabel.includes('കാരണം') || keyLabel.includes('സേവനം')) {
        const purpField = next.structuredFields?.find(
          (f) =>
            f.id.toLowerCase().includes('purpose') ||
            f.id.toLowerCase().includes('reason') ||
            f.id.toLowerCase().includes('service') ||
            f.label.includes('ആവശ്യം') ||
            f.label.includes('കാരണം')
        );
        if (purpField) {
          purpField.value = val;
          extractedAny = true;
        }
      } else if (keyLabel.includes('ആധാർ') || keyLabel.includes('റേഷൻ')) {
        const idField = next.structuredFields?.find(
          (f) => f.label.includes('ആധാർ') || f.label.includes('റേഷൻ')
        );
        if (idField) {
          idField.value = val;
          extractedAny = true;
        }
      } else {
        const matchedFld = next.structuredFields?.find(
          (f) => f.label.includes(keyLabel) || keyLabel.includes(f.label.slice(0, 8))
        );
        if (matchedFld) {
          matchedFld.value = val;
          extractedAny = true;
        }
      }
    }
  }

  // 2. Extract inline natural-language mentions (Name, Place/District, Phone, Survey No, Consumer No, Passport No, Income)
  const nameMatch = prompt.match(
    /(?:എന്റെ പേര്|അപേക്ഷകന്റെ പേര്|ഞാൻ|പേര്)\s*[:\-]?\s*([^\n,.;]+?)(?=\s*(?:,|،|ആണ്|എന്നാണ്|സ്ഥലം|സ്വദേശം|വീട്|ഫോൺ|വയസ്സ്|\.|$))/i
  );
  if (nameMatch?.[1]?.trim()) {
    const cleanName = nameMatch[1]
      .trim()
      .replace(/\s*(ആണ്|എന്നാണ്|വീട്|സ്ഥലം|സ്വദേശം).*$/, '')
      .trim();
    if (cleanName && cleanName.length >= 2 && cleanName.length <= 45 && !cleanName.includes('അപേക്ഷ')) {
      next.senderName = cleanName;
      if (next.structuredFields && next.structuredFields.length > 0) {
        const nameFld =
          next.structuredFields.find(
            (f) =>
              f.id.toLowerCase().includes('name') ||
              f.label.includes('പേര്')
          ) || next.structuredFields[0];
        nameFld.value = cleanName;
      }
      extractedAny = true;
    }
  }

  // Extract place / hometown (e.g. "മഞ്ചേരിയിലാണ് വീട്", "ഒറ്റപ്പാലം പാലക്കാട്", "തിരൂർ മലപ്പുറം സ്വദേശിയാണ്")
  let extractedLoc = extractKeralaPlaceAndDistrict(prompt);
  if (!extractedLoc.found) {
    const houseInPlaceMatch = prompt.match(/([^\s,.;:()]+?)(?:യിലാണ്|ത്തിലാണ്|ലാണ്|യിലാണ്)\s*(?:വീട്|താമസം|സ്ഥലം)/);
    if (houseInPlaceMatch?.[1]) {
      const cleanedPlaceToken = houseInPlaceMatch[1].trim();
      const retryLoc = extractKeralaPlaceAndDistrict(cleanedPlaceToken);
      extractedLoc = retryLoc.found
        ? retryLoc
        : { place: cleanedPlaceToken, district: cleanedPlaceToken, found: true };
    }
  }
  if (extractedLoc.found) {
    const townName = extractedLoc.place;
    const distName = extractedLoc.district;
    next.place = townName;
    next.senderAddress =
      townName !== distName
        ? `${townName}, ${distName} ജില്ല, കേരളം`
        : `${townName}, കേരളം`;
    if (next.structuredFields) {
      const addrFld = next.structuredFields.find(
        (f) =>
          f.id.toLowerCase().includes('address') ||
          f.label.includes('വിലാസ') ||
          f.label.includes('മേൽവിലാസ') ||
          f.label.includes('സ്ഥല')
      );
      if (addrFld) {
        addrFld.value = next.senderAddress;
      }
      const villFld = next.structuredFields.find(
        (f) =>
          f.id.toLowerCase().includes('village') ||
          f.label.includes('വില്ലേജ്')
      );
      if (villFld) {
        villFld.value =
          townName !== distName
            ? `${townName} വില്ലേജ്, ${distName}`
            : `${townName} വില്ലേജ്`;
      }
    }
    if (next.recipientOffice.includes('വില്ലേജ് ഓഫീസ്')) {
      next.recipientOffice = `${townName} വില്ലേജ് ഓഫീസ്,`;
      next.recipientPlace = `${distName}.`;
    } else if (next.recipientOffice.includes('ഗ്രാമപഞ്ചായത്ത്') || next.recipientOffice.includes('മുൻസിപ്പാലിറ്റി')) {
      next.recipientOffice = `${townName} ഗ്രാമപഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി കാര്യാലയം,`;
      next.recipientPlace = townName !== distName ? `${townName}, ${distName}.` : `${townName}.`;
    } else if (next.recipientOffice.includes('കെ.എസ്.ഇ.ബി') || next.recipientOffice.includes('KSEB')) {
      next.recipientOffice = `കെ.എസ്.ഇ.ബി (KSEB) ഇലക്ട്രിക്കൽ സെക്ഷൻ ഓഫീസ്, ${townName},`;
      next.recipientPlace = `${distName}.`;
    } else if (next.recipientOffice.includes('പോലീസ് സ്റ്റേഷൻ')) {
      next.recipientOffice = `${townName} പോലീസ് സ്റ്റേഷൻ,`;
      next.recipientPlace = `${distName}.`;
    } else {
      next.recipientPlace = townName !== distName ? `${townName}, ${distName}.` : `${townName}.`;
    }
    extractedAny = true;
  }

  // Extract specific tree name for tree-cutting petitions (e.g. പ്ലാവ്, തെങ്ങ്, മാവ്, ആഞ്ഞിലി, മരം)
  const treeTypeMatch = prompt.match(/(പ്ലാവ്|തെങ്ങ്|മാവ്|ആഞ്ഞിലി|തേക്ക്|മഹാഗണി|പുളിമരം|ആൽമരം|മരം)/);
  if (treeTypeMatch?.[1] && (prompt.includes('മുറിക്ക') || prompt.includes('വെട്ട') || next.documentHeading.includes('മരം'))) {
    const treeWord = treeTypeMatch[1];
    const specificLabel = treeWord === 'മരം' ? 'മരം' : `${treeWord} മരം`;
    next.subject = `അപകടാവസ്ഥയിലായ ${specificLabel} മുറിച്ചു മാറ്റുന്നതിന് അടിയന്തര നടപടി സ്വീകരിക്കണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള അപേക്ഷ.`;
    next.bodyParagraphs = [
      `മേൽവിലാസത്തിൽ സ്ഥിരതാമസക്കാരനായ ഞാൻ ബഹുമാനപ്പെട്ട സെക്രട്ടറിയുടെ അടിയന്തര ശ്രദ്ധയിലേക്കായി സമർപ്പിക്കുന്ന അപേക്ഷ. എന്റെ വീടിനോട് ചേർന്നുള്ള പുരയിടത്തിൽ / അതിർത്തിയിൽ നിൽക്കുന്ന വലിയ ${specificLabel} കാറ്റിലും മഴയിലും ചരിഞ്ഞ് വീടിന് മുകളിലേക്ക് വീഴാറായ അതീവ അപകടാവസ്ഥയിലാണ് നിൽക്കുന്നത്.`,
      `ശക്തമായ കാറ്റോ മഴയോ ഉണ്ടായാൽ പ്രസ്തുത ${specificLabel} കടപുഴകി വീണ് എന്റെ വീടിനും കുടുംബാംഗങ്ങളുടെ ജീവനും സ്വത്തിനും വലിയ അപകടം സംഭവിക്കാൻ സാധ്യതയുണ്ട്. ആയതിനാൽ അടിയന്തരമായി സ്ഥലം പരിശോധിച്ച് അപകടാവസ്ഥയിലുള്ള പ്രസ്തുത ${specificLabel} മുറിച്ചു മാറ്റുന്നതിന് ആവശ്യമായ ഉത്തരവ് നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.`,
    ];
    const treeFld = next.structuredFields?.find((f) => f.id === 'treeDetails' || f.label.includes('മര'));
    if (treeFld) {
      treeFld.value = `വീടിന് ഭീഷണിയായി അപകടാവസ്ഥയിൽ നിൽക്കുന്ന ${specificLabel}`;
    }
    extractedAny = true;
  }

  // Extract phone number (supports Indian +91 / 10-digit and Gulf +971 / +966 / +974 / +968 / +965 / +973 numbers)
  const intlPhoneMatch = prompt.match(
    /(\+\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}|\b(?:\+?91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}\b)/
  );
  if (intlPhoneMatch?.[1]) {
    next.senderPhone = intlPhoneMatch[1].trim();
    extractedAny = true;
  }

  // Extract Survey Number (e.g. "124/3B", "219/7C") and keep in pure English
  const surveyMatch = prompt.match(/(?:സർവ്വേ നമ്പർ|റീ-സർവ്വേ നമ്പർ|survey\s*(?:no|number)?)\s*[:\-]?\s*([0-9]+\/[0-9]+[A-Za-z]?)/i);
  if (surveyMatch?.[1]) {
    const sVal = surveyMatch[1].trim();
    const sFld = next.structuredFields?.find(
      (f) => f.id.toLowerCase().includes('survey') || f.label.includes('സർവ്വേ')
    );
    if (sFld) {
      sFld.value = `സർവ്വേ നമ്പർ ${sVal}`;
    } else if (next.structuredFields) {
      next.structuredFields.push({
        id: 'surveyNo',
        label: 'സർവ്വേ നമ്പർ (Survey No.)',
        value: `സർവ്വേ നമ്പർ ${sVal}`,
        placeholder: 'ഉദാ: 124/3B',
      });
    }
    if (next.bodyParagraphs && next.bodyParagraphs.length > 0 && !next.bodyParagraphs.join(' ').includes(sVal)) {
      next.bodyParagraphs[0] = `${next.bodyParagraphs[0]} (സർവ്വേ നമ്പർ: ${sVal})`;
    }
    extractedAny = true;
  }

  // Extract KSEB Consumer Number
  const consumerMatch = prompt.match(/(?:കൺസ്യൂമർ നമ്പർ|consumer\s*(?:no|number)?)\s*[:\-]?\s*(\d{6,14})/i);
  if (consumerMatch?.[1]) {
    const cVal = consumerMatch[1].trim();
    const cFld = next.structuredFields?.find(
      (f) => f.id.toLowerCase().includes('consumer') || f.label.includes('കൺസ്യൂമർ')
    );
    if (cFld) {
      cFld.value = cVal;
    }
    extractedAny = true;
  }

  // Extract Passport Number (e.g. J1234567)
  const passportMatch = prompt.match(/(?:പാസ്പോർട്ട് നമ്പർ|passport\s*(?:no|number)?)\s*[:\-]?\s*([A-Z]\d{7})/i);
  if (passportMatch?.[1]) {
    const pVal = passportMatch[1].toUpperCase();
    const lostFld = next.structuredFields?.find(
      (f) => f.id.toLowerCase().includes('lost') || f.label.includes('നഷ്ടപ്പെട്ട')
    );
    if (lostFld) {
      lostFld.value = `ഇന്ത്യൻ പാസ്പോർട്ട് (നമ്പർ: ${pVal})`;
    }
    extractedAny = true;
  }

  const allIncomeMatches = [
    ...prompt.matchAll(/(?:വാർഷിക വരുമാനം|വരുമാനം|income)\s*[:\-]?\s*(₹?\s*[\d,]+)/gi),
  ];
  if (allIncomeMatches.length > 0) {
    const lastInc = allIncomeMatches[allIncomeMatches.length - 1][1];
    const incField = next.structuredFields?.find(
      (f) => f.id.toLowerCase().includes('income') || f.label.includes('വരുമാന')
    );
    if (incField && lastInc) {
      const rawNum = lastInc.replace(/[^\d,]/g, '');
      incField.value = `₹${rawNum}/-`;
      extractedAny = true;
    }
  }

  if (prompt.includes('സ്കോളർഷിപ്പ') || /scholarship/i.test(prompt)) {
    const purpField = next.structuredFields?.find(
      (f) => f.id.toLowerCase().includes('purpose') || f.label.includes('ആവശ്യം')
    );
    if (purpField) {
      purpField.value = prompt.includes('മകന്റെ')
        ? 'മകന്റെ വിദ്യാഭ്യാസ സ്കോളർഷിപ്പ് ആവശ്യത്തിലേക്ക്'
        : prompt.includes('മകളുടെ')
        ? 'മകളുടെ വിദ്യാഭ്യാസ സ്കോളർഷിപ്പ് ആവശ്യത്തിലേക്ക്'
        : 'വിദ്യാഭ്യാസ സ്കോളർഷിപ്പ് ആവശ്യത്തിലേക്ക്';
      extractedAny = true;
    }
  }

  const villageMatch = prompt.match(/([^\s,.:()]+)\s*(?:വില്ലേജ്|village)/i);
  if (villageMatch?.[1] && !['ബഹുമാനപ്പെട്ട', 'ഏത്', 'നിങ്ങളുടെ'].includes(villageMatch[1])) {
    const vName = villageMatch[1].trim();
    next.recipientOffice = `${vName} വില്ലേജ് ഓഫീസ്,`;
    next.recipientPlace = `${vName}.`;
    next.place = vName;
    extractedAny = true;
  }

  // 3. If the user is replying to an open Gov Form with a short direct answer without ':'
  const isNewDocCommand =
    prompt.includes('വേണം') ||
    prompt.includes('അപേക്ഷ') ||
    prompt.includes('സർട്ടിഫിക്കറ്റ്') ||
    /\b(certificate|application|form|need|want|cv|resume)\b/i.test(prompt);

  if (!extractedAny && !isNewDocCommand && lines.length === 1 && !prompt.includes(':') && prompt.length <= 50) {
    const parts = prompt.split(/[,،]/).map((p) => p.trim()).filter(Boolean);
    if (parts[0]) {
      next.senderName = parts[0];
      if (next.structuredFields && next.structuredFields.length > 0) {
        next.structuredFields[0].value = parts[0];
      }
      if (parts.length > 1) {
        next.senderAddress = parts.slice(1).join(', ');
        next.place = parts[parts.length - 1];
      }
      extractedAny = true;
    }
  }

  return { updated: next, extractedAny };
}

function buildFollowUpsForGovForm(form: GovFormTemplate, currentLetter?: MalayalamLetterData) {
  const letter = currentLetter || convertGovFormToLetterData(form);
  return buildEditableQuestionsForLetter(letter);
}

/**
 * Matches a user voice/chat prompt to any of the official Kerala Government / Akshaya forms
 * (or updates the currently open Gov Form when the user replies with their details).
 */
export function matchGovFormFromPrompt(
  rawPrompt: string,
  currentLetter?: MalayalamLetterData | null
): MatchedGovFormResult | null {
  if (!rawPrompt || !rawPrompt.trim()) return null;
  const prompt = normalizeSpokenMalayalamTranscript(rawPrompt).normalize('NFC').trim();
  const norm = normalizeMixedGovQuery(prompt);

  // Do not intercept multi-line CVs, rental agreements, or explicit requests for English letters
  if (
    /\b(curriculum vitae|work history|professional summary)\b/i.test(prompt) ||
    /ഇംഗ്ലീഷിൽ|ഇംഗ്ലീഷിലുള്ള|ഇംഗ്ലീഷ്\s*(?:ഭാഷയിൽ|കത്ത്|അപേക്ഷ|ലെറ്റർ)|in\s+english|english\s+(?:only|language|letter|application)|gulf\s+cv|ഗൾഫ്\s*സിവി/i.test(prompt) ||
    prompt.includes('വാടക കരാർ') ||
    prompt.includes('മുദ്രപ്പത്രം') ||
    prompt.includes('മാർക്ക് ലിസ്റ്റ്')
  ) {
    return null;
  }

  // Rule 1: Explicit keyword mapping to the exact GovFormTemplate ID
  let matchedFormId: string | null = null;

  if (
    norm.includes('വരുമാന') ||
    /\bincome\s*(certificate|cert|apeksha|application)?\b/i.test(norm) ||
    norm.includes('varumana')
  ) {
    matchedFormId = 'edistrict-income';
  } else if (
    norm.includes('നോൺ ക്രീമിലെയർ') ||
    norm.includes('നോൺ-ക്രീമിലെയർ') ||
    norm.includes('ക്രീമിലെയർ') ||
    /\b(non[\s\-]*creamy\s*layer|ncl)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-ncl';
  } else if (
    norm.includes('ജാതി') ||
    norm.includes('കമ്യൂണിറ്റി') ||
    /\b(caste|community)\s*(certificate|cert|apeksha|application)?\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-caste';
  } else if (
    norm.includes('നേറ്റിവിറ്റി') ||
    norm.includes('സ്ഥിരതാമസ') ||
    norm.includes('റസിഡൻസ്') ||
    norm.includes('റെസിഡൻസ്') ||
    /\b(nativity|residence|domicile)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-nativity';
  } else if (
    norm.includes('അനന്തരാവകാശ') ||
    norm.includes('ലീഗൽ ഹെയർ') ||
    norm.includes('ഫാമിലി മെമ്പർഷിപ്പ്') ||
    /\b(legal\s*heir|heirship|family\s*membership)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-legal-heir';
  } else if (
    norm.includes('കൈവശാവകാശ') ||
    norm.includes('പോസഷൻ') ||
    norm.includes('ലൊക്കേഷൻ സ്കെച്ച്') ||
    norm.includes('പോക്കുവരവ്') ||
    /\b(possession|location\s*sketch|pokkuvaravu|mutation)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-possession-location';
  } else if (
    norm.includes('വൺ ആൻഡ് ദി സെയിം') ||
    norm.includes('വൺ & ദി സെയിം') ||
    norm.includes('ലൈഫ് സർട്ടിഫിക്കറ്റ്') ||
    norm.includes('റിലേഷൻഷിപ്പ്') ||
    /\b(one\s*and\s*the\s*same|life\s*certificate|relationship\s*certificate)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-one-and-same-life';
  } else if (
    norm.includes('ഭൂമി തരം മാറ്റ') ||
    norm.includes('ഡാറ്റാ ബാങ്ക്') ||
    norm.includes('ഫോം 6') ||
    norm.includes('ഫോം 5') ||
    /\b(form\s*[56]|data\s*bank|land\s*conversion)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-land-conversion-form6';
  } else if (
    norm.includes('ഇ.ഡബ്ല്യു.എസ്') ||
    norm.includes('ഇഡബ്ല്യുഎസ്') ||
    norm.includes('സോൾവൻസി') ||
    norm.includes('വാല്യുവേഷൻ') ||
    norm.includes('മതിപ്പുവില') ||
    /\b(ews|solvency|valuation)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-ews-solvency-valuation';
  } else if (
    norm.includes('ജനന') ||
    norm.includes('മരണ') ||
    /\b(birth\s*certificate|death\s*certificate)\b/i.test(norm)
  ) {
    matchedFormId = 'lsgd-birth-death-correction';
  } else if (
    (norm.includes('വിവാഹ') && (norm.includes('രജിസ്ട്രേഷൻ') || norm.includes('സർട്ടിഫിക്കറ്റ്') || norm.includes('ഫോം') || norm.includes('അപേക്ഷ'))) ||
    /\b(marriage\s*registration|marriage\s*certificate)\b/i.test(norm)
  ) {
    matchedFormId = 'lsgd-marriage-reg-form1';
  } else if (
    norm.includes('കെട്ടിട നികുതി') ||
    (norm.includes('കെട്ടിട') && (norm.includes('ഉടമസ്ഥാവകാശ') || norm.includes('നമ്പർ') || norm.includes('പെർമിറ്റ്'))) ||
    /\b(building\s*tax|building\s*ownership|building\s*permit)\b/i.test(norm)
  ) {
    matchedFormId = 'lsgd-building-ownership-permit';
  } else if (
    norm.includes('വ്യാപാര ലൈസൻസ്') ||
    norm.includes('ട്രേഡ് ലൈസൻസ്') ||
    norm.includes('തൊഴിലുറപ്പ്') ||
    /\b(trade\s*licen[cs]e|d&o|nregs|job\s*card)\b/i.test(norm)
  ) {
    matchedFormId = 'lsgd-trade-license-nregs';
  } else if (
    ((norm.includes('മരം') || norm.includes('പ്ലാവ്') || norm.includes('തെങ്ങ്') || norm.includes('മാവ്') || norm.includes('ആഞ്ഞിലി')) &&
      (norm.includes('മുറിക്ക') || norm.includes('വെട്ട') || norm.includes('അപകട'))) ||
    /\b(tree\s*cutting|dangerous\s*tree|cut\s*tree)\b/i.test(norm)
  ) {
    matchedFormId = 'lsgd-tree-cutting-application';
  } else if (
    norm.includes('ദുരിതാശ്വാസ') ||
    norm.includes('ചികിത്സാ സഹായ') ||
    norm.includes('ചികിത്സാ ധനസഹായ') ||
    /\b(cmdrf|distress\s*relief)\b/i.test(norm)
  ) {
    matchedFormId = 'welfare-cmdrf-scst';
  } else if (
    norm.includes('വാർദ്ധക്യകാല') ||
    norm.includes('വിധവാ') ||
    norm.includes('ഭിന്നശേഷി') ||
    norm.includes('ക്ഷേമ പെൻഷൻ') ||
    norm.includes('പെൻഷൻ അപേക്ഷ') ||
    (norm.includes('പെൻഷൻ') && !norm.includes('ജി.പി.എഫ്'))
  ) {
    matchedFormId = 'pension-oldage-widow-disability';
  } else if (
    norm.includes('റേഷൻ കാർഡ്') ||
    norm.includes('സപ്ലൈ ഓഫീസ്') ||
    /\b(ration\s*card|civil\s*supplies)\b/i.test(norm)
  ) {
    matchedFormId = 'ration-new-addition-transfer-phh';
  } else if (
    norm.includes('ഡ്രൈവിംഗ് ലൈസൻസ്') ||
    norm.includes('ലേണേഴ്സ് ലൈസൻസ്') ||
    /\b(driving\s*licen[cs]e|learners\s*licen[cs]e|form\s*2)\b/i.test(norm)
  ) {
    matchedFormId = 'mvd-license-form2';
  } else if (
    norm.includes('വാഹന ഉടമസ്ഥാവകാശ') ||
    norm.includes('ആർ.സി ബുക്ക്') ||
    norm.includes('ആർസി ബുക്ക്') ||
    /\b(form\s*29|form\s*30|form\s*28|form\s*38|vehicle\s*transfer)\b/i.test(norm)
  ) {
    matchedFormId = 'mvd-ownership-form29-30-28-38';
  } else if (
    norm.includes('കെ.എസ്.ഇ.ബി') ||
    norm.includes('കെഎസ്ഇബി') ||
    norm.includes('വൈദ്യുതി') ||
    norm.includes('കറന്റ് ബിൽ') ||
    /\b(kseb|electricity)\b/i.test(norm)
  ) {
    matchedFormId = 'kseb-ownership-meter-tariff';
  } else if (
    norm.includes('വാട്ടർ അതോറിറ്റി') ||
    norm.includes('കുടിവെള്ള') ||
    /\b(kwa|water\s*authority|water\s*connection)\b/i.test(norm)
  ) {
    matchedFormId = 'kwa-water-connection-complaint';
  } else if (
    norm.includes('സൈബർ') ||
    norm.includes('ഓൺലൈൻ തട്ടിപ്പ്') ||
    /\b(cyber\s*crime|cyber\s*police|online\s*fraud|upi\s*scam)\b/i.test(norm)
  ) {
    matchedFormId = 'police-cyber-fraud-complaint';
  } else if (
    (norm.includes('വാഹന') && norm.includes('അപകട')) ||
    norm.includes('ജി.ഡി') ||
    norm.includes('ജിഡി എൻട്രി') ||
    /\b(gd\s*entry|accident\s*complaint|motor\s*accident)\b/i.test(norm)
  ) {
    matchedFormId = 'police-accident-gd-entry';
  } else if (
    norm.includes('മൈക്ക്') ||
    norm.includes('ഉച്ചഭാഷിണി') ||
    norm.includes('പോലീസ് ക്ലിയറൻസ്') ||
    /\b(mike\s*permission|loudspeaker|police\s*clearance|\bpcc\b)\b/i.test(norm)
  ) {
    matchedFormId = 'police-permission-pcc-noc';
  } else if (
    norm.includes('നഷ്ടപ്പെട്ട') ||
    norm.includes('കളഞ്ഞുപോയി') ||
    norm.includes('പാസ്പോർട്ട് നഷ്ട') ||
    /\b(lost\s*passport|lost\s*document|lost\s*certificate|lost\s*rc|lost\s*license)\b/i.test(norm)
  ) {
    matchedFormId = 'police-lost-document-complaint';
  } else if (
    norm.includes('മദ്രസ') ||
    norm.includes('ഉസ്താദ്') ||
    norm.includes('മുഅല്ലിം') ||
    norm.includes('സദർ') ||
    /\b(madrasa|madrassa|usthad|muallim)\b/i.test(norm)
  ) {
    if (
      norm.includes('പീഡ') ||
      norm.includes('ഉപദ്രവ') ||
      norm.includes('മർദ്ദ') ||
      norm.includes('തല്ലി') ||
      norm.includes('പരാതി') ||
      norm.includes('പോലീസ്') ||
      norm.includes('ചൈൽഡ്') ||
      /\b(abuse|harass|assault|beaten|complaint|pocso|childline)\b/i.test(norm)
    ) {
      matchedFormId = 'madrasa-student-abuse-complaint';
    } else if (norm.includes('ടിസി') || norm.includes('ടി.സി') || norm.includes('വിടുതൽ') || /\btc\b/i.test(norm)) {
      matchedFormId = 'madrasa-tc-certificate';
    } else if (norm.includes('അഡ്മിഷൻ') || norm.includes('പ്രവേശന') || /\badmission\b/i.test(norm)) {
      matchedFormId = 'madrasa-admission-form';
    } else if (norm.includes('നോട്ടീസ്') || norm.includes('യോഗം') || /\b(pta|notice|meeting)\b/i.test(norm)) {
      matchedFormId = 'madrasa-pta-meeting-notice';
    } else if (norm.includes('ഉസ്താദ്') || norm.includes('മുഅല്ലിം') || norm.includes('അവധി') || /\b(leave|usthad|muallim)\b/i.test(norm)) {
      matchedFormId = 'madrasa-usthad-leave-application';
    } else {
      matchedFormId = 'madrasa-tc-certificate';
    }
  } else if (
    norm.includes('പോലീസ്') ||
    norm.includes('പരാതി കൊടുക്ക') ||
    norm.includes('പരാതി നൽക') ||
    /\b(police|police\s*station|police\s*complaint|petition)\b/i.test(norm)
  ) {
    // Default to General Police Station Complaint (NOT Lost Passport!) and present all 5 Police complaint options!
    matchedFormId = 'police-general-complaint';
  } else if (
    norm.includes('ബാങ്ക്') ||
    norm.includes('ലോൺ') ||
    norm.includes('അക്കൗണ്ട്') ||
    norm.includes('യുപിഐ') ||
    /\b(bank\s*manager|bank\s*account|education\s*loan|upi)\b/i.test(norm)
  ) {
    matchedFormId = 'bank-account-loan-upi-application';
  } else if (
    norm.includes('ടി.സി') ||
    norm.includes('ടിസി') ||
    norm.includes('വിടുതൽ സർട്ടിഫിക്കറ്റ്') ||
    norm.includes('സ്കൂൾ പ്രവേശനം') ||
    /\b(transfer\s*certificate|\btc\b|school\s*admission)\b/i.test(norm)
  ) {
    matchedFormId = 'kppha-school-tc-admission';
  } else if (
    norm.includes('ജി.പി.എഫ്') ||
    norm.includes('പി.എഫ് അഡ്വാൻസ്') ||
    norm.includes('മെഡിക്കൽ റീഇംബേഴ്സ്മെന്റ്') ||
    /\b(gpf|pf\s*advance|medical\s*reimbursement|spark)\b/i.test(norm)
  ) {
    matchedFormId = 'service-gpf-gis-sli-medical-spark';
  } else if (
    norm.includes('കെ.എസ്.ആർ') ||
    norm.includes('കാഷ്വൽ ലീവ്') ||
    /\b(ksr\s*leave|casual\s*leave|commuted\s*leave|lwa)\b/i.test(norm)
  ) {
    matchedFormId = 'service-ksr-leave-application';
  } else if (
    norm.includes('എക്സ്പീരിയൻസ് സർട്ടിഫിക്കറ്റ്') ||
    norm.includes('സാലറി സർട്ടിഫിക്കറ്റ്') ||
    /\b(experience\s*certificate|salary\s*certificate)\b/i.test(norm)
  ) {
    matchedFormId = 'experience-salary-certificate-request';
  } else if (
    norm.includes('രാജിക്കത്ത്') ||
    norm.includes('രാജി') ||
    /\b(resignation|resign)\b/i.test(norm)
  ) {
    matchedFormId = 'general-company-resignation';
  } else if (
    norm.includes('വില്ലേജ് ഓഫീസ') ||
    /\b(village\s*office)\b/i.test(norm)
  ) {
    matchedFormId = 'edistrict-income';
  } else if (
    norm.includes('പഞ്ചായത്ത') ||
    norm.includes('മുൻസിപ്പാലിറ്റി') ||
    norm.includes('നഗരസഭ') ||
    /\b(panchayat|municipality)\b/i.test(norm)
  ) {
    matchedFormId = 'lsgd-building-ownership-permit';
  } else if (
    !norm.includes('മദ്രസ') &&
    !norm.includes('ഉസ്താദ്') &&
    (prompt.includes('ലീവ് ലെറ്റർ') ||
      prompt.includes('അവധി അപേക്ഷ') ||
      prompt.includes('ടീച്ചർ') ||
      prompt.includes('ടീച്ചറെ') ||
      prompt.includes('ഹെഡ്മാസ്റ്റർ') ||
      prompt.includes('പ്രധാനാധ്യാപക') ||
      ((prompt.includes('സ്കൂൾ') || prompt.includes('സ്കൂളിൽ') || prompt.includes('ക്ലാസ്')) &&
        (prompt.includes('അവധി') || prompt.includes('ലീവ്') || /\bleave\b/i.test(norm))))
  ) {
    // Smart Spoken Malayalam School Leave Letter extraction
    const nonNameDativeWords = new Set([
      'ടീച്ചർക്ക്',
      'ടീച്ചറിന്',
      'ടീച്ചറോട്',
      'സാറിന്',
      'മാഷിന്',
      'ഹെഡ്മാസ്റ്റർക്ക്',
      'പ്രിൻസിപ്പലിന്',
      'സ്കൂളിൽ',
      'കല്യാണത്തിന്',
      'വിവാഹത്തിന്',
      'ആശുപത്രിയിൽ',
      'പനിക്ക്',
      'അവധിക്ക്',
      'ലീവിന്',
      'പരീക്ഷയ്ക്ക്',
      'വീട്ടിൽ',
      'യാത്രയ്ക്ക്',
      'എനിക്ക്',
      'അവന്',
      'അവൾക്ക്',
      'കുട്ടിക്ക്',
      'മകന്',
      'മകൾക്ക്',
      'കൊടുക്കാൻ',
      'പോകാൻ',
      'വരാൻ',
    ]);

    const explicitNameMatch = prompt.match(
      /(?:എന്റെ പേര്|കുട്ടിയുടെ പേര്|വിദ്യാർത്ഥിയുടെ പേര്|അപേക്ഷകന്റെ പേര്|പേര്)\s*[:\-]?\s*([^\n,.;]+?)(?=\s*(?:,|،|ആണ്|എന്നാണ്|സ്ഥലം|സ്വദേശം|വീട്|ഫോൺ|വയസ്സ്|\.|$))/i
    );
    let spokenStudentName = explicitNameMatch?.[1]?.replace(/\s*(ആണ്|എന്നാണ്).*$/, '').trim() || '';
    if (!spokenStudentName) {
      const words = prompt
        .replace(/[.,;!?()"'🎙️]/g, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean);
      for (const w of words) {
        if (w.length < 3 || nonNameDativeWords.has(w)) continue;
        if (/(?:വിന്|വിനു|യിന്|യിനു|യ്ക്ക്|യ്ക്കു|ക്ക്|ക്കു|ലിന്|ലിനു|നിന്|നിനു|റിന്|റിനു|ിന്|ിനു)$/.test(w)) {
          let base = w;
          if (/(?:വിന്|വിനു|യിന്|യിനു)$/.test(w)) {
            base = w.replace(/(?:വിന്|വിനു|യിന്|യിനു)$/, '');
          } else if (/(?:യ്ക്ക്|യ്ക്കു)$/.test(w)) {
            base = w.replace(/(?:യ്ക്ക്|യ്ക്കു)$/, '');
          } else if (/(?:ക്ക്|ക്കു)$/.test(w)) {
            base = w.replace(/(?:ക്ക്|ക്കു)$/, '');
          } else if (/ലി(?:ന്|നു)$/.test(w)) {
            base = w.replace(/ലി(?:ന്|നു)$/, 'ൽ');
          } else if (/നി(?:ന്|നു)$/.test(w)) {
            base = w.replace(/നി(?:ന്|നു)$/, 'ൻ');
          } else if (/റി(?:ന്|നു)$/.test(w)) {
            base = w.replace(/റി(?:ന്|നു)$/, 'ർ');
          } else if (/(?:ിന്|ിനു)$/.test(w)) {
            base = w.replace(/(?:ിന്|ിനു)$/, '്');
          }
          if (base.length >= 2) {
            spokenStudentName = base;
            break;
          }
        }
      }
    }

    const extractedLoc = extractKeralaPlaceAndDistrict(prompt);
    const cleanPlace = extractedLoc.found ? extractedLoc.place : currentLetter?.place || 'കേരളം';
    const cleanDistrict = extractedLoc.found ? extractedLoc.district : cleanPlace;

    const dayMatch = prompt.match(
      /(തിങ്കളാഴ്ച|ചൊവ്വാഴ്ച|ബുധനാഴ്ച|വ്യാഴാഴ്ച|വെള്ളിയാഴ്ച|ശനിയാഴ്ച|ഞായറാഴ്ച|നാളെ|ഇന്ന്)/
    );
    const leaveDayPhrase = dayMatch?.[1]
      ? dayMatch[1] === 'നാളെ' || dayMatch[1] === 'ഇന്ന്'
        ? dayMatch[1]
        : `വരുന്ന ${dayMatch[1]}`
      : 'ഇന്ന്';

    const leaveReasonPhrase =
      prompt.includes('കല്യാണ') || prompt.includes('വിവാഹ')
        ? 'ഒരു കല്യാണ ചടങ്ങിൽ (വിവാഹത്തിൽ) പങ്കെടുക്കേണ്ടതിനാൽ'
        : prompt.includes('പനി') || prompt.includes('തലവേദന') || prompt.includes('ജലദോഷം') || prompt.includes('സുഖമില്ല')
        ? 'കടുത്ത പനിയും ശാരീരിക അസ്വസ്ഥതയും ആയതിനാൽ'
        : prompt.includes('ആശുപത്രി') || prompt.includes('ഡോക്ട')
        ? 'ആശുപത്രിയിൽ പോയി ഡോക്ടറെ കാണേണ്ടതിനാൽ'
        : prompt.includes('യാത്ര')
        ? 'കുടുംബസമേതം ഒരു അത്യാവശ്യ യാത്ര പോകേണ്ടതിനാൽ'
        : 'ഒഴിച്ചുകൂടാനാവാത്ത കുടുംബപരമായ ആവശ്യങ്ങളാൽ';

    const studentIntro = spokenStudentName
      ? `ഈ സ്കൂളിലെ വിദ്യാർത്ഥിയായ എനിക്ക് (${spokenStudentName})`
      : 'ഈ സ്കൂളിലെ വിദ്യാർത്ഥിയായ എനിക്ക്';

    const leaveLetter: MalayalamLetterData = {
      documentHeading: 'അവധി അപേക്ഷ (Leave Letter)',
      letterLayoutVariant: 'school_leave',
      senderName: spokenStudentName || '',
      senderAddress: cleanPlace !== cleanDistrict ? `${cleanPlace}, ${cleanDistrict}` : cleanPlace,
      senderPhone: '',
      recipientTitle: 'ബഹുമാനപ്പെട്ട ക്ലാസ് ടീച്ചർ / ഹെഡ്മാസ്റ്റർ അവർകൾക്ക്,',
      recipientOffice: `ഗവൺമെന്റ് ഹയർ സെക്കൻഡറി സ്കൂൾ, ${cleanPlace},`,
      recipientPlace: `${cleanDistrict}.`,
      subject: 'ഒരു ദിവസത്തെ അവധി (Leave) അനുവദിച്ചു തരണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള അപേക്ഷ.',
      reference: '',
      salutation: 'ബഹുമാനപ്പെട്ട ടീച്ചറേ,',
      bodyParagraphs: [
        `${studentIntro} ${leaveReasonPhrase} ${leaveDayPhrase} ക്ലാസ്സിൽ ഹാജരാകുവാൻ സാധിക്കുന്നതല്ല.`,
        'ആയതിനാൽ ദയവായി അന്നേ ദിവസം എനിക്ക് അവധി അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
      ],
      closingPhrase: 'വിനീത വിദ്യാർത്ഥി,',
      place: cleanPlace,
      date: new Date().toLocaleDateString('ml-IN'),
      enclosures: [],
    };

    const syntheticForm: GovFormTemplate = {
      id: 'school-student-leave-letter',
      categoryKey: 'service_education',
      categoryLabelMalayalam: 'സ്കൂൾ & വിദ്യാഭ്യാസം (Education)',
      formCode: 'സ്കൂൾ വിദ്യാർത്ഥി അവധി അപേക്ഷ (School Leave Letter)',
      titleMalayalam: 'അവധി അപേക്ഷ (Leave Letter)',
      titleEnglish: 'School Student Leave Application',
      subtitleMalayalam: 'സ്കൂളിൽ ക്ലാസ് ടീച്ചർക്ക് / ഹെഡ്മാസ്റ്റർക്ക് നൽകാനുള്ള അവധി അപേക്ഷ',
      portalName: 'സ്കൂൾ / വിദ്യാഭ്യാസ വകുപ്പ്',
      portalUrl: '',
      searchKeywords: 'school leave letter teacher class student സ്കൂൾ അവധി അപേക്ഷ ലീവ് ലെറ്റർ ടീച്ചർ',
      recipientTitle: leaveLetter.recipientTitle,
      recipientOffice: leaveLetter.recipientOffice,
      subject: leaveLetter.subject,
      bodyParagraphs: leaveLetter.bodyParagraphs,
      enclosures: [],
      structuredFields: [],
    };

    return {
      form: syntheticForm,
      letterData: leaveLetter,
      assistantReplyMalayalam: `✅ നിങ്ങൾ പറഞ്ഞ വിവരങ്ങൾ ചേർത്ത് **സ്കൂൾ അവധി അപേക്ഷ (Leave Letter)** തയ്യാറായിട്ടുണ്ട്!\n\n• വിദ്യാർത്ഥിയുടെ പേര്: **${spokenStudentName || 'താഴെ ചേർക്കാം'}**\n• അവധി ദിവസം: **${leaveDayPhrase}**\n• കാരണം: **${leaveReasonPhrase}**\n\nവലതുവശത്തെ A4 പേപ്പറിലോ താഴെ കാണുന്ന വാട്സാപ്പ് കോളങ്ങളിലോ സ്കൂളിന്റെ പേരും ക്ലാസ്സും ആവശ്യമെങ്കിൽ തിരുത്താം.`,
      followUpQuestions: buildEditableQuestionsForLetter(leaveLetter),
      isComplete: Boolean(spokenStudentName),
    };
  }

  if (matchedFormId) {
    const form = KERALA_GOV_FORMS_MASTER.find((f) => f.id === matchedFormId);
    if (form) {
      const baseLetter = convertGovFormToLetterData(form);
      const { updated, extractedAny } = applyExtractedDetailsToGovLetter(prompt, baseLetter);
      const followUps = buildFollowUpsForGovForm(form, updated);

      // Attach sub-form option list whenever the category has multiple distinct complaint/application types!
      let subFormPromptTitle: string | undefined;
      let subFormOptions: SubFormOptionChoice[] | undefined;
      let customIntro = `🏛️ "${form.titleMalayalam}" തയ്യാറായിട്ടുണ്ട്!`;

      if (matchedFormId.startsWith('police-')) {
        subFormPromptTitle =
          '🚓 പോലീസ് സ്റ്റേഷനിൽ ഏത് തരത്തിലുള്ള പരാതിയാണ് / അപേക്ഷയാണ് നൽകേണ്ടത്? താഴെ കാണുന്ന ലിസ്റ്റിൽ നിന്ന് നിങ്ങളുടെ ആവശ്യം തിരഞ്ഞെടുക്കുക:';
        subFormOptions = POLICE_SUB_FORM_OPTIONS;
        if (matchedFormId === 'police-general-complaint') {
          customIntro = `🚓 പോലീസ് സ്റ്റേഷനിൽ നൽകാവുന്ന 5 തരം പരാതികളുടെ ലിസ്റ്റ് താഴെ നൽകിയിട്ടുണ്ട്! നിങ്ങളുടെ ആവശ്യം ഏതാണെന്ന് അതിൽ നിന്ന് തിരഞ്ഞെടുക്കാം.\n\n(നിലവിൽ "പൊതുവായ പോലീസ് പരാതി" മാതൃകയാണ് തുറന്നിരിക്കുന്നത്. രേഖകൾ നഷ്ടപ്പെട്ടതാണെങ്കിലോ സൈബർ തട്ടിപ്പാണെങ്കിലോ താഴെ കാണുന്ന ബട്ടണുകളിൽ ഒന്ന് തൊട്ടാൽ ഉടൻ ആ ഫോമിലേക്ക് മാറും!)`;
        }
      } else if (
        matchedFormId === 'edistrict-income' &&
        (norm.includes('വില്ലേജ് ഓഫീസ') || norm.includes('village office')) &&
        !norm.includes('വരുമാന') &&
        !norm.includes('income')
      ) {
        subFormPromptTitle =
          '🏛️ വില്ലേജ് ഓഫീസിൽ ഏത് സർട്ടിഫിക്കറ്റിനാണ് അപേക്ഷിക്കേണ്ടത്? താഴെ കാണുന്ന ലിസ്റ്റിൽ നിന്ന് തിരഞ്ഞെടുക്കുക:';
        subFormOptions = VILLAGE_SUB_FORM_OPTIONS;
      } else if (
        matchedFormId === 'lsgd-building-ownership-permit' &&
        (norm.includes('പഞ്ചായത്ത') || norm.includes('panchayat')) &&
        !norm.includes('കെട്ടിട')
      ) {
        subFormPromptTitle =
          '🏢 പഞ്ചായത്ത് / നഗരസഭയിൽ ഏത് ആവശ്യത്തിനാണ് അപേക്ഷ നൽകേണ്ടത്? താഴെ കാണുന്ന ലിസ്റ്റിൽ നിന്ന് തിരഞ്ഞെടുക്കുക:';
        subFormOptions = PANCHAYAT_SUB_FORM_OPTIONS;
      } else if (matchedFormId.startsWith('madrasa-')) {
        subFormPromptTitle =
          '🕌 മദ്രസയുമായി ബന്ധപ്പെട്ട ഏത് ഫോമാണ് / അപേക്ഷയാണ് നിങ്ങൾക്ക് ആവശ്യം? താഴെ കാണുന്ന ലിസ്റ്റിൽ നിന്ന് തിരഞ്ഞെടുക്കുക:';
        subFormOptions = MADRASA_SUB_FORM_OPTIONS;
      }

      return {
        form,
        letterData: updated,
        assistantReplyMalayalam: `${customIntro}\n\n• വാട്സാപ്പ് മോഡിൽ: താഴെ ലിസ്റ്റ് ചെയ്തിരിക്കുന്ന ഓരോ കോളത്തിലും നിങ്ങളുടെ വിവരങ്ങൾ നേരിട്ട് ടൈപ്പ് ചെയ്യുകയോ 🎙️ വോയ്‌സ് ബട്ടൺ അമർത്തി പറയുകയോ ചെയ്യാം.\n• പേപ്പർ മോഡിൽ: വലതുവശത്തെ A4 പേപ്പറിലെ ഏത് അക്ഷരത്തിലും നേരിട്ട് തൊട്ട് തിരുത്താം.`,
        followUpQuestions: followUps,
        subFormPromptTitle,
        subFormOptions,
        isComplete: extractedAny,
      };
    }
  }

  // Rule 2: If the user already has a Gov Form with `structuredFields` open on the sheet
  // and is now sending their details (e.g. answering followUpQuestions or giving name/village/income),
  // update the existing Gov Form in-place without losing its structured table!
  if (
    currentLetter &&
    currentLetter.structuredFields &&
    currentLetter.structuredFields.length > 0 &&
    currentLetter.formCode
  ) {
    const activeForm =
      KERALA_GOV_FORMS_MASTER.find((f) => f.formCode === currentLetter.formCode) ||
      KERALA_GOV_FORMS_MASTER[0];
    const { updated, extractedAny } = applyExtractedDetailsToGovLetter(prompt, currentLetter);
    if (extractedAny) {
      return {
        form: activeForm,
        letterData: updated,
        assistantReplyMalayalam: `✓ നിങ്ങൾ നൽകിയ വിവരങ്ങൾ "${updated.documentHeading}" A4 ഫോമിലും പട്ടികയിലും കൃത്യമായി ചേർത്തിട്ടുണ്ട്! താഴെ കാണുന്ന കോളങ്ങളിൽ ഇനിയും മാറ്റങ്ങൾ വരുത്താം, അല്ലെങ്കിൽ പ്രിന്റ് / PDF ഡൗൺലോഡ് ചെയ്യാം.`,
        followUpQuestions: buildEditableQuestionsForLetter(updated),
        isComplete: true,
      };
    }
  }

  return null;
}

