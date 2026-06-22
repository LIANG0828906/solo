from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import List, Optional
import os

from models import SessionLocal, User, Plant, Post, Comment, Like

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

app = FastAPI(title="Virtual Plant Garden API")

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


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
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


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class PlantCreate(BaseModel):
    variety: str
    name: str


class PlantUpdate(BaseModel):
    stage: Optional[str] = None
    water: Optional[int] = None
    fertilizer: Optional[int] = None
    sunlight: Optional[int] = None


class PlantResponse(BaseModel):
    id: int
    user_id: int
    variety: str
    name: str
    stage: str
    days: int
    water: int
    fertilizer: int
    sunlight: int
    created_at: datetime

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    username: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: int
    user_id: int
    plant_id: Optional[int]
    image_url: str
    variety: str
    likes: int
    liked_by_me: bool
    username: str
    comments: List[CommentResponse]
    created_at: datetime

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    plant_id: Optional[int] = None
    image_url: str
    variety: str


class CommentCreate(BaseModel):
    content: str


def calculate_stage(plant: Plant) -> str:
    avg_health = (plant.water + plant.fertilizer + plant.sunlight) / 3
    if avg_health < 20:
        return "wilting"
    if plant.days >= 14:
        return "flowering"
    if plant.days >= 5:
        return "growing"
    return "sprout"


