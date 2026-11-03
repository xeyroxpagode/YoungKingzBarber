import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import postgres from "postgres";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../../apps/api/src/app";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:55322/postgres";
const supabaseUrl = process.env.SUPABASE_URL ?? "http://127.0.0.1:55321";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? serviceKey;
const db = postgres(databaseUrl, { prepare: false, max: 10 });
const password = "YoungKingz-U03!26";
const suffix = randomUUID().slice(0, 8);
const authUserIds: string[] = [];
let admin: SupabaseClient;
let app: FastifyInstance;
let businessA = "";
let businessB = "";
let ownerToken = "";
let receptionistToken = "";
let barberToken = "";

async function signIn(email: string) {
  const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data.session!.access_token;
}

async function purgeTestUsers() {
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users) return;
    const victims = data.users.filter((user) => (user.email ?? "").endsWith("@example.test"));
    for (const victim of victims) await admin.auth.admin.deleteUser(victim.id).catch(() => undefined);
    if (data.users.length < 200) return;
  }
}

async function createActor(businessId: string, role: "OWNER" | "RECEPTIONIST" | "BARBER") {
  const email = `${role.toLowerCase()}-${suffix}-${randomUUID().slice(0, 6)}@example.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  authUserIds.push(created.data.user.id);
  const [person] = await db`insert into iam.persons(first_name, last_name) values (${role}, ${suffix}) returning id`;
  const [staff] = await db`insert into team.staff_members(business_id, person_id, employment_status, access_status) values (${businessId}, ${person!.id}, 'ACTIVE', 'ACTIVE') returning id`;
  const [account] = await db`insert into iam.user_accounts(person_id, auth_user_id, verified_email, status) values (${person!.id}, ${created.data.user.id}, ${email}, 'ACTIVE') returning id`;
  await db`insert into iam.account_security_states(account_id) values (${account!.id})`;
  await db`insert into team.staff_relationship_periods(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  await db`insert into iam.staff_role_states(business_id, staff_member_id) values (${businessId}, ${staff!.id})`;
  const [assignment] = await db`insert into iam.role_assignments(business_id, staff_member_id, role, effective_at, assigned_by_account_id) values (${businessId}, ${staff!.id}, ${role}, now(), ${account!.id}) returning id`;
  return { token: await signIn(email), staffId: staff!.id as string, accountId: account!.id as string, assignmentId: assignment!.id as string };
}

async function request(token: string, method: string, url: string, payload?: unknown, operationId = randomUUID()) {
  const headers: Record<string, string> = { authorization: `Bearer ${token}`, "x-operation-id": operationId };
  if (payload !== undefined) headers["content-type"] = "application/json";
  const response = await app.inject({ method, url, headers, payload });
  return { status: response.statusCode, body: response.json(), operationId };
}

beforeAll(async () => {
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await purgeTestUsers();
  const [a] = await db`insert into business.businesses(provisioning_key, display_name, timezone, status) values (${`u03-a-${suffix}`}, 'U03 A', 'America/Argentina/Buenos_Aires', 'ACTIVE') returning id`;
  const [b] = await db`insert into business.businesses(provisioning_key, display_name, timezone, status) values (${`u03-b-${suffix}`}, 'U03 B', 'UTC', 'ACTIVE') returning id`;
  businessA = a!.id;
  businessB = b!.id;
  const owner = await createActor(businessA, "OWNER"); ownerToken = owner.token;
  const reception = await createActor(businessA, "RECEPTIONIST"); receptionistToken = reception.token;
  const barber = await createActor(businessA, "BARBER"); barberToken = barber.token;
  app = await buildApp();
}, 60_000);

afterAll(async () => {
  await app?.close();
  for (const businessId of [businessA, businessB]) {
    if (!businessId) continue;
    await db`delete from clients.client_account_links where business_id = ${businessId}`;
    await db`delete from clients.client_notes where business_id = ${businessId}`;
    await db`delete from clients.client_contacts where business_id = ${businessId}`;
    await db`delete from clients.client_profiles where business_id = ${businessId}`;
    const staff = await db`select id, person_id from team.staff_members where business_id = ${businessId}`;
    const people = staff.map((item) => item.person_id);
    const accounts = people.length ? await db`select id from iam.user_accounts where person_id = any(${people})` : [];
    const accountIds = accounts.map((item) => item.id);
    await db`delete from system.audit_events where business_id = ${businessId}`;
    await db`delete from system.operation_attempts where business_id = ${businessId}`;
    await db`delete from iam.access_sessions where business_id = ${businessId}`;
    await db`delete from iam.role_assignments where business_id = ${businessId}`;
    await db`delete from iam.staff_role_states where business_id = ${businessId}`;
    await db`delete from team.staff_relationship_periods where business_id = ${businessId}`;
    await db`delete from team.staff_members where business_id = ${businessId}`;
    if (accountIds.length) await db`delete from iam.account_security_states where account_id = any(${accountIds})`;
    if (accountIds.length) await db`delete from iam.user_accounts where id = any(${accountIds})`;
    if (people.length) await db`delete from iam.persons where id = any(${people})`;
    await db`delete from business.businesses where id = ${businessId}`;
  }
  for (const id of authUserIds) await admin.auth.admin.deleteUser(id).catch(() => undefined);
  await db.end();
});

describe("H03.U01 clientes", () => {
  describe("lectura", () => {
    it("owner lee lista vacía y detalle inexistente es 404", async () => {
      const list = await request(ownerToken, "GET", "/v1/clients");
      expect(list.status).toBe(200);
      expect(list.body.items).toEqual([]);
      expect(list.body.total).toBe(0);

      const detail = await request(ownerToken, "GET", `/v1/clients/${randomUUID()}`);
      expect(detail.status).toBe(404);
    });

    it("recepcionista puede leer; barbero no", async () => {
      expect((await request(receptionistToken, "GET", "/v1/clients")).status).toBe(200);
      expect((await request(barberToken, "GET", "/v1/clients")).status).toBe(403);
    });

    it("cross-business detalle es 404 (no revela existencia)", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente A", contacts: [{ type: "telefono", value: "11 4444 1001" }] });
      expect(created.status).toBe(200);
      const ownerB = await createActor(businessB, "OWNER");
      const cross = await request(ownerB.token, "GET", `/v1/clients/${created.body.data.clientProfileId}`);
      expect(cross.status).toBe(404);
    });
  });

  describe("creación", () => {
    it("owner crea ficha con revisión 1 y contacto atómico", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", {
        name: "Ana García",
        firstName: "Ana",
        lastName: "García",
        contacts: [{ type: "telefono", value: "11 4444 1001", label: "principal", isPrimary: true }]
      });
      expect(created.status).toBe(200);
      expect(created.body.data).toMatchObject({ revision: 1, changed: true, name: "Ana García" });
      expect(created.body.data.contacts).toHaveLength(1);
      expect(created.body.data.contacts?.[0]?.value).toBe("11 4444 1001");
    });

    it("nombre vacío es rechazado", async () => {
      const result = await request(ownerToken, "POST", "/v1/clients", { name: "   " });
      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("barbero no puede crear", async () => {
      const result = await request(barberToken, "POST", "/v1/clients", { name: "Ana García" });
      expect(result.status).toBe(403);
    });

    it("idempotencia: misma operation_id no duplica", async () => {
      const operation = randomUUID();
      const first = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Idem", contacts: [{ type: "telefono", value: "11 4444 2001" }] }, operation);
      expect(first.status).toBe(200);
      expect(first.body.replayed).toBe(false);
      const replay = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Idem", contacts: [{ type: "telefono", value: "11 4444 2001" }] }, operation);
      expect(replay.status).toBe(200);
      expect(replay.body.replayed).toBe(true);
      const list = await request(ownerToken, "GET", "/v1/clients?q=Cliente%20Idem");
      expect(list.body.items.filter((i: any) => i.name === "Cliente Idem")).toHaveLength(1);
    });

    it("misma operation_id con payload distinto es conflicto", async () => {
      const operation = randomUUID();
      await request(ownerToken, "POST", "/v1/clients", { name: "Cliente A", contacts: [{ type: "telefono", value: "11 4444 3001" }] }, operation);
      const conflict = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente B", contacts: [{ type: "telefono", value: "11 4444 3002" }] }, operation);
      expect(conflict.status).toBe(409);
      expect(conflict.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    });
  });

  describe("corrección y revisión", () => {
    it("edición con cambio real incrementa revisión", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Edit", contacts: [{ type: "telefono", value: "11 4444 4001" }] });
      expect(created.status).toBe(200);
      const id = created.body.data.clientProfileId;

      const updated = await request(ownerToken, "PATCH", `/v1/clients/${id}`, {
        expectedRevision: 1,
        name: "Cliente Editado"
      });
      expect(updated.status).toBe(200);
      expect(updated.body.data).toMatchObject({ revision: 2, changed: true, name: "Cliente Editado" });
    });

    it("revisión obsoleta es STALE_REVISION", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Stale", contacts: [{ type: "telefono", value: "11 4444 5001" }] });
      const id = created.body.data.clientProfileId;

      const stale = await request(ownerToken, "PATCH", `/v1/clients/${id}`, {
        expectedRevision: 99,
        name: "X"
      });
      expect(stale.status).toBe(409);
      expect(stale.body.error.code).toBe("STALE_REVISION");
    });

    it("sin cambio semántico es no-op (no incrementa revisión)", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Noop", contacts: [{ type: "telefono", value: "11 4444 6001" }] });
      expect(created.status).toBe(200);
      const id = created.body.data.clientProfileId;

      const noop = await request(ownerToken, "PATCH", `/v1/clients/${id}`, {
        expectedRevision: 1,
        name: "Cliente Noop"
      });
      expect(noop.status).toBe(200);
      expect(noop.body.data).toMatchObject({ revision: 1, changed: false });
    });
  });

  describe("contactos", () => {
    it("agregar contacto incrementa revisión", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Contacto", contacts: [{ type: "telefono", value: "11 4444 7001" }] });
      const id = created.body.data.clientProfileId;

      const added = await request(ownerToken, "POST", `/v1/clients/${id}/contacts`, {
        type: "email",
        value: "ana@mail.com",
        label: "trabajo"
      });
      expect(added.status).toBe(200);
      expect(added.body.data).toMatchObject({ revision: 2, changed: true });
    });

    it("duplicado exacto en misma ficha es conflicto", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Dup", contacts: [{ type: "telefono", value: "11 4444 8001" }] });
      const id = created.body.data.clientProfileId;

      const dup = await request(ownerToken, "POST", `/v1/clients/${id}/contacts`, {
        type: "telefono",
        value: "1144448001"
      });
      expect(dup.status).toBe(409);
      expect(dup.body.error.code).toBe("CONFLICT");
    });

    it("mismo teléfono en dos fichas es permitido (sin fusión)", async () => {
      const c1 = await request(ownerToken, "POST", "/v1/clients", { name: "Persona A", contacts: [{ type: "telefono", value: "11 4444 9001" }] });
      const c2 = await request(ownerToken, "POST", "/v1/clients", { name: "Persona B", contacts: [{ type: "telefono", value: "11 4444 9001" }] });
      expect(c1.status).toBe(200);
      expect(c2.status).toBe(200);
      expect(c2.body.data.clientProfileId).not.toBe(c1.body.data.clientProfileId);
    });
  });

  describe("notas", () => {
    it("recepcionista con clients.notes.manage crea nota", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Nota", contacts: [{ type: "telefono", value: "11 4444 9101" }] });
      const id = created.body.data.clientProfileId;

      const note = await request(receptionistToken, "POST", `/v1/clients/${id}/notes`, {
        text: "Nota interna de prueba"
      });
      expect(note.status).toBe(200);
      expect(note.body.data).toMatchObject({ changed: true, noteId: expect.any(String) });
    });

    it("barbero no puede crear notas", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Nota B", contacts: [{ type: "telefono", value: "11 4444 9201" }] });
      const id = created.body.data.clientProfileId;

      const note = await request(barberToken, "POST", `/v1/clients/${id}/notes`, { text: "Nota" });
      expect(note.status).toBe(403);
    });

    it("notas no se exponen en listado", async () => {
      await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Nota Lista", contacts: [{ type: "telefono", value: "11 4444 9301" }] });
      const list = await request(ownerToken, "GET", "/v1/clients?q=Cliente%20Nota%20Lista");
      expect(list.body.items.length).toBeGreaterThan(0);
      expect(list.body.items[0].notes).toBeUndefined();
    });
  });

  describe("vínculos de cuenta", () => {
    it("lectura de vínculos devuelve array (creación cerrada en U01)", async () => {
      const created = await request(ownerToken, "POST", "/v1/clients", { name: "Cliente Link", contacts: [{ type: "telefono", value: "11 4444 9401" }] });
      const id = created.body.data.clientProfileId;

      const links = await request(ownerToken, "GET", `/v1/clients/${id}/account-links`);
      expect(links.status).toBe(200);
      expect(Array.isArray(links.body)).toBe(true);
    });
  });

  describe("búsqueda", () => {
    it("búsqueda paginada estable con cursor", async () => {
      for (let i = 1; i <= 5; i++) {
        await request(ownerToken, "POST", "/v1/clients", { name: `Cliente Search ${i}`, contacts: [{ type: "telefono", value: `11 4444 950${i}` }] });
      }
      const page1 = await request(ownerToken, "GET", "/v1/clients?q=Cliente%20Search&limit=2");
      expect(page1.body.items.length).toBe(2);
      expect(page1.body.nextCursor).not.toBeNull();

      const page2 = await request(ownerToken, `GET`, `/v1/clients?q=Cliente%20Search&limit=2&cursor=${page1.body.nextCursor}`);
      expect(page2.body.items.length).toBe(2);
      const ids1 = page1.body.items.map((i: any) => i.id);
      const ids2 = page2.body.items.map((i: any) => i.id);
      expect(ids1.some((id: string) => ids2.includes(id))).toBe(false);
    });
  });

  describe("idempotencia cross-actor (executeOperation hardening)", () => {
    it("mismo actor + misma operation_id + mismo payload = replay legítimo", async () => {
      const operation = randomUUID();
      const first = await request(ownerToken, "POST", "/v1/clients", { name: "Replay Test", contacts: [{ type: "telefono", value: "11 4444 9901" }] }, operation);
      expect(first.status).toBe(200);
      expect(first.body.replayed).toBe(false);
      const replay = await request(ownerToken, "POST", "/v1/clients", { name: "Replay Test", contacts: [{ type: "telefono", value: "11 4444 9901" }] }, operation);
      expect(replay.status).toBe(200);
      expect(replay.body.replayed).toBe(true);
      expect(replay.body.data.clientProfileId).toBe(first.body.data.clientProfileId);
    });

    it("otro actor del mismo Business intenta recuperar operación ajena → IDEMPOTENCY_CONFLICT", async () => {
      const operation = randomUUID();
      await request(ownerToken, "POST", "/v1/clients", { name: "Actor A Profile", contacts: [{ type: "telefono", value: "11 4444 9902" }] }, operation);
      const reception = await request(receptionistToken, "POST", "/v1/clients", { name: "Actor B Profile", contacts: [{ type: "telefono", value: "11 4444 9903" }] }, operation);
      expect(reception.status).toBe(409);
      expect(reception.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
      expect(reception.body.error.message).toContain("another actor or business");
    });

    it("actor de otro Business intenta recuperar operación ajena → IDEMPOTENCY_CONFLICT", async () => {
      const operation = randomUUID();
      await request(ownerToken, "POST", "/v1/clients", { name: "Business A Profile", contacts: [{ type: "telefono", value: "11 4444 9904" }] }, operation);
      const ownerB = await createActor(businessB, "OWNER");
      const cross = await request(ownerB.token, "POST", "/v1/clients", { name: "Business B Profile", contacts: [{ type: "telefono", value: "11 4444 9905" }] }, operation);
      expect(cross.status).toBe(409);
      expect(cross.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
      expect(cross.body.error.message).toContain("another actor or business");
    });

    it("misma operation_id con payload incompatible → IDEMPOTENCY_CONFLICT", async () => {
      const operation = randomUUID();
      await request(ownerToken, "POST", "/v1/clients", { name: "Original", contacts: [{ type: "telefono", value: "11 4444 9906" }] }, operation);
      const conflict = await request(ownerToken, "POST", "/v1/clients", { name: "Different", contacts: [{ type: "telefono", value: "11 4444 9907" }] }, operation);
      expect(conflict.status).toBe(409);
      expect(conflict.body.error.code).toBe("IDEMPOTENCY_CONFLICT");
    });

    it("reintentos rechazados no crean efectos adicionales (solo un perfil)", async () => {
      const operation = randomUUID();
      await request(ownerToken, "POST", "/v1/clients", { name: "No Side Effects", contacts: [{ type: "telefono", value: "11 4444 9908" }] }, operation);
      // Tres intentos con actors/Businesses distintos - todos deben fallar
      const reception = await request(receptionistToken, "POST", "/v1/clients", { name: "Attempt 2", contacts: [{ type: "telefono", value: "11 4444 9909" }] }, operation);
      const ownerB = await createActor(businessB, "OWNER");
      const cross = await request(ownerB.token, "POST", "/v1/clients", { name: "Attempt 3", contacts: [{ type: "telefono", value: "11 4444 9910" }] }, operation);
      const conflict = await request(ownerToken, "POST", "/v1/clients", { name: "Attempt 4", contacts: [{ type: "telefono", value: "11 4444 9911" }] }, operation);
      expect([reception.status, cross.status, conflict.status].every(s => s === 409)).toBe(true);
      // Verificar que solo existe un perfil
      const list = await request(ownerToken, "GET", "/v1/clients?q=No%20Side%20Effects");
      expect(list.body.items.filter((i: any) => i.name === "No Side Effects")).toHaveLength(1);
    });
  });
});
