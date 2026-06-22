import type { Request, Response } from 'express';
import { dataStore } from '../store/dataStore';

export const submitFeedback = (req: Request, res: Response): void => {
  const { templateId, scores } = req.body;
  if (!templateId || !scores) {
    res.status(400).json({ error: 'Invalid feedback data' });
    return;
  }

  const template = dataStore.getTemplate(templateId);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const record = dataStore.addFeedback(templateId, scores);
  if (!record) {
    res.status(500).json({ error: 'Failed to submit feedback' });
    return;
  }

  res.status(201).json(record);
};

export const getFeedbacks = (req: Request, res: Response): void => {
  const { templateId } = req.params;
  const feedbacks = dataStore.getFeedbacks(templateId);
  res.json(feedbacks);
};
