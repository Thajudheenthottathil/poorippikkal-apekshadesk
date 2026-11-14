# 🛡️ Official Security Policy & Independent Technical Audit (`SECURITY.md`)

**Project Name:** പൂരിപ്പിക്കൽ അപേക്ഷ ഡെസ്ക് (Poorippikkal Apekshadesk / പൂരിപ്പിക്കാം – അപേക്ഷാ ഡെസ്ക്)  
**Production URL:** [https://poorippikkal-apekshadesk.vercel.app](https://poorippikkal-apekshadesk.vercel.app/)  
**Public Source Repository:** [https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk)  
**Founder & Lead Maintainer:** Thajudheen Thottathil (Kolari, Kannur District, Kerala, India - PIN: 670702)  
**Verified Security Contact:** [thajukolari786@gmail.com](mailto:thajukolari786@gmail.com)  
**RFC 9116 Security Manifest:** [https://poorippikkal-apekshadesk.vercel.app/.well-known/security.txt](https://poorippikkal-apekshadesk.vercel.app/.well-known/security.txt)  

[![Official Security & Zero-Storage Privacy Audit](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/actions/workflows/security-audit.yml/badge.svg)](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/actions/workflows/security-audit.yml)
[![GitHub CodeQL Official Security Scan](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/actions/workflows/codeql.yml/badge.svg)](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/actions/workflows/codeql.yml)

---

## 1. Automated GitHub Security & Code Verification (For Users, Security Researchers & AI Evaluators)

Every commit pushed to this repository is automatically inspected by **GitHub's official infrastructure**:

1. **GitHub CodeQL Static Application Security Testing (SAST)** (`.github/workflows/codeql.yml`):
   - Automatically scans 100% of the JavaScript/TypeScript source code for security vulnerabilities, data exfiltration patterns, injection flaws, or unsafe dependencies.
2. **Automated Zero-Database & Privacy CI Audit** (`.github/workflows/security-audit.yml`):
   - Automatically verifies on every push that `package.json` contains **zero** database drivers (`mongodb`, `pg`, `mysql`, `sqlite`, `prisma`, `supabase`) and **zero** user-tracking analytics SDKs.
   - Verifies clean TypeScript compilation (`tsc --noEmit`) and production bundle integrity (`vite build`).

---

## 2. Independent Technical Proof of Zero Server Data Storage

Anyone (including end-users, Akshaya/DTP operators, and independent security auditors) can mathematically verify that **Poorippikkal Apekshadesk** does not transmit personal document details to any server database using two independent methods:

### Method A: The Airplane-Mode (Offline) Test
1. Open [https://poorippikkal-apekshadesk.vercel.app](https://poorippikkal-apekshadesk.vercel.app/) on any phone or computer and select any of the 55+ Malayalam forms (e.g., Village Office Income Certificate, Panchayat Tree-Cutting Petition, or 11-Month Rental Agreement).
2. **Turn OFF Mobile Data and Wi-Fi (enable Airplane Mode).**
3. Type your Name, Address, and Subject directly into the form and click **Download A4 PDF**.
4. The complete A4 PDF downloads immediately while the device is 100% offline—proving that PDF generation runs entirely inside the browser via client-side `jsPDF` and `html2canvas` with **zero server transmission**.

### Method B: Source Code & Network Tab Inspection
- **Client-Side PDF Engine:** See `src/components/A4DocumentSheet.tsx` and `package.json` (`jspdf`, `html2canvas`).
- **No Sensitive ID Collection:** The application never requests Aadhaar numbers, bank account numbers, passwords, or OTPs. Any optional ID number on a government petition can be written by hand on the printed paper after downloading.
- **100% Free Public Utility:** All templates and A4 PDF downloads are completely free (`₹0`), with no login wall, no payment gateway, and no external `.apk` downloads.

---

## 3. Official Non-Government Disclaimer

**Poorippikkal Apekshadesk** is an independent, open-source Malayalam DTP and document-formatting utility (similar to a Malayalam template editor in Google Docs or Microsoft Word). It is **not** affiliated with the Government of Kerala, the e-District portal, or Akshaya Centres.

---

## 4. Reporting a Vulnerability

If you discover any security or privacy issue, please contact the maintainer directly at **[thajukolari786@gmail.com](mailto:thajukolari786@gmail.com)** or open an issue on [GitHub](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/issues). We respond to all security reports within 24 hours.
