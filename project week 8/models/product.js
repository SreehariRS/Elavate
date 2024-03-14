const mongoose = require('mongoose');
// // require("dotenv").config();
// require('dotenv').config()
// mongoose.connect(`mongodb://${process.env.LOCALHOST}`)
// // mongoose.connect(`mongodb://localhost:${process.env.DBport}/try1`)
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log("Failed to connect7");
// })

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
      stock: {
        type: Number,
        
      },
      productImages: {
        type: [String] 
      
      },
      isListed: {
        type: Boolean,
        
      },
      deleted: { type: Boolean, default: false } // Add a 'deleted' field with default value 'false'

})


module.exports = mongoose.model('product',productschema)
