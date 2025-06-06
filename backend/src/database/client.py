from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables from .env file in backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class DatabaseClient:
    def __init__(self):
        self.client = None
        self.database = None
        
    async def connect(self) -> AsyncIOMotorDatabase:
        """Connect to MongoDB using Motor (async)"""
        try:
            # Check if we should use local MongoDB
            use_local = os.getenv('LOCAL_DB', 'true').lower() == 'true'
            
            if use_local:
                # Use local MongoDB
                mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017/bot_club_db')
                print(f"Connecting to local MongoDB: {mongo_url}")
                self.client = AsyncIOMotorClient(mongo_url)
            else:
                # Use MongoDB Atlas
                connection_string = os.getenv('MONGO_CONNECTION_STRING')
                if not connection_string:
                    # Build connection string from components
                    username = os.getenv('MONGO_USERNAME')
                    password = os.getenv('MONGO_PASSWORD')
                    cluster = os.getenv('MONGO_CLUSTER')
                    connection_string = f"mongodb+srv://{username}:{password}@{cluster}/"
                
                print(f"Connecting to MongoDB Atlas")
                self.client = AsyncIOMotorClient(connection_string)
            
            # Get database name
            db_name = os.getenv('MONGO_DB_NAME', 'bot_club_db')
            self.database = self.client[db_name]
            
            # Test the connection
            await self.client.admin.command('ping')
            print(f"Successfully connected to MongoDB database: {db_name}")
            
            return self.database
            
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("Disconnected from MongoDB")

# Global database client instance
db_client = DatabaseClient()

