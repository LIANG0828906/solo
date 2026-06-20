import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

CITIES = [
    {"id": "beijing", "name": "北京", "icon": "🏯"},
    {"id": "shanghai", "name": "上海", "icon": "🏙️"},
    {"id": "guangzhou", "name": "广州", "icon": "🌆"},
    {"id": "shenzhen", "name": "深圳", "icon": "🏢"},
    {"id": "chengdu", "name": "成都", "icon": "🐼"},
]

CITY_BASE_LEVELS = {
    "beijing": {"aqi": 85, "pm25": 55, "pm10": 95, "ozone": 70, "no2": 45},
    "shanghai": {"aqi": 65, "pm25": 40, "pm10": 70, "ozone": 85, "no2": 38},
    "guangzhou": {"aqi": 55, "pm25": 32, "pm10": 58, "ozone": 95, "no2": 30},
    "shenzhen": {"aqi": 48, "pm25": 28, "pm10": 50, "ozone": 88, "no2": 25},
    "chengdu": {"aqi": 75, "pm25": 48, "pm10": 85, "ozone": 60, "no2": 42},
}

POLLUTANT_RANGES = {
    "pm25": (0, 250),
    "pm10": (0, 400),
    "ozone": (0, 300),
    "no2": (0, 200),
}


def get_cities() -> List[Dict[str, str]]:
    return CITIES


def calculate_aqi(pm25: float, pm10: float, ozone: float, no2: float) -> int:
    weights = {"pm25": 0.4, "pm10": 0.25, "ozone": 0.2, "no2": 0.15}
    normalized = {
        "pm25": min(pm25 / 75, 1) * 300,
        "pm10": min(pm10 / 150, 1) * 300,
        "ozone": min(ozone / 160, 1) * 300,
        "no2": min(no2 / 100, 1) * 300,
    }
    aqi = sum(normalized[k] * weights[k] for k in weights)
    return max(0, min(500, int(round(aqi))))


def generate_current_data(city_id: str) -> Dict[str, Any]:
    base = CITY_BASE_LEVELS.get(city_id, CITY_BASE_LEVELS["beijing"])
    variation = 0.25

    pm25 = max(5, int(base["pm25"] * (1 + random.uniform(-variation, variation))))
    pm10 = max(10, int(base["pm10"] * (1 + random.uniform(-variation, variation))))
    ozone = max(10, int(base["ozone"] * (1 + random.uniform(-variation, variation))))
    no2 = max(5, int(base["no2"] * (1 + random.uniform(-variation, variation))))

    return {
        "cityId": city_id,
        "aqi": calculate_aqi(pm25, pm10, ozone, no2),
        "pm25": pm25,
        "pm10": pm10,
        "ozone": ozone,
        "no2": no2,
        "timestamp": datetime.now().isoformat(),
    }


def generate_all_current_data() -> List[Dict[str, Any]]:
    return [generate_current_data(city["id"]) for city in CITIES]


def generate_history_data(city_id: str, days: int = 7) -> Dict[str, Any]:
    base = CITY_BASE_LEVELS.get(city_id, CITY_BASE_LEVELS["beijing"])
    now = datetime.now()
    start_time = now - timedelta(days=days)
    total_hours = days * 24

    pollutants = ["pm25", "pm10", "ozone", "no2"]
    history: Dict[str, List[Dict[str, Any]]] = {p: [] for p in pollutants}

    for i in range(total_hours):
        timestamp = start_time + timedelta(hours=i)
        hour_factor = 1 + 0.3 * ((timestamp.hour - 12) / 12) ** 2
        day_variation = random.uniform(0.85, 1.15)

        for p in pollutants:
            min_val, max_val = POLLUTANT_RANGES[p]
            val = base[p] * hour_factor * day_variation * random.uniform(0.9, 1.1)
            val = max(min_val, min(max_val, int(val)))
            history[p].append({
                "timestamp": timestamp.isoformat(),
                "value": val,
            })

    return {"cityId": city_id, **history}
