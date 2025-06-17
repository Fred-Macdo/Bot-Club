from datetime import datetime
from typing import List, Optional, Union
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
from ..services.default_strategies import get_default_strategies_from_db

# Strategy Collection Name
STRATEGY_COLLECTION = "strategy"
BACKTEST_COLLECTION = "backtest_result"

# backend/app/crud/strategy.py
async def get_strategies_by_user_id(db: AsyncIOMotorDatabase, user_id: Union[str, PyObjectId]) -> List[Strategy]:
    """Get all strategies for a specific user (match both ObjectId and str user_id fields)"""
    print(f"DEBUG CRUD: Searching for strategies with user_id: {user_id}")
    print(f"DEBUG CRUD: user_id type: {type(user_id)}")
    
    strategies_collection = db.strategy
    # Match both ObjectId and string user_id
    user_id_str = str(user_id)
    query = {"$or": [
        {"user_id": user_id},
        {"user_id": user_id_str}
    ]}
    cursor = strategies_collection.find(query)
    
    # Count total documents
    total_count = await strategies_collection.count_documents(query)
    print(f"DEBUG CRUD: Found {total_count} documents matching user_id (any type)")
    
    strategies = []
    async for strategy_doc in cursor:
        print(f"DEBUG CRUD: Processing strategy: {strategy_doc.get('name')}")
        print(f"DEBUG CRUD: Strategy document keys: {list(strategy_doc.keys())}")
        
        try:
            # Try to create Strategy object
            strategy = Strategy(**strategy_doc)
            strategies.append(strategy)
            print(f"DEBUG CRUD: Successfully parsed strategy: {strategy.name}")
        except Exception as e:
            print(f"DEBUG CRUD: Failed to parse strategy '{strategy_doc.get('name')}': {str(e)}")
            print(f"DEBUG CRUD: Document structure: {strategy_doc}")
            
            # Try to fix common issues
            fixed_doc = fix_strategy_document(strategy_doc)
            if fixed_doc:
                try:
                    strategy = Strategy(**fixed_doc)
                    strategies.append(strategy)
                    print(f"DEBUG CRUD: Successfully parsed FIXED strategy: {strategy.name}")
                except Exception as e2:
                    print(f"DEBUG CRUD: Even fixed strategy failed: {str(e2)}")
    
    print(f"DEBUG CRUD: Returning {len(strategies)} successfully parsed strategies")
    return strategies

def fix_strategy_document(doc: dict) -> dict:
    """Try to fix common issues with strategy documents"""
    try:
        fixed_doc = doc.copy()
        
        # Ensure required fields exist
        if 'config' not in fixed_doc or not fixed_doc['config']:
            print("DEBUG CRUD: Missing or empty config, creating default")
            fixed_doc['config'] = {
                'symbols': ['AAPL'],
                'timeframe': '1d',
                'start_date': '2024-01-01',
                'end_date': '2024-12-31',
                'entry_conditions': [],
                'exit_conditions': [],
                'risk_management': {
                    'position_sizing_method': 'risk_based',
                    'risk_per_trade': 0.02,
                    'stop_loss': 0.05,
                    'take_profit': 0.10,
                    'max_position_size': 10000.0,
                    'atr_multiplier': 2.0
                },
                'indicators': []
            }
        
        # Ensure config has required subfields
        config = fixed_doc['config']
        if 'symbols' not in config:
            config['symbols'] = ['AAPL']
        if 'timeframe' not in config:
            config['timeframe'] = '1d'
        if 'start_date' not in config:
            config['start_date'] = '2024-01-01'
        if 'end_date' not in config:
            config['end_date'] = '2024-12-31'
        if 'entry_conditions' not in config:
            config['entry_conditions'] = []
        if 'exit_conditions' not in config:
            config['exit_conditions'] = []
        if 'indicators' not in config:
            config['indicators'] = []
        if 'risk_management' not in config:
            config['risk_management'] = {
                'position_sizing_method': 'risk_based',
                'risk_per_trade': 0.02,
                'stop_loss': 0.05,
                'take_profit': 0.10,
                'max_position_size': 10000.0,
                'atr_multiplier': 2.0
            }
        
        # Ensure basic fields exist
        if 'name' not in fixed_doc:
            fixed_doc['name'] = 'Unnamed Strategy'
        if 'description' not in fixed_doc:
            fixed_doc['description'] = 'No description provided'
        if 'is_active' not in fixed_doc:
            fixed_doc['is_active'] = False
        if 'is_paper' not in fixed_doc:
            fixed_doc['is_paper'] = True
        if 'created_at' not in fixed_doc:
            fixed_doc['created_at'] = datetime.utcnow()
        if 'updated_at' not in fixed_doc:
            fixed_doc['updated_at'] = datetime.utcnow()
            
        return fixed_doc
        
    except Exception as e:
        print(f"DEBUG CRUD: Error fixing document: {str(e)}")
        return None
    
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
