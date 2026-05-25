const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const pageRoutes = require("./routes/pageRoutes");

const app = express();

// view engine
app.set("views", path.join(__dirname, "public/views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// static files
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(cookieParser());

// routes
app.use("/", pageRoutes);

module.exports = app;