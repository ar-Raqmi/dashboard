import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const clocks = await ctx.db
      .query("clocks")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return clocks.map(c => ({
      id: c._id,
      label: c.label,
      timezone: c.timezone,
    }));
  },
});

export const add = mutation({
  args: { sessionToken: v.string(), label: v.string(), timezone: v.string() },
  handler: async (ctx, { sessionToken, label, timezone }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    return await ctx.db.insert("clocks", { userId, label, timezone });
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), clockId: v.id("clocks") },
  handler: async (ctx, { sessionToken, clockId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const clock = await ctx.db.get(clockId);
    if (!clock || clock.userId !== userId) {
      throw new Error("Clock not found or unauthorized");
    }
    await ctx.db.delete(clockId);
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    clockId: v.id("clocks"),
    label: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, clockId, ...updates }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const clock = await ctx.db.get(clockId);
    if (!clock || clock.userId !== userId) {
      throw new Error("Clock not found or unauthorized");
    }
    const cleanUpdates: Record<string, any> = {};
    if (updates.label !== undefined) cleanUpdates.label = updates.label;
    if (updates.timezone !== undefined) cleanUpdates.timezone = updates.timezone;
    await ctx.db.patch(clockId, cleanUpdates);
  },
});
