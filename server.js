const { CronJob } = require("cron");
const db = require("./db/db");
const bot = require("./bot");

const chergaController = require("./controllers/chergaController");
const notifications = require("./notifications");

//on startup
async function startup() {
  await db.importData();
  await chergaController.updateCherga();
  await notifications.clearNotifications();
  await notifications.startNotifications();
  console.log(
    "Notifications started, scheduled: " +
      notifications.getScheduledNotifications().length
  );
}

startup();

// every day at 12:00 do a startup
