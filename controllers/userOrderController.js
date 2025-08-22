const User = require("../models/usermodel");
const orders = require("../models/order");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const product = require("../models/product");
const category = require("../models/category");
const Wallet = require("../models/wallet");
const PDFDocument = require("pdfkit");
const { checkPaymentLock, releasePaymentLock } = require("../controllers/userPaymentController");

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

        // Check payment lock for non-COD payments
        if (paymentMethod !== "Cash On Delivery") {
            const isLocked = await checkPaymentLock(userId);
            if (isLocked) {
                return res.status(423).json({ 
                    success: false, 
                    message: "Another payment is currently being processed. Please wait for it to complete or try again later."
                });
            }
        }

        // Log incoming data for debugging
        console.log("Checkout POST data:", { selectedAddress, paymentMethod, couponCode, totalPrice, cartItems });

        // Validate inputs
        if (!selectedAddress || !paymentMethod || !totalPrice || !cartItems) {
            await releasePaymentLock(userId); // Release lock on validation failure
            return res.status(400).json({ success: false, message: "Missing required fields (address, payment method, total price, or cart items)" });
        }

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if (!cart || cart.items.length === 0) {
            await releasePaymentLock(userId); // Release lock if cart is empty
            return res.status(400).json({ success: false, message: "Your cart is empty" });
        }

        // Validate cartItems
        if (!Array.isArray(cartItems) || cartItems.length === 0) {
            await releasePaymentLock(userId); // Release lock on invalid cart items
            return res.status(400).json({ success: false, message: "Invalid or empty cart items" });
        }

        // Verify cart items match server-side cart
        const validatedItems = cartItems.filter(item => {
            const cartItem = cart.items.find(ci => ci.productId._id.toString() === item.productId);
            return cartItem && item.quantity > 0 && item.quantity <= cartItem.productId.stock;
        });

        if (validatedItems.length === 0) {
            await releasePaymentLock(userId); // Release lock if no valid items
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
                let discount = calculatedTotal * (coupon.discountValue / 100);
                if (discount > coupon.maxApplicableAmount && coupon.maxApplicableAmount !== Infinity) {
                    discount = coupon.maxApplicableAmount;
                }
                discountApplied = discount;
                calculatedTotal -= discountApplied;
                couponId = coupon._id;
                await Coupon.findByIdAndUpdate(coupon._id, { $addToSet: { usedBy: userId } });
            } else {
                await releasePaymentLock(userId); // Release lock on invalid coupon
                return res.status(400).json({ success: false, message: "Invalid or already used coupon" });
            }
        }

        // Validate totalPrice match with calculatedTotal 
        const priceDiff = Math.abs(calculatedTotal - parseFloat(totalPrice));
        if (priceDiff > 0.01) {
            console.log(`Price mismatch: calculatedTotal=${calculatedTotal}, totalPrice=${totalPrice}, difference=${priceDiff}`);
            await releasePaymentLock(userId); // Release lock on price mismatch
            return res.status(400).json({ success: false, message: "Total price mismatch between client and server" });
        }

        // Handle COD limit
        if (paymentMethod === "Cash On Delivery" && calculatedTotal > 1000) {
            await releasePaymentLock(userId); // Release lock on COD limit exceeded
            return res.status(400).json({ success: false, message: "Cash on Delivery is not available for amounts over ₹1000" });
        }

        // Handle wallet payment deduction
        let orderStatus = paymentMethod === "Razor Pay" ? "confirmed" : "confirmed";
        if (paymentMethod === "wallet") {
            const lockAcquired = await acquirePaymentLock(userId, 'checkout', req.session.id);
            if (!lockAcquired) {
                await releasePaymentLock(userId); // Release lock if acquisition fails
                return res.status(423).json({ 
                    success: false, 
                    message: "Another payment is currently being processed. Please try again later."
                });
            }

            let wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                wallet = new Wallet({ userId, balance: 0, transactions: [] });
            }

            if (wallet.balance < calculatedTotal) {
                await releasePaymentLock(userId); // Release lock on insufficient balance
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
            
            // Release lock after successful wallet transaction
            await releasePaymentLock(userId);
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
            status: orderStatus,
            razorpayOrderId: paymentMethod === "Razor Pay" ? req.body.razorpayOrderId : null
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });

        const redirectUrl = paymentMethod === "Razor Pay" ? "/order" : "/orderhistory?success=true";
        res.json({ success: true, redirect: redirectUrl });
    } catch (error) {
        console.log("Error in checkoutpost:", error);
        // Release lock on any error
        if (req.session.user) {
            await releasePaymentLock(req.session.user);
        }
        res.status(500).json({ success: false, message: "An error occurred during checkout" });
    }
};

