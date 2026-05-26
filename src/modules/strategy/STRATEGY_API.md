# Strategy Management API Documentation

## Overview

The Strategy Management API provides endpoints for managing trading strategies, tracking performance, and exposing public-facing strategy summaries.

> **Breaking change (v2.1.0)**: The `description`, `account_id`, and `initial_capital` fields were removed from the `strategies` table and all related DTOs. The `GET /strategies/account/:accountId` endpoint was removed. The `totalReturn` field (StrategyPerformance / PublicStrategySummary) and the `equity` field (EquityCurvePoint) were also removed because they depended on the now-absent `initial_capital`.

## Architecture

### Clean Architecture Principles

1. **Separation of Concerns**: Controllers handle HTTP requests, Services handle business logic, Models handle data persistence
2. **Dependency Injection**: All dependencies are injected via NestJS DI container
3. **Error Handling**: Consistent error handling with proper HTTP status codes
4. **Validation**: Input validation using class-validator decorators
5. **Testing**: Unit tests for both services and controllers

### Project Structure

```
src/modules/strategy/
├── dto/
│   ├── create-strategy.dto.ts
│   ├── update-strategy.dto.ts
│   ├── strategy-response.dto.ts
│   ├── strategy-performance.dto.ts
│   ├── public-strategy-summary.dto.ts
│   ├── equity-curve.dto.ts
│   └── index.ts
├── strategy.service.ts
├── strategy.controller.ts
├── strategy.module.ts
├── strategy.service.spec.ts
├── strategy.controller.spec.ts
└── STRATEGY_API.md (this file)

src/database/models/
└── strategy.model.ts

database/migrations/
├── 20240115110000-create-strategies-table.ts
└── 20260524210000-drop-strategies-extra-columns.ts
```

## API Endpoints

### Strategy Management

#### Create Strategy
```
POST /strategies
Content-Type: application/json

{
  "name": "EUR/USD Scalper"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
  "status": "active",
  "createdAt": "2024-05-19T10:30:00.000Z",
  "updatedAt": "2024-05-19T10:30:00.000Z"
}
```

#### Get All Strategies
```
GET /strategies

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "EUR/USD Scalper",
    "status": "active",
    "createdAt": "2024-05-19T10:30:00.000Z",
    "updatedAt": "2024-05-19T10:30:00.000Z"
  }
]
```

#### Get Strategy by ID
```
GET /strategies/:id

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
  "status": "active",
  "createdAt": "2024-05-19T10:30:00.000Z",
  "updatedAt": "2024-05-19T10:30:00.000Z"
}
```

#### Update Strategy
```
PUT /strategies/:id
Content-Type: application/json

{
  "name": "EUR/USD Scalper v2",
  "status": "inactive"
}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper v2",
  "status": "inactive",
  ...
}
```

#### Delete Strategy
```
DELETE /strategies/:id

Response: 200 OK
```

### Strategy Performance

#### Get Live Performance
```
GET /strategies/:id/performance

Response: 200 OK
{
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "totalPnL": 1550.00,
  "unrealizedPnL": 250.00,
  "realizedPnL": 1300.00,
  "winRate": 0.65,
  "totalTrades": 100,
  "winningTrades": 65,
  "losingTrades": 35,
  "maxDrawdown": 120.50,
  "currentDrawdown": 35.00,
  "lastUpdated": "2024-05-19T10:30:00.000Z"
}
```

