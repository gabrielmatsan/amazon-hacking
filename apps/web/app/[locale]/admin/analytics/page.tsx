import { setRequestLocale } from "@/lib/i18n";
import { AdminVisitors } from "@/components/dashboard/admin-visitors";

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminVisitors />;
}
