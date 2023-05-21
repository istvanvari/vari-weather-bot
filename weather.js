const { APPID } = require('./constants');
const axios = require('axios');
const icons = require('./icons.json');


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

module.exports = {
    currentWeatherMessage,
    nextDayWeatherMessage,
    weekWeatherMessage,
    weatherIcon,
    geo,
    reverseGeo,
    getWeatherData,
    getWeatherCurent,
};