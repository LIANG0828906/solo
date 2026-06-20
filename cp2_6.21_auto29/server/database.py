import sqlite3
from pathlib import Path
from contextlib import contextmanager

DB_PATH = Path(__file__).parent / "team_board.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_db_connection():
    conn = get_db()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS columns (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                "order" INTEGER NOT NULL DEFAULT 0
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                assignee TEXT,
                priority TEXT NOT NULL DEFAULT 'medium',
                estimated_hours REAL NOT NULL DEFAULT 0,
                column_id TEXT NOT NULL,
                "order" INTEGER NOT NULL DEFAULT 0,
                start_date TEXT,
                FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dependencies (
                id TEXT PRIMARY KEY,
                task_id TEXT NOT NULL,
                depends_on_task_id TEXT NOT NULL,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                UNIQUE(task_id, depends_on_task_id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                operator TEXT NOT NULL,
                action_type TEXT NOT NULL,
                details TEXT
            )
        """)

        cursor.execute("SELECT COUNT(*) FROM columns")
        if cursor.fetchone()[0] == 0:
            default_columns = [
                ("col-todo", "待办", 0),
                ("col-inprogress", "进行中", 1),
                ("col-review", "审核中", 2),
                ("col-done", "已完成", 3),
            ]
            cursor.executemany(
                "INSERT INTO columns (id, title, \"order\") VALUES (?, ?, ?)",
                default_columns
            )

        cursor.execute("SELECT COUNT(*) FROM tasks")
        if cursor.fetchone()[0] == 0:
            import uuid
            from datetime import datetime, timedelta

            today = datetime.now()
            sample_tasks = [
                (
                    str(uuid.uuid4()),
                    "完成项目需求文档",
                    "张三",
                    "high",
                    8.0,
                    "col-done",
                    0,
                    (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                ),
                (
                    str(uuid.uuid4()),
                    "设计数据库架构",
                    "李四",
                    "high",
                    6.0,
                    "col-done",
                    1,
                    (today - timedelta(days=4)).strftime("%Y-%m-%d"),
                ),
                (
                    str(uuid.uuid4()),
                    "开发用户认证模块",
                    "王五",
                    "medium",
                    12.0,
                    "col-inprogress",
                    0,
                    (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                ),
                (
                    str(uuid.uuid4()),
                    "编写API接口文档",
                    "赵六",
                    "medium",
                    4.0,
                    "col-review",
                    0,
                    (today - timedelta(days=1)).strftime("%Y-%m-%d"),
                ),
                (
                    str(uuid.uuid4()),
                    "前端页面原型设计",
                    "钱七",
                    "low",
                    10.0,
                    "col-inprogress",
                    1,
                    today.strftime("%Y-%m-%d"),
                ),
                (
                    str(uuid.uuid4()),
                    "单元测试覆盖率优化",
                    "孙八",
                    "low",
                    6.0,
                    "col-todo",
                    0,
                    (today + timedelta(days=2)).strftime("%Y-%m-%d"),
                ),
            ]
            cursor.executemany(
                """INSERT INTO tasks (id, title, assignee, priority, estimated_hours,
                   column_id, "order", start_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                sample_tasks
            )
