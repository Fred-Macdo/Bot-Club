from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from ..utils.mongo_helpers import PyObjectId

class UserConfigBase(BaseModel):
    # Alpaca Configuration
    alpaca_api_key: Optional[str] = None
    alpaca_secret_key: Optional[str] = None
    alpaca_endpoint: Optional[str] = "https://paper-api.alpaca.markets/v2"
    alpaca_is_paper: Optional[bool] = True
    
    # Polygon Configuration
    polygon_api_key: Optional[str] = None
    polygon_secret_key: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserConfigCreate(UserConfigBase):
    pass

class UserConfigUpdate(BaseModel):
    # Alpaca Configuration
    alpaca_api_key: Optional[str] = None
    alpaca_secret_key: Optional[str] = None
    alpaca_endpoint: Optional[str] = None
    alpaca_is_paper: Optional[bool] = None
    
    # Polygon Configuration
    polygon_api_key: Optional[str] = None
    polygon_secret_key: Optional[str] = None

    class Config:
        populate_by_name = True

class UserConfigInDB(UserConfigBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class UserConfigResponse(UserConfigBase):
    id: str = Field(alias="_id")
    user_id: str
    
    class Config:
        populate_by_name = True