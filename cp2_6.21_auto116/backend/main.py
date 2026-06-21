from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import time

from data_service import (
    generate_mock_time_series,
    calculate_summary,
    detect_anomalies,
    DashboardData
)

app = FastAPI(title="订单数据看板 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/dashboard", response_model=DashboardData)
async def get_dashboard():
    random.seed(int(time.time()) // 30)

    time_series = generate_mock_time_series(24)
    summary = calculate_summary(time_series)
    anomalies = detect_anomalies(time_series)

    return DashboardData(
        summary=summary,
        timeSeries=time_series,
        anomalies=anomalies
    )


@app.get("/api/anomalies/{anomaly_id}")
async def get_anomaly_detail(anomaly_id: str):
    random.seed(hash(anomaly_id) % 10000)

    time_series = generate_mock_time_series(24)
    anomalies = detect_anomalies(time_series)

    for anomaly in anomalies:
        if anomaly.id == anomaly_id:
            return anomaly

    return {"error": "Anomaly not found"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
