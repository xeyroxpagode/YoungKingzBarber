import type { Actor } from "../iam/authorization.js";
import { DomainError } from "@youngkingz/contracts";
import { stableHash } from "../../lib/crypto.js";
import { database } from "../../lib/runtime.js";
import type { TransactionSql } from "postgres";

type Tx = TransactionSql<Record<string, never>>;

export async function executeOperation<T>(input: { operationId: string; command: string; actor: Actor; payload: unknown }, handler: (tx: Tx) => Promise<T>): Promise<{ data: T; replayed: boolean }> {
  const requestHash = stableHash({ command: input.command, payload: input.payload });
  return database.client.begin(async (tx) => {
    const existing = await tx`select request_hash, status::text status, response_body from system.operation_attempts where operation_id = ${input.operationId} for update`;
    if (existing.length) {
      if (existing[0]!.request_hash !== requestHash) throw new DomainError("IDEMPOTENCY_CONFLICT", "operation_id was already used with different content", 409);
      if (existing[0]!.status === "SUCCEEDED") return { data: existing[0]!.response_body as T, replayed: true };
      throw new DomainError("CONFLICT", "The operation is already being reconciled", 409);
    }
    await tx`insert into system.operation_attempts(operation_id,business_id,actor_account_id,command_name,request_hash) values (${input.operationId},${input.actor.businessId},${input.actor.accountId},${input.command},${requestHash})`;
    try {
      const data = await handler(tx);
      await tx`update system.operation_attempts set status='SUCCEEDED',response_status=200,response_body=${JSON.stringify(data)}::jsonb,completed_at=now() where operation_id=${input.operationId}`;
      return { data, replayed: false };
    } catch (error) {
      const code = error instanceof DomainError ? error.code : "INTERNAL_ERROR";
      await tx`update system.operation_attempts set status='FAILED',error_code=${code},completed_at=now() where operation_id=${input.operationId}`;
      throw error;
    }
  });
}

export async function audit(tx: Tx, input: { actor: Actor; operationId: string; action: string; capability: string; resourceType: string; resourceId?: string; changes?: object; outcome?: string }) {
  await tx`insert into system.audit_events(business_id,actor_account_id,operation_id,action,capability,scope,resource_type,resource_id,outcome,changes)
    values (${input.actor.businessId},${input.actor.accountId},${input.operationId},${input.action},${input.capability},${JSON.stringify({type:"BUSINESS",businessId:input.actor.businessId})}::jsonb,${input.resourceType},${input.resourceId ?? null},${input.outcome ?? "SUCCEEDED"},${JSON.stringify(input.changes ?? {})}::jsonb)`;
}

export function operationId(headers: Record<string, unknown>): string {
  const value = headers["x-operation-id"];
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new DomainError("VALIDATION_ERROR", "x-operation-id must be a UUID v4", 400);
  return value;
}
