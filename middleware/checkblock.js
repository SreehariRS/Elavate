const User = require("../models/usermodel");

const checkBlocked = async (req, res, next) => {
    try {
        // Check if user is logged in via session
        if (req.session && req.session.user) {
            const user = await User.findById(req.session.user);
            if (user && user.isBlocked) {
                // Invalidate session and redirect to login
                req.session.destroy((err) => {
                    if (err) {
                        console.error("Error destroying session:", err);
                    }
                    return res.redirect("/login");
                });
                return; // Ensure no further execution
            }
        }
        // For POST /login, check email from req.body
        if (req.path === "/login" && req.method === "POST") {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (user && user.isBlocked) {
                return res.render("user/userlogin", { message: "Your account is blocked by the admin" });
            }
        }
        next();
    } catch (error) {
        console.error("Error in checkBlocked middleware:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = checkBlocked;