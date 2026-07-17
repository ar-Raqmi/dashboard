-- Applied to production D1 (dashboard-db) on 2026-07-17.
-- Additive-only (no data deleted). Timed-events support.
-- Legacy events remain all-day (NULL startTime => treated as all-day).

ALTER TABLE "CalendarEvent" ADD COLUMN "startTime" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "endTime" TEXT;
ALTER TABLE "CalendarEvent" ADD COLUMN "allDay" BOOLEAN;
