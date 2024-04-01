const mongoose = require('mongoose');

// // require("dotenv").config();
// require('dotenv').config()
// mongoose.connect(`mongodb://${process.env.LOCALHOST}`)
// // mongoose.connect(`mongodb://localhost:${process.env.DBport}/try1`)
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log("Failed to connect5");
// })
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
        default: 'confirmed', // Default status is 'confirmed', you can adjust this based on your requirements
    },
    paymentMethod: {
        type: String,
        default: 'Cash On Delivery'
    },
    cancellationReason: {
        type: String,
    }
});



const orders = mongoose.model('orders', orderSchema);

module.exports = orders;
