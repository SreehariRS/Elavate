const Cart = require("../models/cart");
const Product = require("../models/product");

// Helper function to get effective maximum quantity for a product
const getEffectiveMaxQuantity = (stock) => {
    return stock < 10 ? stock : 10;
};

const cartView = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) throw new Error("User session not found");
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        const safeCart = cart || { items: [] };
        console.log("Populated cart:", safeCart); // Debug log
        res.render("user/cart", { cart: safeCart, totalPrice: calculateTotalPrice(safeCart) });
    } catch (error) {
        console.error("Cart view error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.query;
        const userId = req.session.user;

        if (!userId) return res.status(401).send("User session not found");
        if (!productId) return res.status(400).send("Product ID is required");

        const productData = await Product.findById(productId);
        if (!productData) return res.status(404).send("Product not found");
        if (productData.deleted) return res.status(404).send("Product not found"); // Check if deleted

        const requestedQuantity = parseInt(quantity, 10);
        const effectiveMaxQuantity = getEffectiveMaxQuantity(productData.stock);

        // Check if requested quantity exceeds available stock
        if (requestedQuantity > productData.stock) {
            return res.status(400).send("Insufficient stock");
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = new Cart({ userId, items: [] });

        const productIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );

        let newQuantity;
        if (productIndex > -1) {
            // Product already exists in cart, add to existing quantity
            newQuantity = cart.items[productIndex].quantity + requestedQuantity;
        } else {
            // New product being added to cart
            newQuantity = requestedQuantity;
        }

        // Check if new total quantity would exceed the effective maximum
        if (newQuantity > effectiveMaxQuantity) {
            const message = productData.stock < 10 
                ? "Maximum stock limit reached." 
                : "Maximum quantity limit of 10 units per product reached.";
            return res.status(400).send(message);
        }

        // Check if new total quantity would exceed available stock
        if (newQuantity > productData.stock) {
            return res.status(400).send("Insufficient stock");
        }

        if (productIndex > -1) {
            cart.items[productIndex].quantity = newQuantity;
        } else {
            cart.items.push({ productId, quantity: requestedQuantity });
        }

        await cart.save();
        res.redirect("/cartView");
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getCartPage = async (req, res) => {
    try {
        const userId = req.params.userId;
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        res.render("user/cart", { cart: cart || { items: [] }, totalPrice: calculateTotalPrice(cart || { items: [] }) });
    } catch (error) {
        console.error("Get cart page error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getcartnumber = async (req, res) => {
    try {
        const userId = req.params.userId;
        const cart = await Cart.findOne({ userId });
        const cartnumber = cart ? cart.items.length : 0;
        res.json({ cartnumber });
    } catch (error) {
        console.error("Get cart number error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Alternative function to get cart count from session
const getCartCountBySession = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.json({ cartnumber: 0 });
        }
        
        const cart = await Cart.findOne({ userId });
        const cartnumber = cart ? cart.items.length : 0;
        res.json({ cartnumber });
    } catch (error) {
        console.error("Get cart count by session error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User session not found" });
        }
        if (!productId || typeof productId !== 'string' || productId.trim() === '') {
            return res.status(400).json({ success: false, message: "Invalid or missing product ID" });
        }
        if (!quantity || isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: "Invalid quantity" });
        }

        const productData = await Product.findById(productId);
        if (!productData) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        if (productData.deleted) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const requestedQuantity = parseInt(quantity, 10);
        const effectiveMaxQuantity = getEffectiveMaxQuantity(productData.stock);

        // Check if requested quantity exceeds effective maximum
        if (requestedQuantity > effectiveMaxQuantity) {
            const message = productData.stock < 10 
                ? "Maximum stock limit reached." 
                : "Maximum quantity limit of 10 units per product reached.";
            return res.status(400).json({ success: false, message });
        }

        // Check if requested quantity exceeds available stock
        if (requestedQuantity > productData.stock) {
            return res.status(400).json({ success: false, message: `Quantity exceeds available stock (${productData.stock})` });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const productIndex = cart.items.findIndex(
            (item) => item.productId && item.productId.toString() === productId
        );
        if (productIndex > -1) {
            cart.items[productIndex].quantity = requestedQuantity;
            await cart.save();
            const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
            res.json({
                success: true,
                cart: updatedCart,
                totalPrice: calculateTotalPrice(updatedCart)
            });
        } else {
            res.status(404).json({ success: false, message: "Product not found in cart" });
        }
    } catch (error) {
        console.error("Update quantity error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.session.user;
        if (!userId) return res.status(401).send("User session not found");

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).send("Cart not found");

        cart.items = cart.items.filter(
            (item) => item.productId && item.productId.toString() !== productId
        );
        await cart.save();
        const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
        res.json({ success: true, cart: updatedCart, totalPrice: calculateTotalPrice(updatedCart) });
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Helper function to calculate total price with robust null checks
const calculateTotalPrice = (cart) => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
        const product = item.productId;
        if (!product || typeof product !== 'object') return total; // Skip if product is null or not an object
        const price = product.offerprice !== undefined && product.offerprice !== null 
            ? product.offerprice 
            : (product.price !== undefined && product.price !== null ? product.price : 0);
        const quantity = item.quantity !== undefined && item.quantity !== null ? item.quantity : 0;
        return total + (price * quantity);
    }, 0);
};

module.exports = {
    cartView,
    addToCart,
    getCartPage,
    getcartnumber,
    getCartCountBySession,
    updateQuantity,
    removeFromCart,
};