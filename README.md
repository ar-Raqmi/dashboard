<div align="center">

# ar-Raqmi Dashboard

*Your personal digital sanctuary.*

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

<br />

<img src=".github/images/dashboard.png" width="800" alt="Dashboard Screenshot" />

</div>

### ✨ Features
- **Customizable Widgets** — Drag, resize, and toggle dashboard modules
- **Productivity Hub** — Tasks, Calendar, Markdown Notes, and Goal Tracking
- **File Manager** — Secure, hierarchical cloud storage powered by Cloudflare R2
- **Spiritual Tools** — Daily Quran/Hadith, Hijri calendar, World Clocks
- **Modern Architecture** — Clean, object-oriented service architecture and Next.js 16 Edge runtime

### 🚀 Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Sync SQLite Database (Prisma)
npx prisma db push

# 3. Launch the app
npm run dev
```

### 🛠️ The Stack
**Next.js 16** • **Cloudflare Edge / Pages** • **Prisma + SQLite/D1** • **Cloudflare R2** • **Tailwind 4** • **Zustand**

### 📂 Architecture
The backend is structured around a clean, modular Object-Oriented service design:
- **`src/lib/services/`**: Modular domain-specific services (e.g., `AuthService`, `TaskService`, `GoalService`, `FileService`, etc.) that handle business logic.
- **`src/lib/api-router.ts`**: The query and mutation routing layer that acts as a thin dispatcher mapping requests to the appropriate service class instance.

---

<div align="center">

*"Indeed, with hardship comes ease."* — 94:6

*🖋️ the pen hasn't lifted*

</div>

