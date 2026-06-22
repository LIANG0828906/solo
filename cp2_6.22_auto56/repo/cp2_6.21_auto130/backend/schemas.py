from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from typing import List, Optional, Literal


SupermarketZone = Literal["produce", "meat_seafood", "dairy_eggs", "seasoning", "staples", "other"]
MealSlot = Literal["breakfast", "lunch", "dinner"]
WeekDay = Literal[0, 1, 2, 3, 4, 5, 6]
IngredientCategory = Literal["vegetable", "meat", "spice", "dairy", "grain", "seafood", "other"]


class UserCreate(BaseModel):
    nickname: str = Field(..., min_length=1, max_length=50)
    avatar_url: Optional[str] = None
    room_id: str = "default-room"


class UserResponse(BaseModel):
    id: str
    nickname: str
    avatar_url: Optional[str] = None
    room_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class IngredientCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    category: IngredientCategory
    estimated_price: Optional[float] = None


class IngredientResponse(BaseModel):
    id: str
    name: str
    quantity: float
    unit: str
    category: str
    estimated_price: Optional[float] = None

    class Config:
        from_attributes = True


class RecipeCreate(BaseModel):
    name: str
    author_id: str
    thumbnail: Optional[str] = None
    hero_image: Optional[str] = None
    cook_time_minutes: int = Field(..., ge=1)
    difficulty: int = Field(..., ge=1, le=3)
    main_ingredients: List[str] = []
    ingredients: List[IngredientCreate] = []
    steps: List[str] = []


class RecipeResponse(BaseModel):
    id: str
    name: str
    author_id: str
    author: Optional[UserResponse] = None
    thumbnail: Optional[str] = None
    hero_image: Optional[str] = None
    cook_time_minutes: int
    difficulty: int
    main_ingredients: List[str]
    steps: List[str]
    ingredients: List[IngredientResponse] = []
    avg_rating: float = 0.0
    review_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class RecipeListResponse(BaseModel):
    recipes: List[RecipeResponse]
    total: int


class CommentCreate(BaseModel):
    user_id: str
    rating: int = Field(..., ge=1, le=5)
    content: str


class CommentResponse(BaseModel):
    id: str
    recipe_id: str
    user_id: str
    user: Optional[UserResponse] = None
    rating: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecipeDetailResponse(RecipeResponse):
    comments: List[CommentResponse] = []


class MealPlanEntryCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    meal_slot: MealSlot
    recipe_id: Optional[str] = None
    added_by: str


class MealPlanEntryResponse(BaseModel):
    id: str
    room_id: str
    week_start: str
    day_of_week: int
    meal_slot: str
    recipe_id: Optional[str] = None
    recipe: Optional[RecipeResponse] = None
    added_by: str

    class Config:
        from_attributes = True


class MealPlanBatchUpdate(BaseModel):
    week_start: str
    entries: List[MealPlanEntryCreate]


class ShoppingItemResponse(BaseModel):
    ingredient_key: str
    name: str
    total_quantity: float
    unit: str
    category: str
    supermarket_zone: SupermarketZone
    estimated_price: Optional[float] = None
    purchased: bool = False
    purchased_by: Optional[str] = None


class ShoppingListResponse(BaseModel):
    week_start_date: str
    items: List[ShoppingItemResponse]
    last_updated_at: datetime
    updated_by: Optional[str] = None


class ShoppingListToggle(BaseModel):
    ingredient_key: str
    purchased: bool
    by: str
    week_start: str


class ShoppingListSync(BaseModel):
    week_start: str
    by: str
