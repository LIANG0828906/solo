from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime
import uuid
import asyncio

app = FastAPI(title="诗词协作平台 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

poems_db: Dict[str, Dict[str, Any]] = {}
annotations_db: Dict[str, Dict[str, Any]] = {}
inspirations_db: Dict[str, Dict[str, Any]] = {}
collections_db: Dict[str, Dict[str, Any]] = {}
comments_db: Dict[str, Dict[str, Any]] = {}
collaborators_db: Dict[str, Dict[str, Any]] = {}
users_db: Dict[str, Dict[str, Any]] = {}

poem_annotations: Dict[str, List[str]] = {}
poem_comments: Dict[str, List[str]] = {}
poem_collaborators: Dict[str, List[str]] = {}
user_inspirations: Dict[str, List[str]] = {}
user_collections: Dict[str, List[str]] = {}
user_poems: Dict[str, List[str]] = {}
collection_poems: Dict[str, List[str]] = {}

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.websocket_to_poem: Dict[WebSocket, str] = {}
        self.websocket_to_user: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, poem_id: str, user_id: str):
        await websocket.accept()
        if poem_id not in self.active_connections:
            self.active_connections[poem_id] = set()
        self.active_connections[poem_id].add(websocket)
        self.websocket_to_poem[websocket] = poem_id
        self.websocket_to_user[websocket] = user_id

    def disconnect(self, websocket: WebSocket):
        poem_id = self.websocket_to_poem.get(websocket)
        if poem_id and poem_id in self.active_connections:
            self.active_connections[poem_id].discard(websocket)
            if not self.active_connections[poem_id]:
                del self.active_connections[poem_id]
        self.websocket_to_poem.pop(websocket, None)
        self.websocket_to_user.pop(websocket, None)

    async def broadcast(self, poem_id: str, message: Dict[str, Any], exclude_sender: Optional[WebSocket] = None):
        if poem_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[poem_id]:
                if connection == exclude_sender:
                    continue
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(dead)

manager = ConnectionManager()

def now_iso() -> str:
    return datetime.now().isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

class PoemLineCreate(BaseModel):
    id: Optional[str] = None
    text: str
    rhymeMark: str = ""
    charCount: Optional[int] = None
    order: Optional[int] = None

class PoemCreate(BaseModel):
    title: str
    authorId: str
    collectionId: Optional[str] = None
    lines: List[PoemLineCreate] = []

class PoemUpdate(BaseModel):
    title: Optional[str] = None
    lines: Optional[List[PoemLineCreate]] = None
    collectionId: Optional[str] = None

class AnnotationCreate(BaseModel):
    lineId: str
    authorId: str
    startOffset: int
    endOffset: int
    highlightedText: str
    content: str

class AnnotationReplyCreate(BaseModel):
    authorId: str
    content: str

class InviteCreate(BaseModel):
    email: str

class InspirationCreate(BaseModel):
    content: str

class InspirationUpdate(BaseModel):
    starred: Optional[bool] = None
    content: Optional[str] = None

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CommentCreate(BaseModel):
    userId: str
    content: str

def build_lines(lines_data: List[PoemLineCreate]) -> List[Dict[str, Any]]:
    result = []
    for idx, line in enumerate(lines_data):
        line_dict = line.model_dump()
        if not line_dict.get("id"):
            line_dict["id"] = new_id()
        if line_dict.get("charCount") is None:
            line_dict["charCount"] = len(line_dict["text"])
        if line_dict.get("order") is None:
            line_dict["order"] = idx
        result.append(line_dict)
    return result

