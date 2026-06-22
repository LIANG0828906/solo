from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from models import Base, SessionLocal, engine, seed_data, User, Space, Reservation, Notification

app = FastAPI(title="空间引力场API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


class ReservationCreate(BaseModel):
    user_id: int
    space_id: int
    date: str
    time_slot: str
    num_people: int


class ReservationResponse(BaseModel):
    id: int
    user_id: int
    space_id: int
    date: str
    time_slot: str
    num_people: int
    status: str
    created_at: datetime
    user_name: str
    space_name: str

    class Config:
        from_attributes = True


class SpaceResponse(BaseModel):
    id: int
    name: str
    space_type: str
    floor: int
    capacity: int
    available_seats: int

    class Config:
        from_attributes = True


class ReservationBrief(BaseModel):
    user_name: str
    time_slot: str
    status: str


class SpaceDetail(SpaceResponse):
    reservations: List[ReservationBrief] = []


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    type: str
    created_at: datetime
    read: bool

    class Config:
        from_attributes = True


@app.get("/api/spaces", response_model=List[SpaceResponse])
def list_spaces(
    floor: Optional[int] = None,
    space_type: Optional[str] = None,
    time_slot: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Space)
    if floor is not None:
        query = query.filter(Space.floor == floor)
    if space_type:
        query = query.filter(Space.space_type == space_type)

    spaces = query.all()

    if time_slot and date:
        result = []
        for space in spaces:
            confirmed_count = (
                db.query(func.coalesce(func.sum(Reservation.num_people), 0))
                .filter(
                    Reservation.space_id == space.id,
                    Reservation.date == date,
                    Reservation.time_slot == time_slot,
                    Reservation.status == "已确认",
                )
                .scalar()
            )
            if confirmed_count < space.capacity:
                result.append(space)
        return result

    return spaces


@app.get("/api/spaces/{space_id}", response_model=SpaceDetail)
def get_space(space_id: int, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    reservations = (
        db.query(Reservation)
        .filter(Reservation.space_id == space_id)
        .all()
    )
    reservation_briefs = [
        ReservationBrief(
            user_name=r.user.name,
            time_slot=r.time_slot,
            status=r.status,
        )
        for r in reservations
    ]
    return SpaceDetail(
        id=space.id,
        name=space.name,
        space_type=space.space_type,
        floor=space.floor,
        capacity=space.capacity,
        available_seats=space.available_seats,
        reservations=reservation_briefs,
    )


@app.post("/api/reservations", response_model=ReservationResponse)
def create_reservation(data: ReservationCreate, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == data.space_id).first()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    conflict = (
        db.query(Reservation)
        .filter(
            Reservation.space_id == data.space_id,
            Reservation.date == data.date,
            Reservation.time_slot == data.time_slot,
            Reservation.status != "已取消",
        )
        .first()
    )
    if conflict:
        raise HTTPException(status_code=400, detail="该时段已被预约，存在冲突")

    confirmed_count = (
        db.query(func.coalesce(func.sum(Reservation.num_people), 0))
        .filter(
            Reservation.space_id == data.space_id,
            Reservation.date == data.date,
            Reservation.time_slot == data.time_slot,
            Reservation.status == "已确认",
        )
        .scalar()
    )
    if confirmed_count + data.num_people > space.capacity:
        raise HTTPException(status_code=400, detail="该时段容量已满，无法预约")

    reservation = Reservation(
        user_id=data.user_id,
        space_id=data.space_id,
        date=data.date,
        time_slot=data.time_slot,
        num_people=data.num_people,
        status="待确认",
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    return ReservationResponse(
        id=reservation.id,
        user_id=reservation.user_id,
        space_id=reservation.space_id,
        date=reservation.date,
        time_slot=reservation.time_slot,
        num_people=reservation.num_people,
        status=reservation.status,
        created_at=reservation.created_at,
        user_name=reservation.user.name,
        space_name=reservation.space.name,
    )


@app.get("/api/reservations", response_model=List[ReservationResponse])
def list_reservations(
    user_id: Optional[int] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Reservation)
    if user_id is not None:
        query = query.filter(Reservation.user_id == user_id)
    if date:
        query = query.filter(Reservation.date == date)
    reservations = query.order_by(Reservation.created_at.desc()).all()
    return [
        ReservationResponse(
            id=r.id,
            user_id=r.user_id,
            space_id=r.space_id,
            date=r.date,
            time_slot=r.time_slot,
            num_people=r.num_people,
            status=r.status,
            created_at=r.created_at,
            user_name=r.user.name,
            space_name=r.space.name,
        )
        for r in reservations
    ]


@app.put("/api/reservations/{reservation_id}/confirm", response_model=ReservationResponse)
def confirm_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    reservation.status = "已确认"
    notification = Notification(
        user_id=reservation.user_id,
        message=f"您的预约（{reservation.space.name} {reservation.date} {reservation.time_slot}）已确认",
        type="confirm",
        read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(reservation)

    return ReservationResponse(
        id=reservation.id,
        user_id=reservation.user_id,
        space_id=reservation.space_id,
        date=reservation.date,
        time_slot=reservation.time_slot,
        num_people=reservation.num_people,
        status=reservation.status,
        created_at=reservation.created_at,
        user_name=reservation.user.name,
        space_name=reservation.space.name,
    )


@app.put("/api/reservations/{reservation_id}/cancel", response_model=ReservationResponse)
def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    reservation.status = "已取消"
    notification = Notification(
        user_id=reservation.user_id,
        message=f"您的预约（{reservation.space.name} {reservation.date} {reservation.time_slot}）已取消",
        type="cancel",
        read=False,
    )
    db.add(notification)
    db.commit()
    db.refresh(reservation)

    return ReservationResponse(
        id=reservation.id,
        user_id=reservation.user_id,
        space_id=reservation.space_id,
        date=reservation.date,
        time_slot=reservation.time_slot,
        num_people=reservation.num_people,
        status=reservation.status,
        created_at=reservation.created_at,
        user_name=reservation.user.name,
        space_name=reservation.space.name,
    )


@app.get("/api/notifications/{user_id}", response_model=List[NotificationResponse])
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.read == False)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifications


@app.get("/api/analytics/utilization")
def get_utilization():
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        spaces = db.query(Space).all()
        daily_data = []

        for day_offset in range(7):
            date = today - timedelta(days=6 - day_offset)
            date_str = date.strftime("%Y-%m-%d")
            total_util = 0.0
            count = 0
            for space in spaces:
                confirmed = (
                    db.query(func.coalesce(func.sum(Reservation.num_people), 0))
                    .filter(
                        Reservation.space_id == space.id,
                        Reservation.date == date_str,
                        Reservation.status == "已确认",
                    )
                    .scalar()
                )
                if space.capacity > 0:
                    total_util += (confirmed / space.capacity) * 100
                count += 1
            avg_util = round(total_util / count, 2) if count > 0 else 0
            daily_data.append({"date": date_str, "avg_utilization": avg_util})

        floors = set(s.floor for s in spaces)
        floor_breakdown = []
        for floor in sorted(floors):
            floor_spaces = [s for s in spaces if s.floor == floor]
            floor_daily = []
            for day_offset in range(7):
                date = today - timedelta(days=6 - day_offset)
                date_str = date.strftime("%Y-%m-%d")
                total_util = 0.0
                count = 0
                for space in floor_spaces:
                    confirmed = (
                        db.query(func.coalesce(func.sum(Reservation.num_people), 0))
                        .filter(
                            Reservation.space_id == space.id,
                            Reservation.date == date_str,
                            Reservation.status == "已确认",
                        )
                        .scalar()
                    )
                    if space.capacity > 0:
                        total_util += (confirmed / space.capacity) * 100
                    count += 1
                avg_util = round(total_util / count, 2) if count > 0 else 0
                floor_daily.append({"date": date_str, "avg_utilization": avg_util})
            floor_breakdown.append({"floor": floor, "daily": floor_daily})

        return {"daily": daily_data, "floor_breakdown": floor_breakdown}
    finally:
        db.close()


@app.get("/api/analytics/heatmap")
def get_heatmap(date: Optional[str] = None, db: Session = Depends(get_db)):
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")

    spaces = db.query(Space).all()
    result = []
    for space in spaces:
        confirmed_reservations = (
            db.query(Reservation)
            .filter(
                Reservation.space_id == space.id,
                Reservation.date == date,
                Reservation.status == "已确认",
            )
            .all()
        )
        occupied = sum(r.num_people for r in confirmed_reservations)
        occupancy_rate = round((occupied / space.capacity) * 100, 2) if space.capacity > 0 else 0
        available = max(space.capacity - occupied, 0)

        result.append({
            "id": space.id,
            "name": space.name,
            "floor": space.floor,
            "space_type": space.space_type,
            "capacity": space.capacity,
            "occupied": occupied,
            "available_seats": available,
            "occupancy_rate": occupancy_rate,
            "reservations": [
                {
                    "user_name": r.user.name,
                    "time_slot": r.time_slot,
                    "num_people": r.num_people,
                    "status": r.status,
                }
                for r in confirmed_reservations
            ],
        })
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
