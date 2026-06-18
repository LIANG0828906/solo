from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Member(Base):
    __tablename__ = 'members'

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), nullable=False)
    avatar_url = Column(String(255))

    records = relationship('DailyRecord', back_populates='member')


class DailyRecord(Base):
    __tablename__ = 'daily_records'

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey('members.id'), nullable=False)
    date = Column(Date, nullable=False)
    steps = Column(Integer, nullable=False, default=0)
    duration = Column(Integer, nullable=False, default=0)
    calories = Column(Integer, nullable=False, default=0)

    member = relationship('Member', back_populates='records')
