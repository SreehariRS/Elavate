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
        res.render("user/wishlistPage", { // Updated from 'user/wishlist' to 'user/wishlistPage'
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
        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId, items: [] });
        }
        if (!wishlist.items.some(item => item.productId.toString() === productId)) {
            wishlist.items.push({ productId });
            await wishlist.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Product already in wishlist" });
        }
    } catch (error) {
        console.log(error);
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
        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            return res.json({ success: false, message: "Wishlist not found" });
        }
        wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
        await wishlist.save();
        res.json({ success: true });
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