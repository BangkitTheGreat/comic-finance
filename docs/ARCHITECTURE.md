# Architecture

## Scope

Comic Finance is a server-rendered Next.js App Router demo for personal-finance workflows. The application is organized around feature-local domain modules, server actions, and presentational React components.

This document describes the system as implemented. It is not a claim that the application is production-ready.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 and Tailwind CSS 4 |
| Language | TypeScript with strict mode enabled |
| Animation | Motion |
| Testing | Vitest |
| Linting | ESLint with `eslint-config-next` |
| State | Process-local in-memory stores on `globalThis` |

## High-level structure

```text
Browser
  │
  ├─ Client components
  │    ├─ modals, filters, search, interactive forms
  │    └─ invoke server actions through forms
  │
  ▼
Next.js App Router
  ├─ route pages load read models from lib/*/store.ts
  ├─ dashboard layout processes due recurring rules
  └─ server actions validate mutations and revalidate affected routes
  │
  ▼
Domain modules (src/lib)
  ├─ types.ts      entity types and enumerations
  ├─ store.ts      in-memory state and domain operations
  ├─ actions.ts    server-action mutation boundary
  ├─ analytics.ts  derived reporting values
  └─ *.test.ts     behavior and regression tests
```

## Route groups

| Route group | Responsibility |
| --- | --- |
| `src/app/(dashboard)` | Primary finance experience: dashboard, accounts, transactions, budgets, bills, recurring rules, goals, statistics, and profile. |
| `src/app/(auth)` | Presentation-only login and registration screens. |
| `src/app/(onboarding)` | Presentation-only three-step onboarding flow. |

The dashboard layout invokes `connection()` to preserve request-time behavior, processes due recurring rules, reads global preferences, then renders navigation and content.

## Domain-module pattern

Each substantial feature is grouped in `src/lib/<feature>/`.

| File | Responsibility |
| --- | --- |
| `types.ts` | Entity interfaces, allowed values, formatting metadata, and pure helpers. |
| `store.ts` | Seed data, lazy in-memory initialization, reads, writes, and relationship-aware operations. |
| `actions.ts` | `"use server"` mutation functions, input validation, and route revalidation. |
| `*.test.ts` | Unit tests for behavior, validation, and domain invariants. |

Examples:

- `transactions/store.ts` owns transaction creation, updates, deletion, sorting, account totals, and reassignment.
- `transactions/actions.ts` validates a submitted transaction before mutation.
- `transactions/analytics.ts` derives balances, monthly income and expense, category spending, dashboard totals, and statistics series.
- `budget/usage.ts` joins the current month’s expense totals to category limits.

## State lifecycle

Stores use a lazy singleton structure on `globalThis`:

```text
first read or write
  → clone feature seed data
  → save it to globalThis.__<feature>Store
  → subsequent work in the same process shares that store
```

This gives a convenient demo experience during one development-server process, but it does not create durable persistence.

Consequences:

- Restarting the process resets state to seeds.
- Separate Node processes do not share state.
- Multiple deployed instances diverge.
- Concurrent users share the same process-local state when they reach the same instance.
- A serverless environment may reset state on a cold start or route requests to unrelated instances.

`resetDemoData` clears all registered stores so the next access reconstructs seeds. It is intentionally a demo-data reset, not an account deletion operation.

## Mutation flow

For the features using the shared action boundary, mutation follows this path:

```text
FormData
  → field validation
  → domain-store mutation
  → route revalidation
  → UI refresh
```

`runMutation`, `ValidationError`, `textField`, `enumField`, `dateField`, and currency helpers provide a common validation path for accounts, transactions, recurring rules, settings, profile updates, budgets, and currency changes.

Bills and goals currently use their own simpler server-action validation pattern. This is a consistency gap worth addressing before production work.

## Financial calculations

### Currency

All persisted financial values use a USD base unit. Display conversion occurs at the UI boundary:

```text
stored USD amount × selected currency rate = displayed amount
```

Supported display currencies and fixed rates are defined in `src/lib/currency/types.ts`:

| Currency | Rate relative to USD base | Fraction digits |
| --- | ---: | ---: |
| USD | 1 | 2 |
| IDR | 16000 | 0 |
| EUR | 0.92 | 2 |

Rates are fixed application constants and are not market data.

### Account balance

```text
account balance = initial balance + sum(transaction amounts assigned to accountId)
```

Transactions are the source of activity-based balance changes. Account relationships use canonical IDs, never account names.

### Monthly reporting

Monthly income and expenses are derived from transaction dates matching the active month. Income is the sum of positive amounts; expenses are the absolute sum of negative amounts.

### Budget usage

```text
category spending = sum(abs(expense transaction amounts)) for a category in a month
budget percent = category spending / category limit × 100
```

A zero budget does not create a warning. Percentages are not capped; an over-budget category can report a value greater than 100.

## Dashboard composition

The dashboard combines read models from accounts, transactions, goals, bills, budgets, settings, and currency.

Important behaviors:

- Budget alerts require `notifyBudget` and a highest budget usage at or over 80%.
- Unpaid upcoming and overdue bills appear when `notifyBills` is enabled; paid bills do not.
- A dashboard search submits an encoded `q` parameter to `/transactions`.
- A recent-transaction link encodes `transactionId`, which opens the matching transaction in an edit modal.
- Closing a deep-linked edit modal removes only `transactionId`; current `q` and `accountId` filters are retained.
- The dashboard provides explicit empty states for transactions, goals, and bills.

## Recurring-rule processing

Recurring rules are checked in the dashboard layout. For every active valid rule whose due date is today or earlier, the application:

1. adds a transaction with the rule’s category, account ID, amount, and due date;
2. advances the rule’s next due date according to its frequency; and
3. repeats while overdue, capped at 60 postings per request.

The cap prevents an unbounded loop from malformed or extremely stale data. It also means a large backlog may require multiple renders to fully catch up.

## Data integrity controls

The implemented controls include:

- Transaction and recurring actions reject missing accounts.
- Category fields are validated against a canonical category list.
- Account deletion can reassign linked transactions and recurring rules to another account first.
- Transaction search and detail URLs are internal relative routes assembled with `URLSearchParams`.
- Profile reset requires literal `RESET` confirmation server-side.
- Currency input helpers preserve base values for unchanged displayed amounts.

These controls reduce common demo-data inconsistencies but are not a substitute for database constraints, authorization, audit logging, and transactional integrity.

## Extension boundaries

A production persistence migration should replace each `store.ts` implementation with repository methods backed by a database while retaining the public domain APIs where possible. The migration must add:

- user ownership to every financial entity;
- database foreign keys for account relationships;
- atomic account-reassignment and delete transactions;
- decimal or integer-minor-unit money representation;
- migrations, backup, audit history, and authorization checks;
- idempotent background scheduling for recurring rules.
