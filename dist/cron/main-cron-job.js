"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainCronJob = void 0;
const cron_1 = require("cron");
const moment_1 = __importDefault(require("moment"));
const control_vars_1 = require("../utils/control-vars");
const file_utils_1 = require("../utils/file.utils");
const liquidity_pool_utils_1 = require("../utils/liquidity-pool.utils");
const logger_utils_1 = require("../utils/logger.utils");
const job = new cron_1.CronJob("* * * * *", async () => {
    //"* * * * *" each minute
    //"0 0 * * *" each 24h at midnight.
    //TODO important change to 24h, testing 1 minute timeframe
    logger_utils_1.Logger.info("CRON Running each minute! testing: IP");
    control_vars_1.ControlVarsUtils.addDay();
    liquidity_pool_utils_1.LiquidityPoolUtils.fetchPoolData()
        .then((liquidityPoolList) => {
        if (liquidityPoolList) {
            for (let i = 0; i < liquidityPoolList.length; i++) {
                const element = liquidityPoolList[i];
                const currentTimestampInSeconds = (0, moment_1.default)().unix();
                const isoDate = (0, moment_1.default)(currentTimestampInSeconds * 1000).toISOString();
                file_utils_1.FileUtils.writeDataToFile(`ts_${currentTimestampInSeconds}.json`, element.tokenPair, { ...element, isoDate });
            }
            logger_utils_1.Logger.info(`Saved ${liquidityPoolList.length} records YAY!`);
        }
        else {
            logger_utils_1.Logger.error("No Pools Fetched! Please Check!");
        }
    })
        .catch((e) => {
        logger_utils_1.Logger.error(`Error fecthing Liquidity Pools code: ${e.code} `);
    });
    logger_utils_1.Logger.info(`Days Counted: ${control_vars_1.ControlVarsUtils.SERVERCOUNT.daysCount.toString()}`);
});
const startJob = () => job.start();
const stopJob = () => job.stop();
const getLastDate = () => job.lastDate();
const getLastExecution = () => job.lastDate();
const getNextDate = () => job.nextDate();
exports.MainCronJob = {
    startJob,
    stopJob,
    getNextDate,
};
