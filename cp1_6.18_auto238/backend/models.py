# -*- coding: utf-8 -*-
"""
数据模型模块
定义所有数据模型类和业务方法，包含推荐算法实现
"""

import json
import math
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db

class User:
    """用户模型类"""
    
    def __init__(self, id, email, password_hash, username, avatar, created_at):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.username = username
        self.avatar = avatar
        self.created_at = created_at
    
    def to_dict(self):
        """转换为字典，用于API响应"""
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'avatar': self.avatar,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }
    
    @classmethod
    def create(cls, email, password, username, avatar=''):
        """
        创建新用户
        :param email: 邮箱
        :param password: 明文密码，会自动哈希存储
        :param username: 用户名
        :param avatar: 头像URL，可选
        :return: 创建的用户对象
        """
        db = get_db()
        # 使用Werkzeug的密码哈希函数
        password_hash = generate_password_hash(password)
        
        cursor = db.execute(
            'INSERT INTO users (email, password_hash, username, avatar) VALUES (?, ?, ?, ?)',
            (email, password_hash, username, avatar)
        )
        db.commit()
        
        user_id = cursor.lastrowid
        return cls.get_by_id(user_id)
    
    @classmethod
    def get_by_id(cls, user_id):
        """
        根据ID获取用户
        :param user_id: 用户ID
        :return: 用户对象或None
        """
        db = get_db()
        row = db.execute(
            'SELECT * FROM users WHERE id = ?',
            (user_id,)
        ).fetchone()
        
        if row is None:
            return None
        
        return cls(
            id=row['id'],
            email=row['email'],
            password_hash=row['password_hash'],
            username=row['username'],
            avatar=row['avatar'],
            created_at=row['created_at']
        )
    
    @classmethod
    def get_by_email(cls, email):
        """
        根据邮箱获取用户
        :param email: 邮箱
        :return: 用户对象或None
        """
        db = get_db()
        row = db.execute(
            'SELECT * FROM users WHERE email = ?',
            (email,)
        ).fetchone()
        
        if row is None:
            return None
        
        return cls(
            id=row['id'],
            email=row['email'],
            password_hash=row['password_hash'],
            username=row['username'],
            avatar=row['avatar'],
            created_at=row['created_at']
        )
    
    @classmethod
    def authenticate(cls, email, password):
        """
        用户认证，验证邮箱和密码
        :param email: 邮箱
        :param password: 明文密码
        :return: 认证成功返回用户对象，失败返回None
        """
        user = cls.get_by_email(email)
        
        if user is None:
            return None
        
        # 验证密码哈希
        if check_password_hash(user.password_hash, password):
            return user
        
        return None

