import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env
dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

// Import AFTER dotenv has loaded
const { createApp } = await import('./app.js');
const { connectDB } = await import('./config/supabase.js');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`[server] The Catalyst API running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

start();