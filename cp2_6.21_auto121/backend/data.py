from typing import List, Optional, Dict
from models import Furniture, Style
from datetime import datetime
import json
import os
import uuid


DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DESIGNS_FILE = os.path.join(DATA_DIR, "designs.json")

os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(DESIGNS_FILE):
    with open(DESIGNS_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)


furniture_data: List[Furniture] = [
    Furniture(id=1, name="现代简约沙发", category="沙发", price=3299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20sofa%20gray%20fabric%20living%20room&image_size=square",
              description="三人位布艺沙发，高密度海绵填充", dimensions="220x90x85cm", material="布艺+实木框架",
              style_tags=["现代", "北欧"]),
    Furniture(id=2, name="北欧风单人沙发", category="沙发", price=1599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20style%20single%20armchair%20beige%20fabric&image_size=square",
              description="舒适单人休闲椅，北欧简约设计", dimensions="80x75x90cm", material="棉麻面料",
              style_tags=["北欧"]),
    Furniture(id=3, name="L型转角沙发", category="沙发", price=4599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=L%20shaped%20sectional%20sofa%20dark%20gray%20modern&image_size=square",
              description="大户型L型沙发，可躺可坐", dimensions="280x180x85cm", material="科技布",
              style_tags=["现代"]),
    Furniture(id=4, name="真皮沙发组合", category="沙发", price=8999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20leather%20sofa%20set%20brown%20elegant&image_size=square",
              description="进口头层牛皮沙发组合", dimensions="240x100x90cm", material="头层牛皮",
              style_tags=["现代", "复古"]),
    Furniture(id=5, name="多功能沙发床", category="沙发", price=2899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=convertible%20sofa%20bed%20blue%20modern&image_size=square",
              description="可折叠沙发床，一物多用", dimensions="200x95x80cm", material="亚麻面料",
              style_tags=["现代", "北欧"]),

    Furniture(id=6, name="实木餐桌", category="餐桌", price=2599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=solid%20wood%20dining%20table%20rectangular%20natural&image_size=square",
              description="北美进口橡木餐桌，环保清漆", dimensions="160x90x75cm", material="橡木",
              style_tags=["北欧", "日式"]),
    Furniture(id=7, name="岩板餐桌", category="餐桌", price=3299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sintered%20stone%20dining%20table%20modern%20black&image_size=square",
              description="意大利进口岩板台面，耐高温", dimensions="180x90x75cm", material="岩板+金属",
              style_tags=["现代", "工业"]),
    Furniture(id=8, name="圆形餐桌", category="餐桌", price=1999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round%20dining%20table%20white%20marble%20top&image_size=square",
              description="现代简约圆桌，适合小户型", dimensions="120x120x75cm", material="密度板+玻璃",
              style_tags=["现代", "北欧"]),
    Furniture(id=9, name="伸缩餐桌", category="餐桌", price=2899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=extendable%20dining%20table%20wooden%20modern&image_size=square",
              description="可伸缩设计，满足不同人数需求", dimensions="120-160x80x75cm", material="实木",
              style_tags=["现代", "日式"]),
    Furniture(id=10, name="轻奢餐桌椅组合", category="餐桌", price=4599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20dining%20table%20chairs%20set%20gold%20legs&image_size=square",
              description="轻奢风餐桌椅，含6椅", dimensions="160x90x75cm", material="大理石+金属",
              style_tags=["现代", "复古"]),

    Furniture(id=11, name="主卧真皮床", category="床", price=5999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20leather%20bed%20frame%20king%20size%20gray&image_size=square",
              description="1.8米真皮床，气动高箱储物", dimensions="180x200cm", material="头层牛皮",
              style_tags=["现代", "复古"]),
    Furniture(id=12, name="北欧实木床", category="床", price=2999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20wooden%20bed%20frame%20natural%20oak&image_size=square",
              description="简约北欧风，进口榉木", dimensions="150x200cm", material="榉木",
              style_tags=["北欧", "日式"]),
    Furniture(id=13, name="儿童子母床", category="床", price=3599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20bunk%20bed%20wooden%20white%20blue&image_size=square",
              description="上下铺子母床，带滑梯", dimensions="120x200cm", material="松木",
              style_tags=["现代", "北欧"]),
    Furniture(id=14, name="布艺软包床", category="床", price=2599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=upholstered%20fabric%20bed%20frame%20beige%20modern&image_size=square",
              description="可拆洗布艺软包，靠背舒适", dimensions="180x200cm", material="棉麻面料",
              style_tags=["现代", "北欧"]),
    Furniture(id=15, name="智能电动床", category="床", price=8999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20adjustable%20electric%20bed%20modern&image_size=square",
              description="电动调节角度，带按摩功能", dimensions="180x200cm", material="科技布+电动马达",
              style_tags=["现代", "工业"]),

    Furniture(id=16, name="双开门衣柜", category="衣柜", price=3999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=double%20door%20wardrobe%20white%20modern&image_size=square",
              description="对开门大衣柜，分区收纳", dimensions="180x220x60cm", material="实木颗粒板",
              style_tags=["现代", "北欧"]),
    Furniture(id=17, name="推拉门衣柜", category="衣柜", price=3299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sliding%20door%20wardrobe%20wood%20grain&image_size=square",
              description="移门设计，节省空间", dimensions="160x210x60cm", material="多层实木板",
              style_tags=["现代", "日式"]),
    Furniture(id=18, name="步入式衣帽间", category="衣柜", price=12999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=walk%20in%20closet%20custom%20luxury%20white&image_size=square",
              description="定制衣帽间，按需定制", dimensions="300x240x60cm", material="E0级环保板材",
              style_tags=["现代", "复古"]),
    Furniture(id=19, name="儿童衣柜", category="衣柜", price=1899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20wardrobe%20colorful%20cute%20design&image_size=square",
              description="环保材质，儿童专用", dimensions="120x180x50cm", material="松木",
              style_tags=["现代", "北欧"]),
    Furniture(id=20, name="轻奢玻璃门衣柜", category="衣柜", price=5999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20glass%20door%20wardrobe%20LED%20light&image_size=square",
              description="带LED灯，玻璃门展示", dimensions="200x220x60cm", material="钢化玻璃+金属",
              style_tags=["现代", "工业"]),

    Furniture(id=21, name="升降电脑桌", category="桌子", price=1999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=height%20adjustable%20standing%20desk%20black&image_size=square",
              description="电动升降，站坐交替", dimensions="120x60x75-120cm", material="板材+金属",
              style_tags=["现代", "工业"]),
    Furniture(id=22, name="实木书桌", category="桌子", price=1599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=solid%20wood%20study%20desk%20natural&image_size=square",
              description="简约实木书桌，环保耐用", dimensions="140x70x75cm", material="橡木",
              style_tags=["北欧", "日式"]),
    Furniture(id=23, name="床边床头柜", category="桌子", price=699.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedside%20table%20white%20minimalist&image_size=square",
              description="简约床头柜，双抽屉设计", dimensions="50x40x55cm", material="密度板",
              style_tags=["现代", "北欧"]),
    Furniture(id=24, name="客厅茶几", category="桌子", price=1299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=living%20room%20coffee%20table%20marble%20top&image_size=square",
              description="大理石台面茶几，轻奢风", dimensions="120x60x45cm", material="岩板+金属",
              style_tags=["现代", "复古"]),
    Furniture(id=25, name="可折叠餐桌", category="桌子", price=899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=folding%20dining%20table%20space%20saving&image_size=square",
              description="小户型必备，可折叠收纳", dimensions="80x80x75cm", material="人造板",
              style_tags=["现代", "日式"]),

    Furniture(id=26, name="人体工学椅", category="椅子", price=2299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ergonomic%20office%20chair%20black%20mesh&image_size=square",
              description="网布透气，多维度调节", dimensions="70x70x120cm", material="网布+尼龙",
              style_tags=["现代", "工业"]),
    Furniture(id=27, name="餐椅（4把）", category="椅子", price=1599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dining%20chairs%20set%20of%204%20modern%20gray&image_size=square",
              description="简约餐椅，铁艺框架", dimensions="45x50x85cm", material="布艺+铁艺",
              style_tags=["现代", "北欧"]),
    Furniture(id=28, name="北欧休闲椅", category="椅子", price=999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20lounge%20chair%20wood%20fabric&image_size=square",
              description="休闲单人椅，实木框架", dimensions="65x70x90cm", material="棉麻+榉木",
              style_tags=["北欧", "日式"]),
    Furniture(id=29, name="儿童学习椅", category="椅子", price=799.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20study%20chair%20adjustable%20blue&image_size=square",
              description="可升降调节，纠正坐姿", dimensions="50x50x80-100cm", material="环保塑料",
              style_tags=["现代", "北欧"]),
    Furniture(id=30, name="吧台椅（2把）", category="椅子", price=1199.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bar%20stools%20set%20of%202%20industrial%20style&image_size=square",
              description="工业风吧台椅，可旋转", dimensions="40x40x110cm", material="PU皮+金属",
              style_tags=["工业", "复古"]),

    Furniture(id=31, name="现代简约纱帘", category="窗帘", price=399.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20sheer%20curtains%20white%20gray%20living%20room&image_size=square",
              description="透光不透人，简约百搭", dimensions="250x270cm", material="雪纺纱",
              style_tags=["现代", "北欧"]),
    Furniture(id=32, name="复古棉麻遮光帘", category="窗帘", price=599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20linen%20blackout%20curtains%20brown%20beige&image_size=square",
              description="加厚棉麻面料，遮光隔热", dimensions="280x270cm", material="棉麻",
              style_tags=["复古", "日式"]),
    Furniture(id=33, name="北欧几何图案抱枕（2个）", category="抱枕", price=199.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20geometric%20pattern%20throw%20pillows%20set%20of%202&image_size=square",
              description="几何图案设计，柔软舒适", dimensions="45x45cm", material="棉麻面料",
              style_tags=["北欧", "现代"]),
    Furniture(id=34, name="复古丝绒抱枕（2个）", category="抱枕", price=299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20velvet%20throw%20pillows%20burgundy%20mustard&image_size=square",
              description="丝绒面料，复古优雅", dimensions="50x50cm", material="丝绒",
              style_tags=["复古", "工业"]),
    Furniture(id=35, name="日式陶瓷花器", category="花瓶", price=259.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20ceramic%20vase%20minimalist%20wabi%20sabi&image_size=square",
              description="手工陶瓷，侘寂美学", dimensions="15x25cm", material="粗陶",
              style_tags=["日式", "北欧"]),
]

