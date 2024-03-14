const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    addressType: { type: String, enum: ["home", "work"] },
    country: { type: String },
    mobileNumber: { type: String }, // Change type to String to store mobile number correctly
    pincode: { type: String }, // Change type to String to store pincode correctly
    flat: { type: String },
    district: { type: String },
    state: { type: String }
});

const userSchema = new mongoose.Schema({
    firstname: { type: String },
    mobileNumber: { type: String }, // Change type to String to store mobile number correctly
    email: { type: String },
    password: { type: String },
    confirmPassword: { type: String },
    isBlocked: { type: Boolean },
    addresses: [addressSchema],
});

module.exports = mongoose.model('User', userSchema);
