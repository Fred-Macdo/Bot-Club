from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Dict, Any

from ..dependencies import get_db
from ..crud.user import get_user_by_email, get_user_by_username, create_user_from_model
from ..models.user import UserCreate, UserInDB, Token

router = APIRouter()

@router.post("/register", response_model=Dict[str, Any])
async def register_user(
    user_data: UserCreate,
    db = Depends(get_db)
):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        existing_user = await get_user_by_username(db, user_data.userName)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user
        user = await create_user_from_model(db, user_data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        return {"message": "User registered successfully", "user_id": str(user.id)}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db = Depends(get_db)
):
    """OAuth2 compatible token login"""
    from ..utils.security import verify_password, create_access_token
    
    # Try to authenticate with email first, then username
    user = await get_user_by_email(db, form_data.username)
    if not user:
        user = await get_user_by_username(db, form_data.username)
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 1800  # 30 minutes
    }
