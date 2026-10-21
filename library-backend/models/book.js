const mongoose = require("mongoose");
module.exports = mongoose.model(
  "Book",
  new mongoose.Schema({
    title: {
      type: String,
      required: true,
      unique: true,
      minlength: 5,
      trim: true,
    },
    published: { type: Number, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },
    genres: [{ type: String, trim: true }],
  }),
);
