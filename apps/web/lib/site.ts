// `||` (not `??`): an unset secret in CI becomes an empty string, which must
// still fall back to the production URL (otherwise `new URL("")` throws).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://amazonhacking.com.br";
