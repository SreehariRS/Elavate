const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();
const orders = require('../models/order');
const Wallet = require('../models/wallet');
const User = require('../models/usermodel');

const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

const acquirePaymentLock = async (userId, lockType = 'checkout', sessionId = null) => {
    try {
        const lockExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        const result = await User.findOneAndUpdate(
            { 
                _id: userId,
                $or: [
                    { 'paymentLock.isLocked': false },
                    { 'paymentLock.isLocked': { $exists: false } },
                    { 'paymentLock.lockExpiry': { $lt: new Date() } } // Expired lock
                ]
            },
            {
                $set: {
                    'paymentLock.isLocked': true,
                    'paymentLock.lockedAt': new Date(),
                    'paymentLock.lockExpiry': lockExpiry,
                    'paymentLock.sessionId': sessionId,
                    'paymentLock.lockType': lockType
                }
            },
            { new: true }
        );
        return !!result; // Returns true if lock was acquired
    } catch (error) {
        console.error('Error acquiring payment lock:', error);
        return false;
    }
};

const releasePaymentLock = async (userId) => {
    try {
        await User.findByIdAndUpdate(userId, {
            $set: {
                'paymentLock.isLocked': false,
                'paymentLock.lockedAt': null,
                'paymentLock.lockExpiry': null,
                'paymentLock.sessionId': null,
                'paymentLock.lockType': null
            }
        });
        return true;
    } catch (error) {
        console.error('Error releasing payment lock:', error);
        return false;
    }
};

const checkPaymentLock = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.paymentLock) return false;
        
        const { isLocked, lockExpiry } = user.paymentLock;
        
        // Check if lock is expired
        if (isLocked && lockExpiry && new Date() > lockExpiry) {
            await releasePaymentLock(userId);
            return false;
        }
        
        return isLocked;
    } catch (error) {
        console.error('Error checking payment lock:', error);
        return false;
    }
};

const createrazorpayorder = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.user;
        const sessionId = req.session.id || req.sessionID;

        if (!amount || isNaN(amount) || amount <= 0) {
            await releasePaymentLock(userId); // Release lock on invalid amount
            return res.status(400).json({ error: "Invalid amount" });
        }

        // Check if payment is already locked
        const isLocked = await checkPaymentLock(userId);
        if (isLocked) {
            return res.status(423).json({ 
                error: "Payment already in progress",
                message: "Another payment is currently being processed. Please wait for it to complete or try again later."
            });
        }

        // Acquire payment lock
        const lockAcquired = await acquirePaymentLock(userId, 'checkout', sessionId);
        if (!lockAcquired) {
            return res.status(423).json({ 
                error: "Payment lock failed",
                message: "Another payment is currently being processed. Please try again later."
            });
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ 
            id: order.id, 
            amount: order.amount, 
            currency: order.currency,
            lockAcquired: true 
        });
    } catch (error) {
        console.log("Error in createrazorpayorder:", error);
        // Release lock on error
        if (req.session.user) {
            await releasePaymentLock(req.session.user);
        }
        res.status(500).json({ error: "Failed to create Razorpay order" });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;
        const userId = req.session.user;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            res.json({ success: true });
        } else {
            // Release lock on invalid signature
            await releasePaymentLock(userId);
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    } catch (error) {
        console.log("Error in verifyRazorpayPayment:", error);
        // Release lock on error
        if (req.session.user) {
            await releasePaymentLock(req.session.user);
        }
        res.status(500).json({ error: "Failed to verify payment" });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, paymentId, status, userId, paymentMethod } = req.body;
        
        // Always release the payment lock when updating order status
        if (userId) {
            await releasePaymentLock(userId);
        }

        const order = await orders.findOne({ _id: orderId, userId });
        if (!order) {
            console.log(`Order not found for _id: ${orderId}, userId: ${userId}`);
            return res.status(404).json({ error: "Order not found" });
        }

        order.paymentId = paymentId || order.paymentId;
        
        if (['confirmed', 'paymentfailed'].includes(status)) {
            order.status = status;
        } else {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        // Handle wallet payment deduction (only for confirmed status)
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
                await releasePaymentLock(userId); // Release lock on insufficient balance
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

        order.items.forEach(item => {
            if (item.status !== 'cancelled' && item.status !== 'returned' && item.status !== 'refunded') {
                item.status = status;
            }
        });

        await order.save();
        res.json({ success: true });
    } catch (error) {
        console.log("Error in updateOrderStatus:", error);
        // Release lock on error
        if (req.body.userId) {
            await releasePaymentLock(req.body.userId);
        }
        res.status(500).json({ success: false, message: "Failed to update order status" });
    }
};

const generatewalletRazorpay = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.user;
        const sessionId = req.session.id || req.sessionID;

        if (!amount || isNaN(amount) || amount <= 0) {
            await releasePaymentLock(userId); // Release lock on invalid amount
            return res.status(400).json({ error: "Invalid amount" });
        }

        // Check if payment is already locked
        const isLocked = await checkPaymentLock(userId);
        if (isLocked) {
            return res.status(423).json({ 
                error: "Payment already in progress",
                message: "Another payment is currently being processed. Please wait for it to complete or try again later."
            });
        }

        // Acquire payment lock for wallet
        const lockAcquired = await acquirePaymentLock(userId, 'wallet', sessionId);
        if (!lockAcquired) {
            return res.status(423).json({ 
                error: "Payment lock failed",
                message: "Another payment is currently being processed. Please try again later."
            });
        }

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: `wallet_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ 
            id: order.id, 
            amount: order.amount, 
            currency: order.currency,
            lockAcquired: true 
        });
    } catch (error) {
        console.log("Error in generatewalletRazorpay:", error);
        // Release lock on error
        if (req.session.user) {
            await releasePaymentLock(req.session.user);
        }
        res.status(500).json({ error: "Failed to create Razorpay order for wallet" });
    }
};

module.exports = {
    createrazorpayorder,
    verifyRazorpayPayment,
    updateOrderStatus,
    generatewalletRazorpay,
    checkPaymentLock,
    acquirePaymentLock,
    releasePaymentLock
};