import axios from "axios";
import moment from "moment";
import { LiquidityPool } from "../interfaces/liquidity-pool.interface";
import { Logger } from "./logger.utils";

//TODO cleanup & REM
let LASTHERPCNODEWORKING = "";

const HERPCAPINODES = [
  "https://enginerpc.com",
  "https://herpc.dtools.dev",
  "https://api.primersion.com",
  "https://herpc.kanibot.com",
  "https://herpc.actifit.io",
];

interface HERPCNodeCheck {
  rpcUrl: string;
  lastCheckTSSeconds: number;
}

const getLastHERPCNodeChecked = () => LASTHERPCNODEWORKING;

const testHIVEAPIEP = (): Promise<{
  workingHERPCNODEList: HERPCNodeCheck[];
  notWorkingHERPCNodeList: HERPCNodeCheck[];
}> => {
  let workingHERPCNODEList: HERPCNodeCheck[] = [];
  let notWorkingHERPCNodeList: HERPCNodeCheck[] = [];

  const promises = HERPCAPINODES.map(async (n) => {
    try {
      const testResponse = await axios.post(`${n}/contracts`, {
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

      const currentTimestampInSeconds = moment().unix();

      if (testResponse.status === 200 && testResponse.data.result) {
        workingHERPCNODEList.push({
          rpcUrl: n,
          lastCheckTSSeconds: currentTimestampInSeconds,
        });
      } else {
        notWorkingHERPCNodeList.push({
          rpcUrl: n,
          lastCheckTSSeconds: currentTimestampInSeconds,
        });
      }
    } catch (error) {
      console.error(`Error processing node ${n}:`, error);
    }
  });

  return Promise.all(promises).then((result) => {
    return { workingHERPCNODEList, notWorkingHERPCNodeList };
  });
};

const fetchPoolData = async (): Promise<LiquidityPool[] | null> => {
  //TODO below start using the new RpcNodeUtils to get fastest
  const result = await testHIVEAPIEP();
  Logger.info(
    `HERPC nodes tested, lastWorking: ${result.workingHERPCNODEList[0].rpcUrl}, checkedTS: ${result.workingHERPCNODEList[0].lastCheckTSSeconds}`
  );
  LASTHERPCNODEWORKING = result.workingHERPCNODEList[0].rpcUrl;

  const response = await axios.post<any>(`${LASTHERPCNODEWORKING}/contracts`, {
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
    Logger.info(`Liquidity Pools found: ${response.data.result.length}`);
    return response.data.result;
  }
  return null;
};

export const LiquidityPoolUtils = {
  fetchPoolData,
  getLastHERPCNodeChecked,
};
