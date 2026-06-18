# -*- coding: utf-8 -*-
"""
数据库连接和初始化模块
负责SQLite数据库的连接管理和表结构创建
"""

import sqlite3
import os
from flask import current_app, g

# 获取数据库文件路径
def get_db_path():
    """获取数据库文件路径，使用instance目录存储数据库"""
    instance_path = current_app.instance_path
    # 确保instance目录存在
    os.makedirs(instance_path, exist_ok=True)
    return os.path.join(instance_path, 'cooking_journal.db')

def get_db():
    """
    获取数据库连接
    使用Flask的g对象存储连接，确保每个请求只创建一个连接
    """
    # 检查g对象中是否已有数据库连接
    if 'db' not in g:
        # 创建新的数据库连接
        g.db = sqlite3.connect(
            get_db_path(),
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        # 设置行工厂，使查询结果可以通过列名访问
        g.db.row_factory = sqlite3.Row
        # 启用外键约束
        g.db.execute('PRAGMA foreign_keys = ON')
    
    return g.db

def close_db(e=None):
    """
    关闭数据库连接
    在请求结束时自动调用
    """
    db = g.pop('db', None)
    
    if db is not None:
        db.close()

def init_db():
    """
    初始化数据库，创建所有表和索引
    参考技术架构文档中的DDL设计
    """
    db = get_db()
    
    # 创建用户表
    db.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            username VARCHAR(50) NOT NULL,
            avatar VARCHAR(500) DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建食谱表
    db.execute('''
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title VARCHAR(255) NOT NULL,
            cover_image VARCHAR(500) NOT NULL,
            tags TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # 创建食谱步骤表
    db.execute('''
        CREATE TABLE IF NOT EXISTS recipe_steps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER NOT NULL,
            step_order INTEGER NOT NULL,
            description TEXT NOT NULL,
            image VARCHAR(500) DEFAULT '',
            FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建收藏表
    db.execute('''
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recipe_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, recipe_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建评论表
    db.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recipe_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建索引
    db.execute('CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id)')
    db.execute('CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)')
    
    # 提交事务
    db.commit()
