from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List

from backend.database import get_db
from backend.models import MealPlanEntry, Recipe, User
from backend.schemas import (
    MealPlanEntryCreate,
    MealPlanEntryResponse,
    MealPlanBatchUpdate,
    UserResponse,
)
from backend.socket_manager import socket_manager

router = APIRouter(prefix="/api/meal-plans", tags=["meal-plans"])


@router.get("/{room_id}/{week_start}", response_model=List[MealPlanEntryResponse])
async def get_meal_plan(
    room_id: str,
    week_start: str,
    db: AsyncSession = Depends(get_db),
):
    query = select(MealPlanEntry).options(
        selectinload(MealPlanEntry.recipe).selectinload(Recipe.ingredients),
        selectinload(MealPlanEntry.recipe).selectinload(Recipe.author),
    ).where(
        MealPlanEntry.room_id == room_id,
        MealPlanEntry.week_start == week_start,
    ).order_by(MealPlanEntry.day_of_week, MealPlanEntry.meal_slot)

    result = await db.execute(query)
    entries = list(result.scalars().all())

    response_list = []
    for entry in entries:
        recipe_dict = None
        if entry.recipe:
            recipe_dict = {
                "id": entry.recipe.id,
                "name": entry.recipe.name,
                "author_id": entry.recipe.author_id,
                "author": {
                    "id": entry.recipe.author.id,
                    "nickname": entry.recipe.author.nickname,
                    "avatar_url": entry.recipe.author.avatar_url,
                    "room_id": entry.recipe.author.room_id,
                    "created_at": entry.recipe.author.created_at,
                } if entry.recipe.author else None,
                "thumbnail": entry.recipe.thumbnail,
                "hero_image": entry.recipe.hero_image,
                "cook_time_minutes": entry.recipe.cook_time_minutes,
                "difficulty": entry.recipe.difficulty,
                "main_ingredients": entry.recipe.main_ingredients or [],
                "steps": entry.recipe.steps or [],
                "ingredients": [
                    {
                        "id": ing.id,
                        "name": ing.name,
                        "quantity": ing.quantity,
                        "unit": ing.unit,
                        "category": ing.category,
                        "estimated_price": ing.estimated_price,
                    }
                    for ing in (entry.recipe.ingredients or [])
                ],
                "avg_rating": entry.recipe.avg_rating or 0.0,
                "review_count": entry.recipe.review_count or 0,
                "created_at": entry.recipe.created_at,
            }
        entry_dict = {
            "id": entry.id,
            "room_id": entry.room_id,
            "week_start": entry.week_start,
            "day_of_week": entry.day_of_week,
            "meal_slot": entry.meal_slot,
            "recipe_id": entry.recipe_id,
            "recipe": recipe_dict,
            "added_by": entry.added_by,
        }
        response_list.append(entry_dict)

    return response_list


