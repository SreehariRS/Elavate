const express = require("express");
const router = express();
const User = require("../models/usermodel");
const mongoose = require("../config/dbconnect");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const otp = require("../models/otp");
const { render } = require("ejs");
const product = require("../models/product");
const Cart = require("../models/cart");
const Category = require("../models/category");
const collection1 = require("../models/usermodel"); //conecting mongodb to make collection1
const db = require("../models/product");
const orders = require("../models/order");
const Swal = require("sweetalert2");
const flash = require("connect-flash");
const otpgenerator = require("otp-generator");
const Address = require("../models/address");
const wishlist = require("../models/wishlist");
const AdminCoupon = require("../models/coupon");
const Razorpay = require("razorpay");
const Wallet = require("../models/wallet");
const PDFDocument = require("pdfkit");

// Your other code here...

require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const getHome = async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        var errorMessage = req.flash("errorMessage");
        const products = await product.find();

        const userId = loggedInUser ? loggedInUser.id : null; // Assuming the user object has an 'id' property
        res.render("user/home", { products, loggedInUser, userId, errorMessage: errorMessage }); // Pass 'products', 'loggedInUser', and 'userId' to the template
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const home = async (req, res) => {
    try {
        const loggedInUser = req.session.user;
        console.log("loggedInUser", loggedInUser);
        const userData = await User.findById(loggedInUser);
        console.log("sjhgdhjs", userData);
        var errorMessage = req.flash("errorMessage");
        let sortOption = req.query.sort || "";
        let sortCriteria = {};

        if (sortOption === "AZ") {
            sortCriteria = { name: 1 };
        } else if (sortOption === "ZA") {
            sortCriteria = { name: -1 };
        }

        const wishlistData = await wishlist.findOne({ userId: loggedInUser }).populate("items.productId");
        console.log("wishlist1", wishlistData);
        const products = await product.find().sort(sortCriteria);
        const userId = loggedInUser ? loggedInUser.id : null;
        const categories = await Category.find(); // Assuming Category is your model

        res.render("user/home", { products, loggedInUser, userId, errorMessage, wishlistData, userData, categories });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const catid = req.params.id;
        const loggedInUser = req.session.user;
        const userData = req.session.userData;
        const category = await Category.findById(catid);
        if (!category) {
            return res.status(404).send("Category not found");
        }
        console.log("catagery id",catid);
        const products = await product.find({ category: category.name });

        console.log("product kanu",products);
        // Fetch all categories to pass to the nav.ejs template
        const categories = await Category.find({});

        // Render the user/category view with products, category, and categories
        res.render("user/category", { products, category, categories, userData, loggedInUser, userId: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

const forhim = async (req, res) => {
    try {
        const products = await product.find({ category: "forhim" });

        const loggedInUser = req.session.user;
        const userData = req.session.userData;

        // Pass both userId and userData to the template
        res.render("user/forhim", { products, userId: req.session.user, userData, loggedInUser });
    } catch (error) {
        console.error("Error fetching products for 'forhim' category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const forher = async (req, res) => {
    try {
        const products = await product.find({ category: "forher" });
        const userData = req.session.userData;
        const loggedInUser = req.session.user;

        // Pass the userId to the template for any necessary client-side functionality
        res.render("user/forher", { products, userId: req.session.user, userData, loggedInUser });
    } catch (error) {
        console.error("Error fetching products for 'forher' category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const display = async (req, res) => {
    const productId = req.params.id;
    try {
        // Fetch product data
        console.log("Fetching product details...");
        const productDetails = await product.findById(productId);

        // Check if product exists
        if (!productDetails) {
            // Handle scenario where product is not found
            return res.status(404).send("Product not found");
        }

        // Retrieve logged-in user email from session
        const loggedInUserEmail = req.session.user;
        console.log("userDAta in session", loggedInUserEmail);
        // Fetch user details based on email
        const loggedInUser = await collection1.findOne({ email: loggedInUserEmail });

        // Debugging: Check product and logged-in user data
        console.log("Product:", productDetails);
        console.log("Logged-in user:", loggedInUser);

        // Render product details view with product and logged-in user data
        res.render("user/productdetails", { products: productDetails, loggedInUserEmail });
    } catch (error) {
        // Handle errors
        console.error("Error:", error);
        res.status(500).send("An error occurred while fetching product details.");
    }
};
//.............................................................
// exports.landingpage = async(req,res)=>{

//     try{
//       console.log("Working");
//       const name = await Category.find({},{name:1,_id:0});
//       console.log(name);
//       const productdatadetails = await db.find();
//       console.log("productdatadetails" + productdatadetails.length)
//       let User = req.session.user
//       res.render("user/landingpage.ejs", {productdatadetails, name})//cheking if there is any session
//     }
//     catch(error){
//       console.log(error);
//     }
//   }
// //............................
const getLogin = (req, res) => {
    if (req.session.user) {
        res.redirect("/");
    } else {
        let message;
        res.render("user/userlogin", { message });
    }
};

const getRegister = (req, res) => {
    res.render("user/usersignin");
};

const getLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.redirect("/login");
        }
    });
};

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            // If user is not found, render login page with error message
            return res.render("user/userlogin", { message: "User Not Exists" });
            // return res.status(400).json({ message: 'Email not found' });
        }

        if (user.isBlocked) {
            return res.render("user/userlogin", { message: "You are blocked by admin" });
        }

        // Compare passwords
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            // If passwords don't match, render login page with error message
            return res.render("user/userlogin", { message: "Incorrect Password" });
        }

        // Store user's ID in session
        req.session.user = user._id;

        // Redirect to home page after successful login
        res.redirect("/"); // Redirect to home page
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.redirect("/login");
    });
};

