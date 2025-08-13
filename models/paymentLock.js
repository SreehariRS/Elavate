const mongoose = require('mongoose');

const paymentLockSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Auto-expire after 5 minutes
});

module.exports = mongoose.model('PaymentLock', paymentLockSchema);