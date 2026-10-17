# ClickHouse Database Optimizations, Indexing & Materialized Views

This document outlines the performance optimizations, indexing strategies, and Materialized Views implemented in the **Expense Tracker FS** ClickHouse backend.

---

## 1. Architectural Overview

Traditional relational databases (PostgreSQL/MySQL) store data in rows and support multi-statement ACID transactions. ClickHouse is a columnar OLAP database designed for fast analytical queries and bulk inserts. Because ClickHouse does not support traditional multi-table ACID transactions, application-level updates to secondary tables (e.g. manually recalculating `totalExpense` on `users` whenever an expense is added or deleted) introduce data drift, race conditions, and heavy write amplification.

To achieve high throughput, strict consistency, and sub-millisecond aggregations, the backend implements:
1. **Specialized Table Engines** (`MergeTree`, `ReplacingMergeTree`, `SummingMergeTree`).
2. **Data Skipping Indexes** (Bloom Filters, Set Indexes).
3. **Incremental Materialized Views** with pre-aggregated summary storage.
4. **Compensating Mutation Handling** for real-time consistency on record deletion.

---

## 2. Table Engines & Primary Sorting Keys

Each table is configured with an engine and sorting key tailored to its access patterns:

| Table | Engine | Primary Key (`ORDER BY`) | Rationale |
|---|---|---|---|
| `users` | `ReplacingMergeTree(version)` | `id` | Enables point-in-time updates by version increment while collapsing duplicates in background merges. Queries use `FINAL` to always read the latest record state. |
| `expenses` | `MergeTree()` | `(userId, createdAt)` | Optimizes user expense listing (`WHERE userId = ? ORDER BY createdAt DESC`) and interval date range scans. |
| `orders` | `ReplacingMergeTree(version)` | `id` | Handles payment status transitions (`created` -> `success`/`failed`) without in-place row locks. |
| `forgot_password_requests` | `ReplacingMergeTree(version)` | `id` | Tracks password reset link active/inactive state. |
| `expenses_urls` | `MergeTree()` | `(userId, createdAt)` | Append-only log of exported report URLs. |
| `user_expense_summary` | `SummingMergeTree((totalExpense, totalCount))` | `userId` | Automatically sums expense amounts and counts per user during background block merges. |
| `user_category_daily_expenses` | `SummingMergeTree((totalAmount, transactionCount))` | `(userId, expenseDate, category)` | Automatically aggregates spending by user, date, and category for analytics. |

---

## 3. Data Skipping Indexes

Because ClickHouse evaluates sorting keys primarily from left-to-right, secondary filter columns need data skipping indexes to avoid full table scans:

### 3.1. Bloom Filter Indexes (`TYPE bloom_filter() GRANULARITY 1`)
A Bloom filter index checks whether a value *might* be in a data granule (8,192 rows) or *definitely isn't*, allowing ClickHouse to skip entire blocks of storage:
* **`users.email` (`idx_users_email`)**: Used for instant authentication lookups (`WHERE email = ?`) without having to reorder the table by email.
* **`expenses.id` (`idx_expenses_id`)**: The `expenses` table is sorted by `(userId, createdAt)`. Point lookups by `id` (e.g. for `deleteExpense` or `findById`) skip non-matching blocks via this bloom filter.
* **`orders.orderId` (`idx_orders_order_id`)**: Fast order verification lookups triggered by Razorpay callbacks.
* **`orders.userId` (`idx_orders_user_id`)**: Fast lookup of orders by user.
* **`forgot_password_requests.userId` (`idx_fpr_user_id`)**: Fast lookup of active reset tokens for a user.

### 3.2. Set Index (`TYPE set(10) GRANULARITY 1`)
* **`expenses.category` (`idx_expenses_category`)**: Stores an explicit set of distinct category values present in each granule. If a queried category (e.g. `WHERE category = 'fuel'`) is not present in a granule's set, the entire granule is skipped during execution.

---

## 4. Materialized Views

ClickHouse Materialized Views operate as **insert-time triggers**. When a block of rows is inserted into the source table (`expenses`), the query defined in the view executes *only* on that incoming block and writes pre-aggregated results into a destination `SummingMergeTree` table.

```
       [ Client Request ]
               │
               ▼
      INSERT INTO expenses
               │
       ┌───────┴────────────────────────┐
       │ (Automatic ClickHouse Trigger) │
       ▼                                ▼
 user_expense_summary_mv   user_category_daily_expenses_mv
       │                                │
       ▼                                ▼
user_expense_summary       user_category_daily_expenses
(SummingMergeTree)          (SummingMergeTree)
```

