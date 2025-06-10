from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables from .env file
# This looks for .env in the backend directory (parent of src)
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Alternative: Load from current directory and parent directories
# load_dotenv()

from pymongo import MongoClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import JWTError, jwt
from typing import Optional, AsyncGenerator
import logging

# Ensure correct relative imports based on your project structure
from .models.user import UserInDB
from .database.client import db_client
from .crud.user import get_user_by_mongodb_id

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection globals - initialized in startup
client: Optional[MongoClient] = None

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

# Security
security = HTTPBearer()

def get_mongo_url():
    """Get MongoDB connection URL based on environment"""
    local = os.getenv("LOCAL_DB", "false").lower() == "true"
    
    if local:
        return os.getenv("MONGO_URL", "mongodb://mongo:27017/")  # Use docker service name
    else:
        # For MongoDB Atlas
        username = os.getenv("MONGO_USERNAME", "fred-bot-club")
        password = os.getenv("MONGO_PASSWORD")  # This should be set in environment
        cluster = os.getenv("MONGO_CLUSTER", "bot-club-cluster.b9yda9w.mongodb.net")
        
        if not password:
            raise ValueError("MONGO_PASSWORD environment variable is required for Atlas connection")
        
        return f"mongodb+srv://{username}:{password}@{cluster}/bot_club_db?retryWrites=true&w=majority"

async def connect_to_mongo():
    """Initialize MongoDB connection - called during startup"""
    global client
    
    try:
        mongo_url = get_mongo_url()
        client = MongoClient(mongo_url)
        
        # Test the connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection - called during shutdown"""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """Dependency to get database instance"""
    try:
        db = await db_client.connect()
        yield db
    except Exception as e:
        logger.error(f"Database error in get_db: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )

async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> UserInDB:
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = await get_user_by_mongodb_id(db, user_id)
    if user is None:
        raise credentials_exception
    
    return user