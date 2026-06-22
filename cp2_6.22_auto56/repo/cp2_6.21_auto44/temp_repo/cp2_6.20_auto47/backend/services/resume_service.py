import json
import os
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
RESUMES_FILE = os.path.join(DATA_DIR, "resumes.json")


class PersonalInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    title: str = ""
    summary: str = ""


class WorkExperience(BaseModel):
    company: str = ""
    position: str = ""
    startDate: str = ""
    endDate: str = ""
    description: str = ""


class Education(BaseModel):
    school: str = ""
    degree: str = ""
    major: str = ""
    startDate: str = ""
    endDate: str = ""


class Skill(BaseModel):
    name: str = ""
    level: str = ""


class Project(BaseModel):
    name: str = ""
    role: str = ""
    description: str = ""
    technologies: list = []


class ResumeSections(BaseModel):
    personal: PersonalInfo = PersonalInfo()
    work: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[Skill] = []
    projects: list[Project] = []


class Resume(BaseModel):
    id: str = ""
    title: str = ""
    template: str = "business"
    sections: ResumeSections = ResumeSections()
    createdAt: str = ""
    updatedAt: str = ""


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def _read_resumes() -> list:
    _ensure_data_dir()
    if not os.path.exists(RESUMES_FILE):
        return []
    with open(RESUMES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_resumes(resumes: list):
    _ensure_data_dir()
    with open(RESUMES_FILE, "w", encoding="utf-8") as f:
        json.dump(resumes, f, ensure_ascii=False, indent=2)


def get_all_resumes() -> list[Resume]:
    resumes = _read_resumes()
    return [Resume(**r) for r in resumes]


def get_resume_by_id(resume_id: str) -> Optional[Resume]:
    resumes = _read_resumes()
    for r in resumes:
        if r["id"] == resume_id:
            return Resume(**r)
    return None


def create_resume(data: dict) -> Resume:
    resumes = _read_resumes()
    now = datetime.now().isoformat()
    resume = Resume(
        id=str(uuid.uuid4()),
        title=data.get("title", "未命名简历"),
        template=data.get("template", "business"),
        sections=data.get("sections", {}),
        createdAt=now,
        updatedAt=now,
    )
    resumes.append(resume.model_dump())
    _write_resumes(resumes)
    return resume


def update_resume(resume_id: str, data: dict) -> Optional[Resume]:
    resumes = _read_resumes()
    for i, r in enumerate(resumes):
        if r["id"] == resume_id:
            now = datetime.now().isoformat()
            merged = {
                "id": resume_id,
                "title": data.get("title", r.get("title", "")),
                "template": data.get("template", r.get("template", "business")),
                "sections": data.get("sections", r.get("sections", {})),
                "createdAt": r.get("createdAt", now),
                "updatedAt": now,
            }
            updated = Resume(**merged)
            resumes[i] = updated.model_dump()
            _write_resumes(resumes)
            return updated
    return None


def delete_resume(resume_id: str) -> bool:
    resumes = _read_resumes()
    original_len = len(resumes)
    resumes = [r for r in resumes if r["id"] != resume_id]
    if len(resumes) < original_len:
        _write_resumes(resumes)
        return True
    return False


def init_sample_data():
    resumes = _read_resumes()
    if resumes:
        return
    sample = Resume(
        id=str(uuid.uuid4()),
        title="前端开发工程师简历",
        template="tech",
        sections=ResumeSections(
            personal=PersonalInfo(
                name="张三",
                email="zhangsan@example.com",
                phone="13800138000",
                title="高级前端开发工程师",
                summary="5年前端开发经验，精通React和Vue框架，具备丰富的大型项目开发经验。",
            ),
            work=[
                WorkExperience(
                    company="科技有限公司",
                    position="高级前端开发工程师",
                    startDate="2021-03",
                    endDate="至今",
                    description="负责公司核心产品的前端架构设计和开发，带领团队完成多个重要项目。",
                ),
                WorkExperience(
                    company="互联网公司",
                    position="前端开发工程师",
                    startDate="2019-06",
                    endDate="2021-02",
                    description="参与电商平台前端开发，使用React和TypeScript构建高性能用户界面。",
                ),
            ],
            education=[
                Education(
                    school="某某大学",
                    degree="本科",
                    major="计算机科学与技术",
                    startDate="2015-09",
                    endDate="2019-06",
                )
            ],
            skills=[
                Skill(name="React", level="精通"),
                Skill(name="TypeScript", level="精通"),
                Skill(name="Vue", level="熟练"),
                Skill(name="JavaScript", level="精通"),
                Skill(name="Node.js", level="熟练"),
                Skill(name="Python", level="了解"),
            ],
            projects=[
                Project(
                    name="电商平台前端重构",
                    role="前端负责人",
                    description="主导电商平台前端架构从jQuery迁移到React，提升页面性能40%",
                    technologies=["React", "TypeScript", "Redux", "Webpack"],
                ),
                Project(
                    name="数据可视化大屏",
                    role="核心开发",
                    description="开发实时数据可视化大屏系统，支持多维度数据展示",
                    technologies=["Vue", "ECharts", "WebSocket"],
                ),
            ],
        ),
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat(),
    )
    _write_resumes([sample.model_dump()])
