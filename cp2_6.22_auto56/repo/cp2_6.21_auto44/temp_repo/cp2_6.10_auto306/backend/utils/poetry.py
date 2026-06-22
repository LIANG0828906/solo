import random
from typing import List
from models import Sigil


poem_templates = [
    {
        "types": ("心境签", "心境签"),
        "templates": [
            "心中{keyword1}意难平，{keyword2}如水照清影。\n闲来静坐观云起，一念清净万缘轻。",
            "我心{keyword1}向远方，{keyword2}为伴不彷徨。\n浮生若梦何须叹，且把闲情付壶觞。",
            "境由心转{keyword1}生，{keyword2}相伴踏歌行。\n世事无常皆过客，心安之处是归程。"
        ]
    },
    {
        "types": ("心境签", "星运签"),
        "templates": [
            "心怀{keyword1}望星空，{keyword2}闪烁照前路。\n星辰指引心中愿，不负韶华不负梦。",
            "心中{keyword1}意悠悠，{keyword2}高照解千愁。\n天机玄妙何须问，随缘而行自无忧。",
            "我以{keyword1}问苍穹，{keyword2}隐隐显神通。\n前程似锦何须虑，心诚则灵运自通。"
        ]
    },
    {
        "types": ("心境签", "元素签"),
        "templates": [
            "心似{keyword1}意悠然，{keyword2}之气润丹田。\n五行相生循大道，天地万物任周旋。",
            "心怀{keyword1}观造化，{keyword2}中藏真意。\n混元一气周流遍，我与天地本同根。",
            "我有{keyword1}藏心怀，{keyword2}之力助我开。\n道法自然随遇安，清风明月任徘徊。"
        ]
    },
    {
        "types": ("星运签", "心境签"),
        "templates": [
            "星辉{keyword1}照九州，{keyword2}似水向东流。\n人生如寄何须叹，笑对风云几度秋。",
            "星光点点{keyword1}明，{keyword2}深处有神灵。\n莫问前程凶与吉，但行善事福自临。",
            "河汉迢迢{keyword1}横，{keyword2}如水夜三更。\n举头望月思千里，心有灵犀一点通。"
        ]
    },
    {
        "types": ("星运签", "星运签"),
        "templates": [
            "双星{keyword1}映紫微，{keyword2}高照运昌隆。\n天公有意佑良善，否极泰来万事通。",
            "星移斗转{keyword1}现，{keyword2}当空照大千。\n夙世因缘今又遇，前途光明福无边。",
            "银河耿耿{keyword1}连，{keyword2}双双降吉祥。\n人生聚散皆是命，半点不由人主张。"
        ]
    },
    {
        "types": ("星运签", "元素签"),
        "templates": [
            "天星{keyword1}照五行，{keyword2}之气萃其身。\n得天独厚机缘巧，乘风直上九万程。",
            "星斗{keyword1}映太虚，{keyword2}精元育圣躯。\n此去蓬莱无多路，祥云瑞霭护征途。",
            "月华{keyword1}洒九州，{keyword2}灵气满皇州。\n天生我材必有用，直挂云帆济沧流。"
        ]
    },
    {
        "types": ("元素签", "心境签"),
        "templates": [
            "天地{keyword1}育万物，{keyword2}如水载方舟。\n顺天应人皆有道，心安处处是瀛洲。",
            "造化{keyword1}钟神秀，{keyword2}常伴君子游。\n穷通得失皆是命，何须苦苦问缘由。",
            "一元{keyword1}始复来，{keyword2}无处不春回。\n识得此中真乐趣，胜却人间万户侯。"
        ]
    },
    {
        "types": ("元素签", "星运签"),
        "templates": [
            "五行{keyword1}运不穷，{keyword2}高照喜相逢。\n天时地利人和聚，一朝直上广寒宫。",
            "大地{keyword1}生春色，{keyword2}添光彩。\n良辰美景奈何天，赏心乐事谁家院。",
            "乾坤{keyword1}化育恩，{keyword2}拱北辰。\n修得此身归大道，何愁前路无知音。"
        ]
    },
    {
        "types": ("元素签", "元素签"),
        "templates": [
            "{keyword1}与{keyword2}本相生，阴阳化合育乾坤。\n五行推演无穷数，始信天地有至文。",
            "{keyword1}气蒸腾{keyword2}气凝，二气交感万物生。\n悟得此中真造化，何劳此外问前程。",
            "{keyword1}中有{keyword2}精，水火既济道方成。\n劝君更尽一杯酒，与君同醉乐升平。"
        ]
    },
    {
        "elements": ("水", "火"),
        "templates": [
            "水火既济{keyword1}融，{keyword2}在中。\n阴阳调和万事顺，此卦当为大吉逢。",
            "坎离交媾{keyword1}通，{keyword2}映长虹。\n炼就丹砂归大药，始知妙理在其中。"
        ]
    },
    {
        "elements": ("火", "水"),
        "templates": [
            "火水未济{keyword1}分，{keyword2}难匀。\n劝君静待时运转，莫把心机枉费神。",
            "离上坎下{keyword1}陈，{keyword2}未亲。\n凡事且须留余地，他年结得自由身。"
        ]
    },
    {
        "elements": ("雷", "风"),
        "templates": [
            "雷风相薄{keyword1}扬，{keyword2}动八荒。\n春雷一声万物醒，乘时进取莫彷徨。",
            "震巽相资{keyword1}彰，{keyword2}送清香。\n君子以自强不息，积善之家有余庆。"
        ]
    },
    {
        "elements": ("风", "雷"),
        "templates": [
            "风雷益卦{keyword1}传，{keyword2}满大千。\n损上益下民悦豫，天施地生福无边。",
            "巽震相随{keyword1}连，{keyword2}自天来。\n君子见善则迁改，凶消吉至乐无涯。"
        ]
    },
    {
        "elements": ("山", "泽"),
        "templates": [
            "山泽通气{keyword1}潜，{keyword2}映珠帘。\n智者乐水仁乐山，此中真趣少人嫌。",
            "艮兑相交{keyword1}添，{keyword2}养灵源。\n止而悦之咸亨利，天地感而万物生。"
        ]
    },
    {
        "elements": ("泽", "山"),
        "templates": [
            "泽山咸卦{keyword1}通，{keyword2}自相通。\n无心之感贞吉亨，君子以虚受人崇。",
            "兑艮相感{keyword1}融，{keyword2}在其中。\n情投意合事皆顺，此际相逢气运隆。"
        ]
    }
]


