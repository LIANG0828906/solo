import type { Request, Response } from 'express';
import { dataStore } from '../store/dataStore';

export const getReport = (req: Request, res: Response): void => {
  const { id } = req.params;
  const template = dataStore.getTemplate(id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const report = dataStore.generateReport(id);
  res.json(report);
};

export const getHistoryReports = (req: Request, res: Response): void => {
  const { id } = req.params;
  const template = dataStore.getTemplate(id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const history = dataStore.getHistoryReports(id);
  res.json(history);
};

export const saveReportToHistory = (req: Request, res: Response): void => {
  const { id } = req.params;
  const template = dataStore.getTemplate(id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  const report = dataStore.saveReportToHistory(id);
  if (!report) {
    res.status(500).json({ error: 'Failed to save report' });
    return;
  }
  res.status(201).json(report);
};
