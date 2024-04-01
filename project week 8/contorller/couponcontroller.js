
const express = require("express");
const router = express();
const User = require("../models/usermodel");
const mongoose = require("../config/dbconnect");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const otp = require("../models/otp");
const { render } = require("ejs");
const product = require("../models/product");
const Cart = require("../models/cart");
const Category = require("../models/category");
const collection1 = require("../models/usermodel"); //conecting mongodb to make collection1
const db = require("../models/product");
const orders = require("../models/order")
const Swal = require('sweetalert2');
const flash = require('connect-flash');
const otpgenerator =require('otp-generator')
const Address = require('../models/address')
const wishlist = require('../models/wishlist');
const AdminCoupon = require('../models/coupon')




const renderCreateCouponPage = (req, res) => {
    res.render('admin/coupon');
  };

  const createCoupon = async (req, res) => {
    const { code, discountValue, expirationDate } = req.body;
  
    try {
      // Create a new admin coupon
      const adminCoupon = await AdminCoupon.create({
        code,
        discountValue,
        expirationDate,
      });
  
      res.render('admin/coupon', { success: 'Coupon created successfully' });
    } catch (error) {
      console.error('Error creating admin coupon:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  const getAvailableCoupons = async (req, res) => {
    console.log("getAvailableCoupons");
    try {
      const availableCoupons = await AdminCoupon.find({ isActive: true, expirationDate: { $gte: new Date() } });
      console.log(availableCoupons);
      res.json(availableCoupons);
    } catch (error) {
      console.error('Error fetching available coupons:', error);
      res.status(500).json({ error: 'Internala Server Error' });
    }
  };

  const deleteCoupon = async (req, res) => {
    const couponId = req.params.id;
  
    try {
      const deletedCoupon = await AdminCoupon.findByIdAndDelete(couponId);
  
      if (!deletedCoupon) {
        return res.status(404).json({ error: 'Coupon not found' });
      }
  
      res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  module.exports ={deleteCoupon ,getAvailableCoupons ,createCoupon ,renderCreateCouponPage}