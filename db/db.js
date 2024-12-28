const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const dbUtil = require("./dbUtil.js");

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB...");
  })
  .catch((err) => {
    console.log(err);
  });

async function importData() {
  await dbUtil.importDataToDB();
}

module.exports = { importData };
