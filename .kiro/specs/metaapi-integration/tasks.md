# Implementation Plan: MetaApi MT5 Integration

## Overview

Implement the MetaApi MT5 integration as three layered NestJS modules: an HTTP integration layer (`MetaApiHttpModule`), a provisioning layer (`ProvisioningModule`), and a trading layer (`TradingModule`). Each layer builds on the previous, ending with wiring everything into `AppModule`.

## Tasks

- [x] 1. Install dependencies and scaffold directory structure
  - Add `@nestjs/axios` and `axios` to production dependencies in `package.json`
  - Add `fast-check` to dev dependencies in `package.json`
  - Create the directory tree: `src/integrations/metaapi/interfaces/`, `src/modules/provisioning/`, `src/modules/trading/`
  - Update `.env.example` with all six MetaApi environment variable keys and inline comments:
    - `METAAPI_PROVISIONING_TOKEN` — main API token for Provisioning API authentication
    - `METAAPI_ACCOUNT_TOKEN` — per-account token for Trading API authentication
    - `METAAPI_ACCOUNT_ID` — default MetaApi-assigned MT5 account identifier
    - `METAAPI_REGION` — geographic region for Trading API base URL (e.g. `new-york`)
    - `METAAPI_PROVISIONING_BASE_URL` — full base URL for the Provisioning API
    - `METAAPI_TRADING_BASE_URL` — full base URL for the Trading API
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2. Implement the HTTP integration layer
  - [x] 2.1 Create TypeScript interfaces barrel
    - Create `src/integrations/metaapi/interfaces/provisioning.interfaces.ts` with `MetaApiAccount`, `CreateAccountDto`, `UpdateAccountDto`, `CreateDemoAccountDto`, `CreateLiveAccountDto`
    - Create `src/integrations/metaapi/interfaces/trading.interfaces.ts` with all trading interfaces: `AccountInformation`, `Position`, `PendingOrder`, `HistoryOrder`, `Deal`, `SymbolSpec`, `CurrentPrice`, `Candle`, `Tick`, `OrderBook`, `TradeActionType`, `TradeDto`, `TradeResult`, `ServerTime`, `MarginDto`, `MarginResult`, `CpuCredits`
    - Create `src/integrations/metaapi/interfaces/index.ts` re-exporting everything from both interface files
    - _Requirements: 14.1_

  - [x] 2.2 Implement `MetaApiConfigService`
    - Create `src/integrations/metaapi/metaapi-config.service.ts` as an `@Injectable()` class
    - Read all six env vars from `process.env` in the constructor (matching the pattern in `src/config/database.config.ts`)
    - Throw `Error` for any missing required var so the app fails fast at startup
    - Expose typed readonly properties: `provisioningToken`, `accountToken`, `accountId`, `region`, `provisioningBaseUrl`, `tradingBaseUrl`
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 14.7_

  - [x] 2.3 Implement `MetaApiHttpModule`
    - Create `src/integrations/metaapi/metaapi-http.module.ts`
    - Import `HttpModule.register({ timeout: 30000 })` from `@nestjs/axios`
    - Provide `MetaApiConfigService`
    - Export both `HttpModule` and `MetaApiConfigService`
    - _Requirements: 1.1, 1.4, 1.5, 14.1_

  - [x] 2.4 Implement `handleHttpError` utility
    - Create `src/integrations/metaapi/metaapi-error.handler.ts`
    - Export a standalone `handleHttpError(error: unknown, logger: Logger): never` function
    - Map `AxiosError` status codes to NestJS exceptions per the design mapping table (400→`BadRequestException`, 401→`UnauthorizedException`, 403→`ForbiddenException`, 404→`NotFoundException`, 429→`HttpException(429)`, 5xx→`InternalServerErrorException`)
    - Handle `ECONNABORTED` code as `RequestTimeoutException`
    - Log all errors at `error` level using the passed `Logger` before throwing
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [ ]* 2.5 Write unit tests for `MetaApiConfigService`
    - Create `src/integrations/metaapi/metaapi-config.service.spec.ts`
    - Write one test per required env var: verify that omitting it throws at construction time
    - Write a success test: all six vars present → properties are set correctly
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.6 Write unit tests for `handleHttpError`
    - Create `src/integrations/metaapi/metaapi-error.handler.spec.ts`
    - Write one test per HTTP status code in the mapping table (400, 401, 403, 404, 429, 500, 502, 503)
    - Write a test for `ECONNABORTED` → `RequestTimeoutException`
    - Write a test for a non-Axios unknown error → `InternalServerErrorException`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [ ]* 2.7 Write property test for HTTP error status code mapping (Property 6)
    - Add to `src/integrations/metaapi/metaapi-error.handler.spec.ts`
    - // Feature: metaapi-integration, Property 6: HTTP error status code mapping
    - Use `fc.constantFrom(400, 401, 403, 404, 429, 500, 502, 503)` to generate status codes
    - For each generated status, assert that `handleHttpError` throws the correct NestJS exception type
    - Assert that the exception message contains the original API error message from the response body
    - Run minimum 100 iterations
    - **Property 6: HTTP error status code mapping**
    - **Validates: Requirements 3.6, 4.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**

- [x] 3. Checkpoint — Ensure all integration layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement `ProvisioningModule` and `ProvisioningService`
  - [x] 4.1 Create `ProvisioningModule`
    - Create `src/modules/provisioning/provisioning.module.ts`
    - Import `MetaApiHttpModule`, provide and export `ProvisioningService`
    - _Requirements: 14.2, 14.4_

  - [x] 4.2 Implement `ProvisioningService` — account CRUD
    - Create `src/modules/provisioning/provisioning.service.ts`
    - Inject `HttpService` and `MetaApiConfigService`
    - Implement `listAccounts()`, `getAccount(accountId)`, `createAccount(dto)`, `updateAccount(accountId, dto)`, `deleteAccount(accountId)`
    - Each method uses `firstValueFrom()` to convert the Observable, includes `auth-token: provisioningToken` header, and wraps in try/catch calling `handleHttpError`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 4.3 Implement `ProvisioningService` — deployment and demo/live account creation
    - Add `deployAccount(accountId)`, `undeployAccount(accountId)`, `redeployAccount(accountId)` to `ProvisioningService`
    - Add `createDemoAccount(profileId, dto)` calling `POST /users/current/provisioning-profiles/{profileId}/accounts/create-demo`
    - Add `createLiveAccount(dto)` calling `POST /users/current/accounts` with `type: "cloud"` always set in the body
    - Throw `BadRequestException` before any HTTP call if required parameters are missing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_

  - [ ]* 4.4 Write unit tests for `ProvisioningService`
    - Create `src/modules/provisioning/provisioning.service.spec.ts`
    - Mock `HttpService` and `MetaApiConfigService`
    - Write success-path tests for all 10 methods: verify correct HTTP verb, URL, and headers
    - Write error-path tests: mock `HttpService` to throw `AxiosError`, verify `handleHttpError` is invoked
    - Write validation tests for `createDemoAccount` and `createLiveAccount` with missing required params
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

  - [ ]* 4.5 Write property test for Provisioning URL construction (Property 1)
    - Add to `src/modules/provisioning/provisioning.service.spec.ts`
    - // Feature: metaapi-integration, Property 1: Provisioning URL construction
    - Use `fc.string()` to generate arbitrary accountId and profileId values
    - For each generated ID, call each `ProvisioningService` method and assert the captured request URL contains the exact ID at the correct path position
    - Assert the base URL matches `METAAPI_PROVISIONING_BASE_URL`
    - Run minimum 100 iterations
    - **Property 1: Provisioning URL construction**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 5.1**

  - [ ]* 4.6 Write property test for live account type field (Property 8)
    - Add to `src/modules/provisioning/provisioning.service.spec.ts`
    - // Feature: metaapi-integration, Property 8: Live account creation always sets type to "cloud"
    - Use `fc.record({ name: fc.string(), login: fc.string(), password: fc.string(), server: fc.string(), provisioningProfileId: fc.string() })` to generate arbitrary live account payloads
    - For each generated payload, call `createLiveAccount(dto)` and assert the captured POST body always contains `type: "cloud"`
    - Run minimum 100 iterations
    - **Property 8: Live account creation always sets type to "cloud"**
    - **Validates: Requirements 5.2**

