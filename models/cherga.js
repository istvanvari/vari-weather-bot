const mongoose = require("mongoose");

const chergaSchema = new mongoose.Schema({
  cherga: { type: Number, min: 1, max: 6, required: true },
  subCherga: { type: Number, min: 1, max: 2, required: true },
  hours: [
    {
      start: { hours: Number, minutes: Number },
      end: { hours: Number, minutes: Number },
    },
  ],
});

module.exports = mongoose.model("Cherga", chergaSchema);
