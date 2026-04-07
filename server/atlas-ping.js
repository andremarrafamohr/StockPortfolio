require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI is missing in server/.env");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("ATLAS_PING_OK");
  } catch (error) {
    console.error("ATLAS_PING_ERROR");
    console.error(error.name);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
