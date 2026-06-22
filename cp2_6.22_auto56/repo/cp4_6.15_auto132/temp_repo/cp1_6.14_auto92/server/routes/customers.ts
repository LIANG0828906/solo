import { Router } from 'express';
import CustomerController from '../controllers/CustomerController.js';

const router = Router();

router.get('/', CustomerController.searchCustomers);
router.post('/', CustomerController.createCustomer);
router.get('/:id', CustomerController.getCustomerById);
router.put('/:id', CustomerController.updateCustomer);
router.delete('/:id', CustomerController.deleteCustomer);

export default router;
