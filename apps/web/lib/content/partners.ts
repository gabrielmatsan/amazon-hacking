import type { Partner } from "./types";

export const partners: Partner[] = [
  { id: "vale", name: "Vale", logoUrl: "/partners/logo-vale.png", tier: "platinum" },

  { id: "certi", name: "Fundação CERTI", logoUrl: "/partners/logo-certi.png", tier: "gold" },
  { id: "accenture", name: "Accenture", logoUrl: "/partners/logo-accenture.svg", tier: "gold" },
  { id: "tcs", name: "TCS", logoUrl: "/partners/logo-tcs.svg", tier: "gold" },

  { id: "paratic", name: "Pará TIC", logoUrl: "/partners/logo-paratic.png", tier: "silver" },
  { id: "voxdata", name: "Voxx Data", logoUrl: "/partners/logo-voxdata.png", tier: "silver" },
  { id: "idopter", name: "iDopter Labs", logoUrl: "/partners/logo-idopter.svg", tier: "silver" },
  { id: "gsa", name: "Google for Startups", logoUrl: "/partners/logo-gsa.png", tier: "silver" },
  { id: "edutech", name: "EduTech", logoUrl: "/partners/logo-edutech.svg", tier: "silver" },
  { id: "jambu", name: "Jambu", logoUrl: "/partners/logo-jambu.png", tier: "silver" },
  { id: "easygestor", name: "Easy Gestor", logoUrl: "/partners/logo-easygestor.svg", tier: "silver" },
  { id: "w3", name: "W3", logoUrl: "/partners/logo-w3.svg", tier: "silver" },
  { id: "sol", name: "SOL", logoUrl: "/partners/logo-sol.png", tier: "silver" },
];

export const partnersByTier = {
  platinum: partners.filter((p) => p.tier === "platinum"),
  gold: partners.filter((p) => p.tier === "gold"),
  silver: partners.filter((p) => p.tier === "silver"),
};
