from pydantic import BaseModel
from typing import Optional
from enum import Enum


class PetSpecies(str, Enum):
    cat = "cat"
    dog = "dog"


class CatBreed(str, Enum):
    domestic = "domestic"
    scottish = "scottish"
    ragdoll = "ragdoll"


class DogBreed(str, Enum):
    shiba = "shiba"
    golden = "golden"
    corgi = "corgi"


class FoodType(str, Enum):
    dry = "dry"
    can = "can"
    snack = "snack"


class GiftType(str, Enum):
    bone = "bone"
    yarn = "yarn"
    fish = "fish"


class ColorConfig(BaseModel):
    body: str
    ears: str
    eyes: str


class BreedInfo(BaseModel):
    id: str
    name: str
    colors: list[ColorConfig]


class FoodItem(BaseModel):
    type: FoodType
    name: str
    icon: str
    hungerEffect: int
    happinessEffect: int
    expReward: int


class GiftItem(BaseModel):
    type: GiftType
    name: str
    icon: str
    happinessEffect: int
    expReward: int


class Pet(BaseModel):
    id: str
    ownerId: str
    ownerName: str
    name: str
    species: PetSpecies
    breed: str
    colorScheme: int
    level: int
    exp: int
    hunger: int
    happiness: int
    cleanliness: int
    energy: int


class CreatePetRequest(BaseModel):
    ownerName: str
    species: PetSpecies
    breed: str
    colorScheme: int
    name: str


class FeedRequest(BaseModel):
    foodType: FoodType


class EffectResult(BaseModel):
    hunger: Optional[int] = None
    happiness: Optional[int] = None
    cleanliness: Optional[int] = None
    energy: Optional[int] = None
    exp: int


class ActionResponse(BaseModel):
    pet: Pet
    effects: EffectResult


class LevelUpResult(BaseModel):
    leveledUp: bool
    newLevel: int
    newExp: int
    prevExp: int
    threshold: int


class GiftRequest(BaseModel):
    fromPetId: str
    toPetId: str
    giftType: GiftType


class GiftResponse(BaseModel):
    success: bool
    senderExpGain: int
    receiverHappinessGain: int
    message: str
