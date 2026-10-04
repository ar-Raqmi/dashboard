<div align="center">

# Dashboard

*Your personal digital sanctuary.*

![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)

<br />

<!-- TODO: add a real screenshot of the overhaul SPA at .github/images/dashboard-dark.png and dashboard-light.png. -->
> 📸 **Screenshot coming soon.** The previous screenshot showed the old Next.js app and has been removed.

</div>

A personal workspace for tasks, calendar, notes, goals, files and daily spiritual practice, in the Everforest palette.

The current app is a **Vite + React 19 single-page app in [`overhaul/`](overhaul/)**. Its API runs as Cloudflare Pages Functions, backed by a D1 database and an R2 bucket.

> [!NOTE]
> **There are two apps in this repo.** The SPA in `overhaul/` is the one being developed and deployed. The Next.js 16 app in the repo root (`src/`, `src/app/`, `prisma/`) is the **legacy** app. It is kept for reference and still builds, but it is no longer the current app. Both use the same D1 schema, so they can share one database. Unless a section says otherwise, everything below is about `overhaul/`.

---

### ✨ Features

- **Everforest design system** with light and dark appearances
- **Overview** showing today's tasks, events, pinned notes, the daily ayah and a cross-device clipboard
- **Tasks** with priorities, due dates, repeating schedules (RRULE) and projects (goals double as projects)
- **Calendar** with repeating events and per-occurrence exceptions
- **Markdown notes** with GitHub-flavoured rendering (tables, footnotes, heading anchors), output sanitised by DOMPurify, and syntax highlighting that loads only when a note contains code
- **Goals** with milestones
- **Files**: folders, uploads, rename, move, star and download, stored in Cloudflare R2
- **Spiritual**: daily ayah in Arabic with an English translation, a hadith, prayer times (JAKIM zones for Malaysia, or the Aladhan API by city and country) and the Hijri date
- **Authenticator**: a TOTP code generator for your other accounts (see [Authenticator (2FA codes)](#-authenticator-2fa-codes))
- **World clocks**
- **Search palette** across tasks, notes, goals, events and pages
- **Keyboard shortcuts** (listed [below](#%EF%B8%8F-keyboard-shortcuts))
- **Cross-device clipboard**: scratch text saved to your account, so it shows up on your other devices
- **Workspace export** to JSON, and a **Save screenshot** action in the profile menu

### 🧱 Stack

| Layer | What |
| --- | --- |
| UI | Vite 7, React 19, TypeScript, Tailwind CSS 4, Zustand |
| Notes | `marked` (+ `marked-footnote`) and `DOMPurify`; `highlight.js` is lazy-loaded |
| API | Cloudflare Pages Functions: one catch-all function, [`functions/api/[[path]].ts`](overhaul/functions/api/%5B%5Bpath%5D%5D.ts), routes to service classes in `server/` |
| Data | Cloudflare D1 (binding `DB`) and Cloudflare R2 (binding `BUCKET`) |
| Auth | Username and password (bcrypt) with an HTTP-only, `SameSite=Strict` session cookie |

The app has no charts. There is also no automated test suite yet; `npm run typecheck` is the only check.

### 🗂️ Project layout

```
overhaul/                 ← the current app
├── src/                  React SPA: App.tsx (shell, routing, shortcuts), store.ts (Zustand), components/
├── server/               API logic: api.ts (router), auth.ts, db.ts (D1 wrapper), services/*.ts
├── functions/api/        Pages Functions entry point that hands every /api/* request to server/api.ts
├── public/               Static assets
├── wrangler.toml         Pages project config with the D1 and R2 bindings (committed)
└── .dev.vars.example     Template for local secrets

src/, src/app/, prisma/   ← legacy Next.js 16 app (not the current app)
migration.sql             D1 schema, shared by both apps
```

---

### 🚀 Local development

#### 1. Install
```bash
git clone https://github.com/ar-Raqmi/dashboard.git
cd dashboard/overhaul
npm install
```

#### 2. Local secrets
```bash
cp .dev.vars.example .dev.vars
```
Set `JWT_SECRET` in `.dev.vars`. This file is gitignored, so never commit it. It is the only secret the SPA reads.

There is no `.env`, no `DATABASE_URL` and no Prisma in the SPA. D1 and R2 are **bindings** declared in [`overhaul/wrangler.toml`](overhaul/wrangler.toml). They are not environment variables. Locally, Wrangler emulates both bindings and keeps their data under `overhaul/.wrangler/`.

#### 3. Seed the local D1 database
The local D1 database starts empty. Load the shared schema into it:
```bash
npx wrangler d1 execute <database_name> --local --file=../migration.sql
```
Use the `database_name` from `wrangler.toml`.

The SPA has no sign-up screen, so you also need a `User` row. One way to add one:
```bash
HASH=$(node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'your-password')
npx wrangler d1 execute <database_name> --local --command \
  "INSERT INTO User (id, username, passwordHash, salt, createdAt) VALUES (lower(hex(randomblob(16))), 'you', '$HASH', '', datetime('now'));"
```

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

`overhaul/wrangler.toml` is committed and defines the Pages project name, the build output (`dist`), and the `DB` (D1) and `BUCKET` (R2) bindings. Edit that file rather than writing a new one. If you fork the project, point it at your own D1 database and R2 bucket:

```bash
npx wrangler login
npx wrangler d1 create <your-db-name>             # copy the name and id into wrangler.toml
npx wrangler r2 bucket create <your-bucket-name>  # copy the name into wrangler.toml
npx wrangler d1 execute <your-db-name> --remote --file=../migration.sql
```

Set the secret:
```bash
npx wrangler pages secret put JWT_SECRET --project-name=<project> --env=production
npx wrangler pages secret put JWT_SECRET --project-name=<project> --env=preview
```

Deploy:
```bash
cd overhaul && npm run deploy
```

> [!IMPORTANT]
> `npm run deploy` runs `wrangler pages deploy --branch=overhaul`, so it **always deploys to the `overhaul` branch**, whatever git branch you are on. Whether that is a preview or a production deployment depends on the project's production branch in the Cloudflare dashboard. To target another branch, run `npm run build && npx wrangler pages deploy --branch=<branch>`.

> [!WARNING]
> **Preview and production have separate secrets.** A `JWT_SECRET` set on the production environment is **not** available to preview branches. Set it on both (see the commands above), or preview deployments will show the Authenticator as locked.

---

### 🔐 Authenticator (2FA codes)

The Authenticator page stores TOTP secrets for **your other accounts** (GitHub, email and so on) and shows their current and next 6-digit codes, like Google Authenticator or Authy. Signing in to the dashboard itself uses only a username and password.

To add an account:
1. Open **Authenticator** in the sidebar (under Personal).
2. Add an account. Enter the account name, then paste the service's **Base32 setup key**: the text secret that services show next to their QR code, often behind "Can't scan it?" or "Enter key manually". There is no QR scanning. Spaces and dashes are removed, and the key must be at least 16 Base32 characters.
3. Optionally, give it a category (for example, Work). You can remove the entry later.

Secrets are encrypted with AES-GCM using a key derived from `JWT_SECRET`. The format matches the legacy app, so entries created there still decrypt.

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

### 🏛️ Legacy Next.js app

The original app is still in the repo root. It is a Next.js 16 app built with `@cloudflare/next-on-pages`, uses Prisma over D1, and has its own `package.json` scripts (`dev`, `pages:build`, `pages:deploy`, `db:*`) and root `wrangler.toml`. It is not the current app and gets no new work. The SPA replaced its `/api/query` and `/api/mutation` endpoints and its `/api/storage/*` routes with the Pages Functions in `overhaul/`.

---

<div align="center">

*"Indeed, with hardship comes ease."* — 94:6

*🖋️ the pen hasn't lifted*

</div>