@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_data.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    sample_plants = [
        {"variety": "pothos", "name": "小绿", "days": 12, "stage": "growing", "water": 75, "fertilizer": 60, "sunlight": 70},
        {"variety": "sunflower", "name": "阳阳", "days": 18, "stage": "flowering", "water": 85, "fertilizer": 70, "sunlight": 90},
        {"variety": "succulent", "name": "肉肉", "days": 5, "stage": "sprout", "water": 55, "fertilizer": 40, "sunlight": 65},
    ]
    for sp in sample_plants:
        db_plant = Plant(user_id=db_user.id, **sp)
        db.add(db_plant)
    
    db.commit()

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@app.get("/api/plants", response_model=List[PlantResponse])
def get_plants(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plants = db.query(Plant).filter(Plant.user_id == current_user.id).all()
    return plants


@app.post("/api/plants", response_model=PlantResponse)
def create_plant(plant_data: PlantCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_plants_count = db.query(Plant).filter(Plant.user_id == current_user.id).count()
    if user_plants_count >= 9:
        raise HTTPException(status_code=400, detail="Maximum 9 plants allowed")

    db_plant = Plant(
        user_id=current_user.id,
        variety=plant_data.variety,
        name=plant_data.name,
        stage="sprout",
        days=0,
        water=50,
        fertilizer=30,
        sunlight=40
    )
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant


@app.get("/api/plants/{plant_id}", response_model=PlantResponse)
def get_plant(plant_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == current_user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@app.put("/api/plants/{plant_id}", response_model=PlantResponse)
def update_plant(plant_id: int, plant_data: PlantUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == current_user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    if plant_data.stage is not None:
        plant.stage = plant_data.stage
    if plant_data.water is not None:
        plant.water = max(0, min(100, plant_data.water))
    if plant_data.fertilizer is not None:
        plant.fertilizer = max(0, min(100, plant_data.fertilizer))
    if plant_data.sunlight is not None:
        plant.sunlight = max(0, min(100, plant_data.sunlight))

    plant.stage = calculate_stage(plant)
    db.commit()
    db.refresh(plant)
    return plant


@app.post("/api/plants/{plant_id}/water", response_model=PlantResponse)
def water_plant(plant_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == current_user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    plant.water = min(100, plant.water + 15)
    plant.days = max(plant.days, 1)
    plant.stage = calculate_stage(plant)
    db.commit()
    db.refresh(plant)
    return plant


@app.post("/api/plants/{plant_id}/fertilize", response_model=PlantResponse)
def fertilize_plant(plant_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == current_user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    plant.fertilizer = min(100, plant.fertilizer + 12)
    plant.days = max(plant.days, 1)
    plant.stage = calculate_stage(plant)
    db.commit()
    db.refresh(plant)
    return plant


@app.post("/api/plants/{plant_id}/sunlight", response_model=PlantResponse)
def sunlight_plant(plant_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plant = db.query(Plant).filter(Plant.id == plant_id, Plant.user_id == current_user.id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    plant.sunlight = min(100, plant.sunlight + 18)
    plant.days = max(plant.days, 1)
    plant.stage = calculate_stage(plant)
    db.commit()
    db.refresh(plant)
    return plant


@app.get("/api/posts", response_model=List[PostResponse])
def get_posts(
    page: int = 1,
    variety: Optional[str] = None,
    sortBy: Optional[str] = "latest",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Post)
    if variety and variety != "all":
        query = query.filter(Post.variety == variety)

    if sortBy == "likes":
        query = query.order_by(Post.likes_count.desc(), Post.created_at.desc())
    else:
        query = query.order_by(Post.created_at.desc())

    posts = query.offset((page - 1) * 10).limit(10).all()

    result = []
    for post in posts:
        user_liked = db.query(Like).filter(
            Like.post_id == post.id,
            Like.user_id == current_user.id
        ).first() is not None

        comments = db.query(Comment).filter(Comment.post_id == post.id).order_by(Comment.created_at.desc()).limit(3).all()
        comment_responses = []
        for comment in comments:
            comment_user = db.query(User).filter(User.id == comment.user_id).first()
            comment_responses.append(CommentResponse(
                id=comment.id,
                post_id=comment.post_id,
                user_id=comment.user_id,
                username=comment_user.username if comment_user else "Unknown",
                content=comment.content,
                created_at=comment.created_at
            ))

        post_user = db.query(User).filter(User.id == post.user_id).first()
        result.append(PostResponse(
            id=post.id,
            user_id=post.user_id,
            plant_id=post.plant_id,
            image_url=post.image_url,
            variety=post.variety,
            likes=post.likes_count,
            liked_by_me=user_liked,
            username=post_user.username if post_user else "Unknown",
            comments=list(reversed(comment_responses)),
            created_at=post.created_at
        ))

    if page == 1 and len(result) < 3:
        sample_varieties = ["pothos", "cactus", "sunflower", "succulent"]
        sample_names = ["花花世界", "绿手指", "植物达人", "阳光园丁", "多肉控", "森林精灵"]
        comments_sample = [
            "长得真好！",
            "太美了，求养护秘诀",
            "我的也快开花了~",
            "这个品种叫什么呀？",
            "养护得太用心了👏",
            "我也想养一盆！"
        ]

        for i in range(8):
            variety = sample_varieties[i % 4]
            seed = 100 + i
            encoded_prompt = f"a%20beautiful%20{variety}%20plant%20in%20a%20pot%2C%20soft%20natural%20lighting%2C%20gentle%20bokeh%20background%2C%20professional%20photography"
            image_url = f"https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt={encoded_prompt}&image_size=square_hd&seed={seed}"

            post = Post(
                user_id=1,
                plant_id=None,
                image_url=image_url,
                variety=variety,
                likes_count=15 + i * 7,
                created_at=datetime.utcnow() - timedelta(hours=i * 3)
            )
            db.add(post)
            db.commit()
            db.refresh(post)

            for j in range(min(2, i + 1)):
                comment = Comment(
                    post_id=post.id,
                    user_id=1,
                    content=comments_sample[(i + j) % len(comments_sample)]
                )
                db.add(comment)
            db.commit()

            user_liked = db.query(Like).filter(
                Like.post_id == post.id,
                Like.user_id == current_user.id
            ).first() is not None

            post_comments = db.query(Comment).filter(Comment.post_id == post.id).order_by(Comment.created_at.desc()).limit(3).all()
            comment_responses = []
            for comment in post_comments:
                comment_user = db.query(User).filter(User.id == comment.user_id).first()
                comment_responses.append(CommentResponse(
                    id=comment.id,
                    post_id=comment.post_id,
                    user_id=comment.user_id,
                    username=sample_names[(i + j) % len(sample_names)],
                    content=comment.content,
                    created_at=comment.created_at
                ))

            result.append(PostResponse(
                id=post.id,
                user_id=post.user_id,
                plant_id=post.plant_id,
                image_url=post.image_url,
                variety=post.variety,
                likes=post.likes_count,
                liked_by_me=user_liked,
                username=sample_names[i % len(sample_names)],
                comments=list(reversed(comment_responses)),
                created_at=post.created_at
            ))

    return result


@app.post("/api/posts", response_model=PostResponse)
def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_post = Post(
        user_id=current_user.id,
        plant_id=post_data.plant_id,
        image_url=post_data.image_url,
        variety=post_data.variety
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    return PostResponse(
        id=db_post.id,
        user_id=db_post.user_id,
        plant_id=db_post.plant_id,
        image_url=db_post.image_url,
        variety=db_post.variety,
        likes=db_post.likes_count,
        liked_by_me=False,
        username=current_user.username,
        comments=[],
        created_at=db_post.created_at
    )


@app.post("/api/posts/{post_id}/like")
def like_post(post_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()

    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        db.commit()
        return {"likes": post.likes_count, "liked": False}
    else:
        new_like = Like(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.likes_count += 1
        db.commit()
        return {"likes": post.likes_count, "liked": True}


@app.post("/api/posts/{post_id}/comment", response_model=CommentResponse)
def add_comment(post_id: int, comment_data: CommentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if len(comment_data.content) > 50:
        raise HTTPException(status_code=400, detail="Comment too long (max 50 characters)")

    db_comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment_data.content.strip()
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return CommentResponse(
        id=db_comment.id,
        post_id=db_comment.post_id,
        user_id=db_comment.user_id,
        username=current_user.username,
        content=db_comment.content,
        created_at=db_comment.created_at
    )


@app.get("/")
def root():
    return {"message": "Virtual Plant Garden API", "version": "1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
