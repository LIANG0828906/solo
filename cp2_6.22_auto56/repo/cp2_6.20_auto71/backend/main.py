from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SHENG_MAP = {
    "metal": "water",
    "water": "wood",
    "wood": "fire",
    "fire": "earth",
    "earth": "metal",
}

KE_MAP = {
    "metal": "wood",
    "wood": "earth",
    "earth": "water",
    "water": "fire",
    "fire": "metal",
}

SHENG_CYCLE = SHENG_MAP
KE_CYCLE = KE_MAP

ELEMENTS = ["metal", "wood", "water", "fire", "earth"]

SHENG_PAIR_SET = set()
KE_PAIR_SET = set()

for _src in ELEMENTS:
    SHENG_PAIR_SET.add(f"{_src}->{SHENG_MAP[_src]}")
    KE_PAIR_SET.add(f"{_src}->{KE_MAP[_src]}")

ELEMENT_RELATION_CACHE = {}

for _from in ELEMENTS:
    for _to in ELEMENTS:
        ELEMENT_RELATION_CACHE[(_from, _to)] = {
            "is_sheng": f"{_from}->{_to}" in SHENG_PAIR_SET,
            "is_ke": f"{_from}->{_to}" in KE_PAIR_SET,
        }

ELEMENT_STAT = {
    "metal": "attack",
    "wood": "defense",
    "water": "speed",
    "fire": "attack",
    "earth": "defense",
}

ELEMENT_NAMES = {
    "metal": "金",
    "wood": "木",
    "water": "水",
    "fire": "火",
    "earth": "土",
}

ELEMENT_SYMBOLS = {
    "metal": "⚙",
    "wood": "🌱",
    "water": "🌊",
    "fire": "🔥",
    "earth": "⛰",
}

ELEMENT_COLORS = {
    "metal": "#c0c0c0",
    "wood": "#4caf50",
    "water": "#2196f3",
    "fire": "#f44336",
    "earth": "#ff9800",
}

VEIN_NODE_META = {}
for _el in ELEMENTS:
    VEIN_NODE_META[_el] = {
        "id": _el,
        "name": f"{ELEMENT_NAMES[_el]}灵脉",
        "symbol": ELEMENT_SYMBOLS[_el],
        "color": ELEMENT_COLORS[_el],
    }

SHENG_BONUS = 0.2
KE_PENALTY = 0.15
MAIN_MULTIPLIER = 1.5

activation_history: list[str] = []
resonation_count = 0
smelted_collection: list[dict] = []
smelt_count = 0

MOCK_ARTIFACTS = [
    {
        "id": "a1",
        "name": "玄金剑",
        "type": "sword",
        "baseElement": "metal",
        "baseStats": {"attack": 30, "defense": 10, "speed": 10},
        "icon": "⚔️",
    },
    {
        "id": "a2",
        "name": "翠木鼎",
        "type": "ding",
        "baseElement": "wood",
        "baseStats": {"attack": 10, "defense": 30, "speed": 10},
        "icon": "🏺",
    },
    {
        "id": "a3",
        "name": "赤焰幡",
        "type": "banner",
        "baseElement": "fire",
        "baseStats": {"attack": 30, "defense": 10, "speed": 10},
        "icon": "🚩",
    },
    {
        "id": "a4",
        "name": "碧水珠",
        "type": "pearl",
        "baseElement": "water",
        "baseStats": {"attack": 10, "defense": 10, "speed": 30},
        "icon": "🔮",
    },
    {
        "id": "a5",
        "name": "黄土镜",
        "type": "mirror",
        "baseElement": "earth",
        "baseStats": {"attack": 10, "defense": 30, "speed": 10},
        "icon": "🪞",
    },
    {
        "id": "a6",
        "name": "紫符",
        "type": "talisman",
        "baseElement": "fire",
        "baseStats": {"attack": 25, "defense": 15, "speed": 10},
        "icon": "📜",
    },
]

