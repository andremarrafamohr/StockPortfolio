// server.js
require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;
const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET"];

const validateRequiredEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Startup failed: missing required environment variables: ${missing.join(", ")}`
    );
    console.error(
      "Set these in Render -> Service -> Environment, then trigger a new deploy."
    );
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    validateRequiredEnv();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (node ${process.version})`);
    });
  } catch (error) {
    console.error(`Startup failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

startServer();