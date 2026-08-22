import mongoose, { Schema, Document } from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Venue', 'Catering', 'Decoration', 'Photography', 'Music',
  'Transportation', 'Invitation', 'Security', 'Miscellaneous',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface IExpense extends Document {
  eventId: mongoose.Types.ObjectId;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: EXPENSE_CATEGORIES, message: '{VALUE} is not a valid expense category' },
    },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 300 },
    amount: { type: Number, required: [true, 'Amount is required'], min: [0.01, 'Amount must be greater than zero'] },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
