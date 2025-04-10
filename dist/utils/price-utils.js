"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_utils_1 = require("./logger.utils");
const rpc_node_utils_1 = require("./rpc-node-utils");
const getTokenPriceList = async (symbols) => {
    try {
        const response = await axios_1.default.post(`${rpc_node_utils_1.RpcNodeUtils.FASTESTRPCNODE.url}/contracts`, {
            jsonrpc: "2.0",
            method: "find",
            params: {
                contract: "market",
                table: "metrics",
                query: {
                    symbol: {
                        $in: symbols,
                    },
                },
                limit: 2,
            },
            id: 1,
        });
        if (response.status === 200) {
            return response.data.result;
        }
        return null;
    }
    catch (error) {
        logger_utils_1.Logger.error(`Error fetch tokens info ${error.message}`);
        return null;
    }
};
const getHivePrice = async () => {
    try {
        const response = await axios_1.default.get("https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd&include_24hr_change=true");
        if (response.status === 200) {
            return response.data;
        }
        return null;
    }
    catch (error) {
        logger_utils_1.Logger.error(`Error fetch hive price ${error.message}`);
        return null;
    }
};
exports.PriceUtils = {
    getTokenPriceList,
    getHivePrice,
};
