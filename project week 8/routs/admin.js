const express = require ('express')
const router = express.Router()
const admincontroller = require('../contorller/admincontroller')
const couponcontroller = require('../contorller/couponcontroller')
const upload = require('../middleware/upload')



router.get('/login',admincontroller.login);
router.get("/signout2",admincontroller.logoutadmin)

router.get('/dashboard',admincontroller.dashboard1);

router.get('/productlist',admincontroller.productlist);
router.get('/productlist/:id',admincontroller.deleteproduct);
router.get('/addproduct',admincontroller.addproduct);
router.get('/editproduct/:Id',admincontroller.editproduct);



router.get('/customers',admincontroller.userlist)
router.get('/customers/:userId',admincontroller.userblock)

router.get('/category',admincontroller.Category)
router.post('/category/:id', admincontroller.editcateg);
router.post('/category',admincontroller.addcateg)
router.get('/Editcategory/:i',admincontroller.geteditCategory);

router.post('/deletecategory/:id',admincontroller.deletecateg)

router.post('/login',admincontroller.loginpost)
router.post('/editproduct/:productId',upload,admincontroller.editproductpost)
router.post('/addproduct',upload,admincontroller.addproductpost)


router.get("/order",admincontroller.order) 
router.post('/updateorder',admincontroller.updateOrderStatus)

//coupon
router.get('/coupon', couponcontroller.renderCreateCouponPage);
router.post('/coupon', couponcontroller.createCoupon);
router.get('/available', couponcontroller.getAvailableCoupons);
router.delete('/coupon/:id', couponcontroller.deleteCoupon);

//sales report
router.get("/sales",admincontroller.sales)
router.post('/filter-sales', admincontroller.filterSales)
router.post('/filter-sales-by-date', admincontroller.filterSalesByDate);
router.post('/filter-sales-by-date-range', admincontroller.filterByDateRange);





module.exports = router;

