import type { Winner } from "./types";

const CDN = "https://pub-fa05dfe540d6495ab86c69ad7eea34db.r2.dev";
const ENG = "Engenharia da Computação";
const SCI = "Ciência da Computação";

const names = (...list: string[]) => list.map((name) => ({ name }));

export const winners: Winner[] = [
  // ---------------------------------------------------------------- 2025
  {
    id: "oketa-2025",
    year: 2025,
    name: "Oketá",
    description: "O Oketá é uma iniciativa da Arandu Technology que propõe uma solução de bioconstrução sustentável a partir da transformação de resíduos agroindustriais da Amazônia — como o caroço de açaí triturado e a fibra natural de aninga — em tijolos sustentáveis , produzidos sem queima e com baixa adição de cimento.\nO objetivo do projeto é reduzir os impactos ambientais causados pelo descarte inadequado de resíduos orgânicos, promovendo uma alternativa viável, acessível e de baixo carbono para construções sustentáveis. O processo valoriza o saber tradicional, é feito de forma manual por comunidades locais e elimina práticas poluentes como a queima tradicional de tijolos.\nAlém de oferecer um material resistente e ecológico, o Oketá busca fortalecer a bioeconomia amazônica, gerar renda local e inspirar novas formas de construir com respeito à floresta e às pessoas que nela vivem.",
    logoUrl: "/projects/oketa.jpeg",
    team: names(
      "Amanda Klautau",
      "Bruna Melido",
      "Gabriel Melo",
      "Gabriel Normando",
      "Isadora Lacerda",
      "Lucas Augusto",
      "Tiago Miranda",
      "Yohan Marçal",
    ),
    prizes: ["champion"],
    videoUrl: "https://www.youtube.com/embed/5NOsJdAp3dI",
  },

  {
    id: "tasab-2025",
    year: 2025,
    name: "Tasabido",
    description: "A TaSabido é uma plataforma digital criada para melhorar a comunicação entre pais, responsáveis e profissionais que acompanham pessoas neurodivergentes. A solução centraliza relatórios mensais, atividades personalizadas e feedbacks, permitindo um acompanhamento mais claro, contínuo e eficaz do desenvolvimento dos usuários. A plataforma promove inclusão, apoio mútuo e intervenções mais alinhadas às necessidades de cada pessoa.",
    team: names(),
    logoUrl: "/projects/tasabido.jpeg",
    prizes: ["second_place"],
    videoUrl: "https://www.youtube.com/embed/cyEPaZoazsU",
  },

  {
    id: "tep-2025",
    year: 2025,
    name: "Tep",
    description: "A TEP – Tokenização Empresarial Paraense é uma startup que apoia pequenos negócios da Amazônia, transformando produtos regionais em ativos digitais por meio de tecnologias como blockchain e contratos inteligentes. Com isso, facilita o acesso a investimentos, amplia as vendas e impulsiona o desenvolvimento econômico com valorização cultural.",
    logoUrl: "/projects/tep.jpeg",
    videoUrl: "https://www.youtube.com/embed/nzwFM8lZedQ",
    team: names(),
    prizes: ["third_place"],
  },

  // ---------------------------------------------------------------- 2024
  {
    id: "yma-2024",
    year: 2024,
    name: "Ymã",
    description:
      "Biodigestor que converte resíduos orgânicos em biogás e biofertilizante. Capacidade de 15L de biogás e 25L de digestão, ideal para cozinhar, refrigerar e fertilizar, impulsionando a autossuficiência energética e a sustentabilidade comunitária.",
    logoUrl: `${CDN}/projetos2024/yma.png`,
    team: names(
      "Caroline Silva",
      "Maria Gama",
      "Ana Nunes",
      "Gabriel Silva",
      "Luiz Santos",
      "Lucas Oliveira",
      "Matheus Mendonça",
      "Ana Costa",
    ),
    prizes: ["champion"],
    videoUrl: "https://www.youtube.com/embed/3O7ctdQylSg",
  },
  {
    id: "ludus-2024",
    year: 2024,
    name: "Ludus",
    description:
      "Sistema de gestão virtual baseado na frequência e matrícula de alunos, voltado à rede pública.",
    logoUrl: `${CDN}/projetos2024/ludus.jpeg`,
    team: names(
      "Athos Araújo",
      "Renan Moreira",
      "Leonardo Bernardes",
      "Matheus Leao",
      "Mila Borges",
      "Marco Machado",
    ),
    prizes: ["second_place"],
    videoUrl: "https://www.youtube.com/embed/xDlflBQYl9A",
  },
  {
    id: "yubi-2024",
    year: 2024,
    name: "Yubi",
    description:
      "Hub de jogos educativos para escolas em comunidades menos favorecidas. Para crianças de 4 a 12 anos, com aprendizagem acessível e divertida — funciona 100% offline.",
    logoUrl: `${CDN}/projetos2024/yubi.jpg`,
    team: names(
      "Vitor Longhi",
      "Leticia Keuffer",
      "Lucas Maia",
      "Karina Guimarães",
      "Felipe Machado",
      "Vitor Pombo",
      "João David",
    ),
    prizes: ["third_place"],
    videoUrl: "https://www.youtube.com/embed/vcwtc52_R0s",
  },

  // ------------------------------------------------- 2023 · Engenharia
  {
    id: "tupa-2023",
    year: 2023,
    name: "Tupã",
    course: ENG,
    description:
      "A Hélix apresenta o Tupã, um sistema composto por dois módulos independentes — limpeza de raízes e purificação de água — capaz de aumentar a produção e a qualidade da água de uma lavoura.",
    logoUrl: "/projects/Helix.png",
    team: names("Ivanovich Santos", "Lucas Amorim", "Mateus Couto", "Rômulo Conceição"),
    prizes: ["champion"],
    videoUrl: "https://www.youtube-nocookie.com/embed/dkNim396gew",
  },
  {
    id: "tucuextract-2023",
    year: 2023,
    name: "TucuExtract",
    course: ENG,
    description:
      "Máquina de extração do tucumã da Neo Plus, projetada para obter óleo de tucumã de alta qualidade combinando tecnologia avançada e eficiência no processamento dessa fruta amazônica.",
    logoUrl: "/projects/Tucuma.png",
    team: names(
      "Ernesto Costa",
      "Diego Sato",
      "Marco Antonio",
      "Caio Machado",
      "Gabriel Tsuchiya",
      "Geovany Vieira",
      "Murilo Guimarães",
    ),
    prizes: ["second_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/u9OdNekTEJY",
  },
  {
    id: "inventory-2023",
    year: 2023,
    name: "Inventory",
    course: ENG,
    description:
      "Sistema inteligente para controle de estoque de ONGs e pequenas empresas, focado em modernizar processos tradicionais e fomentar economias locais e o terceiro setor.",
    logoUrl: "/projects/Inventory.png",
    team: names("João Kikuchi", "Lucas Leal", "Pedro Luz"),
    prizes: ["third_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/6-2nxIQUSSI",
  },

  // -------------------------------------------------- 2023 · Ciência
  {
    id: "parajas-2023",
    year: 2023,
    name: "Parajás",
    course: SCI,
    description:
      "A Parajás apresenta a Ceuci, máquina que automatiza o corte do pseudocaule da bananeira para otimizar a produção de papel de folha de bananeira em Cotijuba, com mais eficiência e segurança.",
    logoUrl: "/projects/Parajas.png",
    team: names(
      "Ryan Oliveira",
      "Letícia Malato",
      "Letícia Lima",
      "Vinícius Casanova",
      "Miguel Angelim",
    ),
    prizes: ["champion"],
    videoUrl: "https://www.youtube-nocookie.com/embed/mnj4CZ-BISM",
  },
  {
    id: "cotico-2023",
    year: 2023,
    name: "Cótico",
    course: SCI,
    description:
      "Aplicativo que incentiva a reciclagem e recompensa os usuários com pets (badges) a cada vez que reciclam pelo app.",
    logoUrl: "/projects/Cotico.png",
    team: names("Caio Soares", "Vinicius Rayol", "Luiz Pina", "Pedro Raiol", "Lucas Borges"),
    prizes: ["second_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/kvDKIRHMshM",
  },
  {
    id: "curumim-2023",
    year: 2023,
    name: "Curumim",
    course: SCI,
    description:
      "Software acessível para catalogação, empréstimo e devolução de livros, usando o sistema open source Biblivre integrado a tecnologia RFID.",
    logoUrl: "/projects/Arandu.png",
    team: names("Bruna Melido", "Isadora Lacerda", "Ícaro Macedo"),
    prizes: ["third_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/djD7vOYDc9w",
  },

  // ------------------------------------------------- 2022 · Engenharia
  {
    id: "zenith-inova-2022",
    year: 2022,
    name: "Zenith Inova",
    course: ENG,
    description:
      "Módulo Falken: leitor de frequência e antena unidirecional que mede a potência de sinais 2G/3G/4G a partir de aeronaves remotamente pilotadas (RPAS).",
    logoUrl: "/projects/ZenithLogoBranca.svg",
    team: names(
      "Gabriel Oliveira",
      "Matheus Dourado",
      "Marco Pierozan",
      "Renan Canuto",
      "Rian Silva",
    ),
    prizes: ["champion"],
    videoUrl: "https://www.youtube-nocookie.com/embed/bJhPNFamNwk",
  },
  {
    id: "cvgreen-2022",
    year: 2022,
    name: "CVGreen",
    course: ENG,
    description:
      "Aplicativo mobile de reconhecimento de troncos de árvores através de inteligência artificial.",
    logoUrl: "/projects/amazon-hacking.svg",
    team: names("João Brito", "Alexander Cardoso", "Leonardo Arero", "Nailton Sampaio"),
    prizes: ["second_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/XWMRPfiLbHM",
  },
  {
    id: "helix-2022",
    year: 2022,
    name: "Hélix",
    course: ENG,
    description:
      "S.M.H.B.C — Sistema de Monitoramento Hídrico de Baixo Custo: solução modular para coletar dados de qualidade da água em larga escala, com sensores intercambiáveis e aderente à RNQA.",
    logoUrl: "/projects/Helix.png",
    team: names("Lucas Amorim", "Rômulo Córdova", "Fernando Otavio", "Antonio Bernardo"),
    prizes: ["third_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/PuRcj4yvfso",
  },

  // -------------------------------------------------- 2022 · Ciência
  {
    id: "biotank-2022",
    year: 2022,
    name: "BioTank",
    course: SCI,
    description:
      "Projeto que fornece uma fonte de gás de cozinha limpa e sustentável para os habitantes da Ilha das Onças.",
    logoUrl: "/projects/amazon-hacking.svg",
    team: names(
      "Thiago Silva",
      "Arthur Oliveira",
      "Amora Paixão",
      "Igor Matsumoto",
      "Muriel Silva",
    ),
    prizes: ["champion"],
  },
  {
    id: "sicfaa-2022",
    year: 2022,
    name: "SICFAA",
    course: SCI,
    description:
      "Sistema Inteligente de Captação, Filtragem e Armazenamento de Água para irrigação — primeira instância de um projeto de tratamento de água.",
    logoUrl: "/projects/amazon-hacking.svg",
    team: names("Felipe Ramos", "Letícia Macedo", "Pedro Melo", "Vitor Pombo", "Vitor Ramôa"),
    prizes: ["second_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/Rz6ecyAGyRw",
  },
  {
    id: "autodrops-2022",
    year: 2022,
    name: "AutoDrops",
    course: SCI,
    description:
      "Sistema de irrigação automatizado para quem não tem tempo de cuidar das plantas ou vive da produção.",
    logoUrl: "/projects/amazon-hacking.svg",
    team: names("Fabio Neves", "João Cardoso", "Marco Aurélio", "Newton Miranda", "João Beltrão"),
    prizes: ["third_place"],
    videoUrl: "https://www.youtube-nocookie.com/embed/Q-fDlpqaWDA",
  },
];

export function winnersByYear(year: number): Winner[] {
  return winners.filter((winner) => winner.year === year);
}

export function winnerYears(): number[] {
  return [...new Set(winners.map((winner) => winner.year))].sort((a, b) => b - a);
}
