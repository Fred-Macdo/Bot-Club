from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from passlib.context import CryptContext

# Your imports
from ..database import get_db
from ..crud.user import get_user_by_email, create_user, get_user_by_supabase_id, get_user_by_mongodb_id, get_user_by_username
from ..dependencies import get_current_user_from_token
from ..models.user import UserCreate, UserInDB, Token
from pymongo.database import Database

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Database, username: str, password: str):
    """Authenticate user with username/email and password"""
    user = get_user_by_email(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Database = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.supabase_id or str(user.id)}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/register")
async def register_user(
    user: UserCreate,
    db: Database = Depends(get_db)
):
    """Register a new user"""
    # Check if user already exists
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "email": user.email,
        "hashed_password": hashed_password,
        "is_active": True
    }
    
    created_user = create_user(db, user_data)
    return {"message": "User created successfully", "user_id": str(created_user.id)}

# Supabase integration endpoint (if you're using Supabase + your own backend)
@router.post("/supabase-sync")
async def sync_supabase_user(
    supabase_token: str,
    db: Database = Depends(get_db)
):
    """
    Sync a Supabase user with your local database
    This endpoint receives a Supabase JWT and creates/updates local user record
    """
    try:
        # Decode Supabase JWT
        SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(status_code=500, detail="Supabase JWT secret not configured")
            
        payload = jwt.decode(supabase_token, SUPABASE_JWT_SECRET, algorithms=["HS256"])
        supabase_id = payload.get("sub")
        email = payload.get("email")
        
        if not supabase_id or not email:
            raise HTTPException(status_code=400, detail="Invalid Supabase token")
        
        # Check if user exists in your DB
        user = get_user_by_supabase_id(db, supabase_id)
        if not user:
            # Create new user record
            user_data = {
                "email": email,
                "supabase_id": supabase_id,
                "is_active": True
            }
            user = create_user(db, user_data)
        
        # Create your own JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": supabase_id}, 
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid Supabase token")