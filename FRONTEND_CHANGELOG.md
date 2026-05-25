# Frontend Integration Changelog

Append-only log of backend changes that the frontend must react to. **Newest entries on top.** Each entry tells you exactly what to change in the frontend and where.

> The long-form reference doc is `FRONTEND_BACKEND_ALIGNMENT.md`. **This file overrides it** wherever they disagree. Treat this file as the source of truth for what the API currently looks like.

---

## Legend

| Tag | Meaning |
|---|---|
| `BREAKING` | Frontend will get 400/500 or silently malformed data if not updated. |
| `BEHAVIOR` | Frontend still works but loses or changes functionality. |
| `ADDITIVE` | Pure addition. Existing frontend keeps working untouched. |

---

## Entry template (copy-paste for every future change)

```markdown
## YYYY-MM-DD — <one-line summary>  [BREAKING | BEHAVIOR | ADDITIVE]

**Backend change**
- <bullet points of what changed in the API>

**Frontend action items**
1. ...
2. ...

**Affected endpoints**
- `METHOD /path`

**Affected frontend surfaces**
- <route or component name>

**Request / response diff**
\`\`\`diff
- old shape
+ new shape
\`\`\`
```

---

## 2026-05-24 — Strategy performance metrics redefined: day-1 anchoring + USD drawdown + closed-only win rate  [BEHAVIOR]

**Backend change**

Field shapes are unchanged (no fields added or removed, no types changed), but the **values mean different things now**. All trade counts and drawdown values on `GET /strategies/:id/performance` and `GET /strategies/public/:id/summary` are now anchored to **day 1** = the timestamp of the earliest `strategy_performance` snapshot for that strategy (dynamic per strategy; happens to be ~April 20 in current data, but it is NOT a hard-coded date).

- `totalTrades` — now counts trades with `entry_time >= day1` only (was: all trades ever, unfiltered).
- `winRate` — now `winning_closed / total_closed`. Open and cancelled trades are excluded from both the numerator and the denominator (was: `winning_closed / all_trades`, which dragged the rate down whenever there were open positions).
- `winningTrades` / `losingTrades` — semantics unchanged (closed trades with `pnl > 0` / `pnl < 0`), but the underlying trade set is now restricted to "since day 1".
- `maxDrawdown` — **unit changed from percent to absolute USD**, and **sign changed from negative to positive**. Now computed as the largest peak-to-trough drop on the `strategy_performance.total_pnl` series since day 1. Example: `120.50` means the cumulative PnL fell $120.50 from a prior peak at some point.
- `currentDrawdown` — same unit/sign change. Now `peak_so_far − latest_total_pnl` in USD (non-negative). Equals `0` when the latest snapshot is at the all-time peak.
- `totalPnL`, `unrealizedPnL`, `realizedPnL`, `lastUpdated` — unchanged.

Notable property of the new `maxDrawdown`: it is **monotonic** — it never decreases over time. Once a $100 drawdown has occurred since day 1, it stays in the metric forever.

**Frontend action items**

1. **Stop rendering `maxDrawdown` / `currentDrawdown` with a `%` suffix.** Render them as USD currency (e.g. `$120.50`) on the performance panel (`/admin/strategies/:id`) and the public summary card.
2. **Stop adding a minus sign** in front of the drawdown value — the backend already returns a positive number that represents "how much was lost from the peak." If your UI uses red coloring for negative numbers, key the coloring off "drawdown > 0" instead of "value < 0".
3. **Update TypeScript types** — change the inline comments on `maxDrawdown` / `currentDrawdown` from `// %` to `// USD, non-negative`. See full type block below.
4. **Re-explain win rate in any tooltip/legend** that says "winning / total trades" — it's now "winning / total closed trades". An execution that's still open no longer pushes the rate down while waiting to close.
5. **Re-explain `totalTrades` in any tooltip/legend** that says "all trades" — it's now "trades since day 1" (where day 1 = first record we have for the strategy).
6. **If you cache `maxDrawdown` and check for "improved" / "worsened"**, drop that comparison — the value can only stay flat or increase. There is no "drawdown recovered" state at the API level; you'd need to look at `currentDrawdown` for that ("currently 0" = currently at peak).
7. **Equity-curve chart**: no change required. `/strategies/:id/equity-curve` endpoint is unaffected.

