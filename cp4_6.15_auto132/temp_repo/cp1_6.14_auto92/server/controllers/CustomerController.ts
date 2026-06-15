import { Request, Response } from 'express';
import { customerService } from '../services/index.js';
import type { Customer } from '../../shared/types/index.js';

export const CustomerController = {
  async searchCustomers(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const customers = await customerService.searchCustomers(search as string);
      res.setHeader('Cache-Control', 'max-age=60');
      res.status(200).json({
        success: true,
        data: customers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search customers'
      });
    }
  },

  async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customer = await customerService.getCustomerById(id);
      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get customer'
      });
    }
  },

  async createCustomer(req: Request, res: Response) {
    try {
      const customerData = req.body as Omit<Customer, 'id' | 'createdAt'>;
      const newCustomer = await customerService.createCustomer(customerData);
      res.status(201).json({
        success: true,
        data: newCustomer
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer'
      });
    }
  },

  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body as Partial<Omit<Customer, 'id' | 'createdAt'>>;
      const updatedCustomer = await customerService.updateCustomer(id, updates);
      if (!updatedCustomer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: updatedCustomer
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update customer'
      });
    }
  },

  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await customerService.deleteCustomer(id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: { message: 'Customer deleted successfully' }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete customer'
      });
    }
  }
};

export default CustomerController;
