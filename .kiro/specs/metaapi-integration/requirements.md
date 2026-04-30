# Requirements Document

## Introduction

This feature adds a MetaApi MT5 integration service to the existing NestJS backend. The integration wraps the MetaApi REST API (both the Provisioning API and the Trading/Client API) into clean, typed NestJS modules. It enables the backend to manage MT5 trading accounts, retrieve live account data, execute trades, query market data, and access trade history — all through a structured service layer that other modules can consume.

The integration is split into two logical areas:
- **Provisioning**: account lifecycle management (create, read, update, delete, deploy, undeploy, demo/live account creation) via the MetaApi Provisioning API.
- **Trading**: live account data, positions, orders, history, market data, and trade execution via the MetaApi Client API.

The HTTP client (`@nestjs/axios`) will be added as a new dependency. All configuration (tokens, base URLs, account IDs) will be driven by environment variables.

---

## Glossary

- **MetaApi_Service**: The NestJS service that wraps MetaApi REST API calls.
- **Provisioning_API**: The MetaApi REST endpoint at `mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai` used for account lifecycle management.
- **Trading_API**: The MetaApi REST endpoint at `mt-client-api-v1.{region}.agiliumtrade.ai` used for live trading operations.
- **Provisioning_Token**: The main MetaApi API token used to authenticate requests to the Provisioning_API.
- **Account_Token**: A per-account access token used to authenticate requests to the Trading_API.
- **Account_ID**: The MetaApi-assigned identifier for a specific MT5 trading account.
- **Region**: The geographic region identifier embedded in the Trading_API base URL (e.g., `new-york`).
- **HTTP_Client**: The `@nestjs/axios` HttpModule used to make outbound HTTP requests.
- **Integration_Module**: The NestJS module located in `src/integrations/` that encapsulates HTTP communication with MetaApi.
- **Trading_Module**: The NestJS module located in `src/modules/` that exposes trading operations to the rest of the application.
- **Provisioning_Module**: The NestJS module located in `src/modules/` that exposes provisioning operations to the rest of the application.
- **Position**: An open MT5 trade with an unrealized profit/loss.
- **Pending_Order**: An MT5 order that has been placed but not yet filled.
- **Deal**: A completed MT5 transaction recorded in history.
- **Symbol**: A tradeable instrument identifier (e.g., `EURUSD`, `XAUUSD`).
- **Candle**: An OHLCV (open, high, low, close, volume) price bar for a given timeframe.
- **Tick**: A single price update (bid/ask) for a Symbol.
- **Order_Book**: The current depth-of-market data for a Symbol.

---

## Requirements

### Requirement 1: HTTP Client Setup

**User Story:** As a backend developer, I want an HTTP client module configured for MetaApi, so that all outbound API calls share a consistent configuration and can be injected into any service.

#### Acceptance Criteria

1. THE Integration_Module SHALL register `@nestjs/axios` `HttpModule` as a provider available to all MetaApi services.
2. WHEN the application starts, THE Integration_Module SHALL read the `METAAPI_PROVISIONING_BASE_URL` and `METAAPI_TRADING_BASE_URL` environment variables to configure base URLs.
3. IF a required environment variable is missing at startup, THEN THE Integration_Module SHALL throw a configuration error that prevents the application from starting.
4. THE Integration_Module SHALL set a default request timeout of 30000 milliseconds for all outbound HTTP requests.
5. THE Integration_Module SHALL export its HTTP client so that Provisioning_Module and Trading_Module can inject it.

---

### Requirement 2: Environment Configuration

**User Story:** As a developer deploying this service, I want all MetaApi credentials and URLs defined as environment variables, so that secrets are never hardcoded and the service can be configured per environment.

#### Acceptance Criteria

1. THE Integration_Module SHALL read `METAAPI_PROVISIONING_TOKEN` as the Provisioning_Token for Provisioning_API authentication.
2. THE Integration_Module SHALL read `METAAPI_ACCOUNT_TOKEN` as the Account_Token for Trading_API authentication.
3. THE Integration_Module SHALL read `METAAPI_ACCOUNT_ID` as the default Account_ID used in Trading_API requests.
4. THE Integration_Module SHALL read `METAAPI_REGION` as the Region used to construct the Trading_API base URL.
5. THE `.env.example` file SHALL include all required MetaApi environment variable keys with placeholder values and inline comments describing each variable's purpose.

