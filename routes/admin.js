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

router.get("/login", adminAuthController.login);
router.get("/signout2", adminAuthController.logoutadmin);

router.get("/productlist", adminProductController.productlist);
router.get("/productlist/:id", adminProductController.deleteproduct);
router.get("/addproduct", adminProductController.addproduct);
router.get("/editproduct/:Id", adminProductController.editproduct);
router.delete("/deleteimage/:productId/:index", adminProductController.deleteImage);

router.get("/customers", adminUserController.userlist);
router.get("/customers/:userId", adminUserController.userblock);

router.get("/category", adminCategoryController.categoryList);
router.post("/category/:id", adminCategoryController.editcateg);
router.post("/category", adminCategoryController.addcateg);
router.get("/Editcategory/:i", adminCategoryController.geteditCategory);
router.post("/deletecategory/:id", adminCategoryController.deletecateg);

router.post("/login", adminAuthController.loginpost);
router.post("/editproduct/:productId", upload, adminProductController.editproductpost);
router.post("/addproduct", upload, adminProductController.addproductpost);

router.get("/order", adminOrderController.order);
router.post("/updateorder", adminOrderController.updateOrderStatus);
router.post("/approve-request", adminOrderController.approveRequest);

router.get("/coupon", couponcontroller.renderCreateCouponPage);
router.post("/coupon", couponcontroller.createCoupon);
router.get("/available", couponcontroller.getAvailableCoupons);
router.delete("/coupon/:id", couponcontroller.deleteCoupon);

router.get("/sales", adminSalesController.sales);
router.get("/pdf", adminSalesController.generatePDF);
router.post("/excel", adminSalesController.downloadExcel);

router.get("/home", adminSalesController.home);

router.post("/doughnut-graph", filtercontroller.doughnutGraph);
router.post("/doughnut-category-graph", filtercontroller.doughnutGraph2);

module.exports = router;