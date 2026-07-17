-- Applied to production D1 (dashboard-db) on 2026-07-17.
-- Additive-only (no data deleted). Backup taken beforehand:
--   backups/dashboard-db-backup-20260717-221342.sql

ALTER TABLE "Task" ADD COLUMN "rrule" TEXT;
ALTER TABLE "Task" ADD COLUMN "dtstart" TEXT;
ALTER TABLE "Task" ADD COLUMN "recurrenceUntil" TEXT;
ALTER TABLE "Task" ADD COLUMN "recurrenceCount" INTEGER;

ALTER TABLE "CalendarEvent" ADD COLUMN "rrule" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "dtstart" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceUntil" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "recurrenceCount" INTEGER;

CREATE TABLE IF NOT EXISTS "RecurrenceException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT,
    "newDate" TEXT,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurrenceException_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
