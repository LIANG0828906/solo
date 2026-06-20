from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import okr, milestone, websocket
from .database import init_db

app = FastAPI(title="OKR Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(okr.router, prefix="/api")
app.include_router(milestone.router, prefix="/api")
app.include_router(websocket.router)


@app.on_event("startup")
def startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok"}
