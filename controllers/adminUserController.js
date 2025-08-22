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
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        user.isBlocked = !user.isBlocked;
        await user.save();
        
        if (user.isBlocked) {
            const sessions = req.sessionStore.sessions;
            for (let sessionId in sessions) {
                const sessionData = JSON.parse(sessions[sessionId]);
                if (sessionData.user === userId && !sessionData.admin) {
                    req.sessionStore.destroy(sessionId, (err) => {
                        if (err) console.error("Error destroying session:", err);
                    });
                }
            }
        }
        
        // Return JSON response for AJAX requests
        res.json({
            success: true,
            isBlocked: user.isBlocked,
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
        });
        
    } catch (error) {
        console.error("Error updating user block status:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Server Error" 
        });
    }
};

module.exports = {
    userlist,
    userblock,
};