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
const orders = require("../models/order")
const Swal = require('sweetalert2');
const flash = require('connect-flash');
const otpgenerator =require('otp-generator')
const Address = require('../models/address')
// Your other code here...


require('dotenv').config()

const transporter = nodemailer.createTransport({
  service : 'Gmail',
  auth: {
      user : process.env.EMAIL_ADDRESS,
      pass : process.env.EMAIL_PASSWORD   
  }
});


const getHome = async (req, res) => {
    try {
        var errorMessage = req.flash("errorMessage")
        const products = await product.find();
        const loggedInUser = req.session.user; // Assuming you store the logged-in user's information in the session
        const userId = loggedInUser ? loggedInUser.id : null; // Assuming the user object has an 'id' property
        res.render("user/home", { products, loggedInUser, userId ,errorMessage:errorMessage}); // Pass 'products', 'loggedInUser', and 'userId' to the template
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const home = async (req, res) => {
    try { 
        var errorMessage = req.flash("errorMessage")
        const products = await product.find();
        const loggedInUser = req.session.user; // Assuming you store the logged-in user's information in the session
        const userId = loggedInUser ? loggedInUser.id : null; // Assuming the user object has an 'id' property
        res.render("user/home", { products, loggedInUser, userId ,errorMessage:errorMessage}); // Pass 'loggedInUser' and 'userId' to the template
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const forhim = async (req, res) => {
    try {
        const products = await product.find({ category: "forhim" });

        // Pass the userId to the template for any necessary client-side functionality
        res.render("user/forhim", { products, userId: req.session.user });
    } catch (error) {
        console.error("Error fetching products for 'forhim' category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const forher = async (req, res) => {
    try {
        const products = await product.find({ category: "forher" });

        // Pass the userId to the template for any necessary client-side functionality
        res.render("user/forher", { products, userId: req.session.user });
    } catch (error) {
        console.error("Error fetching products for 'forher' category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const display = async (req, res) => {
    const productId = req.params.id;
    console.log(productId);
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
        console.log("gggggggggggggggggggggggggg", loggedInUser);

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
    if(req.session.user){
        res.redirect('/')
    }else{
    let message;
    res.render("user/userlogin",{message});
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

        if(user.isBlocked){
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
            console.error('Error destroying session:', err);
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
            firstname : name,
            email,
            password: hashedPassword, // Store the hashed password
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



let genotp = () => {
    return otpgenerator.generate(6, { upperCaseAlphabets: false,lowerCaseAlphabets:false, specialChars: false })
  }

const mailsender = async (data) => {
  const generatedOTP = genotp();
  console.log(generatedOTP)
  const otpDocument = new otp({
      
      email: data.email,
      otp: generatedOTP
  });

  try {
      await otpDocument.save();
      // Send the email with the generated OTP
      transporter.sendMail({
          from: process.env.EMAIL_ADDRESS,
          to: data.email,
          subject: "OTP Verification",
          text: "Verify Your Email Using the OTP",
          html: `<h3>Verify Your Email Using this OTP: ${generatedOTP}</h3>`,
      }, (err, info) => {
          if (err) {
              console.log("Error sending email:", err);
          } else {
              console.log("Email sent successfully. Message ID:", info.messageId);
          }
      });
  } catch (error) {
      console.error("Error saving OTP to the database:", error);
  }
  
}


// In your backend code (usercontroller.js)
const resendotp = (req,res)=>{
    console.log('xxxxxxx')
    mailsender(req.session.data)
    console.log('mm')
  }

const otpvalidation = async (req, res) => {
    try {
        console.log('hizzz')
      const x = await otp.findOne({}).sort({ _id: -1 }).limit(1);
      console.log(x);
      const  otpvalue = req.body;
    
      console.log(otpvalue);
  
      if (x.otp == otpvalue.otp) {
        console.log('zzzzzzz')
        console.log(req.session.data);
        const newuser = await new collection1(req.session.data).save();
        console.log(newuser);
  
        console.log("hi");
        // Send success response
         res.json({ success: true, message: 'OTP verification successful' });
        
       
       
      } else {
        // Send error response
         res.status(400).json({ success: false, message: 'Invalid OTP' });
        
      }
    } catch (error) {
      console.error(error);
      // Send error response in case of an exception
      res.status(500).json({ success: false, error: 'Internal Server Error' });
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
            return res.render('user/changepass', { error: 'Incorrect current password' });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.render('user/changepass', { error: 'New password and confirm password do not match' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        // Redirect the user to the change password page with a success message
        return res.render('user/changepass', { successMessage: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        return res.render('user/changepass', { wrong: 'An error occurred while changing the password' });
    }
};


const forgotpassword = (req,res)=>{
res.render("user/forgotpassword")
}
  
const forgotpasswordpost = async (req, res) => {
    const email = req.body.email;
     //req.session.data = email;
  
    try {
      req.session.otpemail=req.body.email
      // Check if the email exists in the database
      const user = await collection1.findOne({ email });
      console.log(user);
      if (!user) {
        // If the email is not found in the database, render the forgot password form with an error message
        return res.render('user/forgotpassword', { errorMessage: 'Email not found' });
      }
  
      // Generate and send OTP
      mailsender({ email: user.email, session: req.session });
  
      // Render the OTP verification page
      res.render("user/otpforgot");
    } catch (error) {
      // Handle any errors that occur during database interaction
      console.error(error);
      res.status(500).send('Internal Server Error');
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
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
  console.log("latestOTP");
  console.log(latestOTP.otp);
      if (latestOTP.otp == enteredOTP) {
   
        // Send success response
        return res.json({ success: true, message: 'OTP verification successful' });
      } else {
        // If OTP is invalid, send an error response
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
    } catch (error) {
      // Handle any errors that occur during OTP validation
      console.error(error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  };

  const resendforgototp = async (req, res) => {
    try {
      console.log("ENTERED");
  
      // Retrieve the email from the session
      const email = req.session.otpemail;
      console.log("email", email);
  
      if (!email) {
        // Handle the case where the email is not available in the session
        console.error('Email not found in session');
        return res.status(400).render('user/otpforgot', { errorMessage: 'Email not found in session' });
      }
  
      // Call mailsender with the correct email
      await mailsender({ email });
  
      console.log('mm');
      
      // Render the existing page again
      res.render('user/otpforgot');
    } catch (error) {
      console.error(error);
      res.status(500).render('user/otpforgot', { errorMessage: 'Internal Server Error' });
    }
  };

  const changeCpassword = (req,res)=>{
    console.log("ChangePASSS");
    res.render("user/changeCpassword")
  }

  const changepasswordpost = async (req, res) => {
    const newPassword = req.body.password;
  
    try {
      
        // Find the user by some identifier (e.g., email or user ID)
        const user = await collection1.findOne({ email:req.session.otpemail });
  
        if (!user) {
            return res.status(404).send('User not found');
        }
  
        // Update the password field with the new password
        user.password = newPassword;
  
        // Save the updated user to the database
        await user.save();
  
        // Redirect to the OTP page or send a success message
        // res.redirect('/otpget');
        res.redirect("/getRegister")
        // res.render("user/otp.ejs");
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
  };


  const cartView = async (req,res)=>{

    try{

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
    }catch(error){
        console.log(error)
    }
      

  }




  
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
             req.flash("errorMessage","out of stock" )
             return res.redirect("/")
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
            return res.status(400).send("User ID not provided");
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
            return res.status(400).send("User ID not provided");
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
        const cart = await Cart.findOne({ userId : userId});
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }
        // Find the item in the cart
        const item = cart.items.find(item => item.productId == productId);
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
        cart.items = cart.items.filter(item => !item.productId.equals(productId));

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

const checkout = async (req, res) => {
    try {
      const userId = req.session.user;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }
  
      // Fetch the cart items along with product details
      const cart = await Cart.findOne({ userId }).populate('items.productId');
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
  
      // Extract cart items from the cart document
      const cartItems = cart.items;
  
      // Filter out cart items with null productId
      const validCartItems = cartItems.filter(item => item.productId !== null);
  
      // Calculate total price
      let totalPrice = 0;
      validCartItems.forEach(item => {
        totalPrice += item.quantity * item.productId.price;
      });

      // Fetch user's addresses
      const user = await User.findOne({ _id: userId });
      const addresses = user.addresses;
  
    //   res.render('user/checkout', { cartItems: validCartItems, totalPrice, addresses });
      res.render('user/checkout', { userId, cartItems: validCartItems, totalPrice, addresses });

    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).render('error', { message: 'Internal Server Error' });
    }
  };



  const checkoutpost = async (req, res) => {
    try {
      const userId = req.session.user;

        const {  selectedAddress, paymentMethod } = req.body;
        const cartData = await Cart.findOne({ userId }).populate("items.productId");

        if (!cartData) {
            console.error("No cart found for the user");
            return res.status(404).send("Cart not found");
        }

        const cartItems = cartData.items.map(item => {
          return {
            productId: item.productId._id,
            productName: item.productId.name,
            description: item.productId.description,
            price: item.productId.price,
            quantity: item.quantity,
            image: item.productId.productImages,
          }
        });

        const productsWithQuantity = await Promise.all(
            cartData.items.map(async (item) => {
                const productDetails = await db.findById(item.productId); // Assuming Product is your model name
                console.log(productDetails + "product details");
                return { productDetails, quantity: item.quantity };
            })
        );

        const totalprice = productsWithQuantity.reduce((acc, item) => {
            // Check if item and productDetails are defined before accessing price
            if (item && item.productDetails && typeof item.productDetails.price === "number") {
                return acc + item.productDetails.price * item.quantity;
            } else {
                // Handle the case where price or other properties are not available
                console.error("Invalid item or price:", item);
                return acc;
            }
        }, 0);
        console.log("REQ");
        console.log(req.body);

        console.log(userId + "userID");
        console.log(cartItems);
        console.log("CartItems");
        console.log(selectedAddress + "selectedAddress");

        const orderItems = cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }));

        const newOrder = new orders({
            userId,
            items: orderItems,
            selectedAddress,
            paymentMethod,
            totalprice,
        });

        await newOrder.save();

        await Promise.all(
            cartItems.map(async (item) => {
              const productId = item.productId;
              const quantity = item.quantity;
          
              try {
                // Update the product stock in the database
                const updatedProduct = await db.findByIdAndUpdate(productId, { $inc: { stock: -quantity } }, { new: true });
                console.log(`Stock decremented for product ${updatedProduct.productname}`);
              } catch (error) {
                console.error('Error decrementing stock:', error);
              }
            })
          );
          

        res.status(200).json({ message: "Order placed successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const order = async(req,res)=>{
    try {
      // ... logic to handle placing the order ...
      console.log('Rendering /order page...');
      // After placing the order successfully, clear the cart
    //   const user = req.session.user;
    //   console.log(user);
    //   const userData = await collection1.findOne({ email: user });
      const userId = req.session.user;
     
      await Cart.findOneAndUpdate(
        { userId },
        { $set: { items: [] } },  // Set the items array to an empty array to clear the cart
        { new: true }
      );
  
      // Send a response indicating the order was placed successfully
    //   console.log(userData);
      res.render("user/order")
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
    // res.render("user/order")
  }
  
  const orderhistory = async (req, res) => {
    try {
        // Assuming you have some way to identify the user, for example, from the session
        const user = req.session.user;

        // const userData = await collection1.findOne({user});
        // console.log("CollectionDta",userData)
        // const userId = userData._id.valueOf();
        // Fetch orders for the user from the database
        const ordersi = await orders.find({ userId:user }).populate('items.productId').exec();
  
        // Pass the orders data to the view
       
        console.log("Order si dcjkkjdkjdkjdsn",ordersi);
        res.render("user/orderhistory", { ordersi }); // Ensure 'orders' is defined in this scope
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
  };

  const cancelOrder = async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const reason = req.body.reason; // Make sure to include 'reason' in the request body
  
      // Update the order status to "cancelled" in the database
      const updatedOrder = await orders.findByIdAndUpdate(orderId, { status: 'cancelled', cancellationReason: reason }, { new: true });
  
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
      console.error('Error incrementing stock:', error);
    }
  }
  
      res.json({ success: true, message: 'Order cancelled successfully.', updatedOrder });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const initiateReturn = async (req, res) => {
    try {
      // Fetch the order from the database
      const order = await orders.findById(req.params.orderId);
  
      // Check if the order exists
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      // Check if the order has already been returned
      if (order.status === 'returned') {
        return res.status(400).json({ success: false, message: 'Order has already been returned' });
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
          console.error('Error incrementing stock:', error);
        }
      }
  

      // Update the order status to 'returned'
      order.status = 'returned';
  
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
      console.error('Error initiating return:', error);
      // Handle errors and send an appropriate response ,
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };

  const getprofile = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            // Handle the case where userId is not present
            return res.status(400).send("User ID not provided");
        }
        const user = await collection1.findOne({ _id: userId });        
 
        // Assuming `userDatas` contains the user object
        res.render("user/userprofile2", { user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
}


const getaddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const userDAta = await collection1.findOne({ _id: userId });

        // Check if userDAta exists and contains the addresses property
        if (userDAta && userDAta.addresses) {
            res.render('user/address', { user: userDAta }); // Pass the user object to the template
        } else {
            // If userDAta is null or addresses property is missing, handle the error
            throw new Error('User data not found or missing addresses property');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



const editprofile = async (req, res) => {
      
    try{
        const userId = req.params.id;
        console.log("re name ",userId);
        const { firstname, mobileNumber, email } = req.body;
        
        const user = await collection1.findById(userId);

        user.firstname = firstname;
        user.mobileNumber = mobileNumber;
        user.email = email;
        await user.save();
        res.redirect('/profile');

    }
    catch(error){
        console.error(error);
        res.status(500).send("Internal server error");
    }

}

const postaddress = async (req, res) => {
    try {
        const { addressType, mobileNumber, flat, district, pincode, country, state,  } = req.body;
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
        res.redirect('/Address');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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
        const addressIndex = user.addresses.findIndex(address => address._id.toString() === id);

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
}



const addressedit = async (req, res) => {
    try {
    const userId = req.session.user;

    const data = await User.findById(userId)

        const id = req.params.id;
        console.log(req.body);
        const { addressType, mobileNumber, flat, district, pincode, country, state } = req.body;

        // Find the category to be updated
    const address = data.addresses.find(val => val._id.toString() == id )
        
        
        if (!address) {
            return res.status(404).sent('Address not found' );
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
      
        res.redirect('/address');
        

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Internal Server Error");
    }
};

const geteditAddress = async(req,res)=>{
    // const errorMessage = req.
    const userId = req.session.user;

    const id = req.params.i
    console.log(id)
    const data = await User.findById(userId)

    const address = data.addresses.find(val => val._id.toString() == id )
    res.render("user/address2",{address});
}


  module.exports = {getLogin,getRegister, initiateReturn , cancelOrder ,orderhistory ,order ,checkoutpost ,checkout ,getprofile ,getaddress ,editprofile ,postaddress  ,deleteaddress ,addressedit ,geteditAddress
                   ,removeFromCart ,updateQuantity ,getCartPage ,getcartnumber ,addToCart ,cartView ,forgotpasswordpost , verifyforgototp ,changepasswordpost , getOtp , postLogout ,changepass ,changepasspost ,forgotpassword,
                   postLogin ,logout ,postRegister ,resendotp ,changeCpassword ,getLogout ,display ,forher ,forhim ,home ,getHome ,otpvalidation ,mailsender ,resendforgototp ,   
                }