const checkouterrorpost = async (req, res) => {
    try {
        const { selectedAddress, paymentMethod, couponCode, totalPrice, cartItems, status } = req.body;
        const userId = req.session.user;

        // Release lock immediately to allow new orders
        await releasePaymentLock(userId);

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
                let discount = calculatedTotal * (coupon.discountValue / 100);
                if (discount > coupon.maxApplicableAmount && coupon.maxApplicableAmount !== Infinity) {
                    discount = coupon.maxApplicableAmount;
                }
                discountApplied = discount;
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
            status: "paymentfailed",
            razorpayOrderId: req.body.razorpayOrderId || null
        });

        await order.save();
        await Cart.findOneAndUpdate({ userId }, { items: [] });
        res.json({ success: true, redirect: "/orderhistory" });
    } catch (error) {
        console.log("Error in checkouterrorpost:", error);
        // Release lock on any error
        if (req.session.user) {
            await releasePaymentLock(req.session.user);
        }
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const retryCheckout = async (req, res) => {
    try {
        const { orderId, razorpayOrderId, paymentId, status } = req.body;
        const userId = req.session.user;

        // Always release payment lock when retrying checkout
        await releasePaymentLock(userId);

        if (!orderId || !status || !['confirmed', 'paymentfailed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }

        const order = await orders.findById(orderId);
        if (!order || order.userId.toString() !== userId) {
            return res.status(404).json({ success: false, message: "Order not found or unauthorized" });
        }

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
        // Release lock on error
        if (req.session.user) {
            await releasePaymentLock(req.session.user);
        }
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
            // Individual item cancellation
            if (order.items[itemId].status === "cancelled" || order.items[itemId].status === "returned" || order.items[itemId].status === "refunded") {
                return res.status(400).json({ success: false, message: "Item is already cancelled, returned, or refunded" });
            }
            order.items[itemId].status = "cancellation-requested";
            order.items[itemId].cancellationReason = cancellationReason;

            const activeItems = order.items.filter(item => item.status !== "cancelled" && item.status !== "cancellation-requested" && item.status !== "returned" && item.status !== "refunded");
            order.status = activeItems.length > 0 ? "confirmed" : "cancellation-requested";
        } else {
            // Full order cancellation
            if (order.status === "cancelled" || order.status === "returned" || order.status === "refunded") {
                return res.status(400).json({ success: false, message: "Order is already cancelled, returned, or refunded" });
            }
            order.items.forEach(item => {
                if (item.status !== "cancelled" && item.status !== "returned" && item.status !== "refunded") {
                    item.status = "cancellation-requested";
                    item.cancellationReason = cancellationReason;
                }
            });
            order.status = "cancellation-requested";
            order.cancellationReason = cancellationReason;
        }

        await order.save();
        res.json({ success: true, message: itemId !== undefined ? "Item cancellation requested" : "Order cancellation requested" });
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

        if (order.status === 'cancelled' || order.items.some(item => item.status === 'cancelled')) {
            return res.status(400).send("Invoice generation not allowed for cancelled orders or items");
        }

        const doc = new PDFDocument({ margin: 40 });
        let filename = `invoice_${String(order._id).slice(-8)}.pdf`;
        filename = encodeURIComponent(filename);
        res.setHeader("Content-disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-type", "application/pdf");
        doc.pipe(res);

        const colors = {
            primary: '#1e40af',
            secondary: '#64748b',
            accent: '#10b981',
            text: '#1f2937',
            muted: '#9ca3af',
            background: '#f3f4f6'
        };

        doc.font('Helvetica-Bold')
           .fontSize(32)
           .fillColor(colors.primary)
           .text("ELAVATE", 50, 40, { align: "left" });
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.muted)
           .text("123 Business Street, Kochi, State 12345", 50, 80)
           .text("Premium Perfume E-commerce", 50, 95);

        doc.font('Helvetica-Bold')
           .fontSize(24)
           .fillColor(colors.primary)
           .text("INVOICE", 0, 40, { align: "right" });

        doc.moveTo(50, 120)
           .lineTo(550, 120)
           .lineWidth(1)
           .strokeColor(colors.background)
           .stroke();

        const leftColumnX = 50;
        const rightColumnX = 300;
        const currentY = 140;

        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor(colors.secondary)
           .text("INVOICE DETAILS", leftColumnX, currentY);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.text)
           .text(`Invoice Number: INV-${String(order._id).slice(-8)}`, leftColumnX, currentY + 20)
           .text(`Order Reference: ORD-${String(order._id).slice(-6)}`, leftColumnX, doc.y + 15)
           .text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`, leftColumnX, doc.y + 15)
           .text(`Order Date: ${order.date ? new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Not Available'}`, leftColumnX, doc.y + 15);

        doc.font('Helvetica-Bold')
           .fontSize(11)
           .fillColor(colors.secondary)
           .text("BILL TO", rightColumnX, currentY);
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.text)
           .text(`${order.userId.firstname} ${order.userId.lastname || ''}`, rightColumnX, currentY + 20)
           .text(`Email: ${order.userId.email || 'Not provided'}`, rightColumnX, doc.y + 15);

        if (order.selectedAddress) {
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor(colors.secondary)
               .text("SHIPPING ADDRESS", rightColumnX, doc.y + 25);
            doc.font('Helvetica')
               .fontSize(10)
               .fillColor(colors.text)
               .text(order.selectedAddress, rightColumnX, doc.y + 15, { width: 200 });
        }

        doc.moveDown(2);
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(colors.primary)
           .text("ORDER SUMMARY");
        
        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.text);
        
        const summaryY = doc.y + 15;
        doc.text(`Payment Method: ${order.paymentMethod}`, leftColumnX, summaryY)
           .text(`Order Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, leftColumnX, doc.y + 15);

        const subtotal = order.items.reduce((acc, item) => {
            if (item.status !== 'cancelled') {
                return acc + (item.productId.offerprice || item.productId.price) * item.quantity;
            }
            return acc;
        }, 0);

        const discountAmount = subtotal - order.totalPrice;

        doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, rightColumnX, summaryY);
        if (discountAmount > 0) {
            doc.fillColor(colors.accent)
               .text(`Discount: -₹${discountAmount.toFixed(2)}`, rightColumnX, doc.y + 15);
            doc.fillColor(colors.text);
        }
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .fillColor(colors.primary)
           .text(`Total Amount: ₹${order.totalPrice.toFixed(2)}`, rightColumnX, doc.y + 15);

        doc.moveDown(2);
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(colors.primary)
           .text("ITEMS ORDERED");

        const tableTop = doc.y + 15;
        const tableLeft = 50;

        doc.rect(tableLeft, tableTop - 5, 500, 25)
           .fillAndStroke(colors.background, colors.background);
        
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor(colors.text)
           .text("PRODUCT NAME", tableLeft + 10, tableTop + 5, { width: 180 })
           .text("QTY", tableLeft + 200, tableTop + 5, { width: 40 })
           .text("UNIT PRICE", tableLeft + 250, tableTop + 5, { width: 80 })
           .text("TOTAL", tableLeft + 340, tableTop + 5, { width: 80 })
           .text("STATUS", tableLeft + 430, tableTop + 5, { width: 60 });

        let yPosition = tableTop + 30;
        const totalDiscountAmount = subtotal - order.totalPrice;
        const discountPercentage = subtotal > 0 ? (totalDiscountAmount / subtotal) : 0;

        order.items.forEach((item, index) => {
            if (item.status !== "cancelled") {
                const unitPrice = item.productId.offerprice || item.productId.price;
                const itemTotalBeforeDiscount = unitPrice * item.quantity;
                const itemDiscount = itemTotalBeforeDiscount * discountPercentage;
                const itemTotalAfterDiscount = itemTotalBeforeDiscount - itemDiscount;

                doc.rect(tableLeft, yPosition - 5, 500, 25)
                   .fillAndStroke(index % 2 === 0 ? '#ffffff' : '#fafafa', colors.background);

                doc.font('Helvetica')
                   .fontSize(9)
                   .fillColor(colors.text)
                   .text(item.productId.name, tableLeft + 10, yPosition + 5, { width: 175 })
                   .text(item.quantity.toString(), tableLeft + 200, yPosition + 5, { width: 40 })
                   .text(`₹${unitPrice.toFixed(2)}`, tableLeft + 250, yPosition + 5, { width: 80 })
                   .text(`₹${itemTotalAfterDiscount.toFixed(2)}`, tableLeft + 340, yPosition + 5, { width: 80 })
                   .text(item.status.charAt(0).toUpperCase() + item.status.slice(1), tableLeft + 430, yPosition + 5, { width: 60 });

                yPosition += 25;
            }
        });

        doc.y = yPosition + 30;
        doc.moveTo(50, doc.y)
           .lineTo(550, doc.y)
           .strokeColor(colors.background)
           .stroke();

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor(colors.muted)
           .text("Thank you for shopping with Elavate!", 0, doc.y + 20, { align: "center" })
           .text("Contact support@elavate.com for any queries.", 0, doc.y + 15, { align: "center" })
           .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 0, doc.y + 15, { align: "center" });

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