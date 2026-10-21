const mongoose = require("mongoose");
const Author = require("./models/author"),
  Book = require("./models/book");
const seed = require("./seed-data");
async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
  await mongoose.connect(process.env.MONGODB_URI);
  if ((await Book.countDocuments()) || (await Author.countDocuments()))
    throw new Error("Seed only an empty development database");
  for (const a of seed.authors)
    await Author.create({ name: a.name, born: a.born });
  for (const b of seed.books) {
    const a = await Author.findOne({ name: b.author });
    await Book.create({
      title: b.title,
      published: b.published,
      author: a._id,
      genres: b.genres,
    });
  }
  await mongoose.disconnect();
}
run().catch(async (e) => {
  console.error(e.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
