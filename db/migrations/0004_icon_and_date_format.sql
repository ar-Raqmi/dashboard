-- brandIcon: which icon the sidebar, tab and installed app use (a preset id, 'custom' for appLogo, or 'none' to hide the in-app mark).
-- pwaIcon / pwaIconMaskable: PNG data URLs rendered in the browser from that choice, served at /pwa-icon/* for the web app manifest.
-- dateFormat: 'auto' keeps the readable default ("Oct 6"); anything else is a pattern such as dd/mm/yyyy.
ALTER TABLE "UserSettings" ADD COLUMN "brandIcon" TEXT NOT NULL DEFAULT 'raqmi';
ALTER TABLE "UserSettings" ADD COLUMN "pwaIcon" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UserSettings" ADD COLUMN "pwaIconMaskable" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UserSettings" ADD COLUMN "dateFormat" TEXT NOT NULL DEFAULT 'auto';
