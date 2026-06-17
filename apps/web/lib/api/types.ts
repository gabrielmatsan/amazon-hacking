export type SolutionPillar =
  | "digital_agriculture"
  | "bioeconomy"
  | "logistics"
  | "education"
  | "health"
  | "verticalization"
  | "governance_financial_sustainability"
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

export type TeamSearchItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  solutionPillar: SolutionPillar;
};

export type TeamStatus = "active" | "review" | "rejected";

export type Team = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  teamMembers: TeamMember[] | null;
  solutionPillar: SolutionPillar;
  rejectionReason: string | null;
  videoUrl: string | null;
  secondaryVideoUrl: string | null;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  teamId: string | null;
  role: "user" | "mentor" | "admin" | "leader";
};

export type MyVoteResponse = {
  teamId: string;
  createdAt: string;
};

export type VoteResponse = {
  message: string;
};

export type VoteChannel = "whatsapp" | "sms" | "email";

export type VoteTokenResponse = {
  message: string;
  expiresAt: string;
  channel: VoteChannel;
};

export type ApiErrorBody = {
  error: string;
  message: string;
};