---

### Requirement 3: Provisioning — Account Management

**User Story:** As a platform operator, I want to create, read, update, and delete MT5 accounts via the Provisioning API, so that I can manage the full lifecycle of trading accounts programmatically.

#### Acceptance Criteria

1. WHEN a request to list accounts is made, THE Provisioning_Module SHALL call `GET /users/current/accounts` on the Provisioning_API and return the list of account objects.
2. WHEN a request to retrieve a single account is made with a valid Account_ID, THE Provisioning_Module SHALL call `GET /users/current/accounts/{accountId}` and return the account object.
3. WHEN a request to create an account is made with valid account parameters, THE Provisioning_Module SHALL call `POST /users/current/accounts` with the account payload and return the created account object.
4. WHEN a request to update an account is made with a valid Account_ID and update parameters, THE Provisioning_Module SHALL call `PUT /users/current/accounts/{accountId}` and return the updated account object.
5. WHEN a request to delete an account is made with a valid Account_ID, THE Provisioning_Module SHALL call `DELETE /users/current/accounts/{accountId}` and return a success confirmation.
6. IF the Provisioning_API returns a 4xx or 5xx response, THEN THE Provisioning_Module SHALL throw a typed error containing the HTTP status code and the API error message.

---

### Requirement 4: Provisioning — Account Deployment

**User Story:** As a platform operator, I want to deploy and undeploy MT5 accounts, so that I can control which accounts are actively connected to the MetaApi infrastructure.

#### Acceptance Criteria

1. WHEN a deploy request is made with a valid Account_ID, THE Provisioning_Module SHALL call `POST /users/current/accounts/{accountId}/deploy` and return a success confirmation.
2. WHEN an undeploy request is made with a valid Account_ID, THE Provisioning_Module SHALL call `POST /users/current/accounts/{accountId}/undeploy` and return a success confirmation.
3. WHEN a redeploy request is made with a valid Account_ID, THE Provisioning_Module SHALL call `POST /users/current/accounts/{accountId}/redeploy` and return a success confirmation.
4. IF the Provisioning_API returns a 4xx or 5xx response for a deployment operation, THEN THE Provisioning_Module SHALL throw a typed error containing the HTTP status code and the API error message.

---

### Requirement 5: Provisioning — Demo and Live Account Creation

**User Story:** As a platform operator, I want to create demo and live MT5 accounts through MetaApi, so that users can be onboarded with real or practice trading accounts.

#### Acceptance Criteria

1. WHEN a demo account creation request is made with valid parameters (broker, server, balance, leverage), THE Provisioning_Module SHALL call `POST /users/current/provisioning-profiles/{profileId}/accounts/create-demo` and return the created demo account object.
2. WHEN a live account creation request is made with valid parameters (login, password, server), THE Provisioning_Module SHALL call `POST /users/current/accounts` with `type: "cloud"` and return the created live account object.
3. IF required parameters are missing from a demo or live account creation request, THEN THE Provisioning_Module SHALL throw a validation error before making any API call.

---

### Requirement 6: Trading — Account Information

**User Story:** As a trader, I want to retrieve live account information including balance, equity, and margin, so that I can monitor the financial state of my MT5 account in real time.

#### Acceptance Criteria

