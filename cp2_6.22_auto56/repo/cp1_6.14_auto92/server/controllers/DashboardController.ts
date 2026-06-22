import { Request, Response } from 'express';
import { dashboardService } from '../services/index.js';

export const DashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const stats = await dashboardService.getStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard stats'
      });
    }
  }
};

export default DashboardController;
