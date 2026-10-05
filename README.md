<div align="center">

# Dashboard

*Your personal digital sanctuary.*

![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)

<br />

> 📸 **Screenshot coming soon.**

</div>

A personal workspace for tasks, calendar, notes, goals, files and daily spiritual practice, in the Everforest palette.

It is a **Vite + React 19 single-page app**. Its API runs as Cloudflare Pages Functions, backed by a D1 database and an R2 bucket.

---

### ✨ Features

- **Everforest design system** with light and dark appearances
- **Overview** showing today's tasks, events, pinned notes, the daily ayah and a cross-device clipboard
- **Tasks** with priorities, due dates, repeating schedules (RRULE) and projects (goals double as projects)
- **Calendar** with repeating events and per-occurrence exceptions
- **Markdown notes** with GitHub-flavoured rendering (tables, footnotes, heading anchors), output sanitised by DOMPurify, and syntax highlighting that loads only when a note contains code
- **Goals** with milestones
- **Files**: folders, uploads, rename, move, star and download, stored in Cloudflare R2
- **Spiritual**: daily ayah in Arabic with an English translation, a hadith, prayer times and the Hijri date. Prayer times come from JAKIM e-Solat (any zone) or Aladhan (city or GPS, with a calculation method and Asr school). The Hijri date is a separate choice: JAKIM's moon sighting, Umm al-Qura, the Saudi council, Diyanet or an astronomical calculation, switching at midnight or Maghrib
- **Authenticator**: a TOTP code generator for your other accounts (see [Authenticator (2FA codes)](#-authenticator-2fa-codes))
- **World clocks**, and a **time zone** setting that follows the device (so travelling needs no action) or pins any IANA zone
- **Installable PWA** with an offline fallback, an editable brand name and a choice of in-app icon (the Raqmi mark, the feather pen and other built-ins, or your own image by upload or link)
- **Date format** you can set to dd/mm/yyyy, mm/dd/yyyy, ISO or any pattern you write, applied to task dates, the calendar and date fields
- **Search palette** across tasks, notes, goals, events and pages
- **Keyboard shortcuts** (listed [below](#%EF%B8%8F-keyboard-shortcuts))
- **Cross-device clipboard**: scratch text saved to your account, so it shows up on your other devices
- **Workspace export** to JSON, and a **Save screenshot** action in the profile menu

### 🧱 Stack

| Layer | What |
| --- | --- |
| UI | Vite 7, React 19, TypeScript, Tailwind CSS 4, Zustand |
| Notes | `marked` (+ `marked-footnote`) and `DOMPurify`; `highlight.js` is lazy-loaded |
| API | Cloudflare Pages Functions: one catch-all function, [`functions/api/[[path]].ts`](functions/api/%5B%5Bpath%5D%5D.ts), routes to service classes in `server/` |
| Data | Cloudflare D1 (binding `DB`) and Cloudflare R2 (binding `BUCKET`) |
| Auth | Username and password (bcrypt) with an HTTP-only, `SameSite=Strict` session cookie |

The app has no charts. There is also no automated test suite yet; `npm run typecheck` is the only check.

### 🗂️ Project layout

```
src/
  app/                Workspace shell: Sidebar, Topbar, ContextRail, search palette, shortcuts and theme hooks
  features/           One folder per feature: tasks, notes, calendar, goals, files, spiritual, settings, authenticator, brand, auth
  components/         Shared UI (Icon, Modal, BrandMark, Avatar)
  store/              Zustand store, data types and selectors
  lib/                ApiClient, date and time-zone helpers
  pwa/                Service worker registration and the install prompt
  styles/             Ordered CSS files (base, layout, per-feature, responsive, light theme)
server/               API: api.ts (router class), procedures.ts (query/mutation allowlists), auth.ts, db.ts, cache.ts, services/*
functions/api/        Pages Functions entry point that hands every /api/* request to server/api.ts
db/migrations/        Numbered SQL migrations; 0001 is the production baseline
public/               logo.png (the original app and tab icon), manifest, service worker, offline page
scripts/              seed-admin.mjs prints the SQL for a new login
wrangler.toml         Local Pages config (gitignored); copy wrangler.toml.example
.dev.vars.example     Template for local secrets
```

---

### 🚀 Local development

#### 1. Install
```bash
git clone https://github.com/ar-Raqmi/dashboard.git
cd dashboard
npm install
```

#### 2. Local secrets
```bash
cp .dev.vars.example .dev.vars
```
Set `JWT_SECRET` in `.dev.vars`. This file is gitignored, so never commit it. It is the only secret the SPA reads.

There is no `.env` and no `DATABASE_URL`. D1 and R2 are **bindings** declared in `wrangler.toml` (copy [`wrangler.toml.example`](wrangler.toml.example) and fill in your IDs). They are not environment variables. Locally, Wrangler emulates both bindings and keeps their data under `.wrangler/`.

#### 3. Create the local D1 database
The local D1 database starts empty. Apply the migrations, then add a login (the app has no sign-up screen):
```bash
npx wrangler d1 migrations apply dashboard-db --local
node scripts/seed-admin.mjs you 'your-password' > .wrangler/seed.sql
npx wrangler d1 execute dashboard-db --local --file=.wrangler/seed.sql
```
Use the `database_name` from `wrangler.toml` in place of `dashboard-db` if you renamed it.

#### 4. Run
The API exists only as Pages Functions, so `wrangler pages dev` has to run for logins and data to work.

```bash
npm run preview      # builds, then runs `wrangler pages dev` (SPA + functions + local D1/R2) on :8788
```

For hot reload, run Vite as well. It proxies `/api` to `:8788`:
```bash
npm run preview      # terminal 1: functions on :8788
npm run dev          # terminal 2: Vite dev server with HMR
```

| Script | Does |
| --- | --- |
| `npm run dev` | Vite dev server (frontend only; `/api` is proxied to `:8788`) |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run typecheck` | `tsc -b` across the app and functions |
| `npm run preview` | Build, then `wrangler pages dev` |
| `npm run deploy` | Build, then deploy to Cloudflare Pages (see below) |

---

### 🌐 Deployment

`wrangler.toml` defines the Pages project name, the build output (`dist`), the migrations folder, and the `DB` (D1) and `BUCKET` (R2) bindings. If you fork the project, point it at your own D1 database and R2 bucket:

```bash
npx wrangler login
npx wrangler d1 create <your-db-name>             # copy the name and id into wrangler.toml
npx wrangler r2 bucket create <your-bucket-name>  # copy the name into wrangler.toml
npx wrangler d1 migrations apply <your-db-name> --remote
```

Set the secret:
```bash
npx wrangler pages secret put JWT_SECRET --project-name=<project> --env=production
npx wrangler pages secret put JWT_SECRET --project-name=<project> --env=preview
```

Deploy:
```bash
npm run deploy
```

> [!IMPORTANT]
> `npm run deploy` runs `wrangler pages deploy dist --project-name=ar-raqmi --branch=main`, which **replaces the production site**. To try a build first, run `npm run build && npx wrangler pages deploy dist --project-name=<project> --branch=<other-branch>`. That publishes a preview that reads the **same D1 and R2** as production.

> [!WARNING]
> **Preview and production have separate secrets.** A `JWT_SECRET` set on the production environment is **not** available to preview branches. Set it on both (see the commands above), or preview deployments will show the Authenticator as locked.

---

### 🔐 Authenticator (2FA codes)

The Authenticator page stores TOTP secrets for **your other accounts** (GitHub, email and so on) and shows their current and next 6-digit codes, like Google Authenticator or Authy. Signing in to the dashboard itself uses only a username and password.

To add an account:
1. Open **Authenticator** in the sidebar (under Personal).
2. Add an account. Enter the account name, then paste the service's **Base32 setup key**: the text secret that services show next to their QR code, often behind "Can't scan it?" or "Enter key manually". There is no QR scanning. Spaces and dashes are removed, and the key must be at least 16 Base32 characters.
3. Optionally, give it a category (for example, Work). You can remove the entry later.

Secrets are encrypted with AES-GCM using a key derived from `JWT_SECRET`.

> [!IMPORTANT]
> **`JWT_SECRET` controls access to every stored 2FA secret.**
> - **If `JWT_SECRET` is missing,** the app does not fall back to a default key. The Authenticator reports itself as **locked**: it shows no codes and refuses to add or update secrets, which fails with a 503 error.
> - **If `JWT_SECRET` is changed,** entries encrypted with the old value can no longer be decrypted. The app marks them as **undecryptable** and does not show wrong codes. Changing the secret effectively locks you out of those entries until the original value is restored. Either keep the secret stable, or re-add every account after changing it.
> - Use the same value locally (`.dev.vars`) as in production if your local setup reads production data. Use it on preview branches too (see the warning above).

---

### ⌨️ Keyboard shortcuts

| Keys | Action |
| --- | --- |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> | Open or close the search palette |
| <kbd>/</kbd> | Open search from anywhere |
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>B</kbd> | Collapse or expand the sidebar |
| <kbd>N</kbd> | New task |
| <kbd>Q</kbd> | Quick capture (new note) |
| <kbd>Esc</kbd> | Close menus and dialogs |

The single-letter shortcuts do nothing while you are typing in a field or while a dialog is open. In the search palette, <kbd>↑</kbd>/<kbd>↓</kbd> moves between results and <kbd>Enter</kbd> opens one.

---

### 🎬 Demo

*No recording yet.* A demo should cover:
- [ ] Sign in, then the Overview (ayah, today's tasks, pinned notes, clipboard)
- [ ] Switching between light and dark
- [ ] Creating a task with <kbd>N</kbd> and a note with <kbd>Q</kbd>; a note with code blocks and a table rendered
- [ ] Calendar, Goals with milestones, and uploading a file in Files
- [ ] Spiritual page (Arabic ayah, hadith, prayer times, Hijri date) and the Authenticator's rotating codes, using a dummy secret
- [ ] Search palette (<kbd>⌘K</kbd>) and collapsing the sidebar (<kbd>⌘B</kbd>)

---

---

<div align="center">

*"Indeed, with hardship comes ease."* — 94:6

*🖋️ the pen hasn't lifted*

</div>