1. WHEN an account information request is made with a valid Account_ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/account-information` on the Trading_API and return the account information object.
2. THE Trading_Module SHALL include the Account_Token in the `auth-token` header of every Trading_API request.
3. WHEN the Trading_API returns account information, THE Trading_Module SHALL return an object containing at minimum: `balance`, `equity`, `margin`, `freeMargin`, `marginLevel`, `currency`, and `leverage`.
4. IF the Trading_API returns a 401 response, THEN THE Trading_Module SHALL throw an authentication error indicating the Account_Token is invalid or expired.

---

### Requirement 7: Trading — Positions

**User Story:** As a trader, I want to retrieve all open positions for my MT5 account, so that I can monitor my current exposure and unrealized profit/loss.

#### Acceptance Criteria

1. WHEN a positions request is made with a valid Account_ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/positions` and return the list of open Position objects.
2. WHEN the Trading_API returns positions, THE Trading_Module SHALL return each Position object containing at minimum: `id`, `symbol`, `type`, `volume`, `openPrice`, `currentPrice`, `profit`, and `swap`.
3. WHEN a single position request is made with a valid Account_ID and position ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/positions/{positionId}` and return the Position object.
4. IF no open positions exist, THEN THE Trading_Module SHALL return an empty array.

---

### Requirement 8: Trading — Pending Orders

**User Story:** As a trader, I want to retrieve all pending orders for my MT5 account, so that I can review orders that have been placed but not yet executed.

#### Acceptance Criteria

1. WHEN a pending orders request is made with a valid Account_ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/orders` and return the list of Pending_Order objects.
2. WHEN the Trading_API returns pending orders, THE Trading_Module SHALL return each Pending_Order object containing at minimum: `id`, `symbol`, `type`, `volume`, `openPrice`, `currentPrice`, and `state`.
3. WHEN a single pending order request is made with a valid Account_ID and order ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/orders/{orderId}` and return the Pending_Order object.
4. IF no pending orders exist, THEN THE Trading_Module SHALL return an empty array.

---

### Requirement 9: Trading — History Orders and Deals

**User Story:** As a trader, I want to retrieve historical orders and deals for my MT5 account within a date range, so that I can audit past trading activity and calculate performance metrics.

#### Acceptance Criteria

1. WHEN a history orders request is made with a valid Account_ID, start time, and end time, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/history-orders/time/{startTime}/{endTime}` and return the list of historical order objects.
2. WHEN a history deals request is made with a valid Account_ID, start time, and end time, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/deals/time/{startTime}/{endTime}` and return the list of Deal objects.
3. WHEN a history orders request is made with a valid Account_ID and ticket number, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/history-orders/ticket/{ticket}` and return the matching order objects.
4. WHEN a history deals request is made with a valid Account_ID and ticket number, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/deals/ticket/{ticket}` and return the matching Deal objects.
5. IF the start time is after the end time, THEN THE Trading_Module SHALL throw a validation error before making any API call.

---

### Requirement 10: Trading — Market Data

**User Story:** As a trader, I want to retrieve market data including symbols, current prices, candles, ticks, and order book depth, so that I can make informed trading decisions.

#### Acceptance Criteria

1. WHEN a symbols request is made with a valid Account_ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/symbols` and return the list of available Symbol identifiers.
2. WHEN a symbol specification request is made with a valid Account_ID and Symbol, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/symbols/{symbol}` and return the symbol specification object.
3. WHEN a current price request is made with a valid Account_ID and Symbol, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/symbols/{symbol}/current-price` and return the current bid and ask prices.
4. WHEN a candles request is made with a valid Account_ID, Symbol, and timeframe, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/symbols/{symbol}/candles` with the timeframe query parameter and return the list of Candle objects.
5. WHEN a ticks request is made with a valid Account_ID and Symbol, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/symbols/{symbol}/ticks` and return the list of Tick objects.
6. WHEN an order book request is made with a valid Account_ID and Symbol, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/symbols/{symbol}/book` and return the Order_Book object.
7. IF an unrecognized Symbol is provided, THEN THE Trading_Module SHALL propagate the 404 error from the Trading_API as a typed not-found error.

---

### Requirement 11: Trading — Trade Execution

**User Story:** As a trader, I want to execute market orders, place limit and stop orders, modify existing positions and orders, close positions, and cancel pending orders, so that I can manage my trading activity programmatically.

#### Acceptance Criteria

1. WHEN a market buy request is made with a valid Account_ID, Symbol, and volume, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_TYPE_BUY"` and return the trade result object.
2. WHEN a market sell request is made with a valid Account_ID, Symbol, and volume, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_TYPE_SELL"` and return the trade result object.
3. WHEN a limit buy order request is made with a valid Account_ID, Symbol, volume, and open price, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_TYPE_BUY_LIMIT"` and return the trade result object.
4. WHEN a limit sell order request is made with a valid Account_ID, Symbol, volume, and open price, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_TYPE_SELL_LIMIT"` and return the trade result object.
5. WHEN a stop buy order request is made with a valid Account_ID, Symbol, volume, and open price, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_TYPE_BUY_STOP"` and return the trade result object.
6. WHEN a stop sell order request is made with a valid Account_ID, Symbol, volume, and open price, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_TYPE_SELL_STOP"` and return the trade result object.
7. WHEN a modify position request is made with a valid Account_ID, position ID, and modification parameters (stop loss, take profit), THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "POSITION_MODIFY"` and return the trade result object.
8. WHEN a close position request is made with a valid Account_ID and position ID, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "POSITION_CLOSE_ID"` and return the trade result object.
9. WHEN a close position by symbol request is made with a valid Account_ID and Symbol, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "POSITION_CLOSE_SYMBOL"` and return the trade result object.
10. WHEN a modify order request is made with a valid Account_ID, order ID, and modification parameters, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_MODIFY"` and return the trade result object.
11. WHEN a cancel order request is made with a valid Account_ID and order ID, THE Trading_Module SHALL call `POST /users/current/accounts/{accountId}/trade` with `actionType: "ORDER_CANCEL"` and return the trade result object.
12. IF a trade execution request is missing required parameters (Account_ID, Symbol, or volume for market/limit/stop orders), THEN THE Trading_Module SHALL throw a validation error before making any API call.
13. IF the Trading_API returns a trade error (e.g., insufficient margin, invalid symbol), THEN THE Trading_Module SHALL throw a typed trade error containing the error code and description from the API response.

