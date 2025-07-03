const mongoose = require("mongoose");

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
