from pydantic import BaseModel, EmailStr, Field, HttpUrl
from typing import Optional
from datetime import datetime
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserAddress(BaseModel):
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipCode: Optional[str] = None

class UserProfile(BaseModel):
    firstName: str
    lastName: str
    phone: Optional[str] = None
    address: Optional[UserAddress] = None
    timezone: str = "America/New_York"
    bio: Optional[str] = None
    profileImage: Optional[str] = None

class UserBase(BaseModel):
    userName: str
    email: EmailStr
    profile: UserProfile = Field(default_factory=UserProfile)
    supabase_id: Optional[str] = Field(default=None, alias="supabaseId")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: Optional[str] = Field(alias="_id", default=None)
    hashed_password: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        from_attributes = True

class User(UserBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    
    class Config:
        populate_by_name = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None

# Helper functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)