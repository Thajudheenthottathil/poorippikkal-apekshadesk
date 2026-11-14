import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  Eye,
  FileText,
  HelpCircle,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DocumentCategory,
  OwnerBusinessConfig,
  QUICK_TEMPLATES,
  QuickTemplateItem,
} from '../types/documents';

export interface CuratedFreemiumSample {
  id: string;
  titleMalayalam: string;
  searchKeywords: string;
  categoryBadge: string;
  category: DocumentCategory;
  recipientLine?: string;
  subjectLine: string;
  fullSampleMalayalamText: string;
  linkedTemplateId?: string;
  customPromptToLoad?: string;
}

const FEATURED_CURATED_SAMPLES: CuratedFreemiumSample[] = [
  {
    id: 'sample-tree-cutting',
    titleMalayalam: '1. മരം മുറിക്കാൻ പഞ്ചായത്ത് സെക്രട്ടറിക്ക് നൽകുന്ന അപേക്ഷ',
    searchKeywords: 'tree cutting application malayalam മരം മുറിക്കാൻ അപേക്ഷ പഞ്ചായത്ത് സെക്രട്ടറി അപകടാവസ്ഥയിലായ മരം',
    categoryBadge: 'പഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി',
    category: 'malayalam_letter',
    recipientLine: 'സെക്രട്ടറി, ഗ്രാമപഞ്ചായത്ത് കാര്യാലയം',
    subjectLine: 'വിഷയം: വീടിന് അപകടാവസ്ഥയിലായി നിൽക്കുന്ന മരം മുറിച്ചു മാറ്റാൻ അനുമതി ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[നിങ്ങളുടെ പേര്],
[വീട്ടുപേര്, വാർഡ് നമ്പർ, സ്ഥലം],
ഫോൺ: [മൊബൈൽ നമ്പർ]

സ്വീകർത്താവ്,
സെക്രട്ടറി,
[ഗ്രാമപഞ്ചായത്തിന്റെ പേര്] ഗ്രാമപഞ്ചായത്ത് കാര്യാലയം,
[സ്ഥലം].

വിഷയം: അപകടാവസ്ഥയിലായി നിൽക്കുന്ന മരം മുറിച്ചു മാറ്റാൻ അനുമതി നൽകണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ടുള്ള അപേക്ഷ.

സർ / മാഡം,

മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ബോധിപ്പിക്കുന്ന അപേക്ഷ. എന്റെ വീടിനോട് ചേർന്ന് നിൽക്കുന്ന പഴക്കമുള്ള മരം ശക്തമായ കാറ്റിലും മഴയിലും ചരിഞ്ഞ് വീടിന് മുകളിലേക്ക് വീഴാൻ സാധ്യതയുള്ള അപകടാവസ്ഥയിലാണ് നിൽക്കുന്നത്. ആയതിനാൽ ജീവനും സ്വത്തിനും ഭീഷണിയായി നിൽക്കുന്ന പ്രസ്തുത മരം മുറിച്ചു മാറ്റുന്നതിന് ആവശ്യമായ പരിശോധന നടത്തി അനുമതി നൽകണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.

സ്ഥലം: [സ്ഥലം]
തീയതി: [തീയതി]

വിശ്വാസപൂർവ്വം,
(ഒപ്പ്)
[നിങ്ങളുടെ പേര്]`,
    customPromptToLoad:
      'വീടിന് അപകടാവസ്ഥയിലായി നിൽക്കുന്ന മരം മുറിച്ചു മാറ്റാൻ അനുമതി നൽകണമെന്ന് അഭ്യർത്ഥിച്ചുകൊണ്ട് പഞ്ചായത്ത് സെക്രട്ടറിക്ക് നൽകുന്ന ഔദ്യോഗിക അപേക്ഷ തയ്യാറാക്കുക.',
  },
  {
    id: 'sample-income-cert',
    titleMalayalam: '2. വരുമാന സർട്ടിഫിക്കറ്റിനുള്ള അപേക്ഷ (വില്ലേജ് ഓഫീസ്)',
    searchKeywords: 'income certificate application malayalam വരുമാന സർട്ടിഫിക്കറ്റ് വില്ലേജ് ഓഫീസ് അപേക്ഷ',
    categoryBadge: 'വില്ലേജ് ഓഫീസ്',
    category: 'malayalam_letter',
    recipientLine: 'വില്ലേജ് ഓഫീസർ, വില്ലേജ് ഓഫീസ്',
    subjectLine: 'വിഷയം: വരുമാന സർട്ടിഫിക്കറ്റ് (Income Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[അപേക്ഷകന്റെ പേര്],
[വീട്ടുപേര്, പി.ഒ., സ്ഥലം],
ഫോൺ: [മൊബൈൽ നമ്പർ]

സ്വീകർത്താവ്,
വില്ലേജ് ഓഫീസർ,
[വില്ലേജിന്റെ പേര്] വില്ലേജ് ഓഫീസ്,
[സ്ഥലം].

വിഷയം: വരുമാന സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു കിട്ടുന്നതിനുള്ള അപേക്ഷ.

സർ / മാഡം,

[വില്ലേജിന്റെ പേര്] വില്ലേജിൽ സർവ്വേ നമ്പർ [....] ലുള്ള വസ്തുവിലെ സ്ഥിരതാമസക്കാരനാണ് ഞാൻ. എന്റെ മകന്റെ / മകളുടെ വിദ്യാഭ്യാസ സ്കോളർഷിപ്പ് ആവശ്യത്തിലേക്കായി എന്റെ കുടുംബത്തിന്റെ വാർഷിക വരുമാനം തെളിയിക്കുന്ന വരുമാന സർട്ടിഫിക്കറ്റ് അത്യാവശ്യമായി വന്നിരിക്കുന്നു. റേഷൻ കാർഡ് പകർപ്പും ആധാർ പകർപ്പും ഇതോടൊപ്പം ഉള്ളടക്കം ചെയ്യുന്നു. ദയവായി വരുമാന സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.

സ്ഥലം: [സ്ഥലം]
തീയതി: [തീയതി]

വിശ്വാസപൂർവ്വം,
(ഒപ്പ്)
[അപേക്ഷകന്റെ പേര്]`,
    linkedTemplateId: 'tpl-income-cert',
  },
  {
    id: 'sample-possession-cert',
    titleMalayalam: '3. കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Possession Certificate)',
    searchKeywords: 'possession certificate malayalam കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് വില്ലേജ് ഓഫീസ് അപേക്ഷ',
    categoryBadge: 'വില്ലേജ് ഓഫീസ്',
    category: 'malayalam_letter',
    recipientLine: 'വില്ലേജ് ഓഫീസർ, വില്ലേജ് ഓഫീസ്',
    subjectLine: 'വിഷയം: വസ്തുവിന്റെ കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[അപേക്ഷകന്റെ പേര്],
[വീട്ടുപേര്, സ്ഥലം]

സ്വീകർത്താവ്,
വില്ലേജ് ഓഫീസർ,
[വില്ലേജിന്റെ പേര്] വില്ലേജ് ഓഫീസ്.

വിഷയം: കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് (Possession Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.

സർ / മാഡം,

[വില്ലേജിന്റെ പേര്] വില്ലേജിൽ തണ്ടപ്പേർ നമ്പർ [....], സർവ്വേ നമ്പർ [....] പ്രകാരം എന്റെ കൈവശത്തിലും അനുഭവത്തിലുമുള്ള വസ്തുവിന് ബാങ്ക് വായ്പ / ഭവന നിർമ്മാണ ആവശ്യത്തിലേക്കായി കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് ആവശ്യമായി വന്നിരിക്കുന്നു. നടപ്പുസാമ്പത്തിക വർഷത്തെ ഭൂനികുതി രസീത് പകർപ്പ് ഇതോടൊപ്പം ചേർക്കുന്നു. ദയവായി കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് അപേക്ഷിക്കുന്നു.`,
    linkedTemplateId: 'tpl-possession',
  },
  {
    id: 'sample-pokkuvaravu',
    titleMalayalam: '4. വസ്തു പോക്കുവരവ് ചെയ്യാനുള്ള അപേക്ഷ (Mutation Application)',
    searchKeywords: 'pokkuvaravu application malayalam പോക്കുവരവ് അപേക്ഷ വില്ലേജ് ഓഫീസ് ഭൂനികുതി',
    categoryBadge: 'വില്ലേജ് ഓഫീസ്',
    category: 'malayalam_letter',
    recipientLine: 'വില്ലേജ് ഓഫീസർ, വില്ലേജ് ഓഫീസ്',
    subjectLine: 'വിഷയം: തീറാധാരപ്രകാരം വാങ്ങിയ വസ്തു പോക്കുവരവ് ചെയ്തു കിട്ടുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[അപേക്ഷകന്റെ പേര്],
[വീട്ടുപേര്, സ്ഥലം]

സ്വീകർത്താവ്,
വില്ലേജ് ഓഫീസർ,
[വില്ലേജിന്റെ പേര്] വില്ലേജ് ഓഫീസ്.

വിഷയം: വസ്തു പോക്കുവരവ് (Transfer of Registry) ചെയ്തു കിട്ടുന്നതിനുള്ള അപേക്ഷ.

സർ / മാഡം,

സബ് രജിസ്ട്രാർ ഓഫീസിലെ [ആധാരം നമ്പർ/വർഷം] നമ്പർ ആധാരപ്രകാരം ഞാൻ വിലയ്ക്കു വാങ്ങിയതും [വില്ലേജ്] വില്ലേജിൽ സർവ്വേ നമ്പർ [....] ൽ ഉൾപ്പെട്ടതുമായ വസ്തു എന്റെ പേരിൽ പോക്കുവരവ് ചെയ്ത് തണ്ടപ്പേർ അനുവദിച്ചു തരണമെന്നും ഭൂനികുതി സ്വീകരിക്കണമെന്നും വിനീതമായി അപേക്ഷിക്കുന്നു. ആധാരത്തിന്റെ പകർപ്പും മുന്നാധാര പകർപ്പും ഇതോടൊപ്പം ചേർക്കുന്നു.`,
    customPromptToLoad:
      'ആധാരപ്രകാരം വാങ്ങിയ വസ്തു എന്റെ പേരിൽ പോക്കുവരവ് (Transfer of Registry) ചെയ്തു തരണമെന്ന് ആവശ്യപ്പെട്ട് വില്ലേജ് ഓഫീസർക്ക് നൽകുന്ന അപേക്ഷ തയ്യാറാക്കുക.',
  },
  {
    id: 'sample-ration-card',
    titleMalayalam: '5. റേഷൻ കാർഡിൽ പേര് ചേർക്കൽ / തിരുത്തൽ അപേക്ഷ',
    searchKeywords: 'ration card application malayalam റേഷൻ കാർഡ് അപേക്ഷ താലൂക്ക് സപ്ലൈ ഓഫീസർ',
    categoryBadge: 'സിവിൽ സപ്ലൈസ് / റേഷൻ',
    category: 'malayalam_letter',
    recipientLine: 'താലൂക്ക് സപ്ലൈ ഓഫീസർ, താലൂക്ക് സപ്ലൈ ഓഫീസ്',
    subjectLine: 'വിഷയം: റേഷൻ കാർഡിൽ അംഗത്തിന്റെ പേര് ചേർക്കുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[കാർഡ് ഉടമയുടെ പേര്],
[വിലാസം, റേഷൻ കാർഡ് നമ്പർ]

സ്വീകർത്താവ്,
താലൂക്ക് സപ്ലൈ ഓഫീസർ,
താലൂക്ക് സപ്ലൈ ഓഫീസ്, [സ്ഥലം].

വിഷയം: റേഷൻ കാർഡിൽ പുതിയ അംഗത്തിന്റെ പേര് ചേർക്കുന്നതിനുള്ള അപേക്ഷ.

സർ / മാഡം,

എന്റെ ഉടമസ്ഥതയിലുള്ള [റേഷൻ കാർഡ് നമ്പർ] നമ്പർ റേഷൻ കാർഡിൽ എന്റെ കുടുംബാംഗമായ [പേര്]-ന്റെ പേര് കൂടി ഉൾപ്പെടുത്തി തരണമെന്ന് അഭ്യർത്ഥിക്കുന്നു. ആധാർ കാർഡ് പകർപ്പും ജനന / വിവാഹ സർട്ടിഫിക്കറ്റ് പകർപ്പും ഇതോടൊപ്പം ഉള്ളടക്കം ചെയ്യുന്നു.`,
    linkedTemplateId: 'tpl-ration-card',
  },
  {
    id: 'sample-kseb-post',
    titleMalayalam: '6. KSEB ഇലക്ട്രിക് പോസ്റ്റ് / ലൈൻ മാറ്റി സ്ഥാപിക്കാനുള്ള അപേക്ഷ',
    searchKeywords: 'kseb post shifting application malayalam കെഎസ്ഇബി പോസ്റ്റ് മാറ്റാൻ അപേക്ഷ വൈദ്യുതി ലൈൻ',
    categoryBadge: 'KSEB / വൈദ്യുതി ബോർഡ്',
    category: 'malayalam_letter',
    recipientLine: 'അസിസ്റ്റന്റ് എൻജിനീയർ, KSEB ഇലക്ട്രിക്കൽ സെക്ഷൻ',
    subjectLine: 'വിഷയം: പുരയിടത്തിലൂടെ പോകുന്ന വൈദ്യുതി ലൈൻ / ഇലക്ട്രിക് പോസ്റ്റ് മാറ്റി സ്ഥാപിക്കുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[അപേക്ഷകന്റെ പേര്],
[വീട്ടുപേര്, കൺസ്യൂമർ നമ്പർ, സ്ഥലം]

സ്വീകർത്താവ്,
അസിസ്റ്റന്റ് എൻജിനീയർ,
കെ.എസ്.ഇ.ബി (KSEB) ഇലക്ട്രിക്കൽ സെക്ഷൻ ഓഫീസ്, [സ്ഥലം].

വിഷയം: വസ്തുവിലെ ഇലക്ട്രിക് പോസ്റ്റ് / വൈദ്യുതി ലൈൻ മാറ്റി സ്ഥാപിക്കുന്നതിനുള്ള അപേക്ഷ.

സർ / മാഡം,

ഞാൻ [സ്ഥലം] ഇലക്ട്രിക്കൽ സെക്ഷൻ പരിധിയിലെ ഉപഭോക്താവാണ് (കൺസ്യൂമർ നമ്പർ: [....]). എന്റെ പുരയിടത്തിലൂടെ കടന്നുപോകുന്ന വൈദ്യുതി ലൈനും പോസ്റ്റും പുതിയ വീട് നിർമ്മാണത്തിനും വാഹന പ്രവേശനത്തിനും തടസ്സമായി നിൽക്കുകയാണ്. ആയതിനാൽ സ്ഥലം പരിശോധിച്ച് പ്രസ്തുത ഇലക്ട്രിക് പോസ്റ്റ് വസ്തുവിന്റെ അതിർത്തിയിലേക്ക് മാറ്റി സ്ഥാപിച്ചു തരണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.`,
    linkedTemplateId: 'tpl-kseb-complaint',
  },
  {
    id: 'sample-police-lost',
    titleMalayalam: '7. പോലീസ് സ്റ്റേഷൻ പരാതി മാതൃക (രേഖകൾ / ഫോൺ നഷ്ടപ്പെട്ടത്)',
    searchKeywords: 'police complaint format malayalam പോലീസ് സ്റ്റേഷൻ പരാതി ഫോൺ നഷ്ടപ്പെട്ടത് സർട്ടിഫിക്കറ്റ് നഷ്ടപ്പെട്ടു',
    categoryBadge: 'പോലീസ് സ്റ്റേഷൻ',
    category: 'malayalam_letter',
    recipientLine: 'സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO), പോലീസ് സ്റ്റേഷൻ',
    subjectLine: 'വിഷയം: നഷ്ടപ്പെട്ട ഒറിജിനൽ രേഖകൾ / മൊബൈൽ ഫോൺ കണ്ടെത്തിത്തരുന്നതിനും സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനുമുള്ള പരാതി.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[പരാതിക്കാരന്റെ പേര്],
[വിലാസം, ഫോൺ നമ്പർ]

സ്വീകർത്താവ്,
സ്റ്റേഷൻ ഹൗസ് ഓഫീസർ (SHO),
[സ്ഥലം] പോലീസ് സ്റ്റേഷൻ.

വിഷയം: യാത്രയ്ക്കിടയിൽ നഷ്ടപ്പെട്ട രേഖകൾ / മൊബൈൽ ഫോൺ സംബന്ധിച്ച പരാതി.

സർ,

[തീയതി] തീയതി രാവിലെ [സ്ഥലം] വെച്ച് യാത്ര ചെയ്യുന്നതിനിടയിൽ എന്റെ കൈവശമുണ്ടായിരുന്ന ഒറിജിനൽ രേഖകൾ / മൊബൈൽ ഫോൺ നഷ്ടപ്പെട്ടിരിക്കുന്നു. പലയിടത്തും തിരഞ്ഞിട്ടും കണ്ടെത്താൻ സാധിച്ചില്ല. ആയതിനാൽ പ്രസ്തുത രേഖകൾ ദുരുപയോഗം ചെയ്യപ്പെടാതിരിക്കാനും ഡ്യൂപ്ലിക്കേറ്റ് കോപ്പിക്ക് അപേക്ഷിക്കാനുമായി പരാതി സ്വീകരിച്ച് രസീതും (GD Entry / Lost Certificate) അന്വേഷണ സഹായവും നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.`,
    linkedTemplateId: 'tpl-police-complaint',
  },
  {
    id: 'sample-resignation',
    titleMalayalam: '8. ജോലി രാജിക്കത്ത് മാതൃക (Job Resignation Letter Malayalam)',
    searchKeywords: 'job resignation letter format malayalam ജോലി രാജിക്കത്ത് എങ്ങനെ എഴുതാം കമ്പനി രാജി കത്ത്',
    categoryBadge: 'രാജിക്കത്ത് / സ്ഥാപനം',
    category: 'malayalam_letter',
    recipientLine: 'മാനേജർ / മാനേജിംഗ് ഡയറക്ടർ',
    subjectLine: 'വിഷയം: ജോലിയിൽ നിന്നുള്ള രാജിക്കത്ത് (Resignation Letter) സമർപ്പിക്കുന്നത് സംബന്ധിച്ച്.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[ജീവനക്കാരന്റെ പേര്],
[തസ്തിക / ഡിപ്പാർട്ട്മെന്റ്]

സ്വീകർത്താവ്,
മാനേജർ,
[സ്ഥാപനത്തിന്റെ പേര് & സ്ഥലം].

വിഷയം: ജോലിയിൽ നിന്നുള്ള രാജിക്കത്ത് സമർപ്പിക്കുന്നത് സംബന്ധിച്ച്.

സർ / മാഡം,

വ്യക്തിപരമായ കാരണങ്ങളാൽ [സ്ഥാപനത്തിന്റെ പേര്] എന്ന സ്ഥാപനത്തിലെ എന്റെ [തസ്തിക] പദവിയിൽ നിന്നും ഞാൻ രാജിവെക്കുകയാണ്. കഴിഞ്ഞ കാലയളവിൽ സ്ഥാപനം എനിക്ക് നൽകിയ എല്ലാ പിന്തുണയ്ക്കും അവസരങ്ങൾക്കും ഹൃദയപൂർവ്വം നന്ദി രേഖപ്പെടുത്തുന്നു. [തീയതി] മുതൽ എന്റെ രാജി സ്വീകരിച്ച് എന്നെ ചുമതലകളിൽ നിന്ന് വിടുതൽ (Relieving) നൽകണമെന്ന് വിനീതമായി അഭ്യർത്ഥിക്കുന്നു.`,
    linkedTemplateId: 'tpl-resignation',
  },
  {
    id: 'sample-rental-agreement',
    titleMalayalam: '9. 11 മാസത്തെ വീട് / കടമുറി വാടക കരാർ ഫോർമാറ്റ് (Malayalam Vadaka Kararu Format PDF)',
    searchKeywords: 'malayalam vadaka kararu format vadaka karar format malayalam pdf rental agreement format malayalam pdf വാടക കരാർ ഫോർമാറ്റ് മലയാളം മുദ്രപ്പത്രം വീട് കടമുറി',
    categoryBadge: 'വാടക കരാർ (Stamp Paper)',
    category: 'rental_agreement',
    recipientLine: '₹200 കേരള സ്റ്റാമ്പ് പേപ്പർ ഫോർമാറ്റ് (3.5 / 4.5 ഇഞ്ച് മുകളിൽ ഗ്യാപ്പോടെ)',
    subjectLine: '11 മാസത്തെ വീട് / കടമുറി വാടക കരാർ പത്രം (MALAYALAM VADAKA KARARU FORMAT)',
    fullSampleMalayalamText: `വാടക കരാർ പത്രം (RENTAL AGREEMENT / MALAYALAM VADAKA KARARU FORMAT)

2026-ാമാണ്ട് [മാസം] മാസം [തീയതി] തീയതി എഴുതിപ്പിടിപ്പിക്കുന്ന വാടക കരാർ പത്രം.

ഒന്നാം കക്ഷി (കെട്ടിട ഉടമ): [ഉടമയുടെ പേര്, വയസ്സ്, പിതാവിന്റെ പേര്, വീട്ടുപേര്, സ്ഥലം, ആധാർ നമ്പർ]
രണ്ടാം കക്ഷി (വാടകക്കാരൻ): [വാടകക്കാരന്റെ പേര്, വയസ്സ്, പിതാവിന്റെ പേര്, വീട്ടുപേര്, സ്ഥലം, ആധാർ നമ്പർ]

വ്യവസ്ഥകൾ:
1. ഒന്നാം കക്ഷിയുടെ ഉടമസ്ഥതയിലുള്ള പട്ടികയിൽ വിവരിക്കുന്ന കെട്ടിടം പ്രതിമാസം ₹[മാസവാടക]/- രൂപ വാടക നിശ്ചയിച്ച് 11 മാസത്തെ കാലാവധിക്ക് രണ്ടാം കക്ഷിക്ക് വാടകയ്ക്ക് നൽകിയിരിക്കുന്നു.
2. സെക്യൂരിറ്റി അഡ്വാൻസായി ₹[അഡ്വാൻസ് തുക]/- രൂപ രണ്ടാം കക്ഷി ഒന്നാം കക്ഷിക്ക് കൈമാറിയിട്ടുള്ളതും, ഒഴിയുമ്പോൾ കുടിശ്ശികയില്ലാതെ തിരികെ നൽകുന്നതുമാകുന്നു.
3. എല്ലാ മാസവും 5-ാം തീയതിക്കകം മാസവാടക കൃത്യമായി നൽകേണ്ടതും വൈദ്യുതി/വെള്ളം ചാർജ്ജുകൾ രണ്ടാം കക്ഷി അടയ്ക്കേണ്ടതുമാകുന്നു.`,
    linkedTemplateId: 'tpl-house-rent',
  },
  {
    id: 'sample-building-tax',
    titleMalayalam: '10. പഞ്ചായത്ത് ബിൽഡിംഗ് ടാക്സ് / ഉടമസ്ഥാവകാശ സർട്ടിഫിക്കറ്റ് അപേക്ഷ',
    searchKeywords: 'panchayat building tax ownership application പഞ്ചായത്ത് അപേക്ഷ എഴുതാൻ ഓൺലൈൻ പഞ്ചായത്ത് ബിൽഡിംഗ് ടാക്സ് അപേക്ഷ കെട്ടിട നികുതി ഉടമസ്ഥാവകാശം',
    categoryBadge: 'പഞ്ചായത്ത് / മുൻസിപ്പാലിറ്റി',
    category: 'malayalam_letter',
    recipientLine: 'സെക്രട്ടറി, ഗ്രാമപഞ്ചായത്ത് / നഗരസഭ',
    subjectLine: 'വിഷയം: കെട്ടിടത്തിന്റെ ഉടമസ്ഥാവകാശ സർട്ടിഫിക്കറ്റ് (Ownership Certificate) ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.',
    fullSampleMalayalamText: `പ്രേഷിതൻ,
[കെട്ടിട ഉടമയുടെ പേര്],
[വിലാസം, വാർഡ് നമ്പർ]

സ്വീകർത്താവ്,
സെക്രട്ടറി,
[പഞ്ചായത്തിന്റെ പേര്] ഗ്രാമപഞ്ചായത്ത് കാര്യാലയം.

വിഷയം: കെട്ടിട ഉടമസ്ഥാവകാശ സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനുള്ള അപേക്ഷ.

സർ / മാഡം,

[പഞ്ചായത്തിന്റെ പേര്] ഗ്രാമപഞ്ചായത്തിലെ [വാർഡ് നമ്പർ]-ാം വാർഡിൽ [കെട്ടിട നമ്പർ] നമ്പറായി എന്റെ പേരിൽ രജിസ്റ്റർ ചെയ്തിട്ടുള്ള കെട്ടിടത്തിന് KSEB / ഗ്യാസ് / ബാങ്ക് ആവശ്യത്തിലേക്കായി ഉടമസ്ഥാവകാശ സർട്ടിഫിക്കറ്റ് (Ownership Certificate) ആവശ്യമായി വന്നിരിക്കുന്നു. നടപ്പുസാമ്പത്തിക വർഷത്തെ കെട്ടിട നികുതി രസീത് പകർപ്പ് ഇതോടൊപ്പം ചേർക്കുന്നു. ദയവായി സർട്ടിഫിക്കറ്റ് അനുവദിച്ചു തരണമെന്ന് അപേക്ഷിക്കുന്നു.`,
    customPromptToLoad:
      'പഞ്ചായത്തിലെ കെട്ടിടത്തിന്റെ ഉടമസ്ഥാവകാശ സർട്ടിഫിക്കറ്റ് (Building Ownership Certificate) ലഭിക്കുന്നതിനായി പഞ്ചായത്ത് സെക്രട്ടറിക്ക് നൽകുന്ന അപേക്ഷ തയ്യാറാക്കുക.',
  },
  {
    id: 'sample-gulf-cv',
    titleMalayalam: '11. പ്രവാസി ഗൾഫ് സിവി & ബയോഡാറ്റ ഫോർമാറ്റ് (Gulf Driver / Sales / Admin CV)',
    searchKeywords: 'gulf driver cv format pdf pravasi biodata visit visa uae dubai saudi qatar cv format malayalam',
    categoryBadge: 'പ്രവാസി ഗൾഫ് CV',
    category: 'gulf_cv',
    recipientLine: '1-Page ATS English Gulf CV Format (With Passport Photo)',
    subjectLine: 'PROFESSIONAL GULF CV — LIGHT & HEAVY DRIVER / ACCOUNTANT / SALES EXECUTIVE',
    fullSampleMalayalamText: `NAME: MUHAMMED RASHID K.
ROLE: LIGHT & HEAVY VEHICLE DRIVER (UAE & GCC EXPERIENCE) / SALES EXECUTIVE
LOCATION: Dubai, UAE (Visit Visa – Immediately Available) | Phone/WhatsApp: +971 50 000 0000

PROFESSIONAL SUMMARY:
Dedicated professional with 6+ years of GCC and India experience, valid driving license, defensive driving knowledge, route navigation across Dubai, Abu Dhabi & Sharjah, and excellent customer communication in English, Arabic, Hindi, and Malayalam.

PASSPORT & VISA DETAILS:
• Nationality: Indian  |  Passport No: V1234567
• Visa Status: UAE Visit Visa (Ready to Join Immediately)
• Languages: English, Arabic (Basic), Hindi, Malayalam`,
    linkedTemplateId: 'tpl-gulf-driver',
  },
  {
    id: 'sample-teacher-marklist',
    titleMalayalam: '12. സ്കൂൾ / മദ്രസ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് ടേബിൾ (5B 1st Term Format)',
    searchKeywords: 'school mark list table format pdf സ്കൂൾ മാർക്ക് ലിസ്റ്റ് മദ്രസ പരീക്ഷ ടേബിൾ 5B 1ST TERM',
    categoryBadge: '🎓 സ്കൂൾ & മദ്രസ മാർക്ക് ലിസ്റ്റ്',
    category: 'teacher_marklist',
    recipientLine: 'SL.NO | FULL NAME | LAN 1 | LAN 2 | ENG | HIN | MATS | SS | BS | TOTAL | GRADE | RANK',
    subjectLine: '5B 1ST TERM EXAMINATION MARK LIST',
    fullSampleMalayalamText: `ഗവ. എച്ച്.എസ്.എസ് / എ.യു.പി സ്കൂൾ — 1ST TERM EXAMINATION MARK LIST
ക്ലാസ് & ഡിവിഷൻ: 5 B

കോളങ്ങൾ:
SL.NO | FULL NAME | LAN 1 | LAN 2 | ENG | HIN | MATS | SS | BS | AR | WE | HE | TOTAL | % | GRADE | RANK

✓ മാർക്കുകൾ ടൈപ്പ് ചെയ്യുമ്പോൾ ആകെ മാർക്കും (TOTAL), ശതമാനവും (%), ഗ്രേഡും (A+, A, B+), റാങ്കും (RANK) തനിയെ കണക്കാക്കുന്നു!
✓ പ്രിന്റ് എടുക്കാനും രക്ഷിതാക്കളുടെ WhatsApp ഗ്രൂപ്പിൽ പങ്കുവെക്കാനും പാകത്തിലുള്ള A4 PDF ആയി ഡൗൺലോഡ് ചെയ്യാം.`,
    linkedTemplateId: 'tpl-marklist-up-hs',
  },
];

const GEO_QA_ITEMS = [
  {
    q: '1. മലയാളത്തിൽ അപേക്ഷ ഉണ്ടാക്കാൻ സൈറ്റ് / പഞ്ചായത്ത് അപേക്ഷ എഴുതാൻ ഓൺലൈൻ വഴി 10 സെക്കൻഡിൽ എങ്ങനെ അപേക്ഷ തയ്യാറാക്കാം?',
    a: 'പൂരിപ്പിക്കൽ അപേക്ഷ ഡെസ്ക് (Poorippikkal Apekshadesk / പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക്) തുറന്ന് മുകളിലെ മൈക്ക് ബട്ടൺ അമർത്തി നിങ്ങളുടെ ആവശ്യം (ഉദാഹരണത്തിന്: മരം മുറിക്കാൻ പഞ്ചായത്ത് സെക്രട്ടറിക്ക് അപേക്ഷ, വില്ലേജ് ഓഫീസിലേക്ക് വരുമാന സർട്ടിഫിക്കറ്റ് അപേക്ഷ, KSEB പരാതി) മലയാളത്തിൽ പറഞ്ഞാൽ മതി. ചില്ലക്ഷരങ്ങൾ ഉടയാത്ത കൃത്യമായ ഔദ്യോഗിക A4 PDF 10 സെക്കൻഡിൽ ഫോണിലേക്ക് ഡൗൺലോഡ് ചെയ്യാം.',
  },
  {
    q: '2. മരം മുറിക്കാൻ പഞ്ചായത്ത് സെക്രട്ടറിക്ക് കൊടുക്കേണ്ട അപേക്ഷ എങ്ങനെ എഴുതാം?',
    a: 'മുകളിലെ "55+ സൗജന്യ അപേക്ഷാ മാതൃകകൾ" എന്ന വിഭാഗത്തിൽ മരം മുറിക്കാനുള്ള അപേക്ഷയുടെ പൂർണ്ണമായ മലയാളം മാതൃക സൗജന്യമായി വായിക്കാം. തുടർന്ന് പച്ച ബട്ടൺ അമർത്തി നിങ്ങളുടെ പേരും വിലാസവും മൈക്കിൽ പറഞ്ഞാൽ പ്രിന്റ് എടുക്കാൻ പാകത്തിലുള്ള A4 PDF ഡൗൺലോഡ് ചെയ്യാം.',
  },
  {
    q: '3. Malayalam vadaka kararu format (11 മാസത്തെ വാടക കരാർ ഫോർമാറ്റ് മലയാളം PDF) ഫോണിൽ എങ്ങനെ തയ്യാറാക്കാം?',
    a: 'Select the "വാടക കരാർ (Malayalam Vadaka Kararu Format)" tab on Poorippikkal Apekshadesk (പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക്). Speak or type the Building Owner (1st Party), Tenant (2nd Party), monthly rent, and security advance. The app automatically formats a legal 11-month Kerala rental agreement with 3.5-inch or 4.5-inch top blank space for ₹200 Stamp Paper printing.',
  },
  {
    q: '4. Best Gulf CV maker in Kerala for Visit Visa holders (Driver, Sales, Accountant, Nurse, Cook)?',
    a: 'നിങ്ങളുടെ വിവരങ്ങൾ മലയാളത്തിൽ പറഞ്ഞാൽ പോലും ഗൾഫ് കമ്പനികൾ വിളിക്കുന്ന 1-പേജ് ഇംഗ്ലീഷ് ATS Gulf CV (പാസ്പോർട്ട് ഫോട്ടോ സഹിതം) 10 സെക്കൻഡിൽ തയ്യാറാക്കി A4 PDF ആയി വാട്സാപ്പിലേക്ക് എടുക്കാം.',
  },
  {
    q: '5. സ്കൂൾ / മദ്രസ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് ടേബിൾ ഫോണിൽ എങ്ങനെ A4 PDF ആക്കാം?',
    a: 'സ്കൂൾ-മദ്രസ പരീക്ഷകൾക്കായി 5B 1ST TERM മാതൃകയിലുള്ള (SL.NO, FULL NAME, LAN 1, LAN 2, ENG, HIN, MATS, SS, BS, TOTAL, Grade, Rank) മാർക്ക് ലിസ്റ്റ് ജനറേറ്ററിൽ മാർക്കുകൾ നൽകിയാൽ Total, %, Grade, Rank എന്നിവ തനിയെ കണക്കാക്കി A4 PDF ആയി ഡൗൺലോഡ് ചെയ്യാം.',
  },
];

interface FreemiumSampleLibraryAndGeoSectionProps {
  ownerConfig: OwnerBusinessConfig;
  onSelectTemplate: (tpl: QuickTemplateItem) => void;
  onRunCustomSamplePrompt: (prompt: string, category: DocumentCategory) => void;
  onShowToast: (msg: string) => void;
}

export const FreemiumSampleLibraryAndGeoSection: React.FC<
  FreemiumSampleLibraryAndGeoSectionProps
> = ({ ownerConfig, onSelectTemplate, onRunCustomSamplePrompt, onShowToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSample, setSelectedSample] = useState<CuratedFreemiumSample | null>(null);
  const [copiedForwardMsg, setCopiedForwardMsg] = useState(false);

  // Merge featured detailed samples with all remaining QUICK_TEMPLATES so users have 55+ searchable samples
  const allSamples = useMemo<CuratedFreemiumSample[]>(() => {
    const existingTplIds = new Set(
      FEATURED_CURATED_SAMPLES.map((s) => s.linkedTemplateId).filter(Boolean)
    );

    const extraFromQuickTemplates: CuratedFreemiumSample[] = QUICK_TEMPLATES.filter(
      (tpl) => !existingTplIds.has(tpl.id)
    ).map((tpl, idx) => ({
      id: `sample-extra-${tpl.id}`,
      titleMalayalam: `${FEATURED_CURATED_SAMPLES.length + idx + 1}. ${tpl.titleMalayalam}`,
      searchKeywords: `${tpl.titleMalayalam} ${tpl.subtitleMalayalam} ${tpl.subGroup} ${tpl.sampleVoicePrompt}`,
      categoryBadge: tpl.subGroup,
      category: tpl.category,
      recipientLine: tpl.subtitleMalayalam,
      subjectLine: `വിഷയം: ${tpl.titleMalayalam} സംബന്ധിച്ച ഔദ്യോഗിക മാതൃക.`,
      fullSampleMalayalamText: `മാതൃക: ${tpl.titleMalayalam} (${tpl.subtitleMalayalam})\n\n${tpl.sampleVoicePrompt}\n\n(താഴെയുള്ള പച്ച ബട്ടൺ അമർത്തി നിങ്ങളുടെ പേരും വിലാസവും ചേർത്താൽ 10 സെക്കൻഡിൽ പൂർണ്ണമായ A4 PDF ലഭിക്കും!)`,
      linkedTemplateId: tpl.id,
    }));

    return [...FEATURED_CURATED_SAMPLES, ...extraFromQuickTemplates];
  }, []);

  const filteredSamples = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSamples;
    return allSamples.filter(
      (s) =>
        s.titleMalayalam.toLowerCase().includes(q) ||
        s.searchKeywords.toLowerCase().includes(q) ||
        s.categoryBadge.toLowerCase().includes(q) ||
        s.fullSampleMalayalamText.toLowerCase().includes(q)
    );
  }, [allSamples, searchQuery]);

  const getPriceForCategory = (cat: DocumentCategory) => {
    if (ownerConfig.freeModeEnabled) return 0;
    if (cat === 'gulf_cv') return ownerConfig.pricing.gulf_cv || 5;
    if (cat === 'rental_agreement') return ownerConfig.pricing.rental_agreement || 5;
    if (cat === 'teacher_marklist') return ownerConfig.pricing.teacher_marklist || 5;
    return ownerConfig.pricing.malayalam_letter || 5;
  };

  const handleConvertSampleToPdf = (sample: CuratedFreemiumSample) => {
    setSelectedSample(null);
    if (sample.linkedTemplateId) {
      const matched = QUICK_TEMPLATES.find((t) => t.id === sample.linkedTemplateId);
      if (matched) {
        onSelectTemplate(matched);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    if (sample.customPromptToLoad) {
      onRunCustomSamplePrompt(sample.customPromptToLoad, sample.category);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const publicSiteUrl =
    (ownerConfig.customDomainUrl || '').trim().replace(/\/+$/, '') ||
    window.location.origin.replace('ais-dev-', 'ais-pre-');

  const viralForwardMessage = `📌 സാധാരണക്കാർക്ക് ഉപകാരപ്രദമായ വിവരം — സേവ് ചെയ്തു വെക്കുക:\n\nവില്ലേജ് ഓഫീസ്, പഞ്ചായത്ത്, KSEB, പോലീസ് സ്റ്റേഷൻ, ബാങ്ക് എന്നിവിടങ്ങളിലേക്ക് മലയാളത്തിൽ അപേക്ഷ എഴുതാൻ ഇനി ആരുടെയും പുറകെ നടക്കേണ്ടതില്ല.\n\nഫോണിൽ മലയാളത്തിൽ കാര്യം പറഞ്ഞാൽ 10 സെക്കൻഡിൽ 55+ ഔദ്യോഗിക അപേക്ഷകളും, വാടക കരാറും, പ്രവാസി ഗൾഫ് ബയോഡാറ്റയും, സ്കൂൾ-മദ്രസ മാർക്ക് ലിസ്റ്റും A4 PDF ആയി തയ്യാറാക്കി തരുന്ന സംവിധാനം (പൂരിപ്പിക്കൽ അപേക്ഷ ഡെസ്ക് / പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക് | Poorippikkal Apekshadesk):\n👉 ${publicSiteUrl}\n\n(മറ്റുള്ളവർക്കും ഉപകാരപ്പെടാൻ ഷെയർ ചെയ്യുക)`;

  return (
    <div className="no-print mt-6 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* =====================================================================
          0. ZERO-SERVER-STORAGE PRIVACY & SECURITY ASSURANCE BANNER
         ===================================================================== */}
      <div className="bg-emerald-950/90 border border-emerald-500/40 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-malayalam text-emerald-100 shadow-md">
        <div className="flex items-start sm:items-center gap-2">
          <span className="text-base shrink-0">🔒</span>
          <span>
            <strong className="text-amber-300">100% സ്വകാര്യത ഉറപ്പ് (Zero Server Data Storage):</strong>{' '}
            നിങ്ങൾ നൽകുന്ന പേര്, വിലാസം, ഫോൺ നമ്പർ, സ്വത്ത് വിവരങ്ങൾ, മാർക്ക് ലിസ്റ്റ് എന്നിവയൊന്നും സെർവറിൽ സേവ് ചെയ്യുന്നില്ല. PDF നിങ്ങളുടെ ഫോണിൽ/ബ്രൗസറിൽ മാത്രം തയ്യാറാക്കപ്പെടുന്നു.
          </span>
        </div>
        <a
          href="/about-privacy-disclaimer.html"
          className="text-amber-300 hover:text-amber-200 underline font-extrabold shrink-0"
        >
          സ്വകാര്യതാ നയം &amp; നിരാകരണം →
        </a>
      </div>

      {/* =====================================================================
          1. FREEMIUM SAMPLE LIBRARY (55+ FREE KERALA OFFICIAL APPLICATION SAMPLES)
         ===================================================================== */}
      <section
        id="freemium-sample-library"
        aria-label="55+ സൗജന്യ അപേക്ഷാ മാതൃകകൾ"
        className="bg-white border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3.5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-malayalam font-extrabold text-emerald-800">
              <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>100% സൗജന്യമായി വായിക്കാം · ഇഷ്ടപ്പെട്ടാൽ 10 സെക്കൻഡിൽ സ്വന്തം PDF ആക്കാം</span>
            </div>
            <h2 className="font-malayalam font-black text-base sm:text-xl text-slate-900">
              📚 55+ സൗജന്യ അപേക്ഷാ മാതൃകകൾ (Free Kerala Official Application Samples)
            </h2>
            <p className="font-malayalam text-xs text-slate-600">
              മരം മുറിക്കൽ, വരുമാന സർട്ടിഫിക്കറ്റ്, കൈവശാവകാശം, പോക്കുവരവ്, റേഷൻ കാർഡ്, KSEB പോസ്റ്റ് മാറ്റൽ, പോലീസ് പരാതി, രാജിക്കത്ത്, വാടക കരാർ, ഗൾഫ് CV മാതൃകകൾ സൗജന്യമായി വായിച്ചു നോക്കാം:
            </p>
          </div>

          {/* Search inside Sample Library */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="മാതൃക തിരയുക (മരം, വരുമാനം, വാടക, CV...)"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white text-slate-900 font-malayalam text-xs sm:text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Programmatic SEO Searchable Directory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[540px] overflow-y-auto pr-1">
          {filteredSamples.map((sample) => {
            const price = getPriceForCategory(sample.category);
            return (
              <article
                key={sample.id}
                className="bg-slate-50/90 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-500 rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-malayalam text-slate-500">
                    <span className="font-bold text-emerald-800">{sample.categoryBadge}</span>
                    <span>·</span>
                    <span className="font-bold text-amber-700">
                      {price === 0 ? '🎁 സൗജന്യം (FREE)' : `മാതൃക വായന സൗജന്യം · PDF ₹${price}`}
                    </span>
                  </div>

                  <h3 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                    {sample.titleMalayalam}
                  </h3>

                  <p className="font-malayalam text-[11px] text-slate-600 line-clamp-3 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                    {sample.fullSampleMalayalamText}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSample(sample)}
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-malayalam font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>📖 പൂർണ്ണമായ മാതൃക വായിക്കുക</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConvertSampleToPdf(sample)}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-malayalam font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>
                      {price === 0
                        ? '✍️ എന്റെ പേരും വിലാസവും ചേർത്ത് A4 PDF ആക്കുക (സൗജന്യം)'
                        : `✍️ എന്റെ പേരും വിലാസവും ചേർത്ത് 10 സെക്കൻഡിൽ A4 PDF ആക്കുക (₹${price} മാത്രം)`}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          2. MULTI-FILE CART DISCOUNT CARD & WHATSAPP HELPFUL FORWARD CARD
         ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Multi-Document Cart Highlight (Shows 30% Discount ONLY when Paid Mode is ON) */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-md">
          <div className="space-y-1.5">
            <span className="text-xs font-malayalam font-black text-amber-900">
              {ownerConfig.freeModeEnabled
                ? '🛒 മൾട്ടി-ഫയൽ PDF കാർട്ട് (ഒരുമിച്ച് സൗജന്യ ഡൗൺലോഡ്)'
                : '🛒 മൾട്ടി-ഫയൽ PDF കാർട്ട് ഓഫർ (30% വരെ കിഴിവ്)'}
            </span>
            <h3 className="font-malayalam font-black text-sm sm:text-base text-slate-900">
              {ownerConfig.freeModeEnabled
                ? 'ഒന്നിലധികം അപേക്ഷകളും ഫോമുകളും ഒരുമിച്ച് കാർട്ടിലിട്ട് ഒറ്റ ക്ലിക്കിൽ A4 PDF എടുക്കാം!'
                : 'ഒന്നിലധികം അപേക്ഷകളും ഫോമുകളും ഒരുമിച്ച് കാർട്ടിലിട്ട് ഒറ്റ തവണ പേയ്‌മെന്റിൽ A4 PDF എടുക്കാം!'}
            </h3>
            <p className="font-malayalam text-xs text-slate-700 leading-relaxed">
              {ownerConfig.freeModeEnabled
                ? 'അപേക്ഷകൾ, വാടക കരാർ, ഗൾഫ് CV, സ്കൂൾ-മദ്രസ മാർക്ക് ലിസ്റ്റ് എന്നിവയിൽ നിന്ന് 10 ഫയലുകൾ വരെ കാർട്ടിലേക്ക് ചേർത്ത് ഒരുമിച്ച് സൗജന്യമായി A4 PDF ഡൗൺലോഡ് ചെയ്യാം.'
                : 'അപേക്ഷകൾ, വാടക കരാർ, ഗൾഫ് CV, സ്കൂൾ-മദ്രസ മാർക്ക് ലിസ്റ്റ് എന്നിവയിൽ നിന്ന് 10 ഫയലുകൾ വരെ കാർട്ടിലേക്ക് ചേർത്ത് ഒരുമിച്ച് ഡൗൺലോഡ് ചെയ്യുമ്പോൾ 30% വരെ പ്രത്യേക കിഴിവ് ലഭിക്കുന്നു.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-malayalam font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✍️ ഇപ്പോൾ അപേക്ഷ / ഫോം തയ്യാറാക്കാൻ തുടങ്ങുക</span>
          </button>
        </div>

        {/* Helpful Public Info WhatsApp Forward Box */}
        <div className="bg-emerald-950 text-white border border-emerald-700 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-md">
          <div className="space-y-1.5">
            <span className="text-xs font-malayalam font-black text-amber-300">
              📲 കുടുംബ ഗ്രൂപ്പുകളിലും റസിഡന്റ്സ് ഗ്രൂപ്പുകളിലും ഷെയർ ചെയ്യാം
            </span>
            <h3 className="font-malayalam font-black text-sm sm:text-base text-white">
              &ldquo;സാധാരണക്കാർക്ക് ഉപകാരപ്രദമായ വിവരം&rdquo; — ഒറ്റ ക്ലിക്കിൽ വാട്സാപ്പിൽ ഫോർവേഡ് ചെയ്യുക
            </h3>
            <p className="font-malayalam text-[11px] text-emerald-200 leading-relaxed line-clamp-3">
              വില്ലേജ് ഓഫീസ്, പഞ്ചായത്ത്, KSEB, പോലീസ് സ്റ്റേഷൻ, ബാങ്ക് എന്നിവിടങ്ങളിലേക്ക് മലയാളത്തിൽ അപേക്ഷ എഴുതാൻ ഇനി ആരുടെയും പുറകെ നടക്കേണ്ടതില്ല. ഫോണിൽ മലയാളത്തിൽ കാര്യം പറഞ്ഞാൽ 10 സെക്കൻഡിൽ A4 PDF റെഡി!
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(viralForwardMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-emerald-400 text-slate-950 font-malayalam font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>വാട്സാപ്പ് ഗ്രൂപ്പുകളിൽ ഷെയർ ചെയ്യുക</span>
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(viralForwardMessage);
                setCopiedForwardMsg(true);
                onShowToast('✓ വാട്സാപ്പ് സന്ദേശം കോപ്പി ചെയ്തു!');
                setTimeout(() => setCopiedForwardMsg(false), 2500);
              }}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-malayalam font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              {copiedForwardMsg ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>കോപ്പി ആയി</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-300" />
                  <span>കോപ്പി</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. OFFICIAL MALAYALAM DTP FAQ & VERIFIED SECURITY / ARCHITECTURE SUMMARY
         ===================================================================== */}
      <section
        id="ai-directory-summary"
        className="bg-white border border-slate-300 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-malayalam font-extrabold text-emerald-800">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>പൊതുജന സംശയങ്ങളും ഉത്തരങ്ങളും (Official DTP &amp; Form Guide)</span>
          </div>
          <h2 className="font-malayalam font-black text-sm sm:text-lg text-slate-900">
            സാധാരണക്കാർ ചോദിക്കുന്ന പ്രധാന ചോദ്യങ്ങളും ഉത്തരങ്ങളും (Malayalam &amp; Manglish FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {GEO_QA_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5"
            >
              <h3 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                {item.q}
              </h3>
              <p className="font-malayalam text-xs text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>

        {/* Verified Engineering Architecture, GitHub CodeQL Security Audit, Blank Form Mode & Privacy Policy */}
        <div className="pt-3 border-t border-slate-200 text-[11px] font-malayalam text-slate-600 space-y-2.5">
          <p className="font-bold text-slate-800">
            ഔദ്യോഗിക സാങ്കേതിക വിവരണം (Verified Engineering &amp; Security Summary — പൂരിപ്പിക്കൽ അപേക്ഷ ഡെസ്ക് / Poorippikkal Apekshadesk):
          </p>
          <p className="leading-relaxed">
            <strong>100% ഓപ്ഷണൽ വ്യക്തിഗത വിവരങ്ങൾ (Blank Form Print Mode):</strong> പേരോ വിലാസമോ ഫോൺ നമ്പറോ ടൈപ്പ് ചെയ്യാൻ താല്പര്യമില്ലാത്തവർക്ക് ഒരു വിവരവും നൽകാതെ തന്നെ <strong>"📝 കാലി ഫോം (പേന കൊണ്ട് എഴുതാൻ)"</strong> ബട്ടൺ അമർത്തി നേരിട്ട് A4 PDF പ്രിന്റ് എടുക്കാം! ·{' '}
            <strong>സാങ്കേതിക വിദ്യ (100% Client-Side Malayalam DTP Engine):</strong> ഇന്റർനെറ്റ് ഓഫ് ചെയ്തും (Airplane Mode) പ്രവർത്തിക്കുന്ന ലോക്കൽ <code>jsPDF</code> എഞ്ചിൻ ·{' '}
            <strong>പ്രസാധക വിവരങ്ങൾ (Verified Publisher):</strong> താജുദ്ദീൻ തോട്ടത്തിൽ (Thajudheen Thottathil, Kolari, Kannur District, Kerala - PIN: 670702 | ഇമെയിൽ: thajukolari786@gmail.com) ·{' '}
            <strong>GitHub Official CodeQL &amp; Security Audit:</strong>{' '}
            <a
              href="https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/blob/main/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-emerald-800"
            >
              SECURITY.md &amp; Automated Code Audit
            </a>
            .
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 text-[11px] text-slate-700">
            <p className="font-bold text-slate-900">
              🛡️ സുരക്ഷാ സാക്ഷ്യപത്രവും ഔദ്യോഗിക നിരാകരണവും (GitHub CodeQL Audited, 100% Optional Details &amp; Offline-Capable):
            </p>
            <p className="leading-relaxed">
              ഈ വെബ് ആപ്ലിക്കേഷൻ (<strong>poorippikkal-apekshadesk.vercel.app</strong>) കേരള സർക്കാരിന്റെയോ, e-District പോർട്ടലിന്റെയോ, അക്ഷയ കേന്ദ്രങ്ങളുടെയോ ഔദ്യോഗിക വെബ്‌സൈറ്റ് <strong>അല്ല</strong>. സർക്കാർ ഓഫീസുകളിലും അക്ഷയ കേന്ദ്രങ്ങളിലും സമർപ്പിക്കേണ്ട വെള്ളക്കടലാസ് അപേക്ഷാ കത്തുകൾ (White-Paper Petitions), 11 മാസത്തെ വാടക കരാർ ഡ്രാഫ്റ്റുകൾ, ബയോഡാറ്റ (CV), സ്കൂൾ മാർക്ക് ലിസ്റ്റുകൾ എന്നിവ മലയാളത്തിൽ തെറ്റുകൂടാതെ ടൈപ്പ് ചെയ്ത് A4 PDF പ്രിന്റൗട്ട് എടുക്കാൻ സഹായിക്കുന്ന ഒരു <strong>സ്വതന്ത്ര ഓപ്പൺ സോഴ്സ് ഡി.ടി.പി (DTP) സോഫ്റ്റ്‌വെയർ</strong> ആണ്. <strong>ഇതിൽ പേരോ വിലാസമോ നൽകൽ നിർബന്ധമേയല്ല (100% Optional)</strong> — വിവരങ്ങൾ നൽകാതെ കാലി ഫോം പ്രിന്റ് എടുത്ത് പേന കൊണ്ട് എഴുതി പൂരിപ്പിക്കുകയോ, അല്ലെങ്കിൽ ഫോണിലെ ഇന്റർനെറ്റ് ഓഫ് (Airplane Mode) ചെയ്തുകൊണ്ട് ടൈപ്പ് ചെയ്ത് PDF ഡൗൺലോഡ് ചെയ്യുകയോ ചെയ്യാം.
            </p>
            <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 font-bold text-emerald-800">
              <a href="/village-office-applications-malayalam.html" className="underline hover:text-emerald-600">
                വരുമാന സർട്ടിഫിക്കറ്റ് &amp; വില്ലേജ് അപേക്ഷകൾ
              </a>
              <a href="/panchayat-kseb-applications-malayalam.html" className="underline hover:text-emerald-600">
                മരം മുറിക്കൽ &amp; പഞ്ചായത്ത് അപേക്ഷകൾ
              </a>
              <a href="/rental-agreement-format-malayalam.html" className="underline hover:text-emerald-600">
                11 മാസത്തെ വാടക കരാർ ഫോം
              </a>
              <a href="/school-mark-list-software-kerala.html" className="underline hover:text-emerald-600">
                മാർക്ക് ലിസ്റ്റ് സോഫ്റ്റ്‌വെയർ
              </a>
              <a href="/gulf-cv-biodata-maker-malayalam.html" className="underline hover:text-emerald-600">
                ഗൾഫ് CV &amp; ബയോഡാറ്റ
              </a>
              <a href="/resignation-leave-letter-malayalam.html" className="underline hover:text-emerald-600">
                ജോലി രാജിക്കത്ത് &amp; ലീവ് ലെറ്റർ
              </a>
              <a href="/about-privacy-disclaimer.html" className="underline hover:text-emerald-600">
                About Us, Developer Contact &amp; Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. FREE SAMPLE READER MODAL (WITH HIGH-CONVERTING CTA BUTTON)
         ===================================================================== */}
      {selectedSample && (
        <div
          onClick={() => setSelectedSample(null)}
          className="fixed inset-0 z-[98] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-2 border-emerald-500 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto"
          >
            <div className="px-4 sm:px-6 py-3.5 bg-emerald-950 text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-malayalam font-bold text-amber-300 block">
                  📖 അപേക്ഷാ മാതൃക (Sample Preview)
                </span>
                <h3 className="font-malayalam font-black text-xs sm:text-base text-white truncate">
                  {selectedSample.titleMalayalam}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSample(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs font-malayalam text-amber-950">
                💡 <strong>ഈ അപേക്ഷ പേപ്പറിൽ എഴുതി ബുദ്ധിമുട്ടേണ്ട!</strong> താഴെ കാണുന്ന മാതൃക വായിച്ചു നോക്കിയ ശേഷം പച്ച ബട്ടണിൽ തൊട്ടാൽ നിങ്ങളുടെ പേരും വിലാസവും മൈക്കിൽ പറഞ്ഞ് <strong>10 സെക്കൻഡിൽ പ്രിന്റ് എടുക്കാൻ പാകത്തിലുള്ള A4 PDF</strong> ആക്കി മാറ്റാം!
              </div>

              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 font-malayalam text-xs sm:text-sm text-slate-900 whitespace-pre-wrap leading-relaxed select-text">
                {selectedSample.fullSampleMalayalamText}
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleConvertSampleToPdf(selectedSample)}
                  className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 text-white font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xl"
                >
                  <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                  <span>
                    {getPriceForCategory(selectedSample.category) === 0
                      ? '✍️ എന്റെ പേരും വിലാസവും ചേർത്ത് ഇതേ അപേക്ഷ A4 PDF ആക്കുക (സൗജന്യം)'
                      : `✍️ എന്റെ പേരും വിലാസവും ചേർത്ത് ഇതേ അപേക്ഷ 10 സെക്കൻഡിൽ A4 PDF ആക്കുക (₹${getPriceForCategory(
                          selectedSample.category
                        )} മാത്രം)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
