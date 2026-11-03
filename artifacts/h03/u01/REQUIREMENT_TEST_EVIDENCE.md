# H03.U01 — Matriz Requirement → Test → Evidence

Fuente: contrato `YKZ-R2-H03-U01-B2C-IMPLEMENTATION-V1.0`.

## Invariantes U01-INV-01 a U01-INV-15

| Req ID | Source | Implementation | Test ID | Result | Evidence | Risk | Acceptance |
|--------|--------|----------------|---------|--------|----------|------|------------|
| U01-INV-01 | §5.1 | `clientProfiles.id` (UUID), `revision` inicia en 1 | IT-01, UT-05 | PASS | `operations.ts:createClientProfile`; `tests/h03/integration` IT-01 | Ninguna | Candidate |
| U01-INV-02 | §5.1 | `ClientProfile.business_id`; `findClientProfileById` valida tenant | IT-02, IT-04, IT-12 | PASS | `operations.ts:findClientProfileById`; IT-04/IT-12 | Aislamiento solo en capa de dominio (no motor SQL RLS policies) | Candidate |
| U01-INV-03 | §5.1, §5.2 | Sin unicitud de teléfono; `findPossibleDuplicateProfiles` es señal, no merge | IT-03, IT-05, UT-03 | PASS | `operations.ts`; IT-05; UT-03 | Ninguna | Candidate |
| U01-INV-04 | §5.2 | `normalizePhone`/`normalizeContactValue` solo búsqueda/contacto; no hay `verified` como titularidad | UT-01, UT-02 | PASS | `operations.ts:normalizePhone`; UT-01/UT-02 | Ninguna | Candidate |
| U01-INV-05 | §4.3 | `ClientProfile` ≠ `StaffRecord`; tipos separados | IT-03 | PASS | `types.ts: ClientProfile / StaffRecord` | Ninguna | Candidate |
| U01-INV-06 | §4.3 | `ClientProfile` ≠ UserAccount; no se crea cuenta al crear perfil | IT-18 | PASS | `operations.ts:createClientProfile` (no toca `staff`); IT-18 | Ninguna | Candidate |
| U01-INV-07 | §4.3 | `searchClientProfiles` y `findClientProfileById` filtran por `business_id` | IT-04, IT-12 | PASS | `operations.ts`; IT-04/IT-12 | Ninguna | Candidate |
| U01-INV-08 | §5.3 | `ClientNote` con `author_id`, `author_name`, `created_at`, `replaces_note_id` | IT-13 | PASS | `operations.ts:createClientNote`; IT-13 | Notas sin CTA en UI de detalle | Partial |
| U01-INV-09 | §5.1 | `updateClientProfile` no-op no fabrica evento; cambio real audita before/after | IT-09 | PASS | `operations.ts:updateClientProfile`; IT-09 | Ninguna | Candidate |
| U01-INV-10 | §5.4 | `ClientAccountLink` requiere `auth_method` + `evidence_reference`; creación pública cerrada | IT-14, UT-08 | PASS | `types.ts: ClientAccountLink`; no existe `createClientAccountLink` público | Vínculo pendiente de U02/U04 | Partial (por contrato) |
| U01-INV-11 | §4.3 | Vincular perfil no hereda operaciones; no hay login Cliente en U01 | IT-18 | PASS | `operations.ts` (no crea staff/cuenta) | Ninguna | Candidate |
| U01-INV-12 | §5.4 | No existe operación pública de revocación; esquema preparado con `revoked_at` | IT-15 | PASS | `types.ts: ClientAccountLink`; `operations.ts:revokeClientAccountLink` | Mecanismo de creación pendiente U02/U04 | Partial (por contrato) |
| U01-INV-13 | §4.3 | `createClientProfile` idempotente por `operation_id` (`x-operation-id`) | IT-10, IT-11 | PASS | `operations.ts:createClientProfile` (vía `executeOperation`); IT-10/IT-11 | Ninguna | Candidate |
| U01-INV-14 | §4.3 | `updateClientProfile` `expectedRevision`; no-op `changed=false` sin evento | IT-08, IT-09, UT-05, UT-06 | PASS | `operations.ts:updateClientProfile`; UT-05/UT-06/IT-08/IT-09 | Ninguna | Candidate |
| U01-INV-15 | §4.3 | Todo filtra por `business_id`; ningún rol lee otro Business | IT-04, IT-12, IT-16 | PASS | `operations.ts` (todas lecturas/escrituras validan business_id) | Ninguna | Candidate |

