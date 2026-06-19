from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.database import close_db, get_db, init_db
from api.routes import graph, notes, search


async def _seed():
    db = await get_db()

    count_cursor = await db.execute("SELECT COUNT(*) AS cnt FROM notes")
    count_row = await count_cursor.fetchone()
    if count_row["cnt"] > 0:
        return

    tag_data = [
        ("t1", "Python", "tech"),
        ("t2", "Rust", "tech"),
        ("t3", "Web", "tech"),
        ("t4", "Productivity", "life"),
        ("t5", "Mindfulness", "life"),
        ("t6", "Learning", "study"),
        ("t7", "AI", "tech"),
        ("t8", "Health", "life"),
    ]
    for tid, name, cat in tag_data:
        await db.execute(
            "INSERT OR IGNORE INTO tags (id, name, category) VALUES (?, ?, ?)",
            (tid, name, cat),
        )

    note_data = [
        (
            "n1",
            "Python Async Patterns",
            "Exploring async/await in Python with asyncio and aiosqlite. See [[Rust for Systems]] for a comparison. Also relevant to [[Web API Design]].",
            "tech",
            ["t1", "t6"],
        ),
        (
            "n2",
            "Rust for Systems",
            "Rust provides memory safety without garbage collection. Great for systems programming. Compare with [[Python Async Patterns]] for higher-level approaches.",
            "tech",
            ["t2", "t6"],
        ),
        (
            "n3",
            "Web API Design",
            "RESTful API design principles: proper HTTP methods, status codes, and resource naming. Relates to [[Python Async Patterns]] for backend implementation.",
            "tech",
            ["t3", "t7"],
        ),
        (
            "n4",
            "Daily Journaling",
            "Writing every morning clarifies thinking and reduces anxiety. A habit that supports [[Mindfulness Practice]] and overall [[Health Habits]].",
            "life",
            ["t4", "t5"],
        ),
        (
            "n5",
            "Mindfulness Practice",
            "Meditation and breathing exercises for focus. Pairs well with [[Daily Journaling]] and supports [[Health Habits]].",
            "life",
            ["t5", "t8"],
        ),
        (
            "n6",
            "Spaced Repetition",
            "Using spaced repetition systems like Anki for long-term retention. Connects to [[Python Async Patterns]] (I wrote a script for it) and [[Learning How to Learn]].",
            "study",
            ["t6", "t1"],
        ),
        (
            "n7",
            "Learning How to Learn",
            "Barbara Oakley's course on focused vs diffuse thinking. Apply with [[Spaced Repetition]] for best results. Keep a [[Daily Journaling]] log of insights.",
            "study",
            ["t6", "t4"],
        ),
        (
            "n8",
            "Health Habits",
            "Sleep, exercise, and nutrition form the foundation. Without [[Health Habits]], both [[Mindfulness Practice]] and productivity suffer.",
            "life",
            ["t8", "t4"],
        ),
    ]

    for nid, title, content, _, tag_ids in note_data:
        summary = content[:100]
        await db.execute(
            "INSERT INTO notes (id, title, content, summary) VALUES (?, ?, ?, ?)",
            (nid, title, content, summary),
        )
        for tid in tag_ids:
            await db.execute(
                "INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)",
                (nid, tid),
            )

    import re

    wiki = re.compile(r"\[\[(.+?)\]\]")
    for nid, title, content, _, _ in note_data:
        refs = wiki.findall(content)
        for ref_title in refs:
            cursor = await db.execute("SELECT id FROM notes WHERE title = ?", (ref_title,))
            target = await cursor.fetchone()
            if target and target["id"] != nid:
                await db.execute(
                    "INSERT OR IGNORE INTO link_relations (source_id, target_id, type) VALUES (?, ?, 'reference')",
                    (nid, target["id"]),
                )

    await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed()
    yield
    await close_db()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router)
app.include_router(graph.router)
app.include_router(search.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
