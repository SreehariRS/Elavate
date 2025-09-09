const express = require("express");
const router = express.Router();
const userAuthController = require("../controllers/userAuthController");
const userProfileController = require("../controllers/userProfileController");
const userCartController = require("../controllers/userCartController");
const userWishlistController = require("../controllers/userWishlistController");
const userOrderController = require("../controllers/userOrderController");
const userWalletController = require("../controllers/userWalletController");
const userPaymentController = require("../controllers/userPaymentController");
const checkblock = require("../middleware/checkblock");
const couponController = require("../controllers/couponcontroller");
const {
    checkPaymentLock,
    releasePaymentLock,
    releasePaymentLockEndpoint,
    checkPaymentLockEndpoint,
} = require("../controllers/userPaymentController"); // Import checkPaymentLock

// Public routes (no authentication needed)
router.get("/", userOrderController.home);
router.get("/login", checkblock, userAuthController.getLogin);
router.get("/getRegister", userAuthController.getRegister);
router.post("/login", checkblock, userAuthController.postLogin);
router.post("/register", userAuthController.postRegister);
router.get("/forgotpassword", userAuthController.forgotpassword);
router.post("/forgotpassword", userAuthController.forgotpasswordpost);
router.get("/verifyforgototp", userAuthController.getVerifyForgotOtp);
router.post("/verifyforgototp", userAuthController.postVerifyForgotOtp);
router.get("/resendforgototp", userAuthController.resendforgototp);
router.get("/changeCpassword", userAuthController.changeCpassword);
router.post("/changeCpassword", userAuthController.changepasswordpost);

// Protected routes (require authentication and block check)
router.get("/category/:id", checkblock, userOrderController.getProductsByCategory);
router.post("/checkReferralCode", checkblock, userProfileController.checkReferralCode);
router.get("/logout", checkblock, userAuthController.logout);
router.get("/home", checkblock, userOrderController.home);
router.get("/forher", checkblock, userOrderController.forher);
router.get("/forhim", checkblock, userOrderController.forhim);
router.get("/display/:id", checkblock, userOrderController.display);
router.get("/cartView", checkblock, userCartController.cartView);
router.get("/cart", checkblock, userCartController.addToCart);
router.get("/getcart/:userId", checkblock, userCartController.getCartPage);
router.get("/getcartnumber/:userId", checkblock, userCartController.getcartnumber);
router.get("/checkout", checkblock, userOrderController.checkout);
router.post("/checkout", checkblock, userOrderController.checkoutpost);
router.post("/checkouterror", checkblock, userOrderController.checkouterrorpost);
router.post("/retry-checkout", checkblock, userOrderController.retryCheckout);
router.post("/create-razorpay-order", checkblock, userPaymentController.createrazorpayorder);
router.post("/verify-razorpay-payment", checkblock, userPaymentController.verifyRazorpayPayment);
router.post("/update-order-status", checkblock, userPaymentController.updateOrderStatus);
router.get("/check-wallet", checkblock, userWalletController.getWalletBalance);
router.post("/update-wallet", checkblock, userWalletController.addToWallet);
router.get("/order", checkblock, userOrderController.order);
router.get("/orderhistory", checkblock, userOrderController.orderhistory);
router.get("/generate-invoice/:orderId", checkblock, userOrderController.generateInvoice);
router.get("/signout", checkblock, userAuthController.logout);
router.get("/changepass", checkblock, userAuthController.changepass);
router.get("/otpget", checkblock, userAuthController.mailsender);
router.get("/resendotp", checkblock, userAuthController.resendotp);
router.post("/logout", checkblock, userAuthController.postLogout);
router.post("/updateQuantity", checkblock, userCartController.updateQuantity);
router.post("/removeFromCart/:productId", checkblock, userCartController.removeFromCart);
router.post("/cancel-order/:orderId", checkblock, userOrderController.cancelOrder);
router.post("/changepass", checkblock, userAuthController.changepasspost);
router.post("/initiate-return/:orderId", checkblock, userOrderController.initiateReturn);
router.post("/initiate-refund/:orderId", checkblock, userOrderController.initiateRefund);
router.post("/verifyotp", checkblock, userAuthController.otpvalidation);
router.get("/address", checkblock, userProfileController.getaddress);
router.get("/profile", checkblock, userProfileController.getprofile);
router.post("/Address", checkblock, userProfileController.postaddress);
router.post("/delete/:id", checkblock, userProfileController.deleteaddress);
router.post("/editprofile/:userID", checkblock, userProfileController.editprofile);
router.post("/addressedit/:id", checkblock, userProfileController.addressedit);
router.get("/Editaddress/:i", checkblock, userProfileController.geteditAddress);
router.get("/wishlistPage", checkblock, userWishlistController.wishlistPage);
router.post("/wishlistPage", checkblock, userWishlistController.wishlistPagePost);
router.get("/wishlistInfo", checkblock, userWishlistController.wishlistInfo);
router.post("/wishlistRemove", checkblock, userWishlistController.removeProductFromWishlist);
router.get("/wallet", checkblock, userWalletController.wallet);
router.post("/generate-razorpay-order", checkblock, userPaymentController.generatewalletRazorpay);
router.post("/createReferral", checkblock, userProfileController.createReferral);
router.post("/validate-coupon", checkblock, couponController.validateCoupon);
router.get("/check-payment-lock", checkblock, async (req, res) => {
    try {
        const userId = req.session.user;
        const isLocked = await checkPaymentLock(userId);
        res.json({ isLocked });
    } catch (error) {
        console.error("Error checking payment lock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/release-payment-lock", checkblock, async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || userId !== req.session.user) {
            return res.status(400).json({ success: false, message: "Invalid or unauthorized user ID" });
        }
        const released = await releasePaymentLock(userId);
        if (released) {
            res.json({ success: true, message: "Payment lock released successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to release payment lock" });
        }
    } catch (error) {
        console.error("Error releasing payment lock:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});
router.post("/release-payment-lock", releasePaymentLockEndpoint);
router.get("/check-payment-lock", checkPaymentLockEndpoint);

module.exports = router;
