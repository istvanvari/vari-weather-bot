const fs = require("fs");
const path = require("path");
const Cherga = require("../models/cherga.js");
const chergaPath = path.join(__dirname, "../data/cherga.txt");

// Function to read and parse the cherga.txt file
async function readChergaFile(filePath) {
  try {
    // Read the file content
    const data = fs.readFileSync(filePath, "utf8");
    try {
      let array = data
        .split("\n")
        .map((line) => line.trim().split(/\s*\|\s*/))
        .filter((line) => line.length > 1)
        .map((line) => line.slice(1));

      array = array.map((line) =>
        line.map((item) => {
          const [start, end] = item.split("-");
          const startParts = start.split(":");
          const endParts = end.split(":");
          return {
            start: {
              hours: parseInt(startParts[0], 10),
              minutes: parseInt(startParts[1], 10),
            },
            end: {
              hours: parseInt(endParts[0], 10),
              minutes: parseInt(endParts[1], 10),
            },
          };
        })
      );
      return array;
    } catch (err) {
      console.error("Error parsing cherga data, check cherga.txt", err);
      return null;
    }
  } catch (err) {
    console.error(`Error reading cherga file: ${err}`);
    return null;
  }
}

module.exports.updateCherga = async () => {
  try {
    const chergaData = await readChergaFile(chergaPath);

    await Cherga.deleteMany({}); // Clear the collection
    chergaData.forEach((cherga, index) => {
      Cherga.create({
        cherga: Math.round((index + 1) / 2),
        subCherga: (index % 2) + 1,
        hours: cherga,
      });
    });
    console.log("Cherga data updated successfully");
  } catch (err) {
    console.error(`Error reading cherga file: ${err}`);
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
