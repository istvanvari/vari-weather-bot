const User = require("../models/user");

module.exports.getAllUsers = async () => {
  try {
    return await User.find().exec();
  } catch (err) {
    console.log(err);
  }
};

module.exports.getUserById = async (id) => {
  try {
    return await User.findById(id).exec();
  } catch (err) {
    console.log(err);
  }
};

module.exports.createUser = async (user) => {
  try {
    return await User.create(user);
  } catch (err) {
    console.log(err);
  }
};

module.exports.createOrUpdateUser = async (chatId, userData) => {
  try {
    const user = await User.findOneAndUpdate(
      { chatId: chatId },
      { $set: userData },
      { new: true, upsert: true } // Create if not found, return updated document
    );
  } catch (error) {
    console.error("Error creating or updating user:", error);
  }
};

module.exports.updateUser = async (id, user) => {
  try {
    return await User.findByIdAndUpdate(id, user, { new: true });
  } catch (err) {
    console.log(err);
  }
};

module.exports.deleteUser = async (id) => {
  try {
    return await User.findByIdAndRemove(id);
  } catch (err) {
    console.log(err);
  }
};

module.exports.checkNotificationsEnabled = async (chatId) => {
  try {
    const user = await User.findOne({ chatId });
    return user ? user.notification : false;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports.toggleNotifications = async (chatId) => {
  try {
    const user = await User.findOne({ chatId });
    if (user) {
      user.notification = !user.notification;
      await user.save();
      return user.notification;
    }
    return false;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports.userExists = async (chatId) => {
  try {
    const user = await User.findOne({ chatId });
    return user ? true : false;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports.getUsersWithNotifications = async (chergaNumber) => {
  try {
    return await User.find({ notification: true, cherga: chergaNumber }).exec();
  } catch (err) {
    console.log(err);
  }
};
