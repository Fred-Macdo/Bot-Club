from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..models.strategy import (
    Strategy, 
    StrategyCreate, 
    StrategyUpdate, 
    StrategyConfig,
    BacktestResult, 
    BacktestParams
)
from ..utils.mongo_helpers import PyObjectId
from ..services.default_strategies import get_default_strategies

# Strategy Collection Name
STRATEGY_COLLECTION = "strategy"
BACKTEST_COLLECTION = "backtest_result"

async def create_default_strategies_for_user(db: AsyncIOMotorDatabase, user_id: PyObjectId) -> List[dict]:
    """Create default strategies for a new user from the default_strategies collection"""
    created_strategies = []
    
    # Get all default strategies from the collection
    async for default_strategy in db["default_strategies"].find({}):
        yaml_config = default_strategy['yaml_config']
        
        strategy_doc = {
            "_id": ObjectId(),
            "user_id": user_id,
            "name": yaml_config['name'],
            "description": yaml_config.get('description', ''),
            "config": yaml_config,  # Store the entire YAML config
            "is_active": False,
            "is_paper": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db[STRATEGY_COLLECTION].insert_one(strategy_doc)
        strategy_doc["_id"] = result.inserted_id
        created_strategies.append(strategy_doc)
    
    return created_strategies

async def get_strategies_by_user_id(db: AsyncIOMotorDatabase, user_id: PyObjectId) -> List[Strategy]:
    """Get all strategies for a specific user"""
    strategies = []
    async for strategy_data in db[STRATEGY_COLLECTION].find({"user_id": user_id}):
        strategies.append(Strategy(**strategy_data))
    return strategies

async def get_strategy_by_id(db: AsyncIOMotorDatabase, strategy_id: PyObjectId, user_id: PyObjectId) -> Optional[Strategy]:
    """Get a strategy by ID (ensuring it belongs to the user)"""
    strategy_data = await db[STRATEGY_COLLECTION].find_one({
        "_id": strategy_id,
        "user_id": user_id
    })
    if strategy_data:
        return Strategy(**strategy_data)
    return None

async def create_strategy(db: AsyncIOMotorDatabase, strategy_data: StrategyCreate, user_id: PyObjectId) -> Strategy:
    """Create a new strategy"""
    strategy = Strategy(
        user_id=user_id,
        name=strategy_data.name,
        description=strategy_data.description,
        config=strategy_data.config,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    strategy_dict = strategy.dict(by_alias=True)
    result = await db[STRATEGY_COLLECTION].insert_one(strategy_dict)
    
    # Return the created strategy with the new ID
    strategy.id = result.inserted_id
    return strategy

async def update_strategy(
    db: AsyncIOMotorDatabase, 
    strategy_id: PyObjectId, 
    strategy_update: StrategyUpdate, 
    user_id: PyObjectId
) -> Optional[Strategy]:
    """Update an existing strategy"""
    # Build update data
    update_data = {}
    if strategy_update.name is not None:
        update_data["name"] = strategy_update.name
    if strategy_update.description is not None:
        update_data["description"] = strategy_update.description
    if strategy_update.config is not None:
        update_data["config"] = strategy_update.config.dict()
    if strategy_update.is_active is not None:
        update_data["is_active"] = strategy_update.is_active
    if strategy_update.is_paper is not None:
        update_data["is_paper"] = strategy_update.is_paper
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db[STRATEGY_COLLECTION].update_one(
        {"_id": strategy_id, "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count:
        return await get_strategy_by_id(db, strategy_id, user_id)
    return None

async def delete_strategy(db: AsyncIOMotorDatabase, strategy_id: PyObjectId, user_id: PyObjectId) -> bool:
    """Delete a strategy"""
    result = await db[STRATEGY_COLLECTION].delete_one({
        "_id": strategy_id,
        "user_id": user_id
    })
    return result.deleted_count > 0

async def toggle_strategy_status(
    db: AsyncIOMotorDatabase, 
    strategy_id: PyObjectId, 
    user_id: PyObjectId, 
    is_active: bool
) -> Optional[Strategy]:
    """Toggle strategy active status"""
    result = await db[STRATEGY_COLLECTION].update_one(
        {"_id": strategy_id, "user_id": user_id},
        {"$set": {"is_active": is_active, "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count:
        return await get_strategy_by_id(db, strategy_id, user_id)
    return None

# Backtest CRUD operations
async def save_backtest_result(
    db: AsyncIOMotorDatabase, 
    strategy_id: PyObjectId, 
    backtest_result: BacktestResult
) -> BacktestResult:
    """Save backtest results"""
    backtest_result.strategy_id = strategy_id
    backtest_result.created_at = datetime.utcnow()
    
    result_dict = backtest_result.dict(by_alias=True)
    result = await db[BACKTEST_COLLECTION].insert_one(result_dict)
    
    backtest_result.id = result.inserted_id
    return backtest_result

async def get_backtest_results_by_strategy(
    db: AsyncIOMotorDatabase, 
    strategy_id: PyObjectId
) -> List[BacktestResult]:
    """Get all backtest results for a strategy"""
    results = []
    async for result_data in db[BACKTEST_COLLECTION].find({"strategy_id": strategy_id}).sort("created_at", -1):
        results.append(BacktestResult(**result_data))
    return results

async def get_backtest_result_by_id(
    db: AsyncIOMotorDatabase, 
    backtest_id: PyObjectId
) -> Optional[BacktestResult]:
    """Get a specific backtest result by ID"""
    result_data = await db[BACKTEST_COLLECTION].find_one({"_id": backtest_id})
    if result_data:
        return BacktestResult(**result_data)
    return None

async def delete_backtest_results_by_strategy(
    db: AsyncIOMotorDatabase, 
    strategy_id: PyObjectId
) -> bool:
    """Delete all backtest results for a strategy (when strategy is deleted)"""
    result = await db[BACKTEST_COLLECTION].delete_many({"strategy_id": strategy_id})
    return result.deleted_count > 0

async def get_default_strategies_from_db(db: AsyncIOMotorDatabase) -> List[dict]:
    """Get all default strategies from the default_strategies collection"""
    strategies = []
    cursor = db.default_strategies.find({})
    
    async for doc in cursor:
        # Return raw documents for the API to convert to StrategyCreate
        strategies.append(doc)
    
    return strategies
