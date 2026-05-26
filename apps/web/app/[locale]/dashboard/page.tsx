import { setRequestLocale } from "@/lib/i18n";
import { LeaderDashboard } from "@/components/dashboard/leader-dashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);

  return <LeaderDashboard locale={resolved} />;
}
