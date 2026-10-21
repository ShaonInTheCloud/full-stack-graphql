const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Author",
  new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      minlength: 4,
      trim: true,
    },
    born: Number,
  }),
);
