from pymongo.database import Database
from bson import ObjectId
from typing import Optional
from ..models.user import UserCreate, UserInDB, get_password_hash, UserProfile

def get_user_by_email(db: Database, email: str) -> Optional[UserInDB]:
    user_data = db.users.find_one({"email": email})
    if user_data:
        return UserInDB(**user_data)
    return None

def get_user_by_username(db: Database, username: str) -> Optional[UserInDB]:
    user_data = db.users.find_one({"userName": username})
    if user_data:
        return UserInDB(**user_data)
    return None

def create_user(db: Database, user: UserCreate) -> Optional[UserInDB]:
    # Check if user with this email or username already exists (can be handled in router too)
    if get_user_by_email(db, user.email):
        return None # Or raise an exception/return specific error
    if user.userName and get_user_by_username(db, user.userName): # Check if userName is provided
        return None # Or raise an exception/return specific error
    
    hashed_password = get_password_hash(user.password)
    
    # Prepare user data for UserInDB, including supabase_id if provided
    # User model_dump by_alias=True will handle the aliasing for db fields
    user_in_db_data = user.model_dump(exclude={"password"}, by_alias=False) # Use field names for UserInDB constructor

    # Ensure profile is correctly structured if it's None initially or not provided
    # UserCreate now has profile: Optional[UserProfile] = Field(default_factory=UserProfile)
    # So user.profile should be a UserProfile instance.

    db_user_model = UserInDB(
        **user_in_db_data, # Pass data using Python field names
        hashed_password=hashed_password
    )
    
    # Insert into database using aliases for MongoDB field names
    user_dict_to_insert = db_user_model.model_dump(exclude_none=True, by_alias=True)
    
    result = db.users.insert_one(user_dict_to_insert)
    
    created_user_data = db.users.find_one({"_id": result.inserted_id})
    if created_user_data:
        return UserInDB(**created_user_data) # Pydantic will map _id to id
    return None

def get_user_by_supabase_id(db: Database, supabase_id: str) -> Optional[UserInDB]:
    user_data = db.users.find_one({"supabaseId": supabase_id}) # Query using the alias name in DB
    if user_data:
        return UserInDB(**user_data) # Pydantic maps supabaseId from DB to supabase_id attribute
    return None

def get_user_by_mongodb_id(db: Database, user_id: str) -> Optional[UserInDB]:
    try:
        obj_id = ObjectId(user_id)
    except Exception: # More specific: from bson.errors import InvalidId
        return None
    user_data = db.users.find_one({"_id": obj_id})
    if user_data:
        return UserInDB(**user_data)
    return None