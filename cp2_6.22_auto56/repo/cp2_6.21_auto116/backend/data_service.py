from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import random
import math


class OrderSummary(BaseModel):
    totalOrders: float
    totalSales: float
    avgOrderValue: float
    totalInventoryChange: float


class TimeSeriesPoint(BaseModel):
    time: str
    timestamp: float
    sales: float
    orders: float
    inventory: float


class AnomalyRecord(BaseModel):
    id: str
    time: str
    timestamp: float
    platform: str
    metric: str
    currentValue: float
    historicalAvg: float
    stdDev: float
    deviation: float
    threshold: float
    severity: str


class DashboardData(BaseModel):
    summary: OrderSummary
    timeSeries: List[TimeSeriesPoint]
    anomalies: List[AnomalyRecord]


def generate_mock_time_series(hours: int = 24) -> List[TimeSeriesPoint]:
    points = []
    now = datetime.now()
    base_sales = 50000
    base_orders = 200
    base_inventory = 10000

    cumulative_inventory = base_inventory

    for i in range(hours):
        dt = now - timedelta(hours=hours - 1 - i)
        hour_factor = 1 + 0.3 * math.sin((dt.hour - 6) * math.pi / 12)
        noise = random.uniform(-0.1, 0.1)

        sales = base_sales * hour_factor * (1 + noise)
        orders = base_orders * hour_factor * (1 + noise)

        if i in [5, 14, 19]:
            anomaly_factor = random.choice([1.5, 1.8, 0.4, 0.3])
            sales *= anomaly_factor
            orders *= anomaly_factor * random.uniform(0.9, 1.1)

        inventory_consumption = orders * random.uniform(0.8, 1.5)
        restock = random.choice([0, 0, 0, 300, 500]) if random.random() > 0.7 else 0

        cumulative_inventory = max(
            500,
            cumulative_inventory - inventory_consumption + restock
        )

        cumulative_inventory += random.uniform(-50, 50)

        points.append(TimeSeriesPoint(
            time=dt.strftime("%m-%d %H:%M"),
            timestamp=dt.timestamp() * 1000,
            sales=round(sales, 2),
            orders=round(orders),
            inventory=round(cumulative_inventory)
        ))

    return points


def calculate_summary(time_series: List[TimeSeriesPoint]) -> OrderSummary:
    total_sales = sum(p.sales for p in time_series)
    total_orders = sum(p.orders for p in time_series)
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0

    if len(time_series) >= 2:
        inventory_change = time_series[-1].inventory - time_series[0].inventory
    else:
        inventory_change = 0

    return OrderSummary(
        totalOrders=round(total_orders),
        totalSales=round(total_sales, 2),
        avgOrderValue=round(avg_order_value, 2),
        totalInventoryChange=inventory_change
    )


def sliding_window_std(values: List[float], window_size: int = 6) -> List[tuple]:
    results = []
    for i in range(len(values)):
        start = max(0, i - window_size)
        window = values[start:i]
        if len(window) >= 3:
            mean = sum(window) / len(window)
            variance = sum((x - mean) ** 2 for x in window) / len(window)
            std = math.sqrt(variance)
            results.append((mean, std))
        else:
            results.append((None, None))
    return results


