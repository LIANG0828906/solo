from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import random

from database import get_db, init_db
from models import User, Word, ReviewRecord, CorpusItem

SECRET_KEY = "your-secret-key-for-yujing-vocab-app"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="语镜 - 多媒体语境词汇学习 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: str

    class Config:
        from_attributes = True


class WordCreate(BaseModel):
    word: str
    definition: str
    corpus_id: Optional[str] = ""


class WordResponse(BaseModel):
    id: int
    word: str
    definition: str
    corpus_id: str
    example_sentence: str
    example_translation: str
    audio_url: str
    master_count: int
    review_count: int
    forgetting_index: float
    created_at: datetime
    last_reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LearnRequest(BaseModel):
    word_id: int
    is_mastered: bool


class ReviewPlanItem(BaseModel):
    word: WordResponse
    priority: float


class StatsResponse(BaseModel):
    total_words: int
    mastered_words: int
    streak_days: int
    weekly_data: List[int]


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


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization.split(" ")[1]
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


def seed_corpus_data(db: Session):
    existing = db.query(CorpusItem).first()
    if existing:
        return

    corpus_data = [
        {
            "corpus_id": "mov_001",
            "word": "serendipity",
            "example_sentence": "It was pure serendipity that we met at the coffee shop that day.",
            "example_translation": "我们那天在咖啡店相遇纯粹是机缘巧合。",
            "audio_url": "/audio/mov_001.mp3",
            "source": "电影《西雅图夜未眠》",
        },
        {
            "corpus_id": "mov_002",
            "word": "ephemeral",
            "example_sentence": "Fame in the modern world is often ephemeral and fleeting.",
            "example_translation": "现代社会的名气往往是短暂而易逝的。",
            "audio_url": "/audio/mov_002.mp3",
            "source": "电影《肖申克的救赎》",
        },
        {
            "corpus_id": "mov_003",
            "word": "resilient",
            "example_sentence": "Children are remarkably resilient and can adapt to change quickly.",
            "example_translation": "孩子们有着惊人的适应力，能很快适应变化。",
            "audio_url": "/audio/mov_003.mp3",
            "source": "电影《奇迹男孩》",
        },
        {
            "corpus_id": "mov_004",
            "word": "ubiquitous",
            "example_sentence": "Smartphones have become ubiquitous in modern society.",
            "example_translation": "智能手机在现代社会已经无处不在。",
            "audio_url": "/audio/mov_004.mp3",
            "source": "纪录片《互联网时代》",
        },
        {
            "corpus_id": "music_001",
            "word": "melancholy",
            "example_sentence": "There's a touch of melancholy in his voice when he sings that song.",
            "example_translation": "他唱那首歌时声音里带着一丝忧郁。",
            "audio_url": "/audio/music_001.mp3",
            "source": "歌曲《Yesterday》",
        },
        {
            "corpus_id": "music_002",
            "word": "euphoria",
            "example_sentence": "The crowd was filled with euphoria as the band took the stage.",
            "example_translation": "乐队登台时，人群中充满了狂喜。",
            "audio_url": "/audio/music_002.mp3",
            "source": "歌曲《Dancing Queen》",
        },
        {
            "corpus_id": "news_001",
            "word": "pragmatic",
            "example_sentence": "The government took a pragmatic approach to solving the housing crisis.",
            "example_translation": "政府采取了务实的方法来解决住房危机。",
            "audio_url": "/audio/news_001.mp3",
            "source": "BBC新闻",
        },
        {
            "corpus_id": "news_002",
            "word": "unprecedented",
            "example_sentence": "The pandemic caused unprecedented changes to our daily lives.",
            "example_translation": "疫情给我们的日常生活带来了前所未有的变化。",
            "audio_url": "/audio/news_002.mp3",
            "source": "CNN新闻",
        },
        {
            "corpus_id": "mov_005",
            "word": "meticulous",
            "example_sentence": "She was meticulous in her research, checking every source twice.",
            "example_translation": "她做研究一丝不苟，每个资料来源都检查两遍。",
            "audio_url": "/audio/mov_005.mp3",
            "source": "电影《穿普拉达的女王》",
        },
        {
            "corpus_id": "mov_006",
            "word": "eloquent",
            "example_sentence": "The lawyer gave an eloquent speech that moved the entire courtroom.",
            "example_translation": "律师发表了感人至深的演讲，感动了整个法庭。",
            "audio_url": "/audio/mov_006.mp3",
            "source": "电影《杀死一只知更鸟》",
        },
    ]

    for item in corpus_data:
        db_item = CorpusItem(**item)
        db.add(db_item)
    db.commit()


@app.on_event("startup")
async def startup_event():
    init_db()
    db = next(get_db())
    seed_corpus_data(db)
    db.close()


