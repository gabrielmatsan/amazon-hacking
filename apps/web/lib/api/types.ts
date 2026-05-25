export type SolutionPillar =
  | "digital_agriculture"
  | "bioeconomy"
  | "logistics"
  | "education"
  | "health"
  | "default";

export type TeamMember = {
  name: string;
  role: string;
  email?: string;
  imageUrl?: string;
  links?: {
    website?: string;
    linkedin?: string;
    github?: string;
  };
};

export type TeamListItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type TeamListGroup = {
  solutionPillar: SolutionPillar;
  teams: TeamListItem[];
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  teamMembers: TeamMember[] | null;
  solutionPillar: SolutionPillar;
  videoUrl: string | null;
  secondaryVideoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "mentor" | "admin";
};

export type MyVoteResponse = {
  teamId: string;
  createdAt: string;
};

export type VoteResponse = {
  message: string;
};

export type VoteChannel = "whatsapp" | "email";

export type VoteTokenResponse = {
  message: string;
  expiresAt: string;
  channel: VoteChannel;
};

export type ApiErrorBody = {
  error: string;
  message: string;
};
