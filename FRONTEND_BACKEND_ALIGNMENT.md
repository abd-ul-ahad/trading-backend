# Frontend-Backend Alignment Guide

## Overview

This document explains how to perfectly align your frontend with the backend APIs. It includes all endpoints, their responses, and exactly where to implement each API in your frontend.

---

## Architecture Overview

```
Frontend (React/Vue/HTML)
    ↓
HTTP Requests (REST API)
    ↓
Backend (NestJS)
    ↓
Database (PostgreSQL)
```

---

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

---

# PART 1: STRATEGY VIEWING APIs (READ-ONLY)

## 1.1 Display Strategy (Admin Dashboard)

### Backend Endpoint
```
GET /strategies/:id
```

### Response (200 OK)
```json
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

### Frontend Implementation

**Where to use**: Admin Dashboard → Strategy Details Panel (Read-Only View)

**React Example**:
```jsx
function StrategyView({ strategyId }) {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStrategy();
  }, [strategyId]);

  const fetchStrategy = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/strategies/${strategyId}`);
      if (!response.ok) throw new Error('Failed to load strategy');
      const data = await response.json();
      setStrategy(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading strategy...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!strategy) return <div>No strategy found</div>;

  return (
    <div className="strategy-view">
      <div className="strategy-header">
        <h2>{strategy.name}</h2>
        <span className={`status ${strategy.status}`}>{strategy.status.toUpperCase()}</span>
      </div>

      <div className="strategy-info">
        <div className="info-item">
          <label>Description</label>
          <p>{strategy.description}</p>
        </div>

        <div className="info-item">
          <label>Initial Capital</label>
          <p>${strategy.initial_capital.toLocaleString()}</p>
        </div>

        <div className="info-item">
          <label>Account ID</label>
          <p className="monospace">{strategy.account_id}</p>
        </div>

        <div className="info-item">
          <label>Created</label>
          <p>{new Date(strategy.createdAt).toLocaleString()}</p>
        </div>

        <div className="info-item">
          <label>Last Updated</label>
          <p>{new Date(strategy.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
```

**Vue Example**:
```vue
<template>
  <div class="strategy-view">
    <div v-if="loading" class="loading">Loading strategy...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="strategy" class="strategy-container">
      <div class="strategy-header">
        <h2>{{ strategy.name }}</h2>
        <span :class="`status ${strategy.status}`">{{ strategy.status.toUpperCase() }}</span>
      </div>

      <div class="strategy-info">
        <div class="info-item">
          <label>Description</label>
          <p>{{ strategy.description }}</p>
        </div>

        <div class="info-item">
          <label>Initial Capital</label>
          <p>${{ strategy.initial_capital.toLocaleString() }}</p>
        </div>

        <div class="info-item">
          <label>Account ID</label>
          <p class="monospace">{{ strategy.account_id }}</p>
        </div>

        <div class="info-item">
          <label>Created</label>
          <p>{{ new Date(strategy.createdAt).toLocaleString() }}</p>
        </div>

        <div class="info-item">
          <label>Last Updated</label>
          <p>{{ new Date(strategy.updatedAt).toLocaleString() }}</p>
        </div>
      </div>
    </div>
    <div v-else>No strategy found</div>
  </div>
</template>

<script>
export default {
  props: {
    strategyId: String
  },
  data() {
    return {
      strategy: null,
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchStrategy();
  },
  methods: {
    async fetchStrategy() {
      try {
        this.loading = true;
        const response = await fetch(`http://localhost:3000/strategies/${this.strategyId}`);
        if (!response.ok) throw new Error('Failed to load strategy');
        this.strategy = await response.json();
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 1.2 Display All Strategies (Admin Dashboard - List View)

### Backend Endpoint
```
GET /strategies
```

