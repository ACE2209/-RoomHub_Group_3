import dotenv from "dotenv";
import express from "express";
import connect from "./config/dbConnect.js";
import route from "./routes/index.js";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cập nhật đường dẫn để chỉ tới thư mục public
const shortHfilePath = (fileUlR) => {
    return path.join(__dirname, "../public", fileUlR); // Thay đổi đường dẫn
};

dotenv.config();

const app = express();

app.use(cors());

// Kết nối đến MongoDB
connect();

// Cấu hình express để phân tích body của request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public/images/boardingHouse", express.static(path.join(__dirname, "../public/images/boardingHouse")));


app.use(express.static("public"));
app.set("view engine", "ejs");


// Define routes
route(app);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// Validate environment variables
const hostname = process.env.APP_HOST || "localhost";
const port = process.env.APP_PORT || 3000;

app.listen(port, hostname, () => {
    console.log(`Server is running at http://${hostname}:${port}/`);
});
