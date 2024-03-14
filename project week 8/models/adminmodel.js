const mongoose = require('mongoose')
// // require("dotenv").config();
// require('dotenv').config()
// mongoose.connect(`mongodb://${process.env.LOCALHOST}`)
// // mongoose.connect(`mongodb://localhost:${process.env.DBport}/try1`)
// .then(()=>{
//     console.log("mongodb connected");
// })
// .catch(()=>{
//     console.log("Failed to connect2");
// })
const schema = new mongoose.Schema({
   
    adminName:{

    type:String,
  
   },
   password:{

    type:String,
        
   },
   
})

module.exports = mongoose.model('admin',schema)