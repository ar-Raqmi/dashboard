import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const list = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const files = await ctx.db
      .query("files")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    return files.map(f => ({
      id: f._id,
      name: f.name,
      type: f.type,
      category: f.category,
      parentId: f.parentId ?? null,
      size: f.size,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      content: f.content ?? undefined,
    }));
  },
});

export const create = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    type: v.string(),
    category: v.string(),
    parentId: v.optional(v.id("files")),
    size: v.number(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, name, type, category, parentId, size, content }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const now = new Date().toISOString();
    return await ctx.db.insert("files", {
      userId,
      name,
      type,
      category,
      parentId,
      size,
      createdAt: now,
      updatedAt: now,
      content,
    });
  },
});

export const rename = mutation({
  args: { sessionToken: v.string(), fileId: v.id("files"), name: v.string() },
  handler: async (ctx, { sessionToken, fileId, name }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const file = await ctx.db.get(fileId);
    if (!file || file.userId !== userId) {
      throw new Error("File not found or unauthorized");
    }
    await ctx.db.patch(fileId, { name, updatedAt: new Date().toISOString() });
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const saveFile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    type: v.string(),
    category: v.string(),
    parentId: v.optional(v.id("files")),
    size: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { sessionToken, name, type, category, parentId, size, storageId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const now = new Date().toISOString();
    return await ctx.db.insert("files", {
      userId,
      name,
      type,
      category,
      parentId,
      size,
      createdAt: now,
      updatedAt: now,
      storageId,
    });
  },
});

export const move = mutation({
  args: {
    sessionToken: v.string(),
    fileId: v.id("files"),
    newParentId: v.optional(v.id("files")),
  },
  handler: async (ctx, { sessionToken, fileId, newParentId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const file = await ctx.db.get(fileId);
    if (!file || file.userId !== userId) {
      throw new Error("File not found or unauthorized");
    }
    await ctx.db.patch(fileId, {
      parentId: newParentId,
      updatedAt: new Date().toISOString(),
    });
  },
});
