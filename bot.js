const {
  getAllCityStartingLetters,
  getCityStartsWith,
  getStreets,
  findCherga,
} = require("./controllers/chergaItemController");
const {
  checkNotificationsEnabled,
  createOrUpdateUser,
  userExists,
  enableNotifications,
  disableNotifications,
} = require("./controllers/userController");

const { sortLocale, sortNumericStrings } = require("./util");

const { Telegraf, Markup, Context, Scenes, session } = require("telegraf");
const { message } = require("telegraf/filters");
const bot = new Telegraf(process.env.TOKEN);

//scenes ------------------------------------------
const stage = new Scenes.Stage();

// Scene 1. Get starting letter of city
const cityLettersScene = new Scenes.BaseScene("select_city_letter");
cityLettersScene.enter(async (ctx) => {
  let cityLetters = await getAllCityStartingLetters();

  // Split the cityLetters into chunks
  const chunkedCityLetters = chunkArray(cityLetters, 6);

  try {
    await ctx.reply(
      "Виберіть першу літеру населеного пункту:",
      Markup.inlineKeyboard(
        chunkedCityLetters.map((chunk) =>
          chunk.map((letter) =>
            Markup.button.callback(letter, `letter_${letter}`)
          )
        )
      )
    );
  } catch (err) {
    console.error("Failed to edit message:", err.message);
    ctx.scene.leave();
    await ctx.reply("Будь ласка, використайте повторно команду /city");
  }
});
cityLettersScene.on("callback_query", (ctx) => {
  ctx.answerCbQuery();
  const selectedLetter = ctx.update.callback_query.data;
  ctx.session.cityLetter = selectedLetter[selectedLetter.length - 1];
  ctx.scene.enter("select_city_name");
});

// Scene 2. Get city name
const cityNameScene = new Scenes.BaseScene("select_city_name");
// Define behavior when entering the second scene
cityNameScene.enter(async (ctx) => {
  if (!validateSession(ctx, "cityLetter")) return;

  const cityLetter = ctx.session.cityLetter;
  let cityNames = await getCityStartsWith(cityLetter);

  ctx.deleteMessage();
  try {
    await ctx.reply(
      "Виберіть населениий пункт:",
      Markup.inlineKeyboard(
        cityNames.map((name) => [Markup.button.callback(name, name)])
      )
    );
  } catch (err) {
    console.error("Failed to edit message:", err.message);
    ctx.scene.leave();
    await ctx.reply("Будь ласка, використайте повторно команду /city");
  }
});
cityNameScene.on("callback_query", async (ctx) => {
  const selectedCityName = ctx.update.callback_query.data;
  ctx.session.cityName = selectedCityName;
  ctx.scene.enter("select_street");
});

// Scene 3. Get street
const streetScene = new Scenes.BaseScene("select_street");
streetScene.enter(async (ctx) => {
  if (!validateSession(ctx, "cityName")) return;

  let streets = await getStreets(ctx.session.cityName);

  const noStreet = streets.filter((street) => !street.street);
  if (noStreet.length > 0 || streets.length === 0) {
    const combinedNoStreet = {
      street: "інші номери будинків",
      houseNumbers: noStreet.flatMap((street) => street.houseNumbers),
    };
    streets = streets.filter((street) => street.street);
    streets.push(combinedNoStreet);
  }
  ctx.session.streets = streets;

  ctx.deleteMessage();
  try {
    await ctx.reply(
      "Виберіть вулицю:",
      Markup.inlineKeyboard(
        streets
          .filter((street) => street.street)
          .map((street) => [
            Markup.button.callback(street.street, `street_${street.street}`),
          ])
      )
    );
  } catch (err) {
    console.error("Failed to edit message:", err.message);
    ctx.scene.leave();
    await ctx.reply("Будь ласка, використайте повторно команду /city");
  }
});
streetScene.on("callback_query", async (ctx) => {
  const selectedStreet = ctx.update.callback_query.data;
  ctx.session.street = selectedStreet.substring("street_".length);
  ctx.scene.enter("select_house_numbers");
});

// Scene 4. Get house numbers
const houseNumbersScene = new Scenes.BaseScene("select_house_numbers");
houseNumbersScene.enter(async (ctx) => {
  const street = ctx.session.streets?.find(
    (street) => street.street === ctx.session.street
  );

  if (!street || !street.houseNumbers) {
    await ctx.reply("Будь ласка, використайте повторно команду /city");
    return ctx.scene.leave(); // Exit the scene gracefully
  }
  const houseNumbers = sortLocale(street.houseNumbers);
  const chunkedHouseNumbers = chunkArray(houseNumbers, 6);

  ctx.deleteMessage();
  try {
    await ctx.reply(
      "Виберіть номер будинку:",
      Markup.inlineKeyboard(
        chunkedHouseNumbers.map((chunk) =>
          chunk.map((number) => Markup.button.callback(number, number))
        )
      )
    );
  } catch (err) {
    console.error("Failed to edit message:", err.message);
    ctx.scene.leave();
    await ctx.reply("Будь ласка, використайте повторно команду /city");
  }
});
houseNumbersScene.on("callback_query", async (ctx) => {
  const selectedHouseNumber = ctx.update.callback_query.data;
  ctx.session.houseNumber = selectedHouseNumber;

  const cherga = await findCherga(
    ctx.session.cityName,
    ctx.session.street,
    ctx.session.houseNumber
  );
  const userData = {
    chatId: ctx.callbackQuery.from.id,
    city: ctx.session.cityName,
    street: ctx.session.street,
    houseNumber: ctx.session.houseNumber,
    cherga: cherga[0],
    subCherga: cherga[1],
    notification: true,
  };
  await createOrUpdateUser(ctx.callbackQuery.from.id, userData);
  ctx.deleteMessage();
  start(
    ctx,
    `У вас ${cherga[0]}-${cherga[1]} черга - після підключення сповіщень орієнтуйтесь на неї!` +
      "\n\nСповіщення підключено. ✅"
  );
  ctx.session = {}; // Clear session at the end of interaction
  return ctx.scene.leave();
});

