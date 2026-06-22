from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import random
import math

app = FastAPI(title="TRPG Dungeon API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Attributes(BaseModel):
    strength: int
    dexterity: int
    constitution: int
    intelligence: int
    wisdom: int
    charisma: int


class Item(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    type: str
    slot: Optional[str] = None
    attributes: Optional[Dict[str, int]] = None
    effects: Optional[Dict[str, int]] = None
    quantity: Optional[int] = None


class Equipment(BaseModel):
    head: Optional[Item] = None
    body: Optional[Item] = None
    weapon: Optional[Item] = None
    ring: Optional[Item] = None


class Character(BaseModel):
    id: str
    name: str
    characterClass: str
    level: int
    experience: int
    experienceToNext: int
    attributes: Attributes
    baseAttributes: Attributes
    maxHealth: int
    currentHealth: int
    maxMana: int
    currentMana: int
    skillPoints: int
    skills: List[str]
    equipment: Equipment
    inventory: List[Item]
    gold: int
    avatarColor: str
    avatarShape: str


class DiceResult(BaseModel):
    value: int
    modifier: int
    total: int
    success: bool
    dc: int


class EventOption(BaseModel):
    id: str
    text: str
    requiredCheck: Optional[Dict[str, Any]] = None
    result: Dict[str, Any]


class GameEvent(BaseModel):
    id: str
    type: str
    title: str
    description: str
    options: List[EventOption]


class DungeonCell(BaseModel):
    x: int
    y: int
    type: str
    status: str
    eventId: Optional[str] = None
    cleared: bool


class DungeonMap(BaseModel):
    width: int
    height: int
    cells: List[List[DungeonCell]]
    playerPosition: Dict[str, int]
    floor: int


class Enemy(BaseModel):
    id: str
    name: str
    maxHealth: int
    currentHealth: int
    damage: int
    defense: int
    experienceReward: int
    lootTable: List[Dict[str, Any]]
    icon: str


characters_db: Dict[str, Character] = {}
dungeons_db: Dict[str, DungeonMap] = {}

CLASS_DATA = {
    "warrior": {
        "name": "战士",
        "description": "精通近战格斗的勇士，拥有高生命值和防御力。",
        "baseAttributes": {
            "strength": 16,
            "dexterity": 12,
            "constitution": 14,
            "intelligence": 8,
            "wisdom": 10,
            "charisma": 10,
        },
        "baseHealth": 120,
        "baseMana": 20,
        "icon": "⚔️",
    },
    "mage": {
        "name": "法师",
        "description": "掌握奥术魔法的使用者，拥有强大的法术伤害但体质较弱。",
        "baseAttributes": {
            "strength": 8,
            "dexterity": 12,
            "constitution": 10,
            "intelligence": 16,
            "wisdom": 14,
            "charisma": 10,
        },
        "baseHealth": 60,
        "baseMana": 100,
        "icon": "🔮",
    },
    "rogue": {
        "name": "盗贼",
        "description": "敏捷的暗影行者，擅长潜行和暴击。",
        "baseAttributes": {
            "strength": 10,
            "dexterity": 16,
            "constitution": 12,
            "intelligence": 12,
            "wisdom": 10,
            "charisma": 10,
        },
        "baseHealth": 80,
        "baseMana": 40,
        "icon": "🗡️",
    },
    "cleric": {
        "name": "牧师",
        "description": "神圣力量的信徒，能够治疗和祝福队友。",
        "baseAttributes": {
            "strength": 12,
            "dexterity": 10,
            "constitution": 12,
            "intelligence": 10,
            "wisdom": 16,
            "charisma": 10,
        },
        "baseHealth": 90,
        "baseMana": 80,
        "icon": "✨",
    },
}

ENEMY_TEMPLATES = [
    {
        "name": "哥布林",
        "maxHealth": 30,
        "damage": 6,
        "defense": 2,
        "experienceReward": 20,
        "lootTable": [
            {"itemId": "health-potion-1", "chance": 0.3},
            {"itemId": "gold-sack-small", "chance": 0.5},
        ],
        "icon": "👺",
    },
    {
        "name": "骷髅兵",
        "maxHealth": 40,
        "damage": 8,
        "defense": 3,
        "experienceReward": 30,
        "lootTable": [
            {"itemId": "mana-potion-1", "chance": 0.2},
            {"itemId": "gold-sack-small", "chance": 0.6},
        ],
        "icon": "💀",
    },
    {
        "name": "巨型蜘蛛",
        "maxHealth": 25,
        "damage": 10,
        "defense": 1,
        "experienceReward": 25,
        "lootTable": [
            {"itemId": "spider-silk", "chance": 0.4},
            {"itemId": "gold-sack-small", "chance": 0.3},
        ],
        "icon": "🕷️",
    },
    {
        "name": "兽人战士",
        "maxHealth": 60,
        "damage": 12,
        "defense": 5,
        "experienceReward": 50,
        "lootTable": [
            {"itemId": "health-potion-1", "chance": 0.4},
            {"itemId": "gold-sack-medium", "chance": 0.5},
        ],
        "icon": "👹",
    },
    {
        "name": "暗影刺客",
        "maxHealth": 45,
        "damage": 15,
        "defense": 2,
        "experienceReward": 60,
        "lootTable": [
            {"itemId": "dagger-sharp", "chance": 0.2},
            {"itemId": "gold-sack-medium", "chance": 0.6},
        ],
        "icon": "🥷",
    },
]

LOOT_ITEMS = {
    "health-potion-1": {
        "id": "health-potion-1",
        "name": "小型生命药水",
        "description": "恢复30点生命值。",
        "icon": "🧪",
        "type": "consumable",
        "effects": {"health": 30},
    },
    "mana-potion-1": {
        "id": "mana-potion-1",
        "name": "小型法力药水",
        "description": "恢复20点法力值。",
        "icon": "💧",
        "type": "consumable",
        "effects": {"mana": 20},
    },
    "gold-sack-small": {
        "id": "gold-sack-small",
        "name": "小袋金币",
        "description": "装有10-30枚金币。",
        "icon": "💰",
        "type": "misc",
    },
    "gold-sack-medium": {
        "id": "gold-sack-medium",
        "name": "中袋金币",
        "description": "装有30-60枚金币。",
        "icon": "💰",
        "type": "misc",
    },
    "gold-sack-large": {
        "id": "gold-sack-large",
        "name": "大袋金币",
        "description": "装有80-150枚金币。",
        "icon": "💰",
        "type": "misc",
    },
    "spider-silk": {
        "id": "spider-silk",
        "name": "蜘蛛丝",
        "description": "坚韧的蜘蛛丝。",
        "icon": "🕸️",
        "type": "misc",
    },
    "dagger-sharp": {
        "id": "dagger-sharp",
        "name": "锋利匕首",
        "description": "一把锋利的匕首。",
        "icon": "🗡️",
        "type": "weapon",
        "slot": "weapon",
        "attributes": {"dexterity": 3},
        "effects": {"damage": 8},
    },
    "iron-helmet": {
        "id": "iron-helmet",
        "name": "铁头盔",
        "description": "坚固的铁制头盔。",
        "icon": "⛑️",
        "type": "armor",
        "slot": "head",
        "attributes": {"constitution": 2},
        "effects": {"defense": 4},
    },
    "ring-of-power": {
        "id": "ring-of-power",
        "name": "力量之戒",
        "description": "增加力量的魔法戒指。",
        "icon": "💍",
        "type": "accessory",
        "slot": "ring",
        "attributes": {"strength": 3},
    },
}

STARTER_ITEMS = [
    {
        "id": "starter-sword",
        "name": "铁剑",
        "description": "一把普通的铁剑。",
        "icon": "⚔️",
        "type": "weapon",
        "slot": "weapon",
        "attributes": {"strength": 2},
        "effects": {"damage": 5},
    },
    {
        "id": "starter-armor",
        "name": "皮甲",
        "description": "轻便的皮制护甲。",
        "icon": "🛡️",
        "type": "armor",
        "slot": "body",
        "attributes": {"constitution": 1},
        "effects": {"defense": 3},
    },
]


def roll_d20() -> int:
    return random.randint(1, 20)


def roll_d6() -> int:
    return random.randint(1, 6)


def roll_4d6_drop_lowest() -> int:
    rolls = [roll_d6() for _ in range(4)]
    rolls.sort()
    return sum(rolls[1:])


def get_attribute_modifier(value: int) -> int:
    return math.floor((value - 10) / 2)


def roll_all_attributes() -> Dict[str, int]:
    return {
        "strength": roll_4d6_drop_lowest(),
        "dexterity": roll_4d6_drop_lowest(),
        "constitution": roll_4d6_drop_lowest(),
        "intelligence": roll_4d6_drop_lowest(),
        "wisdom": roll_4d6_drop_lowest(),
        "charisma": roll_4d6_drop_lowest(),
    }


@app.get("/")
async def root():
    return {"message": "TRPG Dungeon API", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/dice/roll")
async def roll_dice(attribute_value: int, dc: int):
    roll = roll_d20()
    modifier = get_attribute_modifier(attribute_value)
    total = roll + modifier
    return {
        "value": roll,
        "modifier": modifier,
        "total": total,
        "success": total >= dc,
        "dc": dc,
    }


@app.get("/api/dice/attributes")
async def get_random_attributes():
    return roll_all_attributes()


@app.get("/api/classes")
async def get_classes():
    return CLASS_DATA


@app.post("/api/characters")
async def create_character(character_data: Dict[str, Any]):
    char_id = str(uuid.uuid4())
    char_class = character_data.get("characterClass", character_data.get("class", "warrior"))
    class_data = CLASS_DATA.get(char_class, CLASS_DATA["warrior"])

    base_attrs = character_data.get("attributes", class_data["baseAttributes"])
    base_attrs_obj = Attributes(**base_attrs)

    inventory = []
    for item in STARTER_ITEMS:
        inventory.append(Item(**{**item, "id": f"{item['id']}-{uuid.uuid4().hex[:8]}"}))

    health_potion = Item(
        id=f"health-potion-{uuid.uuid4().hex[:8]}",
        name="小型生命药水",
        description="恢复30点生命值。",
        icon="🧪",
        type="consumable",
        effects={"health": 30},
        quantity=3,
    )
    mana_potion = Item(
        id=f"mana-potion-{uuid.uuid4().hex[:8]}",
        name="小型法力药水",
        description="恢复20点法力值。",
        icon="💧",
        type="consumable",
        effects={"mana": 20},
        quantity=2,
    )
    inventory.extend([health_potion, mana_potion])

    equipment = Equipment()

    character = Character(
        id=char_id,
        name=character_data.get("name", "冒险者"),
        characterClass=char_class,
        level=1,
        experience=0,
        experienceToNext=100,
        attributes=base_attrs_obj,
        baseAttributes=base_attrs_obj,
        maxHealth=class_data["baseHealth"],
        currentHealth=class_data["baseHealth"],
        maxMana=class_data["baseMana"],
        currentMana=class_data["baseMana"],
        skillPoints=0,
        skills=[],
        equipment=equipment,
        inventory=inventory,
        gold=50,
        avatarColor=character_data.get("avatarColor", "#e74c3c"),
        avatarShape=character_data.get("avatarShape", "circle"),
    )

    characters_db[char_id] = character
    return character


@app.get("/api/characters/{char_id}")
async def get_character(char_id: str):
    if char_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    return characters_db[char_id]


@app.put("/api/characters/{char_id}")
async def update_character(char_id: str, character_data: Dict[str, Any]):
    if char_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")

    existing = characters_db[char_id]
    update_data = character_data.copy()

    if "attributes" in update_data:
        update_data["attributes"] = Attributes(**update_data["attributes"])
    if "baseAttributes" in update_data:
        update_data["baseAttributes"] = Attributes(**update_data["baseAttributes"])
    if "equipment" in update_data:
        update_data["equipment"] = Equipment(**update_data["equipment"])
    if "inventory" in update_data:
        update_data["inventory"] = [Item(**item) for item in update_data["inventory"]]
    if "class" in update_data and "characterClass" not in update_data:
        update_data["characterClass"] = update_data.pop("class")

    updated = existing.model_copy(update=update_data)
    characters_db[char_id] = updated
    return updated


@app.delete("/api/characters/{char_id}")
async def delete_character(char_id: str):
    if char_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")
    del characters_db[char_id]
    return {"message": "Character deleted successfully"}


@app.post("/api/dungeon/generate")
async def generate_dungeon(width: int = 5, height: int = 5, floor: int = 1):
    dungeon_id = str(uuid.uuid4())
    cells = []

    for y in range(height):
        row = []
        for x in range(width):
            cell_type = "empty"
            rand = random.random()

            if x == 0 and y == height - 1:
                cell_type = "entrance"
            elif x == width - 1 and y == 0:
                cell_type = "boss"
            elif rand < 0.2:
                cell_type = "monster"
            elif rand < 0.3:
                cell_type = "treasure"
            elif rand < 0.4:
                cell_type = "trap"
            elif rand < 0.45:
                cell_type = "npc"

            status = "visited" if (x == 0 and y == height - 1) else "hidden"
            event_id = str(uuid.uuid4()) if cell_type not in ["empty", "entrance"] else None

            row.append(
                DungeonCell(
                    x=x,
                    y=y,
                    type=cell_type,
                    status=status,
                    eventId=event_id,
                    cleared=False,
                )
            )
        cells.append(row)

    for dy in range(-1, 2):
        for dx in range(-1, 2):
            nx = dx
            ny = height - 1 + dy
            if 0 <= nx < width and 0 <= ny < height:
                cells[ny][nx].status = "revealed"

    dungeon = DungeonMap(
        width=width,
        height=height,
        cells=cells,
        playerPosition={"x": 0, "y": height - 1},
        floor=floor,
    )

    dungeons_db[dungeon_id] = dungeon
    return {"dungeonId": dungeon_id, "dungeon": dungeon}


@app.get("/api/dungeon/{dungeon_id}")
async def get_dungeon(dungeon_id: str):
    if dungeon_id not in dungeons_db:
        raise HTTPException(status_code=404, detail="Dungeon not found")
    return dungeons_db[dungeon_id]


@app.post("/api/dungeon/{dungeon_id}/move")
async def move_player(dungeon_id: str, x: int, y: int):
    if dungeon_id not in dungeons_db:
        raise HTTPException(status_code=404, detail="Dungeon not found")

    dungeon = dungeons_db[dungeon_id]
    px = dungeon.playerPosition["x"]
    py = dungeon.playerPosition["y"]

    dx = abs(px - x)
    dy = abs(py - y)
    if dx + dy != 1:
        raise HTTPException(status_code=400, detail="Can only move to adjacent cells")

    if x < 0 or x >= dungeon.width or y < 0 or y >= dungeon.height:
        raise HTTPException(status_code=400, detail="Out of bounds")

    cells = []
    for row in dungeon.cells:
        new_row = []
        for cell in row:
            new_cell = cell.model_copy()
            if new_cell.x == x and new_cell.y == y:
                new_cell.status = "visited"
            cx = abs(new_cell.x - x)
            cy = abs(new_cell.y - y)
            if cx <= 1 and cy <= 1 and new_cell.status == "hidden":
                new_cell.status = "revealed"
            new_row.append(new_cell)
        cells.append(new_row)

    dungeon.cells = cells
    dungeon.playerPosition = {"x": x, "y": y}
    dungeons_db[dungeon_id] = dungeon

    return dungeon


@app.get("/api/dungeon/{dungeon_id}/event/{cell_x}/{cell_y}")
async def get_cell_event(dungeon_id: str, cell_x: int, cell_y: int):
    if dungeon_id not in dungeons_db:
        raise HTTPException(status_code=404, detail="Dungeon not found")

    dungeon = dungeons_db[dungeon_id]
    cell = dungeon.cells[cell_y][cell_x]

    if cell.cleared and cell.type not in ["entrance", "exit"]:
        return None

    event = generate_event(cell)
    return event


def generate_event(cell: DungeonCell) -> Optional[GameEvent]:
    if cell.type == "treasure":
        return generate_treasure_event(cell)
    elif cell.type == "trap":
        return generate_trap_event(cell)
    elif cell.type == "monster":
        return generate_monster_event(cell)
    elif cell.type == "npc":
        return generate_npc_event(cell)
    elif cell.type == "boss":
        return generate_boss_event(cell)
    elif cell.type == "entrance":
        return GameEvent(
            id=cell.eventId or "entrance",
            type="npc",
            title="地牢入口",
            description="你站在地牢的入口处，潮湿的空气中弥漫着危险的气息。前方的道路充满未知...",
            options=[
                EventOption(
                    id="enter",
                    text="继续探索",
                    result={"success": True, "message": "你深吸一口气，踏入了地牢深处。"},
                )
            ],
        )
    return None


def generate_treasure_event(cell: DungeonCell) -> GameEvent:
    gold_amount = random.randint(20, 70)
    has_item = random.random() > 0.5

    items = []
    if has_item:
        potion = {**LOOT_ITEMS["health-potion-1"], "id": f"potion-{uuid.uuid4().hex[:8]}"}
        items.append(potion)

    options = [
        EventOption(
            id="open_lockpick",
            text="尝试撬锁 (敏捷检定 DC12)",
            requiredCheck={"attribute": "dexterity", "dc": 12},
            result={
                "success": True,
                "message": "你巧妙地打开了宝箱！",
                "goldChange": gold_amount,
                "experienceChange": 15,
                "items": items if has_item else None,
            },
        ),
        EventOption(
            id="smash",
            text="强行砸开",
            result={
                "success": True,
                "message": "你用蛮力砸开了宝箱，但里面的东西有些损坏...",
                "goldChange": int(gold_amount * 0.7),
            },
        ),
        EventOption(
            id="leave",
            text="离开",
            result={"success": False, "message": "你决定不冒险，离开了宝箱。"},
        ),
    ]

    return GameEvent(
        id=cell.eventId or f"treasure-{uuid.uuid4()}",
        type="treasure",
        title="发现宝箱！",
        description="你发现了一个布满灰尘的古老宝箱，锁看起来有些生锈...",
        options=options,
    )


def generate_trap_event(cell: DungeonCell) -> GameEvent:
    damage = random.randint(10, 25)

    options = [
        EventOption(
            id="dodge",
            text="快速闪躲 (敏捷检定 DC14)",
            requiredCheck={"attribute": "dexterity", "dc": 14},
            result={
                "success": True,
                "message": "你灵巧地躲开了陷阱！",
                "experienceChange": 10,
            },
        ),
        EventOption(
            id="block",
            text="用盾牌格挡 (体质检定 DC16)",
            requiredCheck={"attribute": "constitution", "dc": 16},
            result={
                "success": True,
                "message": "你用手臂挡住了大部分伤害！",
                "healthChange": -int(damage * 0.3),
                "experienceChange": 10,
            },
        ),
        EventOption(
            id="take_hit",
            text="硬抗伤害",
            result={"success": False, "message": "你被陷阱击中了！", "healthChange": -damage},
        ),
    ]

    return GameEvent(
        id=cell.eventId or f"trap-{uuid.uuid4()}",
        type="trap",
        title="陷阱！",
        description="地面突然塌陷，飞镖从墙壁中射出！你必须快速做出反应！",
        options=options,
    )


def generate_monster_event(cell: DungeonCell) -> GameEvent:
    template = random.choice(ENEMY_TEMPLATES)
    enemy = Enemy(
        id=f"enemy-{uuid.uuid4().hex[:8]}",
        name=template["name"],
        maxHealth=template["maxHealth"],
        currentHealth=template["maxHealth"],
        damage=template["damage"],
        defense=template["defense"],
        experienceReward=template["experienceReward"],
        lootTable=template["lootTable"],
        icon=template["icon"],
    )

    options = [
        EventOption(
            id="fight",
            text="⚔️ 战斗！",
            result={
                "success": True,
                "message": "战斗开始！",
                "triggerCombat": True,
                "enemy": enemy.model_dump(),
            },
        ),
        EventOption(
            id="flee",
            text="🏃 尝试逃跑 (敏捷检定 DC13)",
            requiredCheck={"attribute": "dexterity", "dc": 13},
            result={"success": True, "message": "你成功逃脱了！"},
        ),
    ]

    return GameEvent(
        id=cell.eventId or f"monster-{uuid.uuid4()}",
        type="monster",
        title="遭遇敌人！",
        description=f"一只{enemy.name}从阴影中跳了出来，挡住了你的去路！",
        options=options,
    )


def generate_npc_event(cell: DungeonCell) -> GameEvent:
    events = [
        {
            "title": "神秘商人",
            "description": "一位披着斗篷的神秘商人出现在你面前，他似乎有一些有趣的东西...",
            "options": [
                {
                    "id": "buy_potion",
                    "text": "购买生命药水 (30金币)",
                    "result": {
                        "success": True,
                        "message": "你购买了一瓶生命药水！",
                        "goldChange": -30,
                        "items": [
                            {
                                **LOOT_ITEMS["health-potion-1"],
                                "id": f"potion-{uuid.uuid4().hex[:8]}",
                            }
                        ],
                    },
                },
                {
                    "id": "buy_ring",
                    "text": "购买力量之戒 (80金币)",
                    "result": {
                        "success": True,
                        "message": "你获得了力量之戒！",
                        "goldChange": -80,
                        "items": [
                            {
                                **LOOT_ITEMS["ring-of-power"],
                                "id": f"ring-{uuid.uuid4().hex[:8]}",
                            }
                        ],
                    },
                },
                {"id": "leave", "text": "离开", "result": {"success": False, "message": "你礼貌地告别了商人。"}},
            ],
        },
        {
            "title": "治愈之泉",
            "description": "你发现了一处散发着淡淡光芒的泉水，似乎有治愈的效果...",
            "options": [
                {
                    "id": "drink",
                    "text": "饮用泉水",
                    "result": {
                        "success": True,
                        "message": "温暖的能量流遍全身，你感到精神焕发！",
                        "healthChange": 50,
                        "manaChange": 30,
                        "experienceChange": 5,
                    },
                },
                {
                    "id": "bottle",
                    "text": "装瓶带走",
                    "result": {
                        "success": True,
                        "message": "你装了一些泉水带走。",
                        "items": [
                            {
                                **LOOT_ITEMS["health-potion-1"],
                                "id": f"potion-{uuid.uuid4().hex[:8]}",
                                "name": "泉水瓶",
                                "description": "装着治愈泉水的瓶子。",
                            }
                        ],
                    },
                },
            ],
        },
        {
            "title": "神秘祭坛",
            "description": "一座古老的祭坛矗立在房间中央，上面刻着奇怪的符文...",
            "options": [
                {
                    "id": "pray",
                    "text": "虔诚祈祷 (感知检定 DC15)",
                    "requiredCheck": {"attribute": "wisdom", "dc": 15},
                    "result": {
                        "success": True,
                        "message": "神圣的力量降临于你！",
                        "experienceChange": 30,
                        "healthChange": 30,
                    },
                },
                {
                    "id": "sacrifice",
                    "text": "献上金币 (50金币)",
                    "result": {
                        "success": True,
                        "message": "祭坛接受了你的供奉，你感到力量在增长。",
                        "goldChange": -50,
                        "items": [
                            {
                                **LOOT_ITEMS["iron-helmet"],
                                "id": f"helmet-{uuid.uuid4().hex[:8]}",
                            }
                        ],
                    },
                },
                {"id": "leave", "text": "离开", "result": {"success": False, "message": "你决定不打扰这座古老的祭坛。"}},
            ],
        },
    ]

    event = random.choice(events)
    options = [
        EventOption(
            id=f"{opt['id']}-{uuid.uuid4().hex[:6]}",
            text=opt["text"],
            requiredCheck=opt.get("requiredCheck"),
            result=opt["result"],
        )
        for opt in event["options"]
    ]

    return GameEvent(
        id=cell.eventId or f"npc-{uuid.uuid4()}",
        type="npc",
        title=event["title"],
        description=event["description"],
        options=options,
    )


def generate_boss_event(cell: DungeonCell) -> GameEvent:
    enemy = Enemy(
        id=f"boss-{uuid.uuid4().hex[:8]}",
        name="地牢守护者",
        maxHealth=200,
        currentHealth=200,
        damage=20,
        defense=8,
        experienceReward=200,
        lootTable=[
            {"itemId": "gold-sack-large", "chance": 1.0},
            {"itemId": "ring-of-power", "chance": 0.5},
        ],
        icon="👑",
    )

    return GameEvent(
        id=cell.eventId or f"boss-{uuid.uuid4()}",
        type="monster",
        title="地牢守护者！",
        description="一位强大的地牢守护者挡在出口前，它的眼中闪烁着危险的光芒。这是一场生死之战！",
        options=[
            EventOption(
                id="fight_boss",
                text="⚔️ 挑战守护者！",
                result={
                    "success": True,
                    "message": "Boss战开始！",
                    "triggerCombat": True,
                    "enemy": enemy.model_dump(),
                },
            )
        ],
    )


@app.post("/api/combat/player-attack")
async def player_attack(character_id: str, enemy: Dict[str, Any]):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")

    char = characters_db[character_id]
    str_mod = get_attribute_modifier(char.attributes.strength)
    attack_modifier = str_mod + char.level
    dice_roll = roll_d20()
    total = dice_roll + attack_modifier
    critical = dice_roll == 20
    hit = critical or total >= enemy.get("defense", 10) + 10

    base_damage = 10
    if char.equipment.weapon and char.equipment.weapon.effects:
        base_damage = char.equipment.weapon.effects.get("damage", 10)

    damage = 0
    if hit:
        damage = base_damage + str_mod
        if critical:
            damage = int(damage * 2)

    return {
        "diceRoll": dice_roll,
        "attackModifier": attack_modifier,
        "total": total,
        "hit": hit,
        "damage": damage,
        "critical": critical,
    }


@app.post("/api/combat/enemy-attack")
async def enemy_attack(character_id: str, enemy: Dict[str, Any], defending: bool = False):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")

    char = characters_db[character_id]
    dice_roll = roll_d20()
    attack_modifier = enemy.get("damage", 10) - 5
    total = dice_roll + attack_modifier
    critical = dice_roll == 20

    dex_mod = get_attribute_modifier(char.attributes.dexterity)
    armor_bonus = 0
    if char.equipment.body and char.equipment.body.effects:
        armor_bonus = char.equipment.body.effects.get("defense", 0)
    ac = 10 + dex_mod + armor_bonus

    hit = critical or total >= ac

    damage = 0
    if hit:
        defense = 0
        if char.equipment.body and char.equipment.body.effects:
            defense = char.equipment.body.effects.get("defense", 0)
        damage = max(1, enemy.get("damage", 10) - defense)
        if defending:
            damage = max(1, int(damage * 0.5))
        if critical:
            damage = int(damage * 1.5)

    return {
        "diceRoll": dice_roll,
        "attackModifier": attack_modifier,
        "total": total,
        "hit": hit,
        "damage": damage,
        "critical": critical,
    }


@app.post("/api/combat/rewards")
async def calculate_rewards(enemy: Dict[str, Any]):
    experience = enemy.get("experienceReward", 0)
    gold = random.randint(10, 30)
    items = []

    loot_table = enemy.get("lootTable", [])
    for loot in loot_table:
        if random.random() < loot.get("chance", 0):
            item_id = loot.get("itemId")
            if item_id and item_id in LOOT_ITEMS:
                item = {**LOOT_ITEMS[item_id], "id": f"{item_id}-{uuid.uuid4().hex[:8]}"}
                items.append(item)

    return {"experience": experience, "gold": gold, "items": items}


@app.post("/api/event/resolve")
async def resolve_event(option_id: str, character_id: str, event: Dict[str, Any]):
    if character_id not in characters_db:
        raise HTTPException(status_code=404, detail="Character not found")

    char = characters_db[character_id]
    options = event.get("options", [])
    selected_option = None

    for opt in options:
        if opt.get("id") == option_id:
            selected_option = opt
            break

    if not selected_option:
        raise HTTPException(status_code=404, detail="Option not found")

    result = selected_option.get("result", {}).copy()
    required_check = selected_option.get("requiredCheck")

    if required_check:
        attr_name = required_check.get("attribute")
        dc = required_check.get("dc", 10)
        attr_value = getattr(char.attributes, attr_name, 10)

        roll = roll_d20()
        modifier = get_attribute_modifier(attr_value)
        total = roll + modifier
        success = total >= dc

        result["diceRoll"] = roll
        result["modifier"] = modifier
        result["total"] = total
        result["dc"] = dc
        result["checkSuccess"] = success

        if not success:
            result["success"] = False
            result["message"] = "检定失败！" + result.get("message", "")

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
