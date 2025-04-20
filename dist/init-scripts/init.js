"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScripts = void 0;
const main_cron_job_1 = require("../cron/main-cron-job");
const rpc_node_utils_1 = require("../utils/rpc-node-utils");
const server_state_utils_1 = require("../utils/server-state-utils");
const initScripts = async () => {
    await server_state_utils_1.ServerStateUtils.initializeServerData();
    rpc_node_utils_1.RpcNodeUtils.setFastestNode(await rpc_node_utils_1.RpcNodeUtils.getFastestNode("l2"));
    main_cron_job_1.MainCronJob.startJob();
};
exports.initScripts = initScripts;
