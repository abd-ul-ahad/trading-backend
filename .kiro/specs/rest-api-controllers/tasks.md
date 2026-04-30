# Implementation Plan: REST API Controllers

## Overview

This implementation plan breaks down the REST API Controllers feature into discrete coding tasks. The plan follows a 4-phase approach: setup and infrastructure, provisioning module implementation, trading module implementation, and documentation/testing. Each task builds incrementally on previous work, with checkpoints to ensure quality and integration.

## Tasks

- [x] 1. Setup infrastructure and global configuration
  - [x] 1.1 Install required dependencies and configure validation pipeline
    - Install @nestjs/swagger, class-validator, and class-transformer packages
    - Configure global ValidationPipe in src/main.ts with whitelist, forbidNonWhitelisted, and transform options
    - Setup Swagger documentation using DocumentBuilder and SwaggerModule
    - Configure Swagger UI to be available at /api endpoint
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 1.2 Write unit tests for main.ts configuration
    - Test that ValidationPipe is configured correctly
    - Test that Swagger documentation is generated
    - _Requirements: 12.1_

- [x] 2. Implement Provisioning DTOs with validation
  - [x] 2.1 Create CreateAccountDto with validation decorators
    - Create src/modules/provisioning/dto/create-account.dto.ts
    - Add validation decorators for name, type, login, password, server, provisioningProfileId
    - Add Swagger decorators for API documentation
    - _Requirements: 10.1, 1.3_
  
  - [x] 2.2 Create UpdateAccountDto with validation decorators
    - Create src/modules/provisioning/dto/update-account.dto.ts
    - Add optional validation decorators for name, password, server, magic
    - Add Swagger decorators for API documentation
    - _Requirements: 10.2, 1.4_
  
  - [x] 2.3 Create CreateDemoAccountDto with validation decorators
    - Create src/modules/provisioning/dto/create-demo-account.dto.ts
    - Add validation decorators for name, balance, leverage, serverName
    - Add Swagger decorators for API documentation
    - _Requirements: 10.3, 3.3_
  
  - [x] 2.4 Create CreateLiveAccountDto with validation decorators
    - Create src/modules/provisioning/dto/create-live-account.dto.ts
    - Add validation decorators for name, login, password, server, provisioningProfileId
    - Add Swagger decorators for API documentation
    - _Requirements: 10.4, 3.4_
  
  - [x] 2.5 Create DTO index file for clean exports
    - Create src/modules/provisioning/dto/index.ts
    - Export all provisioning DTOs
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 3. Implement Provisioning Controller with all endpoints
  - [x] 3.1 Create ProvisioningController class with basic structure
    - Create src/modules/provisioning/provisioning.controller.ts
    - Add @Controller('provisioning') decorator
    - Add @ApiTags('Provisioning') decorator for Swagger grouping
    - Inject ProvisioningService via constructor
    - _Requirements: 1.1, 12.2_
  
  - [x] 3.2 Implement account management endpoints (GET, POST, PUT, DELETE)
    - Implement GET /provisioning/accounts endpoint with listAccounts method
    - Implement GET /provisioning/accounts/:accountId endpoint with getAccount method
    - Implement POST /provisioning/accounts endpoint with createAccount method using CreateAccountDto
    - Implement PUT /provisioning/accounts/:accountId endpoint with updateAccount method using UpdateAccountDto
    - Implement DELETE /provisioning/accounts/:accountId endpoint with deleteAccount method
    - Add Swagger decorators (@ApiOperation, @ApiResponse, @ApiParam, @ApiBody) to all endpoints
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.3, 12.4, 12.5, 12.6_
  
  - [x] 3.3 Implement deployment control endpoints
    - Implement POST /provisioning/accounts/:accountId/deploy endpoint with deployAccount method
    - Implement POST /provisioning/accounts/:accountId/undeploy endpoint with undeployAccount method
    - Implement POST /provisioning/accounts/:accountId/redeploy endpoint with redeployAccount method
    - Add @HttpCode(200) decorator to deployment endpoints
    - Add Swagger decorators to all deployment endpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 12.3, 12.4_
  
  - [x] 3.4 Implement demo and live account creation endpoints
    - Implement POST /provisioning/profiles/:profileId/demo-accounts endpoint with createDemoAccount method using CreateDemoAccountDto
    - Implement POST /provisioning/live-accounts endpoint with createLiveAccount method using CreateLiveAccountDto
    - Add @HttpCode(201) decorator to account creation endpoints
    - Add Swagger decorators to both endpoints
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.3, 12.4, 12.6_
  
  - [x] 3.5 Update ProvisioningModule to register controller
    - Update src/modules/provisioning/provisioning.module.ts
    - Add ProvisioningController to controllers array
    - _Requirements: 1.1_
  
  - [ ]* 3.6 Write unit tests for ProvisioningController
    - Create src/modules/provisioning/provisioning.controller.spec.ts
    - Mock ProvisioningService
    - Test all endpoint methods with valid inputs
    - Test error handling scenarios
    - Test that service methods are called with correct parameters
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 4. Checkpoint - Verify provisioning endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Trading DTOs with validation
  - [x] 5.1 Create TradeDto with validation decorators
    - Create src/modules/trading/dto/trade.dto.ts
    - Add validation decorators for actionType, symbol, volume, openPrice, stopLoss, takeProfit, positionId, orderId, comment
    - Add Swagger decorators with enum values for actionType
    - _Requirements: 10.5, 8.2, 8.3_
  
  - [x] 5.2 Create TimeRangeQueryDto with validation decorators
    - Create src/modules/trading/dto/time-range-query.dto.ts
    - Add @IsDateString validation for startTime and endTime
    - Add Swagger decorators with ISO 8601 format examples
    - _Requirements: 5.5, 6.3_
  
  - [x] 5.3 Create CandlesQueryDto with validation decorators
    - Create src/modules/trading/dto/candles-query.dto.ts
    - Add validation decorator for timeframe with enum values
    - Add Swagger decorators
    - _Requirements: 7.7_
  
  - [x] 5.4 Create MarginQueryDto with validation decorators
    - Create src/modules/trading/dto/margin-query.dto.ts
    - Add validation decorators for symbol, type, and volume
    - Add Swagger decorators
    - _Requirements: 9.2_
  
  - [x] 5.5 Create DTO index file for clean exports
    - Create src/modules/trading/dto/index.ts
    - Export all trading DTOs
    - _Requirements: 10.5_

