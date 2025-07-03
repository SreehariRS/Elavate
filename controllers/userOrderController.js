const User = require("../models/usermodel");
const orders = require("../models/order");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const product = require("../models/product");
const category = require("../models/category");
const PDFDocument = require("pdfkit");

const ITEMS_PER_PAGE = 10; // Number of orders per page

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
        const products = await product.find({ category: categoryId, deleted: false });
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/home", { products, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in getProductsByCategory:", error);
        res.status(500).send("Internal Server Error");
    }
};

const forher = async (req, res) => {
    try {
        const userId = req.session.user;
        const products = await product.find({ category: "for her", deleted: false });
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/home", { products, categories, userData, userId, loggedInUser, errorMessage });
    } catch (error) {
        console.log("Error in forher:", error);
        res.status(500).send("Internal Server Error");
    }
};

const forhim = async (req, res) => {
    try {
        const userId = req.session.user;
        const products = await product.find({ category: "for him", deleted: false });
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/home", { products, categories, userData, userId, loggedInUser, errorMessage });
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

        // Validate inputs
        if (!selectedAddress || !paymentMethod) {
            req.flash("error", "Please select an address and payment method");
            return res.redirect("/checkout");
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart || cart.items.length === 0) {
            req.flash("error", "Your cart is empty");
            return res.redirect("/checkout");
        }

        // Validate cartItems
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            req.flash("error", "Invalid cart items");
            return res.redirect("/checkout");
        }

        // Verify cart items match server-side cart
        const validatedItems = cartItems.filter(item => {
            const cartItem = cart.items.find(ci => ci.productId._id.toString() === item.productId);
            return cartItem && item.quantity > 0 && item.quantity <= cartItem.productId.stock;
        });

        if (validatedItems.length === 0) {
            req.flash("error", "No valid items in the cart");
            return res.redirect("/checkout");
        }

        let calculatedTotal = validatedItems.reduce((total, item) => {
            const productData = cart.items.find(ci => ci.productId._id.toString() === item.productId).productId;
            const price = productData.offerprice || productData.price;
            return total + price * item.quantity;
        }, 0);

        let couponId = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon && !coupon.usedBy.includes(userId)) {
                calculatedTotal -= (calculatedTotal * (coupon.discountValue / 100));
                couponId = coupon._id;
                await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedBy: userId } });
            }
        }

        if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
            req.flash("error", "Total price mismatch");
            return res.redirect("/checkout");
        }

        const order = new orders({
            userId,
            items: validatedItems,
            selectedAddress,
            totalPrice: calculatedTotal,
            paymentMethod,
            couponId,
            status: paymentMethod === "Razor Pay" ? "confirmed" : "confirmed" // Set to confirmed for non-Razorpay payments
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });
        res.json({ success: true, redirect: "/orderhistory?success=true" }); // Redirect with success flag
    } catch (error) {
        console.log("Error in checkoutpost:", error);
        req.flash("error", "An error occurred during checkout");
        res.redirect("/checkouterror");
    }
};

const checkouterrorpost = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod, couponCode, totalPrice, cartItems, status } = req.body;
        const userId = req.session.user;

        // Validate inputs
        if (!selectedAddress || !paymentMethod) {
            req.flash("error", "Please select an address and payment method");
            return res.redirect("/checkout");
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart || cart.items.length === 0) {
            req.flash("error", "Your cart is empty");
            return res.redirect("/checkout");
        }

        // Validate cartItems
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            req.flash("error", "Invalid cart items");
            return res.redirect("/checkout");
        }

        // Verify cart items match server-side cart
        const validatedItems = cartItems.filter(item => {
            const cartItem = cart.items.find(ci => ci.productId._id.toString() === item.productId);
            return cartItem && item.quantity > 0 && item.quantity <= cartItem.productId.stock;
        });

        if (validatedItems.length === 0) {
            req.flash("error", "No valid items in the cart");
            return res.redirect("/checkout");
        }

        let calculatedTotal = validatedItems.reduce((total, item) => {
            const productData = cart.items.find(ci => ci.productId._id.toString() === item.productId).productId;
            const price = productData.offerprice || productData.price;
            return total + price * item.quantity;
        }, 0);

        let couponId = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
            if (coupon && !coupon.usedBy.includes(userId)) {
                calculatedTotal -= (calculatedTotal * (coupon.discountValue / 100));
                couponId = coupon._id;
                await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedBy: userId } });
            }
        }

        const order = new orders({
            userId,
            items: validatedItems,
            selectedAddress,
            totalPrice: calculatedTotal,
            paymentMethod,
            couponId,
            status: "paymentfailed" // Set to paymentfailed for failed payments
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });
        res.json({ success: true, redirect: "/orderhistory" });
    } catch (error) {
        console.log("Error in checkouterrorpost:", error);
        res.status(500).send("Internal Server Error");
    }
};

const retryCheckout = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, paymentId, status } = req.body;
        const userId = req.session.user;

        // Validate inputs
        if (!orderId || !status || !['confirmed', 'paymentfailed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }

        const order = await orders.findById(orderId);
        if (!order || order.userId.toString() !== userId) {
            return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
        }

        // Update order fields
        order.razorpayOrderId = razorpayOrderId || order.razorpayOrderId;
        order.paymentId = paymentId || order.paymentId;
        order.status = status; // Set to confirmed for successful payments

        await order.save();
        res.json({ success: true, redirect: "/orderhistory?success=true" }); // Redirect with success flag
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

        // Debug: Log userId and page
        console.log(`Fetching orders for userId: ${userId}, page: ${page}, skip: ${skip}`);

        // Get total number of orders
        const totalOrders = await orders.countDocuments({ userId });
        console.log(`Total orders found: ${totalOrders}`);

        // Fetch paginated orders
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
        const { cancellationReason } = req.body;
        await orders.findByIdAndUpdate(orderId, {
            status: "cancellation-requested",
            cancellationReason,
        });
        res.json({ success: true });
    } catch (error) {
        console.log("Error in cancelOrder:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const initiateReturn = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { cancellationReason } = req.body;
        await orders.findByIdAndUpdate(orderId, {
            status: "return-requested",
            cancellationReason,
        });
        res.json({ success: true });
    } catch (error) {
        console.log("Error in initiateReturn:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const initiateRefund = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { cancellationReason } = req.body;
        await orders.findByIdAndUpdate(orderId, {
            status: "refund-requested",
            cancellationReason,
        });
        res.json({ success: true });
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
        const doc = new PDFDocument();
        let filename = `invoice_${orderId}.pdf`;
        filename = encodeURIComponent(filename);
        res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-type", "application/pdf");
        doc.pipe(res);
        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(14).text(`Order ID: ${order._id}`);
        doc.text(`User: ${order.userId.firstname}`);
        doc.text(`Total Price: ${order.totalPrice}`);
        doc.text(`Status: ${order.status}`);
        doc.moveDown();
        doc.text("Items:");
        order.items.forEach((item) => {
            doc.text(`Product: ${item.productId.name}, Quantity: ${item.quantity}`);
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