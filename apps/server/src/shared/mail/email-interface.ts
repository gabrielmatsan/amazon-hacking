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


export interface EmailClient<T> {
  sendEmail(data: EmailData): Promise<EmailResult>;
}