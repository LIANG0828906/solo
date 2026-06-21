import sqlite3
import secrets
import string
from typing import List, Optional, Dict, Any
from datetime import datetime
from database import DB_PATH

def generate_short_id(length: int = 8) -> str:
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_poll(title: str, description: Optional[str], options: List[str], 
                creator_device_id: str, is_multiple_choice: bool = False) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    poll_id = generate_short_id()
    created_at = datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO polls (id, title, description, creator_device_id, created_at, is_multiple_choice) VALUES (?, ?, ?, ?, ?, ?)",
        (poll_id, title, description, creator_device_id, created_at, 1 if is_multiple_choice else 0)
    )
    
    for option_text in options:
        cursor.execute(
            "INSERT INTO poll_options (poll_id, option_text, votes) VALUES (?, ?, 0)",
            (poll_id, option_text)
        )
    
    conn.commit()
    conn.close()
    
    return get_poll(poll_id)

def get_poll(poll_id: str) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, title, description, creator_device_id, created_at, is_multiple_choice FROM polls WHERE id = ?",
        (poll_id,)
    )
    poll_row = cursor.fetchone()
    
    if not poll_row:
        conn.close()
        return None
    
    cursor.execute(
        "SELECT id, option_text, votes FROM poll_options WHERE poll_id = ? ORDER BY id",
        (poll_id,)
    )
    option_rows = cursor.fetchall()
    
    conn.close()
    
    total_votes = sum(row[2] for row in option_rows)
    options = [
        {
            "id": row[0],
            "text": row[1],
            "votes": row[2],
            "percentage": round((row[2] / total_votes * 100), 1) if total_votes > 0 else 0
        }
        for row in option_rows
    ]
    
    return {
        "id": poll_row[0],
        "title": poll_row[1],
        "description": poll_row[2],
        "creatorDeviceId": poll_row[3],
        "createdAt": poll_row[4],
        "isMultipleChoice": bool(poll_row[5]),
        "totalVotes": total_votes,
        "options": options
    }

def has_voted(poll_id: str, device_id: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT 1 FROM vote_records WHERE poll_id = ? AND device_id = ?",
        (poll_id, device_id)
    )
    result = cursor.fetchone()
    
    conn.close()
    return result is not None

def add_vote(poll_id: str, option_ids: List[int], device_id: str) -> Optional[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("BEGIN")
        
        if has_voted(poll_id, device_id):
            conn.close()
            return None
        
        for option_id in option_ids:
            cursor.execute(
                "UPDATE poll_options SET votes = votes + 1 WHERE poll_id = ? AND id = ?",
                (poll_id, option_id)
            )
            
            cursor.execute(
                "INSERT INTO vote_records (poll_id, option_id, device_id) VALUES (?, ?, ?)",
                (poll_id, option_id, device_id)
            )
        
        conn.commit()
    except Exception:
        conn.rollback()
        conn.close()
        return None
    
    conn.close()
    return get_poll(poll_id)

def get_polls_by_creator(creator_device_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT id, title, description, created_at, is_multiple_choice FROM polls WHERE creator_device_id = ? ORDER BY created_at DESC LIMIT ?",
        (creator_device_id, limit)
    )
    poll_rows = cursor.fetchall()
    
    polls = []
    for row in poll_rows:
        poll = get_poll(row[0])
        if poll:
            polls.append({
                "id": poll["id"],
                "title": poll["title"],
                "description": poll["description"],
                "createdAt": poll["createdAt"],
                "isMultipleChoice": poll["isMultipleChoice"],
                "totalVotes": poll["totalVotes"],
                "optionsCount": len(poll["options"])
            })
    
    conn.close()
    return polls

def delete_poll(poll_id: str, creator_device_id: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT creator_device_id FROM polls WHERE id = ?",
        (poll_id,)
    )
    result = cursor.fetchone()
    
    if not result or result[0] != creator_device_id:
        conn.close()
        return False
    
    cursor.execute("DELETE FROM vote_records WHERE poll_id = ?", (poll_id,))
    cursor.execute("DELETE FROM poll_options WHERE poll_id = ?", (poll_id,))
    cursor.execute("DELETE FROM polls WHERE id = ?", (poll_id,))
    
    conn.commit()
    conn.close()
    return True