- [x] 6. Implement Trading Controller - Account Information Endpoints
  - [x] 6.1 Create TradingController class with basic structure
    - Create src/modules/trading/trading.controller.ts
    - Add @Controller('trading') decorator
    - Add @ApiTags('Trading') decorator for Swagger grouping
    - Inject TradingService via constructor
    - _Requirements: 4.1, 12.2_
  
  - [x] 6.2 Implement account information endpoints
    - Implement GET /trading/accounts/:accountId/information endpoint with getAccountInformation method
    - Implement GET /trading/accounts/:accountId/server-time endpoint with getServerTime method
    - Implement GET /trading/accounts/:accountId/cpu-credits endpoint with getCpuCredits method
    - Add Swagger decorators to all endpoints
    - _Requirements: 4.1, 4.4, 4.5, 12.3, 12.4, 12.5_
  
  - [x] 6.3 Implement position endpoints
    - Implement GET /trading/accounts/:accountId/positions endpoint with getPositions method
    - Implement GET /trading/accounts/:accountId/positions/:positionId endpoint with getPosition method
    - Add Swagger decorators to both endpoints
    - _Requirements: 4.2, 4.3, 12.3, 12.4, 12.5_

- [x] 7. Implement Trading Controller - Order Endpoints
  - [x] 7.1 Implement pending order endpoints
    - Implement GET /trading/accounts/:accountId/orders endpoint with getOrders method
    - Implement GET /trading/accounts/:accountId/orders/:orderId endpoint with getOrder method
    - Add Swagger decorators to both endpoints
    - _Requirements: 5.1, 5.2, 12.3, 12.4, 12.5_
  
  - [x] 7.2 Implement historical order endpoints
    - Implement GET /trading/accounts/:accountId/history-orders/time endpoint with getHistoryOrdersByTime method using TimeRangeQueryDto
    - Implement GET /trading/accounts/:accountId/history-orders/ticket/:ticket endpoint with getHistoryOrdersByTicket method
    - Add Swagger decorators including @ApiQuery for time range parameters
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 12.3, 12.4, 12.5, 12.7_
  
  - [x] 7.3 Implement deal history endpoints
    - Implement GET /trading/accounts/:accountId/deals/time endpoint with getHistoryDealsByTime method using TimeRangeQueryDto
    - Implement GET /trading/accounts/:accountId/deals/ticket/:ticket endpoint with getHistoryDealsByTicket method
    - Add Swagger decorators including @ApiQuery for time range parameters
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 12.3, 12.4, 12.5, 12.7_