### Response (200 OK)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "EUR/USD Scalper",
    "description": "A scalping strategy",
    "account_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "initial_capital": 10000,
    "createdAt": "2024-05-19T10:30:00.000Z",
    "updatedAt": "2024-05-19T10:30:00.000Z"
  }
]
```

### Frontend Implementation

**Where to use**: Admin Dashboard → Strategies List (Read-Only Display)

**React Example**:
```jsx
function StrategiesList() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/strategies');
      if (!response.ok) throw new Error('Failed to load strategies');
      const data = await response.json();
      setStrategies(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading strategies...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="strategies-container">
      <h2>All Strategies</h2>
      
      {strategies.length === 0 ? (
        <p className="no-data">No strategies available</p>
      ) : (
        <div className="strategies-grid">
          {strategies.map(strategy => (
            <div key={strategy.id} className="strategy-card">
              <h3>{strategy.name}</h3>
              <p className="description">{strategy.description}</p>
              
              <div className="strategy-details">
                <span className={`status ${strategy.status}`}>
                  {strategy.status}
                </span>
                <span className="initial-capital">
                  Capital: ${strategy.initial_capital.toLocaleString()}
                </span>
              </div>
              
              <div className="card-footer">
                <small>Created: {new Date(strategy.createdAt).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Vue Example**:
```vue
<template>
  <div class="strategies-container">
    <h2>All Strategies</h2>
    
    <div v-if="loading" class="loading">Loading strategies...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="strategies.length === 0" class="no-data">No strategies available</div>
    
    <div v-else class="strategies-grid">
      <div v-for="strategy in strategies" :key="strategy.id" class="strategy-card">
        <h3>{{ strategy.name }}</h3>
        <p class="description">{{ strategy.description }}</p>
        
        <div class="strategy-details">
          <span :class="`status ${strategy.status}`">{{ strategy.status }}</span>
          <span class="initial-capital">
            Capital: ${{ strategy.initial_capital.toLocaleString() }}
          </span>
        </div>
        
        <div class="card-footer">
          <small>Created: {{ new Date(strategy.createdAt).toLocaleDateString() }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      strategies: [],
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchStrategies();
  },
  methods: {
    async fetchStrategies() {
      try {
        this.loading = true;
        const response = await fetch('http://localhost:3000/strategies');
        if (!response.ok) throw new Error('Failed to load strategies');
        this.strategies = await response.json();
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 1.3 Display Strategy Performance (Real-Time)

### Backend Endpoint
```
GET /strategies/:id/performance
```

### Response (200 OK)
```json
{
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "totalReturn": 15.5,
  "totalPnL": 1550.00,
  "unrealizedPnL": 250.00,
  "realizedPnL": 1300.00,
  "winRate": 0.65,
  "totalTrades": 100,
  "winningTrades": 65,
  "losingTrades": 35,
  "maxDrawdown": -8.5,
  "currentDrawdown": -2.1,
  "lastUpdated": "2024-05-19T10:30:00.000Z"
}
```

### Frontend Implementation

**Where to use**: Admin Dashboard → Strategy Performance Panel (Real-Time Display)

**React Example**:
```jsx
function StrategyPerformance({ strategyId }) {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformance();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformance, 30000);
    return () => clearInterval(interval);
  }, [strategyId]);

  const fetchPerformance = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/strategies/${strategyId}/performance`
      );
      if (!response.ok) throw new Error('Failed to load performance');
      const data = await response.json();
      setPerformance(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading performance...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!performance) return <div>No performance data</div>;

  return (
    <div className="performance-panel">
      <h3>Performance Metrics</h3>
      
      <div className="metrics-grid">
        <div className="metric">
          <label>Total Return</label>
          <value className={performance.totalReturn > 0 ? 'positive' : 'negative'}>
            {performance.totalReturn}%
          </value>
        </div>

        <div className="metric">
          <label>Total P&L</label>
          <value className={performance.totalPnL > 0 ? 'positive' : 'negative'}>
            ${performance.totalPnL.toFixed(2)}
          </value>
        </div>

        <div className="metric">
          <label>Unrealized P&L</label>
          <value className={performance.unrealizedPnL > 0 ? 'positive' : 'negative'}>
            ${performance.unrealizedPnL.toFixed(2)}
          </value>
        </div>

        <div className="metric">
          <label>Realized P&L</label>
          <value className={performance.realizedPnL > 0 ? 'positive' : 'negative'}>
            ${performance.realizedPnL.toFixed(2)}
          </value>
        </div>

        <div className="metric">
          <label>Win Rate</label>
          <value>{(performance.winRate * 100).toFixed(2)}%</value>
        </div>

        <div className="metric">
          <label>Total Trades</label>
          <value>{performance.totalTrades}</value>
        </div>

        <div className="metric">
          <label>Winning Trades</label>
          <value className="positive">{performance.winningTrades}</value>
        </div>

        <div className="metric">
          <label>Losing Trades</label>
          <value className="negative">{performance.losingTrades}</value>
        </div>

        <div className="metric">
          <label>Max Drawdown</label>
          <value className="negative">{performance.maxDrawdown}%</value>
        </div>

        <div className="metric">
          <label>Current Drawdown</label>
          <value className={performance.currentDrawdown > 0 ? 'positive' : 'negative'}>
            {performance.currentDrawdown}%
          </value>
        </div>
      </div>

      <small className="last-updated">
        Last updated: {new Date(performance.lastUpdated).toLocaleString()}
      </small>
    </div>
  );
}
```

**Vue Example**:
```vue
<template>
  <div class="performance-panel">
    <h3>Performance Metrics</h3>
    
    <div v-if="loading" class="loading">Loading performance...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    
    <div v-else-if="performance" class="performance-content">
      <div class="metrics-grid">
        <div class="metric">
          <label>Total Return</label>
          <value :class="performance.totalReturn > 0 ? 'positive' : 'negative'">
            {{ performance.totalReturn }}%
          </value>
        </div>

        <div class="metric">
          <label>Total P&L</label>
          <value :class="performance.totalPnL > 0 ? 'positive' : 'negative'">
            ${{ performance.totalPnL.toFixed(2) }}
          </value>
        </div>

        <div class="metric">
          <label>Unrealized P&L</label>
          <value :class="performance.unrealizedPnL > 0 ? 'positive' : 'negative'">
            ${{ performance.unrealizedPnL.toFixed(2) }}
          </value>
        </div>

        <div class="metric">
          <label>Realized P&L</label>
          <value :class="performance.realizedPnL > 0 ? 'positive' : 'negative'">
            ${{ performance.realizedPnL.toFixed(2) }}
          </value>
        </div>

        <div class="metric">
          <label>Win Rate</label>
          <value>{{ (performance.winRate * 100).toFixed(2) }}%</value>
        </div>

        <div class="metric">
          <label>Total Trades</label>
          <value>{{ performance.totalTrades }}</value>
        </div>

        <div class="metric">
          <label>Winning Trades</label>
          <value class="positive">{{ performance.winningTrades }}</value>
        </div>

        <div class="metric">
          <label>Losing Trades</label>
          <value class="negative">{{ performance.losingTrades }}</value>
        </div>

        <div class="metric">
          <label>Max Drawdown</label>
          <value class="negative">{{ performance.maxDrawdown }}%</value>
        </div>

        <div class="metric">
          <label>Current Drawdown</label>
          <value :class="performance.currentDrawdown > 0 ? 'positive' : 'negative'">
            {{ performance.currentDrawdown }}%
          </value>
        </div>
      </div>

      <small class="last-updated">
        Last updated: {{ new Date(performance.lastUpdated).toLocaleString() }}
      </small>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    strategyId: String
  },
  data() {
    return {
      performance: null,
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchPerformance();
    this.interval = setInterval(() => this.fetchPerformance(), 30000);
  },
  beforeUnmount() {
    if (this.interval) clearInterval(this.interval);
  },
  methods: {
    async fetchPerformance() {
      try {
        const response = await fetch(
          `http://localhost:3000/strategies/${this.strategyId}/performance`
        );
        if (!response.ok) throw new Error('Failed to load performance');
        this.performance = await response.json();
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 1.4 Display Strategy Trades (Read-Only Table)

### Backend Endpoint
```
GET /strategies/:id/trades?limit=50&offset=0&status=closed
```

### Query Parameters
- `limit`: Number of trades to display (default: 50)
- `offset`: Skip N trades for pagination (default: 0)
- `status`: Filter by status (open/closed/cancelled)

### Response (200 OK)
```json
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

### Frontend Implementation

**Where to use**: Admin Dashboard → Trade History (Read-Only Table with Pagination)

**React Example**:
```jsx
function TradeHistory({ strategyId }) {
  const [trades, setTrades] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageSize = 50;

  useEffect(() => {
    fetchTrades(page);
  }, [page]);

  const fetchTrades = async (pageNum) => {
    try {
      setLoading(true);
      const offset = pageNum * pageSize;
      const response = await fetch(
        `http://localhost:3000/strategies/${strategyId}/trades?limit=${pageSize}&offset=${offset}&status=closed`
      );
      if (!response.ok) throw new Error('Failed to load trades');
      const data = await response.json();
      setTrades(data.trades);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="trade-history">
      <h3>Trade History</h3>
      
      {loading ? (
        <div>Loading trades...</div>
      ) : trades.length === 0 ? (
        <p className="no-data">No trades available</p>
      ) : (
        <>
          <table className="trades-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Direction</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Quantity</th>
                <th>P&L</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.trade_id}>
                  <td>{trade.symbol}</td>
                  <td className={trade.direction}>{trade.direction.toUpperCase()}</td>
                  <td>{trade.entry_price}</td>
                  <td>{trade.exit_price || '-'}</td>
                  <td>{trade.quantity}</td>
                  <td className={trade.pnl > 0 ? 'positive' : 'negative'}>
                    ${trade.pnl ? trade.pnl.toFixed(2) : '-'}
                  </td>
                  <td>{new Date(trade.entry_time).toLocaleString()}</td>
                  <td>{trade.exit_time ? new Date(trade.exit_time).toLocaleString() : '-'}</td>
                  <td className={`status ${trade.status}`}>{trade.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button 
              onClick={() => setPage(page - 1)} 
              disabled={page === 0}
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {page + 1} of {totalPages} (Total: {total} trades)
            </span>
            <button 
              onClick={() => setPage(page + 1)} 
              disabled={(page + 1) * pageSize >= total}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

**Vue Example**:
```vue
<template>
  <div class="trade-history">
    <h3>Trade History</h3>
    
    <div v-if="error" class="error">Error: {{ error }}</div>
    
    <div v-else-if="loading" class="loading">Loading trades...</div>
    <div v-else-if="trades.length === 0" class="no-data">No trades available</div>
    
    <div v-else>
      <table class="trades-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Direction</th>
            <th>Entry Price</th>
            <th>Exit Price</th>
            <th>Quantity</th>
            <th>P&L</th>
            <th>Entry Time</th>
            <th>Exit Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trade in trades" :key="trade.trade_id">
            <td>{{ trade.symbol }}</td>
            <td :class="trade.direction">{{ trade.direction.toUpperCase() }}</td>
            <td>{{ trade.entry_price }}</td>
            <td>{{ trade.exit_price || '-' }}</td>
            <td>{{ trade.quantity }}</td>
            <td :class="trade.pnl > 0 ? 'positive' : 'negative'">
              ${{ trade.pnl ? trade.pnl.toFixed(2) : '-' }}
            </td>
            <td>{{ new Date(trade.entry_time).toLocaleString() }}</td>
            <td>{{ trade.exit_time ? new Date(trade.exit_time).toLocaleString() : '-' }}</td>
            <td :class="`status ${trade.status}`">{{ trade.status }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button @click="page--" :disabled="page === 0">← Previous</button>
        <span class="page-info">
          Page {{ page + 1 }} of {{ totalPages }} (Total: {{ total }} trades)
        </span>
        <button @click="page++" :disabled="(page + 1) * pageSize >= total">
          Next →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    strategyId: String
  },
  data() {
    return {
      trades: [],
      total: 0,
      page: 0,
      loading: true,
      error: null,
      pageSize: 50
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize);
    }
  },
  watch: {
    page(newPage) {
      this.fetchTrades(newPage);
    }
  },
  mounted() {
    this.fetchTrades(0);
  },
  methods: {
    async fetchTrades(pageNum) {
      try {
        this.loading = true;
        const offset = pageNum * this.pageSize;
        const response = await fetch(
          `http://localhost:3000/strategies/${this.strategyId}/trades?limit=${this.pageSize}&offset=${offset}&status=closed`
        );
        if (!response.ok) throw new Error('Failed to load trades');
        const data = await response.json();
        this.trades = data.trades;
        this.total = data.total;
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## 1.5 Display Equity Curve Chart (Read-Only)

### Backend Endpoint
```
GET /strategies/:id/equity-curve?days=30
```

### Query Parameters
- `days`: Number of days to display (default: 30)

### Response (200 OK)
```json
[
  {
    "timestamp": "2024-05-19T10:30:00.000Z",
    "equity": 10500,
    "totalPnL": 500,
    "drawdown": -2.5
  },
  {
    "timestamp": "2024-05-19T11:00:00.000Z",
    "equity": 10450,
    "totalPnL": 450,
    "drawdown": -3.0
  }
]
```

### Frontend Implementation

**Where to use**: Admin Dashboard → Equity Chart (Read-Only Chart Display)

**React Example (using Chart.js)**:
```jsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function EquityCurve({ strategyId, days = 60 }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEquityCurve();
  }, [strategyId, days]);

  const fetchEquityCurve = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/strategies/${strategyId}/equity-curve?days=${days}`
      );
      if (!response.ok) throw new Error('Failed to load equity curve');
      const data = await response.json();

      setChartData({
        labels: data.map(point => new Date(point.timestamp).toLocaleDateString()),
        datasets: [
          {
            label: 'Equity',
            data: data.map(point => point.equity),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: false
          },
          {
            label: 'Total P&L',
            data: data.map(point => point.totalPnL),
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: false
          },
          {
            label: 'Drawdown %',
            data: data.map(point => point.drawdown),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            tension: 0.1,
            fill: false
          }
        ]
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading equity curve...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!chartData) return <div>No data available</div>;

  return (
    <div className="equity-chart-container">
      <h3>Equity Curve ({days} days)</h3>
      <Line data={chartData} options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }} />
    </div>
  );
}

export default EquityCurve;
```

**Vue Example (using Chart.js)**:
```vue
<template>
  <div class="equity-chart-container">
    <h3>Equity Curve ({{ days }} days)</h3>
    
    <div v-if="loading" class="loading">Loading equity curve...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="chartData">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default {
  components: {
    Line
  },
  props: {
    strategyId: String,
    days: {
      type: Number,
      default: 60
    }
  },
  data() {
    return {
      chartData: null,
      loading: true,
      error: null,
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    };
  },
  watch: {
    days(newDays) {
      this.fetchEquityCurve();
    }
  },
  mounted() {
    this.fetchEquityCurve();
  },
  methods: {
    async fetchEquityCurve() {
      try {
        this.loading = true;
        const response = await fetch(
          `http://localhost:3000/strategies/${this.strategyId}/equity-curve?days=${this.days}`
        );
        if (!response.ok) throw new Error('Failed to load equity curve');
        const data = await response.json();

        this.chartData = {
          labels: data.map(point => new Date(point.timestamp).toLocaleDateString()),
          datasets: [
            {
              label: 'Equity',
              data: data.map(point => point.equity),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              fill: false
            },
            {
              label: 'Total P&L',
              data: data.map(point => point.totalPnL),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              fill: false
            },
            {
              label: 'Drawdown %',
              data: data.map(point => point.drawdown),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              fill: false
            }
          ]
        };
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

# PART 2: PUBLIC STRATEGY DISPLAY (Website/Public Dashboard)

## 2.1 Display Public Strategy Summary (Read-Only)

### Backend Endpoint
```
GET /strategies/public/:id/summary
```

### Response (200 OK)
```json
{
  "strategyId": "550e8400-e29b-41d4-a716-446655440001",
  "name": "EUR/USD Scalper",
  "totalReturn": 15.5,
  "winRate": 0.65,
  "totalTrades": 100,
  "maxDrawdown": -8.5,
  "lastUpdated": "2024-05-19T10:30:00.000Z"
}
```

**Note**: This endpoint does NOT expose:
- `initial_capital` (private financial info)
- `totalPnL` (absolute value - private)
- `unrealizedPnL` (private)
- `realizedPnL` (private)
- `account_id` (private)

### Frontend Implementation

**Where to use**: Public Website → Strategy Showcase / Hero Section

**React Example**:
```jsx
function PublicStrategyCard({ strategyId }) {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicStrategy();
  }, [strategyId]);

  const fetchPublicStrategy = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/strategies/public/${strategyId}/summary`
      );
      if (!response.ok) throw new Error('Failed to load strategy');
      const data = await response.json();
      setStrategy(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="skeleton">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!strategy) return null;

  return (
    <div className="strategy-showcase-card">
      <div className="card-header">
        <h2>{strategy.name}</h2>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <label>Total Return</label>
          <value className={strategy.totalReturn > 0 ? 'positive' : 'negative'}>
            {strategy.totalReturn}%
          </value>
        </div>

        <div className="metric">
          <label>Win Rate</label>
          <value>{(strategy.winRate * 100).toFixed(2)}%</value>
        </div>

        <div className="metric">
          <label>Total Trades</label>
          <value>{strategy.totalTrades}</value>
        </div>

        <div className="metric">
          <label>Max Drawdown</label>
          <value className="negative">{strategy.maxDrawdown}%</value>
        </div>
      </div>

      <div className="card-footer">
        <small className="last-updated">
          Last updated: {new Date(strategy.lastUpdated).toLocaleString()}
        </small>
      </div>
    </div>
  );
}
```

**Vue Example**:
```vue
<template>
  <div class="strategy-showcase-card">
    <div v-if="loading" class="skeleton">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="strategy">
      <div class="card-header">
        <h2>{{ strategy.name }}</h2>
      </div>

      <div class="metrics-grid">
        <div class="metric">
          <label>Total Return</label>
          <value :class="strategy.totalReturn > 0 ? 'positive' : 'negative'">
            {{ strategy.totalReturn }}%
          </value>
        </div>

        <div class="metric">
          <label>Win Rate</label>
          <value>{{ (strategy.winRate * 100).toFixed(2) }}%</value>
        </div>

        <div class="metric">
          <label>Total Trades</label>
          <value>{{ strategy.totalTrades }}</value>
        </div>

        <div class="metric">
          <label>Max Drawdown</label>
          <value class="negative">{{ strategy.maxDrawdown }}%</value>
        </div>
      </div>

      <div class="card-footer">
        <small class="last-updated">
          Last updated: {{ new Date(strategy.lastUpdated).toLocaleString() }}
        </small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    strategyId: String
  },
  data() {
    return {
      strategy: null,
      loading: true,
      error: null
    };
  },
  mounted() {
    this.fetchPublicStrategy();
  },
  methods: {
    async fetchPublicStrategy() {
      try {
        this.loading = true;
        const response = await fetch(
          `http://localhost:3000/strategies/public/${this.strategyId}/summary`
        );
        if (!response.ok) throw new Error('Failed to load strategy');
        this.strategy = await response.json();
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

# PART 3: FRONTEND PAGES & THEIR APIs

## Admin Dashboard Pages (Read-Only Views)

### Page 1: Dashboard / Strategies Overview
**URL**: `/admin/dashboard`

**APIs Used**:
1. `GET /strategies` - Load all strategies list

**Components**:
- Strategies grid/table (read-only display)
- Click to view strategy details
- Search/filter options

---

### Page 2: Strategy Details View
**URL**: `/admin/strategies/:id`

**APIs Used**:
1. `GET /strategies/:id` - Get strategy information
2. `GET /strategies/:id/performance` - Get live performance (auto-refresh every 30s)
3. `GET /strategies/:id/trades?limit=50&offset=0` - Get trade history with pagination
4. `GET /strategies/:id/equity-curve?days=60` - Get equity curve data

**Components**:
- Strategy info panel (read-only)
- Performance metrics panel (real-time, auto-updating)
- Trade history table (paginated, read-only)
- Equity curve chart (interactive, read-only)

---

## Public Website Pages

### Page 1: Homepage / Hero Section
**URL**: `/` (Home)

**APIs Used**:
1. `GET /strategies/public/:id/summary` - Get featured strategy summary

**Components**:
- Featured strategy showcase card
- Performance metrics display
- Last updated timestamp

---

### Page 2: Strategies Showcase (Optional)
**URL**: `/strategies`

**APIs Used**:
1. `GET /strategies/public/:id/summary` - Get public summaries for multiple strategies

**Components**:
- Strategy cards grid
- Performance metrics comparison
- Filter/sort options

---

# PART 5: ERROR HANDLING & BEST PRACTICES

## Error Handling

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Strategy with ID 550e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}
```

**Frontend Handling**:
```jsx
try {
  const response = await fetch(`http://localhost:3000/strategies/${strategyId}`);
  
  if (response.status === 404) {
    console.error('Strategy not found');
    // Show user-friendly error message
    setError('Strategy not found');
    return;
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  // Use data
} catch (error) {
  console.error('Error loading strategy:', error);
  setError(error.message);
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

### Network Error
```jsx
catch (error) {
  console.error('Network error:', error);
  setError('Network connection error. Please try again.');
}
```

## Best Practices for Read-Only Views

### 1. Loading States
Always show loading indicator while fetching:
```jsx
{loading && <div className="spinner">Loading...</div>}
{!loading && error && <div className="error">{error}</div>}
{!loading && !error && data && <YourComponent data={data} />}
```

### 2. Auto-Refresh for Real-Time Data
For performance metrics, use auto-refresh intervals:
```jsx
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000); // 30 seconds
  return () => clearInterval(interval);
}, [strategyId]);
```

### 3. Pagination for Large Lists
Always paginate trade history to avoid performance issues:
```jsx
const pageSize = 50;
const offset = (page - 1) * pageSize;
fetch(`/strategies/${id}/trades?limit=${pageSize}&offset=${offset}`)
```

### 4. Error Boundaries
Wrap components with error boundaries to handle component crashes

---

# PART 4: READ-ONLY DATA FLOW EXAMPLES

## Example 1: Load & Display Strategy Details with Live Performance

```
1. User navigates to /admin/strategies/550e8400...
   ↓
2. Frontend: GET /strategies/:id
   ↓
3. Backend: Returns strategy info
   ↓
4. Frontend: Displays strategy details (name, description, capital, status)
   ↓
5. Frontend: GET /strategies/:id/performance
   ↓
6. Backend: Calculates & returns live metrics
   ↓
7. Frontend: Displays performance metrics
   ↓
8. Frontend: Sets interval to auto-refresh every 30 seconds
   ↓
9. Each refresh cycle:
   a. GET /strategies/:id/performance
   b. Update performance display
```

## Example 2: Load Trade History with Pagination

```
1. Frontend: GET /strategies/:id/trades?limit=50&offset=0
   ↓
2. Backend: Returns first 50 trades + total count
   ↓
3. Frontend: Displays trades in table
   ↓
4. User clicks "Next Page"
   ↓
5. Frontend: GET /strategies/:id/trades?limit=50&offset=50
   ↓
6. Backend: Returns next 50 trades
   ↓
7. Frontend: Updates table with new trades
```

## Example 3: Display Strategy on Public Website

```
1. User visits homepage
   ↓
2. Frontend: GET /strategies/public/550e8400.../summary
   ↓
3. Backend: Returns public summary (no private financial data)
   ↓
4. Frontend: Displays strategy showcase card with:
   - Name
   - Total Return %
   - Win Rate
   - Total Trades
   - Max Drawdown
   - Last Updated timestamp
   ↓
5. Frontend: (Optional) Sets interval to refresh every 60s
```

---

# PART 7: ENVIRONMENT VARIABLES

## Frontend .env
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_STRATEGY_ID=550e8400-e29b-41d4-a716-446655440001
```

## Frontend Usage
```jsx
const API_URL = process.env.REACT_APP_API_URL;
const STRATEGY_ID = process.env.REACT_APP_STRATEGY_ID;

fetch(`${API_URL}/strategies/${STRATEGY_ID}/performance`)
```

---

# PART 8: TESTING CHECKLIST

## Admin Dashboard Tests

- [ ] Create strategy - verify response and redirect
- [ ] Get all strategies - verify list displays
- [ ] Get strategy details - verify all info displays
- [ ] Update strategy - verify changes saved
- [ ] Delete strategy - verify removed from list
- [ ] Get performance - verify metrics display
- [ ] Get trades - verify pagination works
- [ ] Get equity curve - verify chart displays

## Public Website Tests

- [ ] Load public summary - verify no capital info shown
- [ ] Verify performance metrics display correctly
- [ ] Verify last updated timestamp shows
- [ ] Test on mobile devices
- [ ] Test error handling

---

# PART 9: PERFORMANCE OPTIMIZATION

## Caching Strategy

```jsx
// Cache performance data for 30 seconds
const cache = {};

async function getPerformance(strategyId) {
  const now = Date.now();
  
  if (cache[strategyId] && now - cache[strategyId].time < 30000) {
    return cache[strategyId].data;
  }
  
  const response = await fetch(
    `http://localhost:3000/strategies/${strategyId}/performance`
  );
  const data = await response.json();
  
  cache[strategyId] = { data, time: now };
  return data;
}
```

## Pagination

```jsx
// Always use pagination for trades
const pageSize = 50;
const offset = (page - 1) * pageSize;

fetch(`/strategies/${id}/trades?limit=${pageSize}&offset=${offset}`)
```

---

# PART 6: QUICK REFERENCE

## All Endpoints Summary (Read-Only)

| Method | Endpoint | Purpose | Frontend Page |
|--------|----------|---------|---------------|
| GET | `/strategies` | Get all strategies | Dashboard |
| GET | `/strategies/:id` | Get single strategy | Strategy Details |
| GET | `/strategies/:id/performance` | Get live performance | Strategy Details |
| GET | `/strategies/:id/trades` | Get trades (paginated) | Strategy Details |
| GET | `/strategies/:id/equity-curve` | Get equity curve data | Strategy Details |
| GET | `/strategies/public/:id/summary` | Get public summary | Public Website |

---

## Response Fields Reference

### Strategy Object
- `id` - UUID
- `name` - String
- `description` - String (nullable)
- `account_id` - UUID
- `status` - 'active' or 'inactive'
- `initial_capital` - Number
- `createdAt` - ISO Date
- `updatedAt` - ISO Date

### Performance Object
- `strategyId` - UUID
- `totalReturn` - Number (%)
- `totalPnL` - Number ($)
- `unrealizedPnL` - Number ($)
- `realizedPnL` - Number ($)
- `winRate` - Number (0-1)
- `totalTrades` - Number
- `winningTrades` - Number
- `losingTrades` - Number
- `maxDrawdown` - Number (%)
- `currentDrawdown` - Number (%)
- `lastUpdated` - ISO Date

### Trade Object
- `trade_id` - UUID
- `strategy_id` - UUID
- `account_id` - UUID
- `symbol` - String
- `direction` - 'long' or 'short'
- `entry_time` - ISO Date
- `entry_price` - Number
- `exit_time` - ISO Date (nullable)
- `exit_price` - Number (nullable)
- `quantity` - Number
- `pnl` - Number (nullable)
- `status` - 'open', 'closed', or 'cancelled'

### Public Summary Object
- `strategyId` - UUID
- `name` - String
- `totalReturn` - Number (%)
- `winRate` - Number (0-1)
- `totalTrades` - Number
- `maxDrawdown` - Number (%)
- `lastUpdated` - ISO Date

### Equity Curve Point
- `timestamp` - ISO Date
- `equity` - Number (account equity)
- `totalPnL` - Number (total profit/loss)
- `drawdown` - Number (drawdown %)

---

## Frontend Setup - Read-Only Views
- [ ] Create API service/utility file
- [ ] Create strategies list/dashboard page
- [ ] Create strategy details page
- [ ] Create performance metrics display (auto-refresh)
- [ ] Create trade history table (paginated)
- [ ] Create equity curve chart
- [ ] Create public strategy showcase
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Add pagination
- [ ] Add auto-refresh intervals
- [ ] Test all endpoints

---

## Next Steps

1. **Backend**: Start the NestJS server
   ```bash
   npm run start:dev
   ```

2. **Frontend**: Create API service file for read-only operations
   ```jsx
   // services/strategyApi.js
   export const strategyApi = {
     getAll: () => fetch('http://localhost:3000/strategies'),
     getById: (id) => fetch(`http://localhost:3000/strategies/${id}`),
     getPerformance: (id) => fetch(`http://localhost:3000/strategies/${id}/performance`),
     getTrades: (id, limit = 50, offset = 0) => 
       fetch(`http://localhost:3000/strategies/${id}/trades?limit=${limit}&offset=${offset}`),
     getEquityCurve: (id, days = 60) => 
       fetch(`http://localhost:3000/strategies/${id}/equity-curve?days=${days}`),
     getPublicSummary: (id) => 
       fetch(`http://localhost:3000/strategies/public/${id}/summary`)
   };
   ```

3. **Frontend**: Build display components using examples above

4. **Testing**: Use Postman or curl to test endpoints:
   ```bash
   curl http://localhost:3000/strategies
   curl http://localhost:3000/strategies/{id}
   curl http://localhost:3000/strategies/{id}/performance
   ```

5. **Deployment**: Deploy backend and frontend

---

**Status**: ✅ Ready for read-only frontend implementation
**APIs**: All documented with examples
**Frontend Pages**: Mapped to display APIs
**Error Handling**: Included
**Performance**: Optimized with pagination & auto-refresh
