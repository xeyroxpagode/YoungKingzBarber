import type { FastifyInstance, FastifyRequest, FastifySchema } from "fastify";
import { z } from "zod";
import { authorizationService, type Actor } from "../iam/authorization.js";
import { DomainError } from "@youngkingz/contracts";
import { operationId } from "../system/operations.js";
import { clientSearchQuerySchema } from "@youngkingz/contracts";
import { createClientProfile, updateClientProfile, addClientContact, updateClientContact, createClientNote } from "./commands.js";
import { searchClientProfiles, getClientProfile, listClientNotes, listClientAccountLinks } from "./queries.js";

const uuid = { type: "string", format: "uuid" } as const;
const clientParam = z.object({ id: z.string().uuid() });
const contactParam = z.object({ id: z.string().uuid(), contactId: z.string().uuid() });
const clientParams = { type: "object", required: ["id"], properties: { id: uuid } } as const;
const contactParams = { type: "object", required: ["id", "contactId"], properties: { id: uuid, contactId: uuid } } as const;
const positiveRevision = { type: "integer", minimum: 1 } as const;
const operationHeader = { type: "object", required: ["x-operation-id"], properties: { "x-operation-id": uuid } } as const;
const errorResponse = { type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string" }, message: { type: "string" }, details: {} } } } } as const;
const mutationResponse = { type: "object", required: ["data", "replayed"], properties: { data: { type: "object", additionalProperties: true }, replayed: { type: "boolean" } } } as const;
const successResponse = { type: ["object", "array"], additionalProperties: true } as const;
const errors = { 400: errorResponse, 401: errorResponse, 403: errorResponse, 404: errorResponse, 409: errorResponse } as const;

function docs(summary: string, schema: FastifySchema = {}): FastifySchema { return { tags: ["clients"], summary, ...schema }; }
function queryDocs(summary: string, params?: object, querystring?: object): FastifySchema { return docs(summary, { ...(params ? { params } : {}), ...(querystring ? { querystring } : {}), response: { 200: successResponse, ...errors } }); }
function mutationDocs(summary: string, params: object | undefined, body: object): FastifySchema { return docs(summary, { ...(params ? { params } : {}), headers: operationHeader, body, response: { 200: mutationResponse, ...errors } }); }

export async function registerClientsRoutes(app: FastifyInstance) {
  async function authenticate(request: FastifyRequest) { request.actor = await authorizationService.authenticate(request); }
  function actor(request: FastifyRequest): Actor { if (!request.actor) throw new DomainError("UNAUTHENTICATED", "Authentication required", 401); return request.actor; }
  function requireCapability(request: FastifyRequest, capability: Parameters<typeof authorizationService.require>[1]) { const value = actor(request); authorizationService.require(value, capability); return value; }

  // GET /v1/clients — búsqueda y paginación (clients.read)
  app.get("/v1/clients", { preHandler: authenticate, schema: queryDocs("Buscar y listar clientes", undefined, {
    type: "object",
    properties: {
      q: { type: "string", maxLength: 200 },
      cursor: uuid,
      limit: { type: "integer", minimum: 1, maximum: 100 }
    }
  }) }, async (request) => {
    const a = requireCapability(request, "clients.read");
    const query = clientSearchQuerySchema.parse(request.query);
    return searchClientProfiles(a, { q: query.q, cursor: query.cursor, limit: query.limit });
  });

  // POST /v1/clients — crear ficha (clients.manage)
  app.post("/v1/clients", { preHandler: authenticate, schema: mutationDocs("Crear ficha de cliente", undefined, {
    type: "object", required: ["name"], additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 1, maxLength: 200 },
      firstName: { type: "string", maxLength: 100 },
      lastName: { type: "string", maxLength: 100 },
      contacts: {
        type: "array", maxItems: 20,
        items: { type: "object", properties: { type: { enum: ["telefono", "email", "whatsapp"] }, value: { type: "string", minLength: 1, maxLength: 200 }, label: { type: "string", maxLength: 50 }, isPrimary: { type: "boolean" } }, required: ["type", "value"], additionalProperties: false }
      }
    }
  }) }, async (request) => {
    const a = requireCapability(request, "clients.manage");
    return createClientProfile(a, request.body, operationId(request.headers));
  });

  // GET /v1/clients/:id — detalle autorizado (clients.read)
  app.get("/v1/clients/:id", { preHandler: authenticate, schema: queryDocs("Detalle de ficha de cliente", clientParams) }, async (request) => {
    const a = requireCapability(request, "clients.read");
    const profile = await getClientProfile(a, clientParam.parse(request.params).id);
    if (!profile) throw new DomainError("NOT_FOUND", "La ficha de cliente no existe", 404);
    return profile;
  });

  // PATCH /v1/clients/:id — corrección con control de revisión (clients.manage)
  app.patch("/v1/clients/:id", { preHandler: authenticate, schema: mutationDocs("Corregir ficha de cliente", clientParams, {
    type: "object", required: ["expectedRevision"], additionalProperties: false,
    properties: {
      expectedRevision: positiveRevision,
      name: { type: "string", minLength: 1, maxLength: 200 },
      firstName: { type: ["string", "null"], maxLength: 100 },
      lastName: { type: ["string", "null"], maxLength: 100 }
    }
  }) }, async (request) => {
    const a = requireCapability(request, "clients.manage");
    return updateClientProfile(a, clientParam.parse(request.params).id, request.body, operationId(request.headers));
  });

  // POST /v1/clients/:id/contacts — agregar contacto (clients.manage)
  app.post("/v1/clients/:id/contacts", { preHandler: authenticate, schema: mutationDocs("Agregar contacto de cliente", clientParams, {
    type: "object", required: ["type", "value"], additionalProperties: false,
    properties: {
      type: { enum: ["telefono", "email", "whatsapp"] },
      value: { type: "string", minLength: 1, maxLength: 200 },
      label: { type: "string", maxLength: 50 },
      isPrimary: { type: "boolean" }
    }
  }) }, async (request) => {
    const a = requireCapability(request, "clients.manage");
    return addClientContact(a, clientParam.parse(request.params).id, request.body, operationId(request.headers));
  });

  // PATCH /v1/clients/:id/contacts/:contactId — corregir contacto (clients.manage)
  app.patch("/v1/clients/:id/contacts/:contactId", { preHandler: authenticate, schema: mutationDocs("Corregir contacto de cliente", contactParams, {
    type: "object", additionalProperties: false,
    properties: {
      type: { enum: ["telefono", "email", "whatsapp"] },
      value: { type: "string", minLength: 1, maxLength: 200 },
      label: { type: ["string", "null"], maxLength: 50 },
      isPrimary: { type: "boolean" }
    }
  }) }, async (request) => {
    const a = requireCapability(request, "clients.manage");
    const { id, contactId } = contactParam.parse(request.params);
    return updateClientContact(a, id, contactId, request.body, operationId(request.headers));
  });

  // GET /v1/clients/:id/notes — consultar notas internas (clients.notes.read)
  app.get("/v1/clients/:id/notes", { preHandler: authenticate, schema: queryDocs("Consultar notas internas de cliente", clientParams) }, async (request) => {
    const a = requireCapability(request, "clients.notes.read");
    const notes = await listClientNotes(a, clientParam.parse(request.params).id);
    if (!notes) throw new DomainError("NOT_FOUND", "La ficha de cliente no existe", 404);
    return notes;
  });

  // POST /v1/clients/:id/notes — crear nota interna (clients.notes.manage)
  app.post("/v1/clients/:id/notes", { preHandler: authenticate, schema: mutationDocs("Crear nota interna de cliente", clientParams, {
    type: "object", required: ["text"], additionalProperties: false,
    properties: {
      text: { type: "string", minLength: 1, maxLength: 4000 },
      replacesNoteId: uuid
    }
  }) }, async (request) => {
    const a = requireCapability(request, "clients.notes.manage");
    return createClientNote(a, clientParam.parse(request.params).id, request.body, operationId(request.headers));
  });

  // GET /v1/clients/:id/account-links — consultar vínculos acreditados (clients.links.read)
  app.get("/v1/clients/:id/account-links", { preHandler: authenticate, schema: queryDocs("Consultar vínculos de cuenta de cliente", clientParams) }, async (request) => {
    const a = requireCapability(request, "clients.links.read");
    const links = await listClientAccountLinks(a, clientParam.parse(request.params).id);
    if (!links) throw new DomainError("NOT_FOUND", "La ficha de cliente no existe", 404);
    return links;
  });
}
