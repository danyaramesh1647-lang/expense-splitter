const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amountOwed: {
    type: Number,
    required: true
  }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  splitType: {
    type: String,
    enum: ['equal', 'unequal', 'percentage'],
    default: 'equal'
  },
  splits: [splitSchema]
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);