from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os

app = FastAPI(title="Color Palette API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "color_schemes.json"


class RGB(BaseModel):
    r: int
    g: int
    b: int


class HSL(BaseModel):
    h: int
    s: int
    l: int


class ColorData(BaseModel):
    id: str
    hex: str
    rgb: RGB
    hsl: HSL


class ColorScheme(BaseModel):
    id: str
    name: str
    colors: List[ColorData]
    tags: List[str]
    createdAt: int


def load_schemes() -> List[ColorScheme]:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [ColorScheme(**item) for item in data]
    except Exception:
        return []


def save_schemes(schemes: List[ColorScheme]):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([s.model_dump() for s in schemes], f, ensure_ascii=False, indent=2)


@app.get("/")
async def root():
    return {"message": "Color Palette API", "version": "1.0.0"}


@app.get("/api/schemes", response_model=List[ColorScheme])
async def get_schemes(search: Optional[str] = None, tag: Optional[str] = None, sort: Optional[str] = "date"):
    schemes = load_schemes()
    
    if search:
        search_lower = search.lower()
        schemes = [
            s for s in schemes
            if search_lower in s.name.lower() or any(search_lower in t.lower() for t in s.tags)
        ]
    
    if tag:
        schemes = [s for s in schemes if tag in s.tags]
    
    if sort == "date":
        schemes.sort(key=lambda x: x.createdAt, reverse=True)
    elif sort == "name":
        schemes.sort(key=lambda x: x.name)
    
    return schemes


@app.get("/api/schemes/{scheme_id}", response_model=ColorScheme)
async def get_scheme(scheme_id: str):
    schemes = load_schemes()
    for s in schemes:
        if s.id == scheme_id:
            return s
    raise HTTPException(status_code=404, detail="Scheme not found")


@app.post("/api/schemes", response_model=ColorScheme)
async def create_scheme(scheme: ColorScheme):
    schemes = load_schemes()
    schemes.append(scheme)
    save_schemes(schemes)
    return scheme


@app.put("/api/schemes/{scheme_id}", response_model=ColorScheme)
async def update_scheme(scheme_id: str, updated: ColorScheme):
    schemes = load_schemes()
    for i, s in enumerate(schemes):
        if s.id == scheme_id:
            schemes[i] = updated
            save_schemes(schemes)
            return updated
    raise HTTPException(status_code=404, detail="Scheme not found")


@app.delete("/api/schemes/{scheme_id}")
async def delete_scheme(scheme_id: str):
    schemes = load_schemes()
    original_len = len(schemes)
    schemes = [s for s in schemes if s.id != scheme_id]
    if len(schemes) == original_len:
        raise HTTPException(status_code=404, detail="Scheme not found")
    save_schemes(schemes)
    return {"message": "Scheme deleted successfully"}


@app.get("/api/tags")
async def get_tags():
    schemes = load_schemes()
    tags = set()
    for s in schemes:
        for t in s.tags:
            tags.add(t)
    return sorted(list(tags))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
