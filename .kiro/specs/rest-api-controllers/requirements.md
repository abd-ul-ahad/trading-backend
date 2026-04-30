# Requirements Document

## Introduction

This feature adds REST API controllers to expose the existing ProvisioningService and TradingService functionality through HTTP endpoints. The controllers will follow RESTful conventions, NestJS best practices, and provide proper request validation, error handling, and API documentation support.

## Glossary

- **Provisioning_Controller**: NestJS controller that exposes MetaAPI account provisioning operations via REST endpoints
- **Trading_Controller**: NestJS controller that exposes MetaAPI trading operations via REST endpoints
- **DTO**: Data Transfer Object used for request validation and type safety
- **MetaAPI_Account**: A trading account managed through the MetaAPI platform
- **REST_Endpoint**: An HTTP endpoint following RESTful conventions
- **Request_Validation**: Automatic validation of incoming request data using NestJS validation pipes
- **Error_Response**: Standardized HTTP error response with status code and message
- **Swagger_Documentation**: OpenAPI/Swagger compatible API documentation

## Requirements

### Requirement 1: Provisioning Account Management Endpoints

**User Story:** As an API consumer, I want to manage MetaAPI trading accounts through REST endpoints, so that I can integrate account provisioning into my application.

#### Acceptance Criteria

1. THE Provisioning_Controller SHALL expose a GET endpoint at `/provisioning/accounts` that returns all accounts
2. THE Provisioning_Controller SHALL expose a GET endpoint at `/provisioning/accounts/:accountId` that returns a single account
3. THE Provisioning_Controller SHALL expose a POST endpoint at `/provisioning/accounts` that creates a new account
4. THE Provisioning_Controller SHALL expose a PUT endpoint at `/provisioning/accounts/:accountId` that updates an account
5. THE Provisioning_Controller SHALL expose a DELETE endpoint at `/provisioning/accounts/:accountId` that deletes an account
6. WHEN a request contains invalid data, THE Provisioning_Controller SHALL return a 400 Bad Request error
7. WHEN a requested account does not exist, THE Provisioning_Controller SHALL return a 404 Not Found error

### Requirement 2: Account Deployment Endpoints

**User Story:** As an API consumer, I want to control account deployment state through REST endpoints, so that I can manage when accounts are active.

#### Acceptance Criteria

1. THE Provisioning_Controller SHALL expose a POST endpoint at `/provisioning/accounts/:accountId/deploy` that deploys an account
2. THE Provisioning_Controller SHALL expose a POST endpoint at `/provisioning/accounts/:accountId/undeploy` that undeploys an account
3. THE Provisioning_Controller SHALL expose a POST endpoint at `/provisioning/accounts/:accountId/redeploy` that redeploys an account
4. WHEN deployment operations succeed, THE Provisioning_Controller SHALL return a 200 OK status with no body
5. WHEN deployment operations fail, THE Provisioning_Controller SHALL return an appropriate error status code

### Requirement 3: Demo and Live Account Creation Endpoints

**User Story:** As an API consumer, I want to create demo and live accounts through dedicated endpoints, so that I can provision different account types.

#### Acceptance Criteria

1. THE Provisioning_Controller SHALL expose a POST endpoint at `/provisioning/profiles/:profileId/demo-accounts` that creates a demo account
2. THE Provisioning_Controller SHALL expose a POST endpoint at `/provisioning/live-accounts` that creates a live account
3. WHEN creating a demo account, THE Provisioning_Controller SHALL validate that name, balance, leverage, and serverName are provided
4. WHEN creating a live account, THE Provisioning_Controller SHALL validate that name, login, password, server, and provisioningProfileId are provided
5. WHEN account creation succeeds, THE Provisioning_Controller SHALL return a 201 Created status with the created account

### Requirement 4: Trading Account Information Endpoints

**User Story:** As an API consumer, I want to retrieve trading account information through REST endpoints, so that I can monitor account status and positions.

#### Acceptance Criteria

1. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/information` that returns account information
2. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/positions` that returns all positions
3. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/positions/:positionId` that returns a single position
4. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/server-time` that returns server time
5. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/cpu-credits` that returns CPU credits

### Requirement 5: Trading Order Endpoints

**User Story:** As an API consumer, I want to retrieve order information through REST endpoints, so that I can monitor pending and historical orders.

#### Acceptance Criteria

1. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/orders` that returns all pending orders
2. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/orders/:orderId` that returns a single pending order
3. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/history-orders/time` that returns historical orders by time range
4. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/history-orders/ticket/:ticket` that returns historical orders by ticket
5. WHEN querying orders by time range, THE Trading_Controller SHALL validate that startTime and endTime query parameters are provided
6. WHEN startTime is after endTime, THE Trading_Controller SHALL return a 400 Bad Request error

### Requirement 6: Trading Deal History Endpoints

**User Story:** As an API consumer, I want to retrieve deal history through REST endpoints, so that I can analyze trading activity.

#### Acceptance Criteria

1. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/deals/time` that returns deals by time range
2. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/deals/ticket/:ticket` that returns deals by ticket
3. WHEN querying deals by time range, THE Trading_Controller SHALL validate that startTime and endTime query parameters are provided
4. WHEN startTime is after endTime, THE Trading_Controller SHALL return a 400 Bad Request error

### Requirement 7: Market Data Endpoints

**User Story:** As an API consumer, I want to retrieve market data through REST endpoints, so that I can analyze symbols and pricing.

#### Acceptance Criteria

1. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/symbols` that returns all available symbols
2. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/symbols/:symbol/specification` that returns symbol specifications
3. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/symbols/:symbol/price` that returns current price
4. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/symbols/:symbol/candles` that returns candle data
5. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/symbols/:symbol/ticks` that returns tick data
6. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/symbols/:symbol/order-book` that returns order book data
7. WHEN querying candles, THE Trading_Controller SHALL validate that timeframe query parameter is provided

### Requirement 8: Trade Execution Endpoint

**User Story:** As an API consumer, I want to execute trades through a REST endpoint, so that I can place orders programmatically.

#### Acceptance Criteria

1. THE Trading_Controller SHALL expose a POST endpoint at `/trading/accounts/:accountId/trade` that executes a trade
2. WHEN executing a trade, THE Trading_Controller SHALL validate that actionType is provided
3. WHEN actionType is a market, limit, or stop order, THE Trading_Controller SHALL validate that symbol and volume are provided
4. WHEN trade execution succeeds, THE Trading_Controller SHALL return a 200 OK status with the trade result
5. WHEN trade execution fails, THE Trading_Controller SHALL return an appropriate error status code

### Requirement 9: Margin Calculation Endpoint

**User Story:** As an API consumer, I want to calculate margin requirements through a REST endpoint, so that I can validate trade feasibility.

#### Acceptance Criteria

1. THE Trading_Controller SHALL expose a GET endpoint at `/trading/accounts/:accountId/margin` that calculates margin
2. WHEN calculating margin, THE Trading_Controller SHALL validate that symbol, type, and volume query parameters are provided
3. WHEN margin calculation succeeds, THE Trading_Controller SHALL return a 200 OK status with the margin result

### Requirement 10: Request Validation with DTOs

**User Story:** As an API consumer, I want request validation to occur automatically, so that I receive clear error messages for invalid requests.

#### Acceptance Criteria

1. THE Provisioning_Controller SHALL use CreateAccountDto for POST `/provisioning/accounts` request validation
2. THE Provisioning_Controller SHALL use UpdateAccountDto for PUT `/provisioning/accounts/:accountId` request validation
3. THE Provisioning_Controller SHALL use CreateDemoAccountDto for POST `/provisioning/profiles/:profileId/demo-accounts` request validation
4. THE Provisioning_Controller SHALL use CreateLiveAccountDto for POST `/provisioning/live-accounts` request validation
5. THE Trading_Controller SHALL use TradeDto for POST `/trading/accounts/:accountId/trade` request validation
6. WHEN validation fails, THE Controllers SHALL return a 400 Bad Request error with validation details

### Requirement 11: Error Handling and Response Formatting

**User Story:** As an API consumer, I want consistent error responses, so that I can handle errors predictably.

#### Acceptance Criteria

1. WHEN a service method throws an exception, THE Controllers SHALL catch the exception and return an appropriate HTTP status code
2. WHEN a resource is not found, THE Controllers SHALL return a 404 Not Found status
3. WHEN validation fails, THE Controllers SHALL return a 400 Bad Request status
4. WHEN an internal error occurs, THE Controllers SHALL return a 500 Internal Server Error status
5. THE Controllers SHALL return error responses in a consistent JSON format with statusCode, message, and optional error details

### Requirement 12: Swagger/OpenAPI Documentation Support

**User Story:** As an API consumer, I want API documentation to be available, so that I can understand endpoint usage without reading code.

#### Acceptance Criteria

1. THE Controllers SHALL use NestJS Swagger decorators to document endpoints
2. THE Controllers SHALL use @ApiTags decorator to group related endpoints
3. THE Controllers SHALL use @ApiOperation decorator to describe endpoint purpose
4. THE Controllers SHALL use @ApiResponse decorators to document response types
5. THE Controllers SHALL use @ApiParam decorator to document path parameters
6. THE Controllers SHALL use @ApiQuery decorator to document query parameters
7. THE Controllers SHALL use @ApiBody decorator to document request bodies
