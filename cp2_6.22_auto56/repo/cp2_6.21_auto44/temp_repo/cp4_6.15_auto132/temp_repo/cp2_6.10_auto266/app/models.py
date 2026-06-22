from typing import List, Optional, Tuple
from pydantic import BaseModel

STARS: List[str] = [
    "青龙",
    "白虎",
    "朱雀",
    "玄武",
    "紫微",
    "太微",
    "天市",
    "文昌"
]

INSCRIPTIONS: List[str] = [
    "乾",
    "坤",
    "震",
    "巽",
    "坎",
    "离",
    "艮",
    "兑"
]

STAR_TYPES: List[str] = [
    "meteor",
    "comet",
    "eclipse",
    "nova",
    "conjunction"
]

RANDOM_EVENT_TYPES: List[str] = [
    "meteor_fall",
    "duel",
    "chart_destroyed"
]

STAR_DESCRIPTIONS: dict = {
    "meteor": "流星划过天际，荧惑守心之象，主有急变之事",
    "comet": "彗星显现，彗尾横扫紫微，主兵祸之兆",
    "eclipse": "月食奇观，太阴隐曜，主阴盛阳衰之象",
    "nova": "新星爆发，异星突现于天市，主有异人出世",
    "conjunction": "五星连珠，日月合璧，主大吉之兆"
}

EVENT_HINTS: dict = {
    "meteor": "流星属火，当以火性星宿镇之，铭文取刚健之意",
    "comet": "彗星属金，杀气腾腾，当以土性星宿化之，铭文取柔顺之意",
    "eclipse": "月食属水，太阴被蚀，当以木性星宿泄之，铭文取光明之意",
    "nova": "新星属木，阳气勃发，当以火性星宿助之，铭文取震动之意",
    "conjunction": "五星连珠属土，天地合德，当以土性星宿应之，铭文取承载之意"
}

INSCRIPTION_MEANINGS: dict = {
    "乾": "刚健不息，天行健",
    "坤": "厚德载物，地势坤",
    "震": "雷动奋发，威震四方",
    "巽": "风随顺入，润物无声",
    "坎": "水行险陷，刚毅有度",
    "离": "火明丽照，光明正大",
    "艮": "山静笃实，厚重稳当",
    "兑": "泽润喜悦，和乐安康"
}

STAR_INSCRIPTION_PAIRS: List[Tuple[str, str]] = [
    ("青龙", "震"),
    ("白虎", "兑"),
    ("朱雀", "离"),
    ("玄武", "坎"),
    ("紫微", "乾"),
    ("太微", "坤"),
    ("天市", "艮"),
    ("文昌", "巽")
]


class StarEvent(BaseModel):
    id: str
    type: str
    description: str
    hint: str
    correctStar: str
    correctInscription: str
    timeLimit: int
    availableStars: List[str]
    availableInscriptions: List[str]


class RandomEvent(BaseModel):
    id: str
    type: str
    description: str
    timeLimit: int
    reward: int


class StarEventsResponse(BaseModel):
    day: int
    xun: int
    events: List[StarEvent]
    randomEvent: Optional[RandomEvent]
    cultivation: int


class SubmitRequest(BaseModel):
    eventId: str
    selectedStar: str
    selectedInscription: str
    timeRemaining: int


class StarRecord(BaseModel):
    eventId: str
    success: bool
    timestamp: float
    star: str
    inscription: str


class SubmitResponse(BaseModel):
    success: bool
    cultivationChange: int
    newCultivation: int
    message: str
    nextEvent: Optional[StarEvent]
    isXunEnd: bool
    starRecord: Optional[StarRecord]


class RandomEventSubmitRequest(BaseModel):
    eventId: str
    action: str
    success: bool


class RandomEventSubmitResponse(BaseModel):
    success: bool
    cultivationChange: int
    newCultivation: int
    message: str


class StarWenRecord(BaseModel):
    xun: int
    startDay: int
    endDay: int
    totalEvents: int
    successCount: int
    accuracy: float
    finalCultivation: int
    grade: str
    comment: str


class RecordsResponse(BaseModel):
    records: List[StarWenRecord]
