const User = require("../models/usermodel");
const product = require("../models/product");
const otpGenerator = require("otp-generator");

const getprofile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        res.render("user/profile", { user });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const editprofile = async (req, res) => {
    try {
        const { userID } = req.params;
        const { firstname, mobileNumber, email } = req.body;
        await User.findByIdAndUpdate(userID, { firstname, mobileNumber, email });
        res.redirect("/profile");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const getaddress = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        res.render("user/address", { user });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const postaddress = async (req, res) => {
    try {
        const { addressType, country, mobileNumber, pincode, flat, district, state } = req.body;
        const user = await User.findById(req.session.user);
        user.addresses.push({
            addressType,
            country,
            mobileNumber,
            pincode,
            flat,
            district,
            state,
        });
        await user.save();
        res.redirect("/address");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const geteditAddress = async (req, res) => {
    try {
        const id = req.params.i;
        const user = await User.findById(req.session.user);
        const address = user.addresses[id];
        res.render("user/editaddress", { address, index: id });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const addressedit = async (req, res) => {
    try {
        const id = req.params.id;
        const { addressType, country, mobileNumber, pincode, flat, district, state } = req.body;
        const user = await User.findById(req.session.user);
        user.addresses[id] = { addressType, country, mobileNumber, pincode, flat, district, state };
        await user.save();
        res.redirect("/address");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteaddress = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findById(req.session.user);
        user.addresses.splice(id, 1);
        await user.save();
        res.redirect("/address");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const createReferral = async (req, res) => {
    try {
        const { referredCode } = req.body;
        const user = await User.findById(req.session.user);
        const referralCode = otpGenerator.generate(6, {
            upperCaseAlphabets: true,
            specialChars: false,
        });
        user.referralCode = referralCode;
        if (referredCode) {
            user.referredCode = referredCode;
        }
        await user.save();
        res.redirect("/profile");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const checkReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.body;
        const user = await User.findOne({ referralCode });
        if (user) {
            res.json({ valid: true });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getprofile,
    editprofile,
    getaddress,
    postaddress,
    geteditAddress,
    addressedit,
    deleteaddress,
    createReferral,
    checkReferralCode,
};