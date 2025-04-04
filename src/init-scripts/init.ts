import moment from "moment";
import cron from "node-cron";
import { ControlVarsUtils } from "../utils/control-vars";
import { FileUtils } from "../utils/file.utils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";
import { Logger } from "../utils/logger.utils";

export const initScripts = () => {
  //"* * * * *" each minute
  //"0 0 * * *" each 24h at midnight.
  cron.schedule(
    "0 0 * * *",
    () => {
      Logger.info("CRON Running each 24h! testing: IP");
      //count days since last starting point
      ControlVarsUtils.addDay();
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
    }
    // {
    //   runOnInit: true,
    // }
  );
};
