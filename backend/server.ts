import * as dotenv from 'dotenv';
dotenv.config();

import app from './app/index';

const PORT = parseInt(process.env.PORT || '8000', 10);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST || 'production'}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
