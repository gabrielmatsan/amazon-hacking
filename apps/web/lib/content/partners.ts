import type { Partner } from "./types";

const CDN = "https://store.amazon-hacking.com/images/logos-comp-amostra";

export const partners: Partner[] = [
  { id: "dti", name: "DTI", logoUrl: `${CDN}/patrocinadoras/DTI.png`, tier: "platinum" },
  { id: "accenture", name: "Accenture", logoUrl: `${CDN}/patrocinadoras/Accenture.png`, tier: "platinum" },
  { id: "amazon-people", name: "Amazon People", logoUrl: `${CDN}/patrocinadoras/AmazonPeople.png`, tier: "platinum" },

  { id: "fundo-vale", name: "Fundo Vale", logoUrl: `${CDN}/apoio/FundoVale.png`, tier: "gold" },
  { id: "vale", name: "Vale", logoUrl: `${CDN}/apoio/Vale.png`, tier: "gold" },
  { id: "certi", name: "CERTI", logoUrl: `${CDN}/apoio/Certi.png`, tier: "gold" },

  { id: "paratic", name: "Pará TIC", logoUrl: `${CDN}/madrinhas/Para%CC%81Tic.png`, tier: "silver" },
  { id: "idopter", name: "iDopter Labs", logoUrl: `${CDN}/madrinhas/IdopterLabs.png`, tier: "silver" },
  { id: "jambu", name: "Jambu", logoUrl: `${CDN}/madrinhas/Jambu.png`, tier: "silver" },
  { id: "easygestor", name: "Easy Gestor", logoUrl: `${CDN}/madrinhas/EasyGestor.png`, tier: "silver" },
  { id: "w3", name: "W3", logoUrl: `${CDN}/madrinhas/W3.png`, tier: "silver" },
  { id: "gsa", name: "GSA", logoUrl: `${CDN}/madrinhas/GSA.png`, tier: "silver" },
  { id: "techlead", name: "TechLead", logoUrl: `${CDN}/madrinhas/TechLead.png`, tier: "silver" },
];

export const partnersByTier = {
  platinum: partners.filter((p) => p.tier === "platinum"),
  gold: partners.filter((p) => p.tier === "gold"),
  silver: partners.filter((p) => p.tier === "silver"),
};
