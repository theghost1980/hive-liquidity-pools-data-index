import { MainCronJob } from "../cron/main-cron-job";
import { checkIndexData } from "../utils/data-utils";
import { RpcNodeUtils } from "../utils/rpc-node-utils";
import { ServerStateUtils } from "../utils/server-state-utils";

export const initScripts = async () => {
  await checkIndexData();
  await ServerStateUtils.initializeServerData();
  RpcNodeUtils.setFastestNode(await RpcNodeUtils.getFastestNode("l2"));
  MainCronJob.startJob();
};
