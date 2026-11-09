export type DocumentCategory =
  | 'malayalam_letter'
  | 'gulf_cv'
  | 'rental_agreement'
  | 'teacher_marklist';

export type DocumentOutputLanguage = 'ml' | 'en' | 'ar' | 'ur' | 'hi' | 'ta';

export interface FollowUpQuestion {
  id: string;
  fieldLabelMalayalam: string;
  questionMalayalam: string;
  quickSuggestions: string[];
  defaultValue?: string;
  structuredFieldId?: string;
}

export interface StructuredFormField {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
}

export interface MalayalamLetterData {
  documentHeading: string; // e.g., "അപേക്ഷ" or "രാജിക്കത്ത്" or "സമ്മതപത്രം" or "സ്കൂൾ പ്രസംഗം"
  letterLayoutVariant?: 'official_letter' | 'school_leave' | 'school_speech' | 'project_cover';
  parentOrGuardianName?: string;
  parentSignatureLabelOverride?: string;
  formCode?: string; // e.g., "e-District Common Form" or "MVD Form 29 & 30"
  portalName?: string;
  portalUrl?: string;
  fromLabelOverride?: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  phoneLabelOverride?: string;
  toLabelOverride?: string;
  recipientTitle: string;
  recipientOffice: string;
  recipientPlace: string;
  subjectLabelOverride?: string;
  subject: string;
  referenceLabelOverride?: string;
  reference: string;
  salutation: string;
  structuredTableHeadingOverride?: string;
  bodyParagraphs: string[];
  closingPhrase: string;
  placeLabelOverride?: string;
  place: string;
  dateLabelOverride?: string;
  date: string;
  signatureLabelOverride?: string;
  enclosuresLabelOverride?: string;
  enclosures: string[];
  structuredFields?: StructuredFormField[];
}

export interface MissingFieldItem {
  key: 'senderName' | 'senderAddress' | 'recipientOffice' | 'subject' | 'firstParty' | 'secondParty' | 'scheduleProperty';
  labelMalayalam: string;
  placeholderMalayalam: string;
  currentValue: string;
}

export function isPlaceholderOrEmpty(val?: string): boolean {
  if (!val || !val.trim()) return true;
  const trimmed = val.trim();
  if (/^ഉദാ\s*:/i.test(trimmed)) return true;
  return /(\[.*?\]|\{.*?\}|XXXX|____|000\s*0000|^n\/?a$)/i.test(trimmed) || trimmed === '...';
}

export function getMissingDocumentFields(
  category: DocumentCategory,
  letterData: MalayalamLetterData,
  agreementData: RentalAgreementData
): MissingFieldItem[] {
  const missing: MissingFieldItem[] = [];

  if (category === 'malayalam_letter') {
    if (
      letterData.letterLayoutVariant === 'school_speech' ||
      letterData.letterLayoutVariant === 'project_cover'
    ) {
      return [];
    }
    if (isPlaceholderOrEmpty(letterData.senderName)) {
      missing.push({
        key: 'senderName',
        labelMalayalam: '1. നിങ്ങളുടെ പേര് (അപേക്ഷകന്റെ / വിദ്യാർത്ഥിയുടെ പേര്)',
        placeholderMalayalam: 'ഇവിടെ നിങ്ങളുടെ പേര് ടൈപ്പ് ചെയ്യുക...',
        currentValue: isPlaceholderOrEmpty(letterData.senderName) ? '' : letterData.senderName,
      });
    }
    if (isPlaceholderOrEmpty(letterData.recipientOffice)) {
      missing.push({
        key: 'recipientOffice',
        labelMalayalam: '2. കമ്പനിയുടെ / സ്ഥാപനത്തിന്റെ / ഓഫീസിന്റെ പേരും സ്ഥലവും',
        placeholderMalayalam: 'ഉദാ: മലബാർ ട്രേഡേഴ്സ്, കൊച്ചി (അല്ലെങ്കിൽ വില്ലേജ് ഓഫീസ് / പഞ്ചായത്ത്)',
        currentValue: isPlaceholderOrEmpty(letterData.recipientOffice)
          ? ''
          : letterData.recipientOffice,
      });
    }
    if (isPlaceholderOrEmpty(letterData.senderAddress)) {
      missing.push({
        key: 'senderAddress',
        labelMalayalam: '3. നിങ്ങളുടെ വിലാസം / ഫോൺ നമ്പർ',
        placeholderMalayalam: 'ഉദാ: കൈതച്ചാൽ വീട്, വാർഡ് 5, തിരുവനന്തപുരം',
        currentValue: isPlaceholderOrEmpty(letterData.senderAddress)
          ? ''
          : letterData.senderAddress,
      });
    }
  } else if (category === 'rental_agreement') {
    if (isPlaceholderOrEmpty(agreementData.firstPartyDetails)) {
      missing.push({
        key: 'firstParty',
        labelMalayalam: '1. ഒന്നാം കക്ഷിയുടെ (ഉടമയുടെ) പേരും വിലാസവും',
        placeholderMalayalam: 'ഉദാ: സുരേഷ് കുമാർ, പുത്തൻപുരയ്ക്കൽ വീട്, ഇടപ്പള്ളി',
        currentValue: isPlaceholderOrEmpty(agreementData.firstPartyDetails)
          ? ''
          : agreementData.firstPartyDetails,
      });
    }
    if (isPlaceholderOrEmpty(agreementData.secondPartyDetails)) {
      missing.push({
        key: 'secondParty',
        labelMalayalam: '2. രണ്ടാം കക്ഷിയുടെ (വാടകക്കാരന്റെ) പേരും വിലാസവും',
        placeholderMalayalam: 'ഉദാ: അനൂപ് ജോസഫ്, വലിയപറമ്പിൽ വീട്, ചാലക്കുടി',
        currentValue: isPlaceholderOrEmpty(agreementData.secondPartyDetails)
          ? ''
          : agreementData.secondPartyDetails,
      });
    }
  }

  return missing;
}

export type DocumentAuditSection =
  | 'sender'
  | 'recipient'
  | 'subject'
  | 'structured_fields'
  | 'body'
  | 'footer_date_place'
  | 'cv_header'
  | 'cv_summary'
  | 'cv_experience'
  | 'cv_footer'
  | 'agreement_header'
  | 'agreement_parties'
  | 'agreement_clauses'
  | 'agreement_schedule'
  | 'marklist_header'
  | 'marklist_rows'
  | 'marklist_footer'
  | 'formatting_overlap';

export type DocumentMistakeCategory =
  | 'missing_pincode'
  | 'mismatched_date'
  | 'formatting_overlap'
  | 'missing_field'
  | 'invalid_contact';

export interface DocumentAuditIssue {
  id: string;
  labelMalayalam: string;
  shortBadgeMalayalam?: string;
  severity: 'warning' | 'info';
  section?: DocumentAuditSection;
  mistakeCategory?: DocumentMistakeCategory;
  fixActionId?: 'set_today_date' | 'enable_autofit' | 'separate_overlaps';
}

export interface PrePrintScanExtraOptions {
  markListData?: TeacherMarkListData;
  overlayItems?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    isWhiteout?: boolean;
  }>;
  measuredSheetHeight?: number;
  autoFitOnePage?: boolean;
}

function parseDateTokens(raw: string): {
  validFormat: boolean;
  day?: number;
  month?: number;
  year?: number;
} {
  const cleaned = (raw || '').trim();
  if (!cleaned) return { validFormat: false };
  // Match DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmy = cleaned.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const validFormat =
      day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1950 && year <= 2100;
    return { validFormat, day, month, year };
  }
  // Match YYYY-MM-DD
  const ymd = cleaned.match(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    const validFormat =
      day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1950 && year <= 2100;
    return { validFormat, day, month, year };
  }
  const yearOnly = cleaned.match(/\b(20\d{2})\b/);
  if (yearOnly) {
    return { validFormat: true, year: Number(yearOnly[1]) };
  }
  return { validFormat: false };
}

function hasValidSixDigitPin(text: string): boolean {
  return /\b[1-9]\d{5}\b/.test(text || '');
}

function hasMistypedPinLength(text: string): boolean {
  // Detects 5-digit or 7-digit numbers starting with 67, 68, 69 (common Kerala PIN typos) without a valid 6-digit PIN
  if (hasValidSixDigitPin(text)) return false;
  return /\b6[789]\d{3}\b|\b6[789]\d{5}\b/.test(text || '');
}

export function auditDocumentReadiness(
  category: DocumentCategory,
  letterData: MalayalamLetterData,
  gulfCvData: GulfCvData,
  agreementData: RentalAgreementData,
  extra?: PrePrintScanExtraOptions
): DocumentAuditIssue[] {
  const issues: DocumentAuditIssue[] = [];
  const currentYear = new Date().getFullYear();

  // 1. Check Custom Floating Overlay Boxes for Formatting Overlaps
  const overlays = extra?.overlayItems || [];
  if (overlays.length > 1) {
    let hasOverlap = false;
    for (let i = 0; i < overlays.length; i++) {
      for (let j = i + 1; j < overlays.length; j++) {
        const a = overlays[i];
        const b = overlays[j];
        const wA = Math.max(80, a.width || 120);
        const hA = Math.max(22, a.height || 26);
        const wB = Math.max(80, b.width || 120);
        const hB = Math.max(22, b.height || 26);
        const intersects =
          a.x < b.x + wB - 8 &&
          a.x + wA - 8 > b.x &&
          a.y < b.y + hB - 4 &&
          a.y + hA - 4 > b.y;
        if (intersects) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap) break;
    }
    if (hasOverlap) {
      issues.push({
        id: 'overlayOverlap',
        shortBadgeMalayalam: 'എഴുത്തുകൾ തമ്മിൽ കയറുന്നു (Overlap)',
        labelMalayalam:
          'പേപ്പറിൽ ചേർത്ത 2 എഴുത്ത് ബോക്സുകൾ തമ്മിൽ കയറിക്കിടക്കുന്നുണ്ട് (Formatting Overlap)',
        severity: 'warning',
        section: 'formatting_overlap',
        mistakeCategory: 'formatting_overlap',
        fixActionId: 'separate_overlaps',
      });
    }
  }

  if (category === 'malayalam_letter') {
    const isCoverOrSpeech =
      letterData.letterLayoutVariant === 'project_cover' ||
      letterData.letterLayoutVariant === 'school_speech';
    const isSchoolLeave = letterData.letterLayoutVariant === 'school_leave';

    if (isPlaceholderOrEmpty(letterData.senderName)) {
      issues.push({
        id: 'senderName',
        shortBadgeMalayalam: 'പേര് ചേർത്തിട്ടില്ല',
        labelMalayalam: 'അപേക്ഷകന്റെ പേര് ചേർത്തിട്ടില്ല',
        severity: 'warning',
        section: 'sender',
        mistakeCategory: 'missing_field',
      });
    }
    if (!isCoverOrSpeech && isPlaceholderOrEmpty(letterData.recipientOffice)) {
      issues.push({
        id: 'recipientOffice',
        shortBadgeMalayalam: 'ഓഫീസ് പേര് അപൂർണ്ണം',
        labelMalayalam: 'സ്വീകരിക്കുന്ന ഓഫീസ് / സ്ഥാപനത്തിന്റെ പേര് അപൂർണ്ണമാണ്',
        severity: 'warning',
        section: 'recipient',
        mistakeCategory: 'missing_field',
      });
    }
    if (!isCoverOrSpeech && isPlaceholderOrEmpty(letterData.senderAddress)) {
      issues.push({
        id: 'senderAddress',
        shortBadgeMalayalam: 'വിലാസം അപൂർണ്ണം',
        labelMalayalam: 'വിലാസം / ഫോൺ നമ്പർ ചേർത്തിട്ടില്ല',
        severity: 'warning',
        section: 'sender',
        mistakeCategory: 'missing_field',
      });
    } else if (!isCoverOrSpeech && !isSchoolLeave && letterData.senderAddress.trim().length > 4) {
      // Pre-Print PIN Code Check on Sender Address
      const combinedAddr = `${letterData.senderAddress} ${letterData.place || ''}`;
      if (hasMistypedPinLength(combinedAddr)) {
        issues.push({
          id: 'senderPinTypo',
          shortBadgeMalayalam: 'പിൻകോഡ് 6 അക്കമല്ല!',
          labelMalayalam:
            'വിലാസത്തിലെ പിൻകോഡ് (PIN Code) 6 അക്കമല്ല — പ്രിന്റ് എടുക്കും മുമ്പ് പരിശോധിക്കുക',
          severity: 'warning',
          section: 'sender',
          mistakeCategory: 'missing_pincode',
        });
      } else if (!hasValidSixDigitPin(combinedAddr)) {
        issues.push({
          id: 'senderPinMissing',
          shortBadgeMalayalam: 'പിൻകോഡ് (PIN) ഇല്ല',
          labelMalayalam:
            'അപേക്ഷകന്റെ വിലാസത്തിൽ 6 അക്ക പിൻകോഡ് (ഉദാ: 676xxx / 682xxx / 695xxx) ചേർത്തിട്ടില്ല',
          severity: 'info',
          section: 'sender',
          mistakeCategory: 'missing_pincode',
        });
      }
    }

    // Phone number digit validation
    if (letterData.senderPhone && letterData.senderPhone.trim().length > 0) {
      const digitsOnly = letterData.senderPhone.replace(/\D/g, '');
      if (
        (digitsOnly.length > 0 && digitsOnly.length < 10) ||
        digitsOnly.length > 13 ||
        letterData.senderPhone.includes('[')
      ) {
        issues.push({
          id: 'senderPhoneInvalid',
          shortBadgeMalayalam: 'ഫോൺ നമ്പർ തെറ്റാണ്',
          labelMalayalam: 'ഫോൺ നമ്പറിൽ 10 അക്കങ്ങൾ ഉണ്ടെന്ന് ഉറപ്പാക്കുക',
          severity: 'warning',
          section: 'sender',
          mistakeCategory: 'invalid_contact',
        });
      }
    }

    // Unfilled Brackets Check in Subject, Structured Fields, and Body
    if (letterData.subject.includes('[') && letterData.subject.includes(']')) {
      issues.push({
        id: 'subjectBrackets',
        shortBadgeMalayalam: 'വിഷയം അപൂർണ്ണം [...]',
        labelMalayalam: 'വിഷയത്തിൽ [...] എന്ന് പൂരിപ്പിക്കാനുള്ള ഭാഗം ബാക്കിയുണ്ട്',
        severity: 'warning',
        section: 'subject',
        mistakeCategory: 'missing_field',
      });
    }

    const hasBracketInStructured = (letterData.structuredFields || []).some(
      (f) => (f.value || '').includes('[') && (f.value || '').includes(']')
    );
    if (hasBracketInStructured) {
      issues.push({
        id: 'structuredBrackets',
        shortBadgeMalayalam: 'പട്ടികയിൽ [...] ബാക്കിയുണ്ട്',
        labelMalayalam: 'അപേക്ഷാ വിവര പട്ടികയിൽ പൂരിപ്പിക്കാനുള്ള [...] ഭാഗങ്ങൾ ബാക്കിയുണ്ട്',
        severity: 'warning',
        section: 'structured_fields',
        mistakeCategory: 'missing_field',
      });
    }

    const hasBracketInBody = (letterData.bodyParagraphs || []).some(
      (p) => p.includes('[') && p.includes(']')
    );
    if (hasBracketInBody) {
      issues.push({
        id: 'brackets',
        shortBadgeMalayalam: 'കത്തിൽ [...] പൂരിപ്പിക്കാനുണ്ട്',
        labelMalayalam: 'കത്തിനുള്ളിൽ [...] എന്ന് പൂരിപ്പിക്കാനുള്ള ഭാഗങ്ങൾ ബാക്കിയുണ്ട്',
        severity: 'warning',
        section: 'body',
        mistakeCategory: 'missing_field',
      });
    }

    // Mismatched / Invalid Date Check in Letter Footer vs Body
    const parsedFooterDate = parseDateTokens(letterData.date);
    if (!letterData.date || !letterData.date.trim() || letterData.date.includes('[')) {
      issues.push({
        id: 'letterDateMissing',
        shortBadgeMalayalam: 'തീയതി ചേർത്തിട്ടില്ല',
        labelMalayalam: 'അപേക്ഷയിൽ തീയതി (Date) ചേർത്തിട്ടില്ല',
        severity: 'warning',
        section: 'footer_date_place',
        mistakeCategory: 'mismatched_date',
        fixActionId: 'set_today_date',
      });
    } else if (!parsedFooterDate.validFormat) {
      issues.push({
        id: 'letterDateInvalid',
        shortBadgeMalayalam: 'തീയതി ഫോർമാറ്റ് തെറ്റാണ്',
        labelMalayalam: `തീയതി (${letterData.date}) ശരിയായ DD/MM/YYYY രീതിയിലല്ല`,
        severity: 'warning',
        section: 'footer_date_place',
        mistakeCategory: 'mismatched_date',
        fixActionId: 'set_today_date',
      });
    } else {
      // Check if year is outdated or far in future, or mismatches dates in body paragraphs
      const footerYear = parsedFooterDate.year;
      if (footerYear && (footerYear < currentYear - 1 || footerYear > currentYear + 1)) {
        issues.push({
          id: 'letterDateYearMismatch',
          shortBadgeMalayalam: `തീയതി വർഷം (${footerYear}) പരിശോധിക്കുക`,
          labelMalayalam: `തീയതിയിലെ വർഷം (${footerYear}) നിലവിലെ വർഷവുമായി പൊരുത്തപ്പെടുന്നില്ല`,
          severity: 'warning',
          section: 'footer_date_place',
          mistakeCategory: 'mismatched_date',
          fixActionId: 'set_today_date',
        });
      } else {
        // Check if body paragraphs contain an explicit DD/MM/YYYY date that is in the future relative to footer date (for non-leave letters)
        const bodyText = (letterData.bodyParagraphs || []).join(' ');
        const bodyDateMatches = Array.from(
          bodyText.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/g)
        );
        if (
          !isSchoolLeave &&
          bodyDateMatches.length > 0 &&
          parsedFooterDate.day &&
          parsedFooterDate.month &&
          parsedFooterDate.year
        ) {
          const footerTime = new Date(
            parsedFooterDate.year,
            parsedFooterDate.month - 1,
            parsedFooterDate.day
          ).getTime();
          for (const m of bodyDateMatches) {
            const bDay = Number(m[1]);
            const bMonth = Number(m[2]);
            const bYear = Number(m[3]);
            if (bMonth > 12 || bDay > 31) {
              issues.push({
                id: 'bodyInvalidDate',
                shortBadgeMalayalam: 'കത്തിലെ തീയതി തെറ്റാണ്',
                labelMalayalam: `കത്തിനുള്ളിലെ തീയതി (${m[0]}) കലണ്ടർ പ്രകാരം തെറ്റാണ്`,
                severity: 'warning',
                section: 'body',
                mistakeCategory: 'mismatched_date',
              });
              break;
            }
            const bodyTime = new Date(bYear, bMonth - 1, bDay).getTime();
            // If body mentions a year that differs by more than 1 year or conflicts with footer date
            if (Math.abs(bYear - parsedFooterDate.year) >= 2 && bYear >= 2020) {
              issues.push({
                id: 'bodyFooterDateMismatch',
                shortBadgeMalayalam: 'തീയതികൾ തമ്മിൽ പൊരുത്തക്കേട്',
                labelMalayalam: `കത്തിനുള്ളിലെ തീയതിയും (${m[0]}) താഴെയുള്ള തീയതിയും (${letterData.date}) തമ്മിൽ വ്യത്യാസമുണ്ട്`,
                severity: 'info',
                section: 'footer_date_place',
                mistakeCategory: 'mismatched_date',
              });
              break;
            }
            void footerTime;
            void bodyTime;
          }
        }
      }
    }

    // Formatting overlap / overflow check for long letters
    const totalChars =
      (letterData.bodyParagraphs || []).join(' ').length +
      (letterData.structuredFields || []).map((f) => `${f.label} ${f.value}`).join(' ').length;
    if (
      totalChars > 1350 ||
      (extra?.measuredSheetHeight && extra.measuredSheetHeight > 1165 && !extra.autoFitOnePage)
    ) {
      issues.push({
        id: 'letterPageOverflow',
        shortBadgeMalayalam: 'ഒറ്റ പേജിൽ കവിയാൻ സാധ്യത',
        labelMalayalam:
          'വാചകങ്ങൾ കൂടുതലായതിനാൽ പ്രിന്റ് എടുക്കുമ്പോൾ വരികൾ മുറിയാതിരിക്കാൻ Auto-Fit ഓൺ ചെയ്യാം',
        severity: 'info',
        section: 'formatting_overlap',
        mistakeCategory: 'formatting_overlap',
        fixActionId: 'enable_autofit',
      });
    }
  } else if (category === 'gulf_cv') {
    if (isPlaceholderOrEmpty(gulfCvData.fullName)) {
      issues.push({
        id: 'cvName',
        shortBadgeMalayalam: 'പേര് ചേർത്തിട്ടില്ല',
        labelMalayalam: 'CV-യിൽ പേര് (Full Name) ചേർത്തിട്ടില്ല',
        severity: 'warning',
        section: 'cv_header',
        mistakeCategory: 'missing_field',
      });
    }
    if (isPlaceholderOrEmpty(gulfCvData.phone) || gulfCvData.phone.includes('000 0000')) {
      issues.push({
        id: 'cvPhone',
        shortBadgeMalayalam: 'ഫോൺ നമ്പർ പരിശോധിക്കുക',
        labelMalayalam: 'ശരിയായ മൊബൈൽ / വാട്സാപ്പ് നമ്പർ പരിശോധിക്കുക',
        severity: 'warning',
        section: 'cv_header',
        mistakeCategory: 'invalid_contact',
      });
    }
    const isGulfOrVisaCv =
      /dubai|uae|saudi|qatar|oman|kuwait|bahrain|gulf|gcc|visit visa|employment visa/i.test(
        `${gulfCvData.currentLocation} ${gulfCvData.visaStatus}`
      );
    if (
      isGulfOrVisaCv &&
      isPlaceholderOrEmpty(gulfCvData.passportNumber) &&
      gulfCvData.passportNumber !== '-'
    ) {
      issues.push({
        id: 'cvPassport',
        shortBadgeMalayalam: 'പാസ്പോർട്ട് നമ്പർ ചേർക്കാം',
        labelMalayalam: 'വിദേശ CV-യിൽ പാസ്പോർട്ട് നമ്പർ ചേർത്തിട്ടില്ല (ആവശ്യമെങ്കിൽ ചേർക്കുക)',
        severity: 'info',
        section: 'cv_header',
        mistakeCategory: 'missing_field',
      });
    }

    // Check Work Experience for Mismatched Dates (e.g., start year > end year)
    for (const exp of gulfCvData.workExperience || []) {
      const years = Array.from((exp.duration || '').matchAll(/\b(19\d{2}|20\d{2})\b/g)).map((m) =>
        Number(m[1])
      );
      if (years.length >= 2 && years[0] > years[1]) {
        issues.push({
          id: 'cvExpDateMismatch',
          shortBadgeMalayalam: `വർഷം ക്രമം തെറ്റി (${years[0]}–${years[1]})`,
          labelMalayalam: `പ്രവൃത്തിപരിചയത്തിലെ വർഷങ്ങൾ (${exp.duration}) ക്രമം തെറ്റിയാണ് നൽകിയിരിക്കുന്നത്`,
          severity: 'warning',
          section: 'cv_experience',
          mistakeCategory: 'mismatched_date',
        });
        break;
      }
    }
  } else if (category === 'rental_agreement') {
    if (isPlaceholderOrEmpty(agreementData.firstPartyDetails)) {
      issues.push({
        id: 'firstParty',
        shortBadgeMalayalam: 'ഒന്നാം കക്ഷി അപൂർണ്ണം',
        labelMalayalam: 'ഒന്നാം കക്ഷിയുടെ (ഉടമയുടെ) വിവരങ്ങൾ അപൂർണ്ണമാണ്',
        severity: 'warning',
        section: 'agreement_parties',
        mistakeCategory: 'missing_field',
      });
    }
    if (isPlaceholderOrEmpty(agreementData.secondPartyDetails)) {
      issues.push({
        id: 'secondParty',
        shortBadgeMalayalam: 'രണ്ടാം കക്ഷി അപൂർണ്ണം',
        labelMalayalam: 'രണ്ടാം കക്ഷിയുടെ (വാടകക്കാരന്റെ) വിവരങ്ങൾ അപൂർണ്ണമാണ്',
        severity: 'warning',
        section: 'agreement_parties',
        mistakeCategory: 'missing_field',
      });
    }

    // Check PIN code in Rental Agreement party details or schedule
    const combinedParties = `${agreementData.firstPartyDetails || ''} ${agreementData.secondPartyDetails || ''}`;
    if (
      !isPlaceholderOrEmpty(agreementData.firstPartyDetails) &&
      !isPlaceholderOrEmpty(agreementData.secondPartyDetails) &&
      !hasValidSixDigitPin(combinedParties) &&
      !hasValidSixDigitPin(agreementData.schedulePropertyDetails || '')
    ) {
      issues.push({
        id: 'agreementPinMissing',
        shortBadgeMalayalam: 'പിൻകോഡ് (PIN) ഇല്ല',
        labelMalayalam:
          'കക്ഷികളുടെ വിലാസത്തിലോ വസ്തു വിവരത്തിലോ 6 അക്ക പിൻകോഡ് ചേർത്തിട്ടില്ല',
        severity: 'info',
        section: 'agreement_parties',
        mistakeCategory: 'missing_pincode',
      });
    }

    // Check Execution Date vs Clauses Date mismatch
    const execParsed = parseDateTokens(agreementData.executionDate);
    if (!agreementData.executionDate || !execParsed.validFormat) {
      issues.push({
        id: 'agreementDateInvalid',
        shortBadgeMalayalam: 'കരാർ തീയതി പരിശോധിക്കുക',
        labelMalayalam: 'കരാർ തീയതി ശരിയായ DD/MM/YYYY രീതിയിലല്ല',
        severity: 'warning',
        section: 'agreement_header',
        mistakeCategory: 'mismatched_date',
        fixActionId: 'set_today_date',
      });
    } else if (execParsed.year && (execParsed.year < currentYear - 1 || execParsed.year > currentYear + 1)) {
      issues.push({
        id: 'agreementYearMismatch',
        shortBadgeMalayalam: `കരാർ വർഷം (${execParsed.year}) പരിശോധിക്കുക`,
        labelMalayalam: `കരാർ തീയതിയിലെ വർഷം (${execParsed.year}) നിലവിലെ വർഷവുമായി പൊരുത്തപ്പെടുന്നില്ല`,
        severity: 'warning',
        section: 'agreement_header',
        mistakeCategory: 'mismatched_date',
        fixActionId: 'set_today_date',
      });
    }

    // Check Stamp Paper Header + Clause length formatting overlap
    const clauseLength = (agreementData.clauses || []).join(' ').length;
    if (agreementData.stampPaperHeaderSpaceMm >= 85 && clauseLength > 1250) {
      issues.push({
        id: 'stampHeaderOverlapRisk',
        shortBadgeMalayalam: 'മുദ്രപ്പത്ര സ്ഥലം + പേജ് കവിയുന്നു',
        labelMalayalam:
          'മുദ്രപ്പത്ര തലഭാഗം കൂടുതലായതിനാൽ കരാർ ഒറ്റ പേജിൽ ഒതുങ്ങാൻ Auto-Fit ഓൺ ചെയ്യുക',
        severity: 'info',
        section: 'agreement_header',
        mistakeCategory: 'formatting_overlap',
        fixActionId: 'enable_autofit',
      });
    }
  } else if (category === 'teacher_marklist' && extra?.markListData) {
    const ml = extra.markListData;
    if (!ml.schoolName || !ml.schoolName.trim()) {
      issues.push({
        id: 'marklistSchoolMissing',
        shortBadgeMalayalam: 'സ്കൂൾ പേര് ഇല്ല',
        labelMalayalam: 'സ്കൂളിന്റെ / മദ്രസയുടെ പേര് ചേർത്തിട്ടില്ല',
        severity: 'warning',
        section: 'marklist_header',
        mistakeCategory: 'missing_field',
      });
    }
    if (ml.evaluationMode !== 'lp_up_grade_only') {
      const invalidStudent = ml.students.find((s) =>
        s.marks.some((m) => m > ml.maxMarksPerSubject || m < 0)
      );
      if (invalidStudent) {
        issues.push({
          id: 'markExceedsMax',
          shortBadgeMalayalam: `മാർക്ക് പരമാവധിയിലും (${ml.maxMarksPerSubject}) കൂടുതൽ!`,
          labelMalayalam: `${invalidStudent.studentName} എന്ന കുട്ടിയുടെ മാർക്ക് പരമാവധി മാർക്കിനേക്കാൾ (${ml.maxMarksPerSubject}) കൂടുതലാണ്`,
          severity: 'warning',
          section: 'marklist_rows',
          mistakeCategory: 'formatting_overlap',
        });
      }
    }
    const parsedMlDate = parseDateTokens(ml.date);
    if (ml.date && !parsedMlDate.validFormat) {
      issues.push({
        id: 'marklistDateInvalid',
        shortBadgeMalayalam: 'തീയതി പരിശോധിക്കുക',
        labelMalayalam: 'മാർക്ക് ലിസ്റ്റിലെ തീയതി ശരിയായ രീതിയിലല്ല',
        severity: 'info',
        section: 'marklist_footer',
        mistakeCategory: 'mismatched_date',
        fixActionId: 'set_today_date',
      });
    }
  }

  return issues;
}

