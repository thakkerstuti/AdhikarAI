# Legal Rights Helper — Frontend

Frontend-only implementation (React + TypeScript + Vite + Tailwind + React
Router + Lucide icons). No backend, AWS, or Bedrock code lives here — every
screen runs entirely on mock data so it's demoable standalone.

## Run it

```
npm install
npm run dev
```

## Design system (matches the reference screenshots)

- **Font:** Manrope (Google Fonts) — closest well-licensed match to the
  reference screenshots' geometric sans.
- **Palette:** warm off-white background (`paper`), white cards (`card`),
  near-black primary (`ink`) for buttons/icons/text, muted grey (`muted`),
  a restrained verified-green and warning-red used only for source/urgency
  states — see `tailwind.config.js` for the exact tokens.
- **Shape language:** pill buttons, rounded-2xl/3xl cards, soft shadows,
  circular icon chips — no gradients, no glassmorphism, no neon.

> Note: this deviates from the "deep navy/indigo primary" mentioned in the
> written product brief, in favor of the monochrome black/off-white palette
> from the reference screenshots you shared, per your explicit ask to match
> that design. Easy to swap back — every color is a single Tailwind token.

## Backend integration contract

Every screen calls `src/services/api.ts` — nothing else. That file currently
returns mock data with a simulated network delay. To connect the real
backend, replace the function bodies in that one file (matching the API
contract in the build package: `/query`, `/voice-query`, `/documents`,
`/documents/{id}/explain`, `/documents/{id}/ask`, `/generate-letter`,
`/speak`) — no other file needs to change.

## Pages / routes

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, mic CTA, example prompts, 5 supported domains |
| `/voice` | Voice | Full state machine: ready → listening → processing → answer/error |
| `/ask` | Ask | Text chat, structured (non-chatbot) answers |
| `/upload` | DocumentUpload | Camera / PDF / image upload |
| `/document/result` | DocumentResult | Mock OCR summary + flagged points + follow-up questions |
| `/result/:id` | LegalResult | Full-page answer dashboard, save case / generate letter |
| `/generate` | GenerateDocument | Choose type → fill details → editable draft → copy/download |
| `/cases` | Cases | Saved cases list |
| `/cases/:id` | CaseDetail | One case's full answer + actions |
| `/reminders` | Reminders | Create/edit/complete/delete (user-created only, not legal deadlines) |
| `/profile` | Profile | Language, voice toggle, notifications, disclaimer |

Verified: `tsc -b` (strict mode) and `npm run build` both pass clean.
