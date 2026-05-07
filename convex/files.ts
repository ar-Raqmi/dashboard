import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

// List files in a given directory (parentId null for root)
export const list = query({
  args: { 
    sessionToken: v.string(),
    parentId: v.optional(v.id("files"))
  },
  handler: async (ctx, { sessionToken, parentId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    
    return await ctx.db
      .query("files")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const createFile = mutation({
  args: {
    sessionToken: v.string(),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    category: v.optional(v.union(v.literal("image"), v.literal("audio"), v.literal("pdf"), v.literal("doc"), v.literal("video"), v.literal("other"))),
    parentId: v.optional(v.id("files")),
    size: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const { sessionToken, ...fileData } = args;
    const userId = await getAuthedUserId(ctx, sessionToken);
    const now = Date.now();
    
    return await ctx.db.insert("files", {
      ...fileData,
      userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const rename = mutation({
  args: { sessionToken: v.string(), id: v.id("files"), name: v.string() },
  handler: async (ctx, { sessionToken, id, name }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const file = await ctx.db.get(id);
    if (!file || file.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.patch(id, { name, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { sessionToken: v.string(), id: v.id("files") },
  handler: async (ctx, { sessionToken, id }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const file = await ctx.db.get(id);
    if (!file || file.userId !== userId) throw new Error("Unauthorized");
    
    const deleteRecursive = async (fileId: any) => {
      const children = await ctx.db
        .query("files")
        .withIndex("by_parent", (q) => q.eq("parentId", fileId))
        .collect();
        
      for (const child of children) {
        if (child.type === "folder") await deleteRecursive(child._id);
        if (child.storageId) await ctx.storage.delete(child.storageId);
        await ctx.db.delete(child._id);
      }
    };
    
    if (file.type === "folder") await deleteRecursive(id);
    if (file.storageId) await ctx.storage.delete(file.storageId);
    await ctx.db.delete(id);
  },
});

export const getFileUrl = query({
  args: { sessionToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { sessionToken, storageId }) => {
    await getAuthedUserId(ctx, sessionToken);
    return await ctx.storage.getUrl(storageId);
  },
});
