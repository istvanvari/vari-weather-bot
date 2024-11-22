const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  chatId: { type: Number, required: true },
  city: { type: String, required: true },
  street: { type: String, required: true },
  houseNumber: { type: String, required: true },
  cherga: { type: Number, required: true },
  notification: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("User", userSchema);
