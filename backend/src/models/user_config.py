from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import hashlib
import os
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

class UserConfigBase(BaseModel):
    # Alpaca Paper Trading Configuration
    alpaca_paper_api_key: Optional[str] = None
    alpaca_paper_secret_key: Optional[str] = None
    alpaca_paper_endpoint: Optional[str] = "https://paper-api.alpaca.markets/v2"
    
    # Alpaca Live Trading Configuration  
    alpaca_live_api_key: Optional[str] = None
    alpaca_live_secret_key: Optional[str] = None
    alpaca_live_endpoint: Optional[str] = "https://api.alpaca.markets/v2"
    
    # Polygon Configuration
    polygon_api_key_name: Optional[str] = None
    polygon_secret_key: Optional[str] = None

class UserConfigCreate(UserConfigBase):
    pass

class UserConfigUpdate(UserConfigBase):
    pass

class UserConfigInDB(UserConfigBase):
    user_id: str
    created_at: datetime
    updated_at: datetime

class UserConfigResponse(UserConfigBase):
    # Return masked versions for security
    def mask_sensitive_data(self):
        if self.alpaca_paper_api_key:
            self.alpaca_paper_api_key = self.alpaca_paper_api_key[:8] + "..." if len(self.alpaca_paper_api_key) > 8 else "***"
        if self.alpaca_paper_secret_key:
            self.alpaca_paper_secret_key = "***"
        if self.alpaca_live_api_key:
            self.alpaca_live_api_key = self.alpaca_live_api_key[:8] + "..." if len(self.alpaca_live_api_key) > 8 else "***"
        if self.alpaca_live_secret_key:
            self.alpaca_live_secret_key = "***"
        if self.polygon_secret_key:
            self.polygon_secret_key = "***"
        return self

# Encryption utilities
class ConfigEncryption:
    @staticmethod
    def get_encryption_key():
        """Get encryption key from environment"""
        key = os.getenv('CONFIG_ENCRYPTION_KEY')
        if not key:
            logger.error("CONFIG_ENCRYPTION_KEY not found in environment variables!")
            logger.error("Please generate a key with: python generate_encryption_key.py")
            raise ValueError("CONFIG_ENCRYPTION_KEY environment variable is required")
        
        try:
            # Ensure the key is properly formatted
            if isinstance(key, str):
                key = key.encode()
            
            # Validate the key by trying to create a Fernet instance
            Fernet(key)
            return key
        except Exception as e:
            logger.error(f"Invalid CONFIG_ENCRYPTION_KEY format: {e}")
            raise ValueError("CONFIG_ENCRYPTION_KEY must be a valid Fernet key")
    
    @staticmethod
    def encrypt_value(value: str) -> str:
        """Encrypt a sensitive value"""
        if not value:
            return value
        
        try:
            fernet = Fernet(ConfigEncryption.get_encryption_key())
            encrypted_value = fernet.encrypt(value.encode())
            return encrypted_value.decode()
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            raise ValueError(f"Failed to encrypt value: {e}")
    
    @staticmethod
    def decrypt_value(encrypted_value: str) -> str:
        """Decrypt a sensitive value"""
        if not encrypted_value:
            return encrypted_value
            
        try:
            fernet = Fernet(ConfigEncryption.get_encryption_key())
            decrypted_value = fernet.decrypt(encrypted_value.encode())
            return decrypted_value.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            # Return empty string on decryption failure to avoid exposing encrypted data
            return ""