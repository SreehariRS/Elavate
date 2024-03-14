const mongoose = require("mongoose");
// // require("dotenv").config();
// require('dotenv').config()
// mongoose.connect(`mongodb://${process.env.LOCALHOST}`)
// // mongoose.connect(`mongodb://localhost:${process.env.DBport}/try1`)
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log("Failed to connect6");
// })
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    
  },
  otp: {
    type: String,
    
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60,
  },
});
otpSchema.index({ createdAt: 1 }, {expireAfterSeconds: 60});

module.exports = mongoose.model("OTP", otpSchema);