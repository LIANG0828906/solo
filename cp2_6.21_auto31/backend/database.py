from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./tutoring.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    import models
    Base.metadata.create_all(bind=engine)

    from datetime import datetime, timedelta
    from models import User, Teacher, TimeSlot

    db = SessionLocal()

    try:
        if db.query(User).count() > 0:
            return

        hashed_pw = "$2b$12$t8Ui8JbhjPEebn5rqYXKkuGpTUtOnrxJ38ATorPsWwAZvA.9exVYS"

        parent_user = User(
            username="parent1",
            email="parent1@example.com",
            hashed_password=hashed_pw,
            role="parent",
            full_name="张伟家长",
            avatar="",
            created_at=datetime.utcnow()
        )
        db.add(parent_user)

        teacher_data = [
            {
                "username": "teacher1",
                "email": "teacher1@example.com",
                "full_name": "李老师",
                "subjects": "数学,物理",
                "bio": "清华大学物理系毕业，10年教学经验，擅长高中数学和物理辅导。",
                "education": "清华大学 物理学硕士",
                "experience_years": 10,
                "hourly_rate": 200.0,
                "rating": 4.8,
                "review_count": 25
            },
            {
                "username": "teacher2",
                "email": "teacher2@example.com",
                "full_name": "王老师",
                "subjects": "英语,语文",
                "bio": "北京师范大学英语系毕业，专业英语八级，擅长英语口语和写作。",
                "education": "北京师范大学 英语语言文学硕士",
                "experience_years": 8,
                "hourly_rate": 180.0,
                "rating": 4.9,
                "review_count": 32
            },
            {
                "username": "teacher3",
                "email": "teacher3@example.com",
                "full_name": "陈老师",
                "subjects": "化学,生物",
                "bio": "北京大学化学系毕业，曾任重点中学化学教师，教学方法独特。",
                "education": "北京大学 化学博士",
                "experience_years": 15,
                "hourly_rate": 250.0,
                "rating": 4.7,
                "review_count": 45
            }
        ]

        for i, data in enumerate(teacher_data):
            user = User(
                username=data["username"],
                email=data["email"],
                hashed_password=hashed_pw,
                role="teacher",
                full_name=data["full_name"],
                avatar="",
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.flush()

            teacher = Teacher(
                user_id=user.id,
                subjects=data["subjects"],
                bio=data["bio"],
                education=data["education"],
                experience_years=data["experience_years"],
                rating=data["rating"],
                review_count=data["review_count"],
                hourly_rate=data["hourly_rate"]
            )
            db.add(teacher)
            db.flush()

            for day_offset in range(7):
                day = datetime.utcnow().date() + timedelta(days=day_offset + 1)
                start_hour = 9
                end_hour = 18

                for hour in range(start_hour, end_hour):
                    start_time = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour)
                    end_time = start_time + timedelta(hours=1)

                    timeslot = TimeSlot(
                        teacher_id=teacher.id,
                        start_time=start_time,
                        end_time=end_time,
                        is_available=True
                    )
                    db.add(timeslot)

        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
