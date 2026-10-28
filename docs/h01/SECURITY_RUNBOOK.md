# H01 security runbook

## Secrets

Keep the service role key only in `apps/api/.env` or the process environment. Web receives only the project URL and publishable/anon key. Never paste JWTs, cookies, password reset links or invitation links into issues, commits, audit changes or evidence documents.

## Bootstrap

Provisioning and the first Owner are local/internal CLIs with a verified database target. Bootstrap closes once any Owner assignment exists. It prepares a pending assignment; knowing the email does not activate OWNER. Activation requires Supabase identity proof, recipient match and an explicit POST acceptance.

## Sessions and credentials

Every verified JWT resolves an operational `access_session`. A revoked matching session is rejected instead of silently recreated. `sessions_valid_after` blocks older JWTs even if their cryptographic expiry has not elapsed. Password recovery never changes Staff access state or roles.

The Supabase `session_id` is the correlation key. Concurrent first requests are serialized and an ordinary token refresh reuses the open operational row. `CORRELATION_DUPLICATE_RECONCILED` identifies preserved legacy rows that were closed by the V1.1 migration; it does not represent a separate authentic device.

Use Mi cuenta to terminate current, other or all operational sessions. For compromise, use the compromise action: it marks recovery required and revokes every operational session before recovery continues.

## Last Owner

Role removal, suspension, access revocation and offboarding share the valid-Owner definition and a transaction-level Business lock. Pending invitations do not count. Never bypass this by editing tables manually.

## Exceptional recovery

Normal Supabase recovery is mandatory first. If unavailable, an explicitly authorized operator must collect two independent evidence references, an authority reference and a reason, then run `pnpm recovery:admin`. The command opens a case, records the operator/reference/evidence count and blocks sessions. It does not assign OWNER, set a password or expose an HTTP bypass.

## Incident checks

1. Inspect `iam.account_security_states` and active operational sessions.
2. Confirm Staff employment/access and current RoleAssignments.
3. Review paginated `system.audit_events` and the related `operation_id`.
4. Reconcile `UNKNOWN`/`FAILED` provider effects before retrying.
5. Reuse the same operation ID only for byte-equivalent semantic content.
6. Never reactivate suspended or revoked employment as a side effect of credential recovery.

## Backup

Run `pnpm backup:verify`. The procedure targets the verified local container, dumps only H01 schemas without internal Supabase ownership, restores to `youngkingz_h01_restore_cert`, compares critical counts and drops only that temporary database. It refuses to overwrite a pre-existing restore database.
