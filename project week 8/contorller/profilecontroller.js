// const express=require("express");
// const router=express();
// // const mongoose=require("../config/dbConnect");
// const Address = require("../model/addressModel");
// const collection =require('../model/userModel');
// const userData = require("../model/userModel")
// const adressData = require("../model/addressModel")
// const collection1 = require("../models/usermodel");





// exports.getprofile = async (req,res)=>{
//    try{
//     const userId=req.session.user;
//      const userDatas =await collection1.findById({_id:userId}); 
//      console.log("user is is",userDatas);
//      const addresses = await collection1.find({userId:userId});

//        res.render("userprofile2",{addresses,userDatas})    
//    }
//    catch(error){
//     console.error(error);
//     res.status(500).send("Internal server error");
//    }
// }


// exports.getaddress = async (req, res) => {
//     try {
//         const userId = req.session.user;
//         const userDAta = await collection1.findOne({ _id: userId });
//         res.render('address', { userDAta }); // Corrected variable name
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// };





// //post 


// exports.editprofile = async (req, res) => {
      
//     try{
//         const userId = req.params.userID;
//         console.log("re name ",userId);
//         const { newName } = req.body;
        
//         console.log("eee",newName);
//             await collection1.findByIdAndUpdate(userId, { name: newName });

//         res.redirect('/profile');

//     }
//     catch(error){
//         console.error(error);
//         res.status(500).send("Internal server error");
//     }

// }


// exports.postaddress = async(req,res)=>{
   
//    try {
//     const { addressType, mobileNumber, flat, district, pincode, country, state } = req.body;
    
//      const userId = req.session.user;
//     const user = await collection1.findOne({ _id: userId });

//     if (!user) {
//         return res.status(404).send("User not found");
//     }
//   console.log("bodyy kan",req.body)

//       const newAddress = new Address({
//          userId: userId,
//          addressType,
//          mobileNumber,
//          flat,
//          district,
//          pincode,
//          country,
//          state,
//          additionalInfo,
//       });

//       await newAddress.save();

//       res.redirect('/Address');
//    } catch (error) {
//       console.error(error);
//       res.status(500).json({ success: false, message: 'Internal Server Error' });
//    }
  
// }



// exports.posteditaddress = async (req, res) => {
//     try {
//         const addressId = req.params.id;
//         const { addressType, mobileNumber, flat, district, pincode, country, state,  } = req.body.updatedAddress;

//         const userId = req.session.user;
//         const user = await collection1.findOne({ _id: userId });

//         if (!user) {
//             return res.status(404).send("User not found");
//         }

//         // Find the address by ID
//         const address = await collection1.findById(addressId);

//         if (!address) {
//             return res.status(404).json({ success: false, message: 'Address not found' });
//         }

//         // Update address fields
//         address.addressType = addressType;
//         address.mobileNumber = mobileNumber;
//         address.flat = flat;
//         address.district = district;
//         address.pincode = pincode;
//         address.country = country;
//         address.state = state;

//         // Save the updated address
//         const updatedAddress = await address.save();

//         // Respond with the updated address
//         res.status(200).json({ success: true, message: 'Address updated successfully', data: updatedAddress });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// };
// //delete

// exports.deleteaddress = async (req,res)=>{
//     const id = req.params.id;
//     console.log("delete ad",id);
//     try{
//        const result = await collection1.findByIdAndDelete(id);
//        console.log ("Deleted");
//        if(!result){
//         return res.status(404).send("product not found");
//        }
//        res.redirect("/address")

//     }
//     catch(error){
//         console.error("Error deleting product:", error);
//         res.status(500).send("Internal Server Error");  
//     }
// }