**Affected endpoints**

- `GET /strategies/:id/performance` — same shape, redefined values
- `GET /strategies/public/:id/summary` — same shape, redefined values

**Affected frontend surfaces**

- Admin Dashboard → Performance panel (`/admin/strategies/:id`) — drawdown rendering and win-rate tooltip
- Admin Dashboard → Strategy List (`/admin/dashboard`) — if any column shows drawdown or win rate
- Public Website → Strategy Showcase / Hero card (`/`, `/strategies`) — drawdown rendering and win-rate tooltip

**Value diff (`GET /strategies/:id/performance`)**
```diff
{
  "strategyId": "...",
  "totalPnL": 1550.00,
  "unrealizedPnL": 250.00,
  "realizedPnL": 1300.00,
- "winRate": 0.65,           // winning_closed / ALL trades (incl. open)
+ "winRate": 0.65,           // winning_closed / total_closed (open & cancelled excluded)
- "totalTrades": 100,        // all trades ever
+ "totalTrades": 100,        // trades with entry_time >= day1
  "winningTrades": 65,
  "losingTrades": 35,
- "maxDrawdown": -8.5,       // percent, negative
+ "maxDrawdown": 120.50,     // USD, non-negative (peak-to-trough since day 1)
- "currentDrawdown": -2.1,   // percent, negative
+ "currentDrawdown": 35.00,  // USD, non-negative (peak − latest)
  "lastUpdated": "..."
}
```

**Value diff (`GET /strategies/public/:id/summary`)**
```diff
{
  "strategyId": "...",
  "name": "EUR/USD Scalper",
- "winRate": 0.65,           // winning_closed / ALL trades
+ "winRate": 0.65,           // winning_closed / total_closed
- "totalTrades": 100,        // all trades ever
+ "totalTrades": 100,        // trades since day 1
- "maxDrawdown": -8.5,       // percent, negative
+ "maxDrawdown": 120.50,     // USD, non-negative
  "lastUpdated": "..."
}
```

**Updated TypeScript types (replace previous block)**
```ts
export interface StrategyPerformance {
  strategyId: string;
  totalPnL: number;
  unrealizedPnL: number;
  realizedPnL: number;
  winRate: number;          // 0..1, denominator = closed trades only
  totalTrades: number;      // count since day 1 (any status)
  winningTrades: number;    // closed trades with pnl > 0, since day 1
  losingTrades: number;     // closed trades with pnl < 0, since day 1
  maxDrawdown: number;      // USD, non-negative, peak-to-trough since day 1
  currentDrawdown: number;  // USD, non-negative, peak - latest snapshot
  lastUpdated: string;
}

export interface PublicStrategySummary {
  strategyId: string;
  name: string;
  winRate: number;          // 0..1, denominator = closed trades only
  totalTrades: number;      // count since day 1
  maxDrawdown: number;      // USD, non-negative
  lastUpdated: string;
}
```

**Suggested frontend rendering helper**
```ts
const formatDrawdown = (usd: number) =>
  usd === 0 ? "—" : `-$${usd.toFixed(2)}`; // prefix minus in the UI, value itself is positive
```

**Smoke-test checklist after deploy**
- [ ] `GET /strategies/:id/performance` on a strategy with snapshots returns `maxDrawdown >= 0` and `currentDrawdown >= 0` (both numbers, not negative).
- [ ] On a strategy with no snapshots yet, the response returns `totalTrades: 0`, `winRate: 0`, `maxDrawdown: 0`, `currentDrawdown: 0`, and the live PnL fields still populate from `real_time_strategies`.
- [ ] On a strategy where the latest snapshot is the all-time peak, `currentDrawdown` is `0`.
- [ ] No UI cell renders `-8.5%` or similar percentage strings for drawdown — should now be a USD-formatted value.
- [ ] Win-rate tooltip text no longer mentions "open positions" in the formula.

---

## 2026-05-24 — Strategy schema simplified: `description`, `account_id`, `initial_capital` removed  [BREAKING]

