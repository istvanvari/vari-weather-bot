const axios = require("axios");
const fs = require("fs");
const path = require("path");
const db = require("./db");

const {
  createAllChergaItems,
  deleteAllChergaItems,
} = require("../controllers/chergaItemController");
const downloadFolder = path.join(__dirname, "../db/downloads");

async function downloadFiles() {
  //download files from url to download folder
  const urls = [
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/cherga1.pdf",
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/cherga2.pdf",
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/cherga3.pdf",
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/cherga4.pdf",
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/cherga5.pdf",
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/cherga6.pdf",
  ];

  //clear download folder
  if (fs.existsSync(downloadFolder)) {
    fs.readdirSync(downloadFolder).forEach((file) => {
      fs.unlinkSync(path.join(downloadFolder, file));
    });
  }

  // Create an array of promises for downloading each file
  const downloadPromises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      const fileName = url.split("/").pop();
      const filePath = path.join(downloadFolder, fileName);

      axios
        .get(url, { responseType: "stream" })
        .then((response) => {
          const file = fs.createWriteStream(filePath);
          response.data.pipe(file);

          file.on("finish", () => {
            file.close();
            resolve(); // Resolve the promise when the file is finished downloading
          });

          file.on("error", (err) => {
            reject(err); // Reject the promise if there's an error
          });
        })
        .catch((err) => {
          reject(err); // Reject the promise if there's an error with the HTTP request
        });
    });
  });

  // Wait for all download promises to complete
  try {
    await Promise.all(downloadPromises);
    console.log("All files downloaded successfully.");
  } catch (error) {
    console.error("Error downloading files:", error);
  }
}

//read table from pdf file
function readPDF(filename) {
  var pdfreader = require("pdfreader");

  const chergaNumber = parseInt(filename[filename.length - 5]);

  const nbCols = 3;
  const cellPadding = 50; // each cell is padded to fit 40 characters
  var pageWidth = 40;

  const collumns = [
    [0.174, 0.4],
    [0.19, 0.445],
    [0.25, 0.45],
    [0.18, 0.45],
    [0.24, 0.45],
    [0.18, 0.45],
  ];

  const columnQuantitizer = (item) => {
    var itemX = parseFloat(item.x);
    if (itemX >= pageWidth * collumns[chergaNumber - 1][1]) return 2;
    if (itemX <= pageWidth * collumns[chergaNumber - 1][0]) return 0;
    return 1;
  };

  const padColumns = (array, nb) =>
    Array.apply(null, { length: nb }).map((val, i) => array[i] || []);
  // .. because map() skips undefined elements

  const mergeCells = (cells) =>
    (cells || [])
      .map((cell) => cell.text)
      .join("") // merge cells
      .substr(0, cellPadding)
      .padEnd(cellPadding, " "); // padding

  const renderMatrix = (matrix) => {
    return (matrix || [])
      .map((row, y) => padColumns(row, nbCols).map(mergeCells).join(" | "))
      .join("\n");
  };

  const extractDataFromPage = (matrix) => {
    let pageData = [];
    for (let row of matrix || []) {
      let paddedRow = padColumns(row, nbCols);
      for (let i = 0; i < nbCols; i++) {
        paddedRow[i] = (paddedRow[i] || [])
          .map((cell) => cell.text)
          .join("")
          .trim()
          .replace(/(^\s*,)|(,\s*$)/g, "");
      }

      paddedRow[2] = paddedRow[2]
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      pageData.push(paddedRow);
    }
    return pageData;
  };

  //--------------------------------------------
  return new Promise((resolve, reject) => {
    let table = new pdfreader.TableParser();
    let data = [];

    new pdfreader.PdfReader().parseFileItems(filename, function (err, item) {
      if (err) {
        return reject(err);
      }

      if (!item) {
        // End of file
        data = data.concat(extractDataFromPage(table.getMatrix()));
        console.log("File read successfully: ", filename.split("/").pop());
        resolve(data);
      } else if (item.page) {
        data = data.concat(extractDataFromPage(table.getMatrix()));
        pageWidth = item.width;
        table = new pdfreader.TableParser(); // new/clear table for next page
      } else if (item.text) {
        table.processItem(item, columnQuantitizer(item));
      }
    });
  });
}

async function processPDFs() {
  const files = fs.readdirSync(downloadFolder);
  console.log("Processing PDFs...");
  
  for (let file = 1; file <= files.length; file++) {
    let filename = downloadFolder + "/" + files[file - 1];
    try {
      const data = await readPDF(filename);

      //remove first x rows
      data.splice(0, 6);

      //consolidate data
      let procesedData = [];
      let dataType = [];
      // 0: full;  1: no house ;  2: no city+street, 4: no street(---)
      for (let i = 0; i < data.length; i++) {
        if (!data[i][0] && !data[i][1] && data[i][2].length > 0) {
          dataType.push(2);
        } else if (!data[i][1]) {
          dataType.push(4);
        } else if (data[i][2].length === 0) {
          dataType.push(1);
        } else {
          dataType.push(0);
        }
      }
      // console.log("dataType", dataType.length);

      for (let i = 0; i < data.length; i++) {
        //no data
        if (dataType[i] === 4) {
          continue;
        }
        if (dataType[i] === 0) {
          procesedData.push(data[i]);
        } else if (dataType[i] === 2) {
          // Check for "2, 1, 2"
          // Check for "2, 0, 2"
          if (
            i < data.length - 2 &&
            dataType[i] === 2 &&
            (dataType[i + 1] === 1 || dataType[i + 1] === 0) &&
            dataType[i + 2] === 2
          ) {
            let res = [...data[i + 1]];
            res[2] = [...data[i][2], ...data[i + 1][2], ...data[i + 2][2]];
            procesedData.push(res);
            i += 2;
          }
          // check for 22122
          else if (dataType[i + 1] === 2) {
            let j = 2;
            while (true) {
              if (dataType[i + j] === 2) j++;
              else if (dataType[i + j] === 1 || dataType[i + j] === 0) {
                // put together with for
                let streets = [];
                for (let k = 0; k < j * 2 + 1; k++) {
                  streets = [...streets, ...data[i + k][2]];
                }
                let res = [...data[i + j]];
                res[2] = [...streets];
                procesedData.push(res);
                i += j * 2;
                break;
              } else if (dataType[i + j] === 4) {
                i += j * 2;
                break;
              }
            }
          }
        }
      }
      createAllChergaItems(procesedData, filename[filename.length - 5]);
    } catch (error) {
      console.error(error);
    }
  }
  console.log("PDFs processed successfully");
}

async function importDataToDB() {
  await deleteAllChergaItems();
  await downloadFiles();
  await processPDFs();
}

module.exports = { importDataToDB };
