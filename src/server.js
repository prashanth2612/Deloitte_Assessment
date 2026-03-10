require('module-alias/register');

const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

const [major] = process.versions.node.split('.').map(Number);
if (major < 20) {
  console.error('❌ Node.js v20+ is required.');
  process.exit(1);
}

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

mongoose
  .connect(process.env.DATABASE)
  .then(() => console.log('✅ MongoDB connected.'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

const modelFiles = globSync('./src/models/**/*.js');
for (const filePath of modelFiles) {
  require(path.resolve(filePath));
}

const app = require('./app');
const PORT = process.env.PORT || 8888;

const server = app.listen(PORT, () => {
  console.log(`🚀 Coffee With Corporates running on port ${server.address().port} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = (signal) => {
  console.log(`\n⚠️  ${signal} — shutting down…`);
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Closed. Exiting.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('🔥 Unhandled rejection:', reason));
