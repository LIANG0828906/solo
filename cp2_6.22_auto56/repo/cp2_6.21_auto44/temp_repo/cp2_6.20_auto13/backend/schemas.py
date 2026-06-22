from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class IngredientCreate(BaseModel):
    name: str
    amount: float
    unit: str = ""
    order_index: int = 0


class IngredientOut(BaseModel):
    id: str
    recipe_id: str
    name: str
    amount: float
    unit: str
    order_index: int
    model_config = ConfigDict(from_attributes=True)


class StepCreate(BaseModel):
    title: str = ""
    content: str = ""
    images: list[str] = []
    timer_seconds: int = 0
    order_index: int = 0


class StepOut(BaseModel):
    id: str
    recipe_id: str
    title: str
    content: str
    images: list[str] = []
    timer_seconds: int
    order_index: int


class RecipeCreate(BaseModel):
    title: str
    description: str = ""
    thumbnail: str = ""
    images: list[str] = []
    prep_time: int = 0
    cook_time: int = 0
    difficulty: str = "medium"
    ingredients: list[IngredientCreate] = []
    steps: list[StepCreate] = []


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    images: Optional[list[str]] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    difficulty: Optional[str] = None
    ingredients: Optional[list[IngredientCreate]] = None
    steps: Optional[list[StepCreate]] = None


class RecipeListItem(BaseModel):
    id: str
    title: str
    description: str
    thumbnail: str
    prep_time: int
    cook_time: int
    difficulty: str
    avg_rating: float
    rating_count: int
    creator_id: str
    created_at: datetime


class RecipeOut(BaseModel):
    id: str
    title: str
    description: str
    thumbnail: str
    images: list[str] = []
    prep_time: int
    cook_time: int
    difficulty: str
    avg_rating: float
    rating_count: int
    creator_id: str
    created_at: datetime
    updated_at: datetime
    ingredients: list[IngredientOut] = []
    steps: list[StepOut] = []
    nutrition: Optional[dict] = None


class RatingCreate(BaseModel):
    score: int


class RatingOut(BaseModel):
    id: str
    recipe_id: str
    user_id: str
    score: int
    created_at: datetime


class RatingDistribution(BaseModel):
    score_1: int = 0
    score_2: int = 0
    score_3: int = 0
    score_4: int = 0
    score_5: int = 0


class CollaboratorInvite(BaseModel):
    user_id: str


class NutritionCalculateRequest(BaseModel):
    ingredients: list[IngredientCreate]


class NutritionResult(BaseModel):
    calories: float
    protein: float
    fat: float
    carbs: float
    fiber: float


class ReplacementSuggestion(BaseModel):
    name: str
    calories: float
    protein: float
    fat: float
    carbs: float
    fiber: float
    unit: str


class FavoriteFolderCreate(BaseModel):
    name: str


class FavoriteFolderUpdate(BaseModel):
    name: str


class FavoriteFolderOut(BaseModel):
    id: str
    user_id: str
    name: str
    created_at: datetime
    recipe_count: int = 0


class VersionSnapshotOut(BaseModel):
    id: str
    recipe_id: str
    snapshot_json: str
    created_by: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
