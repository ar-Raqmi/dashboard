import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return tasks.map(t => ({
      id: t._id,
      title: t.title,
      dueDate: t.dueDate ?? null,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
    }));
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    dueDate: v.optional(v.string()),
    priority: v.string(),
    status: v.string(),
  },
  handler: async (ctx, { sessionToken, title, dueDate, priority, status }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const id = await ctx.db.insert("tasks", {
      userId,
      title,
      dueDate,
      priority,
      status,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, taskId, ...updates }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }
    const cleanUpdates: Record<string, any> = {};
    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate;
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    await ctx.db.patch(taskId, cleanUpdates);
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, { sessionToken, taskId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }
    await ctx.db.delete(taskId);
  },
});

export const deleteCompleted = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    for (const task of tasks) {
      if (task.status === "completed") {
        await ctx.db.delete(task._id);
      }
    }
  },
});

export const toggleStatus = mutation({
  args: { sessionToken: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, { sessionToken, taskId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }
    await ctx.db.patch(taskId, {
      status: task.status === "pending" ? "completed" : "pending",
    });
  },
});
