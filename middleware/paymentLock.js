const User = require('../models/usermodel');

const checkPaymentLock = async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return next();
        }

        const userId = req.session.userId;
        const sessionId = req.sessionID;

        await User.cleanupExpiredLocks();

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.hasValidPaymentLock()) {
            if (user.paymentLock.sessionId !== sessionId) {
                return res.status(423).json({ 
                    success: false, 
                    message: 'Payment already in progress in another session. Please wait for the current payment to complete.',
                    lockInfo: {
                        lockedAt: user.paymentLock.lockedAt,
                        paymentType: user.paymentLock.paymentType
                    }
                });
            }
        }

        req.user = user;
        req.sessionId = sessionId;
        next();
    } catch (error) {
        console.error('Error in payment lock middleware:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during payment lock check' 
        });
    }
};

const acquirePaymentLock = (paymentType = 'checkout') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not authenticated' 
                });
            }

            const user = req.user;
            const sessionId = req.sessionId;

            if (user.hasValidPaymentLock()) {
                if (user.paymentLock.sessionId === sessionId) {
                    return next();
                }
                
                return res.status(423).json({ 
                    success: false, 
                    message: 'Payment already in progress in another session. Please wait for the current payment to complete.' 
                });
            }

            await user.acquirePaymentLock(sessionId, paymentType);
            console.log(`Payment lock acquired for user ${user._id}, session ${sessionId}, type: ${paymentType}`);
            
            next();
        } catch (error) {
            console.error('Error acquiring payment lock:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Failed to acquire payment lock' 
            });
        }
    };
};

const releasePaymentLock = async (req, res, next) => {
    try {
        if (req.user && req.user.hasValidPaymentLock(req.sessionId)) {
            await req.user.releasePaymentLock();
            console.log(`Payment lock released for user ${req.user._id}`);
        }
        next();
    } catch (error) {
        console.error('Error releasing payment lock:', error);
        next();
    }
};

const releasePaymentLockAndRespond = async (user, sessionId, res, statusCode, responseData) => {
    try {
        if (user && user.hasValidPaymentLock(sessionId)) {
            await user.releasePaymentLock();
            console.log(`Payment lock released for user ${user._id}`);
        }
    } catch (error) {
        console.error('Error releasing payment lock in response:', error);
    }
    
    return res.status(statusCode).json(responseData);
};

module.exports = {
    checkPaymentLock,
    acquirePaymentLock,
    releasePaymentLock,
    releasePaymentLockAndRespond
};