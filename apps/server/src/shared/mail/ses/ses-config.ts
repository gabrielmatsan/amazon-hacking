import { SESv2Client } from "@aws-sdk/client-sesv2";
import { env } from "../../infra/env/env";

export interface SESConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  fromEmail: string;
}

let sesClient: SESv2Client | null = null;
let defaultFromEmail: string = env.DEFAULT_FROM_EMAIL;

export function configureSES(config: SESConfig): void {
  sesClient = new SESv2Client({
    region: config.region,
    credentials: config.accessKeyId && config.secretAccessKey ? {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    } : undefined,
  });

  defaultFromEmail = config.fromEmail;
}

export function getSESClient(): SESv2Client {
  if (!sesClient) {
    throw new Error("SES client not configured. Call configureSES() first.");
  }
  return sesClient;
}

export function getDefaultFromEmail(): string {
  if (!defaultFromEmail) {
    throw new Error("Default from email not configured. Call configureSES() first.");
  }
  return defaultFromEmail;
}
