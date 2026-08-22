import { z, ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { Request, Response, NextFunction } from 'express';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please provide a valid email address'),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15)
    .regex(/^[+\d][\d\s-]*$/, 'Invalid phone number format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'vendor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(10).max(15).optional(),
  profileImage: z.string().max(500000).optional(),
});

export const eventSchema = z.object({
  name: z.string().trim().min(2, 'Event name is required').max(150),
  type: z.enum(['Wedding', 'Birthday', 'Corporate Event', 'College Event', 'Conference', 'Concert', 'Party', 'Sports Event', 'Cultural Event', 'Other']),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  date: z.coerce.date({ invalid_type_error: 'A valid event date is required' }),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
  location: z.string().trim().min(2, 'Location is required').max(200),
  guestCount: z.coerce.number().int().positive('Guest count must be greater than zero'),
  budget: z.coerce.number().min(0, 'Budget cannot be negative'),
  image: z.string().optional().or(z.literal('')),
  status: z.enum(['planning', 'upcoming', 'ongoing', 'completed', 'cancelled']).optional(),
});

export const vendorSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name is required').max(150),
  category: z.enum(['Catering', 'Photography', 'Videography', 'Decoration', 'DJ', 'Music', 'Makeup Artist', 'Florist', 'Wedding Planner', 'Security', 'Transportation', 'Invitation Designer', 'Event Equipment', 'Other']),
  description: z.string().trim().max(3000).optional().or(z.literal('')),
  location: z.string().trim().min(2, 'Location is required').max(200),
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits').max(15),
  email: z.string().trim().email('Please provide a valid email address').or(z.literal('')).optional(),
  profileImage: z.string().optional().or(z.literal('')),
  portfolio: z.array(z.string()).optional(),
  startingPrice: z.coerce.number().min(0, 'Starting price cannot be negative').optional(),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Service name is required').max(150),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  category: z.enum(['Catering', 'Photography', 'Videography', 'Decoration', 'DJ', 'Music', 'Makeup Artist', 'Florist', 'Wedding Planner', 'Security', 'Transportation', 'Invitation Designer', 'Event Equipment', 'Other']),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  pricingType: z.enum(['Fixed', 'Per Person', 'Per Hour', 'Custom Quote']),
  duration: z.string().max(100).optional().or(z.literal('')),
  images: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const bookingCreateSchema = z.object({
  eventId: z.string().optional().or(z.literal('')),
  vendorId: z.string().optional().or(z.literal('')),
  venueId: z.string().optional().or(z.literal('')),
  serviceId: z.string().optional().or(z.literal('')),
  date: z.coerce.date({ invalid_type_error: 'Booking date is required' }),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
  guestCount: z.coerce.number().int().positive('Guest count must be at least 1').optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const bookingUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']).optional(),
  date: z.coerce.date().optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
  amount: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().min(10, 'Comment must be at least 10 characters').max(2000),
  images: z.array(z.string()).optional(),
});

export const guestSchema = z.object({
  name: z.string().trim().min(2, 'Guest name is required').max(100),
  email: z.string().trim().email('Please provide a valid email address').optional().or(z.literal('')),
  phone: z.string().trim().max(15).optional().or(z.literal('')),
  guestCount: z.coerce.number().int().min(1, 'Guest count must be at least 1').default(1),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined']).default('pending'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Task title is required').max(150),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  date: z.coerce.date({ invalid_type_error: 'Task date is required' }),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
  assignedTo: z.string().trim().max(100).optional().or(z.literal('')),
  status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
});

export const expenseSchema = z.object({
  category: z.enum(['Venue', 'Catering', 'Decoration', 'Photography', 'Music', 'Transportation', 'Invitation', 'Security', 'Miscellaneous']),
  description: z.string().trim().min(2, 'Description is required').max(300),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  date: z.coerce.date().optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking is required'),
  paymentMethod: z.enum(['card', 'upi', 'netbanking', 'wallet']).default('card'),
});

type ValidationSchemas = {
  body?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.errors[0];
        next(ApiError.badRequest(first ? first.message : 'Validation failed', err.errors.map((e) => e.message)));
        return;
      }
      next(err);
    }
  };
};
