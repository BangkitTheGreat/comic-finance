# Development and Verification Guide

## Environment

Comic Finance is a Node.js / npm project. Dependencies are locked in `package-lock.json`.

```bash
npm ci
```

Use `npm ci` for a clean, reproducible local install. If `package.json` and `package-lock.json` are intentionally changed together, regenerate the lockfile with `npm install` and commit both files.

## Run the application

Development server:

```bash
npm run dev
```

Default address: http://localhost:3000

Production-style local run:

```bash
npm run build
npm run start
```

## Quality gates

Run all checks before merging a behavior change:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected results at the documented repository state:

- Vitest executes the full test suite.
- TypeScript completes without diagnostics.
- ESLint completes with no errors. A framework warning about font placement may remain until the font setup is refactored.
- `next build` completes and validates the production route graph.

## Test organization

Tests live next to the modules they exercise under `src/lib/**`.

Current coverage includes behavior around:

- accounts, account-currency conversion, reassignment, and deletion safeguards;
- transactions, flow, validation, month boundaries, and analytics;
- budgets and monthly category spending;
- currency conversion and input preservation;
- dates and timezone-sensitive month handling;
- profile validation and demo reset behavior;
- transaction-search and deep-link URL construction;
- dashboard budget-warning percentage behavior.

Vitest configuration pins the test timezone to `Asia/Jakarta` to make date-dependent tests reproducible.

## Manual smoke test

After starting `npm run dev`, perform the following in a browser.

### Dashboard and transaction navigation

1. Open `/`.
2. Submit a search from the desktop dashboard header.
3. Confirm the application opens `/transactions?q=<encoded-query>`.
4. Verify the matching query is present in the Transactions search input and filters its rows.
5. Click a recent transaction on the dashboard.
6. Confirm the URL contains `transactionId=<id>` and the edit modal opens for that transaction.
7. Start from a URL such as `/transactions?accountId=a1&q=Joe&transactionId=t1`.
8. Close the modal.
9. Confirm the modal closes and the URL retains `accountId=a1` and `q=Joe` while removing `transactionId`.

### Transaction integrity

1. Create a transaction against a selected account.
2. Confirm the account balance changes by the transaction amount.
3. Edit the transaction’s amount, account, and type; confirm balances update correctly.
4. Delete the transaction; confirm the balance is restored.
5. Switch the display currency and reopen a transaction; verify currency-specific input formatting and unchanged base value.

### Account integrity

1. Create at least two accounts.
2. Attempt to delete an account with transactions or recurring rules.
3. Confirm the UI requires moving linked records first.
4. Reassign records to another valid account and then remove the original account.
5. Verify affected transactions and recurring rules now use the replacement account ID.

### Budget behavior

1. Create expense transactions in the current month for a budgeted category.
2. Confirm the Budget page’s spending reflects only current-month expenses.
3. Reach 80% of the category limit and confirm the dashboard warning appears when budget notifications are enabled.
4. Exceed the limit and confirm the percent remains above 100 rather than being clipped in displayed logic.
5. Disable budget notifications in Profile settings and confirm the warning does not render.

### Bills

1. Create unpaid bills due today, in the future, and in the past.
2. Confirm each status is labelled appropriately on the Bills page.
3. Confirm upcoming and overdue unpaid bills both appear on the dashboard when bill reminders are enabled.
4. Mark a bill paid and confirm it no longer appears in the dashboard reminder card.

### Recurring rules

1. Create a valid recurring rule with an existing account ID.
2. Set its due date to today or earlier.
3. Render a dashboard route.
4. Confirm exactly one transaction is posted per due occurrence and `nextDue` advances.
5. Disable the rule and confirm no further posting occurs.

## Adding a feature

1. Identify the responsible feature directory under `src/lib`.
2. Define or update domain types before modifying components.
3. Write a focused failing Vitest test for new behavior.
4. Implement the smallest domain/store/action change that makes it pass.
5. Add or update the server-rendered page and client component as needed.
6. Maintain canonical IDs for relationships and canonical categories for category references.
7. Run the quality gates and relevant browser smoke tests.
8. Document externally visible behavior and any new invariants.

## State reset during development

Use the Profile page’s demo reset panel and type `RESET` exactly. This clears process-local stores so the next request rebuilds their seed data.

Restarting the development server has a similar effect because stores are in memory. Neither mechanism is a user-specific reset.

## Security and privacy posture

The application currently treats all data as demo data. It is not suitable for real personal financial information.

Not implemented:

- authentication or session management;
- authorization and multi-tenant data ownership;
- durable encrypted storage;
- secure secrets management for financial integrations;
- account aggregation or bank APIs;
- audit logs and tamper-evident history;
- CSRF/session hardening appropriate for real authenticated mutations;
- rate limiting, monitoring, backups, or incident response.

Do not add bank credentials, API keys, actual account numbers, or personal financial records to seed data, source files, issue descriptions, screenshots, or tests.

## Production readiness

Before any real deployment, replace in-memory stores with a durable data layer and address the following requirements:

1. Add authenticated users and ownership fields to all entities.
2. Enforce authorization on every read and mutation.
3. Use database foreign keys for account, transaction, and recurring-rule relationships.
4. Use integer minor units or a decimal database type for money.
5. Make account deletion/reassignment transactional.
6. Move recurring processing to a durable, idempotent scheduled job.
7. Store and apply currency rates with timestamps and a clear accounting policy.
8. Add audit logging, backups, migrations, retention policy, and data-export/delete controls.
9. Add error tracking, request logging, monitoring, and rate limiting.
10. Define a license, privacy policy, and security disclosure process.

## Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Changes disappear after restart | State is stored only in memory. | Expected for this demo; use a database for persistence. |
| A transaction does not appear in an account | The account filter or account ID may differ. | Verify `accountId`, not an account name. |
| Budget warning is absent | Notifications are disabled, nothing reached 80%, or spending is outside the current month. | Check Profile settings, dates, category, and expense sign. |
| A bill is absent from dashboard | It is paid or bill reminders are disabled. | Check its paid state and `notifyBills`. |
| A recurring rule did not post | It may be inactive, not due, invalid, or tied to a missing account. | Validate the rule, render dashboard, and inspect `nextDue`. |
| `npm ci` rejects the lockfile | `package.json` and `package-lock.json` are out of sync. | Run `npm install`, review changes, then commit both files. |
| Browser state seems inconsistent | A dev server restart or a separate Node process reset state. | Keep one server process for the demo session or reset intentionally. |
