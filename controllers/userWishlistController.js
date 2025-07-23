const Wishlist = require("../models/wishlist");
const User = require("../models/usermodel");
const category = require("../models/category");

const wishlistPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const wishlist = await Wishlist.findOne({ userId }).populate("items.productId");
        const categories = await category.find();
        const userData = userId ? await User.findById(userId) : null;
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";
        res.render("user/wishlistPage", {
            wishlist,
            categories,
            userData,
            userId,
            loggedInUser,
            errorMessage,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const wishlistPagePost = async (req, res) => {
    try {
        const userId = req.session.user;
        
        // Get productId from query parameters instead of body
        const { productId, action } = req.query;
        
        console.log("UserId:", userId);
        console.log("ProductId:", productId);
        console.log("Action:", action);
        
        // Validate that productId exists
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }
        
        // Validate that userId exists (user is logged in)
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }
        
        let wishlist = await Wishlist.findOne({ userId });
        
        if (action === 'add') {
            // Create wishlist if it doesn't exist
            if (!wishlist) {
                wishlist = new Wishlist({ userId, items: [] });
            }
            
            // Check if product is already in wishlist
            const existingItem = wishlist.items.find(item => item.productId.toString() === productId);
            
            if (!existingItem) {
                wishlist.items.push({ productId });
                await wishlist.save();
                res.json({ success: true, message: "Product added to wishlist" });
            } else {
                res.json({ success: false, message: "Product already in wishlist" });
            }
        } else if (action === 'remove') {
            if (!wishlist) {
                return res.json({ success: false, message: "Wishlist not found" });
            }
            
            // Remove product from wishlist
            wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
            await wishlist.save();
            res.json({ success: true, message: "Product removed from wishlist" });
        } else {
            res.status(400).json({ success: false, message: "Invalid action" });
        }
        
    } catch (error) {
        console.log("Wishlist error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const wishlistInfo = async (req, res) => {
    try {
        const userId = req.session.user;
        const wishlist = await Wishlist.findOne({ userId }).populate("items.productId");
        res.json({ success: true, wishlist });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const removeProductFromWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId } = req.query;
        
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }
        
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.json({ success: false, message: "Wishlist not found" });
        }
        
        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
        res.json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    wishlistPage,
    wishlistPagePost,
    wishlistInfo,
    removeProductFromWishlist,
};