const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const port = 80;
const TOKEN = '6245452578:AAH6XW5-JcoOOCMotdIUHmILSUcOCZpp3vs';


const app = express();
const bot = new TelegramBot(TOKEN, { polling: true });

// Listening
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

bot.onText(/\/e(.+)/, (msg, match) => {

    let chatId = msg.chat.id;
    let resp = match[1];

    bot.sendMessage(chatId, resp);
    console.log(msg);
});

