"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityPoolUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_utils_1 = require("./logger.utils");
const rpc_node_utils_1 = require("./rpc-node-utils");
let LASTHERPCNODEWORKING = "";
const getLastHERPCNodeChecked = () => LASTHERPCNODEWORKING;
const fetchPoolData = async () => {
    const fastestNodeChecked = await rpc_node_utils_1.RpcNodeUtils.getFastestNode("l2");
    LASTHERPCNODEWORKING = fastestNodeChecked.node;
    logger_utils_1.Logger.info(`HERPC nodes tested, lastWorking: ${fastestNodeChecked.node}, speed: ${fastestNodeChecked.time}ms`);
    const response = await axios_1.default.post(`${fastestNodeChecked.node}/contracts`, {
        jsonrpc: "2.0",
        method: "find",
        params: {
            contract: "marketpools",
            table: "pools",
            query: {},
        },
        id: 1,
    });
    if (response.status === 200 && response.data.result) {
        logger_utils_1.Logger.info(`Liquidity Pools found: ${response.data.result.length}`);
        return response.data.result;
    }
    return null;
};
exports.LiquidityPoolUtils = {
    fetchPoolData,
    getLastHERPCNodeChecked,
};
