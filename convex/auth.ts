import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Helper: Validate session token and return userId
// Works in both Actions (using ctx.runQuery) and Mutations/Queries (using ctx.db)
export async function getAuthedUserId(ctx: any, sessionToken: string): Promise<Id<"users">> {
  let session;
  
  if (ctx.db) {
    // We are in a Mutation or Query
    session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
      .first();
  } else {
    // We are in an Action
    session = await ctx.runQuery(api.auth.verifySession, { sessionToken });
  }

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized: Invalid or expired session");
  }

  return session.userId as Id<"users">;
}

// Internal query to verify session, used by getAuthedUserId in Actions
export const verifySession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
      .first();
  },
});

// Query: Validate session and return user info
export const validateSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      userId: user._id,
      username: user.username,
    };
  },
});

// Query: Get user by username (for login verification)
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q: any) => q.eq("username", username))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      passwordHash: user.passwordHash,
      salt: user.salt,
    };
  },
});

// Mutation: Update user credentials
export const updateUser = mutation({
  args: {
    sessionToken: v.string(),
    newUsername: v.optional(v.string()),
    newPasswordHash: v.optional(v.string()),
    newSalt: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, newUsername, newPasswordHash, newSalt }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);

    const updates: Record<string, any> = {};

    if (newUsername !== undefined) {
      // Check if username is already taken by another user
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q: any) => q.eq("username", newUsername))
        .first();

      if (existing && existing._id !== userId) {
        return { success: false, error: "Username already taken" };
      }
      updates.username = newUsername;
    }

    if (newPasswordHash !== undefined) {
      updates.passwordHash = newPasswordHash;
      updates.salt = newSalt;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }

    return { success: true };
  },
});
