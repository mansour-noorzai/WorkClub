const { createApp } = require("../backend/dist/app");
const { connectDatabase } = require("../backend/dist/config/database");

let app = createApp();
let dbReady = null;

async function ensureDatabase() {
  if (!dbReady) {
    dbReady = connectDatabase().then(() => undefined);
  }
  return dbReady;
}

module.exports = async function handler(req, res) {
  await ensureDatabase();
  return app(req, res);
};
