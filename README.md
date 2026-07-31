# Property Rental Management System API

A backend API for managing rental properties, units, leases, and payments.
Built with **NestJS**, **Prisma**, and **PostgreSQL** for the SAMAHAN SysDev Backend Assessment.

---

## Instructions for Running the Application

### Prerequisites

- Node.js v20.19+ (v22 LTS recommended)
- PostgreSQL database (local or hosted, e.g., Neon)

### 1) Clone and install

```bash
git clone <YOUR_REPO_URL>
cd <YOUR_REPO_FOLDER>
npm install
```

### 2) Environment variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Set the values in `.env` (see `.env.example` for the full list):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="7d"
PORT=3000
```

> **Note:** `.env` is gitignored. Never commit it — it contains database credentials and the JWT signing secret.

### 3) Generate Prisma Client

```bash
npx prisma generate
```

### 4) Database setup (migrations)

Ensure `DATABASE_URL` points to a valid PostgreSQL database, then run:

```bash
npx prisma migrate deploy
```

(Optional) Prisma Studio:

```bash
npx prisma studio
```

### 5) Start the server

```bash
npm run start:dev
```

Swagger UI:

- http://localhost:3000/api (or `http://localhost:<PORT>/api` if you set `PORT` in `.env`)

---

## Database Setup Instructions

1. Create an empty PostgreSQL database.
2. Set `DATABASE_URL` in `.env`.
3. Run:

```bash
npx prisma generate
npx prisma migrate deploy
```

This creates all required tables based on the committed migration history in `prisma/migrations/`.

---

## Brief Architecture Explanation

- **Controllers** — handle HTTP routing and DTO binding only.
- **Services** — business logic: ownership checks, RBAC rules, transactions.
- **PrismaService** — database access via Prisma Client, injected via NestJS DI, globally available via `@Global()` `PrismaModule`.
- **Authentication** — JWT via Passport (`JwtStrategy`, `JwtAuthGuard`). Tokens are signed with `sub`, `email`, and `role`, and expiry is configurable via `JWT_EXPIRES_IN`.
- **Authorization** — Role-based access control using `RolesGuard` + `@Roles()` decorator. Guard order matters: `JwtAuthGuard` runs before `RolesGuard` so `req.user` is populated first.
- **Validation** — `class-validator` DTOs enforced via a global `ValidationPipe` (`whitelist: true, transform: true`).
- **Documentation** — Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`) across all endpoints.

### Database Design

```
User (OWNER) ── Property ── Unit ── Lease ── Payment
                                      │
