import { setRequestLocale } from "@/lib/i18n";
import { AdminShell } from "@/components/dashboard/admin-shell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);

  return <AdminShell locale={resolved}>{children}</AdminShell>;
}