All counts and drawdown values are scoped to "day 1" — see [Performance Calculation](#performance-calculation) below. `maxDrawdown` and `currentDrawdown` are reported in absolute USD as non-negative numbers.

#### Get Strategy Trades
```
GET /strategies/:id/trades?limit=50&offset=0&status=closed

Query Parameters:
- limit: Number of trades to return (default: 50)
- offset: Number of trades to skip (default: 0)
- status: Filter by status - 'open', 'closed', 'cancelled' (optional)

Response: 200 OK
{
  "trades": [
    {
      "trade_id": "550e8400-e29b-41d4-a716-446655440002",
      "strategy_id": "550e8400-e29b-41d4-a716-446655440001",
      "account_id": "550e8400-e29b-41d4-a716-446655440000",
      "symbol": "EURUSD",
      "direction": "long",
      "entry_time": "2024-05-19T10:00:00.000Z",
      "entry_price": 1.1234,
      "exit_time": "2024-05-19T10:30:00.000Z",
      "exit_price": 1.1244,
      "quantity": 0.01,
      "pnl": 10,
      "status": "closed"
    }
  ],
  "total": 100
}
```

#### Get Equity Curve
```
GET /strategies/:id/equity-curve?days=30

Query Parameters:
- days: Number of days to retrieve (default: 30)

Response: 200 OK
[
  {
    "timestamp": "2024-05-19T10:30:00.000Z",
    "totalPnL": 500,
    "drawdown": -2.5
  }
]
```

### Public Strategy Endpoints

#### Get Public Summary
```
GET /strategies/public/:id/summary

Response: 200 OK
{
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
  "winRate": 0.65,
  "totalTrades": 100,
  "maxDrawdown": 120.50,
  "lastUpdated": "2024-05-19T10:30:00.000Z"
}
```

This endpoint deliberately excludes any PnL values (`totalPnL`, `unrealizedPnL`, `realizedPnL`). All values are scoped to "day 1" — see [Performance Calculation](#performance-calculation). `maxDrawdown` is in absolute USD.

### Dev / Seed

#### Seed demo data
```
POST /strategies/dev/seed
Content-Type: application/json

{ "dayOne": "2024-04-20" }    // optional; defaults to "2024-04-20"

Response: 201 Created
[
  {
    "name": "Strategy 1",
    "strategyId": "abc-123-...",
    "snapshotsInserted": 10,
    "tradesInserted": 13,
    "closedTrades": 11,
    "openTrades": 1,
    "cancelledTrades": 1,
    "dayOne": "2024-04-20T00:00:00.000Z",
    "performanceUrl": "/strategies/abc-123-.../performance",
    "publicSummaryUrl": "/strategies/public/abc-123-.../summary"
  },
  {
    "name": "Strategy 2",
    ...
  }
  // ... through Strategy 10
]
```

**Wipes every existing strategy** (and their `strategy_performance`, `trades`, `real_time_strategies`, `real_time_trades` rows), then creates **10 fresh strategies** named `Strategy 1` through `Strategy 10`. Each gets a 10-day `strategy_performance` snapshot series and a mix of closed/open/cancelled trades shaped to exercise different chart patterns (uptrends, oscillating ranges, drawdown-heavy, etc.). The sync triggers auto-populate the `real_time_*` tables — the response only counts what was directly written.

**Disabled in production.** Returns `403 Forbidden` when `NODE_ENV === 'production'`.

Designed to be re-run safely — each call resets to a clean 10-strategy state with fresh UUIDs.

Expected metrics after seeding (`GET /strategies/:id/performance` for each):

| Strategy | `totalTrades` | `winningTrades` / `losingTrades` | `winRate` | `maxDrawdown` (USD) | `currentDrawdown` (USD) | `totalPnL` |
|---|---|---|---|---|---|---|
| Strategy 1  | 13 | 8 / 3 | 0.7273 | 100 | 100 | 220 |
| Strategy 2  | 12 | 5 / 5 | 0.5    | 25  | 0   | 130 |
| Strategy 3  | 11 | 8 / 1 | 0.8889 | 10  | 0   | 160 |
| Strategy 4  | 11 | 6 / 3 | 0.6667 | 250 | 50  | 750 |
| Strategy 5  | 11 | 8 / 1 | 0.8889 | 30  | 0   | 650 |
| Strategy 6  | 11 | 5 / 4 | 0.5556 | 30  | 0   | 300 |
| Strategy 7  | 11 | 5 / 4 | 0.5556 | 30  | 0   | 80  |
| Strategy 8  | 11 | 5 / 4 | 0.5556 | 250 | 0   | 550 |
| Strategy 9  | 11 | 7 / 2 | 0.7778 | 20  | 0   | 230 |
| Strategy 10 | 11 | 9 / 0 | 1.0    | 0   | 0   | 270 |

## Error Responses

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Strategy with ID 550e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Data Models

### Strategy Model
```typescript
{
  id: UUID;
  name: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

### Performance Calculation

All performance metrics are anchored to **day 1**, defined as the timestamp of the earliest `strategy_performance` snapshot for the strategy. Day 1 is dynamic per strategy — it is NOT a hard-coded calendar date.

**Total Trades** = count of trades whose `entry_time >= day1` (any status: open, closed, or cancelled).

**Win Rate** = `winning_closed / total_closed`

- Numerator: closed trades with `pnl > 0`.
- Denominator: closed trades only. Open and cancelled trades are excluded from both numerator and denominator.
- Example: 55 winning closed trades out of 100 closed trades since day 1 → win rate `0.55`.

**Max Drawdown** = largest peak-to-trough drop in the `strategy_performance.total_pnl` series since day 1, in **absolute USD**.

- The series is walked in timestamp order. At each snapshot, the running peak is updated, then `drawdown = peak − current` is computed. `maxDrawdown` is the maximum such drawdown observed (peak must precede the trough in time).
- Reported as a non-negative number. `0` means the cumulative PnL has only ever gone up.

**Current Drawdown** = drop from the all-time peak to the most recent snapshot, in absolute USD (non-negative). Equals `0` when the latest snapshot is also the peak.

> `totalReturn` (% return) is intentionally not exposed by the strategy endpoints — it requires an account-level "money in account" baseline which is out of scope for this module.

## Testing

### Run All Tests
```bash
npm run test
```

### Run Strategy Tests Only
```bash
npm run test -- strategy
```

## Usage Examples

```bash
# Create a strategy
curl -X POST http://localhost:3000/strategies \
  -H "Content-Type: application/json" \
  -d '{"name": "EUR/USD Scalper"}'

# Get live performance
curl http://localhost:3000/strategies/<id>/performance

# Get public summary
curl http://localhost:3000/strategies/public/<id>/summary
```
