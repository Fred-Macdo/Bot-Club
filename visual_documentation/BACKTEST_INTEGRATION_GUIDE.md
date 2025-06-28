# Backend Services Backtest Integration

This document explains the integration between the FastAPI `backend` and the `backend_services` container for decoupled backtesting.

## Architecture Overview

```
┌─────────────────┐    HTTP Request      ┌──────────────────────┐
│                 │ ───────────────────► │                      │
│   FastAPI       │                      │   Backend Services   │
│   Backend       │                      │   (Compute Engine)   │
│                 │ ◄─────────────────── │                      │
└─────────────────┘   Backtest Results   └──────────────────────┘
         │                                          │
         │                                          │
         ▼                                          ▼
┌─────────────────┐                      ┌──────────────────────┐
│   MongoDB       │ ◄──────────────────► │   MongoDB            │
│   (Main DB)     │     Shared Database  │   (Execution Log)    │
└─────────────────┘                      └──────────────────────┘
```

## Key Components

### 1. Backend (FastAPI)
- **Location**: `backend/src/routes/strategy.py`
- **Function**: `run_backtest_task()` (line 293)
- **Purpose**: Receives backtest requests from frontend and forwards to backend_services

### 2. Backend Services 
- **Location**: `backend_services/src/services/backtest/backtest_service.py`
- **Class**: `BacktestService`
- **Purpose**: Executes compute-intensive backtesting operations

### 3. Backtest Engine
- **Location**: `backend_services/src/services/backtest/backtest_engine.py`
- **Class**: `BacktestEngine`
- **Purpose**: Core backtesting logic and calculations

### 4. Communication Client
- **Location**: `backend/src/services/backtest_client.py`
- **Class**: `BacktestServiceClient`
- **Purpose**: HTTP client for backend to communicate with backend_services

## Data Flow

1. **Frontend** submits backtest request to **Backend**
2. **Backend** calls `run_backtest_task()` as background task
3. **BacktestServiceClient** sends HTTP request to **Backend Services**
4. **Backend Services** receives request via `/backtest/run` endpoint
5. **BacktestService** creates execution record and starts **BacktestEngine**
6. **BacktestEngine** performs calculations using historical data
7. **Backend Services** saves results and notifies **Backend** via API
8. **Backend** stores final results in main database

## API Endpoints

### Backend Services (Port 8001)

- `GET /health` - Health check
- `POST /backtest/run` - Start new backtest
- `GET /backtest/{execution_id}/status` - Get backtest status
- `DELETE /backtest/{execution_id}` - Cancel backtest

### Backend (Port 8000)

- `POST /api/backtest/save_result` - Receive results from backend_services
- `POST /api/strategy/{strategy_id}/backtest` - Start backtest (frontend facing)

## Configuration

### Environment Variables

**Backend**:
```env
BACKEND_SERVICES_URL=http://backend_services:8001
```

**Backend Services**:
```env
SERVICE_PORT=8001
API_SERVICE_URL=http://backend:8000
MONGO_URL=mongodb://mongo:27017
MONGO_DB=bot_club_db
```

### Docker Compose

```yaml
backend:
  environment:
    - BACKEND_SERVICES_URL=http://backend_services:8001
  depends_on:
    - backend_services

backend_services:
  ports:
    - "8001:8001"
  environment:
    - SERVICE_PORT=8001
    - API_SERVICE_URL=http://backend:8000
```

## Models and Data Structures

### BacktestParams
```python
{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31", 
    "initial_capital": 100000.0,
    "timeframe": "1d"
}
```

### BacktestResult
```python
{
    "strategy_id": "ObjectId",
    "total_return": 0.15,
    "sharpe_ratio": 1.2,
    "max_drawdown": -0.12,
    "win_rate": 0.65,
    "total_trades": 32,
    "profit_factor": 1.8,
    "trades": [...],
    "equity_curve": [...]
}
```

### BacktestExecution (Status Tracking)
```python
{
    "id": "uuid",
    "user_id": "string", 
    "strategy_id": "string",
    "status": "running|completed|failed|cancelled",
    "progress": 75,
    "start_time": "datetime",
    "end_time": "datetime",
    "result": {...}
}
```

## Usage Example

### Starting a Backtest

```python
# Frontend calls backend
POST /api/strategy/{strategy_id}/backtest
{
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "initial_capital": 100000.0,
    "timeframe": "1d"
}

# Backend forwards to backend_services
async def run_backtest_task(db, strategy, params, user_id):
    client = BacktestServiceClient()
    execution_id = await client.start_backtest(strategy, params, user_id)
```

### Monitoring Progress

```python
# Check status
client = BacktestServiceClient()
status = await client.get_backtest_status(execution_id)
print(f"Status: {status['status']}, Progress: {status['progress']}%")
```

## Benefits of This Architecture

1. **Decoupling**: Separates API logic from compute-intensive operations
2. **Scalability**: Backend services can be scaled independently
3. **Performance**: Main backend stays responsive during long backtests
4. **Reliability**: Backtest failures don't affect main API
5. **Monitoring**: Real-time status updates and progress tracking
6. **Resource Management**: Dedicated resources for backtesting

## Testing

Run the integration test:

```bash
python test_integration.py
```

This will:
1. Check backend_services health
2. Start a test backtest
3. Monitor progress
4. Verify completion

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if backend_services is running on port 8001
2. **Strategy Not Found**: Ensure strategy exists in database
3. **Timeout Errors**: Increase timeout values for long backtests
4. **Import Errors**: Check Python path and package structure

### Debugging

1. Check logs in both containers:
   ```bash
   docker-compose logs backend
   docker-compose logs backend_services
   ```

2. Verify network connectivity:
   ```bash
   docker exec -it bot-club-backend-1 curl http://backend_services:8001/health
   ```

3. Check database connections in both services

## Future Enhancements

1. **Queue System**: Add Redis for better task management
2. **Result Streaming**: Real-time result updates via WebSockets
3. **Distributed Computing**: Multiple backend_services instances
4. **Caching**: Cache market data and computation results
5. **Priority Queues**: Handle high-priority backtests first
