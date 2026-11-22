/** Shared by the unsubscribe form and the one-click endpoint; also drops any pending confirmation and queues a Resend push. */
export const UNSUBSCRIBE_SQL = "UPDATE subscribers SET status = 'unsubscribed', confirm_token = NULL, resend_sync = 'pending', updated_at = ? WHERE unsubscribe_token = ? RETURNING email";
/**
 * Website signups that never confirmed, bound with the cutoff for their last confirmation email (`updated_at` when that
 * email failed to send). `resend_sync = 'done'` with no `resend_synced_at` is only true of a row the signup form
 * inserted and that has been pending ever since: confirming, unsubscribing, a partner product and the Resend backfill
 * all queue a push, and a push records `resend_synced_at`. So nobody who was ever subscribed or unsubscribed is
 * deleted, and no change still waiting to reach Resend is lost.
 */
export const PURGE_UNCONFIRMED_SQL = "DELETE FROM subscribers WHERE status = 'pending' AND confirmed_at IS NULL AND resend_sync = 'done' AND resend_synced_at IS NULL AND COALESCE(confirm_sent_at, updated_at) < ?";
