from fastapi import FastAPI
import socketio
import uvicorn

app = FastAPI()

@app.get("/")
def root():
    return {"message": "hello from fastapi"}

@app.get("/api/test")
def test():
    return {"ok": True}

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode="asgi")
socket_app = socketio.ASGIApp(sio, app)

@sio.event
async def connect(sid, environ):
    print(f"connected: {sid}")

if __name__ == "__main__":
    uvicorn.run("test_socketio:socket_app", host="0.0.0.0", port=8001, reload=True)
