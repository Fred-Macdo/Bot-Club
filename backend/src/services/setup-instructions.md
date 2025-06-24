# Backtest System Setup Instructions

## 1. Database Schema Updates

Create a new Alembic migration to add the backtest tables:

```bash
alembic revision -m "Add backtest tables"
```

Add this to the migration file:

```python
# migrations/versions/xxx_add_backtest_tables.py
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create backtest_results table
    op.create_table('backtest_results',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('strategy_id', sa.String(), nullable=False),
        sa.Column('initial_capital', sa.Float(), nullable=False),
        sa.Column('timeframe', sa.String(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('data_provider', sa.String(), nullable=False),
        sa.Column('final_equity', sa.Float(), nullable=False),
        sa.Column('total_return', sa.Float(), nullable=False),
        sa.Column('max_drawdown', sa.Float(), nullable=False),
        sa.Column('sharpe_ratio', sa.Float(), nullable=False),
        sa.Column('win_rate', sa.Float(), nullable=False),
        sa.Column('profit_factor', sa.Float(), nullable=False),
        sa.Column('total_trades', sa.Integer(), nullable=False),
        sa.Column('equity_curve', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['strategy_id'], ['strategies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create trades table
    op.create_table('trades',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('backtest_id', sa.String(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('side', sa.String(), nullable=False),
        sa.Column('entry_date', sa.DateTime(), nullable=False),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('exit_date', sa.DateTime(), nullable=True),
        sa.Column('exit_price', sa.Float(), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('pnl', sa.Float(), nullable=False),
        sa.Column('return_pct', sa.Float(), nullable=False),
        sa.Column('commission', sa.Float(), nullable=True),
        sa.Column('entry_signals', sa.JSON(), nullable=True),
        sa.Column('exit_signals', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['backtest_id'], ['backtest_results.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create deployments table
    op.create_table('deployments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('strategy_id', sa.String(), nullable=False),
        sa.Column('mode', sa.String(), nullable=False),
        sa.Column('initial_capital', sa.Float(), nullable=False),
        sa.Column('current_capital', sa.Float(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('total_trades', sa.Integer(), nullable=True),
        sa.Column('winning_trades', sa.Integer(), nullable=True),
        sa.Column('total_pnl', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_trade_at', sa.DateTime(), nullable=True),
        sa.Column('stopped_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['strategy_id'], ['strategies.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_config table for API keys
    op.create_table('user_config',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('alpaca_api_key', sa.String(), nullable=True),
        sa.Column('alpaca_secret_key', sa.String(), nullable=True),
        sa.Column('polygon_api_key', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # Create indexes
    op.create_index('idx_backtest_results_user_id', 'backtest_results', ['user_id'])
    op.create_index('idx_trades_backtest_id', 'trades', ['backtest_id'])
    op.create_index('idx_deployments_user_id', 'deployments', ['user_id'])
    op.create_index('idx_deployments_status', 'deployments', ['status'])

def downgrade():
    op.drop_index('idx_deployments_status')
    op.drop_index('idx_deployments_user_id')
    op.drop_index('idx_trades_backtest_id')
    op.drop_index('idx_backtest_results_user_id')
    op.drop_table('user_config')
    op.drop_table('deployments')
    op.drop_table('trades')
    op.drop_table('backtest_results')
```

Run the migration:

```bash
alembic upgrade head
```

## 2. Install Required Dependencies

Add these to your `requirements.txt`:

```
# Data providers
yfinance>=0.2.28
aiohttp>=3.9.0

# Redis for async operations
redis>=5.0.0

# Security
cryptography>=41.0.0

# Technical analysis (if using TA-Lib)
# TA-Lib>=0.4.28  # Optional, requires system library

# Numerical computing
numpy>=1.24.0
pandas>=2.0.0
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## 3. Redis Setup

Install and start Redis:

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

## 4. Environment Variables

Add to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Security
ENCRYPTION_KEY=your-32-byte-base64-encoded-key  # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Data Provider API Keys (optional)
ALPACA_API_KEY=your_alpaca_key
ALPACA_SECRET_KEY=your_alpaca_secret
POLYGON_API_KEY=your_polygon_key

# Backtest Configuration
MAX_BACKTEST_DURATION=3600  # Maximum backtest duration in seconds
BACKTEST_WORKER_THREADS=4   # Number of worker threads
```

## 5. Create Default Strategies Directory

```bash
mkdir -p app/strategies/defaults
```

## 6. Update Main Application

Add Redis initialization to your FastAPI app:

```python
# app/main.py
from app.core.redis_client import redis_client

@app.on_event("startup")
async def startup_event():
    # Connect to Redis
    await redis_client.connect()
    
    # Other startup tasks...

@app.on_event("shutdown")
async def shutdown_event():
    # Disconnect from Redis
    await redis_client.disconnect()
    
    # Other shutdown tasks...
```

## 7. Add Routes to Main Router

```python
# app/api/api.py
from app.api.routes import backtest_routes

api_router = APIRouter()

# Add backtest routes
api_router.include_router(backtest_routes.router)
```

## 8. Update User Model

Add relationships to User model:

```python
# app/models/user.py
from sqlalchemy.orm import relationship

class User(Base):
    # ... existing fields ...
    
    # Add relationships
    strategies = relationship("Strategy", back_populates="user")
    backtests = relationship("BacktestResult", back_populates="user")
    deployments = relationship("Deployment", back_populates="user")
    config = relationship("UserConfig", back_populates="user", uselist=False)
```

## 9. Update Strategy Model

Add relationships to Strategy model:

```python
# app/models/strategy.py
from sqlalchemy.orm import relationship

class Strategy(Base):
    # ... existing fields ...
    
    # Add relationships
    backtests = relationship("BacktestResult", back_populates="strategy")
    deployments = relationship("Deployment", back_populates="strategy")
```

## 10. Frontend Integration

Update your React app's API configuration:

```javascript
// src/api/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

## 11. Test the System

1. Start the backend:
```bash
uvicorn app.main:app --reload
```

2. Start Redis:
```bash
redis-server
```

3. Start the frontend:
```bash
npm start
```

4. Test endpoints:
```bash
# Get default strategies
curl http://localhost:8000/api/strategies/default

# Run a backtest (requires auth)
curl -X POST http://localhost:8000/api/backtest/run \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_id": "default_1",
    "strategy_type": "default",
    "initial_capital": 10000,
    "timeframe": "1D",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "data_provider": "yahoo"
  }'
```

## 12. Optional: Add Background Task Queue

For production, consider using Celery or similar for long-running backtests:

```python
# app/tasks/backtest_tasks.py
from celery import Celery
from app.services.backtest_engine import BacktestEngine

celery_app = Celery('tasks', broker='redis://localhost:6379')

@celery_app.task
def run_backtest_task(backtest_id: str, config: dict):
    # Run backtest asynchronously
    engine = BacktestEngine(**config)
    results = engine.run()
    # Save results to database
    return results
```

## Troubleshooting

1. **Redis Connection Error**: Ensure Redis is running and accessible
2. **Database Migration Error**: Check PostgreSQL connection and permissions
3. **Import Errors**: Verify all dependencies are installed
4. **CORS Issues**: Add frontend URL to CORS origins in FastAPI
5. **Authentication Errors**: Ensure JWT tokens are properly configured