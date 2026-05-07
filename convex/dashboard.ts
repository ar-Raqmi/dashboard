import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

// Widgets
export const listWidgets = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const widgets = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return widgets.map(w => ({
      type: w.type,
      label: w.label,
      icon: w.icon,
      visible: w.visible,
    }));
  },
});

export const toggleWidgetVisibility = mutation({
  args: { sessionToken: v.string(), widgetType: v.string() },
  handler: async (ctx, { sessionToken, widgetType }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const widget = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const target = widget.find(w => w.type === widgetType);
    if (target) {
      await ctx.db.patch(target._id, { visible: !target.visible });
    }
  },
});

export const setWidgets = mutation({
  args: {
    sessionToken: v.string(),
    widgets: v.array(v.object({
      type: v.string(),
      label: v.string(),
      icon: v.string(),
      visible: v.boolean(),
    })),
  },
  handler: async (ctx, { sessionToken, widgets }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);

    // Delete existing widgets
    const existing = await ctx.db
      .query("dashboardWidgets")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const w of existing) {
      await ctx.db.delete(w._id);
    }

    // Insert new widgets
    for (const w of widgets) {
      await ctx.db.insert("dashboardWidgets", { userId, ...w });
    }
  },
});

// Layouts
export const getLayout = query({
  args: { sessionToken: v.string(), layoutType: v.string() },
  handler: async (ctx, { sessionToken, layoutType }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const layout = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_user_type", (q: any) => q.eq("userId", userId).eq("layoutType", layoutType))
      .first();

    if (!layout) return [];
    return JSON.parse(layout.layouts);
  },
});

export const setLayout = mutation({
  args: {
    sessionToken: v.string(),
    layoutType: v.string(),
    layouts: v.string(), // JSON string of Layout[]
  },
  handler: async (ctx, { sessionToken, layoutType, layouts }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);

    const existing = await ctx.db
      .query("dashboardLayouts")
      .withIndex("by_user_type", (q: any) => q.eq("userId", userId).eq("layoutType", layoutType))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { layouts });
    } else {
      await ctx.db.insert("dashboardLayouts", { userId, layoutType, layouts });
    }
  },
});
