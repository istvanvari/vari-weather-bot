const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const icons = require('./icons.json');

const TOKEN = '6245452578:AAH6XW5-JcoOOCMotdIUHmILSUcOCZpp3vs';
const APPID = 'cf8902612547e80681cfff851403b585';


const bot = new TelegramBot(TOKEN, { polling: true });


bot.onText(/\/start/, (msg, match) => {
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

function currentWeatherMessage(data, geoName) {
    return `Погода в <b>${geoName}</b>: ${data.weather[0].description}
Температура: <b>${data.main.temp} °C</b>
Відчувається як: <b>${data.main.feels_like} °C</b>
🌡️Макс. температура: <b>${data.main.temp_max} °C</b>
🌡️Мін. температура: <b>${data.main.temp_min} °C</b>
💦Вологість: <b>${data.main.humidity} %</b>
💨Вітер:  <b>${data.wind.speed} м/с</b>
Тиск: <b>${data.main.pressure} мм.рт.ст</b>
☀️Схід сонця: <b>${new Date(data.sys.sunrise * 1000).toLocaleTimeString('uk-UA')}</b>
🌄Захід сонця: <b>${new Date(data.sys.sunset * 1000).toLocaleTimeString('uk-UA')}</b>`;
}

function nextDayWeatherMessage(data, geoName) {
    return `Погода завтра в <b>${geoName}</b>: ${data.weather[0].description}
Температура: <b>${data.temp.day} °C</b>
Відчувається як: <b>${data.feels_like.day} °C</b>
🌡️Макс. температура: <b>${data.temp.max} °C</b>
🌡️Мін. температура: <b>${data.temp.min} °C</b>
💦Вологість: <b>${data.humidity} %</b>
💨Вітер:  <b>${data.wind_speed} м/с</b>
Тиск: <b>${data.pressure} мм.рт.ст</b>
🌧️Ймовірність опадів: <b>${data.pop} %</b>
☀️Схід сонця: <b>${new Date(data.sunrise * 1000).toLocaleTimeString('uk-UA')}</b>
🌄Захід сонця: <b>${new Date(data.sunset * 1000).toLocaleTimeString('uk-UA')}</b>
`;
}

function weekWeatherMessage(data, geoName) {
    let dateOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric'
    };
    let message = `Погода на тиждень в <b>${geoName}</b>:
`;
    data.forEach((day, index) => {
        message += `<b>${new Date(day.dt * 1000).toLocaleDateString('uk-UA', dateOptions)}</b> - ${icons[day.weather[0].icon]} <b>${day.weather[0].description}</b>
🌡️Температура: <b>${day.temp.day} °C</b>
Макс. <b>${day.temp.max} °C </b> Мін. <b>${day.temp.min} °C</b>

`;
    });
    return message;
}

const weatherIcon = (icon) => `http://openweathermap.org/img/wn/${icon}@4x.png`;

const geo = async (name) => {
    let resp = await axios
        .get(`http://api.openweathermap.org/geo/1.0/direct?q=${name}&limit=1&lang=uk&appid=${APPID}`)
    return resp.data[0];
};

async function reverseGeo(lat, lon) {
    let resp = await axios
        .get(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&lang=uk&appid=${APPID}`)
    return resp.data[0];
}

async function getWeatherData(lat, lon) {
    let resp = await axios
        .get(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=uk&exclude=minutely,hourly&appid=${APPID}`)
    return resp;
}

async function getWeatherCurent(lat, lon) {
    let resp = await axios
        .get(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=uk&appid=${APPID}`)
    return resp;
}
