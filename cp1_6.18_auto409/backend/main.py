from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.members import router as members_router
from .routers.rankings import router as rankings_router
from .routers.team import router as team_router
from .database import init_db

app = FastAPI(title="健身热力榜 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(members_router, prefix="/api/members", tags=["members"])
app.include_router(rankings_router, prefix="/api/rankings", tags=["rankings"])
app.include_router(team_router, prefix="/api/team", tags=["team"])
