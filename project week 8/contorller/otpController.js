// const otpGenerator = require("otp-generetor")
// const OTP = require('../models/otp')
// const User = require("../models/usermodel");
// const nodemailer = require('nodemailer')


// // exports.sendOTP = async (req, res) => {
// //   try {
// //     const { email } = req.body;
// //     // Check if user is already present
// //     const checkUserPresent = await User.findOne({ email });
// //     // If user found with provided email
// //     if (checkUserPresent) {
// //       return res.status(401).json({
// //         success: false,
// //         message: "User is already registered",
// //       });
// //     }
// //     let otp = otpGenerator.generate(6, {
// //       upperCaseAlphabets: false,
// //       lowerCaseAlphabets: false,
// //       specialChars: false,
// //     });
// //     let result = await OTP.findOne({ otp: otp });
// //     while (result) {
// //       otp = otpGenerator.generate(6, {
// //         upperCaseAlphabets: false,
// //       });
// //       result = await OTP.findOne({ otp: otp });
// //     }
// //     const otpPayload = { email, otp };
// //     const otpBody = await OTP.create(otpPayload);
// //     res.status(200).json({
// //       success: true,
// //       message: "OTP sent successfully",
// //       otp,
// //     });
// //     console.log(otpBody);
// //   } catch (error) {
// //     console.log(error.message);
// //     return res.status(500).json({ success: false, error: error.message });
// //   }
// // };


//   exports.resendOTP = async (req, res) => {
//     try {
//         const { email } = req.body;
//         // Check if user exists
//         const userExists = await User.findOne({ email });
//         if (!userExists) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found",
//             });
//         }
//         // Generate new OTP
//         const otp = otpGenerator.generate(6, {
//             upperCase: false,
//             specialChars: false,
//         });
//         // Update OTP in the database
//         await OTP.findOneAndUpdate({ email }, { otp });
//         // Send new OTP via email
//         await mailSender(email, "New OTP", `Your new OTP is: ${otp}`);
//         res.status(200).json({
//             success: true,
//             message: "New OTP sent successfully",
//         });
//     } catch (error) {
//         console.error("Error:", error);
//         return res.status(500).json({ success: false, error: "Internal Server Error" });
//     }
// };