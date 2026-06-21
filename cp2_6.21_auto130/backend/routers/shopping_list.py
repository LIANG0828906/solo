from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Tuple

from backend.database import get_db
from backend.models import MealPlanEntry, Recipe, Ingredient, ShoppingListChecked, User
from backend.schemas import (
    ShoppingListResponse,
    ShoppingItemResponse,
    ShoppingListToggle,
    ShoppingListSync,
)
from backend.services.zone_mapping import get_zone
from backend.socket_manager import socket_manager

router = APIRouter(prefix="/api/shopping-list", tags=["shopping-list"])


async def _aggregate_ingredients(
    db: AsyncSession, room_id: str, week_start: str
) -> Tuple[List[dict], Dict[str, dict]]:
    entries_result = await db.execute(
        select(MealPlanEntry).options(
            selectinload(MealPlanEntry.recipe).selectinload(Recipe.ingredients),
        ).where(
            MealPlanEntry.room_id == room_id,
            MealPlanEntry.week_start == week_start,
        )
    )
    entries = list(entries_result.scalars().all())

    aggregated: Dict[str, dict] = defaultdict(lambda: {
        "name": "",
        "total_quantity": 0.0,
        "unit": "",
        "category": "",
        "estimated_price": None,
    })

    for entry in entries:
        if not entry.recipe:
            continue
        for ing in entry.recipe.ingredients:
            key = f"{ing.name.lower()}__{ing.unit.lower()}"
            aggregated[key]["name"] = ing.name
            aggregated[key]["total_quantity"] += ing.quantity
            aggregated[key]["unit"] = ing.unit
            aggregated[key]["category"] = ing.category
            if ing.estimated_price:
                if aggregated[key]["estimated_price"] is None:
                    aggregated[key]["estimated_price"] = 0.0
                aggregated[key]["estimated_price"] += ing.estimated_price

    checked_result = await db.execute(
        select(ShoppingListChecked).where(
            ShoppingListChecked.room_id == room_id,
            ShoppingListChecked.week_start == week_start,
        )
    )
    checked_records = list(checked_result.scalars().all())
    checked_map = {c.ingredient_key: c for c in checked_records}

    items = []
    for key, data in aggregated.items():
        zone = get_zone(data["category"])
        checked = checked_map.get(key)
        item = {
            "ingredient_key": key,
            "name": data["name"],
            "total_quantity": data["total_quantity"],
            "unit": data["unit"],
            "category": data["category"],
            "supermarket_zone": zone,
            "estimated_price": data["estimated_price"],
            "purchased": bool(checked.purchased) if checked else False,
            "purchased_by": checked.purchased_by if checked else None,
        }
        items.append(item)

    zone_order = ["produce", "meat_seafood", "dairy_eggs", "seasoning", "staples", "other"]
    items.sort(key=lambda x: (zone_order.index(x["supermarket_zone"]) if x["supermarket_zone"] in zone_order else 99, x["name"]))

    return items, checked_map


@router.get("/{room_id}/{week_start}", response_model=ShoppingListResponse)
async def get_shopping_list(
    room_id: str,
    week_start: str,
    db: AsyncSession = Depends(get_db),
):
    items, checked_map = await _aggregate_ingredients(db, room_id, week_start)

    last_updated = datetime.utcnow()
    updated_by = None
    if checked_map:
        latest = max(checked_map.values(), key=lambda c: c.updated_at or datetime.min)
        if latest.updated_at:
            last_updated = latest.updated_at
            updated_by = latest.purchased_by

    return ShoppingListResponse(
        week_start_date=week_start,
        items=items,
        last_updated_at=last_updated,
        updated_by=updated_by,
    )


@router.post("/{room_id}/sync", response_model=ShoppingListResponse)
async def sync_shopping_list(
    room_id: str,
    data: ShoppingListSync,
    db: AsyncSession = Depends(get_db),
):
    items, _ = await _aggregate_ingredients(db, room_id, data.week_start)

    current_keys = {item["ingredient_key"] for item in items}
    existing_result = await db.execute(
        select(ShoppingListChecked).where(
            ShoppingListChecked.room_id == room_id,
            ShoppingListChecked.week_start == data.week_start,
        )
    )
    for record in existing_result.scalars().all():
        if record.ingredient_key not in current_keys:
            await db.delete(record)

    now = datetime.utcnow()
    user_result = await db.execute(select(User).where(User.id == data.by))
    user = user_result.scalar_one_or_none()
    by_dict = {
        "id": user.id if user else data.by,
        "nickname": user.nickname if user else "Unknown",
        "avatar_url": user.avatar_url if user else None,
    }

    await socket_manager.broadcast_to_room(
        room_id,
        "toast:notify",
        {"message": "采购清单已同步", "type": "success"},
    )

    return ShoppingListResponse(
        week_start_date=data.week_start,
        items=items,
        last_updated_at=now,
        updated_by=data.by,
    )


@router.post("/{room_id}/toggle", response_model=ShoppingItemResponse)
async def toggle_shopping_item(
    room_id: str,
    data: ShoppingListToggle,
    db: AsyncSession = Depends(get_db),
):
    query = select(ShoppingListChecked).where(
        ShoppingListChecked.room_id == room_id,
        ShoppingListChecked.week_start == data.week_start,
        ShoppingListChecked.ingredient_key == data.ingredient_key,
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    user_result = await db.execute(select(User).where(User.id == data.by))
    user = user_result.scalar_one_or_none()
    by_dict = {
        "id": user.id if user else data.by,
        "nickname": user.nickname if user else "Unknown",
        "avatar_url": user.avatar_url if user else None,
    }

    if record:
        record.purchased = 1 if data.purchased else 0
        record.purchased_by = data.by if data.purchased else None
        record.updated_at = datetime.utcnow()
    else:
        record = ShoppingListChecked(
            room_id=room_id,
            week_start=data.week_start,
            ingredient_key=data.ingredient_key,
            purchased=1 if data.purchased else 0,
            purchased_by=data.by if data.purchased else None,
        )
        db.add(record)

    await db.flush()

    items, _ = await _aggregate_ingredients(db, room_id, data.week_start)
    target = next((i for i in items if i["ingredient_key"] == data.ingredient_key), None)
    if not target:
        name_parts = data.ingredient_key.split("__")
        target = {
            "ingredient_key": data.ingredient_key,
            "name": name_parts[0] if name_parts else data.ingredient_key,
            "total_quantity": 0,
            "unit": name_parts[1] if len(name_parts) > 1 else "",
            "category": "other",
            "supermarket_zone": get_zone("other"),
            "estimated_price": None,
            "purchased": data.purchased,
            "purchased_by": data.by if data.purchased else None,
        }

    await socket_manager.broadcast_shopping_list_checked(
        room_id, data.ingredient_key, data.purchased, by_dict
    )

    return ShoppingItemResponse(**target)
