const axios = require("axios");
const cheerio = require("cheerio");
const { sendNotificationToAll } = require("./notifications");

let info = [];

module.exports.startScrape = async () => {
  info = [];
  try {
    info = await scrapeInfo();
  } catch (err) {
    console.log(err);
  }
};

module.exports.checkUpdate = async () => {
  try {
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
  } catch (err) {
    console.log(err);
    return false;
  }
};

const scrapeInfo = async () => {
  const response = await axios.get(
    "https://zakarpat.energy/customers/break-in-electricity-supply/schedule/"
  );
  if (response.status !== 200) return [];
  const $ = cheerio.load(response.data);
  const text = $(".additional-info__text").text().trim();
  return text.split("\n") || [];
};

module.exports.getInfo = () => info;
