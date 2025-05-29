from pymongo.database import Database
from bson import ObjectId
from typing import Optional, Dict, Any
from ..models.user import UserCreate, UserInDB, UserUpdate
from ..utils.security import get_password_hash
from datetime import datetime

async def get_user_by_email(db: Database, email: str) -> Optional[UserInDB]:
    user_data = db.users.find_one({"email": email})
    if user_data:
        return UserInDB(**user_data)
    return None

async def get_user_by_username(db: Database, username: str) -> Optional[UserInDB]:
    user_data = db.users.find_one({"userName": username})
    if user_data:
        return UserInDB(**user_data)
    return None

def create_user(db: Database, user_data: Dict[str, Any]) -> Optional[UserInDB]:
    """
    Create a new user in the database.
    user_data should include hashed_password and all profile fields.
    """
    # Add timestamp
    user_data["createdAt"] = datetime.utcnow()
    
    # Insert into database
    result = db.users.insert_one(user_data)
    
    # Retrieve created user
    created_user_data = db.users.find_one({"_id": result.inserted_id})
    if created_user_data:
        return UserInDB(**created_user_data)
    return None

async def create_user_from_model(db: Database, user: UserCreate) -> Optional[UserInDB]:
    """
    Create a new user from UserCreate model.
    """
    # Check if user with this email or username already exists
    if await get_user_by_email(db, user.email):
        return None
    if await get_user_by_username(db, user.userName):
        return None
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Prepare user data for database insertion
    user_data = user.model_dump(exclude={"password", "confirmPassword"})
    user_data["hashed_password"] = hashed_password
    user_data["createdAt"] = datetime.utcnow()
    
    # Insert into database
    result = db.users.insert_one(user_data)
    
    # Retrieve created user
    created_user_data = db.users.find_one({"_id": result.inserted_id})
    if created_user_data:
        return UserInDB(**created_user_data)
    return None

async def get_user_by_mongodb_id(db: Database, user_id: str) -> Optional[UserInDB]:
    """Get user by MongoDB _id"""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return None
    user_data = db.users.find_one({"_id": obj_id})
    if user_data:
        return UserInDB(**user_data)
    return None

async def update_user(db: Database, user_id: str, update_data: Dict[str, Any]) -> Optional[UserInDB]:
    """Update user data"""
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        return None
    
    # Add updated timestamp
    update_data["updatedAt"] = datetime.utcnow()
    
    result = db.users.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_data},
        return_document=True
    )
    
    if result:
        return UserInDB(**result)
    return None