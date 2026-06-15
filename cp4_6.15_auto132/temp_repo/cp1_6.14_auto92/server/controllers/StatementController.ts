import { Request, Response } from 'express';
import { statementService } from '../services/index.js';

interface GenerateStatementRequest {
  customerId: string;
  startDate: string;
  endDate: string;
}

export const StatementController = {
  async generateStatement(req: Request, res: Response) {
    try {
      const { customerId, startDate, endDate } = req.body as GenerateStatementRequest;
      if (!customerId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'customerId, startDate, and endDate are required'
        });
        return;
      }
      res.status(202).json({
        success: true,
        data: {
          message: 'Statement generation in progress',
          location: `/api/statements/${customerId}?startDate=${startDate}&endDate=${endDate}`
        }
      });
      statementService.generateStatement({ customerId, startDate, endDate }).catch(() => {});
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate statement generation'
      });
    }
  },

  async getStatement(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
        return;
      }
      const statement = await statementService.generateStatement({
        customerId,
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.status(200).json({
        success: true,
        data: statement
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Customer not found') {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statement'
      });
    }
  }
};

export default StatementController;
