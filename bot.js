const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const {
  getAllCityStartingLetters,
  getCityStartsWith,
  getStreets,
} = require("./db/controllers/chergaItemController");

const { Telegraf, Markup, Context, Scenes, session } = require("telegraf");
const { message } = require("telegraf/filters");
const bot = new Telegraf(process.env.TOKEN);

//------------------------------------------
//scenes
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
          chunk.map((letter) => Markup.button.callback(letter, letter))
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
  ctx.session.cityLetter = selectedLetter;
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

  const streets = await getStreets(ctx.session.cityName);
  ctx.session.streets = streets;

  ctx.deleteMessage();
  try {
    await ctx.reply(
      "Виберіть вулицю:",
      Markup.inlineKeyboard(
        streets.map((street) => [
          Markup.button.callback(street.street, street.street),
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
  ctx.session.street = selectedStreet;
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

  const houseNumbers = sortLocal(street.houseNumbers);
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
  await ctx.deleteMessage();
  ctx.session = {}; // Clear session at the end of interaction
  return ctx.scene.leave();
});

stage.register(cityLettersScene, cityNameScene, streetScene, houseNumbersScene);

//------------------------------------------
//Middlewares
bot.use(session());
bot.use(stage.middleware());

// bot.use(Telegraf.log());
// bot.use((ctx, next) => {
//   console.log(ctx);
//   next();
// });

//------------------------------------------
//commands
const commands = [
  { command: "/start", description: "Start the bot" },
  { command: "/help", description: "Show help information" },
  { command: "/city", description: "Select a city" },
];

bot.telegram.setMyCommands(commands);

bot.start((ctx) => {
  ctx.reply(
    "Welcome to your Telegram bot! Use /help to see available commands."
  );
});

bot.help((ctx) => {
  commands.forEach((command) => {
    ctx.reply("Send " + command.command + " to " + command.description);
  });
});

bot.command("city", (ctx) => {
  ctx.session = {}; // Clear session to prevent conflicts
  ctx.scene.enter("select_city_letter");
});

bot.launch();

// Graceful shutdown on process termination (Ctrl + C)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

function chunkArray(cityLetters, chunkSize) {
  const chunkedCityLetters = [];
  for (let i = 0; i < cityLetters.length; i += chunkSize) {
    chunkedCityLetters.push(cityLetters.slice(i, i + chunkSize));
  }
  return chunkedCityLetters;
}

function sortLocal(array) {
  return array.sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
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
