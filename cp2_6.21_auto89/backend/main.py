from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import math
from collections import defaultdict
from functools import reduce

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LifeEvent(BaseModel):
    id: str
    member_id: str
    name: str
    year: int = Field(..., ge=1900, le=2030)
    event_type: str
    description: Optional[str] = None


class Member(BaseModel):
    id: str
    name: str
    birth_year: int = Field(..., ge=1900, le=2023)
    death_year: Optional[int] = Field(None, ge=1900, le=2030)
    gender: Optional[str] = None
    role: Optional[str] = None
    x: Optional[float] = 0
    y: Optional[float] = 0


class Relation(BaseModel):
    id: str
    from_member_id: str
    to_member_id: str
    relation_type: str
    control_x: Optional[float] = None
    control_y: Optional[float] = None


class EventCreate(BaseModel):
    member_id: str
    name: str
    year: int = Field(..., ge=1900, le=2030)
    event_type: str
    description: Optional[str] = None


class RelationCreate(BaseModel):
    from_member_id: str
    to_member_id: str
    relation_type: str


class UpdatePosition(BaseModel):
    x: float
    y: float


class UpdateRelationControl(BaseModel):
    control_x: float
    control_y: float


members_db: List[Member] = []
events_db: List[LifeEvent] = []
relations_db: List[Relation] = []


def gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return a


