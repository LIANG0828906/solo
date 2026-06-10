from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from typing import List, Optional, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONSTELLATION_IDS = [
    'jiao', 'kang', 'di', 'fang', 'xin', 'wei', 'ji',
    'dou', 'niu', 'nv', 'xu', 'wei2', 'shi', 'bi',
    'kui', 'lou', 'wei3', 'mao', 'bi2', 'zi', 'shen',
    'jing', 'gui', 'liu', 'xing', 'zhang', 'yi', 'zhen'
]

INSCRIPTIONS = [
    '镇星安位', '辉光普照', '润物无声', '木秀于林', '金刚不坏',
    '吉星高照', '避邪扶正', '凝神聚气', '清风徐来', '静水流深',
    '明镜高悬', '偃武修文'
]

EVENT_TYPES = [
    {'type': 'meteor', 'name': '流星划过', 'descs': [
        '西方天际有流星划过，其色赤红，主西方有兵戈之象',
        '流星自东北而来，坠入西南，主有使节来访',
        '流星如雨，连续三日，主天下大乱'
    ]},
    {'type': 'comet', 'name': '彗星现世', 'descs': [
        '彗星见于东方，尾长三丈，主有乱臣贼子欲谋逆',
        '彗星扫北斗，主改朝换代之兆',
        '彗星入紫微，主宫廷有变'
    ]},
    {'type': 'eclipse', 'name': '月食异象', 'descs': [
        '月食于子夜时分，天地昏暗，主阴盛阳衰',
        '月食既，有赤气贯月，主皇后失德',
        '月食不见星，主大旱之年'
    ]},
]

class Weather(BaseModel):
    type: str
    name: str
    icon: str
    modifier: float

class EventOption(BaseModel):
    constellationId: str
    inscription: str
    isCorrect: bool

class CelestialEvent(BaseModel):
    id: str
    type: str
    name: str
    description: str
    constellationId: str
    correctInscription: str
    options: List[EventOption]
    difficulty: float
    timeLimit: int

class ValidateRequest(BaseModel):
    eventId: str
    constellationId: str
    inscription: str

class ValidateResponse(BaseModel):
    isCorrect: bool
    cultivationGain: int

class ScoreRequest(BaseModel):
    accuracy: float
    cultivation: int
    totalEvents: int

class ScoreResponse(BaseModel):
    totalScore: int
    accuracyScore: int
    cultivationScore: int
    eventScore: int
    rank: str
    comment: str

events_store: Dict[str, CelestialEvent] = {}

@app.post("/api/generate-event", response_model=CelestialEvent)
async def generate_event(weather: Weather):
    event_type = random.choice(EVENT_TYPES)
    constellation_id = random.choice(CONSTELLATION_IDS)
    correct_inscription = random.choice(INSCRIPTIONS)
    
    options = []
    
    correct_option = EventOption(
        constellationId=constellation_id,
        inscription=correct_inscription,
        isCorrect=True
    )
    options.append(correct_option)
    
    other_constellations = [c for c in CONSTELLATION_IDS if c != constellation_id]
    other_inscriptions = [i for i in INSCRIPTIONS if i != correct_inscription]
    
    for _ in range(2):
        wrong_constellation = random.choice(other_constellations)
        wrong_inscription = random.choice(other_inscriptions)
        options.append(EventOption(
            constellationId=wrong_constellation,
            inscription=wrong_inscription,
            isCorrect=False
        ))
        other_constellations = [c for c in other_constellations if c != wrong_constellation]
        other_inscriptions = [i for i in other_inscriptions if i != wrong_inscription]
    
    random.shuffle(options)
    
    difficulty = 1.0 + weather.modifier
    if weather.type == 'thunder':
        difficulty += 0.3
    elif weather.type == 'rain':
        difficulty += 0.1
    
    event_id = f"event-{random.randint(100000, 999999)}"
    event = CelestialEvent(
        id=event_id,
        type=event_type['type'],
        name=event_type['name'],
        description=random.choice(event_type['descs']),
        constellationId=constellation_id,
        correctInscription=correct_inscription,
        options=options,
        difficulty=round(difficulty, 1),
        timeLimit=15
    )
    
    events_store[event_id] = event
    return event

@app.post("/api/validate-choice", response_model=ValidateResponse)
async def validate_choice(request: ValidateRequest):
    event = events_store.get(request.eventId)
    
    if not event:
        return ValidateResponse(
            isCorrect=False,
            cultivationGain=0
        )
    
    is_correct = (request.constellationId == event.constellationId and 
                  request.inscription == event.correctInscription)
    
    if is_correct:
        base_gain = 15
        difficulty_bonus = int(event.difficulty * 5)
        cultivation_gain = base_gain + difficulty_bonus
    else:
        cultivation_gain = 0
    
    if request.eventId in events_store:
        del events_store[request.eventId]
    
    return ValidateResponse(
        isCorrect=is_correct,
        cultivationGain=cultivation_gain
    )

@app.post("/api/calculate-score", response_model=ScoreResponse)
async def calculate_score(request: ScoreRequest):
    accuracy_score = round(request.accuracy * 50)
    cultivation_score = min(round(request.cultivation / 10), 30)
    event_score = min(request.totalEvents * 2, 20)
    total_score = accuracy_score + cultivation_score + event_score
    
    if total_score >= 90:
        rank = '紫微星官'
        comment = '功参造化，名垂青史。卿乃国之栋梁，当位列三台！'
    elif total_score >= 80:
        rank = '太白金官'
        comment = '政绩卓著，万民敬仰。卿之才德，可镇一方！'
    elif total_score >= 70:
        rank = '青龙星官'
        comment = '勤勉有加，渐入佳境。继续努力，前途不可限量！'
    elif total_score >= 60:
        rank = '玄武星官'
        comment = '恪尽职守，可堪大任。还需精进，以成大器！'
    else:
        rank = '铜星官'
        comment = '继续努力，天道酬勤。勤能补拙，他日必有所成！'
    
    return ScoreResponse(
        totalScore=total_score,
        accuracyScore=accuracy_score,
        cultivationScore=cultivation_score,
        eventScore=event_score,
        rank=rank,
        comment=comment
    )

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
