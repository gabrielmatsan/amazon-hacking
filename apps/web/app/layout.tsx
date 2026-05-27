import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE_URL } from "@/lib/site";
import { UmamiScript } from "@/components/site/umami-script";
import { cn } from "@/lib/utils";
import "./globals.css";

const gilroy = localFont({
  src: [
    { path: "./fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Gilroy-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Gilroy-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn(gilroy.variable)} suppressHydrationWarning>
      <head>
        <UmamiScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
