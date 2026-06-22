import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  Sketch,
  ScheduleItem,
  Volunteer,
  Material,
  ProjectStatus,
  SketchStatus,
  MaterialStatus,
  Annotation,
} from '../src/types/index.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const INLINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f0f0f0"/><circle cx="200" cy="150" r="80" fill="#4a90d9"/><text x="200" y="155" text-anchor="middle" fill="white" font-size="20">Sketch</text></svg>`;

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const volunteerNames = [
  '张伟', '李娜', '王芳', '刘洋', '陈静', '杨帆', '赵敏', '黄磊',
  '周婷', '吴强', '徐丽', '孙浩', '胡军', '朱琳', '郭涛',
];

const skillsPool = ['绘画', '调色', '墙绘', '设计', '摄影', '脚手架', '后勤', '宣传'];

const projectTitles = [
  '城市彩虹墙', '历史街区壁画', '儿童乐园涂鸦', '社区文化长廊',
  '滨江艺术墙', '科技园创意画', '校园文化墙', '老街新貌',
  '公园生态壁画', '地铁口艺术墙',
];

const locations = [
  '朝阳区建国路88号', '海淀区中关村大街1号', '东城区王府井大街',
  '西城区西单北大街', '丰台区丽泽商务区', '石景山区古城大街',
  '通州区新华大街', '昌平区回龙观', '大兴区亦庄', '顺义区新国展',
];

const artists = ['李丹青', '王艺术', '张创意', '陈墨', '刘画廊'];

const materialNames = [
  '外墙乳胶漆', '丙烯颜料', '画笔套装', '调色盘', '美纹纸',
  '砂纸', '腻子粉', '底漆', '罩光清漆', '滚筒刷', '脚手架', '防护口罩',
];

const statuses: ProjectStatus[] = ['pending', 'creating', 'completed'];
const sketchStatuses: SketchStatus[] = ['pending', 'approved', 'rejected'];
const materialStatuses: MaterialStatus[] = ['pending', 'ordered', 'received'];
const tasks = ['打底稿', '上底色', '主体绘制', '细节刻画', '清理现场', '罩光保护'];

const volunteers: Volunteer[] = volunteerNames.map((name) => ({
  id: uuidv4(),
  name,
  email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
  phone: `138${Math.floor(10000000 + Math.random() * 90000000)}`,
  skills: Array.from(new Set([randomItem(skillsPool), randomItem(skillsPool)])),
}));

function generateSketches(projectId: string, count: number): Sketch[] {
  const sketches: Sketch[] = [];
  for (let i = 1; i <= count; i++) {
    const annotations: Annotation[] = [];
    if (Math.random() > 0.5) {
      annotations.push({
        x: Math.floor(Math.random() * 100),
        y: Math.floor(Math.random() * 100),
        comment: '这里可以再调整一下颜色',
      });
    }
    sketches.push({
      id: uuidv4(),
      projectId,
      version: i,
      svgUrl: INLINE_SVG,
      status: randomItem(sketchStatuses),
      annotations,
      createdAt: randomDate(new Date(2025, 0, 1), new Date()),
      feedback: i > 1 ? '改进了构图，整体效果更好' : undefined,
    });
  }
  return sketches;
}

