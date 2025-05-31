from bson import ObjectId
from typing import Dict, Any, Optional
from datetime import datetime

# Custom ObjectId handler for Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, values=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

def mongo_doc_to_dict(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document to dictionary suitable for Pydantic models"""
    if not doc:
        return None
    
    # Create a copy to avoid modifying original
    result = {}
    
    for key, value in doc.items():
        if key == "_id" and isinstance(value, ObjectId):
            # Convert ObjectId to string for _id field
            result["_id"] = str(value)
        elif isinstance(value, ObjectId):
            # Convert any other ObjectId fields
            result[key] = str(value)
        elif isinstance(value, dict) and "$date" in value:
            # Handle MongoDB date format
            result[key] = datetime.fromisoformat(value["$date"].replace("Z", "+00:00"))
        elif isinstance(value, dict):
            # Recursively handle nested documents
            result[key] = mongo_doc_to_dict(value)
        else:
            result[key] = value
    
    return result