const mongoose = require('mongoose')

// connecting with MongoDB
mongoose.connect(process.env.MONGODB).then(()=>{
    console.log("mongodb is connected")
}).catch(()=>{
    console.log("mongodb not connected");
})