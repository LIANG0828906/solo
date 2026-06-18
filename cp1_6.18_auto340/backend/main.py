import sqlite3
import json
import uuid
import random
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "recipes.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            image_url TEXT NOT NULL,
            tags TEXT NOT NULL,
            ingredients TEXT NOT NULL,
            steps TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id TEXT PRIMARY KEY,
            recipe_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        )
    """)

    cursor.execute("SELECT COUNT(*) FROM recipes")
    count = cursor.fetchone()[0]

    if count == 0:
        seed_recipes(cursor)

    conn.commit()
    conn.close()


def seed_recipes(cursor):
    image_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

    sample_recipes = [
        {
            "title": "番茄炒蛋",
            "description": "经典家常菜，酸甜可口，简单易做，是每个厨房新手必学的第一道菜。",
            "image_prompt": "delicious Chinese tomato scrambled eggs, bright red tomatoes with yellow fluffy eggs, served on white plate, warm home-style cooking, professional food photography",
            "tags": ["家常", "快手", "下饭菜"],
            "ingredients": [
                "鸡蛋 3个",
                "番茄 2个（约300克）",
                "葱花 适量",
                "盐 1茶匙",
                "白糖 1茶匙",
                "食用油 2汤匙",
                "生抽 少许"
            ],
            "steps": [
                "鸡蛋打散，加少许盐搅拌均匀；番茄顶部划十字，用开水烫一下去皮切小块备用。",
                "锅中倒入1汤匙油，油热后倒入蛋液，大火快速翻炒至半凝固状态盛出。",
                "锅中再添少许油，放入番茄块中火翻炒，用铲子压出番茄汁，炒至变软出沙。",
                "加入白糖和剩余的盐，倒入炒好的鸡蛋快速翻炒均匀，让鸡蛋裹上番茄汁。",
                "撒上葱花，滴几滴生抽提鲜，关火装盘即可。"
            ]
        },
        {
            "title": "红烧肉",
            "description": "肥而不腻，入口即化的经典红烧肉，色泽红亮，甜咸适中，是宴客必备菜品。",
            "image_prompt": "Chinese braised pork belly, glossy caramelized red color, cubed pork in rich sauce, served in ceramic bowl, steam rising, mouth-watering food photography",
            "tags": ["家常", "下饭菜", "经典"],
            "ingredients": [
                "五花肉 500克",
                "冰糖 30克",
                "生抽 2汤匙",
                "老抽 1汤匙",
                "料酒 3汤匙",
                "姜片 5片",
                "八角 2个",
                "桂皮 1小段",
                "香叶 2片",
                "盐 适量"
            ],
            "steps": [
                "五花肉切成3厘米见方的块，冷水下锅加料酒焯水，煮出血沫后捞出冲洗干净沥干。",
                "锅烧热不放油，放入五花肉中小火煸炒，炒出多余油脂至表面微金黄，盛出备用。",
                "锅中留底油，放入冰糖小火慢慢熬化，熬至枣红色冒小泡时立刻倒入五花肉翻炒上色。",
                "加入姜片、八角、桂皮、香叶炒香，倒入料酒、生抽、老抽翻炒均匀。",
                "加入没过肉的开水，大火烧开后转小火炖60分钟。",
                "炖至汤汁剩1/3时，加少许盐调味，开大火收汁至浓稠红亮即可装盘。"
            ]
        },
        {
            "title": "可乐鸡翅",
            "description": "小朋友超爱的甜口鸡翅，做法简单，可乐的焦糖味包裹鲜嫩鸡翅，百吃不厌。",
            "image_prompt": "sweet cola chicken wings, glazed caramel brown, piled up on white plate, sesame seeds sprinkled on top, warm lighting, restaurant quality food photo",
            "tags": ["快手", "家常", "儿童喜爱"],
            "ingredients": [
                "鸡翅中 10个",
                "可乐 1罐（330ml）",
                "生抽 2汤匙",
                "老抽 半汤匙",
                "料酒 2汤匙",
                "姜片 3片",
                "葱段 2段",
                "白芝麻 适量"
            ],
            "steps": [
                "鸡翅洗净，两面各划2刀便于入味；冷水下锅加料酒焯水2分钟，捞出沥干。",
                "锅中放少许油，鸡翅皮朝下中小火煎至两面金黄，煎出多余油脂。",
                "加入姜片葱段爆香，倒入料酒、生抽、老抽翻拌均匀。",
                "倒入整罐可乐，液面与鸡翅持平，大火烧开后转中火焖煮15分钟。",
                "打开锅盖转大火收汁，期间不断翻动鸡翅让其均匀裹上酱汁。",
                "汁收至浓稠挂在鸡翅上时关火，撒上白芝麻点缀即可出锅。"
            ]
        },
        {
            "title": "提拉米苏",
            "description": "经典意式甜点，咖啡与马斯卡彭的完美融合，入口即化，醇香浓郁。",
            "image_prompt": "classic Italian tiramisu dessert, layers of coffee soaked ladyfingers and mascarpone cream, dusted with cocoa powder, served on elegant plate, close-up food photography",
            "tags": ["甜点", "下午茶", "意式"],
            "ingredients": [
                "马斯卡彭奶酪 500克",
                "手指饼干 200克",
                "浓缩咖啡 200ml（冷却）",
                "淡奶油 300ml",
                "蛋黄 4个",
                "细砂糖 80克",
                "可可粉 适量",
                "朗姆酒 1汤匙（可选）"
            ],
            "steps": [
                "蛋黄加糖隔热水打发至颜色变浅浓稠，离开热水继续打发至冷却，形成蓬松的蛋黄糊。",
                "淡奶油打发至7分发（出现纹路但仍可流动状态）备用。",
                "马斯卡彭奶酪用刮刀搅拌顺滑，分两次与蛋黄糊拌匀，再加入打发奶油翻拌均匀。",
                "冷却的浓缩咖啡中可加朗姆酒，手指饼干快速蘸一下咖啡液（不要泡太久）。",
                "取一个容器，底部铺一层蘸了咖啡的手指饼干，倒入一半奶酪糊抹平。",
                "重复铺一层手指饼干和奶酪糊，表面抹平，盖保鲜膜冷藏4小时以上。",
                "食用前筛上厚厚一层可可粉，切块即可享用。"
            ]
        },
        {
            "title": "麻婆豆腐",
            "description": "川味经典，麻辣鲜香嫩烫，豆腐嫩滑入味，配米饭超级下饭。",
            "image_prompt": "Sichuan mapo tofu, spicy red chili oil, silky soft tofu cubes, minced pork, green scallions, steaming hot, authentic Chinese food photography",
            "tags": ["辣", "下饭菜", "川菜"],
            "ingredients": [
                "嫩豆腐 1盒（400克）",
                "猪肉末 100克",
                "郫县豆瓣酱 1汤匙",
                "花椒粉 1茶匙",
                "蒜末 1茶匙",
                "姜末 1茶匙",
                "葱花 适量",
                "生抽 1汤匙",
                "白糖 半茶匙",
                "水淀粉 适量",
                "盐 少许"
            ],
            "steps": [
                "豆腐切成2厘米见方的块，放入加了盐的开水中焯2分钟去豆腥，捞出沥干。",
                "锅中放油烧热，放入肉末炒散变色，加豆瓣酱小火炒出红油。",
                "加入蒜末姜末炒出香味，加一碗水或高汤，放入生抽、白糖调味。",
                "轻轻倒入焯好的豆腐块，用铲子背面轻推均匀，中火煮3-4分钟入味。",
                "分2-3次淋入水淀粉勾芡，每次推匀再加下一次，让汤汁浓稠裹住豆腐。",
                "出锅前撒上花椒粉和葱花，喜欢更辣可再加些辣椒油。"
            ]
        },
        {
            "title": "芝士蛋糕",
            "description": "浓郁细腻的重芝士蛋糕，入口即化，酸甜平衡，是治愈系甜品的代表。",
            "image_prompt": "creamy New York style cheesecake, golden brown crust, rich smooth texture, slice showing layers, berries on top, elegant dessert photography",
            "tags": ["甜点", "芝士", "烘焙"],
            "ingredients": [
                "奶油奶酪 500克（室温）",
                "消化饼干 150克",
                "黄油 70克",
                "淡奶油 200ml",
                "细砂糖 100克",
                "鸡蛋 3个（室温）",
                "玉米淀粉 20克",
                "柠檬汁 1汤匙",
                "香草精 1茶匙"
            ],
            "steps": [
                "消化饼干装袋压碎，与融化的黄油拌匀，铺在6寸蛋糕模底部压实，冷藏备用。",
                "奶油奶酪室温软化后加糖用电动打蛋器打至顺滑无颗粒。",
                "逐个加入鸡蛋，每次完全打匀后再加下一个，避免油水分离。",
                "加入淡奶油、柠檬汁、香草精搅拌均匀，筛入玉米淀粉翻拌至细腻面糊。",
                "蛋糕模底部包2层锡纸防漏水，倒入奶酪糊，表面抹平轻震出气泡。",
                "烤箱预热160°C，采用水浴法（烤盘加水）烘烤60分钟，再焖30分钟取出。",
                "彻底冷却后冷藏4小时以上，脱模切块食用，可搭配果酱或鲜果。"
            ]
        },
        {
            "title": "蒜蓉西兰花",
            "description": "清淡健康的素菜，蒜香浓郁，西兰花翠绿爽脆，减脂期必备。",
            "image_prompt": "garlic broccoli stir-fry, bright green florets, golden garlic bits, glossy vegetable oil, served on white plate, healthy vegetarian food",
            "tags": ["清淡", "快手", "素菜"],
            "ingredients": [
                "西兰花 1颗（约400克）",
                "大蒜 6瓣",
                "盐 半茶匙",
                "白糖 少许",
                "蚝油 1汤匙（可选）",
                "食用油 1汤匙",
                "鸡精 少许（可选）"
            ],
            "steps": [
                "西兰花掰成小朵，用盐水浸泡15分钟去虫卵，流水冲洗干净沥干。",
                "大蒜切末；锅中烧开水，加少许盐和油，放入西兰花焯水1分钟捞出过凉。",
                "热锅放油，小火温油时就放入蒜末慢慢炒香，炒至蒜末微微发黄。",
                "转大火，放入沥干水分的西兰花快速翻炒均匀。",
                "加入盐、少许糖和蚝油（可选），大火翻炒30秒让调料均匀裹住西兰花。",
                "出锅前可加少许鸡精提鲜，保持大火快炒保证西兰花脆嫩。"
            ]
        },
        {
            "title": "三明治早餐",
            "description": "10分钟搞定的元气早餐，营养均衡，多种食材搭配出丰富口感。",
            "image_prompt": "club sandwich breakfast, stacked layers with lettuce tomato egg bacon, cut diagonally, served with fresh orange juice, morning light, cozy brunch photography",
            "tags": ["早餐", "快手", "三明治"],
            "ingredients": [
                "吐司面包 4片",
                "鸡蛋 2个",
                "培根或火腿 2片",
                "生菜叶 2-3片",
                "番茄 1个",
                "芝士片 2片",
                "沙拉酱 适量",
                "盐和黑胡椒 少许",
                "黄油 10克"
            ],
            "steps": [
                "番茄切厚片，生菜洗净沥干水分；吐司片可以用吐司机稍微烤一下更香。",
                "平底锅放少许油，鸡蛋煎成溏心蛋或全熟蛋，撒少许盐和黑胡椒调味。",
                "同锅煎培根或火腿片至边缘微焦出油，盛出备用。",
                "取一片吐司，抹上沙拉酱，依次铺生菜叶、番茄片、芝士片、煎蛋、培根。",
                "盖上另一片吐司，用手轻轻压实，斜切成两个三角形。",
                "可以用牙签固定造型，搭配一杯牛奶或鲜榨果汁就是完美早餐。"
            ]
        },
        {
            "title": "酸辣土豆丝",
            "description": "超级下饭菜，爽脆酸辣，土豆丝根根分明，是最朴实的家常美味。",
            "image_prompt": "shredded potato stir-fry with vinegar and chili, golden translucent strips, red chili peppers, served in white bowl, authentic Chinese home cooking",
            "tags": ["家常", "辣", "下饭菜", "素菜"],
            "ingredients": [
                "土豆 2个（中等大小）",
                "干辣椒 5-6个",
                "花椒 1茶匙",
                "蒜末 1茶匙",
                "白醋 2汤匙",
                "生抽 半汤匙",
                "盐 适量",
                "葱花 适量",
                "食用油 2汤匙"
            ],
            "steps": [
                "土豆去皮切成均匀细丝（或用擦丝器），放入清水中浸泡去除淀粉，炒前捞出沥干。",
                "热锅冷油，放入花椒小火炸香捞出，再放入干辣椒段和蒜末爆香。",
                "转大火，倒入沥干水分的土豆丝快速翻炒，炒至土豆丝变透明。",
                "沿锅边淋入白醋（激出酸味），加盐、生抽调味，继续大火快炒1分钟。",
                "保持土豆丝脆嫩口感，不要炒太软，出锅前撒葱花，淋几滴香油更香。"
            ]
        },
        {
            "title": "清蒸鲈鱼",
            "description": "粤式经典蒸鱼，鱼肉鲜嫩，原汁原味，营养丰富不上火。",
            "image_prompt": "Cantonese steamed whole fish, green scallions ginger strips, glossy soy sauce drizzle, steam rising, elegant Chinese seafood photography",
            "tags": ["清淡", "海鲜", "粤式"],
            "ingredients": [
                "新鲜鲈鱼 1条（约500克）",
                "葱 3根",
                "姜 1小块",
                "蒸鱼豉油 3汤匙",
                "料酒 1汤匙",
                "盐 少许",
                "食用油 2汤匙",
                "红椒丝 少许（点缀）"
            ],
            "steps": [
                "鲈鱼处理干净，鱼身两侧各划3刀，抹少许盐和料酒腌制10分钟去腥。",
                "葱一半切段，一半切丝；姜一半切片，一半切丝；盘底铺上葱段和姜片。",
                "鱼放在葱姜上，鱼肚内也塞些葱姜，水开后上锅大火蒸8-10分钟。",
                "蒸好后倒掉盘中蒸出的腥水，去掉旧的葱姜，铺上新鲜葱丝、姜丝、红椒丝。",
                "淋上蒸鱼豉油，锅中烧热2汤匙食用油至冒烟，趁热浇在葱丝上激出香味。"
            ]
        },
        {
            "title": "香蕉松饼",
            "description": "松软香甜的早餐松饼，不用烤箱，平底锅就能做，配枫糖浆超满足。",
            "image_prompt": "fluffy banana pancakes stack, topped with fresh banana slices and maple syrup drizzling, butter melting, warm breakfast food photography",
            "tags": ["早餐", "甜点", "快手"],
            "ingredients": [
                "熟透香蕉 2根",
                "鸡蛋 2个",
                "低筋面粉 120克",
                "牛奶 100ml",
                "细砂糖 30克",
                "泡打粉 1茶匙",
                "黄油 20克",
                "盐 一小撮"
            ],
            "steps": [
                "香蕉放入碗中用叉子压成泥（保留少许颗粒增加口感）。",
                "加入鸡蛋、糖、牛奶搅拌均匀，再加入融化的黄油拌匀。",
                "筛入低筋面粉、泡打粉和盐，用刮刀翻拌成顺滑无颗粒的面糊，静置10分钟。",
                "平底锅小火加热，舀一勺面糊倒入锅中，表面出现小气泡且边缘凝固时翻面。",
                "每面约煎1-2分钟至金黄色，依次煎完所有面糊。",
                "叠盘摆好，放上香蕉片，淋上枫糖浆或蜂蜜，配一杯咖啡享用。"
            ]
        },
        {
            "title": "水煮牛肉",
            "description": "麻辣鲜香的川味硬菜，牛肉嫩滑，配菜丰富，麻辣过瘾让人欲罢不能。",
            "image_prompt": "Sichuan shuizhu beef, spicy red soup oil, tender beef slices, dried chilies Sichuan peppercorns, green vegetables underneath, authentic hot Chinese food",
            "tags": ["辣", "川菜", "下饭菜"],
            "ingredients": [
                "牛里脊 300克",
                "豆芽或生菜 200克",
                "郫县豆瓣酱 2汤匙",
                "干辣椒 10个",
                "花椒 1汤匙",
                "蒜末 2汤匙",
                "葱花 适量",
                "生抽 1汤匙",
                "料酒 1汤匙",
                "淀粉 1汤匙",
                "盐 适量",
                "干辣椒面 1茶匙"
            ],
            "steps": [
                "牛肉逆纹切薄片，加料酒、生抽、淀粉、少许油抓匀腌制15分钟让肉片嫩滑。",
                "锅中烧开水，豆芽或生菜焯水铺在大碗底部备用。",
                "锅中放油烧热，豆瓣酱小火炒出红油，加一半蒜末炒香，加水或高汤煮开。",
                "汤开后逐片下入牛肉片，用筷子轻轻拨开，煮至肉片变色即可（约1分钟）。",
                "连汤带肉倒入铺了蔬菜的大碗中，表面撒剩余蒜末、干辣椒面、花椒。",
                "锅中烧2汤匙热油至冒烟，淋在调料上激出香味，撒葱花即可上桌。"
            ]
        },
        {
            "title": "芒果布丁",
            "description": "清爽的夏日甜点，芒果果香浓郁，口感嫩滑Q弹，冰冰凉凉超解暑。",
            "image_prompt": "mango pudding dessert, vibrant yellow color, fresh mango cubes on top, coconut milk drizzle, served in clear glass bowl, tropical summer dessert photography",
            "tags": ["甜点", "夏日", "水果"],
            "ingredients": [
                "新鲜芒果 2个（熟透的）",
                "牛奶 250ml",
                "淡奶油 100ml",
                "细砂糖 40克",
                "吉利丁片 10克（2片）",
                "柠檬汁 几滴"
            ],
            "steps": [
                "吉利丁片用冰水泡软备用；芒果去皮取果肉，1/3切丁留着装饰，2/3打成果泥。",
                "牛奶加糖加热至糖融化（不要煮沸），关火，加入挤干水的吉利丁片搅拌融化。",
                "加入淡奶油和芒果泥搅拌均匀，滴几滴柠檬汁增添风味。",
                "布丁液过筛倒入容器或杯中，冷藏3-4小时至完全凝固。",
                "取出后表面铺上芒果丁装饰，可淋少许椰浆或加薄荷叶点缀。"
            ]
        },
        {
            "title": "蛋炒饭",
            "description": "粒粒分明金黄诱人的完美蛋炒饭，看似简单却考验功力，剩米饭变废为宝。",
            "image_prompt": "Chinese fried rice with egg, golden fluffy rice grains, scrambled egg pieces, green peas, scallions, served in white bowl with chopsticks, steam rising",
            "tags": ["家常", "快手", "主食"],
            "ingredients": [
                "隔夜米饭 2碗（约400克）",
                "鸡蛋 2个",
                "胡萝卜丁 30克",
                "青豆 30克",
                "玉米粒 30克",
                "葱花 适量",
                "盐 适量",
                "生抽 半汤匙",
                "白胡椒粉 少许",
                "食用油 2汤匙"
            ],
            "steps": [
                "米饭提前用筷子拨散，拌入少许油防止结块；鸡蛋打散加少许盐备用。",
                "胡萝卜丁、青豆、玉米粒焯水沥干备用。",
                "热锅冷油，倒入一半蛋液，蛋液半凝固时立刻倒入米饭快速翻炒。",
                "让每粒米饭都裹上蛋液，炒至米饭颗粒分明，加入剩余蛋液翻炒。",
                "倒入焯水的蔬菜丁大火翻炒，加盐、生抽、白胡椒粉调味。",
                "最后撒葱花，大火颠炒均匀，米饭在锅中跳动即可出锅。"
            ]
        }
    ]

    for recipe in sample_recipes:
        recipe_id = str(uuid.uuid4())
        image_url = f"{image_base}?prompt={recipe['image_prompt']}&image_size=landscape_4_3"
        cursor.execute("""
            INSERT INTO recipes (id, title, description, image_url, tags, ingredients, steps)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            recipe_id,
            recipe["title"],
            recipe["description"],
            image_url,
            json.dumps(recipe["tags"], ensure_ascii=False),
            json.dumps(recipe["ingredients"], ensure_ascii=False),
            json.dumps(recipe["steps"], ensure_ascii=False),
        ))


app = FastAPI(title="食谱交换站 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecipeCreate(BaseModel):
    title: str
    description: str
    image_url: str
    tags: List[str]
    ingredients: List[str]
    steps: List[str]


class FavoriteCreate(BaseModel):
    recipe_id: str


def row_to_recipe(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "image_url": row["image_url"],
        "tags": json.loads(row["tags"]),
        "ingredients": json.loads(row["ingredients"]),
        "steps": json.loads(row["steps"]),
        "created_at": row["created_at"],
    }


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/api/recipes")
def get_recipes(
    tags: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 12,
):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM recipes WHERE 1=1"
    params: list = []

    if tags and tags.strip():
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            query += " AND tags LIKE ?"
            params.append(f"%{tag}%")

    if search and search.strip():
        query += " AND (title LIKE ? OR description LIKE ? OR ingredients LIKE ?)"
        search_term = f"%{search.strip()}%"
        params.extend([search_term, search_term, search_term])

    query += " ORDER BY created_at DESC"

    cursor.execute("SELECT COUNT(*) FROM (" + query + ")", params)
    total = cursor.fetchone()[0]

    offset = (page - 1) * page_size
    query += " LIMIT ? OFFSET ?"
    params.extend([page_size, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    recipes = [row_to_recipe(row) for row in rows]
    return {
        "recipes": recipes,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@app.get("/api/recipes/random")
def get_random_recipe():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes ORDER BY RANDOM() LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="No recipes found")
    return row_to_recipe(row)


@app.get("/api/recipes/{recipe_id}")
def get_recipe(recipe_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return row_to_recipe(row)


@app.post("/api/recipes")
def create_recipe(data: RecipeCreate):
    recipe_id = str(uuid.uuid4())
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recipes (id, title, description, image_url, tags, ingredients, steps)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        recipe_id,
        data.title,
        data.description,
        data.image_url,
        json.dumps(data.tags, ensure_ascii=False),
        json.dumps(data.ingredients, ensure_ascii=False),
        json.dumps(data.steps, ensure_ascii=False),
    ))
    conn.commit()

    cursor.execute("SELECT * FROM recipes WHERE id = ?", (recipe_id,))
    row = cursor.fetchone()
    conn.close()
    return row_to_recipe(row)


@app.get("/api/favorites")
def get_favorites():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM favorites ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "recipe_id": r["recipe_id"], "created_at": r["created_at"]} for r in rows]


