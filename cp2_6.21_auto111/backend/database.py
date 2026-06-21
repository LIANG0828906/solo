import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "polls.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS polls (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            creator_device_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_multiple_choice BOOLEAN DEFAULT 0
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS poll_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poll_id TEXT NOT NULL,
            option_text TEXT NOT NULL,
            votes INTEGER DEFAULT 0,
            FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vote_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            poll_id TEXT NOT NULL,
            option_id INTEGER NOT NULL,
            device_id TEXT NOT NULL,
            voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE,
            FOREIGN KEY (option_id) REFERENCES poll_options (id) ON DELETE CASCADE,
            UNIQUE (poll_id, device_id)
        )
    ''')
    
    conn.commit()
    conn.close()
