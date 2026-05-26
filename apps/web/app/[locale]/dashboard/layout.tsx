import { setRequestLocale } from "@/lib/i18n";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);

  return <DashboardShell locale={resolved}>{children}</DashboardShell>;
}
