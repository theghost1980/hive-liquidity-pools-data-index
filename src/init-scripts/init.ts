import moment from "moment";
import cron from "node-cron";
import { FileUtils } from "../utils/file.utils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";

export const initScripts = () => {
  // Schedule the task to run daily at a specific time, e.g., midnight
  cron.schedule(
    "* * * * *",
    () => {
      Logger.info(
        "CRON Running each minute! for testing!! //TODO change to 24h"
      );
      LiquidityPoolUtils.fetchPoolData()
        .then((liquidityPoolList) => {
          if (liquidityPoolList) {
            for (let i = 0; i < liquidityPoolList.length; i++) {
              const element = liquidityPoolList[i];
              const currentTimestampInSeconds = moment().unix();
              FileUtils.writeDataToFile(
                `ts_${currentTimestampInSeconds}.json`,
                element.tokenPair,
                element
              );
            }
            Logger.info(`Saved ${liquidityPoolList.length} records YAY!`);
          } else {
            Logger.error("No Pools Fetched! Please Check!");
          }
        })
        .catch((e) => {
          Logger.error(`Error fecthing Liquidity Pools code: ${e.code} `);
        });
    }
    // {
    //   runOnInit: true,
    // }
  );

  // console.log("Cron job scheduled to fetch liquidity data daily.");
};
