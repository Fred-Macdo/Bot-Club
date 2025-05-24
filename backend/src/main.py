from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import users
from .database import client  # Your MongoDB client


app = FastAPI(
    title="Bot Club API",
    description="API for Bot Club trading application",
    version="0.1.0"
)

# --- CORS Middleware Configuration ---
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- End CORS Middleware Configuration ---

# Include routers
app.include_router(users.router)

# Add startup/shutdown events for MongoDB
@app.on_event("startup")
async def startup_event():
    # Test MongoDB connection
    try:
        client.admin.command('ping')
        print("Successfully connected to MongoDB")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    client.close()

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Bot Club API"}