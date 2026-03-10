const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
  },

  assigned: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
  },

  // Simple order fields (used by the Order page form)
  orderId: {
    type: String,
    trim: true,
  },
  products: {
    type: String,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  price: {
    type: Number,
    default: 0,
  },

  // Advanced ERP fields (optional)
  number: {
    type: Number,
  },
  recurring: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'annually', 'quarter'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  client: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: true,
  },
  invoice: {
    type: mongoose.Schema.ObjectId,
    ref: 'Invoice',
    autopopulate: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
      },
      itemName: {
        type: String,
      },
      description: {
        type: String,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      price: {
        type: Number,
      },
      discount: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
      },
      notes: {
        type: String,
      },
    },
  ],
  shipment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Shipment',
  },
  approved: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  fulfillment: {
    type: String,
    enum: ['pending', 'in review', 'processing', 'packing', 'shipped', 'on hold', 'cancelled'],
    default: 'pending',
  },
  status: {
    type: String,
    enum: [
      'not started',
      'in progress',
      'delayed',
      'completed',
      'delivered',
      'returned',
      'cancelled',
      'on hold',
      'refunded',
      'pending',
      'shipped',
    ],
    default: 'pending',
  },
  processingStatus: String,
  pdf: {
    type: String,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Order', orderSchema);
