from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import io
import os
from jinja2 import Environment, FileSystemLoader
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))

in_memory_storage = {}


class PersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    avatar: str = ""
    summary: str = ""


class Education(BaseModel):
    id: str
    school: str = ""
    degree: str = ""
    major: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""


class WorkExperience(BaseModel):
    id: str
    company: str = ""
    position: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""


class Skill(BaseModel):
    id: str
    name: str = ""
    level: int = 70


class Project(BaseModel):
    id: str
    name: str = ""
    role: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""
    technologies: List[str] = []


class CustomSection(BaseModel):
    id: str
    title: str = ""
    content: str = ""


class ResumeModule(BaseModel):
    id: str
    type: str
    title: str
    visible: bool = True


class ResumeData(BaseModel):
    id: Optional[str] = None
    templateId: str = "blue-business"
    modules: List[ResumeModule] = []
    personalInfo: PersonalInfo
    education: List[Education] = []
    workExperience: List[WorkExperience] = []
    skills: List[Skill] = []
    projects: List[Project] = []
    customSections: List[CustomSection] = []


class TemplateColors(BaseModel):
    background: str
    text: str
    title: str
    accent: str
    divider: str
    sectionBg: Optional[str] = None


class TemplateFonts(BaseModel):
    heading: str
    body: str


class Template(BaseModel):
    id: str
    name: str
    colors: TemplateColors
    fonts: TemplateFonts


TEMPLATES = [
    Template(
        id="minimal",
        name="极简灰白",
        colors=TemplateColors(
            background="#ffffff",
            text="#333333",
            title="#2c3e50",
            accent="#7f8c8d",
            divider="#e0e0e0",
            sectionBg="#f8f9fa",
        ),
        fonts=TemplateFonts(
            heading="'Segoe UI', sans-serif",
            body="'Segoe UI', sans-serif",
        ),
    ),
    Template(
        id="blue-business",
        name="蓝调商务",
        colors=TemplateColors(
            background="#ffffff",
            text="#2c3e50",
            title="#1a365d",
            accent="#3182ce",
            divider="#bee3f8",
            sectionBg="#ebf8ff",
        ),
        fonts=TemplateFonts(
            heading="'Georgia', serif",
            body="'Segoe UI', sans-serif",
        ),
    ),
    Template(
        id="warm-orange",
        name="暖橙创意",
        colors=TemplateColors(
            background="#fffaf0",
            text="#4a3728",
            title="#c05621",
            accent="#dd6b20",
            divider="#fed7aa",
            sectionBg="#fff5eb",
        ),
        fonts=TemplateFonts(
            heading="'Trebuchet MS', sans-serif",
            body="'Segoe UI', sans-serif",
        ),
    ),
    Template(
        id="dark-tech",
        name="暗色科技",
        colors=TemplateColors(
            background="#1a202c",
            text="#e2e8f0",
            title="#63b3ed",
            accent="#4fd1c5",
            divider="#2d3748",
            sectionBg="#2d3748",
        ),
        fonts=TemplateFonts(
            heading="'Consolas', monospace",
            body="'Segoe UI', sans-serif",
        ),
    ),
]


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/templates")
async def get_templates():
    return {"templates": TEMPLATES}


@app.post("/api/resume/save")
async def save_resume(data: ResumeData):
    resume_id = data.id or str(uuid.uuid4())
    data_dict = data.model_dump()
    data_dict["id"] = resume_id
    in_memory_storage[resume_id] = data_dict
    return {"success": True, "id": resume_id}


@app.post("/api/resume/export")
async def export_resume(data: ResumeData):
    try:
        template_id = data.templateId
        template = next((t for t in TEMPLATES if t.id == template_id), TEMPLATES[1])

        visible_modules = [m for m in data.modules if m.visible]

        template_data = {
            "resume": data,
            "template": template,
            "visible_modules": visible_modules,
        }

        html_content = render_resume_html(template_data)

        pdf_bytes = html_to_pdf_simple(html_content)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def render_resume_html(data):
    template = jinja_env.get_template("resume_template.html")
    return template.render(**data)


def html_to_pdf_simple(html_content):
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except ImportError:
        pass

    try:
        import pdfkit
        pdf_bytes = pdfkit.from_string(html_content, False)
        return pdf_bytes
    except ImportError:
        pass

    raise HTTPException(
        status_code=501,
        detail="PDF generation not available on server. Please use frontend export.",
    )
