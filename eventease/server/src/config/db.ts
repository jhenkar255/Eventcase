import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDatabase = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://Jhenkar2005:Jhenkar%402005@cluster0.xmxj8sa.mongodb.net/eventease?retryWrites=true&w=majority';
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
