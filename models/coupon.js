const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
    },
    usedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    expirationDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    minPurchaseAmount: {
        type: Number,
        default: 0,
    },
    maxApplicableAmount: {
        type: Number,
        default: Infinity,
    },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;