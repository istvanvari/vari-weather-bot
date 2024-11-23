const fs = require("fs");
const path = require("path");
const Cherga = require("../models/cherga");
const chergaPath = path.join(__dirname, "../data/cherga.txt");

// Function to read and parse the cherga.txt file
function readChergaFile(filePath) {
  try {
    // Read the file content
    const data = fs.readFileSync(filePath, "utf8");

    // Split content by lines and map to a 2D array
    const array = data.split("\n").map(
      (line) => line.trim().split(/\s+/).map(Number) // Split by whitespace and convert to numbers
    );

    return array.slice(1);
  } catch (err) {
    console.error("Error reading the file:", err);
    return null;
  }
}

module.exports.updateCherga = async () => {
  const chergaData = readChergaFile(chergaPath);
  // console.log(chergaData);

  if (chergaData === null) {
    console.error("Could not read the cherga.txt file");
    return;
  }

  try {
    await Cherga.deleteMany({}); // Clear the collection
    for (let i = 1; i <= chergaData.length; i++) {
      await Cherga.insertMany({
        cherga: i,
        hours: chergaData[i - 1].map((item) => Boolean(item)),
      });
    }
    console.log("Cherga data updated successfully");
  } catch (err) {
    console.error(err);
  }
};

module.exports.getChergas = async () => {
  try {
    const chergas = await Cherga.find().exec();
    return chergas;
  } catch (err) {
    console.error(err);
    return [];
  }
};