export function buildEditableQuestionsForLetter(
  letter: MalayalamLetterData
): FollowUpQuestion[] {
  const isSchoolLeave = letter.letterLayoutVariant === 'school_leave';
  const isProjectCover = letter.letterLayoutVariant === 'project_cover';
  const isSpeech = letter.letterLayoutVariant === 'school_speech';

  if (isProjectCover) {
    return [
      {
        id: 'q-proj-name',
        fieldLabelMalayalam: 'വിദ്യാർത്ഥിയുടെ പേരും ക്ലാസും റോൾ നമ്പറും',
        questionMalayalam: 'പ്രോജക്റ്റ് സമർപ്പിക്കുന്ന വിദ്യാർത്ഥിയുടെ പേരും ക്ലാസും എഴുതുക:',
        quickSuggestions: [],
        defaultValue: letter.senderName,
      },
      {
        id: 'q-proj-school',
        fieldLabelMalayalam: 'സ്കൂളിന്റെ / കോളേജിന്റെ പേര്',
        questionMalayalam: 'സ്കൂളിന്റെ അല്ലെങ്കിൽ സ്ഥാപനത്തിന്റെ പേരും സ്ഥലവും:',
        quickSuggestions: [],
        defaultValue: letter.recipientOffice,
      },
      {
        id: 'q-proj-topic',
        fieldLabelMalayalam: 'പ്രോജക്റ്റ് വിഷയം (Topic)',
        questionMalayalam: 'പ്രോജക്റ്റിന്റെ പേര് / വിഷയം എന്താണ്?',
        quickSuggestions: [],
        defaultValue: letter.subject,
      },
      {
        id: 'q-proj-teacher',
        fieldLabelMalayalam: 'അധ്യാപകന്റെ / ടീച്ചറുടെ പേര്',
        questionMalayalam: 'ആർക്കാണ് പ്രോജക്റ്റ് സമർപ്പിക്കുന്നത്?',
        quickSuggestions: [],
        defaultValue: letter.recipientTitle,
      },
    ];
  }

  if (isSpeech) {
    return [
      {
        id: 'q-speech-topic',
        fieldLabelMalayalam: 'പ്രസംഗ വിഷയം (Heading)',
        questionMalayalam: 'ഏത് വിഷയത്തെക്കുറിച്ചാണ് പ്രസംഗം വേണ്ടത്?',
        quickSuggestions: ['പരിസ്ഥിതി ദിന സന്ദേശം', 'കേരളപ്പിറവി ദിന പ്രസംഗം', 'സ്വാതന്ത്ര്യ ദിന സന്ദേശം'],
        defaultValue: letter.documentHeading,
      },
      {
        id: 'q-speech-speaker',
        fieldLabelMalayalam: 'പ്രസംഗിക്കുന്നയാളുടെ പേര്',
        questionMalayalam: 'നിങ്ങളുടെ പേര് ഇവിടെ നൽകുക:',
        quickSuggestions: [],
        defaultValue: letter.senderName,
      },
    ];
  }

  const questions: FollowUpQuestion[] = [];

  // 1. If the letter has structuredFields (like Caste Certificate, Income Certificate, KSEB, Police, Resignation, etc.),
  // include EVERY structured field as an explicit numbered question with voice + text box!
  if (letter.structuredFields && letter.structuredFields.length > 0) {
    letter.structuredFields.forEach((sf, idx) => {
      let suggestions: string[] = [];
      const lowerLabel = sf.label.toLowerCase();
      if (lowerLabel.includes('മതവും ജാതിയും') || lowerLabel.includes('ജാതി')) {
        suggestions = ['ഹിന്ദു — ഈഴവ (OBC)', 'ഇസ്ലാം — മാപ്പിള (OBC)', 'ഹിന്ദു — പുലയ (SC)', 'ക്രിസ്ത്യൻ — ലത്തീൻ (OBC)', 'ഹിന്ദു — വിശ്വകർമ്മ'];
      } else if (lowerLabel.includes('വരുമാന')) {
        suggestions = ['₹48,000/-', '₹60,000/-', '₹36,000/-', '₹1,20,000/-'];
      } else if (sf.id === 'complaintSubject' || lowerLabel.includes('എന്തിനെക്കുറിച്ചാണ് പരാതി')) {
        suggestions = [
          'വ്യക്തിപരമായ തർക്കം / ഭീഷണി',
          'സാമ്പത്തിക തട്ടിപ്പ് / വഞ്ചന',
          'മോഷണം / സാധനങ്ങൾ നഷ്ടപ്പെട്ടത്',
          'അയൽവാസിയുമായുള്ള അതിർത്തി തർക്കം',
          'രേഖകൾ നഷ്ടപ്പെട്ടത് സംബന്ധിച്ച്',
        ];
      } else if (sf.id === 'lostItemDetails' || lowerLabel.includes('നഷ്ടപ്പെട്ട രേഖ')) {
        suggestions = [
          'ഒറിജിനൽ എസ്.എസ്.എൽ.സി (SSLC) ബുക്ക്',
          'വാഹനത്തിന്റെ ഒറിജിനൽ ആർ.സി ബുക്ക് (RC Book)',
          'ഡ്രൈവിംഗ് ലൈസൻസ്',
          'ആധാർ കാർഡ് / തിരിച്ചറിയൽ രേഖ',
          'ഇന്ത്യൻ പാസ്പോർട്ട്',
          'വസ്തു ആധാരം / മൊബൈൽ ഫോൺ',
        ];
      } else if (sf.id === 'cyberCrimeType' || lowerLabel.includes('തട്ടിപ്പിന്റെ സ്വഭാവം')) {
        suggestions = [
          'ഓൺലൈൻ UPI / ബാങ്ക് അക്കൗണ്ട് പണം തട്ടിപ്പ്',
          'വ്യാജ ലിങ്ക് / OTP വഴി പണം നഷ്ടപ്പെട്ടത്',
          'സോഷ്യൽ മീഡിയ വ്യാജ അക്കൗണ്ട് / സൈബർ ഭീഷണി',
          'ഓൺലൈൻ ജോബ് / ട്രേഡിംഗ് തട്ടിപ്പ്',
        ];
      } else if (sf.id === 'serviceType' || lowerLabel.includes('കെ.എസ്.ഇ.ബി സേവനം')) {
        suggestions = [
          'കണക്ഷൻ ഉടമസ്ഥാവകാശം പേരിലേക്ക് മാറ്റൽ',
          'മീറ്റർ തകരാർ / അമിത ബിൽ പരിശോധന',
          'വൈദ്യുതി പോസ്റ്റ് / ലൈൻ മാറ്റി സ്ഥാപിക്കൽ',
          'പുതിയ വൈദ്യുതി കണക്ഷൻ / താരിഫ് മാറ്റം',
        ];
      } else if (sf.id === 'bankingRequest' || lowerLabel.includes('ബാങ്ക് സേവനം')) {
        suggestions = [
          'പുതിയ എ.ടി.എം കാർഡും ഫോൺ നമ്പർ മാറ്റലും',
          'ബാങ്ക് അക്കൗണ്ട് ക്ലോസ് ചെയ്യൽ',
          'വിദ്യാഭ്യാസ / ഭവന ലോൺ അപേക്ഷ',
          'തെറ്റായി പോയ UPI പണം തിരികെ ലഭിക്കാൻ',
          'KYC പുതുക്കൽ / ഫ്രീസ് ആയ അക്കൗണ്ട് ആക്ടീവ് ആക്കാൻ',
        ];
      } else if (lowerLabel.includes('ആവശ്യം') || lowerLabel.includes('കാര്യം')) {
        suggestions = ['വിദ്യാഭ്യാസ സ്കോളർഷിപ്പിന്', 'പി.എസ്.സി വെരിഫിക്കേഷന്', 'സർക്കാർ ആനുകൂല്യത്തിന്', 'ബാങ്ക് ലോൺ ആവശ്യത്തിന്'];
      } else if (lowerLabel.includes('തൊഴിൽ') || lowerLabel.includes('വരുമാന മാർഗ്ഗം')) {
        suggestions = ['കൂലിപ്പണി', 'കൃഷി', 'സ്വകാര്യ ജോലി', 'കച്ചവടം'];
      }

      const cleanVal = sf.value && !/^ഉദാ\s*:/i.test(sf.value.trim()) ? sf.value : '';
      questions.push({
        id: `q-sf-${sf.id || idx}`,
        structuredFieldId: sf.id,
        fieldLabelMalayalam: sf.label,
        questionMalayalam:
          idx === 0
            ? 'അപേക്ഷകന്റെ മുഴുവൻ പേര് ഇവിടെ ടൈപ്പ് ചെയ്യുകയോ 🎙️ വോയ്‌സ് വഴി പറയുകയോ ചെയ്യുക:'
            : `${sf.label} ഇവിടെ നൽകുക:`,
        quickSuggestions: suggestions,
        defaultValue: cleanVal,
      });
    });

    // Also add Address & Phone and Recipient Office if not already covered in structuredFields
    const hasAddressField = letter.structuredFields.some(
      (f) => f.label.includes('വിലാസ') || f.label.includes('മേൽവിലാസ')
    );
    if (!hasAddressField) {
      questions.push({
        id: 'q-gov-address',
        fieldLabelMalayalam: 'മേൽവിലാസം & ഫോൺ നമ്പർ (Address & Phone)',
        questionMalayalam: 'നിങ്ങളുടെ വീട്ടുപേര്, വാർഡ്, സ്ഥലം, ഫോൺ നമ്പർ എന്നിവ നൽകുക:',
        quickSuggestions: [],
        defaultValue: letter.senderAddress
          ? `${letter.senderAddress}${letter.senderPhone ? `, ഫോൺ: ${letter.senderPhone}` : ''}`
          : '',
      });
    }

    const hasOfficeField = letter.structuredFields.some(
      (f) =>
        f.label.includes('ഓഫീസ്') ||
        f.label.includes('വില്ലേജ്') ||
        f.label.includes('സ്ഥാപന') ||
        f.label.includes('ബാങ്ക്') ||
        f.label.includes('സ്റ്റേഷൻ') ||
        f.label.includes('കമ്മിറ്റി') ||
        f.label.includes('സ്കൂൾ')
    );
    if (!hasOfficeField) {
      questions.push({
        id: 'q-gov-office',
        fieldLabelMalayalam: 'ആർക്കാണ് നൽകേണ്ടത് (ഓഫീസ് & സ്ഥലം)',
        questionMalayalam: `ഏത് ഓഫീസിലേക്കാണ് (${letter.recipientOffice.replace(/,+$/, '')}) അപേക്ഷ സമർപ്പിക്കേണ്ടത്?`,
        quickSuggestions: [
          letter.recipientOffice.replace(/,+$/, ''),
          'വില്ലേജ് ഓഫീസ്, ആലുവ',
          'ഗ്രാമപഞ്ചായത്ത് കാര്യാലയം',
        ],
        defaultValue: `${letter.recipientOffice.replace(/,+$/, '')}${
          letter.recipientPlace ? `, ${letter.recipientPlace.replace(/\.+$/, '')}` : ''
        }`,
      });
    }

    return questions;
  }

  // 2. Standard Official Letter / Resignation / Petition / School Leave without structuredFields table
  questions.push({
    id: 'q-std-sender',
    fieldLabelMalayalam: isSchoolLeave
      ? 'വിദ്യാർത്ഥിയുടെ പേരും ക്ലാസും'
      : 'അപേക്ഷകന്റെ പേര് (Applicant Name)',
    questionMalayalam: isSchoolLeave
      ? 'വിദ്യാർത്ഥിയുടെ പേരും ക്ലാസും ഡിവിഷനും എഴുതുക:'
      : 'അപേക്ഷ സമർപ്പിക്കുന്ന നിങ്ങളുടെ മുഴുവൻ പേര് എന്താണ്?',
    quickSuggestions: [],
    defaultValue: letter.senderName,
  });

  questions.push({
    id: 'q-std-address',
    fieldLabelMalayalam: 'മേൽവിലാസം & ഫോൺ നമ്പർ (Address & Phone)',
    questionMalayalam: 'നിങ്ങളുടെ വീട്ടുപേര്, സ്ഥലം, ഫോൺ നമ്പർ എന്നിവ എഴുതുക:',
    quickSuggestions: [],
    defaultValue: letter.senderAddress
      ? `${letter.senderAddress}${letter.senderPhone ? `, ഫോൺ: ${letter.senderPhone}` : ''}`
      : '',
  });

  questions.push({
    id: 'q-std-office',
    fieldLabelMalayalam: isSchoolLeave
      ? 'സ്കൂളിന്റെ പേരും സ്ഥലവും'
      : 'ആർക്കാണ് കൊടുക്കേണ്ടത് (ഓഫീസ് / സ്ഥാപനം & സ്ഥലം)',
    questionMalayalam: isSchoolLeave
      ? 'പഠിക്കുന്ന സ്കൂളിന്റെ പേരും സ്ഥലവും:'
      : 'ഏത് ഓഫീസിലേക്കോ സ്ഥാപനത്തിലേക്കോ ആണ് കത്ത് നൽകേണ്ടത്?',
    quickSuggestions: isSchoolLeave
      ? []
      : ['വില്ലേജ് ഓഫീസ്', 'ഗ്രാമപഞ്ചായത്ത് കാര്യാലയം', 'നഗരസഭാ കാര്യാലയം', 'പോലീസ് സ്റ്റേഷൻ', 'ബാങ്ക് മാനേജർ'],
    defaultValue: `${letter.recipientOffice.replace(/,+$/, '')}${
      letter.recipientPlace ? `, ${letter.recipientPlace.replace(/\.+$/, '')}` : ''
    }`,
  });

  questions.push({
    id: 'q-std-subject',
    fieldLabelMalayalam: 'വിഷയം / ആവശ്യം (Subject)',
    questionMalayalam: 'കത്തിലെ പ്രധാന വിഷയം അല്ലെങ്കിൽ ആവശ്യം എന്താണ്?',
    quickSuggestions: [],
    defaultValue: letter.subject,
  });

  if (isSchoolLeave) {
    questions.push({
      id: 'q-std-guardian',
      fieldLabelMalayalam: 'രക്ഷിതാവിന്റെ പേര് (Parent Name)',
      questionMalayalam: 'രക്ഷിതാവിന്റെ പേര് ഇവിടെ ചേർക്കുക:',
      quickSuggestions: [],
      defaultValue: letter.parentOrGuardianName || '',
    });
  }

  return questions;
}

export function buildEditableQuestionsForDocument(
  category: DocumentCategory,
  letterData: MalayalamLetterData,
  gulfCvData: GulfCvData,
  agreementData: RentalAgreementData,
  markListData: TeacherMarkListData
): FollowUpQuestion[] {
  if (category === 'malayalam_letter') {
    return buildEditableQuestionsForLetter(letterData);
  }
  if (category === 'gulf_cv') {
    return [
      {
        id: 'q-cv-name',
        fieldLabelMalayalam: 'നിങ്ങളുടെ മുഴുവൻ പേര് (Full Name)',
        questionMalayalam: 'സിവിയിൽ വരേണ്ട നിങ്ങളുടെ മുഴുവൻ പേര്:',
        quickSuggestions: [],
        defaultValue: gulfCvData.fullName,
      },
      {
        id: 'q-cv-job',
        fieldLabelMalayalam: 'അപേക്ഷിക്കുന്ന ജോലി / തസ്തിക (Job Title / Role)',
        questionMalayalam: 'ഏത് ജോലിക്കാണ് അപേക്ഷിക്കുന്നത്? (നാട്ടിലോ വിദേശത്തോ ഏത് ജോലിയും നൽകാം)',
        quickSuggestions: [
          'ACCOUNTANT & OFFICE ADMINISTRATOR',
          'SOFTWARE ENGINEER / FULL STACK DEVELOPER',
          'FRESHER GRADUATE / OFFICE EXECUTIVE',
          'HIGH SCHOOL / HIGHER SECONDARY TEACHER',
          'REGISTERED STAFF NURSE (B.Sc / GNM)',
          'SALES EXECUTIVE / SHOWROOM ASSOCIATE',
          'ELECTRICAL & AC MAINTENANCE TECHNICIAN',
          'LIGHT & HEAVY VEHICLE DRIVER',
        ],
        defaultValue: gulfCvData.jobTitle,
      },
      {
        id: 'q-cv-phone',
        fieldLabelMalayalam: 'ഫോൺ, വാട്സാപ്പ് & ഇമെയിൽ (Phone & Email)',
        questionMalayalam: 'നിങ്ങളുടെ മൊബൈൽ നമ്പറും ഇമെയിൽ വിലാസവും:',
        quickSuggestions: [],
        defaultValue: gulfCvData.phone,
      },
      {
        id: 'q-cv-location',
        fieldLabelMalayalam: 'നിലവിലെ സ്ഥലം / ജില്ല / രാജ്യം (Current Location)',
        questionMalayalam: 'നിങ്ങളുടെ സ്ഥലം (ഉദാ: Kozhikode, Kerala / Kochi / Bengaluru / London / Dubai):',
        quickSuggestions: [
          'Kozhikode, Kerala, India',
          'Kochi, Ernakulam, Kerala',
          'Thiruvananthapuram, Kerala',
          'Bengaluru, Karnataka, India',
          'London, United Kingdom',
          'Dubai, UAE',
          'Doha, Qatar',
          'Riyadh, Saudi Arabia',
        ],
        defaultValue: gulfCvData.currentLocation,
      },
      {
        id: 'q-cv-passport',
        fieldLabelMalayalam: 'പാസ്പോർട്ട് / വിസ / ലൈസൻസ് (വിദേശ ജോലികൾക്ക് മാത്രം - Optional)',
        questionMalayalam: 'നാട്ടിലെ ജോലികൾക്ക് "ആവശ്യമില്ല" എന്ന് തിരഞ്ഞെടുക്കാം. വിദേശത്താണെങ്കിൽ വിസ/പാസ്പോർട്ട് നൽകുക:',
        quickSuggestions: [
          'ആവശ്യമില്ല (നാട്ടിലെ ജോലിക്ക് / Domestic CV)',
          'Indian LMV Driving License',
          'Visit Visa (Ready to Join Immediately)',
          'Employment Visa / Resident Permit',
          'UK / Europe Work Permit Ready',
        ],
        defaultValue:
          gulfCvData.passportNumber && gulfCvData.passportNumber !== '-'
            ? `${gulfCvData.passportNumber} (${gulfCvData.visaStatus})`
            : gulfCvData.visaStatus && gulfCvData.visaStatus !== '-'
            ? gulfCvData.visaStatus
            : 'ആവശ്യമില്ല (നാട്ടിലെ ജോലിക്ക്)',
      },
    ];
  }
  if (category === 'rental_agreement') {
    return [
      {
        id: 'q-ag-party1',
        fieldLabelMalayalam: 'ഒന്നാം കക്ഷി (കെട്ടിട ഉടമയുടെ പേരും വിലാസവും)',
        questionMalayalam: 'കെട്ടിട ഉടമയുടെ പേര്, വയസ്സ്, വീട്ടുപേര്, സ്ഥലം:',
        quickSuggestions: [],
        defaultValue: agreementData.firstPartyDetails,
      },
      {
        id: 'q-ag-party2',
        fieldLabelMalayalam: 'രണ്ടാം കക്ഷി (വാടകക്കാരന്റെ പേരും വിലാസവും)',
        questionMalayalam: 'വാടകയ്ക്ക് എടുക്കുന്ന ആളുടെ പേര്, വയസ്സ്, വീട്ടുപേര്, സ്ഥലം:',
        quickSuggestions: [],
        defaultValue: agreementData.secondPartyDetails,
      },
      {
        id: 'q-ag-property',
        fieldLabelMalayalam: 'കെട്ടിടത്തിന്റെ വിവരവും സ്ഥലവും (Property Details)',
        questionMalayalam: 'വാടകയ്ക്ക് നൽകുന്ന വീടിന്റെ / കടയുടെ നമ്പറും സ്ഥലവും:',
        quickSuggestions: [],
        defaultValue: agreementData.schedulePropertyDetails,
      },
    ];
  }
  return [
    {
      id: 'q-ml-school',
      fieldLabelMalayalam: 'സ്കൂളിന്റെ / സ്ഥാപനത്തിന്റെ പേര്',
      questionMalayalam: 'മാർക്ക് ലിസ്റ്റിൽ വരേണ്ട സ്കൂളിന്റെ പേര്:',
      quickSuggestions: [],
      defaultValue: markListData.schoolName,
    },
    {
      id: 'q-ml-exam',
      fieldLabelMalayalam: 'പരീക്ഷയുടെ പേര് (Exam Title)',
      questionMalayalam: 'ഏത് പരീക്ഷയുടെ മാർക്ക് ലിസ്റ്റാണ്?',
      quickSuggestions: ['വാർഷിക പരീക്ഷാ മാർക്ക് ലിസ്റ്റ്', 'ഓണപ്പരീക്ഷ മാർക്ക് ലിസ്റ്റ്', 'ക്രിസ്മസ് പരീക്ഷ മാർക്ക് ലിസ്റ്റ്'],
      defaultValue: markListData.examTitle,
    },
    {
      id: 'q-ml-class',
      fieldLabelMalayalam: 'ക്ലാസും ഡിവിഷനും അധ്യാപകന്റെ പേരും',
      questionMalayalam: 'ക്ലാസ്, ഡിവിഷൻ, ക്ലാസ് ടീച്ചറുടെ പേര്:',
      quickSuggestions: [],
      defaultValue: `${markListData.classAndDivision} (${markListData.classTeacherName})`,
    },
  ];
}

export interface GulfWorkExperience {
  role: string;
  company: string;
  location: string;
  duration: string;
  highlights: string[];
}

export interface GulfEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface GulfCvData {
  fullName: string;
  jobTitle: string;
  photoDataUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  currentLocation: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  dateOfBirth: string;
  visaStatus: string;
  passportNumber: string;
  passportExpiry: string;
  drivingLicense: string;
  languages: string[];
  professionalSummary: string;
  workExperience: GulfWorkExperience[];
  education: GulfEducation[];
  coreSkills: string[];
  declaration: string;
  cvPlace?: string;
  signatureName?: string;
}

export interface RentalAgreementData {
  subType: 'വാടക കരാർ (Rent Agreement)' | 'സത്യവാങ്മൂലം (Affidavit)' | 'സമ്മതപത്രം (Consent Deed)';
  titleMalayalam: string;
  stampPaperHeaderSpaceMm: number; // Top margin in mm for ₹100 / ₹200 Kerala Stamp Paper
  placeLabelOverride?: string;
  executionDate: string;
  dateLabelOverride?: string;
  executionPlace: string;
  firstPartyLabel: string; // e.g., "ഒന്നാം കക്ഷി (കെട്ടിട ഉടമ)"
  firstPartyDetails: string;
  firstPartySignLabelOverride?: string;
  firstPartySignatureLabelOverride?: string;
  secondPartyLabel: string; // e.g., "രണ്ടാം കക്ഷി (വാടകക്കാരൻ)"
  secondPartyDetails: string;
  secondPartySignLabelOverride?: string;
  secondPartySignatureLabelOverride?: string;
  preambleParagraph: string;
  clauses: string[];
  scheduleHeadingOverride?: string;
  schedulePropertyDetails: string;
  witnessesHeadingOverride?: string;
  witnesses: string[];
}

