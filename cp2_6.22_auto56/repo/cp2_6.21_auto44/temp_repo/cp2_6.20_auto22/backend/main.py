from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

app = FastAPI(title="甘特图与资源管理API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectCreate(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    color: str = ""
    createdAt: Optional[str] = None

class TaskCreate(BaseModel):
    id: Optional[str] = None
    projectId: str
    name: str
    startDate: str
    endDate: str
    assigneeId: Optional[str] = None
    dependencies: List[str] = []
    estimatedHours: int = 8
    progress: int = 0

class ResourceCreate(BaseModel):
    id: Optional[str] = None
    name: str
    role: str
    dailyCapacity: int = 8

projects_db: List[dict] = []
tasks_db: List[dict] = []
resources_db: List[dict] = []

def generate_id():
    import uuid
    return uuid.uuid4().hex[:9]

@app.get("/")
def root():
    return {"message": "甘特图与资源管理API", "version": "1.0.0"}

@app.get("/api/projects")
def get_projects():
    return projects_db

@app.post("/api/projects")
def create_project(project: ProjectCreate):
    new_project = {
        "id": project.id or generate_id(),
        "name": project.name,
        "description": project.description,
        "color": project.color,
        "createdAt": project.createdAt or datetime.now().isoformat().split("T")[0],
    }
    projects_db.append(new_project)
    return new_project

@app.put("/api/projects/{project_id}")
def update_project(project_id: str, project: ProjectCreate):
    for i, p in enumerate(projects_db):
        if p["id"] == project_id:
            projects_db[i].update({k: v for k, v in project.dict().items() if v is not None})
            return projects_db[i]
    raise HTTPException(status_code=404, detail="Project not found")

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    global projects_db, tasks_db
    projects_db = [p for p in projects_db if p["id"] != project_id]
    tasks_db = [t for t in tasks_db if t["projectId"] != project_id]
    return {"success": True}

@app.get("/api/tasks")
def get_tasks(project_id: Optional[str] = None):
    if project_id:
        return [t for t in tasks_db if t["projectId"] == project_id]
    return tasks_db

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    new_task = {
        "id": task.id or generate_id(),
        **task.dict(exclude={"id"}),
    }
    tasks_db.append(new_task)
    return new_task

@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, task: TaskCreate):
    for i, t in enumerate(tasks_db):
        if t["id"] == task_id:
            tasks_db[i].update({k: v for k, v in task.dict().items() if v is not None})
            return tasks_db[i]
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    global tasks_db
    tasks_db = [t for t in tasks_db if t["id"] != task_id]
    tasks_db = [
        {**t, "dependencies": [d for d in t["dependencies"] if d != task_id]}
        for t in tasks_db
    ]
    return {"success": True}

@app.get("/api/resources")
def get_resources():
    return resources_db

@app.post("/api/resources")
def create_resource(resource: ResourceCreate):
    new_resource = {
        "id": resource.id or generate_id(),
        **resource.dict(exclude={"id"}),
    }
    resources_db.append(new_resource)
    return new_resource

@app.put("/api/resources/{resource_id}")
def update_resource(resource_id: str, resource: ResourceCreate):
    for i, r in enumerate(resources_db):
        if r["id"] == resource_id:
            resources_db[i].update({k: v for k, v in resource.dict().items() if v is not None})
            return resources_db[i]
    raise HTTPException(status_code=404, detail="Resource not found")

@app.delete("/api/resources/{resource_id}")
def delete_resource(resource_id: str):
    global resources_db, tasks_db
    resources_db = [r for r in resources_db if r["id"] != resource_id]
    tasks_db = [
        {**t, "assigneeId": None if t["assigneeId"] == resource_id else t["assigneeId"]}
        for t in tasks_db
    ]
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
