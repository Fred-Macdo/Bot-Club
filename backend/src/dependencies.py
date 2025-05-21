import os
from pymongo import MongoClient
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt 
from typing import Optional
# Ensure correct relative imports based on your project structure
from .crud.user import get_user_by_supabase_id 
from .models.user import UserInDB
from pymongo.database import Database # To type hint the yielded db


# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(mongo_url)
db_name = os.getenv("MONGO_DB_NAME", "bot_club_db")
db_instance: Database = client[db_name] # Type hint for clarity

def get_db() -> Database: # Specify return type
    try:
        yield db_instance
    finally:
        # Connection is managed globally, no client.close() here per original
        pass

# --- Authentication ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token") # Placeholder tokenUrl

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256" 

if not SUPABASE_JWT_SECRET:
    print("CRITICAL WARNING: SUPABASE_JWT_SECRET environment variable is not set. Authentication will fail.")
    # In a real app, you might want to prevent startup or log this more formally.

async def get_current_user_from_token(
    token: str = Depends(oauth2_scheme), 
    db: Database = Depends(get_db) # Use Database type hint from get_db
) -> UserInDB:
    if not SUPABASE_JWT_SECRET:
        # This check is important because otherwise jwt.decode will fail cryptically or with default values.
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
            # This means the token is malformed or doesn't contain the subject
            raise credentials_exception 
    except JWTError as e: # Catch specific JWT errors
        # Log e for debugging if necessary
        raise credentials_exception from e
    
    user = get_user_by_supabase_id(db, supabase_id)
    if user is None:
        # Token is valid, supabase_id extracted, but user not found in our DB.
        # This could be a new Supabase user not yet linked, or a deleted user.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"User profile not found for Supabase ID. Please complete registration or contact support."
        )
    return user