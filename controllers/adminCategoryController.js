const Category = require("../models/category");

const categoryList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 5; // Number of categories per page
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / perPage);

        const catname = await Category.find()
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.render("admin/category", {
            catname,
            currentPage: page,
            totalPages,
            perPage
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addcateg = async (req, res) => {
    try {
        const { name } = req.body;

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const newCategory = new Category({ name });
        await newCategory.save();
        res.status(200).json({ message: "Category added successfully" });
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const geteditCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.i);
        if (!category) {
            return res.status(404).send("Category not found");
        }
        res.render("admin/editcategory", { category });
    } catch (error) {
        console.error("Error fetching category for edit:", error);
        res.status(500).send("Internal Server Error");
    }
};

const editcateg = async (req, res) => {
    try {
        const { name } = req.body;
        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
        if (existingCategory && existingCategory._id.toString() !== req.params.id) {
            return res.status(400).json({ error: "Category name already exists" });
        }

        await Category.findByIdAndUpdate(req.params.id, { name });
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).send("Internal Server Error");
    }
};

const deletecateg = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).send("Category not found");
        }
        await Category.findByIdAndDelete(req.params.id);
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    categoryList,
    addcateg,
    geteditCategory,
    editcateg,
    deletecateg,
};