import aiosqlite
import bcrypt

DB_PATH = "gallery.db"

CREATE_WORKS_TABLE = """
CREATE TABLE IF NOT EXISTS works (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    uploader TEXT NOT NULL,
    uploader_email TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('image', 'video')),
    thumbnail_url TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'published', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reject_reason TEXT
)
"""

CREATE_ADMINS_TABLE = """
CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL
)
"""


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CREATE_WORKS_TABLE)
        await db.execute(CREATE_ADMINS_TABLE)
        cursor = await db.execute("SELECT COUNT(*) FROM admins WHERE username = ?", ("admin",))
        row = await cursor.fetchone()
        if row[0] == 0:
            import uuid
            hashed = hash_password("admin123")
            await db.execute(
                "INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)",
                (str(uuid.uuid4()), "admin", hashed)
            )
        await db.commit()


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
