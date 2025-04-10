import { CronJob } from "cron";
import moment from "moment";
import { ControlVarsUtils } from "../utils/control-vars";
import { FileUtils } from "../utils/file.utils";
import { JsonUtils } from "../utils/jsonUtils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";

const job = new CronJob("0 0 * * *", async () => {
  //"* * * * *" each minute
  //"0 0 * * *" each 24h at midnight.
  //Note: snapshots_24h_days_taken will always match the # of json files within a tokenPair folder

  Logger.info("CRON Running each 24h -  testing: IP");
  LiquidityPoolUtils.fetchPoolData()
    .then((liquidityPoolList) => {
      if (liquidityPoolList) {
        for (let i = 0; i < liquidityPoolList.length; i++) {
          const element = liquidityPoolList[i];
          const currentTimestampInSeconds = moment().unix();
          const isoDate = moment(
            currentTimestampInSeconds * 1000
          ).toISOString();
          FileUtils.writeDataToFile(
            `ts_${currentTimestampInSeconds}.json`,
            element.tokenPair,
            { ...element, isoDate }
          );
        }

        JsonUtils.readJsonFile("/reference-data/server-data.json") //inc day count
          .then((v) => {
            if (v && v.snapshots_24h_days_taken) {
              let count = v.snapshots_24h_days_taken;
              count++;
              JsonUtils.writeJsonFile("/reference-data/server-data.json", {
                ...v,
                snapshots_24h_days_taken: count,
              });
            }
          })
          .catch((e) =>
            Logger.error(`Error reading Json file server data! ${e.message}`)
          );

        Logger.info(`Saved ${liquidityPoolList.length} records YAY!`);
      } else {
        Logger.error("No Pools Fetched! Please Check!");
      }
    })
    .catch((e) => {
      Logger.error(`Error fecthing Liquidity Pools code: ${e.code} `);
    });
  Logger.info(
    `Days Counted: ${ControlVarsUtils.SERVERCOUNT.daysCount.toString()}`
  );
});

const startJob = () => job.start();

const stopJob = () => job.stop();

const getLastDate = () => job.lastDate();

const getLastExecution = () => job.lastDate();

const getNextDate = () => job.nextDate();

export const MainCronJob = {
  startJob,
  stopJob,
  getNextDate,
};
