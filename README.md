> بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
<div align="center">

# ar-Raqmi Dashboard

A feature-rich personal dashboard application built with Next.js 16, powered by **Convex** for real-time cloud database, with secure authentication.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Convex](https://img.shields.io/badge/Convex-Cloud_Database-4F46E5?logo=convex)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)

</div>

## Features

### Dashboard
- **Customizable Widget Grid** — Drag, resize, and toggle dashboard widgets with `react-grid-layout`
- **8 Built-in Widgets** — Daily Tasks, Calendar, Quick Notes, Daily Verse, Goals, World Clock, Files, Clipboard
- **Custom Backgrounds** — Color, gradient (8 presets), or custom image with opacity control
- **Responsive Layout** — Separate desktop (3-column) and mobile (1-column) grid layouts

### Tasks
- Full task management with due dates, priorities (high/medium/low), and status
- Today, Overdue, and Upcoming sections with color-coded backgrounds
- Bulk delete completed tasks
- Timezone-safe date handling (no UTC offset bugs)

### Notes
- Markdown-powered notes with color coding
- Pin important notes to a dedicated section
- Drag & drop layout for both pinned and regular notes

### Calendar
- Monthly calendar view with event markers
- Color-coded events

### Goals
- Goal tracking with progress bar
- Milestone checklist with auto-calculated progress

### Files
- Hierarchical file manager with folders and files
- File categories (PDF, DOC, Image, Audio, Video)
- File preview modal

### Spiritual
- Daily Quran verse (from Al Quran Cloud API)
- Daily Hadith (curated collection, date-seeded)

### World Clock
- Multiple timezone clocks (up to 5)
- Optional seconds display
- Hijri date in page header with offset adjustment

### Settings
- Profile customization (name, picture)
- App branding (title, logo, icon color)
- World Clock management
- Background customization

### Security
- **Secure Login** — Username/password authentication with bcryptjs hashing (12 salt rounds)
- **Session Management** — JWT tokens with httpOnly cookies
- **Server-side Validation** — All Convex functions validate session tokens
- **Password Security** — Hashed + salted passwords, never stored in plain text

### Cloud Database
- **Convex** — Real-time cloud database with automatic sync
- **Live Updates** — Changes reflect instantly across all devices
- **Optimistic UI** — Immediate local updates, background Convex persistence

---

## Architecture

```text
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  React   │  │  Zustand  │  │   Convex     │  │
│  │   UI     │◄─┤  (Cache)  │◄─┤  React Client│  │
│  └──────────┘  └───────────┘  └──────┬───────┘  │
│                                       │ WebSocket│
└───────────────────────────────────────┼──────────┘
                                        │
┌───────────────────────────────────────┼──────────┐
│              Next.js Server           │          │
│  ┌──────────────────┐  ┌─────────────┴───────┐  │
│  │   API Routes     │  │   Convex Cloud      │  │
│  │  /api/auth/*     │──┤   (Database +       │  │
│  │  /api/verse      │  │    Functions)        │  │
│  │  /api/hadith     │  └─────────────────────┘  │
│  └──────────────────┘                           │
└─────────────────────────────────────────────────┘

```

### Data Flow

1. **Auth Flow**: Login → API route validates credentials → JWT cookie + session token → ConvexSync loads data
2. **Read Flow**: Convex queries → ConvexSync → Zustand store → React components
3. **Write Flow**: Component action → Zustand (immediate) + Convex mutation (persistent) → Convex query re-fires → Zustand updated

---

## Getting Started

### Prerequisites

* **Node.js** 18+ or **Bun** 1.0+
* **Convex Account** — [Sign up free at convex.dev](https://convex.dev)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd ar-raqmi-database
bun install

```

### 2. Set Up Convex

```bash
# Install Convex CLI (if not already installed)
npx convex dev

# This will:
# 1. Ask you to log in to your Convex account
# 2. Create a new project
# 3. Deploy your schema and functions
# 4. Generate TypeScript types
# 5. Print your deployment URL

```

### 3. Configure Environment

Copy the deployment URL from the previous step and add it to your `.env` file:

```bash
# .env
NEXT_PUBLIC_CONVEX_URL=[https://your-project.convex.cloud](https://your-project.convex.cloud)
JWT_SECRET=your-secret-key-change-in-production

```

### 4. Seed the Admin User

Start the development server:

```bash
bun run dev

```

1. Open the app in your browser
2. Click **"Show Initial Setup"** on the login page
3. Click **"Seed Admin User & Sample Data"**
4. Default credentials:
* **Username**: `ar-raqmi`
* **Password**: `password`



> **Note: Change the default password!** Go to your Convex dashboard and update the password hash manually, or use the seed mutation with a new password.

### 5. Development

```bash
bun run dev          # Start Next.js dev server (port 3000)
npx convex dev       # Start Convex dev server (watches for function changes)

```

---

## Project Structure

```text
ar-raqmi-database/
├── convex/                    # Convex backend functions
│   ├── _generated/           # Auto-generated by Convex CLI (don't edit)
│   ├── schema.ts             # Database schema definition
│   ├── auth.ts               # Auth helpers (session validation)
│   ├── sessions.ts           # Session CRUD
│   ├── tasks.ts              # Task CRUD
│   ├── goals.ts              # Goal + Milestone CRUD
│   ├── notes.ts              # Note CRUD
│   ├── events.ts             # Calendar event CRUD
│   ├── files.ts              # File CRUD (with recursive delete)
│   ├── clocks.ts             # World clock CRUD
│   ├── dashboard.ts          # Widget + Layout CRUD
│   ├── settings.ts           # User settings CRUD
│   └── seed.ts               # Seed admin user + sample data
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (ThemeProvider, Providers)
│   │   ├── page.tsx          # Main page (auth gate + app shell)
│   │   ├── globals.css       # Global styles
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/    # POST /api/auth/login
│   │       │   ├── logout/   # POST /api/auth/logout
│   │       │   ├── me/       # GET /api/auth/me
│   │       │   └── seed/     # POST /api/auth/seed
│   │       ├── verse/        # Daily Quran verse API
│   │       └── hadith/       # Daily Hadith API
│   ├── components/
│   │   ├── Providers.tsx     # ConvexProvider + AuthProvider
│   │   ├── ConvexSync.tsx    # Syncs Convex queries → Zustand store
│   │   ├── DynamicHead.tsx   # Dynamic title/favicon/manifest
│   │   ├── navigation/       # Header, TabBar, NavigationRail
│   │   ├── pages/            # Page components (Tasks, Notes, etc.)
│   │   │   └── LoginPage.tsx # Authentication page
│   │   ├── dashboard/        # Dashboard grid, widgets, manager
│   │   ├── file-manager/     # File manager components
│   │   ├── search/           # Global search (Cmd+K)
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.tsx       # Authentication hook + provider
│   │   └── useConvexData.ts  # Convex data hooks (alternative to sync)
│   └── lib/
│       ├── store.ts          # Zustand store (UI state + data cache)
│       ├── auth.ts           # Password hashing + JWT utilities
│       ├── convex-client.ts  # Convex client singleton
│       └── utils.ts          # Utility functions (cn, etc.)
├── prisma/                   # Legacy Prisma schema (unused with Convex)
├── public/                   # Static assets (logo, manifest)
└── .env                      # Environment variables

```

---

## Authentication

### How It Works

1. **Password Storage**: Passwords are hashed with **bcryptjs** (12 salt rounds) and stored in the Convex `users` table
2. **Login Flow**:
* POST `/api/auth/login` with username/password
* Server verifies against Convex `users` table
* Creates a session in Convex `sessions` table
* Returns JWT (httpOnly cookie) + session token (regular cookie)


3. **Session Validation**: Every Convex query/mutation validates the session token before executing
4. **Auto-Logout**: Sessions expire after 7 days

### Managing Credentials

* **Default admin**: Username `ar-raqmi`, Password `password`
* **Change password**: Update the `passwordHash` and `salt` fields in the Convex dashboard
* **Add users**: Call the `seed:admin` mutation from the Convex dashboard with a new username and hashed password
* **Remove sessions**: Delete entries from the `sessions` table in the Convex dashboard

### Generating a Password Hash

```typescript
import bcrypt from 'bcryptjs';

const password = 'your-new-password';
const salt = await bcrypt.genSalt(12);
const hash = await bcrypt.hash(password, salt);
console.log({ hash, salt });
// Use these values to update the Convex users table

```

---

## Design System

### Color Palette

| Role | Color | Usage |
| --- | --- | --- |
| Primary | `#A5D6A7` | Citrus Green — buttons, accents, headers |
| Secondary | `#F48FB1` | Light Pink — highlights, badges |
| Tertiary | `#CE93D8` | Lavender — accents, progress |
| Surface | `#80CBC4` | Teal — alternate cards |
| Destructive | Red tones | Overdue tasks, error states |

---

## Tech Stack

| Category | Technology |
| --- | --- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Convex (Cloud) |
| **Auth** | bcryptjs + jose (JWT) + httpOnly cookies |
| **State** | Zustand (UI cache) + Convex (persistent) |
| **Layout** | react-grid-layout |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **Fonts** | Geist Sans, Geist Mono, Noto Sans Arabic |
| **API** | Next.js API Routes |
| **Islamic** | hijri-converter, Al Quran Cloud API |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js development server (port 3000) |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Start Convex development (watches functions) |
| `npx convex dashboard` | Open Convex dashboard in browser |
| `npx convex run seed:admin` | Seed admin user from CLI |

---

## Islamic Features

* **Daily Quran Verse** — Fetched from Al Quran Cloud API with 10-verse fallback
* **Daily Hadith** — Curated collection of 20 authentic hadiths, date-seeded rotation
* **Hijri Date** — Displayed in page header with ±2 day offset adjustment
* **Arabic Font** — Noto Sans Arabic for proper Arabic text rendering

---

## Troubleshooting

### "Database Not Connected" on Login Page

This means `NEXT_PUBLIC_CONVEX_URL` is not set in your `.env` file:

1. Create a Convex project at [convex.dev](https://convex.dev)
2. Run `npx convex dev` to get your deployment URL
3. Add the URL to `.env`: `NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud`
4. Restart the development server

### Convex Functions Not Found

Run `npx convex dev` to deploy your functions and generate TypeScript types. The `_generated` directory will be auto-populated.

### Session Expired

Sessions last 7 days. If expired, simply log in again. You can also clear cookies manually.

### Date Off by One Day

Dates use local timezone formatting to avoid UTC offset issues. If you see date discrepancies, ensure your device timezone is set correctly.

---

## License

Private project. All rights reserved.

---

## Acknowledgments

* **Convex** — Real-time cloud database platform
* **shadcn/ui** — Beautiful component library
* **Al Quran Cloud** — Quran verse API
* **Material Design 3** — Design system inspiration

---

> *"Indeed, with hardship comes ease."* — Quran 94:6

<div align="center">

*🖋️ the pen hasn't lifted*

</div>
