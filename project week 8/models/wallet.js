const mongoose = require('mongoose');



const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  transactions: [{
    type: {
      type: String,
      enum: ['withdrawal', 'deposit'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    
  }],
});

const Wallet = mongoose.model('wallets', walletSchema);

module.exports = Wallet;