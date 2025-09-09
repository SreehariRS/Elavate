const User = require("../models/usermodel");

const userlist = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const skip = (page - 1) * limit;

        let searchQuery = {};
        if (search) {
            searchQuery = {
                $or: [
                    { firstname: { $regex: search, $options: 'i' } },
                    { lastname: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const totalUsers = await User.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find(searchQuery)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); 

        const paginationInfo = {
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page > 1 ? page - 1 : null,
            limit: limit,
            startIndex: skip + 1,
            endIndex: Math.min(skip + limit, totalUsers)
        };

        res.render("admin/usermanage", { 
            users,
            pagination: paginationInfo,
            search: search
        });
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