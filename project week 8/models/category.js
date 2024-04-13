const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
   
  },
  OfferApplied:{type: Boolean, default: false },
  OfferPercentage:{type: Number, default: 0 }
});



const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
 