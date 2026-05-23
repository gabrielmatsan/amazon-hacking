// Root passthrough layout. The real <html>/<body> live in app/[locale]/layout.tsx
// so the document language can be set per locale and statically generated.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
