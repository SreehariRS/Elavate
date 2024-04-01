const user = require("../models/usermodel");
const product = require("../models/product");
const admindata = require("../models/adminmodel");
const category = require('../models/category')
const db = require("../config/dbconnect")
const orders = require("../models/order")
const errorMessage = require("connect-flash")
const product2 = require("../models/product");
const user2 = require("../models/usermodel");
const AdminCoupon = require("../models/coupon");








const login = (req, res) => {
  console.log(req.session, "session");
  if (req.session.admin) {
    res.redirect("/admin/dashboard");
  } else {
    // res.redirect('/admin/dashboard')
    res.render("admin/adminlogin");
    //res.render("admin/dashboard")
  }
};


const loginpost = async (req, res) => {
    // const name = "admin@gmail.com";
    // const password = "admin123";
    // if (name === req.body.username && password === req.body.password) {
    //     //adding session
    //     req.session.admin = req.body.username;

    //     res.redirect("/admin/dashboard1");
    // } else {
    //     res.send("wrong data....");
    // }

    try {
        const data = {
            adminName: req.body.adminName,
            password: req.body.password,
        };
        console.log(data);
        const admin = await admindata.findOne({
            name: data.name,
            password: data.password,
        });

        console.log("Admin Data", admin);
        if (!admin) {
            console.log("Admin data wrong");
        } else {
            res.redirect("/admin/dashboard");
        }
    } catch (error) {
        console.log(error);
    }
};

const logoutadmin = (req, res) => {
 
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    }
   
    res.redirect("/admin/login");
  
  });

};

const dashboard1 = (req, res) => {
    res.render("admin/dashboard1");
    // if(req.session.admin) {

    //     res.render("admin/dashboard1")
    // }else{
    // res.redirect("/admin/adminlogin")
};

const productlist = async (req, res) => {
    const products = await product.find({});
    res.render("admin/productmanage", { products });
};

const addproduct = async (req, res) => {
    try {
        const categories = await category.distinct("name");
        res.render("admin/addproduct", { categories });
    } catch (error) {
        console.error("error fetching categories:", error);
        res.status(500).json({ error: "internal server error" });
    }
};
const addproductpost = async (req, res) => {
    try {
        console.log(req.body);
        const { name, description, category, price, stock } = req.body;
        let productImages = [];
        if (req.files && req.files.length > 0) {
            const fileurls = req.files.map((file) => `/uploads/${file.filename}`);
            productImages = fileurls;
        }
        console.log("pro image................",productImages);

        const newproduct = new product({
            name,
            description,
            category,
            price,
            stock,
            productImages,
        });
        const savedProduct = await newproduct.save();

        // Redirect the user to another page
        // res.redirect("/admin/productmanage");

        // This line is causing the issue, remove it
        res.status(200).json({
            message: "product added successfully",
            product: savedProduct,
        });
    } catch (error) {
        console.error("error adding product:", error);
        res.status(500).json({ error: "internal server error" });
    }
};

const deleteproduct = async (req, res) => {
    const id = req.params.id;
    try {
        await product.findOneAndDelete({ _id: id });
        res.redirect("/admin/productlist");
    } catch (error) {
        console.log(error);
    }
};

const editproduct = async (req, res) => {
    try {
        const id = req.params.Id;
        console.log("Product ID:", id); // Ensure you're getting the correct ID
        // Fetch categories
        const categories = await category.distinct("name");
        
        // Find the product by ID
        const prod = await product.findOne({ _id: id });

        // Check if product exists
        // if (!prod) {
        //     return res.status(404).send("Product not available");
        // }

        // Render the editproduct view with product and categories data
        res.render("admin/editproduct", { prod, categories });
    } catch (error) {
        console.error("Error editing product:", error);
        res.status(500).send("Internal Server Error");
    }
};