stage.register(cityLettersScene, cityNameScene, streetScene, houseNumbersScene);

//Middlewares ------------------------------------------
bot.use(session());
bot.use(stage.middleware());

// bot.use(Telegraf.log());
// bot.use((ctx, next) => {
//   console.log(ctx);
//   next();
// });

//commands ------------------------------------------
const commands = [
  { command: "/start", description: "Почати роботу бота 🚀" },
  // { command: "/help", description: "Show help information" },
  // { command: "/city", description: "Select a city" },
];

// bot.telegram.setMyCommands(commands);

bot.start(async (ctx) => {
  start(ctx, "Вітаю! Виберіть дію: ");
});

// bot.help((ctx) => {
//   commands.forEach((command) => {
//     ctx.reply("Send " + command.command + " to " + command.description);
//   });
// });

bot.hears("📍 Оновити адресу", async (ctx) => {
  ctx.session = {}; // Clear session to prevent conflicts
  ctx.scene.enter("select_city_letter");
});

bot.hears("🔔 Підключити сповіщення (ON)", async (ctx) => {
  const userId = ctx.update.message.from.id;
  const user = await userExists(userId);

  if (user) {
    await enableNotifications(userId);
    await start(ctx, "Сповіщення підключено. ✅");
  } else {
    ctx.session = {}; // Clear session to prevent conflicts
    await ctx.reply("Щоб підключити сповіщення, введіть свою адресу:");
    ctx.scene.enter("select_city_letter");
  }
});

bot.hears("🔕 Відключити сповіщення (OFF)", async (ctx) => {
  const userId = ctx.update.message.from.id;
  await disableNotifications(userId);
  await start(ctx, "Сповіщення відключено. ❌");
});

bot.command("city", (ctx) => {
  ctx.session = {}; // Clear session to prevent conflicts
  ctx.scene.enter("select_city_letter");
});

bot.launch();

// Graceful shutdown on process termination (Ctrl + C)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// messages ------------------------------------------
const getMenu = (notificationsEnabled) => [
  "📍 Оновити адресу",
  !notificationsEnabled
    ? "🔔 Підключити сповіщення (ON)"
    : "🔕 Відключити сповіщення (OFF)",
];

const getNotificationMessage = (chergaNumber, subChergaNumber) =>
  `⚡️❌ ${chergaNumber}.${subChergaNumber} ЧЕРГА - ЧЕРЕЗ 10 ХВИЛИН МОЖЛИВЕ ВІДКЛЮЧЕННЯ СВІТЛА`;

const getUpdateMessage = (messages) =>
  "⚡️🕰️ Актуалізована інформація щодо годин включення/відключення електроенергії:\n\n" +
  messages.join("\n\n");

//helpers ------------------------------------------
async function start(ctx, msg) {
  const userId = ctx.from.id;
  const notificationsEnabled = await checkNotificationsEnabled(userId);

  await ctx.reply(
    msg,
    Markup.keyboard(getMenu(notificationsEnabled)).oneTime().resize()
  );
}

function chunkArray(cityLetters, chunkSize) {
  const chunkedCityLetters = [];
  for (let i = 0; i < cityLetters.length; i += chunkSize) {
    chunkedCityLetters.push(cityLetters.slice(i, i + chunkSize));
  }
  return chunkedCityLetters;
}

function validateSession(
  ctx,
  property,
  errorMessage = "Будь ласка, використайте повторно команду /city"
) {
  if (!ctx.session[property]) {
    ctx.reply(errorMessage);
    ctx.scene.leave(); // Exit the scene gracefully
    return false; // Indicates validation failure
  }
  return true; // Indicates validation success
}

module.exports.sendMessage = async (chatId, chergaNumber, subChergaNumber) => {
  try {
    await bot.telegram.sendMessage(
      chatId,
      getNotificationMessage(chergaNumber, subChergaNumber)
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports.sendUpdateMessage = async (chatId, messages) => {
  try {
    await bot.telegram.sendMessage(chatId, getUpdateMessage(messages));
  } catch (err) {
    console.log(err);
  }
};
