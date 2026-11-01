/** Shared by the unsubscribe form and the one-click endpoint; also drops any pending confirmation. */
export const UNSUBSCRIBE_SQL = "UPDATE subscribers SET status = 'unsubscribed', confirm_token = NULL, updated_at = ? WHERE unsubscribe_token = ?";
