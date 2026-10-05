-- Which time zone "today" is measured in: 'auto' follows the device, otherwise an IANA zone such as Asia/Tokyo.
ALTER TABLE "UserSettings" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'auto';
