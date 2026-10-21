const base = require("../tests-chapter5/playwright.config");
const path = require("node:path");
module.exports = {
  ...base,
  testDir: __dirname,
  reporter: "list",
  webServer: base.webServer.map((s) => ({
    ...s,
    cwd: path.resolve(__dirname, "../tests-chapter5", s.cwd || "."),
  })),
};
