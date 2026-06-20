from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Memory(BaseModel):
    id: Optional[str] = None
    date: str
    title: str
    description: str
    lat: float
    lng: float
    imageUrl: str


memories: List[Memory] = [
    Memory(
        id=str(uuid.uuid4()),
        date="2024-03-15",
        title="东京浅草寺",
        description="清晨的浅草寺人不多，雷门的灯笼在晨光中显得格外庄重。",
        lat=35.7148,
        lng=139.7967,
        imageUrl="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&h=200&fit=crop"
    ),
    Memory(
        id=str(uuid.uuid4()),
        date="2024-03-17",
        title="京都伏见稻荷大社",
        description="沿着千本鸟居一路向上，红色的鸟居在绿色山林中绵延不绝。",
        lat=34.9671,
        lng=135.7727,
        imageUrl="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=200&h=200&fit=crop"
    ),
    Memory(
        id=str(uuid.uuid4()),
        date="2024-03-20",
        title="大阪城公园",
        description="樱花季的大阪城格外美丽，天守阁在花海中巍峨耸立。",
        lat=34.6873,
        lng=135.5262,
        imageUrl="https://images.unsplash.com/photo-1590559899731-a382839e5549?w=200&h=200&fit=crop"
    ),
    Memory(
        id=str(uuid.uuid4()),
        date="2024-06-10",
        title="巴黎埃菲尔铁塔",
        description="黄昏时分登上铁塔，整座城市在金色的余晖中渐渐点亮灯火。",
        lat=48.8584,
        lng=2.2945,
        imageUrl="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=200&h=200&fit=crop"
    ),
    Memory(
        id=str(uuid.uuid4()),
        date="2024-09-05",
        title="马尔代夫水上屋",
        description="推开门就是碧蓝的海水，热带鱼在脚下的珊瑚丛中游来游去。",
        lat=3.2028,
        lng=73.2207,
        imageUrl="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=200&h=200&fit=crop"
    )
]


@app.get("/memories", response_model=List[Memory])
def get_memories():
    return memories


@app.post("/memories", response_model=Memory)
def create_memory(memory: Memory):
    memory.id = str(uuid.uuid4())
    memories.append(memory)
    return memory


@app.put("/memories/{memory_id}", response_model=Memory)
def update_memory(memory_id: str, update_data: Memory):
    for i, m in enumerate(memories):
        if m.id == memory_id:
            update_data.id = memory_id
            memories[i] = update_data
            return memories[i]
    raise HTTPException(status_code=404, detail="Memory not found")


@app.delete("/memories/{memory_id}")
def delete_memory(memory_id: str):
    for i, m in enumerate(memories):
        if m.id == memory_id:
            memories.pop(i)
            return {"success": True}
    raise HTTPException(status_code=404, detail="Memory not found")
