const express = require("express");
const router = express.Router();
const User = require("../models/usermodel");
const mongoose = require("../config/dbconnect");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const otp = require("../models/otp");
const { render } = require("ejs");
const product = require("../models/product");
const Cart = require("../models/cart");
const Category = require("../models/category");
const collection1 = require("../models/usermodel");
const db = require("../models/product");
const orders = require("../models/order");
const Swal = require("sweetalert2");
const flash = require("connect-flash");
const otpgenerator = require("otp-generator");
const Address = require("../models/address");
const wishlist = require("../models/wishlist");
const AdminCoupon = require("../models/coupon");

const renderCreateCouponPage = (req, res) => {
    let msg;
    res.render("admin/coupon", { msg });
};

const createCoupon = async (req, res) => {
    const { code, discountValue, expirationDate, minPurchaseAmount, maxApplicableAmount } = req.body;

    try {
        if (!code || !discountValue || !expirationDate) {
            return res.render("admin/coupon", { msg: "All required fields must be filled" });
        }
        const adminCoupon = await AdminCoupon.create({
            code,
            discountValue: parseFloat(discountValue),
            expirationDate: new Date(expirationDate),
            minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
            maxApplicableAmount: parseFloat(maxApplicableAmount) || Infinity,
        });

        res.render("admin/coupon", { msg: "Coupon created successfully" });
    } catch (error) {
        console.error("Error creating admin coupon:", error);
        if (error.code === 11000) {
            res.render("admin/coupon", { msg: "Coupon already exists" });
        } else {
            res.status(500).render("admin/coupon", { msg: "Internal Server Error" });
        }
    }
};

const getAvailableCoupons = async (req, res) => {
    console.log("getAvailableCoupons");
    try {
        const availableCoupons = await AdminCoupon.find({ isActive: true, expirationDate: { $gte: new Date() } });
        console.log(availableCoupons);
        res.json(availableCoupons);
    } catch (error) {
        console.error("Error fetching available coupons:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const getCouponById = async (req, res) => {
    const couponId = req.params.id;

    try {
        const coupon = await AdminCoupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }

        res.json(coupon);
    } catch (error) {
        console.error("Error fetching coupon:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const updateCoupon = async (req, res) => {
    const couponId = req.params.id;
    const { code, discountValue, expirationDate, minPurchaseAmount, maxApplicableAmount } = req.body;

    try {
        if (!code || !discountValue || !expirationDate) {
            return res.status(400).json({ error: "All required fields must be filled" });
        }

        const updatedCoupon = await AdminCoupon.findByIdAndUpdate(
            couponId,
            {
                code,
                discountValue: parseFloat(discountValue),
                expirationDate: new Date(expirationDate),
                minPurchaseAmount: parseFloat(minPurchaseAmount) || 0,
                maxApplicableAmount: parseFloat(maxApplicableAmount) || Infinity,
            },
            { new: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }

        res.json({ message: "Coupon updated successfully", coupon: updatedCoupon });
    } catch (error) {
        console.error("Error updating coupon:", error);
        if (error.code === 11000) {
            res.status(400).json({ error: "Coupon code already exists" });
        } else {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

const validateCoupon = async (req, res) => {
    const { code, cartTotal } = req.body;
    const userId = req.session.user;

    try {
        if (!code || cartTotal === undefined) {
            return res.status(400).json({ success: false, message: "Invalid request data" });
        }

        const coupon = await AdminCoupon.findOne({
            code,
            isActive: true,
            expirationDate: { $gte: new Date() },
            usedBy: { $nin: [userId] },
        });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid or already used coupon" });
        }

        const cartTotalNum = parseFloat(cartTotal);
        if (isNaN(cartTotalNum)) {
            return res.status(400).json({ success: false, message: "Invalid cart total" });
        }

        if (cartTotalNum < coupon.minPurchaseAmount) {
            return res.json({ success: false, message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required` });
        }

        // Calculate discount as percentage of cart total, capped at maxApplicableAmount
        const discountValue = coupon.discountValue;
        let discount = cartTotalNum * (discountValue / 100);
        if (discount > coupon.maxApplicableAmount && coupon.maxApplicableAmount !== Infinity) {
            discount = coupon.maxApplicableAmount;
        }

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                discountValue: discountValue,
                discount: discount,
            },
        });
    } catch (error) {
        console.error("Error validating coupon:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deleteCoupon = async (req, res) => {
    const couponId = req.params.id;

    try {
        const deletedCoupon = await AdminCoupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ error: "Coupon not found" });
        }

        res.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { deleteCoupon, getAvailableCoupons, getCouponById, updateCoupon, createCoupon, renderCreateCouponPage, validateCoupon };