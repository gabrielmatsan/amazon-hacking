const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

export function normalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const [localPart, domain] = lower.split("@");
  if (!localPart || !domain) return lower;

  let normalized = localPart.split("+")[0]!;

  if (GMAIL_DOMAINS.has(domain)) {
    normalized = normalized.replaceAll(".", "");
  }

  return `${normalized}@${domain}`;
}
