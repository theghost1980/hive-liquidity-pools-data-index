"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScripts = void 0;
const main_cron_job_1 = require("../cron/main-cron-job");
const rpc_node_utils_1 = require("../utils/rpc-node-utils");
//TODO important:
//  - set the cronJob as an instance so you can declare it as it own module and:
//    - get next job time.
//    - get time until next job.
//  refer to: https://stackoverflow.com/questions/60828411/node-js-get-time-till-next-cron-job
const initScripts = async () => {
    rpc_node_utils_1.RpcNodeUtils.setFastestNode(await rpc_node_utils_1.RpcNodeUtils.getFastestNode("l2"));
    main_cron_job_1.MainCronJob.startJob();
};
exports.initScripts = initScripts;
