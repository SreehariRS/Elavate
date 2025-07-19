const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
            status: {
                type: String,
                enum: ["pending", "confirmed", "dispatched", "out for delivery", "delivered", "return-requested", "returned", "refund-requested", "refunded", "cancellation-requested", "cancelled"],
                default: "confirmed",
            },
            cancellationReason: {
                type: String,
            },
        },
    ],
    selectedAddress: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "dispatched", "out for delivery", "delivered", "return-requested", "returned", "refund-requested", "refunded", "cancellation-requested", "cancelled"],
        default: "pending",
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
    },
    cancellationReason: {
        type: String,
    },
    razorpayOrderId: {
        type: String,
    },
    paymentId: {
        type: String,
    },
});

const orders = mongoose.model("orders", orderSchema);

module.exports = orders;