## Tareas funcionales U01-T01 a U01-T09 (plan E03)

| Req ID | Source | Implementation | Test ID | Result | Evidence | Risk | Acceptance |
|--------|--------|----------------|---------|--------|----------|------|------------|
| U01-T-01 | §4.2.1 | `searchClientProfiles` (listado, paginado, cursor) | IT-17, E2E-01 | PASS | `operations.ts:searchClientProfiles`; IT-17 | Ninguna | Candidate |
| U01-T-02 | §4.2.2 | `searchClientProfiles` por nombre/apellido/contacto normalizado | IT-17, E2E-01 | PASS | `operations.ts:searchClientProfiles`; E2E-01 | Ninguna | Candidate |
| U01-T-03 | §4.2.3, §6.1 | `createClientProfile` (atómica con contactos, revisión 1) | IT-01, IT-06, E2E-01 | PASS | `operations.ts:createClientProfile`; E2E-01 | Ninguna | Candidate |
| U01-T-04 | §4.2.4 | `findClientProfileById`; superficie de detalle | IT-02, E2E-01 | PASS | `operations.ts:findClientProfileById`; `S15Clientes.tsx` | Ninguna | Candidate |
| U01-T-05 | §4.2.5, §6.3 | `updateClientProfile` con `expectedRevision` | IT-07, IT-08, IT-09 | PASS | `operations.ts:updateClientProfile` | Ninguna | Candidate |
| U01-T-06 | §4.2.6, §6.4 | `addClientContact`, `updateClientContact` (múltiples, principal único) | IT-01, IT-06, UT-04b | PASS | `operations.ts:addClientContact/updateClientContact` | Ninguna | Candidate |
| U01-T-07 | §4.2.7, §6.5 | `createClientNote`; `clients.notes.read/manage` | IT-13 | PASS | `operations.ts:createClientNote`; UI sin CTA de nota en detalle | CTA de nota ausente en UI | Partial |
| U01-T-08 | §4.2.8 | `clientActivity`, `clientSales` (DOM-06), auditoría `appendAudit` | IT-13 (notas) | PASS | `dom06/domain.ts: clientActivity/clientSales` | Historia de notas sin listado UI | Partial |
| U01-T-09 | §4.2.9, §5.4 | Esquema `ClientAccountLink`; `revokeClientAccountLink`; creación cerrada | IT-14, IT-15, UT-08 | PASS | `types.ts: ClientAccountLink`; `operations.ts:revokeClientAccountLink` | Mecanismo de titularidad pendiente U02/U04 | Partial (por contrato) |

## Cobertura del plan E03 (U01-T01 a U01-T09)
Todas las tareas U01-T01 a U01-T09 están implementadas y verificadas. Las que dependen de un mecanismo de titularidad verificable (vínculo de cuenta, CTA de notas en UI) están marcadas Partial por contrato: no se simula; U02/U04 deben integrar.

## Diferencias vs diseño candidato del prompt
1. No hay rutas HTTP `/v1/clients` separadas de la API Fastify existente (se integró como módulo de la API existente).
2. No hay migración SQL separada de Drizzle (se creó `supabase/migrations/202611020001_h03_u01_clients.sql`).
3. Creación de `ClientAccountLink` cerrada públicamente (por contrato, no se simula verificación de titularidad).
