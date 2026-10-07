import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

export default async function UserProfilePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  redirect('/profile/me');
}
