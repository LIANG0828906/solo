import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import engine, SessionLocal, get_db, Base
from models import User, Trip, DayPlan, Attraction, Comment, Like, Favorite, Collaborator
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    TripCreate, TripUpdate, TripResponse, TripListItem,
    AttractionCreate, AttractionUpdate, AttractionResponse,
    CommentCreate, CommentResponse,
    InviteRequest, CollaboratorResponse
)

SECRET_KEY = "your-secret-key-change-in-production-0123456789"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

WS_HEARTBEAT_INTERVAL = 30
WS_HEARTBEAT_TIMEOUT = 60
WS_MESSAGE_TIMEOUT = 0.2

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

app = FastAPI(title="Travel Planner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.heartbeat_tasks: Dict[int, List[asyncio.Task]] = {}
        self.last_pong: Dict[WebSocket, float] = {}
        self.pending_messages: Dict[int, List[dict]] = {}

    async def connect(self, trip_id: int, websocket: WebSocket):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = []
            self.heartbeat_tasks[trip_id] = []
            self.pending_messages[trip_id] = []
        self.active_connections[trip_id].append(websocket)
        self.last_pong[websocket] = datetime.now().timestamp()

        heartbeat_task = asyncio.create_task(
            self._heartbeat_loop(trip_id, websocket)
        )
        self.heartbeat_tasks[trip_id].append(heartbeat_task)

        await self._flush_pending(trip_id, websocket)

    def disconnect(self, trip_id: int, websocket: WebSocket):
        if trip_id in self.active_connections:
            if websocket in self.active_connections[trip_id]:
                self.active_connections[trip_id].remove(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]
                for task in self.heartbeat_tasks.get(trip_id, []):
                    task.cancel()
                if trip_id in self.heartbeat_tasks:
                    del self.heartbeat_tasks[trip_id]

        self.last_pong.pop(websocket, None)

    async def _heartbeat_loop(self, trip_id: int, websocket: WebSocket):
        try:
            while True:
                await asyncio.sleep(WS_HEARTBEAT_INTERVAL)
                if websocket in self.active_connections.get(trip_id, []):
                    try:
                        await asyncio.wait_for(
                            websocket.send_json({"type": "ping", "timestamp": datetime.now().timestamp()}),
                            timeout=WS_MESSAGE_TIMEOUT,
                        )
                    except asyncio.TimeoutError:
                        self._queue_message(trip_id, {"type": "ping", "timestamp": datetime.now().timestamp()})
                    except Exception:
                        break

                    last = self.last_pong.get(websocket, 0)
                    if datetime.now().timestamp() - last > WS_HEARTBEAT_TIMEOUT:
                        try:
                            await websocket.close(code=1000, reason="Heartbeat timeout")
                        except Exception:
                            pass
                        break
        except asyncio.CancelledError:
            pass

    async def _flush_pending(self, trip_id: int, websocket: WebSocket):
        pending = self.pending_messages.get(trip_id, [])
        remaining = []
        for msg in pending:
            try:
                await asyncio.wait_for(
                    websocket.send_json(msg),
                    timeout=WS_MESSAGE_TIMEOUT,
                )
            except Exception:
                remaining.append(msg)
        self.pending_messages[trip_id] = remaining

    def _queue_message(self, trip_id: int, message: dict):
        if trip_id not in self.pending_messages:
            self.pending_messages[trip_id] = []
        self.pending_messages[trip_id].append(message)
        if len(self.pending_messages[trip_id]) > 100:
            self.pending_messages[trip_id] = self.pending_messages[trip_id][-50:]

    async def broadcast(self, trip_id: int, message: dict):
        if trip_id not in self.active_connections:
            return
        disconnected = []
        for connection in self.active_connections[trip_id]:
            try:
                await asyncio.wait_for(
                    connection.send_json(message),
                    timeout=WS_MESSAGE_TIMEOUT,
                )
            except asyncio.TimeoutError:
                self._queue_message(trip_id, message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(trip_id, conn)

    def record_pong(self, websocket: WebSocket):
        self.last_pong[websocket] = datetime.now().timestamp()


manager = ConnectionManager()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    return user


def get_current_user_required(current_user: Optional[User] = Depends(get_current_user)) -> User:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def trip_to_response(trip: Trip, current_user: Optional[User]) -> dict:
    like_count = len(trip.likes)
    comment_count = sum(len(a.comments) for a in trip.attractions)
    is_liked = False
    is_favorited = False
    if current_user:
        is_liked = any(l.user_id == current_user.id for l in trip.likes)
        is_favorited = any(f.user_id == current_user.id for f in trip.favorites)
    return {
        "id": trip.id,
        "title": trip.title,
        "description": trip.description,
        "cover_image": trip.cover_image,
        "is_public": trip.is_public,
        "user_id": trip.user_id,
        "created_at": trip.created_at,
        "updated_at": trip.updated_at,
        "owner": trip.owner,
        "day_plans": trip.day_plans,
        "attractions": trip.attractions,
        "like_count": like_count,
        "comment_count": comment_count,
        "is_liked": is_liked,
        "is_favorited": is_favorited,
    }


def trip_to_list_item(trip: Trip, current_user: Optional[User]) -> dict:
    like_count = len(trip.likes)
    comment_count = sum(len(a.comments) for a in trip.attractions)
    is_liked = False
    is_favorited = False
    if current_user:
        is_liked = any(l.user_id == current_user.id for l in trip.likes)
        is_favorited = any(f.user_id == current_user.id for f in trip.favorites)
    return {
        "id": trip.id,
        "title": trip.title,
        "description": trip.description,
        "cover_image": trip.cover_image,
        "is_public": trip.is_public,
        "user_id": trip.user_id,
        "created_at": trip.created_at,
        "updated_at": trip.updated_at,
        "owner": trip.owner,
        "like_count": like_count,
        "comment_count": comment_count,
        "is_liked": is_liked,
        "is_favorited": is_favorited,
    }


def can_edit_trip(trip: Trip, user: User) -> bool:
    if trip.user_id == user.id:
        return True
    return any(c.user_id == user.id for c in trip.collaborators)


@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data.username}",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user),
    )


