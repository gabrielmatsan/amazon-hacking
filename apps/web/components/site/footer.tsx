import Image from "next/image";
import Link from "next/link";
import { localizeHref } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";

const socials = [
  { href: "https://www.instagram.com/amazon.hacking/", label: "Instagram" },
  { href: "https://www.youtube.com/@CESUPAonline", label: "YouTube" },
  { href: "https://www.linkedin.com/school/cesupa/", label: "LinkedIn" },
  { href: "mailto:amazon.hacking@cesupa.br", label: "E-mail" },
];

export function Footer() {
  const year = new Date().getFullYear();

  const anchors = [
    { href: "#sobre", label: m.nav_about() },
    { href: "#edicoes", label: m.nav_editions() },
    { href: "#vencedores", label: m.nav_winners() },
    { href: "#premios", label: m.nav_prizes() },
    { href: "#parceiros", label: m.nav_partners() },
  ];

  return (
    <footer className="relative isolate overflow-hidden bg-neutrals-700 text-white">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-symbol bg-contain bg-repeat opacity-[0.07]"
      />
      <div className="mx-auto max-w-screen-2xl px-8 py-16 lg:px-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Image
              src="/illustrations/logo-amazon-hacking-white.svg"
              alt="Amazon Hacking"
              width={200}
              height={75}
              className="h-14 w-auto"
            />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
              {m.footer_tagline()}
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/70 transition hover:border-white/50 hover:text-white"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.16em] text-white/40 uppercase">
              Menu
            </p>
            <ul className="space-y-2.5 text-sm">
              {anchors.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-white/70 transition hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href={localizeHref("/solucoes")}
                  className="text-white/70 transition hover:text-white"
                >
                  {m.nav_solutions()}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-bold tracking-[0.16em] text-white/40 uppercase">
              CESUPA
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.cesupa.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  cesupa.br
                </a>
              </li>
              <li>
                <a
                  href="mailto:amazon.hacking@cesupa.br"
                  className="text-white/70 transition hover:text-white"
                >
                  amazon.hacking@cesupa.br
                </a>
              </li>
              <li>
                <Link
                  href={localizeHref("/privacy-policy")}
                  className="text-white/70 transition hover:text-white"
                >
                  {m.footer_privacy()}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{m.footer_rights({ year })}</p>
          <p className="flex items-center gap-1.5">
            {m.footer_developed_by()}
            <a
              href="https://tucupy.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white/70 transition hover:text-white"
            >
              Tucupy Tecnologia
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