@router.put("/{room_id}", response_model=List[MealPlanEntryResponse])
async def update_meal_plan(
    room_id: str,
    data: MealPlanBatchUpdate,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(MealPlanEntry).where(
            MealPlanEntry.room_id == room_id,
            MealPlanEntry.week_start == data.week_start,
        )
    )
    existing_entries = {
        (e.day_of_week, e.meal_slot): e for e in existing.scalars().all()
    }

    incoming_map = {}
    for entry in data.entries:
        key = (entry.day_of_week, entry.meal_slot)
        incoming_map[key] = entry

    for key, new_entry_data in incoming_map.items():
        existing_entry = existing_entries.get(key)
        user_result = await db.execute(
            select(User).where(User.id == new_entry_data.added_by)
        )
        user = user_result.scalar_one_or_none()
        by_dict = {
            "id": user.id if user else new_entry_data.added_by,
            "nickname": user.nickname if user else "Unknown",
            "avatar_url": user.avatar_url if user else None,
        }

        if new_entry_data.recipe_id:
            recipe_result = await db.execute(
                select(Recipe).where(Recipe.id == new_entry_data.recipe_id)
            )
            if not recipe_result.scalar_one_or_none():
                raise HTTPException(status_code=404, detail=f"Recipe {new_entry_data.recipe_id} not found")

        if existing_entry:
            if new_entry_data.recipe_id:
                old_recipe_id = existing_entry.recipe_id
                existing_entry.recipe_id = new_entry_data.recipe_id
                existing_entry.added_by = new_entry_data.added_by

                action = "move" if old_recipe_id != new_entry_data.recipe_id else "add"
                entry_response = {
                    "day": new_entry_data.day_of_week,
                    "slot": new_entry_data.meal_slot,
                    "recipeId": new_entry_data.recipe_id,
                    "addedBy": new_entry_data.added_by,
                }
                await socket_manager.broadcast_meal_plan_updated(room_id, entry_response, action, by_dict)
            else:
                await db.delete(existing_entry)
                action = "remove"
                entry_response = {
                    "day": new_entry_data.day_of_week,
                    "slot": new_entry_data.meal_slot,
                    "recipeId": None,
                    "addedBy": new_entry_data.added_by,
                }
                await socket_manager.broadcast_meal_plan_updated(room_id, entry_response, action, by_dict)
        else:
            if new_entry_data.recipe_id:
                new_entry = MealPlanEntry(
                    room_id=room_id,
                    week_start=data.week_start,
                    day_of_week=new_entry_data.day_of_week,
                    meal_slot=new_entry_data.meal_slot,
                    recipe_id=new_entry_data.recipe_id,
                    added_by=new_entry_data.added_by,
                )
                db.add(new_entry)
                action = "add"
                entry_response = {
                    "day": new_entry_data.day_of_week,
                    "slot": new_entry_data.meal_slot,
                    "recipeId": new_entry_data.recipe_id,
                    "addedBy": new_entry_data.added_by,
                }
                await socket_manager.broadcast_meal_plan_updated(room_id, entry_response, action, by_dict)

    for key, existing_entry in existing_entries.items():
        if key not in incoming_map:
            user_result = await db.execute(
                select(User).where(User.id == existing_entry.added_by)
            )
            user = user_result.scalar_one_or_none()
            by_dict = {
                "id": user.id if user else existing_entry.added_by,
                "nickname": user.nickname if user else "Unknown",
                "avatar_url": user.avatar_url if user else None,
            }
            await db.delete(existing_entry)
            entry_response = {
                "day": existing_entry.day_of_week,
                "slot": existing_entry.meal_slot,
                "recipeId": None,
                "addedBy": existing_entry.added_by,
            }
            await socket_manager.broadcast_meal_plan_updated(room_id, entry_response, "remove", by_dict)

    await db.flush()

    final = await db.execute(
        select(MealPlanEntry).options(
            selectinload(MealPlanEntry.recipe).selectinload(Recipe.ingredients),
            selectinload(MealPlanEntry.recipe).selectinload(Recipe.author),
        ).where(
            MealPlanEntry.room_id == room_id,
            MealPlanEntry.week_start == data.week_start,
        ).order_by(MealPlanEntry.day_of_week, MealPlanEntry.meal_slot)
    )
    result_entries = list(final.scalars().all())

    response_list = []
    for entry in result_entries:
        recipe_dict = None
        if entry.recipe:
            recipe_dict = {
                "id": entry.recipe.id,
                "name": entry.recipe.name,
                "author_id": entry.recipe.author_id,
                "author": {
                    "id": entry.recipe.author.id,
                    "nickname": entry.recipe.author.nickname,
                    "avatar_url": entry.recipe.author.avatar_url,
                    "room_id": entry.recipe.author.room_id,
                    "created_at": entry.recipe.author.created_at,
                } if entry.recipe.author else None,
                "thumbnail": entry.recipe.thumbnail,
                "hero_image": entry.recipe.hero_image,
                "cook_time_minutes": entry.recipe.cook_time_minutes,
                "difficulty": entry.recipe.difficulty,
                "main_ingredients": entry.recipe.main_ingredients or [],
                "steps": entry.recipe.steps or [],
                "ingredients": [
                    {
                        "id": ing.id,
                        "name": ing.name,
                        "quantity": ing.quantity,
                        "unit": ing.unit,
                        "category": ing.category,
                        "estimated_price": ing.estimated_price,
                    }
                    for ing in (entry.recipe.ingredients or [])
                ],
                "avg_rating": entry.recipe.avg_rating or 0.0,
                "review_count": entry.recipe.review_count or 0,
                "created_at": entry.recipe.created_at,
            }
        entry_dict = {
            "id": entry.id,
            "room_id": entry.room_id,
            "week_start": entry.week_start,
            "day_of_week": entry.day_of_week,
            "meal_slot": entry.meal_slot,
            "recipe_id": entry.recipe_id,
            "recipe": recipe_dict,
            "added_by": entry.added_by,
        }
        response_list.append(entry_dict)

    return response_list
