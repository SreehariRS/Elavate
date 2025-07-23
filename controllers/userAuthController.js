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
        res.render("user/usersignin", { message: req.flash("message") });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const postRegister = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, referralCode } = req.body;
        
        const userExist = await User.findOne({ email });
        if (userExist) {
            req.flash("message", "User already exists");
            return res.redirect("/getRegister");
        }
        
        if (password !== confirmPassword) {
            req.flash("message", "Passwords do not match");
            return res.redirect("/getRegister");
        }
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            req.flash("message", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
            return res.redirect("/getRegister");
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            firstname: name,
            mobileNumber: req.body.mobileNumber || "0000000000",
            email,
            password: hashedPassword,
            confirmPassword: hashedPassword,
            referralCode: referralCode || null
        });
        
        await user.save();
        req.session.user = user._id;
        res.redirect("/otpget");
    } catch (error) {
        console.log(error);
        req.flash("message", "Registration failed. Please try again.");
        res.redirect("/getRegister");
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
        if (!user) {
            req.flash("message", "User not found");
            return res.redirect("/getRegister");
        }
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
        
        try {
            await transporter.sendMail(mailOptions);
            res.render("user/otp", { email: user.email, message: req.flash("message") });
        } catch (emailError) {
            console.log("Email sending failed:", emailError);
            req.flash("message", "Failed to send OTP email. Please use the OTP saved in the database or try resending.");
            res.render("user/otp", { email: user.email, message: req.flash("message") });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const resendotp = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (!user) {
            req.flash("message", "User not found");
            return res.redirect("/getRegister");
        }
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
        
        try {
            await transporter.sendMail(mailOptions);
            res.render("user/otp", { email: user.email, message: req.flash("message") });
        } catch (emailError) {
            console.log("Email sending failed:", emailError);
            req.flash("message", "Failed to send OTP email. Please use the OTP saved in the database or try resending.");
            res.render("user/otp", { email: user.email, message: req.flash("message") });
        }
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
            return res.json({
                success: false,
                message: "Invalid OTP"
            });
        }
        await User.findByIdAndUpdate(req.session.user, { isVerified: true });
        return res.json({
            success: true,
            message: "OTP verified successfully"
        });
    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

const forgotpassword = (req, res) => {
    try {
        res.render("user/forgotpassword", { message: req.flash("message") });
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
        
        try {
            await transporter.sendMail(mailOptions);
            req.session.email = email;
            res.redirect("/verifyforgototp");
        } catch (emailError) {
            console.log("Email sending failed:", emailError);
            req.flash("message", "Failed to send OTP email. Please use the OTP saved in the database or try resending.");
            req.session.email = email;
            res.redirect("/verifyforgototp");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const getVerifyForgotOtp = (req, res) => {
    try {
        res.render("user/otpforgot", { email: req.session.email, message: req.flash("message") });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const postVerifyForgotOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const email = req.session.email;
        const otpdata = await OTP.findOne({ email, otp }).sort({ createdAt: -1 });
        if (!otpdata) {
            req.flash("message", "Invalid OTP");
            return res.json({
                success: false,
                message: "Invalid OTP"
            });
        }
        res.json({
            success: true,
            message: "OTP verified successfully",
            redirect: "/changeCpassword"
        });
    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: "Internal Server Error"
        });
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
        
        try {
            await transporter.sendMail(mailOptions);
            res.render("user/otpforgot", { email, message: req.flash("message") });
        } catch (emailError) {
            console.log("Email sending failed:", emailError);
            req.flash("message", "Failed to send OTP email. Please use the OTP saved in the database or try resending.");
            res.render("user/otpforgot", { email, message: req.flash("message") });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const changepass = (req, res) => {
    try {
        res.render("user/changepass", { message: req.flash("message") });
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
        res.render("user/changecpassword", { message: req.flash("message") });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const changepasswordpost = async (req, res) => {
    try {
        const { password, confirmpassword } = req.body;
        
        // Check if both fields are provided
        if (!password || !confirmpassword) {
            return res.json({
                success: false,
                message: "Password and confirm password are required"
            });
        }
        
        // Check if passwords match
        if (password !== confirmpassword) {
            return res.json({
                success: false,
                message: "Passwords do not match. Please try again."
            });
        }
        
        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.json({
                success: false,
                message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            });
        }
        
        const user = await User.findOne({ email: req.session.email });
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }
        
        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return res.json({
                success: false,
                message: "New password cannot be the same as the current password."
            });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const updateResult = await User.findOneAndUpdate(
            { email: req.session.email },
            { password: hashedPassword, confirmPassword: hashedPassword },
            { new: true }
        );
        
        if (!updateResult) {
            return res.json({
                success: false,
                message: "Failed to update password. Please try again."
            });
        }
        
        req.session.email = null; // Clear session email after successful password update
        return res.json({
            success: true,
            message: "Password updated successfully",
            redirect: "/login"
        });
    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            message: "Failed to update password. Please try again."
        });
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
    getVerifyForgotOtp,
    postVerifyForgotOtp,
    resendforgototp,
    changepass,
    changepasspost,
    changeCpassword,
    changepasswordpost,
};