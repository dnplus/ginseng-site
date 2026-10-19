import { env } from 'cloudflare:workers';
import { notifyContact } from '@/lib/contact-notification';
import { body, database, failure, FormError, json, rateLimit } from '@/lib/server';
import { cleanEmail, cleanText, CONSENT_VERSION, TOPICS } from '@/lib/validation';
export async function POST(request: Request) {
  try {
    const data = await body(request);
    if (data.website) return json({ok: true});
    const email = cleanEmail(data.email), name = cleanText(data.name, 1, 80), company = cleanText(data.company ?? '', 0, 120), message = cleanText(data.message, 10, 3000);
    if (!email || !name || company === null || !message || !TOPICS.includes(String(data.topic))) throw new FormError('請完整填寫姓名、Email、合作類型，以及至少 10 字的需求。');
    if (data.consent !== true) throw new FormError('請先同意聯繫與資料使用說明。');
    await rateLimit(request, 'contact');
    const id = crypto.randomUUID();
    const db = database();
    await db.prepare('INSERT INTO inquiries (id, name, email, company, topic, message, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, name, email, company, String(data.topic), message, CONSENT_VERSION, new Date().toISOString()).run();
    let notificationStatus = 'accepted';
    try {
      await notifyContact(env.CONTACT_EMAIL, {id, name, email, company, topic: String(data.topic), message});
    } catch {
      notificationStatus = 'failed';
      console.error('Contact notification failed', id);
    }
    await db.prepare('UPDATE inquiries SET notification_status = ? WHERE id = ?').bind(notificationStatus, id).run();
    return json({ok: true});
  } catch (error) { return failure(error); }
}