class Recipe:
    """食谱模型类"""
    
    def __init__(self, id, title, cover_image, tags, user_id, created_at):
        self.id = id
        self.title = title
        self.cover_image = cover_image
        self.tags = json.loads(tags) if isinstance(tags, str) else tags
        self.user_id = user_id
        self.created_at = created_at
    
    def to_dict(self, current_user_id=None):
        """
        转换为字典，用于API响应
        :param current_user_id: 当前登录用户ID，用于判断是否已收藏
        """
        # 获取用户信息
        user = User.get_by_id(self.user_id)
        # 获取步骤信息
        steps = RecipeStep.get_by_recipe_id(self.id)
        # 获取收藏数
        favorite_count = Favorite.get_recipe_favorite_count(self.id)
        # 获取评论数
        comment_count = Comment.get_recipe_comment_count(self.id)
        # 判断当前用户是否已收藏
        is_favorited = False
        if current_user_id:
            is_favorited = Favorite.is_favorited(current_user_id, self.id)
        
        return {
            'id': self.id,
            'title': self.title,
            'cover_image': self.cover_image,
            'tags': self.tags,
            'steps': [step.to_dict() for step in steps],
            'user_id': self.user_id,
            'user': user.to_dict() if user else None,
            'is_favorited': is_favorited,
            'favorite_count': favorite_count,
            'comment_count': comment_count,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }
    
    @classmethod
    def create(cls, title, cover_image, tags, user_id, steps):
        """
        创建新食谱
        :param title: 标题
        :param cover_image: 封面图片URL
        :param tags: 标签列表
        :param user_id: 用户ID
        :param steps: 步骤列表，每个步骤包含order, description, image
        :return: 创建的食谱对象
        """
        db = get_db()
        # 将标签列表转换为JSON字符串存储
        tags_json = json.dumps(tags, ensure_ascii=False)
        
        cursor = db.execute(
            'INSERT INTO recipes (title, cover_image, tags, user_id) VALUES (?, ?, ?, ?)',
            (title, cover_image, tags_json, user_id)
        )
        db.commit()
        
        recipe_id = cursor.lastrowid
        
        # 创建步骤
        RecipeStep.create_for_recipe(recipe_id, steps)
        
        return cls.get_by_id(recipe_id)
    
    @classmethod
    def get_list(cls, page=1, per_page=20, tag=None, user_id=None):
        """
        获取食谱列表，支持分页和标签筛选
        :param page: 页码，从1开始
        :param per_page: 每页数量
        :param tag: 标签筛选，可选
        :param user_id: 用户ID筛选，可选
        :return: (食谱列表, 总数)
        """
        db = get_db()
        
        # 构建查询条件
        where_clauses = []
        params = []
        
        if tag:
            where_clauses.append('tags LIKE ?')
            params.append(f'%"{tag}"%')
        
        if user_id:
            where_clauses.append('user_id = ?')
            params.append(user_id)
        
        where_sql = 'WHERE ' + ' AND '.join(where_clauses) if where_clauses else ''
        
        # 查询总数
        count_row = db.execute(
            f'SELECT COUNT(*) as count FROM recipes {where_sql}',
            params
        ).fetchone()
        total = count_row['count']
        
        # 分页查询
        offset = (page - 1) * per_page
        rows = db.execute(
            f'SELECT * FROM recipes {where_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?',
            params + [per_page, offset]
        ).fetchall()
        
        recipes = [
            cls(
                id=row['id'],
                title=row['title'],
                cover_image=row['cover_image'],
                tags=row['tags'],
                user_id=row['user_id'],
                created_at=row['created_at']
            )
            for row in rows
        ]
        
        return recipes, total
    
    @classmethod
    def get_by_id(cls, recipe_id):
        """
        根据ID获取食谱
        :param recipe_id: 食谱ID
        :return: 食谱对象或None
        """
        db = get_db()
        row = db.execute(
            'SELECT * FROM recipes WHERE id = ?',
            (recipe_id,)
        ).fetchone()
        
        if row is None:
            return None
        
        return cls(
            id=row['id'],
            title=row['title'],
            cover_image=row['cover_image'],
            tags=row['tags'],
            user_id=row['user_id'],
            created_at=row['created_at']
        )
    
    @classmethod
    def get_recommendations(cls, user_id, limit=8):
        """
        获取推荐食谱
        基于用户收藏标签，使用sigmoid函数归一化权重
        :param user_id: 用户ID
        :param limit: 推荐数量，默认8条
        :return: 推荐食谱列表
        """
        db = get_db()
        
        # 获取用户收藏的所有食谱
        favorites = Favorite.get_user_favorites_raw(user_id)
        
        if not favorites:
            # 如果用户没有收藏，返回最新的食谱
            rows = db.execute(
                'SELECT * FROM recipes ORDER BY created_at DESC LIMIT ?',
                (limit,)
            ).fetchall()
            
            return [
                cls(
                    id=row['id'],
                    title=row['title'],
                    cover_image=row['cover_image'],
                    tags=row['tags'],
                    user_id=row['user_id'],
                    created_at=row['created_at']
                )
                for row in rows
            ]
        
        # 统计标签出现次数
        tag_counts = {}
        for fav in favorites:
            recipe = cls.get_by_id(fav['recipe_id'])
            if recipe:
                for tag in recipe.tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        if not tag_counts:
            # 如果收藏的食谱没有标签，返回最新的食谱
            rows = db.execute(
                'SELECT * FROM recipes ORDER BY created_at DESC LIMIT ?',
                (limit,)
            ).fetchall()
            
            return [
                cls(
                    id=row['id'],
                    title=row['title'],
                    cover_image=row['cover_image'],
                    tags=row['tags'],
                    user_id=row['user_id'],
                    created_at=row['created_at']
                )
                for row in rows
            ]
        
        # 使用Sigmoid函数归一化权重
        # weight = 1 / (1 + e^(-count/5))
        tag_weights = {}
        for tag, count in tag_counts.items():
            weight = 1 / (1 + math.exp(-count / 5))
            tag_weights[tag] = weight
        
        # 按权重降序排列标签
        sorted_tags = sorted(tag_weights.items(), key=lambda x: x[1], reverse=True)
        
        # 从每个高权重标签中选取最新食谱，确保标签多样性
        recommended_recipes = []
        used_recipe_ids = set()
        used_tags = set()
        
        for tag, weight in sorted_tags:
            # 跳过已使用的标签（确保不同标签）
            if tag in used_tags:
                continue
            
            # 查询该标签下用户未收藏的最新食谱
            rows = db.execute(
                '''
                SELECT r.* FROM recipes r
                WHERE r.tags LIKE ? 
                AND r.id NOT IN (
                    SELECT recipe_id FROM favorites WHERE user_id = ?
                )
                AND r.id NOT IN ({})
                ORDER BY r.created_at DESC
                LIMIT 1
                '''.format(','.join('?' * len(used_recipe_ids)) if used_recipe_ids else '-1'),
                [f'%"{tag}"%', user_id] + list(used_recipe_ids)
            ).fetchall()
            
            for row in rows:
                if row['id'] not in used_recipe_ids:
                    recommended_recipes.append(
                        cls(
                            id=row['id'],
                            title=row['title'],
                            cover_image=row['cover_image'],
                            tags=row['tags'],
                            user_id=row['user_id'],
                            created_at=row['created_at']
                        )
                    )
                    used_recipe_ids.add(row['id'])
                    used_tags.add(tag)
                    
                    if len(recommended_recipes) >= limit:
                        break
            
            if len(recommended_recipes) >= limit:
                break
        
        # 如果推荐数量不足，补充最新的其他食谱
        if len(recommended_recipes) < limit:
            remaining = limit - len(recommended_recipes)
            rows = db.execute(
                '''
                SELECT * FROM recipes 
                WHERE id NOT IN ({})
                AND id NOT IN (
                    SELECT recipe_id FROM favorites WHERE user_id = ?
                )
                ORDER BY created_at DESC
                LIMIT ?
                '''.format(','.join('?' * len(used_recipe_ids)) if used_recipe_ids else '-1'),
                list(used_recipe_ids) + [user_id, remaining]
            ).fetchall()
            
            for row in rows:
                recommended_recipes.append(
                    cls(
                        id=row['id'],
                        title=row['title'],
                        cover_image=row['cover_image'],
                        tags=row['tags'],
                        user_id=row['user_id'],
                        created_at=row['created_at']
                    )
                )
        
        return recommended_recipes

