from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
import uuid
import random

from models import (
    Pet, CreatePetRequest, FeedRequest, GiftRequest, GiftResponse,
    ActionResponse, EffectResult, LevelUpResult,
    BreedInfo, ColorConfig, FoodItem, GiftItem,
    PetSpecies, FoodType, GiftType, CatBreed, DogBreed
)

app = FastAPI(title="萌宠乐园 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pets_db: Dict[str, Pet] = {}

CAT_BREEDS_DATA: Dict[str, dict] = {
    "domestic": {
        "name": "普通家猫",
        "colors": [
            {"body": "#F5A623", "ears": "#D4891C", "eyes": "#7C4D1A"},
            {"body": "#2C2C2C", "ears": "#1A1A1A", "eyes": "#FFD700"},
            {"body": "#FAFAFA", "ears": "#E0E0E0", "eyes": "#5C97BF"},
        ]
    },
    "scottish": {
        "name": "苏格兰折耳",
        "colors": [
            {"body": "#C9B8A0", "ears": "#A89070", "eyes": "#95A5A6"},
            {"body": "#F4E4C1", "ears": "#E0C88A", "eyes": "#7F8C8D"},
            {"body": "#D3B8B8", "ears": "#B89898", "eyes": "#9B59B6"},
        ]
    },
    "ragdoll": {
        "name": "布偶猫",
        "colors": [
            {"body": "#FAEBD7", "ears": "#8B7355", "eyes": "#4A90D9"},
            {"body": "#E8E8E8", "ears": "#9370DB", "eyes": "#2980B9"},
            {"body": "#FFEFD5", "ears": "#D2691E", "eyes": "#3498DB"},
        ]
    }
}

DOG_BREEDS_DATA: Dict[str, dict] = {
    "shiba": {
        "name": "柴犬",
        "colors": [
            {"body": "#E8A35A", "ears": "#C97F3A", "eyes": "#5C3317"},
            {"body": "#2C2C2C", "ears": "#1A1A1A", "eyes": "#8B4513"},
            {"body": "#F5F5DC", "ears": "#D2B48C", "eyes": "#8B4513"},
        ]
    },
    "golden": {
        "name": "金毛",
        "colors": [
            {"body": "#DAA520", "ears": "#B8860B", "eyes": "#8B4513"},
            {"body": "#F4D03F", "ears": "#D4AC0D", "eyes": "#A0522D"},
            {"body": "#CD853F", "ears": "#A0522D", "eyes": "#654321"},
        ]
    },
    "corgi": {
        "name": "柯基",
        "colors": [
            {"body": "#FAF0E6", "ears": "#CD5C5C", "eyes": "#4A2C2A"},
            {"body": "#FFE4B5", "ears": "#8B4513", "eyes": "#5C3317"},
            {"body": "#D3D3D3", "ears": "#696969", "eyes": "#2F4F4F"},
        ]
    }
}

FOODS_DATA: Dict[str, dict] = {
    "dry": {"name": "干粮", "icon": "🥣", "hungerEffect": 25, "happinessEffect": 5, "expReward": 5},
    "can": {"name": "罐头", "icon": "🥫", "hungerEffect": 40, "happinessEffect": 15, "expReward": 10},
    "snack": {"name": "零食", "icon": "🍖", "hungerEffect": 10, "happinessEffect": 25, "expReward": 8},
}

GIFTS_DATA: Dict[str, dict] = {
    "bone": {"name": "骨头", "icon": "🦴", "happinessEffect": 15, "expReward": 10},
    "yarn": {"name": "毛球", "icon": "🧶", "happinessEffect": 20, "expReward": 12},
    "fish": {"name": "小鱼干", "icon": "🐟", "happinessEffect": 25, "expReward": 15},
}

LEVEL_EXP_TABLE = [0, 50, 120, 220, 350, 520, 730, 980, 1280, 1630, 2030, 2500]

MOCK_OWNER_NAMES = ["小猫咪", "阳光男孩", "萌宠达人", "铲屎官", "糖果屋", "星星主人", "月亮公主", "咖啡猫", "小奶狗", "甜心宝宝"]
MOCK_PET_NAMES_CAT = ["咪咪", "橘子", "雪球", "豆豆", "布丁", "奶糖", "芝麻", "团子", "汤圆", "芝士"]
MOCK_PET_NAMES_DOG = ["旺财", "豆豆", "毛毛", "可乐", "布丁", "球球", "乐乐", "多多", "小白", "咖啡"]


def _breed_to_info_list(data: Dict[str, dict]) -> list[BreedInfo]:
    result = []
    for bid, bdata in data.items():
        colors = [ColorConfig(**c) for c in bdata["colors"]]
        result.append(BreedInfo(id=bid, name=bdata["name"], colors=colors))
    return result


def _clamp(v: int, lo=0, hi=100) -> int:
    return max(lo, min(hi, v))


def _compute_level_up(current_level: int, current_exp: int, gain: int) -> LevelUpResult:
    new_exp = current_exp + gain
    new_level = current_level
    while new_level < 10 and new_exp >= LEVEL_EXP_TABLE[new_level + 1]:
        new_level += 1
    leveled_up = new_level > current_level
    threshold_idx = min(new_level, len(LEVEL_EXP_TABLE) - 1)
    return LevelUpResult(
        leveledUp=leveled_up,
        newLevel=new_level,
        newExp=new_exp,
        prevExp=current_exp,
        threshold=LEVEL_EXP_TABLE[threshold_idx]
    )


def _init_mock_pets():
    breeds_cat = list(CAT_BREEDS_DATA.keys())
    breeds_dog = list(DOG_BREEDS_DATA.keys())
    for i in range(10):
        pid = f"mock-pet-{i}"
        species = random.choice(["cat", "dog"])
        if species == "cat":
            breed = random.choice(breeds_cat)
            name = random.choice(MOCK_PET_NAMES_CAT)
        else:
            breed = random.choice(breeds_dog)
            name = random.choice(MOCK_PET_NAMES_DOG)
        pets_db[pid] = Pet(
            id=pid,
            ownerId=f"mock-user-{i}",
            ownerName=MOCK_OWNER_NAMES[i % len(MOCK_OWNER_NAMES)],
            name=name,
            species=PetSpecies.cat if species == "cat" else PetSpecies.dog,
            breed=breed,
            colorScheme=random.randint(0, 2),
            level=random.randint(1, 8),
            exp=random.randint(0, 500),
            hunger=random.randint(30, 100),
            happiness=random.randint(30, 100),
            cleanliness=random.randint(30, 100),
            energy=random.randint(30, 100),
        )


_init_mock_pets()


@app.get("/api/pets/breeds")
def get_breeds():
    return {
        "cats": _breed_to_info_list(CAT_BREEDS_DATA),
        "dogs": _breed_to_info_list(DOG_BREEDS_DATA),
    }


@app.get("/api/pets/foods", response_model=list[FoodItem])
def get_foods():
    return [FoodItem(type=k, **v) for k, v in FOODS_DATA.items()]


@app.get("/api/pets/gifts", response_model=list[GiftItem])
def get_gifts():
    return [GiftItem(type=k, **v) for k, v in GIFTS_DATA.items()]


@app.post("/api/pets/create", response_model=Pet)
def create_pet(req: CreatePetRequest):
    pet_id = str(uuid.uuid4())
    owner_id = str(uuid.uuid4())
    pet = Pet(
        id=pet_id,
        ownerId=owner_id,
        ownerName=req.ownerName,
        name=req.name,
        species=req.species,
        breed=req.breed,
        colorScheme=req.colorScheme,
        level=1,
        exp=0,
        hunger=80,
        happiness=80,
        cleanliness=80,
        energy=80,
    )
    pets_db[pet_id] = pet
    return pet


@app.get("/api/pets/{pet_id}", response_model=Pet)
def get_pet(pet_id: str):
    if pet_id not in pets_db:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pets_db[pet_id]


@app.put("/api/pets/{pet_id}/feed", response_model=ActionResponse)
def feed_pet(pet_id: str, req: FeedRequest):
    if pet_id not in pets_db:
        raise HTTPException(status_code=404, detail="Pet not found")
    pet = pets_db[pet_id]
    food = FOODS_DATA[req.foodType.value]
    hunger_gain = food["hungerEffect"]
    happy_gain = food["happinessEffect"]
    exp_gain = food["expReward"]
    pet.hunger = _clamp(pet.hunger + hunger_gain)
    pet.happiness = _clamp(pet.happiness + happy_gain)
    lu = _compute_level_up(pet.level, pet.exp, exp_gain)
    pet.level = lu.newLevel
    pet.exp = lu.newExp
    return ActionResponse(
        pet=pet,
        effects=EffectResult(hunger=hunger_gain, happiness=happy_gain, exp=exp_gain)
    )


@app.put("/api/pets/{pet_id}/play", response_model=ActionResponse)
def play_pet(pet_id: str):
    if pet_id not in pets_db:
        raise HTTPException(status_code=404, detail="Pet not found")
    pet = pets_db[pet_id]
    happy_gain = 20
    energy_loss = -15
    exp_gain = 12
    pet.happiness = _clamp(pet.happiness + happy_gain)
    pet.energy = _clamp(pet.energy + energy_loss)
    lu = _compute_level_up(pet.level, pet.exp, exp_gain)
    pet.level = lu.newLevel
    pet.exp = lu.newExp
    return ActionResponse(
        pet=pet,
        effects=EffectResult(happiness=happy_gain, energy=energy_loss, exp=exp_gain)
    )


@app.put("/api/pets/{pet_id}/clean", response_model=ActionResponse)
def clean_pet(pet_id: str):
    if pet_id not in pets_db:
        raise HTTPException(status_code=404, detail="Pet not found")
    pet = pets_db[pet_id]
    clean_gain = 30
    exp_gain = 6
    pet.cleanliness = _clamp(pet.cleanliness + clean_gain)
    lu = _compute_level_up(pet.level, pet.exp, exp_gain)
    pet.level = lu.newLevel
    pet.exp = lu.newExp
    return ActionResponse(
        pet=pet,
        effects=EffectResult(cleanliness=clean_gain, exp=exp_gain)
    )


@app.put("/api/pets/{pet_id}/rest", response_model=ActionResponse)
def rest_pet(pet_id: str):
    if pet_id not in pets_db:
        raise HTTPException(status_code=404, detail="Pet not found")
    pet = pets_db[pet_id]
    energy_gain = 40
    pet.energy = _clamp(pet.energy + energy_gain)
    return ActionResponse(
        pet=pet,
        effects=EffectResult(energy=energy_gain)
    )


@app.get("/api/exp/levelup", response_model=LevelUpResult)
def check_level_up(
    currentLevel: int = Query(..., ge=1, le=10),
    currentExp: int = Query(..., ge=0),
    gain: int = Query(..., ge=0)
):
    return _compute_level_up(currentLevel, currentExp, gain)


@app.get("/api/social/pets", response_model=list[Pet])
def get_social_pets():
    mocks = [p for p in pets_db.values() if p.id.startswith("mock-pet-")]
    return mocks


@app.post("/api/social/gift", response_model=GiftResponse)
def send_gift(req: GiftRequest):
    sender = pets_db.get(req.fromPetId)
    receiver = pets_db.get(req.toPetId)
    if not sender:
        raise HTTPException(status_code=404, detail="Sender pet not found")
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver pet not found")
    gift = GIFTS_DATA[req.giftType.value]
    happy_gain = gift["happinessEffect"]
    exp_gain = gift["expReward"]
    receiver.happiness = _clamp(receiver.happiness + happy_gain)
    lu = _compute_level_up(sender.level, sender.exp, exp_gain)
    sender.level = lu.newLevel
    sender.exp = lu.newExp
    return GiftResponse(
        success=True,
        senderExpGain=exp_gain,
        receiverHappinessGain=happy_gain,
        message=f"成功送出{gift['name']}给{receiver.name}！"
    )
