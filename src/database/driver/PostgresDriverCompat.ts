// Re-export PostgresDriver since quick.db doesn't include it in its main exports map
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PostgresDriver } = require("quick.db/out/drivers/PostgresDriver.js");
export { PostgresDriver };
