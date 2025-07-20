const express = require("express");
const app = express();
const path = require("path");
const morgan = require("morgan");
const nocache = require("nocache");
const session = require("express-session");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const checkblock = require("./middleware/checkblock");

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require("dotenv").config();

if (!process.env.SESSION_SECRET) {
    console.error("SESSION_SECRET is not set in the environment variables. Please set it in .env or your hosting platform.");
    process.exit(1);
}

app.set("view engine", "ejs");

const oneDay = 1000 * 60 * 60 * 24;
app.use(nocache());
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        cookie: { maxAge: oneDay },
        saveUninitialized: true,
        store: new session.MemoryStore(), // Use MemoryStore for simplicity; consider Redis in production
    })
);
app.use(flash());

// Load assets
app.use("/stylesheet", express.static(path.resolve(__dirname, "public/stylesheet")));
app.use("/img", express.static(path.resolve(__dirname, "public/img")));
app.use("/js", express.static(path.resolve(__dirname, "public/js")));

// Serve uploads folder (case-sensitive match)
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Middleware to check blocked status for all user routes
app.use(checkblock);

// Require routes
const userConnection = require("./routes/user");
const adminRouter = require("./routes/admin");
const collection = require("./config/dbconnect");

// Setup router
app.use("/admin", adminRouter);
app.use("/", userConnection);

// Catch-all route for undefined routes
app.get("*", (req, res) => {
    res.render("error");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`http://0.0.0.0:${PORT}`);
});