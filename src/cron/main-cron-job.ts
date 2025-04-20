import moment from "moment";
import cron from "node-cron";
import { CronSchedule } from "../enum/cron";
import { FileUtils } from "../utils/file.utils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";
import { ServerStateUtils } from "../utils/server-state-utils";

const job = cron.schedule(
  CronSchedule.EVERY_MINUTE,
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

        const updatedServerData =
          await ServerStateUtils.tryIncrementServerDataDaysTaken();
        Logger.info(
          `¡Guardados ${liquidityPoolList.length} registros!. Days:${updatedServerData.snapshots_24h_days_taken}`
        );
      } else {
        Logger.error("¡No se recuperaron pools! Por favor, verifica.");
      }
    } catch (error: any) {
      Logger.error(`Error al obtener los pools de liquidez: ${error.code}`);
    }
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
