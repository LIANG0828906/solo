from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import plots, orders, user

app = FastAPI(title="虚拟农场API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/api/user", tags=["用户"])
app.include_router(plots.router, prefix="/api/plots", tags=["地块"])
app.include_router(orders.router, prefix="/api", tags=["订单"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "虚拟农场API运行中"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
