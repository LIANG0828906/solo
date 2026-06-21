import json
import os
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
import models
import schemas
from auth import hash_password, verify_password, create_access_token, get_current_user, get_current_user_required

router = APIRouter()

MAX_SNAPSHOTS = 100
MAX_FILE_SIZE = 10 * 1024 * 1024


def create_snapshot(db: Session, doc_id: int):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        return

    annotations = db.query(models.Annotation).filter(models.Annotation.doc_id == doc_id).all()
    annotations_list = [
        {
            "id": ann.id,
            "doc_id": ann.doc_id,
            "user_id": ann.user_id,
            "user_name": ann.user_name,
            "paragraph_index": ann.paragraph_index,
            "color": ann.color,
            "text": ann.text,
            "created_at": ann.created_at.isoformat() if ann.created_at else None,
        }
        for ann in annotations
    ]

    last_snapshot = (
        db.query(models.Snapshot)
        .filter(models.Snapshot.doc_id == doc_id)
        .order_by(desc(models.Snapshot.version))
        .first()
    )
    next_version = (last_snapshot.version + 1) if last_snapshot else 1

    snapshot = models.Snapshot(
        doc_id=doc_id,
        content=doc.content,
        annotations_json=json.dumps(annotations_list, ensure_ascii=False),
        version=next_version,
    )
    db.add(snapshot)
    db.commit()

    all_snapshots = (
        db.query(models.Snapshot)
        .filter(models.Snapshot.doc_id == doc_id)
        .order_by(desc(models.Snapshot.version))
        .all()
    )
    if len(all_snapshots) > MAX_SNAPSHOTS:
        for old_snapshot in all_snapshots[MAX_SNAPSHOTS:]:
            db.delete(old_snapshot)
        db.commit()


def init_sample_data(db: Session):
    existing_docs = db.query(models.Document).filter(models.Document.user_id.is_(None)).all()
    if existing_docs:
        return

    sample_doc = models.Document(
        title="示例公开文档 - 欢迎使用文档批注系统",
        content="""# 欢迎使用文档批注系统

这是一个支持多人实时协作的文档批注平台。您可以：

- 上传或创建文档
- 对文档段落进行批注
- 与其他用户实时协作
- 查看历史版本快照

## 功能特点

### 1. 文档管理
您可以创建、编辑和删除文档，支持 Markdown 和纯文本格式。

### 2. 批注功能
选中任意段落，添加您的批注。支持多种颜色标记，方便区分不同类型的批注。

### 3. 实时协作
通过 WebSocket 技术，所有在线用户可以实时看到彼此的批注更新。

### 4. 版本快照
每次文档或批注发生变更时，系统会自动创建快照。您可以随时查看和回滚到历史版本。

---

开始使用吧！注册一个账号，或者直接浏览公开文档体验批注功能。""",
        user_id=None,
    )
    db.add(sample_doc)
    db.commit()
    db.refresh(sample_doc)

    sample_annotation1 = models.Annotation(
        doc_id=sample_doc.id,
        user_id=None,
        user_name="系统演示",
        paragraph_index=2,
        color="#ffff00",
        text="这是一个示例批注，展示批注的显示效果。",
    )
    sample_annotation2 = models.Annotation(
        doc_id=sample_doc.id,
        user_id=None,
        user_name="系统演示",
        paragraph_index=5,
        color="#90EE90",
        text="批注支持多种颜色，便于分类管理。",
    )
    db.add(sample_annotation1)
    db.add(sample_annotation2)
    db.commit()

    create_snapshot(db, sample_doc.id)


@router.on_event("startup")
def startup_event():
    from database import engine, Base
    Base.metadata.create_all(bind=engine)

    db = next(get_db())
    init_sample_data(db)


@router.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被注册",
        )

    hashed_password = hash_password(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user_required)):
    return current_user


