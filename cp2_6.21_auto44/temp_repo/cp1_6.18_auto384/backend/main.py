from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal, init_db
from models import CafeMenu, RoastingRecord


app = FastAPI(title="Cafe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FlavorProfile(BaseModel):
    acidity: int = Field(ge=0, le=100)
    body: int = Field(ge=0, le=100)
    sweetness: int = Field(ge=0, le=100)
    bitterness: int = Field(ge=0, le=100)
    floral: int = Field(ge=0, le=100)
    fruity: int = Field(ge=0, le=100)


class RoastingRecordBase(BaseModel):
    time_sec: int
    temperature: int
    notes: Optional[str] = None


class RoastingRecordCreate(RoastingRecordBase):
    pass


class RoastingRecordResponse(RoastingRecordBase):
    id: int

    class Config:
        from_attributes = True


class CafeMenuBase(BaseModel):
    name: str
    origin: str
    roast_level: str
    flavor_description: str
    image_url: Optional[str] = None
    rating: int = Field(ge=0, le=100)
    flavor_profile: FlavorProfile


class CafeMenuCreate(CafeMenuBase):
    pass


class CafeMenuUpdate(BaseModel):
    name: Optional[str] = None
    origin: Optional[str] = None
    roast_level: Optional[str] = None
    flavor_description: Optional[str] = None
    image_url: Optional[str] = None
    rating: Optional[int] = Field(None, ge=0, le=100)
    flavor_profile: Optional[FlavorProfile] = None


class CafeMenuResponse(BaseModel):
    id: str
    name: str
    origin: str
    roast_level: str
    flavor_description: str
    image_url: Optional[str] = None
    rating: int
    flavor_profile: FlavorProfile

    class Config:
        from_attributes = True


class CafeMenuDetailResponse(CafeMenuResponse):
    roasting_records: List[RoastingRecordResponse] = []

    class Config:
        from_attributes = True


class RoastingRecordBatchCreate(BaseModel):
    records: List[RoastingRecordCreate]


class FlavorDescriptionItem(BaseModel):
    name: str
    description: str
    tasting_tips: str


class FlavorDescriptionsResponse(BaseModel):
    acidity: FlavorDescriptionItem
    body: FlavorDescriptionItem
    sweetness: FlavorDescriptionItem
    bitterness: FlavorDescriptionItem
    floral: FlavorDescriptionItem
    fruity: FlavorDescriptionItem


@app.get("/cafe/menu", response_model=List[CafeMenuResponse])
def get_cafe_menu(db: Session = Depends(get_db)) -> List[CafeMenu]:
    menus = db.query(CafeMenu).all()
    return menus


@app.get("/cafe/menu/{menu_id}", response_model=CafeMenuDetailResponse)
def get_cafe_menu_detail(menu_id: str, db: Session = Depends(get_db)) -> CafeMenu:
    menu = db.query(CafeMenu).filter(CafeMenu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Cafe menu not found")
    return menu


@app.post("/cafe/menu", response_model=CafeMenuResponse)
def create_cafe_menu(menu: CafeMenuCreate, db: Session = Depends(get_db)) -> CafeMenu:
    db_menu = CafeMenu(
        name=menu.name,
        origin=menu.origin,
        roast_level=menu.roast_level,
        flavor_description=menu.flavor_description,
        image_url=menu.image_url,
        rating=menu.rating,
        flavor_profile=menu.flavor_profile.model_dump(),
    )
    db.add(db_menu)
    db.commit()
    db.refresh(db_menu)
    return db_menu


@app.put("/cafe/menu/{menu_id}", response_model=CafeMenuResponse)
def update_cafe_menu(menu_id: str, menu_update: CafeMenuUpdate, db: Session = Depends(get_db)) -> CafeMenu:
    db_menu = db.query(CafeMenu).filter(CafeMenu.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Cafe menu not found")

    update_data = menu_update.model_dump(exclude_unset=True)
    if "flavor_profile" in update_data:
        update_data["flavor_profile"] = update_data["flavor_profile"]

    for key, value in update_data.items():
        setattr(db_menu, key, value)

    db.commit()
    db.refresh(db_menu)
    return db_menu


@app.delete("/cafe/menu/{menu_id}")
def delete_cafe_menu(menu_id: str, db: Session = Depends(get_db)) -> Dict[str, str]:
    db_menu = db.query(CafeMenu).filter(CafeMenu.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Cafe menu not found")

    db.delete(db_menu)
    db.commit()
    return {"message": "Cafe menu deleted successfully"}


@app.post("/cafe/menu/{menu_id}/roasting-records", response_model=List[RoastingRecordResponse])
def add_roasting_records(
    menu_id: str,
    batch: RoastingRecordBatchCreate,
    db: Session = Depends(get_db),
) -> List[RoastingRecord]:
    db_menu = db.query(CafeMenu).filter(CafeMenu.id == menu_id).first()
    if not db_menu:
        raise HTTPException(status_code=404, detail="Cafe menu not found")

    created_records = []
    for record_data in batch.records:
        db_record = RoastingRecord(
            cafe_menu_id=menu_id,
            time_sec=record_data.time_sec,
            temperature=record_data.temperature,
            notes=record_data.notes,
        )
        db.add(db_record)
        created_records.append(db_record)

    db.commit()
    for record in created_records:
        db.refresh(record)

    return created_records


@app.get("/cafe/flavor-descriptions", response_model=FlavorDescriptionsResponse)
def get_flavor_descriptions() -> FlavorDescriptionsResponse:
    return FlavorDescriptionsResponse(
        acidity=FlavorDescriptionItem(
            name="酸度",
            description="咖啡的酸度是指咖啡入口后感受到的明亮、清新或尖锐的酸感，类似于水果的酸味。优质的酸度应该是活泼而愉悦的，而非刺激或不悦的。",
            tasting_tips="品尝时注意咖啡在舌尖和两颊产生的感觉。浅烘咖啡通常酸度较高，深烘咖啡酸度较低。可以联想柑橘类水果、莓果或苹果的酸感。",
        ),
        body=FlavorDescriptionItem(
            name="醇厚度",
            description="醇厚度是指咖啡在口中的重量感和质地，类似于牛奶的浓稠度。可以从清淡如水到浓稠如奶油般的不同层次。",
            tasting_tips="喝一小口咖啡，让它在舌头上停留，感受咖啡的质感和重量。醇厚度高的咖啡会有饱满、丝滑的口感；醇厚度低的则更加轻盈清爽。",
        ),
        sweetness=FlavorDescriptionItem(
            name="甜度",
            description="咖啡中的甜度来自于烘焙过程中糖类的焦糖化和美拉德反应。好的甜度应该是自然、圆润的，而非添加糖的那种直接甜味。",
            tasting_tips="注意咖啡入喉后留下的甘甜余韵。可以联想焦糖、蜂蜜、巧克力或水果的甜味。新鲜烘焙的优质咖啡通常具有更好的自然甜度。",
        ),
        bitterness=FlavorDescriptionItem(
            name="苦度",
            description="苦度是咖啡的基本味道之一，主要来自咖啡因和烘焙过程中的焦糖化产物。适度的苦味可以增加咖啡的层次感，但过度则会变得不悦。",
            tasting_tips="感受舌根部位的苦味。深烘咖啡通常苦味更明显。好的苦味应该是愉悦的，类似黑巧克力或烤坚果的苦味，而非焦苦或涩感。",
        ),
        floral=FlavorDescriptionItem(
            name="花香",
            description="花香是咖啡中来自芳香化合物的香气，类似于花朵的芬芳。常见的花香包括茉莉、玫瑰、薰衣草、洋甘菊等。",
            tasting_tips="在喝咖啡前先闻一闻干香和湿香，注意是否有花朵般的香气。浅烘的非洲咖啡（如埃塞俄比亚）通常带有明显的花香。",
        ),
        fruity=FlavorDescriptionItem(
            name="果香",
            description="果香是咖啡中类似水果的风味，包括浆果、柑橘、核果、热带水果等多种类型。这些风味来自咖啡生豆中的有机酸和芳香化合物。",
            tasting_tips="品尝时联想各种水果的味道，如柠檬、莓果、桃子、芒果等。果香丰富的咖啡通常具有较高的酸度和清爽的口感。",
        ),
    )


def create_sample_data(db: Session) -> None:
    existing = db.query(CafeMenu).first()
    if existing:
        return

    yirgacheffe = CafeMenu(
        name="埃塞俄比亚耶加雪菲",
        origin="埃塞俄比亚 耶加雪菲产区",
        roast_level="浅",
        flavor_description="花香馥郁，带有明显的柑橘和莓果风味，酸度明亮，口感清爽，余韵甘甜悠长。",
        image_url=None,
        rating=92,
        flavor_profile={
            "acidity": 85,
            "body": 45,
            "sweetness": 78,
            "bitterness": 20,
            "floral": 90,
            "fruity": 88,
        },
    )
    db.add(yirgacheffe)

    huila = CafeMenu(
        name="哥伦比亚慧兰",
        origin="哥伦比亚 慧兰产区",
        roast_level="中",
        flavor_description="平衡感极佳，带有焦糖和坚果的甜感，伴有柔和的柑橘酸质，口感圆润饱满。",
        image_url=None,
        rating=88,
        flavor_profile={
            "acidity": 55,
            "body": 65,
            "sweetness": 72,
            "bitterness": 40,
            "floral": 45,
            "fruity": 60,
        },
    )
    db.add(huila)

    mandheling = CafeMenu(
        name="印尼曼特宁",
        origin="印度尼西亚 苏门答腊",
        roast_level="深",
        flavor_description="醇厚浓郁，带有草本和香料的气息，以及黑巧克力和焦糖的甜感，酸度极低，口感厚实。",
        image_url=None,
        rating=86,
        flavor_profile={
            "acidity": 25,
            "body": 90,
            "sweetness": 55,
            "bitterness": 65,
            "floral": 15,
            "fruity": 30,
        },
    )
    db.add(mandheling)

    db.commit()

    yirgacheffe_records = [
        (0, 200, "入豆，开始烘焙"),
        (60, 220, "脱水阶段开始"),
        (180, 250, "美拉德反应开始，闻到面包香"),
        (300, 280, "一爆前，豆色变深"),
        (360, 295, "一爆开始"),
        (420, 305, "一爆结束，发展期开始"),
        (480, 310, "浅烘目标温度"),
        (510, 312, "出锅，冷却"),
    ]
    for time_sec, temp, notes in yirgacheffe_records:
        db.add(RoastingRecord(
            cafe_menu_id=yirgacheffe.id,
            time_sec=time_sec,
            temperature=temp,
            notes=notes,
        ))

    huila_records = [
        (0, 200, "入豆，开始烘焙"),
        (90, 225, "脱水阶段"),
        (210, 255, "美拉德反应进行中"),
        (330, 285, "接近一爆"),
        (390, 300, "一爆开始"),
        (450, 310, "一爆密集期"),
        (510, 318, "一爆结束，进入二爆前"),
        (570, 325, "中烘目标温度"),
        (600, 328, "出锅，冷却"),
    ]
    for time_sec, temp, notes in huila_records:
        db.add(RoastingRecord(
            cafe_menu_id=huila.id,
            time_sec=time_sec,
            temperature=temp,
            notes=notes,
        ))

    mandheling_records = [
        (0, 200, "入豆，开始烘焙"),
        (120, 230, "脱水阶段，豆表变干"),
        (240, 260, "美拉德反应，焦糖香出现"),
        (360, 290, "一爆前"),
        (420, 305, "一爆开始"),
        (480, 315, "一爆结束"),
        (540, 325, "二爆前，油脂开始渗出"),
        (600, 335, "二爆开始"),
        (660, 345, "深烘目标温度"),
        (690, 348, "出锅，急速冷却"),
    ]
    for time_sec, temp, notes in mandheling_records:
        db.add(RoastingRecord(
            cafe_menu_id=mandheling.id,
            time_sec=time_sec,
            temperature=temp,
            notes=notes,
        ))

    db.commit()


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    db = SessionLocal()
    try:
        create_sample_data(db)
    finally:
        db.close()
