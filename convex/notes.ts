import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return notes.map(n => ({
      id: n._id,
      title: n.title,
      content: n.content,
      color: n.color,
      pinned: n.pinned,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    content: v.string(),
    color: v.string(),
    pinned: v.boolean(),
  },
  handler: async (ctx, { sessionToken, title, content, color, pinned }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const now = new Date().toISOString();
    const id = await ctx.db.insert("notes", {
      userId,
      title,
      content,
      color,
      pinned,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    color: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, { sessionToken, noteId, ...updates }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }
    const cleanUpdates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.content !== undefined) cleanUpdates.content = updates.content;
    if (updates.color !== undefined) cleanUpdates.color = updates.color;
    if (updates.pinned !== undefined) cleanUpdates.pinned = updates.pinned;
    await ctx.db.patch(noteId, cleanUpdates);
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), noteId: v.id("notes") },
  handler: async (ctx, { sessionToken, noteId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }
    await ctx.db.delete(noteId);
  },
});

export const togglePinned = mutation({
  args: { sessionToken: v.string(), noteId: v.id("notes") },
  handler: async (ctx, { sessionToken, noteId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const note = await ctx.db.get(noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or unauthorized");
    }
    await ctx.db.patch(noteId, {
      pinned: !note.pinned,
      updatedAt: new Date().toISOString(),
    });
  },
});
