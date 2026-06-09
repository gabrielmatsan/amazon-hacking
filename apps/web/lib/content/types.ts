export type Locale = "pt-br" | "en" | "es";

export type LocalizedText = Record<Locale, string>;

export type EditionYear = 2022 | 2023 | 2024 | 2025 | 2026;

export type PrizeCategory =
  | "champion"
  | "second_place"
  | "third_place"
  | "public_choice"
  | "community_choice"
  | "technical"
  | "innovation"
  | "fiuza_melo";

export type TeamMember = {
  name: string;
  course?: string;
};

export type Winner = {
  id: string;
  year: EditionYear;
  name: string;
  /** Project descriptions are kept in Portuguese (source content is pt-only). */
  description: string;
  logoUrl?: string;
  team: TeamMember[];
  prizes: PrizeCategory[];
  /** Course track, e.g. "Engenharia da Computação" (only for split editions). */
  course?: string;
  /** YouTube embed URL for the pitch video. */
  videoUrl?: string;
  github?: string;
};

export type Axis = {
  id: string;
  number: number;
  title: LocalizedText;
  description: LocalizedText;
};

export type Edition = {
  year: EditionYear;
  /** Amazon Hacking program edition number (1ª, 2ª, …). */
  number: number;
  /** Short label, e.g. "Vila Jutaí · Moju" — used for JSON-LD and headings. */
  theme: LocalizedText;
  /** Poetic theme name of the edition, e.g. "Saberes do Combú". */
  themeName: LocalizedText;
  location: string;
  startDate?: string;
  endDate?: string;
  /** Description of the territory / community. */
  summary: LocalizedText;
  /** "Desafios Encontrados" — the challenge each edition tackled. */
  challenges: LocalizedText;
  axes?: Axis[];
};

export type Partner = {
  id: string;
  name: string;
  logoUrl: string;
  href?: string;
  tier: "platinum" | "gold" | "silver" | "ticketing" | "supporter";
  skipFilter?: boolean;
  /** Extra classes for the logo image, e.g. to scale a logo that renders too large. */
  logoClassName?: string;
};

export type SocialLink = {
  platform: "instagram" | "youtube" | "linkedin" | "facebook" | "whatsapp";
  href: string;
  label: string;
};
