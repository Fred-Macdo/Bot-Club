from fastapi import APIRouter, HTTPException, Depends
from pymongo.database import Database # Keep if get_db returns Database
# If get_db returns MongoClient, then Database type hint might need adjustment or remove if not used directly
from ..models.user import UserCreate, User, UserInDB # Added UserInDB
from ..crud.user import create_user, get_user_by_email, get_user_by_username # Removed get_current_active_user
from ..dependencies import get_db, get_current_user_from_token # Added get_current_user_from_token

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

@router.post("/register", response_model=User, status_code=201)
async def register_user(user_data: UserCreate, db: Database = Depends(get_db)): # Renamed user to user_data
    # ... (existing registration logic)
    # Ensure you are using user_data.email, user_data.userName etc.
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_data.userName and get_user_by_username(db, user_data.userName): # Check if userName is provided
        raise HTTPException(status_code=400, detail="Username already taken")
    
    db_user = create_user(db, user_data)
    if not db_user:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Map UserInDB to User response model
    return User.model_validate(db_user.model_dump(by_alias=True))


@router.get("/me", response_model=User)
async def read_users_me(current_user: UserInDB = Depends(get_current_user_from_token)):
    # current_user is UserInDB, convert to User response model
    # model_validate is for Pydantic v2, for v1 it's User(**current_user.dict(by_alias=True))
    return User.model_validate(current_user.model_dump(by_alias=True))

# Example of how you might create a link endpoint (implement later)
# @router.post("/link-supabase", status_code=200)
# async def link_supabase_account(link_data: dict, db: Database = Depends(get_db)):
#     # email = link_data.get("email")
#     # supabase_id = link_data.get("supabase_id")
#     # user = db.users.find_one_and_update({"email": email}, {"$set": {"supabaseId": supabase_id}})
#     # if not user:
#     #     raise HTTPException(status_code=404, detail="User not found by email to link")
#     return {"message": "Account linked successfully"}

@router.get("/profile/{user_id}", response_model=User)
async def get_user_profile(user_id: str, db: Database = Depends(get_db)):
    user = db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User.model_validate(user)