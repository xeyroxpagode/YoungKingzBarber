# H02.U01 database contract

Migration `202610300001_h02_u01_catalog.sql` creates the bounded private schema `catalog`.

## Tables

- `catalog.service_categories`: Business-owned taxonomy, ACTIVE/ARCHIVED lifecycle, revision and normalized active-name uniqueness.
- `catalog.services`: stable Service identity, mutable profile, lifecycle/publication, aggregate revision and the sole CURRENT Terms pointer.
- `catalog.service_terms_versions`: immutable price/duration/buffer history with monotonic version number and no mutable lifecycle/revision columns.

Composite foreign keys enforce Business-safe Service→Category, Terms→Service and Service→CURRENT Terms relations. The CURRENT pointer includes `(business_id, service_id, terms_id)`, so it cannot reference another Service or Business. PostgreSQL checks enforce ARS, nonnegative integer minor money/buffers, positive duration and bounded names/descriptions. A trigger rejects UPDATE of confirmed Terms versions.

Publishing and Category archival lock in the order Category→Service. Category archival never rewrites Services; unpublished Services become incomplete derivatively. Service archival atomically forces UNPUBLISHED. There are no functional hard-delete routes.

RLS is enabled on every Catalog table. `anon` and `authenticated` have no direct schema/table access. `service_role` is available to Fastify, which applies actor tenancy and capability authorization.
