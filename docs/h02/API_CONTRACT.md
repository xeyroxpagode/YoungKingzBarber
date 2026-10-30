# H02.U01 API contract

Base URL: `http://127.0.0.1:4100`. Swagger UI: `/docs`. Every route is authenticated and derives the Business from the server Actor; clients never submit `businessId`.

## Read routes

- `GET /v1/catalog/services?q=&categoryId=&lifecycle=&publication=&cursor=&limit=`
- `GET /v1/catalog/services/:serviceId`
- `GET /v1/catalog/services/:serviceId/terms/history`
- `GET /v1/catalog/categories?lifecycle=&cursor=&limit=`
- `GET /v1/catalog/categories/:categoryId`

All reads require `catalog.read`. Receptionist receives it by default; Barber does not. Cross-Business identifiers return `NOT_FOUND`.

## Mutation routes

- `POST /v1/catalog/services`
- `PATCH /v1/catalog/services/:serviceId/profile`
- `PUT /v1/catalog/services/:serviceId/terms`
- `POST /v1/catalog/services/:serviceId/publish|unpublish|archive|reactivate`
- `POST /v1/catalog/categories`
- `PATCH /v1/catalog/categories/:categoryId`
- `POST /v1/catalog/categories/:categoryId/archive|reactivate`

Every mutation requires `x-operation-id: <UUID v4>`. The request fingerprint includes the command, path resource identifier and normalized payload. Successful replay returns the stored result without a second domain change or audit event. A FAILED operation is consumed; corrected intent uses a new operation ID.

Commercial Terms input is a full resulting value:

```json
{
  "expectedRevision": 3,
  "terms": {
    "money": { "amountMinor": 1350000, "currency": "ARS" },
    "durationMinutes": 30,
    "preBufferMinutes": 0,
    "postBufferMinutes": 5,
    "conditions": null
  }
}
```

Terms replacement creates an immutable version. An identical full value is a semantic no-op. Money is integer minor units; zero is valid; V1 accepts only ARS.

Stable domain conflicts use HTTP 409: `STALE_REVISION`, `IDEMPOTENCY_CONFLICT`, `SERVICE_NOT_PUBLISHABLE`, `SERVICE_ARCHIVED`, `CATEGORY_UNAVAILABLE`, `CATEGORY_IN_USE`, and `CATEGORY_ARCHIVED`. `SERVICE_NOT_PUBLISHABLE` returns `missingRequirements`; `CATEGORY_IN_USE` returns `publishedServiceCount`.

## Operation recovery

`GET /v1/operations/:operationId` preserves Business-wide behavior for `iam.operations.read`. Other actors may only read an operation whose Business, actor account and operation ID all match them. The restricted representation exposes `operationId`, `commandName`, `status`, `responseStatus`, `responseBody`, `errorCode`, and `completedAt`.
