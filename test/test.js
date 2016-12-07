const mocha = require("mocha");
const adapter = require("./adapter.js");

describe("Promise/A+ Tests", () => {
  require("promises-aplus-tests").mocha(adapter);
});
