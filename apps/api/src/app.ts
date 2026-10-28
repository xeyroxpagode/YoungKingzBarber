import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { ZodError, z } from "zod";
import { DomainError, delegableCapabilities, terminateSessionsSchema } from "@youngkingz/contracts";
import { runtime, supabaseAdmin } from "./lib/runtime.js";
import { authorizationService, type Actor } from "./modules/iam/authorization.js";
import { acceptInvitation, issueInvitation, listInvitations, reissueInvitation, revokeInvitation } from "./modules/iam/invitations.js";
import { contexts, currentContext, permissions, switchContext } from "./modules/iam/context.js";
import { activeRoles, createStaff, getStaff, grants, issueGrant, lifecycle, listStaff, replaceRoles, revokeGrant, roleHistory, updateStaff } from "./modules/team/service.js";
import { operationId } from "./modules/system/operations.js";
import { rows, sql } from "./lib/sql.js";
import "./plugins/auth.js";

const uuidParam = z.object({ id: z.string().uuid() });
const operationParam = z.object({ operationId: z.string().uuid() });

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: { redact: ["req.headers.authorization", "req.headers.cookie", "body.token", "body.password"] }, trustProxy: true });
  await app.register(cors, { origin: runtime.webOrigin, credentials: true, allowedHeaders: ["authorization","content-type","x-operation-id"] });
  await app.register(swagger, { openapi: { info: { title: "YoungKingZ H01 API", version: "1.0.0", description: "Authoritative IAM and Staff API" }, servers: [{ url: "http://127.0.0.1:4100" }], tags: [{name:"system"},{name:"iam"},{name:"team"}] } });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Request validation failed", details: error.issues } });
    if (error instanceof DomainError) return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message, details: error.details } });
    if (typeof (error as {statusCode?:unknown}).statusCode === "number") { const requestError=error as {statusCode:number;message:string};return reply.status(requestError.statusCode).send({ error: { code: "REQUEST_ERROR", message: requestError.message } }); }
    app.log.error(error);
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Unexpected infrastructure error" } });
  });

  async function authenticate(request: FastifyRequest) { request.actor = await authorizationService.authenticate(request); }
  function actor(request: FastifyRequest): Actor { if (!request.actor) throw new DomainError("UNAUTHENTICATED", "Authentication required", 401); return request.actor; }
  function requireCapability(request: FastifyRequest, capability: Parameters<typeof authorizationService.require>[1]) { const value=actor(request); authorizationService.require(value,capability); return value; }

  app.get("/health", { schema: { tags:["system"], summary:"Health check" } }, async () => ({ status: "ok", service: "youngkingz-api", time: new Date().toISOString() }));

  app.get("/v1/businesses/current", { preHandler: authenticate }, async request => { const a=actor(request); return (await rows(sql`select id,display_name "displayName",timezone,status::text status,version,authorization_revision "authorizationRevision" from business.businesses where id=${a.businessId}`))[0]; });
  app.get("/v1/iam/me", { preHandler: authenticate }, async request => { const a=requireCapability(request,"iam.self.read"); return (await rows(sql`select p.id,p.first_name "firstName",p.last_name "lastName",p.phone,ua.verified_email::text email,ua.status::text "accountStatus",sm.revision from iam.persons p join iam.user_accounts ua on ua.person_id=p.id join team.staff_members sm on sm.person_id=p.id and sm.id=${a.staffMemberId} where ua.id=${a.accountId}`))[0]; });
  app.patch("/v1/iam/me", { preHandler: authenticate }, async request => { const a=requireCapability(request,"iam.self.update");return updateStaff(a,a.staffMemberId,request.body,operationId(request.headers)); });
  app.get("/v1/iam/contexts", { preHandler: authenticate }, async request => contexts(requireCapability(request,"iam.contexts.list")));
  app.get("/v1/iam/context", { preHandler: authenticate }, async request => currentContext(requireCapability(request,"iam.contexts.list")));
  app.put("/v1/iam/context", { preHandler: authenticate }, async request => switchContext(requireCapability(request,"iam.contexts.switch"),request.body,operationId(request.headers)));
  app.get("/v1/iam/me/permissions", { preHandler: authenticate }, async request => permissions(actor(request)));
  app.get("/v1/iam/me/access", { preHandler: authenticate }, async request => { const a=actor(request); return (await rows(sql`select sm.employment_status "employmentStatus",sm.access_status "accessStatus",sm.revision from team.staff_members sm where sm.id=${a.staffMemberId} and sm.business_id=${a.businessId}`))[0]; });
  app.get("/v1/iam/delegable-capabilities", { preHandler: authenticate }, async request => { requireCapability(request,"iam.grants.read"); return { capabilities: delegableCapabilities }; });

  app.get("/v1/staff", { preHandler: authenticate }, async request => { const query=z.object({search:z.string().trim().max(200).optional(),status:z.enum(["CURRENT","PENDING","SUSPENDED","HISTORICAL","ALL"]).default("CURRENT")}).parse(request.query);return listStaff(requireCapability(request,"iam.staff.list"),query); });
  app.post("/v1/staff", { preHandler: authenticate }, async request => createStaff(requireCapability(request,"iam.staff.create"),request.body,operationId(request.headers)));
  app.get("/v1/staff/:id", { preHandler: authenticate }, async request => getStaff(requireCapability(request,"iam.staff.read"),uuidParam.parse(request.params).id));
  app.patch("/v1/staff/:id", { preHandler: authenticate }, async request => updateStaff(requireCapability(request,"iam.staff.update"),uuidParam.parse(request.params).id,request.body,operationId(request.headers)));

  app.get("/v1/staff/:id/invitations", { preHandler: authenticate }, async request => listInvitations(requireCapability(request,"iam.staff.read"),uuidParam.parse(request.params).id));
  app.post("/v1/staff/:id/invitations", { preHandler: authenticate }, async request => issueInvitation(requireCapability(request,"iam.invitations.issue"),uuidParam.parse(request.params).id,request.body,operationId(request.headers)));
  app.post("/v1/invitations/:id/reissue", { preHandler: authenticate }, async request => reissueInvitation(requireCapability(request,"iam.invitations.reissue"),uuidParam.parse(request.params).id,operationId(request.headers)));
  app.post("/v1/invitations/:id/revoke", { preHandler: authenticate }, async request => revokeInvitation(requireCapability(request,"iam.invitations.revoke"),uuidParam.parse(request.params).id,operationId(request.headers)));
  app.post("/v1/invitations/:id/accept", async request => acceptInvitation(request,uuidParam.parse(request.params).id,operationId(request.headers)));

  app.get("/v1/staff/:id/roles", { preHandler: authenticate }, async request => activeRoles(requireCapability(request,"iam.roles.read"),uuidParam.parse(request.params).id));
  app.patch("/v1/staff/:id/roles", { preHandler: authenticate }, async request => replaceRoles(requireCapability(request,"iam.roles.assign"),uuidParam.parse(request.params).id,request.body,operationId(request.headers)));
  app.get("/v1/staff/:id/roles/history", { preHandler: authenticate }, async request => roleHistory(requireCapability(request,"iam.roles.read"),uuidParam.parse(request.params).id));

  app.get("/v1/staff/:id/grants", { preHandler: authenticate }, async request => grants(requireCapability(request,"iam.grants.read"),uuidParam.parse(request.params).id));
  app.post("/v1/staff/:id/grants", { preHandler: authenticate }, async request => issueGrant(requireCapability(request,"iam.grants.issue"),uuidParam.parse(request.params).id,request.body,operationId(request.headers)));
  app.post("/v1/grants/:id/revoke", { preHandler: authenticate }, async request => revokeGrant(requireCapability(request,"iam.grants.revoke"),uuidParam.parse(request.params).id,operationId(request.headers)));
  app.get("/v1/staff/:id/grants/history", { preHandler: authenticate }, async request => grants(requireCapability(request,"iam.grants.read"),uuidParam.parse(request.params).id,true));

  app.get("/v1/staff/:id/access", { preHandler: authenticate }, async request => getStaff(requireCapability(request,"iam.access.read"),uuidParam.parse(request.params).id));
  for (const action of ["suspend","reactivate","revoke","offboard","reonboard"] as const) app.post(`/v1/staff/:id/access/${action}`, { preHandler: authenticate }, async request => lifecycle(requireCapability(request, action==="offboard"?"iam.access.offboard":action==="reonboard"?"iam.access.reonboard":`iam.access.${action}`),uuidParam.parse(request.params).id,action,request.body,operationId(request.headers)));
  app.get("/v1/staff/:id/access/history", { preHandler: authenticate }, async request => { const a=requireCapability(request,"iam.access.read");const id=uuidParam.parse(request.params).id;return rows(sql`select ae.action,ae.changes,ae.occurred_at "occurredAt",ae.outcome,ae.actor_account_id "actorAccountId",p.first_name || coalesce(' '||p.last_name,'') "actorName" from system.audit_events ae left join iam.user_accounts ua on ua.id=ae.actor_account_id left join iam.persons p on p.id=ua.person_id where ae.business_id=${a.businessId} and ae.resource_id=${id} and ae.action like 'access.%' order by occurred_at desc`); });

  app.get("/v1/iam/access-sessions", { preHandler: authenticate }, async request => {
    const a=requireCapability(request,"iam.sessions.read");
    const query=z.object({view:z.enum(["ACTIVE","HISTORY"]).default("ACTIVE"),cursor:z.string().datetime().optional(),limit:z.coerce.number().int().min(1).max(20).default(6)}).parse(request.query);
    const items=await rows<{id:string;current:boolean;createdAt:Date;lastSeenAt:Date;expiresAt:Date;revokedAt?:Date;revokedReason?:string}>(sql`select id,case when id=${a.accessSessionId} then true else false end current,created_at "createdAt",last_seen_at "lastSeenAt",expires_at "expiresAt",revoked_at "revokedAt",revoked_reason "revokedReason"
      from iam.access_sessions where account_id=${a.accountId}
      ${query.view==="ACTIVE"?sql`and revoked_at is null and expires_at>now()`:sql`and (revoked_at is not null or expires_at<=now())`}
      ${query.cursor?sql`and last_seen_at<${query.cursor}`:sql``}
      order by case when id=${a.accessSessionId} then 0 else 1 end,last_seen_at desc limit ${query.limit+1}`);
    const hasMore=items.length>query.limit;const page=hasMore?items.slice(0,query.limit):items;
    return {items:page,nextCursor:hasMore?page.at(-1)?.lastSeenAt:null};
  });
  app.post("/v1/iam/access-sessions/terminate", { preHandler: authenticate }, async request => { const a=requireCapability(request,"iam.sessions.terminate");const input=terminateSessionsSchema.parse(request.body);const target=input.scope==="CURRENT"?sql`id=${a.accessSessionId}`:input.scope==="OTHERS"?sql`id<>${a.accessSessionId}`:sql`true`;const terminated=await rows(sql`update iam.access_sessions set revoked_at=now(),revoked_reason='USER_TERMINATED' where account_id=${a.accountId} and revoked_at is null and ${target} returning id`);return {terminated:terminated.length}; });
  app.get("/v1/iam/account-security", { preHandler: authenticate }, async request => { const a=actor(request);return (await rows(sql`select recovery_required "recoveryRequired",compromised_at "compromisedAt",sessions_valid_after "sessionsValidAfter",revision from iam.account_security_states where account_id=${a.accountId}`))[0]??{recoveryRequired:false}; });
  app.post("/v1/iam/account-security/compromised", { preHandler: authenticate }, async request => { const a=actor(request);await rows(sql`insert into iam.account_security_states(account_id,compromised_at,recovery_required,sessions_valid_after) values (${a.accountId},now(),true,now()) on conflict(account_id) do update set compromised_at=now(),recovery_required=true,sessions_valid_after=now(),revision=iam.account_security_states.revision+1,updated_at=now()`);await rows(sql`update iam.access_sessions set revoked_at=now(),revoked_reason='ACCOUNT_COMPROMISED' where account_id=${a.accountId} and revoked_at is null`);return {blocked:true}; });
  app.post("/v1/iam/password-recovery", async request => { const email=z.object({email:z.string().email()}).parse(request.body).email;await supabaseAdmin.auth.resetPasswordForEmail(email,{redirectTo:`${runtime.webOrigin}/reset-password`});return {accepted:true,message:"If the account exists, recovery instructions will be sent."}; });

  app.get("/v1/operations/:operationId", { preHandler: authenticate }, async request => { const a=requireCapability(request,"iam.operations.read");const id=operationParam.parse(request.params).operationId;const item=(await rows(sql`select operation_id "operationId",command_name "command",status::text status,response_status "responseStatus",error_code "errorCode",created_at "createdAt",completed_at "completedAt" from system.operation_attempts where operation_id=${id} and business_id=${a.businessId}`))[0];if(!item)throw new DomainError("NOT_FOUND","Operation not found",404);return item; });
  app.get("/v1/audit", { preHandler: authenticate }, async request => { const a=requireCapability(request,"iam.audit.read");const query=z.object({cursor:z.string().datetime().optional(),limit:z.coerce.number().int().min(1).max(100).default(50)}).parse(request.query);return rows(sql`select ae.id,ae.action,ae.capability,ae.resource_type "resourceType",ae.resource_id "resourceId",ae.outcome,ae.changes,ae.occurred_at "occurredAt",p.first_name || coalesce(' '||p.last_name,'') "actorName" from system.audit_events ae left join iam.user_accounts ua on ua.id=ae.actor_account_id left join iam.persons p on p.id=ua.person_id where ae.business_id=${a.businessId} ${query.cursor?sql`and ae.occurred_at<${query.cursor}`:sql``} order by ae.occurred_at desc limit ${query.limit}`); });

  return app;
}
