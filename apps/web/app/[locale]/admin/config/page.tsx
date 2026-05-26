import { setRequestLocale } from "@/lib/i18n";
import { AdminConfig } from "@/components/dashboard/admin-config";

export default async function AdminConfigPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminConfig />;
}