generic_templates = [
    "抽得灵签{keyword1}，{keyword2}相伴自安然。\n劝君珍重眼前事，莫待失时空自怜。",
    "灵签一曲{keyword1}吟，{keyword2}相牵意转深。\n世事如棋局局新，随缘度日且安心。",
    "两签相合{keyword1}生，{keyword2}纷纷满帝京。\n欲问前程何处是，守得云开见月明。",
    "签文{keyword1}意如何，{keyword2}相伴笑呵呵。\n但行好事莫问果，天理昭彰报应多。",
    "玄玄妙妙{keyword1}机，{keyword2}中藏真消息。\n若能悟得其中理，便是人间大丈夫。"
]


def get_keywords(sigil1: Sigil, sigil2: Sigil) -> tuple:
    keyword1 = random.choice(sigil1.keywords) if sigil1.keywords else "玄妙"
    keyword2 = random.choice(sigil2.keywords) if sigil2.keywords else "通灵"
    return keyword1, keyword2


def match_template(sigil1: Sigil, sigil2: Sigil) -> str:
    keyword1, keyword2 = get_keywords(sigil1, sigil2)

    type_pair = (sigil1.type, sigil2.type)
    element_pair = (sigil1.element, sigil2.element)

    matched_templates = []

    for entry in poem_templates:
        if "types" in entry and entry["types"] == type_pair:
            matched_templates.extend(entry["templates"])
        elif "elements" in entry and entry["elements"] == element_pair:
            matched_templates.extend(entry["templates"])

    if not matched_templates:
        matched_templates = generic_templates

    template = random.choice(matched_templates)

    poem = template.format(keyword1=keyword1, keyword2=keyword2)
    return poem


def generate_poem(sigil1: Sigil, sigil2: Sigil) -> str:
    return match_template(sigil1, sigil2)
