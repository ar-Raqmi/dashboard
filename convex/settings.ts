import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthedUserId } from "./auth";

export const get = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (!settings) return null;

    return {
      profileName: settings.profileName,
      profilePicture: settings.profilePicture ?? "",
      appTitle: settings.appTitle,
      appLogo: settings.appLogo ?? "",
      iconBackgroundColor: settings.iconBackgroundColor,
      hijriVisible: settings.hijriVisible,
      hijriOffset: settings.hijriOffset,
      showSeconds: settings.showSeconds,
      clipboardText: settings.clipboardText,
      background: {
        type: settings.backgroundType,
        color: settings.backgroundColor,
        gradient: settings.backgroundGradient,
        image: settings.backgroundImage,
        opacity: settings.backgroundOpacity,
      },
    };
  },
});

export const update = mutation({
  args: {
    sessionToken: v.string(),
    profileName: v.optional(v.string()),
    profilePicture: v.optional(v.string()),
    appTitle: v.optional(v.string()),
    appLogo: v.optional(v.string()),
    iconBackgroundColor: v.optional(v.string()),
    hijriVisible: v.optional(v.boolean()),
    hijriOffset: v.optional(v.number()),
    showSeconds: v.optional(v.boolean()),
    clipboardText: v.optional(v.string()),
    backgroundType: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    backgroundGradient: v.optional(v.string()),
    backgroundImage: v.optional(v.string()),
    backgroundOpacity: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, ...updates }) => {
    const userId = await getAuthedUserId(ctx, sessionToken);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (!settings) {
      // Create default settings if not exist
      await ctx.db.insert("userSettings", {
        userId,
        profileName: updates.profileName ?? "User",
        profilePicture: updates.profilePicture,
        appTitle: updates.appTitle ?? "ar-Raqmi Dashboard",
        appLogo: updates.appLogo ?? "https://cdn-icons-png.flaticon.com/512/8323/8323511.png",
        iconBackgroundColor: updates.iconBackgroundColor ?? "#A5D6A7",
        hijriVisible: updates.hijriVisible ?? true,
        hijriOffset: updates.hijriOffset ?? 0,
        showSeconds: updates.showSeconds ?? true,
        clipboardText: updates.clipboardText ?? "",
        backgroundType: updates.backgroundType ?? "default",
        backgroundColor: updates.backgroundColor ?? "#A5D6A7",
        backgroundGradient: updates.backgroundGradient ?? "citrus-dawn",
        backgroundImage: updates.backgroundImage ?? "",
        backgroundOpacity: updates.backgroundOpacity ?? 30,
      });
    } else {
      // Only update provided fields
      const cleanUpdates: Record<string, any> = {};
      if (updates.profileName !== undefined) cleanUpdates.profileName = updates.profileName;
      if (updates.profilePicture !== undefined) cleanUpdates.profilePicture = updates.profilePicture;
      if (updates.appTitle !== undefined) cleanUpdates.appTitle = updates.appTitle;
      if (updates.appLogo !== undefined) cleanUpdates.appLogo = updates.appLogo;
      if (updates.iconBackgroundColor !== undefined) cleanUpdates.iconBackgroundColor = updates.iconBackgroundColor;
      if (updates.hijriVisible !== undefined) cleanUpdates.hijriVisible = updates.hijriVisible;
      if (updates.hijriOffset !== undefined) cleanUpdates.hijriOffset = Math.max(-2, Math.min(2, updates.hijriOffset));
      if (updates.showSeconds !== undefined) cleanUpdates.showSeconds = updates.showSeconds;
      if (updates.clipboardText !== undefined) cleanUpdates.clipboardText = updates.clipboardText;
      if (updates.backgroundType !== undefined) cleanUpdates.backgroundType = updates.backgroundType;
      if (updates.backgroundColor !== undefined) cleanUpdates.backgroundColor = updates.backgroundColor;
      if (updates.backgroundGradient !== undefined) cleanUpdates.backgroundGradient = updates.backgroundGradient;
      if (updates.backgroundImage !== undefined) cleanUpdates.backgroundImage = updates.backgroundImage;
      if (updates.backgroundOpacity !== undefined) cleanUpdates.backgroundOpacity = updates.backgroundOpacity;

      await ctx.db.patch(settings._id, cleanUpdates);
    }
  },
});
