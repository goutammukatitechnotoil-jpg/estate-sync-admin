const fs = require("fs");
const mongoose = require("mongoose");

// Connection URI from your snippet
const uri = "mongodb://prod_user:sQ6kqO5iDuntPvfr@ac-4z2vxzn-shard-00-00.uzkhpk2.mongodb.net:27017,ac-4z2vxzn-shard-00-01.uzkhpk2.mongodb.net:27017,ac-4z2vxzn-shard-00-02.uzkhpk2.mongodb.net:27017/estate_sync_prod?ssl=true&replicaSet=atlas-8qli5o-shard-0&authSource=admin&retryWrites=true&w=majority";

async function exportData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    
    const db = mongoose.connection.db;
    const collection = db.collection("properties");

    console.log("Fetching data from 'properties' collection...");
    const data = await collection.find({}).toArray();

    console.log(`Found ${data.length} documents. Writing to output.json...`);
    fs.writeFileSync("output.json", JSON.stringify(data, null, 2));

    console.log("✅ Data exported successfully to output.json");
  } catch (error) {
    console.error("❌ Error exporting data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Connection closed.");
  }
}

exportData();
