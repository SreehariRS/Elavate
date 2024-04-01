const express = require("express");
const router = express.Router();
const userController = require("../contorller/usercontroller");

// GET routes
router.get("/", userController.home);
router.get("/login", userController.getLogin);
router.get("/getRegister", userController.getRegister); 
router.get("/category/:id", userController.getProductsByCategory);

router.post("/checkReferralCode", userController.checkReferralCode)


router.get("/logout", userController.getLogout);
router.get("/home", userController.getHome);
router.get("/forher", userController.forher);
router.get("/forhim", userController.forhim);
router.get("/display/:id", userController.display);
router.get("/cartView", userController.cartView);
router.get("/cart", userController.addToCart);
router.get("/getcart/:userId", userController.getCartPage);
router.get("/getcartnumber/:userId", userController.getcartnumber);

// router.get("/addAddress", userController.addAddress);
// router.get("/profile", userController.profile);
// router.get("/profileedit/:id", userController.profileedit);


router.get("/checkout", userController.checkout);
router.post("/checkout", userController.checkoutpost);
router.get("/check-wallet", userController.getWalletBalance)
router.post("/update-wallet", userController.deductFromWallet)




router.get("/order", userController.order);
router.get("/orderhistory", userController.orderhistory);
router.get('/generate-invoice/:orderId', userController.generateInvoice);


router.get("/signout", userController.logout);
router.get("/changepass", userController.changepass);
router.get("/forgotpassword", userController.forgotpassword);
router.get("/resendforgototp",userController.resendforgototp);

router.get("/changeCpassword", userController.changeCpassword);
router.get("/otpget", userController.mailsender);
router.get("/resendotp", userController.resendotp);

// POST routes
router.post("/login", userController.postLogin);
router.post("/register", userController.postRegister);
router.post("/logout", userController.postLogout);
router.post("/updateQuantity", userController.updateQuantity);
router.post("/removeFromCart/:productId", userController.removeFromCart);

// router.post("/addAddress", userController.addAddresspost);
// router.post("/updateProfile/:id", userController.updateProfile);

router.post("/cancel-order/:orderId", userController.cancelOrder);
router.post("/changepass",userController.changepasspost);
router.post("/forgotpassword",userController.forgotpasswordpost)
router.post("/verifyforgototp",userController.verifyforgototp) 
router.post("/changeCpassword",userController.changepasswordpost)
router.post("/initiate-return/:orderId", userController.initiateReturn);
router.post("/verifyotp",userController.otpvalidation);

router.get("/address",userController.getaddress);
router.get("/profile",userController.getprofile);

router.post("/Address",userController.postaddress); // Corrected route path for adding address
// router.post("/edit/:id",userController.posteditaddress);
router.post("/delete/:id",userController.deleteaddress);
router.post("/editprofile/:userID",userController.editprofile);
router.post('/addressedit/:id', userController.addressedit);
router.get("/Editaddress/:i",userController.geteditAddress)
// router.post("/deleteAddress/:addressId", userController.deleteAddress);
// router.post('/updateAddress/:addressId',userController.updateAddress);

router.get("/wishlistPage", userController.wishlistPage);
router.post('/wishlistPage',userController.wishlistPagePost)
router.get('/wishlistInfo', userController.wishlistInfo);
router.post('/wishlistRemove', userController.removeProductFromWishlist);

router.get("/wallet", userController.wallet);
router.post('/verify-razorpay-payment',userController.verifyRazorpayPayment);
router.post("/create-razorpay-order",userController.createrazorpayorder)
router.post('/generate-razorpay-order', userController.generatewalletRazorpay);

router.post('/createReferral', userController.createReferral)


module.exports = router;



