import type { FastifyInstance, FastifyRequest } from "fastify";
import { DomainError, professionalQuerySchema } from "@youngkingz/contracts";
import { z } from "zod";
import { authorizationService, type Actor } from "../iam/authorization.js";
import { operationId } from "../system/operations.js";
import { createProfessionalProfile, deactivateProfessionalProfile, reactivateProfessionalProfile, updateMyProfessionalProfile, updateProfessionalProfile } from "./commands.js";
import { getMyProfessionalProfile, getProfessionalProfile, listProfessionalProfiles } from "./queries.js";

const paramsSchema=z.object({professionalProfileId:z.string().uuid()});
const uuid={type:"string",format:"uuid"};const revision={type:"integer",minimum:1};
const mutation=(summary:string,params:object|undefined,body:object)=>({tags:["professionals"],summary,headers:{type:"object",required:["x-operation-id"],properties:{"x-operation-id":uuid}},...(params?{params}:{}),body});

export async function registerProfessionalRoutes(app:FastifyInstance){
  async function authenticate(request:FastifyRequest){request.actor=await authorizationService.authenticate(request);}
  function requireCapability(request:FastifyRequest,capability:Parameters<typeof authorizationService.require>[1]):Actor{if(!request.actor)throw new DomainError("UNAUTHENTICATED","Authentication required",401);authorizationService.require(request.actor,capability);return request.actor;}
  const profileParams={type:"object",required:["professionalProfileId"],properties:{professionalProfileId:uuid}};
  const presentation={professionalDisplayName:{type:["string","null"],maxLength:80},bio:{type:["string","null"],maxLength:500},publicTitle:{type:["string","null"],maxLength:80}};
  app.get("/v1/professionals/me",{preHandler:authenticate,schema:{tags:["professionals"],summary:"Get my Professional Profile"}},async request=>getMyProfessionalProfile(requireCapability(request,"professionals.self.read")));
  app.patch("/v1/professionals/me",{preHandler:authenticate,schema:mutation("Update my Professional Profile",undefined,{type:"object",required:["expectedRevision"],additionalProperties:false,properties:{expectedRevision:revision,professionalDisplayName:presentation.professionalDisplayName,bio:presentation.bio}})},async request=>updateMyProfessionalProfile(requireCapability(request,"professionals.self.update"),request.body,operationId(request.headers)));
  app.get("/v1/professionals",{preHandler:authenticate,schema:{tags:["professionals"],summary:"List Professional Profiles"}},async request=>listProfessionalProfiles(requireCapability(request,"professionals.read"),professionalQuerySchema.parse(request.query)));
  app.post("/v1/professionals",{preHandler:authenticate,schema:mutation("Create Professional Profile",undefined,{type:"object",required:["staffMemberId"],additionalProperties:false,properties:{staffMemberId:uuid,...presentation}})},async request=>createProfessionalProfile(requireCapability(request,"professionals.create"),request.body,operationId(request.headers)));
  app.get("/v1/professionals/:professionalProfileId",{preHandler:authenticate,schema:{tags:["professionals"],summary:"Get Professional Profile",params:profileParams}},async request=>getProfessionalProfile(requireCapability(request,"professionals.read"),paramsSchema.parse(request.params).professionalProfileId));
  app.patch("/v1/professionals/:professionalProfileId",{preHandler:authenticate,schema:mutation("Update Professional Profile",profileParams,{type:"object",required:["expectedRevision"],additionalProperties:false,properties:{expectedRevision:revision,...presentation}})},async request=>updateProfessionalProfile(requireCapability(request,"professionals.update"),paramsSchema.parse(request.params).professionalProfileId,request.body,operationId(request.headers)));
  app.post("/v1/professionals/:professionalProfileId/deactivate",{preHandler:authenticate,schema:mutation("Deactivate Professional Profile",profileParams,{type:"object",required:["expectedRevision"],additionalProperties:false,properties:{expectedRevision:revision}})},async request=>deactivateProfessionalProfile(requireCapability(request,"professionals.lifecycle"),paramsSchema.parse(request.params).professionalProfileId,request.body,operationId(request.headers)));
  app.post("/v1/professionals/:professionalProfileId/reactivate",{preHandler:authenticate,schema:mutation("Reactivate Professional Profile",profileParams,{type:"object",required:["expectedRevision"],additionalProperties:false,properties:{expectedRevision:revision}})},async request=>reactivateProfessionalProfile(requireCapability(request,"professionals.lifecycle"),paramsSchema.parse(request.params).professionalProfileId,request.body,operationId(request.headers)));
}
