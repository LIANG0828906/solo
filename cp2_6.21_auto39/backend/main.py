from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import models
import schemas
from database import engine, get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/cards", response_model=List[schemas.Card])
async def get_cards(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Card).order_by(models.Card.z_index, models.Card.id))
    return result.scalars().all()


@app.get("/api/cards/{card_id}", response_model=schemas.Card)
async def get_card(card_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Card).where(models.Card.id == card_id))
    card = result.scalar_one_or_none()
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.post("/api/cards", response_model=schemas.Card)
async def create_card(card: schemas.CardCreate, db: AsyncSession = Depends(get_db)):
    db_card = models.Card(**card.model_dump())
    db.add(db_card)
    await db.commit()
    await db.refresh(db_card)
    return db_card


@app.put("/api/cards/{card_id}", response_model=schemas.Card)
async def update_card(
    card_id: int, card_update: schemas.CardUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(models.Card).where(models.Card.id == card_id))
    db_card = result.scalar_one_or_none()
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    update_data = card_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_card, key, value)

    await db.commit()
    await db.refresh(db_card)
    return db_card


@app.delete("/api/cards/{card_id}")
async def delete_card(card_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Card).where(models.Card.id == card_id))
    db_card = result.scalar_one_or_none()
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    await db.delete(db_card)
    await db.commit()
    return {"message": "Card deleted successfully"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
