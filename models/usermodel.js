const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    addressType: { type: String, enum: ["home", "work"] },
    country: { type: String },
    mobileNumber: { type: String },
    pincode: { type: String }, 
    flat: { type: String },
    district: { type: String },
    state: { type: String }
});

const userSchema = new mongoose.Schema({
    firstname: { type: String },
    mobileNumber: { type: String }, 
    email: { type: String },
    password: { type: String },
    confirmPassword: { type: String },
    isBlocked: { type: Boolean },
    addresses: [addressSchema],
    referralCode:{type: String},
    referredCode:{type: String},
      paymentLock: {
        isLocked: { type: Boolean, default: false },
        lockedAt: { type: Date },
        lockExpiry: { type: Date }, // Auto-expire after 15 minutes
        sessionId: { type: String }, // Track which session locked it
        lockType: { type: String, enum: ['checkout', 'retry', 'wallet'], default: 'checkout' }
    }

});

module.exports = mongoose.model('User', userSchema);
