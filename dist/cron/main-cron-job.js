"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainCronJob = void 0;
const moment_1 = __importDefault(require("moment"));
const node_cron_1 = __importDefault(require("node-cron"));
const cron_1 = require("../enum/cron");
const file_utils_1 = require("../utils/file.utils");
const liquidity_pool_utils_1 = require("../utils/liquidity-pool.utils");
const logger_utils_1 = require("../utils/logger.utils");
const server_state_utils_1 = require("../utils/server-state-utils");
const job = node_cron_1.default.schedule(cron_1.CronSchedule.EVERY_MINUTE, async () => {
    logger_utils_1.Logger.info("CRON ejecutándose cada 24h - probando: IP");
    try {
        const liquidityPoolList = await liquidity_pool_utils_1.LiquidityPoolUtils.fetchPoolData();
        if (liquidityPoolList && liquidityPoolList.length > 0) {
            for (const element of liquidityPoolList) {
                const currentTimestampInSeconds = (0, moment_1.default)().unix();
                const isoDate = (0, moment_1.default)(currentTimestampInSeconds * 1000).toISOString();
                await file_utils_1.FileUtils.writeDataToFile(`ts_${currentTimestampInSeconds}.json`, element.tokenPair, { ...element, isoDate });
            }
            const updatedServerData = await server_state_utils_1.ServerStateUtils.tryIncrementServerDataDaysTaken();
            logger_utils_1.Logger.info(`¡Guardados ${liquidityPoolList.length} registros!. Days:${updatedServerData.snapshots_24h_days_taken}`);
        }
        else {
            logger_utils_1.Logger.error("¡No se recuperaron pools! Por favor, verifica.");
        }
    }
    catch (error) {
        logger_utils_1.Logger.error(`Error al obtener los pools de liquidez: ${error.code}`);
    }
}, {
    scheduled: false,
});
const startJob = () => {
    job.start();
};
const stopJob = () => job.stop();
const getNextDate = () => {
    logger_utils_1.Logger.warn("node-cron no soporta obtener la próxima fecha de ejecución directamente.");
    return null;
};
exports.MainCronJob = {
    startJob,
    stopJob,
    getNextDate,
};
