const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/adminAuthController");
const adminProductController = require("../controllers/adminProductController");
const adminUserController = require("../controllers/adminUserController");
const adminCategoryController = require("../controllers/adminCategoryController");
const adminOrderController = require("../controllers/adminOrderController");
const adminSalesController = require("../controllers/adminSalesController");
const couponcontroller = require("../controllers/couponcontroller");
const filtercontroller = require("../controllers/filtercontroller");

const upload = require("../middleware/upload");

// Middleware to check if admin is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next(); // Proceed to the next middleware/route handler
    } else {
        return res.redirect("/admin/login"); // Redirect to login if not authenticated
    }
};

// Middleware to prevent accessing login page when already logged in
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect("/admin/home");
    }
    return next();
};

// Public routes (no authentication required)
router.get("/login", redirectIfAuthenticated, adminAuthController.login);
router.post("/login", redirectIfAuthenticated, adminAuthController.loginpost);
router.get("/logout", adminAuthController.logoutadmin);
router.get("/signout2", adminAuthController.logoutadmin); // Keep for backward compatibility

// Redirect root admin path to login
router.get("/", (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect("/admin/home");
    }
    return res.redirect("/admin/login");
});

// Protected routes (require authentication)
router.get("/home", isAuthenticated, adminSalesController.home);

router.get("/productlist", isAuthenticated, adminProductController.productlist);
router.get("/productlist/:id", isAuthenticated, adminProductController.deleteproduct);
router.get("/addproduct", isAuthenticated, adminProductController.addproduct);
router.get("/editproduct/:Id", isAuthenticated, adminProductController.editproduct);
router.delete("/deleteimage/:productId/:index", isAuthenticated, adminProductController.deleteImage);
router.post("/editproduct/:productId", isAuthenticated, upload, adminProductController.editproductpost);
router.post("/addproduct", isAuthenticated, upload, adminProductController.addproductpost);

router.get("/customers", isAuthenticated, adminUserController.userlist);
router.get("/customers/:userId", isAuthenticated, adminUserController.userblock);

router.get("/category", isAuthenticated, adminCategoryController.categoryList);
router.post("/category/:id", isAuthenticated, adminCategoryController.editcateg);
router.post("/category", isAuthenticated, adminCategoryController.addcateg);
router.get("/editcategory/:id", isAuthenticated, adminCategoryController.geteditCategory); 
router.post("/deletecategory/:id", isAuthenticated, adminCategoryController.deletecateg);


router.get("/order", isAuthenticated, adminOrderController.order);
router.post("/updateorder", isAuthenticated, adminOrderController.updateOrderStatus);
router.post("/approve-request", isAuthenticated, adminOrderController.approveRequest);

router.get("/coupon", isAuthenticated, couponcontroller.renderCreateCouponPage);
router.post("/coupon", isAuthenticated, couponcontroller.createCoupon);
router.get("/available", isAuthenticated, couponcontroller.getAvailableCoupons);
router.delete("/coupon/:id", isAuthenticated, couponcontroller.deleteCoupon);

router.get("/sales", isAuthenticated, adminSalesController.sales);
router.get("/pdf", isAuthenticated, adminSalesController.generatePDF);
router.post("/excel", isAuthenticated, adminSalesController.downloadExcel);

router.post("/doughnut-graph", isAuthenticated, filtercontroller.doughnutGraph);
router.post("/doughnut-category-graph", isAuthenticated, filtercontroller.doughnutGraph2);

module.exports = router;