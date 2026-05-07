import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

// List files in a given directory (parentId null for root)
export const list = query({
  args: { 
    sessionToken: v.string(),
    parentId: v.optional(v.id("files")),
    starred: v.optional(v.boolean()),
    category: v.optional(v.union(v.literal("image"), v.literal("audio"), v.literal("pdf"), v.literal("doc"), v.literal("video"), v.literal("other"))),
  },
  handler: async (ctx, { sessionToken, parentId, starred, category }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    
    let q = ctx.db.query("files");

    if (starred !== undefined) {
      return await q
        .withIndex("by_user_starred", (q) => q.eq("userId", userId).eq("starred", starred))
        .collect();
    }

    if (category !== undefined) {
      return await q
        .withIndex("by_user_category", (q) => q.eq("userId", userId).eq("category", category))
        .collect();
    }

    // Default: list by parent
    return await q
      .withIndex("by_user_parent", (q) => q.eq("userId", userId).eq("parentId", parentId))
      .collect();
  },
});

// List all files for a user (for global search sync)
export const listAll = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    return await ctx.db
      .query("files")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Search files by name
export const search = query({
  args: { 
    sessionToken: v.string(),
    query: v.string(),
  },
  handler: async (ctx, { sessionToken, query }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    
    return await ctx.db
      .query("files")
      .withSearchIndex("search_name", (q) => 
        q.search("name", query).eq("userId", userId)
      )
      .take(20);
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
      starred: false,
      lastAccessed: now,
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

export const toggleStar = mutation({
  args: { sessionToken: v.string(), id: v.id("files") },
  handler: async (ctx, { sessionToken, id }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const file = await ctx.db.get(id);
    if (!file || file.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.patch(id, { starred: !file.starred, updatedAt: Date.now() });
  },
});

export const updateLastAccessed = mutation({
  args: { sessionToken: v.string(), id: v.id("files") },
  handler: async (ctx, { sessionToken, id }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const file = await ctx.db.get(id);
    if (!file || file.userId !== userId) throw new Error("Unauthorized");
    
    await ctx.db.patch(id, { lastAccessed: Date.now() });
  },
});

export const removeMultiple = mutation({
  args: { sessionToken: v.string(), ids: v.array(v.id("files")) },
  handler: async (ctx, { sessionToken, ids }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    
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

    for (const id of ids) {
      const file = await ctx.db.get(id);
      if (!file || file.userId !== userId) continue;
      
      if (file.type === "folder") await deleteRecursive(id);
      if (file.storageId) await ctx.storage.delete(file.storageId);
      await ctx.db.delete(id);
    }
  },
});

export const getFileUrl = query({
  args: { sessionToken: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, { sessionToken, storageId }) => {
    await getAuthedUserId(ctx, sessionToken);
    return await ctx.storage.getUrl(storageId);
  },
});

export const getPath = query({
  args: { sessionToken: v.string(), folderId: v.optional(v.id("files")) },
  handler: async (ctx, { sessionToken, folderId }) => {
    await getAuthedUserId(ctx, sessionToken);
    if (!folderId) return [];
    
    const path = [];
    let currentId: any = folderId;
    
    while (currentId) {
      const folder = await ctx.db.get(currentId);
      if (!folder) break;
      path.unshift({ id: folder._id, name: folder.name });
      currentId = folder.parentId;
    }
    
    return path;
  },
});
export const moveFiles = mutation({
  args: { 
    sessionToken: v.string(), 
    ids: v.array(v.id("files")), 
    newParentId: v.optional(v.id("files")) 
  },
  handler: async (ctx, { sessionToken, ids, newParentId }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    
    for (const id of ids) {
      const file = await ctx.db.get(id);
      if (!file || file.userId !== userId) continue;
      
      // Prevent moving a folder into itself or its children
      if (newParentId) {
        let current: any = newParentId;
        let isCyclic = false;
        while (current) {
          if (current === id) {
            isCyclic = true;
            break;
          }
          const parent = await ctx.db.get(current);
          current = parent?.parentId;
        }
        if (isCyclic) continue;
      }

      await ctx.db.patch(id, { parentId: newParentId, updatedAt: Date.now() });
    }
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

export const getFilesRecursive = query({
  args: { 
    sessionToken: v.string(), 
    ids: v.array(v.id("files")) 
  },
  handler: async (ctx, { sessionToken, ids }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const result: any[] = [];

    const fetchRecursive = async (fileId: any, currentPath: string) => {
      const file = await ctx.db.get(fileId);
      if (!file || file.userId !== userId) return;

      if (file.type === "file") {
        const url = file.storageId ? await ctx.storage.getUrl(file.storageId) : null;
        result.push({
          ...file,
          url,
          relativePath: currentPath + file.name
        });
      } else {
        const children = await ctx.db
          .query("files")
          .withIndex("by_parent", (q) => q.eq("parentId", fileId))
          .collect();
        
        for (const child of children) {
          await fetchRecursive(child._id, currentPath + file.name + "/");
        }
      }
    };

    for (const id of ids) {
      const file = await ctx.db.get(id);
      if (!file || file.userId !== userId) continue;
      
      if (file.type === "file") {
        const url = file.storageId ? await ctx.storage.getUrl(file.storageId) : null;
        result.push({
          ...file,
          url,
          relativePath: file.name
        });
      } else {
        await fetchRecursive(id, "");
      }
    }

    return result;
  },
});
