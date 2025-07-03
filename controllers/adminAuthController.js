const admin = require("../models/adminmodel");

const login = (req, res) => {
    try {
        res.render("admin/adminlogin", { message: null });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const loginpost = async (req, res) => {
    try {
        const { adminName, password } = req.body;
        // Hardcoded credentials check
        if (adminName === "admin@sree" && password === "password") {
            req.session.admin = "admin@sree"; // Store admin identifier in session
            return res.redirect("/admin/home");
        } else {
            return res.render("admin/adminlogin", {
                message: "Invalid username or password",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const logoutadmin = (req, res) => {
    try {
        req.session.destroy();
        res.redirect("/admin/login");
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { login, loginpost, logoutadmin };