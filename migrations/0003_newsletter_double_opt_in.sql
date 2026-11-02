-- Double opt-in, subscriber language and source. Rows that already exist subscribed under the earlier single opt-in and
-- stay active; new signups start as 'pending' until the confirmation link is used.
ALTER TABLE subscribers ADD COLUMN locale TEXT NOT NULL DEFAULT 'zh-TW';
ALTER TABLE subscribers ADD COLUMN source TEXT NOT NULL DEFAULT 'website';
ALTER TABLE subscribers ADD COLUMN confirm_token TEXT;
ALTER TABLE subscribers ADD COLUMN confirm_sent_at TEXT;
ALTER TABLE subscribers ADD COLUMN confirmed_at TEXT;
CREATE UNIQUE INDEX subscribers_confirm_token_unique ON subscribers (confirm_token);
