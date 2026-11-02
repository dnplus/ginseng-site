import type { Locale } from './i18n.ts';

/**
 * Subscribers live in D1; Resend holds a mirror as contacts, one segment per language, so broadcasts can go out on
 * Resend's marketing plan (billed by contacts). Every status change marks the row `resend_sync = 'pending'` and then
 * tries to push it; anything that fails stays pending and the studio's sync button retries it.
 */
export type ResendEnv = {RESEND_API_KEY?: string; RESEND_SEGMENT_ZH_TW?: string; RESEND_SEGMENT_EN?: string; RESEND_WEBHOOK_SECRET?: string};

export function segmentFor(env: ResendEnv, locale: string): string | null {
  return (locale === 'en' ? env.RESEND_SEGMENT_EN : env.RESEND_SEGMENT_ZH_TW) || null;
}
export const resendReady = (env: ResendEnv) => Boolean(env.RESEND_API_KEY && env.RESEND_SEGMENT_ZH_TW && env.RESEND_SEGMENT_EN);

type Result = {error: {message: string; name?: string; statusCode?: number | null} | null};
/** The slice of the Resend SDK this module uses; tests pass a fake. */
export type ContactsClient = {
  contacts: {
    create(options: {email: string; unsubscribed?: boolean; segments?: {id: string}[]}): Promise<Result>;
    update(options: {email: string; unsubscribed?: boolean}): Promise<Result>;
    segments: {add(options: {email: string; segmentId: string}): Promise<Result>; remove(options: {email: string; segmentId: string}): Promise<Result>};
  };
};

export type SubscriberRow = {email: string; status: string; locale: Locale | string};

const notFound = (result: Result) => result.error?.statusCode === 404 || result.error?.name === 'not_found';
// Already in the segment: Resend returns 422 now; older responses used 409.
const alreadyInSegment = (result: Result) => result.error?.statusCode === 409 || result.error?.statusCode === 422;

/**
 * Push one subscriber's state. Active: the contact exists, is subscribed, is in its language segment and not in the other
 * language's (someone who resubscribes in the other language must not get both editions). Anything else
 * (pending, unsubscribed): if Resend has the contact, it is unsubscribed; a pending address never reaches Resend.
 */
export async function pushSubscriber(client: ContactsClient, env: ResendEnv, row: SubscriberRow): Promise<void> {
  if (row.status !== 'active') {
    const result = await client.contacts.update({email: row.email, unsubscribed: true});
    if (result.error && !notFound(result)) throw new Error(`Resend update failed: ${result.error.message}`);
    return;
  }
  const segmentId = segmentFor(env, row.locale), otherId = segmentFor(env, row.locale === 'en' ? 'zh-TW' : 'en');
  if (!segmentId) throw new Error(`No Resend segment configured for ${row.locale}`);
  const created = await client.contacts.create({email: row.email, unsubscribed: false, segments: [{id: segmentId}]});
  if (created.error) {
    // Already a contact (re-subscribed, or synced before): make sure it is subscribed and in the segment.
    const updated = await client.contacts.update({email: row.email, unsubscribed: false});
    if (updated.error) throw new Error(`Resend update failed: ${updated.error.message}`);
    const added = await client.contacts.segments.add({email: row.email, segmentId});
    if (added.error && !alreadyInSegment(added)) throw new Error(`Resend segment add failed: ${added.error.message}`);
  }
  if (otherId && otherId !== segmentId) {
    const removed = await client.contacts.segments.remove({email: row.email, segmentId: otherId});
    if (removed.error && !notFound(removed)) throw new Error(`Resend segment remove failed: ${removed.error.message}`);
  }
}
