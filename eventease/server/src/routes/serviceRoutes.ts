import { Router } from 'express';
import * as services from '../controllers/serviceController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', services.getServices);
router.get('/:id', services.getService);

export default router;
