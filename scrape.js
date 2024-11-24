const axios = require("axios");
const cheerio = require("cheerio");
const { sendNotificationToAll } = require("./notifications");

let info = [];

module.exports.startScrape = async () => {
  info = [];
  info = await scrapeInfo();
};

module.exports.checkUpdate = async () => {
  const currentInfo = await scrapeInfo();
  if (process.env.NODE_ENV === "testing") {
    await sendNotificationToAll(currentInfo.concat("test"));
    console.log("Update found at:", new Date().toLocaleString());
  }
  if (info.length === currentInfo.length) {
    return false;
  }
  const difference = currentInfo.filter((x) => !info.includes(x));

  if (difference.length === 0) return false;
  console.log("Update found at:", new Date().toLocaleString());
  await sendNotificationToAll(difference);
  info = currentInfo;
  return true;
};

const scrapeInfo = async () => {
  const response = await axios.get(
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/"
  );
  const $ = cheerio.load(response.data);
  const text = $(".additional-info__text").text().trim();
  return text.split("\n") || [];
};

module.exports.getInfo = () => info;
