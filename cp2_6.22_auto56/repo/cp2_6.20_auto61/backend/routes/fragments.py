from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from ..database import get_db
from ..models import Fragment, Classification, User
from ..schemas import (
    FragmentResponse,
    FragmentDetailResponse,
    ClassifyRequest,
    ClassifyResponse
)
from .auth import get_current_user

router = APIRouter()


def init_mock_fragments(db: Session):
    existing = db.query(Fragment).count()
    if existing > 0:
        return

    mock_fragments = [
        Fragment(
            name="青铜鼎残片A",
            description="青铜鼎口沿残片，可见典型的饕餮纹纹饰，铸造工艺精良",
            era="商代",
            material="青铜",
            era_answer="商代晚期",
            material_answer="锡青铜",
            image_url="https://example.com/fragments/bronze_ding_1.jpg",
            location="河南安阳殷墟遗址",
            age_range="约公元前1300-1046年",
            condition="残损，约1/8口沿保存"
        ),
        Fragment(
            name="陶罐肩部碎片",
            description="泥质灰陶罐肩部残片，外表有绳纹装饰",
            era="新石器时代",
            material="陶",
            era_answer="仰韶文化晚期",
            material_answer="泥质灰陶",
            image_url="https://example.com/fragments/pottery_1.jpg",
            location="陕西西安半坡遗址",
            age_range="约公元前3500-3000年",
            condition="完整肩部残片"
        ),
        Fragment(
            name="青瓷碗底",
            description="越窑青瓷碗底足，釉色青中带黄，有细小开片",
            era="唐代",
            material="瓷",
            era_answer="唐代中期",
            material_answer="越窑青瓷",
            image_url="https://example.com/fragments/porcelain_1.jpg",
            location="浙江上林湖越窑遗址",
            age_range="约公元700-800年",
            condition="圈足完整"
        ),
        Fragment(
            name="玉璧残段",
            description="和田青玉璧残段，玉质温润，表面有谷纹",
            era="汉代",
            material="玉",
            era_answer="西汉早期",
            material_answer="和田青玉",
            image_url="https://example.com/fragments/jade_1.jpg",
            location="河北满城汉墓",
            age_range="约公元前200-100年",
            condition="约1/4璧"
        ),
        Fragment(
            name="石刻佛像残块",
            description="石灰岩雕刻佛像头部残块，可见发髻和耳垂",
            era="北魏",
            material="石",
            era_answer="北魏晚期",
            material_answer="石灰岩",
            image_url="https://example.com/fragments/stone_1.jpg",
            location="山西云冈石窟",
            age_range="约公元470-534年",
            condition="面部残损严重"
        ),
        Fragment(
            name="银簪残件",
            description="纯银发簪残件，簪头刻有缠枝花卉图案",
            era="宋代",
            material="银",
            era_answer="北宋晚期",
            material_answer="纯银",
            image_url="https://example.com/fragments/silver_1.jpg",
            location="河南开封宋代遗址",
            age_range="约公元1100-1127年",
            condition="簪身弯曲，簪头完整"
        ),
        Fragment(
            name="粉彩瓷盘碎片",
            description="景德镇粉彩瓷盘碎片，绘有牡丹蝴蝶图案",
            era="清代",
            material="瓷",
            era_answer="清雍正年间",
            material_answer="粉彩瓷",
            image_url="https://example.com/fragments/porcelain_2.jpg",
            location="江西景德镇御窑厂遗址",
            age_range="约公元1723-1735年",
            condition="不规则碎片"
        ),
        Fragment(
            name="陶俑残肢",
            description="红陶武士俑残左臂，手部呈握持兵器姿态",
            era="秦代",
            material="陶",
            era_answer="秦代",
            material_answer="红陶",
            image_url="https://example.com/fragments/terracotta_1.jpg",
            location="陕西临潼秦始皇陵",
            age_range="约公元前221-206年",
            condition="从臂部断裂"
        ),
        Fragment(
            name="漆器残片",
            description="木胎漆盒残片，黑漆底，描金云纹",
            era="战国",
            material="漆",
            era_answer="战国楚",
            material_answer="木胎漆器",
            image_url="https://example.com/fragments/lacquer_1.jpg",
            location="湖北江陵楚墓",
            age_range="约公元前400-221年",
            condition="漆皮部分脱落"
        ),
        Fragment(
            name="骨雕佩饰",
            description="兽骨雕刻的佩饰残件，刻有凤鸟纹",
            era="商代",
            material="骨",
            era_answer="商代中期",
            material_answer="牛骨",
            image_url="https://example.com/fragments/bone_1.jpg",
            location="河南郑州商城遗址",
            age_range="约公元前1500-1300年",
            condition="边缘残损"
        ),
        Fragment(
            name="青瓷莲花尊残片",
            description="青瓷莲花尊腹部残片，刻有浮雕莲瓣纹",
            era="南北朝",
            material="瓷",
            era_answer="南朝齐",
            material_answer="越窑青瓷",
            image_url="https://example.com/fragments/porcelain_3.jpg",
            location="江苏南京南朝墓葬",
            age_range="约公元479-502年",
            condition="大型碎片"
        ),
        Fragment(
            name="金箔饰片",
            description="锤揲金箔残片，饰有鱼子地纹",
            era="唐代",
            material="金",
            era_answer="唐代早期",
            material_answer="纯金",
            image_url="https://example.com/fragments/gold_1.jpg",
            location="陕西西安法门寺地宫",
            age_range="约公元650-700年",
            condition="卷曲变形"
        )
    ]
    db.add_all(mock_fragments)
    db.commit()