class RecipeStep:
    """食谱步骤模型类"""
    
    def __init__(self, id, recipe_id, step_order, description, image):
        self.id = id
        self.recipe_id = recipe_id
        self.step_order = step_order
        self.description = description
        self.image = image
    
    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'order': self.step_order,
            'description': self.description,
            'image': self.image
        }
    
    @classmethod
    def create_for_recipe(cls, recipe_id, steps):
        """
        为食谱创建多个步骤
        :param recipe_id: 食谱ID
        :param steps: 步骤列表，每个步骤包含order, description, image
        """
        db = get_db()
        
        for step in steps:
            db.execute(
                'INSERT INTO recipe_steps (recipe_id, step_order, description, image) VALUES (?, ?, ?, ?)',
                (recipe_id, step['order'], step['description'], step.get('image', ''))
            )
        
        db.commit()
    
    @classmethod
    def get_by_recipe_id(cls, recipe_id):
        """
        根据食谱ID获取所有步骤，按顺序排列
        :param recipe_id: 食谱ID
        :return: 步骤列表
        """
        db = get_db()
        rows = db.execute(
            'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order ASC',
            (recipe_id,)
        ).fetchall()
        
        return [
            cls(
                id=row['id'],
                recipe_id=row['recipe_id'],
                step_order=row['step_order'],
                description=row['description'],
                image=row['image']
            )
            for row in rows
        ]

