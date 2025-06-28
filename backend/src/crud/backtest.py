from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..models.backtest import (
    Backtest,
    BacktestCreate,
    BacktestParams,
    BacktestResponse,
    BacktestSummary,
    TradeData,
    EquityPoint,
    BacktestStats,
    BacktestExecution
    )
from ..utils.mongo_helpers import PyObjectId

# Collection Names
BACKTEST_COLLECTION = "backtest"
STRATEGY_COLLECTION = "strategy"

async def create_backtest(
    db: AsyncIOMotorDatabase, 
    user_id: Union[str, PyObjectId], 
    backtest_data: dict
) -> Backtest:
    """Create a new backtest"""
    print(f"DEBUG CRUD: Creating backtest for user_id: {user_id}")
    
    backtest_collection = db[BACKTEST_COLLECTION]
    
    # Ensure user_id is PyObjectId
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    # Ensure strategy_id is PyObjectId
    strategy_id = backtest_data.get("strategy_id")
    if isinstance(strategy_id, str):
        backtest_data["strategy_id"] = PyObjectId(strategy_id)
    
    backtest_data["user_id"] = user_id
    backtest_data["created_at"] = datetime.utcnow()
    backtest_data["updated_at"] = datetime.utcnow()
    
    try:
        backtest = Backtest(**backtest_data)
        result = await backtest_collection.insert_one(backtest.dict(by_alias=True))
        
        # Retrieve the created backtest
        created_backtest = await backtest_collection.find_one({"_id": result.inserted_id})
        print(f"DEBUG CRUD: Created backtest with ID: {result.inserted_id}")
        
        return Backtest(**created_backtest)
    except Exception as e:
        print(f"DEBUG CRUD: Error creating backtest: {e}")
        raise

async def get_backtest_by_id(
    db: AsyncIOMotorDatabase, 
    backtest_id: Union[str, PyObjectId],
    user_id: Union[str, PyObjectId]
) -> Optional[Backtest]:
    """Get a backtest by ID (ensuring user ownership)"""
    print(f"DEBUG CRUD: Getting backtest {backtest_id} for user {user_id}")
    
    backtest_collection = db[BACKTEST_COLLECTION]
    
    # Ensure proper ObjectId types
    if isinstance(backtest_id, str):
        backtest_id = PyObjectId(backtest_id)
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    try:
        backtest_doc = await backtest_collection.find_one({
            "_id": backtest_id,
            "user_id": user_id
        })
        
        if backtest_doc:
            return Backtest(**backtest_doc)
        return None
    except Exception as e:
        print(f"DEBUG CRUD: Error getting backtest: {e}")
        return None

async def get_backtests_by_user_id(
    db: AsyncIOMotorDatabase, 
    user_id: Union[str, PyObjectId],
    limit: int = 50,
    skip: int = 0
) -> List[BacktestSummary]:
    """Get all backtests for a user with pagination"""
    print(f"DEBUG CRUD: Getting backtests for user_id: {user_id}")
    
    backtest_collection = db[BACKTEST_COLLECTION]
    strategy_collection = db[STRATEGY_COLLECTION]
    
    # Ensure proper ObjectId type
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    try:
        # Aggregate to join with strategy collection for strategy name
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$lookup": {
                "from": STRATEGY_COLLECTION,
                "localField": "strategy_id", 
                "foreignField": "_id",
                "as": "strategy"
            }},
            {"$unwind": "$strategy"},
            {"$project": {
                "strategy_id": {"$toString": "$strategy_id"},
                "strategy_name": "$strategy.name",
                "total_return": "$stats.total_return",
                "sharpe_ratio": "$stats.sharpe_ratio",
                "max_drawdown": "$stats.max_drawdown",
                "total_trades": "$stats.total_trades",
                "start_date": 1,
                "end_date": 1,
                "created_at": 1
            }},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        cursor = backtest_collection.aggregate(pipeline)
        backtests = []
        
        async for backtest_doc in cursor:
            backtest_doc["id"] = str(backtest_doc["_id"])
            del backtest_doc["_id"]
            backtests.append(BacktestSummary(**backtest_doc))
        
        print(f"DEBUG CRUD: Found {len(backtests)} backtests for user")
        return backtests
    except Exception as e:
        print(f"DEBUG CRUD: Error getting backtests: {e}")
        return []

async def get_backtests_by_strategy_id(
    db: AsyncIOMotorDatabase,
    strategy_id: Union[str, PyObjectId],
    user_id: Union[str, PyObjectId],
    limit: int = 10
) -> List[BacktestSummary]:
    """Get backtests for a specific strategy"""
    print(f"DEBUG CRUD: Getting backtests for strategy_id: {strategy_id}")
    
    backtest_collection = db[BACKTEST_COLLECTION]
    strategy_collection = db[STRATEGY_COLLECTION]
    
    # Ensure proper ObjectId types
    if isinstance(strategy_id, str):
        strategy_id = PyObjectId(strategy_id)
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    try:
        pipeline = [
            {"$match": {
                "strategy_id": strategy_id,
                "user_id": user_id
            }},
            {"$lookup": {
                "from": STRATEGY_COLLECTION,
                "localField": "strategy_id",
                "foreignField": "_id", 
                "as": "strategy"
            }},
            {"$unwind": "$strategy"},
            {"$project": {
                "strategy_id": {"$toString": "$strategy_id"},
                "strategy_name": "$strategy.name",
                "total_return": "$stats.total_return",
                "sharpe_ratio": "$stats.sharpe_ratio",
                "max_drawdown": "$stats.max_drawdown", 
                "total_trades": "$stats.total_trades",
                "start_date": 1,
                "end_date": 1,
                "created_at": 1
            }},
            {"$sort": {"created_at": -1}},
            {"$limit": limit}
        ]
        
        cursor = backtest_collection.aggregate(pipeline)
        backtests = []
        
        async for backtest_doc in cursor:
            backtest_doc["id"] = str(backtest_doc["_id"])
            del backtest_doc["_id"]
            backtests.append(BacktestSummary(**backtest_doc))
        
        return backtests
    except Exception as e:
        print(f"DEBUG CRUD: Error getting backtests by strategy: {e}")
        return []

