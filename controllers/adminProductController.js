const Product = require("../models/product");
const Category = require("../models/category");

const productlist = async (req, res) => {
    try {
        const productdata = await Product.find({ deleted: false });
        res.render("admin/productmanage", { products: productdata });
    } catch (error) {
        console.error("Error fetching product list:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addproduct = async (req, res) => {
    try {
        const categories = await Category.distinct("name");
        res.render("admin/addproduct", { categories });
    } catch (error) {
        console.error("Error rendering add product page:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addproductpost = async (req, res) => {
    try {
        const { name, description, category, price, offerprice, stock } = req.body;
        let productImages = [];

        if (req.files && req.files.length > 0) {
            productImages = req.files.map((file) => `/uploads/${file.filename}`);
        }

        const newProduct = new Product({
            name,
            description,
            category,
            price,
            offerprice: offerprice || 0,
            stock,
            productImages,
            isListed: true,
        });

        await newProduct.save();
        res.status(200).json({
            success: true,
            message: "Product added successfully",
            product: newProduct,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

const editproduct = async (req, res) => {
    try {
        const prod = await Product.findById(req.params.Id);
        if (!prod) {
            return res.status(404).send("Product not found");
        }
        const categories = await Category.distinct("name");
        res.render("admin/editproduct", { prod, categories });
    } catch (error) {
        console.error("Error rendering edit product page:", error);
        res.status(500).send("Internal Server Error");
    }
};

const editproductpost = async (req, res) => {
    try {
        const id = req.params.productId;
        const { name, description, category, price, offerprice, stock, existingImages } = req.body;
        let productImages = [];

        if (req.files && req.files.length > 0) {
            productImages = req.files.map((file) => `/uploads/${file.filename}`);
        }

        const productdata = await Product.findById(id);
        if (!productdata) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }

        const updatedata = {
            name,
            description,
            category,
            price,
            offerprice: offerprice || 0,
            stock,
            isListed: productdata.isListed, // Retain existing isListed status
            productImages: [
                ...(existingImages ? JSON.parse(existingImages) : []),
                ...productImages,
            ],
        };

        await Product.findByIdAndUpdate(id, updatedata);
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedata,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

const deleteproduct = async (req, res) => {
    try {
        const productdata = await Product.findById(req.params.id);
        if (!productdata) {
            return res.status(404).send("Product not found");
        }
        await Product.findByIdAndDelete(req.params.id); // Hard delete instead of soft delete
        res.redirect("/admin/productlist");
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deleteImage = async (req, res) => {
    try {
        const { productId, index } = req.params;
        const productdata = await Product.findById(productId);
        if (!productdata) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }
        if (index < 0 || index >= productdata.productImages.length) {
            return res.status(400).json({ success: false, error: "Invalid image index" });
        }
        productdata.productImages.splice(index, 1);
        await productdata.save();
        res.status(200).json({ success: true, message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = {
    productlist,
    addproduct,
    addproductpost,
    editproduct,
    editproductpost,
    deleteproduct,
    deleteImage,
};