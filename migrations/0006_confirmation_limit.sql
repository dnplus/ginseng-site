-- Cap on confirmation emails per address, so the signup form cannot be used to flood someone's inbox:
-- confirm_sends counts the emails sent since confirm_window_at; the count restarts once that window has passed.
ALTER TABLE subscribers ADD COLUMN confirm_sends INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscribers ADD COLUMN confirm_window_at TEXT;
