import type { Request, Response } from 'express';
import { dataStore } from '../store/dataStore';

export const getAllTemplates = (_req: Request, res: Response): void => {
  const templates = dataStore.getAllTemplates();
  res.json(templates);
};

export const getTemplate = (req: Request, res: Response): void => {
  const { id } = req.params;
  const template = dataStore.getTemplate(id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(template);
};

export const createTemplate = (req: Request, res: Response): void => {
  const { name, dimensions } = req.body;
  if (!name || !Array.isArray(dimensions) || dimensions.length === 0) {
    res.status(400).json({ error: 'Invalid template data' });
    return;
  }
  const template = dataStore.createTemplate(name, dimensions);
  res.status(201).json(template);
};

export const deleteTemplate = (req: Request, res: Response): void => {
  const { id } = req.params;
  const success = dataStore.deleteTemplate(id);
  if (!success) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json({ success: true });
};
