import moment from "moment";
import cron from "node-cron";
import { CronSchedule } from "../enum/cron";
import { ControlVarsUtils } from "../utils/control-vars";
import { FileUtils } from "../utils/file.utils";
import { JsonUtils } from "../utils/jsonUtils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";

const job = cron.schedule(
  CronSchedule.EVERY_DAY,
  async () => {
    Logger.info("CRON ejecutándose cada 24h - probando: IP");

    try {
      const liquidityPoolList = await LiquidityPoolUtils.fetchPoolData();

      if (liquidityPoolList && liquidityPoolList.length > 0) {
        for (const element of liquidityPoolList) {
          const currentTimestampInSeconds = moment().unix();
          const isoDate = moment(
            currentTimestampInSeconds * 1000
          ).toISOString();
          await FileUtils.writeDataToFile(
            `ts_${currentTimestampInSeconds}.json`,
            element.tokenPair,
            { ...element, isoDate }
          );
        }

        try {
          const serverData = await JsonUtils.readJsonFile(
            "/public/server-data.json"
          );
          if (serverData && serverData.snapshots_24h_days_taken !== undefined) {
            serverData.snapshots_24h_days_taken += 1;
            await JsonUtils.writeJsonFile(
              "/public/server-data.json",
              serverData
            );
          }
        } catch (error: any) {
          Logger.error(
            `Error al leer el archivo JSON de datos del servidor: ${error.message}`
          );
        }

        Logger.info(`¡Guardados ${liquidityPoolList.length} registros!`);
      } else {
        Logger.error("¡No se recuperaron pools! Por favor, verifica.");
      }
    } catch (error: any) {
      Logger.error(`Error al obtener los pools de liquidez: ${error.code}`);
    }

    Logger.info(
      `Días contados: ${ControlVarsUtils.SERVERCOUNT.daysCount.toString()}`
    );
  },
  {
    scheduled: false,
  }
);

const startJob = () => {
  job.start();
};
const stopJob = () => job.stop();
const getNextDate = () => {
  Logger.warn(
    "node-cron no soporta obtener la próxima fecha de ejecución directamente."
  );
  return null;
};

export const MainCronJob = {
  startJob,
  stopJob,
  getNextDate,
};
