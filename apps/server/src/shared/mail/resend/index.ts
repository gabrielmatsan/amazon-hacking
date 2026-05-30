import { logger } from "@/shared/infra/observability";
import { Resend } from "resend";
import { env } from "../../infra/env/env";
import type { EmailClient, EmailData, EmailResult } from "../email-interface";

export class ResendEmailClient implements EmailClient<Resend> {
  private readonly client: Resend;
  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendEmail(data: EmailData): Promise<EmailResult> {
    try {
      const { error, data: result } = await this.client.emails.send({
        from: "Amazon Hacking <no-reply@laboratorio-de-pesquisa-de-engenharia-de-software.com>",
        to: data.to,
        subject: data.subject,
        html: data.template,
        ...(data.replyTo && { replyTo: data.replyTo }),
        ...(data.cc && { cc: data.cc }),
        ...(data.bcc && { bcc: data.bcc }),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: result?.id };
    } catch (error: any) {
      logger.error({ error: JSON.stringify(error) }, "Error sending email");
      return { success: false, error: error.message };
    }
  }
}

export const resendEmailClient = new ResendEmailClient(env.RESEND_API_KEY);
