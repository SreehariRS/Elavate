const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
        },
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon', // Reference to the Coupon model
            default: null,
        },
    }],
    selectedAddress: {
        type: String,
        ref: 'User',
    },
    date: {
        type: Date,
        default: Date.now, // Default to the current date and time
    },
    totalprice: {
        type: Number,
        default: 0, // Default to 0, you might want to adjust this based on your requirements
    },
    status: {
        type: String,
        enum: ['pending','confirmed','dispatched','out for delivery','delivered','returned','cancelled'],
        default: 'confirmed', // Default status is 'confirmed', you can adjust this based on your requirements
    },
    paymentMethod: {
        type: String
    },
    cancellationReason: {
        type: String,
    }
});



const orders = mongoose.model('orders', orderSchema);

module.exports = orders;