@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user_required)):
    return current_user


@app.get("/api/trips", response_model=List[TripListItem])
def get_public_trips(
    skip: int = 0,
    limit: int = 20,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trips = (
        db.query(Trip)
        .filter(Trip.is_public == True)
        .order_by(Trip.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [trip_to_list_item(trip, current_user) for trip in trips]


@app.post("/api/trips", response_model=TripResponse)
def create_trip(
    trip_data: TripCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    new_trip = Trip(
        title=trip_data.title,
        description=trip_data.description,
        cover_image=trip_data.cover_image,
        is_public=trip_data.is_public,
        user_id=current_user.id,
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return trip_to_response(new_trip, current_user)


@app.get("/api/trips/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not trip.is_public:
        if not current_user:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if trip.user_id != current_user.id and not any(c.user_id == current_user.id for c in trip.collaborators):
            raise HTTPException(status_code=403, detail="Not allowed to view this trip")
    return trip_to_response(trip, current_user)


@app.put("/api/trips/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not can_edit_trip(trip, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to edit this trip")

    if trip_data.title is not None:
        trip.title = trip_data.title
    if trip_data.description is not None:
        trip.description = trip_data.description
    if trip_data.cover_image is not None:
        trip.cover_image = trip_data.cover_image
    if trip_data.is_public is not None:
        trip.is_public = trip_data.is_public

    db.commit()
    db.refresh(trip)
    return trip_to_response(trip, current_user)


@app.post("/api/trips/{trip_id}/publish", response_model=TripResponse)
def publish_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to publish this trip")

    trip.is_public = not trip.is_public
    db.commit()
    db.refresh(trip)
    return trip_to_response(trip, current_user)


@app.post("/api/trips/{trip_id}/like", response_model=dict)
def toggle_like(
    trip_id: int,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    existing_like = (
        db.query(Like)
        .filter(Like.trip_id == trip_id, Like.user_id == current_user.id)
        .first()
    )
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"liked": False, "like_count": len(trip.likes)}
    else:
        new_like = Like(trip_id=trip_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"liked": True, "like_count": len(trip.likes) + 1}


@app.post("/api/trips/{trip_id}/favorite", response_model=dict)
def toggle_favorite(
    trip_id: int,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    existing_fav = (
        db.query(Favorite)
        .filter(Favorite.trip_id == trip_id, Favorite.user_id == current_user.id)
        .first()
    )
    if existing_fav:
        db.delete(existing_fav)
        db.commit()
        return {"favorited": False}
    else:
        new_fav = Favorite(trip_id=trip_id, user_id=current_user.id)
        db.add(new_fav)
        db.commit()
        return {"favorited": True}


@app.post("/api/trips/{trip_id}/invite", response_model=CollaboratorResponse)
def invite_collaborator(
    trip_id: int,
    invite_data: InviteRequest,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can invite collaborators")

    target_user = (
        db.query(User)
        .filter(
            (User.username == invite_data.username_or_email)
            | (User.email == invite_data.username_or_email)
        )
        .first()
    )
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot invite yourself")

    existing_collab = (
        db.query(Collaborator)
        .filter(Collaborator.trip_id == trip_id, Collaborator.user_id == target_user.id)
        .first()
    )
    if existing_collab:
        raise HTTPException(status_code=400, detail="User already a collaborator")

    new_collab = Collaborator(trip_id=trip_id, user_id=target_user.id, role="editor")
    db.add(new_collab)
    db.commit()
    db.refresh(new_collab)

    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop and loop.is_running():
            loop.create_task(
                manager.broadcast(
                    trip_id,
                    {
                        "type": "collaborator_invite",
                        "data": {
                            "id": new_collab.id,
                            "user_id": target_user.id,
                            "user": {
                                "id": target_user.id,
                                "username": target_user.username,
                                "email": target_user.email,
                                "avatar": target_user.avatar,
                            },
                            "role": "editor",
                        },
                    },
                )
            )
    except:
        pass

    return new_collab


@app.post("/api/trips/{trip_id}/attractions", response_model=AttractionResponse)
async def add_attraction(
    trip_id: int,
    attr_data: AttractionCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not can_edit_trip(trip, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to edit this trip")

    max_order = db.query(func.max(Attraction.order_index)).filter(Attraction.trip_id == trip_id).scalar() or 0

    new_attr = Attraction(
        trip_id=trip_id,
        name=attr_data.name,
        description=attr_data.description,
        location=attr_data.location,
        image_url=attr_data.image_url,
        day_plan_id=attr_data.day_plan_id,
        order_index=max_order + 1,
        latitude=attr_data.latitude,
        longitude=attr_data.longitude,
    )
    db.add(new_attr)
    db.commit()
    db.refresh(new_attr)

    await manager.broadcast(
        trip_id,
        {
            "type": "attraction_add",
            "data": {
                "id": new_attr.id,
                "trip_id": new_attr.trip_id,
                "name": new_attr.name,
                "description": new_attr.description,
                "location": new_attr.location,
                "image_url": new_attr.image_url,
                "day_plan_id": new_attr.day_plan_id,
                "order_index": new_attr.order_index,
                "latitude": new_attr.latitude,
                "longitude": new_attr.longitude,
                "created_at": new_attr.created_at.isoformat(),
            },
        },
    )

    return new_attr


@app.put("/api/attractions/{attr_id}", response_model=AttractionResponse)
async def update_attraction(
    attr_id: int,
    attr_data: AttractionUpdate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    attr = db.query(Attraction).filter(Attraction.id == attr_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")
    trip = db.query(Trip).filter(Trip.id == attr.trip_id).first()
    if not can_edit_trip(trip, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to edit this attraction")

    if attr_data.name is not None:
        attr.name = attr_data.name
    if attr_data.description is not None:
        attr.description = attr_data.description
    if attr_data.location is not None:
        attr.location = attr_data.location
    if attr_data.image_url is not None:
        attr.image_url = attr_data.image_url
    if attr_data.day_plan_id is not None:
        attr.day_plan_id = attr_data.day_plan_id
    if attr_data.order_index is not None:
        attr.order_index = attr_data.order_index
    if attr_data.latitude is not None:
        attr.latitude = attr_data.latitude
    if attr_data.longitude is not None:
        attr.longitude = attr_data.longitude

    db.commit()
    db.refresh(attr)

    msg_type = "attraction_update"
    if attr_data.order_index is not None and attr_data.day_plan_id is not None:
        msg_type = "attraction_move"

    await manager.broadcast(
        attr.trip_id,
        {
            "type": msg_type,
            "data": {
                "id": attr.id,
                "trip_id": attr.trip_id,
                "name": attr.name,
                "description": attr.description,
                "location": attr.location,
                "image_url": attr.image_url,
                "day_plan_id": attr.day_plan_id,
                "order_index": attr.order_index,
                "latitude": attr.latitude,
                "longitude": attr.longitude,
            },
        },
    )

    return attr


@app.delete("/api/attractions/{attr_id}", response_model=dict)
async def delete_attraction(
    attr_id: int,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    attr = db.query(Attraction).filter(Attraction.id == attr_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")
    trip = db.query(Trip).filter(Trip.id == attr.trip_id).first()
    if not can_edit_trip(trip, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to delete this attraction")

    trip_id = attr.trip_id
    attr_id_to_delete = attr.id
    db.delete(attr)
    db.commit()

    await manager.broadcast(
        trip_id,
        {
            "type": "attraction_delete",
            "data": {"id": attr_id_to_delete},
        },
    )

    return {"success": True}


@app.post("/api/attractions/{attr_id}/comments", response_model=CommentResponse)
async def add_comment(
    attr_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    attr = db.query(Attraction).filter(Attraction.id == attr_id).first()
    if not attr:
        raise HTTPException(status_code=404, detail="Attraction not found")

    comment_count = len(attr.comments)
    if comment_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 comments per attraction")

    new_comment = Comment(
        attraction_id=attr_id,
        user_id=current_user.id,
        content=comment_data.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    await manager.broadcast(
        attr.trip_id,
        {
            "type": "comment_add",
            "data": {
                "id": new_comment.id,
                "attraction_id": new_comment.attraction_id,
                "user_id": new_comment.user_id,
                "content": new_comment.content,
                "created_at": new_comment.created_at.isoformat(),
                "user": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "email": current_user.email,
                    "avatar": current_user.avatar,
                },
            },
        },
    )

    return new_comment


@app.get("/api/user/favorites", response_model=List[TripListItem])
def get_favorites(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    favorites = (
        db.query(Favorite)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    trips = [fav.trip for fav in favorites]
    return [trip_to_list_item(trip, current_user) for trip in trips]


@app.get("/api/user/trips", response_model=List[TripListItem])
def get_my_trips(
    current_user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    owned_trips = (
        db.query(Trip)
        .filter(Trip.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
        .all()
    )
    collab_trips = (
        db.query(Trip)
        .join(Collaborator)
        .filter(Collaborator.user_id == current_user.id)
        .order_by(Trip.created_at.desc())
        .all()
    )
    all_trips = owned_trips + collab_trips
    seen = set()
    unique_trips = []
    for trip in all_trips:
        if trip.id not in seen:
            seen.add(trip.id)
            unique_trips.append(trip)
    return [trip_to_list_item(trip, current_user) for trip in unique_trips]


@app.websocket("/ws/trip/{trip_id}")
async def websocket_endpoint(websocket: WebSocket, trip_id: int):
    await manager.connect(trip_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                msg_data = message.get("data", {})

                if msg_type == "pong":
                    manager.record_pong(websocket)
                    continue

                if msg_type:
                    message["timestamp"] = datetime.now().timestamp()
                    await manager.broadcast(trip_id, {"type": msg_type, "data": msg_data, "timestamp": message["timestamp"]})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).count() > 0:
            return

        hashed = get_password_hash("123456")
        user1 = User(username="demo", email="demo@example.com", hashed_password=hashed,
                     avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=demo")
        user2 = User(username="alice", email="alice@example.com", hashed_password=hashed,
                     avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=alice")
        user3 = User(username="bob", email="bob@example.com", hashed_password=hashed,
                     avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=bob")
        db.add_all([user1, user2, user3])
        db.commit()

        trip1 = Trip(
            title="东京5日深度游",
            description="探索东京的传统与现代，从浅草寺到涩谷十字路口，体验日本首都的独特魅力。",
            cover_image="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
            is_public=True,
            user_id=1,
        )
        trip2 = Trip(
            title="云南丽江大理环线",
            description="彩云之南，风花雪月。丽江古城、洱海、苍山，感受云南的慢生活。",
            cover_image="https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
            is_public=True,
            user_id=2,
        )
        trip3 = Trip(
            title="周末郊野露营",
            description="远离城市喧嚣，亲近大自然的周末露营计划。",
            cover_image="",
            is_public=False,
            user_id=1,
        )
        db.add_all([trip1, trip2, trip3])
        db.commit()

        day1_trip1 = DayPlan(trip_id=1, day_number=1, date="2025-01-01", notes="抵达东京，熟悉环境")
        day2_trip1 = DayPlan(trip_id=1, day_number=2, date="2025-01-02", notes="浅草寺+晴空塔")
        day3_trip1 = DayPlan(trip_id=1, day_number=3, date="2025-01-03", notes="原宿+涩谷")
        db.add_all([day1_trip1, day2_trip1, day3_trip1])
        db.commit()

        attrs = [
            Attraction(trip_id=1, day_plan_id=1, name="成田机场", description="抵达东京成田国际机场",
                       location="日本千叶县成田市", order_index=1,
                       latitude=35.7720, longitude=140.3929),
            Attraction(trip_id=1, day_plan_id=2, name="浅草寺", description="东京最古老的寺庙，雷门是标志",
                       location="东京都台东区浅草", image_url="https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600",
                       order_index=1, latitude=35.7148, longitude=139.7967),
            Attraction(trip_id=1, day_plan_id=2, name="晴空塔", description="日本最高建筑，俯瞰东京全景",
                       location="东京都墨田区", image_url="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600",
                       order_index=2, latitude=35.7101, longitude=139.8107),
            Attraction(trip_id=1, day_plan_id=3, name="原宿竹下通", description="时尚年轻人的聚集地",
                       location="东京都涩谷区原宿", order_index=1,
                       latitude=35.6705, longitude=139.7027),
            Attraction(trip_id=1, day_plan_id=3, name="涩谷十字路口", description="世界最繁忙的十字路口",
                       location="东京都涩谷区", image_url="https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=600",
                       order_index=2, latitude=35.6595, longitude=139.7004),
            Attraction(trip_id=2, name="丽江古城", description="世界文化遗产，纳西族古城",
                       location="云南省丽江市", image_url="https://images.unsplash.com/photo-1537531383496-f4749b8032cf?w=600",
                       order_index=1, latitude=26.8721, longitude=100.2299),
            Attraction(trip_id=2, name="洱海", description="风花雪月，苍山洱海",
                       location="云南省大理市", image_url="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
                       order_index=2, latitude=25.8515, longitude=100.1719),
        ]
        db.add_all(attrs)
        db.commit()

        comments = [
            Comment(attraction_id=2, user_id=2, content="浅草寺的雷门真的很壮观！"),
            Comment(attraction_id=2, user_id=3, content="记得穿和服拍照，很有感觉~"),
            Comment(attraction_id=5, user_id=1, content="晚上的涩谷更有感觉。"),
            Comment(attraction_id=6, user_id=1, content="丽江古城晚上很美。"),
            Comment(attraction_id=7, user_id=3, content="洱海一定要骑电动车环湖！"),
        ]
        db.add_all(comments)
        db.commit()

        likes = [
            Like(trip_id=1, user_id=2),
            Like(trip_id=1, user_id=3),
            Like(trip_id=2, user_id=1),
            Like(trip_id=2, user_id=3),
        ]
        db.add_all(likes)

        favorites = [
            Favorite(trip_id=2, user_id=1),
            Favorite(trip_id=1, user_id=3),
        ]
        db.add_all(favorites)

        collaborators = [
            Collaborator(trip_id=1, user_id=2, role="editor"),
            Collaborator(trip_id=2, user_id=1, role="viewer"),
        ]
        db.add_all(collaborators)

        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {"message": "Travel Planner API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
