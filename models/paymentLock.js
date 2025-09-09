const mongoose = require('mongoose');

const paymentLockSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 900 // 15 minutes in seconds
    }
});

module.exports = mongoose.model('PaymentLock', paymentLockSchema);