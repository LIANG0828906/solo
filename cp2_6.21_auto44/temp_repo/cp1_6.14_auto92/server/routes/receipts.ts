import { Router } from 'express';
import ReceiptController from '../controllers/ReceiptController.js';

const router = Router();

router.get('/', ReceiptController.getReceipts);
router.post('/', ReceiptController.createReceipt);
router.get('/:id', ReceiptController.getReceiptById);
router.put('/:id', ReceiptController.updateReceipt);
router.patch('/:id/status', ReceiptController.updateStatus);
router.delete('/:id', ReceiptController.deleteReceipt);

export default router;
