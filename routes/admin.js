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
const ROUTES = require("../utils/route"); 

const upload = require("../middleware/upload");


const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return next();
    } else {
        return res.redirect(ROUTES.ADMIN.LOGIN); 
    }
};


const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect(ROUTES.ADMIN.HOME);
    }
    return next();
};


router.get(ROUTES.ADMIN.LOGIN, redirectIfAuthenticated, adminAuthController.login);
router.post(ROUTES.ADMIN.LOGIN, redirectIfAuthenticated, adminAuthController.loginpost);
router.get(ROUTES.ADMIN.LOGOUT, adminAuthController.logoutadmin);
router.get(ROUTES.ADMIN.SIGNOUT2, adminAuthController.logoutadmin);


router.get(ROUTES.ADMIN.BASE, (req, res) => {
    if (req.session && req.session.admin) {
        return res.redirect(ROUTES.ADMIN.HOME);
    }
    return res.redirect(ROUTES.ADMIN.LOGIN);
});


router.get(ROUTES.ADMIN.HOME, isAuthenticated, adminSalesController.home);

router.get(ROUTES.ADMIN.PRODUCT_LIST, isAuthenticated, adminProductController.productlist);
router.get(ROUTES.ADMIN.DELETE_PRODUCT, isAuthenticated, adminProductController.deleteproduct);
router.get(ROUTES.ADMIN.ADD_PRODUCT, isAuthenticated, adminProductController.addproduct);
router.get(ROUTES.ADMIN.EDIT_PRODUCT, isAuthenticated, adminProductController.editproduct);
router.delete(ROUTES.ADMIN.DELETE_IMAGE, isAuthenticated, adminProductController.deleteImage);
router.post(ROUTES.ADMIN.EDIT_PRODUCT_POST, isAuthenticated, upload, adminProductController.editproductpost);
router.post(ROUTES.ADMIN.ADD_PRODUCT_POST, isAuthenticated, upload, adminProductController.addproductpost);

router.get(ROUTES.ADMIN.CUSTOMERS, isAuthenticated, adminUserController.userlist);
router.post(ROUTES.ADMIN.TOGGLE_BLOCK_USER, isAuthenticated, adminUserController.userblock);

router.get(ROUTES.ADMIN.CATEGORY, isAuthenticated, adminCategoryController.categoryList);
router.post(ROUTES.ADMIN.EDIT_CATEGORY, isAuthenticated, adminCategoryController.editcateg);
router.post(ROUTES.ADMIN.ADD_CATEGORY, isAuthenticated, adminCategoryController.addcateg);
router.get(ROUTES.ADMIN.GET_EDIT_CATEGORY, isAuthenticated, adminCategoryController.geteditCategory); 
router.post(ROUTES.ADMIN.DELETE_CATEGORY, isAuthenticated, adminCategoryController.deletecateg);

router.get(ROUTES.ADMIN.ORDER, isAuthenticated, adminOrderController.order);
router.post(ROUTES.ADMIN.UPDATE_ORDER, isAuthenticated, adminOrderController.updateOrderStatus);
router.post(ROUTES.ADMIN.APPROVE_REQUEST, isAuthenticated, adminOrderController.approveRequest);

router.get(ROUTES.ADMIN.COUPON, isAuthenticated, couponcontroller.renderCreateCouponPage);
router.post(ROUTES.ADMIN.COUPON, isAuthenticated, couponcontroller.createCoupon);
router.get(ROUTES.ADMIN.AVAILABLE_COUPONS, isAuthenticated, couponcontroller.getAvailableCoupons);
router.get(ROUTES.ADMIN.GET_COUPON_BY_ID, isAuthenticated, couponcontroller.getCouponById);
router.put(ROUTES.ADMIN.UPDATE_COUPON, isAuthenticated, couponcontroller.updateCoupon);
router.delete(ROUTES.ADMIN.DELETE_COUPON, isAuthenticated, couponcontroller.deleteCoupon);

router.get(ROUTES.ADMIN.SALES, isAuthenticated, adminSalesController.sales);
router.get(ROUTES.ADMIN.PDF, isAuthenticated, adminSalesController.generatePDF);
router.post(ROUTES.ADMIN.EXCEL, isAuthenticated, adminSalesController.downloadExcel);

router.post(ROUTES.ADMIN.DOUGHNUT_GRAPH, isAuthenticated, filtercontroller.doughnutGraph);
router.post(ROUTES.ADMIN.DOUGHNUT_CATEGORY_GRAPH, isAuthenticated, filtercontroller.doughnutGraph2);

module.exports = router;