"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScripts = void 0;
const moment_1 = __importDefault(require("moment"));
const node_cron_1 = __importDefault(require("node-cron"));
const file_utils_1 = require("../utils/file.utils");
const liquidity_pool_utils_1 = require("../utils/liquidity-pool.utils");
const logger_utils_1 = require("../utils/logger.utils");
const initScripts = () => {
    // Schedule the task to run daily at a specific time, e.g., midnight
    node_cron_1.default.schedule("* * * * *", () => {
        logger_utils_1.Logger.info("CRON Running each minute! for testing!! //TODO change to 24h");
        liquidity_pool_utils_1.LiquidityPoolUtils.fetchPoolData()
            .then((liquidityPoolList) => {
            if (liquidityPoolList) {
                for (let i = 0; i < liquidityPoolList.length; i++) {
                    const element = liquidityPoolList[i];
                    const currentTimestampInSeconds = (0, moment_1.default)().unix();
                    file_utils_1.FileUtils.writeDataToFile(`ts_${currentTimestampInSeconds}.json`, element.tokenPair, element);
                }
                logger_utils_1.Logger.info(`Saved ${liquidityPoolList.length} records!`);
            }
            else {
                logger_utils_1.Logger.error("No Pools Fetched! Please Check!");
            }
        })
            .catch((e) => {
            logger_utils_1.Logger.error(`Error fecthing Liquidity Pools code: ${e.code} `);
        });
    }
    // {
    //   runOnInit: true,
    // }
    );
    // console.log("Cron job scheduled to fetch liquidity data daily.");
};
exports.initScripts = initScripts;