@app.post("/api/auth/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.username}",
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/words", response_model=List[WordResponse])
def get_words(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = "",
    sort_by: Optional[str] = "created_at",
):
    query = db.query(Word).filter(Word.user_id == current_user.id)

    if search:
        query = query.filter(Word.word.contains(search))

    if sort_by == "priority":
        query = query.order_by(Word.forgetting_index.desc(), Word.review_count.desc())
    else:
        query = query.order_by(Word.created_at.desc())

    words = query.offset((page - 1) * page_size).limit(page_size).all()
    return words


@app.post("/api/words", response_model=WordResponse)
def create_word(
    word_data: WordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    example_sentence = ""
    example_translation = ""
    audio_url = ""

    if word_data.corpus_id:
        corpus = db.query(CorpusItem).filter(CorpusItem.corpus_id == word_data.corpus_id).first()
        if corpus:
            example_sentence = corpus.example_sentence
            example_translation = corpus.example_translation
            audio_url = corpus.audio_url
    else:
        corpora = db.query(CorpusItem).filter(CorpusItem.word == word_data.word.lower()).all()
        if corpora:
            corpus = random.choice(corpora)
            example_sentence = corpus.example_sentence
            example_translation = corpus.example_translation
            audio_url = corpus.audio_url

    db_word = Word(
        user_id=current_user.id,
        word=word_data.word,
        definition=word_data.definition,
        corpus_id=word_data.corpus_id,
        example_sentence=example_sentence,
        example_translation=example_translation,
        audio_url=audio_url,
    )
    db.add(db_word)
    db.commit()
    db.refresh(db_word)
    return db_word


@app.delete("/api/words/{word_id}")
def delete_word(
    word_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(word)
    db.commit()
    return {"message": "Word deleted successfully"}


@app.post("/api/learn")
def mark_learn(
    learn_data: LearnRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    word = db.query(Word).filter(Word.id == learn_data.word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    if learn_data.is_mastered:
        word.master_count += 1
    else:
        word.review_count += 1

    total = word.master_count + word.review_count
    if total > 0:
        word.forgetting_index = word.review_count / total
    else:
        word.forgetting_index = 0.0

    word.last_reviewed_at = datetime.utcnow()

    record = ReviewRecord(
        user_id=current_user.id,
        word_id=learn_data.word_id,
        is_mastered=1 if learn_data.is_mastered else 0,
    )
    db.add(record)
    db.commit()
    db.refresh(word)

    return {"message": "Learning record updated", "forgetting_index": word.forgetting_index}


@app.get("/api/review-plan", response_model=List[ReviewPlanItem])
def get_review_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10,
):
    words = (
        db.query(Word)
        .filter(Word.user_id == current_user.id)
        .order_by(Word.forgetting_index.desc(), Word.review_count.desc())
        .limit(limit)
        .all()
    )

    plan = []
    for word in words:
        base_priority = word.forgetting_index
        if word.last_reviewed_at:
            days_since = (datetime.utcnow() - word.last_reviewed_at).days
            time_factor = min(days_since / 7.0, 1.0)
            priority = base_priority * 0.7 + time_factor * 0.3
        else:
            priority = base_priority

        plan.append({"word": word, "priority": round(priority, 4)})

    plan.sort(key=lambda x: x["priority"], reverse=True)
    return plan


@app.get("/api/stats", response_model=StatsResponse)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_words = db.query(Word).filter(Word.user_id == current_user.id).count()
    mastered_words = (
        db.query(Word)
        .filter(Word.user_id == current_user.id, Word.master_count > 0, Word.forgetting_index < 0.3)
        .count()
    )

    records = (
        db.query(ReviewRecord)
        .filter(ReviewRecord.user_id == current_user.id)
        .order_by(ReviewRecord.reviewed_at.desc())
        .all()
    )

    streak_days = 0
    if records:
        today = datetime.utcnow().date()
        check_date = today
        for record in records:
            record_date = record.reviewed_at.date()
            if record_date == check_date:
                streak_days += 1
                check_date -= timedelta(days=1)
            elif record_date < check_date:
                if (check_date - record_date).days == 1:
                    streak_days += 1
                    check_date = record_date
                else:
                    break

    weekly_data = [0] * 7
    today = datetime.utcnow().date()
    for i in range(7):
        day = today - timedelta(days=6 - i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = (
            db.query(ReviewRecord)
            .filter(
                ReviewRecord.user_id == current_user.id,
                ReviewRecord.reviewed_at >= day_start,
                ReviewRecord.reviewed_at <= day_end,
            )
            .count()
        )
        weekly_data[i] = count

    return {
        "total_words": total_words,
        "mastered_words": mastered_words,
        "streak_days": streak_days,
        "weekly_data": weekly_data,
    }


@app.get("/api/corpus")
def get_corpus_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = "",
):
    query = db.query(CorpusItem)
    if search:
        query = query.filter(CorpusItem.word.contains(search) | CorpusItem.example_sentence.contains(search))
    items = query.all()
    return items


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
