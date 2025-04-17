import { MainCronJob } from "../cron/main-cron-job";
import { RpcNodeUtils } from "../utils/rpc-node-utils";

export const initScripts = async () => {
  RpcNodeUtils.setFastestNode(await RpcNodeUtils.getFastestNode("l2"));
  MainCronJob.startJob();
};
