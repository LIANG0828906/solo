from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class IngredientBase(BaseModel):
    name: str
    quantity: str
    unit: str
    category: Optional[str] = "其他"


class IngredientCreate(IngredientBase):
    pass


class Ingredient(IngredientBase):
    id: int
    recipe_id: int

    class Config:
        from_attributes = True


class RecipeBase(BaseModel):
    name: str
    cooking_time: int
    steps: List[str]
    image_data: Optional[str] = None


class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate]


class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    cooking_time: Optional[int] = None
    steps: Optional[List[str]] = None
    image_data: Optional[str] = None
    ingredients: Optional[List[IngredientCreate]] = None


class Recipe(RecipeBase):
    id: int
    created_at: datetime
    ingredients: List[Ingredient] = []

    class Config:
        from_attributes = True


class InventoryBase(BaseModel):
    name: str
    quantity: str
    unit: str
    category: Optional[str] = "其他"


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None


class Inventory(InventoryBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True


class ShoppingListItemBase(BaseModel):
    name: str
    quantity: str
    unit: str
    category: Optional[str] = "其他"
    is_checked: Optional[bool] = False
    shopping_list_id: Optional[int] = None


class ShoppingListItemCreate(ShoppingListItemBase):
    pass


class ShoppingListItem(ShoppingListItemBase):
    id: int

    class Config:
        from_attributes = True


class ShoppingListGenerateRequest(BaseModel):
    recipe_ids: List[int]