def detect_anomalies(time_series: List[TimeSeriesPoint]) -> List[AnomalyRecord]:
    anomalies = []
    platforms = ['web', 'miniapp', 'app']
    metric_weights = {
        'web': 0.4,
        'miniapp': 0.35,
        'app': 0.25
    }

    sales_values = [p.sales for p in time_series]
    sales_stats = sliding_window_std(sales_values)

    orders_values = [p.orders for p in time_series]
    orders_stats = sliding_window_std(orders_values)

    inventory_values = [p.inventory for p in time_series]
    inventory_stats = sliding_window_std(inventory_values)

    for i, point in enumerate(time_series):
        if i < 6:
            continue

        sales_mean, sales_std = sales_stats[i]
        orders_mean, orders_std = orders_stats[i]
        inventory_mean, inventory_std = inventory_stats[i]

        if sales_mean and sales_std and sales_std > 0:
            sales_deviation = (point.sales - sales_mean) / sales_mean
            if abs(sales_deviation) > 2 * (sales_std / sales_mean):
                platform = random.choice(platforms)
                platform_weight = metric_weights[platform]
                deviation = sales_deviation * random.uniform(0.8, 1.2) * platform_weight * 3

                if abs(deviation) > 0.3:
                    anomaly = AnomalyRecord(
                        id=f"anomaly_{int(point.timestamp)}_sales_{platform}",
                        time=point.time,
                        timestamp=point.timestamp,
                        platform=platform,
                        metric='sales',
                        currentValue=round(point.sales * platform_weight, 2),
                        historicalAvg=round(sales_mean * platform_weight, 2),
                        stdDev=round(sales_std * platform_weight, 2),
                        deviation=round(deviation, 4),
                        threshold=0.3,
                        severity='critical' if abs(deviation) > 0.5 else 'warning'
                    )
                    anomalies.append(anomaly)

        if orders_mean and orders_std and orders_std > 0:
            orders_deviation = (point.orders - orders_mean) / orders_mean
            if abs(orders_deviation) > 2 * (orders_std / orders_mean):
                platform = random.choice(platforms)
                platform_weight = metric_weights[platform]
                deviation = orders_deviation * random.uniform(0.8, 1.2) * platform_weight * 2.5

                if abs(deviation) > 0.25 and random.random() > 0.5:
                    anomaly = AnomalyRecord(
                        id=f"anomaly_{int(point.timestamp)}_orders_{platform}",
                        time=point.time,
                        timestamp=point.timestamp,
                        platform=platform,
                        metric='orders',
                        currentValue=round(point.orders * platform_weight),
                        historicalAvg=round(orders_mean * platform_weight, 2),
                        stdDev=round(orders_std * platform_weight, 2),
                        deviation=round(deviation, 4),
                        threshold=0.25,
                        severity='critical' if abs(deviation) > 0.4 else 'warning'
                    )
                    anomalies.append(anomaly)

        if inventory_mean and inventory_std and inventory_std > 0:
            inventory_deviation = (point.inventory - inventory_mean) / inventory_mean
            if abs(inventory_deviation) > 2 * (inventory_std / inventory_mean):
                platform = random.choice(platforms)
                platform_weight = metric_weights[platform]
                deviation = inventory_deviation * random.uniform(0.8, 1.2)

                if abs(deviation) > 0.2:
                    anomaly = AnomalyRecord(
                        id=f"anomaly_{int(point.timestamp)}_inventory_{platform}",
                        time=point.time,
                        timestamp=point.timestamp,
                        platform=platform,
                        metric='inventory',
                        currentValue=round(point.inventory * platform_weight),
                        historicalAvg=round(inventory_mean * platform_weight, 2),
                        stdDev=round(inventory_std * platform_weight, 2),
                        deviation=round(deviation, 4),
                        threshold=0.2,
                        severity='critical' if abs(deviation) > 0.35 else 'warning'
                    )
                    anomalies.append(anomaly)

    anomalies.sort(key=lambda x: x.timestamp, reverse=True)

    for _ in range(random.randint(1, 3)):
        idx = random.randint(0, len(time_series) - 1)
        point = time_series[idx]
        platform = random.choice(platforms)

        base_value = 299
        avg_value = base_value
        std = 30
        deviation = random.choice([0.28, -0.25, 0.35, -0.3])
        current = avg_value * (1 + deviation)

        anomaly = AnomalyRecord(
            id=f"anomaly_{int(point.timestamp)}_price_{platform}",
            time=point.time,
            timestamp=point.timestamp,
            platform=platform,
            metric='price',
            currentValue=round(current, 2),
            historicalAvg=round(avg_value, 2),
            stdDev=round(std, 2),
            deviation=round(deviation, 4),
            threshold=0.2,
            severity='critical' if abs(deviation) > 0.35 else 'warning'
        )
        anomalies.append(anomaly)

    anomalies.sort(key=lambda x: x.timestamp, reverse=True)
    return anomalies[:20]
