from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import json

from database import engine, Base, get_db
from models import Card

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CardCreate(BaseModel):
    title: str
    content: str
    image: Optional[str] = None
    tags: List[str]
    category: str
    relatedCards: List[int] = []


class CardUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    relatedCards: Optional[List[int]] = None


class CardResponse(BaseModel):
    id: int
    title: str
    content: str
    image: Optional[str]
    tags: List[str]
    category: str
    relatedCards: List[int]
    createdAt: str
    updatedAt: str

    class Config:
        orm_mode = True


def card_to_response(card: Card) -> CardResponse:
    tags = card.tags if isinstance(card.tags, list) else json.loads(card.tags)
    related_cards = card.related_cards if isinstance(card.related_cards, list) else json.loads(card.related_cards)
    return CardResponse(
        id=card.id,
        title=card.title,
        content=card.content,
        image=card.image,
        tags=tags,
        category=card.category,
        relatedCards=related_cards,
        createdAt=card.created_at.isoformat() if card.created_at else "",
        updatedAt=card.updated_at.isoformat() if card.updated_at else "",
    )


def init_test_data(db: Session):
    if db.query(Card).count() == 0:
        test_cards = [
            Card(
                title="React 基础",
                content="React 是一个用于构建用户界面的 JavaScript 库。它采用组件化的开发方式，通过虚拟DOM实现高效的页面更新，是目前最流行的前端框架之一。",
                image="https://picsum.photos/400/300?random=1",
                tags=json.dumps(["React", "前端", "JavaScript"]),
                category="tech",
                related_cards=json.dumps([2, 3]),
            ),
            Card(
                title="TypeScript 入门",
                content="TypeScript 是 JavaScript 的超集，添加了类型系统。它可以在编译时捕获错误，提高代码的可维护性和开发效率，是大型项目的首选。",
                image="https://picsum.photos/400/300?random=2",
                tags=json.dumps(["TypeScript", "前端"]),
                category="tech",
                related_cards=json.dumps([1]),
            ),
            Card(
                title="Vite 构建工具",
                content="Vite 是下一代前端构建工具，利用浏览器原生 ES 模块支持，提供极速的冷启动和热更新，显著提升开发体验。",
                image="https://picsum.photos/400/300?random=3",
                tags=json.dumps(["Vite", "构建工具", "前端"]),
                category="tech",
                related_cards=json.dumps([1, 2]),
            ),
            Card(
                title="读书笔记：原则",
                content="《原则》一书分享了桥水基金创始人瑞·达利欧的生活和工作原则。核心观点包括：面对现实、拥抱痛苦、保持极度开放的头脑。",
                image="https://picsum.photos/400/300?random=4",
                tags=json.dumps(["读书", "原则", "思考"]),
                category="life",
                related_cards=json.dumps([5]),
            ),
            Card(
                title="时间管理方法",
                content="番茄工作法：25分钟专注+5分钟休息。GTD方法：收集、整理、组织、回顾、执行。合理运用这些方法可以大幅提升效率。",
                image="https://picsum.photos/400/300?random=5",
                tags=json.dumps(["时间管理", "效率", "生活"]),
                category="life",
                related_cards=json.dumps([4]),
            ),
            Card(
                title="学习方法论",
                content="费曼学习法：选择一个概念，尝试教给别人，发现知识缺口，回顾并简化。间隔重复：在遗忘临界点复习，最大化记忆效果。",
                image="https://picsum.photos/400/300?random=6",
                tags=json.dumps(["学习", "方法", "教育"]),
                category="study",
                related_cards=json.dumps([7]),
            ),
            Card(
                title="英语学习技巧",
                content="背单词：使用Anki进行间隔重复。练口语：影子跟读法模仿 native speaker。听力：听播客并做听写练习。坚持是关键。",
                image="https://picsum.photos/400/300?random=7",
                tags=json.dumps(["英语", "语言学习"]),
                category="study",
                related_cards=json.dumps([6]),
            ),
        ]
        db.add_all(test_cards)
        db.commit()


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    init_test_data(db)
    db.close()


@app.get("/api/cards", response_model=List[CardResponse])
def get_cards(skip: int = 0, limit: int = 100, category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Card)
    if category:
        query = query.filter(Card.category == category)
    cards = query.offset(skip).limit(limit).all()
    return [card_to_response(card) for card in cards]


@app.get("/api/cards/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card_to_response(card)


@app.post("/api/cards", response_model=CardResponse)
def create_card(card: CardCreate, db: Session = Depends(get_db)):
    db_card = Card(
        title=card.title,
        content=card.content,
        image=card.image,
        tags=json.dumps(card.tags),
        category=card.category,
        related_cards=json.dumps(card.relatedCards),
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return card_to_response(db_card)


@app.put("/api/cards/{card_id}", response_model=CardResponse)
def update_card(card_id: int, card: CardUpdate, db: Session = Depends(get_db)):
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.title is not None:
        db_card.title = card.title
    if card.content is not None:
        db_card.content = card.content
    if card.image is not None:
        db_card.image = card.image
    if card.tags is not None:
        db_card.tags = json.dumps(card.tags)
    if card.category is not None:
        db_card.category = card.category
    if card.relatedCards is not None:
        db_card.related_cards = json.dumps(card.relatedCards)
    
    db.commit()
    db.refresh(db_card)
    return card_to_response(db_card)


@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(Card).filter(Card.id == card_id).first()
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(db_card)
    db.commit()
    return {"success": True}


@app.get("/api/cards/tag/{tag}", response_model=List[CardResponse])
def get_cards_by_tag(tag: str, db: Session = Depends(get_db)):
    cards = db.query(Card).all()
    result = []
    for card in cards:
        tags = card.tags if isinstance(card.tags, list) else json.loads(card.tags)
        if tag in tags:
            result.append(card_to_response(card))
    return result


@app.get("/api/graph")
def get_knowledge_graph(db: Session = Depends(get_db)):
    cards = db.query(Card).all()
    
    nodes = []
    links = []
    
    node_links_count: Dict[int, int] = {}
    
    for card in cards:
        card_id = card.id
        related_cards = card.related_cards if isinstance(card.related_cards, list) else json.loads(card.related_cards)
        
        if card_id not in node_links_count:
            node_links_count[card_id] = 0
        node_links_count[card_id] += len(related_cards)
        
        for related_id in related_cards:
            links.append({"source": card_id, "target": related_id, "value": 1})
            if related_id not in node_links_count:
                node_links_count[related_id] = 0
            node_links_count[related_id] += 1
    
    for card in cards:
        nodes.append({
            "id": card.id,
            "title": card.title,
            "category": card.category,
            "connections": node_links_count.get(card.id, 0),
        })
    
    return {"nodes": nodes, "links": links}


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Card.category).distinct().all()
    return {"categories": [cat[0] for cat in categories]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
