from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from booklist import router as booklist_router
from recommend import router as recommend_router

app = FastAPI(title="书旅驿站 API", description="书籍资源管理与社交分享应用后端")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(booklist_router)
app.include_router(recommend_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "书旅驿站服务运行正常"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
