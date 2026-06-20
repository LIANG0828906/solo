import { Router } from 'express';
import { artifactsController } from '../controllers/artifacts.controller';

const artifactsRouter = Router();

artifactsRouter.post('/', artifactsController.create);
artifactsRouter.get('/', artifactsController.getByUserId);
artifactsRouter.get('/:id', artifactsController.getById);
artifactsRouter.put('/:id', artifactsController.update);
artifactsRouter.delete('/:id', artifactsController.delete);

export default artifactsRouter;
