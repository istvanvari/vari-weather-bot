const { CronJob } = require("cron");

const {
  getUsersWithNotifications,
  getAllUsersNotifications,
} = require("./controllers/userController");
const { getChergas } = require("./controllers/chergaController");
const { sendMessage, sendUpdateMessage } = require("./bot");

let scheduledNotifications = [];

module.exports.startNotifications = async () => {
  console.log("Starting notifications...");
  let chergas = await getChergas();

  let outages = [[], [], [], [], [], []];

  for (let i = 0; i < chergas.length; i++) {
    let start = null;
    let end = null;
    for (let j = 0; j < chergas[i].hours.length; j++) {
      if (chergas[i].hours[j] === false && start === null) {
        start = j;
      } else if (chergas[i].hours[j] === true && start !== null) {
        end = j - 1;
        outages[i].push([start, end]);
        start = null;
        end = null;
      }
    }
    if (start !== null) {
      outages[i].push([start, 23]);
    }
  }
  // console.log(outages);

  //set notifications for every upcoming outage today
  outages.forEach((cherga, index) => {
    cherga.forEach((outage) => {
      const now = new Date();
      const outageStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        outage[0],
        0,
        0,
        0
      );
      const outageEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        outage[1],
        0,
        0,
        0
      );
      // if outageStart more than 10 minutes in the future
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
      if (outageStart.getTime() <= tenMinutesFromNow.getTime()) {
        return;
      }
      const dayOfWeek = now.getDay();

      const job = new CronJob(
        `50 ${outage[0] - 1} * * ${dayOfWeek}`,
        () => {
          sendNotification(index);
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
};

const sendNotification = async (chergaNumber) => {
  try {
    const users = await getUsersWithNotifications(chergaNumber);
    users.forEach((user) => {
      sendMessage(user.chatId, chergaNumber);
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
    sendNotification(i);
  }
};

module.exports.getScheduledNotifications = () => scheduledNotifications;