@router.on_event("startup")
def on_startup():
    db = next(get_db())
    init_mock_fragments(db)


@router.get("/fragments", response_model=List[FragmentResponse])
def get_fragments(
    era: Optional[str] = None,
    material: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Fragment)
    if era:
        query = query.filter(Fragment.era == era)
    if material:
        query = query.filter(Fragment.material == material)
    fragments = query.offset(skip).limit(limit).all()
    return fragments


@router.get("/fragments/random", response_model=List[FragmentResponse])
def get_random_fragments(
    count: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    fragments = db.query(Fragment).all()
    if not fragments:
        raise HTTPException(status_code=404, detail="未找到碎片数据")
    sample_count = min(count, len(fragments))
    return random.sample(fragments, sample_count)


@router.get("/fragments/{fragment_id}", response_model=FragmentDetailResponse)
def get_fragment(
    fragment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fragment = db.query(Fragment).filter(Fragment.id == fragment_id).first()
    if not fragment:
        raise HTTPException(status_code=404, detail="碎片不存在")
    return fragment


@router.post("/fragments/classify", response_model=ClassifyResponse)
def classify_fragment(
    classify_data: ClassifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    fragment = db.query(Fragment).filter(
        Fragment.id == classify_data.fragment_id
    ).first()
    if not fragment:
        raise HTTPException(status_code=404, detail="碎片不存在")

    if not fragment.era_answer or not fragment.material_answer:
        raise HTTPException(status_code=400, detail="该碎片尚未标注正确答案")

    era_correct = classify_data.era_prediction.strip() == fragment.era_answer.strip()
    material_correct = classify_data.material_prediction.strip() == fragment.material_answer.strip()
    overall_correct = era_correct and material_correct

    classification = Classification(
        fragment_id=classify_data.fragment_id,
        user_id=current_user.id,
        era_prediction=classify_data.era_prediction,
        material_prediction=classify_data.material_prediction,
        is_correct=overall_correct,
        confidence=1.0
    )
    db.add(classification)
    db.commit()

    return ClassifyResponse(
        fragment_id=classify_data.fragment_id,
        era_prediction=classify_data.era_prediction,
        material_prediction=classify_data.material_prediction,
        era_answer=fragment.era_answer,
        material_answer=fragment.material_answer,
        era_correct=era_correct,
        material_correct=material_correct,
        overall_correct=overall_correct
    )
