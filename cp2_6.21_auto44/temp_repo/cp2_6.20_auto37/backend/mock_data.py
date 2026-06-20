import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any


def generate_promotions(count: int = 500) -> List[Dict[str, Any]]:
    promotions = []
    promotion_types = ["discount", "full_reduction", "gift"]
    statuses = ["active", "paused", "ended"]
    categories = ["电子产品", "服装鞋帽", "食品饮料", "家居用品", "美妆护肤", "运动户外", "图书文具", "母婴用品"]
    promotion_names = [
        "夏季清仓大促", "新品首发优惠", "会员专享折扣", "满减狂欢节", "限时秒杀",
        "买一送一", "周末特惠", "节日狂欢", "品牌日", "新人专享",
        "双11预热", "618大促", "年终盛典", "周年庆", "开学季",
        "情人节特惠", "母亲节感恩", "父亲节特惠", "儿童节欢乐购", "国庆大放价"
    ]

    now = datetime.now()

    for i in range(count):
        promo_type = random.choice(promotion_types)
        status = random.choice(statuses)
        name = random.choice(promotion_names) + f" #{i + 1}"

        if promo_type == "discount":
            config = {"discount": round(random.uniform(0.5, 0.95), 2)}
        elif promo_type == "full_reduction":
            config = {
                "fullAmount": random.choice([100, 200, 300, 500, 1000]),
                "reduceAmount": random.choice([10, 20, 30, 50, 100])
            }
        else:
            gifts = ["精美礼品", "品牌周边", "优惠券礼包", "小样套装", "免邮券"]
            config = {"gift": random.choice(gifts)}

        start_offset = random.randint(-30, 30)
        end_offset = start_offset + random.randint(7, 60)

        categories_count = random.randint(1, 4)
        selected_categories = random.sample(categories, categories_count)

        promotion = {
            "id": str(uuid.uuid4()),
            "name": name,
            "type": promo_type,
            "config": config,
            "startTime": (now + timedelta(days=start_offset)).isoformat(),
            "endTime": (now + timedelta(days=end_offset)).isoformat(),
            "categories": selected_categories,
            "status": status,
            "createdAt": (now - timedelta(days=random.randint(0, 90))).isoformat()
        }
        promotions.append(promotion)

    return promotions


def generate_realtime_stats() -> Dict[str, Any]:
    now = datetime.now()

    def generate_group_stats():
        return {
            "conversionRate": round(random.uniform(0.02, 0.15), 4),
            "avgOrderValue": round(random.uniform(80, 500), 2),
            "participants": random.randint(100, 10000)
        }

    return {
        "groupA": generate_group_stats(),
        "groupB": generate_group_stats(),
        "timestamp": now.isoformat()
    }


def generate_history_data() -> List[Dict[str, Any]]:
    history = []
    days_count = random.randint(14, 30)
    now = datetime.now().date()

    base_a = random.uniform(0.05, 0.08)
    base_b = random.uniform(0.06, 0.09)

    for i in range(days_count):
        date = now - timedelta(days=days_count - 1 - i)

        def generate_group(base):
            rate = base + random.uniform(-0.015, 0.015)
            margin = random.uniform(0.005, 0.015)
            return {
                "conversionRate": round(max(0.001, rate), 4),
                "confidenceLower": round(max(0.001, rate - margin), 4),
                "confidenceUpper": round(rate + margin, 4)
            }

        history.append({
            "date": date.isoformat(),
            "groupA": generate_group(base_a),
            "groupB": generate_group(base_b)
        })

    return history


def generate_abtests() -> List[Dict[str, Any]]:
    tests = []
    test_names = [
        "首页banner测试", "商品列表排序测试", "价格显示格式测试",
        "按钮颜色测试", "促销标签测试", "购物车推荐算法测试"
    ]
    statuses = ["running", "paused", "completed"]

    for i, name in enumerate(test_names):
        status = random.choice(statuses)
        tests.append({
            "id": f"test_{uuid.uuid4().hex[:8]}",
            "name": name,
            "description": f"测试不同的{name}策略对转化率的影响",
            "status": status,
            "createdAt": (datetime.now() - timedelta(days=random.randint(1, 60))).isoformat(),
            "groupAName": "对照组",
            "groupBName": "实验组",
            "splitRatio": {"A": 50, "B": 50}
        })

    return tests


def generate_groups() -> List[Dict[str, Any]]:
    groups = [
        {"id": "all", "name": "全部用户", "userCount": 1000000, "description": "所有注册用户"},
        {"id": "new", "name": "新用户", "userCount": 150000, "description": "注册30天内的用户"},
        {"id": "active", "name": "活跃用户", "userCount": 350000, "description": "近7天有登录的用户"},
        {"id": "vip", "name": "VIP用户", "userCount": 50000, "description": "付费VIP会员"},
        {"id": "inactive", "name": "沉睡用户", "userCount": 450000, "description": "超过90天未登录的用户"}
    ]
    return groups
