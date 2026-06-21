from typing import List
from models import Furniture, Style


furniture_data: List[Furniture] = [
    Furniture(id=1, name="现代简约沙发", category="沙发", price=3299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20sofa%20gray%20fabric%20living%20room&image_size=square",
              description="三人位布艺沙发，高密度海绵填充", dimensions="220x90x85cm", material="布艺+实木框架"),
    Furniture(id=2, name="北欧风单人沙发", category="沙发", price=1599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20style%20single%20armchair%20beige%20fabric&image_size=square",
              description="舒适单人休闲椅，北欧简约设计", dimensions="80x75x90cm", material="棉麻面料"),
    Furniture(id=3, name="L型转角沙发", category="沙发", price=4599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=L%20shaped%20sectional%20sofa%20dark%20gray%20modern&image_size=square",
              description="大户型L型沙发，可躺可坐", dimensions="280x180x85cm", material="科技布"),
    Furniture(id=4, name="真皮沙发组合", category="沙发", price=8999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20leather%20sofa%20set%20brown%20elegant&image_size=square",
              description="进口头层牛皮沙发组合", dimensions="240x100x90cm", material="头层牛皮"),
    Furniture(id=5, name="多功能沙发床", category="沙发", price=2899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=convertible%20sofa%20bed%20blue%20modern&image_size=square",
              description="可折叠沙发床，一物多用", dimensions="200x95x80cm", material="亚麻面料"),

    Furniture(id=6, name="实木餐桌", category="餐桌", price=2599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=solid%20wood%20dining%20table%20rectangular%20natural&image_size=square",
              description="北美进口橡木餐桌，环保清漆", dimensions="160x90x75cm", material="橡木"),
    Furniture(id=7, name="岩板餐桌", category="餐桌", price=3299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sintered%20stone%20dining%20table%20modern%20black&image_size=square",
              description="意大利进口岩板台面，耐高温", dimensions="180x90x75cm", material="岩板+金属"),
    Furniture(id=8, name="圆形餐桌", category="餐桌", price=1999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=round%20dining%20table%20white%20marble%20top&image_size=square",
              description="现代简约圆桌，适合小户型", dimensions="120x120x75cm", material="密度板+玻璃"),
    Furniture(id=9, name="伸缩餐桌", category="餐桌", price=2899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=extendable%20dining%20table%20wooden%20modern&image_size=square",
              description="可伸缩设计，满足不同人数需求", dimensions="120-160x80x75cm", material="实木"),
    Furniture(id=10, name="轻奢餐桌椅组合", category="餐桌", price=4599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20dining%20table%20chairs%20set%20gold%20legs&image_size=square",
              description="轻奢风餐桌椅，含6椅", dimensions="160x90x75cm", material="大理石+金属"),

    Furniture(id=11, name="主卧真皮床", category="床", price=5999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20leather%20bed%20frame%20king%20size%20gray&image_size=square",
              description="1.8米真皮床，气动高箱储物", dimensions="180x200cm", material="头层牛皮"),
    Furniture(id=12, name="北欧实木床", category="床", price=2999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20wooden%20bed%20frame%20natural%20oak&image_size=square",
              description="简约北欧风，进口榉木", dimensions="150x200cm", material="榉木"),
    Furniture(id=13, name="儿童子母床", category="床", price=3599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20bunk%20bed%20wooden%20white%20blue&image_size=square",
              description="上下铺子母床，带滑梯", dimensions="120x200cm", material="松木"),
    Furniture(id=14, name="布艺软包床", category="床", price=2599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=upholstered%20fabric%20bed%20frame%20beige%20modern&image_size=square",
              description="可拆洗布艺软包，靠背舒适", dimensions="180x200cm", material="棉麻面料"),
    Furniture(id=15, name="智能电动床", category="床", price=8999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20adjustable%20electric%20bed%20modern&image_size=square",
              description="电动调节角度，带按摩功能", dimensions="180x200cm", material="科技布+电动马达"),

    Furniture(id=16, name="双开门衣柜", category="衣柜", price=3999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=double%20door%20wardrobe%20white%20modern&image_size=square",
              description="对开门大衣柜，分区收纳", dimensions="180x220x60cm", material="实木颗粒板"),
    Furniture(id=17, name="推拉门衣柜", category="衣柜", price=3299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sliding%20door%20wardrobe%20wood%20grain&image_size=square",
              description="移门设计，节省空间", dimensions="160x210x60cm", material="多层实木板"),
    Furniture(id=18, name="步入式衣帽间", category="衣柜", price=12999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=walk%20in%20closet%20custom%20luxury%20white&image_size=square",
              description="定制衣帽间，按需定制", dimensions="300x240x60cm", material="E0级环保板材"),
    Furniture(id=19, name="儿童衣柜", category="衣柜", price=1899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20wardrobe%20colorful%20cute%20design&image_size=square",
              description="环保材质，儿童专用", dimensions="120x180x50cm", material="松木"),
    Furniture(id=20, name="轻奢玻璃门衣柜", category="衣柜", price=5999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20glass%20door%20wardrobe%20LED%20light&image_size=square",
              description="带LED灯，玻璃门展示", dimensions="200x220x60cm", material="钢化玻璃+金属"),

    Furniture(id=21, name="升降电脑桌", category="桌子", price=1999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=height%20adjustable%20standing%20desk%20black&image_size=square",
              description="电动升降，站坐交替", dimensions="120x60x75-120cm", material="板材+金属"),
    Furniture(id=22, name="实木书桌", category="桌子", price=1599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=solid%20wood%20study%20desk%20natural&image_size=square",
              description="简约实木书桌，环保耐用", dimensions="140x70x75cm", material="橡木"),
    Furniture(id=23, name="床边床头柜", category="桌子", price=699.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20bedside%20table%20white%20minimalist&image_size=square",
              description="简约床头柜，双抽屉设计", dimensions="50x40x55cm", material="密度板"),
    Furniture(id=24, name="客厅茶几", category="桌子", price=1299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=living%20room%20coffee%20table%20marble%20top&image_size=square",
              description="大理石台面茶几，轻奢风", dimensions="120x60x45cm", material="岩板+金属"),
    Furniture(id=25, name="可折叠餐桌", category="桌子", price=899.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=folding%20dining%20table%20space%20saving&image_size=square",
              description="小户型必备，可折叠收纳", dimensions="80x80x75cm", material="人造板"),

    Furniture(id=26, name="人体工学椅", category="椅子", price=2299.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ergonomic%20office%20chair%20black%20mesh&image_size=square",
              description="网布透气，多维度调节", dimensions="70x70x120cm", material="网布+尼龙"),
    Furniture(id=27, name="餐椅（4把）", category="椅子", price=1599.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dining%20chairs%20set%20of%204%20modern%20gray&image_size=square",
              description="简约餐椅，铁艺框架", dimensions="45x50x85cm", material="布艺+铁艺"),
    Furniture(id=28, name="北欧休闲椅", category="椅子", price=999.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20lounge%20chair%20wood%20fabric&image_size=square",
              description="休闲单人椅，实木框架", dimensions="65x70x90cm", material="棉麻+榉木"),
    Furniture(id=29, name="儿童学习椅", category="椅子", price=799.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kids%20study%20chair%20adjustable%20blue&image_size=square",
              description="可升降调节，纠正坐姿", dimensions="50x50x80-100cm", material="环保塑料"),
    Furniture(id=30, name="吧台椅（2把）", category="椅子", price=1199.0,
              image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bar%20stools%20set%20of%202%20industrial%20style&image_size=square",
              description="工业风吧台椅，可旋转", dimensions="40x40x110cm", material="PU皮+金属"),
]

