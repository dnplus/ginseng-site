/** Shared by the unsubscribe form and the one-click endpoint; also drops any pending confirmation and queues a Resend push. */
export const UNSUBSCRIBE_SQL = "UPDATE subscribers SET status = 'unsubscribed', confirm_token = NULL, resend_sync = 'pending', updated_at = ? WHERE unsubscribe_token = ? RETURNING email";