ACHIEVEMENTS = [
    {
        "id": "ach1",
        "name": "五行聚全",
        "description": "集齐全部五行",
        "icon": "🌟",
        "isUnlocked": False,
        "unlockedAt": None,
        "conditions": {"type": "collect_elements", "target": 5, "current": 0},
    },
    {
        "id": "ach2",
        "name": "共振达人",
        "description": "触发10次共振",
        "icon": "💥",
        "isUnlocked": False,
        "unlockedAt": None,
        "conditions": {"type": "resonation_count", "target": 10, "current": 0},
    },
    {
        "id": "ach3",
        "name": "祭炼大师",
        "description": "祭炼5件法器",
        "icon": "🔥",
        "isUnlocked": False,
        "unlockedAt": None,
        "conditions": {"type": "smelt_count", "target": 5, "current": 0},
    },
]


def is_sheng(from_el: str, to_el: str) -> bool:
    cached = ELEMENT_RELATION_CACHE.get((from_el, to_el))
    if cached:
        return cached["is_sheng"]
    return SHENG_MAP.get(from_el) == to_el


def is_ke(from_el: str, to_el: str) -> bool:
    cached = ELEMENT_RELATION_CACHE.get((from_el, to_el))
    if cached:
        return cached["is_ke"]
    return KE_MAP.get(from_el) == to_el


class ActivateRequest(BaseModel):
    nodeId: str
    currentStates: list


class ArtifactCalculateRequest(BaseModel):
    artifactId: str
    soulHoles: list
    resonationBoost: float


class SmeltSaveRequest(BaseModel):
    id: str
    name: str
    type: str
    icon: str
    baseElement: str
    baseStats: dict
    smeltedId: str
    soulHoles: list
    finalStats: dict
    mainElement: str
    bonuses: dict
    smeltedAt: str
    resonationBoost: float


class AchievementsCheckRequest(BaseModel):
    collection: Optional[list] = None
    resonationCount: Optional[int] = None


@app.post("/api/vein/activate")
def vein_activate(req: ActivateRequest):
    global resonation_count

    node_id = req.nodeId
    nodes: dict[str, dict] = {}

    for n in req.currentStates:
        if isinstance(n, dict):
            nid = n.get("id", n.get("nodeId", ""))
            meta = VEIN_NODE_META.get(nid, {})
            nodes[nid] = {
                "id": nid,
                "name": n.get("name", meta.get("name", f"{nid}灵脉")),
                "symbol": n.get("symbol", meta.get("symbol", nid)),
                "color": n.get("color", meta.get("color", "#888888")),
                "isActive": n.get("isActive", False),
                "energy": n.get("energy", 0),
                "energyBalance": n.get("energyBalance", {
                    "metal": 0, "wood": 0, "water": 0, "fire": 0, "earth": 0
                }),
            }
        elif isinstance(n, str):
            meta = VEIN_NODE_META.get(n, {})
            nodes[n] = {
                "id": n,
                "name": meta.get("name", f"{n}灵脉"),
                "symbol": meta.get("symbol", n),
                "color": meta.get("color", "#888888"),
                "isActive": False,
                "energy": 0,
                "energyBalance": {"metal": 0, "wood": 0, "water": 0, "fire": 0, "earth": 0},
            }

    if node_id in nodes:
        nodes[node_id]["energy"] = min(nodes[node_id]["energy"] + 10, 100)
        nodes[node_id]["isActive"] = True

    sheng_target = SHENG_MAP.get(node_id)
    if sheng_target and sheng_target in nodes:
        nodes[sheng_target]["energy"] = min(nodes[sheng_target]["energy"] + 5, 100)

    ke_target = KE_MAP.get(node_id)
    if ke_target and ke_target in nodes:
        nodes[ke_target]["energy"] = max(nodes[ke_target]["energy"] - 5, 0)

    activation_history.append(node_id)
    if len(activation_history) >= 3:
        chain_length = 1
        for i in range(len(activation_history) - 2, -1, -1):
            prev = activation_history[i]
            curr = activation_history[i + 1]
            if is_sheng(prev, curr):
                chain_length += 1
            else:
                break
        if chain_length >= 3:
            resonation_count += 1

    result = list(nodes.values())
    result.sort(key=lambda x: ELEMENTS.index(x["id"]) if x["id"] in ELEMENTS else 99)
    return result


