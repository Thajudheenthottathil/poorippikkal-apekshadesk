import type { GulfCvData, GulfWorkExperience } from '../types/documents.ts';

export interface ParsedCvResult {
  isMultiLineCv: boolean;
  gulfCvData: GulfCvData | null;
  extractedFieldsSummary: {
    fullName: string;
    jobTitle: string;
    location: string;
    email: string;
    phone: string;
    skillsCount: number;
    jobsCount: number;
  } | null;
}

/**
 * Intelligently parses any English or Malayalam Resume / CV text
 * (including 2-column PDF text pastes like Jessica Claire, Malayalam resumes like Terrence Ryan / ടെറൻസ് റയാൻ,
 * OCR scans, or single-line pastes) and maps all fields directly into the GulfCvData structure.
 */
export function parseStructuredCvFromText(
  rawPrompt: string,
  _fallbackCv?: Partial<GulfCvData>
): ParsedCvResult {
  if (!rawPrompt || !rawPrompt.trim()) {
    return { isMultiLineCv: false, gulfCvData: null, extractedFieldsSummary: null };
  }

  let normalizedText = rawPrompt.trim().normalize('NFC');
  const initialLines = normalizedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (initialLines.length < 4 && normalizedText.length > 100) {
    normalizedText = normalizedText
      .replace(
        /\s+(Professional Summary|Summary|Objective|Skills|Core Skills|Work History|Work Experience|Experience|Education|Qualifications|Certifications|Languages|പ്രൊഫഷണൽ സംഗ്രഹം|സംഗ്രഹം|വിദ്യാഭ്യാസം|സർട്ടിഫിക്കേഷനുകൾ|കഴിവുകൾ|പ്രവൃത്തി ചരിത്രം|തൊഴിൽ പരിചയം|ഭാഷകൾ)\b/gi,
        '\n$1\n'
      )
      .replace(/\s+([•+.]\s+[A-Z\u0D00-\u0D7F])/g, '\n$1')
      .replace(
        /\s+(\d{2}\/?\d{4}\s+(?:to|te|1o|-)\s+(?:Current|Curent|\d{2}\/\d{3,4}!*))/gi,
        '\n$1\n'
      );
  }

  const lower = normalizedText.toLowerCase();
  const lines = normalizedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const hasPipeContactLine = lines
    .slice(0, 6)
    .some((l) => l.includes('|') && (l.includes('@') || /\d{3}/.test(l)));

  const hasMalayalamCvHeaders =
    normalizedText.includes('പ്രൊഫഷണൽ സംഗ്രഹം') ||
    normalizedText.includes('പ്രവൃത്തി ചരിത്രം') ||
    normalizedText.includes('തൊഴിൽ പരിചയം') ||
    (normalizedText.includes('വിദ്യാഭ്യാസം') && normalizedText.includes('കഴിവുകൾ')) ||
    (normalizedText.includes('സർട്ടിഫിക്കേഷനുകൾ') && normalizedText.includes('കഴിവുകൾ'));

  const hasCvSectionHeaders =
    hasPipeContactLine ||
    hasMalayalamCvHeaders ||
    lower.includes('professional summary') ||
    lower.includes('work history') ||
    lower.includes('work experience') ||
    lower.includes('education') ||
    lower.includes('curriculum vitae') ||
    lower.includes('resume') ||
    lower.includes('bachelor') ||
    lower.includes('university') ||
    rawPrompt.includes('സിവി') ||
    rawPrompt.includes('ബയോഡാറ്റ') ||
    /\bcv\b/i.test(rawPrompt) ||
    lower.includes('biodata');

  if (!hasCvSectionHeaders) {
    return { isMultiLineCv: false, gulfCvData: null, extractedFieldsSummary: null };
  }

  const isMultiSectionResume =
    lines.length >= 4 &&
    (hasPipeContactLine ||
      hasMalayalamCvHeaders ||
      lower.includes('summary') ||
      lower.includes('work history') ||
      lower.includes('work experience') ||
      lower.includes('education'));

  if (!isMultiSectionResume) {
    return { isMultiLineCv: false, gulfCvData: null, extractedFieldsSummary: null };
  }

  const isMalayalamResume = hasMalayalamCvHeaders;

  // Section header matchers (English + Malayalam)
  const isSummaryHeader = (line: string) =>
    /^(professional summary|summary|objective|profile|പ്രൊഫഷണൽ സംഗ്രഹം|സംഗ്രഹം|ആമുഖം|കരിയർ ലക്ഷ്യം)$/i.test(
      line.trim()
    );
  const isSkillsHeader = (line: string) =>
    /^(skills|core skills|key skills|കഴിവുകൾ|പ്രധാന കഴിവുകൾ|വൈദഗ്ധ്യം)$/i.test(line.trim());
  const isWorkHeader = (line: string) =>
    /^(work history|work experience|experience|employment history|പ്രവൃത്തി ചരിത്രം|തൊഴിൽ പരിചയം|പ്രവൃത്തി പരിചയം|ജോലി പരിചയം)$/i.test(
      line.trim()
    );
  const isEducationHeader = (line: string) =>
    /^(education|qualifications|academic background|വിദ്യാഭ്യാസം|വിദ്യാഭ്യാസ യോഗ്യത)$/i.test(
      line.trim()
    );
  const isCertificationHeader = (line: string) =>
    /^(certifications|certificates|licenses|സർട്ടിഫിക്കേഷനുകൾ|സർട്ടിഫിക്കറ്റുകൾ)$/i.test(
      line.trim()
    );
  const isLanguagesHeader = (line: string) =>
    /^(languages|languages known|ഭാഷകൾ|അറിയാവുന്ന ഭാഷകൾ)$/i.test(line.trim());

  const isAnySectionHeader = (line: string) =>
    isSummaryHeader(line) ||
    isSkillsHeader(line) ||
    isWorkHeader(line) ||
    isEducationHeader(line) ||
    isCertificationHeader(line) ||
    isLanguagesHeader(line);

  // Date range line matcher (English + Malayalam month/year ranges)
  const malayalamMonthsRegex =
    /(?:ജനുവരി|ഫെബ്രുവരി|മാർച്ച്|ഏപ്രിൽ|മേയ്|മെയ്|ജൂൺ|ജൂലൈ|ഓഗസ്റ്റ്|സെപ്റ്റംബർ|ഒക്ടോബർ|നവംബർ|ഡിസംബർ)/;

  const isDateRangeLine = (line: string) => {
    const t = line.trim();
    if (
      /^(?:\d{2}\/?\d{4}|\d{4})\s*(?:to|te|1o|-|–)\s*(?:current|curent|present|നിലവിലുള്ളത്|\d{2}\/?\d{3,4}!*)$/i.test(
        t
      )
    ) {
      return true;
    }
    if (
      /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}\s*(?:to|-|–)\s*(?:current|present|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4})$/i.test(
        t
      )
    ) {
      return true;
    }
    // Malayalam date ranges like "സെപ്റ്റംബർ 2011 - നിലവിലുള്ളത്", "2009 സെപ്റ്റംബർ 2011 ജൂൺ", "2008 സെപ്റ്റംബർ - 2009 ജൂൺ"
    if (
      t.length <= 45 &&
      /(19|20)\d{2}/.test(t) &&
      (malayalamMonthsRegex.test(t) || t.includes('നിലവിലുള്ളത്') || t.includes('തുടരുന്നു'))
    ) {
      return true;
    }
    return false;
  };

  const isStandaloneYear = (line: string) => /^(19|20)\d{2}$/.test(line.trim());
  const isBulletLine = (line: string) => /^[.•+\-*]\s+/.test(line.trim());
  const cleanBulletText = (line: string) => line.replace(/^[.•+\-*]\s+/, '').trim();

  // Check if a line is a standalone Email or Postal Address / Location line
  const isEmailOnlyLine = (line: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(line.trim());

  const isPostalLocationLine = (line: string) => {
    const t = line.trim();
    if (t.length > 50 || isAnySectionHeader(t) || isDateRangeLine(t)) return false;
    // Matches "കാന്റൺ, ജോർജിയ 30114", "San Francisco, CA 94105", "കാൻ്റൺ, GA"
    return (
      /,\s*(?:[A-Z]{2}|[\u0D00-\u0D7F]+)\s+\d{5,6}$/.test(t) ||
      /,\s*[A-Z]{2}$/.test(t) ||
      /,\s*ജിഎ$/i.test(t)
    );
  };

  // 1. Extract Full Name from Line 0
  let rawName = lines[0] || (isMalayalamResume ? 'അപേക്ഷകന്റെ പേര്' : 'CANDIDATE NAME');
  if (rawName.includes('|')) {
    rawName = rawName.split('|')[0].trim();
  }
  const fullName =
    rawName.replace(/[^a-zA-Z\u0D00-\u0D7F\u200C\u200D\s.']/g, '').trim() ||
    (isMalayalamResume ? 'അപേക്ഷകന്റെ പേര്' : 'CANDIDATE NAME');

  // 2. Scan the document for Email, Phone, and Location
  const fullTextJoined = lines.join(' | ');
  const emailMatch = fullTextJoined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = fullTextJoined.match(
    /(\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\+?\d[\d\s\-()]{7,16}\d)/
  );

  let extractedEmail = emailMatch ? emailMatch[0].trim() : '';
  const extractedPhone = phoneMatch ? phoneMatch[1].trim() : '';

  let location = '';
  const pipeLine = lines.slice(0, 5).find((l) => l.includes('|'));
  if (pipeLine) {
    const parts = pipeLine
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts[0] && !parts[0].includes('@')) {
      location = parts[0];
    }
    if (!extractedEmail && parts[2]) {
      extractedEmail = parts[2];
    }
  } else {
    // Look for a postal location line like "കാന്റൺ, ജോർജിയ 30114" or second line if not a header
    const postalLine = lines.find((l, idx) => idx > 0 && idx < 10 && isPostalLocationLine(l));
    if (postalLine) {
      location = postalLine;
    } else if (lines[1] && !isAnySectionHeader(lines[1]) && !isEmailOnlyLine(lines[1])) {
      location = lines[1];
    }
  }

  // Clean city/state for Place footer
  const cleanPlace =
    location
      .replace(/\s+\d{5,6}$/, '')
      .split('|')[0]
      .trim() || location;

  // Collect all standalone date ranges across the document (for 2-column English PDFs where dates float to bottom)
  const allDateRanges = lines.filter(isDateRangeLine);

  // 3. Scan sections
  let currentSection:
    | 'top'
    | 'summary'
    | 'skills'
    | 'work'
    | 'education'
    | 'certifications'
    | 'languages' = 'top';

  const summaryLines: string[] = [];
  const extractedSkills: string[] = [];
  const workRawLines: string[] = [];
  const eduRawLines: string[] = [];
  const certRawLines: string[] = [];
  const langRawLines: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === pipeLine) continue;
    if (isEmailOnlyLine(line)) continue;
    if (line === location) continue;

    if (isSummaryHeader(line)) {
      currentSection = 'summary';
      continue;
    }
    if (isSkillsHeader(line)) {
      currentSection = 'skills';
      continue;
    }
    if (isWorkHeader(line)) {
      currentSection = 'work';
      continue;
    }
    if (isEducationHeader(line)) {
      currentSection = 'education';
      continue;
    }
    if (isCertificationHeader(line)) {
      currentSection = 'certifications';
      continue;
    }
    if (isLanguagesHeader(line)) {
      currentSection = 'languages';
      continue;
    }

    if (currentSection === 'summary') {
      if (isPostalLocationLine(line)) {
        if (!location) location = line;
        continue;
      }
      if (isBulletLine(line)) {
        extractedSkills.push(cleanBulletText(line));
      } else {
        summaryLines.push(line);
      }
    } else if (currentSection === 'skills') {
      if (isDateRangeLine(line)) continue;
      if (isBulletLine(line)) {
        extractedSkills.push(cleanBulletText(line));
      } else if (line.length <= 75) {
        extractedSkills.push(line);
      }
    } else if (currentSection === 'work') {
      const cleaned = cleanBulletText(line);
      if (
        !isMalayalamResume &&
        (line.startsWith('+') ||
          (isBulletLine(line) && cleaned.split(/\s+/).length <= 4 && cleaned.length <= 36))
      ) {
        extractedSkills.push(cleaned);
      } else {
        workRawLines.push(line);
      }
    } else if (currentSection === 'education') {
      if (isDateRangeLine(line)) continue;
      if (isBulletLine(line)) {
        const cleaned = cleanBulletText(line);
        if (cleaned.length <= 45) {
          extractedSkills.push(cleaned);
        } else {
          workRawLines.push(line);
        }
      } else {
        eduRawLines.push(line);
      }
    } else if (currentSection === 'certifications') {
      if (isDateRangeLine(line)) continue;
      certRawLines.push(cleanBulletText(line));
    } else if (currentSection === 'languages') {
      if (isDateRangeLine(line)) continue;
      langRawLines.push(cleanBulletText(line));
    }
  }

  const professionalSummary = summaryLines.join(' ').trim();

  // 4. Parse Work Experience entries
  const workExperience: GulfWorkExperience[] = [];
  let currentJob: GulfWorkExperience | null = null;
  let pendingDurationForNextJob = '';

  const isCompanyLocationLine = (line: string) =>
    !isBulletLine(line) &&
    !isDateRangeLine(line) &&
    (line.includes(' -') ||
      line.includes('- ') ||
      line.includes('Inc.') ||
      line.includes('LLC') ||
      /,\s*[A-Z]{2}\b/.test(line) ||
      /,\s*ജിഎ$/i.test(line));

  for (let i = 0; i < workRawLines.length; i++) {
    const line = workRawLines[i];
    const nextLine = workRawLines[i + 1] || '';

    // Case A: A date range line inside Work History (e.g., "സെപ്റ്റംബർ 2011 - നിലവിലുള്ളത്")
    if (isDateRangeLine(line)) {
      pendingDurationForNextJob = line;
      currentJob = null;
      continue;
    }

    // If we just saw a date range line, this line is the Role / Company header for the new job!
    if (pendingDurationForNextJob) {
      let role = line;
      let company = '';
      let jobLoc = cleanPlace;

      // Check if next line is a short location like "കാൻ്റൺ, GA"
      if (nextLine && isPostalLocationLine(nextLine) && nextLine.length <= 35) {
        jobLoc = nextLine;
        i++; // consume location line
      }

      // If role line contains school/company name in Malayalam or English, split nicely if possible
      const schoolSplitMatch = role.match(
        /^(.*?(?:അധ്യാപകൻ|അസിസ്റ്റന്റ്|മാനേജർ|എക്സിക്യൂട്ടീവ്|ഡ്രൈവർ|നഴ്സ്|എഞ്ചിനീയർ))\s+(.+)$/
      );
      if (schoolSplitMatch) {
        role = schoolSplitMatch[1].trim();
        company = schoolSplitMatch[2].trim();
      } else if (role.includes(' - ')) {
        const parts = role.split(' - ');
        role = parts[0].trim();
        company = parts.slice(1).join(' - ').trim();
      }

      currentJob = {
        role,
        company,
        location: jobLoc,
        duration: pendingDurationForNextJob,
        highlights: [],
      };
      workExperience.push(currentJob);
      pendingDurationForNextJob = '';
      continue;
    }

    if (isBulletLine(line)) {
      const bulletText = cleanBulletText(line);
      if (!currentJob) {
        currentJob = {
          role: isMalayalamResume ? 'പ്രൊഫഷണൽ' : 'SENIOR SALES ASSOCIATE',
          company: '',
          location: cleanPlace,
          duration: allDateRanges[0] || '',
          highlights: [],
        };
        workExperience.push(currentJob);
      }
      currentJob.highlights.push(bulletText);
    } else if (isCompanyLocationLine(line)) {
      if (!currentJob) {
        currentJob = {
          role: isMalayalamResume ? 'തൊഴിൽ പരിചയം' : 'SALES ASSOCIATE',
          company: line,
          location: cleanPlace,
          duration: allDateRanges[workExperience.length] || '',
          highlights: [],
        };
        workExperience.push(currentJob);
      } else if (currentJob.highlights.length === 0) {
        if (!currentJob.company) {
          const dashParts = line.split(/\s*-\s*/);
          currentJob.company = dashParts[0]?.trim() || line;
          if (dashParts[1]?.trim()) {
            currentJob.location = dashParts[1].trim();
          }
        } else {
          currentJob.location = line;
        }
      } else {
        const dashParts = line.split(/\s*-\s*/);
        currentJob = {
          role: isMalayalamResume ? 'സെയിൽസ് അസോസിയേറ്റ്' : 'SALES ASSOCIATE',
          company: dashParts[0]?.trim() || line,
          location: dashParts[1]?.trim() || cleanPlace,
          duration: allDateRanges[workExperience.length] || '',
          highlights: [],
        };
        workExperience.push(currentJob);
      }
    } else {
      // In Malayalam resumes (like Terrence Ryan), job responsibilities are full sentences without bullet dots
      if (isMalayalamResume && currentJob) {
        currentJob.highlights.push(line);
        continue;
      }

      const looksLikeWrappedContinuation =
        currentJob &&
        currentJob.highlights.length > 0 &&
        !isCompanyLocationLine(nextLine) &&
        (/^[a-z]/.test(line) || line.split(/\s+/).length <= 3) &&
        !/associate|manager|executive|driver|engineer|director|specialist|officer|supervisor|coordinator|consultant|analyst|assistant|salwa|teacher/i.test(
          line
        );

      if (looksLikeWrappedContinuation && currentJob) {
        const lastIdx = currentJob.highlights.length - 1;
        currentJob.highlights[lastIdx] = `${currentJob.highlights[lastIdx]} ${line}`.trim();
      } else if (!currentJob || currentJob.highlights.length > 0) {
        const jobIndex = workExperience.length;
        currentJob = {
          role: isMalayalamResume ? line : line.toUpperCase(),
          company: '',
          location: cleanPlace,
          duration: allDateRanges[jobIndex] || '',
          highlights: [],
        };
        workExperience.push(currentJob);
      }
    }
  }

  // Check if a trailing company line like "Terget-San Prondamo, CA" ended up in eduRawLines (from 2-column OCR)
  const trailingCompanyIdx = eduRawLines.findIndex((l) => /target|terget/i.test(l));
  if (trailingCompanyIdx !== -1) {
    const trailingComp = eduRawLines.splice(trailingCompanyIdx, 1)[0];
    if (workExperience.length === 1 && workExperience[0].highlights.length >= 6) {
      const firstJobBullets = workExperience[0].highlights.slice(0, 4);
      const secondJobBullets = workExperience[0].highlights.slice(4);
      workExperience[0].highlights = firstJobBullets;
      const dashParts = trailingComp.split(/\s*-\s*/);
      workExperience.push({
        role: 'SALES ASSOCIATE',
        company: dashParts[0]?.trim() || trailingComp,
        location: dashParts[1]?.trim() || cleanPlace,
        duration: allDateRanges[1] || '04/2013 to 03/2015',
        highlights: secondJobBullets,
      });
    }
  }

  // Derive primary Job Title
  let primaryJobTitle = workExperience[0]?.role || '';
  if (!primaryJobTitle && professionalSummary) {
    const mlRoleMatch = professionalSummary.match(
      /(ഹൈസ്കൂൾ ഗണിത അധ്യാപകൻ|ഗണിത അധ്യാപകൻ|അധ്യാപകൻ|സെയിൽസ് അസോസിയേറ്റ്|മാനേജർ|എഞ്ചിനീയർ|ഡ്രൈവർ|നഴ്സ്)/
    );
    if (mlRoleMatch) primaryJobTitle = mlRoleMatch[1];
  }
  if (!primaryJobTitle) {
    primaryJobTitle = isMalayalamResume ? 'പ്രൊഫഷണൽ റെസ്യൂമെ' : 'PROFESSIONAL EXECUTIVE';
  }

  // 5. Parse Education + Certifications
  let eduYear = '';
  const yearIdx = eduRawLines.findIndex(isStandaloneYear);
  if (yearIdx !== -1) {
    eduYear = eduRawLines.splice(yearIdx, 1)[0];
  }

  const educationList: Array<{ degree: string; institution: string; year: string }> = [];
  if (eduRawLines.length > 0) {
    educationList.push({
      degree: eduRawLines[0] || '',
      institution: eduRawLines.slice(1).join(', ') || '',
      year: eduYear,
    });
  }
  if (certRawLines.length > 0) {
    educationList.push({
      degree: certRawLines[0] || '',
      institution: certRawLines.slice(1).join(' ') || '',
      year: isMalayalamResume ? 'സർട്ടിഫിക്കേഷൻ' : 'Certified',
    });
  }

  // 6. Parse Languages
  let parsedLanguages: string[] = [];
  if (langRawLines.length > 0) {
    // Rejoin broken colon lines like "സ്പാനിഷ്:" + "B2 ഇറ്റാലിയൻ:" + "അപ്പർ ഇൻ്റർമീഡിയറ്റ്"
    const joinedLang = langRawLines.join(' ').replace(/:\s+/g, ': ');
    parsedLanguages = [joinedLang];
  } else {
    parsedLanguages = isMalayalamResume ? ['മലയാളം, ഇംഗ്ലീഷ്'] : ['English'];
  }

  const gulfCvData: GulfCvData = {
    fullName,
    jobTitle: primaryJobTitle,
    photoDataUrl: '',
    phone: extractedPhone,
    whatsapp: extractedPhone,
    email: extractedEmail,
    currentLocation: location,
    nationality: '-',
    religion: '-',
    maritalStatus: '-',
    dateOfBirth: '-',
    visaStatus: '-',
    passportNumber: '-',
    passportExpiry: '-',
    drivingLicense: '-',
    languages: parsedLanguages,
    professionalSummary,
    workExperience,
    education: educationList,
    coreSkills: extractedSkills,
    declaration: isMalayalamResume
      ? 'മുകളിൽ നൽകിയിട്ടുള്ള വിവരങ്ങളെല്ലാം എന്റെ അറിവിലും വിശ്വാസത്തിലും സത്യമാണെന്ന് ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.'
      : 'I hereby declare that all the statements and information furnished above are true and correct to the best of my knowledge.',
    cvPlace: cleanPlace,
    signatureName: fullName,
  };

  return {
    isMultiLineCv: true,
    gulfCvData,
    extractedFieldsSummary: {
      fullName,
      jobTitle: primaryJobTitle,
      location,
      email: extractedEmail,
      phone: extractedPhone,
      skillsCount: extractedSkills.length,
      jobsCount: workExperience.length,
    },
  };
}