style_data: List[Style] = [
    Style(id=1, name="现代",
          description="简洁明快的设计风格，注重功能性与美学的平衡，以灰白为主色调，墨绿作为点缀色，适合追求品质生活的年轻家庭",
          color_palette=["#FFFFFF", "#F5F5F5", "#333333", "#2E7D32", "#E0E0E0"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20interior%20design%20gray%20white%20dark%20green%20accent&image_size=square"),
    Style(id=2, name="北欧",
          description="源于北欧的自然风格，以浅木色、白色、浅灰蓝为主色调，营造温馨舒适的居住氛围，注重自然光与木质元素的结合",
          color_palette=["#FAFAFA", "#E8E4DE", "#7BA3A8", "#D4A574", "#8B7355"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20scandinavian%20interior%20design%20light%20wood%20white%20pale%20blue&image_size=square"),
    Style(id=3, name="工业",
          description="复古工业风格，深灰、砖红、黑色金属为主色调，裸露的砖墙、金属管道、水泥地面，个性十足，充满粗犷的艺术感",
          color_palette=["#1A1A1A", "#4A4A4A", "#8B4513", "#CD5C5C", "#2C2C2C"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20loft%20interior%20design%20dark%20gray%20brick%20red%20black%20metal&image_size=square"),
    Style(id=4, name="日式",
          description="传统日式与现代结合，原木色、米白、竹绿为主色调，大量使用原木材料，强调自然、禅意、收纳，营造宁静祥和的空间",
          color_palette=["#F5F1E8", "#D4C4A8", "#8B7355", "#556B2F", "#F0E68C"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20style%20interior%20wood%20zen%20natural%20bamboo%20green&image_size=square"),
    Style(id=5, name="复古",
          description="怀旧复古风格，深棕、芥末黄、酒红为主色调，融合经典元素与现代功能，营造浓郁的复古氛围，彰显独特品味",
          color_palette=["#3E2723", "#8D6E63", "#D4A017", "#8B0000", "#5D4037"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20retro%20interior%20design%20dark%20brown%20mustard%20yellow%20burgundy%20red&image_size=square"),
]


def get_furniture_by_id(furniture_id: int):
    for f in furniture_data:
        if f.id == furniture_id:
            return f
    return None


def get_style_by_id(style_id: int):
    for s in style_data:
        if s.id == style_id:
            return s
    return None


def load_designs():
    try:
        with open(DESIGNS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_designs(designs):
    with open(DESIGNS_FILE, "w", encoding="utf-8") as f:
        json.dump(designs, f, ensure_ascii=False, indent=2, default=str)


def calculate_total_price(furniture_items: List[Dict]) -> float:
    total = 0.0
    for item in furniture_items:
        furniture = get_furniture_by_id(item["furniture_id"])
        if furniture:
            total += furniture.price
    return round(total, 2)


def update_design(design_id: str, design_data: Dict) -> Optional[Dict]:
    designs = load_designs()
    for i, d in enumerate(designs):
        if d["id"] == design_id:
            style = get_style_by_id(design_data.get("style_id", d["style_id"]))
            if not style:
                return None

            for item in design_data.get("furniture_items", d["furniture_items"]):
                if not get_furniture_by_id(item["furniture_id"]):
                    return None

            total_price = calculate_total_price(design_data.get("furniture_items", d["furniture_items"]))

            updated_design = {
                "id": design_id,
                "name": design_data.get("name", d["name"]),
                "style_id": design_data.get("style_id", d["style_id"]),
                "style_name": style.name,
                "room_width": design_data.get("room_width", d["room_width"]),
                "room_height": design_data.get("room_height", d["room_height"]),
                "furniture_items": design_data.get("furniture_items", d["furniture_items"]),
                "total_price": total_price,
                "description": design_data.get("description", d.get("description")),
                "created_at": d["created_at"],
                "updated_at": datetime.now().isoformat()
            }
            designs[i] = updated_design
            save_designs(designs)
            return updated_design
    return None


def delete_design(design_id: str) -> bool:
    designs = load_designs()
    for i, d in enumerate(designs):
        if d["id"] == design_id:
            designs.pop(i)
            save_designs(designs)
            return True
    return False


def get_designs_by_style(style_id: int) -> List[Dict]:
    designs = load_designs()
    return [d for d in designs if d["style_id"] == style_id]
