from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List

from backend.database import get_db
from backend.models import Recipe, Ingredient, Comment, User
from backend.schemas import (
    RecipeCreate,
    RecipeResponse,
    RecipeListResponse,
    RecipeDetailResponse,
    CommentCreate,
    CommentResponse,
    IngredientResponse,
    UserResponse,
)
from backend.socket_manager import socket_manager

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.get("", response_model=RecipeListResponse)
async def list_recipes(
    search: str = "",
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit
    query = select(Recipe).options(
        selectinload(Recipe.author),
        selectinload(Recipe.ingredients),
    )

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Recipe.name.ilike(search_pattern),
                Recipe.main_ingredients.cast(str).ilike(search_pattern),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    query = query.order_by(Recipe.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    recipes = list(result.scalars().all())

    return RecipeListResponse(recipes=recipes, total=total or 0)


@router.get("/{recipe_id}", response_model=RecipeDetailResponse)
async def get_recipe(
    recipe_id: str,
    db: AsyncSession = Depends(get_db),
):
    query = select(Recipe).options(
        selectinload(Recipe.author),
        selectinload(Recipe.ingredients),
        selectinload(Recipe.comments).selectinload(Comment.user),
    ).where(Recipe.id == recipe_id)

    result = await db.execute(query)
    recipe = result.scalar_one_or_none()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe_dict = {
        "id": recipe.id,
        "name": recipe.name,
        "author_id": recipe.author_id,
        "author": recipe.author,
        "thumbnail": recipe.thumbnail,
        "hero_image": recipe.hero_image,
        "cook_time_minutes": recipe.cook_time_minutes,
        "difficulty": recipe.difficulty,
        "main_ingredients": recipe.main_ingredients or [],
        "steps": recipe.steps or [],
        "ingredients": recipe.ingredients,
        "avg_rating": recipe.avg_rating or 0.0,
        "review_count": recipe.review_count or 0,
        "created_at": recipe.created_at,
        "comments": recipe.comments,
    }
    return recipe_dict


@router.post("", response_model=RecipeResponse)
async def create_recipe(
    data: RecipeCreate,
    db: AsyncSession = Depends(get_db),
):
    user_result = await db.execute(select(User).where(User.id == data.author_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Author user not found")

    recipe = Recipe(
        name=data.name,
        author_id=data.author_id,
        thumbnail=data.thumbnail,
        hero_image=data.hero_image,
        cook_time_minutes=data.cook_time_minutes,
        difficulty=data.difficulty,
        main_ingredients=data.main_ingredients,
        steps=data.steps,
    )
    db.add(recipe)
    await db.flush()

    for ing_data in data.ingredients:
        ingredient = Ingredient(
            recipe_id=recipe.id,
            name=ing_data.name,
            quantity=ing_data.quantity,
            unit=ing_data.unit,
            category=ing_data.category,
            estimated_price=ing_data.estimated_price,
        )
        db.add(ingredient)

    await db.refresh(recipe)
    query = select(Recipe).options(
        selectinload(Recipe.author),
        selectinload(Recipe.ingredients),
    ).where(Recipe.id == recipe.id)
    result = await db.execute(query)
    return result.scalar_one()


@router.post("/{recipe_id}/comments", response_model=CommentResponse)
async def create_comment(
    recipe_id: str,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
):
    recipe_result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = recipe_result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    user_result = await db.execute(select(User).where(User.id == data.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    comment = Comment(
        recipe_id=recipe_id,
        user_id=data.user_id,
        rating=data.rating,
        content=data.content,
    )
    db.add(comment)
    await db.flush()

    comments_result = await db.execute(
        select(Comment.rating).where(Comment.recipe_id == recipe_id)
    )
    ratings = [r[0] for r in comments_result.all()]
    recipe.review_count = len(ratings)
    recipe.avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

    await db.refresh(comment)
    query = select(Comment).options(selectinload(Comment.user)).where(Comment.id == comment.id)
    result = await db.execute(query)
    new_comment = result.scalar_one()

    comment_dict = {
        "id": new_comment.id,
        "recipe_id": new_comment.recipe_id,
        "user_id": new_comment.user_id,
        "user": {
            "id": new_comment.user.id,
            "nickname": new_comment.user.nickname,
            "avatar_url": new_comment.user.avatar_url,
            "room_id": new_comment.user.room_id,
            "created_at": new_comment.user.created_at,
        } if new_comment.user else None,
        "rating": new_comment.rating,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
    }
    await socket_manager.broadcast_comment_new(user.room_id, comment_dict)

    return comment_dict
