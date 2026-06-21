import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from moduleD.main import router as moduleD_router
from moduleE.ws_routes import router as moduleE_router
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="文档批注系统 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(moduleD_router, prefix="/api")
app.include_router(moduleE_router)


@app.get("/")
def root():
    return {"message": "文档批注系统 API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
