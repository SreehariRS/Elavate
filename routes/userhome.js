const express = require("express");
const router = express.Router();
const userAuthController = require("../controllers/userAuthController");
const checkblock = require("../middleware/checkblock");

router.get("/login", checkblock, userAuthController.getLogin);

module.exports = router;