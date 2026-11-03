import { DomainError } from "@youngkingz/contracts";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export type ContactInput = {
  type: "telefono" | "email" | "whatsapp";
  value: string;
  label?: string;
  isPrimary?: boolean;
};

export type ContactCanonical = {
  type: "telefono" | "email" | "whatsapp";
  value: string;
  normalizedValue: string;
  label: string | null;
  isPrimary: boolean;
};

export type ContactRow = {
  id: string;
  type: string;
  value: string;
  normalizedValue: string;
  label: string | null;
  isPrimary: boolean;
};

/** Normalización telefónica conservadora y comprobable (U01-INV-04). */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return (hasPlus ? "+" : "") + digits;
}

/** Normaliza el valor de un contacto según su tipo. */
export function normalizeContactValue(type: ContactInput["type"], value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (type === "email") return trimmed.toLowerCase();
  return normalizePhone(trimmed);
}

/** Valida que un ID sea UUID v4. */
export function validateUuid(id: string, field = "id"): void {
  if (!uuidSchema.safeParse(id).success) {
    throw new DomainError("VALIDATION_ERROR", `Identificador inválido: ${field}`, 400, { issue: "INVALID_UUID", field, value: id });
  }
}

/**
 * Normaliza contactos de entrada: descarta vacíos, elimina duplicados exactos
 * (mismo tipo + mismo valor normalizado), conserva orden de entrada.
 * El primero se marca principal salvo que se indique otro.
 */
export function canonicalizeContacts(contacts: readonly ContactInput[]): ContactCanonical[] {
  const seen = new Set<string>();
  const result: ContactCanonical[] = [];
  let primarySet = false;
  for (const contact of contacts) {
    const value = contact.value.trim();
    if (value === "") continue;
    const normalizedValue = normalizeContactValue(contact.type, value);
    if (normalizedValue === "") continue;
    const key = `${contact.type}:${normalizedValue}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isPrimary = contact.isPrimary === true || (!primarySet && result.length === 0);
    if (isPrimary) primarySet = true;
    result.push({ type: contact.type, value, normalizedValue, label: contact.label ?? null, isPrimary });
  }
  return result;
}

/** Comparación semántica de contactos para no-op (ignora ids y timestamps). */
export function contactsEqual(
  a: readonly ContactRow[] | undefined,
  b: readonly ContactCanonical[] | undefined
): boolean {
  const aa = (a ?? []).map((c) => ({ type: c.type, value: c.value, normalizedValue: c.normalizedValue, label: c.label, isPrimary: c.isPrimary }));
  const bb = (b ?? []).map((c) => ({ type: c.type, value: c.value, normalizedValue: c.normalizedValue, label: c.label, isPrimary: c.isPrimary }));
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) {
    if (aa[i].type !== bb[i].type || aa[i].value !== bb[i].value || aa[i].normalizedValue !== bb[i].normalizedValue || aa[i].label !== bb[i].label || aa[i].isPrimary !== bb[i].isPrimary) return false;
  }
  return true;
}
