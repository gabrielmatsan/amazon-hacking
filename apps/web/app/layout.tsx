import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

// Provides metadataBase for routes outside [locale] (root not-found and the
// root opengraph-image) so social/OG image URLs resolve to absolute. The
// localized layout overrides the rest of the metadata per locale.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

// Root passthrough layout. The real <html>/<body> live in app/[locale]/layout.tsx
// so the document language can be set per locale and statically generated.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
