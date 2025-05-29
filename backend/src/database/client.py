import os
from pymongo import MongoClient
from pymongo.database import Database
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file in backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
def get_mongo_url():
    """Get MongoDB connection URL based on environment"""
    local = os.getenv("LOCAL_DB", "false").lower() == "true"
    
    if local:
        return os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    else:
        # For MongoDB Atlas
        username = os.getenv("MONGO_USERNAME", "fred-bot-club")
        password = os.getenv("MONGO_PASSWORD")  # This should be set in environment
        cluster = os.getenv("MONGO_CLUSTER", "bot-club-cluster.b9yda9w.mongodb.net")
        
        if not password:
            raise ValueError("MONGO_PASSWORD environment variable is required for Atlas connection")
            
        return f"mongodb+srv://{username}:{password}@{cluster}/?retryWrites=true&w=majority&appName=bot-club-cluster"

# Initialize MongoDB connection
try:
    mongo_url = get_mongo_url()
    client = MongoClient(mongo_url)
    
    # Test the connection
    client.admin.command('ping')
    logger.info("Successfully connected to MongoDB Atlas")
    
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {e}")
    raise

db_name = os.getenv("MONGO_DB_NAME", "bot_club_db")
db_instance: Database = client[db_name]

    