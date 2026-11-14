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

## 1. Transparent Dual-Mode Architecture & Data Flow Disclosure

To ensure 100% transparency between our Privacy Policy and `server.ts`, **Poorippikkal Apekshadesk** operates in two clearly separated modes:

### Mode A: 100% Local Browser & Offline Mode (Zero Network Transmission)
- **55+ Ready Kerala Templates, Blank Form Mode (`📝 കാലി ഫോം`), Direct Touch Editing & `jsPDF` PDF Generation:**
  - Selecting any of the 55+ pre-built Village Office, Panchayat, KSEB, Rental Agreement, Gulf CV, or School Mark List templates, editing text directly on the A4 sheet, using the 1-click **Blank Form Print Mode (`📝 കാലി ഫോം`)**, and generating/downloading the final A4 PDF (`jsPDF` + `html2canvas`) execute **100% locally inside the user's browser**.
  - **Airplane-Mode Proof:** Users can open any form, turn **OFF** mobile data and Wi-Fi (Airplane Mode), type their Name and Address (or leave fields blank as dotted lines `................................`), and download the A4 PDF completely offline.

### Mode B: Optional Stateless AI Assistant & Voice/PDF Extraction (`/api/*`)
- When a user **optionally** chooses to use the Smart AI Chat/Voice Assistant (`/api/process-request`), Server Audio Transcription (`/api/transcribe-audio`), or Uploaded PDF AI Text Extraction (`/api/extract-pdf-content`):
  - The submitted prompt, audio clip, or uploaded PDF content is transmitted over HTTPS to the backend (`server.ts`) and processed **statelessly** via **Google Gemini API** (`@google/genai`) or **Hugging Face Inference API** solely to generate the formatted document response in real time.
  - **Zero Server Database or Disk Persistence:** `server.ts` contains **zero** `fs.writeFileSync` calls and **zero** database connections. No user document content, uploaded PDFs, voice recordings, phone numbers, or document titles are ever written to server disk files or stored in any database.

---

## 2. 7-Point Automated GitHub Security & Privacy CI Verification

Every push to `main` is automatically verified by **GitHub CodeQL SAST** (`.github/workflows/codeql.yml`) and our **7-Point Source Code Security & Zero-Storage Audit** (`.github/workflows/security-audit.yml`):

1. **Zero Database or Tracking SDKs:** Verifies `package.json` contains no database drivers (`mongodb`, `pg`, `mysql`, `sqlite`, `prisma`, `supabase`) or tracking SDKs.
2. **Zero Hardcoded Admin PINs:** Verifies neither `server.ts` nor `src/` contains any hardcoded admin PIN or fallback PIN. Admin authentication relies strictly on the server-side `process.env.ADMIN_UNLOCK_PIN` environment variable.
3. **Authenticated & Rate-Limited Admin/Feedback APIs:** Verifies `requireAdminAuth` and per-IP rate limiting protect `GET /api/feedback`, `DELETE /api/feedback/:id`, `DELETE /api/feedback`, `/api/admin/spot-report`, `/api/admin/check-ai-status`, `/api/cron/daily-report`, and `/api/owner-config`.
4. **Zero Disk File Persistence (`writeFileSync` Prohibited):** Verifies `server.ts` performs zero `fs.writeFileSync` operations and stores no user document titles (`recentTitles`) or phone numbers (`senderPhone`).
5. **100% Optional Personal Details (`Blank Form Print Mode`):** Users are never forced to enter their Name, Address, Phone, or Aadhaar number; clicking **PDF / Print** or **`📝 കാലി ഫോം`** prints clean dotted lines (`........................................`) for hand-filling with a pen.
6. **2024 Kerala Stamp Duty Legal Notice & Zero Aadhaar Placeholders:** Discloses the 2024 Kerala Registration Department stamp duty revision for leases under 1 year (**₹500 stamp duty** + ₹210 registration fee if registered, alongside ₹200/₹500 stamp paper margin presets) and removes Aadhaar placeholders from all rental agreement templates.
7. **RFC 9116 Security Manifests:** Validates `/.well-known/security.txt` and `/security-audit.json`.

---

## 3. Reporting a Vulnerability

If you discover any security or privacy issue, please contact **Thajudheen Thottathil** directly at **[thajukolari786@gmail.com](mailto:thajukolari786@gmail.com)** or open an issue on [GitHub](https://github.com/Thajudheenthottathil/poorippikkal-apekshadesk/issues).