@app.post("/api/favorites")
def add_favorite(data: FavoriteCreate):
    fav_id = str(uuid.uuid4())
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM recipes WHERE id = ?", (data.recipe_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Recipe not found")

    cursor.execute("SELECT * FROM favorites WHERE recipe_id = ?", (data.recipe_id,))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"id": existing["id"], "recipe_id": existing["recipe_id"], "created_at": existing["created_at"]}

    cursor.execute("""
        INSERT INTO favorites (id, recipe_id) VALUES (?, ?)
    """, (fav_id, data.recipe_id))
    conn.commit()

    cursor.execute("SELECT * FROM favorites WHERE id = ?", (fav_id,))
    row = cursor.fetchone()
    conn.close()
    return {"id": row["id"], "recipe_id": row["recipe_id"], "created_at": row["created_at"]}


@app.delete("/api/favorites/{fav_id}")
def delete_favorite(fav_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM favorites WHERE id = ?", (fav_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Favorite not found")
    conn.commit()
    conn.close()
    return {"message": "Deleted successfully"}


@app.get("/api/recommendations")
def get_recommendations():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT recipe_id FROM favorites")
    fav_rows = cursor.fetchall()

    if len(fav_rows) == 0:
        cursor.execute("SELECT * FROM recipes ORDER BY RANDOM() LIMIT 8")
        rows = cursor.fetchall()
        conn.close()
        return [row_to_recipe(r) for r in rows]

    fav_tags: set = set()
    for row in fav_rows:
        cursor.execute("SELECT tags FROM recipes WHERE id = ?", (row["recipe_id"],))
        recipe = cursor.fetchone()
        if recipe:
            tags = json.loads(recipe["tags"])
            fav_tags.update(tags)

    fav_recipe_ids = [r["recipe_id"] for r in fav_rows]
    placeholders = ",".join("?" * len(fav_recipe_ids))
    params = list(fav_recipe_ids)

    query = f"SELECT * FROM recipes WHERE id NOT IN ({placeholders})"

    scored_recipes = []
    cursor.execute(query, params)
    rows = cursor.fetchall()

    for row in rows:
        recipe_tags = set(json.loads(row["tags"]))
        score = len(fav_tags & recipe_tags)
        scored_recipes.append((score, row))

    scored_recipes.sort(key=lambda x: (x[0], random.random()), reverse=True)
    selected = [r[1] for r in scored_recipes[:8]]

    if len(selected) < 8:
        existing_ids = [r["id"] for r in selected] + fav_recipe_ids
        placeholders = ",".join("?" * len(existing_ids))
        cursor.execute(
            f"SELECT * FROM recipes WHERE id NOT IN ({placeholders}) ORDER BY RANDOM() LIMIT ?",
            existing_ids + [8 - len(selected)],
        )
        extra = cursor.fetchall()
        selected.extend(extra)

    conn.close()
    return [row_to_recipe(r) for r in selected]