- [x] 8. Implement Trading Controller - Market Data Endpoints
  - [x] 8.1 Implement symbol information endpoints
    - Implement GET /trading/accounts/:accountId/symbols endpoint with getSymbols method
    - Implement GET /trading/accounts/:accountId/symbols/:symbol/specification endpoint with getSymbolSpec method
    - Implement GET /trading/accounts/:accountId/symbols/:symbol/price endpoint with getCurrentPrice method
    - Add Swagger decorators to all endpoints
    - _Requirements: 7.1, 7.2, 7.3, 12.3, 12.4, 12.5_
  
  - [x] 8.2 Implement market data endpoints
    - Implement GET /trading/accounts/:accountId/symbols/:symbol/candles endpoint with getCandles method using CandlesQueryDto
    - Implement GET /trading/accounts/:accountId/symbols/:symbol/ticks endpoint with getTicks method
    - Implement GET /trading/accounts/:accountId/symbols/:symbol/order-book endpoint with getOrderBook method
    - Add Swagger decorators including @ApiQuery for candles timeframe parameter
    - _Requirements: 7.4, 7.5, 7.6, 7.7, 12.3, 12.4, 12.5, 12.7_

- [x] 9. Implement Trading Controller - Trade Execution and Margin
  - [x] 9.1 Implement trade execution endpoint
    - Implement POST /trading/accounts/:accountId/trade endpoint with executeTrade method using TradeDto
    - Add Swagger decorators including @ApiBody for TradeDto
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.3, 12.4, 12.6_
  
  - [x] 9.2 Implement margin calculation endpoint
    - Implement GET /trading/accounts/:accountId/margin endpoint with calculateMargin method using MarginQueryDto
    - Add Swagger decorators including @ApiQuery for margin parameters
    - _Requirements: 9.1, 9.2, 9.3, 12.3, 12.4, 12.7_
  
  - [x] 9.3 Update TradingModule to register controller
    - Update src/modules/trading/trading.module.ts
    - Add TradingController to controllers array
    - _Requirements: 4.1_
  
  - [ ]* 9.4 Write unit tests for TradingController
    - Create src/modules/trading/trading.controller.spec.ts
    - Mock TradingService
    - Test all endpoint methods with valid inputs
    - Test error handling scenarios
    - Test that service methods are called with correct parameters
    - Test query parameter validation for time ranges, candles, and margin
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 9.1, 9.2_

