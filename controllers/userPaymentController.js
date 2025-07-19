const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const orders = require('../models/order');
const Wallet = require('../models/wallet');

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
        console.log("Error in createrazorpayorder:", error);
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
        console.log("Error in verifyRazorpayPayment:", error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, paymentId, status, userId, paymentMethod } = req.body;
        const order = await orders.findOne({ razorpayOrderId: orderId });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.paymentId = paymentId || order.paymentId;
        order.status = status === 'confirmed' ? 'confirmed' : 'paymentfailed';

        // Handle wallet payment deduction
        if (paymentMethod === 'wallet' && status === 'confirmed') {
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = new Wallet({
                    userId,
                    balance: 0,
                    transactions: [],
                });
            }

            if (wallet.balance < order.totalPrice) {
                order.status = 'paymentfailed';
                await order.save();
                return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
            }

            wallet.balance -= parseFloat(order.totalPrice);
            wallet.transactions.push({
                type: "withdrawal",
                amount: parseFloat(order.totalPrice),
                date: new Date(),
                paymentId: paymentId || `order_${orderId}`,
            });
            await wallet.save();
        }

        // Set item statuses to match order status for confirmed orders
        if (order.status === 'confirmed') {
            order.items.forEach(item => {
                if (item.status !== 'cancelled' && item.status !== 'returned' && item.status !== 'refunded') {
                    item.status = 'confirmed';
                }
            });
        }

        await order.save();
        res.json({ success: true });
    } catch (error) {
        console.log("Error in updateOrderStatus:", error);
        res.status(500).json({ success: false, message: "Failed to update order status" });
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
        console.log("Error in generatewalletRazorpay:", error);
        res.status(500).json({ error: "Failed to create Razorpay order for wallet" });
    }
};

module.exports = {
    createrazorpayorder,
    verifyRazorpayPayment,
    updateOrderStatus,
    generatewalletRazorpay,
};