const path = require('path');
const moduleAlias = require('module-alias');

// Fix alias path for Vercel's serverless environment
moduleAlias.addAlias('@', path.join(__dirname, '../src'));

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const mongoose = require('mongoose');
const { globSync } = require('glob');

// Connect to MongoDB
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.DATABASE)
    .then(() => console.log('✅ MongoDB connected.'))
    .catch((err) => console.error('❌ MongoDB connection failed:', err.message));
}

// Load models
const modelFiles = globSync(path.join(__dirname, '../src/models/**/*.js'));
for (const filePath of modelFiles) {
  require(path.resolve(filePath));
}

const app = require('../src/app');

module.exports = app;