def lcm(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return abs(a * b) // gcd(a, b)


def init_sample_data():
    sample_members = [
        Member(id="m1", name="张大山", birth_year=1925, death_year=2005, gender="男", role="祖父", x=300, y=100),
        Member(id="m2", name="李秀兰", birth_year=1928, death_year=2010, gender="女", role="祖母", x=450, y=100),
        Member(id="m3", name="张建国", birth_year=1955, gender="男", role="父亲", x=375, y=250),
        Member(id="m4", name="王美华", birth_year=1958, gender="女", role="母亲", x=525, y=250),
        Member(id="m5", name="张伟", birth_year=1985, gender="男", role="本人", x=300, y=400),
        Member(id="m6", name="张敏", birth_year=1988, gender="女", role="妹妹", x=450, y=400),
        Member(id="m7", name="李雷", birth_year=2015, gender="男", role="儿子", x=375, y=550),
    ]
    for m in sample_members:
        members_db.append(m)

    sample_events = [
        LifeEvent(id="e1", member_id="m1", name="出生", year=1925, event_type="出生", description="出生于河北省"),
        LifeEvent(id="e2", member_id="m1", name="参加工作", year=1948, event_type="工作", description="进入铁路系统工作"),
        LifeEvent(id="e3", member_id="m1", name="结婚", year=1952, event_type="结婚", description="与李秀兰结婚"),
        LifeEvent(id="e4", member_id="m1", name="退休", year=1985, event_type="工作", description="光荣退休"),
        LifeEvent(id="e5", member_id="m1", name="逝世", year=2005, event_type="逝世", description="享年80岁"),
        LifeEvent(id="e6", member_id="m2", name="出生", year=1928, event_type="出生", description="出生于北京市"),
        LifeEvent(id="e7", member_id="m2", name="结婚", year=1952, event_type="结婚", description="与张大山结婚"),
        LifeEvent(id="e8", member_id="m3", name="出生", year=1955, event_type="出生"),
        LifeEvent(id="e9", member_id="m3", name="入学", year=1962, event_type="入学", description="就读于朝阳小学"),
        LifeEvent(id="e10", member_id="m3", name="参加工作", year=1978, event_type="工作"),
        LifeEvent(id="e11", member_id="m3", name="结婚", year=1983, event_type="结婚", description="与王美华结婚"),
        LifeEvent(id="e12", member_id="m4", name="出生", year=1958, event_type="出生"),
        LifeEvent(id="e13", member_id="m4", name="获奖", year=1990, event_type="获奖", description="获得先进工作者称号"),
        LifeEvent(id="e14", member_id="m5", name="出生", year=1985, event_type="出生"),
        LifeEvent(id="e15", member_id="m5", name="入学", year=1991, event_type="入学"),
        LifeEvent(id="e16", member_id="m5", name="参加工作", year=2008, event_type="工作"),
        LifeEvent(id="e17", member_id="m6", name="出生", year=1988, event_type="出生"),
        LifeEvent(id="e18", member_id="m6", name="获奖", year=2006, event_type="获奖", description="全国奥数二等奖"),
        LifeEvent(id="e19", member_id="m7", name="出生", year=2015, event_type="出生"),
        LifeEvent(id="e20", member_id="m7", name="入学", year=2021, event_type="入学"),
    ]
    for e in sample_events:
        events_db.append(e)

    sample_relations = [
        Relation(id="r1", from_member_id="m1", to_member_id="m2", relation_type="夫妻"),
        Relation(id="r2", from_member_id="m1", to_member_id="m3", relation_type="父子"),
        Relation(id="r3", from_member_id="m2", to_member_id="m3", relation_type="父子"),
        Relation(id="r4", from_member_id="m3", to_member_id="m4", relation_type="夫妻"),
        Relation(id="r5", from_member_id="m3", to_member_id="m5", relation_type="父子"),
        Relation(id="r6", from_member_id="m4", to_member_id="m5", relation_type="父子"),
        Relation(id="r7", from_member_id="m3", to_member_id="m6", relation_type="父子"),
        Relation(id="r8", from_member_id="m4", to_member_id="m6", relation_type="父子"),
        Relation(id="r9", from_member_id="m5", to_member_id="m6", relation_type="兄弟姐妹"),
        Relation(id="r10", from_member_id="m5", to_member_id="m7", relation_type="父子"),
    ]
    for r in sample_relations:
        relations_db.append(r)


init_sample_data()


@app.get("/api/members")
def get_members():
    return {"members": members_db, "relations": relations_db}


@app.post("/api/members")
def add_member(member: Member):
    for m in members_db:
        if m.id == member.id:
            raise HTTPException(status_code=400, detail="Member ID already exists")
    members_db.append(member)
    return member


@app.put("/api/members/{member_id}/position")
def update_member_position(member_id: str, pos: UpdatePosition):
    for m in members_db:
        if m.id == member_id:
            m.x = pos.x
            m.y = pos.y
            return m
    raise HTTPException(status_code=404, detail="Member not found")


@app.get("/api/events")
def get_events(member_id: Optional[str] = None):
    if member_id:
        result = [e for e in events_db if e.member_id == member_id]
        return {"events": result}
    return {"events": events_db}


@app.post("/api/events")
def add_event(event: EventCreate):
    new_id = f"e_{len(events_db) + 1}_{int(datetime.now().timestamp())}"
    new_event = LifeEvent(
        id=new_id,
        member_id=event.member_id,
        name=event.name,
        year=event.year,
        event_type=event.event_type,
        description=event.description,
    )
    events_db.append(new_event)
    return new_event


@app.delete("/api/events/{event_id}")
def delete_event(event_id: str):
    for i, e in enumerate(events_db):
        if e.id == event_id:
            deleted = events_db.pop(i)
            return deleted
    raise HTTPException(status_code=404, detail="Event not found")


@app.get("/api/timeline")
def get_timeline():
    all_years = set()
    for e in events_db:
        all_years.add(e.year)
    for m in members_db:
        all_years.add(m.birth_year)
        if m.death_year:
            all_years.add(m.death_year)
    if not all_years:
        min_year = 1900
        max_year = 2030
    else:
        min_year = min(all_years)
        max_year = max(all_years)

    member_birth_years = sorted([m.birth_year for m in members_db])
    generation_gaps = []
    for i in range(1, len(member_birth_years)):
        gap = member_birth_years[i] - member_birth_years[i - 1]
        if 15 <= gap <= 50:
            generation_gaps.append(gap)

    avg_generation_gap = round(sum(generation_gaps) / len(generation_gaps), 1) if generation_gaps else 0

    if member_birth_years:
        birth_year_lcm = reduce(lcm, member_birth_years)
    else:
        birth_year_lcm = 1

    life_spans = []
    for m in members_db:
        if m.death_year:
            lifespan = m.death_year - m.birth_year
            is_deceased = True
        else:
            lifespan = 2024 - m.birth_year
            is_deceased = False
        life_spans.append({
            "member_id": m.id,
            "name": m.name,
            "lifespan": lifespan,
            "is_deceased": is_deceased,
        })

    return {
        "events": events_db,
        "members": members_db,
        "min_year": min_year,
        "max_year": max_year,
        "generation_gaps": generation_gaps,
        "avg_generation_gap": avg_generation_gap,
        "birth_year_lcm": birth_year_lcm,
        "life_spans": life_spans,
    }


@app.post("/api/relations")
def add_relation(rel: RelationCreate):
    existing = [
        r
        for r in relations_db
        if (r.from_member_id == rel.from_member_id and r.to_member_id == rel.to_member_id)
        or (r.from_member_id == rel.to_member_id and r.to_member_id == rel.from_member_id)
    ]
    if existing:
        raise HTTPException(status_code=400, detail="Relation already exists")
    new_id = f"r_{len(relations_db) + 1}_{int(datetime.now().timestamp())}"
    new_rel = Relation(
        id=new_id,
        from_member_id=rel.from_member_id,
        to_member_id=rel.to_member_id,
        relation_type=rel.relation_type,
    )
    relations_db.append(new_rel)
    return new_rel


@app.put("/api/relations/{relation_id}")
def update_relation(relation_id: str, data: Dict[str, Any]):
    for r in relations_db:
        if r.id == relation_id:
            if "relation_type" in data:
                r.relation_type = data["relation_type"]
            if "control_x" in data and "control_y" in data:
                r.control_x = data["control_x"]
                r.control_y = data["control_y"]
            return r
    raise HTTPException(status_code=404, detail="Relation not found")


@app.delete("/api/relations/{relation_id}")
def delete_relation(relation_id: str):
    for i, r in enumerate(relations_db):
        if r.id == relation_id:
            deleted = relations_db.pop(i)
            return deleted
    raise HTTPException(status_code=404, detail="Relation not found")


@app.get("/api/stats")
def get_stats():
    total_members = len(members_db)
    total_events = len(events_db)

    ages = []
    birth_years = []
    death_years = []
    for m in members_db:
        birth_years.append(m.birth_year)
        if m.death_year:
            death_years.append(m.death_year)
            ages.append(m.death_year - m.birth_year)
        else:
            ages.append(2024 - m.birth_year)

    if birth_years and death_years:
        max_age_diff = max(death_years) - min(birth_years)
    elif birth_years:
        max_age_diff = 2024 - min(birth_years)
    else:
        max_age_diff = 0

    avg_lifespan = round(sum(ages) / len(ages), 1) if ages else 0

    age_distribution: Dict[str, int] = defaultdict(int)
    for age in ages:
        bucket = f"{(age // 10) * 10}-{(age // 10) * 10 + 9}"
        age_distribution[bucket] += 1

    event_type_counts: Dict[str, int] = defaultdict(int)
    for e in events_db:
        event_type_counts[e.event_type] += 1

    member_events: Dict[str, List[int]] = defaultdict(list)
    for m in members_db:
        member_events[m.id] = [m.birth_year]
    for e in events_db:
        if e.event_type == "出生":
            member_events[e.member_id] = [e.year] + member_events.get(e.member_id, [])[1:]

    member_birth_years = sorted([m.birth_year for m in members_db])
    generation_gaps = []
    for i in range(1, len(member_birth_years)):
        gap = member_birth_years[i] - member_birth_years[i - 1]
        if 15 <= gap <= 50:
            generation_gaps.append(gap)

    if member_birth_years:
        birth_year_lcm = reduce(lcm, member_birth_years)
    else:
        birth_year_lcm = 1

    return {
        "total_members": total_members,
        "total_events": total_events,
        "max_age_diff": max_age_diff,
        "avg_lifespan": avg_lifespan,
        "age_distribution": dict(age_distribution),
        "event_type_counts": dict(event_type_counts),
        "avg_generation_gap": round(sum(generation_gaps) / len(generation_gaps), 1) if generation_gaps else 0,
        "generation_gaps": generation_gaps,
        "birth_year_lcm": birth_year_lcm,
    }


@app.get("/api/export")
def export_data():
    return {
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "members": [m.model_dump() for m in members_db],
        "events": [e.model_dump() for e in events_db],
        "relations": [r.model_dump() for r in relations_db],
    }


@app.post("/api/import")
def import_data(data: Dict[str, Any]):
    if "version" not in data or "members" not in data or "events" not in data:
        raise HTTPException(status_code=400, detail="Invalid data structure: missing required fields")

    try:
        new_members = []
        for m in data["members"]:
            member = Member(**m)
            if member.birth_year < 1900 or member.birth_year > 2023:
                raise ValueError(f"Invalid birth_year for member {member.name}")
            if member.death_year and (member.death_year < 1900 or member.death_year > 2030):
                raise ValueError(f"Invalid death_year for member {member.name}")
            new_members.append(member)

        new_events = []
        for e in data["events"]:
            event = LifeEvent(**e)
            if event.year < 1900 or event.year > 2030:
                raise ValueError(f"Invalid year for event {event.name}")
            new_events.append(event)

        new_relations = []
        if "relations" in data:
            for r in data["relations"]:
                relation = Relation(**r)
                new_relations.append(relation)
    except Exception as ex:
        raise HTTPException(status_code=400, detail=f"Data validation failed: {str(ex)}")

    members_db.clear()
    events_db.clear()
    relations_db.clear()
    members_db.extend(new_members)
    events_db.extend(new_events)
    relations_db.extend(new_relations)

    return {"message": "Data imported successfully", "members_count": len(members_db), "events_count": len(events_db)}