User (TENANT) ─────────────────────── ┘
```

- `Property.ownerId` → `User.id`
- `Unit.propertyId` → `Property.id`
- `Lease.unitId` → `Unit.id`
- `Lease.tenantId` → `User.id`
- `Payment.leaseId` → `Lease.id`

Ownership is always checked by traversing these relationships (e.g., a Unit's owner is found via `unit.property.ownerId`, a Lease's owner via `lease.unit.property.ownerId`).

---

## Available API Endpoints

All protected endpoints require:
`Authorization: Bearer <access_token>`

### Auth

| Method | Endpoint         | Access |
| ------ | ---------------- | ------ |
| POST   | `/auth/register` | Public |
| POST   | `/auth/login`    | Public |

### Users

| Method | Endpoint    | Access        |
| ------ | ----------- | ------------- |
| GET    | `/users/me` | Authenticated |

### Properties

| Method | Endpoint          | Access       |
| ------ | ----------------- | ------------ |
| POST   | `/properties`     | OWNER, ADMIN |
| GET    | `/properties`     | OWNER, ADMIN |
| GET    | `/properties/:id` | OWNER, ADMIN |
| PATCH  | `/properties/:id` | OWNER, ADMIN |
| DELETE | `/properties/:id` | OWNER, ADMIN |

### Units

| Method | Endpoint                        | Access       |
| ------ | ------------------------------- | ------------ |
| POST   | `/properties/:propertyId/units` | OWNER, ADMIN |
| GET    | `/properties/:propertyId/units` | OWNER, ADMIN |
| GET    | `/units/:id`                    | OWNER, ADMIN |
| PATCH  | `/units/:id`                    | OWNER, ADMIN |
| DELETE | `/units/:id`                    | OWNER, ADMIN |

### Leases

| Method | Endpoint      | Access                                   |
| ------ | ------------- | ---------------------------------------- |
| POST   | `/leases`     | OWNER, ADMIN                             |
| GET    | `/leases`     | OWNER, ADMIN, TENANT (scoped by role)    |
| GET    | `/leases/:id` | OWNER, ADMIN, TENANT (ownership checked) |
| PATCH  | `/leases/:id` | OWNER, ADMIN                             |
| DELETE | `/leases/:id` | OWNER, ADMIN                             |

### Payments

| Method | Endpoint        | Access                                   |
| ------ | --------------- | ---------------------------------------- |
| POST   | `/payments`     | OWNER, ADMIN                             |
| GET    | `/payments`     | OWNER, ADMIN, TENANT (scoped by role)    |
| GET    | `/payments/:id` | OWNER, ADMIN, TENANT (ownership checked) |
| PATCH  | `/payments/:id` | OWNER, ADMIN                             |
| DELETE | `/payments/:id` | OWNER, ADMIN                             |

---

## Assumptions / Design Decisions

- **Authentication is required.** The prompt states information should be protected from users who shouldn't access it, which implies auth is necessary even though it wasn't explicitly mandated.
- **Three roles:** `ADMIN`, `OWNER`, `TENANT`.
  - `ADMIN` — full access to all resources.
  - `OWNER` — can only manage properties/units/leases/payments they own.
  - `TENANT` — can only view their own leases and payments; cannot create, update, or delete.
- **Role assignment is manual.** New users default to `TENANT` on registration. Promotion to `OWNER`/`ADMIN` is done directly in the database — no role-management endpoint exists in this submission.
- **One active lease per unit.** Creating a lease on a unit that already has an `ACTIVE` lease returns `409 Conflict`.
- **Unit status is system-derived, not client-settable:**
  - Units default to `VACANT`.
  - Creating a lease sets the unit to `OCCUPIED` (wrapped in a Prisma transaction with lease creation).
  - Deleting a lease sets the unit back to `VACANT` (wrapped in a Prisma transaction with lease deletion).
- **`tenantId` is supplied in the Lease creation DTO**, not derived from the requester, because an OWNER/ADMIN creates a lease on behalf of a tenant — unlike `ownerId` on Property, which is always derived from the authenticated user.
- **Payments are recorded manually.** No automated billing generation or scheduled overdue detection is implemented.
- **`coveringMonth` instead of a simple due date** on Payment — alongside `paymentDate` (when the payment was recorded, defaults to `now()`), `coveringMonth` represents which rental period a payment applies to, which matters for monthly rent tracking.
- **404 before 403 pattern** — used consistently across services (Property, Unit, Lease, Payment): if a resource doesn't exist, return `404` before checking ownership; only return `403` once existence is confirmed.

---

## Known Limitations

- No role management endpoint — promoting a user to `OWNER`/`ADMIN` requires direct database access.
- No formal lease termination — leases can only be deleted, not transitioned to a `TERMINATED` status while preserving history.
- No automated overdue detection — `PaymentStatus` must be updated manually; no scheduled job checks for late payments.
- No overpayment reconciliation — payments accept any amount without validating against remaining lease balance.
- No pagination or filtering on list endpoints (`GET /properties`, `GET /leases`, etc.).
- No real automated tests — only the leftover NestJS scaffold `test/app.e2e-spec.ts` stub exists (it targets a non-existent root route and would fail). Manual testing was performed for all endpoints via Swagger, including auth, RBAC, ownership checks, and error responses (400/401/403/404/409).

---

## Improvements With More Time

- Add an admin-only role management endpoint.
- Add a formal lease termination flow (`ACTIVE → TERMINATED`) instead of hard deletion, preserving lease history.
- Add scheduled overdue payment detection (cron job).
- Add pagination, filtering, and sorting on list endpoints.
- Add a `MaintenanceRequest` module (was scoped out to meet the deadline).
- Add Jest unit tests for services (ownership logic, business rules) and e2e tests for critical flows.
- Add Docker + docker-compose for one-command local setup.

---

## AI Usage

**Tool used:** ChatGPT / Claude (used as a pair-programming and code-review assistant throughout development)

**How AI assisted:**

- Provided reference implementations for NestJS patterns (guards, strategies, DTOs) that were then hand-typed and adapted rather than copy-pasted.
- Helped explain and validate architectural decisions (e.g., relational modeling, transaction usage, RBAC design).
- Acted as a code reviewer after each module was written, flagging bugs (e.g., missing `await` on a Prisma transaction, incorrect route prefixing) before testing.

**AI suggestions that were modified or rejected (3 examples):**

1. **Rejected:** Storing property ownership as an array field on `User` (e.g., `propertyIds: string[]`) instead of a relational foreign key.
   - **Why rejected:** This breaks referential integrity — nothing would keep the array in sync if a property were deleted, and it prevents proper JOIN-based queries. The final design uses `Property.ownerId` as a foreign key, which is the standard relational approach for a one-to-many relationship.

2. **Modified:** An initial suggestion to track payments with only a simple `dueDate: DateTime` field.
   - **Why modified:** A due date alone doesn't clearly communicate which rental period a payment covers. Changed to `coveringMonth: DateTime`, which is more semantically accurate for monthly rent tracking.

3. **Modified:** Initial `UnitsController` used `@Controller('units')` as a class-level prefix while also defining full nested paths (e.g., `@Post('properties/:propertyId/units')`) in each method.
   - **Why modified:** NestJS concatenates the class prefix with method paths, so this produced incorrect routes like `/units/properties/:propertyId/units`. Changed to `@Controller()` with no prefix so each method's full path decorator is used as-is, correctly supporting both nested and flat route patterns.

**How AI output was reviewed and verified:**

- All code was manually typed, not copy-pasted, to ensure understanding of every line.
- Every endpoint was tested manually via Swagger UI, covering happy paths and edge cases (invalid input, wrong role, non-existent resources, ownership violations).
- Ownership and RBAC logic was verified by testing with multiple accounts across all three roles (ADMIN, OWNER, TENANT).
- Database consistency was verified using Prisma Studio after key operations (e.g., confirming Unit status flips correctly when a Lease is created or deleted).

---

## Author

**[Terenz Jahred C. Dantes]**
SAMAHAN SysDev Backend/DevOps Engineering Applicant
