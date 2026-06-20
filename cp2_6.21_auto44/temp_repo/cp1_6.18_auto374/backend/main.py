from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import User, Book, Review, Event, EventParticipant, UserBook
from auth import hash_password
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BookStation API",
    description="A book community platform API with Nord theme naming",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.auth import router as auth_router
from routers.books import router as books_router
from routers.events import router as events_router
from routers.community import router as community_router

app.include_router(auth_router)
app.include_router(books_router)
app.include_router(events_router)
app.include_router(community_router)


def init_mock_data():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count > 0:
            return

        user1 = User(
            email="aurora@nord.dev",
            username="aurora",
            hashed_password=hash_password("nord12345")
        )
        user2 = User(
            email="frost@nord.dev",
            username="frost",
            hashed_password=hash_password("nord12345")
        )
        db.add_all([user1, user2])
        db.flush()

        book1 = Book(
            title="The Northern Lights",
            author="Philip Pullman",
            isbn="978-0439876430",
            cover_url="https://example.com/northern-lights.jpg",
            description="A fantasy novel about a young girl's adventure in the Arctic.",
            user_id=user1.id
        )
        book2 = Book(
            title="Snow Crash",
            author="Neal Stephenson",
            isbn="978-0553380958",
            cover_url="https://example.com/snow-crash.jpg",
            description="A cyberpunk novel exploring virtual reality and ancient history.",
            user_id=user2.id
        )
        book3 = Book(
            title="The Long Dark Teatime of the Soul",
            author="Douglas Adams",
            isbn="978-0671742515",
            cover_url="https://example.com/long-dark.jpg",
            description="A comedic detective novel featuring Dirk Gently.",
            user_id=user1.id
        )
        db.add_all([book1, book2, book3])
        db.flush()

        user_book1 = UserBook(user_id=user1.id, book_id=book1.id, progress=65)
        user_book2 = UserBook(user_id=user1.id, book_id=book2.id, progress=30)
        user_book3 = UserBook(user_id=user2.id, book_id=book3.id, progress=100)
        db.add_all([user_book1, user_book2, user_book3])

        review1 = Review(
            user_id=user2.id,
            book_id=book1.id,
            content="Absolutely captivating! The world-building is incredible and the characters feel so real."
        )
        review2 = Review(
            user_id=user1.id,
            book_id=book2.id,
            content="A bit dense at times, but the ideas are mind-blowing. Worth the read."
        )
        db.add_all([review1, review2])

        event1 = Event(
            title="Nordic Book Club Meetup",
            description="Monthly meetup to discuss our favorite books from Nordic authors.",
            location="Aurora Library, Room 302",
            event_time=datetime.utcnow() + timedelta(days=7),
            book_id=book1.id,
            creator_id=user1.id,
            status="upcoming"
        )
        event2 = Event(
            title="Frost Reading Marathon",
            description="24-hour reading marathon to raise funds for local libraries.",
            location="Virtual - Discord",
            event_time=datetime.utcnow() + timedelta(days=3),
            creator_id=user2.id,
            status="upcoming"
        )
        db.add_all([event1, event2])
        db.flush()

        participant1 = EventParticipant(event_id=event1.id, user_id=user2.id)
        participant2 = EventParticipant(event_id=event2.id, user_id=user1.id)
        db.add_all([participant1, participant2])

        db.commit()
    finally:
        db.close()


init_mock_data()


@app.get("/")
def root():
    return {
        "message": "Welcome to BookStation API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
