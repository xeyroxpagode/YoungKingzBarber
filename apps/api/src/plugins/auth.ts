import type { Actor } from "../modules/iam/authorization.js";

declare module "fastify" {
  interface FastifyRequest { actor?: Actor; }
}
