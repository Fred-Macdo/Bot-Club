from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from jose import JWTError, jwt
from passlib.context import CryptContext

from dependencies import get_db
from models.user import UserCreate, UserInDB, UserProfile, Token
from crud.user import create_user, get_user_by_email, get_user_by_username
from utils.security import verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=UserProfile)
async def register_user(
    user: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user already exists by email
        existing_user = await get_user_by_email(db, user.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = await get_user_by_username(db, user.userName)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        created_user = await create_user(db, user)
        return UserProfile(**created_user.model_dump())
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Authenticate user and return access token"""
    try:
        # Try to get user by username or email
        user = await get_user_by_username(db, form_data.username)
        if not user:
            user = await get_user_by_email(db, form_data.username)
        
        # Verify user exists and password is correct
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 1800  # 30 minutes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )
