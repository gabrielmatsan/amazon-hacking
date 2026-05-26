import { setRequestLocale } from "@/lib/i18n";
import { AdminReviewList } from "@/components/dashboard/admin-review-list";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminReviewList />;
}
