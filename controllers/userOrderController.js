const User = require("../models/usermodel");
const orders = require("../models/order");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const product = require("../models/product");
const category = require("../models/category");
const Wallet = require("../models/wallet");
const PDFDocument = require("pdfkit");

const ITEMS_PER_PAGE = 10; 

const home = async (req, res) => {
    try {
        const userId = req.session.user;
        const products = await product.find({ deleted: false });
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/home", { products, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in home:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const userId = req.session.user;
        const categoryId = req.params.id;
        
      
        const selectedCategory = await category.findById(categoryId);
        if (!selectedCategory) {
            req.flash("error", "Category not found");
            return res.redirect("/");
        }
        
        
        const products = await product.find({ 
            category: selectedCategory.name.toLowerCase(), 
            deleted: false 
        });
        
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        
        
        res.render("user/category", { 
            products, 
            categories, 
            category: selectedCategory,
            userData, 
            userId, 
            loggedInUser, 
            errorMessage 
        });
    } catch (error) {
        console.log("Error in getProductsByCategory:", error);
        res.status(500).send("Internal Server Error");
    }
};

const forher = async (req, res) => {
    try {
        const userId = req.session.user;
        const products = await product.find({ category: "women", deleted: false });
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/forher", { products, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in forher:", error);
        res.status(500).send("Internal Server Error");
    }
};

const forhim = async (req, res) => {
    try {
        const userId = req.session.user;
        const products = await product.find({ category: "men", deleted: false });
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/forhim", { products, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in forhim:", error);
        res.status(500).send("Internal Server Error");
    }
};

const display = async (req, res) => {
    try {
        const userId = req.session.user;
        const id = req.params.id;
        const productdata = await product.findById(id);
        if (!productdata) {
            return res.status(404).send("Product not found");
        }
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/productdetails", { products: productdata, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in display:", error);
        res.status(500).send("Internal Server Error");
    }
};

const checkout = async (req, res) => {
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const coupons = await Coupon.find({ isActive: true });
        const categories = await category.find();
        const userData = user;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        const totalPrice = cart ? cart.items.reduce((total, item) => {
            const price = item.productId.offerprice || item.productId.price;
            return total + price * item.quantity;
        }, 0) : 0;

        res.render("user/checkout", {
            user,
            cartItems: cart ? cart.items : [],
            coupons,
            categories,
            userData,
            userId,
            loggedInUser,
            errorMessage,
            addresses: user.addresses || [],
            totalPrice: totalPrice.toFixed(2)
        });
    } catch (error) {
        console.log("Error in checkout:", error);
        res.status(500).send("Internal Server Error");
    }
};

const checkoutpost = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod, couponCode, totalPrice, cartItems } = req.body;
        const userId = req.session.user;

        // Log incoming data for debugging
        console.log("Checkout POST data:", { selectedAddress, paymentMethod, couponCode, totalPrice, cartItems });

        // Validate inputs
        if (!selectedAddress || !paymentMethod || !totalPrice || !cartItems) {
            return res.status(400).json({ success: false, message: "Missing required fields (address, payment method, total price, or cart items)" });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty" });
        }

        // Validate cartItems
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid or empty cart items" });
        }

        // Verify cart items match server-side cart
        const validatedItems = cartItems.filter(item => {
            const cartItem = cart.items.find(ci => ci.productId._id.toString() === item.productId);
            return cartItem && item.quantity > 0 && item.quantity <= cartItem.productId.stock;
        });

        if (validatedItems.length === 0) {
            return res.status(400).json({ success: false, message: "No valid items in the cart" });
        }

        let calculatedTotal = validatedItems.reduce((total, item) => {
            const productData = cart.items.find(ci => ci.productId._id.toString() === item.productId).productId;
            const price = productData.offerprice || productData.price;
            return total + price * item.quantity;
        }, 0);

        let couponId = null;
        let discountApplied = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true, expirationDate: { $gte: new Date() } });
            if (coupon && !coupon.usedBy.includes(userId)) {
                const applicableAmount = Math.min(calculatedTotal, coupon.maxApplicableAmount || Infinity);
                discountApplied = applicableAmount * (coupon.discountValue / 100);
                calculatedTotal -= discountApplied;
                couponId = coupon._id;
                await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedBy: userId } });
            } else {
                return res.status(400).json({ success: false, message: "Invalid or already used coupon" });
            }
        }

        // Validate totalPrice match with calculatedTotal 
        const priceDiff = Math.abs(calculatedTotal - parseFloat(totalPrice));
        if (priceDiff > 0.01) {
            console.log(`Price mismatch: calculatedTotal=${calculatedTotal}, totalPrice=${totalPrice}, difference=${priceDiff}`);
            return res.status(400).json({ success: false, message: "Total price mismatch between client and server" });
        }

        // Handle COD limit
        if (paymentMethod === "Cash On Delivery" && calculatedTotal > 1000) {
            return res.status(400).json({ success: false, message: "Cash on Delivery is not available for amounts over ₹1000" });
        }

        // Handle wallet payment deduction
        let orderStatus = paymentMethod === "Razor Pay" ? "confirmed" : "confirmed";
        if (paymentMethod === "wallet") {
            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = new Wallet({ userId, balance: 0, transactions: [] });
            }

            if (wallet.balance < calculatedTotal) {
                return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
            }

            wallet.balance -= parseFloat(calculatedTotal);
            wallet.transactions.push({
                type: "withdrawal",
                amount: parseFloat(calculatedTotal),
                date: new Date(),
                paymentId: `order_${Date.now()}`,
            });
            await wallet.save();
        }

        const order = new orders({
            userId,
            items: validatedItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                status: orderStatus
            })),
            selectedAddress,
            totalPrice: calculatedTotal,
            paymentMethod,
            couponId,
            discountApplied,
            status: orderStatus
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        const redirectUrl = paymentMethod === "Razor Pay" ? "/order" : "/orderhistory?success=true";
        res.json({ success: true, redirect: redirectUrl });
    } catch (error) {
        console.log("Error in checkoutpost:", error);
        res.status(500).json({ success: false, message: "An error occurred during checkout" });
    }
};

