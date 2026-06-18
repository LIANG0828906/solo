from datetime import datetime
from typing import List, Optional, Dict, Any
import re
import io

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import sessionmaker, relationship, Session, declarative_base

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

SQLALCHEMY_DATABASE_URL = "sqlite:///./meeting_pulse.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    agenda = Column(String, nullable=False)
    attendees = Column(JSON, nullable=False)
    date_time = Column(DateTime, nullable=False)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    todos = relationship("Todo", back_populates="meeting", cascade="all, delete-orphan")


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="todo")
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="todos")


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    agenda: str = Field(..., min_length=1)
    attendees: List[str] = Field(..., min_items=1)
    date_time: datetime
    notes: Optional[str] = ""


class MeetingUpdateNotes(BaseModel):
    notes: str


class MeetingResponse(BaseModel):
    id: int
    title: str
    agenda: str
    attendees: List[str]
    date_time: datetime
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TodoResponse(BaseModel):
    id: int
    meeting_id: int
    description: str
    status: str
    order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TodoUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(todo|in-progress|done)$")
    order: Optional[int] = None


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


def parse_todos_from_notes(notes: str) -> List[str]:
    pattern = r'-\s*\[\s*\]\s*(.+)'
    matches = re.findall(pattern, notes)
    return [match.strip() for match in matches]


def generate_pdf(meeting: Meeting, todos: List[Todo]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=72)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=20,
        spaceAfter=20,
        textColor=colors.HexColor('#1e3a8a')
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        textColor=colors.HexColor('#1e40af')
    )
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.leading = 14

    story = []

    story.append(Paragraph(f"会议摘要: {meeting.title}", title_style))
    story.append(Spacer(1, 0.2 * inch))

    info_data = [
        ["日期时间:", meeting.date_time.strftime('%Y-%m-%d %H:%M:%S')],
        ["参与人:", ", ".join(meeting.attendees) if isinstance(meeting.attendees, list) else str(meeting.attendees)],
    ]
    info_table = Table(info_data, colWidths=[1.2 * inch, 4.5 * inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("议程", heading_style))
    story.append(Paragraph(meeting.agenda, normal_style))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("笔记摘要", heading_style))
    if meeting.notes:
        clean_notes = re.sub(r'-\s*\[\s*\]\s*.+', '', meeting.notes).strip()
        if clean_notes:
            story.append(Paragraph(clean_notes, normal_style))
        else:
            story.append(Paragraph("暂无笔记内容。", normal_style))
    else:
        story.append(Paragraph("暂无笔记内容。", normal_style))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("待办清单", heading_style))
    if todos:
        todo_data = [["#", "状态", "任务描述"]]
        for idx, todo in enumerate(todos, 1):
            status_map = {"todo": "待办", "in-progress": "进行中", "done": "已完成"}
            status_text = status_map.get(todo.status, todo.status)
            todo_data.append([str(idx), status_text, todo.description])

        todo_table = Table(todo_data, colWidths=[0.5 * inch, 1 * inch, 4.2 * inch])
        todo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor('#f3f4f6')]),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ]))
        story.append(todo_table)
    else:
        story.append(Paragraph("暂无待办事项。", normal_style))

    story.append(Spacer(1, 0.5 * inch))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Italic'],
        fontSize=9,
        textColor=colors.grey,
        alignment=1
    )
    story.append(Paragraph(f"生成于 {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer


app = FastAPI(title="会议脉冲 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/meetings", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(meeting_data: MeetingCreate, db: Session = Depends(get_db)):
    try:
        db_meeting = Meeting(
            title=meeting_data.title,
            agenda=meeting_data.agenda,
            attendees=meeting_data.attendees,
            date_time=meeting_data.date_time,
            notes=meeting_data.notes
        )
        db.add(db_meeting)
        db.commit()
        db.refresh(db_meeting)

        if meeting_data.notes:
            todo_descriptions = parse_todos_from_notes(meeting_data.notes)
            for idx, desc in enumerate(todo_descriptions):
                db_todo = Todo(
                    meeting_id=db_meeting.id,
                    description=desc,
                    order=idx
                )
                db.add(db_todo)
            if todo_descriptions:
                db.commit()
                db.refresh(db_meeting)

        return ApiResponse(
            success=True,
            message="会议创建成功",
            data=MeetingResponse.model_validate(db_meeting)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建会议失败: {str(e)}"
        )


@app.get("/api/meetings", response_model=ApiResponse)
def get_meetings(db: Session = Depends(get_db)):
    try:
        meetings = db.query(Meeting).order_by(Meeting.created_at.desc()).all()
        return ApiResponse(
            success=True,
            message="获取会议列表成功",
            data=[MeetingResponse.model_validate(m) for m in meetings]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取会议列表失败: {str(e)}"
        )


@app.get("/api/meetings/{meeting_id}", response_model=ApiResponse)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="会议不存在"
            )
        return ApiResponse(
            success=True,
            message="获取会议详情成功",
            data=MeetingResponse.model_validate(meeting)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取会议详情失败: {str(e)}"
        )


@app.put("/api/meetings/{meeting_id}/notes", response_model=ApiResponse)
def update_meeting_notes(meeting_id: int, notes_data: MeetingUpdateNotes, db: Session = Depends(get_db)):
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="会议不存在"
            )

        meeting.notes = notes_data.notes
        meeting.updated_at = datetime.utcnow()

        new_todos = parse_todos_from_notes(notes_data.notes)
        existing_todos = db.query(Todo).filter(Todo.meeting_id == meeting_id).all()
        existing_descriptions = {t.description: t for t in existing_todos}

        for idx, desc in enumerate(new_todos):
            if desc in existing_descriptions:
                todo = existing_descriptions[desc]
                todo.order = idx
            else:
                db_todo = Todo(
                    meeting_id=meeting_id,
                    description=desc,
                    order=idx
                )
                db.add(db_todo)

        db.commit()
        db.refresh(meeting)

        updated_todos = db.query(Todo).filter(Todo.meeting_id == meeting_id).order_by(Todo.order).all()

        return ApiResponse(
            success=True,
            message="会议笔记更新成功",
            data={
                "meeting": MeetingResponse.model_validate(meeting),
                "todos": [TodoResponse.model_validate(t) for t in updated_todos]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新会议笔记失败: {str(e)}"
        )


@app.get("/api/meetings/{meeting_id}/pdf")
def get_meeting_pdf(meeting_id: int, db: Session = Depends(get_db)):
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="会议不存在"
            )

        todos = db.query(Todo).filter(Todo.meeting_id == meeting_id).order_by(Todo.order).all()
        pdf_buffer = generate_pdf(meeting, todos)

        filename = f"meeting_{meeting_id}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成PDF失败: {str(e)}"
        )


