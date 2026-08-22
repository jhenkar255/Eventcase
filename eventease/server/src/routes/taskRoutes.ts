import { Router } from 'express';
import * as tasks from '../controllers/taskController';
import { protect } from '../middleware/auth';
import { validate, taskSchema } from '../validators';

const router = Router();

router.use(protect);

router.get('/:eventId/tasks', tasks.getTasks);
router.post('/:eventId/tasks', validate({ body: taskSchema }), tasks.createTask);
router.put('/:eventId/tasks/:id', validate({ body: taskSchema.partial() }), tasks.updateTask);
router.delete('/:eventId/tasks/:id', tasks.deleteTask);

export default router;
