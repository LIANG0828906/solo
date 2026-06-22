import json
from sqlalchemy.orm import Session
from models import Batch, TasteNote, Comment
from schemas import BatchCreate, TasteNoteCreate, CommentCreate


def create_batch(db: Session, batch: BatchCreate) -> Batch:
    db_batch = Batch(
        bean_type=batch.bean_type,
        roast_level=batch.roast_level,
        charge_temp=batch.charge_temp,
        drop_temp=batch.drop_temp,
        total_time=batch.total_time,
        curve_data=json.dumps([p.model_dump() for p in batch.curve_data]),
        markers=json.dumps([m.model_dump() for m in batch.markers]),
        is_public=batch.is_public,
        rating=batch.rating,
    )
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch


def get_batch(db: Session, batch_id: int) -> Batch | None:
    return db.query(Batch).filter(Batch.id == batch_id).first()


def list_batches(db: Session, skip: int = 0, limit: int = 100) -> list[Batch]:
    return db.query(Batch).offset(skip).limit(limit).all()


def clone_batch(db: Session, batch_id: int) -> Batch | None:
    original = get_batch(db, batch_id)
    if not original:
        return None
    cloned = Batch(
        bean_type=original.bean_type,
        roast_level=original.roast_level,
        charge_temp=original.charge_temp,
        drop_temp=original.drop_temp,
        total_time=original.total_time,
        curve_data=original.curve_data,
        markers=original.markers,
        is_public=original.is_public,
        rating=original.rating,
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned


def list_public_batches(
    db: Session,
    bean_type: str | None = None,
    roast_level: str | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Batch], int]:
    query = db.query(Batch).filter(Batch.is_public == True)
    if bean_type:
        query = query.filter(Batch.bean_type == bean_type)
    if roast_level:
        query = query.filter(Batch.roast_level == roast_level)
    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    return items, total


def create_taste_note(db: Session, note: TasteNoteCreate) -> TasteNote:
    db_note = TasteNote(
        batch_id=note.batch_id,
        category=note.category,
        sub_flavors=json.dumps(note.sub_flavors),
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


def get_taste_notes_by_batch(db: Session, batch_id: int) -> list[TasteNote]:
    return db.query(TasteNote).filter(TasteNote.batch_id == batch_id).all()


def create_comment(db: Session, comment: CommentCreate) -> Comment:
    db_comment = Comment(
        batch_id=comment.batch_id,
        content=comment.content,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def get_comments_by_batch(db: Session, batch_id: int) -> list[Comment]:
    return db.query(Comment).filter(Comment.batch_id == batch_id).all()
