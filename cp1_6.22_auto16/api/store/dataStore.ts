import { v4 as uuidv4 } from 'uuid';
import type { Template, FeedbackRecord, ReportData, Dimension } from '../types';

class DataStore {
  private templates: Map<string, Template> = new Map();
  private feedbacks: Map<string, FeedbackRecord[]> = new Map();
  private historyReports: Map<string, ReportData[]> = new Map();
  private submittedTokens: Set<string> = new Set();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    const defaultDimensions: Omit<Dimension, 'id'>[] = [
      { name: '技术能力', weight: 3 },
      { name: '沟通协作', weight: 3 },
      { name: '进度管理', weight: 3 },
      { name: '质量保障', weight: 2 },
      { name: '团队氛围', weight: 2 },
    ];

    const templateId = uuidv4();
    const dimensions: Dimension[] = defaultDimensions.map(d => ({
      ...d,
      id: uuidv4(),
    }));

    const mockTemplate: Template = {
      id: templateId,
      name: 'Sprint 复盘模板',
      dimensions,
      createdAt: Date.now() - 86400000 * 3,
    };

    this.templates.set(templateId, mockTemplate);

    const mockFeedbacks: FeedbackRecord[] = [];
    for (let i = 0; i < 5; i++) {
      const scores: Record<string, number> = {};
      dimensions.forEach(dim => {
        scores[dim.id] = Math.floor(Math.random() * 4) + 6;
      });
      mockFeedbacks.push({
        id: uuidv4(),
        templateId,
        scores,
        submittedAt: Date.now() - 86400000 * 2 + i * 3600000,
      });
    }
    this.feedbacks.set(templateId, mockFeedbacks);

    const historyReport = this.generateReport(templateId);
    historyReport.id = uuidv4();
    historyReport.createdAt = Date.now() - 86400000 * 7;
    this.historyReports.set(templateId, [historyReport]);

    const template2Id = uuidv4();
    const dims2: Dimension[] = [
      { id: uuidv4(), name: '代码质量', weight: 4 },
      { id: uuidv4(), name: '交付效率', weight: 3 },
      { id: uuidv4(), name: '客户满意度', weight: 5 },
    ];
    const template2: Template = {
      id: template2Id,
      name: '项目结项复盘',
      dimensions: dims2,
      createdAt: Date.now() - 86400000 * 10,
    };
    this.templates.set(template2Id, template2);

    const scores2: Record<string, number> = {};
    dims2.forEach(dim => {
      scores2[dim.id] = Math.floor(Math.random() * 3) + 7;
    });
    this.feedbacks.set(template2Id, [{
      id: uuidv4(),
      templateId: template2Id,
      scores: scores2,
      submittedAt: Date.now() - 86400000 * 9,
    }]);
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.get(id);
  }

  createTemplate(name: string, dimensions: Omit<Dimension, 'id'>[]): Template {
    const id = uuidv4();
    const template: Template = {
      id,
      name,
      dimensions: dimensions.map(d => ({ ...d, id: uuidv4() })),
      createdAt: Date.now(),
    };
    this.templates.set(id, template);
    this.feedbacks.set(id, []);
    this.historyReports.set(id, []);
    return template;
  }

  deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  addFeedback(templateId: string, scores: Record<string, number>): FeedbackRecord | null {
    if (!this.templates.has(templateId)) return null;

    const record: FeedbackRecord = {
      id: uuidv4(),
      templateId,
      scores,
      submittedAt: Date.now(),
    };

    const existing = this.feedbacks.get(templateId) || [];
    existing.push(record);
    this.feedbacks.set(templateId, existing);

    return record;
  }

  getFeedbacks(templateId: string): FeedbackRecord[] {
    return this.feedbacks.get(templateId) || [];
  }

  generateReport(templateId: string): ReportData {
    const template = this.templates.get(templateId);
    const feedbacks = this.feedbacks.get(templateId) || [];

    const averages: Record<string, number> = {};

    if (template && feedbacks.length > 0) {
      template.dimensions.forEach(dim => {
        const total = feedbacks.reduce((sum, fb) => sum + (fb.scores[dim.id] || 0), 0);
        averages[dim.id] = Number((total / feedbacks.length).toFixed(2));
      });
    }

    return {
      id: uuidv4(),
      templateId,
      templateName: template?.name || '',
      averages,
      totalFeedbacks: feedbacks.length,
      dimensions: template?.dimensions || [],
      createdAt: Date.now(),
    };
  }

  saveReportToHistory(templateId: string): ReportData | null {
    const report = this.generateReport(templateId);
    if (!report.templateName) return null;

    const history = this.historyReports.get(templateId) || [];
    history.push(report);
    this.historyReports.set(templateId, history);
    return report;
  }

  getHistoryReports(templateId: string): ReportData[] {
    return this.historyReports.get(templateId) || [];
  }

  markSubmitted(token: string): void {
    this.submittedTokens.add(token);
  }

  hasSubmitted(token: string): boolean {
    return this.submittedTokens.has(token);
  }
}

export const dataStore = new DataStore();