const checkouterrorpost = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod, couponCode, totalPrice, cartItems, status } = req.body;
        const userId = req.session.user;

        if (!selectedAddress || !paymentMethod || !totalPrice || !cartItems) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Your cart is empty" });
        }

        const validatedItems = cartItems.filter(item => {
            const cartItem = cart.items.find(ci => ci.productId._id.toString() === item.productId);
            return cartItem && item.quantity > 0 && item.quantity <= cartItem.productId.stock;
        });

        if (validatedItems.length === 0) {
            return res.status(400).json({ success: false, message: "No valid items in the cart" });
        }

        let calculatedTotal = validatedItems.reduce((total, item) => {
            const productData = cart.items.find(ci => ci.productId._id.toString() === item.productId).productId;
            const price = productData.offerprice || productData.price;
            return total + price * item.quantity;
        }, 0);

        let couponId = null;
        let discountApplied = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true, expirationDate: { $gte: new Date() } });
            if (coupon && !coupon.usedBy.includes(userId)) {
                const applicableAmount = Math.min(calculatedTotal, coupon.maxApplicableAmount || Infinity);
                discountApplied = applicableAmount * (coupon.discountValue / 100);
                calculatedTotal -= discountApplied;
                couponId = coupon._id;
                await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedBy: userId } });
            }
        }

        const priceDiff = Math.abs(calculatedTotal - parseFloat(totalPrice));
        if (priceDiff > 0.01) {
            return res.status(400).json({ success: false, message: "Total price mismatch" });
        }

        const order = new orders({
            userId,
            items: validatedItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                status: "paymentfailed"
            })),
            selectedAddress,
            totalPrice: calculatedTotal,
            paymentMethod,
            couponId,
            discountApplied,
            status: "paymentfailed"
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });
        res.json({ success: true, redirect: "/orderhistory" });
    } catch (error) {
        console.log("Error in checkouterrorpost:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const retryCheckout = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, paymentId, status } = req.body;
        const userId = req.session.user;

        if (!orderId || !status || !['confirmed', 'paymentfailed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }

        const order = await orders.findById(orderId);
        if (!order || order.userId.toString() !== userId) {
            return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
        }

        // Update only if the status is a valid change
        if (order.status !== status) {
            order.razorpayOrderId = razorpayOrderId || order.razorpayOrderId;
            order.paymentId = paymentId || order.paymentId;
            order.status = status;

            order.items.forEach(item => {
                if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                    item.status = status;
                }
            });

            await order.save();
        }

        res.json({ success: true, redirect: status === 'confirmed' ? '/orderhistory?success=true' : '/orderhistory' });
    } catch (error) {
        console.log("Error in retryCheckout:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const order = async (req, res) => {
    try {
        const userId = req.session.user;
        const orderdata = await orders
            .find({ userId })
            .populate("items.productId")
            .populate("couponId");
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/order", { orders: orderdata, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in order:", error);
        res.status(500).send("Internal Server Error");
    }
};

const orderhistory = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            console.log("No userId in session");
            req.flash("error", "Please log in to view your order history");
            return res.redirect("/login");
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const itemsPerPage = ITEMS_PER_PAGE;
        const skip = (page - 1) * itemsPerPage;

        console.log(`Fetching orders for userId: ${userId}, page: ${page}, skip: ${skip}`);

        const totalOrders = await orders.countDocuments({ userId });
        console.log(`Total orders found: ${totalOrders}`);

        const orderdata = await orders
            .find({ userId })
            .populate("items.productId")
            .populate("couponId")
            .sort({ date: -1 })
            .skip(skip)
            .limit(itemsPerPage);
        console.log(`Orders fetched for page ${page}: ${orderdata.length}`);

        const totalPages = Math.ceil(totalOrders / itemsPerPage);
        console.log(`Total pages: ${totalPages}`);

        const categories = await category.find();
        const userData = await User.findById(userId);
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";

        res.render("user/orderhistory", {
            orders: orderdata,
            categories,
            userData,
            userId,
            loggedInUser,
            errorMessage,
            currentPage: page,
            totalPages: totalPages || 1,
            totalOrders,
        });
    } catch (error) {
        console.log("Error in orderhistory:", error);
        res.status(500).send("Internal Server Error");
    }
};

