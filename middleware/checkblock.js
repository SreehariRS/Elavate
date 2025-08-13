const User = require("../models/usermodel");

const checkBlocked = async (req, res, next) => {
    try {
        // Skip check ONLY for admin routes
        if (req.path.startsWith('/admin')) {
            return next();
        }
        
        // Check if user is logged in via session
        if (req.session && req.session.user) {
            const user = await User.findById(req.session.user);
            if (user && user.isBlocked) {
                // Destroy session immediately
                req.session.destroy((err) => {
                    if (err) {
                        console.error("Error destroying session:", err);
                    }
                });
                
                // Handle different request types
                if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                    // For AJAX requests, return JSON response
                    return res.status(403).json({ 
                        success: false,
                        blocked: true,
                        message: "Your account has been blocked by the admin. Please contact support.",
                        redirect: "/login"
                    });
                } else {
                    // For regular requests, redirect to login with message
                    return res.redirect("/login?blocked=true");
                }
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