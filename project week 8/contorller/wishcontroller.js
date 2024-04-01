// const express = require("express");
// const router = express();
// const User = require("../models/usermodel");
// const mongoose = require("../config/dbconnect");
// const nodemailer = require("nodemailer");
// const bcrypt = require("bcrypt");
// const otp = require("../models/otp");
// const { render } = require("ejs");
// const product = require("../models/product");
// const Cart = require("../models/cart");
// const Category = require("../models/category");
// const collection1 = require("../models/usermodel"); //conecting mongodb to make collection1
// const db = require("../models/product");
// const orders = require("../models/order")
// const Swal = require('sweetalert2');
// const flash = require('connect-flash');
// const otpgenerator =require('otp-generator')
// const Address = require('../models/address')
// const wishlist = require('../models/wishlist');

// const wishlistPage = async (req, res) => {
//     try {
//       const user = req.session.user;
//       const userData = await collection1.findOne({ email: user });
//       const userId = userData._id.valueOf();
  
//       // Fetch the wishlist for the user
//       const userWishlist = await wishlist.findOne({ userId }).populate('items.productId');
//   console.log(userWishlist);
//       // Render the wishlistPage view with the wishlist data
//       res.render("user/wishlistPage", { wishlist: userWishlist });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   };
//   const wishlistPagePost = async (req, res) => {
//     try {
//       const { productId, isFilled } = req.body;
//       const user = req.session.user;
//       const userData = await collection1.findOne({ email: user });
//       const userId = userData._id.valueOf();
  
//       const wishlistItem = { productId: productId };
//   console.log(wishlistItem);
//       if (isFilled) {
//         console.log("if");
//         // Remove the product from the wishlist
//         await wishlist.updateOne({ userId }, { $pull: { items: wishlistItem } });
//         res.json({ success: true, message: 'Product removed from wishlist' });
//       } else {
//         // Check if the product already exists in the user's wishlist
//         console.log("else");
//         const existingWishlist = await wishlist.updateOne(
//           { userId },
//           { $addToSet: { items: wishlistItem } }, // Use $addToSet instead of $push
//           { upsert: true } // Add this option to create the wishlist if it doesn't exist
//         );
       
  
//         if (existingWishlist) {
//           // Product already exists, handle duplicate case (e.g., remove or keep)
//           return res.status(409).json({ error: 'Product already in wishlist' });
//         }
  
//         // Add the product to the wishlist
//         await wishlist.updateOne({ userId }, { $push: { items: wishlistItem } });
//         res.json({ success: true, message: 'Product added to wishlist' });
//       }
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   };
  

//   const wishlistInfo = async (req, res) => {
//     try {
//       const { productId } = req.query;
//       const user = req.session.user; // Assuming you have user authentication middleware
//       const userData = await collection1.findOne({ email: user });
//       const userId = userData._id.valueOf();
  
//       // Check if the product already exists in the user's wishlist
//       const existingWishlist = await wishlist.findOne({ userId, 'items.productId': productId });
  
//       // Respond with JSON indicating whether the product is in the wishlist
//       res.json({ isInWishlist: !!existingWishlist });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   };

//   const removeProductFromWishlist = async (req, res) => {
//     try {
//       const { productId } = req.body;
//       const user = req.session.user;
//       const userData = await collection1.findOne({ email: user });
//       const userId = userData._id.valueOf();
  
//       // Remove the product from the wishlist
//       await wishlist.updateOne({ userId }, { $pull: { items: { productId: productId } } });
  
//       res.json({ success: true, message: 'Product removed from wishlist' });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   };

//   module.exports ={wishlistPage ,wishlistPagePost ,wishlistInfo ,removeProductFromWishlist}