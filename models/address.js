const mongoose = require("mongoose");
// // require("dotenv").config();
// require('dotenv').config()
// mongoose.connect(`mongodb://${process.env.LOCALHOST}`)
// // mongoose.connect(`mongodb://localhost:${process.env.DBport}/try1`)
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log("Failed to connect1");
// })
const addressSchema = new mongoose.Schema({
    addressType: {
        type: String,
        enum: ["home", "work"], // Address type can be 'home' or 'work'
    },
    country: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    pincode: {
        type: String,
        match: [/^\d{6}$/, "Pincode must be 6 digits"],
    },
    flat: {
        type: String,
    },
    district: { // Corrected field name to lowercase 'street'
        type: String,
    },
    state: {
        type: String,
    },
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
