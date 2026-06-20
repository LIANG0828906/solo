import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.assignments import router as assignments_router
from routes.evaluation import router as evaluation_router

app = FastAPI(
    title="Code Assignment Evaluation Platform",
    description="Backend API for evaluating code assignments with sandboxed execution, linting, and test case verification",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assignments_router)
app.include_router(evaluation_router)


@app.on_event("startup")
async def startup():
    print("Code Assignment Evaluation Platform started")
    print(f"Assignments available: {len(os.listdir(os.path.dirname(__file__)))} modules loaded")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
