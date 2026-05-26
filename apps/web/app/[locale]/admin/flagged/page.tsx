import { setRequestLocale } from "@/lib/i18n";
import { AdminFlaggedVotes } from "@/components/dashboard/admin-flagged-votes";

export default async function AdminFlaggedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminFlaggedVotes />;
}
