from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import hashlib
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect('recipes.db')
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    conn = sqlite3.connect('recipes.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  avatar TEXT,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS recipes
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  cover_image TEXT,
                  cook_time INTEGER,
                  author_id INTEGER,
                  author_name TEXT,
                  is_public INTEGER DEFAULT 1,
                  likes INTEGER DEFAULT 0,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (author_id) REFERENCES users(id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS ingredients
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  recipe_id INTEGER,
                  name TEXT NOT NULL,
                  amount TEXT,
                  sort_order INTEGER DEFAULT 0,
                  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS steps
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  recipe_id INTEGER,
                  description TEXT NOT NULL,
                  image TEXT,
                  sort_order INTEGER DEFAULT 0,
                  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS tags
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS recipe_tags
                 (recipe_id INTEGER,
                  tag_id INTEGER,
                  PRIMARY KEY (recipe_id, tag_id),
                  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
                  FOREIGN KEY (tag_id) REFERENCES tags(id))''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS likes
                 (user_id INTEGER,
                  recipe_id INTEGER,
                  PRIMARY KEY (user_id, recipe_id),
                  FOREIGN KEY (user_id) REFERENCES users(id),
                  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS favorites
                 (user_id INTEGER,
                  recipe_id INTEGER,
                  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (user_id, recipe_id),
                  FOREIGN KEY (user_id) REFERENCES users(id),
                  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE)''')
    
    default_tags = ['中式', '西式', '烘焙', '素食', '甜点', '快手菜', '汤品', '主食']
    for tag in default_tags:
        c.execute('INSERT OR IGNORE INTO tags (name) VALUES (?)', (tag,))
    
    c.execute("SELECT COUNT(*) as count FROM users")
    if c.fetchone()['count'] == 0:
        hashed_pw = hashlib.md5('password123'.encode()).hexdigest()
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', ('demo_user', hashed_pw))
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', ('chef_wang', hashed_pw))
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', ('baker_li', hashed_pw))
    
    conn.commit()
    conn.close()

init_db()

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    avatar: Optional[str] = None

class IngredientCreate(BaseModel):
    name: str
    amount: str = ""
    sort_order: int = 0

class StepCreate(BaseModel):
    description: str
    image: Optional[str] = None
    sort_order: int = 0

class RecipeCreate(BaseModel):
    title: str
    description: str = ""
    cover_image: str = ""
    cook_time: int = 0
    is_public: bool = True
    ingredients: List[IngredientCreate] = []
    steps: List[StepCreate] = []
    tags: List[str] = []

class RecipeResponse(BaseModel):
    id: int
    title: str
    description: str
    cover_image: Optional[str]
    cook_time: int
    author_id: int
    author_name: str
    is_public: bool
    likes: int
    is_liked: bool = False
    is_favorited: bool = False
    created_at: str
    ingredients: List[dict] = []
    steps: List[dict] = []
    tags: List[str] = []

@app.get("/api/recipes")
def get_recipes(user_id: Optional[int] = None, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('''SELECT r.*, 
                 GROUP_CONCAT(t.name) as tag_names
                 FROM recipes r
                 LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
                 LEFT JOIN tags t ON rt.tag_id = t.id
                 WHERE r.is_public = 1
                 GROUP BY r.id
                 ORDER BY r.created_at DESC''')
    rows = c.fetchall()
    
    recipes = []
    for row in rows:
        recipe = dict(row)
        recipe['is_public'] = bool(recipe['is_public'])
        recipe['tags'] = recipe['tag_names'].split(',') if recipe['tag_names'] else []
        recipe.pop('tag_names', None)
        
        if user_id:
            c.execute('SELECT 1 FROM likes WHERE user_id = ? AND recipe_id = ?', (user_id, recipe['id']))
            recipe['is_liked'] = c.fetchone() is not None
            
            c.execute('SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?', (user_id, recipe['id']))
            recipe['is_favorited'] = c.fetchone() is not None
        else:
            recipe['is_liked'] = False
            recipe['is_favorited'] = False
        
        recipes.append(recipe)
    
    return recipes

@app.get("/api/recipes/search")
def search_recipes(
    q: Optional[str] = None,
    tag: Optional[str] = None,
    cook_time: Optional[str] = None,
    author: Optional[str] = None,
    user_id: Optional[int] = None,
    db: sqlite3.Connection = Depends(get_db)
):
    c = db.cursor()
    query = '''SELECT DISTINCT r.* FROM recipes r
               LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
               LEFT JOIN tags t ON rt.tag_id = t.id
               LEFT JOIN ingredients i ON r.id = i.recipe_id
               WHERE r.is_public = 1'''
    params = []
    
    if q:
        query += ''' AND (r.title LIKE ? OR r.description LIKE ? OR i.name LIKE ? OR t.name LIKE ?)'''
        like_q = f'%{q}%'
        params.extend([like_q, like_q, like_q, like_q])
    
    if tag:
        query += ' AND t.name = ?'
        params.append(tag)
    
    if author:
        query += ' AND r.author_name LIKE ?'
        params.append(f'%{author}%')
    
    if cook_time:
        if cook_time == 'fast':
            query += ' AND r.cook_time < 15'
        elif cook_time == 'medium':
            query += ' AND r.cook_time >= 15 AND r.cook_time <= 30'
        elif cook_time == 'slow':
            query += ' AND r.cook_time > 30'
    
    query += ' ORDER BY r.created_at DESC'
    
    c.execute(query, params)
    rows = c.fetchall()
    
    recipes = []
    for row in rows:
        recipe = dict(row)
        recipe['is_public'] = bool(recipe['is_public'])
        
        c.execute('SELECT name FROM tags t JOIN recipe_tags rt ON t.id = rt.tag_id WHERE rt.recipe_id = ?', (recipe['id'],))
        recipe['tags'] = [r['name'] for r in c.fetchall()]
        
        if user_id:
            c.execute('SELECT 1 FROM likes WHERE user_id = ? AND recipe_id = ?', (user_id, recipe['id']))
            recipe['is_liked'] = c.fetchone() is not None
            
            c.execute('SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?', (user_id, recipe['id']))
            recipe['is_favorited'] = c.fetchone() is not None
        else:
            recipe['is_liked'] = False
            recipe['is_favorited'] = False
        
        recipes.append(recipe)
    
    return recipes

@app.get("/api/recipes/{recipe_id}")
def get_recipe(recipe_id: int, user_id: Optional[int] = None, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    row = c.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    recipe = dict(row)
    recipe['is_public'] = bool(recipe['is_public'])
    
    c.execute('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order, id', (recipe_id,))
    recipe['ingredients'] = [dict(r) for r in c.fetchall()]
    
    c.execute('SELECT * FROM steps WHERE recipe_id = ? ORDER BY sort_order, id', (recipe_id,))
    recipe['steps'] = [dict(r) for r in c.fetchall()]
    
    c.execute('SELECT name FROM tags t JOIN recipe_tags rt ON t.id = rt.tag_id WHERE rt.recipe_id = ?', (recipe_id,))
    recipe['tags'] = [r['name'] for r in c.fetchall()]
    
    if user_id:
        c.execute('SELECT 1 FROM likes WHERE user_id = ? AND recipe_id = ?', (user_id, recipe_id))
        recipe['is_liked'] = c.fetchone() is not None
        
        c.execute('SELECT 1 FROM favorites WHERE user_id = ? AND recipe_id = ?', (user_id, recipe_id))
        recipe['is_favorited'] = c.fetchone() is not None
    else:
        recipe['is_liked'] = False
        recipe['is_favorited'] = False
    
    return recipe

@app.post("/api/recipes")
def create_recipe(recipe: RecipeCreate, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    
    author_name = "匿名用户"
    c.execute('SELECT username FROM users WHERE id = ?', (1,))
    row = c.fetchone()
    if row:
        author_name = row['username']
    
    c.execute('''INSERT INTO recipes (title, description, cover_image, cook_time, author_id, author_name, is_public)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (recipe.title, recipe.description, recipe.cover_image, recipe.cook_time,
               1, author_name, 1 if recipe.is_public else 0))
    recipe_id = c.lastrowid
    
    for idx, ing in enumerate(recipe.ingredients):
        c.execute('INSERT INTO ingredients (recipe_id, name, amount, sort_order) VALUES (?, ?, ?, ?)',
                  (recipe_id, ing.name, ing.amount, idx))
    
    for idx, step in enumerate(recipe.steps):
        c.execute('INSERT INTO steps (recipe_id, description, image, sort_order) VALUES (?, ?, ?, ?)',
                  (recipe_id, step.description, step.image, idx))
    
    for tag_name in recipe.tags:
        c.execute('INSERT OR IGNORE INTO tags (name) VALUES (?)', (tag_name,))
        c.execute('SELECT id FROM tags WHERE name = ?', (tag_name,))
        tag_id = c.fetchone()['id']
        c.execute('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
                  (recipe_id, tag_id))
    
    db.commit()
    return {"id": recipe_id, "message": "Recipe created successfully"}

@app.put("/api/recipes/{recipe_id}")
def update_recipe(recipe_id: int, recipe: RecipeCreate, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    
    c.execute('SELECT * FROM recipes WHERE id = ?', (recipe_id,))
    if not c.fetchone():
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    c.execute('''UPDATE recipes SET title=?, description=?, cover_image=?, cook_time=?, is_public=?, updated_at=CURRENT_TIMESTAMP
                 WHERE id=?''',
              (recipe.title, recipe.description, recipe.cover_image, recipe.cook_time,
               1 if recipe.is_public else 0, recipe_id))
    
    c.execute('DELETE FROM ingredients WHERE recipe_id = ?', (recipe_id,))
    for idx, ing in enumerate(recipe.ingredients):
        c.execute('INSERT INTO ingredients (recipe_id, name, amount, sort_order) VALUES (?, ?, ?, ?)',
                  (recipe_id, ing.name, ing.amount, idx))
    
    c.execute('DELETE FROM steps WHERE recipe_id = ?', (recipe_id,))
    for idx, step in enumerate(recipe.steps):
        c.execute('INSERT INTO steps (recipe_id, description, image, sort_order) VALUES (?, ?, ?, ?)',
                  (recipe_id, step.description, step.image, idx))
    
    c.execute('DELETE FROM recipe_tags WHERE recipe_id = ?', (recipe_id,))
    for tag_name in recipe.tags:
        c.execute('INSERT OR IGNORE INTO tags (name) VALUES (?)', (tag_name,))
        c.execute('SELECT id FROM tags WHERE name = ?', (tag_name,))
        tag_id = c.fetchone()['id']
        c.execute('INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
                  (recipe_id, tag_id))
    
    db.commit()
    return {"message": "Recipe updated successfully"}

@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('DELETE FROM recipes WHERE id = ?', (recipe_id,))
    if c.rowcount == 0:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.commit()
    return {"message": "Recipe deleted successfully"}

@app.post("/api/recipes/{recipe_id}/like")
def toggle_like(recipe_id: int, user_id: int = 1, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('SELECT * FROM likes WHERE user_id = ? AND recipe_id = ?', (user_id, recipe_id))
    
    if c.fetchone():
        c.execute('DELETE FROM likes WHERE user_id = ? AND recipe_id = ?', (user_id, recipe_id))
        c.execute('UPDATE recipes SET likes = likes - 1 WHERE id = ?', (recipe_id,))
        liked = False
    else:
        c.execute('INSERT INTO likes (user_id, recipe_id) VALUES (?, ?)', (user_id, recipe_id))
        c.execute('UPDATE recipes SET likes = likes + 1 WHERE id = ?', (recipe_id,))
        liked = True
    
    db.commit()
    c.execute('SELECT likes FROM recipes WHERE id = ?', (recipe_id,))
    likes = c.fetchone()['likes']
    return {"liked": liked, "likes": likes}

@app.post("/api/recipes/{recipe_id}/favorite")
def toggle_favorite(recipe_id: int, user_id: int = 1, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('SELECT * FROM favorites WHERE user_id = ? AND recipe_id = ?', (user_id, recipe_id))
    
    if c.fetchone():
        c.execute('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?', (user_id, recipe_id))
        favorited = False
    else:
        c.execute('INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)', (user_id, recipe_id))
        favorited = True
    
    db.commit()
    return {"favorited": favorited}

@app.get("/api/user/favorites")
def get_favorites(user_id: int = 1, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('''SELECT r.* FROM recipes r
                 JOIN favorites f ON r.id = f.recipe_id
                 WHERE f.user_id = ?
                 ORDER BY f.created_at DESC''', (user_id,))
    rows = c.fetchall()
    
    recipes = []
    for row in rows:
        recipe = dict(row)
        recipe['is_public'] = bool(recipe['is_public'])
        recipe['is_favorited'] = True
        
        c.execute('SELECT name FROM tags t JOIN recipe_tags rt ON t.id = rt.tag_id WHERE rt.recipe_id = ?', (recipe['id'],))
        recipe['tags'] = [r['name'] for r in c.fetchall()]
        
        recipes.append(recipe)
    
    return recipes

@app.post("/api/user/login")
def login(user: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    hashed_pw = hashlib.md5(user.password.encode()).hexdigest()
    c.execute('SELECT * FROM users WHERE username = ? AND password = ?', (user.username, hashed_pw))
    row = c.fetchone()
    
    if not row:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    return {
        "id": row['id'],
        "username": row['username'],
        "avatar": row['avatar']
    }

@app.get("/api/tags")
def get_tags(db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute('SELECT name FROM tags ORDER BY name')
    return [row['name'] for row in c.fetchall()]
