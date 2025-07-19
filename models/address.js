const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    addressType: {
        type: String,
        enum: ["home", "work"],
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
    district: {
        type: String,
    },
    state: {
        type: String,
    },
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
