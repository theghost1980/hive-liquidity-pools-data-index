"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityPoolUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const fetchPoolData = async () => {
    const response = await axios_1.default.post(config_1.config.apiEndpoint, {
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
        console.log(`Liquidity Pools found: ${response.data.result.length}`);
        return response.data.result;
    }
    return null;
};
exports.LiquidityPoolUtils = {
    fetchPoolData,
};
