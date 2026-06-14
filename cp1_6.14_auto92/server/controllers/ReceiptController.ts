import { Request, Response } from 'express';
import { receiptService } from '../services/index.js';
import type { Receipt, ReceiptStatus, PaymentInfo } from '../../shared/types/index.js';

export const ReceiptController = {
  async getReceipts(req: Request, res: Response) {
    try {
      const { customerId, status, startDate, endDate, page, pageSize } = req.query;
      const query = {
        customerId: customerId as string,
        status: status as ReceiptStatus,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined
      };
      const result = await receiptService.getReceipts(query);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get receipts'
      });
    }
  },

  async getReceiptById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const receipt = await receiptService.getReceiptById(id);
      if (!receipt) {
        res.status(404).json({
          success: false,
          error: 'Receipt not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get receipt'
      });
    }
  },

  async createReceipt(req: Request, res: Response) {
    try {
      const receiptData = req.body as Omit<Receipt, 'id' | 'receiptNo' | 'createdAt' | 'status'>;
      const newReceipt = await receiptService.createReceipt(receiptData);
      res.status(201).json({
        success: true,
        data: newReceipt
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create receipt'
      });
    }
  },

  async updateReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as Partial<Omit<Receipt, 'id' | 'receiptNo' | 'createdAt'>>;
      const updatedReceipt = await receiptService.updateReceipt(id, updates);
      if (!updatedReceipt) {
        res.status(404).json({
          success: false,
          error: 'Receipt not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: updatedReceipt
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update receipt'
      });
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, paymentInfo } = req.body as { status: ReceiptStatus; paymentInfo?: PaymentInfo };
      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        });
        return;
      }
      const updatedReceipt = await receiptService.updateStatus(id, status, paymentInfo);
      if (!updatedReceipt) {
        res.status(404).json({
          success: false,
          error: 'Receipt not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: updatedReceipt
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update receipt status'
      });
    }
  },

  async deleteReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await receiptService.deleteReceipt(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Receipt not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: { message: 'Receipt deleted successfully' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete receipt'
      });
    }
  }
};

export default ReceiptController;
