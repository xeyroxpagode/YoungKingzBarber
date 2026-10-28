export const BUSINESS_PROVISIONING_KEY = "young-kingz-pilot";
export const BUSINESS_DISPLAY_NAME = "Young Kingz";
export const BUSINESS_TIMEZONE = "America/Argentina/Buenos_Aires";
export const INVITATION_TTL_HOURS = 72;

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function assertYoungKingzLocalDatabase(url: string): void {
  const parsed = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname) || parsed.port !== "55322") {
    throw new Error("Refusing database operation: expected local YoungKingZ PostgreSQL on port 55322");
  }
}
