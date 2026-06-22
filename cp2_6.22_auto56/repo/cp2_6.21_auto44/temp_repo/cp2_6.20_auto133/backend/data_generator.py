import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any

CITIES = [
    {"id": "beijing", "name": "北京", "icon": "🏛️"},
    {"id": "shanghai", "name": "上海", "icon": "🏙️"},
    {"id": "guangzhou", "name": "广州", "icon": "🌆"},
    {"id": "shenzhen", "name": "深圳", "icon": "🏢"},
    {"id": "chengdu", "name": "成都", "icon": "🐼"},
]

CITY_BASE_LEVELS = {
    "beijing": {"pm25": 65, "pm10": 95, "ozone": 85, "no2": 55},
    "shanghai": {"pm25": 45, "pm10": 70, "ozone": 95, "no2": 45},
    "guangzhou": {"pm25": 38, "pm10": 60, "ozone": 100, "no2": 40},
    "shenzhen": {"pm25": 32, "pm10": 52, "ozone": 90, "no2": 35},
    "chengdu": {"pm25": 55, "pm10": 80, "ozone": 75, "no2": 48},
}


def seeded_random(seed: str) -> random.Random:
    return random.Random(hash(seed))


def calculate_aqi(pm25: float, pm10: float, ozone: float, no2: float) -> int:
    max_sub_index = 0
    sub_indices = []

    if pm25 <= 35:
        sub_indices.append(pm25 / 35 * 50)
    elif pm25 <= 75:
        sub_indices.append(50 + (pm25 - 35) / 40 * 50)
    elif pm25 <= 115:
        sub_indices.append(100 + (pm25 - 75) / 40 * 50)
    elif pm25 <= 150:
        sub_indices.append(150 + (pm25 - 115) / 35 * 50)
    elif pm25 <= 250:
        sub_indices.append(200 + (pm25 - 150) / 100 * 100)
    else:
        sub_indices.append(300 + (pm25 - 250) / 100 * 200)

    if pm10 <= 50:
        sub_indices.append(pm10 / 50 * 50)
    elif pm10 <= 150:
        sub_indices.append(50 + (pm10 - 50) / 100 * 50)
    elif pm10 <= 250:
        sub_indices.append(100 + (pm10 - 150) / 100 * 50)
    elif pm10 <= 350:
        sub_indices.append(150 + (pm10 - 250) / 100 * 50)
    else:
        sub_indices.append(200 + (pm10 - 350) / 100 * 100)

    if ozone <= 100:
        sub_indices.append(ozone / 100 * 50)
    elif ozone <= 160:
        sub_indices.append(50 + (ozone - 100) / 60 * 50)
    elif ozone <= 215:
        sub_indices.append(100 + (ozone - 160) / 55 * 50)
    elif ozone <= 265:
        sub_indices.append(150 + (ozone - 215) / 50 * 50)
    else:
        sub_indices.append(200 + (ozone - 265) / 100 * 100)

    if no2 <= 40:
        sub_indices.append(no2 / 40 * 50)
    elif no2 <= 80:
        sub_indices.append(50 + (no2 - 40) / 40 * 50)
    elif no2 <= 180:
        sub_indices.append(100 + (no2 - 80) / 100 * 50)
    elif no2 <= 280:
        sub_indices.append(150 + (no2 - 180) / 100 * 50)
    else:
        sub_indices.append(200 + (no2 - 280) / 100 * 100)

    max_sub_index = int(max(sub_indices))
    return max(0, min(500, max_sub_index))


def generate_hourly_data(city_id: str, hours: int = 24 * 7) -> List[Dict[str, Any]]:
    base = CITY_BASE_LEVELS.get(city_id, {"pm25": 50, "pm10": 80, "ozone": 80, "no2": 45})
    rng = seeded_random(city_id)
    data = []
    now = datetime.now()

    for i in range(hours - 1, -1, -1):
        dt = now - timedelta(hours=i)
        hour = dt.hour
        time_str = dt.strftime("%Y-%m-%d %H:00")

        diurnal_factor = 1 + 0.3 * math.sin((hour - 6) * math.pi / 12)
        weekend_factor = 1.0
        if dt.weekday() >= 5:
            weekend_factor = 0.85
        random_factor = 0.8 + rng.random() * 0.4

        pm25 = int(max(5, min(250, base["pm25"] * diurnal_factor * weekend_factor * random_factor)))
        pm10 = int(max(10, min(350, base["pm10"] * diurnal_factor * weekend_factor * (0.9 + rng.random() * 0.3))))
        ozone = int(max(10, min(300, base["ozone"] * (1 + 0.5 * math.sin((hour - 10) * math.pi / 12)) * (0.85 + rng.random() * 0.3))))
        no2 = int(max(5, min(200, base["no2"] * diurnal_factor * weekend_factor * (0.85 + rng.random() * 0.3))))

        data.append({
            "time": time_str,
            "pm25": pm25,
            "pm10": pm10,
            "ozone": ozone,
            "no2": no2,
        })

    return data


def get_current_data(city_id: str) -> Dict[str, Any]:
    hourly = generate_hourly_data(city_id, hours=1)
    latest = hourly[-1]
    return {
        "cityId": city_id,
        "aqi": calculate_aqi(latest["pm25"], latest["pm10"], latest["ozone"], latest["no2"]),
        "pm25": latest["pm25"],
        "pm10": latest["pm10"],
        "ozone": latest["ozone"],
        "no2": latest["no2"],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def get_all_current_data() -> List[Dict[str, Any]]:
    return [get_current_data(city["id"]) for city in CITIES]


def get_history_data(city_id: str) -> Dict[str, Any]:
    return {
        "cityId": city_id,
        "data": generate_hourly_data(city_id),
    }
