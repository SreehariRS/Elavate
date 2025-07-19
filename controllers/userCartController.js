const Cart = require("../models/cart");
const product = require("../models/product");

const cartView = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) throw new Error("User session not found");
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        res.render("user/cart", { cart: cart || { items: [] }, totalPrice: calculateTotalPrice(cart) });
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

        const productData = await product.findById(productId);
        if (!productData) return res.status(404).send("Product not found");

        if (productData.stock < parseInt(quantity, 10)) {
            return res.status(400).send("Insufficient stock");
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = new Cart({ userId, items: [] });

        const productIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );
        if (productIndex > -1) {
            cart.items[productIndex].quantity += parseInt(quantity, 10);
        } else {
            cart.items.push({ productId, quantity: parseInt(quantity, 10) });
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
        res.render("user/cart", { cart: cart || { items: [] }, totalPrice: calculateTotalPrice(cart) });
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

const updateQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user;

        if (!userId) return res.status(401).json({ success: false, message: "User session not found" });
        if (!productId || !quantity || isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: "Invalid product ID or quantity" });
        }

        const productData = await product.findById(productId);
        if (!productData) return res.status(404).json({ success: false, message: "Product not found" });

        if (quantity > productData.stock) {
            return res.status(400).json({ success: false, message: "Quantity exceeds available stock" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

        const productIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );
        if (productIndex > -1) {
            cart.items[productIndex].quantity = parseInt(quantity);
            await cart.save();
            const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
            res.json({ success: true, cart: updatedCart, totalPrice: calculateTotalPrice(updatedCart) });
        } else {
            res.status(404).json({ success: false, message: "Product not found in cart" });
        }
    } catch (error) {
        console.error("Update quantity error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
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
            (item) => item.productId.toString() !== productId
        );
        await cart.save();
        const updatedCart = await Cart.findOne({ userId }).populate("items.productId");
        res.json({ success: true, cart: updatedCart, totalPrice: calculateTotalPrice(updatedCart) });
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Helper function to calculate total price
const calculateTotalPrice = (cart) => {
    if (!cart || !cart.items || cart.items.length === 0) return 0;
    return cart.items.reduce((total, item) => {
        const price = item.productId.offerprice || item.productId.price || 0;
        return total + price * item.quantity;
    }, 0);
};

module.exports = {
    cartView,
    addToCart,
    getCartPage,
    getcartnumber,
    updateQuantity,
    removeFromCart,
};