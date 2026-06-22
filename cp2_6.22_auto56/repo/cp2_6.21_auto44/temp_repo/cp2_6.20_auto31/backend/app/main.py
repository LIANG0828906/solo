import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import Base, engine
from .routers import community, users, vinyls

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Vinyl Collection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"


@app.on_event("startup")
async def startup_event():
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)


app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(vinyls.router, prefix="/api/vinyls", tags=["vinyls"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(community.router, prefix="/api/community", tags=["community"])


@app.get("/api/health", tags=["health"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "sqlite:///./vinyl_collection.db"
    }