class Favorite:
    """收藏模型类"""
    
    def __init__(self, id, user_id, recipe_id, created_at):
        self.id = id
        self.user_id = user_id
        self.recipe_id = recipe_id
        self.created_at = created_at
    
    @classmethod
    def toggle(cls, user_id, recipe_id):
        """
        切换收藏状态
        :param user_id: 用户ID
        :param recipe_id: 食谱ID
        :return: (是否操作成功, 当前是否收藏)
        """
        db = get_db()
        
        # 检查是否已收藏
        existing = db.execute(
            'SELECT * FROM favorites WHERE user_id = ? AND recipe_id = ?',
            (user_id, recipe_id)
        ).fetchone()
        
        if existing:
            # 已收藏，取消收藏
            db.execute(
                'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
                (user_id, recipe_id)
            )
            db.commit()
            return True, False
        else:
            # 未收藏，添加收藏
            try:
                db.execute(
                    'INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)',
                    (user_id, recipe_id)
                )
                db.commit()
                return True, True
            except:
                # 唯一约束冲突，返回失败
                return False, False
    
    @classmethod
    def get_user_favorites(cls, user_id, page=1, per_page=20):
        """
        获取用户收藏的食谱列表
        :param user_id: 用户ID
        :param page: 页码
        :param per_page: 每页数量
        :return: (食谱列表, 总数)
        """
        db = get_db()
        
        # 查询总数
        count_row = db.execute(
            '''
            SELECT COUNT(*) as count FROM favorites f
            JOIN recipes r ON f.recipe_id = r.id
            WHERE f.user_id = ?
            ''',
            (user_id,)
        ).fetchone()
        total = count_row['count']
        
        # 分页查询
        offset = (page - 1) * per_page
        rows = db.execute(
            '''
            SELECT r.* FROM favorites f
            JOIN recipes r ON f.recipe_id = r.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
            ''',
            (user_id, per_page, offset)
        ).fetchall()
        
        recipes = [
            Recipe(
                id=row['id'],
                title=row['title'],
                cover_image=row['cover_image'],
                tags=row['tags'],
                user_id=row['user_id'],
                created_at=row['created_at']
            )
            for row in rows
        ]
        
        return recipes, total
    
    @classmethod
    def get_user_favorites_raw(cls, user_id):
        """
        获取用户收藏的原始记录（用于推荐算法）
        :param user_id: 用户ID
        :return: 收藏记录列表
        """
        db = get_db()
        rows = db.execute(
            'SELECT * FROM favorites WHERE user_id = ?',
            (user_id,)
        ).fetchall()
        return rows
    
    @classmethod
    def is_favorited(cls, user_id, recipe_id):
        """
        检查用户是否已收藏某食谱
        :param user_id: 用户ID
        :param recipe_id: 食谱ID
        :return: 是否已收藏
        """
        db = get_db()
        row = db.execute(
            'SELECT * FROM favorites WHERE user_id = ? AND recipe_id = ?',
            (user_id, recipe_id)
        ).fetchone()
        return row is not None
    
    @classmethod
    def get_recipe_favorite_count(cls, recipe_id):
        """
        获取食谱的收藏数
        :param recipe_id: 食谱ID
        :return: 收藏数
        """
        db = get_db()
        row = db.execute(
            'SELECT COUNT(*) as count FROM favorites WHERE recipe_id = ?',
            (recipe_id,)
        ).fetchone()
        return row['count']

class Comment:
    """评论模型类"""
    
    def __init__(self, id, user_id, recipe_id, content, created_at):
        self.id = id
        self.user_id = user_id
        self.recipe_id = recipe_id
        self.content = content
        self.created_at = created_at
    
    def to_dict(self):
        """转换为字典"""
        user = User.get_by_id(self.user_id)
        return {
            'id': self.id,
            'content': self.content,
            'user_id': self.user_id,
            'user': user.to_dict() if user else None,
            'recipe_id': self.recipe_id,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }
    
    @classmethod
    def create(cls, user_id, recipe_id, content):
        """
        创建评论
        :param user_id: 用户ID
        :param recipe_id: 食谱ID
        :param content: 评论内容
        :return: 创建的评论对象
        """
        db = get_db()
        cursor = db.execute(
            'INSERT INTO comments (user_id, recipe_id, content) VALUES (?, ?, ?)',
            (user_id, recipe_id, content)
        )
        db.commit()
        
        comment_id = cursor.lastrowid
        return cls.get_by_id(comment_id)
    
    @classmethod
    def get_by_id(cls, comment_id):
        """
        根据ID获取评论
        :param comment_id: 评论ID
        :return: 评论对象或None
        """
        db = get_db()
        row = db.execute(
            'SELECT * FROM comments WHERE id = ?',
            (comment_id,)
        ).fetchone()
        
        if row is None:
            return None
        
        return cls(
            id=row['id'],
            user_id=row['user_id'],
            recipe_id=row['recipe_id'],
            content=row['content'],
            created_at=row['created_at']
        )
    
    @classmethod
    def get_by_recipe_id(cls, recipe_id, page=1, per_page=20):
        """
        获取食谱的评论列表，按时间倒序排列
        :param recipe_id: 食谱ID
        :param page: 页码
        :param per_page: 每页数量
        :return: (评论列表, 总数)
        """
        db = get_db()
        
        # 查询总数
        count_row = db.execute(
            'SELECT COUNT(*) as count FROM comments WHERE recipe_id = ?',
            (recipe_id,)
        ).fetchone()
        total = count_row['count']
        
        # 分页查询
        offset = (page - 1) * per_page
        rows = db.execute(
            'SELECT * FROM comments WHERE recipe_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            (recipe_id, per_page, offset)
        ).fetchall()
        
        comments = [
            cls(
                id=row['id'],
                user_id=row['user_id'],
                recipe_id=row['recipe_id'],
                content=row['content'],
                created_at=row['created_at']
            )
            for row in rows
        ]
        
        return comments, total
    
    @classmethod
    def get_recipe_comment_count(cls, recipe_id):
        """
        获取食谱的评论数
        :param recipe_id: 食谱ID
        :return: 评论数
        """
        db = get_db()
        row = db.execute(
            'SELECT COUNT(*) as count FROM comments WHERE recipe_id = ?',
            (recipe_id,)
        ).fetchone()
        return row['count']
