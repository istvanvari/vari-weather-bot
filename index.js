const TelegramBot = require('node-telegram-bot-api');
const { TOKEN } = require('./constants');
const {
    currentWeatherMessage,
    nextDayWeatherMessage,
    weekWeatherMessage,
    weatherIcon,
    geo,
    reverseGeo,
    getWeatherData,
    getWeatherCurent,
} = require('./weather');

const bot = new TelegramBot(TOKEN, { polling: true });


bot.onText(/\/start/, (msg) => {
    startKeyboard(msg);
});

const startKeyboard = (msg) => {
    let options = {
        "reply_markup": {
            "one_time_keyboard": true,
            "keyboard": [["Погода сьогодні"], ["Погода завтра"], ["Погода на тиждень"]]
        }
    };
    bot.sendMessage(msg.chat.id, 'Виберіть прогноз погоди:', options)
}

bot.on('message', (msg) => {
    console.log(msg);
    let locOptions = {
        "reply_markup": {
            "one_time_keyboard": true,
            "keyboard": [[{
                text: "Передати місце знаходження",
                request_location: true
            }], ["Ввести назву міста"]]
        }
    };

    if (msg.text === 'Погода сьогодні') {
        bot.sendMessage(msg.chat.id, 'Де ви знаходитесь?', locOptions).then(() => {
            bot.once('location', (msg) => {
                reverseGeo(msg.location.latitude, msg.location.longitude).then(res => {
                    console.log(res);
                    let geoName = res.local_names.uk || res.name;
                    getWeatherCurent(msg.location.latitude, msg.location.longitude).then(res => {
                        console.log(res.data);
                        bot.sendPhoto(msg.chat.id, weatherIcon(res.data.weather[0].icon));
                        bot.sendMessage(msg.chat.id, currentWeatherMessage(res.data, geoName), { parse_mode: 'HTML' });
                        startKeyboard(msg);
                    }).catch(err => {
                        console.log(err);
                    })
                }).catch(err => {
                    console.log(err);
                })
            });
            bot.once('message', (msg) => {
                if (msg.text === 'Ввести назву міста') {
                    bot.sendMessage(msg.chat.id, 'Введіть назву населеного пункту:', { "reply_markup": { remove_keyboard: true } }).then(() => {
                        bot.once('message', (msg) => {
                            geo(msg.text).then(res => {
                                let geoName = res.local_names.uk;
                                getWeatherCurent(res.lat, res.lon).then(res => {
                                    console.log(res.data);
                                    bot.sendPhoto(msg.chat.id, weatherIcon(res.data.weather[0].icon));
                                    bot.sendMessage(msg.chat.id, currentWeatherMessage(res.data, geoName), { parse_mode: 'HTML' });
                                    startKeyboard(msg);
                                }).catch(err => {
                                    console.log(err);
                                })
                            }).catch(err => {
                                console.log(err);
                                startKeyboard(msg);
                            })
                        });
                    });
                }
            });
        })
    } else if (msg.text === 'Погода завтра') {
        bot.sendMessage(msg.chat.id, 'Де ви знаходитесь?', locOptions).then(() => {
            bot.once('location', (msg) => {
                reverseGeo(msg.location.latitude, msg.location.longitude).then(res => {
                    console.log(res);
                    let geoName = res.local_names.uk || res.name;
                    getWeatherData(msg.location.latitude, msg.location.longitude).then(res => {
                        console.log(res.data.daily[1]);
                        bot.sendPhoto(msg.chat.id, weatherIcon(res.data.daily[1].weather[0].icon));
                        bot.sendMessage(msg.chat.id, nextDayWeatherMessage(res.data.daily[1], geoName), { parse_mode: 'HTML' });
                        startKeyboard(msg);
                    }).catch(err => {
                        console.log(err);
                    })
                }).catch(err => {
                    console.log(err);
                })
            });
            bot.once('message', (msg) => {
                if (msg.text === 'Ввести назву міста') {
                    bot.sendMessage(msg.chat.id, 'Введіть назву населеного пункту:', { "reply_markup": { remove_keyboard: true } }).then(() => {
                        bot.once('message', (msg) => {
                            geo(msg.text).then(res => {
                                let geoName = res.local_names.uk;
                                getWeatherData(res.lat, res.lon).then(res => {
                                    console.log(res.data.daily[1]);
                                    bot.sendPhoto(msg.chat.id, weatherIcon(res.data.daily[1].weather[0].icon));
                                    bot.sendMessage(msg.chat.id, nextDayWeatherMessage(res.data.daily[1], geoName), { parse_mode: 'HTML' });
                                    startKeyboard(msg);
                                }).catch(err => {
                                    console.log(err);
                                })
                            }).catch(err => {
                                console.log(err);
                                startKeyboard(msg);
                            })
                        });
                    });
                }
            });
        })
    }
    else if (msg.text === 'Погода на тиждень') {
        bot.sendMessage(msg.chat.id, 'Де ви знаходитесь?', locOptions).then(() => {
            bot.once('location', (msg) => {
                reverseGeo(msg.location.latitude, msg.location.longitude).then(res => {
                    console.log(res);
                    let geoName = res.local_names.uk || res.name;
                    getWeatherData(msg.location.latitude, msg.location.longitude).then(res => {
                        console.log(res.data.daily);
                        bot.sendMessage(msg.chat.id, weekWeatherMessage(res.data.daily, geoName), { parse_mode: 'HTML' });
                        startKeyboard(msg);
                    }).catch(err => {
                        console.log(err);
                    })
                }).catch(err => {
                    console.log(err);
                })
            });
            bot.once('message', (msg) => {
                if (msg.text === 'Ввести назву міста') {
                    bot.sendMessage(msg.chat.id, 'Введіть назву населеного пункту:', { "reply_markup": { remove_keyboard: true } }).then(() => {
                        bot.once('message', (msg) => {
                            geo(msg.text).then(res => {
                                let geoName = res.local_names.uk;
                                getWeatherData(res.lat, res.lon).then(res => {
                                    console.log(res.data.daily);
                                    bot.sendMessage(msg.chat.id, weekWeatherMessage(res.data.daily, geoName), { parse_mode: 'HTML' });
                                    startKeyboard(msg);
                                }).catch(err => {
                                    console.log(err);
                                })
                            }).catch(err => {
                                console.log(err);
                                startKeyboard(msg);
                            })
                        });
                    });
                }
            });
        })
    }
});

bot.onText(/\/e(.+)/, (msg, match) => {

    let chatId = msg.chat.id;
    let resp = match[1];

    bot.sendMessage(chatId, resp);
    console.log(msg);
});