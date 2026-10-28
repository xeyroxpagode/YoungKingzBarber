import { createHash, randomBytes } from "node:crypto";

export function sha256(value: string): string { return createHash("sha256").update(value).digest("hex"); }
export function stableHash(value: unknown): string { return sha256(canonicalJson(value)); }
export function createOpaqueToken(): { token: string; hash: string } { const token = randomBytes(32).toString("base64url"); return { token, hash: sha256(token) }; }

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  return JSON.stringify(value);
}
