import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const dbUlr = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

function connect() {
  try {
    mongoose.connect(`${dbUlr}${dbName}`, {});
    console.log("Connect db successful");
  } catch (error) {
    console.log(error);
  }
}

export default connect;
