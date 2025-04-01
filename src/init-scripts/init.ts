import moment from "moment";
import cron from "node-cron";
import { FileUtils } from "../utils/file.utils";
import { LiquidityPoolUtils } from "../utils/liquidity-pool.utils";

export const initScripts = () => {
  // Schedule the task to run daily at a specific time, e.g., midnight
  cron.schedule(
    "* * * * *",
    () => {
      console.log("CRON Running each minute!");
      LiquidityPoolUtils.fetchPoolData()
        .then((liquidityPoolList) => {
          if (liquidityPoolList) {
            for (let i = 0; i < 3; i++) {
              const element = liquidityPoolList[i];
              const currentTimestampInSeconds = moment().unix();
              FileUtils.writeDataToFile(
                `ts_${currentTimestampInSeconds}.json`,
                element.tokenPair,
                element
              );
            }
          } else {
            console.log("No Pools Fetched! Please Check!");
          }
        })
        .catch((e) => console.log("Error fecthing Liquidity Pools ", { e }));
    }
    // {
    //   runOnInit: true,
    // }
  );

  console.log("Cron job scheduled to fetch liquidity data daily.");
};
