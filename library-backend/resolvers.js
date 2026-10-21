const { GraphQLError } = require("graphql");
const jwt = require("jsonwebtoken");
const Author = require("./models/author"),
  Book = require("./models/book"),
  User = require("./models/user");
const pubsub = require("./pubsub");
const bad = (message) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
const authenticated = (context) => {
  if (!context?.currentUser)
    throw new GraphQLError("Not authenticated", {
      extensions: { code: "UNAUTHENTICATED" },
    });
};
const validation = (error) => {
  if (error.code === 11000)
    throw bad("This title, author name or username already exists.");
  if (error.name === "ValidationError")
    throw bad(
      Object.values(error.errors)
        .map((e) => e.message)
        .join("; "),
    );
  throw error;
};
// One aggregation for all authors, independent of the number of rows.
const counts = async () =>
  new Map(
    (
      await Book.aggregate([{ $group: { _id: "$author", count: { $sum: 1 } } }])
    ).map((r) => [String(r._id), r.count]),
  );
const resolvers = {
  Query: {
    bookCount: () => Book.countDocuments({}).exec(),
    authorCount: () => Author.countDocuments({}).exec(),
    me: (_r, _a, c) => c?.currentUser || null,
    allBooks: async (_r, { author, genre }) => {
      const filter = {};
      if (genre) filter.genres = genre;
      if (author) {
        const found = await Author.findOne({ name: author });
        if (!found) return [];
        filter.author = found._id;
      }
      return Book.find(filter).populate("author");
    },
    allAuthors: async () => {
      const [authors, totals] = await Promise.all([
        Author.find({}).lean(),
        counts(),
      ]);
      return authors.map((a) => ({
        ...a,
        id: String(a._id),
        bookCount: totals.get(String(a._id)) || 0,
      }));
    },
  },
  Author: {
    id: (a) => String(a.id || a._id),
    bookCount: async (a, _args, context) => {
      if (a.bookCount !== undefined) return a.bookCount;
      if (context) {
        context.authorCounts ??= counts();
        return (await context.authorCounts).get(String(a._id || a.id)) || 0;
      }
      return (await counts()).get(String(a._id || a.id)) || 0;
    },
  },
  Book: {
    id: (b) => String(b.id || b._id),
    author: (b) =>
      b.author?.name ? b.author : Author.findById(b.author).exec(),
  },
  User: { id: (u) => String(u.id || u._id) },
  Mutation: {
    createUser: async (_r, args) => {
      try {
        await User.init();
        return await new User(args).save();
      } catch (e) {
        validation(e);
      }
    },
    login: async (_r, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user || password !== (process.env.COURSE_PASSWORD || "secret"))
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");
      return {
        value: jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: "8h" },
        ),
      };
    },
    addBook: async (_r, args, context) => {
      authenticated(context);
      try {
        const title = args.title.trim(),
          name = args.author.trim();
        if (title.length < 5)
          throw bad("Book title must contain at least 5 characters");
        if (name.length < 4)
          throw bad("Author name must contain at least 4 characters");
        await Promise.all([Book.init(), Author.init()]);
        if (await Book.exists({ title }))
          throw bad("A book with this title already exists");
        let author = await Author.findOne({ name });
        if (!author) {
          try {
            author = await new Author({ name }).save();
          } catch (e) {
            if (e.code !== 11000) throw e;
            author = await Author.findOne({ name });
          }
        }
        const book = await new Book({
          ...args,
          title,
          author: author._id,
          genres: [
            ...new Set(args.genres.map((g) => g.trim()).filter(Boolean)),
          ],
        }).save();
        await book.populate("author");
        await pubsub.publish("BOOK_ADDED", { bookAdded: book });
        return book;
      } catch (e) {
        validation(e);
      }
    },
    editAuthor: async (_r, { name, setBornTo }, context) => {
      authenticated(context);
      try {
        return await Author.findOneAndUpdate(
          { name },
          { born: setBornTo },
          { new: true, runValidators: true },
        );
      } catch (e) {
        validation(e);
      }
    },
    ...(process.env.NODE_ENV === "test"
      ? {
          _resetDatabase: async () => {
            await Book.deleteMany({});
            await Author.deleteMany({});
            await User.deleteMany({});
            return true;
          },
        }
      : {}),
  },
  Subscription: {
    bookAdded: { subscribe: () => pubsub.asyncIterableIterator("BOOK_ADDED") },
  },
};
module.exports = resolvers;
