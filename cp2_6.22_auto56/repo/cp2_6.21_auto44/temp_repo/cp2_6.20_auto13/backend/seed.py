import json
from uuid import uuid4
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from models import User, Recipe, Ingredient, Step, Rating, FavoriteFolder


def seed_data(db: Session):
    existing = db.query(Recipe).first()
    if existing:
        return

    user = User(
        id="demo-user-001",
        email="chef@example.com",
        username="大厨小王",
        password_hash="$2b$12$placeholder_hash",
        avatar="",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    recipes_data = [
        {
            "title": "宫保鸡丁",
            "description": "经典川菜，鸡丁配花生米，麻辣鲜香，下饭神器。",
            "thumbnail": "",
            "prep_time": 15,
            "cook_time": 10,
            "difficulty": "medium",
            "ingredients": [
                {"name": "鸡胸肉", "amount": 300, "unit": "g"},
                {"name": "胡萝卜", "amount": 50, "unit": "g"},
                {"name": "食用油", "amount": 30, "unit": "ml"},
                {"name": "酱油", "amount": 15, "unit": "ml"},
                {"name": "白糖", "amount": 10, "unit": "g"},
                {"name": "大蒜", "amount": 10, "unit": "g"},
                {"name": "生姜", "amount": 10, "unit": "g"},
                {"name": "辣椒粉", "amount": 5, "unit": "g"},
            ],
            "steps": [
                {"title": "切丁腌制", "content": "鸡胸肉切1.5cm小丁，加少许盐、料酒、淀粉腌制15分钟。", "timer_seconds": 900},
                {"title": "调制酱汁", "content": "将酱油、白糖、醋、淀粉水混合调成宫保汁备用。", "timer_seconds": 0},
                {"title": "爆香配料", "content": "热锅凉油，放入干辣椒段和花椒，小火爆出香味。", "timer_seconds": 60},
                {"title": "炒鸡丁", "content": "大火下鸡丁滑炒至变白，加入蒜末姜末翻炒。", "timer_seconds": 120},
                {"title": "收汁出锅", "content": "倒入调好的宫保汁，快速翻炒至汁水包裹鸡丁，撒花生米出锅。", "timer_seconds": 60},
            ],
        },
        {
            "title": "红烧肉",
            "description": "肥而不腻的经典红烧肉，浓油赤酱，入口即化。",
            "thumbnail": "",
            "prep_time": 10,
            "cook_time": 90,
            "difficulty": "hard",
            "ingredients": [
                {"name": "猪肉", "amount": 500, "unit": "g"},
                {"name": "食用油", "amount": 15, "unit": "ml"},
                {"name": "酱油", "amount": 30, "unit": "ml"},
                {"name": "白糖", "amount": 25, "unit": "g"},
                {"name": "生姜", "amount": 15, "unit": "g"},
                {"name": "八角", "amount": 3, "unit": "g"},
                {"name": "桂皮", "amount": 2, "unit": "g"},
            ],
            "steps": [
                {"title": "焯水切块", "content": "五花肉冷水下锅焯水5分钟，捞出切3cm见方的块。", "timer_seconds": 300},
                {"title": "炒糖色", "content": "锅中放少许油和白糖，小火炒至糖融化呈棕红色起泡。", "timer_seconds": 180},
                {"title": "煸炒上色", "content": "放入肉块中火翻炒至每块均匀裹上糖色。", "timer_seconds": 120},
                {"title": "加料炖煮", "content": "加入酱油、姜片、八角、桂皮，加开水没过肉面，大火烧开转小火炖60分钟。", "timer_seconds": 3600},
                {"title": "收汁装盘", "content": "大火收汁至汤汁浓稠，肉块油亮即可出锅。", "timer_seconds": 300},
            ],
        },
        {
            "title": "番茄炒蛋",
            "description": "国民家常菜，酸甜可口，简单快手，人人都爱。",
            "thumbnail": "",
            "prep_time": 5,
            "cook_time": 8,
            "difficulty": "easy",
            "ingredients": [
                {"name": "鸡蛋", "amount": 3, "unit": "个"},
                {"name": "西红柿", "amount": 300, "unit": "g"},
                {"name": "食用油", "amount": 20, "unit": "ml"},
                {"name": "白糖", "amount": 8, "unit": "g"},
            ],
            "steps": [
                {"title": "打蛋", "content": "鸡蛋打散加少许盐搅匀，西红柿切块备用。", "timer_seconds": 0},
                {"title": "炒蛋", "content": "热锅多油，倒入蛋液炒至凝固成块，盛出备用。", "timer_seconds": 90},
                {"title": "炒番茄", "content": "锅中留底油，下西红柿块中火炒至出汁变软。", "timer_seconds": 180},
                {"title": "混合翻炒", "content": "倒入炒好的鸡蛋，加白糖和少许盐，翻炒均匀出锅。", "timer_seconds": 60},
            ],
        },
        {
            "title": "麻婆豆腐",
            "description": "麻辣鲜香嫩烫的经典川菜，嫩豆腐配肉末，饭遭殃。",
            "thumbnail": "",
            "prep_time": 10,
            "cook_time": 12,
            "difficulty": "medium",
            "ingredients": [
                {"name": "豆腐", "amount": 400, "unit": "g"},
                {"name": "猪肉", "amount": 100, "unit": "g"},
                {"name": "食用油", "amount": 25, "unit": "ml"},
                {"name": "酱油", "amount": 10, "unit": "ml"},
                {"name": "辣椒粉", "amount": 8, "unit": "g"},
                {"name": "大蒜", "amount": 10, "unit": "g"},
                {"name": "生姜", "amount": 8, "unit": "g"},
            ],
            "steps": [
                {"title": "切豆腐", "content": "嫩豆腐切2cm方块，入淡盐水中焯烫1分钟沥干。", "timer_seconds": 60},
                {"title": "炒肉末", "content": "热锅下油，放入猪肉末炒至变色出油。", "timer_seconds": 120},
                {"title": "加调料", "content": "加入辣椒粉、蒜末、姜末、豆瓣酱炒出红油。", "timer_seconds": 60},
                {"title": "炖豆腐", "content": "加入适量水，放入豆腐块中火炖5分钟入味。", "timer_seconds": 300},
                {"title": "勾芡出锅", "content": "水淀粉勾芡，轻推豆腐使芡汁包裹均匀，撒花椒粉出锅。", "timer_seconds": 30},
            ],
        },
        {
            "title": "蛋炒饭",
            "description": "最简单的美味，粒粒分明，蛋香四溢。",
            "thumbnail": "",
            "prep_time": 3,
            "cook_time": 5,
            "difficulty": "easy",
            "ingredients": [
                {"name": "米饭", "amount": 300, "unit": "g"},
                {"name": "鸡蛋", "amount": 2, "unit": "个"},
                {"name": "食用油", "amount": 15, "unit": "ml"},
                {"name": "酱油", "amount": 5, "unit": "ml"},
                {"name": "洋葱", "amount": 30, "unit": "g"},
            ],
            "steps": [
                {"title": "备料", "content": "隔夜米饭打散，鸡蛋打散，洋葱切小丁。", "timer_seconds": 0},
                {"title": "炒蛋", "content": "热锅下油，倒入蛋液快速炒散，盛出备用。", "timer_seconds": 60},
                {"title": "炒饭", "content": "锅中再加少许油，下洋葱丁炒香，倒入米饭大火翻炒。", "timer_seconds": 120},
                {"title": "调味出锅", "content": "倒入炒好的鸡蛋，淋酱油，大火翻炒均匀出锅。", "timer_seconds": 60},
            ],
        },
        {
            "title": "红烧牛肉面",
            "description": "浓郁醇厚的红烧牛肉面，大块牛肉配筋道面条，冬日暖心。",
            "thumbnail": "",
            "prep_time": 15,
            "cook_time": 120,
            "difficulty": "hard",
            "ingredients": [
                {"name": "牛肉", "amount": 400, "unit": "g"},
                {"name": "面条", "amount": 200, "unit": "g"},
                {"name": "食用油", "amount": 15, "unit": "ml"},
                {"name": "酱油", "amount": 30, "unit": "ml"},
                {"name": "八角", "amount": 3, "unit": "g"},
                {"name": "桂皮", "amount": 2, "unit": "g"},
                {"name": "生姜", "amount": 15, "unit": "g"},
                {"name": "白菜", "amount": 100, "unit": "g"},
            ],
            "steps": [
                {"title": "焯水切块", "content": "牛肉冷水下锅焯水去血沫，捞出切大块。", "timer_seconds": 300},
                {"title": "爆香调料", "content": "热锅下油，放入姜片、八角、桂皮爆出香味。", "timer_seconds": 60},
                {"title": "炖牛肉", "content": "放入牛肉块翻炒上色，加酱油和开水，大火烧开转小火炖90分钟。", "timer_seconds": 5400},
                {"title": "煮面", "content": "另起锅烧水，水开下面条煮至筋道，白菜烫熟。", "timer_seconds": 180},
                {"title": "装碗", "content": "面条盛入碗中，浇上牛肉汤和牛肉块，摆上白菜即可。", "timer_seconds": 0},
            ],
        },
    ]

    for rdata in recipes_data:
        recipe_id = str(uuid4())
        recipe = Recipe(
            id=recipe_id,
            title=rdata["title"],
            description=rdata["description"],
            thumbnail=rdata["thumbnail"],
            images_json="[]",
            prep_time=rdata["prep_time"],
            cook_time=rdata["cook_time"],
            difficulty=rdata["difficulty"],
            avg_rating=0.0,
            rating_count=0,
            creator_id=user.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(recipe)
        db.flush()

        for idx, ing in enumerate(rdata["ingredients"]):
            db.add(Ingredient(
                id=str(uuid4()),
                recipe_id=recipe_id,
                name=ing["name"],
                amount=ing["amount"],
                unit=ing["unit"],
                order_index=idx,
            ))

        for idx, step in enumerate(rdata["steps"]):
            db.add(Step(
                id=str(uuid4()),
                recipe_id=recipe_id,
                title=step["title"],
                content=step["content"],
                images_json="[]",
                timer_seconds=step.get("timer_seconds", 0),
                order_index=idx,
            ))

        scores = [5, 4, 5, 3, 4, 5, 4, 5]
        for s in scores[: len(rdata["ingredients"])]:
            db.add(Rating(
                id=str(uuid4()),
                recipe_id=recipe_id,
                user_id=user.id,
                score=s,
                created_at=datetime.utcnow(),
            ))

        db.flush()

        result = db.query(
            Rating.recipe_id, func.avg(Rating.score), func.count(Rating.id)
        ).filter(Rating.recipe_id == recipe_id).group_by(Rating.recipe_id).first()
        if result and result[1]:
            recipe.avg_rating = round(result[1], 1)
            recipe.rating_count = result[2]

    folder = FavoriteFolder(
        id=str(uuid4()),
        user_id=user.id,
        name="我的最爱",
        created_at=datetime.utcnow(),
    )
    db.add(folder)

    db.commit()
