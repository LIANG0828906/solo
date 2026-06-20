import json
from uuid import uuid4
from datetime import datetime
from typing import Optional

import socketio
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db, create_all, SessionLocal
from models import (
    Recipe, Ingredient, Step, Rating, VersionSnapshot,
    Collaborator, FavoriteFolder, FavoriteRecipe, User,
)
from schemas import (
    RecipeCreate, RecipeUpdate, RecipeOut, RecipeListItem,
    RatingCreate, RatingOut, RatingDistribution,
    CollaboratorInvite, NutritionCalculateRequest, NutritionResult,
    ReplacementSuggestion, FavoriteFolderCreate, FavoriteFolderUpdate,
    FavoriteFolderOut, VersionSnapshotOut, IngredientOut, StepOut,
)
from services.nutrition import calculate_nutrition, get_replacements
from seed import seed_data


def _recipe_list_item(r: Recipe) -> dict:
    return {
        "id": r.id, "title": r.title, "description": r.description,
        "thumbnail": r.thumbnail, "prep_time": r.prep_time,
        "cook_time": r.cook_time, "difficulty": r.difficulty,
        "avg_rating": r.avg_rating, "rating_count": r.rating_count,
        "creator_id": r.creator_id, "created_at": r.created_at,
    }


def _recipe_to_out(r: Recipe, with_nutrition: bool = True) -> RecipeOut:
    ings = sorted(r.ingredients, key=lambda x: x.order_index)
    steps = sorted(r.steps, key=lambda x: x.order_index)
    nutrition = None
    if with_nutrition and ings:
        nutrition = calculate_nutrition(
            [{"name": i.name, "amount": i.amount, "unit": i.unit} for i in ings]
        )
    return RecipeOut(
        id=r.id, title=r.title, description=r.description,
        thumbnail=r.thumbnail,
        images=json.loads(r.images_json) if r.images_json else [],
        prep_time=r.prep_time, cook_time=r.cook_time,
        difficulty=r.difficulty, avg_rating=r.avg_rating,
        rating_count=r.rating_count, creator_id=r.creator_id,
        created_at=r.created_at, updated_at=r.updated_at,
        ingredients=[
            IngredientOut(id=i.id, recipe_id=i.recipe_id, name=i.name,
                          amount=i.amount, unit=i.unit, order_index=i.order_index)
            for i in ings
        ],
        steps=[
            StepOut(id=s.id, recipe_id=s.recipe_id, title=s.title,
                    content=s.content,
                    images=json.loads(s.images_json) if s.images_json else [],
                    timer_seconds=s.timer_seconds, order_index=s.order_index)
            for s in steps
        ],
        nutrition=nutrition,
    )


def _save_snapshot(recipe: Recipe, db: Session, user_id: str = ""):
    data = {
        "title": recipe.title, "description": recipe.description,
        "prep_time": recipe.prep_time, "cook_time": recipe.cook_time,
        "difficulty": recipe.difficulty,
        "ingredients": [{"name": i.name, "amount": i.amount, "unit": i.unit}
                        for i in recipe.ingredients],
        "steps": [{"title": s.title, "content": s.content,
                    "timer_seconds": s.timer_seconds} for s in recipe.steps],
    }
    db.add(VersionSnapshot(
        id=str(uuid4()), recipe_id=recipe.id,
        snapshot_json=json.dumps(data, ensure_ascii=False),
        created_by=user_id, created_at=datetime.utcnow(),
    ))


fastapi_app = FastAPI(title="Recipe App API")
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)


@fastapi_app.on_event("startup")
def startup():
    create_all()
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


@fastapi_app.get("/api/recipes")
def list_recipes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Recipe)
    if search:
        query = query.filter(Recipe.title.contains(search))
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
    total = query.count()
    recipes = query.order_by(Recipe.created_at.desc()) \
        .offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [_recipe_list_item(r) for r in recipes],
        "total": total, "page": page, "page_size": page_size,
    }


