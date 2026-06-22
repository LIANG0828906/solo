from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .schemas import (
    SnippetCreate,
    SnippetUpdate,
    SnippetResponse,
    TagCount,
    SearchResult,
)
from .crud import (
    create_snippet,
    get_snippet,
    get_snippets,
    update_snippet,
    delete_snippet,
    search_snippets,
    get_tags_with_count,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Snippet API", description="代码片段管理 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/snippets", response_model=List[SnippetResponse])
def read_snippets(
    skip: int = 0,
    limit: int = 100,
    sort_by: str = Query("created_at", pattern="^(created_at|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return get_snippets(
        db,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        language=language,
    )


@app.get("/api/snippets/{snippet_id}", response_model=SnippetResponse)
def read_snippet(snippet_id: str, db: Session = Depends(get_db)):
    snippet = get_snippet(db, snippet_id=snippet_id)
    if snippet is None:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snippet


@app.post("/api/snippets", response_model=SnippetResponse, status_code=201)
def create_snippet_endpoint(snippet_in: SnippetCreate, db: Session = Depends(get_db)):
    return create_snippet(db, snippet_in=snippet_in)


@app.put("/api/snippets/{snippet_id}", response_model=SnippetResponse)
def update_snippet_endpoint(
    snippet_id: str, snippet_in: SnippetUpdate, db: Session = Depends(get_db)
):
    snippet = update_snippet(db, snippet_id=snippet_id, snippet_in=snippet_in)
    if snippet is None:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return snippet


@app.delete("/api/snippets/{snippet_id}")
def delete_snippet_endpoint(snippet_id: str, db: Session = Depends(get_db)):
    success = delete_snippet(db, snippet_id=snippet_id)
    if not success:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return {"success": True}


@app.get("/api/search", response_model=List[SearchResult])
def search_snippets_endpoint(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    skip: int = 0,
    limit: int = 100,
    sort_by: str = Query("created_at", pattern="^(created_at|updated_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    language: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    results = search_snippets(
        db,
        query=q,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
        language=language,
    )
    response = []
    for snippet_data, matched_lines in results:
        response.append(
            SearchResult(**snippet_data, matched_lines=matched_lines)
        )
    return response


@app.get("/api/tags", response_model=List[TagCount])
def read_tags(db: Session = Depends(get_db)):
    return get_tags_with_count(db)


if __name__ == "__main__":
    import uvicorn

    print("启动命令: uvicorn backend.main:app --reload --port 8000")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
