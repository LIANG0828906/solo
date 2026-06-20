import sqlite3
import os
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import Optional, List, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = os.path.join(os.path.dirname(__file__), "clubs.db")
USER_ID = "current_user"


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cur = conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS clubs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                logo TEXT NOT NULL,
                summary TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                frequency TEXT NOT NULL,
                member_count INTEGER NOT NULL DEFAULT 0,
                max_members INTEGER NOT NULL DEFAULT 100,
                requires_application INTEGER NOT NULL DEFAULT 0,
                cover TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                club_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                date TEXT NOT NULL,
                location TEXT NOT NULL,
                FOREIGN KEY (club_id) REFERENCES clubs(id)
            );

            CREATE TABLE IF NOT EXISTS members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                club_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT NOT NULL,
                FOREIGN KEY (club_id) REFERENCES clubs(id)
            );

            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                club_id INTEGER NOT NULL,
                user_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                applied_at TEXT NOT NULL,
                reason TEXT,
                FOREIGN KEY (club_id) REFERENCES clubs(id)
            );
            """
        )

        cur.execute("SELECT COUNT(*) FROM clubs")
        if cur.fetchone()[0] == 0:
            seed_data(conn)


def seed_data(conn: sqlite3.Connection):
    cur = conn.cursor()

    clubs_data = [
        ("人工智能学社", "", "探索AI前沿技术，参与算法竞赛",
         "人工智能学社致力于推广人工智能知识，组织机器学习、深度学习研讨活动，带领成员参与全国各类AI竞赛。每周举办技术分享会，每学期至少开展一次大型项目实战。我们欢迎对AI有热情的同学加入，无论基础如何，这里都有适合你的成长路径。",
         "academic", "weekly", 42, 80, 0, "academic"),
        ("篮球协会", "", "挥洒汗水，以球会友",
         "篮球协会是校园最具人气的体育社团之一，每周组织训练赛，每月举办校内联赛。我们有专业的教练团队指导，帮助成员提升球技。协会还会组织校外友谊赛和观赛活动，让你在运动中结交挚友。",
         "sports", "weekly", 68, 120, 0, "sports"),
        ("舞蹈社", "", "舞动青春，绽放光芒",
         "舞蹈社涵盖街舞、民族舞、现代舞等多种舞种，由专业老师进行指导。社团每年参与校内各大文艺晚会演出，并定期举办专场舞蹈秀。热爱舞蹈的你，这里将是展示自我的最佳舞台。加入需要提交申请理由并通过面试。",
         "art", "biweekly", 35, 50, 1, "art"),
        ("辩论社", "", "思辨明理，舌战群儒",
         "辩论社汇聚校园思维最敏捷的一群人，每周开展辩论赛训练，参加省内外高校辩论赛事。社团注重逻辑思维与表达能力的培养，邀请知名辩手进行指导。加入需提交申请理由，通过选拔方能入社。",
         "academic", "weekly", 28, 40, 1, "academic"),
        ("志愿者协会", "", "传递温暖，服务社会",
         "志愿者协会长期组织各类公益活动，包括敬老院探访、乡村支教、环保行动、社区服务等。每学期策划大型公益项目，与多家公益组织合作。让我们用行动传递爱与温暖，让校园和社会变得更美好。",
         "public", "biweekly", 89, 200, 0, "public"),
        ("摄影协会", "", "定格瞬间，记录美好",
         "摄影协会为摄影爱好者提供交流学习平台，定期组织外拍活动、摄影讲座和作品展览。协会配备专业器材可供成员借用，并有资深摄影师进行指导。无论你是手机摄影还是专业单反，都能在这里找到乐趣。",
         "art", "monthly", 52, 100, 0, "art"),
        ("足球俱乐部", "", "绿茵场上，驰骋梦想",
         "足球俱乐部组织日常训练和校内外比赛，拥有自己的校队阵容。每周安排两次训练，邀请专业教练进行技战术指导。社团每年举办新生杯、毕业杯等品牌赛事，是足球爱好者的家园。",
         "sports", "weekly", 45, 80, 0, "sports"),
        ("书法社", "", "笔墨丹青，修身养性",
         "书法社传承中华传统文化，教授硬笔、软笔书法技巧。每周开展练习活动，邀请书法名家讲学，每年举办校园书法展。在这里，你可以静下心来感受汉字之美，修养身心。",
         "art", "biweekly", 33, 60, 0, "art"),
    ]

    cur.executemany(
        "INSERT INTO clubs (name, logo, summary, description, category, frequency, member_count, max_members, requires_application, cover) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        clubs_data,
    )

    activities_data = []
    base_date = datetime.now()
    for club_id in range(1, len(clubs_data) + 1):
        for i in range(4):
            act_date = base_date + timedelta(days=7 * i + 3)
            activities_data.append((
                club_id,
                [
                    f"第{i+1}次社团例会",
                    "主题分享会",
                    "户外实践活动",
                    "技术/技能培训营",
                ][i % 4],
                act_date.strftime("%Y-%m-%d %H:%M"),
                ["教学楼A301", "大学生活动中心", "操场/体育馆", "校内咖啡厅"][i % 4],
            ))

    cur.executemany(
        "INSERT INTO activities (club_id, name, date, location) VALUES (?, ?, ?, ?)",
        activities_data,
    )

    names = ["张伟", "李娜", "王芳", "刘洋", "陈静", "杨帆", "赵敏", "黄磊",
             "周婷", "吴昊", "徐磊", "孙悦", "马超", "朱琳", "胡军", "郭静",
             "何明", "高峰", "林燕", "罗超"]
    members_data = []
    for club_id in range(1, len(clubs_data) + 1):
        count = 8 + (club_id % 5)
        for i in range(count):
            members_data.append((
                club_id,
                names[(i + club_id) % len(names)],
                "",
            ))

    cur.executemany(
        "INSERT INTO members (club_id, name, avatar) VALUES (?, ?, ?)",
        members_data,
    )

    conn.commit()


def club_to_dict(row: sqlite3.Row) -> dict:
    d = dict(row)
    d["requiresApplication"] = bool(d.pop("requires_application"))
    d["memberCount"] = d.pop("member_count")
    d["maxMembers"] = d.pop("max_members")
    return d


class ApplyRequest(BaseModel):
    reason: Optional[str] = Field(None, min_length=50, max_length=200)


app = FastAPI(title="校园社团管理平台 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/clubs")
def list_clubs(
    category: Optional[str] = None,
    frequency: Optional[str] = None,
):
    query = "SELECT * FROM clubs WHERE 1=1"
    params: List[Any] = []
    if category:
        query += " AND category = ?"
        params.append(category)
    if frequency:
        query += " AND frequency = ?"
        params.append(frequency)
    query += " ORDER BY id DESC"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return [club_to_dict(r) for r in rows]


@app.get("/api/clubs/{club_id}")
def get_club_detail(club_id: int):
    with get_db() as conn:
        club = conn.execute("SELECT * FROM clubs WHERE id = ?", (club_id,)).fetchone()
        if not club:
            raise HTTPException(status_code=404, detail="社团不存在")

        activities = conn.execute(
            "SELECT * FROM activities WHERE club_id = ? ORDER BY date DESC LIMIT 5",
            (club_id,),
        ).fetchall()

        members = conn.execute(
            "SELECT * FROM members WHERE club_id = ? ORDER BY id DESC",
            (club_id,),
        ).fetchall()

        result = club_to_dict(club)
        result["activities"] = [
            {
                "id": a["id"],
                "clubId": a["club_id"],
                "name": a["name"],
                "date": a["date"],
                "location": a["location"],
            }
            for a in activities
        ]
        result["members"] = [
            {
                "id": m["id"],
                "name": m["name"],
                "avatar": m["avatar"],
            }
            for m in members
        ]
        return result


@app.get("/api/clubs/{club_id}/activities")
def list_club_activities(
    club_id: int,
    page: int = Query(1, ge=1),
    pageSize: int = Query(5, ge=1, le=50),
):
    with get_db() as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM activities WHERE club_id = ?", (club_id,)
        ).fetchone()[0]

        offset = (page - 1) * pageSize
        rows = conn.execute(
            "SELECT * FROM activities WHERE club_id = ? ORDER BY date DESC LIMIT ? OFFSET ?",
            (club_id, pageSize, offset),
        ).fetchall()

        items = [
            {
                "id": a["id"],
                "clubId": a["club_id"],
                "name": a["name"],
                "date": a["date"],
                "location": a["location"],
            }
            for a in rows
        ]
        return {"items": items, "total": total, "page": page, "pageSize": pageSize}


@app.get("/api/clubs/{club_id}/members")
def list_club_members(club_id: int):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM members WHERE club_id = ? ORDER BY id DESC",
            (club_id,),
        ).fetchall()
        return [
            {
                "id": m["id"],
                "name": m["name"],
                "avatar": m["avatar"],
            }
            for m in rows
        ]


@app.post("/api/clubs/{club_id}/apply")
def apply_club(club_id: int, payload: Optional[ApplyRequest] = None):
    with get_db() as conn:
        club = conn.execute("SELECT * FROM clubs WHERE id = ?", (club_id,)).fetchone()
        if not club:
            raise HTTPException(status_code=404, detail="社团不存在")

        existing = conn.execute(
            "SELECT * FROM applications WHERE club_id = ? AND user_id = ?",
            (club_id, USER_ID),
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="您已报名该社团")

        if club["member_count"] >= club["max_members"]:
            raise HTTPException(status_code=400, detail="社团成员已满")

        if club["requires_application"]:
            if not payload or not payload.reason:
                raise HTTPException(status_code=400, detail="该社团需要填写申请理由")

        reason = payload.reason if payload else None
        applied_at = datetime.now().isoformat()

        cur = conn.execute(
            "INSERT INTO applications (club_id, user_id, status, applied_at, reason) VALUES (?, ?, 'pending', ?, ?)",
            (club_id, USER_ID, applied_at, reason),
        )
        conn.execute(
            "UPDATE clubs SET member_count = member_count + 1 WHERE id = ?",
            (club_id,),
        )
        conn.commit()
        app_id = cur.lastrowid

        return {
            "id": app_id,
            "clubId": club_id,
            "status": "pending",
            "appliedAt": applied_at,
            "reason": reason,
        }


@app.get("/api/my-applications")
def my_applications():
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT a.*, c.name, c.logo, c.summary, c.category, c.frequency,
                   c.member_count, c.max_members, c.requires_application, c.cover
            FROM applications a
            JOIN clubs c ON a.club_id = c.id
            WHERE a.user_id = ?
            ORDER BY a.applied_at DESC
            """,
            (USER_ID,),
        ).fetchall()

        result = []
        for r in rows:
            result.append(
                {
                    "id": r["id"],
                    "clubId": r["club_id"],
                    "status": r["status"],
                    "appliedAt": r["applied_at"],
                    "reason": r["reason"],
                    "club": {
                        "id": r["club_id"],
                        "name": r["name"],
                        "logo": r["logo"],
                        "summary": r["summary"],
                        "description": "",
                        "category": r["category"],
                        "frequency": r["frequency"],
                        "memberCount": r["member_count"],
                        "maxMembers": r["max_members"],
                        "requiresApplication": bool(r["requires_application"]),
                        "cover": r["cover"],
                    },
                }
            )
        return result
