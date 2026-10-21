const mongoose = require("mongoose");
module.exports = mongoose.model(
  "User",
  new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      trim: true,
    },
    favoriteGenre: { type: String, required: true, trim: true },
  }),
);
