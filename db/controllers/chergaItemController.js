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
