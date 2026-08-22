import { Expense } from '../models/Expense';
import { asyncHandler } from '../utils/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { requireEventOwnership } from './guestController';

export const getExpenses = asyncHandler(async (req: AuthRequest, res) => {
  const event = await requireEventOwnership(req.params.eventId, req.user!.id, req.user!.role);

  const expenses = await Expense.find({ eventId: event._id }).sort({ date: -1 }).lean();

  const byCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });

  res.json({
    success: true,
    data: {
      expenses,
      totalSpent: expenses.reduce((s, e) => s + e.amount, 0),
      budget: event.budget,
      remaining: event.budget - expenses.reduce((s, e) => s + e.amount, 0),
      byCategory,
    },
  });
});

export const createExpense = asyncHandler(async (req: AuthRequest, res) => {
  const event = await requireEventOwnership(req.params.eventId, req.user!.id, req.user!.role);
  const expense = await Expense.create({ ...req.body, eventId: event._id });
  res.status(201).json({ success: true, message: 'Expense added', data: { expense } });
});

export const updateExpense = asyncHandler(async (req: AuthRequest, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  await requireEventOwnership(String(expense.eventId), req.user!.id, req.user!.role);

  Object.assign(expense, req.body);
  await expense.save();
  res.json({ success: true, message: 'Expense updated', data: { expense } });
});

export const deleteExpense = asyncHandler(async (req: AuthRequest, res) => {
  const expense = await Expense.findById(req.params.id);
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  await requireEventOwnership(String(expense.eventId), req.user!.id, req.user!.role);

  await expense.deleteOne();
  res.json({ success: true, message: 'Expense deleted' });
});
