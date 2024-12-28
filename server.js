const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const readline = require("readline");
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
  await processNotifications();
  await scrape.startScrape();
}

startup().then(() => {
  //setup cron job for repeated actions
  // every day at 00:01 do a startup
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
  console.log("Server started");
  startPrompt();
});

const processNotifications = async () => {
  await notifications.clearNotifications();
  await notifications.startNotifications();
  console.log(
    "Notifications started, scheduled: " +
      notifications.getScheduledNotifications().length
  );
};

const startPrompt = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.toLowerCase());
      });
    });
  }

  while (true) {
    const answer = await askQuestion(
      "\nDo you want to update the cherga data? [type y/yes]: \n"
    );

    if (answer === "y" || answer === "yes") {
      console.log("Updating cherga data...");
      await chergaController.updateCherga();
      await processNotifications();
    } else {
      console.log(
        'Invalid input. Please type "y" or "yes" to update the cherga data.'
      );
    }
  }
};
