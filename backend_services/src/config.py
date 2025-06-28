import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# MongoDB settings
MONGO_HOST = os.getenv("MONGO_HOST", "mongo")
MONGO_PORT = int(os.getenv("MONGO_PORT", 27017))
MONGO_DB = os.getenv("MONGO_DB", "bot_club_db")

# For development/docker without auth
MONGO_URL = os.getenv("MONGO_URL", f"mongodb://{MONGO_HOST}:{MONGO_PORT}")

# Legacy auth settings (if needed for production)
MONGO_USER = os.getenv("MONGO_USER", "")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "")

# Redis settings for message queue
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# Alpaca API settings
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY", "")
ALPACA_API_SECRET = os.getenv("ALPACA_API_SECRET", "")
ALPACA_PAPER = os.getenv("ALPACA_PAPER", "True").lower() in ("true", "1", "t")
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")

# Service settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
BACKTEST_WORKERS = int(os.getenv("BACKTEST_WORKERS", 2))
SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8001))  # Different from FastAPI port

# FastAPI service URL for callbacks
API_SERVICE_URL = os.getenv("API_SERVICE_URL", "http://backend:8000")