import random
import uuid
from typing import List, Optional
from app.models import (
    StarEvent,
    RandomEvent,
    STAR_TYPES,
    RANDOM_EVENT_TYPES,
    STARS,
    INSCRIPTIONS,
    STAR_DESCRIPTIONS,
    EVENT_HINTS,
    STAR_INSCRIPTION_PAIRS
)

RANDOM_EVENT_DESCRIPTIONS: dict = {
    "meteor_fall": "流星群正向星图坠落！速速点击驱散，守护星宫安宁！",
    "duel": "有客星官挑战！猜拳斗法，赢者可得天道加持！",
    "chart_destroyed": "星图受损！迅速按正确顺序点击星宿，修复星图！"
}


def _generate_available_options(correct_star: str, correct_inscription: str) -> tuple[List[str], List[str]]:
    available_stars: List[str] = [correct_star]
    while len(available_stars) < 4:
        star = random.choice(STARS)
        if star not in available_stars:
            available_stars.append(star)
    random.shuffle(available_stars)

    available_inscriptions: List[str] = [correct_inscription]
    while len(available_inscriptions) < 4:
        inscription = random.choice(INSCRIPTIONS)
        if inscription not in available_inscriptions:
            available_inscriptions.append(inscription)
    random.shuffle(available_inscriptions)

    return available_stars, available_inscriptions


def generate_star_events(day: int, xun: int) -> List[StarEvent]:
    num_events: int = random.randint(3, 5)
    events: List[StarEvent] = []

    for i in range(num_events):
        event_id: str = str(uuid.uuid4())
        star_type: str = random.choice(STAR_TYPES)
        correct_pair: tuple[str, str] = random.choice(STAR_INSCRIPTION_PAIRS)
        correct_star, correct_inscription = correct_pair

        available_stars, available_inscriptions = _generate_available_options(
            correct_star, correct_inscription
        )

        event: StarEvent = StarEvent(
            id=event_id,
            type=star_type,
            description=STAR_DESCRIPTIONS[star_type],
            hint=EVENT_HINTS[star_type],
            correctStar=correct_star,
            correctInscription=correct_inscription,
            timeLimit=60,
            availableStars=available_stars,
            availableInscriptions=available_inscriptions
        )
        events.append(event)

    return events


def generate_random_event() -> Optional[RandomEvent]:
    if random.random() < 0.3:
        event_id: str = str(uuid.uuid4())
        event_type: str = random.choice(RANDOM_EVENT_TYPES)

        event: RandomEvent = RandomEvent(
            id=event_id,
            type=event_type,
            description=RANDOM_EVENT_DESCRIPTIONS[event_type],
            timeLimit=30,
            reward=15
        )
        return event

    return None
