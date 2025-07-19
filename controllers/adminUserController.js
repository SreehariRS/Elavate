const User = require("../models/usermodel");

const userlist = async (req, res) => {
    try {
        const users = await User.find();
        res.render("admin/usermanage", { users });
    } catch (error) {
        console.error("Error fetching user list:", error);
        res.status(500).send("Internal Server Error");
    }
};

const userblock = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send("User not found");
        }
        // Toggle the isBlocked status
        user.isBlocked = !user.isBlocked;
        await user.save();

        // Invalidate the user's session if blocking
        if (user.isBlocked) {
            // Find and destroy the session for this user
            const sessions = req.sessionStore.sessions;
            for (let sessionId in sessions) {
                const sessionData = JSON.parse(sessions[sessionId]);
                if (sessionData.user === userId) {
                    req.sessionStore.destroy(sessionId, (err) => {
                        if (err) console.error("Error destroying session:", err);
                    });
                }
            }
        }

        res.redirect("/admin/customers");
    } catch (error) {
        console.error("Error updating user block status:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    userlist,
    userblock,
};