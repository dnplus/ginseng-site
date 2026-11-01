import { notFound } from 'next/navigation';
import { issuePath, NewsletterIssue } from '../../../components/newsletter';
import { dictionary } from '@/lib/i18n';
import { pageMetadata } from '@/lib/metadata';
import { issues } from '@/lib/posts';

type Props = {params: Promise<{slug: string}>};
export async function generateMetadata({params}: Props) {
  const issue = issues.find('en', (await params).slug);
  if (!issue) return {};
  const t = dictionary('en').newsletter;
  return pageMetadata('en', issuePath(issue), {title: `${issue.title} · ${t.title}`, description: issue.summary || undefined, ogType: 'article', available: issues.translations(issue).map(each => each.locale)});
}
export default async function Page({params}: Props) {
  const issue = issues.find('en', (await params).slug);
  if (!issue) notFound();
  return <NewsletterIssue issue={issue}/>;
}