- [x] 10. Checkpoint - Verify trading endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement E2E tests for Provisioning endpoints
  - [ ]* 11.1 Create E2E test suite for provisioning endpoints
    - Create test/provisioning.e2e-spec.ts
    - Setup test module with real NestJS application instance
    - Mock MetaAPI HTTP calls using nock or similar
    - Test GET /provisioning/accounts endpoint
    - Test GET /provisioning/accounts/:accountId endpoint
    - Test POST /provisioning/accounts endpoint with valid and invalid data
    - Test PUT /provisioning/accounts/:accountId endpoint with valid and invalid data
    - Test DELETE /provisioning/accounts/:accountId endpoint
    - Test deployment endpoints (deploy, undeploy, redeploy)
    - Test demo and live account creation endpoints
    - Test validation error responses (400 status)
    - Test error handling for non-existent resources (404 status)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2, 10.3, 10.4, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12. Implement E2E tests for Trading endpoints
  - [ ]* 12.1 Create E2E test suite for trading account and position endpoints
    - Create test/trading.e2e-spec.ts
    - Setup test module with real NestJS application instance
    - Mock MetaAPI HTTP calls
    - Test GET /trading/accounts/:accountId/information endpoint
    - Test GET /trading/accounts/:accountId/positions endpoint
    - Test GET /trading/accounts/:accountId/positions/:positionId endpoint
    - Test GET /trading/accounts/:accountId/server-time endpoint
    - Test GET /trading/accounts/:accountId/cpu-credits endpoint
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 12.2 Create E2E tests for trading order endpoints
    - Test GET /trading/accounts/:accountId/orders endpoint
    - Test GET /trading/accounts/:accountId/orders/:orderId endpoint
    - Test GET /trading/accounts/:accountId/history-orders/time endpoint with valid time range
    - Test GET /trading/accounts/:accountId/history-orders/time endpoint with invalid time range (startTime > endTime)
    - Test GET /trading/accounts/:accountId/history-orders/ticket/:ticket endpoint
    - Test GET /trading/accounts/:accountId/deals/time endpoint with valid time range
    - Test GET /trading/accounts/:accountId/deals/time endpoint with invalid time range
    - Test GET /trading/accounts/:accountId/deals/ticket/:ticket endpoint
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 12.3 Create E2E tests for market data endpoints
    - Test GET /trading/accounts/:accountId/symbols endpoint
    - Test GET /trading/accounts/:accountId/symbols/:symbol/specification endpoint
    - Test GET /trading/accounts/:accountId/symbols/:symbol/price endpoint
    - Test GET /trading/accounts/:accountId/symbols/:symbol/candles endpoint with valid timeframe
    - Test GET /trading/accounts/:accountId/symbols/:symbol/candles endpoint without timeframe (validation error)
    - Test GET /trading/accounts/:accountId/symbols/:symbol/ticks endpoint
    - Test GET /trading/accounts/:accountId/symbols/:symbol/order-book endpoint
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [ ]* 12.4 Create E2E tests for trade execution and margin endpoints
    - Test POST /trading/accounts/:accountId/trade endpoint with valid TradeDto
    - Test POST /trading/accounts/:accountId/trade endpoint without actionType (validation error)
    - Test POST /trading/accounts/:accountId/trade endpoint with market order missing symbol/volume (validation error)
    - Test GET /trading/accounts/:accountId/margin endpoint with valid parameters
    - Test GET /trading/accounts/:accountId/margin endpoint with missing parameters (validation error)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 10.5, 10.6_

- [x] 13. Final integration and documentation
  - [x] 13.1 Verify Swagger documentation completeness
    - Start the application and navigate to /api endpoint
    - Verify all provisioning endpoints are documented
    - Verify all trading endpoints are documented
    - Verify all DTOs are properly documented with examples
    - Verify all response types are documented
    - Verify all error responses are documented
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_
  
  - [x] 13.2 Update README with API documentation
    - Add section describing the REST API endpoints
    - Add link to Swagger UI documentation at /api
    - Add examples of common API usage patterns
    - Document how to run the application and access the API
    - _Requirements: 12.1_
  
  - [x] 13.3 Manual testing of all endpoints
    - Test all provisioning endpoints using Swagger UI or Postman
    - Test all trading endpoints using Swagger UI or Postman
    - Verify error responses are consistent and informative
    - Verify validation errors return clear messages
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 14. Final checkpoint - Complete verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The implementation follows the 4-phase plan from the design document
- All DTOs use class-validator decorators for automatic validation
- All controllers use Swagger decorators for automatic API documentation
- Unit tests mock the service layer to test controller logic in isolation
- E2E tests use the full NestJS application to test the complete HTTP request/response cycle