---

### Requirement 12: Trading — Utilities

**User Story:** As a developer, I want access to utility endpoints such as server time, margin calculation, and CPU credit information, so that I can synchronize timing, pre-validate trade sizes, and monitor API usage.

#### Acceptance Criteria

1. WHEN a server time request is made with a valid Account_ID, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/server-time` and return the server time object.
2. WHEN a margin calculation request is made with a valid Account_ID, Symbol, trade type, and volume, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/margin` with the appropriate query parameters and return the margin requirement object.
3. WHEN a CPU credits request is made, THE Trading_Module SHALL call `GET /users/current/accounts/{accountId}/cpu-credits` and return the current CPU credit balance.

---

### Requirement 13: Error Handling and Resilience

**User Story:** As a backend developer, I want all MetaApi API errors to be caught and re-thrown as typed NestJS exceptions, so that upstream controllers and services receive consistent, structured error information.

#### Acceptance Criteria

1. WHEN the Trading_API or Provisioning_API returns a 400 response, THE MetaApi_Service SHALL throw a `BadRequestException` containing the API error message.
2. WHEN the Trading_API or Provisioning_API returns a 401 response, THE MetaApi_Service SHALL throw an `UnauthorizedException` with a message indicating invalid or expired credentials.
3. WHEN the Trading_API or Provisioning_API returns a 403 response, THE MetaApi_Service SHALL throw a `ForbiddenException` with the API error message.
4. WHEN the Trading_API or Provisioning_API returns a 404 response, THE MetaApi_Service SHALL throw a `NotFoundException` with the API error message.
5. WHEN the Trading_API or Provisioning_API returns a 429 response, THE MetaApi_Service SHALL throw a `TooManyRequestsException` with a message indicating rate limiting.
6. WHEN the Trading_API or Provisioning_API returns a 5xx response, THE MetaApi_Service SHALL throw an `InternalServerErrorException` with the API error message.
7. WHEN an HTTP request times out after 30000 milliseconds, THE MetaApi_Service SHALL throw a `RequestTimeoutException`.
8. THE MetaApi_Service SHALL log all API errors at the `error` log level using the NestJS `Logger` before re-throwing the exception.

---

### Requirement 14: Module Structure and Dependency Injection

**User Story:** As a backend developer, I want the MetaApi integration organized into clearly separated NestJS modules following the project's folder conventions, so that the codebase remains maintainable and each module has a single responsibility.

#### Acceptance Criteria

1. THE Integration_Module SHALL be located at `src/integrations/metaapi/metaapi-http.module.ts` and SHALL export the HTTP client and base configuration.
2. THE Provisioning_Module SHALL be located at `src/modules/provisioning/provisioning.module.ts` and SHALL import the Integration_Module.
3. THE Trading_Module SHALL be located at `src/modules/trading/trading.module.ts` and SHALL import the Integration_Module.
4. THE Provisioning_Module SHALL export a `ProvisioningService` that encapsulates all Provisioning_API calls.
5. THE Trading_Module SHALL export a `TradingService` that encapsulates all Trading_API calls.
6. WHEN the `AppModule` imports the Provisioning_Module and Trading_Module, THE application SHALL resolve all dependencies without circular dependency errors.
7. THE Integration_Module SHALL provide a `MetaApiConfigService` that reads and validates all MetaApi environment variables and exposes typed configuration properties.
