export const CONTACT_RECIPIENT = 'dnplus@mail.grokbot.com';
export const CONTACT_SENDER = 'ginseng@dnplus.dev';

type Inquiry = { id: string; name: string; email: string; company: string; topic: string; message: string };

export async function notifyContact(sender: SendEmail, inquiry: Inquiry) {
  const text = [
    '人蔘 Try Catch 收到新的合作詢問',
    `編號：${inquiry.id}`,
    `姓名：${inquiry.name}`,
    `Email：${inquiry.email}`,
    `公司／品牌：${inquiry.company || '未填寫'}`,
    `合作類型：${inquiry.topic}`,
    '',
    '訪客填寫的需求：',
    inquiry.message,
  ].join('\n');
  const html = `<pre style="white-space:pre-wrap">${text.replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character] ?? character))}</pre>`;
  return sender.send({
    from: { email: CONTACT_SENDER, name: '人蔘 Try Catch' },
    to: CONTACT_RECIPIENT,
    replyTo: inquiry.email,
    subject: '人蔘 Try Catch｜新的合作詢問',
    text,
    html,
  });
}
