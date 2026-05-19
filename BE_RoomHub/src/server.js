const express = require("express");
const connectDB = require("./config/db/connectDB");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const route = require("./routes");
require("dotenv").config();
const path = require("path");

// Load environment variables
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;

// Initialize Express app
const app = express();

// Middleware static files
app.use(
  "/uploads/avatars",
  express.static(path.join(__dirname, "uploads/avatars"))
);
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "uploads/products"))
);

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Initialize routes
route(app);

// Start server and connect to database
app.listen(PORT, async () => {
  try {
    await connectDB(DATABASE_URL);
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Server failed to start:", error);
  }
});
