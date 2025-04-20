import moment from "moment";
import cron from "node-cron";
import { CronSchedule } from "../enum/cron";
import { FileUtils } from "../utils/file.utils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";
import { ServerStateUtils } from "../utils/server-state-utils";

const SELECTED_CRON_SCHEDULE_TIME = CronSchedule.EVERY_DAY;

/**
 * Busca el nombre (clave) de un horario cron dado su valor (la cadena cron).
 * Asume que CronSchedule es un objeto donde las claves son los nombres y los valores son las cadenas cron.
 * @param cronValue La cadena de expresión cron (ej. '0 0 * * *').
 * @returns El nombre legible del horario (ej. 'EVERY_DAY') si se encuentra,
 * o la cadena cron original si no se encuentra una coincidencia (aunque no debería pasar si cronValue viene de CronSchedule).
 */
function getCronScheduleName(cronValue: string): string {
  // Itera sobre las claves (nombres) del objeto CronSchedule
  const foundKey = Object.keys(CronSchedule).find(
    (key) =>
      // Compara el valor asociado a cada clave con el cronValue buscado
      CronSchedule[key as keyof typeof CronSchedule] === cronValue
  );

  // Retorna la clave encontrada (el nombre legible), o el valor original si no se encuentra (como fallback).
  return foundKey || cronValue;
}

const job = cron.schedule(
  SELECTED_CRON_SCHEDULE_TIME,
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
  const humanReadableScheduleName = getCronScheduleName(
    SELECTED_CRON_SCHEDULE_TIME
  );
  Logger.warn(
    `Iniciando trabajo cron. Horario: "${humanReadableScheduleName}" (Cron: "${SELECTED_CRON_SCHEDULE_TIME}")`
  );
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
