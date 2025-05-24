import os
from pymongo import MongoClient
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from typing import Optional
import logging

# Ensure correct relative imports based on your project structure
from .crud.user import get_user_by_supabase_id
from .models.user import UserInDB
from pymongo.database import Database

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

def get_db() -> Database:
    """Dependency to get database instance"""
    try:
        yield db_instance
    except Exception as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )

# --- Authentication ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"

if not SUPABASE_JWT_SECRET:
    logger.critical("SUPABASE_JWT_SECRET environment variable is not set. Authentication will fail.")

async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db)
) -> UserInDB:
    """Extract and validate user from JWT token"""
    
    if not SUPABASE_JWT_SECRET:
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
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM])
        supabase_id: Optional[str] = payload.get("sub")
        if supabase_id is None:
            raise credentials_exception

    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise credentials_exception from e

    try:
        user = get_user_by_supabase_id(db, supabase_id)
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
    