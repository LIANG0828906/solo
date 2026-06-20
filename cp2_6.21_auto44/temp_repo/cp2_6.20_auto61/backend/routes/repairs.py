from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import RepairRecord, RepairStep, User, Fragment
from ..schemas import (
    RepairRecordCreate,
    RepairRecordResponse,
    RepairStepAdd,
    RepairStepResponse,
    KnowledgeGraphResponse,
    KnowledgeNode,
    KnowledgeEdge
)
from .auth import get_current_user

router = APIRouter()


def init_mock_repairs(db: Session):
    existing = db.query(RepairRecord).count()
    if existing > 0:
        return

    mock_records = [
        RepairRecord(
            title="青铜鼎残片除锈修复",
            description="对商代青铜鼎残片进行化学除锈处理，并做防氧化封护",
            fragment_id=1,
            user_id=1,
            status="completed",
            is_submitted=True
        ),
        RepairRecord(
            title="唐代青瓷碗底拼合修复",
            description="将多块青瓷碗碎片进行拼合粘接，填补缺失部分",
            fragment_id=3,
            user_id=2,
            status="in_progress",
            is_submitted=False
        ),
        RepairRecord(
            title="汉代玉璧残段补全",
            description="使用仿玉材料对玉璧残段进行补全，并做随色处理",
            fragment_id=4,
            user_id=3,
            status="draft",
            is_submitted=False
        )
    ]
    db.add_all(mock_records)
    db.flush()

    mock_steps = [
        RepairStep(
            record_id=1,
            step_order=1,
            description="使用软毛刷和去离子水进行表面清洁，去除浮尘",
            tool_used="软毛刷, 去离子水",
            duration_minutes=30,
            notes="注意避开纹饰凹陷处",
            image_url="https://example.com/steps/bronze_1.jpg"
        ),
        RepairStep(
            record_id=1,
            step_order=2,
            description="使用5%柠檬酸溶液湿敷，去除表面锈蚀层",
            tool_used="柠檬酸溶液, 脱脂棉",
            duration_minutes=60,
            notes="湿敷时间不超过20分钟，重复3次",
            image_url="https://example.com/steps/bronze_2.jpg"
        ),
        RepairStep(
            record_id=1,
            step_order=3,
            description="使用B72丙烯酸树脂进行封护处理，喷涂2遍",
            tool_used="B72树脂, 喷枪",
            duration_minutes=45,
            notes="在通风环境下操作，每遍间隔30分钟",
            image_url="https://example.com/steps/bronze_3.jpg"
        ),
        RepairStep(
            record_id=2,
            step_order=1,
            description="对碎片进行清洗，去除泥土和旧粘接剂",
            tool_used="超声波清洗机, 丙酮",
            duration_minutes=40,
            notes="超声波清洗功率不超过50W",
            image_url="https://example.com/steps/porcelain_1.jpg"
        ),
        RepairStep(
            record_id=2,
            step_order=2,
            description="在纸模上进行预拼合，确定碎片位置关系",
            tool_used="纸模, 胶带",
            duration_minutes=90,
            notes="拍照记录拼合顺序",
            image_url="https://example.com/steps/porcelain_2.jpg"
        )
    ]
    db.add_all(mock_steps)
    db.commit()


@router.on_event("startup")
def on_startup():
    db = next(get_db())
    init_mock_repairs(db)


