const User = require("../models/usermodel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const OTP = require("../models/otp");
const otpGenerator = require("otp-generator");

const getLogin = (req, res) => {
    try {
        if (req.session.user) {
            res.redirect("/home");
        } else {
            res.render("user/userlogin", { message: req.flash("message") });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash("message", "User not found");
            return res.redirect("/login");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("message", "Wrong Password");
            return res.redirect("/login");
        }
        req.session.user = user._id;
        res.redirect("/home");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const getRegister = (req, res) => {
    try {
        res.render("user/register", { message: req.flash("message") });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const postRegister = async (req, res) => {
    try {
        const { firstname, mobileNumber, email, password, confirmPassword } = req.body;
        const userExist = await User.findOne({ email });
        if (userExist) {
            req.flash("message", "User already exists");
            return res.redirect("/getRegister");
        }
        if (password !== confirmPassword) {
            req.flash("message", "Passwords do not match");
            return res.redirect("/getRegister");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            firstname,
            mobileNumber,
            email,
            password: hashedPassword,
            confirmPassword: hashedPassword,
        });
        await user.save();
        req.session.user = user._id;
        res.redirect("/otpget");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const logout = (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const postLogout = (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const mailsender = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        const newotp = new OTP({ email: user.email, otp });
        await newotp.save();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: user.email,
            subject: "OTP Verification",
            text: `Your OTP is ${otp}`,
        };
        await transporter.sendMail(mailOptions);
        res.render("user/otp", { email: user.email });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const resendotp = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        const newotp = new OTP({ email: user.email, otp });
        await newotp.save();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: user.email,
            subject: "OTP Verification",
            text: `Your OTP is ${otp}`,
        };
        await transporter.sendMail(mailOptions);
        res.render("user/otp", { email: user.email });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const otpvalidation = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findById(req.session.user);
        const otpdata = await OTP.findOne({ email: user.email, otp });
        if (!otpdata) {
            return res.render("user/otp", {
                email: user.email,
                message: "Invalid OTP",
            });
        }
        await User.findByIdAndUpdate(req.session.user, { isVerified: true });
        res.redirect("/home");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const forgotpassword = (req, res) => {
    try {
        res.render("user/forgotpassword");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const forgotpasswordpost = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash("message", "User not found");
            return res.redirect("/forgotpassword");
        }
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        const newotp = new OTP({ email, otp });
        await newotp.save();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is ${otp}`,
        };
        await transporter.sendMail(mailOptions);
        req.session.email = email;
        res.redirect("/verifyforgototp");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const verifyforgototp = (req, res) => {
    try {
        res.render("user/verifyforgototp", { email: req.session.email });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const resendforgototp = async (req, res) => {
    try {
        const email = req.session.email;
        const user = await User.findOne({ email });
        if (!user) {
            req.flash("message", "User not found");
            return res.redirect("/forgotpassword");
        }
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });
        const newotp = new OTP({ email, otp });
        await newotp.save();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL_ADDRESS,
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is ${otp}`,
        };
        await transporter.sendMail(mailOptions);
        res.render("user/verifyforgototp", { email });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const changepass = (req, res) => {
    try {
        res.render("user/changepass");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const changepasspost = async (req, res) => {
    try {
        const { oldpassword, newpassword, confirmpassword } = req.body;
        const user = await User.findById(req.session.user);
        const isMatch = await bcrypt.compare(oldpassword, user.password);
        if (!isMatch) {
            req.flash("message", "Old password is incorrect");
            return res.redirect("/changepass");
        }
        if (newpassword !== confirmpassword) {
            req.flash("message", "New passwords do not match");
            return res.redirect("/changepass");
        }
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        await User.findByIdAndUpdate(req.session.user, {
            password: hashedPassword,
            confirmPassword: hashedPassword,
        });
        res.redirect("/home");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const changeCpassword = (req, res) => {
    try {
        res.render("user/changecpassword");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const changepasswordpost = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body;
        if (password !== confirmpassword) {
            req.flash("message", "Passwords do not match");
            return res.redirect("/changeCpassword");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.findOneAndUpdate(
            { email: req.session.email },
            { password: hashedPassword, confirmPassword: hashedPassword }
        );
        res.redirect("/login");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    getLogin,
    postLogin,
    getRegister,
    postRegister,
    logout,
    postLogout,
    mailsender,
    resendotp,
    otpvalidation,
    forgotpassword,
    forgotpasswordpost,
    verifyforgototp,
    resendforgototp,
    changepass,
    changepasspost,
    changeCpassword,
    changepasswordpost,
};