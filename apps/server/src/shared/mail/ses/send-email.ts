import type Mail from "nodemailer/lib/mailer";
import { env } from "../../infra/env/env";
import { transporter } from "./ses-setup";

export interface EmailData {
  to: string | string[];
  subject: string;
  template: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function normalizeEmailAddresses(addresses: string | string[]): string[] {
  return Array.isArray(addresses) ? addresses : [addresses];
}

export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  try {
    if (!transporter) {
      throw new Error("Transporter not initialized");
    }

    const to = normalizeEmailAddresses(emailData.to);
    const cc = emailData.cc ? normalizeEmailAddresses(emailData.cc) : undefined;
    const bcc = emailData.bcc ? normalizeEmailAddresses(emailData.bcc) : undefined;

    const mailOptions: Mail.Options = {
      from: env.DEFAULT_FROM_EMAIL,
      to,
      subject: emailData.subject,
      html: emailData.template,
      replyTo: emailData.replyTo,
      cc,
      bcc,
    };

    const rawEmail = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: rawEmail?.messageId,
    };
  } catch (error) {
    console.error(`[SEND_EMAIL] ${error instanceof Error ? error.message : "Unknown error"}`);
    throw error;
  }
}
