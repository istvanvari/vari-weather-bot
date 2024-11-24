const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { CronJob } = require("cron");
const db = require("./db/db");
const bot = require("./bot");

const chergaController = require("./controllers/chergaController");
const notifications = require("./notifications");
const scrape = require("./scrape");

//on startup
async function startup() {
  if (!(process.env.NODE_ENV === "testing")) {
    await db.importData();
  }
  await chergaController.updateCherga();
  await notifications.clearNotifications();
  await notifications.startNotifications();
  console.log(
    "Notifications started, scheduled: " +
      notifications.getScheduledNotifications().length
  );

  await scrape.startScrape();
}

startup().then(() => {
  //setup cron job for repeated actions
  // every day at 00:01 do a startupy
  const job = new CronJob(
    "0 1 * * *",
    async function () {
      await startup();
    },
    null,
    true,
    "Europe/Kiev"
  );

  //every minute check for updates
  const job2 = new CronJob(
    process.env.NODE_ENV === "testing" ? "*/10 * * * * *" : "* * * * *",
    async function () {
      await scrape.checkUpdate();
    },
    null,
    true,
    "Europe/Kiev"
  );
});
