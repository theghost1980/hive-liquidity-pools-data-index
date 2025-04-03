"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquidityPoolUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const moment_1 = __importDefault(require("moment"));
const logger_utils_1 = require("./logger.utils");
let LASTHERPCNODEWORKING = "";
const HERPCAPINODES = [
    "https://enginerpc.com",
    "https://herpc.dtools.dev",
    "https://api.primersion.com",
    "https://herpc.kanibot.com",
    "https://herpc.actifit.io",
];
const getLastHERPCNodeChecked = () => LASTHERPCNODEWORKING;
const testHIVEAPIEP = () => {
    let workingHERPCNODEList = [];
    let notWorkingHERPCNodeList = [];
    const promises = HERPCAPINODES.map(async (n) => {
        try {
            const testResponse = await axios_1.default.post(`${n}/contracts`, {
                jsonrpc: "2.0",
                method: "find",
                params: {
                    contract: "marketpools",
                    table: "pools",
                    query: {},
                    limit: 1,
                },
                id: 1,
            });
            const currentTimestampInSeconds = (0, moment_1.default)().unix();
            if (testResponse.status === 200 && testResponse.data.result) {
                workingHERPCNODEList.push({
                    rpcUrl: n,
                    lastCheckTSSeconds: currentTimestampInSeconds,
                });
            }
            else {
                notWorkingHERPCNodeList.push({
                    rpcUrl: n,
                    lastCheckTSSeconds: currentTimestampInSeconds,
                });
            }
        }
        catch (error) {
            console.error(`Error processing node ${n}:`, error);
        }
    });
    return Promise.all(promises).then((result) => {
        return { workingHERPCNODEList, notWorkingHERPCNodeList };
    });
};
const fetchPoolData = async () => {
    const result = await testHIVEAPIEP();
    logger_utils_1.Logger.info(`HERPC nodes tested, lastWorking: ${result.workingHERPCNODEList[0].rpcUrl}, checkedTS: ${result.workingHERPCNODEList[0].lastCheckTSSeconds}`);
    LASTHERPCNODEWORKING = result.workingHERPCNODEList[0].rpcUrl;
    const response = await axios_1.default.post(`${LASTHERPCNODEWORKING}/contracts`, {
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