export type MarkListEvaluationMode =
  | 'lp_up_grade_only' // Kerala SCERT LP/UP (Classes 1-7): Direct CCE Grades A, B, C, D, E only (NO numerical marks or ranks!)
  | 'hs_hss_marks_and_grade' // High School / Plus Two (Classes 8-12): Marks + 9-Point SCERT Grades (A+ to E)
  | 'marks_grade_rank' // Tuition / Coaching / Competitive: Marks + % + Grade + Rank
  | 'madrasa_marklist'; // Samastha / SKIMVB / Dakshina / KNM / Wisdom Madrasa Exam Mark List

export interface TeacherMarkListStudent {
  id: string;
  rollNo: string;
  studentName: string;
  marks: number[]; // Corresponds to subjects array index
  subjectGrades?: string[]; // Direct subject grades (e.g., ['A', 'A', 'B', 'A', 'A']) for LP/UP CCE Grade-Only mode
  overallGradeOverride?: string; // Optional manual override for overall grade cell
  totalOverride?: string; // Optional manual override for total cell
  percentageOverride?: string; // Optional manual override for percentage cell
  rankOverride?: string; // Optional manual override for rank cell
  remarks?: string;
}

export interface TeacherMarkListData {
  presetId?: string;
  modelPresetId?: string;
  evaluationMode?: MarkListEvaluationMode;
  institutionSubtitle?: string; // e.g., "പൊതുവിദ്യാഭ്യാസ വകുപ്പ്, കേരളം" or "സമസ്ത കേരള ഇസ്ലാം മത വിദ്യാഭ്യാസ ബോർഡ്"
  schoolName: string;
  examTitle: string;
  classAndDivision: string;
  academicYear: string;
  classTeacherName: string;
  maxMarksLabel?: string; // e.g., "പരമാവധി മാർക്ക്:" (editable or clearable)
  maxMarksPerSubject: number;
  subjects: string[];
  students: TeacherMarkListStudent[];
  // Editable Table Column Headers (every single column title can be edited or cleared)
  rollNoHeader?: string;
  studentNameHeader?: string;
  totalHeader?: string;
  percentageHeader?: string;
  gradeHeader?: string;
  rankHeader?: string;
  remarksHeader?: string;
  // Visibility & Rule Toggles
  showMarksColumns?: boolean; // false in LP/UP Grade-Only mode (shows A, B, C, D, E instead of numbers)
  showTotalAndPercent?: boolean; // false in LP/UP Grade-Only mode
  showTotalAndPercentage?: boolean; // alias for showTotalAndPercent
  showGradeColumn?: boolean; // default true
  showRankColumn?: boolean; // false in LP/UP & SCERT mode, true in Tuition/Rank mode
  showRemarksColumn?: boolean; // true in LP/UP CCE mode
  showSummaryBox?: boolean; // default true, can be hidden
  showSummaryCards?: boolean; // alias for showSummaryBox
  summaryCard1Label?: string;
  summaryCard1Value?: string;
  summaryCard2Label?: string;
  summaryCard2Value?: string;
  summaryCard3Label?: string;
  summaryCard3Value?: string;
  summaryCard4Label?: string;
  summaryCard4Value?: string;
  summaryTotalStudentsLabel?: string;
  summaryTotalStudentsValueOverride?: string;
  summaryPassPercentageLabel?: string;
  summaryPassPercentageValueOverride?: string;
  summaryAPlusCountLabel?: string;
  summaryAPlusCountValueOverride?: string;
  summaryTopperLabel?: string;
  summaryTopperValueOverride?: string;
  // Editable & Deletable Footer / Signature / Seal Fields (Nothing is fixed!)
  gradingScaleNote?: string;
  placeLabel?: string;
  place: string;
  dateLabel?: string;
  date: string;
  sealText?: string;
  showClassTeacherSign?: boolean;
  classTeacherSignatureLine?: string;
  showHeadmasterSign?: boolean;
  showHeadmasterSignature?: boolean;
  headmasterSignatureLine?: string;
  headmasterTitle?: string;
}

export interface StudentComputedStats {
  total: number;
  maxTotal: number;
  percentage: number;
  grade: string;
  subjectLetterGrades: string[];
  defaultRemarkMalayalam: string;
  passed: boolean;
}

export function scoreTo5PointCceGrade(pct: number): string {
  if (pct >= 80) return 'A';
  if (pct >= 60) return 'B';
  if (pct >= 45) return 'C';
  if (pct >= 30) return 'D';
  return 'E';
}

export function scoreTo9PointScertGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  if (pct >= 30) return 'D+';
  if (pct >= 20) return 'D';
  return 'E';
}

export function computeStudentStats(
  marks: number[],
  subjectCount: number,
  maxMarksPerSubject: number,
  arg4?: MarkListEvaluationMode | string[],
  arg5?: string[] | MarkListEvaluationMode
): StudentComputedStats {
  const evaluationMode: MarkListEvaluationMode =
    typeof arg4 === 'string'
      ? arg4
      : typeof arg5 === 'string'
      ? arg5
      : 'hs_hss_marks_and_grade';
  const subjectGrades: string[] | undefined = Array.isArray(arg4)
    ? arg4
    : Array.isArray(arg5)
    ? arg5
    : undefined;

  const safeMax = maxMarksPerSubject > 0 ? maxMarksPerSubject : 100;
  const isLpUpGradeOnly = evaluationMode === 'lp_up_grade_only';

  if (isLpUpGradeOnly) {
    const gradePointsMap: Record<string, number> = {
      'A+': 5,
      A: 5,
      'B+': 4,
      B: 4,
      'C+': 3,
      C: 3,
      'D+': 2,
      D: 2,
      E: 1,
    };
    const letterGrades = Array.from({ length: subjectCount }, (_, idx) => {
      const explicit = (subjectGrades?.[idx] || '').trim().toUpperCase();
      if (explicit && ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E'].includes(explicit)) {
        return explicit === 'A+' ? 'A' : explicit === 'B+' ? 'B' : explicit === 'C+' ? 'C' : explicit === 'D+' ? 'D' : explicit;
      }
      if (explicit) return explicit;
      const rawMark = Number(marks[idx]);
      const pct = Number.isFinite(rawMark) ? (rawMark / safeMax) * 100 : 85;
      return scoreTo5PointCceGrade(pct);
    });

    const totalPts = letterGrades.reduce((sum, g) => sum + (gradePointsMap[g] ?? 4), 0);
    const avgPt = subjectCount > 0 ? totalPts / subjectCount : 5;
    let overallGrade = 'A';
    if (avgPt >= 4.5) overallGrade = 'A';
    else if (avgPt >= 3.5) overallGrade = 'B';
    else if (avgPt >= 2.5) overallGrade = 'C';
    else if (avgPt >= 1.5) overallGrade = 'D';
    else overallGrade = 'E';

    const remarkMap: Record<string, string> = {
      A: 'മികച്ച പഠന നിലവാരം (ഇടപെടലുകളിലും പ്രവർത്തനങ്ങളിലും ഉന്നത മികവ്)',
      B: 'വളരെ നല്ല പുരോഗതി (തുടർന്നും പ്രോത്സാഹിപ്പിക്കുക)',
      C: 'നല്ല ശ്രമം (കൂടുതൽ വായനയും പരിശീലനവും നൽകുക)',
      D: 'ശരാശരി നിലവാരം (പ്രത്യേക ശ്രദ്ധയും സഹായവും ആവശ്യമാണ്)',
      E: 'അടിസ്ഥാന ശേഷി വികസനത്തിന് പ്രത്യേക പിന്തുണ നൽകണം',
    };

    return {
      total: totalPts,
      maxTotal: subjectCount * 5,
      percentage: Math.round((avgPt / 5) * 100),
      grade: overallGrade,
      subjectLetterGrades: letterGrades,
      defaultRemarkMalayalam: remarkMap[overallGrade] || remarkMap.A,
      passed: overallGrade !== 'E',
    };
  }

  const normalizedMarks = Array.from({ length: subjectCount }, (_, idx) => {
    const val = Number(marks[idx]);
    return Number.isFinite(val) && val >= 0 ? val : 0;
  });

  const total = normalizedMarks.reduce((acc, m) => acc + m, 0);
  const maxTotal = subjectCount * safeMax;
  const percentage = maxTotal > 0 ? Number(((total / maxTotal) * 100).toFixed(1)) : 0;
  const minPassPerSubject = safeMax * 0.3;
  const passedAllSubjects = normalizedMarks.every((m) => m >= minPassPerSubject);

  const subjectLetterGrades = normalizedMarks.map((m) =>
    scoreTo9PointScertGrade((m / safeMax) * 100)
  );
  const grade = scoreTo9PointScertGrade(percentage);

  const defaultRemarkMalayalam =
    grade === 'A+'
      ? 'ഉന്നത വിജയം (Full A+)'
      : grade === 'A' || grade === 'B+'
      ? 'മികച്ച പ്രകടനം'
      : passedAllSubjects
      ? 'വിജയിച്ചു'
      : 'കൂടുതൽ ശ്രദ്ധ വേണം';

  return {
    total,
    maxTotal,
    percentage,
    grade,
    subjectLetterGrades,
    defaultRemarkMalayalam,
    passed: passedAllSubjects && percentage >= 30,
  };
}

export interface SubFormOptionChoice {
  id: string;
  titleMalayalam: string;
  subtitleMalayalam?: string;
  badgeIcon?: string;
  govFormId?: string;
  customPrompt?: string;
}

export interface GeneratedDocumentResponse {
  spokenTranscript?: string;
  intent?: 'document_request' | 'general_question';
  documentUpdated?: boolean;
  detectedType: DocumentCategory;
  isComplete: boolean;
  assistantReplyMalayalam: string;
  followUpQuestions: FollowUpQuestion[];
  subFormPromptTitle?: string;
  subFormOptions?: SubFormOptionChoice[];
  letterData: MalayalamLetterData;
  gulfCvData: GulfCvData;
  agreementData: RentalAgreementData;
  markListData?: TeacherMarkListData;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  photoUrl?: string;
  audioUrl?: string;
  audioDuration?: string;
  attachmentName?: string;
  attachmentType?: 'image' | 'pdf' | 'text' | 'audio';
  documentCategory?: DocumentCategory;
  followUpQuestions?: FollowUpQuestion[];
  subFormPromptTitle?: string;
  subFormOptions?: SubFormOptionChoice[];
  isComplete?: boolean;
}

export interface CompletedTransaction {
  id: string;
  timestamp: string;
  category: DocumentCategory;
  title: string;
  amount: number;
  method: 'UPI_QR' | 'AKSHAYA_PIN' | 'FREE_CITIZEN';
}

export interface OwnerBusinessConfig {
  shopName: string;
  centerTagline?: string;
  ownerName: string;
  location?: string;
  centerPhone?: string;
  whatsappNumber: string;
  email?: string;
  workingHours?: string;
  upiId: string;
  akshayaPin: string;
  freeModeEnabled: boolean;
  cartFeatureEnabled?: boolean;
  homePrinterBusinessModeEnabled?: boolean;
  defaultOutputLanguage?: DocumentOutputLanguage;
  pricing: {
    malayalam_letter: number;
    gulf_cv: number;
    rental_agreement: number;
    teacher_marklist: number;
    pdf_edit?: number;
  };
  whatsappWebhookToken: string;
  guideVideoUrl?: string;
  googleSiteVerification?: string;
  customDomainUrl?: string;
}

export type TemplateSubGroup =
  | 'എല്ലാം (All)'
  | 'സ്കൂൾ & കുട്ടികൾ (School)'
  | 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)'
  | 'ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ്'
  | 'അക്ഷയ & വില്ലേജ് ഓഫീസ്'
  | 'പഞ്ചായത്ത് & KSEB & റേഷൻ'
  | 'രാജിക്കത്ത് & സ്ഥാപനം'
  | 'പോലീസ് & ബാങ്ക് & RTO'
  | 'പ്രവാസി ഗൾഫ് CV'
  | 'വാടക കരാർ & സത്യവാങ്മൂലം';

export interface QuickTemplateItem {
  id: string;
  category: DocumentCategory;
  subGroup: TemplateSubGroup;
  titleMalayalam: string;
  subtitleMalayalam: string;
  sampleVoicePrompt: string;
  badgeText: string;
  markListPresetId?: string;
}

// Default clean SVG Passport Photo Data URL for Gulf CV Sample
export const DEFAULT_GULF_AVATAR_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 280" fill="none">
  <rect width="240" height="280" fill="#E2E8F0"/>
  <rect x="8" y="8" width="224" height="264" rx="4" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
  <circle cx="120" cy="102" r="46" fill="#94A3B8"/>
  <path d="M44 252C44 205.608 78.0264 168 120 168C161.974 168 196 205.608 196 252V264H44V252Z" fill="#0F172A"/>
  <path d="M98 172L120 212L142 172" fill="#FFFFFF"/>
  <path d="M115 186H125L128 242L120 252L112 242L115 186Z" fill="#047857"/>
</svg>
`)}`;

