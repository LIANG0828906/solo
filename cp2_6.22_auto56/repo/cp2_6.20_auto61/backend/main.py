from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, fragments, repairs

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="文物碎片修复与分类系统",
    description="用于文物碎片分类、修复记录管理和知识图谱的后端API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["认证"])
app.include_router(fragments.router, prefix="/api", tags=["碎片"])
app.include_router(repairs.router, prefix="/api", tags=["修复记录"])


@app.get("/")
def root():
    return {
        "message": "文物碎片修复与分类系统 API",
        "version": "1.0.0",
        "docs": "/docs"
    }
