-- Applied to production D1 (dashboard-db) on 2026-07-18.
-- Additive-only (no data deleted). File-manager metadata + thumbnail support.

ALTER TABLE "FileItem" ADD COLUMN "mimeType" TEXT;
ALTER TABLE "FileItem" ADD COLUMN "width" INTEGER;
ALTER TABLE "FileItem" ADD COLUMN "height" INTEGER;
ALTER TABLE "FileItem" ADD COLUMN "duration" REAL;
ALTER TABLE "FileItem" ADD COLUMN "thumbnailR2Key" TEXT;
