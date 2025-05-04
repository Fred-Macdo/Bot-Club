from fastapi import FastAPI
from pymongo import MongoClient
import os

app = FastAPI()

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
client = MongoClient(mongo_url)
db = client["farm_stack_project"]

@app.get("/")
def read_root():
    return {"message": "Welcome to the FARM Stack Project!"}

@app.get("/api/data")
def get_data():
    # Example MongoDB query
    data = db.collection_name.find_one()
    return {"data": data}