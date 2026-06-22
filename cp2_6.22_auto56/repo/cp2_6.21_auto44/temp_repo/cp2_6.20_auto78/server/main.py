import asyncio
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HOT_TOPICS = [
    "人工智能", "元宇宙", "新能源", "碳中和", "数字化转型",
    "消费升级", "科技创新", "实体经济", "高质量发展", "共同富裕",
    "直播带货", "短视频", "游戏电竞", "在线教育", "远程办公",
    "健康生活", "绿色出行", "智能家居", "国潮品牌", "文化自信",
    "航天探索", "芯片研发", "5G应用", "大数据", "云计算",
    "区块链", "自动驾驶", "生物医药", "新材料", "量子计算"
]

PLATFORMS = ["weibo", "zhihu", "baidu", "twitter"]

PLATFORM_COLORS = {
    "weibo": "#e6162d",
    "zhihu": "#0066ff",
    "baidu": "#ff6600",
    "twitter": "#1da1f2"
}


class WordItem(BaseModel):
    text: str
    count: int
    sentiment: str
    sentimentScore: float


class HeatmapDataPoint(BaseModel):
    time: str
    platform: str
    value: int
    words: List[WordItem]


class SentimentDataPoint(BaseModel):
    time: str
    positive: int
    negative: int
    neutral: int


class PlatformTrendPoint(BaseModel):
    time: str
    weibo: int
    zhihu: int
    baidu: int
    twitter: int


def generate_mock_words(count: int = 30) -> List[Dict]:
    shuffled = random.sample(HOT_TOPICS, min(count, len(HOT_TOPICS)))
    words = []
    for i, text in enumerate(shuffled):
        rand = random.random()
        if rand < 0.4:
            sentiment = "positive"
            sentiment_score = 0.6 + random.random() * 0.4
        elif rand < 0.7:
            sentiment = "neutral"
            sentiment_score = -0.3 + random.random() * 0.6
        else:
            sentiment = "negative"
            sentiment_score = -0.6 - random.random() * 0.4

        words.append({
            "text": text,
            "count": random.randint(1000, 10000) - i * 200,
            "sentiment": sentiment,
            "sentimentScore": round(sentiment_score, 3)
        })

    words.sort(key=lambda x: x["count"], reverse=True)
    return words


def generate_time_labels(count: int = 12) -> List[str]:
    labels = []
    now = datetime.now()
    for i in range(count - 1, -1, -1):
        time = now - timedelta(minutes=i * 5)
        labels.append(time.strftime("%H:%M"))
    return labels


def generate_heatmap_data() -> List[Dict]:
    times = generate_time_labels()
    data = []
    for platform in PLATFORMS:
        for time in times:
            data.append({
                "time": time,
                "platform": platform,
                "value": random.randint(0, 100),
                "words": generate_mock_words(5)
            })
    return data


def generate_sentiment_data() -> List[Dict]:
    times = generate_time_labels()
    data = []
    for time in times:
        positive = random.randint(30, 70)
        negative = random.randint(15, 40)
        neutral = 100 - positive - negative
        data.append({
            "time": time,
            "positive": positive,
            "negative": negative,
            "neutral": max(0, neutral)
        })
    return data


def generate_platform_trend_data() -> List[Dict]:
    times = generate_time_labels()
    data = []
    for time in times:
        point = {"time": time}
        for platform in PLATFORMS:
            point[platform] = random.randint(200, 700)
        data.append(point)
    return data


@app.get("/api/data")
async def get_data():
    return {
        "words": generate_mock_words(30),
        "heatmap": generate_heatmap_data(),
        "sentiment": generate_sentiment_data(),
        "platformTrend": generate_platform_trend_data(),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/words")
async def get_words(platform: str = "all"):
    return {
        "words": generate_mock_words(30),
        "platform": platform,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/heatmap")
async def get_heatmap():
    return {
        "data": generate_heatmap_data(),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/sentiment")
async def get_sentiment():
    return {
        "data": generate_sentiment_data(),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/trend")
async def get_trend():
    return {
        "data": generate_platform_trend_data(),
        "timestamp": datetime.now().isoformat()
    }


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = {
                "type": "update",
                "data": {
                    "words": generate_mock_words(30),
                    "heatmap": generate_heatmap_data(),
                    "sentiment": generate_sentiment_data(),
                    "platformTrend": generate_platform_trend_data(),
                },
                "timestamp": datetime.now().isoformat()
            }
            await manager.broadcast(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