@router.post("/documents", response_model=schemas.DocumentResponse)
def create_document(
    doc: schemas.DocumentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    user_id = current_user.id if current_user else None

    db_doc = models.Document(
        title=doc.title,
        content=doc.content,
        user_id=user_id,
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    create_snapshot(db, db_doc.id)

    return db_doc


@router.get("/documents/{doc_id}", response_model=schemas.DocumentResponse)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    return doc


@router.put("/documents/{doc_id}", response_model=schemas.DocumentResponse)
def update_document(
    doc_id: int,
    doc_update: schemas.DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    if doc.user_id is not None:
        if current_user is None or current_user.id != doc.user_id:
            raise HTTPException(status_code=403, detail="无权限修改此文档")

    if doc_update.title is not None:
        doc.title = doc_update.title
    if doc_update.content is not None:
        doc.content = doc_update.content

    doc.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    create_snapshot(db, doc_id)

    return doc


@router.get("/documents", response_model=List[schemas.DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    query = db.query(models.Document)
    if current_user:
        query = query.filter(
            (models.Document.user_id == current_user.id) | (models.Document.user_id.is_(None))
        )
    else:
        query = query.filter(models.Document.user_id.is_(None))

    docs = query.order_by(desc(models.Document.updated_at)).all()
    return docs


@router.post("/documents/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="请上传文件")

    allowed_extensions = {".md", ".txt"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="仅支持 .md 和 .txt 格式的文件")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 10MB")

    try:
        content_str = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = content.decode("gbk")
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="文件编码不支持，请使用 UTF-8 或 GBK 编码")

    title = os.path.splitext(file.filename)[0]
    user_id = current_user.id if current_user else None

    db_doc = models.Document(
        title=title,
        content=content_str,
        user_id=user_id,
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    create_snapshot(db, db_doc.id)

    return db_doc


@router.post("/documents/{doc_id}/annotations", response_model=schemas.AnnotationResponse)
def create_annotation(
    doc_id: int,
    annotation: schemas.AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    user_name = current_user.email if current_user else "匿名用户"
    user_id = current_user.id if current_user else None

    db_annotation = models.Annotation(
        doc_id=doc_id,
        user_id=user_id,
        user_name=user_name,
        paragraph_index=annotation.paragraph_index,
        color=annotation.color,
        text=annotation.text,
    )
    db.add(db_annotation)
    db.commit()
    db.refresh(db_annotation)

    create_snapshot(db, doc_id)

    return db_annotation


@router.get("/documents/{doc_id}/annotations", response_model=List[schemas.AnnotationResponse])
def get_annotations(
    doc_id: int,
    db: Session = Depends(get_db),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    annotations = (
        db.query(models.Annotation)
        .filter(models.Annotation.doc_id == doc_id)
        .order_by(models.Annotation.created_at)
        .all()
    )
    return annotations


@router.delete("/annotations/{annotation_id}")
def delete_annotation(
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    annotation = db.query(models.Annotation).filter(models.Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="批注不存在")

    if annotation.user_id is not None:
        if current_user is None or current_user.id != annotation.user_id:
            raise HTTPException(status_code=403, detail="无权限删除此批注")

    doc_id = annotation.doc_id
    db.delete(annotation)
    db.commit()

    create_snapshot(db, doc_id)

    return {"message": "删除成功"}


@router.get("/documents/{doc_id}/snapshots", response_model=List[schemas.SnapshotResponse])
def get_snapshots(
    doc_id: int,
    db: Session = Depends(get_db),
):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")

    snapshots = (
        db.query(models.Snapshot)
        .filter(models.Snapshot.doc_id == doc_id)
        .order_by(desc(models.Snapshot.version))
        .limit(10)
        .all()
    )
    return snapshots


@router.get("/documents/{doc_id}/snapshots/{snapshot_id}")
def get_snapshot_detail(
    doc_id: int,
    snapshot_id: int,
    db: Session = Depends(get_db),
):
    snapshot = (
        db.query(models.Snapshot)
        .filter(models.Snapshot.id == snapshot_id, models.Snapshot.doc_id == doc_id)
        .first()
    )
    if not snapshot:
        raise HTTPException(status_code=404, detail="快照不存在")

    return {
        "id": snapshot.id,
        "doc_id": snapshot.doc_id,
        "content": snapshot.content,
        "annotations": json.loads(snapshot.annotations_json),
        "version": snapshot.version,
        "created_at": snapshot.created_at,
    }
