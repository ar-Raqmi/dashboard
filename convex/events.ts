import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return events.map(e => ({
      id: e._id,
      title: e.title,
      date: e.date,
      color: e.color ?? undefined,
    }));
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    date: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, title, date, color }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    return await ctx.db.insert("events", {
      userId,
      title,
      date,
      color,
    });
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), eventId: v.id("events") },
  handler: async (ctx, { sessionToken, eventId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const event = await ctx.db.get(eventId);
    if (!event || event.userId !== userId) {
      throw new Error("Event not found or unauthorized");
    }
    await ctx.db.delete(eventId);
  },
});
