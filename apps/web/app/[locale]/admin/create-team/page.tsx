import { setRequestLocale } from "@/lib/i18n";
import { AdminCreateTeam } from "@/components/dashboard/admin-create-team";

export default async function AdminCreateTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminCreateTeam />;
}