@router.post("/repairs", response_model=RepairRecordResponse)
def create_repair(
    repair_data: RepairRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if repair_data.fragment_id:
        fragment = db.query(Fragment).filter(
            Fragment.id == repair_data.fragment_id
        ).first()
        if not fragment:
            raise HTTPException(status_code=404, detail="关联的碎片不存在")

    new_record = RepairRecord(
        title=repair_data.title,
        description=repair_data.description,
        fragment_id=repair_data.fragment_id,
        user_id=current_user.id,
        status="draft",
        is_submitted=False
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.get("/repairs", response_model=List[RepairRecordResponse])
def get_repairs(
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    is_submitted: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RepairRecord)
    if user_id:
        query = query.filter(RepairRecord.user_id == user_id)
    if status:
        query = query.filter(RepairRecord.status == status)
    if is_submitted is not None:
        query = query.filter(RepairRecord.is_submitted == is_submitted)
    records = query.order_by(RepairRecord.created_at.desc()).offset(skip).limit(limit).all()
    return records


@router.get("/repairs/{record_id}", response_model=RepairRecordResponse)
def get_repair(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(RepairRecord).filter(RepairRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="修复记录不存在")
    return record


@router.put("/repairs/{record_id}/steps", response_model=RepairStepResponse)
def add_repair_step(
    record_id: int,
    step_data: RepairStepAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(RepairRecord).filter(RepairRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="修复记录不存在")

    if record.user_id != current_user.id and not current_user.is_expert:
        raise HTTPException(status_code=403, detail="无权限修改此修复记录")

    if record.is_submitted:
        raise HTTPException(status_code=400, detail="已提交的修复记录无法修改")

    max_order = db.query(RepairStep).filter(
        RepairStep.record_id == record_id
    ).count()
    new_step = RepairStep(
        record_id=record_id,
        step_order=max_order + 1,
        description=step_data.description,
        tool_used=step_data.tool_used,
        duration_minutes=step_data.duration_minutes,
        notes=step_data.notes,
        image_url=step_data.image_url
    )
    db.add(new_step)
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(new_step)
    return new_step


@router.get("/repairs/knowledge-graph", response_model=KnowledgeGraphResponse)
def get_knowledge_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    nodes = [
        KnowledgeNode(
            id="age_bronze",
            label="青铜器修复",
            type="category",
            description="青铜器类文物的修复技术与方法"
        ),
        KnowledgeNode(
            id="age_pottery",
            label="陶器修复",
            type="category",
            description="陶器类文物的修复技术与方法"
        ),
        KnowledgeNode(
            id="age_porcelain",
            label="瓷器修复",
            type="category",
            description="瓷器类文物的修复技术与方法"
        ),
        KnowledgeNode(
            id="age_jade",
            label="玉器修复",
            type="category",
            description="玉器类文物的修复技术与方法"
        ),
        KnowledgeNode(
            id="method_cleaning",
            label="清洁处理",
            type="method",
            description="文物表面浮尘、污物的清理方法"
        ),
        KnowledgeNode(
            id="method_derusting",
            label="除锈处理",
            type="method",
            description="金属文物锈蚀层的去除方法"
        ),
        KnowledgeNode(
            id="method_rejoining",
            label="拼合粘接",
            type="method",
            description="碎片拼合与粘接技术"
        ),
        KnowledgeNode(
            id="method_filling",
            label="补全修复",
            type="method",
            description="缺失部分的材料补全方法"
        ),
        KnowledgeNode(
            id="method_sealing",
            label="封护处理",
            type="method",
            description="修复后的防氧化、防腐蚀处理"
        ),
        KnowledgeNode(
            id="tool_brush",
            label="软毛刷",
            type="tool",
            description="用于表面清洁的毛刷工具"
        ),
        KnowledgeNode(
            id="tool_ultrasonic",
            label="超声波清洗机",
            type="tool",
            description="利用超声波震动进行深度清洗"
        ),
        KnowledgeNode(
            id="tool_b72",
            label="B72树脂",
            type="material",
            description="常用的文物封护用丙烯酸树脂"
        ),
        KnowledgeNode(
            id="tool_citric",
            label="柠檬酸溶液",
            type="material",
            description="温和的金属除锈化学试剂"
        ),
        KnowledgeNode(
            id="tool_epoxy",
            label="环氧树脂",
            type="material",
            description="文物粘接与补全常用材料"
        )
    ]

    edges = [
        KnowledgeEdge(source="age_bronze", target="method_cleaning", relation="包含步骤"),
        KnowledgeEdge(source="age_bronze", target="method_derusting", relation="包含步骤"),
        KnowledgeEdge(source="age_bronze", target="method_sealing", relation="包含步骤"),
        KnowledgeEdge(source="age_pottery", target="method_cleaning", relation="包含步骤"),
        KnowledgeEdge(source="age_pottery", target="method_rejoining", relation="包含步骤"),
        KnowledgeEdge(source="age_pottery", target="method_filling", relation="包含步骤"),
        KnowledgeEdge(source="age_porcelain", target="method_cleaning", relation="包含步骤"),
        KnowledgeEdge(source="age_porcelain", target="method_rejoining", relation="包含步骤"),
        KnowledgeEdge(source="age_porcelain", target="method_filling", relation="包含步骤"),
        KnowledgeEdge(source="age_jade", target="method_cleaning", relation="包含步骤"),
        KnowledgeEdge(source="age_jade", target="method_filling", relation="包含步骤"),
        KnowledgeEdge(source="method_cleaning", target="tool_brush", relation="使用工具"),
        KnowledgeEdge(source="method_cleaning", target="tool_ultrasonic", relation="使用工具"),
        KnowledgeEdge(source="method_derusting", target="tool_citric", relation="使用材料"),
        KnowledgeEdge(source="method_rejoining", target="tool_epoxy", relation="使用材料"),
        KnowledgeEdge(source="method_filling", target="tool_epoxy", relation="使用材料"),
        KnowledgeEdge(source="method_sealing", target="tool_b72", relation="使用材料")
    ]

    return KnowledgeGraphResponse(nodes=nodes, edges=edges)


@router.post("/repairs/{record_id}/submit", response_model=RepairRecordResponse)
def submit_repair(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(RepairRecord).filter(RepairRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="修复记录不存在")

    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权限提交此修复记录")

    if record.is_submitted:
        raise HTTPException(status_code=400, detail="修复记录已提交")

    steps_count = db.query(RepairStep).filter(
        RepairStep.record_id == record_id
    ).count()
    if steps_count == 0:
        raise HTTPException(status_code=400, detail="修复记录未包含任何步骤，无法提交")

    record.is_submitted = True
    record.status = "submitted"
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return record
