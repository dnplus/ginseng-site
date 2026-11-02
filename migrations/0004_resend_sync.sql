-- Subscribers are mirrored to Resend contacts (one segment per language) for broadcasts. D1 stays the source of truth;
-- 'pending' rows still need their current status pushed to Resend. Every existing row starts pending for the backfill.
ALTER TABLE subscribers ADD COLUMN resend_sync TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE subscribers ADD COLUMN resend_synced_at TEXT;
CREATE INDEX subscribers_resend_sync ON subscribers (resend_sync);