// Assuming mailsender is defined above postRegister function in the same file
const postRegister = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("user/usersignin", { message: "User Already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const data = {
          firstname: name,
            email,
            password: hashedPassword, // Store the hashed password
            referredCode: req.body.referralCode,
        };
        req.session.data = data;
        console.log(data);
        const existinguser = await collection1.findOne({ email: data.email });

        if (existinguser) {
            res.send("This account already exists");
            return;
        }

        mailsender(data);

        res.render("user/otp");
    } catch (error) {
        console.error("Error in signuppost:", error);
        res.status(500).send("Internal Server Error");
    }
};

const checkReferralCode = async (req, res) => {
    const { referralCode } = req.body;
    console.log(referralCode);
    if (!referralCode) {
        return res.status(400).json({ isValid: false, message: "Referral code is required." });
    }

    try {
        // Use the collectiontrylogs model to find a user based on the referral code
        const user = await collection1.findOne({ referralCode: referralCode });
        console.log("user", user);
        if (user) {
            return res.json({ isValid: true, message: "Referral code is valid." });
        } else {
            return res.json({ isValid: false, message: "Invalid referral code." });
        }
    } catch (error) {
        console.error("Error checking referral code:", error);
        return res.status(500).json({ isValid: false, message: "Internal server error." });
    }
};

let genotp = () => {
    return otpgenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
};

const mailsender = async (data) => {
    const generatedOTP = genotp();
    console.log(generatedOTP);
    const otpDocument = new otp({
        email: data.email,
        otp: generatedOTP,
    });

    try {
        await otpDocument.save();
        // Send the email with the generated OTP
        transporter.sendMail(
            {
                from: process.env.EMAIL_ADDRESS,
                to: data.email,
                subject: "OTP Verification",
                text: "Verify Your Email Using the OTP",
                html: `<h3>Verify Your Email Using this OTP: ${generatedOTP}</h3>`,
            },
            (err, info) => {
                if (err) {
                    console.log("Error sending email:", err);
                } else {
                    console.log("Email sent successfully. Message ID:", info.messageId);
                }
            }
        );
    } catch (error) {
        console.error("Error saving OTP to the database:", error);
    }
};

// In your backend code (usercontroller.js)
const resendotp = (req, res) => {
    mailsender(req.session.data);
};

const otpvalidation = async (req, res) => {
    try {
        const latestOtp = await otp.findOne({}).sort({ _id: -1 }).limit(1);

        const otpValue = req.body.otp;
        console.log(otpValue);

        if (latestOtp.otp == otpValue) {
            console.log(req.session.data);

            // Save the new user data without the referralCode
            const newUser = new collection1({
                firstname: req.session.data.firstname,
                email: req.session.data.email,
                password: req.session.data.password,
                referredCode: req.session.data.referredCode,
            });

            await newUser.save();

            // Assuming Wallet model has a field called 'balance'
            const newUserWallet = new Wallet({
                userId: newUser._id,
                balance: 50, // Set the initial balance for the new user
            });

            await newUserWallet.save();

            // Send success response
            res.json({ success: true, message: "OTP verification successful" });
        } else {
            // Send error response
            res.status(400).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error(error);
        // Send error response in case of an exception
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
const getOtp = (req, res) => {
    const message = req.session.message; // Assuming message is stored in the session
    res.render("user/otp", { message }); // Pass message to the template
};

const postLogout = (req, res) => {
    req.session.user = null;
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.redirect("/login");
        }
    });
};

const changepass = (req, res) => {
    res.render("user/changepass", {}); // Passing an empty object to ensure 'error' is defined
};

