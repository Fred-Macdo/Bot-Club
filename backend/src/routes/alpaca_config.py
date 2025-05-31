# src/routes/alpaca_config.py
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from typing import Optional
import requests

from ..models.alpaca_config import (
    AlpacaConfig, 
    AlpacaConfigCreate, 
    AlpacaConfigUpdate, 
    AlpacaConfigResponse
)
from ..models.user import UserInDB
from ..dependencies import get_current_user_from_token, get_db

router = APIRouter()

@router.post("/alpaca-config", response_model=AlpacaConfigResponse)
async def create_alpaca_config(
    config: AlpacaConfigCreate,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db = Depends(get_db)
):
    """Create or update Alpaca configuration for the current user."""
    try:
        collection = db.alpaca_configs
        
        # Check if config already exists for this user
        existing_config = await collection.find_one({"user_id": current_user.id})
        
        if existing_config:
            # Update existing config
            update_data = {
                "api_key": config.api_key,
                "api_secret": config.api_secret,
                "endpoint": config.endpoint,
                "is_paper": config.is_paper,
                "updated_at": datetime.utcnow()
            }
            
            await collection.update_one(
                {"user_id": current_user.id},
                {"$set": update_data}
            )
            
            # Fetch updated config
            updated_config = await collection.find_one({"user_id": current_user.id})
            updated_config["id"] = str(updated_config["_id"])
            del updated_config["_id"]
            return AlpacaConfigResponse(**updated_config)
        else:
            # Create new config
            alpaca_config = AlpacaConfig(
                user_id=current_user.id,
                api_key=config.api_key,
                api_secret=config.api_secret,
                endpoint=config.endpoint,
                is_paper=config.is_paper
            )
            
            result = await collection.insert_one(alpaca_config.model_dump(by_alias=True))
            
            # Fetch created config
            created_config = await collection.find_one({"_id": result.inserted_id})
            created_config["id"] = str(created_config["_id"])
            del created_config["_id"]
            return AlpacaConfigResponse(**created_config)
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save Alpaca configuration: {str(e)}"
        )

@router.get("/alpaca-config", response_model=Optional[AlpacaConfigResponse])
async def get_alpaca_config(
    current_user: UserInDB = Depends(get_current_user_from_token),
    db = Depends(get_db)
):
    """Get Alpaca configuration for the current user."""
    try:
        collection = db.alpaca_configs
        config = await collection.find_one({"user_id": current_user.id})
        
        if not config:
            return None
            
        config["id"] = str(config["_id"])
        del config["_id"]
        return AlpacaConfigResponse(**config)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch Alpaca configuration: {str(e)}"
        )

@router.put("/alpaca-config", response_model=AlpacaConfigResponse)
async def update_alpaca_config(
    config_update: AlpacaConfigUpdate,
    current_user: UserInDB = Depends(get_current_user_from_token),
    db = Depends(get_db)
):
    """Update Alpaca configuration for the current user."""
    try:
        collection = db.alpaca_configs
        
        # Check if config exists
        existing_config = await collection.find_one({"user_id": current_user.id})
        if not existing_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alpaca configuration not found"
            )
        
        # Prepare update data (only include non-None fields)
        update_data = {
            "updated_at": datetime.utcnow()
        }
        
        if config_update.api_key is not None:
            update_data["api_key"] = config_update.api_key
        if config_update.api_secret is not None:
            update_data["api_secret"] = config_update.api_secret
        if config_update.endpoint is not None:
            update_data["endpoint"] = config_update.endpoint
        if config_update.is_paper is not None:
            update_data["is_paper"] = config_update.is_paper
        
        await collection.update_one(
            {"user_id": current_user.id},
            {"$set": update_data}
        )
        
        # Fetch updated config
        updated_config = await collection.find_one({"user_id": current_user.id})
        updated_config["id"] = str(updated_config["_id"])
        del updated_config["_id"]
        return AlpacaConfigResponse(**updated_config)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Alpaca configuration: {str(e)}"
        )

@router.delete("/alpaca-config")
async def delete_alpaca_config(
    current_user: UserInDB = Depends(get_current_user_from_token),
    db = Depends(get_db)
):
    """Delete Alpaca configuration for the current user."""
    try:
        collection = db.alpaca_configs
        result = await collection.delete_one({"user_id": current_user.id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alpaca configuration not found"
            )
        
        return {"message": "Alpaca configuration deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete Alpaca configuration: {str(e)}"
        )

@router.post("/alpaca-config/test")
async def test_alpaca_connection(
    config: AlpacaConfigCreate,
    current_user: UserInDB = Depends(get_current_user_from_token)
):
    """Test Alpaca API connection with provided credentials."""
    try:
        # Test connection to Alpaca API
        headers = {
            "APCA-API-KEY-ID": config.api_key,
            "APCA-API-SECRET-KEY": config.api_secret,
        }
        
        # Use the appropriate endpoint
        base_url = config.endpoint.rstrip('/')
        if not base_url.endswith('/v2'):
            base_url += '/v2'
        
        # Test with account endpoint
        response = requests.get(
            f"{base_url}/account",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            account_data = response.json()
            return {
                "success": True,
                "message": "Connection successful",
                "account_status": account_data.get("status", "unknown"),
                "trading_blocked": account_data.get("trading_blocked", False),
                "account_blocked": account_data.get("account_blocked", False)
            }
        else:
            error_detail = "Invalid credentials or API configuration"
            try:
                error_data = response.json()
                if "message" in error_data:
                    error_detail = error_data["message"]
            except:
                pass
                
            return {
                "success": False,
                "error": error_detail
            }
            
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "error": f"Connection failed: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Test failed: {str(e)}"
        }
