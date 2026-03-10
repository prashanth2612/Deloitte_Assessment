const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  product: {
    type: String,
    trim: true,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

inventorySchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Inventory', inventorySchema);
