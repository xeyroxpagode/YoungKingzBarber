import type { FastifyInstance, FastifyRequest, FastifySchema } from "fastify";
import { z } from "zod";
import { authorizationService, type Actor } from "../iam/authorization.js";
import { DomainError } from "@youngkingz/contracts";
import { operationId } from "../system/operations.js";
import { replaceStaffServices } from "./commands.js";
import { getMyServices, getStaffServices } from "./queries.js";

const staffMemberParam = z.object({ staffMemberId: z.string().uuid() });
const staffMemberParams = { type: "object", required: ["staffMemberId"], properties: { staffMemberId: { type: "string", format: "uuid" } } } as const;
const uuid = { type: "string", format: "uuid" } as const;
const nonNegativeInteger = { type: "integer", minimum: 0 } as const;
const operationHeader = { type: "object", required: ["x-operation-id"], properties: { "x-operation-id": uuid } } as const;
const errorResponse = { type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string" }, message: { type: "string" }, details: {} } } } } as const;
const mutationResponse = { type: "object", required: ["data", "replayed"], properties: { data: { type: "object", additionalProperties: true }, replayed: { type: "boolean" } } } as const;
const successResponse = { type: ["object", "array"], additionalProperties: true } as const;
const errors = { 400: errorResponse, 401: errorResponse, 403: errorResponse, 404: errorResponse, 409: errorResponse } as const;

function docs(summary: string, schema: FastifySchema = {}): FastifySchema { return { tags: ["staff-services"], summary, ...schema }; }
function queryDocs(summary: string, params?: object): FastifySchema { return docs(summary, { ...(params ? { params } : {}), response: { 200: successResponse, ...errors } }); }
function mutationDocs(summary: string, params: object | undefined, body: object): FastifySchema { return docs(summary, { ...(params ? { params } : {}), headers: operationHeader, body, response: { 200: mutationResponse, ...errors } }); }

export async function registerStaffServicesRoutes(app: FastifyInstance) {
  async function authenticate(request: FastifyRequest) { request.actor = await authorizationService.authenticate(request); }
  function actor(request: FastifyRequest): Actor { if (!request.actor) throw new DomainError("UNAUTHENTICATED", "Authentication required", 401); return request.actor; }
  function requireCapability(request: FastifyRequest, capability: Parameters<typeof authorizationService.require>[1]) { const value = actor(request); authorizationService.require(value, capability); return value; }

  // GET /v1/staff/:staffMemberId/services  — staff-services.read  (Owner + Receptionist)
  app.get("/v1/staff/:staffMemberId/services", { preHandler: authenticate, schema: queryDocs("Get staff services", staffMemberParams) }, async (request) => {
    const a = requireCapability(request, "staff-services.read");
    return getStaffServices(a, staffMemberParam.parse(request.params).staffMemberId);
  });

  // PUT /v1/staff/:staffMemberId/services  — staff-services.manage  (Owner only)
  app.put("/v1/staff/:staffMemberId/services", { preHandler: authenticate, schema: mutationDocs("Replace staff services", staffMemberParams, {
    type: "object", required: ["expectedRevision"], additionalProperties: false,
    properties: { expectedRevision: nonNegativeInteger, serviceIds: { type: "array", items: uuid, maxItems: 200 } }
  }) }, async (request) => {
    const a = requireCapability(request, "staff-services.manage");
    return replaceStaffServices(a, staffMemberParam.parse(request.params).staffMemberId, request.body, operationId(request.headers));
  });

  // GET /v1/staff-services/me  — staff-services.self.read  (all roles, own services)
  app.get("/v1/staff-services/me", { preHandler: authenticate, schema: queryDocs("Get my services") }, async (request) => {
    const a = requireCapability(request, "staff-services.self.read");
    return getMyServices(a);
  });
}
