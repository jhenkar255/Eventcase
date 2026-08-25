import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { asyncHandler } from '../utils/errorHandler';
import { ApiError } from '../utils/ApiError';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

const publicUser = (user: { _id: unknown; name: string; email: string; phone: string; role: string; profileImage?: string; status: string; createdAt: Date }) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  profileImage: user.profileImage || '',
  status: user.status,
  createdAt: user.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role,
  });

  const token = generateToken({ id: String(user._id), role: user.role });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { token, user: publicUser(user) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.status === 'deleted') {
    throw ApiError.unauthorized('Account no longer exists');
  }
  if (user.status === 'suspended') {
    throw ApiError.forbidden('Your account has been suspended. Contact support.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken({ id: String(user._id), role: user.role });

  res.json({
    success: true,
    message: 'Login successful',
    data: { token, user: publicUser(user) },
  });
});

export const getMe = asyncHandler(async (req: AuthRequest, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: { user: publicUser(user) } });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res) => {
  const updates = req.body;
  delete updates.password;
  delete updates.email;
  delete updates.role;

  const user = await User.findByIdAndUpdate(req.user!.id, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found');

  res.json({ success: true, message: 'Profile updated', data: { user: publicUser(user) } });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  if (!newPassword || newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters');
  }

  const user = await User.findById(req.user!.id).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.unauthorized('Current password is incorrect');

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

/**
 * Dummy implementation of password reset. In production this would send an
 * email with a signed reset link. For the demo we verify the account exists
 * and return a generic response without leaking whether the email is registered.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    // In production: create reset token + email link.
    console.log(`[DEV] Password reset requested for ${email}`);
  }
  res.json({
    success: true,
    message: 'If an account exists for this email, a reset link has been sent.',
  });
});
