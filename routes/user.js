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
const ROUTES = require("../utils/route"); 
const {
    checkPaymentLock,
    releasePaymentLock,
    releasePaymentLockEndpoint,
    checkPaymentLockEndpoint,
} = require("../controllers/userPaymentController"); 


router.get(ROUTES.USER.BASE, userOrderController.home);
router.get(ROUTES.USER.LOGIN, checkblock, userAuthController.getLogin);
router.get(ROUTES.USER.REGISTER, userAuthController.getRegister);
router.post(ROUTES.USER.LOGIN, checkblock, userAuthController.postLogin);
router.post(ROUTES.USER.REGISTER, userAuthController.postRegister);
router.get(ROUTES.USER.FORGOT_PASSWORD, userAuthController.forgotpassword);
router.post(ROUTES.USER.FORGOT_PASSWORD, userAuthController.forgotpasswordpost);
router.get(ROUTES.USER.VERIFY_FORGOT_OTP, userAuthController.getVerifyForgotOtp);
router.post(ROUTES.USER.VERIFY_FORGOT_OTP, userAuthController.postVerifyForgotOtp);
router.get(ROUTES.USER.RESEND_FORGOT_OTP, userAuthController.resendforgototp);
router.get(ROUTES.USER.CHANGE_PASSWORD, userAuthController.changeCpassword);
router.post(ROUTES.USER.CHANGE_PASSWORD, userAuthController.changepasswordpost);


router.get(ROUTES.USER.CATEGORY, checkblock, userOrderController.getProductsByCategory);
router.post(ROUTES.USER.CHECK_REFERRAL_CODE, checkblock, userProfileController.checkReferralCode);
router.get(ROUTES.USER.LOGOUT, checkblock, userAuthController.logout);
router.get(ROUTES.USER.HOME, checkblock, userOrderController.home);
router.get(ROUTES.USER.FOR_HER, checkblock, userOrderController.forher);
router.get(ROUTES.USER.FOR_HIM, checkblock, userOrderController.forhim);
router.get(ROUTES.USER.DISPLAY, checkblock, userOrderController.display);
router.get(ROUTES.USER.CART_VIEW, checkblock, userCartController.cartView);
router.get(ROUTES.USER.ADD_TO_CART, checkblock, userCartController.addToCart);
router.get(ROUTES.USER.GET_CART, checkblock, userCartController.getCartPage);
router.get(ROUTES.USER.GET_CART_NUMBER, checkblock, userCartController.getcartnumber);
router.get(ROUTES.USER.CHECKOUT, checkblock, userOrderController.checkout);
router.post(ROUTES.USER.CHECKOUT, checkblock, userOrderController.checkoutpost);
router.post(ROUTES.USER.CHECKOUT_ERROR, checkblock, userOrderController.checkouterrorpost);
router.post(ROUTES.USER.RETRY_CHECKOUT, checkblock, userOrderController.retryCheckout);
router.post(ROUTES.USER.CREATE_RAZORPAY_ORDER, checkblock, userPaymentController.createrazorpayorder);
router.post(ROUTES.USER.VERIFY_RAZORPAY_PAYMENT, checkblock, userPaymentController.verifyRazorpayPayment);
router.post(ROUTES.USER.UPDATE_ORDER_STATUS, checkblock, userPaymentController.updateOrderStatus);
router.get(ROUTES.USER.CHECK_WALLET, checkblock, userWalletController.getWalletBalance);
router.post(ROUTES.USER.UPDATE_WALLET, checkblock, userWalletController.addToWallet);
router.get(ROUTES.USER.ORDER, checkblock, userOrderController.order);
router.get(ROUTES.USER.ORDER_HISTORY, checkblock, userOrderController.orderhistory);
router.get(ROUTES.USER.GENERATE_INVOICE, checkblock, userOrderController.generateInvoice);
router.get(ROUTES.USER.SIGNOUT, checkblock, userAuthController.logout);
router.get(ROUTES.USER.CHANGE_PASS, checkblock, userAuthController.changepass);
router.get(ROUTES.USER.OTP_GET, checkblock, userAuthController.mailsender);
router.get(ROUTES.USER.RESEND_OTP, checkblock, userAuthController.resendotp);
router.post(ROUTES.USER.LOGOUT, checkblock, userAuthController.postLogout);
router.post(ROUTES.USER.UPDATE_QUANTITY, checkblock, userCartController.updateQuantity);
router.post(ROUTES.USER.REMOVE_FROM_CART, checkblock, userCartController.removeFromCart);
router.post(ROUTES.USER.CANCEL_ORDER, checkblock, userOrderController.cancelOrder);
router.post(ROUTES.USER.CHANGE_PASS, checkblock, userAuthController.changepasspost);
router.post(ROUTES.USER.INITIATE_RETURN, checkblock, userOrderController.initiateReturn);
router.post(ROUTES.USER.INITIATE_REFUND, checkblock, userOrderController.initiateRefund);
router.post(ROUTES.USER.VERIFY_OTP, checkblock, userAuthController.otpvalidation);
router.get(ROUTES.USER.ADDRESS, checkblock, userProfileController.getaddress);
router.get(ROUTES.USER.PROFILE, checkblock, userProfileController.getprofile);
router.post(ROUTES.USER.ADD_ADDRESS, checkblock, userProfileController.postaddress);
router.post(ROUTES.USER.DELETE_ADDRESS, checkblock, userProfileController.deleteaddress);
router.post(ROUTES.USER.EDIT_PROFILE, checkblock, userProfileController.editprofile);
router.post(ROUTES.USER.EDIT_ADDRESS, checkblock, userProfileController.addressedit);
router.get(ROUTES.USER.GET_EDIT_ADDRESS, checkblock, userProfileController.geteditAddress);
router.get(ROUTES.USER.WISHLIST_PAGE, checkblock, userWishlistController.wishlistPage);
router.post(ROUTES.USER.WISHLIST_PAGE, checkblock, userWishlistController.wishlistPagePost);
router.get(ROUTES.USER.WISHLIST_INFO, checkblock, userWishlistController.wishlistInfo);
router.post(ROUTES.USER.REMOVE_FROM_WISHLIST, checkblock, userWishlistController.removeProductFromWishlist);
router.get(ROUTES.USER.WALLET, checkblock, userWalletController.wallet);
router.post(ROUTES.USER.GENERATE_WALLET_RAZORPAY, checkblock, userPaymentController.generatewalletRazorpay);
router.post(ROUTES.USER.CREATE_REFERRAL, checkblock, userProfileController.createReferral);
router.post(ROUTES.USER.VALIDATE_COUPON, checkblock, couponController.validateCoupon);
router.get(ROUTES.USER.CHECK_PAYMENT_LOCK, checkblock, async (req, res) => {
    try {
        const userId = req.session.user;
        const isLocked = await checkPaymentLock(userId);
        res.json({ isLocked });
    } catch (error) {
        console.error("Error checking payment lock:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post(ROUTES.USER.RELEASE_PAYMENT_LOCK, checkblock, async (req, res) => {
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
router.post(ROUTES.USER.RELEASE_PAYMENT_LOCK, releasePaymentLockEndpoint);
router.get(ROUTES.USER.CHECK_PAYMENT_LOCK, checkPaymentLockEndpoint);

module.exports = router;