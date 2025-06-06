from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from dependencies import get_db, get_current_user_from_token
from models.user import UserInDB, UserUpdate, UserProfile
from crud.user import update_user, get_user_by_mongodb_id
from bson import ObjectId

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Get current user's profile"""
    return UserProfile(**current_user.model_dump())

@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: Database = Depends(get_db)
):
    """Update current user's profile"""
    # Convert to dict and exclude None values
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    updated_user = await update_user(db, str(current_user.id), update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserProfile(**updated_user.model_dump())

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: str,
    db: Database = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Get any user's profile by ID (for viewing other users)"""
    try:
        user = await get_user_by_mongodb_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return UserProfile(**user.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )