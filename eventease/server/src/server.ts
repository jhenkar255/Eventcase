import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/db';

const start = async () => {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`EventEase API running on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
