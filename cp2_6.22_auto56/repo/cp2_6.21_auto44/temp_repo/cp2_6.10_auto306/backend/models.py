from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class Sigil(BaseModel):
    id: str
    type: str
    name: str
    element: str
    meaning: str
    keywords: List[str]
    image_url: str


class DivinationFormation(BaseModel):
    formation_id: str
    formation_name: str
    description: str
    position: str


class DivinationResult(BaseModel):
    session_id: str
    sigil1: Sigil
    sigil2: Sigil
    formation: DivinationFormation
    poem: str
    stability: int
    inspiration: int
    conflict: int
    created_at: datetime = Field(default_factory=datetime.now)
    saved: bool = False


class DailyStats(BaseModel):
    date: str
    total_divinations: int
    sigil_distribution: Dict[str, int]
    average_stability: float
    average_inspiration: float
    average_conflict: float


class WeeklyReport(BaseModel):
    week_start: str
    week_end: str
    total_divinations: int
    most_common_sigil: str
    most_common_formation: str
    trend_stability: List[float]
    trend_inspiration: List[float]
    trend_conflict: List[float]


class Storage:
    def __init__(self):
        self.sessions: Dict[str, List[DivinationResult]] = {}
        self.sigils: List[Sigil] = self._init_sigils()

    def _init_sigils(self) -> List[Sigil]:
        return [
            Sigil(
                id="mind_1",
                type="心境签",
                name="明镜止水",
                element="水",
                meaning="内心平静如水，思绪清晰明澈",
                keywords=["平静", "清晰", "反思"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=serene%20calm%20water%20mirror%20zen%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="mind_2",
                type="心境签",
                name="烈焰燃心",
                element="火",
                meaning="内心充满热情与动力，勇往直前",
                keywords=["热情", "勇气", "行动"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=burning%20flame%20heart%20passion%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="mind_3",
                type="心境签",
                name="山岳巍峨",
                element="土",
                meaning="内心坚定如山，稳重可靠",
                keywords=["坚定", "稳重", "可靠"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=majestic%20mountain%20strength%20stability%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="mind_4",
                type="心境签",
                name="清风徐来",
                element="风",
                meaning="心境轻松自在，随遇而安",
                keywords=["自由", "轻松", "随性"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gentle%20breeze%20wind%20freedom%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="mind_5",
                type="心境签",
                name="雷霆万钧",
                element="雷",
                meaning="内心激荡，充满变革的力量",
                keywords=["变革", "力量", "冲击"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=thunder%20lightning%20power%20change%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="star_1",
                type="星运签",
                name="北极星",
                element="金",
                meaning="指引方向，前途光明",
                keywords=["指引", "希望", "方向"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=north%20star%20guiding%20light%20celestial%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="star_2",
                type="星运签",
                name="新月",
                element="水",
                meaning="新的开始，充满潜力",
                keywords=["新生", "希望", "潜力"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=crescent%20moon%20new%20beginning%20mystical%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="star_3",
                type="星运签",
                name="彗星",
                element="火",
                meaning="突如其来的机遇与变化",
                keywords=["机遇", "变化", "突破"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=comet%20trail%20opportunity%20cosmic%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="star_4",
                type="星运签",
                name="昴星团",
                element="土",
                meaning="团结协作，众星拱月",
                keywords=["团结", "友情", "协作"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pleiades%20star%20cluster%20unity%20friendship%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="star_5",
                type="星运签",
                name="流星",
                element="风",
                meaning="转瞬即逝的美好，珍惜当下",
                keywords=["珍惜", "瞬间", "美好"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shooting%20star%20wish%20moment%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="elem_1",
                type="元素签",
                name="金之锐",
                element="金",
                meaning="锋利果断，无坚不摧",
                keywords=["果断", "锐利", "突破"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20blade%20sharp%20metal%20element%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="elem_2",
                type="元素签",
                name="木之荣",
                element="木",
                meaning="生长繁荣，生生不息",
                keywords=["生长", "繁荣", "希望"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lush%20green%20tree%20growth%20wood%20element%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="elem_3",
                type="元素签",
                name="水之柔",
                element="水",
                meaning="以柔克刚，润物无声",
                keywords=["柔韧", "适应", "滋养"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=flowing%20water%20river%20flexible%20water%20element%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="elem_4",
                type="元素签",
                name="火之烈",
                element="火",
                meaning="热情奔放，光芒万丈",
                keywords=["热情", "光明", "力量"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blazing%20fire%20flame%20passion%20fire%20element%20symbol&image_size=square_hd"
            ),
            Sigil(
                id="elem_5",
                type="元素签",
                name="土之厚",
                element="土",
                meaning="厚德载物，包容万物",
                keywords=["包容", "厚重", "承载"],
                image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fertile%20earth%20ground%20earth%20element%20symbol&image_size=square_hd"
            )
        ]


storage = Storage()


daily_limit = {
    "count": 0,
    "last_reset": datetime.now().date(),
    "cooldown_end": None
}
