import sqlite3
import json
from datetime import datetime
from typing import Optional, List

DB_PATH = "history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Audit & Generation History
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT,
            type TEXT,
            prompt_or_filename TEXT,
            report_json TEXT,
            created_at TIMESTAMP
        )
    ''')
    # User Progress (XP, Level)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_progress (
            wallet_address TEXT PRIMARY KEY,
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            badges TEXT DEFAULT '[]',
            created_at TIMESTAMP
        )
    ''')
    # Learning Tasks
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS learning_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_address TEXT,
            title TEXT,
            description TEXT,
            concepts TEXT,
            difficulty TEXT,
            status TEXT DEFAULT 'pending',
            feedback TEXT,
            created_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def save_history(wallet_address: str, record_type: str, prompt_or_filename: str, report_data: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (wallet_address, type, prompt_or_filename, report_json, created_at) VALUES (?, ?, ?, ?, ?)",
        (wallet_address.lower(), record_type, prompt_or_filename, json.dumps(report_data), datetime.now())
    )
    conn.commit()
    conn.close()

def get_history(wallet_address: str) -> List[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, type, prompt_or_filename, created_at FROM history WHERE wallet_address = ? ORDER BY created_at DESC",
        (wallet_address.lower(),)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [{"id": r[0], "type": r[1], "title": r[2], "created_at": r[3]} for r in rows]

def get_history_detail(history_id: int) -> Optional[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history WHERE id = ?", (history_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row[0],
            "wallet_address": row[1],
            "type": row[2],
            "title": row[3],
            "report": json.loads(row[4]),
            "created_at": row[5]
        }
    return None

def delete_history(history_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM history WHERE id = ?", (history_id,))
    conn.commit()
    conn.close()

# --- Learning Platform Functions ---

def get_user_progress(wallet_address: str) -> dict:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT xp, level, badges FROM user_progress WHERE wallet_address = ?", (wallet_address.lower(),))
    row = cursor.fetchone()
    
    if not row:
        # Initialize user
        cursor.execute(
            "INSERT INTO user_progress (wallet_address, xp, level, badges, created_at) VALUES (?, ?, ?, ?, ?)",
            (wallet_address.lower(), 0, 1, '[]', datetime.now())
        )
        conn.commit()
        conn.close()
        return {"xp": 0, "level": 1, "badges": []}
    
    conn.close()
    return {"xp": row[0], "level": row[1], "badges": json.loads(row[2])}

def get_active_tasks(wallet_address: str) -> List[dict]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, description, concepts, difficulty, status, feedback FROM learning_tasks WHERE wallet_address = ? AND status = 'pending'",
        (wallet_address.lower(),)
    )
    rows = cursor.fetchall()
    conn.close()
    
    return [{
        "id": r[0],
        "title": r[1],
        "description": r[2],
        "concepts": r[3],
        "difficulty": r[4],
        "status": r[5],
        "feedback": r[6]
    } for r in rows]

def save_tasks(wallet_address: str, tasks: List[dict]):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now()
    for task in tasks:
        cursor.execute(
            "INSERT INTO learning_tasks (wallet_address, title, description, concepts, difficulty, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                wallet_address.lower(), 
                task.get('title', 'Untitled Task'), 
                task.get('description', 'No description'), 
                json.dumps(task.get('concepts', [])), 
                task.get('difficulty', 'Unknown'), 
                now
            )
        )
    conn.commit()
    conn.close()

def update_task_status(task_id: int, status: str, feedback: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if feedback:
        cursor.execute("UPDATE learning_tasks SET status = ?, feedback = ? WHERE id = ?", (status, feedback, task_id))
    else:
        cursor.execute("UPDATE learning_tasks SET status = ? WHERE id = ?", (status, task_id))
    
    if status == 'solved':
        # Get wallet address and difficulty to reward XP
        cursor.execute("SELECT wallet_address, difficulty FROM learning_tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if row:
            wallet_addr = row[0]
            diff = row[1].lower()
            xp_reward = 10 if diff == 'easy' else (25 if diff == 'medium' else 50)
            
            # Update user XP
            cursor.execute("UPDATE user_progress SET xp = xp + ? WHERE wallet_address = ?", (xp_reward, wallet_addr))
            
            # Level up logic (every 100 XP)
            cursor.execute("SELECT xp, level FROM user_progress WHERE wallet_address = ?", (wallet_addr,))
            row_user = cursor.fetchone()
            if row_user:
                xp, current_level = row_user
                new_level = (xp // 100) + 1
                if new_level > current_level:
                    cursor.execute("UPDATE user_progress SET level = ? WHERE wallet_address = ?", (new_level, wallet_addr))
    
    conn.commit()
    conn.close()
