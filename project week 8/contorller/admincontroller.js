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
    res.redirect("/admin/home");
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
            res.redirect("/admin/home");
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
    res.render("admin/home");
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
        if (req.body.existingImages) {
            const existingImages = JSON.parse(req.body.existingImages);
            productImages = [...productImages, ...existingImages];
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



//delete image 
const deleteImage = async (req, res) => {
    console.log("Request received in deleteImage function"); // Log the start of the function

    try {
       const id = req.params.id;
       const indexToRemove = req.body.index;

       console.log("Request parameters:", { id }); // Log the id from request parameters
       console.log("Request body:", { indexToRemove }); // Log the indexToRemove from request body

       // Build the unset query properly
       const unsetQuery = { $unset: { [`productImages.${indexToRemove}`]: 1 } };
       console.log("Unset query:", unsetQuery); // Log the unset query

       // Update the document to unset the specified index
       await product.findByIdAndUpdate(id, unsetQuery);

       // Pull the null value from the array after unsetting
       await product.findByIdAndUpdate(id, { $pull: { productImages: null } });

       // Retrieve the updated product
       const updatedProduct = await product.findById(id);

       console.log("Updated product:", updatedProduct); // Log the updated product

       if (updatedProduct) {
         console.log("Image deleted successfully"); // Log success message
         res.status(200).json({ success: true, message: 'Image deleted successfully', data: updatedProduct });
       } else {
         console.log("Index not found in productImages array"); // Log error message
         res.status(404).json({ success: false, message: 'Index not found in productImages array' });
       }
    } catch (error) {
       console.error("Error in deleteImage function:", error); // Log the error
       res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}




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



  

  const sales1 = async (req, res) => {
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
  
  
  

  const sales = async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.session.admin) {
            return res.render("admin/adminlogin");
        }

        // Construct the query object based on provided startDate and endDate
        const query = {};
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        if (startDate && endDate) {
            query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            query.date = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.date = { $lte: new Date(endDate) };
        }

        // Fetch sales report data dynamically
        const orderData = await orders.find(query);
        console.log(orderData);
        const productIds = orderData.flatMap(order => order.items.map(item => item.productId));
        const products = await product2.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(product => [String(product._id), product.name]));

        let totalAmount = 0;
        const totalOrders = orderData.length;
        console.log(totalOrders);

        // Calculate total amount
        orderData.forEach((order) => {
            totalAmount += order.totalprice;
        });

        // Fetch user and product counts
        const userCount = await user2.find().count();
        const productCount = await product2.find().count();

        // Prepare data for rendering
        const data = {
            totalAmount,
            user: userCount,
            product: productCount,
            totalOrders,
        };

        // Process the fetched orders
        let salesReport = orderData.map((order) => {
            const orderDetails = {
                proname: order.items.map(item => productMap.get(String(item.productId))).join(', '),
                address: order.selectedAddress,
                quantity: order.items.reduce((total, item) => total + item.quantity, 0),
                price: order.items.reduce((total, item) => total + item.productId.offerprice * item.quantity, 0),
                createdAt: order.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), // Format date here
                totalprice: order.totalprice,
                paymentMethod: order.paymentMethod,
            };
            return orderDetails;
        });

        // Rendering the sales report view with the processed data
        res.render("admin/salesReport", { salesReport, data });
    } catch (error) {
        console.error("Error generating sales report:", error);
        res.status(500).send("Internal server error");
    }
};






  const generatePDF = async (req, res) => {
    try {
      const doc = new PDFDocument();
  
      const salesReport = req.session.salesReport;
      const username = req.session.username;
      if (!Array.isArray(salesReport)) {
        salesReport = [];
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="sales_report.pdf"');
      doc.pipe(res);
  
      // Styling
      doc.font("Helvetica-Bold");
      const headerColor = "#333";
      const rowColor = "#666";
  
      // Add content to the PDF document
      doc.fontSize(24).fillColor(headerColor).text("iStore", { align: "center" }).moveDown();
      doc.fontSize(20).fillColor(headerColor).text("Sales Report", { align: "center" }).moveDown();
  
      for (let i = 0; i < salesReport.length; i++) {
        const report = salesReport[i];
  
        const paymentMethod = report.payment.method
          .map((x) => {
            return x.mode;
          })
          .join(" ,");
  
        doc.moveDown().fillColor(rowColor);
        doc.text(`Product Name: ${report.p_name}`);
        doc.text(`Price: ${report.price}`);
  
        if (report.totalprice !== undefined) {
          doc.text(`OfferPrice: ${report.payment.method.reduce((acc, x) => acc + parseFloat(x.amount), 0)}`);
  
          doc.text("Offer Price: Not Available");
        }
        doc.text(`Quantity: ${report.quantity}`);
  
        if (report.address && report.address.length > 0) {
          const address = report.address[0];
          doc.text(`Customer Name: ${address.name}`);
          doc.text(`House Name: ${address.houseName}`);
          doc.text(`City: ${address.city}`);
          doc.text(`City: ${address.phone}`);
          doc.text(`Postal Code: ${address.postalCode}`);
        } else {
          doc.text("Address Not Available");
        }
  
        const formattedDate = new Date(report.createdAt).toLocaleDateString('en-GB');
  
        doc.text(`Date of Purchase: ${formattedDate}`);
        doc.text(`Payment Method: ${paymentMethod}`);
        doc
          .strokeColor(rowColor)
          .lineWidth(1)
          .moveTo(50, doc.y + 15)
          .lineTo(550, doc.y + 15)
          .stroke();
      }
  
      // Finalize the PDF
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  const downloadExcel = async (req, res) => {
    try {
      const salesReport = req.session.salesReport;
  
      if (!Array.isArray(salesReport) || salesReport.length === 0) {
        throw new Error("Data is empty or not an array");
      }
  
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Sales Report");
  
      worksheet.columns = [
        { header: "Product Name", key: "p_name", width: 20 },
        { header: "Date", key: "createdAt", width: 15 },
        { header: "Quantity", key: "quantity", width: 15 },
        { header: "Price", key: "price", width: 15 },
        { header: "Offer Price", key: "totalprice", width: 15 },
        { header: "Customer Name", key: "customerName", width: 20 },
        { header: "House Name", key: "houseName", width: 20 },
        { header: "City", key: "city", width: 15 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Postal Code", key: "postalCode", width: 15 },
        { header: "Payment Method", key: "paymentMethod", width: 20 },
      ];
  
      salesReport.forEach((item) => {
        const address = item.address && item.address.length > 0 ? item.address[0] : {};
  
        const formattedDate = item.createdAt ? new Date(item.createdAt).toISOString().split("T")[0] : "";
  
        const paymentMethod = item.payment.method.map((x) => {
          return x.mode;
        });
  
        worksheet.addRow({
          p_name: item.p_name || "",
          createdAt: formattedDate,
          quantity: item.quantity || "",
          price: item.price || "",
          totalprice: item.totalprice || "",
          customerName: address.name || "",
          houseName: address.houseName || "",
          city: address.city || "",
          phone: address.phone || "",
          postalCode: address.postalCode || "",
          paymentMethod: paymentMethod.join(", "),
        });
      });
  
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx");
  
      await workbook.xlsx.write(res);
  
      res.end();
    } catch (error) {
      console.error("Error generating Excel:", error.message);
      res.status(500).send("Internal Server Error: " + error.message);
    }
  };
  

  const home = async (req, res) => {
    try {
        const topSellingProducts = await fetchTopSellingProducts();
        const topSellingCategories = await fetchTopSellingCategories();

        const orderData = await orders.find();
        const userCount = await user.countDocuments(); // Assuming the model name is User
        const productCount = await product.countDocuments(); // Assuming the model name is product
        const totalAmount = orderData.reduce((acc, item) => acc + item.totalprice, 0); // Adjusted to use totalprice
        const orderCount = orderData.length;

        const data = {
          totalAmount: totalAmount,
          totalOrders: orderCount,
          user: userCount,
          product: productCount,
        };
        res.render("admin/home", {
            topSellingProducts,
            topSellingCategories,
            totalAmount,
            userCount,
            productCount,
            orderCount,
            data,
        });
    } catch (error) {
        console.error("Error in rendering admin home:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};



const fetchTopSellingProducts = async () => {
  try {
    const topSellingProducts = await orders.aggregate([
      { $unwind: "$items" }, // Unwind 'items' array
      { $group: { _id: "$items.productId", count: { $sum: "$items.quantity" } } }, // Group by productId and sum quantity
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, // Lookup product details
      { $project: { _id: 1, name: { $arrayElemAt: ["$product.name", 0] }, count: 1 } }, // Include product name in projection
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    return topSellingProducts;
  } catch (error) {
    throw error;
  }
};


const fetchTopSellingCategories = async () => {
    try {
        const topSellingCategories = await orders.aggregate([
            { $unwind: "$items" }, // Unwind 'items' array
            { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } }, // Lookup product details
            { $unwind: "$product" },
            { $group: { _id: "$product.category", count: { $sum: "$items.quantity" } } }, // Group by category and sum quantity
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]);
        return topSellingCategories;
    } catch (error) {
        throw error;
    }
};




  
module.exports = {
    login,
    logoutadmin,
    loginpost,
    home,
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
    sales1,
    downloadExcel,generatePDF,sales
,
    deleteImage
    


};