const editproductpost = async (req, res) => {
    try {
        const { productId } = req.params;

        const { name, description, category, price, stock,offerprice } = req.body; 

        let productImages = [];

        if (req.files && req.files.length > 0) {
            const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
            productImages = fileUrls;
        }

        const existingProduct = await product.findById(productId);

        if (!existingProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        existingProduct.name = name;
        existingProduct.description = description;
        existingProduct.category = category;
        existingProduct.price = price;
        existingProduct.offerprice = offerprice;
        existingProduct.stock = stock;
        existingProduct.productImages = productImages;

        const updatedProduct = await existingProduct.save();

        res.json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};






const Category = async (req,res)=>{
    try {
        const catname = await category.find({}); 
        res.render('admin/category',{catname})
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send( 'Internal Server Error' );
    }
};
const geteditCategory = async(req,res)=>{
    // const errorMessage = req.
    const id = req.params.i
    console.log(id)
    const data = await category.findById(id)
    res.render("admin/category2",{data});
}


const addcateg = async (req, res) => {
    const { name } = req.body;
    try {
        const existingCategory = await category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: 'Category already exists' });
        }
        const newCategory = new category({ name });
        await newCategory.save();
        res.json({ success: 'Category added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deletecateg = async (req,res)=>{
   
    try{
         
        const userId = req.params.id;
        console.log("kkjkjnkjnvjnkjn",userId);  

        const deletedCategory = await category.findByIdAndDelete(userId)

        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.redirect('/admin/category')

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const editcateg = async (req, res) => {
    try {
       
        const catid = req.params.id;
        const newValue = req.body.categoryName;
        
         
        // Find the category to be updated
        const categoryToUpdate = await category.findOne({_id:catid});
        if (!categoryToUpdate) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // If the category name is being updated, check if the new name already exists
        const existingCategory = await category.findOne({name:newValue });
        if (existingCategory) {
            return res.status(400).json({ messege: 'Category already exists' });
        }


        // Update the category name
        categoryToUpdate.name = newValue;
        
        const updatedCategory = await categoryToUpdate.save();
        console.log("Category updated successfully");
        res.status(200).json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




const userlist = async (req,res)=>{
    try {
        const users = await user.find({}, { password: 0 }); 
        res.render('admin/usermanage',{users})
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send( 'Internal Server Error' );
    }
  
}


const userblock = async (req,res)=>{
    const userId = req.params.userId;

    try {
        const foundUser = await user.findById(userId);

        if (!foundUser) {
            return res.status(404).send('User not found');
        }

        foundUser.isBlocked = !foundUser.isBlocked;

        await foundUser.save();

        res.redirect('/admin/customers'); 
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).send('Internal Server Error');
    }
}



const order = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if no page query parameter is provided
        const pageSize = 10; // Number of orders per page
        const skip = (page - 1) * pageSize;

        // Fetch orders for the requested page and populate the items with product details
        const allOrders = await orders.find().skip(skip).limit(pageSize).populate('items.productId');

        // Organize orders by userId
        const ordersByUser = {};
        allOrders.forEach(order => {
            const userId = order.userId;
            if (!ordersByUser[userId]) {
                ordersByUser[userId] = [];
            }
            ordersByUser[userId].push(order);
        });

        res.render("admin/order", { ordersByUser });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Internal Server Error");
    }
};


  const updateOrderStatus = async (req, res) => {
    const { orderId, newStatus } = req.body;
    console.log(orderId);
    try {
        // Update the order status in the MongoDB database
        const updatedOrder = await orders.findByIdAndUpdate(orderId, { $set: { status: newStatus } }, { new: true });
  
        if (updatedOrder) {
            res.json({ success: true, message: 'Order status updated successfully.', order: updatedOrder });
        } else {
            res.status(404).json({ success: false, message: 'Order not found.' });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };


  const generateSalesReport = async () => {
    try {
      const salesReport = await orders.aggregate([
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "product",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $lookup: {
            from: "coupons",
            localField: "items.couponId",
            foreignField: "_id",
            as: "couponInfo",
          },
        },
        {
          $unwind: { path: "$couponInfo", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            date: { $first: "$date" },
            totalSales: { $sum: "$totalprice" },
            discountValue: { $sum: "$couponInfo.discountValue" },
            products: {
              $push: {
                name: "$productInfo.name",
                quantity: "$items.quantity",
              },
            },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 },
        },
        {
          $project: {
            _id: 0,
            date: 1,
            totalSales: 1,
            discountValue: 1,
            products: 1,
          },
        },
      ]);
      // console.log(salesReport);
      

      return salesReport;
    } catch (error) {
      console.error(error);
    }
  };
  
  generateSalesReport();
  

  const sales = async (req, res) => {
    try {
      if (req.session.admin) {
        res.render("admin/adminlogin");
      } else {
        // Fetch sales report data dynamically
        const orderData = await orders.find();
        
        console.log(orderData);
        let totalAmount = 0;
        const totalOrders = orderData.length;

        console.log(totalOrders);
        const user = await user2.find().count();
        const product = await product2.find().count();
        orderData.forEach((order) => {
          totalAmount += order.totalprice;
        });
  

        

        const data = {
          totalAmount,
          user,
          product,
          totalOrders,
        };

        const salesReport = await orders.find().populate('items.productId').exec();

        
       
        res.render("admin/salesReport", { salesReport, data });

       
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
  const salesRep = async (req, res) => {
    try {
      const salesReport = await orders.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            totalSales: { $sum: "$totalprice" },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 },
        },
      ]);

      
  
      res.json(salesReport);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const filterSales = async (req, res) => {
    try {
      const filterType = req.body.filterType;
  
      if (!filterType) {
        return res
          .status(400)
          .json({ message: "filterType is missing in the request" });
      }
  
      let filterQuery;
  
      if (filterType === "day") {
        // Filter for a single day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
  
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
  
        filterQuery = {
          date: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        };
      } else if (filterType === "week") {
        // Filter for the current week
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start from the beginning of the week (Sunday)
  
        const endOfWeek = new Date();
        endOfWeek.setHours(23, 59, 59, 999);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End at the end of the week (Saturday)
  
        filterQuery = {
          date: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        };
      } else if (filterType === "month") {
        // Filter for the current month
        const startOfMonth = new Date();
        startOfMonth.setHours(0, 0, 0, 0);
        startOfMonth.setDate(1);
  
        const endOfMonth = new Date();
        endOfMonth.setHours(23, 59, 59, 999);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
  
        filterQuery = {
          date: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        };
      } else if (filterType === "year") {
        // Filter for the current year
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(
          new Date().getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999
        );
  
        filterQuery = {
          date: {
            $gte: startOfYear,
            $lt: endOfYear,
          },
        };
      } else {
        return res.status(400).json({ message: "Invalid filterType" });
      }
  
      const salesReport = await orders.aggregate([
        {
          $unwind: "$items",
        },
        {
          $match: filterQuery,
        },
        {
          $lookup: {
            from: "product",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo",
        },
        {
          $lookup: {
            from: "coupons",
            localField: "items.couponId", // Assuming there is a field 'couponId' in the items array
            foreignField: "_id",
            as: "couponInfo",
          },
        },
        {
          $unwind: { path: "$couponInfo", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            totalSales: { $sum: "$totalprice" },
            discountValue: { $sum: "$couponInfo.discountValue" },
            products: {
              $push: {
                name: "$productInfo.productname",
                quantity: "$items.quantity",
              },
            },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 },
        },
      ]);
      //console.log(salesReport);
      res.json(salesReport);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  const filterSalesByDate = async (req, res) => {
    try {
      const selectedDate = req.body.selectedDate;
  
      if (!selectedDate) {
        return res.status(400).json({ message: "Please provide a valid date." });
      }
  
      // Construct the start and end of the selected date
      const startOfSelectedDate = new Date(selectedDate);
      startOfSelectedDate.setHours(0, 0, 0, 0);
  
      const endOfSelectedDate = new Date(selectedDate);
      endOfSelectedDate.setHours(23, 59, 59, 999);
  
      const filterQuery = {
        date: {
          $gte: startOfSelectedDate,
          $lt: endOfSelectedDate,
        },
      };
  
      // Use the same aggregation pipeline as in your existing filterSales function
      const salesReport = await orders.aggregate([
        {
          $unwind: "$items", // Unwind the items array
        },
        {
          $match: filterQuery,
        },
        {
          $lookup: {
            from: "product", // The name of the products collection
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo", // Unwind the productInfo array
        },
        {
          $lookup: {
            from: "coupons", // The name of the coupons collection
            localField: "items.couponId", // Assuming there is a field 'couponId' in the items array
            foreignField: "_id",
            as: "couponInfo",
          },
        },
        {
          $unwind: { path: "$couponInfo", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            totalSales: { $sum: "$totalprice" },
            discountValue: { $sum: "$couponInfo.discountValue" },
            products: {
              $push: {
                name: "$productInfo.productname",
                quantity: "$items.quantity",
              },
            },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 },
        },
      ]);
  
      //console.log(salesReport);
      res.json(salesReport);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  const filterByDateRange = async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      console.log(startDate, endDate);
  
      // Construct the filter query with date range
      const filterQuery = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
  
      // Add your logic to query the database for sales data within the specified date range
      const salesReport = await orders.aggregate([
        {
          $unwind: "$items", // Unwind the items array
        },
        {
          $match: filterQuery,
        },
        {
          $lookup: {
            from: "product", // The name of the products collection
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $unwind: "$productInfo", // Unwind the productInfo array
        },
        {
          $lookup: {
            from: "coupons", // The name of the coupons collection
            localField: "items.couponId", // Assuming there is a field 'couponId' in the items array
            foreignField: "_id",
            as: "couponInfo",
          },
        },
        {
          $unwind: { path: "$couponInfo", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              day: { $dayOfMonth: "$date" },
            },
            totalSales: { $sum: "$totalprice" },
            discountValue: { $sum: "$couponInfo.discountValue" },
            products: {
              $push: {
                name: "$productInfo.productname",
                quantity: "$items.quantity",
              },
            },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 },
        },
      ]);
      // console.log("Start and End",salesReport);
  
      res.json(salesReport);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };


module.exports = {
    login,
    logoutadmin,
    loginpost,
    dashboard1,
    addproductpost,
    addproduct,
    productlist,
    deleteproduct,
    editproduct,
    editproductpost,
    Category,
    addcateg,
    deletecateg,
    editcateg,
    geteditCategory,
    userlist,
    userblock,
    order,
    updateOrderStatus,
    sales,
    filterSales,
    filterSalesByDate,
    filterByDateRange,
  
    salesRep


    


};
