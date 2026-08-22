import { Router } from 'express';
import * as expenses from '../controllers/expenseController';
import { protect } from '../middleware/auth';
import { validate, expenseSchema } from '../validators';

const router = Router();

router.use(protect);

router.get('/:eventId/expenses', expenses.getExpenses);
router.post('/:eventId/expenses', validate({ body: expenseSchema }), expenses.createExpense);
router.put('/:eventId/expenses/:id', validate({ body: expenseSchema.partial() }), expenses.updateExpense);
router.delete('/:eventId/expenses/:id', expenses.deleteExpense);

export default router;
