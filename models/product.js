const mongoose = require("mongoose");

const productschema = new mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },

    category: {
        type: String,
    },
    price: {
        type: Number,
    },
    offerprice: {
        type: Number,
    },
    stock: {
        type: Number,
    },
    productImages: {
        type: [String],
    },
    isListed: {
        type: Boolean,
    },
    deleted: { type: Boolean, default: false }, // Add a 'deleted' field with default value 'false'
});

module.exports = mongoose.model("product", productschema);