### 4.1. `user_expense_summary_mv`
* **Destination Table:** `user_expense_summary`
* **Source:** `expenses`
* **Purpose:** Real-time leaderboard rankings and user lifetime spending.
* **Definition:**
  ```sql
  CREATE TABLE IF NOT EXISTS user_expense_summary (
    userId UUID,
    totalExpense Float64,
    totalCount UInt64
  ) ENGINE = SummingMergeTree((totalExpense, totalCount))
  ORDER BY userId;

  CREATE MATERIALIZED VIEW IF NOT EXISTS user_expense_summary_mv
  TO user_expense_summary AS
  SELECT
    userId,
    sum(amount) AS totalExpense,
    count() AS totalCount
  FROM expenses
  GROUP BY userId;
  ```
* **Leaderboard Query in Node.js:**
  ```javascript
  SELECT 
    u.name,
    coalesce(sum(s.totalExpense), 0) AS totalExpense
  FROM users u FINAL
  LEFT JOIN user_expense_summary s ON u.id = s.userId
  GROUP BY u.name, u.id
  ORDER BY totalExpense DESC
  LIMIT 100
  ```

### 4.2. `user_category_daily_expenses_mv`
* **Destination Table:** `user_category_daily_expenses`
* **Source:** `expenses`
* **Purpose:** High-speed interval reporting (`daily`, `weekly`, `monthly`, `yearly`) and category breakdown charts.
* **Definition:**
  ```sql
  CREATE TABLE IF NOT EXISTS user_category_daily_expenses (
    userId UUID,
    expenseDate Date,
    category String,
    totalAmount Float64,
    transactionCount UInt64
  ) ENGINE = SummingMergeTree((totalAmount, transactionCount))
  ORDER BY (userId, expenseDate, category);

  CREATE MATERIALIZED VIEW IF NOT EXISTS user_category_daily_expenses_mv
  TO user_category_daily_expenses AS
  SELECT
    userId,
    toDate(createdAt) AS expenseDate,
    category,
    sum(amount) AS totalAmount,
    count() AS transactionCount
  FROM expenses
  GROUP BY userId, expenseDate, category;
  ```
* **Category Summary Query in Node.js:**
  ```javascript
  SELECT 
    category,
    sum(totalAmount) AS totalSpent,
    sum(transactionCount) AS totalTransactions
  FROM user_category_daily_expenses
  WHERE userId = {userId:UUID}
    AND expenseDate >= {startDate:Date}
    AND expenseDate <= {endDate:Date}
  GROUP BY category
  ORDER BY totalSpent DESC
  ```

---

## 5. Consistency & Deletion Handling (Compensating Pattern)

### The Problem
ClickHouse Materialized Views are stream-oriented and trigger **strictly on `INSERT`**, not on mutations (`ALTER TABLE DELETE`). 

### The Solution: Compensating Writes
When a user deletes an expense in `controllers/expense.js`, rather than performing heavy table-wide mutations or leaving aggregated views out of sync, the application:
1. Deletes the raw expense via `ALTER TABLE expenses DELETE WHERE id = ?`.
2. Emits compensating negative values directly into the `SummingMergeTree` destination tables:
   * `user_expense_summary`: `{ totalExpense: -expense.amount, totalCount: 0 }`
   * `user_category_daily_expenses`: `{ totalAmount: -expense.amount, transactionCount: 0 }`

Because `SummingMergeTree` natively merges numerical additions (including negative numbers), any subsequent query using `sum(totalExpense)` or `sum(totalAmount)` produces the exact, adjusted real-time balance instantly without locking or full rebuilds.

---

## 6. Query Best Practices Checklist

1. **Always use aggregate functions on SummingMergeTree queries:**
   Even though ClickHouse merges parts in the background, rows with the same key may exist across unmerged data parts. Always wrap queries with `sum()` and `GROUP BY`:
   ```sql
   -- Correct:
   SELECT sum(totalExpense) FROM user_expense_summary WHERE userId = ... GROUP BY userId;

   -- Incorrect:
   SELECT totalExpense FROM user_expense_summary WHERE userId = ...;
   ```
2. **Use `FINAL` for `ReplacingMergeTree` point lookups:**
   When reading single users or orders where unmerged versions could be present, append `FINAL` (e.g. `SELECT * FROM users FINAL WHERE id = ?`).
3. **Filter using sorting prefix columns first:**
   Queries against `expenses` should always include `userId` in the `WHERE` clause so ClickHouse can leverage the primary index (`ORDER BY (userId, createdAt)`).
