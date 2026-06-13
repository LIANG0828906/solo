import { Request, Response, Router } from 'express';
import { statsService } from '../services/statsService.js';

export const statsController = {
  getSurveyStats(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Survey id is required',
        });
      }

      const stats = statsService.getSurveyStats(id);

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Survey not found') {
        return res.status(404).json({
          success: false,
          error: 'Survey not found',
        });
      }

      console.error('Error getting survey stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },

  getRouter() {
    const router = Router();

    router.get('/:id/stats', (req, res) => statsController.getSurveyStats(req, res));

    return router;
  },
};
