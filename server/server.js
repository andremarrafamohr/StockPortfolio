// server.js
require("dotenv").config();

process.on("uncaughtException", (error) => {
  console.log("[boot] uncaughtException");
  console.error(error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.log("[boot] unhandledRejection");
  console.error(reason);
  process.exit(1);
});

console.log("[boot] loading app modules...");
const app = require("./src/app");
const connectDB = require("./src/config/db");
console.log("[boot] modules loaded");

const PORT = process.env.PORT || 5000;
const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET"];

const validateRequiredEnv = () => {
  console.log(
    `[boot] env check: MONGO_URI=${Boolean(process.env.MONGO_URI)} JWT_SECRET=${Boolean(
      process.env.JWT_SECRET
    )}`
  );

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
    console.log("[boot] startServer called");
    validateRequiredEnv();
    console.log("[boot] connecting to MongoDB...");
    await connectDB();
    console.log("[boot] MongoDB connected, starting HTTP server...");

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