# Strategy Management API Documentation

## Overview

The Strategy Management API provides comprehensive endpoints for managing trading strategies, tracking performance, and exposing public-facing strategy summaries without sensitive capital information.

## Architecture

### Clean Architecture Principles

1. **Separation of Concerns**: Controllers handle HTTP requests, Services handle business logic, Models handle data persistence
2. **Dependency Injection**: All dependencies are injected via NestJS DI container
3. **Error Handling**: Consistent error handling with proper HTTP status codes
4. **Validation**: Input validation using class-validator decorators
5. **Testing**: Comprehensive unit tests for both services and controllers

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
├── strategy.model.ts
└── (other models)

src/database/migrations/
└── 001-create-strategies-table.ts
```

## API Endpoints

### Strategy Management

#### Create Strategy
```
POST /strategies
Content-Type: application/json

{
  "name": "EUR/USD Scalper",
  "description": "A scalping strategy for EUR/USD pair",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "initial_capital": 10000
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
  "description": "A scalping strategy for EUR/USD pair",
  "account_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "initial_capital": 10000,
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
    "description": "A scalping strategy for EUR/USD pair",
    "account_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "initial_capital": 10000,
    "createdAt": "2024-05-19T10:30:00.000Z",
    "updatedAt": "2024-05-19T10:30:00.000Z"
  }
]
```

#### Get Strategies by Account
```
GET /strategies/account/:accountId

Response: 200 OK
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "EUR/USD Scalper",
    ...
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
  ...
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
  "totalReturn": 15.5,              // % return
  "totalPnL": 1550.00,              // $ profit/loss
  "unrealizedPnL": 250.00,          // Open positions
  "realizedPnL": 1300.00,           // Closed positions
  "winRate": 0.65,                  // 65% winning trades
  "totalTrades": 100,
  "winningTrades": 65,
  "losingTrades": 35,
  "maxDrawdown": -8.5,              // % drawdown
  "currentDrawdown": -2.1,          // Current % drawdown
  "lastUpdated": "2024-05-19T10:30:00.000Z"
}
```

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
    "equity": 10500,                 // initial_capital + total_pnL
    "totalPnL": 500,
    "drawdown": -2.5
  }
]
```

### Public Strategy Endpoints

#### Get Public Summary (No Capital Info)
```
GET /strategies/public/:id/summary

Response: 200 OK
{
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
  "totalReturn": 15.5,              // % return ONLY
  "winRate": 0.65,
  "totalTrades": 100,
  "maxDrawdown": -8.5,
  "lastUpdated": "2024-05-19T10:30:00.000Z"
}
```

**Note**: This endpoint excludes:
- `initial_capital`
- `totalPnL` (absolute value)
- `unrealizedPnL`
- `realizedPnL`
- `account_id`

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Initial capital must be greater than 0",
  "error": "Bad Request"
}
```

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
  id: UUID;                    // Primary key
  name: string;                // Strategy name
  description?: string;        // Optional description
  account_id: UUID;            // Associated account
  status: 'active' | 'inactive';
  initial_capital: decimal;    // Starting capital for return calculations
  createdAt: Date;
  updatedAt: Date;
}
```

### Performance Calculation

**Total Return %** = (Total PnL / Initial Capital) × 100

**Win Rate** = Winning Trades / Total Trades

**Drawdown** = (Peak Equity - Current Equity) / Peak Equity × 100

## Testing

### Run All Tests
```bash
npm run test
```

### Run Strategy Tests Only
```bash
npm run test -- strategy
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Test Coverage
- **Strategy Service**: 100% coverage
  - CRUD operations
  - Performance calculations
  - Error handling
  - Edge cases

- **Strategy Controller**: 100% coverage
  - All endpoints
  - Error propagation
  - Parameter validation

## Usage Examples

### Example 1: Create and Monitor a Strategy

```bash
# 1. Create a strategy
curl -X POST http://localhost:3000/strategies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "EUR/USD Scalper",
    "description": "Scalping strategy",
    "account_id": "550e8400-e29b-41d4-a716-446655440000",
    "initial_capital": 10000
  }'

# Response: Strategy ID = 550e8400-e29b-41d4-a716-446655440001

# 2. Get live performance
curl http://localhost:3000/strategies/550e8400-e29b-41d4-a716-446655440001/performance

# 3. Get public summary for website
curl http://localhost:3000/strategies/public/550e8400-e29b-41d4-a716-446655440001/summary
```

### Example 2: Display Strategy on Public Page

```javascript
// Frontend code
async function displayStrategyOnPublicPage(strategyId) {
  const response = await fetch(
    `/strategies/public/${strategyId}/summary`
  );
  const summary = await response.json();

  // Display only performance metrics
  document.getElementById('strategy-name').textContent = summary.name;
  document.getElementById('total-return').textContent = `${summary.totalReturn}%`;
  document.getElementById('win-rate').textContent = `${(summary.winRate * 100).toFixed(2)}%`;
  document.getElementById('max-drawdown').textContent = `${summary.maxDrawdown}%`;
  document.getElementById('total-trades').textContent = summary.totalTrades;
}
```

### Example 3: Get Equity Curve for Chart

```bash
# Get 60 days of equity curve data
curl "http://localhost:3000/strategies/550e8400-e29b-41d4-a716-446655440001/equity-curve?days=60"

# Response: Array of equity points for charting
[
  {
    "timestamp": "2024-03-20T10:30:00.000Z",
    "equity": 10100,
    "totalPnL": 100,
    "drawdown": -1.5
  },
  ...
]
```

## Performance Considerations

1. **Caching**: Consider caching performance data for frequently accessed strategies
2. **Pagination**: Always use pagination for trades endpoint (limit/offset)
3. **Indexes**: Database indexes on `account_id`, `status`, and `created_at` for fast queries
4. **Real-Time Data**: Performance data is calculated from real-time strategy table (synced via triggers)

## Security

1. **Public Endpoints**: `/strategies/public/*` endpoints expose only performance metrics
2. **Capital Protection**: Initial capital and absolute PnL values are never exposed in public endpoints
3. **Account Isolation**: Strategies are always filtered by account_id
4. **Input Validation**: All inputs validated with class-validator

## Future Enhancements

1. **WebSocket Support**: Real-time performance updates
2. **Performance Caching**: Redis caching for frequently accessed data
3. **Advanced Filtering**: Filter strategies by performance metrics
4. **Batch Operations**: Create/update multiple strategies
5. **Performance Alerts**: Notify when drawdown exceeds threshold
6. **Strategy Comparison**: Compare multiple strategies side-by-side