export const INITIAL_LETTER_DATA: MalayalamLetterData = {
  documentHeading: 'ഔദ്യോഗിക അപേക്ഷ',
  senderName: '',
  senderAddress: '',
  senderPhone: '',
  recipientTitle: 'ബഹുമാനപ്പെട്ട സെക്രട്ടറി അവർകൾക്ക്,',
  recipientOffice: 'ഗ്രാമപഞ്ചായത്ത് കാര്യാലയം,',
  recipientPlace: 'കേരളം.',
  subject: 'അപകടാവസ്ഥയിലുള്ള മരം മുറിച്ചുമാറ്റുന്നതിനുള്ള നടപടി സ്വീകരിക്കണമെന്ന് അപേക്ഷിക്കുന്നു.',
  reference: '',
  salutation: 'സർ / മാഡം,',
  bodyParagraphs: [
    'മേൽവിലാസത്തിൽ താമസിക്കുന്ന ഞാൻ ഈ പഞ്ചായത്തിലെ സ്ഥിരതാമസക്കാരനാണ്. എന്റെ വീടിനോട് ചേർന്നുള്ള പൊതുവഴിയുടെ വശത്തു നിൽക്കുന്ന വലിയ മരം കഴിഞ്ഞ ദിവസങ്ങളിലുണ്ടായ കനത്ത കാറ്റിലും മഴയിലും വേരുകൾ ഇളകി എന്റെ വീടിനു മുകളിലേക്ക് ചരിഞ്ഞു നിൽക്കുകയാണ്.',
    'സ്കൂൾ കുട്ടികളും പ്രായമായവരും ഉൾപ്പെടെ നിരവധി ആളുകൾ നിത്യേന സഞ്ചരിക്കുന്ന വഴിയാണിത്. ഏതു നിമിഷവും ഈ മരം കടപുഴകി വീണ് വലിയ ജീവഹാനിയും നാശനഷ്ടങ്ങളും ഉണ്ടാകാൻ സാധ്യതയുണ്ട്.',
    'ആയതിനാൽ അടിയന്തരമായി സ്ഥലം പരിശോധിച്ച് പ്രസ്തുത അപകടാവസ്ഥയിലുള്ള മരം മുറിച്ചുമാറ്റി ഞങ്ങളുടെ ജീവനും സ്വത്തിനും സംരക്ഷണം നൽകണമെന്ന് വിനീതമായി അപേക്ഷിക്കുന്നു.',
  ],
  closingPhrase: 'വിശ്വസ്തതയോടെ,',
  place: 'കേരളം',
  date: new Date().toLocaleDateString('ml-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  enclosures: ['വീടിന്റെയും മരത്തിന്റെയും ഫോട്ടോ പകർപ്പ്', 'ആധാർ കാർഡ് പകർപ്പ്'],
};

export interface CvPresetModel {
  id: string;
  badge: string;
  shortTitleMalayalam: string;
  titleMalayalam: string;
  subtitleMalayalam: string;
  regionTag: 'kerala_india' | 'it_corporate' | 'global_international' | 'gulf_gcc';
  data: GulfCvData;
}

export const CV_PRESET_MODELS: CvPresetModel[] = [
  {
    id: 'accountant-office-cv',
    badge: '📊 ഓഫീസ് / അക്കൗണ്ടന്റ്',
    shortTitleMalayalam: 'അക്കൗണ്ടന്റ് & ഓഫീസ് CV',
    titleMalayalam: 'അക്കൗണ്ടന്റ് / ബാങ്ക് / ഓഫീസ് അഡ്മിൻ CV (Kerala, India & Global)',
    subtitleMalayalam: 'Tally Prime, GST, MS Excel, ബില്ലിംഗ്, ഓഫീസ് അഡ്മിനിസ്ട്രേഷൻ ജോലികൾക്ക്',
    regionTag: 'kerala_india',
    data: {
      fullName: 'ANJALI KRISHNAN R.',
      jobTitle: 'SENIOR ACCOUNTANT & OFFICE ADMINISTRATOR',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+91 98470 54321',
      whatsapp: '+91 98470 54321',
      email: 'anjali.krishnan.accounts@email.com',
      currentLocation: 'Kochi, Ernakulam, Kerala, India',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: 'Single',
      dateOfBirth: '18 Aug 1998',
      visaStatus: '-',
      passportNumber: '-',
      passportExpiry: '-',
      drivingLicense: 'Valid Indian Four-Wheeler & Two-Wheeler License',
      languages: ['English (Fluent)', 'Malayalam (Native)', 'Hindi (Conversational)'],
      professionalSummary:
        'Detail-oriented and results-driven Commerce Graduate and Certified Tally & GST Professional with 4+ years of experience in financial accounting, GST e-filing, payroll management, bank reconciliation, and day-to-day office administration. Adept at streamlining billing operations and maintaining 100% statutory audit compliance.',
      workExperience: [
        {
          role: 'Accountant & Admin Executive',
          company: 'Malabar Gold & Retail Enterprises Pvt. Ltd.',
          location: 'Kochi, Kerala, India',
          duration: '2022 – Present (3+ Years)',
          highlights: [
            'Manage end-to-end daily accounting, GST returns (GSTR-1, GSTR-3B), TDS filings, and vendor reconciliations using Tally Prime and MS Excel.',
            'Prepare monthly profit & loss statements, balance sheet schedules, and cash-flow reports for senior management.',
            'Supervise front-office administration, staff attendance, EPF/ESI statutory filings, and customer billing operations.',
          ],
        },
        {
          role: 'Junior Accounts Assistant',
          company: 'Apex Associates & Tax Consultants',
          location: 'Thrissur, Kerala, India',
          duration: '2020 – 2022 (2 Years)',
          highlights: [
            'Assisted Chartered Accountants in auditing, invoice verification, ledger scrutiny, and income tax return preparation.',
            'Maintained accurate digital documentation and client billing records with zero discrepancies.',
          ],
        },
      ],
      education: [
        {
          degree: 'Bachelor of Commerce (B.Com – Finance & Taxation)',
          institution: 'Mahatma Gandhi University, Kerala',
          year: '2020',
        },
        {
          degree: 'Diploma in Indian & Foreign Accounting (Tally Prime, GST, SAP FICO)',
          institution: 'C-DIT / Certified Accounting Institute, Kochi',
          year: '2020',
        },
      ],
      coreSkills: [
        'Tally Prime & ERP 9',
        'GST & TDS E-Filing',
        'Advanced MS Excel & MIS',
        'Bank Reconciliation',
        'Payroll, EPF & ESI Compliance',
        'Office Administration & Billing',
      ],
      declaration:
        'I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief.',
      cvPlace: 'Kochi, Kerala',
      signatureName: 'ANJALI KRISHNAN R.',
    },
  },
  {
    id: 'fresher-degree-cv',
    badge: '🎓 ഫ്രഷർ / കോളേജ് CV',
    shortTitleMalayalam: 'ഫ്രഷർ (Fresher CV)',
    titleMalayalam: 'ഫ്രഷർ / കോളേജ് ബിരുദധാരി ബയോഡാറ്റ (Fresher Resume - All Jobs)',
    subtitleMalayalam: 'പഠനം കഴിഞ്ഞ ഉടൻ ആദ്യ ജോലിക്ക് അപേക്ഷിക്കുന്നവർക്ക് (Degree / Diploma / Plus Two)',
    regionTag: 'kerala_india',
    data: {
      fullName: 'RAHUL NAIR S.',
      jobTitle: 'GRADUATE TRAINEE / JUNIOR EXECUTIVE (FRESHER)',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+91 94471 88990',
      whatsapp: '+91 94471 88990',
      email: 'rahul.nair.graduate@email.com',
      currentLocation: 'Thiruvananthapuram, Kerala, India',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: 'Single',
      dateOfBirth: '12 Jan 2003',
      visaStatus: '-',
      passportNumber: '-',
      passportExpiry: '-',
      drivingLicense: 'Indian LMV Driving License',
      languages: ['English (Fluent)', 'Malayalam (Native)', 'Hindi (Fluent)', 'Tamil (Basic)'],
      professionalSummary:
        'Enthusiastic, fast-learning, and disciplined Bachelor’s Degree graduate with strong communication, computer proficiency, and analytical problem-solving skills. Eager to start a rewarding career where I can contribute positively to team operations, customer satisfaction, and organizational growth.',
      workExperience: [
        {
          role: 'Academic Project & Internship Trainee',
          company: 'Kerala State Industrial Enterprises / College Department',
          location: 'Thiruvananthapuram, Kerala',
          duration: '2024 (6 Months Academic Project & Internship)',
          highlights: [
            'Successfully completed final-year academic project on digital customer operations and workflow optimization with A-grade distinction.',
            'Coordinated college placement cell events, student workshops, and documentation for 300+ participants.',
            'Demonstrated strong proficiency in MS Office (Word, Excel, PowerPoint), Google Workspace, and professional email communication.',
          ],
        },
      ],
      education: [
        {
          degree: 'Bachelor of Degree (B.Com / B.Sc / BBA – First Class with Distinction)',
          institution: 'University of Kerala, Thiruvananthapuram',
          year: '2024',
        },
        {
          degree: 'Higher Secondary (Plus Two – 92%)',
          institution: 'Directorate of Higher Secondary Education (DHSE), Kerala',
          year: '2021',
        },
      ],
      coreSkills: [
        'MS Office (Excel, Word, PPT)',
        'English & Malayalam Communication',
        'Teamwork & Adaptability',
        'Data Entry & Documentation',
        'Customer Relations',
        'Time Management & Problem Solving',
      ],
      declaration:
        'I hereby declare that the details furnished above are true and accurate to the best of my knowledge.',
      cvPlace: 'Thiruvananthapuram',
      signatureName: 'RAHUL NAIR S.',
    },
  },
  {
    id: 'it-software-cv',
    badge: '💻 ഐ.ടി / സോഫ്റ്റ്‌വെയർ',
    shortTitleMalayalam: 'ഐ.ടി / എഞ്ചിനീയർ CV',
    titleMalayalam: 'ഐ.ടി / സോഫ്റ്റ്‌വെയർ എഞ്ചിനീയർ റെസ്യൂമെ (Technopark / Infopark / Global IT)',
    subtitleMalayalam: 'Software Developer, Web/App Developer, Data Analyst, QA, Tech Support ജോലികൾക്ക്',
    regionTag: 'it_corporate',
    data: {
      fullName: 'ARJUN MENON V.',
      jobTitle: 'FULL STACK SOFTWARE ENGINEER (REACT / NODE.JS / PYTHON)',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+91 98952 11223',
      whatsapp: '+91 98952 11223',
      email: 'arjun.menon.dev@email.com',
      currentLocation: 'Infopark Kochi / Bengaluru, India (Open to Remote & Relocation)',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: '-',
      dateOfBirth: '04 Nov 1999',
      visaStatus: '-',
      passportNumber: '-',
      passportExpiry: '-',
      drivingLicense: '-',
      languages: ['English (Professional Fluency)', 'Malayalam (Native)', 'Hindi (Conversational)'],
      professionalSummary:
        'Results-oriented Full Stack Software Engineer with 3+ years of experience designing, building, and scaling responsive web applications and RESTful microservices using React, TypeScript, Node.js, Python, and PostgreSQL. Proven track record of improving application performance by 40% and delivering clean, maintainable production code in Agile teams.',
      workExperience: [
        {
          role: 'Software Engineer (Full Stack)',
          company: 'QBurst / Infopark Tech Solutions Pvt. Ltd.',
          location: 'Kochi, Kerala, India',
          duration: '2023 – Present (2+ Years)',
          highlights: [
            'Architected and deployed enterprise SaaS dashboards using React 18, TypeScript, Tailwind CSS, and Node.js/Express serving 50,000+ monthly active users.',
            'Optimized PostgreSQL queries and Redis caching layers, reducing API response latency from 420ms to 110ms.',
            'Collaborated with cross-functional product managers, UI/UX designers, and QA engineers in bi-weekly Agile sprints with CI/CD via GitHub Actions and Docker.',
          ],
        },
        {
          role: 'Associate Software Developer',
          company: 'Technopark Digital Labs',
          location: 'Thiruvananthapuram, Kerala, India',
          duration: '2021 – 2023 (1.5 Years)',
          highlights: [
            'Developed reusable frontend components, automated unit tests (Jest/Playwright), and third-party payment gateway integrations.',
            'Resolved 120+ production bugs and mentored 4 junior engineering interns.',
          ],
        },
      ],
      education: [
        {
          degree: 'B.Tech in Computer Science & Engineering (CGPA: 8.6/10)',
          institution: 'APJ Abdul Kalam Technological University (KTU), Kerala',
          year: '2021',
        },
        {
          degree: 'AWS Certified Cloud Practitioner & Full Stack Web Development',
          institution: 'Amazon Web Services / Coursera',
          year: '2022',
        },
      ],
      coreSkills: [
        'React.js, Next.js & TypeScript',
        'Node.js, Express & Python',
        'PostgreSQL, MongoDB & Redis',
        'REST APIs & GraphQL',
        'Docker, AWS & Git/GitHub CI/CD',
        'Agile / Scrum & System Design',
      ],
      declaration:
        'I hereby certify that the information provided in this resume is true and accurate to the best of my knowledge.',
      cvPlace: 'Kochi, India',
      signatureName: 'ARJUN MENON V.',
    },
  },
  {
    id: 'teacher-faculty-cv',
    badge: '🏫 അധ്യാപകർ / ടീച്ചർ',
    shortTitleMalayalam: 'ടീച്ചർ / അധ്യാപക CV',
    titleMalayalam: 'സ്കൂൾ / കോളേജ് / ട്യൂഷൻ / മദ്രസ അധ്യാപക CV (Teacher & Faculty Resume)',
    subtitleMalayalam: 'LP/UP/High School/Plus Two ടീച്ചർ, B.Ed, TTC, SET, KTET, മദ്രസ ഉസ്താദ് ജോലികൾക്ക്',
    regionTag: 'kerala_india',
    data: {
      fullName: 'FATHIMA SUHARA M.',
      jobTitle: 'POST GRADUATE TEACHER (ENGLISH / MATHEMATICS / SCIENCE)',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+91 97450 33445',
      whatsapp: '+91 97450 33445',
      email: 'fathima.teacher.edu@email.com',
      currentLocation: 'Malappuram / Kozhikode, Kerala, India',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: 'Married',
      dateOfBirth: '22 Mar 1995',
      visaStatus: '-',
      passportNumber: '-',
      passportExpiry: '-',
      drivingLicense: '-',
      languages: ['English (Fluent)', 'Malayalam (Native)', 'Arabic (Read & Write)', 'Hindi (Working Knowledge)'],
      professionalSummary:
        'Passionate and student-centered Educator (M.A., B.Ed., KTET & SET Qualified) with 5+ years of teaching experience across CBSE and Kerala State Syllabus schools. Skilled in interactive classroom management, digital smart-class instruction, CCE continuous evaluation, and mentoring students to achieve 100% board exam pass rates.',
      workExperience: [
        {
          role: 'High School & Higher Secondary Teacher',
          company: 'Crescent Public School (CBSE / State Syllabus)',
          location: 'Kozhikode, Kerala, India',
          duration: '2021 – Present (4 Years)',
          highlights: [
            'Deliver engaging curriculum lessons for Classes 8 to 12 using activity-based learning and smart-board digital tools.',
            'Served as Class Teacher for 45+ students, preparing SCERT/CBSE progress reports, parent-teacher meetings, and remedial coaching.',
            'Guided students for state-level Kalolsavam, Science Fair, and scholarship examinations (USS, LSS, NMMS).',
          ],
        },
        {
          role: 'Assistant Teacher',
          company: 'St. Mary’s Higher Secondary School',
          location: 'Malappuram, Kerala, India',
          duration: '2019 – 2021 (2 Years)',
          highlights: [
            'Conducted foundational classes, continuous comprehensive evaluation (CCE) grading, and language club activities.',
          ],
        },
      ],
      education: [
        {
          degree: 'Bachelor of Education (B.Ed.) & Master of Arts (M.A.)',
          institution: 'University of Calicut, Kerala',
          year: '2019',
        },
        {
          degree: 'KTET (Category II & III) & Kerala SET Qualified',
          institution: 'Pareeksha Bhavan / LBS Centre, Government of Kerala',
          year: '2020',
        },
      ],
      coreSkills: [
        'Classroom Management & Lesson Planning',
        'SCERT & CBSE Curriculum Expertise',
        'Smart Class & Digital Teaching Tools',
        'Student Counseling & Mentoring',
        'CCE Grading & Exam Evaluation',
        'Co-Curricular & Academic Leadership',
      ],
      declaration:
        'I hereby declare that all the statements made above are true and correct to the best of my knowledge and belief.',
      cvPlace: 'Kozhikode, Kerala',
      signatureName: 'FATHIMA SUHARA M.',
    },
  },
  {
    id: 'nurse-medical-cv',
    badge: '🏥 നേഴ്സ് / മെഡിക്കൽ',
    shortTitleMalayalam: 'നേഴ്സ് / ആശുപത്രി CV',
    titleMalayalam: 'നേഴ്സ് / ആശുപത്രി / മെഡിക്കൽ സ്റ്റാഫ് CV (India, UK, Europe & Gulf)',
    subtitleMalayalam: 'B.Sc / GNM Staff Nurse, Pharmacist, Lab Technician, Caregiver ജോലികൾക്ക്',
    regionTag: 'global_international',
    data: {
      fullName: 'SNEHA MARIAM THOMAS, RN',
      jobTitle: 'REGISTERED STAFF NURSE (ICU / EMERGENCY & MEDICAL-SURGICAL WARD)',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+91 94961 77889',
      whatsapp: '+91 94961 77889',
      email: 'sneha.thomas.rn@email.com',
      currentLocation: 'Kottayam, Kerala, India (Open to India, UK, Ireland & GCC Hospitals)',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: 'Single',
      dateOfBirth: '09 Jul 1997',
      visaStatus: 'Ready for Immediate Joining / IELTS & OET / Prometric Eligible',
      passportNumber: 'U4928173',
      passportExpiry: '15 Oct 2032',
      drivingLicense: '-',
      languages: ['English (OET Grade B / Fluent)', 'Malayalam (Native)', 'Hindi (Fluent)'],
      professionalSummary:
        'Compassionate and clinically proficient Registered Nurse (B.Sc Nursing, KNMC Registered, BLS & ACLS Certified) with 4+ years of hands-on experience in tertiary-care multi-specialty hospitals across Intensive Care Unit (ICU), Emergency Trauma, and Medical-Surgical wards. Committed to evidence-based patient care, infection control (NABH/JCI standards), and accurate clinical documentation.',
      workExperience: [
        {
          role: 'Registered Staff Nurse (ICU & Critical Care)',
          company: 'Aster Medcity / Caritas Multi-Specialty Hospital',
          location: 'Kochi / Kottayam, Kerala, India',
          duration: '2022 – Present (3 Years)',
          highlights: [
            'Provide comprehensive 1:1 and 1:2 critical nursing care for ventilated, post-operative, and cardiac patients in a 24-bed advanced ICU.',
            'Administer IV medications, blood transfusions, ABG interpretation, central line care, and emergency resuscitation (Code Blue) per NABH/JCI protocols.',
            'Collaborate with intensivists, respiratory therapists, and families to ensure compassionate patient recovery and accurate EHR charting.',
          ],
        },
        {
          role: 'Junior Staff Nurse (Medical-Surgical & Emergency)',
          company: ' Lourdes Hospital',
          location: 'Ernakulam, Kerala, India',
          duration: '2020 – 2022 (2 Years)',
          highlights: [
            'Managed triage assessment, wound dressing, catheterization, vital signs monitoring, and pre/post-operative care for 30+ ward patients.',
          ],
        },
      ],
      education: [
        {
          degree: 'Bachelor of Science in Nursing (B.Sc Nursing – First Class)',
          institution: 'Kerala University of Health Sciences (KUHS)',
          year: '2020',
        },
        {
          degree: 'Registered Nurse & Midwife (KNMC) + AHA BLS & ACLS Certified',
          institution: 'Kerala Nurses and Midwives Council',
          year: '2020',
        },
      ],
      coreSkills: [
        'ICU & Ventilator Patient Care',
        'BLS & ACLS Emergency Response',
        'IV Cannulation & Medication Safety',
        'NABH / JCI Infection Control',
        'Electronic Health Records (EHR)',
        'Patient & Family Counseling',
      ],
      declaration:
        'I hereby declare that the clinical qualifications and experience stated above are true and verifiable.',
      cvPlace: 'Kottayam, Kerala',
      signatureName: 'SNEHA MARIAM THOMAS',
    },
  },
  {
    id: 'sales-technician-cv',
    badge: '🛒 സെയിൽസ് / ടെക്നീഷ്യൻ',
    shortTitleMalayalam: 'സെയിൽസ് & ടെക്നീഷ്യൻ CV',
    titleMalayalam: 'സെയിൽസ് / സൂപ്പർമാർക്കറ്റ് / ടെക്നീഷ്യൻ / ജനറൽ ജോബ് CV',
    subtitleMalayalam: 'ഷോറൂം സെയിൽസ്, കാഷ്യർ, കസ്റ്റമർ കെയർ, ഇലക്ട്രീഷ്യൻ, മെക്കാനിക്, ഹോട്ടൽ ജോലികൾക്ക്',
    regionTag: 'kerala_india',
    data: {
      fullName: 'VISHNU PRASAD K.',
      jobTitle: 'SHOWROOM SALES EXECUTIVE & CUSTOMER RELATIONS ASSOCIATE',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+91 96331 22334',
      whatsapp: '+91 96331 22334',
      email: 'vishnu.prasad.sales@email.com',
      currentLocation: 'Kozhikode, Kerala, India',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: 'Single',
      dateOfBirth: '11 Nov 1996',
      visaStatus: '-',
      passportNumber: '-',
      passportExpiry: '-',
      drivingLicense: 'Valid Two-Wheeler & Four-Wheeler Driving License',
      languages: ['Malayalam (Native)', 'English (Fluent)', 'Hindi (Fluent)', 'Tamil (Conversational)'],
      professionalSummary:
        'Energetic and customer-focused Sales & Retail Professional with 4+ years of experience in showroom sales, POS billing, inventory merchandising, and customer service across leading retail chains. Proven ability to exceed monthly sales targets and build long-term customer trust.',
      workExperience: [
        {
          role: 'Senior Showroom Sales Executive',
          company: 'MyG Digital / Lulu Retail Hypermarket',
          location: 'Kozhikode, Kerala, India',
          duration: '2022 – Present (3 Years)',
          highlights: [
            'Assist 80+ daily walk-in customers with product demonstrations, financing options, POS billing, and after-sales support.',
            'Consistently achieved 115% of monthly sales targets and received "Best Sales Associate of the Quarter" recognition.',
            'Manage stock display, barcode labeling, daily cash counter closing, and stock audit verification.',
          ],
        },
        {
          role: 'Customer Service & Billing Associate',
          company: 'Reliance Smart Point',
          location: 'Kannur, Kerala, India',
          duration: '2020 – 2022 (2 Years)',
          highlights: [
            'Handled high-volume POS checkout counters, UPI/Card settlements, and home-delivery order coordination.',
          ],
        },
      ],
      education: [
        {
          degree: 'Diploma / Higher Secondary (Plus Two Commerce)',
          institution: 'Board of Higher Secondary Examination, Kerala',
          year: '2018',
        },
        {
          degree: 'Certificate in Retail Management & Computerized Billing',
          institution: 'Skill India / Vocational Training Centre',
          year: '2019',
        },
      ],
      coreSkills: [
        'Showroom Sales & Product Demo',
        'POS Billing & Cash Handling',
        'Inventory & Visual Merchandising',
        'Customer Relationship Management',
        'Target Achievement & Upselling',
        'Multilingual Communication',
      ],
      declaration:
        'I hereby declare that all the details mentioned above are true and correct to the best of my knowledge.',
      cvPlace: 'Kozhikode, Kerala',
      signatureName: 'VISHNU PRASAD K.',
    },
  },
  {
    id: 'international-uk-eu-cv',
    badge: '🌍 UK / Europe / Canada CV',
    shortTitleMalayalam: 'UK / Europe / Canada CV',
    titleMalayalam: 'യുകെ / യൂറോപ്പ് / കാനഡ / ഓസ്ട്രേലിയ ഇന്റർനാഷണൽ CV (ATS Standard)',
    subtitleMalayalam: 'UK, Germany, Ireland, Canada, Australia, New Zealand രാജ്യങ്ങളിലെ ജോലികൾക്ക്',
    regionTag: 'global_international',
    data: {
      fullName: 'KEVIN MATHEW GEORGE',
      jobTitle: 'OPERATIONS & SUPPLY CHAIN COORDINATOR',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+44 7700 900412 / +91 98460 99887',
      whatsapp: '+91 98460 99887',
      email: 'kevin.mathew.global@email.com',
      currentLocation: 'London, United Kingdom / Kochi, India',
      nationality: 'Indian',
      religion: '-',
      maritalStatus: '-',
      dateOfBirth: '-',
      visaStatus: 'Eligible to Work / Graduate & Skilled Worker Visa Ready',
      passportNumber: 'V7823410',
      passportExpiry: '19 May 2033',
      drivingLicense: 'Full Clean Driving Licence',
      languages: ['English (IELTS 7.5 – C1 Advanced)', 'German (A2 Basic)', 'Malayalam (Native)'],
      professionalSummary:
        'Analytical and results-driven Operations & Logistics Professional with an MSc in International Business Management and 4+ years of experience optimizing warehouse operations, procurement workflows, vendor SLA compliance, and ERP inventory accuracy across fast-paced retail and distribution environments.',
      workExperience: [
        {
          role: 'Operations & Logistics Coordinator',
          company: 'Metro Distribution & Logistics Ltd.',
          location: 'London, UK / Kochi, India',
          duration: '2022 – Present (3 Years)',
          highlights: [
            'Coordinate daily end-to-end supply chain dispatch, 3PL carrier scheduling, and inventory replenishment using SAP S/4HANA and Advanced Excel.',
            'Reduced order fulfillment turnaround time by 22% and improved stock accuracy to 99.4% through weekly cycle counts.',
            'Ensure full compliance with UK/EU Health & Safety (HSE), GDPR data protection, and quality assurance standards.',
          ],
        },
        {
          role: 'Supply Chain & Procurement Analyst',
          company: 'TransAsia Shipping & Logistics Pvt. Ltd.',
          location: 'Kochi, Kerala, India',
          duration: '2020 – 2022 (2 Years)',
          highlights: [
            'Managed purchase orders, freight documentation, customs clearance tracking, and supplier cost negotiations.',
          ],
        },
      ],
      education: [
        {
          degree: 'MSc in Logistics & International Business Management',
          institution: 'University of Greenwich / Cochin University (CUSAT)',
          year: '2022',
        },
        {
          degree: 'Bachelor of Business Administration (BBA)',
          institution: 'Mahatma Gandhi University, Kerala',
          year: '2020',
        },
      ],
      coreSkills: [
        'Supply Chain & ERP (SAP / Oracle)',
        'Inventory & Warehouse Operations',
        'Data Analysis (Excel, Power BI)',
        'Vendor & SLA Management',
        'Health & Safety (HSE) Compliance',
        'Process Improvement (Lean Six Sigma)',
      ],
      declaration:
        'References and verifiable credentials available upon request.',
      cvPlace: 'London / Kochi',
      signatureName: 'KEVIN MATHEW GEORGE',
    },
  },
  {
    id: 'gulf-driver-pro-cv',
    badge: '✈️ പ്രവാസി ഗൾഫ് CV',
    shortTitleMalayalam: 'ഗൾഫ് / GCC CV',
    titleMalayalam: 'പ്രവാസി ഗൾഫ് ജോബ് CV (UAE / Saudi / Qatar / Oman / Kuwait / Bahrain)',
    subtitleMalayalam: 'വിസ സ്റ്റാറ്റസ്, പാസ്പോർട്ട്, ജിസിസി ലൈസൻസ് എന്നിവ ഉൾപ്പെടുത്തിയ ഗൾഫ് CV',
    regionTag: 'gulf_gcc',
    data: {
      fullName: 'MUHAMMED SHAFEEQ K.',
      jobTitle: 'LIGHT & HEAVY VEHICLE DRIVER / PRO CUM DRIVER',
      photoDataUrl: DEFAULT_GULF_AVATAR_SVG,
      phone: '+971 55 482 1930',
      whatsapp: '+91 98471 23456',
      email: 'shafeeq.driver.uae@email.com',
      currentLocation: 'Deira, Dubai, UAE (Ready to Join Immediately)',
      nationality: 'Indian (Kerala)',
      religion: 'Islam',
      maritalStatus: 'Married',
      dateOfBirth: '14 May 1993',
      visaStatus: 'Visit Visa (Valid until Dec 2026)',
      passportNumber: 'N8492014',
      passportExpiry: '22 Aug 2031',
      drivingLicense: 'Valid UAE Manual & Automatic Light Vehicle License (#394021) + Indian Heavy License',
      languages: ['English (Fluent)', 'Arabic (Working Knowledge)', 'Hindi (Fluent)', 'Malayalam (Native)'],
      professionalSummary:
        'Dedicated, punctual, and safety-focused Professional Driver with over 4+ years of GCC driving experience across Dubai, Sharjah, and Abu Dhabi. Thorough knowledge of UAE RTA traffic regulations, GPS navigation, VIP family transport, office PRO document delivery, and daily vehicle maintenance.',
      workExperience: [
        {
          role: 'Company & Executive Chauffeur',
          company: 'Al Noor Oasis Trading LLC',
          location: 'Dubai, UAE',
          duration: '2022 – 2025 (3 Years)',
          highlights: [
            'Safely transported company executives, clients, and urgent commercial consignments across all 7 Emirates with zero RTA traffic violations.',
            'Managed daily vehicle inspection, service scheduling, Salik & Darb toll tracking, and fuel logs.',
            'Assisted with bank deposits, customs clearance paperwork, and municipality document deliveries.',
          ],
        },
        {
          role: 'Delivery & Light Commercial Driver',
          company: 'Malabar Fresh Hypermarket',
          location: 'Kozhikode, Kerala, India',
          duration: '2019 – 2022 (3 Years)',
          highlights: [
            'Handled timely multi-stop commercial deliveries and cash-on-delivery collections with 100% accuracy.',
            'Maintained clean driving record and ensured optimal vehicle hygiene and cold-chain safety.',
          ],
        },
      ],
      education: [
        {
          degree: 'Higher Secondary Certificate (Plus Two)',
          institution: 'Board of Higher Secondary Examination, Kerala',
          year: '2011',
        },
        {
          degree: 'SSLC (10th Standard)',
          institution: 'General Education Department, Kerala',
          year: '2009',
        },
      ],
      coreSkills: [
        'UAE Roads & RTA Rules',
        'GPS & Waze Route Planning',
        'VIP & Family Chauffeur Etiquette',
        'Defensive Driving & Safety',
        'Preventive Vehicle Maintenance',
        'Delivery & Cash Handling',
      ],
      declaration:
        'I hereby declare that all the statements and information furnished above are true and correct to the best of my knowledge and belief.',
      cvPlace: 'Dubai, UAE',
      signatureName: 'MUHAMMED SHAFEEQ K.',
    },
  },
];

// Default Universal CV starts with the versatile All-Jobs Accountant & Office Admin CV (no Gulf lock-in)
export const INITIAL_GULF_CV_DATA: GulfCvData = CV_PRESET_MODELS[0].data;

export const INITIAL_AGREEMENT_DATA: RentalAgreementData = {
  subType: 'വാടക കരാർ (Rent Agreement)',
  titleMalayalam: 'വാടക ചീട്ട് (കെട്ടിട വാടക കരാർ പത്രം)',
  stampPaperHeaderSpaceMm: 65,
  executionDate: new Date().toLocaleDateString('ml-IN'),
  executionPlace: 'എറണാകുളം',
  firstPartyLabel: 'ഒന്നാം കക്ഷി (കെട്ടിട ഉടമ)',
  firstPartyDetails:
    'എറണാകുളം ജില്ലയിൽ കണയന്നൂർ താലൂക്കിൽ ഇടപ്പള്ളി വില്ലേജിൽ പുത്തൻപുരയ്ക്കൽ വീട്ടിൽ രാമചന്ദ്രൻ മകൻ 52 വയസ്സുള്ള സുരേഷ് കുമാർ.',
  secondPartyLabel: 'രണ്ടാം കക്ഷി (വാടകക്കാരൻ)',
  secondPartyDetails:
    'തൃശ്ശൂർ ജില്ലയിൽ മുകുന്ദപുരം താലൂക്കിൽ ചാലക്കുടി വില്ലേജിൽ വലിയപറമ്പിൽ വീട്ടിൽ ജോസഫ് മകൻ 36 വയസ്സുള്ള അനൂപ് ജോസഫ്.',
  preambleParagraph:
    'ഒന്നാം കക്ഷിയുടെ പൂർണ്ണ ഉടമസ്ഥതയിലും കൈവശത്തിലുമുള്ള താഴെ പട്ടികയിൽ വിവരിക്കുന്ന കെട്ടിടം രണ്ടാം കക്ഷിക്ക് താഴെ പറയുന്ന വ്യവസ്ഥകൾക്ക് വിധേയമായി 11 (പതിനൊന്ന്) മാസക്കാലയളവിലേക്ക് വാടകയ്ക്ക് നൽകുവാൻ ഇരു കക്ഷികളും തമ്മിൽ സമ്മതിച്ച് എഴുതി ഒപ്പിടുന്ന വാടക കരാർ പത്രം.',
  clauses: [
    '1. ടി കെട്ടിടത്തിന് പ്രതിമാസം ₹12,000/- (പന്ത്രണ്ടായിരം രൂപ മാത്രം) വാടക നിശ്ചയിച്ചിട്ടുള്ളതും, ആയത് എല്ലാ ഇംഗ്ലീഷ് മാസവും 5-ാം തീയതിക്കകം രണ്ടാം കക്ഷി ഒന്നാം കക്ഷിക്ക് നൽകി രസീത് വാങ്ങേണ്ടതുമാകുന്നു.',
    '2. വാടക ഉറപ്പിലേക്കായി പലിശയില്ലാത്ത അഡ്വാൻസ് തുകയായി ₹50,000/- (അമ്പതിനായിരം രൂപ മാത്രം) രണ്ടാം കക്ഷി ഇന്ന് ഒന്നാം കക്ഷിയെ ഏൽപ്പിച്ചിട്ടുള്ളതും, കരാർ കാലാവധി കഴിഞ്ഞ് കെട്ടിടം ഒഴിയുമ്പോൾ വാടക കുടിശ്ശികയോ കേടുപാടുകളോ ഉണ്ടെങ്കിൽ ആയത് കിഴിച്ച് ബാക്കി തുക തിരികെ നൽകുന്നതുമാകുന്നു.',
    '3. കെട്ടിടത്തിലെ വൈദ്യുതി ചാർജ്ജ്, വെള്ളക്കരം എന്നിവ അതാത് മാസങ്ങളിൽ രണ്ടാം കക്ഷി തന്നെ നേരിട്ട് അടച്ച് രസീത് സൂക്ഷിക്കേണ്ടതാണ്.',
    '4. ഒന്നാം കക്ഷിയുടെ രേഖാമൂലമുള്ള അനുവാദമില്ലാതെ കെട്ടിടം മറ്റൊരാൾക്ക് കീഴ്‌വാടകയ്ക്ക് (Sub-lease) കൊടുക്കുവാനോ കെട്ടിടത്തിന് രൂപമാറ്റം വരുത്തുവാനോ രണ്ടാം കക്ഷിക്ക് അധികാരമുണ്ടായിരിക്കുന്നതല്ല.',
    '5. കരാർ കാലാവധിക്കുള്ളിൽ കെട്ടിടം ഒഴിയണമെങ്കിലോ ഒഴിപ്പിക്കണമെങ്കിലോ ഇരു കക്ഷികളും ഒരു മാസം മുമ്പ് പരസ്പരം രേഖാമൂലം അറിയിക്കേണ്ടതാണ്.',
  ],
  schedulePropertyDetails:
    'എറണാകുളം ജില്ല, ഇടപ്പള്ളി ഗ്രാമപഞ്ചായത്ത്/കോർപ്പറേഷൻ വാർഡ് 34-ൽ കെട്ടിട നമ്പർ 34/1182 ആയ 1100 ചതുരശ്ര അടി വിസ്തീർണ്ണമുള്ള കോൺക്രീറ്റ് വീടും അതിനോട് ചേർന്നുള്ള സൗകര്യങ്ങളും.',
  witnesses: [
    '1. അബ്ദുൾ സലാം, തണൽ മൻസിൽ, ഇടപ്പള്ളി (ഒപ്പ്: ...........................)',
    '2. വിനോദ് കെ. ആർ., ശ്രീനിലയം, കലൂർ (ഒപ്പ്: ...........................)',
  ],
};

export interface MarkListPresetModel {
  id: string;
  badgeIcon: string;
  badgeMalayalam: string;
  titleMalayalam: string;
  subtitleMalayalam: string;
  data: TeacherMarkListData;
  buildData: () => TeacherMarkListData;
}

const TODAY_ML_STR = new Date().toLocaleDateString('ml-IN');

export const INITIAL_MARKLIST_DATA: TeacherMarkListData = {
  presetId: 'hs-sslc-9point',
  modelPresetId: 'hs-sslc-9point',
  evaluationMode: 'hs_hss_marks_and_grade',
  institutionSubtitle: 'പൊതുവിദ്യാഭ്യാസ വകുപ്പ്, കേരളം (SCERT 9-Point Grading)',
  schoolName: 'ഗവൺമെന്റ് മോഡൽ ഹൈസ്കൂൾ & എച്ച്.എസ്.എസ്, കേരളം',
  examTitle: 'വാർഷിക / പാദവാർഷിക പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് & പ്രോഗ്രസ് റിപ്പോർട്ട്',
  classAndDivision: 'ക്ലാസ് : 10 - A ഡിവിഷൻ',
  academicYear: '2025 - 2026',
  classTeacherName: 'ശ്രീമതി. ദീപ നായർ (ക്ലാസ് ടീച്ചർ)',
  maxMarksLabel: 'പരമാവധി മാർക്ക്:',
  maxMarksPerSubject: 100,
  subjects: ['മലയാളം', 'ഇംഗ്ലീഷ്', 'ഹിന്ദി', 'ഗണിതം', 'സയൻസ്', 'സോഷ്യൽ'],
  rollNoHeader: 'നമ്പർ',
  studentNameHeader: 'വിദ്യാർത്ഥിയുടെ പേര്',
  totalHeader: 'ആകെ',
  percentageHeader: '%',
  gradeHeader: 'ഗ്രേഡ്',
  rankHeader: 'റാങ്ക്',
  remarksHeader: 'അഭിപ്രായം',
  showMarksColumns: true,
  showTotalAndPercent: true,
  showTotalAndPercentage: true,
  showGradeColumn: true,
  showRankColumn: false,
  showRemarksColumn: true,
  showSummaryBox: true,
  showSummaryCards: true,
  gradingScaleNote:
    'SCERT 9-പോയിന്റ് ഗ്രേഡിങ്ങ് സൂചിക: 90%+ : A+ | 80-89% : A | 70-79% : B+ | 60-69% : B | 50-59% : C+ | 40-49% : C | 30-39% : D+ | 20-29% : D | <20% : E',
  placeLabel: 'സ്ഥലം :',
  place: 'കേരളം',
  dateLabel: 'തീയതി :',
  date: TODAY_ML_STR,
  sealText: '(സ്കൂൾ സീൽ / Institution Seal)',
  showClassTeacherSign: true,
  classTeacherSignatureLine: 'ഒപ്പ് : ....................................',
  showHeadmasterSign: true,
  showHeadmasterSignature: true,
  headmasterSignatureLine: 'ഒപ്പ് : ....................................',
  headmasterTitle: 'ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ',
  students: [
    {
      id: 'st-1',
      rollNo: '1',
      studentName: 'അഭിഷേക് കൃഷ്ണൻ',
      marks: [94, 91, 89, 98, 95, 92],
      subjectGrades: ['A', 'A', 'A', 'A', 'A', 'A'],
      remarks: 'ഉന്നത വിജയം (Full A+)',
    },
    {
      id: 'st-2',
      rollNo: '2',
      studentName: 'ഫാത്തിമ സഹ്റ',
      marks: [96, 94, 92, 91, 93, 95],
      subjectGrades: ['A', 'A', 'A', 'A', 'A', 'A'],
      remarks: 'ഉന്നത വിജയം (Full A+)',
    },
    {
      id: 'st-3',
      rollNo: '3',
      studentName: 'അമൽ ജോസഫ്',
      marks: [82, 78, 80, 88, 85, 81],
      subjectGrades: ['A', 'B', 'A', 'A', 'A', 'A'],
      remarks: 'മികച്ച പ്രകടനം',
    },
    {
      id: 'st-4',
      rollNo: '4',
      studentName: 'അനന്യ എസ്. നായർ',
      marks: [90, 86, 84, 79, 88, 87],
      subjectGrades: ['A', 'A', 'A', 'B', 'A', 'A'],
      remarks: 'മികച്ച പ്രകടനം',
    },
    {
      id: 'st-5',
      rollNo: '5',
      studentName: 'മുഹമ്മദ് റിസ്വാൻ',
      marks: [74, 68, 72, 76, 71, 75],
      subjectGrades: ['B', 'B', 'B', 'B', 'B', 'B'],
      remarks: 'നല്ല പുരോഗതി',
    },
    {
      id: 'st-6',
      rollNo: '6',
      studentName: 'ഗൗരി നന്ദന ആർ.',
      marks: [92, 89, 91, 94, 90, 93],
      subjectGrades: ['A', 'A', 'A', 'A', 'A', 'A'],
      remarks: 'ഉന്നത വിജയം',
    },
    {
      id: 'st-7',
      rollNo: '7',
      studentName: 'ആദിത്യൻ കെ. വി.',
      marks: [85, 81, 79, 84, 88, 82],
      subjectGrades: ['A', 'A', 'B', 'A', 'A', 'A'],
      remarks: 'മികച്ച പ്രകടനം',
    },
    {
      id: 'st-8',
      rollNo: '8',
      studentName: 'ആയിഷ നൗറിൻ',
      marks: [95, 92, 90, 93, 91, 94],
      subjectGrades: ['A', 'A', 'A', 'A', 'A', 'A'],
      remarks: 'ഉന്നത വിജയം (Full A+)',
    },
    {
      id: 'st-9',
      rollNo: '9',
      studentName: 'ശ്രീഹരി എം.',
      marks: [68, 64, 70, 72, 69, 71],
      subjectGrades: ['B', 'B', 'B', 'B', 'B', 'B'],
      remarks: 'നല്ല പുരോഗതി',
    },
    {
      id: 'st-10',
      rollNo: '10',
      studentName: 'നിവേദ്യ പി. എസ്.',
      marks: [88, 85, 87, 89, 86, 90],
      subjectGrades: ['A', 'A', 'A', 'A', 'A', 'A'],
      remarks: 'മികച്ച പ്രകടനം',
    },
  ],
};

function createPresetEntry(
  id: string,
  badgeIcon: string,
  badgeMalayalam: string,
  titleMalayalam: string,
  subtitleMalayalam: string,
  dataObj: TeacherMarkListData
): MarkListPresetModel {
  const normalizedData: TeacherMarkListData = {
    ...dataObj,
    presetId: id,
    modelPresetId: id,
    showTotalAndPercentage:
      dataObj.showTotalAndPercentage !== undefined
        ? dataObj.showTotalAndPercentage
        : dataObj.showTotalAndPercent,
    showSummaryCards:
      dataObj.showSummaryCards !== undefined ? dataObj.showSummaryCards : dataObj.showSummaryBox,
    showHeadmasterSignature:
      dataObj.showHeadmasterSignature !== undefined
        ? dataObj.showHeadmasterSignature
        : dataObj.showHeadmasterSign,
  };
  return {
    id,
    badgeIcon,
    badgeMalayalam,
    titleMalayalam,
    subtitleMalayalam,
    data: normalizedData,
    buildData: () =>
      JSON.parse(JSON.stringify(normalizedData)) as TeacherMarkListData,
  };
}

export const MARKLIST_PRESET_MODELS: MarkListPresetModel[] = [
  createPresetEntry(
    'lp-cce-grade-only',
    '👶',
    'LP സ്കൂൾ (ക്ലാസ് 1–4) · നമ്പർ മാർക്കില്ല',
    '1. LP സ്കൂൾ CCE ഗ്രേഡ് പട്ടിക (ക്ലാസ് 1 മുതൽ 4 വരെ — ഗ്രേഡ് മാത്രം: A, B, C, D, E)',
    'കേരള പൊതുവിദ്യാഭ്യാസ (SCERT CCE) നിയമപ്രകാരം നമ്പർ മാർക്കും റാങ്കും ഇല്ലാതെ ഗ്രേഡും (A–E) പഠന മികവ് അഭിപ്രായവും മാത്രമുള്ള പട്ടിക',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'lp-cce-grade-only',
      modelPresetId: 'lp-cce-grade-only',
      evaluationMode: 'lp_up_grade_only',
      institutionSubtitle:
        'പൊതുവിദ്യാഭ്യാസ വകുപ്പ്, കേരളം — നിരന്തര സമഗ്ര മൂല്യനിർണ്ണയം (SCERT CCE — Direct Grading Only)',
      schoolName: 'ഗവൺമെന്റ് എൽ.പി സ്കൂൾ (GLPS), കേരളം',
      examTitle: 'പാദവാർഷിക / വാർഷിക പഠന പുരോഗതി രേഖ (CCE Grade Report — LP വിഭാഗം)',
      classAndDivision: 'ക്ലാസ് : 4 - A ഡിവിഷൻ',
      classTeacherName: 'ക്ലാസ് ടീച്ചറുടെ പേരും ഒപ്പും',
      subjects: [
        'മലയാളം',
        'ഇംഗ്ലീഷ്',
        'ഗണിതം',
        'പരിസരപഠനം (EVS)',
        'കല / കായികം / പ്രവൃത്തിപരിചയം',
      ],
      showMarksColumns: false,
      showTotalAndPercent: false,
      showTotalAndPercentage: false,
      showGradeColumn: true,
      showRankColumn: false,
      showRemarksColumn: true,
      showSummaryBox: true,
      showSummaryCards: true,
      gradeHeader: 'സമഗ്ര ഗ്രേഡ്',
      remarksHeader: 'പഠന മികവ് / അധ്യാപകന്റെ വിലയിരുത്തൽ',
      gradingScaleNote:
        'കേരള SCERT CCE ഗ്രേഡിംഗ് നിയമം (LP/UP വിഭാഗം — നമ്പർ മാർക്കോ റാങ്കോ രേഖപ്പെടുത്താൻ പാടില്ല): A : ഏറ്റവും മികച്ചത് (Outstanding) | B : മികച്ചത് (Very Good) | C : നല്ലത് (Good) | D : ശരാശരി (കൂടുതൽ ശ്രദ്ധ വേണം) | E : പ്രത്യേക പിന്തുണ ആവശ്യമാണ്',
      headmasterTitle: 'ഹെഡ്മാസ്റ്റർ / പ്രധാനാധ്യാപകൻ',
      students: INITIAL_MARKLIST_DATA.students.map((st, idx) => ({
        ...st,
        marks: [90, 88, 92, 95, 90],
        subjectGrades:
          idx % 3 === 0
            ? ['A', 'A', 'A', 'A', 'A']
            : idx % 3 === 1
            ? ['A', 'B', 'A', 'A', 'A']
            : ['B', 'B', 'A', 'A', 'A'],
        remarks:
          idx % 3 === 0
            ? 'എല്ലാ പ്രവർത്തനങ്ങളിലും മികച്ച പങ്കാളിത്തം'
            : 'വായനയിലും എഴുത്തിലും വളരെ നല്ല പുരോഗതി',
      })),
    }
  ),
  createPresetEntry(
    'up-cce-grade-only',
    '🏫',
    'UP സ്കൂൾ (ക്ലാസ് 5–7) · ഗ്രേഡ് മാത്രം',
    '2. UP സ്കൂൾ മൂല്യനിർണ്ണയ ഗ്രേഡ് പട്ടിക (ക്ലാസ് 5 മുതൽ 7 വരെ — ഗ്രേഡ് A to E മാത്രം)',
    'യു.പി സ്കൂൾ ക്ലാസുകൾക്ക് കേരള സർക്കാർ SCERT മാനദണ്ഡപ്രകാരം നമ്പർ മാർക്കും റാങ്കും ഒഴിവാക്കി A, B, C, D, E ഗ്രേഡ് മാത്രമുള്ള പട്ടിക',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'up-cce-grade-only',
      modelPresetId: 'up-cce-grade-only',
      evaluationMode: 'lp_up_grade_only',
      institutionSubtitle:
        'പൊതുവിദ്യാഭ്യാസ വകുപ്പ്, കേരളം — യു.പി വിഭാഗം നിരന്തര മൂല്യനിർണ്ണയ ഗ്രേഡ് പട്ടിക (CCE)',
      schoolName: 'ഗവൺമെന്റ് യു.പി സ്കൂൾ (GUPS), കേരളം',
      examTitle: 'യു.പി വിഭാഗം പഠന പുരോഗതി ഗ്രേഡ് പട്ടിക (Classes 5, 6, 7 — CCE Grading)',
      classAndDivision: 'ക്ലാസ് : 7 - A ഡിവിഷൻ',
      classTeacherName: 'ക്ലാസ് ടീച്ചറുടെ പേരും ഒപ്പും',
      subjects: [
        'മലയാളം',
        'ഇംഗ്ലീഷ്',
        'ഹിന്ദി',
        'ഗണിതം',
        'അടിസ്ഥാന ശാസ്ത്രം',
        'സാമൂഹ്യശാസ്ത്രം',
      ],
      showMarksColumns: false,
      showTotalAndPercent: false,
      showTotalAndPercentage: false,
      showGradeColumn: true,
      showRankColumn: false,
      showRemarksColumn: true,
      showSummaryBox: true,
      showSummaryCards: true,
      gradeHeader: 'ഓവറോൾ ഗ്രേഡ്',
      remarksHeader: 'പഠന നിലവാരം / അഭിപ്രായം',
      gradingScaleNote:
        'കേരള SCERT CCE ഗ്രേഡിംഗ് സൂചിക (UP വിഭാഗം): A : ഏറ്റവും മികച്ചത് | B : മികച്ചത് | C : നല്ലത് | D : കൂടുതൽ ശ്രദ്ധ വേണം | E : പ്രത്യേക പഠന പിന്തുണ നൽകണം',
      headmasterTitle: 'ഹെഡ്മാസ്റ്റർ / പ്രധാനാധ്യാപകൻ',
      students: INITIAL_MARKLIST_DATA.students.map((st, idx) => ({
        ...st,
        marks: [90, 85, 88, 92, 89, 91],
        subjectGrades:
          idx % 2 === 0
            ? ['A', 'A', 'A', 'A', 'A', 'A']
            : ['A', 'B', 'B', 'A', 'A', 'B'],
        remarks: idx % 2 === 0 ? 'മികച്ച പഠന മികവ്' : 'വളരെ നല്ല പുരോഗതി',
      })),
    }
  ),
  createPresetEntry(
    'hs-sslc-9point',
    '🎓',
    'ഹൈസ്കൂൾ (ക്ലാസ് 8–10) · 9-Point Grade',
    '3. ഹൈസ്കൂൾ (ക്ലാസ് 8, 9, 10 / SSLC) മാർക്ക് & 9-പോയിന്റ് ഗ്രേഡ് ലിസ്റ്റ് (A+ to E)',
    'ഓണപ്പരീക്ഷ, ക്രിസ്മസ് പരീക്ഷ, വാർഷിക പരീക്ഷ, മോഡൽ പരീക്ഷ എന്നിവയ്ക്ക് മാർക്കും A+ മുതൽ E വരെയുള്ള ഗ്രേഡും',
    INITIAL_MARKLIST_DATA
  ),
  createPresetEntry(
    'hss-plustwo-marklist',
    '🏛️',
    'ഹയർ സെക്കൻഡറി (+1 / +2)',
    '4. ഹയർ സെക്കൻഡറി (+1 / +2) സയൻസ് / കൊമേഴ്സ് / ഹ്യൂമാനിറ്റീസ് മാർക്ക് ലിസ്റ്റ്',
    'പ്ലസ് വൺ, പ്ലസ് ടു ക്ലാസുകളിലെ ടെർമിനൽ / മോഡൽ പരീക്ഷാ മാർക്കും ഗ്രേഡും (പ്രിൻസിപ്പൽ ഒപ്പോടെ)',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'hss-plustwo-marklist',
      modelPresetId: 'hss-plustwo-marklist',
      evaluationMode: 'hs_hss_marks_and_grade',
      institutionSubtitle: 'ഡയറക്ടറേറ്റ് ഓഫ് ജനറൽ എഡ്യൂക്കേഷൻ (Higher Secondary Wing), കേരളം',
      schoolName: 'ഗവൺമെന്റ് ഹയർ സെക്കൻഡറി സ്കൂൾ (GHSS), കേരളം',
      examTitle: 'ഹയർ സെക്കൻഡറി (+1 / +2) പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് & ഗ്രേഡ് ഷീറ്റ്',
      classAndDivision: 'ക്ലാസ് : Plus Two (+2) Science / Commerce',
      classTeacherName: 'ശ്രീ. അജിത്ത് കുമാർ (HSST / Class Charge)',
      headmasterTitle: 'പ്രിൻസിപ്പൽ (Principal)',
      subjects: [
        'English',
        'Second Lang',
        'Physics / Accountancy',
        'Chemistry / Business',
        'Biology / Computer',
        'Mathematics / Econ',
      ],
      showMarksColumns: true,
      showTotalAndPercent: true,
      showTotalAndPercentage: true,
      showGradeColumn: true,
      showRankColumn: false,
      showRemarksColumn: true,
    }
  ),
  createPresetEntry(
    'madrasa-annual-marklist',
    '🕌',
    '🕌 മദ്രസ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് (ഉസ്താദ് സ്പെഷ്യൽ)',
    '5. മദ്രസ വാർഷിക / പാദവാർഷിക പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് & റേഞ്ച് രജിസ്റ്റർ (ക്ലാസ് 1–12)',
    'സമസ്ത (SKIMVB) / ദക്ഷിണ / KNM / വിസ്ഡം മദ്രസകളിലെ ഉസ്താദുമാർക്ക് ഖുർആൻ, ഫിഖ്ഹ്, അഖീദ, താരീഖ്, അഖ്‌ലാഖ്, അറബിക് മാർക്ക് ലിസ്റ്റ് തയ്യാറാക്കാൻ',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'madrasa-annual-marklist',
      modelPresetId: 'madrasa-annual-marklist',
      evaluationMode: 'madrasa_marklist',
      institutionSubtitle:
        'മദ്രസ വിദ്യാഭ്യാസ ബോർഡ് — വാർഷിക / അർദ്ധവാർഷിക പരീക്ഷാ മാർക്ക് രജിസ്റ്റർ',
      schoolName: 'നൂറുൽ ഇസ്ലാം മദ്രസ, കേരളം (Reg. No: ____)',
      examTitle: 'മദ്രസ വാർഷിക പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് & ഫലപ്രഖ്യാപന പട്ടിക',
      classAndDivision: 'ക്ലാസ് : 5 - A ഡിവിഷൻ',
      academicYear: '2025 - 2026 (ഹിജ്റ 1447)',
      classTeacherName: 'ഉസ്താദ് അബ്ദുൾ റഹ്മാൻ മുസ്‌ലിയാർ (ക്ലാസ് മുഅല്ലിം)',
      maxMarksPerSubject: 100,
      subjects: [
        'ഖുർആൻ & തജ്‌വീദ്',
        'ഫിഖ്ഹ് (കർമ്മശാസ്ത്രം)',
        'അഖീദ (വിശ്വാസം)',
        'താരീഖ് (ചരിത്രം)',
        'അഖ്‌ലാഖ് (സ്വഭാവം)',
        'ലിസാനുൽ ഖുർആൻ (അറബിക്)',
      ],
      showMarksColumns: true,
      showTotalAndPercent: true,
      showTotalAndPercentage: true,
      showGradeColumn: true,
      showRankColumn: true,
      showRemarksColumn: true,
      showSummaryBox: true,
      showSummaryCards: true,
      sealText: '(മദ്രസ സീൽ / Madrasa Seal)',
      headmasterTitle: 'സദർ മുഅല്ലിം (Sadr Muallim)',
      gradingScaleNote:
        'മദ്രസ പരീക്ഷാ ഗ്രേഡിംഗ്: 90%+ : ഡിസ്റ്റിംഗ്ഷൻ (A+) | 80-89% : ഫസ്റ്റ് ക്ലാസ് (A) | 60-79% : സെക്കൻഡ് ക്ലാസ് (B) | 35%+ : പാസ്സ് (C)',
      students: [
        {
          id: 'mad-1',
          rollNo: '1',
          studentName: 'മുഹമ്മദ് സിനാൻ കെ.',
          marks: [96, 92, 94, 90, 95, 91],
          remarks: 'ഡിസ്റ്റിംഗ്ഷൻ (ഒന്നാം സ്ഥാനം)',
        },
        {
          id: 'mad-2',
          rollNo: '2',
          studentName: 'ഫാത്തിമ ഹന എം.',
          marks: [95, 94, 91, 92, 96, 90],
          remarks: 'ഡിസ്റ്റിംഗ്ഷൻ',
        },
        {
          id: 'mad-3',
          rollNo: '3',
          studentName: 'അഹമ്മദ് കബീർ പി.',
          marks: [84, 80, 82, 78, 86, 81],
          remarks: 'ഫസ്റ്റ് ക്ലാസ്',
        },
        {
          id: 'mad-4',
          rollNo: '4',
          studentName: 'ആയിഷ മിൻഹ സി.',
          marks: [88, 85, 89, 84, 90, 86],
          remarks: 'ഫസ്റ്റ് ക്ലാസ്',
        },
        {
          id: 'mad-5',
          rollNo: '5',
          studentName: 'മുഹമ്മദ് റയ്യാൻ വി.',
          marks: [76, 72, 75, 70, 80, 74],
          remarks: 'വിജയിച്ചു',
        },
        {
          id: 'mad-6',
          rollNo: '6',
          studentName: 'മറിയം നസ്റിൻ കെ.',
          marks: [91, 89, 90, 88, 93, 87],
          remarks: 'ഡിസ്റ്റിംഗ്ഷൻ',
        },
        {
          id: 'mad-7',
          rollNo: '7',
          studentName: 'അബ്ദുല്ല ഫർഹാൻ',
          marks: [82, 79, 81, 77, 85, 80],
          remarks: 'ഫസ്റ്റ് ക്ലാസ്',
        },
        {
          id: 'mad-8',
          rollNo: '8',
          studentName: 'ഖദീജ ശിഫ ടി.',
          marks: [93, 91, 92, 89, 94, 90],
          remarks: 'ഡിസ്റ്റിംഗ്ഷൻ',
        },
      ],
    }
  ),
  createPresetEntry(
    'madrasa-practical-hifz',
    '📖',
    '🕌 മദ്രസ ഹിഫ്ള് & പ്രാക്ടിക്കൽ പരീക്ഷ',
    '6. മദ്രസ ഖുർആൻ പാരായണം, തജ്‌വീദ് & ഹിഫ്ള് (Practical / Oral Exam) ഗ്രേഡ് പട്ടിക',
    'മദ്രസകളിലെ ഖുർആൻ പാരായണം, ഹിഫ്ള്, ദുആ, നിസ്കാര ക്രമം എന്നിവയുടെ വാചിക/പ്രാക്ടിക്കൽ പരീക്ഷാ പട്ടിക',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'madrasa-practical-hifz',
      modelPresetId: 'madrasa-practical-hifz',
      evaluationMode: 'madrasa_marklist',
      institutionSubtitle: 'മദ്രസ പ്രാക്ടിക്കൽ & വാചിക പരീക്ഷാ മൂല്യനിർണ്ണയ പട്ടിക',
      schoolName: 'ഹുദാ ഇസ്ലാമിക് മദ്രസ & ഹിഫ്ള് അക്കാദമി',
      examTitle: 'ഖുർആൻ പാരായണം, തജ്‌വീദ് & പ്രാക്ടിക്കൽ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ്',
      classAndDivision: 'ക്ലാസ് : 3 - A ഡിവിഷൻ',
      classTeacherName: 'ഹാഫിള് മുഹമ്മദ് ശരീഫ് മൗലവി (മുഅല്ലിം)',
      maxMarksPerSubject: 50,
      subjects: [
        'ഖുർആൻ പാരായണം',
        'തജ്‌വീദ് നിയമങ്ങൾ',
        'ഹിഫ്ള് (മനഃപാഠം)',
        'ദുആ & ദിക്റുകൾ',
        'നിസ്കാര ക്രമം (പ്രാക്ടിക്കൽ)',
      ],
      showMarksColumns: true,
      showTotalAndPercent: true,
      showTotalAndPercentage: true,
      showGradeColumn: true,
      showRankColumn: false,
      showRemarksColumn: true,
      sealText: '(മദ്രസ സീൽ)',
      headmasterTitle: 'സദർ മുഅല്ലിം / പരീക്ഷാ സൂപ്രണ്ട്',
    }
  ),
  createPresetEntry(
    'tuition-rank-list',
    '🏆',
    'ട്യൂഷൻ സെന്റർ / എൻട്രൻസ് റാങ്ക് ലിസ്റ്റ്',
    '7. ട്യൂഷൻ സെന്റർ / കോച്ചിംഗ് ക്ലാസ് യൂണിറ്റ് ടെസ്റ്റ് & റാങ്ക് ലിസ്റ്റ്',
    'ട്യൂഷൻ സെന്ററുകൾക്കും സ്വകാര്യ കോച്ചിംഗ് സ്ഥാപനങ്ങൾക്കും മാർക്ക്, ശതമാനം (%), ഗ്രേഡ്, റാങ്ക് എന്നിവയോടെയുള്ള പട്ടിക',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'tuition-rank-list',
      modelPresetId: 'tuition-rank-list',
      evaluationMode: 'marks_grade_rank',
      institutionSubtitle: 'പ്രതിമാസ യൂണിറ്റ് ടെസ്റ്റ് & റാങ്ക് അസസ്‌മെന്റ് റിപ്പോർട്ട്',
      schoolName: 'എക്സലൻസ് ട്യൂഷൻ & എൻട്രൻസ് കോച്ചിംഗ് സെന്റർ',
      examTitle: 'മാസപ്പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് & റാങ്ക് പട്ടിക (Monthly Test Rank List)',
      classAndDivision: 'ബാച്ച് : SSLC / Plus Two Special Batch',
      classTeacherName: 'സെന്റർ കോർഡിനേറ്റർ / അധ്യാപകൻ',
      showMarksColumns: true,
      showTotalAndPercent: true,
      showTotalAndPercentage: true,
      showGradeColumn: true,
      showRankColumn: true,
      showRemarksColumn: false,
      sealText: '(സ്ഥാപന സീൽ)',
      headmasterTitle: 'ഡയറക്ടർ / സെന്റർ ഹെഡ്',
    }
  ),
  createPresetEntry(
    'preprimary-lkg-ukg',
    '🎨',
    'LKG / UKG / അങ്കണവാടി (ഗ്രേഡ് മാത്രം)',
    '8. പ്രീ-പ്രൈമറി (LKG / UKG / അങ്കണവാടി) കുട്ടികളുടെ മികവ് ഗ്രേഡ് പട്ടിക',
    'ചെറിയ കുട്ടികൾക്ക് നമ്പർ മാർക്കില്ലാതെ A, B, C ഗ്രേഡും പ്രോത്സാഹന അഭിപ്രായങ്ങളും മാത്രമുള്ള പട്ടിക',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'preprimary-lkg-ukg',
      modelPresetId: 'preprimary-lkg-ukg',
      evaluationMode: 'lp_up_grade_only',
      institutionSubtitle: 'പ്രീ-പ്രൈമറി / ശിശുസൗഹൃദ പ്രവർത്തന മികവ് പട്ടിക',
      schoolName: 'ഗവ. പ്രീ-പ്രൈമറി & എൽ.കെ.ജി / യു.കെ.ജി സ്കൂൾ',
      examTitle: 'കുരുന്നുകളുടെ പഠന-പ്രവർത്തന മികവ് പട്ടിക (Activity Assessment)',
      classAndDivision: 'ക്ലാസ് : UKG - A',
      classTeacherName: 'പ്രീ-പ്രൈമറി ടീച്ചർ',
      subjects: [
        'മലയാളം അക്ഷരങ്ങൾ',
        'English Alphabets',
        'എണ്ണൽ (Numbers)',
        'പാട്ടും കഥയും (Rhymes)',
        'ചിത്രരചന & കളികൾ',
      ],
      showMarksColumns: false,
      showTotalAndPercent: false,
      showTotalAndPercentage: false,
      showGradeColumn: true,
      showRankColumn: false,
      showRemarksColumn: true,
      headmasterTitle: 'ഹെഡ്മാസ്റ്റർ / സെന്റർ ഇൻ-ചാർജ്',
      students: INITIAL_MARKLIST_DATA.students.slice(0, 8).map((st) => ({
        ...st,
        subjectGrades: ['A', 'A', 'A', 'A', 'A'],
        remarks: 'മിടുക്കൻ / മിടുക്കി! എല്ലാ കളികളിലും പാട്ടുകളിലും സജീവമാണ്.',
      })),
    }
  ),
  createPresetEntry(
    'class-attendance-register',
    '📋',
    'ക്ലാസ് ഹാജർ പട്ടിക (Attendance Sheet)',
    '9. കുട്ടികളുടെ ഹാജർ പട്ടിക / അറ്റൻഡൻസ് രജിസ്റ്റർ (Class Attendance Register — സ്കൂൾ & മദ്രസ)',
    'സ്കൂൾ / മദ്രസ അധ്യാപകർക്ക് പ്രതിവാര അല്ലെങ്കിൽ പ്രതിദിന ഹാജർ (P / A) രേഖപ്പെടുത്താനും പ്രിന്റ് എടുക്കാനുമുള്ള A4 പട്ടിക',
    {
      ...INITIAL_MARKLIST_DATA,
      presetId: 'class-attendance-register',
      modelPresetId: 'class-attendance-register',
      evaluationMode: 'lp_up_grade_only',
      institutionSubtitle: 'വിദ്യാർത്ഥികളുടെ പ്രതിവാര ഹാജർ പട്ടിക (Class Attendance Register)',
      schoolName: 'ഗവൺമെന്റ് ഹയർ സെക്കൻഡറി സ്കൂൾ / മദ്രസ, കേരളം',
      examTitle: 'കുട്ടികളുടെ പ്രതിവാര ഹാജർ പട്ടിക (Student Attendance Sheet)',
      classAndDivision: 'ക്ലാസ് : 8 - A ഡിവിഷൻ',
      classTeacherName: 'ക്ലാസ് ടീച്ചർ / ഉസ്താദ്',
      subjects: [
        'തിങ്കൾ (Mon)',
        'ചൊവ്വ (Tue)',
        'ബുധൻ (Wed)',
        'വ്യാഴം (Thu)',
        'വെള്ളി (Fri)',
        'ശനി (Sat)',
      ],
      showMarksColumns: false,
      showTotalAndPercent: false,
      showTotalAndPercentage: false,
      showGradeColumn: true,
      showRankColumn: false,
      showRemarksColumn: true,
      showSummaryBox: true,
      showSummaryCards: true,
      gradeHeader: 'ആകെ ഹാജർ',
      remarksHeader: 'ഒപ്പ് / അഭിപ്രായം (Remarks)',
      summaryTotalStudentsLabel: 'ആകെ കുട്ടികൾ',
      summaryPassPercentageLabel: 'ശരാശരി ഹാജർ %',
      summaryPassPercentageValueOverride: '98% ഹാജർ',
      summaryAPlusCountLabel: '100% ഹാജരുള്ളവർ',
      summaryTopperLabel: 'ആഴ്ച / മാസം',
      summaryTopperValueOverride: 'നിലവിലെ ആഴ്ച',
      gradingScaleNote:
        'ഹാജർ സൂചിക (Attendance Key): P = ഹാജർ (Present) | A = അവധി (Absent) | L = ലീവ് അപേക്ഷ നൽകി (Leave)',
      headmasterTitle: 'ഹെഡ്മാസ്റ്റർ / പ്രിൻസിപ്പൽ / സദർ മുഅല്ലിം',
      students: INITIAL_MARKLIST_DATA.students.map((st, idx) => ({
        ...st,
        subjectGrades:
          idx === 3 ? ['P', 'P', 'A', 'P', 'P', 'P'] : ['P', 'P', 'P', 'P', 'P', 'P'],
        overallGradeOverride: idx === 3 ? '5 / 6' : '6 / 6',
        remarks: idx === 3 ? '1 ദിവസം അവധി (Leave)' : 'മുഴുവൻ ഹാജർ (100%)',
      })),
    }
  ),
];

