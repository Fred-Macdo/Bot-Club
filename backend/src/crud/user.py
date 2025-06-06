from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional
from models.user import UserInDB, UserCreate
from utils.security import get_password_hash

async def get_user_by_mongodb_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    """Get user by MongoDB ObjectId"""
    try:
        user_doc = await db.user.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            return UserInDB(**user_doc)
        return None
    except Exception as e:
        print(f"Error getting user by ID: {e}")
        return None

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[UserInDB]:
    """Get user by email"""
    try:
        user_doc = await db.user.find_one({"email": email})
        if user_doc:
            return UserInDB(**user_doc)
        return None
    except Exception as e:
        print(f"Error getting user by email: {e}")
        return None

async def get_user_by_username(db: AsyncIOMotorDatabase, username: str) -> Optional[UserInDB]:
    """Get user by username"""
    try:
        user_doc = await db.user.find_one({"userName": username})
        if user_doc:
            return UserInDB(**user_doc)
        return None
    except Exception as e:
        print(f"Error getting user by username: {e}")
        return None

async def create_user(db: AsyncIOMotorDatabase, user: UserCreate) -> UserInDB:
    """Create a new user"""
    try:
        user_dict = user.model_dump()
        user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
        
        result = await db.user.insert_one(user_dict)
        created_user = await db.user.find_one({"_id": result.inserted_id})
        
        if created_user:
            return UserInDB(**created_user)
        else:
            raise Exception("Failed to retrieve created user")
    except Exception as e:
        print(f"Error creating user: {e}")
        raise

async def update_user(db: AsyncIOMotorDatabase, user_id: str, update_data: dict) -> Optional[UserInDB]:
    """Update user data"""
    try:
        # Remove None values from update_data
        filtered_data = {k: v for k, v in update_data.items() if v is not None}
        
        if not filtered_data:
            # Return current user if no data to update
            return await get_user_by_mongodb_id(db, user_id)
        
        result = await db.user.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": filtered_data}
        )
        
        if result.modified_count > 0:
            return await get_user_by_mongodb_id(db, user_id)
        else:
            return await get_user_by_mongodb_id(db, user_id)  # Return current user even if no changes
            
    except Exception as e:
        print(f"Error updating user: {e}")
        return None