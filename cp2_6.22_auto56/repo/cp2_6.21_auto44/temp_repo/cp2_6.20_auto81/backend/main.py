from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import story_routes

app = FastAPI(title="Terminal Adventure API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(story_routes.router, prefix="/api", tags=["story"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Terminal Adventure API is running"}
