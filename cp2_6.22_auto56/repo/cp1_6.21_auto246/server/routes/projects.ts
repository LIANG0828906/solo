import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectCreateBody, ProjectUpdateBody } from '../types';

const router = Router();

const projectsStore = new Map<string, Project>();

router.get('/', (_req, res) => {
  const projects = Array.from(projectsStore.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json({ code: 0, data: projects, message: 'success' });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const project = projectsStore.get(id);
  if (!project) {
    res.status(404).json({ code: 404, data: null, message: '项目不存在' });
    return;
  }
  res.json({ code: 0, data: project, message: 'success' });
});

router.post('/', (req, res) => {
  const body = req.body as ProjectCreateBody;
  const { name, templateId, description = '', data = {} } = body;

  if (!name || !templateId) {
    res.status(400).json({ code: 400, data: null, message: 'name 和 templateId 为必填项' });
    return;
  }

  const now = new Date().toISOString();
  const id = uuidv4();
  const project: Project = {
    id,
    name,
    description,
    templateId,
    data,
    createdAt: now,
    updatedAt: now
  };

  projectsStore.set(id, project);
  res.status(201).json({ code: 0, data: project, message: '创建成功' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body as ProjectUpdateBody;
  const project = projectsStore.get(id);

  if (!project) {
    res.status(404).json({ code: 404, data: null, message: '项目不存在' });
    return;
  }

  const updated: Project = {
    ...project,
    name: body.name ?? project.name,
    description: body.description ?? project.description,
    data: body.data ?? project.data,
    updatedAt: new Date().toISOString()
  };

  projectsStore.set(id, updated);
  res.json({ code: 0, data: updated, message: '更新成功' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const deleted = projectsStore.delete(id);

  if (!deleted) {
    res.status(404).json({ code: 404, data: null, message: '项目不存在' });
    return;
  }

  res.json({ code: 0, data: { id }, message: '删除成功' });
});

router.post('/:id/export', (req, res) => {
  const { id } = req.params;
  const project = projectsStore.get(id);

  if (!project) {
    res.status(404).json({ code: 404, data: null, message: '项目不存在' });
    return;
  }

  const exportPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      description: project.description,
      templateId: project.templateId,
      data: project.data
    },
    meta: {
      id: project.id,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }
  };

  const { format = 'json' } = req.body as { format?: string };

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${project.id}.json"`
    );
    res.send(JSON.stringify(exportPayload, null, 2));
    return;
  }

  res.json({ code: 0, data: exportPayload, message: '导出成功' });
});

export default router;
