const express = require('express')
const router = express.Router();
const usercontroller = require("../contorller/usercontroller")
const checkblock = require('../public/js/checkblock')


router.get('/login',checkblock,usercontroller.getLogin);

module.exports = router ; 