import { describe, expect, it } from "vitest";
import {
  canonicalizeContacts,
  contactsEqual,
  normalizeContactValue,
  normalizePhone
} from "../../../apps/api/src/modules/clients/domain.js";

describe("H03.U01 unit · dominio de clientes", () => {
  describe("normalizePhone", () => {
    it("conserva dígitos y prefijo + inicial", () => {
      expect(normalizePhone("11 5555-1234")).toBe("1155551234");
      expect(normalizePhone("+54 9 11 5555 1234")).toBe("+5491155551234");
      expect(normalizePhone("  1155551234  ")).toBe("1155551234");
      expect(normalizePhone("")).toBe("");
    });
    it("no asume equivalencia entre formatos distintos", () => {
      expect(normalizePhone("+54 9 11 5555 1234")).not.toBe(normalizePhone("11 5555-1234"));
    });
  });

  describe("normalizeContactValue", () => {
    it("normaliza email a minúsculas", () => {
      expect(normalizeContactValue("email", " Juan@Email.COM ")).toBe("juan@email.com");
    });
    it("normaliza telefono como telefono", () => {
      expect(normalizeContactValue("telefono", "11 5555-1234")).toBe("1155551234");
    });
  });

  describe("canonicalizeContacts", () => {
    it("descarta vacíos y elimina duplicados exactos", () => {
      const result = canonicalizeContacts([
        { type: "telefono", value: "  ", label: "", isPrimary: false },
        { type: "telefono", value: "11 5555-1234", label: "", isPrimary: false },
        { type: "telefono", value: "1155551234", label: "", isPrimary: false },
        { type: "email", value: "A@Mail.COM", label: "", isPrimary: false }
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].normalizedValue).toBe("1155551234");
      expect(result[1].normalizedValue).toBe("a@mail.com");
    });
    it("marca el primero como principal por defecto", () => {
      const result = canonicalizeContacts([
        { type: "telefono", value: "11 5555-1234", label: "", isPrimary: false },
        { type: "telefono", value: "11 5555-5678", label: "", isPrimary: true }
      ]);
      expect(result[0].isPrimary).toBe(true);
      expect(result[1].isPrimary).toBe(true);
    });
  });

  describe("contactsEqual", () => {
    it("devuelve true para contactos semánticamente iguales", () => {
      const a = [{ id: "c1", type: "telefono", value: "1155551234", normalizedValue: "1155551234", label: null, isPrimary: true }];
      const b = [{ id: "c2", type: "telefono", value: "1155551234", normalizedValue: "1155551234", label: null, isPrimary: true }];
      expect(contactsEqual(a, b)).toBe(true);
    });
    it("devuelve false para contactos distintos", () => {
      const a = [{ id: "c1", type: "telefono", value: "11 5555-1234", normalizedValue: "1155551234", label: null, isPrimary: true }];
      const b = [{ id: "c2", type: "email", value: "a@mail.com", normalizedValue: "a@mail.com", label: null, isPrimary: true }];
      expect(contactsEqual(a, b)).toBe(false);
    });
    it("maneja arrays undefined", () => {
      expect(contactsEqual(undefined, undefined)).toBe(true);
      expect(contactsEqual([], undefined)).toBe(true);
    });
  });
});
