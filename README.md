# MetaAPI Trading Platform

A NestJS-based REST API for managing MetaAPI trading accounts and executing trading operations. This application provides a comprehensive interface for account provisioning, market data retrieval, and trade execution through the MetaAPI platform.

## Description

This application is built with [NestJS](https://github.com/nestjs/nest), a progressive Node.js framework for building efficient and scalable server-side applications. It integrates with the MetaAPI service to provide trading account management and market data access.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- MetaAPI account and API token

## Installation

```bash
# Install dependencies
$ npm install

# Set up environment variables
$ cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# MetaAPI Configuration
METAAPI_TOKEN=your_metaapi_token

# Application Configuration
PORT=3000
```

## Running the Application

```bash
# Development mode
$ npm run start:dev

# Production mode
$ npm run build
$ npm run start:prod

# Debug mode
$ npm run start:debug
```

The application will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Documentation

### Swagger UI

Interactive API documentation is available via Swagger UI once the application is running:

**URL:** [http://localhost:3000/api](http://localhost:3000/api)

The Swagger UI provides:
- Complete endpoint documentation
- Request/response schemas
- Interactive API testing
- Example values for all parameters
- Validation rules

### REST API Endpoints

The API is organized into two main modules:

#### Provisioning API

Manage MetaAPI trading accounts (creation, updates, deployment).

**Base Path:** `/provisioning`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List all trading accounts |
| GET | `/accounts/:accountId` | Get a specific account |
| POST | `/accounts` | Create a new trading account |
| PUT | `/accounts/:accountId` | Update an existing account |
| DELETE | `/accounts/:accountId` | Delete an account |
| POST | `/accounts/:accountId/deploy` | Deploy an account |
| POST | `/accounts/:accountId/undeploy` | Undeploy an account |
| POST | `/accounts/:accountId/redeploy` | Redeploy an account |
| POST | `/profiles/:profileId/demo-accounts` | Create a demo account |
| POST | `/live-accounts` | Create a live account |

#### Trading API

Execute trades and retrieve market data.

**Base Path:** `/trading`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts/:accountId/information` | Get account information |
| GET | `/accounts/:accountId/positions` | List all open positions |
| GET | `/accounts/:accountId/positions/:positionId` | Get a specific position |
| GET | `/accounts/:accountId/orders` | List pending orders |
| GET | `/accounts/:accountId/orders/:orderId` | Get a specific order |
| GET | `/accounts/:accountId/history-orders/time` | Get historical orders by time range |
| GET | `/accounts/:accountId/history-orders/ticket/:ticket` | Get historical orders by ticket |
| GET | `/accounts/:accountId/deals/time` | Get deals by time range |
| GET | `/accounts/:accountId/deals/ticket/:ticket` | Get deals by ticket |
| GET | `/accounts/:accountId/symbols` | List available trading symbols |
| GET | `/accounts/:accountId/symbols/:symbol/specification` | Get symbol specifications |
| GET | `/accounts/:accountId/symbols/:symbol/price` | Get current price for a symbol |
| GET | `/accounts/:accountId/symbols/:symbol/candles` | Get candle data |
| GET | `/accounts/:accountId/symbols/:symbol/ticks` | Get tick data |
| GET | `/accounts/:accountId/symbols/:symbol/order-book` | Get order book |
| POST | `/accounts/:accountId/trade` | Execute a trade |
| GET | `/accounts/:accountId/server-time` | Get server time |
| GET | `/accounts/:accountId/margin` | Calculate margin requirements |
| GET | `/accounts/:accountId/cpu-credits` | Get CPU credits |

### Common API Usage Examples

#### 1. Create a Trading Account

```bash
POST http://localhost:3000/provisioning/accounts
Content-Type: application/json

{
  "name": "My Trading Account",
  "type": "cloud",
  "login": "12345678",
  "password": "your_password",
  "server": "ICMarketsSC-Demo",
  "provisioningProfileId": "profile-id-here",
  "platform": "mt4"
}
```

#### 2. List All Accounts

```bash
GET http://localhost:3000/provisioning/accounts
```

#### 3. Deploy an Account

```bash
POST http://localhost:3000/provisioning/accounts/{accountId}/deploy
```

#### 4. Get Account Information

```bash
GET http://localhost:3000/trading/accounts/{accountId}/information
```

#### 5. Get Open Positions

```bash
GET http://localhost:3000/trading/accounts/{accountId}/positions
```

#### 6. Execute a Market Buy Order

```bash
POST http://localhost:3000/trading/accounts/{accountId}/trade
Content-Type: application/json

{
  "actionType": "ORDER_TYPE_BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stopLoss": 1.0850,
  "takeProfit": 1.0950,
  "comment": "My first trade"
}
```

#### 7. Get Historical Orders by Time Range

```bash
GET http://localhost:3000/trading/accounts/{accountId}/history-orders/time?startTime=2024-01-01T00:00:00.000Z&endTime=2024-01-31T23:59:59.999Z
```

#### 8. Get Candle Data

```bash
GET http://localhost:3000/trading/accounts/{accountId}/symbols/EURUSD/candles?timeframe=1h
```

#### 9. Calculate Margin Requirements

```bash
GET http://localhost:3000/trading/accounts/{accountId}/margin?symbol=EURUSD&type=ORDER_TYPE_BUY&volume=0.01
```

#### 10. Create a Demo Account

```bash
POST http://localhost:3000/provisioning/profiles/{profileId}/demo-accounts
Content-Type: application/json

{
  "name": "My Demo Account",
  "balance": 10000,
  "leverage": 100,
  "serverName": "ICMarketsSC-Demo"
}
```

### Error Responses

The API returns standardized error responses:

```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "balance must be a number"],
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `200 OK` - Successful GET, PUT, PATCH requests
- `201 Created` - Successful POST requests that create resources
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Validation errors or malformed requests
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Unexpected server errors

## Testing

### Automated Tests

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov

# Watch mode
$ npm run test:watch
```

### Manual Testing with Postman

A complete Postman collection is available in the `postman/` folder with all 32 API endpoints.

**Import Instructions:**
1. Open Postman
2. Click **Import** → **File**
3. Select `postman/postman_collection.json`
4. Click **Import**

See `postman/README.md` for detailed usage instructions and examples.

## Database Setup

```bash
# Run migrations
$ npx sequelize-cli db:migrate

# Rollback migrations
$ npx sequelize-cli db:migrate:undo
```

## Project Structure

```
src/
├── config/              # Configuration files
├── database/            # Database models and migrations
│   └── models/          # Sequelize models
├── integrations/        # External service integrations
│   └── metaapi/         # MetaAPI integration
├── modules/             # Feature modules
│   ├── provisioning/    # Account provisioning module
│   │   ├── dto/         # Data Transfer Objects
│   │   ├── provisioning.controller.ts
│   │   ├── provisioning.service.ts
│   │   └── provisioning.module.ts
│   └── trading/         # Trading operations module
│       ├── dto/         # Data Transfer Objects
│       ├── trading.controller.ts
│       ├── trading.service.ts
│       └── trading.module.ts
├── app.module.ts        # Root application module
└── main.ts              # Application entry point
```

## Technologies

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL with Sequelize ORM
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest, Supertest
- **HTTP Client:** Axios

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [MetaAPI Documentation](https://metaapi.cloud/docs/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)

## License

This project is [UNLICENSED](LICENSE).
