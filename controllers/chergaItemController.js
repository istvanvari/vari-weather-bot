const ChergaItem = require("../models/chergaItem.js");
const { sortLocale, sortNumericStrings } = require("../util");

module.exports.createChergaItem = async (data) => {
  try {
    return await ChergaItem.create(data);
  } catch (err) {
    console.log(err);
  }
};

module.exports.createAllChergaItems = async (data, chergaNumbers) => {
  try {
    data = data.map((item) => ({
      cherga: chergaNumbers[0],
      subCherga: chergaNumbers[1],
      city: item[0],
      street: item[1],
      houseNumbers: sortNumericStrings(item[2]),
    }));
    return await ChergaItem.insertMany(data);
  } catch (err) {
    console.log(err);
  }
};

module.exports.deleteAllChergaItems = async () => {
  try {
    return await ChergaItem.deleteMany({}).then(
      (result) => result.deletedCount
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports.getAllCityNames = async () => {
  try {
    return await ChergaItem.distinct("city");
  } catch (err) {
    console.log(err);
  }
};

module.exports.getAllCityStartingLetters = async () => {
  try {
    const cities = await ChergaItem.distinct("city");
    let startingLetters = cities.map((city) => city.charAt(0).toUpperCase());
    startingLetters = [...new Set(startingLetters)];
    return sortLocale(startingLetters);
  } catch (err) {
    console.log(err);
  }
};

module.exports.getCityStartsWith = async (letter) => {
  try {
    const items = await ChergaItem.find({
      city: new RegExp(`^${letter}`, "i"),
    });
    const cityNames = items.map((item) => item.city); // Extract city names
    const uniqueCityNames = [...new Set(cityNames)]; // Remove duplicates
    return uniqueCityNames;
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports.getStreets = async (cityName) => {
  try {
    const items = await ChergaItem.find({ city: cityName });
    const streets = items.map((item) => {
      return { street: item.street, houseNumbers: item.houseNumbers };
    });
    // Remove duplicates
    let uniqueStreets = [
      ...new Map(streets.map((street) => [street.street, street])).values(),
    ];
    //remove { street: '', houseNumbers: [] },
    // uniqueStreets = uniqueStreets.filter(
    //   (street) => street.street !== "" && street.houseNumbers.length > 0
    // );
    return sortLocale(uniqueStreets);
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports.findCherga = async (city, street, houseNumber) => {
  try {
    if (street === "інші номери будинків") street = "";
    const chergaItem = await ChergaItem.findOne({
      city,
      street,
      houseNumbers: { $in: [houseNumber] },
    });
    return [chergaItem.cherga, chergaItem.subCherga];
  } catch (err) {
    console.log(err);
  }
};