export const QUICK_TEMPLATES: QuickTemplateItem[] = [
  // 0. SCHOOL & STUDENTS SPECIALS (Leave Letter, TC, Bonafide, Fee Concession, Study Tour Consent, PTA Notice, Teacher Leave, Attendance, Speech, Project Cover)
  {
    id: 'school-student-leave-letter',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'ടീച്ചർക്കുള്ള ലീവ് ലെറ്റർ (സ്കൂൾ അവധി അപേക്ഷ)',
    subtitleMalayalam: 'പനിയോ മറ്റ് കാരണങ്ങളോ മൂലം സ്കൂളിൽ വരാതിരുന്നാൽ ക്ലാസ് ടീച്ചർക്ക് നൽകാൻ',
    badgeText: 'സ്കൂൾ സ്പെഷ്യൽ · സൗജന്യം',
    sampleVoicePrompt:
      'ടീച്ചറെ, എനിക്ക് പനിയായതുകൊണ്ട് നാളെ സ്കൂളിൽ വരാൻ പറ്റില്ല. ക്ലാസ് ടീച്ചർക്ക് കൊടുക്കാൻ ഒരു ലീവ് ലെറ്റർ വേണം.',
  },
  {
    id: 'school-bonafide-study-certificate',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'പഠന സർട്ടിഫിക്കറ്റ് / ബോണഫൈഡ് സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Bonafide Certificate)',
    subtitleMalayalam:
      'പാസ്പോർട്ട്, ബാങ്ക് അക്കൗണ്ട്, ബസ് കൺസഷൻ, സ്കോളർഷിപ്പ് ആവശ്യങ്ങൾക്ക് പ്രിൻസിപ്പൽ / ഹെഡ്മാസ്റ്റർക്ക് നൽകാൻ',
    badgeText: 'സ്കൂൾ സർട്ടിഫിക്കറ്റ്',
    sampleVoicePrompt:
      'എന്റെ മകൻ ഈ സ്കൂളിൽ എട്ടാം ക്ലാസ്സിൽ പഠിക്കുന്ന വിദ്യാർത്ഥിയാണെന്ന പഠന സർട്ടിഫിക്കറ്റ് (Bonafide Certificate) പാസ്പോർട്ട് ആവശ്യത്തിനായി അനുവദിച്ചു തരാൻ ഹെഡ്മാസ്റ്റർക്ക് അപേക്ഷ വേണം.',
  },
  {
    id: 'school-fee-concession-scholarship',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'ഫീസ് ഇളവ് / സ്കോളർഷിപ്പ് അപേക്ഷ (Fee Concession / Scholarship Application)',
    subtitleMalayalam:
      'സാമ്പത്തിക പ്രയാസം മൂലം സ്കൂൾ / കോളേജ് ഫീസ് ഇളവ് ലഭിക്കാനും സ്കോളർഷിപ്പിനുമായി പ്രിൻസിപ്പലിന് നൽകാൻ',
    badgeText: 'സ്കൂൾ / കോളേജ്',
    sampleVoicePrompt:
      'സാമ്പത്തികമായി പിന്നോക്കം നിൽക്കുന്ന കുടുംബമായതിനാൽ എന്റെ കുട്ടിയുടെ സ്കൂൾ ഫീസിൽ ഇളവ് അനുവദിച്ചു തരാൻ പ്രിൻസിപ്പലിന് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'school-study-tour-consent',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'പഠനയാത്ര (Study Tour / Excursion) രക്ഷിതാവിന്റെ സമ്മതപത്രം',
    subtitleMalayalam:
      'സ്കൂൾ / കോളേജ് പഠനയാത്രയിൽ (Study Tour) കുട്ടിയെ പങ്കെടുപ്പിക്കാൻ രക്ഷിതാവ് ക്ലാസ് ടീച്ചർക്ക് നൽകുന്ന സമ്മതപത്രം',
    badgeText: 'രക്ഷിതാവിന്റെ സമ്മതപത്രം',
    sampleVoicePrompt:
      'സ്കൂളിൽ നിന്ന് നടത്തുന്ന പഠനയാത്രയിൽ എന്റെ മകനെ പങ്കെടുപ്പിക്കാൻ പൂർണ്ണ സമ്മതമാണെന്ന് അറിയിച്ചുകൊണ്ട് ക്ലാസ് ടീച്ചർക്ക് നൽകാൻ ഒരു സമ്മതപത്രം വേണം.',
  },
  {
    id: 'school-conduct-condonation-letter',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'സ്വഭാവ സർട്ടിഫിക്കറ്റ് (Conduct Certificate) & ഹാജർ കുറവ് പരിഹരിക്കൽ (Condonation)',
    subtitleMalayalam:
      'ഉപരിപഠനത്തിന് സ്വഭാവ സർട്ടിഫിക്കറ്റ് വാങ്ങാനും മെഡിക്കൽ കാരണങ്ങളാലുള്ള ഹാജർ കുറവ് (Condonation) പരിഹരിക്കാനും',
    badgeText: 'സ്കൂൾ / കോളേജ്',
    sampleVoicePrompt:
      'ഉപരിപഠന ആവശ്യത്തിനായി എനിക്ക് ടി.സി-യോടൊപ്പം സ്വഭാവ സർട്ടിഫിക്കറ്റ് (Conduct Certificate) കൂടി അനുവദിച്ചു തരാൻ പ്രിൻസിപ്പലിന് അപേക്ഷ വേണം.',
  },
  {
    id: 'school-pta-meeting-notice',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'സ്കൂൾ പി.ടി.എ മീറ്റിംഗ് നോട്ടീസ് (School PTA / Class PTA Meeting Notice)',
    subtitleMalayalam:
      'പരീക്ഷാ ഫലവും കുട്ടികളുടെ പഠന പുരോഗതിയും ചർച്ച ചെയ്യാൻ രക്ഷിതാക്കൾക്ക് നൽകുന്ന ഔദ്യോഗിക സ്കൂൾ PTA നോട്ടീസ്',
    badgeText: 'ടീച്ചേഴ്സ് സ്പെഷ്യൽ',
    sampleVoicePrompt:
      'സ്കൂളിലെ ക്ലാസ് പി.ടി.എ യോഗത്തിൽ എല്ലാ രക്ഷിതാക്കളും നിർബന്ധമായും പങ്കെടുക്കണമെന്ന് അറിയിച്ചുകൊണ്ട് ക്ലാസ് ടീച്ചർ നൽകുന്ന പി.ടി.എ മീറ്റിംഗ് നോട്ടീസ് വേണം.',
  },
  {
    id: 'school-teacher-casual-duty-leave',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'അധ്യാപകരുടെ അവധി അപേക്ഷ (Teacher Casual Leave / Duty Leave Application)',
    subtitleMalayalam:
      'സ്കൂൾ / കോളേജ് അധ്യാപകർക്ക് കാഷ്വൽ ലീവ് (CL), ഡ്യൂട്ടി ലീവ്, മെഡിക്കൽ ലീവ് എന്നിവയ്ക്കായി ഹെഡ്മാസ്റ്റർക്ക് നൽകാൻ',
    badgeText: 'അധ്യാപകർക്ക് · Leave',
    sampleVoicePrompt:
      'സ്കൂളിലെ അധ്യാപകനായ എനിക്ക് വ്യക്തിപരമായ ആവശ്യത്തിനായി ഒരു ദിവസത്തെ കാഷ്വൽ ലീവ് (Casual Leave) അനുവദിച്ചു തരാൻ ഹെഡ്മാസ്റ്റർക്ക് അപേക്ഷ വേണം.',
  },
  {
    id: 'school-class-attendance-sheet',
    category: 'teacher_marklist',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    markListPresetId: 'class-attendance-register',
    titleMalayalam: '📋 കുട്ടികളുടെ ഹാജർ പട്ടിക / രജിസ്റ്റർ (Class Attendance Sheet — 100 പേർ വരെ)',
    subtitleMalayalam:
      'അധ്യാപകർക്കും ഉസ്താദുമാർക്കും കുട്ടികളുടെ പേരും തിങ്കൾ മുതൽ ശനി വരെയുള്ള ഹാജരും പ്രിന്റ് എടുക്കാൻ',
    badgeText: 'ഹാജർ പട്ടിക · A4',
    sampleVoicePrompt:
      'എട്ടാം ക്ലാസ്സിലെ കുട്ടികളുടെ പ്രതിവാര ഹാജർ പട്ടിക (Attendance Sheet) പ്രിന്റ് എടുക്കാൻ തയ്യാറാക്കണം.',
  },
  {
    id: 'school-assembly-speech',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'സ്കൂൾ അസംബ്ലി പ്രസംഗം (കേരളപ്പിറവി / പരിസ്ഥിതി ദിനം / സ്വാതന്ത്ര്യ ദിനം)',
    subtitleMalayalam: 'കുട്ടികൾക്ക് വേഗത്തിൽ പഠിച്ച് സ്കൂളിൽ പറയാൻ പാകത്തിലുള്ള മനോഹരമായ പ്രസംഗം',
    badgeText: 'സ്കൂൾ പ്രസംഗം · സൗജന്യം',
    sampleVoicePrompt:
      'കേരളപ്പിറവി ദിനത്തിൽ സ്കൂൾ അസംബ്ലിയിൽ പറയാൻ 2 മിനിറ്റ് ദൈർഘ്യമുള്ള ലളിതമായ മലയാളം പ്രസംഗം വേണം.',
  },
  {
    id: 'school-project-cover',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'സ്കൂൾ പ്രോജക്റ്റ് കവർ പേജ് (Project Front Page)',
    subtitleMalayalam: 'കുട്ടിയുടെ പേരും സ്കൂളിന്റെ പേരും വിഷയവും വെച്ചുള്ള മനോഹരമായ ബോർഡറുള്ള ആദ്യ പേജ്',
    badgeText: 'പ്രോജക്റ്റ് പേജ് · സൗജന്യം',
    sampleVoicePrompt:
      'എന്റെ സ്കൂൾ സയൻസ് പ്രോജക്റ്റിന് മനോഹരമായ ബോർഡറുള്ള ഒരു പ്രോജക്റ്റ് കവർ പേജ് (Front Page) തയ്യാറാക്കി തരണം.',
  },
  // 0B. MADRASA & USTHAD SPECIAL SERVICES (Mark Lists, TC, Admission, Leave, Fest, PTA Notice)
  {
    id: 'madrasa-exam-marklist-tpl',
    category: 'teacher_marklist',
    subGroup: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    markListPresetId: 'madrasa-annual-marklist',
    titleMalayalam: '🕌 മദ്രസ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് & റേഞ്ച് രജിസ്റ്റർ (ക്ലാസ് 1 മുതൽ +2 വരെ)',
    subtitleMalayalam:
      'ഉസ്താദുമാർക്ക് ഖുർആൻ, ഫിഖ്ഹ്, അഖീദ, താരീഖ്, അഖ്‌ലാഖ്, അറബിക് വിഷയങ്ങളുടെ മാർക്കും ഗ്രേഡും റാങ്കും തയ്യാറാക്കാൻ',
    badgeText: 'മദ്രസ സ്പെഷ്യൽ',
    sampleVoicePrompt:
      'മദ്രസയിലെ അഞ്ചാം ക്ലാസിലെ വാർഷിക പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് തയ്യാറാക്കണം. ഖുർആൻ, ഫിഖ്ഹ്, അഖീദ, താരീഖ്, അഖ്‌ലാഖ്, ലിസാനുൽ ഖുർആൻ വിഷയങ്ങൾ വേണം.',
  },
  {
    id: 'madrasa-practical-hifz-tpl',
    category: 'teacher_marklist',
    subGroup: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    markListPresetId: 'madrasa-practical-hifz',
    titleMalayalam: '🕌 മദ്രസ ഹിഫ്ള് & ഖുർആൻ പാരായണം (Practical / Oral Exam) പട്ടിക',
    subtitleMalayalam:
      'ഖുർആൻ പാരായണം, തജ്‌വീദ്, ഹിഫ്ള്, ദുആ, നിസ്കാര ക്രമം എന്നിവയുടെ പ്രാക്ടിക്കൽ പരീക്ഷാ മാർക്ക്/ഗ്രേഡ് പട്ടിക',
    badgeText: 'ഉസ്താദ് സ്പെഷ്യൽ',
    sampleVoicePrompt:
      'മദ്രസയിലെ ഖുർആൻ പാരായണം, തജ്‌വീദ്, ഹിഫ്ള് പ്രാക്ടിക്കൽ പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് തയ്യാറാക്കണം.',
  },
  {
    id: 'madrasa-tc-application-tpl',
    category: 'malayalam_letter',
    subGroup: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    titleMalayalam: '🕌 മദ്രസ വിടുതൽ സർട്ടിഫിക്കറ്റ് (Madrasa TC) & ടി.സി അപേക്ഷ',
    subtitleMalayalam:
      'മറ്റൊരു മദ്രസയിലേക്ക് മാറുമ്പോൾ സദർ മുഅല്ലിം നൽകുന്ന ഔദ്യോഗിക മദ്രസ ടി.സി ഫോം / അപേക്ഷ',
    badgeText: 'മദ്രസ ഫോം',
    sampleVoicePrompt:
      'മദ്രസയിൽ നിന്ന് മറ്റൊരു മദ്രസയിലേക്ക് മാറുന്നതിനായി മദ്രസ ടി.സി (Transfer Certificate) അനുവദിച്ചു തരാൻ സദർ മുഅല്ലിമിന് അപേക്ഷ വേണം.',
  },
  {
    id: 'madrasa-usthad-leave-tpl',
    category: 'malayalam_letter',
    subGroup: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    titleMalayalam: '🕌 ഉസ്താദ് / മുഅല്ലിം അവധി അപേക്ഷ & മദ്രസ കമ്മിറ്റി അപേക്ഷ',
    subtitleMalayalam:
      'ഉസ്താദുമാർക്ക് മദ്രസ കമ്മിറ്റി പ്രസിഡന്റ് / സെക്രട്ടറി അല്ലെങ്കിൽ സദർ മുഅല്ലിമിന് നൽകാനുള്ള അവധി / സർവീസ് അപേക്ഷ',
    badgeText: 'ഉസ്താദ് സ്പെഷ്യൽ',
    sampleVoicePrompt:
      'മദ്രസയിലെ മുഅല്ലിമായ എനിക്ക് വ്യക്തിപരമായ ആവശ്യത്തിനായി മൂന്ന് ദിവസത്തെ അവധി അനുവദിച്ചു തരാൻ മദ്രസ കമ്മിറ്റി സെക്രട്ടറിക്ക് അപേക്ഷ വേണം.',
  },
  {
    id: 'madrasa-pta-notice-tpl',
    category: 'malayalam_letter',
    subGroup: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    titleMalayalam: '🕌 മദ്രസ രക്ഷാകർത്തൃ യോഗം (PTA Meeting) / വാർഷിക നോട്ടീസ്',
    subtitleMalayalam:
      'പരീക്ഷാ ഫലം അറിയിക്കാനും മദ്രസ കാര്യങ്ങൾ ചർച്ച ചെയ്യാനും രക്ഷിതാക്കൾക്ക് നൽകുന്ന ഔദ്യോഗിക നോട്ടീസ്',
    badgeText: 'മദ്രസ നോട്ടീസ്',
    sampleVoicePrompt:
      'മദ്രസയിലെ വാർഷിക പരീക്ഷാ ഫലപ്രഖ്യാപനവും രക്ഷാകർത്തൃ യോഗവും അറിയിച്ചുകൊണ്ട് രക്ഷിതാക്കൾക്ക് നൽകാൻ ഒരു ഔദ്യോഗിക നോട്ടീസ് വേണം.',
  },
  {
    id: 'madrasa-student-abuse-complaint-tpl',
    category: 'malayalam_letter',
    subGroup: 'മദ്രസ & ഉസ്താദ് സേവനങ്ങൾ (Madrasa)',
    titleMalayalam: '⚖️ മദ്രസയിൽ ഉസ്താദ് കുട്ടിയെ പീഡിപ്പിച്ചതിൽ / ഉപദ്രവിച്ചതിൽ പരാതി',
    subtitleMalayalam:
      'മദ്രസ വിദ്യാർത്ഥിക്ക് നേരെയുള്ള ശാരീരിക-മാനസിക പീഡനത്തിനെതിരെ മദ്രസ കമ്മിറ്റി / പോലീസ് / ചൈൽഡ് ലൈനിൽ നൽകാനുള്ള ഔദ്യോഗിക പരാതി',
    badgeText: 'മദ്രസ പരാതി · പോലീസ്',
    sampleVoicePrompt:
      'മദ്രസയിൽ പഠിക്കുന്ന എന്റെ കുട്ടിയെ അവിടുത്തെ ഉസ്താദ് ശാരീരികമായും മാനസികമായും പീഡിപ്പിക്കുകയും ഉപദ്രവിക്കുകയും ചെയ്തതിനെതിരെ കർശന നിയമനടപടി സ്വീകരിക്കാൻ പോലീസ് സ്റ്റേഷനിലേക്കും മദ്രസ കമ്മിറ്റിക്കും നൽകാൻ ഒരു പരാതി വേണം.',
  },
  // 1. TEACHER MARK LIST (LP/UP Grade-Only, High School 9-Point, Plus Two, Tuition)
  {
    id: 'teacher-lp-up-grade-only',
    category: 'teacher_marklist',
    subGroup: 'ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ്',
    markListPresetId: 'lp-cce-grade-only',
    titleMalayalam: 'LP / UP സ്കൂൾ ഗ്രേഡ് പട്ടിക (ക്ലാസ് 1–7 · നമ്പർ മാർക്കില്ലാതെ ഗ്രേഡ് മാത്രം: A, B, C, D, E)',
    subtitleMalayalam:
      'കേരള സർക്കാർ SCERT CCE നിയമപ്രകാരം നമ്പർ മാർക്കും റാങ്കും ഇല്ലാതെ ഗ്രേഡും അഭിപ്രായവും മാത്രമുള്ള പട്ടിക (100 കുട്ടികൾ വരെ മൾട്ടി-പേജ് A4)',
    badgeText: 'SCERT നിയമം · LP/UP',
    sampleVoicePrompt:
      'യുപി സ്കൂളിലെ നാലാം ക്ലാസിലെ കുട്ടികളുടെ ഗ്രേഡ് പട്ടിക വേണം. കേരള സർക്കാർ നിയമപ്രകാരം നമ്പർ മാർക്കില്ലാതെ A, B, C, D, E ഗ്രേഡ് മാത്രം മതി.',
  },
  {
    id: 'teacher-class-marklist',
    category: 'teacher_marklist',
    subGroup: 'ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ്',
    markListPresetId: 'hs-sslc-9point',
    titleMalayalam: 'ഹൈസ്കൂൾ / ഹയർ സെക്കൻഡറി മാർക്ക് & 9-പോയിന്റ് ഗ്രേഡ് ലിസ്റ്റ് (ക്ലാസ് 8–12)',
    subtitleMalayalam:
      'ആകെ മാർക്ക്, ശതമാനം (%), SCERT 9-പോയിന്റ് ഗ്രേഡ് (A+ to E), അഭിപ്രായം എന്നിവ തനിയെ കണക്കാക്കുന്ന A4 പട്ടിക',
    badgeText: 'HS / HSS · A4 Multi-Page',
    sampleVoicePrompt:
      'പത്താം ക്ലാസ് എ ഡിവിഷനിലെ വാർഷിക പരീക്ഷാ മാർക്ക് ലിസ്റ്റ് തയ്യാറാക്കണം. കുട്ടികളുടെ പേരും വിഷയങ്ങളിലെ മാർക്കും ഗ്രേഡും ഉൾപ്പെടുന്ന പട്ടിക വേണം.',
  },
  {
    id: 'teacher-tuition-ranklist',
    category: 'teacher_marklist',
    subGroup: 'ടീച്ചേഴ്സ് മാർക്ക് ലിസ്റ്റ്',
    markListPresetId: 'tuition-rank-list',
    titleMalayalam: 'ട്യൂഷൻ സെന്റർ / കോച്ചിംഗ് ക്ലാസ് മാർക്ക് & റാങ്ക് ലിസ്റ്റ്',
    subtitleMalayalam:
      'ട്യൂഷൻ സെന്ററുകൾക്കും സ്വകാര്യ പരീക്ഷകൾക്കും മാർക്കും ശതമാനവും ഗ്രേഡും റാങ്കും (#1, #2) ഉൾപ്പെടുന്ന പട്ടിക',
    badgeText: 'ട്യൂഷൻ സ്പെഷ്യൽ',
    sampleVoicePrompt:
      'ട്യൂഷൻ സെന്ററിലെ മാസപ്പരീക്ഷയുടെ മാർക്ക് ലിസ്റ്റും റാങ്ക് പട്ടികയും തയ്യാറാക്കണം.',
  },
  // 2. AKSHAYA & VILLAGE OFFICE MOST DEMANDED PETITIONS
  {
    id: 'village-pokkuvaravu',
    category: 'malayalam_letter',
    subGroup: 'അക്ഷയ & വില്ലേജ് ഓഫീസ്',
    titleMalayalam: 'പോക്കുവരവ് / ഭൂനികുതി / കൈവശാവകാശ അപേക്ഷ (Village Office)',
    subtitleMalayalam: 'വസ്തു പോക്കുവരവ് ചെയ്യാനും കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് ലഭിക്കാനും വില്ലേജ് ഓഫീസർക്ക്',
    badgeText: 'വില്ലേജ് ഓഫീസ് · ₹15',
    sampleVoicePrompt:
      'എന്റെ വസ്തുവിന്റെ പോക്കുവരവ് ചെയ്യുന്നതിനും കൈവശാവകാശ സർട്ടിഫിക്കറ്റ് ലഭിക്കുന്നതിനും വില്ലേജ് ഓഫീസർക്ക് ഒരു അപേക്ഷ തയ്യാറാക്കി തരണം.',
  },
  {
    id: 'village-income-caste',
    category: 'malayalam_letter',
    subGroup: 'അക്ഷയ & വില്ലേജ് ഓഫീസ്',
    titleMalayalam: 'വരുമാന / ജാതി / നേറ്റിവിറ്റി സർട്ടിഫിക്കറ്റ് അപേക്ഷ',
    subtitleMalayalam: 'സ്കോളർഷിപ്പ്, അഡ്മിഷൻ, സർക്കാർ ആനുകൂല്യങ്ങൾക്കായി വില്ലേജ് ഓഫീസർക്ക് അപേക്ഷ',
    badgeText: 'അക്ഷയ ഫോം · ₹15',
    sampleVoicePrompt:
      'മക്കളുടെ സ്കൂൾ സ്കോളർഷിപ്പ് ആവശ്യത്തിനായി വരുമാന സർട്ടിഫിക്കറ്റും ജാതി സർട്ടിഫിക്കറ്റും അടിയന്തരമായി അനുവദിച്ചു തരാൻ വില്ലേജ് ഓഫീസർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'village-legal-heir',
    category: 'malayalam_letter',
    subGroup: 'അക്ഷയ & വില്ലേജ് ഓഫീസ്',
    titleMalayalam: 'അനന്തരാവകാശ സർട്ടിഫിക്കറ്റ് അപേക്ഷ (Legal Heirship / ഫാമിലി മെമ്പർഷിപ്പ്)',
    subtitleMalayalam: 'മരണപ്പെട്ട വ്യക്തിയുടെ അവകാശികളെ സാക്ഷ്യപ്പെടുത്താൻ തഹസിൽദാർ / വില്ലേജ് ഓഫീസർക്ക്',
    badgeText: 'താലൂക്ക് / വില്ലേജ് · ₹15',
    sampleVoicePrompt:
      'എന്റെ പിതാവ് മരണപ്പെട്ടതിനാൽ ബാങ്ക് ആവശ്യങ്ങൾക്കും വസ്തു ഇടപാടുകൾക്കുമായി അനന്തരാവകാശ സർട്ടിഫിക്കറ്റ് (Legal Heirship Certificate) ലഭിക്കാൻ തഹസിൽദാർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  // 3. PANCHAYAT, KSEB & RATION CARD
  {
    id: 'panchayat-building-ownership',
    category: 'malayalam_letter',
    subGroup: 'പഞ്ചായത്ത് & KSEB & റേഷൻ',
    titleMalayalam: 'കെട്ടിട ഉടമസ്ഥാവകാശ മാറ്റം / വീട്ടുനമ്പർ അപേക്ഷ (Panchayat)',
    subtitleMalayalam: 'പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി കെട്ടിട നികുതി പേര് മാറ്റാനും പുതിയ വീട്ടുനമ്പറിനും',
    badgeText: 'പഞ്ചായത്ത് · ₹15',
    sampleVoicePrompt:
      'ഞാൻ പുതിയതായി വാങ്ങിയ വീടിന്റെ ഉടമസ്ഥാവകാശം പഞ്ചായത്ത് രജിസ്റ്ററിൽ എന്റെ പേരിലേക്ക് മാറ്റിത്തരുന്നതിന് പഞ്ചായത്ത് സെക്രട്ടറിക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'panchayat-birth-correction',
    category: 'malayalam_letter',
    subGroup: 'പഞ്ചായത്ത് & KSEB & റേഷൻ',
    titleMalayalam: 'ജനന / മരണ സർട്ടിഫിക്കറ്റിലെ പേര് തിരുത്തൽ അപേക്ഷ',
    subtitleMalayalam: 'പഞ്ചായത്ത് / നഗരസഭ രജിസ്ട്രാർക്ക് പേരിലെ അക്ഷരത്തെറ്റ് തിരുത്താൻ അപേക്ഷ',
    badgeText: 'പഞ്ചായത്ത് · ₹15',
    sampleVoicePrompt:
      'എന്റെ കുട്ടിയുടെ ജനന സർട്ടിഫിക്കറ്റിൽ പേരിൽ വന്ന അക്ഷരത്തെറ്റ് തിരുത്തി പുതിയ സർട്ടിഫിക്കറ്റ് നൽകാൻ പഞ്ചായത്ത് ജനന-മരണ രജിസ്ട്രാർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'panchayat-tree',
    category: 'malayalam_letter',
    subGroup: 'പഞ്ചായത്ത് & KSEB & റേഷൻ',
    titleMalayalam: 'അപകടാവസ്ഥയിലുള്ള മരം മുറിച്ചുമാറ്റാൻ / കുടിവെള്ളം / വഴിവിളക്ക്',
    subtitleMalayalam: 'പഞ്ചായത്ത് സെക്രട്ടറിക്ക് പൊതുജന സുരക്ഷാ / ലൈഫ് മിഷൻ പരാതി നൽകാൻ',
    badgeText: 'പഞ്ചായത്ത് · ₹15',
    sampleVoicePrompt:
      'എന്റെ വീടിന്റെ അടുത്തുള്ള മരം അപകടാവസ്ഥയിലാണ്, അത് മുറിച്ചു മാറ്റാൻ പഞ്ചായത്ത് സെക്രട്ടറിക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'kseb-ownership-meter',
    category: 'malayalam_letter',
    subGroup: 'പഞ്ചായത്ത് & KSEB & റേഷൻ',
    titleMalayalam: 'കെ.എസ്.ഇ.ബി (KSEB) കണക്ഷൻ പേര് മാറ്റാൻ / പോസ്റ്റ് മാറ്റാൻ',
    subtitleMalayalam: 'വൈദ്യുതി മീറ്റർ ഉടമസ്ഥാവകാശം മാറ്റാനും അമിത ബിൽ പരാതി നൽകാനും അസി. എഞ്ചിനീയർക്ക്',
    badgeText: 'KSEB അപേക്ഷ · ₹15',
    sampleVoicePrompt:
      'ഞങ്ങളുടെ വീട്ടിലെ വൈദ്യുതി കണക്ഷന്റെ ഉടമസ്ഥാവകാശം എന്റെ പേരിലേക്ക് മാറ്റിത്തരുന്നതിനായി കെ.എസ്.ഇ.ബി അസിസ്റ്റന്റ് എഞ്ചിനീയർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'ration-card-taluk',
    category: 'malayalam_letter',
    subGroup: 'പഞ്ചായത്ത് & KSEB & റേഷൻ',
    titleMalayalam: 'റേഷൻ കാർഡ് അപേക്ഷ (പേര് ചേർക്കാൻ / കാർഡ് മാറ്റാൻ)',
    subtitleMalayalam: 'താലൂക്ക് സപ്ലൈ ഓഫീസർക്ക് പുതിയ റേഷൻ കാർഡിനോ അംഗങ്ങളെ ചേർക്കാനോ അപേക്ഷ',
    badgeText: 'സപ്ലൈ ഓഫീസ് · ₹15',
    sampleVoicePrompt:
      'ഞങ്ങളുടെ റേഷൻ കാർഡിൽ നിന്ന് പേര് മാറ്റി പുതിയ റേഷൻ കാർഡ് അനുവദിച്ചു തരുന്നതിന് താലൂക്ക് സപ്ലൈ ഓഫീസർക്ക് ഒരു അപേക്ഷ തയ്യാറാക്കി തരണം.',
  },
  // 4. RESIGNATION & INSTITUTIONS
  {
    id: 'job-resignation',
    category: 'malayalam_letter',
    subGroup: 'രാജിക്കത്ത് & സ്ഥാപനം',
    titleMalayalam: 'കമ്പനി / ഓഫീസ് / ഷോപ്പ് ജോലി രാജിക്കത്ത് (Job Resignation)',
    subtitleMalayalam: 'ഏത് പ്രൈവറ്റ് കമ്പനി, കട, സ്കൂൾ, ആശുപത്രി ജോലിയിൽ നിന്നും രാജിവെക്കാൻ',
    badgeText: 'രാജിക്കത്ത് · ₹15',
    sampleVoicePrompt:
      'ഞാൻ ജോലി ചെയ്യുന്ന സ്ഥാപനത്തിൽ നിന്ന് വ്യക്തിപരമായ കാരണങ്ങളാൽ രാജിവെക്കാൻ മാനേജർക്ക് നൽകാൻ ഒരു രാജിക്കത്ത് വേണം.',
  },
  {
    id: 'org-resignation',
    category: 'malayalam_letter',
    subGroup: 'രാജിക്കത്ത് & സ്ഥാപനം',
    titleMalayalam: 'സംഘടന / ക്ലബ്ബ് / സൊസൈറ്റി / കമ്മിറ്റി രാജിക്കത്ത്',
    subtitleMalayalam: 'റസിഡന്റ്സ് അസോസിയേഷൻ, ക്ലബ്ബ്, ട്രസ്റ്റ്, മഹല്ല്, ക്ഷേത്ര സമിതി രാജി',
    badgeText: 'രാജിക്കത്ത് · ₹15',
    sampleVoicePrompt:
      'ഞാൻ പ്രവർത്തിക്കുന്ന സംഘടനയിലെ കമ്മിറ്റി അംഗത്വത്തിൽ നിന്ന് വ്യക്തിപരമായ കാരണങ്ങളാൽ രാജിവെക്കാൻ പ്രസിഡന്റിന് ഒരു രാജിക്കത്ത് വേണം.',
  },
  {
    id: 'school-leave-tc',
    category: 'malayalam_letter',
    subGroup: 'സ്കൂൾ & കുട്ടികൾ (School)',
    titleMalayalam: 'സ്കൂൾ / കോളേജ് അവധി അപേക്ഷ & ടി.സി (TC) അപേക്ഷ',
    subtitleMalayalam: 'പ്രിൻസിപ്പൽ / ഹെഡ്മാസ്റ്റർക്ക് ലീവ് അപേക്ഷ അല്ലെങ്കിൽ ടി.സി വാങ്ങാനുള്ള അപേക്ഷ',
    badgeText: 'സ്കൂൾ / കോളേജ് · ₹15',
    sampleVoicePrompt:
      'എന്റെ മകൻ അഞ്ചാം ക്ലാസ് പഠനം പൂർത്തിയാക്കിയതിനാൽ തുടർപഠനത്തിനായി വിടുതൽ സർട്ടിഫിക്കറ്റ് (TC) അനുവദിച്ചു തരാൻ ഹെഡ്മാസ്റ്റർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  // 5. POLICE, BANK & RTO
  {
    id: 'police-complaint',
    category: 'malayalam_letter',
    subGroup: 'പോലീസ് & ബാങ്ക് & RTO',
    titleMalayalam: 'പോലീസ് സ്റ്റേഷൻ പരാതി (പൊതു പരാതി / രേഖകൾ നഷ്ടപ്പെട്ടത് / സൈബർ / അപകടം)',
    subtitleMalayalam: 'മോഷണം, തർക്കം, വഞ്ചന, രേഖകൾ നഷ്ടപ്പെട്ടത്, സൈബർ തട്ടിപ്പ്, വാഹന അപകടം തുടങ്ങി എല്ലാ പരാതികളും',
    badgeText: 'പോലീസ് പരാതി · ₹15',
    sampleVoicePrompt:
      'പോലീസ് സ്റ്റേഷനിൽ ഒരു പരാതി കൊടുക്കണം.',
  },
  {
    id: 'bank-manager-letter',
    category: 'malayalam_letter',
    subGroup: 'പോലീസ് & ബാങ്ക് & RTO',
    titleMalayalam: 'ബാങ്ക് മാനേജർക്കുള്ള അപേക്ഷ (ലോൺ / അക്കൗണ്ട് / എടിഎം)',
    subtitleMalayalam: 'അക്കൗണ്ട് ക്ലോസ് ചെയ്യാൻ, ലോൺ തിരിച്ചടവ് സമയം നീട്ടാൻ, കെ.വൈ.സി പുതുക്കാൻ',
    badgeText: 'ബാങ്ക് അപേക്ഷ · ₹15',
    sampleVoicePrompt:
      'എന്റെ ബാങ്ക് അക്കൗണ്ടുമായി ബന്ധിപ്പിച്ചിട്ടുള്ള ഫോൺ നമ്പർ മാറ്റി പുതിയ നമ്പർ ചേർക്കുന്നതിനും എടിഎം കാർഡ് ലഭിക്കുന്നതിനും ബാങ്ക് മാനേജർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  {
    id: 'rto-vehicle-application',
    category: 'malayalam_letter',
    subGroup: 'പോലീസ് & ബാങ്ക് & RTO',
    titleMalayalam: 'ആർ.ടി.ഒ (RTO) അപേക്ഷ (RC വിലാസം മാറ്റൽ / NOC / ലൈസൻസ്)',
    subtitleMalayalam: 'വാഹനത്തിന്റെ ആർ.സി ബുക്കിലെ തെറ്റ് തിരുത്താനോ എൻ.ഒ.സി ലഭിക്കാനോ ആർ.ടി.ഒ-യ്ക്ക്',
    badgeText: 'RTO അപേക്ഷ · ₹15',
    sampleVoicePrompt:
      'എന്റെ വാഹനത്തിന്റെ ആർ.സി ബുക്കിലെ മേൽവിലാസം മാറ്റി പുതിയ വിലാസം ചേർത്തു തരുന്നതിന് ആർ.ടി.ഒ ഓഫീസർക്ക് ഒരു അപേക്ഷ വേണം.',
  },
  // 6. UNIVERSAL JOB CV / BIODATA (ALL JOBS & ALL COUNTRIES)
  {
    id: 'kerala-fresher-degree-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '🎓 ഫ്രഷർ / കോളേജ് ബിരുദധാരി CV (Fresher / First Job Resume)',
    subtitleMalayalam: 'Degree, B.Com, B.Sc, BCA, B.Tech, Diploma, Plus Two കഴിഞ്ഞവർക്ക് ആദ്യ ജോലിക്ക്',
    badgeText: 'ഫ്രഷർ CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് രാഹുൽ നായർ. ഞാൻ ബികോം പാസായിട്ടുണ്ട്. തിരുവനന്തപുരത്താണ് താമസം. കമ്പ്യൂട്ടർ പരിജ്ഞാനവുമുണ്ട്. നാട്ടിലെ ജോലിക്ക് അപേക്ഷിക്കാൻ നല്ലൊരു ഫ്രഷർ സിവി വേണം.',
  },
  {
    id: 'it-software-engineer-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '💻 ഐ.ടി / സോഫ്റ്റ്‌വെയർ / ടെക്നോപാർക്ക് & ഇൻഫോപാർക്ക് Resume',
    subtitleMalayalam: 'Software Developer, Data Analyst, Web Developer, QA, IT Support ATS സിവി',
    badgeText: 'IT Resume · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് അർജുൻ മേനോൻ. ബിടെക് കമ്പ്യൂട്ടർ സയൻസ് കഴിഞ്ഞ് കൊച്ചി ഇൻഫോപാർക്കിൽ 2 വർഷം സോഫ്റ്റ്‌വെയർ എഞ്ചിനീയറായി ജോലി ചെയ്യുന്നു. React, Node.js, Python അറിയാം. നല്ലൊരു ഐടി റെസ്യൂമെ വേണം.',
  },
  {
    id: 'teacher-school-college-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '🏫 അധ്യാപകർ / സ്കൂൾ & കോളേജ് ടീച്ചർ CV (B.Ed / TTC / SET / KTET)',
    subtitleMalayalam: 'സ്കൂൾ, കോളേജ്, ട്യൂഷൻ സെന്റർ, മദ്രസ അധ്യാപക ജോലികൾക്കുള്ള പ്രൊഫഷണൽ CV',
    badgeText: 'ടീച്ചർ CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് ഫാത്തിമ സുഹറ. എം.എ, ബി.എഡ്, കെ-ടെറ്റ് പാസായിട്ടുണ്ട്. കോഴിക്കോട് സ്കൂളിൽ 4 വർഷമായി ഹൈസ്കൂൾ ടീച്ചറായി പഠിപ്പിക്കുന്നു. അധ്യാപക ജോലിക്ക് അപേക്ഷിക്കാൻ ഒരു സിവി വേണം.',
  },
  {
    id: 'nurse-hospital-medical-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '🏥 നേഴ്സ് / ആശുപത്രി / ഫാർമസിസ്റ്റ് / ലാബ് ടെക്നീഷ്യൻ CV (India, UK & Abroad)',
    subtitleMalayalam: 'B.Sc / GNM Staff Nurse, Pharmacist, Lab Tech (കേരളം, ഇന്ത്യ, UK, യൂറോപ്പ്, ഗൾഫ്)',
    badgeText: 'മെഡിക്കൽ CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് സ്നേഹ മറിയം തോമസ്. ബി.എസ്.സി നേഴ്സിംഗ് പാസായി 3 വർഷമായി കൊച്ചിയിലെ ആശുപത്രിയിൽ ഐസിയു സ്റ്റാഫ് നേഴ്സായി ജോലി ചെയ്യുന്നു. നല്ലൊരു നേഴ്സിംഗ് സിവി വേണം.',
  },
  {
    id: 'accountant-office-admin-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '📊 അക്കൗണ്ടന്റ് / ബാങ്ക് / ഓഫീസ് അഡ്മിൻ / ബില്ലിംഗ് CV',
    subtitleMalayalam: 'Tally Prime, GST, Excel, ഓഫീസ് അഡ്മിൻ, റിസപ്ഷനിസ്റ്റ് ജോലികൾക്ക് (എല്ലാ നാട്ടിലും)',
    badgeText: 'അക്കൗണ്ടന്റ് CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് അഞ്ജലി കൃഷ്ണൻ. ബികോമും ടാലിയും ജി.എസ്.ടിയും പഠിച്ചിട്ടുണ്ട്. കൊച്ചിയിൽ 3 വർഷം അക്കൗണ്ടന്റായി പരിചയമുണ്ട്. നല്ലൊരു അക്കൗണ്ടന്റ് ആൻഡ് ഓഫീസ് അഡ്മിൻ സിവി വേണം.',
  },
  {
    id: 'gulf-sales-accountant-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '🛒 സെയിൽസ് / സൂപ്പർമാർക്കറ്റ് / കാഷ്യർ / കസ്റ്റമർ കെയർ CV (India & Abroad)',
    subtitleMalayalam: 'ഷോറൂം സെയിൽസ്, ഹൈപ്പർമാർക്കറ്റ്, ബില്ലിംഗ്, ഹോസ്പിറ്റാലിറ്റി ജോലികൾക്ക്',
    badgeText: 'സെയിൽസ് CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് വിഷ്ണു പ്രസാദ്. എനിക്ക് കോഴിക്കോട് ഷോറൂമിൽ 3 വർഷം സെയിൽസ് ആൻഡ് ബില്ലിംഗ് എക്സിക്യൂട്ടീവായി പരിചയമുണ്ട്. നല്ലൊരു സെയിൽസ് സിവി വേണം.',
  },
  {
    id: 'uk-europe-canada-international-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '🌍 യുകെ / യൂറോപ്പ് / കാനഡ / ഓസ്ട്രേലിയ ഇന്റർനാഷണൽ CV (Global ATS)',
    subtitleMalayalam: 'UK, Germany, Ireland, Canada, Australia രാജ്യങ്ങളിലെ അന്താരാഷ്ട്ര മാതൃകയിലുള്ള CV',
    badgeText: 'Global CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് കെവിൻ മാത്യു. എനിക്ക് എംബിഎ വിദ്യാഭ്യാസവും 3 വർഷം ഓപ്പറേഷൻസ് ആൻഡ് ലോജിസ്റ്റിക്സ് പരിചയവുമുണ്ട്. യുകെയിലേക്കും യൂറോപ്പിലേക്കും അപേക്ഷിക്കാൻ ഇന്റർനാഷണൽ സ്റ്റാൻഡേർഡ് സിവി വേണം.',
  },
  {
    id: 'gulf-driver-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '✈️ പ്രവാസി ഗൾഫ് ഡ്രൈവർ / ടെക്നീഷ്യൻ / ജനറൽ CV (UAE, Saudi, Qatar, Oman)',
    subtitleMalayalam: 'വിസ സ്റ്റാറ്റസ്, പാസ്പോർട്ട്, ജിസിസി ലൈസൻസ് എന്നിവ ഉൾപ്പെടുത്തിയ ഗൾഫ് CV',
    badgeText: 'ഗൾഫ് CV · ₹25',
    sampleVoicePrompt:
      'എന്റെ പേര് മുഹമ്മദ് ഷഫീഖ്. എനിക്ക് ദുബായിൽ 3 വർഷം ലൈറ്റ് ഡ്രൈവറായി എക്സ്പീരിയൻസ് ഉണ്ട്. ഇപ്പോൾ വിസിറ്റ് വിസയിലാണ്. യുഎഇ ലൈസൻസുണ്ട്. നല്ലൊരു ഗൾഫ് ഡ്രൈവർ സിവി വേണം.',
  },
  {
    id: 'gulf-technician-cv',
    category: 'gulf_cv',
    subGroup: 'പ്രവാസി ഗൾഫ് CV',
    titleMalayalam: '🔧 ഇലക്ട്രീഷ്യൻ / പ്ലംബർ / എസി ടെക്നീഷ്യൻ / മെക്കാനിക് CV (നാട്ടിലും വിദേശത്തും)',
    subtitleMalayalam: 'ഐടിഐ / ഡിപ്ലോമ / എഞ്ചിനീയറിംഗ് മെയിന്റനൻസ് ജോലികൾക്കുള്ള പ്രൊഫഷണൽ CV',
    badgeText: 'ടെക്നീഷ്യൻ CV · ₹25',
    sampleVoicePrompt:
      'എനിക്ക് 4 വർഷം എസി ടെക്നീഷ്യനും ഇലക്ട്രീഷ്യനുമായി നാട്ടിലും ഗൾഫിലും പരിചയമുണ്ട്. ഐടിഐ പാസായിട്ടുണ്ട്. ജോലിക്ക് അപേക്ഷിക്കാൻ ഒരു പ്രൊഫഷണൽ ഇംഗ്ലീഷ് സിവി വേണം.',
  },
  // 7. RENTAL AGREEMENT & AFFIDAVIT
  {
    id: 'house-rent-agreement',
    category: 'rental_agreement',
    subGroup: 'വാടക കരാർ & സത്യവാങ്മൂലം',
    titleMalayalam: 'വീട് / കട വാടക കരാർ (Stamp Paper Format)',
    subtitleMalayalam: 'മുദ്രപ്പത്രത്തിൽ പ്രിന്റ് ചെയ്യാൻ മുകളിൽ സ്ഥലം വിട്ട 11 മാസ വാടക ചീട്ട്',
    badgeText: 'വാടക കരാർ · ₹29',
    sampleVoicePrompt:
      'വീട് വാടകയ്ക്ക് കൊടുക്കാൻ 11 മാസത്തെ വാടക കരാർ വേണം. മാസവാടക 12000 രൂപ, അഡ്വാൻസ് 50000 രൂപ. മുദ്രപ്പത്രത്തിൽ പ്രിന്റ് ചെയ്യാൻ പാകത്തിന് വേണം.',
  },
  {
    id: 'affidavit-draft',
    category: 'rental_agreement',
    subGroup: 'വാടക കരാർ & സത്യവാങ്മൂലം',
    titleMalayalam: 'സത്യവാങ്മൂലം / സമ്മതപത്രം (One & Same Person Affidavit / NOC)',
    subtitleMalayalam: 'പേര് വ്യത്യാസം, കെട്ടിട അനുമതി, വൈദ്യുതി കണക്ഷൻ സമ്മതപത്രം',
    badgeText: 'സത്യവാങ്മൂലം · ₹29',
    sampleVoicePrompt:
      'എന്റെ സർട്ടിഫിക്കറ്റുകളിലും ആധാർ കാർഡിലും പേരിൽ ചെറിയ വ്യത്യാസമുണ്ട്, രണ്ടും ഒരാൾ തന്നെയാണെന്ന് കാണിച്ച് സമർപ്പിക്കാൻ ഒരു സത്യവാങ്മൂലം വേണം.',
  },
];

/**
 * Strips all raw bracket placeholders like [സ്ഥലം ചേർക്കുക], [കാലാവധി], etc.
 * and guarantees a 100% crash-proof RentalAgreementData with valid clauses[] array.
 */
export function sanitizeAgreementData(
  raw: any,
  fallback: RentalAgreementData = INITIAL_AGREEMENT_DATA
): RentalAgreementData {
  if (!raw || typeof raw !== 'object') return fallback;

  const stripBrackets = (val: any, fallbackStr: string): string => {
    if (!val || typeof val !== 'string') return fallbackStr;
    const cleaned = val
      .replace(/\[\s*(?:സ്ഥലം ചേർക്കുക|മേൽവിലാസം ചേർക്കുക|കാലാവധി|സാക്ഷിയുടെ പേരും ഒപ്പും|തീയതി|പേര്|മുദ്രപ്പത്രം|വസ്തുവിന്റെ വിവരങ്ങൾ|സർവ്വേ നമ്പർ|വീട്ടുപേര്\/നമ്പർ|ഇവിടെ ചേർക്കുക|[^\]]+)\s*\]/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned || fallbackStr;
  };

  // Convert raw clauses or termsAndConditions into a guaranteed clean string[]
  let rawClauses: string[] = [];
  if (Array.isArray(raw.clauses) && raw.clauses.length > 0) {
    rawClauses = raw.clauses;
  } else if (Array.isArray(raw.termsClauses) && raw.termsClauses.length > 0) {
    rawClauses = raw.termsClauses;
  } else if (Array.isArray(raw.termsAndConditions) && raw.termsAndConditions.length > 0) {
    rawClauses = raw.termsAndConditions;
  } else if (typeof raw.termsAndConditions === 'string' && raw.termsAndConditions.trim()) {
    rawClauses = raw.termsAndConditions
      .split(/\n+/)
      .map((line: string) => line.trim())
      .filter(Boolean);
  }

  if (rawClauses.length === 0) {
    rawClauses = fallback.clauses && fallback.clauses.length > 0 ? fallback.clauses : INITIAL_AGREEMENT_DATA.clauses;
  }

  const cleanClauses = rawClauses
    .map((c: any) => stripBrackets(String(c || ''), '').trim())
    .filter((c: string) => c.length > 3);

  const finalClauses = cleanClauses.length >= 2 ? cleanClauses : INITIAL_AGREEMENT_DATA.clauses;

  let rawWitnesses: string[] = [];
  if (Array.isArray(raw.witnesses) && raw.witnesses.length > 0) {
    rawWitnesses = raw.witnesses.map((w: any) => stripBrackets(String(w || ''), '').trim()).filter(Boolean);
  }
  if (rawWitnesses.length === 0) {
    rawWitnesses = fallback.witnesses && fallback.witnesses.length > 0 ? fallback.witnesses : INITIAL_AGREEMENT_DATA.witnesses;
  }

  return {
    subType: raw.subType || fallback.subType || 'വാടക കരാർ (Rent Agreement)',
    titleMalayalam: stripBrackets(raw.titleMalayalam, fallback.titleMalayalam || 'വാടക ചീട്ട് (കെട്ടിട വാടക കരാർ പത്രം)'),
    stampPaperHeaderSpaceMm:
      typeof raw.stampPaperHeaderSpaceMm === 'number' && raw.stampPaperHeaderSpaceMm >= 20
        ? raw.stampPaperHeaderSpaceMm
        : fallback.stampPaperHeaderSpaceMm || 90,
    executionDate: stripBrackets(raw.executionDate, fallback.executionDate || new Date().toLocaleDateString('ml-IN')),
    executionPlace: stripBrackets(raw.executionPlace, fallback.executionPlace || 'എറണാകുളം'),
    firstPartyLabel: stripBrackets(raw.firstPartyLabel, fallback.firstPartyLabel || 'ഒന്നാം കക്ഷി (കെട്ടിട ഉടമ)'),
    firstPartyDetails: stripBrackets(raw.firstPartyDetails, fallback.firstPartyDetails || 'കെട്ടിട ഉടമസ്ഥന്റെ പേരും വിലാസവും ഫോൺ നമ്പറും.'),
    secondPartyLabel: stripBrackets(raw.secondPartyLabel, fallback.secondPartyLabel || 'രണ്ടാം കക്ഷി (വാടകക്കാരൻ)'),
    secondPartyDetails: stripBrackets(raw.secondPartyDetails, fallback.secondPartyDetails || 'വാടകക്കാരന്റെ പേരും വിലാസവും.'),
    preambleParagraph: stripBrackets(
      raw.preambleParagraph,
      fallback.preambleParagraph || 'ഒന്നാം കക്ഷിയുടെ ഉടമസ്ഥതയിലുള്ള കെട്ടിടം രണ്ടാം കക്ഷിക്ക് 11 മാസത്തേക്ക് താഴെ പറയുന്ന വ്യവസ്ഥകളിൽ വാടകയ്ക്ക് നൽകുന്നതിന് സമ്മതിച്ച് എഴുതുന്ന കരാർ പത്രം.'
    ),
    clauses: finalClauses,
    schedulePropertyDetails: stripBrackets(
      raw.schedulePropertyDetails,
      fallback.schedulePropertyDetails || 'തദ്ദേശ സ്വയംഭരണ പരിധിയിലുള്ള കെട്ടിടവും അനുബന്ധ സൗകര്യങ്ങളും.'
    ),
    witnesses: rawWitnesses,
  };
}

/**
 * Merges incoming AI-generated CV data with existing CV state, safeguarding against
 * AI blanking out professionalSummary, education, declaration, or cvPlace when user only dictated basic details.
 */
export function mergeCvWithPreset(incoming: any, existing: GulfCvData): GulfCvData {
  if (!incoming || typeof incoming !== 'object') return existing;

  const validStr = (val: any, fallbackStr: string): string => {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return fallbackStr;
  };

  const validArr = (val: any, fallbackArr: any[]): any[] => {
    if (Array.isArray(val) && val.length > 0) return val;
    return fallbackArr;
  };

  const jobRole = validStr(incoming.jobTitle, existing.jobTitle || 'Executive Professional');

  // If incoming professionalSummary is blank, generate a tailored 2-sentence executive summary rather than empty string
  let summary = validStr(incoming.professionalSummary, existing.professionalSummary || '');
  if (!summary || summary.trim().length < 10) {
    summary = `Dedicated and results-driven ${jobRole} with strong operational competence, effective communication, and a proven track record of delivering quality outcomes. Ready to contribute immediately to organizational objectives.`;
  }

  let declaration = validStr(incoming.declaration, existing.declaration || '');
  if (!declaration || declaration.trim().length < 10) {
    declaration = 'I hereby declare that the above information is true and correct to the best of my knowledge.';
  }

  return {
    ...existing,
    ...incoming,
    fullName: validStr(incoming.fullName, existing.fullName || 'Candidate Name'),
    jobTitle: jobRole,
    photoDataUrl: incoming.photoDataUrl || existing.photoDataUrl || '',
    phone: validStr(incoming.phone, existing.phone || ''),
    whatsapp: validStr(incoming.whatsapp, incoming.phone || existing.whatsapp || existing.phone || ''),
    email: validStr(incoming.email, existing.email || ''),
    currentLocation: validStr(incoming.currentLocation, existing.currentLocation || 'Kerala, India'),
    nationality: validStr(incoming.nationality, existing.nationality || 'Indian'),
    religion: validStr(incoming.religion, existing.religion || '-'),
    maritalStatus: validStr(incoming.maritalStatus, existing.maritalStatus || 'Single'),
    dateOfBirth: validStr(incoming.dateOfBirth, existing.dateOfBirth || ''),
    visaStatus: validStr(incoming.visaStatus, existing.visaStatus || '-'),
    passportNumber: validStr(incoming.passportNumber, existing.passportNumber || '-'),
    passportExpiry: validStr(incoming.passportExpiry, existing.passportExpiry || '-'),
    drivingLicense: validStr(incoming.drivingLicense, existing.drivingLicense || '-'),
    languages: validArr(incoming.languages, existing.languages || ['English', 'Malayalam']),
    professionalSummary: summary,
    workExperience: validArr(incoming.workExperience, existing.workExperience || []),
    education: validArr(incoming.education, existing.education || []),
    coreSkills: validArr(incoming.coreSkills, existing.coreSkills || ['Communication', 'Time Management']),
    declaration,
    cvPlace: validStr(incoming.cvPlace, existing.cvPlace || existing.currentLocation?.split(',')?.[0]?.trim() || 'Kerala'),
    signatureName: validStr(incoming.signatureName, incoming.fullName || existing.signatureName || existing.fullName),
  };
}

/**
 * Merges incoming LetterData with existing state, safeguarding custom structuredFields.
 */
export function mergeLetterWithExisting(incoming: any, existing: MalayalamLetterData): MalayalamLetterData {
  if (!incoming || typeof incoming !== 'object') return existing;

  const validStr = (val: any, fallbackStr: string): string => {
    if (typeof val === 'string' && val.trim().length > 0) return val.trim();
    return fallbackStr;
  };

  const validArr = (val: any, fallbackArr: any[]): any[] => {
    if (Array.isArray(val) && val.length > 0) return val;
    return fallbackArr;
  };

  // Merge structured fields: preserve existing template rows if incoming didn't supply them
  let nextStructuredFields = existing.structuredFields || [];
  if (Array.isArray(incoming.structuredFields) && incoming.structuredFields.length > 0) {
    nextStructuredFields = incoming.structuredFields;
  }

  return {
    ...existing,
    ...incoming,
    documentHeading: validStr(incoming.documentHeading, existing.documentHeading),
    senderName: validStr(incoming.senderName, existing.senderName),
    senderAddress: validStr(incoming.senderAddress, existing.senderAddress),
    senderPhone: validStr(incoming.senderPhone, existing.senderPhone),
    recipientTitle: validStr(incoming.recipientTitle, existing.recipientTitle),
    recipientOffice: validStr(incoming.recipientOffice, existing.recipientOffice),
    recipientPlace: validStr(incoming.recipientPlace, existing.recipientPlace),
    subject: validStr(incoming.subject, existing.subject),
    bodyParagraphs: validArr(incoming.bodyParagraphs, existing.bodyParagraphs),
    structuredFields: nextStructuredFields,
    formCode: incoming.formCode || existing.formCode,
  };
}

// ============================================================================
// MULTI-DOCUMENT PRINT CART, BULK OFFERS & HOME PRINTER DELIVERY NETWORK TYPES
// ============================================================================

export type PrintPaperType =
  | 'normal_a4'
  | 'bond_85gsm'
  | 'color_photo_cv'
  | 'kerala_stamp_paper';

export interface CartDocumentItem {
  id: string;
  createdAt: string;
  category: DocumentCategory;
  outputLanguage: DocumentOutputLanguage;
  title: string;
  subtitle: string;
  basePrice: number;
  copies: number;
  paperType: PrintPaperType;
  isPaidAndUnlocked?: boolean;
  letterData: MalayalamLetterData;
  gulfCvData: GulfCvData;
  agreementData: RentalAgreementData;
  markListData: TeacherMarkListData;
  overlayItems?: any[];
}

export interface HomePrinterPartner {
  id: string;
  unitName: string;
  operatorName: string;
  phone: string;
  whatsapp: string;
  district: string;
  panchayatOrTown: string;
  pincode: string;
  printerTypes: string[];
  homeDeliveryAvailable: boolean;
  deliveryRadiusKm: number;
  deliveryCharge: number;
  perPagePrintRate: number;
  isOnline: boolean;
  rating: number;
  completedOrdersCount?: number;
}

export interface OnlinePrintDeliveryOrder {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  panchayatOrLandmark: string;
  pincode: string;
  deliveryMode: 'HOME_DELIVERY' | 'SELF_PICKUP';
  selectedPartnerId: string;
  selectedPartnerName: string;
  selectedPartnerPhone: string;
  items: CartDocumentItem[];
  totalFiles: number;
  totalCopies: number;
  subtotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  offerTitleMalayalam: string;
  deliveryFee: number;
  finalPayableAmount: number;
  paymentMethod: 'ONLINE_UPI' | 'CASH_ON_DELIVERY';
  paymentStatus: 'PAID' | 'PENDING_COD';
  orderStatus: 'NEW_ORDER' | 'PRINTING' | 'OUT_FOR_DELIVERY' | 'COMPLETED';
}

export interface CartOfferSummary {
  totalFiles: number;
  totalCopies: number;
  subtotalAmount: number;
  paperUpgradeExtra: number;
  grossAmount: number;
  discountPercent: number;
  discountAmount: number;
  netDigitalAmount: number;
  activeOfferTitleMalayalam: string;
  nextOfferHintMalayalam: string;
  progressToNextTierPercent: number;
}

export function computeCartPricingAndOffers(
  items: CartDocumentItem[],
  customCouponCode?: string,
  includePaperExtras: boolean = false
): CartOfferSummary {
  const totalFiles = items.length;
  const totalCopies = items.reduce((sum, item) => sum + Math.max(1, item.copies || 1), 0);

  let subtotalAmount = 0;
  let paperUpgradeExtra = 0;

  for (const item of items) {
    const copies = Math.max(1, item.copies || 1);
    subtotalAmount += (item.basePrice || 5) * copies;

    if (includePaperExtras) {
      if (item.paperType === 'bond_85gsm') {
        paperUpgradeExtra += 2 * copies;
      } else if (item.paperType === 'color_photo_cv') {
        paperUpgradeExtra += 5 * copies;
      } else if (item.paperType === 'kerala_stamp_paper') {
        paperUpgradeExtra += 3 * copies;
      }
    }
  }

  const grossAmount = subtotalAmount + paperUpgradeExtra;

  // Automatic Bulk Tiered Offers based on number of files or copies
  const effectiveVolume = Math.max(totalFiles, totalCopies);
  let discountPercent = 0;
  let activeOfferTitleMalayalam = 'സാധാരണ നിരക്ക് (Standard Rate)';
  let nextOfferHintMalayalam = '';
  let progressToNextTierPercent = 0;

  if (effectiveVolume >= 10) {
    discountPercent = 30;
    activeOfferTitleMalayalam = '🏆 മെഗാ 10-ഫയൽ പാക്ക് ഓഫർ (30% കിഴിവ്!)';
    nextOfferHintMalayalam = '🎉 നിങ്ങൾക്ക് ഏറ്റവും ഉയർന്ന 30% മെഗാ ബൾക്ക് ഓഫർ ലഭിച്ചിരിക്കുന്നു!';
    progressToNextTierPercent = 100;
  } else if (effectiveVolume >= 5) {
    discountPercent = 20;
    activeOfferTitleMalayalam = '🔥 സൂപ്പർ സേവർ 5+ ഫയൽ ഓഫർ (20% കിഴിവ്!)';
    const neededFor10 = 10 - effectiveVolume;
    nextOfferHintMalayalam = `🎁 ഇനി ${neededFor10} ഫയൽ കൂടി ചേർത്താൽ 30% മെഗാ ഓഫർ ലഭിക്കും!`;
    progressToNextTierPercent = Math.min(95, Math.round((effectiveVolume / 10) * 100));
  } else if (effectiveVolume >= 3) {
    discountPercent = 10;
    activeOfferTitleMalayalam = '✨ സ്മാർട്ട് കോംബോ 3+ ഫയൽ ഓഫർ (10% കിഴിവ്!)';
    const neededFor5 = 5 - effectiveVolume;
    nextOfferHintMalayalam = `🎁 ഇനി ${neededFor5} ഫയൽ കൂടി ചേർത്താൽ 20% സൂപ്പർ ഓഫർ ലഭിക്കും!`;
    progressToNextTierPercent = Math.min(90, Math.round((effectiveVolume / 5) * 100));
  } else {
    discountPercent = 0;
    const neededFor3 = Math.max(1, 3 - effectiveVolume);
    activeOfferTitleMalayalam = 'ഒരുമിച്ച് ഫയലുകൾ ചേർത്ത് 30% വരെ ഓഫർ നേടാം';
    nextOfferHintMalayalam = `💡 ഇനി വെറും ${neededFor3} ഫയൽ കൂടി കാർട്ടിലിട്ടാൽ ഉടൻ 10% ഡിസ്കൗണ്ട് ലഭിക്കും! (10 എണ്ണത്തിന് 30% ഓഫർ)`;
    progressToNextTierPercent = Math.min(85, Math.round((effectiveVolume / 3) * 100));
  }

  // Optional extra coupon code support
  const cleanCode = (customCouponCode || '').trim().toUpperCase();
  if (cleanCode === 'MEGA30' && discountPercent < 30 && totalFiles >= 2) {
    discountPercent = 30;
    activeOfferTitleMalayalam = '🎟️ പ്രൊമോ കോഡ് MEGA30 (30% സ്പെഷ്യൽ കിഴിവ്!)';
  } else if ((cleanCode === 'BULK25' || cleanCode === 'HOME25') && discountPercent < 25) {
    discountPercent = 25;
    activeOfferTitleMalayalam = '🎁 ബൾക്ക് സ്പെഷ്യൽ ഓഫർ (25% കിഴിവ്!)';
  } else if (cleanCode === 'KERALA15' && discountPercent < 15) {
    discountPercent = 15;
    activeOfferTitleMalayalam = '🌴 കേരള സിറ്റിസൺ ഓഫർ (15% കിഴിവ്!)';
  }

  const discountAmount = Math.round((grossAmount * discountPercent) / 100);
  const netDigitalAmount = Math.max(1, grossAmount - discountAmount);

  return {
    totalFiles,
    totalCopies,
    subtotalAmount,
    paperUpgradeExtra,
    grossAmount,
    discountPercent,
    discountAmount,
    netDigitalAmount,
    activeOfferTitleMalayalam,
    nextOfferHintMalayalam,
    progressToNextTierPercent,
  };
}

/**
 * Instant 0.1-second Client-Side Parser for 100-Student Mark Lists & Pasted Student Name Lists.
 * Prevents 25s LLM timeout errors when teachers request N students (e.g. "100 കുട്ടികളുടെ മാർക്ക് ലിസ്റ്റ്")
 * or paste a multi-line list of 10–300 student names into Chat / Voice.
 */
export function parseInstantMarkListCommandOrNames(
  rawInput: string,
  currentMarkList: TeacherMarkListData,
  activeCategory: DocumentCategory
): {
  matched: boolean;
  markListData: TeacherMarkListData;
  replyMalayalam: string;
} | null {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const hasMarkListKeyword =
    /മാർക്ക്\s*ലിസ്റ്റ്|മാർക്ക്\s*പട്ടിക|ഗ്രേഡ്\s*പട്ടിക|ഗ്രേഡ്\s*ലിസ്റ്റ്|പ്രോഗ്രസ്\s*റിപ്പോർട്ട്|ഹാജർ\s*പട്ടിക|mark\s*list|marklist|grade\s*sheet|grade\s*list|attendance\s*sheet|attendance\s*list/i.test(
      trimmed
    );

  // 1. Check if the user pasted a multi-line list of student names (3+ lines)
  // while in teacher_marklist category OR with marklist/student keywords
  if (lines.length >= 3 && (activeCategory === 'teacher_marklist' || hasMarkListKeyword)) {
    const parsedRows: Array<{ name: string; marks: number[]; grades: string[] }> = [];
    for (const line of lines) {
      // Skip header lines like "കുട്ടികളുടെ പേര്:" or "Mark List"
      if (
        /^(മാർക്ക്\s*ലിസ്റ്റ്|കുട്ടികളുടെ\s*പേര്|വിദ്യാർത്ഥികൾ|mark\s*list|students|name|sl\.?\s*no)/i.test(
          line
        ) &&
        line.length < 35
      ) {
        continue;
      }
      // Strip leading roll number like "1.", "1)", "01 -", "1:"
      const withoutRoll = line.replace(/^\d{1,3}[\s.)\-:]+/, '').trim();
      if (!withoutRoll) continue;

      // Extract optional trailing marks or grades separated by commas/spaces/hyphens
      const numberTokens = Array.from(withoutRoll.matchAll(/\b(\d{1,3})\b/g)).map((m) =>
        Number(m[1])
      );
      const namePart = withoutRoll
        .replace(/[\-–:|,]+\s*\d+(?:[\s,]+\d+)*\s*$/, '')
        .replace(/\s+\d+(?:\s+\d+)+\s*$/, '')
        .trim();

      if (namePart.length >= 2) {
        parsedRows.push({
          name: namePart,
          marks: numberTokens,
          grades: [],
        });
      }
    }

    if (parsedRows.length >= 3) {
      const baseData = { ...currentMarkList };
      const subjCount = Math.max(1, baseData.subjects.length);
      const isGradeOnly = baseData.evaluationMode === 'lp_up_grade_only';

      const newStudents: TeacherMarkListStudent[] = parsedRows.map((row, idx) => {
        const existing = baseData.students[idx];
        const marks = Array.from({ length: subjCount }, (_, sIdx) => {
          if (row.marks[sIdx] !== undefined && row.marks[sIdx] <= baseData.maxMarksPerSubject) {
            return row.marks[sIdx];
          }
          if (existing?.marks?.[sIdx] !== undefined) return existing.marks[sIdx];
          return 80 + ((idx + sIdx) % 16);
        });
        const subjectGrades = Array.from({ length: subjCount }, (_, sIdx) => {
          if (existing?.subjectGrades?.[sIdx]) return existing.subjectGrades[sIdx];
          return idx % 3 === 0 ? 'A' : idx % 3 === 1 ? 'A' : 'B';
        });
        return {
          id: `st-paste-${Date.now()}-${idx}`,
          rollNo: String(idx + 1),
          studentName: row.name,
          marks,
          subjectGrades,
          remarks: isGradeOnly ? 'വളരെ മികച്ച പഠന നിലവാരം' : 'വിജയിച്ചു',
        };
      });

      const updated: TeacherMarkListData = {
        ...baseData,
        students: newStudents,
      };

      const pageCount = newStudents.length <= 18 ? 1 : Math.ceil((newStudents.length - 20) / 25) + 1;
      return {
        matched: true,
        markListData: updated,
        replyMalayalam: `✅ നിങ്ങൾ നൽകിയ **${newStudents.length} കുട്ടികളുടെ** പേരുകൾ 0.1 സെക്കൻഡിൽ മാർക്ക് ലിസ്റ്റ് പട്ടികയിലേക്ക് (${pageCount} A4 പേജ്) ചേർത്തിട്ടുണ്ട്! വലതുവശത്തെ A4 പേപ്പറിൽ നേരിട്ട് തൊട്ട് മാർക്കോ ഗ്രേഡോ തിരുത്താം.`,
      };
    }
  }

  // 2. Check if the user requested a specific number of students (e.g., "100 കുട്ടികളുടെ മാർക്ക് ലിസ്റ്റ്", "50 പേരുടെ മാർക്ക് ലിസ്റ്റ്", "60 കുട്ടികൾ")
  const countMatch =
    trimmed.match(
      /\b(\d{1,3})\s*(?:കുട്ടികളുടെ|കുട്ടികൾക്ക്|കുട്ടികൾ|പേരുടെ|പേർക്ക്|പേർ|വിദ്യാർത്ഥികളുടെ|വിദ്യാർത്ഥികൾ|students|student|kids|rows)\b/i
    ) ||
    (activeCategory === 'teacher_marklist' &&
      trimmed.match(/^(?:കുട്ടികൾ|എണ്ണം|students|count)?\s*(\d{1,3})\s*(?:പേർ|കുട്ടികൾ|എണ്ണം)?$/i));

  if (countMatch && (hasMarkListKeyword || activeCategory === 'teacher_marklist')) {
    const requestedCount = Math.min(300, Math.max(1, Number(countMatch[1]) || 30));

    // Check if user also mentioned a specific preset (Madrasa, LP/UP Grade-only, Attendance, High School)
    let baseData: TeacherMarkListData = { ...currentMarkList };
    if (/മദ്രസ|madrasa|ഉസ്താദ്|ഖുർആൻ|ഫിഖ്ഹ്/i.test(trimmed)) {
      const madPreset = MARKLIST_PRESET_MODELS.find((p) => p.id === 'madrasa-annual-marklist');
      if (madPreset) baseData = madPreset.buildData();
    } else if (/ഹാജർ|attendance/i.test(trimmed)) {
      const attPreset = MARKLIST_PRESET_MODELS.find((p) => p.id === 'class-attendance-register');
      if (attPreset) baseData = attPreset.buildData();
    } else if (/\b(lp|up|എൽ\.?പി|യു\.?പി|ഗ്രേഡ്\s*മാത്രം|grade\s*only)\b/i.test(trimmed)) {
      const lpPreset = MARKLIST_PRESET_MODELS.find((p) => p.id === 'lp-cce-grade-only');
      if (lpPreset) baseData = lpPreset.buildData();
    } else if (/\b(ഹൈസ്കൂൾ|sslc|പത്താം|പ്ലസ്\s*ടു|plus\s*two|hss)\b/i.test(trimmed)) {
      const hsPreset = MARKLIST_PRESET_MODELS.find((p) => p.id === 'hs-sslc-9point');
      if (hsPreset) baseData = hsPreset.buildData();
    }

    const subjCount = Math.max(1, baseData.subjects.length);
    const isGradeOnly = baseData.evaluationMode === 'lp_up_grade_only';
    const isAttendance = baseData.presetId === 'class-attendance-register';

    const sampleNames = [
      'അർജുൻ കെ.',
      'ഫാത്തിമ സഹ്റ എം.',
      'ആദിത്യൻ എസ്. നായർ',
      'ആയിഷ മിൻഹ സി.',
      'മുഹമ്മദ് സിനാൻ പി.',
      'അനന്യ കൃഷ്ണൻ',
      'ശ്രീഹരി വി.',
      'മറിയം നസ്റിൻ കെ.',
      'രോഹിത് ശങ്കർ',
      'ഖദീജ ശിഫ ടി.',
      'അഭിനവ് ആർ.',
      'സ്നേഹ മറിയം തോമസ്',
      'മുഹമ്മദ് റയ്യാൻ വി.',
      'ദേവിക ലക്ഷ്മി',
      'അബ്ദുല്ല ഫർഹാൻ',
      'നിവേദ്യ എസ്.',
      'അഹമ്മദ് കബീർ പി.',
      'ഗൗരി നന്ദന',
      'വിഷ്ണു പ്രസാദ്',
      'ഹന ഫാത്തിമ',
    ];

    const generatedStudents: TeacherMarkListStudent[] = Array.from(
      { length: requestedCount },
      (_, idx) => {
        const existing = baseData.students[idx];
        if (existing) {
          return {
            ...existing,
            rollNo: String(idx + 1),
          };
        }
        const cycleName =
          idx < sampleNames.length
            ? sampleNames[idx]
            : `വിദ്യാർത്ഥി ${idx + 1} (${sampleNames[idx % sampleNames.length].split(' ')[0]})`;
        return {
          id: `st-gen-${Date.now()}-${idx}`,
          rollNo: String(idx + 1),
          studentName: cycleName,
          marks: Array.from({ length: subjCount }, (__, sIdx) => 75 + ((idx * 3 + sIdx * 5) % 24)),
          subjectGrades: Array.from({ length: subjCount }, (__, sIdx) =>
            isAttendance ? 'P' : (idx + sIdx) % 4 === 0 ? 'B' : 'A'
          ),
          overallGradeOverride: isAttendance ? '6 / 6' : undefined,
          remarks: isAttendance
            ? 'മുഴുവൻ ഹാജർ (100%)'
            : isGradeOnly
            ? 'വളരെ മികച്ച പഠന നിലവാരം'
            : 'വിജയിച്ചു',
        };
      }
    );

    const updated: TeacherMarkListData = {
      ...baseData,
      students: generatedStudents,
    };

    return {
      matched: true,
      markListData: updated,
      replyMalayalam: `🎉 **${requestedCount} കുട്ടികളുടെ** മാർക്ക് ലിസ്റ്റ് പട്ടിക സെർവർ കാത്തുനിൽപ്പില്ലാതെ (0.1 സെക്കൻഡിൽ) തയ്യാറായിട്ടുണ്ട്! മുകളിലെ **"📋 പേരുകൾ ഒന്നിച്ച് പേസ്റ്റ് ചെയ്യാം"** ബട്ടണിൽ തൊട്ട് നിങ്ങളുടെ ക്ലാസ്സിലെ കുട്ടികളുടെ പേരുകൾ ഒന്നിച്ച് പേസ്റ്റ് ചെയ്യാം.`,
    };
  }

  return null;
}


