from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import uuid
from datetime import datetime

from .database import init_db, get_db_connection
from .models import (
    Column, Task, TaskCreate, TaskUpdate, TaskMove,
    LogEntry, LogCreate
)

app = FastAPI(title="Team Collaboration Board API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()


def row_to_task(row, cursor) -> Dict:
    task_id = row["id"]
    cursor.execute(
        "SELECT depends_on_task_id FROM dependencies WHERE task_id = ?",
        (task_id,)
    )
    deps = [r["depends_on_task_id"] for r in cursor.fetchall()]
    return {
        "id": row["id"],
        "title": row["title"],
        "assignee": row["assignee"],
        "priority": row["priority"],
        "estimated_hours": row["estimated_hours"],
        "column_id": row["column_id"],
        "order": row["order"],
        "start_date": row["start_date"],
        "dependencies": deps,
    }


@app.get("/api/columns", response_model=List[Column])
def get_columns():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM columns ORDER BY "order" ASC')
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@app.get("/api/tasks", response_model=List[Task])
def get_tasks():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM tasks ORDER BY "order" ASC')
        rows = cursor.fetchall()
        return [row_to_task(r, cursor) for r in rows]


@app.post("/api/tasks", response_model=Task)
def create_task(task_data: TaskCreate):
    task_id = str(uuid.uuid4())
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute(
            'SELECT COALESCE(MAX("order"), -1) + 1 FROM tasks WHERE column_id = ?',
            (task_data.column_id,)
        )
        new_order = cursor.fetchone()[0]

        cursor.execute(
            """INSERT INTO tasks (id, title, assignee, priority, estimated_hours,
               column_id, "order", start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                task_id, task_data.title, task_data.assignee, task_data.priority,
                task_data.estimated_hours, task_data.column_id, new_order,
                task_data.start_date,
            ),
        )

        for dep_id in task_data.dependencies:
            cursor.execute(
                "INSERT INTO dependencies (id, task_id, depends_on_task_id) VALUES (?, ?, ?)",
                (str(uuid.uuid4()), task_id, dep_id),
            )

        log_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO logs (id, timestamp, operator, action_type, details)
               VALUES (?, ?, ?, ?, ?)""",
            (
                log_id, datetime.now().isoformat(),
                task_data.assignee or "system", "create",
                f"创建任务: {task_data.title}",
            ),
        )

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        return row_to_task(row, cursor)


@app.put("/api/tasks/{task_id}", response_model=Task)
def update_task(task_id: str, task_data: TaskUpdate):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Task not found")

        update_fields = []
        values = []
        if task_data.title is not None:
            update_fields.append("title = ?")
            values.append(task_data.title)
        if task_data.assignee is not None:
            update_fields.append("assignee = ?")
            values.append(task_data.assignee)
        if task_data.priority is not None:
            update_fields.append("priority = ?")
            values.append(task_data.priority)
        if task_data.estimated_hours is not None:
            update_fields.append("estimated_hours = ?")
            values.append(task_data.estimated_hours)
        if task_data.column_id is not None:
            update_fields.append("column_id = ?")
            values.append(task_data.column_id)
        if task_data.order is not None:
            update_fields.append('"order" = ?')
            values.append(task_data.order)
        if task_data.start_date is not None:
            update_fields.append("start_date = ?")
            values.append(task_data.start_date)

        if update_fields:
            values.append(task_id)
            cursor.execute(
                f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?",
                tuple(values),
            )

        if task_data.dependencies is not None:
            cursor.execute("DELETE FROM dependencies WHERE task_id = ?", (task_id,))
            for dep_id in task_data.dependencies:
                if dep_id != task_id:
                    cursor.execute(
                        "INSERT OR IGNORE INTO dependencies (id, task_id, depends_on_task_id) VALUES (?, ?, ?)",
                        (str(uuid.uuid4()), task_id, dep_id),
                    )

        log_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO logs (id, timestamp, operator, action_type, details)
               VALUES (?, ?, ?, ?, ?)""",
            (
                log_id, datetime.now().isoformat(),
                task_data.assignee or existing["assignee"] or "system",
                "update", f"更新任务: {task_data.title or existing['title']}",
            ),
        )

        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        return row_to_task(row, cursor)


@app.post("/api/tasks/move", response_model=Dict)
def move_task(move_data: TaskMove):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (move_data.task_id,))
        task = cursor.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        cursor.execute(
            """UPDATE tasks SET column_id = ?, "order" = ? WHERE id = ?""",
            (move_data.to_column_id, move_data.to_index, move_data.task_id),
        )

        cursor.execute(
            'SELECT id FROM tasks WHERE column_id = ? AND id != ? ORDER BY "order" ASC',
            (move_data.to_column_id, move_data.task_id),
        )
        other_tasks = cursor.fetchall()
        idx = 0
        for t in other_tasks:
            if idx == move_data.to_index:
                idx += 1
            cursor.execute(
                'UPDATE tasks SET "order" = ? WHERE id = ?',
                (idx, t["id"]),
            )
            idx += 1

        if move_data.from_column_id != move_data.to_column_id:
            cursor.execute(
                'SELECT id FROM tasks WHERE column_id = ? ORDER BY "order" ASC',
                (move_data.from_column_id,),
            )
            from_tasks = cursor.fetchall()
            for i, t in enumerate(from_tasks):
                cursor.execute(
                    'UPDATE tasks SET "order" = ? WHERE id = ?',
                    (i, t["id"]),
                )

        log_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO logs (id, timestamp, operator, action_type, details)
               VALUES (?, ?, ?, ?, ?)""",
            (
                log_id, datetime.now().isoformat(),
                task["assignee"] or "system", "move",
                f"移动任务 {task['title']}: {move_data.from_column_id} -> {move_data.to_column_id}",
            ),
        )

        return {"success": True}


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        task = cursor.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))

        log_id = str(uuid.uuid4())
        cursor.execute(
            """INSERT INTO logs (id, timestamp, operator, action_type, details)
               VALUES (?, ?, ?, ?, ?)""",
            (
                log_id, datetime.now().isoformat(),
                task["assignee"] or "system", "delete",
                f"删除任务: {task['title']}",
            ),
        )

        return {"success": True}


@app.get("/api/logs", response_model=List[LogEntry])
def get_logs(limit: int = 100, offset: int = 0):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM logs ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@app.post("/api/logs", response_model=LogEntry)
def create_log(log_data: LogCreate):
    log_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO logs (id, timestamp, operator, action_type, details)
               VALUES (?, ?, ?, ?, ?)""",
            (log_id, timestamp, log_data.operator, log_data.action_type, log_data.details),
        )
        return {
            "id": log_id,
            "timestamp": timestamp,
            "operator": log_data.operator,
            "action_type": log_data.action_type,
            "details": log_data.details,
        }
