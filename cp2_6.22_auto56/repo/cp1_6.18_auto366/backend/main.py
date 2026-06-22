from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import json
import random

from database import engine, get_db, Base
from models import Project, Note, Comment, MindMap

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


RANDOM_NICKNAMES = [
    "星空漫步者", "书香墨客", "深夜读书人", "思考的猫", "云端旅人",
    "笔耕不辍", "温柔的风", "月光诗人", "山间清风", "梦里看花",
    "旧书守护者", "字里行间", "故事收集者", "温柔月光", "海边拾贝人"
]

RANDOM_COLORS = [
    "#6A5ACD", "#7B68EE", "#9370DB", "#8A2BE2", "#4A3B6B",
    "#6959CD", "#483D8B", "#556B2F", "#20B2AA", "#CD853F"
]


class ProjectCreate(BaseModel):
    title: str = Field(..., max_length=20)
    description: str = ""


class NoteCreate(BaseModel):
    excerpt: str
    reflection: str = ""
    tags: List[str] = []


class NoteUpdate(BaseModel):
    excerpt: Optional[str] = None
    reflection: Optional[str] = None
    tags: Optional[List[str]] = None


class MindMapNode(BaseModel):
    id: str
    noteId: str
    x: float
    y: float


class MindMapEdge(BaseModel):
    id: str
    from_: str = Field(..., alias="from")
    to: str

    class Config:
        populate_by_name = True


class MindMapData(BaseModel):
    nodes: List[MindMapNode]
    edges: List[MindMapEdge]


class CommentCreate(BaseModel):
    content: str = Field(..., max_length=200)


@app.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "likes": p.likes,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "notes_count": len(p.notes)
        })
    return result


@app.post("/projects")
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    project_id = str(uuid.uuid4())
    db_project = Project(
        id=project_id,
        title=project.title,
        description=project.description
    )
    db.add(db_project)
    mindmap_id = str(uuid.uuid4())
    db_mindmap = MindMap(
        id=mindmap_id,
        project_id=project_id
    )
    db.add(db_mindmap)
    db.commit()
    db.refresh(db_project)
    return {
        "id": db_project.id,
        "title": db_project.title,
        "description": db_project.description,
        "likes": db_project.likes,
        "created_at": db_project.created_at.isoformat() if db_project.created_at else None
    }


@app.get("/projects/{project_id}/notes")
def get_project_notes(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    notes = db.query(Note).filter(Note.project_id == project_id).order_by(Note.created_at.desc()).all()
    result = []
    for n in notes:
        result.append({
            "id": n.id,
            "project_id": n.project_id,
            "excerpt": n.excerpt,
            "reflection": n.reflection,
            "tags": json.loads(n.tags) if n.tags else [],
            "created_at": n.created_at.isoformat() if n.created_at else None
        })
    return result


@app.post("/projects/{project_id}/notes")
def create_note(project_id: str, note: NoteCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    note_id = str(uuid.uuid4())
    db_note = Note(
        id=note_id,
        project_id=project_id,
        excerpt=note.excerpt,
        reflection=note.reflection,
        tags=json.dumps(note.tags, ensure_ascii=False)
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return {
        "id": db_note.id,
        "project_id": db_note.project_id,
        "excerpt": db_note.excerpt,
        "reflection": db_note.reflection,
        "tags": json.loads(db_note.tags) if db_note.tags else [],
        "created_at": db_note.created_at.isoformat() if db_note.created_at else None
    }


@app.put("/notes/{note_id}")
def update_note(note_id: str, note: NoteUpdate, db: Session = Depends(get_db)):
    db_note = db.query(Note).filter(Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.excerpt is not None:
        db_note.excerpt = note.excerpt
    if note.reflection is not None:
        db_note.reflection = note.reflection
    if note.tags is not None:
        db_note.tags = json.dumps(note.tags, ensure_ascii=False)
    db.commit()
    db.refresh(db_note)
    return {
        "id": db_note.id,
        "project_id": db_note.project_id,
        "excerpt": db_note.excerpt,
        "reflection": db_note.reflection,
        "tags": json.loads(db_note.tags) if db_note.tags else [],
        "created_at": db_note.created_at.isoformat() if db_note.created_at else None
    }


@app.get("/projects/{project_id}/mindmap")
def get_mindmap(project_id: str, db: Session = Depends(get_db)):
    mindmap = db.query(MindMap).filter(MindMap.project_id == project_id).first()
    if not mindmap:
        raise HTTPException(status_code=404, detail="MindMap not found")
    return {
        "nodes": json.loads(mindmap.nodes_data) if mindmap.nodes_data else [],
        "edges": json.loads(mindmap.edges_data) if mindmap.edges_data else []
    }


@app.put("/projects/{project_id}/mindmap")
def update_mindmap(project_id: str, mindmap_data: MindMapData, db: Session = Depends(get_db)):
    mindmap = db.query(MindMap).filter(MindMap.project_id == project_id).first()
    if not mindmap:
        raise HTTPException(status_code=404, detail="MindMap not found")
    nodes_serializable = [node.model_dump() for node in mindmap_data.nodes]
    edges_serializable = []
    for edge in mindmap_data.edges:
        edge_dict = edge.model_dump(by_alias=True)
        edges_serializable.append(edge_dict)
    mindmap.nodes_data = json.dumps(nodes_serializable, ensure_ascii=False)
    mindmap.edges_data = json.dumps(edges_serializable, ensure_ascii=False)
    db.commit()
    db.refresh(mindmap)
    return {
        "nodes": json.loads(mindmap.nodes_data) if mindmap.nodes_data else [],
        "edges": json.loads(mindmap.edges_data) if mindmap.edges_data else []
    }


@app.get("/projects/{project_id}/comments")
def get_comments(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    comments = db.query(Comment).filter(Comment.project_id == project_id).order_by(Comment.created_at.desc()).all()
    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "project_id": c.project_id,
            "nickname": c.nickname,
            "avatar_color": c.avatar_color,
            "content": c.content,
            "created_at": c.created_at.isoformat() if c.created_at else None
        })
    return result


@app.post("/projects/{project_id}/comments")
def create_comment(project_id: str, comment: CommentCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    comment_id = str(uuid.uuid4())
    nickname = random.choice(RANDOM_NICKNAMES)
    avatar_color = random.choice(RANDOM_COLORS)
    db_comment = Comment(
        id=comment_id,
        project_id=project_id,
        nickname=nickname,
        avatar_color=avatar_color,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return {
        "id": db_comment.id,
        "project_id": db_comment.project_id,
        "nickname": db_comment.nickname,
        "avatar_color": db_comment.avatar_color,
        "content": db_comment.content,
        "created_at": db_comment.created_at.isoformat() if db_comment.created_at else None
    }


@app.post("/projects/{project_id}/like")
def like_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.likes += 1
    db.commit()
    db.refresh(project)
    return {"likes": project.likes}
