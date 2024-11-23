const mongoose = require("mongoose");

const chergaSchema = new mongoose.Schema({
  cherga: { type: Number, min: 1, max: 6, required: true },
  hours: { type: [Boolean], length: 24, required: true },
});

module.exports = mongoose.model("Cherga", chergaSchema);
