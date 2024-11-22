const ChergaItem = require("../models/chergaItem");

module.exports.createChergaItem = async (data) => {
  try {
    return await ChergaItem.create(data);
  } catch (err) {
    console.log(err);
  }
};

module.exports.createAllChergaItems = async (data, chergaNumber) => {
  try {
    data = data.map((item) => ({
      cherga: chergaNumber,
      city: item[0],
      street: item[1],
      houseNumbers: item[2],
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
    return startingLetters.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
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
    const uniqueStreets = [
      ...new Map(streets.map((street) => [street.street, street])).values(),
    ];
    //sort streets
    uniqueStreets.sort((a, b) =>
      a.street.localeCompare(b.street, undefined, { sensitivity: "base" })
    );
    return uniqueStreets; // Return unique streets
  } catch (err) {
    console.error(err);
    return [];
  }
};

module.exports.findCherga = async (city, street, houseNumber) => {
  try {
    const chergaItem = await ChergaItem.findOne({
      city,
      street,
      houseNumbers: { $in: [houseNumber] },
    });
    return chergaItem.cherga;
  } catch (err) {
    console.log(err);
  }
};
