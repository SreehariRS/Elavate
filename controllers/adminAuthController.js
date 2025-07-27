const admin = require("../models/adminmodel");

const login = (req, res) => {
    try {
        // If admin is already logged in, redirect to home
        if (req.session && req.session.admin) {
            return res.redirect("/admin/home");
        }
        res.render("admin/adminlogin", { message: null });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const loginpost = async (req, res) => {
    try {
        // If admin is already logged in, redirect to home
        if (req.session && req.session.admin) {
            return res.redirect("/admin/home");
        }

        const { adminName, password } = req.body;
        if (adminName === "admin@sree" && password === "password") {
            req.session.admin = "admin@sree"; 
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
        req.session.destroy((err) => {
            if (err) {
                console.log("Error destroying session:", err);
                return res.status(500).send("Internal Server Error");
            }
            // Clear the session cookie
            res.clearCookie('connect.sid'); // Default session cookie name
            res.redirect("/admin/login");
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { login, loginpost, logoutadmin };