function generateSchedule(projectId: string, count: number): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  for (let i = 0; i < count; i++) {
    const volunteer = randomItem(volunteers);
    const startHour = 8 + Math.floor(Math.random() * 4);
    items.push({
      id: uuidv4(),
      projectId,
      volunteerId: volunteer.id,
      date: randomDate(new Date(2026, 0, 1), new Date(2026, 11, 31)),
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${(startHour + 4).toString().padStart(2, '0')}:00`,
      task: randomItem(tasks),
    });
  }
  return items;
}

function generateMaterials(projectId: string, count: number): Material[] {
  const usedNames = new Set<string>();
  const materials: Material[] = [];
  while (materials.length < count) {
    const name = randomItem(materialNames);
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    materials.push({
      id: uuidv4(),
      projectId,
      name,
      quantity: Math.floor(Math.random() * 20) + 1,
      unit: randomItem(['桶', '支', '套', '张', '个', '卷']),
      status: randomItem(materialStatuses),
      estimatedCost: Math.floor(Math.random() * 500) + 50,
      notes: Math.random() > 0.5 ? '需要提前采购' : undefined,
    });
  }
  return materials;
}

const projects: Project[] = [];
const sketchesMap: Map<string, Sketch[]> = new Map();
const scheduleMap: Map<string, ScheduleItem[]> = new Map();
const materialsMap: Map<string, Material[]> = new Map();

for (let i = 0; i < 10; i++) {
  const projectId = uuidv4();
  const status = statuses[i % 3];
  const project: Project = {
    id: projectId,
    title: projectTitles[i],
    description: `本项目旨在通过艺术壁画的形式美化${locations[i].slice(0, 3)}区域，提升社区文化氛围，展现城市独特魅力。`,
    location: locations[i],
    status,
    startDate: randomDate(new Date(2026, 0, 1), new Date(2026, 5, 30)),
    endDate: status === 'completed' ? randomDate(new Date(2026, 6, 1), new Date(2026, 11, 31)) : undefined,
    leadArtist: randomItem(artists),
    budget: Math.floor(Math.random() * 50000) + 5000,
  };
  projects.push(project);
  sketchesMap.set(projectId, generateSketches(projectId, 2 + Math.floor(Math.random() * 2)));
  scheduleMap.set(projectId, generateSchedule(projectId, 3 + Math.floor(Math.random() * 3)));
  materialsMap.set(projectId, generateMaterials(projectId, 3 + Math.floor(Math.random() * 4)));
}

app.get('/api/projects', (_req: Request, res: Response<Project[]>) => {
  res.json(projects);
});

app.post('/api/projects', (req: Request<{}, {}, Omit<Project, 'id'>>, res: Response<Project>) => {
  const newProject: Project = {
    id: uuidv4(),
    ...req.body,
  };
  projects.push(newProject);
  sketchesMap.set(newProject.id, []);
  scheduleMap.set(newProject.id, []);
  materialsMap.set(newProject.id, []);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req: Request<{ id: string }, {}, Partial<Project>>, res: Response<Project | { error: string }>) => {
  const { id } = req.params;
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  projects[index] = { ...projects[index], ...req.body };
  res.json(projects[index]);
});

app.delete('/api/projects/:id', (req: Request<{ id: string }>, res: Response<{ message: string } | { error: string }>) => {
  const { id } = req.params;
  const index = projects.findIndex((p) => p.id === id);
  if (index === -1) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  projects.splice(index, 1);
  sketchesMap.delete(id);
  scheduleMap.delete(id);
  materialsMap.delete(id);
  res.json({ message: '删除成功' });
});

app.get('/api/projects/:id/sketches', (req: Request<{ id: string }>, res: Response<Sketch[] | { error: string }>) => {
  const { id } = req.params;
  if (!projects.find((p) => p.id === id)) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json(sketchesMap.get(id) || []);
});

app.post('/api/projects/:id/sketches', (req: Request<{ id: string }, {}, Omit<Sketch, 'id' | 'projectId' | 'version' | 'createdAt'>>, res: Response<Sketch | { error: string }>) => {
  const { id } = req.params;
  if (!projects.find((p) => p.id === id)) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  const existing = sketchesMap.get(id) || [];
  const newSketch: Sketch = {
    id: uuidv4(),
    projectId: id,
    version: existing.length + 1,
    svgUrl: req.body.svgUrl || INLINE_SVG,
    status: req.body.status || 'pending',
    annotations: req.body.annotations || [],
    createdAt: new Date().toISOString(),
    feedback: req.body.feedback,
  };
  existing.push(newSketch);
  sketchesMap.set(id, existing);
  res.status(201).json(newSketch);
});

app.put('/api/projects/:id/sketches/:sketchId', (req: Request<{ id: string; sketchId: string }, {}, Partial<Sketch>>, res: Response<Sketch | { error: string }>) => {
  const { id, sketchId } = req.params;
  const sketchList = sketchesMap.get(id);
  if (!sketchList) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  const index = sketchList.findIndex((s) => s.id === sketchId);
  if (index === -1) {
    res.status(404).json({ error: '草图不存在' });
    return;
  }
  sketchList[index] = { ...sketchList[index], ...req.body };
  res.json(sketchList[index]);
});

app.get('/api/projects/:id/schedule', (req: Request<{ id: string }>, res: Response<ScheduleItem[] | { error: string }>) => {
  const { id } = req.params;
  if (!projects.find((p) => p.id === id)) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json(scheduleMap.get(id) || []);
});

app.post('/api/projects/:id/schedule', (req: Request<{ id: string }, {}, Omit<ScheduleItem, 'id' | 'projectId'>>, res: Response<ScheduleItem | { error: string }>) => {
  const { id } = req.params;
  if (!projects.find((p) => p.id === id)) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  const newItem: ScheduleItem = {
    id: uuidv4(),
    projectId: id,
    ...req.body,
  };
  const list = scheduleMap.get(id) || [];
  list.push(newItem);
  scheduleMap.set(id, list);
  res.status(201).json(newItem);
});

app.delete('/api/projects/:id/schedule/:itemId', (req: Request<{ id: string; itemId: string }>, res: Response<{ message: string } | { error: string }>) => {
  const { id, itemId } = req.params;
  const list = scheduleMap.get(id);
  if (!list) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  const index = list.findIndex((s) => s.id === itemId);
  if (index === -1) {
    res.status(404).json({ error: '排班项不存在' });
    return;
  }
  list.splice(index, 1);
  res.json({ message: '删除成功' });
});

app.get('/api/volunteers', (_req: Request, res: Response<Volunteer[]>) => {
  res.json(volunteers);
});

app.post('/api/volunteers', (req: Request<{}, {}, Omit<Volunteer, 'id'>>, res: Response<Volunteer>) => {
  const newVolunteer: Volunteer = {
    id: uuidv4(),
    ...req.body,
  };
  volunteers.push(newVolunteer);
  res.status(201).json(newVolunteer);
});

app.get('/api/projects/:id/materials', (req: Request<{ id: string }>, res: Response<Material[] | { error: string }>) => {
  const { id } = req.params;
  if (!projects.find((p) => p.id === id)) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json(materialsMap.get(id) || []);
});

app.post('/api/projects/:id/materials', (req: Request<{ id: string }, {}, Omit<Material, 'id' | 'projectId'>>, res: Response<Material | { error: string }>) => {
  const { id } = req.params;
  if (!projects.find((p) => p.id === id)) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  const newMaterial: Material = {
    id: uuidv4(),
    projectId: id,
    ...req.body,
  };
  const list = materialsMap.get(id) || [];
  list.push(newMaterial);
  materialsMap.set(id, list);
  res.status(201).json(newMaterial);
});

app.put('/api/projects/:id/materials/:materialId', (req: Request<{ id: string; materialId: string }, {}, Partial<Material>>, res: Response<Material | { error: string }>) => {
  const { id, materialId } = req.params;
  const list = materialsMap.get(id);
  if (!list) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  const index = list.findIndex((m) => m.id === materialId);
  if (index === -1) {
    res.status(404).json({ error: '材料不存在' });
    return;
  }
  list[index] = { ...list[index], ...req.body };
  res.json(list[index]);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
