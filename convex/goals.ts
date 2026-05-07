import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    // Fetch milestones for each goal
    const goalsWithMilestones = await Promise.all(
      goals.map(async (g) => {
        const milestones = await ctx.db
          .query("milestones")
          .withIndex("by_goal", (q: any) => q.eq("goalId", g._id))
          .collect();

        return {
          id: g._id,
          title: g.title,
          progress: g.progress,
          milestones: milestones
            .sort((a, b) => a.order - b.order)
            .map(m => ({
              id: m._id,
              label: m.label,
              completed: m.completed,
            })),
          createdAt: g.createdAt,
        };
      })
    );

    return goalsWithMilestones;
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    progress: v.number(),
    milestones: v.array(v.object({
      label: v.string(),
      completed: v.boolean(),
      id: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { sessionToken, title, progress, milestones }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const goalId = await ctx.db.insert("goals", {
      userId,
      title,
      progress,
      createdAt: new Date().toISOString(),
    });

    // Create milestones
    for (let i = 0; i < milestones.length; i++) {
      await ctx.db.insert("milestones", {
        goalId,
        label: milestones[i].label,
        completed: milestones[i].completed,
        order: i,
      });
    }

    return goalId;
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    goalId: v.id("goals"),
    title: v.optional(v.string()),
    progress: v.optional(v.number()),
    milestones: v.optional(v.array(v.object({
      id: v.optional(v.string()),
      label: v.string(),
      completed: v.boolean(),
    }))),
  },
  handler: async (ctx, { sessionToken, goalId, title, progress, milestones }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    if (title !== undefined) {
      await ctx.db.patch(goalId, { title });
    }

    if (milestones) {
      const existingMilestones = await ctx.db
        .query("milestones")
        .withIndex("by_goal", (q: any) => q.eq("goalId", goalId))
        .collect();

      const existingIds = new Set(existingMilestones.map((m) => m._id.toString()));
      const updatedMilestones = milestones.filter((m) => m.id && existingIds.has(m.id));
      const updatedIds = new Set(updatedMilestones.map((m) => m.id));

      // 1. Delete milestones not in the new list
      for (const m of existingMilestones) {
        if (!updatedIds.has(m._id.toString())) {
          await ctx.db.delete(m._id);
        }
      }

      // 2. Update existing and insert new
      for (let i = 0; i < milestones.length; i++) {
        const m = milestones[i];
        if (m.id && existingIds.has(m.id)) {
          await ctx.db.patch(m.id as any, {
            label: m.label,
            completed: m.completed,
            order: i,
          });
        } else {
          await ctx.db.insert("milestones", {
            goalId,
            label: m.label,
            completed: m.completed,
            order: i,
          });
        }
      }

      // Recalculate progress if not explicitly provided
      if (progress === undefined) {
        const completedCount = milestones.filter((m) => m.completed).length;
        const totalCount = milestones.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        await ctx.db.patch(goalId, { progress: newProgress });
      }
    } else if (progress !== undefined) {
      await ctx.db.patch(goalId, { progress });
    }
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), goalId: v.id("goals") },
  handler: async (ctx, { sessionToken, goalId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    // Delete all milestones first
    const milestones = await ctx.db
      .query("milestones")
      .withIndex("by_goal", (q: any) => q.eq("goalId", goalId))
      .collect();

    for (const m of milestones) {
      await ctx.db.delete(m._id);
    }

    await ctx.db.delete(goalId);
  },
});

export const toggleMilestone = mutation({
  args: { sessionToken: v.string(), goalId: v.id("goals"), milestoneId: v.id("milestones") },
  handler: async (ctx, { sessionToken, goalId, milestoneId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error("Goal not found or unauthorized");
    }

    const milestone = await ctx.db.get(milestoneId);
    if (!milestone || milestone.goalId !== goalId) {
      throw new Error("Milestone not found");
    }

    const newCompleted = !milestone.completed;
    await ctx.db.patch(milestoneId, { completed: newCompleted });

    // Recalculate progress
    const allMilestones = await ctx.db
      .query("milestones")
      .withIndex("by_goal", (q: any) => q.eq("goalId", goalId))
      .collect();

    const completed = allMilestones.filter(m => m._id === milestoneId ? newCompleted : m.completed).length;
    const total = allMilestones.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await ctx.db.patch(goalId, { progress });
  },
});
