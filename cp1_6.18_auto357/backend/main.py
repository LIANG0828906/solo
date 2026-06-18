from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
import json
from datetime import datetime

from models import get_db, User, Work, Comment, Like
from image_processor import process_uploaded_image, replace_clothing_color

app = FastAPI(title="光阴缝纫铺 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


def get_or_create_default_user(db: Session) -> User:
    user = db.query(User).filter(User.username == "guest_user").first()
    if not user:
        user = User(username="guest_user", avatar_url=None)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@app.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    size: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename or "image.png")[1].lower()
        if file_ext not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            file_ext = '.png'
        
        original_filename = f"{file_id}_original{file_ext}"
        original_path = os.path.join(UPLOAD_DIR, original_filename)
        
        content = await file.read()
        result = process_uploaded_image(content, original_path)
        
        if not result['success']:
            raise HTTPException(status_code=500, detail="Failed to process image")
        
        size_data = None
        if size:
            try:
                size_data = json.loads(size)
            except json.JSONDecodeError:
                pass
        
        return {
            "id": file_id,
            "imageUrl": f"/uploads/{original_filename}",
            "dominantColor": result['dominant_color'],
            "width": result['width'],
            "height": result['height'],
            "size": size_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/color-replace")
async def replace_color(
    imageId: str = Form(...),
    targetColor: str = Form(...),
    db: Session = Depends(get_db)
):
    try:
        original_file = None
        for ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            candidate = os.path.join(UPLOAD_DIR, f"{imageId}_original{ext}")
            if os.path.exists(candidate):
                original_file = candidate
                break
        
        if not original_file:
            raise HTTPException(status_code=404, detail="Image not found")
        
        color_clean = targetColor.lstrip('#')
        output_filename = f"{imageId}_{color_clean}.png"
        output_path = os.path.join(UPLOAD_DIR, output_filename)
        
        success = replace_clothing_color(
            original_file,
            targetColor,
            output_path
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to replace color")
        
        return {
            "imageUrl": f"/uploads/{output_filename}",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/works")
async def get_works(
    style: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Work)
    
    if style and style != "all":
        query = query.filter(Work.style == style)
    
    total = query.count()
    works = query.order_by(Work.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for work in works:
        user = db.query(User).filter(User.id == work.user_id).first()
        comments = db.query(Comment).filter(Comment.work_id == work.id).order_by(Comment.created_at.desc()).all()
        
        comments_list = []
        for comment in comments:
            comment_user = db.query(User).filter(User.id == comment.user_id).first()
            comments_list.append({
                "id": comment.id,
                "userId": comment.user_id,
                "username": comment_user.username if comment_user else "Unknown",
                "content": comment.content,
                "createdAt": comment.created_at.isoformat()
            })
        
        try:
            design_params = json.loads(work.design_params)
        except (json.JSONDecodeError, TypeError):
            design_params = {"sleeveLength": 50, "clothingLength": 50, "waistFit": 50}
        
        result.append({
            "id": work.id,
            "userId": work.user_id,
            "username": user.username if user else "Unknown",
            "clothingImage": work.clothing_image_url,
            "designParams": design_params,
            "style": work.style,
            "likes": work.likes_count,
            "comments": comments_list,
            "createdAt": work.created_at.isoformat()
        })
    
    return {"works": result, "total": total}


@app.post("/api/works")
async def create_work(
    clothingImage: str = Form(...),
    designParams: str = Form(...),
    style: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_or_create_default_user(db)
    
    try:
        params = json.loads(designParams)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid design parameters")
    
    work = Work(
        user_id=user.id,
        clothing_image_url=clothingImage,
        design_params=designParams,
        style=style
    )
    
    db.add(work)
    db.commit()
    db.refresh(work)
    
    return {
        "id": work.id,
        "userId": work.user_id,
        "clothingImage": work.clothing_image_url,
        "designParams": params,
        "style": work.style,
        "likes": work.likes_count,
        "createdAt": work.created_at.isoformat()
    }


@app.post("/api/works/{work_id}/like")
async def like_work(work_id: str, db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    user = get_or_create_default_user(db)
    
    existing_like = db.query(Like).filter(
        Like.work_id == work_id,
        Like.user_id == user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        work.likes_count = max(0, work.likes_count - 1)
    else:
        like = Like(work_id=work_id, user_id=user.id)
        db.add(like)
        work.likes_count += 1
    
    db.commit()
    return {"likes": work.likes_count, "liked": existing_like is None}


@app.post("/api/works/{work_id}/comments")
async def add_comment(
    work_id: str,
    content: str = Form(...),
    db: Session = Depends(get_db)
):
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    user = get_or_create_default_user(db)
    
    comment = Comment(
        work_id=work_id,
        user_id=user.id,
        content=content
    )
    
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return {
        "comment": {
            "id": comment.id,
            "userId": comment.user_id,
            "username": user.username,
            "content": comment.content,
            "createdAt": comment.created_at.isoformat()
        }
    }


@app.get("/api/works/{work_id}")
async def get_work(work_id: str, db: Session = Depends(get_db)):
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(status_code=404, detail="Work not found")
    
    user = db.query(User).filter(User.id == work.user_id).first()
    comments = db.query(Comment).filter(Comment.work_id == work_id).order_by(Comment.created_at.desc()).all()
    
    comments_list = []
    for comment in comments:
        comment_user = db.query(User).filter(User.id == comment.user_id).first()
        comments_list.append({
            "id": comment.id,
            "userId": comment.user_id,
            "username": comment_user.username if comment_user else "Unknown",
            "content": comment.content,
            "createdAt": comment.created_at.isoformat()
        })
    
    try:
        design_params = json.loads(work.design_params)
    except (json.JSONDecodeError, TypeError):
        design_params = {"sleeveLength": 50, "clothingLength": 50, "waistFit": 50}
    
    return {
        "id": work.id,
        "userId": work.user_id,
        "username": user.username if user else "Unknown",
        "clothingImage": work.clothing_image_url,
        "designParams": design_params,
        "style": work.style,
        "likes": work.likes_count,
        "comments": comments_list,
        "createdAt": work.created_at.isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
