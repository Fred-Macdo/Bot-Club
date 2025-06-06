from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routes import auth, users, user_config
from database.client import db_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    # Startup
    try:
        await db_client.connect()
        print("Database connected successfully")
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise
    
    yield
    
    # Shutdown
    await db_client.disconnect()
    print("Database disconnected")

# Create FastAPI app with lifespan events
app = FastAPI(
    title="Bot Club API",
    description="Algorithmic Trading Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# --- CORS Middleware Configuration ---
origins = [
    "http://localhost:3000",
    "http://localhost:3001",  # Add additional frontend ports if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(user_config.router, prefix="/api/user-config", tags=["user-config"])

@app.get("/")
async def root():
    return {"message": "Bot Club API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}