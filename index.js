const express = require("express");
const app = express();
const path = require("path");
const morgan = require("morgan");
const nocache = require("nocache");
const session = require("express-session");
const flash = require("connect-flash");
require("dotenv").config();
const connectDB = require("./config/dbconnect");

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

const oneDay = 1000 * 60 * 60 * 24;
app.use(nocache());
app.use(
    session({
        secret: process.env.SESSION_SECRET || "Your-secret-key",
        resave: false,
        cookie: { maxAge: oneDay },
        saveUninitialized: true,
    })
);
app.use(flash());

// Load assets
app.use("/stylesheet", express.static(path.resolve(__dirname, "public/stylesheet")));
app.use("/img", express.static(path.resolve(__dirname, "public/img")));
app.use("/js", express.static(path.resolve(__dirname, "public/js")));
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

// Require routes
const userConnection = require("./routes/user");
const adminRouter = require("./routes/admin");

// Connect to MongoDB
connectDB();

// Setup router
app.use("/admin", adminRouter);
app.use("/", userConnection);

// Catch-all route for undefined routes
app.use((req, res, next) => {
    res.status(404).render("error", { message: "Page not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("error", { message: err.message || "Something went wrong!" });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});