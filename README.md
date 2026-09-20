# ⚖️ Adhikar AI (अधिकार AI)

> **Know Your Rights. Know Your Next Step.**  
> *Your personal, voice-first legal companion for everyday situations — explained in a language you understand.*

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

---

## 📌 Overview

**Adhikar AI** is a mobile-first, voice-enabled AI legal assistance platform built to democratize legal information in India. Legal jargon, complex statutes, and language barriers often prevent citizens from knowing and exercising their basic legal rights. 

Adhikar AI bridges this gap by allowing users to **speak or type their problem in their own language** and receive instant, structured, and easy-to-understand legal guidance backed by verified sources.

---

## ✨ Key Features

### 🌐 1. Language-First Onboarding
- **Instant Language Selection**: App launch begins with language preference choice before entering the app.
- **Multi-Language Support**:
  - 🇮🇳 **English** (`en`)
  - 🇮🇳 **Hindi / हिन्दी** (`hi`)
  - 🇮🇳 **Hinglish** (`hi-en`)
  - 🇮🇳 **Gujarati / ગુજરાતી** (`gu`)
- **Extensible Architecture**: Modular translation dictionary ready for additional Indian regional languages (Tamil, Telugu, Marathi, Bengali, etc.).

### 🎙️ 2. Voice-First & Conversational Input
- Speak naturally about everyday legal conflicts (e.g., unpaid rent deposit, consumer fraud, police questioning).
- Real-time speech recognition and text parsing to extract key legal facts.

### 🏛️ 3. Simplified Legal Breakdown
- Converts complex legal procedures into clear, actionable sections:
  1. **Situation Summary**: What the AI understood from your prompt.
  2. **Legal Rights & Information**: Simple explanation of applicable laws and rights.
  3. **Step-by-Step Next Steps**: Actionable, numbered checklist to resolve the issue.
  4. **Document Checklist**: Required documents and evidence to collect.
  5. **Verified Sources Badge**: Clear indication of official legal references and non-representation disclaimers.

### 🛡️ 4. Five Core Legal Domain Modules
| Domain | Focus & Guidance |
| :--- | :--- |
| **🚓 Police & Criminal Procedure** | FIR filing process, police questioning rights, bail guidance, and legal remedies against harassment. |
| **🏠 Tenant & Landlord Relations** | Rental agreements, security deposit recovery, illegal eviction protection, and notice periods. |
| **💼 Employment & Labor Rights** | Unpaid wages, wrongful termination, employment contracts, and labor court procedures. |
| **🛒 Consumer Rights** | Defective product returns, service refunds, fake online sellers, and Consumer Forum complaints. |
| **🛡️ Women & Personal Safety** | Protection against harassment, domestic violence laws, emergency helplines, and safe reporting channels. |

### 🎨 5. Modern Premium Design System
- **Light Theme Aesthetic**: Clean, high-contrast, paper-grain background (`bg-paper`) with card elevation (`bg-card`).
- **Box-Free 3D Statue Visual**: High-resolution, background-isolated 3D marble Lady Justice statue.
- **Mobile-First UX**: 56px (`h-14`) touch target standard for all interactive buttons and input fields.
- **Accessibility & Contrast**: Bolded body copy, high contrast ratio typography, and safe-area notch padding.

---

## 🛠️ Tech Stack

- **Frontend Core**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/), Custom Vanilla CSS Tokens
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **State & Persistence**: Custom `localStorage` abstraction with `OnboardingGuard` persistence layer.

---

## 📁 Repository Architecture

```
AdhikarAI/
├── public/
│   ├── lady-justice.png       # 3D isolated Lady Justice statue asset
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── onboarding/        # Pagination dots and slide controls
│   │   └── OnboardingGuard.tsx# First-launch guard & URL reset handler
│   ├── data/
│   │   └── translations.ts    # Multi-language dictionary (EN, HI, MIX, GU)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── AuthChoice.tsx # Sign-up / Sign-in / Guest choice screen
│   │   │   ├── CreateAccount.tsx
│   │   │   └── SignIn.tsx
│   │   ├── onboarding/
│   │   │   └── OnboardingContainer.tsx # 4-slide interactive landing flow
│   │   ├── Home.tsx           # Main application dashboard
│   │   ├── LanguageSelection.tsx # Language selection screen
│   │   └── Profile.tsx        # User profile & onboarding reset control
│   ├── utils/
│   │   └── storage.ts         # LocalStorage persistence utility
│   ├── App.tsx                # App routes & provider configuration
│   ├── main.tsx               # Entry point
│   └── index.css              # Design system tokens & utility classes
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0 or higher recommended)
- npm or yarn

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thakkerstuti/AdhikarAI.git
   cd AdhikarAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   - Web browser: `http://localhost:5173`
   - Mobile network testing: Use the `Network:` IP address printed in your terminal (e.g. `http://192.168.x.x:5173`).

---

## 🧪 Testing Onboarding Flow

To force re-trigger the first-launch onboarding experience at any time, append `?reset_onboarding=true` or `?reset=true` to your application URL:

```
http://localhost:5173/?reset_onboarding=true
```

Alternatively, navigate to the **Profile** tab in the application and tap **Re-watch Onboarding**.

---

## 📜 Disclaimer

*Adhikar AI provides legal information and educational guidance based on verified legal sources. It does not constitute formal legal representation or legal advice. Users with active litigation or court cases should consult a qualified legal practitioner.*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
