from typing import List, Optional, Tuple
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .models import Snippet, Tag, snippet_tag
from .schemas import SnippetCreate, SnippetUpdate


def get_or_create_tag(db: Session, tag_name: str) -> Tag:
    tag = db.query(Tag).filter(func.lower(Tag.name) == tag_name.lower()).first()
    if not tag:
        tag = Tag(name=tag_name.strip())
        db.add(tag)
        db.flush()
    return tag


def snippet_to_response(snippet: Snippet) -> dict:
    return {
        "id": snippet.id,
        "title": snippet.title,
        "code": snippet.code,
        "language": snippet.language,
        "tags": [tag.name for tag in snippet.tags],
        "created_at": snippet.created_at.isoformat(),
        "updated_at": snippet.updated_at.isoformat(),
    }


def create_snippet(db: Session, snippet_in: SnippetCreate) -> dict:
    snippet = Snippet(
        title=snippet_in.title,
        code=snippet_in.code,
        language=snippet_in.language,
    )
    for tag_name in snippet_in.tags:
        if tag_name.strip():
            tag = get_or_create_tag(db, tag_name.strip())
            snippet.tags.append(tag)
    db.add(snippet)
    db.commit()
    db.refresh(snippet)
    return snippet_to_response(snippet)


def get_snippet(db: Session, snippet_id: str) -> Optional[dict]:
    snippet = db.query(Snippet).filter(Snippet.id == snippet_id).first()
    if snippet:
        return snippet_to_response(snippet)
    return None


def get_snippets(db: Session, skip: int = 0, limit: int = 100) -> List[dict]:
    snippets = (
        db.query(Snippet)
        .order_by(Snippet.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [snippet_to_response(s) for s in snippets]


def update_snippet(
    db: Session, snippet_id: str, snippet_in: SnippetUpdate
) -> Optional[dict]:
    snippet = db.query(Snippet).filter(Snippet.id == snippet_id).first()
    if not snippet:
        return None

    update_data = snippet_in.model_dump(exclude_unset=True)
    tags = update_data.pop("tags", None)

    for field, value in update_data.items():
        setattr(snippet, field, value)

    if tags is not None:
        snippet.tags = []
        for tag_name in tags:
            if tag_name.strip():
                tag = get_or_create_tag(db, tag_name.strip())
                snippet.tags.append(tag)

    db.commit()
    db.refresh(snippet)
    return snippet_to_response(snippet)


def delete_snippet(db: Session, snippet_id: str) -> bool:
    snippet = db.query(Snippet).filter(Snippet.id == snippet_id).first()
    if not snippet:
        return False
    db.delete(snippet)
    db.commit()
    return True


def search_snippets(
    db: Session, query: str, skip: int = 0, limit: int = 100
) -> List[Tuple[dict, List[int]]]:
    query_lower = query.lower()

    snippets = (
        db.query(Snippet)
        .outerjoin(snippet_tag)
        .outerjoin(Tag)
        .filter(
            or_(
                func.lower(Snippet.title).contains(query_lower),
                func.lower(Snippet.code).contains(query_lower),
                func.lower(Tag.name).contains(query_lower),
            )
        )
        .order_by(Snippet.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []
    for snippet in snippets:
        matched_lines = []
        for idx, line in enumerate(snippet.code.split("\n"), start=1):
            if query_lower in line.lower():
                matched_lines.append(idx)
        results.append((snippet_to_response(snippet), matched_lines))

    return results


def get_tags_with_count(db: Session) -> List[dict]:
    tag_counts = (
        db.query(Tag, func.count(snippet_tag.c.snippet_id).label("count"))
        .outerjoin(snippet_tag, Tag.id == snippet_tag.c.tag_id)
        .group_by(Tag.id)
        .order_by(func.count(snippet_tag.c.snippet_id).desc(), Tag.name.asc())
        .all()
    )
    return [{"tag": tag.name, "count": count} for tag, count in tag_counts]
