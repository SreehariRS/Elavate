const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const orders = require('../models/order');

const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

const createrazorpayorder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const options = {
            amount: amount * 100, // Convert to paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create Razorpay order" });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, paymentId, status } = req.body;
        const order = await orders.findOne({ razorpayOrderId: orderId });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.paymentId = paymentId || order.paymentId;
        order.status = status === 'confirmed' ? 'confirmed' : 'paymentfailed'; // Set to confirmed for successful payments
        await order.save();
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to update order status" });
    }
};

const generatewalletRazorpay = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `wallet_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ id: order.id, amount: order.amount, currency: order.currency });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to create Razorpay order for wallet" });
    }
};

module.exports = {
    createrazorpayorder,
    verifyRazorpayPayment,
    updateOrderStatus,
    generatewalletRazorpay,
};