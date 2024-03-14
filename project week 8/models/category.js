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
   
  }
});



const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
 