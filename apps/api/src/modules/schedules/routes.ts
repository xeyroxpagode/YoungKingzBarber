import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { DomainError } from "@youngkingz/contracts";
import { authorizationService, type Actor } from "../iam/authorization.js";
import { operationId } from "../system/operations.js";
import { replaceWeeklySchedule } from "./commands.js";
import { getMySchedule, getSchedulesTeam, getStaffSchedule } from "./queries.js";

const staffParams = z.object({ staffMemberId: z.string().uuid() });
const uuid = { type: "string", format: "uuid" } as const;

const interval = { type: "object", required: ["start", "end"], additionalProperties: false, properties: { start: { type: "string" }, end: { type: "string" } } } as const;
const day = { type: "array", items: interval } as const;
const week = { type: "object", additionalProperties: false, properties: { MONDAY: day, TUESDAY: day, WEDNESDAY: day, THURSDAY: day, FRIDAY: day, SATURDAY: day, SUNDAY: day } } as const;
const replaceBody = { type: "object", required: ["expectedRevision", "week"], additionalProperties: false, properties: { expectedRevision: { type: "integer", minimum: 0 }, week } } as const;
const putMutation = { tags: ["schedules"], summary: "Replace a Staff weekly schedule", headers: { type: "object", required: ["x-operation-id"], properties: { "x-operation-id": uuid } }, params: { type: "object", required: ["staffMemberId"], properties: { staffMemberId: uuid } }, body: replaceBody } as const;

export async function registerScheduleRoutes(app: FastifyInstance) {
  async function authenticate(request: FastifyRequest) { request.actor = await authorizationService.authenticate(request); }
  function requireCapability(request: FastifyRequest, capability: Parameters<typeof authorizationService.require>[1]): Actor {
    if (!request.actor) throw new DomainError("UNAUTHENTICATED", "Authentication required", 401);
    authorizationService.require(request.actor, capability);
    return request.actor;
  }

  // §39 operational team summary (Receptionist/Owner).
  app.get("/v1/schedules/team", { preHandler: authenticate, schema: { tags: ["schedules"], summary: "Operational team schedule summary" } }, async request => getSchedulesTeam(requireCapability(request, "schedules.read")));

  // §42 read-only self schedule (Barber/receptionist/owner).
  app.get("/v1/schedules/me", { preHandler: authenticate, schema: { tags: ["schedules"], summary: "Get my weekly schedule" } }, async request => getMySchedule(requireCapability(request, "schedules.self.read")));

  // §40 read a Staff schedule.
  app.get("/v1/staff/:staffMemberId/schedule", { preHandler: authenticate, schema: { tags: ["schedules"], summary: "Get a Staff weekly schedule", params: { type: "object", required: ["staffMemberId"], properties: { staffMemberId: uuid } } } }, async request => getStaffSchedule(requireCapability(request, "schedules.read"), staffParams.parse(request.params).staffMemberId));

  // §41 replace the whole week atomically.
  app.put("/v1/staff/:staffMemberId/schedule", { preHandler: authenticate, schema: putMutation }, async request => replaceWeeklySchedule(requireCapability(request, "schedules.manage"), staffParams.parse(request.params).staffMemberId, request.body, operationId(request.headers)));
}
