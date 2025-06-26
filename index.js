const express = require("express");
const app = express();
const path = require("path");
const morgan = require("morgan");
const nocache = require("nocache");
const session = require("express-session");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const i = process.env.PORT;
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require("dotenv").config();

app.set("view engine", "ejs");

const oneday = 1000 * 60 * 60 * 24;
app.use(nocache());
app.use(
    session({
        secret: "Your-secret-key",
        resave: false,
        cookie: { maxAge: oneday },
        saveUninitialized: true,
    })
);
console.log(process.env);
app.use(flash());

app.get("/home", async (req, res) => {
    try {
        const products = await products.find();

        res.render("home", { products: products });
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
});

// requiring routes
const userConnection = require("./routs/user");

const adminrouter = require("./routs/admin");
const collection = require("./config/dbconnect");
const { productlist } = require("./contorller/admincontroller");

//load assets

app.use("/stylesheet", express.static(path.resolve(__dirname, "public/stylesheet")));
app.use("/img", express.static(path.resolve(__dirname, "public/img")));
app.use("/js", express.static(path.resolve(__dirname, "public/js")));
app.use("/uploads", express.static(path.resolve(__dirname, "uploads")));

//setup router
// app.use('/',userrouter)
app.use("/admin", adminrouter);
app.use("/", userConnection);
app.get("*", (req, res) => {
    res.render("error");
});

app.listen(process.env.PORT, () => {
    console.log(`http://localhost:${process.env.PORT}`);
});
