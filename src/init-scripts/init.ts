import { MainCronJob } from "../cron/main-cron-job";
import { RpcNodeUtils } from "../utils/rpc-node-utils";
import { ServerStateUtils } from "../utils/server-state-utils";

export const initScripts = async () => {
  await ServerStateUtils.initializeServerData();
  RpcNodeUtils.setFastestNode(await RpcNodeUtils.getFastestNode("l2"));
  MainCronJob.startJob();
};
