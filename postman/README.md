# Postman Collection for MetaAPI Trading Platform

This folder contains a complete Postman collection for testing the MetaAPI Trading Platform REST API with all 32 endpoints.

## File

- **postman_collection.json** - Complete API collection with all endpoints and example requests

## Import Instructions

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Click **Choose Files**
5. Navigate to the `postman` folder and select `postman_collection.json`
6. Click **Import**

## Collection Structure

### Provisioning (10 endpoints)

#### Account Management
- **List All Accounts** - `GET /provisioning/accounts`
- **Get Account by ID** - `GET /provisioning/accounts/:accountId`
- **Create Account** - `POST /provisioning/accounts`
- **Update Account** - `PUT /provisioning/accounts/:accountId`
- **Delete Account** - `DELETE /provisioning/accounts/:accountId`

#### Deployment Control
- **Deploy Account** - `POST /provisioning/accounts/:accountId/deploy`
- **Undeploy Account** - `POST /provisioning/accounts/:accountId/undeploy`
- **Redeploy Account** - `POST /provisioning/accounts/:accountId/redeploy`

#### Account Creation
- **Create Demo Account** - `POST /provisioning/profiles/:profileId/demo-accounts`
- **Create Live Account** - `POST /provisioning/live-accounts`

### Trading (22 endpoints)

#### Account Information (3 endpoints)
- Get Account Information
- Get Server Time
- Get CPU Credits

#### Positions (2 endpoints)
- Get All Positions
- Get Position by ID

#### Orders (4 endpoints)
- Get Pending Orders
- Get Order by ID
- Get Historical Orders by Time
- Get Historical Orders by Ticket

#### Deals (2 endpoints)
- Get Deals by Time
- Get Deals by Ticket

#### Market Data (6 endpoints)
- Get Symbols
- Get Symbol Specification
- Get Current Price
- Get Candles
- Get Ticks
- Get Order Book

#### Trade Execution (5 examples)
- Execute Trade - Market Buy
- Execute Trade - Market Sell
- Execute Trade - Limit Order
- Close Position
- Modify Position

#### Margin Calculation (1 endpoint)
- Calculate Margin

## Usage

All requests use `http://localhost:3000` as the base URL. If your application runs on a different port, you'll need to update the URLs in each request.

### Quick Start

1. **Create an Account**
   - Open: Provisioning > Account Management > Create Account
   - Click **Send**
   - Copy the `_id` from the response

2. **Update URLs with Account ID**
   - Replace `:accountId` in URLs with your actual account ID
   - Example: Change `/accounts/:accountId` to `/accounts/abc123`

3. **Deploy the Account**
   - Open: Provisioning > Deployment Control > Deploy Account
   - Update the URL with your account ID
   - Click **Send**

4. **Test Trading Endpoints**
   - Use your account ID in trading endpoint URLs
   - Execute trades, get positions, view market data

## Request Examples

### Create Account
```json
{
  "name": "My Trading Account",
  "type": "cloud",
  "login": "12345678",
  "password": "SecurePassword123!",
  "server": "ICMarketsSC-Demo",
  "provisioningProfileId": "your-profile-id",
  "magic": 123456,
  "platform": "mt4"
}
```

### Execute Market Buy Order
```json
{
  "actionType": "ORDER_TYPE_BUY",
  "symbol": "EURUSD",
  "volume": 0.01,
  "stopLoss": 1.0800,
  "takeProfit": 1.1000,
  "comment": "Test trade"
}
```

## Valid Values Reference

### Action Types
- `ORDER_TYPE_BUY` - Market buy
- `ORDER_TYPE_SELL` - Market sell
- `ORDER_TYPE_BUY_LIMIT` - Buy limit
- `ORDER_TYPE_SELL_LIMIT` - Sell limit
- `ORDER_TYPE_BUY_STOP` - Buy stop
- `ORDER_TYPE_SELL_STOP` - Sell stop
- `POSITION_MODIFY` - Modify position
- `POSITION_CLOSE_ID` - Close position
- `ORDER_MODIFY` - Modify order
- `ORDER_CANCEL` - Cancel order

### Timeframes
- `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`, `1M`

### Common Symbols
- `EURUSD`, `GBPUSD`, `USDJPY`, `AUDUSD`, `USDCAD`, `NZDUSD`

## Error Responses

```json
{
  "statusCode": 400,
  "message": ["error message"],
  "error": "Bad Request"
}
```

### Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Deleted
- `400 Bad Request` - Validation error
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Additional Resources

- **Swagger UI**: http://localhost:3000/api
- **Manual Testing Guide**: ../MANUAL_TESTING_GUIDE.md
- **README**: ../README.md
