import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import * as nodemailer from "nodemailer";
import { env } from "../../infra/env/env";
import { configureSES, getSESClient } from "./ses-config";

export let transporter: nodemailer.Transporter | null = null;

export function initializeSES(): void {
  configureSES({
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    fromEmail: env.DEFAULT_FROM_EMAIL,
  });

  const sesClient = getSESClient();

  transporter = nodemailer.createTransport({
    SES: {
      sesClient,
      SendEmailCommand,
    },
  });
}
