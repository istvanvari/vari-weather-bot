const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const TelegramBot = require("node-telegram-bot-api");
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  startKeyboard(msg);
});

const startKeyboard = (msg) => {
  let options = {
    reply_markup: {
      one_time_keyboard: true,
      keyboard: [["Погода сьогодні"], ["Погода завтра"], ["Погода на тиждень"]],
    },
  };
  bot.sendMessage(msg.chat.id, "Виберіть прогноз погоди:", options);
};

bot.on("message", (msg) => {
  console.log(msg);
  let locOptions = {
    reply_markup: {
      one_time_keyboard: true,
      keyboard: [
        [
          {
            text: "Передати місце знаходження",
            request_location: true,
          },
        ],
        ["Ввести назву міста"],
      ],
    },
  };

  if (msg.text === "Погода сьогодні") {
  } else if (msg.text === "Погода завтра") {
  } else if (msg.text === "Погода на тиждень") {
  }
});

bot.onText(/\/e(.+)/, (msg, match) => {
  let chatId = msg.chat.id;
  let resp = match[1];

  bot.sendMessage(chatId, resp);
  console.log(msg);
});
