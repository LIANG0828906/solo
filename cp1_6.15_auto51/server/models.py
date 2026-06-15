from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime
import uuid


@dataclass
class Requirement:
    id: str
    pet_name: str
    pet_breed: str
    pet_age: int
    pet_personality: List[str]
    pet_avatar: str
    start_date: str
    end_date: str
    daily_budget: float
    owner_id: str
    owner_name: str
    status: str = "open"
    breed: str = ""
    age: int = 0
    personality_tags: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    applications: List[dict] = field(default_factory=list)

    def __post_init__(self):
        if not self.breed:
            self.breed = self.pet_breed
        if not self.age:
            self.age = self.pet_age
        if not self.personality_tags:
            self.personality_tags = self.pet_personality

    @classmethod
    def create(cls, pet_name: str, pet_breed: str, pet_age: int,
               pet_personality: List[str], pet_avatar: str,
               start_date: str, end_date: str, daily_budget: float,
               owner_id: str, owner_name: str) -> "Requirement":
        return cls(
            id=str(uuid.uuid4()),
            pet_name=pet_name,
            pet_breed=pet_breed,
            pet_age=pet_age,
            pet_personality=pet_personality,
            pet_avatar=pet_avatar,
            start_date=start_date,
            end_date=end_date,
            daily_budget=daily_budget,
            owner_id=owner_id,
            owner_name=owner_name,
            breed=pet_breed,
            age=pet_age,
            personality_tags=pet_personality
        )

    def add_application(self, foster_id: str, foster_name: str,
                        foster_rating: float, foster_intro: str,
                        foster_avatar: str) -> dict:
        application = {
            "id": str(uuid.uuid4()),
            "foster_id": foster_id,
            "foster_name": foster_name,
            "foster_rating": foster_rating,
            "foster_intro": foster_intro,
            "foster_avatar": foster_avatar,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        self.applications.append(application)
        return application

    def accept_application(self, application_id: str) -> Optional[dict]:
        for app in self.applications:
            if app["id"] == application_id:
                app["status"] = "accepted"
                self.status = "matched"
                return app
        return None


@dataclass
class Order:
    id: str
    requirement_id: str
    owner_id: str
    owner_name: str
    owner_avatar: str
    foster_id: str
    foster_name: str
    foster_avatar: str
    pet_name: str
    pet_avatar: str
    start_date: str
    end_date: str
    daily_fee: float
    total_fee: float
    status: str = "pending_payment"
    foster_family_id: str = ""
    contract_confirmed: bool = False
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    daily_logs: List[dict] = field(default_factory=list)
    contract_terms: List[str] = field(default_factory=lambda: [
        "寄养家庭需每日提供宠物照片和状态更新",
        "宠物主人需提前支付全额寄养费用",
        "寄养期间如遇宠物健康问题需及时联系主人",
        "寄养期满后需确保宠物安全归还"
    ])

    def __post_init__(self):
        if not self.foster_family_id:
            self.foster_family_id = self.foster_id

    @classmethod
    def create(cls, requirement: Requirement, application: dict) -> "Order":
        start = datetime.fromisoformat(requirement.start_date)
        end = datetime.fromisoformat(requirement.end_date)
        days = max(1, (end - start).days + 1)
        daily_fee = requirement.daily_budget
        return cls(
            id=str(uuid.uuid4()),
            requirement_id=requirement.id,
            owner_id=requirement.owner_id,
            owner_name=requirement.owner_name,
            owner_avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=owner",
            foster_id=application["foster_id"],
            foster_name=application["foster_name"],
            foster_avatar=application["foster_avatar"],
            foster_family_id=application["foster_id"],
            pet_name=requirement.pet_name,
            pet_avatar=requirement.pet_avatar,
            start_date=requirement.start_date,
            end_date=requirement.end_date,
            daily_fee=daily_fee,
            total_fee=daily_fee * days
        )

    def transition_status(self, new_status: str) -> bool:
        valid_transitions = {
            "pending_payment": ["in_progress", "cancelled"],
            "in_progress": ["completed"],
            "completed": [],
            "cancelled": []
        }
        if new_status in valid_transitions.get(self.status, []):
            self.status = new_status
            return True
        return False

    def confirm_payment(self) -> bool:
        return self.transition_status("in_progress")

    def complete_order(self) -> bool:
        return self.transition_status("completed")

    def add_daily_log(self, foster_id: str, photos: List[str], content: str) -> dict:
        log = {
            "id": str(uuid.uuid4()),
            "foster_id": foster_id,
            "photos": photos,
            "content": content,
            "date": datetime.now().isoformat(),
            "comments": []
        }
        self.daily_logs.append(log)
        return log

    def add_comment_to_log(self, log_id: str, user_id: str, user_name: str, content: str) -> Optional[dict]:
        for log in self.daily_logs:
            if log["id"] == log_id:
                comment = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "user_name": user_name,
                    "content": content,
                    "created_at": datetime.now().isoformat()
                }
                log["comments"].append(comment)
                return comment
        return None


@dataclass
class FosterFamily:
    id: str
    name: str
    avatar: str
    environment_photos: List[str]
    max_pet_size: str
    daily_fee: float
    rating: float
    reviews: List[dict] = field(default_factory=list)
    bio: str = ""

    @classmethod
    def create(cls, name: str, avatar: str, environment_photos: List[str],
               max_pet_size: str, daily_fee: float, rating: float,
               bio: str = "") -> "FosterFamily":
        return cls(
            id=str(uuid.uuid4()),
            name=name,
            avatar=avatar,
            environment_photos=environment_photos,
            max_pet_size=max_pet_size,
            daily_fee=daily_fee,
            rating=rating,
            bio=bio
        )

    def add_review(self, reviewer_name: str, reviewer_avatar: str,
                   content: str, rating: float) -> dict:
        review = {
            "id": str(uuid.uuid4()),
            "reviewer_name": reviewer_name,
            "reviewer_avatar": reviewer_avatar,
            "content": content,
            "rating": rating,
            "date": datetime.now().isoformat()
        }
        self.reviews.insert(0, review)
        return review
