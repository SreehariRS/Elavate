const mongoose = require('mongoose');
// // require("dotenv").config();
// require('dotenv').config()
// mongoose.connect(`mongodb://${process.env.LOCALHOST}`)
// // mongoose.connect(`mongodb://localhost:${process.env.DBport}/try1`)
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log("Failed to connect4");
// })
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
   
  },
  OfferApplied:{type: Boolean, default: false },
  OfferPercentage:{type: Number, default: 0 }
});



const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
 