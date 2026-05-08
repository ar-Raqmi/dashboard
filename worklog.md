---
Task ID: 1
Agent: Main Agent
Task: Migrate ar-Raqmi Dashboard from SQLite/localStorage to Convex.dev with authentication

Work Log:
- Installed convex, bcryptjs, jose, @types/bcryptjs packages
- Created Convex project structure at /convex/ with schema, functions, and generated stubs
- Defined comprehensive Convex schema with 12 tables: users, sessions, tasks, goals, milestones, notes, events, files, clocks, dashboardWidgets, dashboardLayouts, userSettings
- Created Convex CRUD functions for all data types with session token validation
- Created auth helper (getAuthedUserId) used by all Convex functions
- Created seed function (convex/seed.ts) that creates admin user + sample data
- Created Next.js auth API routes: /api/auth/login, /api/auth/logout, /api/auth/me, /api/auth/seed
- Implemented password hashing with bcryptjs (12 salt rounds) in /src/lib/auth.ts
- Implemented JWT token creation/verification with jose library
- Created AuthProvider context and useAuth hook (/src/hooks/useAuth.tsx)
- Created LoginPage component with login form, setup section, and Convex config detection
- Created ConvexSync component that bridges Convex queries → Zustand store and overrides Zustand actions with Convex-aware mutations
- Updated Zustand store to remove persist middleware (data now lives in Convex, not localStorage)
- Updated layout.tsx to include ConvexProvider and AuthProvider via Providers component
- Updated page.tsx with auth gate (shows LoginPage when not authenticated, main app when authenticated)
- Fixed Files page background (added rounded-3xl bg-card border border-border/50)
- Created comprehensive README.md with full documentation
- Updated .env and .env.local with Convex URL placeholders

Stage Summary:
- Full Convex.dev integration with 12 database tables and all CRUD operations
- Secure authentication system with bcryptjs password hashing, JWT tokens, and httpOnly cookies
- Login page with initial setup (seed) functionality
- ConvexSync bridge allows existing components to use Zustand unchanged while data persists in Convex
- App shows login page when not authenticated, main app when authenticated
- Files page now has opaque background (no collision with custom backgrounds)
- README.md with complete setup instructions, architecture docs, and troubleshooting guide
- User needs to: 1) Create Convex account, 2) Run npx convex dev, 3) Set NEXT_PUBLIC_CONVEX_URL, 4) Seed admin user via login page
