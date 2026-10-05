-- Prayer times and the Hijri date become two independent settings. They used to share
-- hijriProvider / hijriCalendar (the latter doubled as the JAKIM zone); those two columns are
-- now unused but stay in place, since SQLite cannot cheaply drop them.

ALTER TABLE "UserSettings" ADD COLUMN "prayerProvider" TEXT NOT NULL DEFAULT 'jakim';      -- jakim | aladhan
ALTER TABLE "UserSettings" ADD COLUMN "jakimZone" TEXT NOT NULL DEFAULT 'SGR01';
ALTER TABLE "UserSettings" ADD COLUMN "prayerPlace" TEXT NOT NULL DEFAULT 'city';          -- city | coords (Aladhan)
ALTER TABLE "UserSettings" ADD COLUMN "prayerLatitude" REAL;
ALTER TABLE "UserSettings" ADD COLUMN "prayerLongitude" REAL;
ALTER TABLE "UserSettings" ADD COLUMN "prayerPlaceName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "UserSettings" ADD COLUMN "prayerMethod" INTEGER NOT NULL DEFAULT 3;           -- Aladhan calculation method id
ALTER TABLE "UserSettings" ADD COLUMN "prayerSchool" INTEGER NOT NULL DEFAULT 0;           -- 0 standard, 1 Hanafi (Asr)
ALTER TABLE "UserSettings" ADD COLUMN "hijriMethod" TEXT NOT NULL DEFAULT 'jakim';         -- jakim | UAQ | HJCoSA | DIYANET | MATHEMATICAL
ALTER TABLE "UserSettings" ADD COLUMN "hijriRollover" TEXT NOT NULL DEFAULT 'midnight';    -- midnight | maghrib

-- Carry over what is configured today.
UPDATE "UserSettings" SET "prayerProvider" = CASE WHEN "hijriProvider" = 'aladhan' THEN 'aladhan' ELSE 'jakim' END;
UPDATE "UserSettings" SET "jakimZone" = "hijriCalendar" WHERE "hijriCalendar" GLOB '[A-Z][A-Z][A-Z][0-9][0-9]';
UPDATE "UserSettings" SET "hijriMethod" = CASE WHEN "hijriProvider" = 'aladhan' THEN 'UAQ' ELSE 'jakim' END;
