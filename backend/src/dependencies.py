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
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import Optional
import logging

# Ensure correct relative imports based on your project structure
from .models.user import UserInDB
from pymongo.database import Database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection globals - initialized in startup
client: Optional[MongoClient] = None
db_instance: Optional[Database] = None

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
    global client, db_instance
    
    try:
        mongo_url = get_mongo_url()
        client = MongoClient(mongo_url)
        
        # Test the connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        db_name = os.getenv("MONGO_DB_NAME", "bot_club_db")
        db_instance = client[db_name]
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection - called during shutdown"""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_db():
    """Dependency to get database instance"""
    global db_instance
    
    if db_instance is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not initialized"
        )
    
    try:
        yield db_instance
    except HTTPException:
        # Re-raise HTTPExceptions (like 401, 404, etc.) without modification
        raise
    except Exception as e:
        logger.error(f"Database error in get_db: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )

# --- Authentication ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Use our backend JWT secret, not Supabase JWT secret for our own tokens
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"

if not JWT_SECRET_KEY:
    logger.critical("JWT_SECRET_KEY environment variable is not set. Authentication will fail.")
    # In production, you might want to raise an exception here to prevent startup

async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db)
) -> UserInDB:
    """Extract and validate user from JWT token"""
    
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT Secret not configured on the server. Cannot authenticate.",
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise credentials_exception from e

    try:
        # Import the correct function
        from .crud.user import get_user_by_mongodb_id
        user = await get_user_by_mongodb_id(db, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please complete registration or contact support."
            )
        return user
        
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user information"
        )