@fastapi_app.get("/api/recipes/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: str, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _recipe_to_out(recipe)


@fastapi_app.post("/api/recipes", response_model=RecipeOut, status_code=201)
def create_recipe(body: RecipeCreate, db: Session = Depends(get_db)):
    recipe_id = str(uuid4())
    recipe = Recipe(
        id=recipe_id, title=body.title, description=body.description,
        thumbnail=body.thumbnail, images_json=json.dumps(body.images),
        prep_time=body.prep_time, cook_time=body.cook_time,
        difficulty=body.difficulty, creator_id="demo-user-001",
        created_at=datetime.utcnow(), updated_at=datetime.utcnow(),
    )
    db.add(recipe)
    db.flush()
    for idx, ing in enumerate(body.ingredients):
        db.add(Ingredient(
            id=str(uuid4()), recipe_id=recipe_id, name=ing.name,
            amount=ing.amount, unit=ing.unit, order_index=idx,
        ))
    for idx, step in enumerate(body.steps):
        db.add(Step(
            id=str(uuid4()), recipe_id=recipe_id, title=step.title,
            content=step.content, images_json=json.dumps(step.images),
            timer_seconds=step.timer_seconds, order_index=idx,
        ))
    db.flush()
    _save_snapshot(recipe, db, "demo-user-001")
    db.commit()
    db.refresh(recipe)
    return _recipe_to_out(recipe)


@fastapi_app.put("/api/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, body: RecipeUpdate, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    update_data = body.model_dump(exclude_unset=True)
    ingredients_data = update_data.pop("ingredients", None)
    steps_data = update_data.pop("steps", None)
    images_data = update_data.pop("images", None)
    for key, value in update_data.items():
        setattr(recipe, key, value)
    if images_data is not None:
        recipe.images_json = json.dumps(images_data)
    recipe.updated_at = datetime.utcnow()
    if ingredients_data is not None:
        db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
        for idx, ing in enumerate(ingredients_data):
            db.add(Ingredient(
                id=str(uuid4()), recipe_id=recipe_id, name=ing["name"],
                amount=ing["amount"], unit=ing["unit"], order_index=idx,
            ))
    if steps_data is not None:
        db.query(Step).filter(Step.recipe_id == recipe_id).delete()
        for idx, step in enumerate(steps_data):
            db.add(Step(
                id=str(uuid4()), recipe_id=recipe_id, title=step.get("title", ""),
                content=step.get("content", ""),
                images_json=json.dumps(step.get("images", [])),
                timer_seconds=step.get("timer_seconds", 0), order_index=idx,
            ))
    db.flush()
    _save_snapshot(recipe, db, "demo-user-001")
    db.commit()
    db.refresh(recipe)
    return _recipe_to_out(recipe)


@fastapi_app.delete("/api/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()


@fastapi_app.get("/api/recipes/{recipe_id}/versions", response_model=list[VersionSnapshotOut])
def list_versions(recipe_id: str, db: Session = Depends(get_db)):
    versions = db.query(VersionSnapshot) \
        .filter(VersionSnapshot.recipe_id == recipe_id) \
        .order_by(VersionSnapshot.created_at.desc()).all()
    return versions


@fastapi_app.post("/api/recipes/{recipe_id}/ratings", response_model=RatingOut, status_code=201)
def submit_rating(recipe_id: str, body: RatingCreate, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if body.score < 1 or body.score > 5:
        raise HTTPException(status_code=400, detail="Score must be between 1 and 5")
    rating = Rating(
        id=str(uuid4()), recipe_id=recipe_id, user_id="demo-user-001",
        score=body.score, created_at=datetime.utcnow(),
    )
    db.add(rating)
    db.flush()
    result = db.query(
        func.avg(Rating.score), func.count(Rating.id)
    ).filter(Rating.recipe_id == recipe_id).first()
    recipe.avg_rating = round(result[0], 1) if result[0] else 0.0
    recipe.rating_count = result[1]
    db.commit()
    db.refresh(rating)
    return rating


@fastapi_app.get("/api/recipes/{recipe_id}/rating-distribution", response_model=RatingDistribution)
def rating_distribution(recipe_id: str, db: Session = Depends(get_db)):
    dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    results = db.query(Rating.score, func.count(Rating.id)) \
        .filter(Rating.recipe_id == recipe_id).group_by(Rating.score).all()
    for score, count in results:
        if score in dist:
            dist[score] = count
    return RatingDistribution(
        score_1=dist[1], score_2=dist[2], score_3=dist[3],
        score_4=dist[4], score_5=dist[5],
    )


@fastapi_app.post("/api/recipes/{recipe_id}/collaborators", status_code=201)
def invite_collaborator(recipe_id: str, body: CollaboratorInvite, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.query(Collaborator).filter(
        Collaborator.recipe_id == recipe_id,
        Collaborator.user_id == body.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a collaborator")
    collab = Collaborator(id=str(uuid4()), recipe_id=recipe_id, user_id=body.user_id)
    db.add(collab)
    db.commit()
    return {"message": "Collaborator added"}


@fastapi_app.delete("/api/recipes/{recipe_id}/collaborators/{user_id}", status_code=204)
def remove_collaborator(recipe_id: str, user_id: str, db: Session = Depends(get_db)):
    collab = db.query(Collaborator).filter(
        Collaborator.recipe_id == recipe_id,
        Collaborator.user_id == user_id,
    ).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    db.delete(collab)
    db.commit()


@fastapi_app.post("/api/nutrition/calculate", response_model=NutritionResult)
def calc_nutrition(body: NutritionCalculateRequest):
    result = calculate_nutrition(
        [{"name": i.name, "amount": i.amount, "unit": i.unit} for i in body.ingredients]
    )
    return NutritionResult(**result)


@fastapi_app.get("/api/ingredients/{name}/replacements", response_model=list[ReplacementSuggestion])
def ingredient_replacements(name: str):
    replacements = get_replacements(name)
    return [ReplacementSuggestion(**r) for r in replacements]


@fastapi_app.get("/api/favorites", response_model=list[FavoriteFolderOut])
def list_folders(db: Session = Depends(get_db)):
    folders = db.query(FavoriteFolder).all()
    result = []
    for f in folders:
        count = db.query(FavoriteRecipe).filter(FavoriteRecipe.folder_id == f.id).count()
        result.append(FavoriteFolderOut(
            id=f.id, user_id=f.user_id, name=f.name,
            created_at=f.created_at, recipe_count=count,
        ))
    return result


@fastapi_app.post("/api/favorites", response_model=FavoriteFolderOut, status_code=201)
def create_folder(body: FavoriteFolderCreate, db: Session = Depends(get_db)):
    folder = FavoriteFolder(
        id=str(uuid4()), user_id="demo-user-001",
        name=body.name, created_at=datetime.utcnow(),
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FavoriteFolderOut(
        id=folder.id, user_id=folder.user_id, name=folder.name,
        created_at=folder.created_at, recipe_count=0,
    )


@fastapi_app.patch("/api/favorites/{folder_id}", response_model=FavoriteFolderOut)
def rename_folder(folder_id: str, body: FavoriteFolderUpdate, db: Session = Depends(get_db)):
    folder = db.query(FavoriteFolder).filter(FavoriteFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    folder.name = body.name
    db.commit()
    db.refresh(folder)
    count = db.query(FavoriteRecipe).filter(FavoriteRecipe.folder_id == folder_id).count()
    return FavoriteFolderOut(
        id=folder.id, user_id=folder.user_id, name=folder.name,
        created_at=folder.created_at, recipe_count=count,
    )


@fastapi_app.delete("/api/favorites/{folder_id}", status_code=204)
def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    folder = db.query(FavoriteFolder).filter(FavoriteFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(folder)
    db.commit()


@fastapi_app.post("/api/favorites/{folder_id}/recipes/{recipe_id}", status_code=201)
def add_to_folder(folder_id: str, recipe_id: str, db: Session = Depends(get_db)):
    folder = db.query(FavoriteFolder).filter(FavoriteFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    existing = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.folder_id == folder_id,
        FavoriteRecipe.recipe_id == recipe_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in folder")
    fav = FavoriteRecipe(id=str(uuid4()), folder_id=folder_id, recipe_id=recipe_id)
    db.add(fav)
    db.commit()
    return {"message": "Recipe added to folder"}


@fastapi_app.delete("/api/favorites/{folder_id}/recipes/{recipe_id}", status_code=204)
def remove_from_folder(folder_id: str, recipe_id: str, db: Session = Depends(get_db)):
    fav = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.folder_id == folder_id,
        FavoriteRecipe.recipe_id == recipe_id,
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not in folder")
    db.delete(fav)
    db.commit()


@sio.event
async def connect(sid, environ):
    pass


@sio.event
async def disconnect(sid):
    pass


@sio.event
async def join_recipe(sid, data):
    recipe_id = data.get("recipe_id", "")
    if recipe_id:
        sio.enter_room(sid, f"recipe_{recipe_id}")


@sio.event
async def leave_recipe(sid, data):
    recipe_id = data.get("recipe_id", "")
    if recipe_id:
        sio.leave_room(sid, f"recipe_{recipe_id}")


@sio.event
async def recipe_edit(sid, data):
    recipe_id = data.get("recipe_id", "")
    if recipe_id:
        await sio.emit("recipe_updated", data, room=f"recipe_{recipe_id}", skip_sid=sid)
