/**
 * Sequelize CLI config shim.
 *
 * This file exists ONLY because sequelize-cli expects a `.js`/`.json` config.
 * The actual configuration lives in `./database.config.ts` (single source of
 * truth, shared with the NestJS DatabaseModule).
 *
 * Loading order:
 *   1. `.sequelizerc` registers ts-node and dotenv.
 *   2. sequelize-cli then requires THIS file.
 *   3. We require the .ts module (handled by ts-node) and re-export the
 *      `{ development, test, production }` shape sequelize-cli wants.
 *
 * If invoked outside sequelize-cli (e.g. by tooling that loads this file
 * directly), we defensively register ts-node and dotenv ourselves.
 */

const path = require('path');

require('dotenv').config();

try {
  require('ts-node').register({
    project: path.resolve(__dirname, '..', '..', 'tsconfig.cli.json'),
    transpileOnly: true,
  });
} catch (err) {
  // ts-node is already registered or not installed in this context; ignore.
}

const { getCliConfig } = require('./database.config');

module.exports = getCliConfig();
