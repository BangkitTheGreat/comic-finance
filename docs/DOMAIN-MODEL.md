# Domain Model and Invariants

## Overview

Comic Finance models a small personal-finance ledger. The canonical data lives in feature stores under `src/lib`; dashboard cards and statistics are derived views rather than independent financial records.

## Entity relationships

```text
Account (id)
  ├─ Transaction.accountId ────────────────┐
  └─ Recurring.accountId ──────────────────┤
                                           ▼
                                      account activity

Transaction.category ──► canonical transaction category
BudgetCategory.category ─► canonical transaction category
Recurring.category ────► canonical transaction category
```

Account IDs are the required relationship key. Account names are display data and must not be used as a foreign key.

## Entities

### Account

| Field | Meaning |
| --- | --- |
| `id` | Stable relationship identifier. |
| `name` | User-facing label. |
| `type` | One of checking, savings, credit, debit, investment, or cash. |
| `initialBalance` | Base USD opening balance; may be negative or zero. |
| `color` | UI color chosen from account type metadata. |

Derived values:

| Value | Formula |
| --- | --- |
| `balance` | `initialBalance + all assigned transaction amounts` |
| `transactionCount` | Number of transactions assigned by `accountId` |
| `recurringCount` | Number of recurring rules assigned by `accountId` |

Deletion rule: an in-use account cannot be removed unless its related transactions and recurring rules are reassigned to a different valid account.

### Transaction

| Field | Meaning |
| --- | --- |
| `id` | Stable transaction identifier. |
| `merchant` | Merchant or counterparty label. |
| `category` | Canonical category name. |
| `accountId` | Required reference to an existing account. |
| `date` | ISO `YYYY-MM-DD` date. |
| `amount` | USD-base signed amount: positive income, negative expense. |
| `note` | Optional user note. |

Mutation rules:

- Create and edit operations require a valid account ID.
- The entered amount is treated as an absolute display value; transaction type determines the stored sign.
- Category values must match the canonical category list.
- A missing transaction ID is an error for edit and delete operations.

### Category

Categories are declared centrally in `src/lib/transactions/types.ts`. Transactions, budgets, and recurring rules all use this vocabulary.

Current category names:

```text
Food & Dining, Salary, Transport, Groceries, Bills,
Entertainment, Shopping, Health, Other
```

This shared vocabulary prevents a budget and a transaction from silently using mismatched names for the same concept.

### Budget category

| Field | Meaning |
| --- | --- |
| `id` | Stable budget row identifier. |
| `category` | Canonical category being limited. |
| `budget` | USD-base monthly limit. Zero pauses the category limit. |
| `color`, `progressColor` | Presentation metadata. |

Derived values are month-specific:

```text
spent = sum(abs(expense amounts)) for transactions in the budget category
percent = spent / budget × 100
```

Rules:

- Income transactions do not count as spending.
- A zero budget reports 0% and does not trigger a warning.
- The percentage is not capped. `130%` means spending is 30% above the configured limit.
- The dashboard warning starts at 80%, provided `notifyBudget` is enabled.

### Bill

| Field | Meaning |
| --- | --- |
| `id` | Stable bill identifier. |
| `name` | Bill label. |
| `amount` | Positive USD-base expected amount. |
| `dueDate` | ISO due date. |
| `icon` | Presentation icon. |
| `paid` | Settlement flag. |

Status is derived from `paid`, the due date, and the local calendar day:

| Status | Condition |
| --- | --- |
| `paid` | `paid === true` |
| `overdue` | unpaid and due date is before today |
| `upcoming` | unpaid and due date is today or later |

Dashboard rule: display all unpaid bills when reminders are enabled, including both upcoming and overdue. The bill page remains the authoritative management surface.

### Recurring rule

| Field | Meaning |
| --- | --- |
| `id` | Stable recurring-rule identifier. |
| `merchant`, `category`, `accountId` | Values used to create a posted transaction. |
| `type` | Income or expense. |
| `amount` | Positive base amount; sign is assigned at posting time. |
| `frequency` | Allowed recurring cadence. |
| `nextDue` | Next scheduled ISO date. |
| `active` | Whether automatic posting is enabled. |

Posting rule:

```text
if active and rule is valid and nextDue <= today:
  create one transaction dated nextDue
  advance nextDue by frequency
```

Processing has a limit of 60 postings per render to prevent infinite loops. Repeated requests may be needed for an unusually old rule.

### Savings goal

| Field | Meaning |
| --- | --- |
| `id` | Stable goal identifier. |
| `name` | Goal label. |
| `target` | Positive desired amount. |
| `current` | Current saved amount. |
| `icon`, `color`, `bgColor` | Presentation metadata. |

Goals are separate planning records. Contributions change the goal’s `current` value; they do not automatically create a transaction or transfer between accounts.

### Profile, settings, and currency

Profile data includes a display name and email. Settings control:

- `notifyBills`: whether dashboard bill reminders render;
- `notifyBudget`: whether dashboard budget warnings render;
- `reduceMotion`: whether motion is minimized in the dashboard layout.

Currency is presentation state. All stored money remains USD-base; changing display currency does not change transaction, account, goal, bill, or budget values.

## Date semantics

Financial records use ISO dates (`YYYY-MM-DD`) rather than timestamps. Date parsing adds `T00:00:00` so calendar comparisons operate in local-date terms instead of accidentally shifting a date through UTC conversion.

Monthly analytics select transactions by the ISO month prefix. For example, `2026-06` includes all transaction dates beginning `2026-06`.

## URL state for transaction navigation

The Transactions page supports these query parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | Initial text filter. |
| `accountId` | Initial canonical account filter. |
| `transactionId` | Opens the matching transaction in the edit modal. |

`transactionId` is transient deep-link state. On modal close it is removed, while the active `q` and `accountId` values remain in the URL.

## Invariants checklist

The following must stay true when extending the system:

1. Never use account names as relationship identifiers.
2. Never create a transaction or recurring rule pointing at an unknown account.
3. Store income as positive and expenses as negative transaction amounts.
4. Derive account balances from opening balance plus transactions; do not duplicate mutable balance state.
5. Derive budget spending from the active month’s expense transactions.
6. Keep budget, recurring, and transaction categories on the canonical category list.
7. Preserve USD-base values when changing only display currency.
8. Do not cap budget percentages in logic; cap only visual progress width if needed.
9. Do not hide overdue unpaid bills when rendering dashboard reminders.
10. Treat `transactionId` as removable navigation state, not a persisted transaction attribute.
11. Treat all current store contents as demo state, not a durable ledger.
