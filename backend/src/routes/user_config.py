from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import requests
from bson import ObjectId

from ..dependencies import get_db, get_current_user_from_token
from ..models.user import UserInDB
from ..models.user_config import (
    UserConfigCreate,
    UserConfigUpdate,
    UserConfigInDB,
    UserConfigResponse
)

router = APIRouter()

@router.get("/", response_model=Optional[UserConfigResponse])
async def get_user_config(
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get user's API configuration"""
    try:
        config = await db.user_configs.find_one({"user_id": ObjectId(current_user.id)})
        
        if not config:
            return None
        
        return UserConfigResponse(**config)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving configuration: {str(e)}"
        )

@router.post("/alpaca")
async def save_alpaca_config(
    config_data: dict,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Save or update Alpaca configuration"""
    try:
        user_id = ObjectId(current_user.id)
        
        # Prepare update data
        update_data = {
            "alpaca_api_key": config_data.get("alpaca_api_key"),
            "alpaca_secret_key": config_data.get("alpaca_secret_key"),
            "alpaca_endpoint": config_data.get("alpaca_endpoint", "https://paper-api.alpaca.markets/v2"),
            "alpaca_is_paper": config_data.get("alpaca_is_paper", True)
        }
        
        # Update or create configuration
        result = await db.user_configs.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Alpaca configuration saved successfully",
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving Alpaca configuration: {str(e)}"
        )

@router.post("/polygon")
async def save_polygon_config(
    config_data: dict,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Save or update Polygon configuration"""
    try:
        user_id = ObjectId(current_user.id)
        
        # Prepare update data
        update_data = {
            "polygon_api_key": config_data.get("polygon_api_key"),
            "polygon_secret_key": config_data.get("polygon_secret_key")
        }
        
        # Update or create configuration
        result = await db.user_configs.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "Polygon configuration saved successfully",
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving Polygon configuration: {str(e)}"
        )

@router.post("/test-alpaca")
async def test_alpaca_connection(
    test_data: dict,
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Test Alpaca API connection"""
    try:
        api_key = test_data.get("apiKey")
        api_secret = test_data.get("apiSecret")
        endpoint = test_data.get("endpoint", "https://paper-api.alpaca.markets/v2")
        
        if not api_key or not api_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="API key and secret are required"
            )
        
        # Test connection to Alpaca API
        headers = {
            "APCA-API-KEY-ID": api_key,
            "APCA-API-SECRET-KEY": api_secret
        }
        
        # Try to get account information
        response = requests.get(
            f"{endpoint}/account",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            account_data = response.json()
            return {
                "success": True,
                "message": "Alpaca connection successful",
                "account_info": {
                    "account_number": account_data.get("account_number"),
                    "status": account_data.get("status"),
                    "trading_blocked": account_data.get("trading_blocked")
                }
            }
        else:
            return {
                "success": False,
                "error": f"Alpaca API error: {response.status_code} - {response.text}"
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Connection error: {str(e)}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error testing Alpaca connection: {str(e)}"
        )

@router.post("/test-polygon")
async def test_polygon_connection(
    test_data: dict,
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Test Polygon API connection"""
    try:
        api_key = test_data.get("apiKey")
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Polygon API key is required"
            )
        
        # Test connection to Polygon API
        response = requests.get(
            f"https://api.polygon.io/v3/reference/tickers?active=true&limit=1&apikey={api_key}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": "Polygon connection successful",
                "status": data.get("status")
            }
        else:
            return {
                "success": False,
                "error": f"Polygon API error: {response.status_code} - {response.text}"
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Connection error: {str(e)}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error testing Polygon connection: {str(e)}"
        )

@router.delete("/alpaca")
async def delete_alpaca_config(
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete Alpaca configuration"""
    try:
        user_id = ObjectId(current_user.id)
        
        # Remove Alpaca fields
        result = await db.user_configs.update_one(
            {"user_id": user_id},
            {"$unset": {
                "alpaca_api_key": "",
                "alpaca_secret_key": "",
                "alpaca_endpoint": "",
                "alpaca_is_paper": ""
            }}
        )
        
        return {
            "success": True,
            "message": "Alpaca configuration deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting Alpaca configuration: {str(e)}"
        )

@router.delete("/polygon")
async def delete_polygon_config(
    current_user: UserInDB = Depends(get_current_user_from_token),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete Polygon configuration"""
    try:
        user_id = ObjectId(current_user.id)
        
        # Remove Polygon fields
        result = await db.user_configs.update_one(
            {"user_id": user_id},
            {"$unset": {
                "polygon_api_key": "",
                "polygon_secret_key": ""
            }}
        )
        
        return {
            "success": True,
            "message": "Polygon configuration deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting Polygon configuration: {str(e)}"
        )