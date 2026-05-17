# OROVIAX Onboarding & Strategy Subscription System

## Overview

Complete implementation of the user onboarding and strategy subscription workflow for the OROVIAX copy trading platform.

## System Architecture

### Modules

1. **Users Module** - User registration and authentication
2. **Strategies Module** - Trading strategy management
3. **Broker Accounts Module** - Broker account linking and credential management
4. **Subscriptions Module** - Strategy subscription management

### Database Models

```
User
├── id (UUID)
├── email (unique)
├── fullName
├── password (hashed)
├── status (active, inactive, pending)
├── emailVerificationToken
├── emailVerifiedAt
├── lastLoginAt
└── relationships:
    ├── brokerAccounts (1:N)
    └── strategySubscriptions (1:N)

Strategy
├── id (UUID)
├── name
├── description
├── createdByUserId
├── subscriberCount
├── totalReturn
├── winRate
├── maxDrawdown
├── avgTradeDuration
├── status (active, inactive, archived)
├── minimumInvestment
├── managementFeePercent
├── performanceFeePercent
└── relationships:
    └── subscribers (1:N)

BrokerAccount
├── id (UUID)
├── userId (FK)
├── brokerName
├── accountNumber
├── serverName
├── encryptedCredentials (AES-256-CBC)
├── balance
├── equity
├── status (linked, pending, inactive, error)
├── lastSyncAt
├── errorMessage
├── accountType (demo, live)
└── relationships:
    └── user (N:1)

UserStrategySubscription
├── id (UUID)
├── userId (FK)
├── strategyId (FK)
├── brokerAccountId (FK)
├── status (active, paused, inactive, error)
├── initialInvestment
├── currentValue
├── realizedPnL
├── unrealizedPnL
├── returnPercent
├── tradesCopied
├── subscribedAt
├── unsubscribedAt
├── errorMessage
└── relationships:
    ├── user (N:1)
    ├── strategy (N:1)
    └── brokerAccount (N:1)
```

## Workflow Steps

### Step 1: User Registration
**Endpoint:** `POST /users/register`

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "active",
    "createdAt": "2024-05-06T10:00:00Z"
  },
  "token": "base64-encoded-token"
}
```

### Step 2: User Login
**Endpoint:** `POST /users/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Step 3: Browse Available Strategies
**Endpoint:** `GET /strategies/active`

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Scalping Strategy",
    "description": "High-frequency scalping strategy for forex",
    "totalReturn": 25.5,
    "winRate": 0.65,
    "maxDrawdown": -8.5,
    "subscriberCount": 150,
    "minimumInvestment": 1000,
    "managementFeePercent": 2.5,
    "performanceFeePercent": 20,
    "status": "active"
  }
]
```

### Step 4: Link Broker Account
**Endpoint:** `POST /broker-accounts/link?userId={userId}`

```json
{
  "brokerName": "MetaAPI",
  "accountNumber": "12345678",
  "serverName": "ICMarketsSC-Demo",
  "readOnlyLogin": "readonly_user",
  "readOnlyPassword": "readonly_password",
  "accountType": "demo"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "brokerName": "MetaAPI",
  "accountNumber": "12345678",
  "status": "pending",
  "accountType": "demo",
  "balance": 0,
  "equity": 0,
  "createdAt": "2024-05-06T10:05:00Z"
}
```

### Step 5: Subscribe to Strategy
**Endpoint:** `POST /subscriptions/subscribe?userId={userId}`

```json
{
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "brokerAccountId": "550e8400-e29b-41d4-a716-446655440002",
  "initialInvestment": 5000
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "brokerAccountId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "active",
  "initialInvestment": 5000,
  "currentValue": 5000,
  "realizedPnL": 0,
  "unrealizedPnL": 0,
  "returnPercent": 0,
  "tradesCopied": 0,
  "subscribedAt": "2024-05-06T10:10:00Z"
}
```

### Step 6: Monitor Performance
**Endpoint:** `GET /subscriptions/{subscriptionId}`

Returns real-time performance metrics for the subscription.

## API Endpoints Summary

### Users
- `POST /users/register` - Register new user
- `POST /users/login` - Login user
- `GET /users/{userId}` - Get user details

### Strategies
- `GET /strategies` - Get all strategies (with optional status filter)
- `GET /strategies/active` - Get active strategies
- `GET /strategies/{strategyId}` - Get strategy details
- `POST /strategies` - Create new strategy (admin)

### Broker Accounts
- `POST /broker-accounts/link` - Link broker account
- `GET /broker-accounts/user/{userId}` - Get user's broker accounts
- `GET /broker-accounts/{accountId}` - Get broker account details
- `DELETE /broker-accounts/{accountId}` - Delete broker account

### Subscriptions
- `POST /subscriptions/subscribe` - Subscribe to strategy
- `GET /subscriptions/user/{userId}` - Get user's subscriptions
- `GET /subscriptions/strategy/{strategyId}/subscribers` - Get strategy subscribers
- `GET /subscriptions/{subscriptionId}` - Get subscription details
- `DELETE /subscriptions/{subscriptionId}` - Unsubscribe from strategy

## Security Features

### Credential Encryption
- Broker credentials stored encrypted using AES-256-CBC
- Encryption key and IV from environment variables
- Credentials never exposed in API responses

### Status Management
- Broker accounts: `linked`, `pending`, `inactive`, `error`
- Subscriptions: `active`, `paused`, `inactive`, `error`
- Strategies: `active`, `inactive`, `archived`

### Validation
- Email uniqueness for users
- Minimum investment validation
- Broker account ownership verification
- Strategy status verification

## File Structure

```
src/
├── modules/
│   ├── users/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── index.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   ├── strategies/
│   │   ├── dto/
│   │   │   ├── create-strategy.dto.ts
│   │   │   └── index.ts
│   │   ├── strategies.service.ts
│   │   ├── strategies.controller.ts
│   │   └── strategies.module.ts
│   ├── broker-accounts/
│   │   ├── dto/
│   │   │   ├── link-broker-account.dto.ts
│   │   │   └── index.ts
│   │   ├── broker-accounts.service.ts
│   │   ├── broker-accounts.controller.ts
│   │   └── broker-accounts.module.ts
│   └── subscriptions/
│       ├── dto/
│       │   ├── subscribe-strategy.dto.ts
│       │   └── index.ts
│       ├── subscriptions.service.ts
│       ├── subscriptions.controller.ts
│       └── subscriptions.module.ts
├── database/
│   └── models/
│       ├── user.model.ts
│       ├── strategy.model.ts
│       ├── broker-account.model.ts
│       ├── user-strategy-subscription.model.ts
│       └── index.ts
└── app.module.ts (updated)
```

## Environment Variables

```env
# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key
ENCRYPTION_IV=your-16-char-iv

# Database (existing)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=oroviax
```

## Next Steps

1. **Email Service** - Send welcome emails after registration
2. **JWT Authentication** - Replace token generation with JWT
3. **Password Hashing** - Use bcrypt for password hashing
4. **Email Verification** - Implement email confirmation workflow
5. **Copy Trading Engine** - Implement trade copying logic
6. **Performance Tracking** - Sync performance metrics from broker
7. **Audit Logging** - Log all user actions
8. **Rate Limiting** - Add rate limiting to API endpoints
9. **Admin Dashboard** - Create admin panel for strategy management
10. **Notifications** - Send notifications for subscription events

## Testing

Build and run:
```bash
npm run build
npm run start:dev
```

Test endpoints using Postman or curl:
```bash
# Register
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePassword123!","fullName":"John Doe"}'

# Get active strategies
curl http://localhost:3000/strategies/active
```

## Architecture Compliance

✅ **Clean Architecture** - Separation of concerns (Controller → Service → Repository)
✅ **NestJS Best Practices** - Modules, DTOs, Services, Controllers
✅ **Database Models** - Proper relationships and constraints
✅ **Error Handling** - Comprehensive validation and error messages
✅ **Security** - Encrypted credentials, status validation
✅ **Scalability** - Modular design for easy extension
✅ **Documentation** - Swagger/OpenAPI decorators on all endpoints