**Backend change**
- Dropped 3 columns from the `strategies` table: `description`, `account_id`, `initial_capital`.
- Endpoint **removed**: `GET /strategies/account/:accountId`.
- Field **removed** from `GET /strategies/:id/performance` response: `totalReturn` (no capital baseline to compute % return).
- Field **removed** from `GET /strategies/public/:id/summary` response: `totalReturn`.
- Field **removed** from `GET /strategies/:id/equity-curve` items: `equity` (was `initial_capital + total_pnl`).
- `POST /strategies` request body now accepts **only** `{ name }`. Any other field is rejected with HTTP 400 by the backend's strict validation (`forbidNonWhitelisted: true`).
- `PUT /strategies/:id` request body now accepts **only** `{ name?, status? }`. `description` is rejected.

**Frontend action items**
1. **Remove every usage of** `strategy.description`, `strategy.account_id`, `strategy.initial_capital`. They are gone from every endpoint that returns a Strategy object.
2. **Update the Create Strategy form** to submit only `{ name }`. Remove the description textarea, account-ID input, and initial-capital input. If your client sends extra fields, the request will be **rejected with HTTP 400**.
3. **Update the Update Strategy form** to submit only `{ name?, status? }`. Remove the description field.
4. **Delete any UI that calls** `GET /strategies/account/:accountId`. If you had an "Account → Strategies" listing route, replace it with a client-side filter on `GET /strategies` (but `account_id` is no longer on the object — see action item 8).
5. **Remove `totalReturn` from the live performance panel** (`/admin/strategies/:id`). Display `totalPnL` instead, or compute % yourself against a baseline you own on the frontend.
6. **Remove `totalReturn` from the public summary card** (`/` and `/strategies` showcase). The card should now show: `name`, `winRate`, `totalTrades`, `maxDrawdown`, `lastUpdated`.
7. **Update the equity-curve chart** — drop the `Equity` line series. Keep `Total P&L` and `Drawdown %`. If you need a synthetic "equity" line, compute it on the frontend with a known baseline (e.g. user-entered or env constant): `equity = baseline + point.totalPnL`.
8. **Strategy-list filters that key off `account_id`** must be removed or rewired. Strategies are no longer associated with an account at the schema level.
9. **Type definitions / interfaces** — update your `Strategy`, `StrategyPerformance`, `PublicStrategySummary`, and `EquityCurvePoint` TypeScript types to match the new shapes in the diffs below.

**Affected endpoints**
- `POST /strategies` — request body shrunk
- `PUT /strategies/:id` — request body shrunk
- `GET /strategies` — response items lost 3 fields
- `GET /strategies/:id` — response lost 3 fields
- `GET /strategies/account/:accountId` — **DELETED**
- `GET /strategies/:id/performance` — `totalReturn` removed
- `GET /strategies/public/:id/summary` — `totalReturn` removed
- `GET /strategies/:id/equity-curve` — `equity` removed from items

**Affected frontend surfaces**
- Admin Dashboard → Strategy List (`/admin/dashboard`)
- Admin Dashboard → Strategy Details (`/admin/strategies/:id`)
- Admin Dashboard → Create Strategy form
- Admin Dashboard → Edit Strategy form
- Admin Dashboard → Performance panel (live metrics)
- Admin Dashboard → Equity Curve chart
- Public Website → Strategy Showcase / Hero card (`/`, `/strategies`)
- Any "Strategies by Account" page or filter

**Request diffs**

`POST /strategies`:
```diff
{
- "name": "Strategy 9",
- "description": "A scalping strategy for EUR/USD pair",
- "account_id": "51ab9b2f-00e3-4144-9cb4-c47e02c3729f",
- "initial_capital": 110000
+ "name": "Strategy 9"
}
```

`PUT /strategies/:id`:
```diff
{
  "name": "EUR/USD Scalper v2",
- "description": "Updated scalping strategy",
  "status": "active"
}
```

**Response diffs**

Strategy object (returned by `GET /strategies`, `GET /strategies/:id`, `POST /strategies`, `PUT /strategies/:id`):
```diff
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
- "description": "A scalping strategy",
- "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
- "initial_capital": 10000,
  "createdAt": "...",
  "updatedAt": "..."
}
```

