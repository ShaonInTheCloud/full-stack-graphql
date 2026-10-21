const {
  test,
  expect,
} = require("../tests-chapter5/node_modules/@playwright/test");
const {
  seedDatabase,
  loginWith,
  createBook,
} = require("../tests-chapter5/tests/helper");
test("a second client receives new books and preserves its genre filter", async ({
  browser,
  page,
  request,
}) => {
  await seedDatabase(request);
  await page.goto("/");
  await loginWith(page, "testuser", "secret");
  await expect(page.getByRole("button", { name: "logout" })).toBeVisible();
  const context = await browser.newContext();
  const reader = await context.newPage();
  try {
    await reader.goto("http://localhost:5173");
    await reader.getByRole("button", { name: "books", exact: true }).click();
    await reader.getByRole("button", { name: "classic", exact: true }).click();
    await expect(
      reader.getByText("Crime and punishment", { exact: true }),
    ).toBeVisible();
    await createBook(page, {
      title: "A New Classic",
      author: "Another Author",
      published: 2026,
      genres: ["classic"],
    });
    await expect(reader.getByRole("status")).toContainText("A New Classic");
    await expect(reader.locator("tbody")).toContainText("A New Classic");
    await expect(reader.locator("tbody")).not.toContainText("Clean Code");
    await reader.getByRole("button", { name: "authors", exact: true }).click();
    await expect(
      reader.locator("tr").filter({ hasText: "Another Author" }),
    ).toContainText("1");
    await reader.getByRole("button", { name: "books", exact: true }).click();
    await expect(reader.locator("tbody")).toContainText("A New Classic");
  } finally {
    await context.close();
  }
});
