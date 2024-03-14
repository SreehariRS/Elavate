const user = require("../models/usermodel");
const product = require("../models/product");
const admindata = require("../models/adminmodel");
const category = require('../models/category')
const db = require("../config/dbconnect")
const orders = require("../models/order")
const errorMessage = require("connect-flash")







 



const login = async (req, res) => {
    if (req.session.admin) res.redirect("/admin/dashboard1");
    else res.render("admin/adminlogin");
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
        console.log("fjhfjhfjhfjhfjhfjhfjhfjhfh",id); // Make sure you're using the correct parameter name
        // const categories = await Category.distinct("name");
        const categories = await category.distinct("name");

        const prod = await product.findOne({ _id: id });
        res.render("admin/editproduct", { prod, categories }); // Pass prod and categories to the render function
    } catch (error) {
        console.log(error);
    }
};

const editproductpost = async (req, res) => {
    try {
        const { productId } = req.params;

        const { name, description, category, price, stock } = req.body; 

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
        const categoryToUpdate = await category.findById(catid);
        if (!categoryToUpdate) {
            return res.status(404).send("Category not found");
        }

        // If the category name is being updated, check if the new name already exists
        if (newValue !== categoryToUpdate.name) {
            const existingCategory = await category.findOne({ name: newValue });
            if (existingCategory) {
                return res.status(400).json({ error: 'Category already exists' });
            }
        }

        // Update the category name
        categoryToUpdate.name = newValue;
        const updatedCategory = await categoryToUpdate.save();
       console.log("in the category edit 263")
        res.redirect('/admin/category/');
        
       
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Internal Server Error");
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





module.exports = {
    login,
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
    updateOrderStatus


    


};