`GET /strategies/:id/performance`:
```diff
{
  "strategyId": "...",
- "totalReturn": 15.5,
  "totalPnL": 1550.00,
  "unrealizedPnL": 250.00,
  "realizedPnL": 1300.00,
  "winRate": 0.65,
  "totalTrades": 100,
  "winningTrades": 65,
  "losingTrades": 35,
  "maxDrawdown": -8.5,
  "currentDrawdown": -2.1,
  "lastUpdated": "..."
}
```

`GET /strategies/public/:id/summary`:
```diff
{
  "strategyId": "...",
  "name": "EUR/USD Scalper",
- "totalReturn": 15.5,
  "winRate": 0.65,
  "totalTrades": 100,
  "maxDrawdown": -8.5,
  "lastUpdated": "..."
}
```

`GET /strategies/:id/equity-curve` (array items):
```diff
{
  "timestamp": "...",
- "equity": 10500,
  "totalPnL": 500,
  "drawdown": -2.5
}
```

**Updated TypeScript types (paste into your frontend types file)**
```ts
export interface Strategy {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface StrategyPerformance {
  strategyId: string;
  totalPnL: number;
  unrealizedPnL: number;
  realizedPnL: number;
  winRate: number;          // 0..1
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;      // %
  currentDrawdown: number;  // %
  lastUpdated: string;
}

export interface PublicStrategySummary {
  strategyId: string;
  name: string;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  lastUpdated: string;
}

export interface EquityCurvePoint {
  timestamp: string;
  totalPnL: number;
  drawdown: number;
}

export interface CreateStrategyRequest {
  name: string;
}

export interface UpdateStrategyRequest {
  name?: string;
  status?: 'active' | 'inactive';
}
```

**API client diff (suggested)**
```diff
 export const strategyApi = {
   getAll:      ()        => fetch(`${API_URL}/strategies`),
   getById:     (id)      => fetch(`${API_URL}/strategies/${id}`),
-  getByAccount:(accId)   => fetch(`${API_URL}/strategies/account/${accId}`),
   getPerformance:(id)    => fetch(`${API_URL}/strategies/${id}/performance`),
   getTrades:   (id,l,o)  => fetch(`${API_URL}/strategies/${id}/trades?limit=${l}&offset=${o}`),
   getEquityCurve:(id,d)  => fetch(`${API_URL}/strategies/${id}/equity-curve?days=${d}`),
   getPublicSummary:(id)  => fetch(`${API_URL}/strategies/public/${id}/summary`),
-  create: (body) => fetch(`${API_URL}/strategies`, {
-    method: 'POST',
-    headers: { 'Content-Type': 'application/json' },
-    body: JSON.stringify({
-      name: body.name,
-      description: body.description,
-      account_id: body.account_id,
-      initial_capital: body.initial_capital,
-    }),
-  }),
+  create: (body) => fetch(`${API_URL}/strategies`, {
+    method: 'POST',
+    headers: { 'Content-Type': 'application/json' },
+    body: JSON.stringify({ name: body.name }),
+  }),
-  update: (id, body) => fetch(`${API_URL}/strategies/${id}`, {
-    method: 'PUT',
-    headers: { 'Content-Type': 'application/json' },
-    body: JSON.stringify({
-      name: body.name,
-      description: body.description,
-      status: body.status,
-    }),
-  }),
+  update: (id, body) => fetch(`${API_URL}/strategies/${id}`, {
+    method: 'PUT',
+    headers: { 'Content-Type': 'application/json' },
+    body: JSON.stringify({ name: body.name, status: body.status }),
+  }),
 };
```

**Smoke-test checklist after deploy**
- [ ] Create a strategy with `{ "name": "X" }` → returns 201 + new strategy object (no `description`/`account_id`/`initial_capital`).
- [ ] Create a strategy with the old 4-field body → returns **400** (confirms strict validation is working).
- [ ] `GET /strategies/:id/performance` returns the object without `totalReturn`.
- [ ] `GET /strategies/public/:id/summary` returns the object without `totalReturn`.
- [ ] `GET /strategies/:id/equity-curve` returns items without `equity`.
- [ ] `GET /strategies/account/:accountId` returns **404 Not Found** (route no longer exists).
- [ ] No frontend page logs `undefined` for `description`, `account_id`, `initial_capital`, `totalReturn`, or `equity`.

---
