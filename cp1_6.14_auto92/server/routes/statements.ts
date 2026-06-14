import { Router } from 'express';
import StatementController from '../controllers/StatementController.js';

const router = Router();

router.post('/', StatementController.generateStatement);
router.get('/:customerId', StatementController.getStatement);

export default router;
