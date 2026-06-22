import { Router } from 'express';
import {
  getAllTemplates,
  getTemplate,
  createTemplate,
  deleteTemplate,
} from '../controllers/templateController';
import {
  getReport,
  getHistoryReports,
  saveReportToHistory,
} from '../controllers/reportController';
import {
  submitFeedback,
  getFeedbacks,
} from '../controllers/feedbackController';

const router = Router();

router.get('/', getAllTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.delete('/:id', deleteTemplate);

router.get('/:id/result', getReport);
router.get('/:id/history', getHistoryReports);
router.post('/:id/save-report', saveReportToHistory);

router.post('/feedback', submitFeedback);
router.get('/:templateId/feedbacks', getFeedbacks);

export default router;
