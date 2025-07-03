const orders = require("../models/order");

const order = async (req, res) => {
    try {
        const orderdata = await orders
            .find()
            .populate("items.productId")
            .populate("userId");
        // Group orders by userId
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
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;
        await orders.findByIdAndUpdate(orderId, { status: newStatus });
        res.json({ success: true, message: "Order status updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { orderId, requestType } = req.body;
        if (!['return', 'refund', 'cancellation'].includes(requestType)) {
            return res.status(400).json({ success: false, message: "Invalid request type" });
        }

        const order = await orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (requestType === 'return' && order.status === 'return-requested') {
            order.status = 'returned';
        } else if (requestType === 'refund' && order.status === 'refund-requested') {
            order.status = 'refunded';
        } else if (requestType === 'cancellation' && order.status === 'cancellation-requested') {
            order.status = 'cancelled';
        } else {
            return res.status(400).json({ success: false, message: "Invalid request status" });
        }

        await order.save();
        res.json({ success: true, message: `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} approved successfully` });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { order, updateOrderStatus, approveRequest };