- [x] 5. Checkpoint — Ensure all provisioning tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement `TradingModule` and `TradingService`
  - [x] 6.1 Create `TradingModule`
    - Create `src/modules/trading/trading.module.ts`
    - Import `MetaApiHttpModule`, provide and export `TradingService`
    - _Requirements: 14.3, 14.5_

  - [x] 6.2 Implement `TradingService` — account information, positions, and orders
    - Create `src/modules/trading/trading.service.ts`
    - Inject `HttpService` and `MetaApiConfigService`
    - Add a private helper that builds the standard `{ headers: { 'auth-token': this.config.accountToken } }` config object
    - Implement `getAccountInformation(accountId)`, `getPositions(accountId)`, `getPosition(accountId, positionId)`, `getOrders(accountId)`, `getOrder(accountId, orderId)`
    - Each method uses `firstValueFrom()`, includes `auth-token` header, and wraps in try/catch calling `handleHttpError`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

  - [x] 6.3 Implement `TradingService` — history orders and deals
    - Add `getHistoryOrdersByTime(accountId, startTime, endTime)`, `getHistoryDealsByTime(accountId, startTime, endTime)`, `getHistoryOrdersByTicket(accountId, ticket)`, `getHistoryDealsByTicket(accountId, ticket)` to `TradingService`
    - Throw `BadRequestException` before any HTTP call when `startTime > endTime`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 6.4 Implement `TradingService` — market data
    - Add `getSymbols(accountId)`, `getSymbolSpec(accountId, symbol)`, `getCurrentPrice(accountId, symbol)`, `getCandles(accountId, symbol, timeframe)`, `getTicks(accountId, symbol)`, `getOrderBook(accountId, symbol)` to `TradingService`
    - Pass `timeframe` as a query parameter for `getCandles`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 6.5 Implement `TradingService` — trade execution and utilities
    - Add `executeTrade(accountId, dto)` calling `POST /users/current/accounts/{accountId}/trade` with the full `TradeDto` body
    - Throw `BadRequestException` before any HTTP call if `actionType`, or required fields for market/limit/stop orders (`symbol`, `volume`) are missing
    - Add `getServerTime(accountId)`, `calculateMargin(accountId, dto)`, `getCpuCredits(accountId)` to `TradingService`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11, 11.12, 11.13, 12.1, 12.2, 12.3_

  - [ ]* 6.6 Write unit tests for `TradingService`
    - Create `src/modules/trading/trading.service.spec.ts`
    - Mock `HttpService` and `MetaApiConfigService`
    - Write success-path tests for all methods: verify correct HTTP verb, URL, and `auth-token` header
    - Write error-path tests: mock `HttpService` to throw `AxiosError`, verify `handleHttpError` is invoked
    - Write validation tests for `getHistoryOrdersByTime`/`getHistoryDealsByTime` with `startTime > endTime`
    - Write validation tests for `executeTrade` with missing required fields
    - _Requirements: 6.1, 6.2, 7.1, 7.3, 8.1, 8.3, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.12, 12.1, 12.2, 12.3_

  - [ ]* 6.7 Write property test for Trading URL construction (Property 2)
    - Add to `src/modules/trading/trading.service.spec.ts`
    - // Feature: metaapi-integration, Property 2: Trading URL construction
    - Use `fc.string()` to generate arbitrary accountId, symbol, and timeframe values
    - For each generated value, call each `TradingService` method and assert the captured request URL contains the exact values at the correct path positions
    - Assert the base URL matches `METAAPI_TRADING_BASE_URL`
    - Run minimum 100 iterations
    - **Property 2: Trading URL construction**
    - **Validates: Requirements 6.1, 7.1, 7.3, 8.1, 8.3, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 12.1, 12.2, 12.3**

  - [ ]* 6.8 Write property test for auth-token header on every Trading request (Property 3)
    - Add to `src/modules/trading/trading.service.spec.ts`
    - // Feature: metaapi-integration, Property 3: Auth-token header on every Trading request
    - Use `fc.string()` to generate arbitrary token values; set `MetaApiConfigService.accountToken` to each generated value
    - For each generated token, call a representative set of `TradingService` methods and assert every captured request includes `auth-token` header equal to the generated token
    - Run minimum 100 iterations
    - **Property 3: Auth-token header on every Trading request**
    - **Validates: Requirements 6.2**

  - [ ]* 6.9 Write property test for response field presence (Property 4)
    - Add to `src/modules/trading/trading.service.spec.ts`
    - // Feature: metaapi-integration, Property 4: Response passthrough preserves required fields
    - Use `fc.record()` with `fc.float()` / `fc.string()` generators to produce arbitrary `AccountInformation` and `Position` response objects that include all required fields
    - Mock `HttpService` to return each generated object; assert the service method returns an object containing all required fields unchanged
    - Run minimum 100 iterations
    - **Property 4: Response passthrough preserves required fields**
    - **Validates: Requirements 6.3, 7.2, 8.2**

  - [ ]* 6.10 Write property test for trade action type correctness (Property 5)
    - Add to `src/modules/trading/trading.service.spec.ts`
    - // Feature: metaapi-integration, Property 5: Trade action type correctness
    - Use `fc.constantFrom('ORDER_TYPE_BUY', 'ORDER_TYPE_SELL', 'ORDER_TYPE_BUY_LIMIT', 'ORDER_TYPE_SELL_LIMIT', 'ORDER_TYPE_BUY_STOP', 'ORDER_TYPE_SELL_STOP', 'POSITION_MODIFY', 'POSITION_CLOSE_ID', 'POSITION_CLOSE_SYMBOL', 'ORDER_MODIFY', 'ORDER_CANCEL')` to generate action types
    - For each generated `actionType`, call `executeTrade` with a matching `TradeDto` and assert the captured POST body contains `actionType` equal to the generated value
    - Run minimum 100 iterations
    - **Property 5: Trade action type correctness**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 11.11**

  - [ ]* 6.11 Write property test for history time range validation (Property 7)
    - Add to `src/modules/trading/trading.service.spec.ts`
    - // Feature: metaapi-integration, Property 7: History time range validation
    - Use `fc.date()` to generate pairs of dates; filter to keep only pairs where `startTime > endTime`
    - For each invalid pair, assert that `getHistoryOrdersByTime` and `getHistoryDealsByTime` throw a `BadRequestException` without making any HTTP call
    - Run minimum 100 iterations
    - **Property 7: History time range validation**
    - **Validates: Requirements 9.5**

- [x] 7. Checkpoint — Ensure all trading tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Wire modules into `AppModule` and verify application startup
  - [x] 8.1 Update `AppModule` to import `ProvisioningModule` and `TradingModule`
    - Modify `src/app.module.ts` to add `ProvisioningModule` and `TradingModule` to the `imports` array alongside `DatabaseModule`
    - _Requirements: 14.6_

  - [x] 8.2 Verify no circular dependency errors
    - Run `npm run build` to confirm TypeScript compilation succeeds with no circular dependency or missing provider errors
    - _Requirements: 14.6_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each layer boundary
- Property tests validate universal correctness properties using `fast-check` with a minimum of 100 iterations each
- Unit tests validate specific examples, edge cases, and error conditions
- The existing `src/metaapi/` folder is intentionally left empty per the design decision
