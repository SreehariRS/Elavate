const express = require ('express')
const router = express.Router()
const admincontroller = require('../contorller/admincontroller')
const upload = require('../middleware/upload')



router.get('/login',admincontroller.login);
router.get('/dashboard',admincontroller.dashboard1);
router.get('/productlist',admincontroller.productlist);
router.get('/productlist/:id',admincontroller.deleteproduct);
router.get('/addproduct',admincontroller.addproduct);
router.get('/editproduct/:Id',admincontroller.editproduct);
router.get('/Editcategory/:i',admincontroller.geteditCategory);

router.get('/customers',admincontroller.userlist)
router.get('/customers/:userId',admincontroller.userblock)

router.get('/category',admincontroller.Category)
router.post('/category/:id', admincontroller.editcateg);
router.post('/category',admincontroller.addcateg)


router.post('/deletecategory/:id',admincontroller.deletecateg)

router.post('/login',admincontroller.loginpost)
router.post('/editproduct/:productId',upload,admincontroller.editproductpost)
router.post('/addproduct',upload,admincontroller.addproductpost)


router.get("/order",admincontroller.order) 
router.post('/updateorder',admincontroller.updateOrderStatus)








module.exports = router;

