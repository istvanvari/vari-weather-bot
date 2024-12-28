const mongoose = require("mongoose");

const chergaItemSchema = new mongoose.Schema({
  cherga: Number,
  subCherga: Number,
  city: String,
  street: String,
  houseNumbers: [String],
});

module.exports = mongoose.model("ChergaItem", chergaItemSchema);
