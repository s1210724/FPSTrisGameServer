const express = require("express");
const path = require("path");

const pageRoutes = require("./routes/pageRoutes");

const app = express();

// static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

app.use(express.json());

// routes
app.use("/", pageRoutes);

module.exports = app;