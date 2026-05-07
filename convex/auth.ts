import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Helper: Validate session token and return userId
export async function getAuthedUserId(ctx: any, sessionToken: string): Promise<Id<"users">> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized: Invalid or expired session");
  }

  return session.userId as Id<"users">;
}

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
