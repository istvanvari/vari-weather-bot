const { CronJob } = require("cron");

const {
  getUsersWithNotifications,
  getAllUsersNotifications,
} = require("./controllers/userController.js");
const { getChergas } = require("./controllers/chergaController.js");
const { sendMessage, sendUpdateMessage } = require("./bot");

let scheduledNotifications = [];

// set notifications for every upcoming outage today
module.exports.startNotifications = async () => {
  console.log("Starting notifications...");
  const chergas = await getChergas();

  chergas.forEach((cherga) => {
    cherga.hours.forEach((outage) => {
      // console.log(outage, cherga.cherga, cherga.subCherga);
      const now = new Date();
      const outageStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        outage.start.hours,
        outage.start.minutes,
        0,
        0
      );
      const dayOfWeek = now.getDay();

      // if outageStart more than 10 minutes in the future
      if (outageStart.getTime() - 10 * 60 * 1000 <= Date.now()) {
        return;
      }
      const job = new CronJob(
        outage.start.minutes == 0
          ? `50 ${outage.start.hours - 1} * * ${dayOfWeek}`
          : `${outage.start.minutes - 10} ${
              outage.start.hours
            } * * ${dayOfWeek}`,
        () => {
          sendNotification(outage.cherga, outage.subCherga);
        },
        null,
        true,
        "Europe/Kiev"
      );
      scheduledNotifications.push(job);
    });
  });
  if (process.env.NODE_ENV === "testing") {
    testNotifications();
  }
  return Promise.resolve();
};

module.exports.clearNotifications = () => {
  scheduledNotifications.forEach((job) => job.stop());
  scheduledNotifications = [];
  return Promise.resolve();
};

const sendNotification = async (chergaNumber, subChergaNumber) => {
  try {
    const users = await getUsersWithNotifications(
      chergaNumber,
      subChergaNumber
    );
    users.forEach((user) => {
      sendMessage(user.chatId, chergaNumber, subChergaNumber);
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.sendNotificationToAll = async (messages) => {
  try {
    const users = await getAllUsersNotifications();
    users.forEach((user) => {
      sendUpdateMessage(user.chatId, messages);
    });
  } catch (error) {
    console.log(error);
  }
};

const testNotifications = async () => {
  for (let i = 1; i <= 6; i++) {
    sendNotification(i, 1);
    sendNotification(i, 2);
  }
};

module.exports.getScheduledNotifications = () => scheduledNotifications;
