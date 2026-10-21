const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("../library-backend/node_modules/mongoose");
const {
  setupDatabase,
  teardownDatabase,
  seedDatabase,
  createServer,
  Author,
} = require("../tests-chapter4/test_helper");
let server;
before(async () => {
  await setupDatabase();
  await seedDatabase();
  server = createServer();
  await server.start();
});
after(async () => {
  mongoose.set("debug", false);
  await server?.stop();
  await teardownDatabase();
});
test("author counts stay correct without one database query per author", async () => {
  await Author.insertMany(
    Array.from({ length: 30 }, (_, n) => ({ name: `Additional Author ${n}` })),
  );
  const operations = [];
  mongoose.set("debug", (collection, method) =>
    operations.push(`${collection}.${method}`),
  );
  const result = await server.executeOperation({
    query: "{ allAuthors { name bookCount } }",
  });
  mongoose.set("debug", false);
  assert.equal(result.body.singleResult.errors, undefined);
  const authors = result.body.singleResult.data.allAuthors;
  assert.equal(authors.find((a) => a.name === "Robert Martin").bookCount, 2);
  assert.equal(
    authors.find((a) => a.name === "Additional Author 29").bookCount,
    0,
  );
  assert.equal(authors.length, 34);
  assert.ok(
    operations.length <= 3,
    `Expected bounded queries, got ${operations.join(", ")}`,
  );
});
