"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainCronJob = void 0;
const moment_1 = __importDefault(require("moment"));
const node_cron_1 = __importDefault(require("node-cron"));
const control_vars_1 = require("../utils/control-vars");
const file_utils_1 = require("../utils/file.utils");
const jsonUtils_1 = require("../utils/jsonUtils");
const liquidity_pool_utils_1 = require("../utils/liquidity-pool.utils");
const logger_utils_1 = require("../utils/logger.utils");
const job = node_cron_1.default.schedule("0 0 * * *", async () => {
    logger_utils_1.Logger.info("CRON ejecutándose cada 24h - probando: IP");
    try {
        const liquidityPoolList = await liquidity_pool_utils_1.LiquidityPoolUtils.fetchPoolData();
        if (liquidityPoolList && liquidityPoolList.length > 0) {
            for (const element of liquidityPoolList) {
                const currentTimestampInSeconds = (0, moment_1.default)().unix();
                const isoDate = (0, moment_1.default)(currentTimestampInSeconds * 1000).toISOString();
                await file_utils_1.FileUtils.writeDataToFile(`ts_${currentTimestampInSeconds}.json`, element.tokenPair, { ...element, isoDate });
            }
            try {
                const serverData = await jsonUtils_1.JsonUtils.readJsonFile("/reference-data/server-data.json");
                if (serverData && serverData.snapshots_24h_days_taken !== undefined) {
                    serverData.snapshots_24h_days_taken += 1;
                    await jsonUtils_1.JsonUtils.writeJsonFile("/reference-data/server-data.json", serverData);
                }
            }
            catch (error) {
                logger_utils_1.Logger.error(`Error al leer el archivo JSON de datos del servidor: ${error.message}`);
            }
            logger_utils_1.Logger.info(`¡Guardados ${liquidityPoolList.length} registros!`);
        }
        else {
            logger_utils_1.Logger.error("¡No se recuperaron pools! Por favor, verifica.");
        }
    }
    catch (error) {
        logger_utils_1.Logger.error(`Error al obtener los pools de liquidez: ${error.code}`);
    }
    logger_utils_1.Logger.info(`Días contados: ${control_vars_1.ControlVarsUtils.SERVERCOUNT.daysCount.toString()}`);
}, {
    scheduled: false,
});
const startJob = () => job.start();
const stopJob = () => job.stop();
const getNextDate = () => {
    // TODO bellow using cron-parser
    // node-cron no proporciona directamente la próxima fecha de ejecución
    // Se puede calcular manualmente si es necesario
    logger_utils_1.Logger.warn("node-cron no soporta obtener la próxima fecha de ejecución directamente.");
    return null;
};
exports.MainCronJob = {
    startJob,
    stopJob,
    getNextDate,
};
