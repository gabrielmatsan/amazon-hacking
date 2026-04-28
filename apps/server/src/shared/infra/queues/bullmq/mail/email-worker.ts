import { sendEmail } from "@/shared/mail/ses/send-email";
import { emailQueue } from "./email-queue";
import type { EmailJobPayload } from "./email.types";

function buildEmailHtml(payload: EmailJobPayload): { subject: string; html: string } {
  switch (payload.type) {
    case "verification-code":
      return {
        subject: "Verify your email",
        html: `<h1>Your verification code</h1><p>Code: <strong>${payload.data.code}</strong></p>`,
      };
    case "password-reset":
      return {
        subject: "Reset your password",
        html: `<h1>Hi ${payload.data.userName}</h1><p><a href="${payload.data.resetUrl}">Click here to reset your password</a></p>`,
      };
    case "welcome":
      return {
        subject: "Welcome!",
        html: `<h1>Welcome, ${payload.data.userName}!</h1><p>Thanks for signing up.</p>`,
      };
  }
}

export function startEmailWorker(): void {
  emailQueue.startWorker(async (payload: EmailJobPayload) => {
    const { subject, html } = buildEmailHtml(payload);
    await sendEmail({ to: payload.to, subject, template: html });
  });
}

export async function stopEmailWorker(): Promise<void> {
  await emailQueue.stopWorker();
}
