const orders = require("../models/order");
const product = require("../models/product");
const Wallet = require("../models/wallet");
const Razorpay = require('razorpay'); // Ensure this is required
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

const order = async (req, res) => {
    try {
        const orderdata = await orders
            .find()
            .populate("items.productId")
            .populate("userId");
        const ordersByUser = {};
        orderdata.forEach((order) => {
            const userId = order.userId ? order.userId._id.toString() : "unknown";
            if (!ordersByUser[userId]) {
                ordersByUser[userId] = [];
            }
            ordersByUser[userId].push(order);
        });
        res.render("admin/order", { ordersByUser });
    } catch (error) {
        console.log("Error in order:", error);
        res.status(500).send("Internal Server Error");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, itemId, newStatus } = req.body;
        const order = await orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (itemId !== undefined && itemId >= 0 && itemId < order.items.length) {
            const item = order.items[itemId];
            if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                item.status = newStatus;
            }
            const activeItems = order.items.filter(item => item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded");
            order.status = activeItems.length > 0 ? activeItems[0].status : newStatus;
        } else {
            order.items.forEach(item => {
                if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                    item.status = newStatus;
                }
            });
            order.status = newStatus;
        }

        await order.save();
        res.json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
        console.log("Error in updateOrderStatus:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { orderId, itemId, requestType } = req.body;
        if (!['return', 'refund', 'cancellation'].includes(requestType)) {
            return res.status(400).json({ success: false, message: "Invalid request type" });
        }

        const order = await orders.findById(orderId).populate("items.productId");
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        let amountToCredit = 0;
        let wallet = await Wallet.findOne({ userId: order.userId });
        if (!wallet) {
            wallet = new Wallet({
                userId: order.userId,
                balance: 0,
                transactions: [],
            });
        }

        if (itemId !== undefined && itemId >= 0 && itemId < order.items.length) {
            const item = order.items[itemId];
            if (requestType === 'return' && item.status === 'return-requested') {
                item.status = 'returned';
                const productData = await product.findById(item.productId._id);
                amountToCredit = (productData.offerprice || productData.price) * item.quantity;
            } else if (requestType === 'refund' && item.status === 'refund-requested') {
                item.status = 'refunded';
                const productData = await product.findById(item.productId._id);
                amountToCredit = (productData.offerprice || productData.price) * item.quantity;
            } else if (requestType === 'cancellation' && item.status === 'cancellation-requested') {
                item.status = 'cancelled';
                const productData = await product.findById(item.productId._id);
                const itemPrice = productData.offerprice || productData.price;
                amountToCredit = itemPrice * item.quantity;
                order.totalPrice -= amountToCredit;
                if (order.totalPrice < 0) order.totalPrice = 0;
            } else {
                return res.status(400).json({ success: false, message: "Invalid request status for item" });
            }

            const activeItems = order.items.filter(item => item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded");
            order.status = activeItems.length > 0 ? activeItems[0].status : (requestType === 'cancellation' ? 'cancelled' : requestType === 'return' ? 'returned' : 'refunded');

            if (amountToCredit > 0) {
                if (order.paymentMethod === 'Razor Pay' && order.paymentId) {
                    // Initiate Razorpay refund
                    const refund = await razorpay.payments.refund(order.paymentId, {
                        amount: amountToCredit * 100, // Amount in paisa
                        speed: 'normal', // Can be 'normal', 'optimum', or 'priority'
                    });
                    console.log("Razorpay refund initiated:", refund);
                    // Optionally credit wallet as a fallback or partial refund
                    wallet.balance += parseFloat(amountToCredit);
                    wallet.transactions.push({
                        type: "deposit",
                        amount: parseFloat(amountToCredit),
                        date: new Date(),
                        paymentId: `refund_${orderId}_${itemId}_${requestType}`,
                        description: `Razorpay refund for ${requestType} of item ${item.productId.name}`,
                    });
                } else {
                    // For wallet or other methods, credit wallet directly
                    wallet.balance += parseFloat(amountToCredit);
                    wallet.transactions.push({
                        type: "deposit",
                        amount: parseFloat(amountToCredit),
                        date: new Date(),
                        paymentId: `refund_${orderId}_${itemId}_${requestType}`,
                        description: `Refund for ${requestType} of item ${item.productId.name}`,
                    });
                }
                await wallet.save();
            }

            await order.save();
            res.json({ success: true, message: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} approved successfully` });
        } else {
            if (requestType === 'return' && order.status === 'return-requested') {
                order.status = 'returned';
                order.items.forEach(item => {
                    if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                        item.status = 'returned';
                        const productData = item.productId;
                        amountToCredit += (productData.offerprice || productData.price) * item.quantity;
                    }
                });
            } else if (requestType === 'refund' && order.status === 'refund-requested') {
                order.status = 'refunded';
                order.items.forEach(item => {
                    if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                        item.status = 'refunded';
                        const productData = item.productId;
                        amountToCredit += (productData.offerprice || productData.price) * item.quantity;
                    }
                });
            } else if (requestType === 'cancellation' && order.status === 'cancellation-requested') {
                order.status = 'cancelled';
                order.items.forEach(item => {
                    if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                        item.status = 'cancelled';
                        const productData = item.productId;
                        amountToCredit += (productData.offerprice || productData.price) * item.quantity;
                    }
                });
                order.totalPrice = 0;
            } else {
                return res.status(400).json({ success: false, message: "Invalid request status" });
            }

            if (amountToCredit > 0) {
                if (order.paymentMethod === 'Razor Pay' && order.paymentId) {
                    // Initiate Razorpay refund for the total amount
                    const refund = await razorpay.payments.refund(order.paymentId, {
                        amount: amountToCredit * 100, // Amount in paisa
                        speed: 'normal',
                    });
                    console.log("Razorpay refund initiated:", refund);
                    // Credit wallet as a fallback or partial refund
                    wallet.balance += parseFloat(amountToCredit);
                    wallet.transactions.push({
                        type: "deposit",
                        amount: parseFloat(amountToCredit),
                        date: new Date(),
                        paymentId: `refund_${orderId}_${requestType}`,
                        description: `Razorpay refund for ${requestType} of order ${orderId}`,
                    });
                } else {
                    wallet.balance += parseFloat(amountToCredit);
                    wallet.transactions.push({
                        type: "deposit",
                        amount: parseFloat(amountToCredit),
                        date: new Date(),
                        paymentId: `refund_${orderId}_${requestType}`,
                        description: `Refund for ${requestType} of order ${orderId}`,
                    });
                }
                await wallet.save();
            }

            await order.save();
            res.json({ success: true, message: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} approved successfully` });
        }
    } catch (error) {
        console.log("Error in approveRequest:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { order, updateOrderStatus, approveRequest };