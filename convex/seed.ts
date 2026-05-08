import { mutation } from "./_generated/server";
import { v } from "convex/values";



// Seed the admin user. Call this from Convex dashboard or via `npx convex run seed:admin`
// The password is hashed on the client side (Next.js API route) before being sent.
// This function should only be called once during initial setup.
export const admin = mutation({
  args: {
    username: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
  },
  handler: async (ctx, { username, passwordHash, salt }) => {
    // Check if admin user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (existing) {
      return { success: false, message: "Admin user already exists" };
    }

    const userId = await ctx.db.insert("users", {
      username,
      passwordHash,
      salt,
      createdAt: Date.now(),
    });

    // Create default settings for the admin user
    await ctx.db.insert("userSettings", {
      userId,
      profileName: "User",
      appTitle: "ar-Raqmi Dashboard",
      appLogo: "https://cdn-icons-png.flaticon.com/512/8323/8323511.png",
      iconBackgroundColor: "#A5D6A7",
      hijriVisible: true,
      hijriOffset: 0,
      showSeconds: true,
      clipboardText: "",
      backgroundType: "default",
      backgroundColor: "#A5D6A7",
      backgroundGradient: "citrus-dawn",
      backgroundImage: "",
      backgroundOpacity: 30,
    });

    // Create default dashboard widgets
    const defaultWidgets = [
      { type: "tasks", label: "Daily Tasks", icon: "check_circle", visible: true },
      { type: "calendar", label: "Calendar", icon: "calendar_month", visible: true },
      { type: "notes", label: "Quick Notes", icon: "sticky_note_2", visible: true },
      { type: "verse", label: "Daily Verse", icon: "auto_stories", visible: true },
      { type: "goals", label: "Goals", icon: "flag", visible: true },
      { type: "clock", label: "World Clock", icon: "schedule", visible: true },
      { type: "files", label: "Files", icon: "folder", visible: true },
      { type: "clipboard", label: "Clipboard", icon: "content_paste", visible: true },
    ];

    for (const w of defaultWidgets) {
      await ctx.db.insert("dashboardWidgets", { userId, ...w });
    }

    // Create default dashboard layouts
    const MAX_W = 3;
    const MAX_H = 6;

    const desktopLayouts = [
      { i: "tasks", x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "calendar", x: 2, y: 0, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "notes", x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "verse", x: 1, y: 2, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "goals", x: 2, y: 2, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "clock", x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "files", x: 1, y: 4, w: 1, h: 1, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
      { i: "clipboard", x: 2, y: 4, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
    ];

    const mobileLayouts = [
      { i: "tasks", x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "calendar", x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "notes", x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "verse", x: 0, y: 6, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "goals", x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "clock", x: 0, y: 10, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "files", x: 0, y: 12, w: 1, h: 1, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
      { i: "clipboard", x: 0, y: 13, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
    ];

    await ctx.db.insert("dashboardLayouts", {
      userId,
      layoutType: "desktop",
      layouts: JSON.stringify(desktopLayouts),
    });

    await ctx.db.insert("dashboardLayouts", {
      userId,
      layoutType: "mobile",
      layouts: JSON.stringify(mobileLayouts),
    });

    // Create default clock
    await ctx.db.insert("clocks", {
      userId,
      label: "Kuala Lumpur",
      timezone: "Asia/Kuala_Lumpur",
    });

    // Create sample data
    const now = new Date().toISOString();
    const localDateStr = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    // Sample tasks
    const sampleTasks = [
      { title: "Submit quarterly report", dueDate: localDateStr(new Date(Date.now() - 86400000 * 2)), priority: "high", status: "pending", createdAt: now },
      { title: "Review project proposal", dueDate: localDateStr(new Date()), priority: "high", status: "pending", createdAt: now },
      { title: "Update documentation", dueDate: localDateStr(new Date(Date.now() + 86400000)), priority: "medium", status: "pending", createdAt: now },
      { title: "Team standup meeting", dueDate: localDateStr(new Date()), priority: "low", status: "completed", createdAt: now },
      { title: "Fix API endpoint bug", dueDate: localDateStr(new Date(Date.now() + 86400000 * 2)), priority: "high", status: "pending", createdAt: now },
      { title: "Write unit tests", dueDate: localDateStr(new Date(Date.now() + 86400000)), priority: "medium", status: "pending", createdAt: now },
    ];

    for (const t of sampleTasks) {
      await ctx.db.insert("tasks", { userId, ...t });
    }

    // Sample goals with milestones
    const goalData = [
      {
        title: "Complete ar-Raqmi Dashboard", progress: 65,
        milestones: [
          { label: "Design Phase", completed: true },
          { label: "Core Features", completed: true },
          { label: "Grid Engine", completed: false },
          { label: "Launch", completed: false },
        ],
      },
      {
        title: "Learn Arabic Calligraphy", progress: 30,
        milestones: [
          { label: "Basic Strokes", completed: true },
          { label: "Letter Forms", completed: false },
          { label: "Composition", completed: false },
        ],
      },
      {
        title: "Read 30 Books This Year", progress: 43,
        milestones: [
          { label: "10 Books", completed: true },
          { label: "20 Books", completed: false },
          { label: "30 Books", completed: false },
        ],
      },
    ];

    for (const g of goalData) {
      const goalId = await ctx.db.insert("goals", {
        userId,
        title: g.title,
        progress: g.progress,
        createdAt: now,
      });
      for (let i = 0; i < g.milestones.length; i++) {
        await ctx.db.insert("milestones", {
          goalId,
          label: g.milestones[i].label,
          completed: g.milestones[i].completed,
          order: i,
        });
      }
    }

    // Sample notes
    const sampleNotes = [
      { title: "Project Ideas", content: "Build a Quran study app with AI-powered tafsir recommendations", color: "#A5D6A7", pinned: true, createdAt: now, updatedAt: now },
      { title: "Meeting Notes", content: "Discuss sprint priorities and assign tasks for next week", color: "#F48FB1", pinned: false, createdAt: now, updatedAt: now },
      { title: "Quick Reminder", content: "Submit quarterly report by Friday", color: "#CE93D8", pinned: false, createdAt: now, updatedAt: now },
      { title: "Design Inspiration", content: "Material 3 Expressive: bouncy animations, bold colors, rounded shapes", color: "#80CBC4", pinned: false, createdAt: now, updatedAt: now },
    ];

    for (const n of sampleNotes) {
      await ctx.db.insert("notes", { userId, ...n });
    }

    // Sample events
    const sampleEvents = [
      { title: "Team Meeting", date: localDateStr(new Date()), color: "#A5D6A7" },
      { title: "Project Deadline", date: localDateStr(new Date(Date.now() + 86400000 * 2)), color: "#F48FB1" },
      { title: "Design Review", date: localDateStr(new Date(Date.now() + 86400000 * 5)), color: "#CE93D8" },
      { title: "Sprint Planning", date: localDateStr(new Date(Date.now() + 86400000 * 7)), color: "#80CBC4" },
    ];

    for (const e of sampleEvents) {
      await ctx.db.insert("events", { userId, ...e });
    }

    // Sample files (folders first, then files inside them)
    const folderDocs = await ctx.db.insert("files", { userId, name: "Documents", type: "folder", category: "folder", parentId: undefined, size: 0, createdAt: now, updatedAt: now });
    const folderImgs = await ctx.db.insert("files", { userId, name: "Images", type: "folder", category: "folder", parentId: undefined, size: 0, createdAt: now, updatedAt: now });
    const folderAud = await ctx.db.insert("files", { userId, name: "Audio", type: "folder", category: "folder", parentId: undefined, size: 0, createdAt: now, updatedAt: now });

    const sampleFiles = [
      { name: "Project Plan.pdf", type: "file", category: "pdf", parentId: folderDocs, size: 2450000 },
      { name: "Meeting Notes.doc", type: "file", category: "doc", parentId: folderDocs, size: 156000 },
      { name: "Budget.xlsx", type: "file", category: "doc", parentId: folderDocs, size: 89000 },
      { name: "Dashboard Mock.png", type: "file", category: "image", parentId: folderImgs, size: 3200000 },
      { name: "Logo.svg", type: "file", category: "image", parentId: folderImgs, size: 24000 },
      { name: "Recitation.mp3", type: "file", category: "audio", parentId: folderAud, size: 8500000 },
      { name: "Adhan.mp3", type: "file", category: "audio", parentId: folderAud, size: 4200000 },
    ];

    for (const f of sampleFiles) {
      await ctx.db.insert("files", { userId, ...f, createdAt: now, updatedAt: now });
    }

    return { success: true, userId };
  },
});
