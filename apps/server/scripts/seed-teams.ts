import { inArray } from "drizzle-orm";

import { db, shutdownPools } from "../src/shared/infra/databases/postgres";
import { teamsSchema } from "../src/teams/domain/teams.schema";
import type { TeamMember } from "../src/teams/domain/teams.type";

type SeedTeam = {
  name: string;
  description: string;
  logoUrl: string;
  teamMembers: TeamMember[];
};

const teams: SeedTeam[] = [
  {
    name: "Equipe Aurora",
    description: "Plataforma para organizar desafios e medir entregas em hackathons.",
    logoUrl: "https://placehold.co/256x256/0f766e/ffffff.png?text=Aurora",
    teamMembers: [
      { name: "Ana Costa", role: "Product" },
      { name: "Bruno Lima", role: "Backend" },
      { name: "Carla Mendes", role: "Design" },
    ],
  },
  {
    name: "Equipe Atlas",
    description: "Ferramenta de mapas operacionais para equipes em campo.",
    logoUrl: "https://placehold.co/256x256/1d4ed8/ffffff.png?text=Atlas",
    teamMembers: [
      { name: "Diego Rocha", role: "Frontend" },
      { name: "Elisa Martins", role: "Data" },
      { name: "Felipe Souza", role: "Mobile" },
    ],
  },
  {
    name: "Equipe Prisma",
    description: "Dashboard de inteligencia para acompanhamento de metricas em tempo real.",
    logoUrl: "https://placehold.co/256x256/be123c/ffffff.png?text=Prisma",
    teamMembers: [
      { name: "Gabriela Alves", role: "Fullstack" },
      { name: "Henrique Dias", role: "DevOps" },
      { name: "Isabela Nunes", role: "UX Research" },
    ],
  },
  {
    name: "Equipe Vector",
    description: "Sistema de recomendacao para conectar usuarios a solucoes do evento.",
    logoUrl: "https://placehold.co/256x256/7c3aed/ffffff.png?text=Vector",
    teamMembers: [
      { name: "Joao Ribeiro", role: "AI" },
      { name: "Laura Pinto", role: "Frontend" },
      { name: "Mateus Freitas", role: "Backend" },
    ],
  },
  {
    name: "Equipe Nimbus",
    description: "Automacao de comunicacao entre participantes, mentores e organizacao.",
    logoUrl: "https://placehold.co/256x256/0369a1/ffffff.png?text=Nimbus",
    teamMembers: [
      { name: "Nina Barros", role: "Product" },
      { name: "Otavio Cardoso", role: "Backend" },
      { name: "Paula Teixeira", role: "QA" },
    ],
  },
  {
    name: "Equipe Pulse",
    description: "Aplicacao para coletar feedbacks rapidos e priorizar melhorias.",
    logoUrl: "https://placehold.co/256x256/ea580c/ffffff.png?text=Pulse",
    teamMembers: [
      { name: "Rafael Gomes", role: "Frontend" },
      { name: "Sofia Ramos", role: "Design" },
      { name: "Tiago Carvalho", role: "Fullstack" },
    ],
  },
];

async function main() {
  const names = teams.map((team) => team.name);
  const existingTeams = await db
    .select({ name: teamsSchema.name })
    .from(teamsSchema)
    .where(inArray(teamsSchema.name, names));

  const existingNames = new Set(existingTeams.map((team) => team.name));
  const teamsToInsert = teams.filter((team) => !existingNames.has(team.name));

  if (teamsToInsert.length === 0) {
    console.log("Seed teams: no teams inserted. All sample teams already exist.");
    return;
  }

  const insertedTeams = await db
    .insert(teamsSchema)
    .values(teamsToInsert)
    .returning({
      id: teamsSchema.id,
      name: teamsSchema.name,
    });

  console.log(`Seed teams: inserted ${insertedTeams.length} team(s).`);
  for (const team of insertedTeams) {
    console.log(`- ${team.name} (${team.id})`);
  }
}

main()
  .catch((error) => {
    console.error("Seed teams failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdownPools();
  });
