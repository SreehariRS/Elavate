const mongoose = require('mongoose');


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
      usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      expirationDate: {
        type: Date,
        required: true,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    });
    const Coupon = mongoose.model('Coupon', couponSchema);
  
    module.exports = Coupon;