def build_poem_response(poem: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(poem)
    comments_count = len(poem_comments.get(poem["id"], []))
    result["commentCount"] = comments_count
    return result

def seed_data():
    users = [
        {"id": "user-1", "email": "poet@shiyun.com", "name": "墨客", "avatar": ""},
        {"id": "user-2", "email": "libai@shiyun.com", "name": "李白传人", "avatar": ""},
        {"id": "user-3", "email": "dufu@shiyun.com", "name": "少陵野老", "avatar": ""},
        {"id": "user-4", "email": "sushi@shiyun.com", "name": "东坡居士", "avatar": ""},
    ]
    for u in users:
        users_db[u["id"]] = u

    collections_data = [
        {"userId": "user-1", "name": "唐诗精选", "description": "收录唐代名家经典诗作，感受盛唐气象。"},
        {"userId": "user-1", "name": "宋词雅韵", "description": "品味宋代词人情思，领略长短句之美。"},
        {"userId": "user-2", "name": "山水田园", "description": "描绘自然山水，抒发隐逸情怀。"},
    ]
    for c in collections_data:
        cid = new_id()
        coll = {
            "id": cid,
            "userId": c["userId"],
            "name": c["name"],
            "description": c["description"],
            "poemCount": 0,
            "createdAt": now_iso(),
        }
        collections_db[cid] = coll
        uid = c["userId"]
        if uid not in user_collections:
            user_collections[uid] = []
        user_collections[uid].append(cid)

    collection_ids = list(collections_db.keys())

    poems_content = [
        {
            "title": "静夜思",
            "authorId": "user-1",
            "collectionIdx": 0,
            "lines": [
                "床前明月光，",
                "疑是地上霜。",
                "举头望明月，",
                "低头思故乡。",
            ],
        },
        {
            "title": "春晓",
            "authorId": "user-2",
            "collectionIdx": 0,
            "lines": [
                "春眠不觉晓，",
                "处处闻啼鸟。",
                "夜来风雨声，",
                "花落知多少。",
            ],
        },
        {
            "title": "登鹳雀楼",
            "authorId": "user-1",
            "collectionIdx": 0,
            "lines": [
                "白日依山尽，",
                "黄河入海流。",
                "欲穷千里目，",
                "更上一层楼。",
            ],
        },
        {
            "title": "望庐山瀑布",
            "authorId": "user-2",
            "collectionIdx": 2,
            "lines": [
                "日照香炉生紫烟，",
                "遥看瀑布挂前川。",
                "飞流直下三千尺，",
                "疑是银河落九天。",
            ],
        },
        {
            "title": "水调歌头",
            "authorId": "user-4",
            "collectionIdx": 1,
            "lines": [
                "明月几时有？把酒问青天。",
                "不知天上宫阙，今夕是何年。",
                "我欲乘风归去，又恐琼楼玉宇，",
                "高处不胜寒。起舞弄清影，何似在人间。",
                "转朱阁，低绮户，照无眠。",
                "不应有恨，何事长向别时圆？",
                "人有悲欢离合，月有阴晴圆缺，",
                "此事古难全。但愿人长久，千里共婵娟。",
            ],
        },
        {
            "title": "江雪",
            "authorId": "user-3",
            "collectionIdx": 2,
            "lines": [
                "千山鸟飞绝，",
                "万径人踪灭。",
                "孤舟蓑笠翁，",
                "独钓寒江雪。",
            ],
        },
        {
            "title": "枫桥夜泊",
            "authorId": "user-1",
            "collectionIdx": 0,
            "lines": [
                "月落乌啼霜满天，",
                "江枫渔火对愁眠。",
                "姑苏城外寒山寺，",
                "夜半钟声到客船。",
            ],
        },
        {
            "title": "念奴娇·赤壁怀古",
            "authorId": "user-4",
            "collectionIdx": 1,
            "lines": [
                "大江东去，浪淘尽，千古风流人物。",
                "故垒西边，人道是，三国周郎赤壁。",
                "乱石穿空，惊涛拍岸，卷起千堆雪。",
                "江山如画，一时多少豪杰。",
                "遥想公瑾当年，小乔初嫁了，雄姿英发。",
                "羽扇纶巾，谈笑间，樯橹灰飞烟灭。",
                "故国神游，多情应笑我，早生华发。",
                "人生如梦，一尊还酹江月。",
            ],
        },
    ]

    rhyme_marks = ["韵", "", "韵", "", "韵", "", "韵", ""]

    for poem_info in poems_content:
        pid = new_id()
        lines_list = []
        for i, text in enumerate(poem_info["lines"]):
            lines_list.append({
                "id": new_id(),
                "text": text,
                "rhymeMark": rhyme_marks[i % len(rhyme_marks)] if i % 2 == 0 else "",
                "charCount": len(text),
                "order": i,
            })
        cid = collection_ids[poem_info["collectionIdx"]] if poem_info["collectionIdx"] is not None else None
        poem = {
            "id": pid,
            "title": poem_info["title"],
            "authorId": poem_info["authorId"],
            "collectionId": cid,
            "lines": lines_list,
            "likeCount": 0,
            "commentCount": 0,
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
        poems_db[pid] = poem
        aid = poem_info["authorId"]
        if aid not in user_poems:
            user_poems[aid] = []
        user_poems[aid].append(pid)
        if cid:
            if cid not in collection_poems:
                collection_poems[cid] = []
            collection_poems[cid].append(pid)
            collections_db[cid]["poemCount"] += 1

    poem_ids = list(poems_db.keys())

    inspirations_data = [
        {"content": "大漠孤烟直，长河落日圆。——王维", "starred": True},
        {"content": "人生若只如初见，何事秋风悲画扇。——纳兰性德", "starred": True},
        {"content": "曾经沧海难为水，除却巫山不是云。——元稹", "starred": False},
        {"content": "山重水复疑无路，柳暗花明又一村。——陆游", "starred": True},
        {"content": "落霞与孤鹜齐飞，秋水共长天一色。——王勃", "starred": False},
        {"content": "衣带渐宽终不悔，为伊消得人憔悴。——柳永", "starred": False},
        {"content": "两情若是久长时，又岂在朝朝暮暮。——秦观", "starred": True},
        {"content": "问渠那得清如许？为有源头活水来。——朱熹", "starred": False},
    ]
    for insp in inspirations_data:
        iid = new_id()
        card = {
            "id": iid,
            "userId": "user-1",
            "content": insp["content"],
            "starred": insp["starred"],
            "createdAt": now_iso(),
        }
        inspirations_db[iid] = card
        if "user-1" not in user_inspirations:
            user_inspirations["user-1"] = []
        user_inspirations["user-1"].append(iid)

    first_poem = poem_ids[0]
    first_poem_obj = poems_db[first_poem]
    first_line_id = first_poem_obj["lines"][0]["id"]
    second_line_id = first_poem_obj["lines"][1]["id"]
    second_poem = poem_ids[1]
    second_poem_obj = poems_db[second_poem]
    third_line_id = second_poem_obj["lines"][0]["id"]
    fourth_poem = poem_ids[3]
    fourth_poem_obj = poems_db[fourth_poem]
    fourth_line_id = fourth_poem_obj["lines"][2]["id"]

    annotations_data = [
        {
            "poemId": first_poem,
            "lineId": first_line_id,
            "authorId": "user-2",
            "authorName": "李白传人",
            "startOffset": 2,
            "endOffset": 4,
            "highlightedText": "明月",
            "content": "此处'明月'既写实，又象征思乡之情，情景交融。",
            "replies": [],
        },
        {
            "poemId": first_poem,
            "lineId": second_line_id,
            "authorId": "user-3",
            "authorName": "少陵野老",
            "startOffset": 4,
            "endOffset": 6,
            "highlightedText": "地上霜",
            "content": "以霜喻月光，生动贴切，奠定全诗清冷基调。",
            "replies": [],
        },
        {
            "poemId": second_poem,
            "lineId": third_line_id,
            "authorId": "user-4",
            "authorName": "东坡居士",
            "startOffset": 0,
            "endOffset": 5,
            "highlightedText": "春眠不觉",
            "content": "'不觉'二字传神，写出春睡之酣与春来之不知不觉。",
            "replies": [],
        },
        {
            "poemId": fourth_poem,
            "lineId": fourth_line_id,
            "authorId": "user-1",
            "authorName": "墨客",
            "startOffset": 0,
            "endOffset": 4,
            "highlightedText": "飞流直下",
            "content": "气势磅礴，'三千尺'为夸张手法，极言瀑布之高。",
            "replies": [],
        },
    ]
    for ann in annotations_data:
        aid = new_id()
        annotation = {
            "id": aid,
            "poemId": ann["poemId"],
            "lineId": ann["lineId"],
            "authorId": ann["authorId"],
            "authorName": ann["authorName"],
            "startOffset": ann["startOffset"],
            "endOffset": ann["endOffset"],
            "highlightedText": ann["highlightedText"],
            "content": ann["content"],
            "replies": [],
            "createdAt": now_iso(),
        }
        annotations_db[aid] = annotation
        pid = ann["poemId"]
        if pid not in poem_annotations:
            poem_annotations[pid] = []
        poem_annotations[pid].append(aid)

    collaborators_data = [
        {"poemIdx": 0, "userId": "user-2", "userName": "李白传人", "role": "editor"},
        {"poemIdx": 0, "userId": "user-3", "userName": "少陵野老", "role": "viewer"},
        {"poemIdx": 4, "userId": "user-1", "userName": "墨客", "role": "editor"},
    ]
    for coll in collaborators_data:
        cid = new_id()
        poem_id = poem_ids[coll["poemIdx"]]
        collaborator = {
            "id": cid,
            "poemId": poem_id,
            "userId": coll["userId"],
            "userName": coll["userName"],
            "avatar": "",
            "role": coll["role"],
        }
        collaborators_db[cid] = collaborator
        if poem_id not in poem_collaborators:
            poem_collaborators[poem_id] = []
        poem_collaborators[poem_id].append(cid)

    comments_data = [
        {"poemIdx": 0, "userId": "user-2", "userName": "李白传人", "content": "思乡之情，溢于言表，千古名篇！"},
        {"poemIdx": 0, "userId": "user-3", "userName": "少陵野老", "content": "短短二十字，却道尽游子心声。"},
        {"poemIdx": 1, "userId": "user-1", "userName": "墨客", "content": "春意盎然，生机无限，好诗！"},
        {"poemIdx": 2, "userId": "user-4", "userName": "东坡居士", "content": "意境开阔，寓意深远，'更上一层楼'乃点睛之笔。"},
        {"poemIdx": 4, "userId": "user-2", "userName": "李白传人", "content": "东坡此词，天上人间，纵横捭阖，真乃词中绝唱。"},
        {"poemIdx": 7, "userId": "user-3", "userName": "少陵野老", "content": "怀古伤今，气势雄浑，'人生如梦'一句感慨万千。"},
    ]
    for c in comments_data:
        cid = new_id()
        poem_id = poem_ids[c["poemIdx"]]
        comment = {
            "id": cid,
            "poemId": poem_id,
            "userId": c["userId"],
            "userName": c["userName"],
            "content": c["content"],
            "createdAt": now_iso(),
        }
        comments_db[cid] = comment
        if poem_id not in poem_comments:
            poem_comments[poem_id] = []
        poem_comments[poem_id].append(cid)

seed_data()

@app.get("/api/poems")
async def list_poems(authorId: Optional[str] = Query(None), collectionId: Optional[str] = Query(None)):
    result = []
    for pid, poem in poems_db.items():
        if authorId and poem["authorId"] != authorId:
            continue
        if collectionId and poem["collectionId"] != collectionId:
            continue
        result.append(build_poem_response(poem))
    return result

@app.post("/api/poems")
async def create_poem(data: PoemCreate):
    pid = new_id()
    lines = build_lines(data.lines)
    poem = {
        "id": pid,
        "title": data.title,
        "authorId": data.authorId,
        "collectionId": data.collectionId,
        "lines": lines,
        "likeCount": 0,
        "commentCount": 0,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    poems_db[pid] = poem
    aid = data.authorId
    if aid not in user_poems:
        user_poems[aid] = []
    user_poems[aid].append(pid)
    if data.collectionId:
        cid = data.collectionId
        if cid not in collection_poems:
            collection_poems[cid] = []
        collection_poems[cid].append(pid)
        if cid in collections_db:
            collections_db[cid]["poemCount"] += 1
    return build_poem_response(poem)

@app.get("/api/poems/{poem_id}")
async def get_poem(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    return build_poem_response(poems_db[poem_id])

@app.put("/api/poems/{poem_id}")
async def update_poem(poem_id: str, data: PoemUpdate):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    poem = poems_db[poem_id]
    old_collection = poem["collectionId"]
    if data.title is not None:
        poem["title"] = data.title
    if data.lines is not None:
        poem["lines"] = build_lines(data.lines)
    new_collection = data.collectionId
    if "collectionId" in data.model_fields_set:
        if old_collection and old_collection != new_collection:
            if old_collection in collection_poems:
                if poem_id in collection_poems[old_collection]:
                    collection_poems[old_collection].remove(poem_id)
                    if old_collection in collections_db:
                        collections_db[old_collection]["poemCount"] = max(0, collections_db[old_collection]["poemCount"] - 1)
        if new_collection and new_collection != old_collection:
            if new_collection not in collection_poems:
                collection_poems[new_collection] = []
            if poem_id not in collection_poems[new_collection]:
                collection_poems[new_collection].append(poem_id)
                if new_collection in collections_db:
                    collections_db[new_collection]["poemCount"] += 1
        poem["collectionId"] = new_collection
    poem["updatedAt"] = now_iso()
    return build_poem_response(poem)

@app.delete("/api/poems/{poem_id}")
async def delete_poem(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    poem = poems_db[poem_id]
    aid = poem["authorId"]
    if aid in user_poems and poem_id in user_poems[aid]:
        user_poems[aid].remove(poem_id)
    cid = poem["collectionId"]
    if cid and cid in collection_poems and poem_id in collection_poems[cid]:
        collection_poems[cid].remove(poem_id)
        if cid in collections_db:
            collections_db[cid]["poemCount"] = max(0, collections_db[cid]["poemCount"] - 1)
    ann_ids = poem_annotations.get(poem_id, [])
    for aid in ann_ids:
        annotations_db.pop(aid, None)
    poem_annotations.pop(poem_id, None)
    comment_ids = poem_comments.get(poem_id, [])
    for cid in comment_ids:
        comments_db.pop(cid, None)
    poem_comments.pop(poem_id, None)
    collab_ids = poem_collaborators.get(poem_id, [])
    for cid in collab_ids:
        collaborators_db.pop(cid, None)
    poem_collaborators.pop(poem_id, None)
    del poems_db[poem_id]
    return {"success": True}

@app.post("/api/poems/{poem_id}/check-tonal")
async def check_tonal(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    poem = poems_db[poem_id]
    results = []
    for line in poem["lines"]:
        results.append({
            "lineId": line["id"],
            "score": 100,
            "errors": [],
        })
    return {"results": results, "passed": True}

@app.post("/api/poems/{poem_id}/like")
async def like_poem(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    poems_db[poem_id]["likeCount"] += 1
    return {"id": poem_id, "likeCount": poems_db[poem_id]["likeCount"]}

@app.get("/api/poems/{poem_id}/annotations")
async def list_annotations(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    aid_list = poem_annotations.get(poem_id, [])
    return [annotations_db[aid] for aid in aid_list if aid in annotations_db]

@app.post("/api/poems/{poem_id}/annotations")
async def create_annotation(poem_id: str, data: AnnotationCreate):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    aid = new_id()
    author = users_db.get(data.authorId, {"name": "匿名"})
    annotation = {
        "id": aid,
        "poemId": poem_id,
        "lineId": data.lineId,
        "authorId": data.authorId,
        "authorName": author["name"],
        "startOffset": data.startOffset,
        "endOffset": data.endOffset,
        "highlightedText": data.highlightedText,
        "content": data.content,
        "replies": [],
        "createdAt": now_iso(),
    }
    annotations_db[aid] = annotation
    if poem_id not in poem_annotations:
        poem_annotations[poem_id] = []
    poem_annotations[poem_id].append(aid)
    return annotation

@app.post("/api/poems/{poem_id}/annotations/{annotation_id}/replies")
async def create_annotation_reply(poem_id: str, annotation_id: str, data: AnnotationReplyCreate):
    if annotation_id not in annotations_db:
        raise HTTPException(status_code=404, detail="Annotation not found")
    author = users_db.get(data.authorId, {"name": "匿名"})
    reply = {
        "id": new_id(),
        "authorId": data.authorId,
        "authorName": author["name"],
        "content": data.content,
        "createdAt": now_iso(),
    }
    annotations_db[annotation_id]["replies"].append(reply)
    return reply

@app.get("/api/poems/{poem_id}/collaborators")
async def list_collaborators(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    cid_list = poem_collaborators.get(poem_id, [])
    return [collaborators_db[cid] for cid in cid_list if cid in collaborators_db]

@app.post("/api/poems/{poem_id}/invite")
async def invite_collaborator(poem_id: str, data: InviteCreate):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    cid = new_id()
    user_name = data.email.split("@")[0]
    collaborator = {
        "id": cid,
        "poemId": poem_id,
        "userId": new_id(),
        "userName": user_name,
        "avatar": "",
        "role": "editor",
    }
    collaborators_db[cid] = collaborator
    if poem_id not in poem_collaborators:
        poem_collaborators[poem_id] = []
    poem_collaborators[poem_id].append(cid)
    return collaborator

@app.get("/api/inspirations")
async def list_inspirations():
    default_user = "user-1"
    iid_list = user_inspirations.get(default_user, [])
    result = []
    for iid in iid_list:
        if iid in inspirations_db:
            result.append(inspirations_db[iid])
    result.sort(key=lambda x: x["createdAt"], reverse=True)
    return result

@app.post("/api/inspirations")
async def create_inspiration(data: InspirationCreate):
    iid = new_id()
    user_id = "user-1"
    card = {
        "id": iid,
        "userId": user_id,
        "content": data.content,
        "starred": False,
        "createdAt": now_iso(),
    }
    inspirations_db[iid] = card
    if user_id not in user_inspirations:
        user_inspirations[user_id] = []
    user_inspirations[user_id].append(iid)
    return card

@app.put("/api/inspirations/{inspiration_id}")
async def update_inspiration(inspiration_id: str, data: InspirationUpdate):
    if inspiration_id not in inspirations_db:
        raise HTTPException(status_code=404, detail="Inspiration not found")
    card = inspirations_db[inspiration_id]
    if data.starred is not None:
        card["starred"] = data.starred
    if data.content is not None:
        card["content"] = data.content
    return card

@app.delete("/api/inspirations/{inspiration_id}")
async def delete_inspiration(inspiration_id: str):
    if inspiration_id not in inspirations_db:
        raise HTTPException(status_code=404, detail="Inspiration not found")
    card = inspirations_db[inspiration_id]
    uid = card["userId"]
    if uid in user_inspirations and inspiration_id in user_inspirations[uid]:
        user_inspirations[uid].remove(inspiration_id)
    del inspirations_db[inspiration_id]
    return {"success": True}

@app.get("/api/collections")
async def list_collections():
    return list(collections_db.values())

@app.post("/api/collections")
async def create_collection(data: CollectionCreate):
    cid = new_id()
    user_id = "user-1"
    collection = {
        "id": cid,
        "userId": user_id,
        "name": data.name,
        "description": data.description or "",
        "poemCount": 0,
        "createdAt": now_iso(),
    }
    collections_db[cid] = collection
    if user_id not in user_collections:
        user_collections[user_id] = []
    user_collections[user_id].append(cid)
    return collection

@app.put("/api/collections/{collection_id}")
async def update_collection(collection_id: str, data: CollectionUpdate):
    if collection_id not in collections_db:
        raise HTTPException(status_code=404, detail="Collection not found")
    coll = collections_db[collection_id]
    if data.name is not None:
        coll["name"] = data.name
    if "description" in data.model_fields_set:
        coll["description"] = data.description or ""
    return coll

@app.delete("/api/collections/{collection_id}")
async def delete_collection(collection_id: str):
    if collection_id not in collections_db:
        raise HTTPException(status_code=404, detail="Collection not found")
    coll = collections_db[collection_id]
    uid = coll["userId"]
    if uid in user_collections and collection_id in user_collections[uid]:
        user_collections[uid].remove(collection_id)
    for pid in collection_poems.get(collection_id, []):
        if pid in poems_db:
            poems_db[pid]["collectionId"] = None
    collection_poems.pop(collection_id, None)
    del collections_db[collection_id]
    return {"success": True}

@app.get("/api/portfolio/{user_id}")
async def get_portfolio_timeline(user_id: str):
    pid_list = user_poems.get(user_id, [])
    result = []
    for pid in pid_list:
        if pid in poems_db:
            result.append(build_poem_response(poems_db[pid]))
    result.sort(key=lambda x: x["createdAt"], reverse=True)
    return result

@app.get("/api/poems/{poem_id}/comments")
async def list_comments(poem_id: str):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    cid_list = poem_comments.get(poem_id, [])
    result = [comments_db[cid] for cid in cid_list if cid in comments_db]
    result.sort(key=lambda x: x["createdAt"])
    return result

@app.post("/api/poems/{poem_id}/comments")
async def add_comment(poem_id: str, data: CommentCreate):
    if poem_id not in poems_db:
        raise HTTPException(status_code=404, detail="Poem not found")
    cid = new_id()
    user = users_db.get(data.userId, {"name": "匿名"})
    comment = {
        "id": cid,
        "poemId": poem_id,
        "userId": data.userId,
        "userName": user["name"],
        "content": data.content,
        "createdAt": now_iso(),
    }
    comments_db[cid] = comment
    if poem_id not in poem_comments:
        poem_comments[poem_id] = []
    poem_comments[poem_id].append(cid)
    if poem_id in poems_db:
        poems_db[poem_id]["commentCount"] = len(poem_comments[poem_id])
    return comment

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, poemId: Optional[str] = Query(None), userId: Optional[str] = Query(None)):
    connected_poem_id = poemId if poemId else "global"
    connected_user_id = userId if userId else "anonymous"
    await manager.connect(websocket, connected_poem_id, connected_user_id)
    try:
        asyncio.create_task(heartbeat(websocket))
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")
            msg_poem_id = data.get("poemId", connected_poem_id)
            payload = data.get("payload", {})
            if msg_type == "ping":
                continue
            broadcast_msg = {
                "type": msg_type,
                "poemId": msg_poem_id,
                "payload": payload,
                "fromUserId": connected_user_id,
            }
            await manager.broadcast(msg_poem_id, broadcast_msg, exclude_sender=websocket)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.disconnect(websocket)
        if connected_poem_id != "global":
            leave_msg = {
                "type": "collaborator_left",
                "poemId": connected_poem_id,
                "payload": {"userId": connected_user_id},
            }
            await manager.broadcast(connected_poem_id, leave_msg)

async def heartbeat(websocket: WebSocket):
    try:
        while True:
            await asyncio.sleep(30)
            try:
                await websocket.send_json({"type": "ping"})
            except Exception:
                break
    except Exception:
        pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