async def update_backtest(
    db: AsyncIOMotorDatabase,
    backtest_id: Union[str, PyObjectId],
    user_id: Union[str, PyObjectId],
    update_data: dict
) -> Optional[Backtest]:
    """Update a backtest"""
    print(f"DEBUG CRUD: Updating backtest {backtest_id}")
    
    backtest_collection = db[BACKTEST_COLLECTION]
    
    # Ensure proper ObjectId types
    if isinstance(backtest_id, str):
        backtest_id = PyObjectId(backtest_id)
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    try:
        update_data["updated_at"] = datetime.utcnow()
        
        result = await backtest_collection.update_one(
            {"_id": backtest_id, "user_id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            updated_backtest = await backtest_collection.find_one({"_id": backtest_id})
            return Backtest(**updated_backtest)
        return None
    except Exception as e:
        print(f"DEBUG CRUD: Error updating backtest: {e}")
        return None

async def delete_backtest(
    db: AsyncIOMotorDatabase,
    backtest_id: Union[str, PyObjectId],
    user_id: Union[str, PyObjectId]
) -> bool:
    """Delete a backtest"""
    print(f"DEBUG CRUD: Deleting backtest {backtest_id}")
    
    backtest_collection = db[BACKTEST_COLLECTION]
    
    # Ensure proper ObjectId types
    if isinstance(backtest_id, str):
        backtest_id = PyObjectId(backtest_id)
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    try:
        result = await backtest_collection.delete_one({
            "_id": backtest_id,
            "user_id": user_id
        })
        
        return result.deleted_count > 0
    except Exception as e:
        print(f"DEBUG CRUD: Error deleting backtest: {e}")
        return False

async def get_backtest_count_by_user(
    db: AsyncIOMotorDatabase,
    user_id: Union[str, PyObjectId]
) -> int:
    """Get total backtest count for a user"""
    backtest_collection = db[BACKTEST_COLLECTION]
    
    if isinstance(user_id, str):
        user_id = PyObjectId(user_id)
    
    try:
        count = await backtest_collection.count_documents({"user_id": user_id})
        return count
    except Exception as e:
        print(f"DEBUG CRUD: Error counting backtests: {e}")
        return 0

async def create_backtest_execution(
    db: AsyncIOMotorDatabase,
    execution: BacktestExecution
) -> str:
    """Create a new backtest execution record"""
    collection = db["backtest_executions"]
    
    execution_dict = execution.dict(by_alias=True)
    result = await collection.insert_one(execution_dict)
    
    return str(result.inserted_id)

async def update_backtest_execution(
    db: AsyncIOMotorDatabase,
    backtest_id: str,
    update_data: dict
) -> bool:
    """Update backtest execution record"""
    collection = db["backtest_executions"]
    
    update_data["updated_at"] = datetime.utcnow()
    
    result = await collection.update_one(
        {"_id": ObjectId(backtest_id)},
        {"$set": update_data}
    )
    
    return result.modified_count > 0

async def get_backtest_execution(
    db: AsyncIOMotorDatabase,
    backtest_id: str,
    user_id: str
) -> Optional[BacktestExecution]:
    """Get backtest execution by ID"""
    collection = db["backtest_executions"]
    
    execution_data = await collection.find_one({
        "_id": ObjectId(backtest_id),
        "user_id": ObjectId(user_id)
    })
    
    if execution_data:
        return BacktestExecution(**execution_data)
    return None

async def get_strategy_for_backtest(
    db: AsyncIOMotorDatabase, 
    strategy_id_str: str, 
    user_id: ObjectId
) -> Optional[Dict[str, Any]]:
    # Add debug logging to see exactly what we're searching for
    print(f"\n[DEBUG] Searching for strategy with ID: {strategy_id_str}")
    print(f"[DEBUG] Collection names: {await db.list_collection_names()}\n")
    
    try:
        strategy_obj_id = ObjectId(strategy_id_str)
    except Exception:
        print(f"[DEBUG] Invalid ObjectId format: {strategy_id_str}")
        return None

    # Check the 'strategy' collection (singular)
    user_strategy = await db.strategy.find_one({
        "_id": strategy_obj_id,
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    if user_strategy:
        print(f"[DEBUG] Found in 'strategy' collection: {user_strategy['name']}")
        return user_strategy

    # If not found in 'strategy', try 'strategies' (plural) as fallback
    user_strategy_plural = await db.strategies.find_one({
        "_id": strategy_obj_id,
        "$or": [
            {"user_id": user_id},
            {"user_id": str(user_id)}
        ]
    })
    
    if user_strategy_plural:
        print(f"[DEBUG] Found in 'strategies' collection: {user_strategy_plural['name']}")
        return user_strategy_plural

    # Try default strategies collection
    default_strategy = await db.default_strategies.find_one(
        {"_id": strategy_obj_id}
    )
    
    if default_strategy:
        print(f"[DEBUG] Found in 'default_strategies' collection: {default_strategy['name']}")
        return default_strategy

    print(f"[DEBUG] No strategy found with ID: {strategy_id_str}")
    return None
