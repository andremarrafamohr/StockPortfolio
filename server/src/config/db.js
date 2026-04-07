const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from server/.env");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error(`name: ${error.name}`);
    console.error(`message: ${error.message}`);
    if (error.code) {
      console.error(`code: ${error.code}`);
    }

    if (error.name === "MongooseServerSelectionError") {
      console.error(
        "MongoDB Atlas rejected the connection. Most likely your current IP is not allowed in Atlas Network Access."
      );
      console.error(
        "Add your current IP in Atlas or temporarily allow 0.0.0.0/0 for development, then restart the server."
      );
    }

    throw error;
  }
};

module.exports = connectDB;