style_data: List[Style] = [
    Style(id=1, name="现代简约",
          description="简洁明快的设计风格，注重功能性与美学的平衡，适合追求品质生活的年轻家庭",
          color_palette=["#FFFFFF", "#F5F5F5", "#333333", "#4A90E2", "#E8B96B"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20interior%20design%20living%20room&image_size=square"),
    Style(id=2, name="北欧风",
          description="源于北欧的自然风格，以浅色、木质、简洁为特点，营造温馨舒适的居住氛围",
          color_palette=["#FAFAFA", "#E8E4DE", "#7BA3A8", "#D4A574", "#8B7355"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=nordic%20scandinavian%20interior%20design%20cozy&image_size=square"),
    Style(id=3, name="轻奢风",
          description="低调奢华的设计风格，运用金属、玻璃、大理石等元素，彰显品质与品味",
          color_palette=["#2C2C2C", "#D4AF37", "#B8860B", "#E5E4E2", "#8B4513"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20modern%20interior%20design%20elegant&image_size=square"),
    Style(id=4, name="日式原木",
          description="传统日式与现代结合，大量使用原木材料，强调自然、禅意、收纳",
          color_palette=["#F5F1E8", "#D4C4A8", "#8B7355", "#556B2F", "#2F4F4F"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20style%20interior%20wood%20zen&image_size=square"),
    Style(id=5, name="工业风",
          description="复古工业风格，裸露的砖墙、金属管道、水泥地面，个性十足",
          color_palette=["#1A1A1A", "#4A4A4A", "#8B4513", "#CD853F", "#B8860B"],
          image_url="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20loft%20interior%20design%20brick%20wall&image_size=square"),
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