const orderhistoryData = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const orderdata = await orders
            .find({ userId })
            .populate("items.productId")
            .populate("couponId")
            .sort({ date: -1 });
        
        res.json({ success: true, orders: orderdata });
    } catch (error) {
        console.log("Error in orderhistoryData:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { itemId, cancellationReason } = req.body;
        const order = await orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (itemId !== undefined && itemId >= 0 && itemId < order.items.length) {
            order.items[itemId].status = "cancellation-requested";
            order.items[itemId].cancellationReason = cancellationReason;

            const activeItems = order.items.filter(item => item.status !== "cancelled" && item.status !== "cancellation-requested");
            order.status = activeItems.length > 0 ? "confirmed" : "cancellation-requested";

            await order.save();
            res.json({ success: true, message: "Item cancellation requested" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid item index" });
        }
    } catch (error) {
        console.log("Error in cancelOrder:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const initiateReturn = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { itemId, cancellationReason } = req.body;
        const order = await orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (itemId !== undefined && itemId >= 0 && itemId < order.items.length) {
            order.items[itemId].status = "return-requested";
            order.items[itemId].cancellationReason = cancellationReason;

            const activeItems = order.items.filter(item => item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded");
            order.status = activeItems.length > 0 ? "confirmed" : "return-requested";

            await order.save();
            res.json({ success: true, message: "Item return requested" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid item index" });
        }
    } catch (error) {
        console.log("Error in initiateReturn:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const initiateRefund = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { itemId, cancellationReason } = req.body;
        const order = await orders.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (itemId !== undefined && itemId >= 0 && itemId < order.items.length) {
            order.items[itemId].status = "refund-requested";
            order.items[itemId].cancellationReason = cancellationReason;

            const activeItems = order.items.filter(item => item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded");
            order.status = activeItems.length > 0 ? "confirmed" : "refund-requested";

            await order.save();
            res.json({ success: true, message: "Item refund requested" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid item index" });
        }
    } catch (error) {
        console.log("Error in initiateRefund:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const generateInvoice = async (req, res) => {
    try {
        const userId = req.session.user;
        const orderId = req.params.orderId;
        const order = await orders
            .findById(orderId)
            .populate("items.productId")
            .populate("userId");
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        
        // Check if order is cancelled or has any cancelled items
        if (order.status === 'cancelled' || order.items.some(item => item.status === 'cancelled')) {
            return res.status(400).send("Invoice generation not allowed for cancelled orders or items");
        }

        const doc = new PDFDocument();
        let filename = `invoice_${orderId}.pdf`;
        filename = encodeURIComponent(filename);
        res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-type", "application/pdf");
        doc.pipe(res);

        // Invoice header
        doc.fontSize(25).text("Invoice", { align: "center" });
        doc.moveDown();

        // Invoice details
        doc.fontSize(12).text(`Invoice Number: ${order._id}`, { align: "left" });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`, { align: "left" });
        doc.text(`Customer Name: ${order.userId.firstname} ${order.userId.lastname || ''}`, { align: "left" });
        doc.text(`Order Date: ${order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Not Available'}`, { align: "left" });
        doc.moveDown();

        // Order summary
        doc.text("Order Summary:", { underline: true });
        doc.text(`Total Amount: ₹${order.totalPrice.toFixed(2)}`, { align: "left" });
        doc.text(`Payment Method: ${order.paymentMethod}`, { align: "left" });
        doc.text(`Order Status: ${order.status}`, { align: "left" });
        if (order.discountApplied > 0) {
            doc.text(`Discount Applied: ₹${order.discountApplied.toFixed(2)}`, { align: "left" });
        }
        doc.moveDown();

        // Items table
        doc.text("Items:", { underline: true });
        doc.moveDown();
        order.items.forEach((item) => {
            if (item.status !== "cancelled") {
                doc.text(`Product: ${item.productId.name}, Quantity: ${item.quantity}, Unit Price: ₹${(item.productId.offerprice || item.productId.price).toFixed(2)}, Total: ₹${((item.productId.offerprice || item.productId.price) * item.quantity).toFixed(2)}, Status: ${item.status}`, { align: "left" });
            }
        });

        doc.end();
    } catch (error) {
        console.log("Error in generateInvoice:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    home,
    getProductsByCategory,
    forher,
    forhim,
    display,
    checkout,
    checkoutpost,
    checkouterrorpost,
    retryCheckout,
    order,
    orderhistory,
    orderhistoryData,
    cancelOrder,
    initiateReturn,
    initiateRefund,
    generateInvoice,
};