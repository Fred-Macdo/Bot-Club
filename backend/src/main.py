from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import users, auth, strategies, user_config
from .dependencies import connect_to_mongo, close_mongo_connection


app = FastAPI(
    title="Bot Club API",
    description="API for Bot Club trading application",
    version="0.1.0"
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
# --- End CORS Middleware Configuration ---

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["Strategies"])
app.include_router(user_config.router, prefix="/api/user-config", tags=["User Configuration"])

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Bot Club API"}