import { MainCronJob } from "../cron/main-cron-job";
import { RpcNodeUtils } from "../utils/rpc-node-utils";

//TODO important:
//  - set the cronJob as an instance so you can declare it as it own module and:
//    - get next job time.
//    - get time until next job.
//  refer to: https://stackoverflow.com/questions/60828411/node-js-get-time-till-next-cron-job

export const initScripts = async () => {
  RpcNodeUtils.setFastestNode(await RpcNodeUtils.getFastestNode("l2"));
  MainCronJob.startJob();
};