@app.get("/api/todos", response_model=ApiResponse)
def get_all_todos(db: Session = Depends(get_db)):
    try:
        todos = db.query(Todo).order_by(Todo.created_at.desc()).all()
        return ApiResponse(
            success=True,
            message="获取所有待办成功",
            data=[TodoResponse.model_validate(t) for t in todos]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取待办列表失败: {str(e)}"
        )


@app.get("/api/meetings/{meeting_id}/todos", response_model=ApiResponse)
def get_meeting_todos(meeting_id: int, db: Session = Depends(get_db)):
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="会议不存在"
            )

        todos = db.query(Todo).filter(Todo.meeting_id == meeting_id).order_by(Todo.order).all()
        return ApiResponse(
            success=True,
            message="获取会议待办成功",
            data=[TodoResponse.model_validate(t) for t in todos]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取会议待办失败: {str(e)}"
        )


@app.put("/api/todos/{todo_id}", response_model=ApiResponse)
def update_todo(todo_id: int, todo_data: TodoUpdate, db: Session = Depends(get_db)):
    try:
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="待办不存在"
            )

        if todo_data.status is not None:
            todo.status = todo_data.status
        if todo_data.order is not None:
            todo.order = todo_data.order

        todo.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(todo)

        return ApiResponse(
            success=True,
            message="待办更新成功",
            data=TodoResponse.model_validate(todo)
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新待办失败: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