const changepasspost = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user;

        // Retrieve user from the database
        const user = await User.findById(userId);

        // Check if the current password provided by the user matches the stored hashed password
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordMatch) {
            return res.render("user/changepass", { error: "Incorrect current password" });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.render("user/changepass", { error: "New password and confirm password do not match" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Redirect the user to the change password page with a success message
        return res.render("user/changepass", { successMessage: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        return res.render("user/changepass", { wrong: "An error occurred while changing the password" });
    }
};

const forgotpassword = (req, res) => {
    res.render("user/forgotpassword");
};

const forgotpasswordpost = async (req, res) => {
    const email = req.body.email;
    //req.session.data = email;

    try {
        req.session.otpemail = req.body.email;
        // Check if the email exists in the database
        const user = await collection1.findOne({ email });
        console.log(user);
        if (!user) {
            // If the email is not found in the database, render the forgot password form with an error message
            return res.render("user/forgotpassword", { errorMessage: "Email not found" });
        }

        // Generate and send OTP
        mailsender({ email: user.email, session: req.session });

        // Render the OTP verification page
        res.render("user/otpforgot");
    } catch (error) {
        // Handle any errors that occur during database interaction
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const verifyforgototp = async (req, res) => {
    try {
        const enteredOTP = req.body.otp;
        console.log("enteredOTP");
        console.log(enteredOTP);
        // Find the latest OTP for the given email
        const latestOTP = await otp.findOne({}).sort({ _id: -1 }).limit(1);

        if (!latestOTP) {
            // If no OTP is found, send an error response
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        console.log("latestOTP");
        console.log(latestOTP.otp);
        if (latestOTP.otp == enteredOTP) {
            // Send success response
            return res.json({ success: true, message: "OTP verification successful" });
        } else {
            // If OTP is invalid, send an error response
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        // Handle any errors that occur during OTP validation
        console.error(error);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

const resendforgototp = async (req, res) => {
    try {

        // Retrieve the email from the session
        const email = req.session.otpemail;
        console.log("email", email);

        if (!email) {
            // Handle the case where the email is not available in the session
            console.error("Email not found in session");
            return res.status(400).render("user/otpforgot", { errorMessage: "Email not found in session" });
        }

        // Call mailsender with the correct email
        await mailsender({ email });


        // Render the existing page again
        res.render("user/otpforgot");
    } catch (error) {
        console.error(error);
        res.status(500).render("user/otpforgot", { errorMessage: "Internal Server Error" });
    }
};

const changeCpassword = (req, res) => {
    console.log("ChangePASSS");
    res.render("user/changeCpassword");
};

const changepasswordpost = async (req, res) => {
    const newPassword = req.body.password;

    try {
        // Find the user by some identifier (e.g., email or user ID)
        const user = await collection1.findOne({ email: req.session.otpemail });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password field with the hashed password
        user.password = hashedPassword;

        // Save the updated user to the database
        await user.save();

        // Redirect to the OTP page or send a success message
        // res.redirect('/otpget');
        res.redirect("/getRegister");
        // res.render("user/otp.ejs");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const cartView = async (req, res) => {
    try {
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId });
        const validProducts = await Promise.all(
            cart.items.map(async (item) => {
                const productDetails = await db.findById(item.productId);

                if (!productDetails) {
                    console.error(`Product not found for productId: ${item.productId}`);
                    return null;
                }

                const maxStock = productDetails.stock;
                return { productDetails, quantity: item.quantity, maxStock };
            })
        );

        const cartItems = validProducts.filter((product) => product !== null);

        const totalPrice = cartItems.reduce((acc, item) => {
            return acc + item.productDetails.price * item.quantity;
        }, 0);

        res.render("user/cart", { cart: cartItems, totalPrice, userId });
    } catch (error) {
        console.log(error);
    }
};

const addToCart = async (req, res) => {
    try {
        const productId = req.query.productId;
        const quantity = req.query.quantity;
        const userId = req.session.user;

        console.log("PRODUCT ID:", productId, "QUANTITY:", quantity, "USER ID:", userId);

        // Check if the product exists
        const product = await db.findById(productId);
        if (!product) {
            return res.status(400).json({ error: "Product not found" });
        }

        // Check if product stock is 0
        if (product.stock === 0) {
            // Display SweetAlert indicating that the product is out of stock
            req.flash("errorMessage", "out of stock");
            return res.redirect("/");
        }

        // Find the user based on the userId
        const user = await collection1.findOne({ _id: userId });
        if (!user) {
            // If the user is not found, redirect to the login page
            return res.redirect("/login");
        }

        console.log("USER FOUND IN DATABASE:", user);

        // Check if the user already has a cart
        let cart = await Cart.findOne({ userId: user._id });
        if (!cart) {
            // If the user doesn't have a cart, create a new one
            cart = new Cart({
                userId: user._id,
                items: [],
            });
        }

        // Check if the product is already in the cart
        const existingItemIndex = cart.items.findIndex((item) => item.productId.equals(productId));
        if (existingItemIndex !== -1) {
            // If the product is already in the cart, update the quantity
            cart.items[existingItemIndex].quantity += parseInt(quantity, 10);
        } else {
            // Otherwise, add the product to the cart
            cart.items.push({
                productId,
                quantity: parseInt(quantity, 10),
            });
        }

        // Save the cart
        await cart.save();

        // Redirect to the cart page
        res.redirect(`/getcart/${user._id}`);
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getcartnumber = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("USERID" + userId);

        if (!userId) {
            // Handle the case where userId is not present
            return res.redirect("/login");
        }

        // Fetch the cart data based on the user ID (assuming you have user authentication)
        const cart = await Cart.findOne({ userId }).populate("items.productId");
        res.json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const getCartPage = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.redirect("/login");
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            // Render the cart page with an empty cart if no cart is found
            return res.render("user/cart", { cart: [], totalPrice: 0, userId });
        }

        const validProducts = await Promise.all(
            cart.items.map(async (item) => {
                const productDetails = await db.findById(item.productId);

                if (!productDetails) {
                    console.error(`Product not found for productId: ${item.productId}`);
                    return null;
                }

                const maxStock = productDetails.stock;
                return { productDetails, quantity: item.quantity, maxStock };
            })
        );

        const cartItems = validProducts.filter((product) => product !== null);

        const totalPrice = cartItems.reduce((acc, item) => {
            return acc + item.productDetails.price * item.quantity;
        }, 0);

        res.render("user/cart", { cart: cartItems, totalPrice, userId });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const updateQuantity = async (req, res) => {
    try {
        const { productId, newQuantity } = req.body;
        const userId = req.session.user;
        // req.session.user; // Get the user ID from the session or wherever it's stored

        // Find the user's cart
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }
        // Find the item in the cart
        const item = cart.items.find((item) => item.productId == productId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in cart" });
        }

        // Update the quantity of the item in the cart
        item.quantity = newQuantity;

        // Save the updated cart to the database
        await cart.save();

        // Send a success response with the updated cart
        return res.json({ success: true, message: "Quantity updated successfully", cart });
    } catch (error) {
        console.error("Error updating quantity:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Modify the removeFromCart route handler to handle removal from the database
// Modify the removeFromCart route handler to permanently remove the product from the database
const removeFromCart = async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.user; // Assuming you have stored the user's ID in the session

    try {
        // Find the user's cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Remove the product from the cart
        cart.items = cart.items.filter((item) => !item.productId.equals(productId));

        // Save the updated cart
        await cart.save();

        return res.status(200).json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.error("Error removing product:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ............................................

//checkout..........................

// Inside your usercontroller.js file
function calculateDiscountedPrice(originalPrice, coupon) {
    if (coupon.discountType === "fixed") {
        return originalPrice - coupon.discountValue;
    } else {
        // Handle other discount types if needed
        console.error("Unsupported discount type:", coupon.discountType);
        return originalPrice;
    }
}

const checkout = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const cartData = await Cart.findOne({ userId: userId }).populate('items.productId');
        console.log("cartData", cartData);

        if (!cartData) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Extract cart items from the cart document
        const cartItems = cartData.items;

        // Filter out cart items with null productId
        const validCartItems = cartItems.filter((item) => item.productId !== null);

        // Calculate total price using reduce
        let totalPrice = 0;
        validCartItems.forEach((item) => {
            totalPrice += item.quantity * item.productId.price;
        });
        console.log("Total Price:", totalPrice);

        // Fetch coupon details based on the provided code (assuming couponCode is available in the session or request)
        const couponCode = req.session.couponCode; // Change this based on your application's logic
        const selectedCoupon = await AdminCoupon.findOne({ code: couponCode });

        // Apply discount if a valid coupon is found
        let discountedPrice = totalPrice;
        if (selectedCoupon) {
            // Subtract the discountValue from the total price
            discountedPrice -= discountedPrice * (selectedCoupon.discountValue / 100)
        }

        const coupons = await AdminCoupon.find();

        // Fetch user's addresses
        const userDoc = await User.findOne({ _id: userId });
        const addresses = userDoc.addresses;

        // res.render('user/checkout', { cartItems: validCartItems, totalPrice, addresses });
        res.render("user/checkout", { userId, cartItems: cartItems, totalPrice, addresses, coupons, discountedPrice });
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};

const checkoutpost = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();
    const { selectedAddress, paymentMethod, couponCode } = req.body;

    // Fetch cart data
    const cartData = await Cart.findOne({ userId: userId }).populate('items.productId');

    // Fetch product details with quantity
    const productsWithQuantity = await Promise.all(cartData.items.map(async (item) => {
      const productDetails = await db.findById(item.productId); // Assuming Product is your model name
      return { productDetails, quantity: item.quantity };
    }));

    // Calculate total price using reduce
    let totalprice = productsWithQuantity.reduce((acc, item) => {
      if (item && item.productDetails && typeof item.productDetails.price === 'number') {
        const actualPrice = item.productDetails.price;
        const offerPrice = item.productDetails.offerprice || Infinity;
        const priceToUse = Math.min(actualPrice, offerPrice);
        
        return acc + (priceToUse * item.quantity);
      } else {
        console.error('Invalid item or price:', item);
        return acc;
      }
    }, 0);

    // Fetch coupon details based on the provided code
    const selectedCoupon = await AdminCoupon.findOne({ code: couponCode });
console.log("SelectedCOUPON"),selectedCoupon;
    let discountedPrice = totalprice;
    
    // Apply discount if a valid coupon is found
    if (selectedCoupon) {
      discountedPrice -= discountedPrice * (selectedCoupon.discountValue / 100)
      console.log("discountedPrice",discountedPrice);

    }

    // Create an array to store order items
    const orderItems = cartData.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      couponId: selectedCoupon ? selectedCoupon._id : null, // Add couponId to each item
    }));

    // Update the totalprice with the discounted value
    const newOrder = new orders({
      userId,
      items: orderItems,
      selectedAddress,
      totalprice: discountedPrice, // Use the discounted price in the order
      paymentMethod,
   

   
      
    });

    // Save the order to the database
    await newOrder.save();

    // Additional logic for processing payment, sending confirmation emails, etc.
    await Promise.all(productsWithQuantity.map(async (item) => {
      const productId = item.productDetails._id;
      const quantity = item.quantity;

      // Update the product stock in the database
      await db.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
    }));

    // Send a success response
    res.status(200).json({ message: 'Order placed successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const checkouterrorpost = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();
    const { selectedAddress, paymentMethod, couponCode } = req.body;

    // Fetch cart data
    const cartData = await Cart.findOne({ userId: userId }).populate('items.productId');

    // Fetch product details with quantity
    const productsWithQuantity = await Promise.all(cartData.items.map(async (item) => {
      const productDetails = await db.findById(item.productId); // Assuming Product is your model name
      return { productDetails, quantity: item.quantity };
    }));

    // Calculate total price using reduce
    let totalprice = productsWithQuantity.reduce((acc, item) => {
      if (item && item.productDetails && typeof item.productDetails.price === 'number') {
        const actualPrice = item.productDetails.price;
        const offerPrice = item.productDetails.offerprice || Infinity;
        const priceToUse = Math.min(actualPrice, offerPrice);
        
        return acc + (priceToUse * item.quantity);
      } else {
        console.error('Invalid item or price:', item);
        return acc;
      }
    }, 0);

    // Fetch coupon details based on the provided code
    const selectedCoupon = await AdminCoupon.findOne({ code: couponCode });
console.log("SelectedCOUPON"),selectedCoupon;
    let discountedPrice = totalprice;
    
    // Apply discount if a valid coupon is found
    if (selectedCoupon) {
      discountedPrice -= discountedPrice * (selectedCoupon.discountValue / 100)
      console.log("discountedPrice",discountedPrice);

    }

    // Create an array to store order items
    const orderItems = cartData.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      couponId: selectedCoupon ? selectedCoupon._id : null, // Add couponId to each item
    }));

    // Update the totalprice with the discounted value
    const newOrder = new orders({
      userId,
      items: orderItems,
      selectedAddress,
      totalprice: discountedPrice, // Use the discounted price in the order
      paymentMethod,
      status:"pending"
      
    });

    // Save the order to the database
    await newOrder.save();

    // Additional logic for processing payment, sending confirmation emails, etc.
    await Promise.all(productsWithQuantity.map(async (item) => {
      const productId = item.productDetails._id;
      const quantity = item.quantity;

      // Update the product stock in the database
      await db.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
    }));

    // Send a success response
    res.status(200).json({ message: 'Order placed successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



const order = async (req, res) => {
    try {
        const { paymentMethod } = req.body;
        console.log("Rendering /order page...");
        // After placing the order successfully, clear the cart
        //   const user = req.session.user;
        //   console.log(user);
        //   const userData = await collection1.findOne({ email: user });
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } }, // Set the items array to an empty array to clear the cart
            { new: true }
        );
        console.log("Selected Payment Method:", paymentMethod);
        // Send a response indicating the order was placed successfully
        //   console.log(userData);
        res.render("user/order");
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
    // res.render("user/order")
};

const orderhistory = async (req, res) => {
    try {
        // Assuming you have some way to identify the user, for example, from the session
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        const ordersi = await orders.find({ userId: userId }).populate("items.productId").exec();

        const referredCode = userData.referredCode;
        console.log("Referred code retrieved from user data:", referredCode); // Debugging

        if (referredCode) {
            // Find referring user
            const referringUser = await collection1.findOne({ referralCode: referredCode });
            console.log("Referring user:", referringUser); // Debugging

            if (referringUser) {
                // Assuming Wallet model has a field called 'balance'
                const referringUserWallet = await Wallet.findOne({ userId: referringUser._id });

                if (referringUserWallet) {
                    // Check if the user has made any previous orders
                    if (ordersi.length === 1) {
                        // Add referral bonus to the referring user's wallet for the first order
                        referringUserWallet.balance += 100; // Or adjust the amount as needed
                        await referringUserWallet.save();
                    }
                }
            } else {
                // Handle invalid referral code
                console.log("Invalid referral code");
            }
        }

        // Pass the orders data to the view

        console.log("Order si dcjkkjdkjdkjdsn", ordersi);
        res.render("user/orderhistory", { ordersi, userId }); // Ensure 'orders' is defined in this scope
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
};
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        console.log(orderId);
        
        if (status !== 'confirmed') {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updatedOrder = await orders.findByIdAndUpdate(orderId, { status: status }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order status updated successfully", updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const reason = req.body.reason;
        // Find the order to get the user ID and order items
        const order = await orders.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update the order status to "cancelled" in the database
        const updatedOrder = await orders.findByIdAndUpdate(
            orderId,
            { status: "cancelled", cancellationReason: reason },
            { new: true }
        );

        // Increment stock for each product in the canceled order
        for (const item of updatedOrder.items) {
            try {
                // Increment stock in the database
                const product = await db.findOneAndUpdate(
                    { _id: item.productId },
                    { $inc: { stock: item.quantity } }, // Increment stock by the quantity of the canceled item
                    { new: true }
                );
                console.log(`Stock incremented for product ${product.productname}`);
            } catch (error) {
                console.error("Error incrementing stock:", error);
            }
        }
        // Fetch the user's wallet
        const userWallet = await Wallet.findOne({ userId: order.userId });
        console.log(userWallet);
        if (userWallet) {
            // Calculate the refunded amount based on the order total
            const refundedAmount = updatedOrder.totalprice;

            // Add the refunded amount to the wallet balance
            userWallet.balance += refundedAmount;

            // Update the wallet with the new balance
            await userWallet.save();
        }

        res.json({ success: true, message: "Order cancelled successfully.", updatedOrder });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const initiateReturn = async (req, res) => {
    try {
        // Fetch the order from the database
        const order = await orders.findById(req.params.orderId);

        // Check if the order exists
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Check if the order has already been returned
        if (order.status === "returned") {
            return res.status(400).json({ success: false, message: "Order has already been returned" });
        }

        // Increment stock for each product in the returned order
        for (const item of order.items) {
            try {
                // Increment stock in the database
                const product = await db.findOneAndUpdate(
                    { _id: item.productId },
                    { $inc: { stock: item.quantity } },
                    { new: true }
                );
                console.log(`Stock incremented for product ${product.productname}`);
            } catch (error) {
                console.error("Error incrementing stock:", error);
            }
        }

        // Refund amount to user's wallet
        const userWallet = await Wallet.findOne({ userId: order.userId });

        if (userWallet) {
            // Calculate the refunded amount based on the order total
            const refundedAmount = order.totalprice;

            // Add the refunded amount to the wallet balance
            userWallet.balance += refundedAmount;

            // Update the wallet with the new balance
            await userWallet.save();
        }

        // Update the order status to 'returned'
        order.status = "returned";

        // Check if the request body contains the return reason
        if (req.body.reason) {
            order.cancellationReason = req.body.reason;
        }

        // Save the updated order to the database
        await order.save();

        // Placeholder success response
        console.log("Order returned successfully");
        res.json({ success: true });
    } catch (error) {
        console.error("Error initiating return:", error);
        // Handle errors and send an appropriate response ,
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const generateInvoice = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        const orderId = req.params.orderId;

        // Retrieve invoice details with product information
        const invoiceDetails = await orders.findOne({ _id: orderId }).populate({
            path: "items.productId",
            select: "name  price description",
        });

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set response headers to trigger a download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="invoice.pdf"');

        // Pipe the PDF document to the response
        doc.pipe(res);

        // Add Company Information
        doc.fontSize(16).text("Company: Elavate", { align: "center" });
        doc.moveDown(1);

        // Add Billing Details Section
        doc.fontSize(16).text("Billing Details", { align: "center" });
        doc.moveDown(1);
        doc.fontSize(12).text("Customer Details", { align: "center" });
        doc.text(`Order ID: ${orderId}`);
        doc.moveDown(2);
        doc.text(`Address: ${invoiceDetails.selectedAddress || ""}`);
        doc.text(`Order Date: ${invoiceDetails.date || ""}`);
        doc.moveDown(2);
        doc.text(`Payment Method: ${invoiceDetails.paymentMethod || ""}`);
        doc.moveDown(5);

        // Add Table Header
        const headerY = doc.y;
        doc.font("Helvetica-Bold");
        doc.text("Index", 70, headerY, { width: 40, lineGap: 10 });
        doc.text("Name", 120, headerY, { width: 150, lineGap: 10 });
        doc.text("Quantity", 420, headerY, { width: 50, lineGap: 10 });
        doc.text("Price", 500, headerY, { width: 80, lineGap: 10 }); // Adjusted the position
        doc.font("Helvetica");

        // Table Rows
        const contentStartY = headerY + 40; // Increased the spacing
        let currentY = contentStartY;

        invoiceDetails.items.forEach((item, index) => {
            doc.text(`${index + 1}`, 70, currentY, { width: 40, lineGap: 15 });
            doc.text(item.productId.name || "", 120, currentY, {
                width: 150,
                lineGap: 10,
            });

            doc.text(item.quantity || "", 420, currentY, {
                width: 50,
                lineGap: 10,
            });
            doc.text(
                (item.productId.price ? item.productId.price.toFixed(2) : "") || "",
                500, // Adjusted the position
                currentY,
                {
                    width: 80,
                    lineGap: 10,
                }
            );

            // Calculate the height of the current row and add some padding
            const lineHeight = Math.max(
                doc.heightOfString(item.productId.name || "", { width: 150 }),
                doc.heightOfString(item.quantity || "", { width: 50 }),
                doc.heightOfString((item.productId.price ? item.productId.price.toFixed(2) : "") || "", { width: 80 })
            );
            currentY += lineHeight + 20; // Increased the spacing
        });

        // Add Total Price within the table
        doc.font("Helvetica-Bold");
        doc.text("Total(after discount)", 70, currentY, { width: 150, lineGap: 15 });
        doc.font("Helvetica");
        doc.text("", 120, currentY, { width: 150, lineGap: 10 });
        doc.text("", 270, currentY, { width: 50, lineGap: 10 });
        doc.text("", 420, currentY, { width: 80, lineGap: 15 }); // Adjusted the position
        doc.text(`${invoiceDetails.totalprice.toFixed(2) || ""}`, 500, currentY, {
            width: 80,
            lineGap: 10,
        });

        // Add Thank You message
        const thankYouY = currentY + 100;
        doc.fontSize(14).text(
            "Heartfelt wishes and endless gratitude for choosing Elavate. May your new smell bring joy and convenience to your life!",
            70,
            thankYouY,
            { width: 500, align: "center" }
        );

        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error("Error generating invoice:", error);
        res.render("user/error");
    }
};

const getaddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const userDAta = await collection1.findOne({ _id: userId });

        // Check if userDAta exists and contains the addresses property
        if (userDAta && userDAta.addresses) {
            res.render("user/address", { user: userDAta }); // Pass the user object to the template
        } else {
            // If userDAta is null or addresses property is missing, handle the error
            throw new Error("User data not found or missing addresses property");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getprofile = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            // Redirect to /login if userId is not present
            return res.redirect("/login");
        }
        const user = await collection1.findOne({ _id: userId });

        // Assuming `userDatas` contains the user object
        res.render("user/userprofile2", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};

const editprofile = async (req, res) => {
    try {
        const userId = req.params.userID; // Correct the variable name to match the route parameter
        const { newFirstName } = req.body; // Extract the new first name from the request body

        // Assuming `collection1` is your database collection
        const user = await collection1.findById(userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        user.firstname = newFirstName; // Update the first name
        await user.save(); // Save the updated user

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};

const postaddress = async (req, res) => {
    try {
        const { addressType, mobileNumber, flat, district, pincode, country, state } = req.body;
        const userId = req.session.user;

        // Ensure the user exists
        const user = await User.findOne({ _id: userId });
        if (!user) {
            return res.status(404).send("User not found");
        }

        console.log("bodyy kan", req.body);

        // Create a new Address instance using the Address model/schema
        const newAddress = new Address({
            userId: userId,
            addressType,
            mobileNumber,
            flat,
            district,
            pincode,
            country,
            state,
        });

        // Save the new address to the user's addresses array
        user.addresses.push(newAddress);
        await user.save();

        // Redirect the user to the address page after successful save
        res.redirect("/Address");
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteaddress = async (req, res) => {
    const id = req.params.id;
    console.log("delete ad", id);
    try {
        // Find the user by their session ID
        const userId = req.session.user;
        const user = await collection1.findById(userId);

        if (!user) {
            console.log("User not found");
            return res.status(404).send("address not found");
        }

        // Find the index of the address to delete
        const addressIndex = user.addresses.findIndex((address) => address._id.toString() === id);

        if (addressIndex === -1) {
            console.log("Address not found");
            return res.status(404).send("Address not found");
        }

        // Remove the address from the user's addresses array
        user.addresses.splice(addressIndex, 1);

        // Save the updated user object
        await user.save();

        res.redirect("/address");
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addressedit = async (req, res) => {
    try {
        const userId = req.session.user;

        const data = await User.findById(userId);

        const id = req.params.id;
        console.log(req.body);
        const { addressType, mobileNumber, flat, district, pincode, country, state } = req.body;

        // Find the category to be updated
        const address = data.addresses.find((val) => val._id.toString() == id);

        if (!address) {
            return res.status(404).sent("Address not found");
        }

        address.addressType = addressType;
        address.mobileNumber = mobileNumber;
        address.flat = flat;
        address.district = district;
        address.pincode = pincode;
        address.country = country;
        address.state = state;

        // If the category name is being updated, check if the new name already exists

        await data.save();
        // Update the category name

        res.redirect("/address");
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Internal Server Error");
    }
};

const geteditAddress = async (req, res) => {
    // const errorMessage = req.
    const userId = req.session.user;

    const id = req.params.i;
    console.log(id);
    const data = await User.findById(userId);

    const address = data.addresses.find((val) => val._id.toString() == id);
    res.render("user/address2", { address });
};

const wishlistPage = async (req, res) => {
    try {
        const user = req.session.user;
        const userDataa = req.session.userData;
        const userData = await collection1.findOne({ _id: user });

        const userId = userData._id.valueOf();

        // Fetch the wishlist for the user
        const userWishlist = await wishlist.findOne({ userId }).populate("items.productId");
        const add = await product.find()
        console.log("11111111111111111111111111111",add);

        console.log(userWishlist);
        // Render the wishlistPage view with the wishlist data
        res.render("user/wishlistPage", { wishlist: userWishlist ,product:add, userId: req.session.user});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const wishlistPagePost = async (req, res) => {
    try {
        const { productId, action } = req.query;
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        if (action === "add") {
            const wishlistItem = { productId: productId };
            await wishlist.updateOne({ userId }, { $addToSet: { items: wishlistItem } }, { upsert: true });
            res.json({ success: true, message: "Product added to wishlist" });
        } else if (action === "remove") {
            await wishlist.updateOne({ userId }, { $pull: { items: { productId: productId } } });
            res.json({ success: true, message: "Product removed from wishlist" });
        } else {
            res.status(400).json({ error: "Invalid action" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const wishlistInfo = async (req, res) => {
    try {
        const { productId } = req.query;
        const user = req.session.user; // Assuming you have user authentication middleware
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        // Check if the product already exists in the user's wishlist
        const existingWishlist = await wishlist.findOne({ userId, "items.productId": productId });

        // Respond with JSON indicating whether the product is in the wishlist
        res.json({ isInWishlist: !!existingWishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const removeProductFromWishlist = async (req, res) => {
    try {
        const { productId } = req.query;
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        // Ensure productId is treated as a string in the query
        await wishlist.updateOne({ userId }, { $pull: { items: { productId: productId } } });

        res.json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const razorpay = new Razorpay({
    key_id: 'rzp_test_rJ0yPg6ZIlUOvq',
    key_secret: 'ufxbfK2FqmH9NHjGPULk8uZf',
  });
  
   const createrazorpayorder = async (req, res) => {
    try {
      const { amount } = req.body;
  console.log(amount);
      const options = {
        amount: amount*100, // Razor Pay requires the amount in paisa
        currency: 'INR',
        receipt: 'order-receipt', // Replace with your order receipt ID
        payment_capture: 1, // Auto-capture payments
      };
  console.log(options);
      razorpay.orders.create(options, (error, order) => {
        if (error) {
          console.error(error);
          res.status(500).json({ error: 'Failed to create Razorpay order' });
        } else {
          res.json({ orderId: order.id });
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

const getWalletBalance = async (req, res) => {
    console.log("getWallet is working");
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found" });
        }
        console.log("wallet.balance");
        console.log(wallet.balance);
        res.json({ balance: wallet.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const deductFromWallet = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();
        const { newBalance } = req.body; // Assuming you send the new balance in the request body
        console.log("NEWBALANCE", newBalance);
        // Validate new balance here if needed

        const wallet = await Wallet.findOneAndUpdate({ userId }, { balance: newBalance }, { new: true });

        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        res.json({ message: "Wallet balance updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const wallet = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await collection1.findOne({ _id: user });
        const userId = userData._id.valueOf();

        // Fetch the wallet for the user
        const userWallet = await Wallet.findOne({ userId });

        if (userWallet) {
            const balance = userWallet.balance;
            console.log(balance);
            // Render the wallet view with the balance
            res.render("user/wallet", { balance, userWallet });
        } else {
            // Handle the case where the wallet is not found
            res.render("user/wallet", { balance: 0 }); // You can set a default balance or handle it in the EJS template
        }
    } catch (error) {
        console.error("Error fetching wallet balance:", error);
        res.status(500).send("Internal Server Error");
    }
};

const generatewalletRazorpay = async (req, res) => {
    const amount = req.body.amount;
    console.log(amount);
    // Create a Razorpay order
    const options = {
        amount: amount * 100, // Convert amount to paise (Razorpay expects amount in paise)
        currency: "INR",
        receipt: "receipt_order_123",
        payment_capture: 1,
    };

    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
        console.log(order);
    } catch (error) {
        console.error("Error generating Razorpay order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const verifyRazorpayPayment = async (req, res) => {
    const paymentId = req.body.paymentId;
    const amount = req.body.amount;

    // Verify the payment with Razorpay API
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        console.log("payment");
        console.log(payment);
        // Check if the payment amount and currency match the expected values
        if (payment.amount === amount * 100 && payment.currency === "INR") {
            // Update the wallet balance with the provided amount
            console.log("if");
            const user = req.session.user;
            const userData = await collection1.findOne({ _id: user });
            const userId = userData._id.valueOf(); // Assuming you have user authentication middleware
            try {
                const wallet = await Wallet.findOne({ userId });

                if (wallet) {
                    // If wallet exists, update the balance and add a new deposit transaction
                    const updatedBalance = wallet.balance + parseFloat(amount);

                    await Wallet.updateOne(
                        { userId },
                        {
                            $set: { balance: updatedBalance },
                            $push: { transactions: { type: "deposit", amount: parseFloat(amount) } },
                        }
                    );

                    res.json({ success: true });
                } else {
                    // If wallet doesn't exist, create a new wallet
                    const newWallet = new Wallet({
                        userId: userId,
                        balance: parseFloat(amount),
                        transactions: [{ type: "deposit", amount: parseFloat(amount) }],
                    });

                    await newWallet.save();
                    res.json({ success: true });
                }
            } catch (error) {
                console.error("Error updating wallet balance:", error);
                res.json({ success: false, error: "Error updating wallet balance" });
            }
        } else {
            res.json({ success: false, error: "Invalid payment amount or currency" });
        }
    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


const generateReferralCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const codeLength = 8;
    let referralCode = "";

    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        referralCode += characters.charAt(randomIndex);
    }

    return referralCode;
};

const createReferral = async (req, res) => {
    console.log("HELLO");
    try {
        // Check if the user with the given ID exists
        const user1 = req.session.user;
        const userData = await collection1.findOne({ _id: user1 });
        const userId = userData._id.valueOf();
        const user = await collection1.findById(userId);

        console.log("user123", user);
        if (user) {
            // If the user doesn't have a referral code, generate one and update the user document
            if (!user.referralCode) {
                const referralCode = generateReferralCode();
                await collection1.findByIdAndUpdate(userId, { referralCode }, { new: true });
                return { status: "success", message: "Referral code added successfully", referralCode };
            } else {
                // If the user already has a referral code, return it
                return { status: "success", message: "User already has a referral code", referralCode: user.referralCode };
            }
        } else {
            return { status: "error", message: "User not found with the provided ID" };
        }
    } catch (error) {
        console.error("Error:", error);
        return { status: "error", message: "Internal Server Error" };
    }
};




module.exports = {
    updateOrderStatus,
    getLogin,
    getRegister,
    initiateReturn,
    cancelOrder,
    orderhistory,
    order,
    checkoutpost,
    checkout,
    getprofile,
    getaddress,
    editprofile,
    postaddress,
    deleteaddress,
    addressedit,
    geteditAddress,
    removeFromCart,
    updateQuantity,
    getCartPage,
    getcartnumber,
    addToCart,
    cartView,
    forgotpasswordpost,
    verifyforgototp,
    changepasswordpost,
    getOtp,
    postLogout,
    changepass,
    changepasspost,
    forgotpassword,
    postLogin,
    logout,
    postRegister,
    resendotp,
    changeCpassword,
    getLogout,
    display,
    forher,
    forhim,
    home,
    getHome,
    otpvalidation,
    mailsender,
    resendforgototp,
    wishlistPage,
    wishlistPagePost,
    wishlistInfo,
    removeProductFromWishlist,
    calculateDiscountedPrice,
    createrazorpayorder,
    verifyRazorpayPayment,
    getWalletBalance,
    deductFromWallet,
    generatewalletRazorpay,
    wallet,
    createReferral,
    checkReferralCode,
    generateInvoice,
    getProductsByCategory,
    checkouterrorpost
};
