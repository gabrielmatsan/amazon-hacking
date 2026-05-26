import { setRequestLocale } from "@/lib/i18n";
import { AdminVotesDashboard } from "@/components/dashboard/admin-votes-dashboard";

export default async function AdminVotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminVotesDashboard />;
}
