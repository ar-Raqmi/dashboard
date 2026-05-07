import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Auth
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    salt: v.string(),
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Tasks
  tasks: defineTable({
    userId: v.id("users"),
    title: v.string(),
    dueDate: v.optional(v.string()),
    priority: v.string(), // 'high' | 'medium' | 'low'
    status: v.string(), // 'pending' | 'completed'
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  // Goals
  goals: defineTable({
    userId: v.id("users"),
    title: v.string(),
    progress: v.number(),
    order: v.optional(v.number()),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  // Milestones (separate table, linked to goals)
  milestones: defineTable({
    goalId: v.id("goals"),
    label: v.string(),
    completed: v.boolean(),
    order: v.number(),
  }).index("by_goal", ["goalId"]),

  // Notes
  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    color: v.string(),
    pinned: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // Calendar Events
  events: defineTable({
    userId: v.id("users"),
    title: v.string(),
    date: v.string(),
    color: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Files
  files: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    category: v.optional(v.union(v.literal("image"), v.literal("audio"), v.literal("pdf"), v.literal("doc"), v.literal("video"), v.literal("folder"), v.literal("other"))),
    parentId: v.optional(v.id("files")), // self-referential parent
    size: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    starred: v.optional(v.boolean()),
    lastAccessed: v.optional(v.number()),
    createdAt: v.union(v.number(), v.string()), 
    updatedAt: v.union(v.number(), v.string()),
  }).index("by_user", ["userId"])
    .index("by_parent", ["parentId"])
    .index("by_user_parent", ["userId", "parentId"])
    .index("by_user_starred", ["userId", "starred"])
    .index("by_user_category", ["userId", "category"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["userId"],
    }),

  // Clocks
  clocks: defineTable({
    userId: v.id("users"),
    label: v.string(),
    timezone: v.string(),
  }).index("by_user", ["userId"]),

  // Dashboard Widgets
  dashboardWidgets: defineTable({
    userId: v.id("users"),
    type: v.string(),
    label: v.string(),
    icon: v.string(),
    visible: v.boolean(),
  }).index("by_user", ["userId"]),

  // Dashboard Layouts
  dashboardLayouts: defineTable({
    userId: v.id("users"),
    layoutType: v.string(), // 'desktop' | 'mobile' | 'notesDesktop' | 'notesMobile' | 'pinnedDesktop' | 'pinnedMobile'
    layouts: v.string(), // JSON string of Layout[]
  }).index("by_user", ["userId"])
    .index("by_user_type", ["userId", "layoutType"]),

  // User Settings
  userSettings: defineTable({
    userId: v.id("users"),
    profileName: v.string(),
    profilePicture: v.optional(v.string()),
    appTitle: v.string(),
    appLogo: v.optional(v.string()),
    iconBackgroundColor: v.string(),
    hijriVisible: v.boolean(),
    hijriOffset: v.number(),
    showSeconds: v.boolean(),
    clipboardText: v.string(),
    backgroundType: v.string(),
    backgroundColor: v.string(),
    backgroundGradient: v.string(),
    backgroundImage: v.string(),
    backgroundOpacity: v.number(),
  }).index("by_user", ["userId"]),
});