@app.post("/api/artifact/calculate")
def artifact_calculate(req: ArtifactCalculateRequest):
    artifact = next((a for a in MOCK_ARTIFACTS if a["id"] == req.artifactId), None)
    if not artifact:
        return {"error": "Artifact not found"}

    soul_holes = [h for h in req.soulHoles if h is not None]

    element_counts: dict[str, int] = {}
    for e in soul_holes:
        element_counts[e] = element_counts.get(e, 0) + 1

    main_element = "metal"
    if element_counts:
        main_element = max(element_counts, key=element_counts.get)

    base_stats = artifact["baseStats"]
    final_stats = dict(base_stats)

    main_stat = ELEMENT_STAT.get(main_element, "attack")
    if main_stat in final_stats:
        final_stats[main_stat] = round(base_stats[main_stat] * MAIN_MULTIPLIER, 2)

    bonuses: dict[str, float] = {}
    for el in soul_holes:
        stat = ELEMENT_STAT.get(el)
        if not stat or el == main_element:
            continue

        if is_sheng(el, main_element):
            key = f"{el}_sheng_{main_element}"
            bonus = round(base_stats[stat] * SHENG_BONUS, 2)
            bonuses[key] = bonus
            final_stats[stat] = round(final_stats[stat] + bonus, 2)
        elif is_ke(el, main_element):
            key = f"{el}_ke_{main_element}"
            penalty = round(base_stats[stat] * KE_PENALTY, 2)
            bonuses[key] = -penalty
            final_stats[stat] = round(final_stats[stat] - penalty, 2)

    if req.resonationBoost > 0:
        boost_factor = 1 + req.resonationBoost / 100
        bonuses["resonationBoost"] = round(req.resonationBoost, 2)
        for key in final_stats:
            final_stats[key] = round(final_stats[key] * boost_factor, 2)

    return {"mainElement": main_element, "finalStats": final_stats, "bonuses": bonuses}


@app.get("/api/artifacts")
def get_artifacts():
    return MOCK_ARTIFACTS


@app.get("/api/artifacts/{artifact_id}")
def get_artifact(artifact_id: str):
    artifact = next((a for a in MOCK_ARTIFACTS if a["id"] == artifact_id), None)
    if not artifact:
        return {"error": "Artifact not found"}
    return artifact


@app.post("/api/smelt/save")
def smelt_save(req: SmeltSaveRequest):
    global smelt_count
    artifact_dict = req.model_dump()
    smelted_collection.append(artifact_dict)
    smelt_count += 1
    return artifact_dict


@app.get("/api/collection")
def get_collection():
    return smelted_collection


@app.get("/api/achievements")
def get_achievements():
    ACHIEVEMENTS[0]["conditions"]["current"] = len(
        set(a.get("baseElement", a.get("mainElement", "")) for a in smelted_collection)
    )
    ACHIEVEMENTS[1]["conditions"]["current"] = resonation_count
    ACHIEVEMENTS[2]["conditions"]["current"] = smelt_count
    return ACHIEVEMENTS


@app.post("/api/achievements/check")
def check_achievements(req: Optional[AchievementsCheckRequest] = None):
    newly_unlocked = []

    collected_elements = set(
        a.get("baseElement", a.get("mainElement", "")) for a in smelted_collection
    )
    ACHIEVEMENTS[0]["conditions"]["current"] = len(collected_elements)
    ACHIEVEMENTS[1]["conditions"]["current"] = resonation_count
    ACHIEVEMENTS[2]["conditions"]["current"] = smelt_count

    if len(collected_elements) >= 5 and not ACHIEVEMENTS[0]["isUnlocked"]:
        ACHIEVEMENTS[0]["isUnlocked"] = True
        ACHIEVEMENTS[0]["unlockedAt"] = _now_iso()
        newly_unlocked.append(ACHIEVEMENTS[0])

    if resonation_count >= 10 and not ACHIEVEMENTS[1]["isUnlocked"]:
        ACHIEVEMENTS[1]["isUnlocked"] = True
        ACHIEVEMENTS[1]["unlockedAt"] = _now_iso()
        newly_unlocked.append(ACHIEVEMENTS[1])

    if smelt_count >= 5 and not ACHIEVEMENTS[2]["isUnlocked"]:
        ACHIEVEMENTS[2]["isUnlocked"] = True
        ACHIEVEMENTS[2]["unlockedAt"] = _now_iso()
        newly_unlocked.append(ACHIEVEMENTS[2])

    return {"newlyUnlocked": newly_unlocked}


def _now_iso() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
