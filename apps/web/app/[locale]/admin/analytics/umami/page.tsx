import { setRequestLocale } from "@/lib/i18n";
import { AdminUmami } from "@/components/dashboard/admin-umami";

export default async function AdminUmamiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminUmami />;
}
