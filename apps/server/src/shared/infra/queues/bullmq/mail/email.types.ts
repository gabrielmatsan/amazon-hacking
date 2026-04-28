export type EmailJobPayload =
  | {
      type: "welcome";
      to: string;
      data: { userName: string };
    }
  | {
      type: "password-reset";
      to: string;
      data: { userName: string; resetUrl: string };
    }
  | {
      type: "verification-code";
      to: string;
      data: { code: string };
    };

export type EmailJobName = EmailJobPayload["type"];
