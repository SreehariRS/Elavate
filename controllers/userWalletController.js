const User = require("../models/usermodel");
const Wallet = require("../models/wallet");
const category = require("../models/category");

const wallet = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        let wallet = await Wallet.findOne({ userId });
        const categories = await category.find();
        const loggedInUser = !!userId;
        const errorMessage = req.flash("error")[0] || "";

        // If no wallet exists, create one with zero balance
        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 0,
                transactions: [],
            });
            await wallet.save();
        }

        // Filter out invalid transactions (missing type, amount, or date)
        wallet.transactions = wallet.transactions.filter(tx => 
            tx && tx.type && tx.amount && tx.date
        );
        await wallet.save();

        // Pagination logic
        const page = parseInt(req.query.page) || 1;
        const perPage = 5; // Number of transactions per page
        const totalTransactions = wallet.transactions.length;
        const totalPages = Math.ceil(totalTransactions / perPage);
        const startIndex = (page - 1) * perPage;
        const paginatedTransactions = wallet.transactions.slice(startIndex, startIndex + perPage);

        // Log transactions for debugging
        console.log("Paginated transactions:", paginatedTransactions);

        res.render("user/wallet", {
            balance: wallet.balance || 0,
            userWallet: { ...wallet.toObject(), transactions: paginatedTransactions },
            categories,
            userData,
            userId,
            loggedInUser,
            errorMessage,
            currentPage: page,
            totalPages,
            totalTransactions,
        });
    } catch (error) {
        console.log("Error in wallet route:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getWalletBalance = async (req, res) => {
    try {
        const userId = req.session.user;
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            return res.json({ success: true, balance: 0 });
        }
        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        console.log("Error in getWalletBalance:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const deductFromWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.session.user;
        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }

        if (wallet.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        wallet.balance -= parseFloat(amount);
        wallet.transactions.push({
            type: "withdrawal",
            amount: parseFloat(amount),
            date: new Date(),
        });
        await wallet.save();

        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        console.log("Error in deductFromWallet:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const addToWallet = async (req, res) => {
    try {
        const { amount, paymentId } = req.body;
        const userId = req.session.user;
        let wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            wallet = new Wallet({
                userId,
                balance: 0,
                transactions: [],
            });
        }

        wallet.balance += parseFloat(amount);
        wallet.transactions.push({
            type: "deposit",
            amount: parseFloat(amount),
            date: new Date(),
            paymentId,
        });
        await wallet.save();

        res.json({ success: true, balance: wallet.balance });
    } catch (error) {
        console.log("Error in addToWallet:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    wallet,
    getWalletBalance,
    deductFromWallet,
    addToWallet,
};