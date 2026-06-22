from fastapi import FastAPI
import socketio
import uvicorn

app = FastAPI(title="test")

@app.get("/")
def root():
    return {"message": "hello fastapi"}

@app.get("/api/test")
def test_api():
    return {"ok": True, "data": [1, 2, 3]}

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
combined_app = socketio.ASGIApp(sio, app)

@sio.event
async def connect(sid, environ):
    print(f"ws connect: {sid}")

@sio.event
async def disconnect(sid):
    print(f"ws disconnect: {sid}")

if __name__ == "__main__":
    print("Starting combined app on port 8002...")
    print(f"FastAPI routes: {[r.path for r in app.routes]}")
    uvicorn.run(combined_app, host="0.0.0.0", port=8002)
