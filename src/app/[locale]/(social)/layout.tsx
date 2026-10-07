import { setRequestLocale } from 'next-intl/server';
import { SocialLayout } from '@/components/layout/SocialLayout';

export default async function Layout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  return <SocialLayout>{props.children}</SocialLayout>;
}
