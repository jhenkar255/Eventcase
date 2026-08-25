import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'customer' | 'vendor' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  profileImage?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
    role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer', index: true },
    profileImage: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended', 'deleted'], default: 'active', index: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
