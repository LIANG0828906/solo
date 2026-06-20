import sqlite3
import random
import time
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import List, Optional, Literal
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB_PATH = "campus_club.db"
ClubCategory = Literal["academic", "sports", "arts", "charity"]
ActivityFrequency = Literal["weekly", "biweekly", "monthly"]
ApplicationStatus = Literal["pending", "approved", "rejected"]


# ============================================================================
# 数据库初始化
# ============================================================================

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS clubs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            logo TEXT NOT NULL DEFAULT '',
            cover TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL,
            slogan TEXT NOT NULL,
            description TEXT NOT NULL,
            activity_frequency TEXT NOT NULL,
            member_count INTEGER NOT NULL DEFAULT 0,
            max_members INTEGER NOT NULL DEFAULT 100,
            requires_reason INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            club_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            registered INTEGER NOT NULL DEFAULT 0,
            max_capacity INTEGER NOT NULL DEFAULT 50,
            FOREIGN KEY (club_id) REFERENCES clubs(id)
        );

        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            club_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            avatar TEXT NOT NULL,
            joined_at TEXT NOT NULL,
            FOREIGN KEY (club_id) REFERENCES clubs(id)
        );

        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            club_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL DEFAULT 1,
            club_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            applied_at TEXT NOT NULL,
            reason TEXT DEFAULT '',
            member_count INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (club_id) REFERENCES clubs(id)
        );
        """)

        cur = db.execute("SELECT COUNT(*) as cnt FROM clubs")
        count = cur.fetchone()["cnt"]
        if count == 0:
            seed_data(db)


def seed_data(db: sqlite3.Connection):
    """初始化示例数据（Mock 数据）"""
    club_data = [
        {
            "name": "机器人研究社",
            "category": "academic",
            "slogan": "用代码和齿轮塑造未来",
            "description": "机器人研究社致力于培养同学们的工程实践能力和创新思维。我们定期举办机器人设计工作坊、参加全国大学生机器人大赛、开展AI与嵌入式系统研讨会。无论你是编程新手还是机械达人，在这里都能找到属于你的舞台。社团拥有专业的实验设备和指导老师，每年产出多项创新成果，已成为校园内最具影响力的学术社团之一。",
            "activity_frequency": "weekly",
            "max_members": 80,
            "requires_reason": False,
        },
        {
            "name": "篮球社",
            "category": "sports",
            "slogan": "无兄弟不篮球，挥洒青春汗水",
            "description": "篮球社是全校规模最大的体育社团之一，拥有固定训练场地和专业教练指导。每周组织2-3次训练活动，包括基础技术训练、战术配合演练和队内对抗赛。我们代表学校参加省市级大学生篮球联赛，连续三年蝉联市赛冠军。社团每年举办新生杯、毕业告别赛等特色活动，无论你是想提升球技还是结交志同道合的朋友，篮球社都欢迎你的加入！",
            "activity_frequency": "weekly",
            "max_members": 120,
            "requires_reason": False,
        },
        {
            "name": "舞蹈社",
            "category": "arts",
            "slogan": "用舞步诠释青春，用节拍点燃激情",
            "description": "舞蹈社涵盖街舞、爵士、现代、拉丁、民族舞等多种舞蹈风格。社团拥有独立的舞蹈排练室，每周提供6次以上的免费课程。我们定期举办校园舞蹈大赛、迎新晚会表演、毕业季快闪等活动，多次在校内外大型文艺演出中获得好评。由于训练强度较大、需要较强的艺术表现力，加入舞蹈社需通过简单面试，确保每位社员都能跟上训练节奏。",
            "activity_frequency": "weekly",
            "max_members": 60,
            "requires_reason": True,
        },
        {
            "name": "爱心公益社",
            "category": "charity",
            "slogan": "传递温暖，让爱洒满校园",
            "description": "爱心公益社长期致力于校园公益和社会志愿服务。我们开展的项目包括：山区儿童支教、敬老院慰问、流浪动物救助、环保宣传、社区义务家教等。社团与多家公益组织建立合作关系，每年组织20余场志愿活动，累计服务时长超5000小时。加入我们，一起用行动践行公益精神，让世界因为我们的努力变得更加美好。",
            "activity_frequency": "biweekly",
            "max_members": 150,
            "requires_reason": False,
        },
        {
            "name": "摄影协会",
            "category": "arts",
            "slogan": "光影定格瞬间，镜头记录美好",
            "description": "摄影协会为摄影爱好者提供技术学习和作品交流的平台。我们定期开展摄影基础讲座、后期处理工作坊、主题外拍活动、校园摄影大赛等。协会拥有专业的摄影设备可免费借用，并有资深摄影师担任指导老师。作品曾多次在全国大学生摄影展中获奖，每年出版校园摄影年鉴。无论你使用专业相机还是手机，只要热爱记录生活，我们都欢迎你！",
            "activity_frequency": "biweekly",
            "max_members": 90,
            "requires_reason": False,
        },
        {
            "name": "辩论社",
            "category": "academic",
            "slogan": "思辩青春，论道天下",
            "description": "辩论社以培养逻辑思维、语言表达和临场应变能力为宗旨。我们每周举办常规训练，包括辩论技巧学习、模拟辩论和热点话题研讨。社团辩论队征战全国各大辩论赛事，屡获佳绩，包括世界华语辩论锦标赛地区冠军、全国大学生辩论赛亚军等。由于辩论需要较强的思辨能力和表达能力，加入辩论社需要提交申请理由说明你的兴趣和相关经历。",
            "activity_frequency": "weekly",
            "max_members": 50,
            "requires_reason": True,
        },
        {
            "name": "足球俱乐部",
            "category": "sports",
            "slogan": "绿茵场上见真章，足球连接你我他",
            "description": "足球俱乐部是校园历史最悠久的体育社团之一。我们拥有男女足两支队伍，每周安排3次训练，周末组织友谊赛。俱乐部每年举办校园足球联赛，吸引全校30余支队伍参赛，是最受学生欢迎的体育盛事。我们与周边高校足球社团保持友好交流，定期组织城际比赛。只要你热爱足球，无论技术水平如何，都能在这里找到快乐。",
            "activity_frequency": "weekly",
            "max_members": 100,
            "requires_reason": False,
        },
        {
            "name": "书法协会",
            "category": "arts",
            "slogan": "笔墨纸砚间，传承千年文化",
            "description": "书法协会致力于传承和弘扬中华优秀传统文化。我们开设楷书、行书、草书、隶书等多种书体课程，邀请知名书法家担任指导。协会每年举办春节写春联、校园书法展、书法进校园等特色活动。作品多次在省市级书法比赛中获奖。社团提供免费的笔墨纸砚，零基础的同学也可以轻松入门，一起感受汉字之美。",
            "activity_frequency": "biweekly",
            "max_members": 70,
            "requires_reason": False,
        },
        {
            "name": "数学建模协会",
            "category": "academic",
            "slogan": "用数学描绘世界，用模型解决问题",
            "description": "数学建模协会面向对数学和计算机应用感兴趣的同学，提供数学建模竞赛培训和实战演练。我们定期举办算法讲座、建模工作坊、校内建模赛，为参加全国大学生数学建模竞赛（CUMCM）、美国大学生数学建模竞赛（MCM/ICM）等国际赛事输送队员。协会成员累计获得国家级奖项20余项，国际级奖项50余项。",
            "activity_frequency": "weekly",
            "max_members": 80,
            "requires_reason": False,
        },
        {
            "name": "志愿者联盟",
            "category": "charity",
            "slogan": "志在心中，愿在行动",
            "description": "志愿者联盟是学校最大的志愿服务组织，注册志愿者超过800人。我们长期运营社区图书馆、山区助学、大型赛会志愿服务等10余个项目。联盟与市志愿者联合会深度合作，服务时长可计入志愿汇系统。每月组织志愿者培训和分享会，年度评选优秀志愿者并颁发荣誉证书。",
            "activity_frequency": "monthly",
            "max_members": 200,
            "requires_reason": False,
        },
        {
            "name": "羽毛球社",
            "category": "sports",
            "slogan": "羽你同行，谁与争锋",
            "description": "羽毛球社为全校羽毛球爱好者提供交流和切磋的平台。每周开放4次室内场地，分基础班和提高班进行针对性训练。社团每年举办新生杯、毕业杯、院系对抗赛等多项品牌赛事。我们代表学校参加市大学生羽毛球赛，连续多年获得团体前三名。",
            "activity_frequency": "weekly",
            "max_members": 90,
            "requires_reason": False,
        },
        {
            "name": "话剧社",
            "category": "arts",
            "slogan": "戏如人生，人生如戏",
            "description": "话剧社是校园内最具艺术气息的社团之一。我们每年排演2-3部大型话剧，包括经典剧目改编和原创剧本。社团设有编剧部、导演部、演员部、舞美部、宣传部等多个部门，无论你是否有表演经验，都能找到适合自己的位置。年度大戏在学校千人礼堂上演，场场爆满，深受师生好评。",
            "activity_frequency": "biweekly",
            "max_members": 60,
            "requires_reason": False,
        },
        {
            "name": "AI 人工智能社",
            "category": "academic",
            "slogan": "探索智能边界，创造无限可能",
            "description": "AI 人工智能社聚焦前沿科技，涵盖机器学习、深度学习、自然语言处理、计算机视觉等热门方向。我们定期开展技术分享会、论文读书会、Kaggle 竞赛组队、AI 产品孵化等活动。社团拥有 GPU 服务器可供社员使用，已孵化出多个获奖创业项目。腾讯、百度等知名 AI 企业工程师定期来校交流。",
            "activity_frequency": "weekly",
            "max_members": 100,
            "requires_reason": False,
        },
        {
            "name": "乒乓球协会",
            "category": "sports",
            "slogan": "乒乓跃动，青春飞扬",
            "description": "乒乓球协会为广大国球爱好者提供专业的训练和竞技平台。协会配备专业发球机和多球训练设备，每周开展5次训练活动。社团代表队在省大学生乒乓球锦标赛中屡获佳绩。每年举办的校级乒乓球联赛是学校参与人数最多的单项体育赛事之一。",
            "activity_frequency": "weekly",
            "max_members": 85,
            "requires_reason": False,
        },
        {
            "name": "绿色环保协会",
            "category": "charity",
            "slogan": "守护绿色家园，践行低碳生活",
            "description": "绿色环保协会致力于环保理念宣传和环保实践活动。我们开展的品牌活动包括：地球一小时熄灯活动、校园垃圾分类推广、绿植领养、河流守望者、旧物置换市集等。协会与本地环保NGO合作，定期参与户外环保志愿活动，用实际行动守护绿水青山。",
            "activity_frequency": "monthly",
            "max_members": 120,
            "requires_reason": False,
        },
    ]

    avatar_pool = [
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Max",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=Gigi",
    ]
    name_pool = [
        "张同学", "李同学", "王同学", "赵同学", "陈同学", "刘同学",
        "杨同学", "黄同学", "周同学", "吴同学", "郑同学", "孙同学",
    ]

    club_ids = []
    for club in club_data:
        cur = db.execute("""
            INSERT INTO clubs (name, category, slogan, description, activity_frequency,
                             member_count, max_members, requires_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            club["name"], club["category"], club["slogan"], club["description"],
            club["activity_frequency"], 0, club["max_members"],
            1 if club["requires_reason"] else 0,
        ))
        club_id = cur.lastrowid
        club_ids.append(club_id)

        member_count = random.randint(15, min(club["max_members"], 50))
        for i in range(member_count):
            idx = random.randint(0, len(avatar_pool) - 1)
            join_date = (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat()
            db.execute("""
                INSERT INTO members (club_id, name, avatar, joined_at)
                VALUES (?, ?, ?, ?)
            """, (club_id, name_pool[idx % len(name_pool)], avatar_pool[idx], join_date))
        db.execute("UPDATE clubs SET member_count = ? WHERE id = ?", (member_count, club_id))

        activity_count = random.randint(3, 8)
        activity_names = {
            "academic": ["学术研讨会", "前沿技术分享会", "论文精读会", "竞赛经验交流会", "企业参观学习", "名师讲座", "编程马拉松", "项目实战营"],
            "sports": ["周末训练赛", "技术专项训练", "跨校友谊赛", "体能提升营", "新生入门课", "战术分析会", "队内对抗赛", "年度校联赛"],
            "arts": ["常规排练活动", "主题创作工作坊", "展演活动", "大师课", "校园开放日表演", "艺术沙龙", "作品展览会", "迎新晚会彩排"],
            "charity": ["社区志愿服务", "主题公益活动", "志愿者培训", "山区支教行", "公益跑筹款", "环保行动日", "敬老院慰问", "爱心义卖"],
        }
        location_pool = ["学校大礼堂", "体育馆", "综合楼302", "操场", "活动中心多功能厅", "实验楼报告厅", "图书馆会议室", "文体中心"]
        cat = club["category"]
        names = activity_names.get(cat, ["常规活动"])
        for i in range(activity_count):
            act_date = (datetime.now() + timedelta(days=random.randint(-60, 60))).isoformat()
            max_cap = random.randint(30, 80)
            registered = random.randint(0, max_cap)
            db.execute("""
                INSERT INTO activities (club_id, name, date, location, registered, max_capacity)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                club_id,
                names[i % len(names)] + ("第" + str(random.randint(1, 12)) + "期" if random.random() > 0.5 else ""),
                act_date,
                location_pool[random.randint(0, len(location_pool) - 1)],
                registered,
                max_cap,
            ))

    sample_apps = [
        (club_ids[0], "approved", club_data[0]["name"]),
        (club_ids[1], "pending", club_data[1]["name"]),
        (club_ids[4], "approved", club_data[4]["name"]),
        (club_ids[2], "rejected", club_data[2]["name"]),
    ]
    for cid, status, cname in sample_apps:
        cur = db.execute("SELECT member_count FROM clubs WHERE id = ?", (cid,))
        mc = cur.fetchone()["member_count"]
        applied_at = (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()
        db.execute("""
            INSERT INTO applications (club_id, club_name, status, applied_at, member_count)
            VALUES (?, ?, ?, ?, ?)
        """, (cid, cname, status, applied_at, mc))


# ============================================================================
# Pydantic 数据模型
# ============================================================================

class Member(BaseModel):
    id: int
    name: str
    avatar: str
    joinedAt: str


class Activity(BaseModel):
    id: int
    name: str
    date: str
    location: str
    registered: int
    maxCapacity: int


class Club(BaseModel):
    id: int
    name: str
    logo: str
    cover: str
    category: str
    slogan: str
    description: str
    activityFrequency: str
    memberCount: int
    maxMembers: int
    requiresReason: bool
    activities: List[Activity]
    members: List[Member]


class ClubListItem(BaseModel):
    id: int
    name: str
    logo: str
    cover: str
    category: str
    slogan: str
    description: str
    activityFrequency: str
    memberCount: int
    maxMembers: int
    requiresReason: bool
    members: List[Member]


class UserApplication(BaseModel):
    id: int
    clubId: int
    clubName: str
    status: str
    appliedAt: str
    memberCount: int


class ApplyRequest(BaseModel):
    clubId: int
    reason: Optional[str] = None


class ApplyResponse(BaseModel):
    status: str
    message: str


class ActivityListResponse(BaseModel):
    data: List[Activity]
    total: int


# ============================================================================
# FastAPI 应用
# ============================================================================

app = FastAPI(title="校园社团管理平台 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_USER_ID = 1


def row_to_club_list(row: sqlite3.Row, members: List[Member]) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "logo": row["logo"],
        "cover": row["cover"],
        "category": row["category"],
        "slogan": row["slogan"],
        "description": row["description"],
        "activityFrequency": row["activity_frequency"],
        "memberCount": row["member_count"],
        "maxMembers": row["max_members"],
        "requiresReason": bool(row["requires_reason"]),
        "members": members,
    }


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/clubs", response_model=List[ClubListItem])
def list_clubs(
    category: Optional[str] = Query(None, description="类别筛选: academic/sports/arts/charity"),
    frequency: Optional[str] = Query(None, description="频次筛选: weekly/biweekly/monthly"),
):
    """社团列表 API：按筛选条件返回社团列表，含前4个成员信息"""
    # 模拟轻微网络延迟，保证响应速度 <1s
    time.sleep(0.05)

    with get_db() as db:
        query = "SELECT * FROM clubs WHERE 1=1"
        params: list = []
        if category and category != "all":
            query += " AND category = ?"
            params.append(category)
        if frequency and frequency != "all":
            query += " AND activity_frequency = ?"
            params.append(frequency)

        query += " ORDER BY member_count DESC"
        rows = db.execute(query, params).fetchall()

        result = []
        for row in rows:
            mem_rows = db.execute(
                "SELECT * FROM members WHERE club_id = ? ORDER BY joined_at DESC LIMIT 4",
                (row["id"],)
            ).fetchall()
            members = [
                Member(
                    id=m["id"],
                    name=m["name"],
                    avatar=m["avatar"],
                    joinedAt=m["joined_at"],
                ) for m in mem_rows
            ]
            result.append(row_to_club_list(row, members))
        return result


@app.get("/api/clubs/{club_id}", response_model=Club)
def get_club_detail(club_id: int):
    """社团详情 API：返回社团完整信息、所有活动和成员"""
    with get_db() as db:
        row = db.execute("SELECT * FROM clubs WHERE id = ?", (club_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="社团不存在")

        act_rows = db.execute(
            "SELECT * FROM activities WHERE club_id = ? ORDER BY date DESC",
            (club_id,)
        ).fetchall()
        activities = [
            Activity(
                id=a["id"],
                name=a["name"],
                date=a["date"],
                location=a["location"],
                registered=a["registered"],
                maxCapacity=a["max_capacity"],
            ) for a in act_rows
        ]

        mem_rows = db.execute(
            "SELECT * FROM members WHERE club_id = ? ORDER BY joined_at DESC",
            (club_id,)
        ).fetchall()
        members = [
            Member(
                id=m["id"],
                name=m["name"],
                avatar=m["avatar"],
                joinedAt=m["joined_at"],
            ) for m in mem_rows
        ]

        club = row_to_club_list(row, members)
        club["activities"] = activities
        return club


@app.get("/api/clubs/{club_id}/activities", response_model=ActivityListResponse)
def list_club_activities(club_id: int, page: int = 1, pageSize: int = 5):
    """社团活动分页 API：按时间倒序返回活动列表"""
    with get_db() as db:
        total_row = db.execute(
            "SELECT COUNT(*) as cnt FROM activities WHERE club_id = ?",
            (club_id,)
        ).fetchone()
        total = total_row["cnt"]

        offset = (page - 1) * pageSize
        rows = db.execute(
            """SELECT * FROM activities WHERE club_id = ?
               ORDER BY date DESC LIMIT ? OFFSET ?""",
            (club_id, pageSize, offset),
        ).fetchall()

        data = [
            Activity(
                id=a["id"],
                name=a["name"],
                date=a["date"],
                location=a["location"],
                registered=a["registered"],
                maxCapacity=a["max_capacity"],
            ) for a in rows
        ]
        return ActivityListResponse(data=data, total=total)


@app.post("/api/clubs/{club_id}/apply", response_model=ApplyResponse)
def apply_club(club_id: int, body: ApplyRequest):
    """社团报名 API：提交报名申请，支持申请理由"""
    with get_db() as db:
        club = db.execute("SELECT * FROM clubs WHERE id = ?", (club_id,)).fetchone()
        if not club:
            raise HTTPException(status_code=404, detail="社团不存在")

        existing = db.execute(
            "SELECT * FROM applications WHERE club_id = ? AND user_id = ?",
            (club_id, CURRENT_USER_ID),
        ).fetchone()
        if existing:
            status_map = {
                "pending": "您已提交申请，正在审核中",
                "approved": "您已成功加入该社团",
                "rejected": "您的申请已被拒绝，请联系管理员",
            }
            return ApplyResponse(
                status="duplicate",
                message=status_map.get(existing["status"], "您已提交过申请"),
            )

        if club["member_count"] >= club["max_members"]:
            return ApplyResponse(status="full", message="社团人数已满")

        if club["requires_reason"]:
            reason = (body.reason or "").strip()
            if len(reason) < 50 or len(reason) > 200:
                raise HTTPException(
                    status_code=400,
                    detail="该社团需要审核，申请理由需在50-200字之间",
                )
            final_status = "pending"
            final_msg = "申请已提交，等待社团审核"
        else:
            final_status = "approved"
            final_msg = "报名成功！欢迎加入" + club["name"]

            db.execute(
                "UPDATE clubs SET member_count = member_count + 1 WHERE id = ?",
                (club_id,),
            )
            db.execute(
                """INSERT INTO members (club_id, name, avatar, joined_at)
                   VALUES (?, ?, ?, ?)""",
                (club_id, "张同学",
                 "https://api.dicebear.com/7.x/avataaars/svg?seed=Me",
                 datetime.now().isoformat()),
            )

        db.execute(
            """INSERT INTO applications
               (club_id, user_id, club_name, status, applied_at, reason, member_count)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (club_id, CURRENT_USER_ID, club["name"], final_status,
             datetime.now().isoformat(), body.reason or "", club["member_count"]),
        )

        return ApplyResponse(status=final_status, message=final_msg)


@app.get("/api/user/applications", response_model=List[UserApplication])
def list_applications():
    """用户申请列表 API：返回当前用户所有报名记录"""
    with get_db() as db:
        rows = db.execute(
            """SELECT a.*, c.member_count as current_count
               FROM applications a
               LEFT JOIN clubs c ON a.club_id = c.id
               WHERE a.user_id = ?
               ORDER BY a.applied_at DESC""",
            (CURRENT_USER_ID,),
        ).fetchall()
        return [
            UserApplication(
                id=r["id"],
                clubId=r["club_id"],
                clubName=r["club_name"],
                status=r["status"],
                appliedAt=r["applied_at"],
                memberCount=r["current_count"] or r["member_count"],
            ) for r in rows
        ]


@app.get("/api/health")
def health():
    """健康检查"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
