from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import sqlite3
from datetime import datetime

from .database import get_db_connection, init_db

init_db()

app = FastAPI(title="Collaborative Mindmap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


class NodeCreate(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    position_x: float = 0
    position_y: float = 0
    parent_id: Optional[str] = None


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    parent_id: Optional[str] = None


class NodeResponse(BaseModel):
    id: str
    title: str
    description: str
    position_x: float
    position_y: float
    parent_id: Optional[str]
    created_at: str
    updated_at: str


class TaskCreate(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = "medium"
    node_id: str


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    assignee: Optional[str] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str
    due_date: Optional[str]
    assignee: Optional[str]
    priority: str
    completed: bool
    node_id: str
    created_at: str
    updated_at: str


class MindmapSaveRequest(BaseModel):
    nodes: List[NodeCreate]
    tasks: List[TaskCreate]


def row_to_dict(row):
    return {key: row[key] for key in row.keys()}


@app.get("/node/", response_model=List[NodeResponse])
def get_nodes():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM nodes ORDER BY created_at").fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@app.get("/node/{node_id}", response_model=NodeResponse)
def get_node(node_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Node not found")
    return row_to_dict(row)


@app.post("/node/", response_model=NodeResponse)
def create_node(node: NodeCreate):
    node_id = node.id or str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    if node.parent_id:
        conn = get_db_connection()
        parent = conn.execute("SELECT id FROM nodes WHERE id = ?", (node.parent_id,)).fetchone()
        conn.close()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent node does not exist")
    
    conn = get_db_connection()
    conn.execute(
        """INSERT INTO nodes (id, title, description, position_x, position_y, parent_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (node_id, node.title, node.description or "", node.position_x, node.position_y,
         node.parent_id, now, now)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.put("/node/{node_id}", response_model=NodeResponse)
def update_node(node_id: str, node: NodeUpdate):
    conn = get_db_connection()
    existing = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Node not found")
    
    if node.parent_id and node.parent_id != existing["parent_id"]:
        parent = conn.execute("SELECT id FROM nodes WHERE id = ?", (node.parent_id,)).fetchone()
        if not parent:
            conn.close()
            raise HTTPException(status_code=400, detail="Parent node does not exist")
    
    now = datetime.now().isoformat()
    updates = []
    params = []
    for field in ["title", "description", "position_x", "position_y", "parent_id"]:
        val = getattr(node, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)
    updates.append("updated_at = ?")
    params.append(now)
    params.append(node_id)
    
    conn.execute(f"UPDATE nodes SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    row = conn.execute("SELECT * FROM nodes WHERE id = ?", (node_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/node/{node_id}")
def delete_node(node_id: str):
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM nodes WHERE id = ?", (node_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Node not found")
    conn.execute("DELETE FROM nodes WHERE id = ?", (node_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Node deleted"}


@app.get("/task/", response_model=List[TaskResponse])
def get_tasks(node_id: Optional[str] = None):
    conn = get_db_connection()
    if node_id:
        rows = conn.execute("SELECT * FROM tasks WHERE node_id = ? ORDER BY created_at", (node_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM tasks ORDER BY created_at").fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


@app.get("/task/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    return row_to_dict(row)


@app.post("/task/", response_model=TaskResponse)
def create_task(task: TaskCreate):
    task_id = task.id or str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    node = conn.execute("SELECT id FROM nodes WHERE id = ?", (task.node_id,)).fetchone()
    if not node:
        conn.close()
        raise HTTPException(status_code=400, detail="Associated node does not exist")
    
    priority = task.priority or "medium"
    if priority not in ("high", "medium", "low"):
        conn.close()
        raise HTTPException(status_code=400, detail="Priority must be high, medium, or low")
    
    try:
        conn.execute(
            """INSERT INTO tasks (id, title, description, due_date, assignee, priority, completed, node_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)""",
            (task_id, task.title, task.description or "", task.due_date, task.assignee,
             priority, task.node_id, now, now)
        )
        conn.commit()
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Foreign key constraint failed: {e}")
    
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.put("/task/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task: TaskUpdate):
    conn = get_db_connection()
    existing = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.priority and task.priority not in ("high", "medium", "low"):
        conn.close()
        raise HTTPException(status_code=400, detail="Priority must be high, medium, or low")
    
    now = datetime.now().isoformat()
    updates = []
    params = []
    for field in ["title", "description", "due_date", "assignee", "priority"]:
        val = getattr(task, field)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)
    if task.completed is not None:
        updates.append("completed = ?")
        params.append(1 if task.completed else 0)
    updates.append("updated_at = ?")
    params.append(now)
    params.append(task_id)
    
    conn.execute(f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()
    row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()
    return row_to_dict(row)


@app.delete("/task/{task_id}")
def delete_task(task_id: str):
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"status": "ok", "message": "Task deleted"}


@app.post("/mindmap/save")
def save_mindmap(data: MindmapSaveRequest):
    conn = get_db_connection()
    
    try:
        conn.execute("DELETE FROM tasks")
        conn.execute("DELETE FROM nodes")
        
        now = datetime.now().isoformat()
        
        for node in data.nodes:
            node_id = node.id or str(uuid.uuid4())
            conn.execute(
                """INSERT INTO nodes (id, title, description, position_x, position_y, parent_id, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (node_id, node.title, node.description or "", node.position_x, node.position_y,
                 node.parent_id, now, now)
            )
        
        for task in data.tasks:
            task_id = task.id or str(uuid.uuid4())
            priority = task.priority or "medium"
            conn.execute(
                """INSERT INTO tasks (id, title, description, due_date, assignee, priority, completed, node_id, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)""",
                (task_id, task.title, task.description or "", task.due_date, task.assignee,
                 priority, task.node_id, now, now)
            )
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Save failed: {str(e)}")
    
    conn.close()
    return {"status": "ok", "message": "Mindmap saved successfully"}


@app.get("/mindmap/load")
def load_mindmap():
    conn = get_db_connection()
    nodes = [row_to_dict(r) for r in conn.execute("SELECT * FROM nodes ORDER BY created_at").fetchall()]
    tasks = [row_to_dict(r) for r in conn.execute("SELECT * FROM tasks ORDER BY created_at").fetchall()]
    conn.close()
    return {"nodes": nodes, "tasks": tasks}
